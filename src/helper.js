async function httpGet(filePath) {
    let res = await fetch(filePath)
    return res.text();
}

async function getAllPath() {
  let foo = await httpGet("/data/feasible_routes.json");
  let now = JSON.parse(foo);
  // let listResults = []
  return [now[2]['forward'], now[3]['forward'], now[0]['forward'], now[1]['forward']];

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