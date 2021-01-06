const MAX_NUM_ROUTE = 3;
const INF = 1e9;
const MAX_PATH = 3;
const MAX_WALKING_DIST = 1000;
const MIN_BUS_DIST = 1000;

let stopCodeToID = {}
let stops;
let routes;
let routeNoToId = {}
let adj = []

async function init() {
    stops = await httpGet("/data/stops.json");
    stops = JSON.parse(stops);
    for (let i = 0; i < stops.length; i++) {
        stopCodeToID[stops[i]["Code"]] = i;
    }
    routes = await httpGet("/data/feasible_routes.json");
    routes = JSON.parse(routes);
    for (let i = 0; i < routes.length; i++) {
        // routeNoToId[routes[i]["RouteId"]] = i;
        routeNoToId[routes[i]["RouteNo"]] = i;
    }
    
}

class Node {
    constructor(dist = INF, walkingDist = INF, lastStop = -1, lastRoute = -1) {
        this.dist = dist;
        this.walkingDist = walkingDist;
        this.lastStop = lastStop;
        this.lastRoute = lastRoute; // -1 means walking
    }
}

function getPoint(startingPoint, destination, ID) {
    if (ID < stops.length) return L.latLng(stops[ID].Lat, stops[ID].Lng);
    if (ID == stops.length) return startingPoint;
    return destination;
}

function getDistBetweenBusStops(s, t, ID) {
    return 0;
}

// (s, T]
function getStopsBetween(s, t, ID) {
    let l = -1;
    let r = -1;
    let ls = routes[ID]['forward']['stops'];
    for (let i = 0; i < ls.length; i++) {
        let name = ls[i]['Name'].match(/\[(.*?)\]/)[1];
        if (name === stops[s]['Code']) {
            l = i;
        }
        if (name === stops[t]['Code']) {
            r = i;
        }
    }
    let res = []
    if (l < r) {
        for (let i = l + 1; i < r; i++) {
            res.push(ls[i]);
        }
    } else if (l > r) {
        for (let i = l - 1; i > r; i--) {
            res.push(ls[i]);
        }
    }
    return res;
}

function getCoordRouteBetween(s, t, ID) {
    let l = -1;
    let minL = INF;
    let r = -1;
    let minR = INF;
    let ls = routes[ID]['forward']['coordRoute'];
    var firstKey = Object.keys(ls)[0];
    ls = ls[firstKey];
    let lPoint = L.latLng(stops[s]['Lat'], stops[s]['Lng']);
    let rPoint = L.latLng(stops[t]['Lat'], stops[t]['Lng']);

    for (let i = 0; i < ls.length; i++) {
        let curNode = L.latLng(ls[i]['Latitude'], ls[i]['Longitude']);
        if (l == -1 || lPoint.distanceTo(curNode) < minL) {
            l = i;
            minL = lPoint.distanceTo(curNode);
        }
        if (r == -1 || rPoint.distanceTo(curNode) < minR) {
            r = i;
            minR = rPoint.distanceTo(curNode);
        }
    }
    let res = []
    if (l <= r) {
        for (let i = l; i <= r; i++) {
            res.push(ls[i]);
        }
    } else {
        for (let i = l; i >= r; i--) {
            res.push(ls[i]);
        }
    }
    return res;
}

