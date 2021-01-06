// import path from "./path.json"

// position we will use later
var greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

var COLOR = ['red', 'green', 'yellow'];
var ARROW_CHAR = " \u{21e8} ";
var MAN_CHAR = "\u{1f6b6}";
var BUS_CHAR = "\u{1f68c}";

var lat = 10.770822;
var lon = 106.700233;

// initialize map
var map = L.map('mapDiv').setView([lat, lon], 12);

// set map tiles source
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
  maxZoom: 18,
}).addTo(map);

var all_routes = [];

var findSrc = false;
var findDes = false;

function chooseSrc(e) {
  findSrc = true;
  findDes = false;
}

function chooseDes(e) {
  findDes = true;
  findSrc = false;
}

var markerSrc = L.marker([0,0]);
var markerDes = L.marker([0,0], {icon : greenIcon});

function onMapClick(e) {
  if (findSrc) {
    console.log(e.latlng);
    markerSrc.setLatLng(e.latlng);
    markerSrc.addTo(map);
    markerSrc.bindPopup("You clicked the map at " + markerSrc.getLatLng().toString());
  }
  if (findDes) {
    console.log(e.latlng);
    markerDes.setLatLng(e.latlng);
    markerDes.addTo(map);
    markerDes.bindPopup("You clicked the map at " + markerDes.getLatLng().toString()); 
  }
}

function showLine(pointA, pointB) {
  var pointList = [pointA, pointB];

  var firstpolyline = new L.Polyline(pointList, {
      color: 'black',
      weight: 3,
      opacity: 0.5,
      smoothFactor: 1
  });
  firstpolyline.addTo(map);
}

function clearMap() {
    for(i in map._layers) {
        if(map._layers[i]._path != undefined) {
            try {
                map.removeLayer(map._layers[i]);
            }
            catch(e) {
                console.log("problem with " + e + map._layers[i]);
            }
        }
    }
}


function showRoute(routes) {
  clearMap();
  console.log(routes);
  let color_index = 0;
  let bars = routes['coordRoute'];

  for (let j in bars) {
    var latlngs = []

    bars[j].forEach(element => {
      latlngs.push([element.Latitude, element.Longitude]);
    });

    var polyline = L.polyline(latlngs, {color: COLOR[color_index]}).addTo(map);
    color_index = (color_index + 1) % COLOR.length;
  }
  let details = routes['detail'];
  for (let j in details) {
    detail = details[j];
    var pointA = new L.LatLng(detail["GetInLat"], detail["GetInLng"]);
    var pointB = new L.LatLng(detail["GetOffLat"], detail["GetOffLng"]);
    if (j == 0) {
      showLine(markerSrc.getLatLng(), pointA);
    }
    if (detail['RouteNo'] == null) {
      showLine(pointA, pointB)
    }
    if ((Number(j) + 1 == details.length)) {
      showLine(pointB, markerDes.getLatLng()); 
    }
  }

  let stops = routes['stops'];
  for (stop of stops) {
    var circle = L.circle([stop['Lat'], stop['Lng']], {
      color: 'black',
      fillColor: 'white',
      fillOpacity: 0.5,
      radius: 10
    }).addTo(map);
  }
}


function describeRoute(routes) {
  let describe = document.getElementById("describe-route");
  let content = "";
  let total_time = 0;
  let details = routes['detail'];
  for (let j in details) {
    detail = details[j];
    if (detail["RouteNo"] == null) {
      let time = Math.ceil(detail["Time"] * 60);
      total_time += time;
    } else {
      let time = Math.ceil(detail["Time"] * 60);
      total_time += time;
    }
  }

  var br = document.createElement("br");
  content += total_time + " phút : " + br.outerHTML;
  content += "Điểm xuất phát" + br.outerHTML;

  

  for (let j in details) {
    detail = details[j];
    if (detail["RouteNo"] == null) {
      let time = Math.ceil(detail["Time"] * 60);
      content += MAN_CHAR + "Đi bộ " + time + " phút" + ARROW_CHAR;
      if (detail["GetOff"] != null) {
        content += detail["GetOff"] + br.outerHTML;
      }
    } else {
      let time = Math.ceil(detail["Time"] * 60);
      content += BUS_CHAR + "Đi xe " + time + " phút" + ARROW_CHAR;
      if (detail["GetOff"] != null) {
        content += detail["GetOff"] + br.outerHTML;
      }
    }
  }
  content += " Điểm đến";
  describe.innerHTML = content;
}

function clickRoute(id) {
  showRoute(all_routes[id]);
  describeRoute(all_routes[id]);
}

async function findPath(e) {
  // find shortest path here
  clearMap();
  document.getElementById("header").innerHTML = "Loading...";
  findSrc = findDes = false;
  document.getElementById("list-result").innerHTML = "";
  document.getElementById("describe-route").innerHTML = "";
  await init();
  routes = getOptimalRoutes(markerSrc.getLatLng(), markerDes.getLatLng(), (u, v) => {
      return u.timeTraverse < v.timeTraverse;
  });
  console.log(routes);
  document.getElementById("header").innerHTML = "Danh sách các chuyến xe : ";
  all_routes = routes;
  let listResult = document.getElementById("list-result");


  // let responses = ["abc", "xyz", MAN_CHAR, BUS_CHAR, "\u{21e8}"];
  listResult.innerHTML = "";
  for (let i in all_routes) {
    let routes = all_routes[i];
    var node = document.createElement("li");
    node.setAttribute("class", "list-group-item");
    node.setAttribute("id", i)
    node.setAttribute("onClick", "clickRoute(this.id)")
    let displayString = "";

    let total_time = 0;
    let details = routes['detail'];
    for (let j in details) {
      detail = details[j];
      if (detail["RouteNo"] == null) {
        let time = Math.ceil(detail["Time"] * 60);
        total_time += time;
      } else {
        let time = Math.ceil(detail["Time"] * 60);
        total_time += time;
      }
    }

    displayString += total_time + " phút : ";

    for (detail of details) {
      if (detail["RouteNo"] == null) {
        let time = Math.ceil(detail["Time"] * 60);
        var sub = document.createElement("sub");
        sub.innerHTML = time + 'p';
        displayString += MAN_CHAR + sub.outerHTML + ARROW_CHAR;
      } else {
        var sub = document.createElement("sub");
        sub.innerHTML = detail["RouteNo"];
        displayString += BUS_CHAR + sub.outerHTML + ARROW_CHAR;
      }
    }
    node.innerHTML = displayString.slice(0, -3);
    listResult.appendChild(node);
  }
}


// findPath(null)

map.on('click', onMapClick);


// var circle = L.circle([lat, lon], {
//     color: 'red',
//     fillColor: '#f03',
//     fillOpacity: 0.5,
//     radius: 500
// }).addTo(map);

// circle.bindPopup("I am a circle.");

function drawMarker(lat, lon) {
  marker = L.marker([lat, lon]).addTo(map);
}