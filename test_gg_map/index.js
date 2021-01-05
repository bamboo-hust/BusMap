// import path from "./path.json"

// position we will use later
var lat = 10.770822;
var lon = 106.700233;

// initialize map
var map = L.map('mapDiv').setView([lat, lon], 12);

// set map tiles source
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
  maxZoom: 18,
}).addTo(map);

// add marker to the map
// marker = L.marker([lat, lon]).addTo(map);

// add popup to the marker
// marker.bindPopup("<b>ACME CO.</b><br />This st. 48<br />New York");

// var circle = L.circle([10.770822, 106.700233], {
//     color: 'red',
//     fillColor: '#f03',
//     fillOpacity: 0.5,
//     radius: 500

// }).addTo(map);

// var popup = L.popup();

// var marker1 = L.marker([0,0]);

// function onMapClick(e) {
//     console.log(e.latlng);
//     marker1.setLatLng(e.latlng);
//     marker1.addTo(map);
//     marker1.bindPopup("You clicked the map at " + marker1.getLatLng().toString());
// }

// map.on('click', onMapClick);


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

async function solve() {
  let foo = await httpGet("/routes/route_1.json");
  let now = JSON.parse(foo);

  let bar = now['forward'][0]['coordRoute'];
  console.log(bar[Object.keys(bar)[0]]);
  // var firstKey = Object.keys(myObject)[0];

  var latlngs = []

  bar[Object.keys(bar)[0]].forEach(element => {
    latlngs.push([element.Latitude, element.Longitude]);
    // drawMarker(element.Lat, element.Lng);
    // L.circle([element.Latitude, element.Longitude], {
    //       color: 'red',
    //       fillColor: '#f03',
    //       fillOpacity: 0.5,
    //       radius: 20
    //   }).addTo(map);
  });

  var polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);


  // now['forward'][1]['stops'].forEach(element => {
  //   // drawMarker(element.Lat, element.Lng);
  //   L.circle([element.Lat, element.Lng], {
  //         color: 'blue',
  //         fillColor: '#f03',
  //         fillOpacity: 0.5,
  //         radius: 20
  //     }).addTo(map);
  // });
  // console.log(now);

}


solve();