function getOptimalRoutes(startingPoint, destination, cmp) { // LatLng type
    let dist = new Array(stops.length + 2);
    let used = new Array(stops.length + 2);
    for (let i = 0; i < dist.length; i++) {
        dist[i] = new Array(MAX_NUM_ROUTE + 1);
        used[i] = new Array(MAX_NUM_ROUTE + 1);
        for (let j = 0; j <= MAX_NUM_ROUTE; j++) {
            dist[i][j] = new Node();
            used[i][j] = 0;
        }
    }
    dist[stops.length][0] = new Node(0, 0);
    while (true) {
        let u = -1;
        let num = -1;
        let opt = new Node();
        for (let i = 0; i < stops.length + 2; i++) {
            for (let j = 0; j <= MAX_NUM_ROUTE; j++) {
                if (used[i][j] === 1) continue;
                if (cmp(dist[i][j], opt)) {
                    optDist = dist[i][j];
                    u = i;
                    num = j;
                }
            }
        }
        if (u === -1) break;
        used[u][num] = 1;
        
        let curPoint = getPoint(startingPoint, destination, u);
        let curNode = dist[u][num];

        // walk
        if (curNode.lastRoute != -1 || u == stops.length) {
            for (let i = 0; i < stops.length + 2; i++) {
                let nextPoint = getPoint(startingPoint, destination, i);
                if (used[i][num] === 1) continue;
                
                let nextDist = curPoint.distanceTo(nextPoint);
                if (nextDist > MAX_WALKING_DIST) continue;
                let nextNode = new Node(curNode.dist + nextDist, 
                    curNode.walkingDist + nextDist, u, -1);
    
                if (cmp(nextNode, dist[i][num])) {
                    dist[i][num] = nextNode;
                }
            }
        }

        // take a bus
        if (u < stops.length && num < MAX_NUM_ROUTE) {
            let routeU = stops[u]["Routes"].split(",").map(function(item) {
                return item.trim();
            });
            
            routeU.forEach(route => {
                let idRoute = routeNoToId[route];
                if (idRoute === undefined) return;
                routes[idRoute]['forward']['stops'].forEach(element => {
                    let stopCode = element["Name"].match(/\[(.*?)\]/)[1];
                    let stopId = stopCodeToID[stopCode];
                    if (used[stopId][num + 1] === 1) return;
                    let nextPoint = getPoint(startingPoint, destination, stopId);
                    let nextDist = curPoint.distanceTo(nextPoint);
                    if (nextDist < MIN_BUS_DIST) return;

                    let nextNode = new Node(curNode.dist + nextDist, 
                        curNode.walkingDist, u, idRoute);
        
                    if (cmp(nextNode, dist[stopId][num + 1])) {
                        dist[stopId][num + 1] = nextNode;
                    }
                });
            });
        }
    }

    let opt = new Node();
    let num = -1;
    for (let j = 0; j <= MAX_NUM_ROUTE; j++) {
        if (cmp(dist[stops.length + 1][j], opt)) {
            opt = dist[stops.length + 1][j];
            num = j;
        }
    }

    let res = {}
    let detail = [];
    let stopLs = [];
    let coordRoute = {};
    let curNode = stops.length + 1;
    while (curNode != stops.length) {
        let pre = dist[curNode][num].lastStop;
        let now = {};
        let curPoint = getPoint(startingPoint, destination, curNode);
        let prePoint = getPoint(startingPoint, destination, pre);
        if (dist[curNode][num].lastRoute != -1) {
            now['RouteNo'] = routes[dist[curNode][num].lastRoute]['RouteNo'];
        }
        if (curNode < stops.length) {
            now['GetOff'] = '[' + stops[curNode]['Code'].toString() + '] ' + stops[curNode]['Name'];
        }
        now['GetOffLat'] = curPoint.lat;
        now['GetOffLng'] = curPoint.lng;
        if (pre < stops.length) {
            now['GetIn'] = '[' + stops[pre]['Code'].toString() + '] ' + stops[pre]['Name'];
        }
        now['GetInLat'] = prePoint.lat;
        now['GetInLng'] = prePoint.lng;

        now['Distance'] = curPoint.distanceTo(prePoint);
        detail.push(now);

        if (pre < stops.length) {
            if (dist[curNode][num].lastRoute != -1) {
                stopLs = stopLs.concat(getStopsBetween(curNode, pre, dist[curNode][num].lastRoute));
            }
            stopLs.push(stops[pre]);
        }

        if (dist[curNode][num].lastRoute != -1) {
            let keyNow = now['RouteNo'] + '_' + now['GetIn'] + '_' + now['GetOff'];
            let valNow = getCoordRouteBetween(pre, curNode, dist[curNode][num].lastRoute);
            coordRoute[keyNow] = valNow;
        }

        if (dist[curNode][num].lastRoute != -1) {
            num--;
        }
        curNode = pre;
    }
    detail.reverse();
    stopLs.reverse();
    res['detail'] = detail;
    res['stops'] = stopLs;
    res['coordRoute'] = coordRoute;
    console.log(res);
    return res;
}