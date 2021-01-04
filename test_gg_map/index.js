// position we will use later
var lat = 10.770822;
var lon = 106.700233;

// initialize map
map = L.map('mapDiv').setView([lat, lon], 12);

// set map tiles source
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
  maxZoom: 18,
}).addTo(map);

// add marker to the map
marker = L.marker([lat, lon]).addTo(map);

// add popup to the marker
marker.bindPopup("<b>ACME CO.</b><br />This st. 48<br />New York");

// var circle = L.circle([10.770822, 106.700233], {
//     color: 'red',
//     fillColor: '#f03',
//     fillOpacity: 0.5,
//     radius: 500

// }).addTo(map);

var popup = L.popup();

var marker1 = L.marker([0,0]);

function onMapClick(e) {
    console.log(e.latlng);
    marker1.setLatLng(e.latlng);
    marker1.addTo(map);
    marker1.bindPopup("You clicked the map at " + marker1.getLatLng().toString());
}

map.on('click', onMapClick);


// var circle = L.circle([lat, lon], {
//     color: 'red',
//     fillColor: '#f03',
//     fillOpacity: 0.5,
//     radius: 500
// }).addTo(map);

// circle.bindPopup("I am a circle.");

console.log(httpGet("http://apicms.ebms.vn/businfo/getstopsinbounds/106.68340787887573/10.768808774874774/106.72228231430054/10.786346643944889"))