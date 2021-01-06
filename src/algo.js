const MAX_NUM_ROUTE = 3;
const INF = 1e9;
const MAX_PATH = 3;
const MAX_WALKING_DIST = 3000;
const MIN_BUS_DIST = 1000;
const WALK_V = 5 // kph
const BUS_V = 30 // kph
const NUM_SOLUTION = 7;

let stopCodeToID = {}
let stops;
let routes;
let routeNoToId = {}
let adj = []

async function init() {
    stops = await httpGet("/data/stops_new.json");
    stops = JSON.parse(stops);
    stops.sort((a, b) => {
        return a.Lat < b.Lat;
    });
    for (let i = 0; i < stops.length; i++) {
        stopCodeToID[stops[i]["Code"]] = i;
    }
    routes = await httpGet("/data/feasible_routes.json");
    routes = JSON.parse(routes);
    for (let i = 0; i < routes.length; i++) {
        routeNoToId[routes[i]["RouteNo"]] = i;
    }
}

class Node {
    constructor(dist = INF, walkingDist = INF, lastStop = -1, lastRoute = -1, timeTraverse = INF, numRoute = 0, routeDir = "") {
        this.dist = dist;
        this.walkingDist = walkingDist;
        this.lastStop = lastStop;
        this.lastRoute = lastRoute; // -1 means walking
        this.timeTraverse = timeTraverse;
        this.numRoute = numRoute;
        this.routeDir = routeDir;
    }
}

function getPoint(startingPoint, destination, ID) {
    if (ID < stops.length) return L.latLng(stops[ID].Lat, stops[ID].Lng);
    if (ID == stops.length) return startingPoint;
    return destination;
}

// (s, T), reverse order
function getStopsBetween(s, t, ID, type) {
    let l = -1;
    let minL = INF;
    let r = -1;
    let minR = INF;
    let ls = routes[ID][type]['stops'];
    let lPoint = L.latLng(stops[s]['Lat'], stops[s]['Lng']);
    let rPoint = L.latLng(stops[t]['Lat'], stops[t]['Lng']);
    for (let i = 0; i < ls.length; i++) {
        let curNode = L.latLng(ls[i]['Lat'], ls[i]['Lng']);
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
    if (l < r) {
        for (let i = l + 1; i < r; i++) {
            res.push(ls[i]);
        }
    } else console.log("wrong");
    res.reverse()
    return res;
}

function getCoordRouteBetween(s, t, ID, type) {
    let l = -1;
    let minL = INF;
    let r = -1;
    let minR = INF;
    let ls = routes[ID][type]['coordRoute'];
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
        console.log('wrong')
    }
    return res;
}

function getOptimalRoutes(startingPoint, destination, cmp) { // LatLng type
    let banedRoute = new Set();
    let allRoute = [];
    for (let it = 0; it < NUM_SOLUTION; it++) {
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
        dist[stops.length][0] = new Node(0, 0, -1, -1, 0, 0, "");
        while (true) {
            let u = -1;
            let num = -1;
            let opt = new Node();
            for (let i = 0; i < stops.length + 2; i++) {
                for (let j = 0; j <= MAX_NUM_ROUTE; j++) {
                    if (used[i][j] == 1) continue;
                    if (cmp(dist[i][j], opt)) {
                        opt = dist[i][j];
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
                if (u >= stops.length) {
                    for (let i = 0; i < stops.length + 2; i++) {
                        let nextPoint = getPoint(startingPoint, destination, i);
                        if (used[i][num] === 1) continue;
                        
                        let nextDist = curPoint.distanceTo(nextPoint);
                        if (nextDist > MAX_WALKING_DIST) continue;
                        let nextNode = new Node(curNode.dist + nextDist, 
                            curNode.walkingDist + nextDist, u, -1, curNode.timeTraverse + nextDist / WALK_V / 1000, num, "");
            
                        if (cmp(nextNode, dist[i][num])) {
                            dist[i][num] = nextNode;
                        }
                    }
                } else {
                    for (let i = Math.max(0, u - 300); i <= Math.min(stops.length - 1, u + 300); i++) {
                        let nextPoint = getPoint(startingPoint, destination, i);
                        if (used[i][num] === 1) continue;
                        
                        let nextDist = curPoint.distanceTo(nextPoint);
                        if (nextDist > MAX_WALKING_DIST) continue;
                        let nextNode = new Node(curNode.dist + nextDist, 
                            curNode.walkingDist + nextDist, u, -1, curNode.timeTraverse + nextDist / WALK_V / 1000, num, "");
            
                        if (cmp(nextNode, dist[i][num])) {
                            dist[i][num] = nextNode;
                        }
                    }
                    for (let i = stops.length; i < stops.length + 2; i++) {
                        let nextPoint = getPoint(startingPoint, destination, i);
                        if (used[i][num] === 1) continue;
                        
                        let nextDist = curPoint.distanceTo(nextPoint);
                        if (nextDist > MAX_WALKING_DIST) continue;
                        let nextNode = new Node(curNode.dist + nextDist, 
                            curNode.walkingDist + nextDist, u, -1, curNode.timeTraverse + nextDist / WALK_V / 1000, num, "");
            
                        if (cmp(nextNode, dist[i][num])) {
                            dist[i][num] = nextNode;
                        }
                    }
                }
            }
    
            // take a bus
            if (u < stops.length && num < MAX_NUM_ROUTE) {
                stops[u]["Routes"].forEach(element => {
                    element = element.split('_');
                    let type = element[1]
                    route = element[0];
                    let idRoute = routeNoToId[route];
                    if (banedRoute.has(idRoute)) return;
                    if (idRoute === undefined) return;
    
                    let idInRoute = -1;
                    let ls = routes[idRoute][type]['stops']
                    for (let i = 0; i < ls.length; i++) {
                        let stopCode = ls[i]["Name"].match(/\[(.*?)\]/)[1];
                        if (stopCode === stops[u]['Code']) {
                            idInRoute = i;
                            break;
                        }
                    }
    
                    if (idInRoute == -1) {
                        console.log("can't find stop", stops[u]['Code'], 'in route', element);
                        return;
                    }
    
                    for (let i = idInRoute + 1; i < ls.length; i++) {
                        let stopCode = ls[i]["Name"].match(/\[(.*?)\]/)[1];
                        let stopId = stopCodeToID[stopCode];
                        if (stopId === undefined) continue;
                        if (used[stopId][num + 1] === 1) continue;
                        let nextPoint = getPoint(startingPoint, destination, stopId);
                        let nextDist = curPoint.distanceTo(nextPoint);
                        // if (nextDist < MIN_BUS_DIST) continue;
    
                        let nextNode = new Node(curNode.dist + nextDist, curNode.walkingDist, u, 
                            idRoute, curNode.timeTraverse + nextDist / BUS_V / 1000, num + 1, type);
            
                        if (cmp(nextNode, dist[stopId][num + 1])) {
                            dist[stopId][num + 1] = nextNode;
                        }
                    }
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
    
        if (opt.dist >= INF) break;

        let res = {}
        let detail = [];
        let stopLs = [];
        let coordRoute = {};
        let curNode = stops.length + 1;
        let flag = false;
        while (curNode != stops.length) {
            let pre = dist[curNode][num].lastStop;
            // console.log(dist[curNode][num]);
            let now = {};
            let curPoint = getPoint(startingPoint, destination, curNode);
            let prePoint = getPoint(startingPoint, destination, pre);
            if (dist[curNode][num].lastRoute != -1) {
                if (!flag) {
                    flag = 1;
                    banedRoute.add(dist[curNode][num].lastRoute);
                }
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
            if (dist[curNode][num].lastRoute != -1) {
                now['Time'] = now['Distance'] / BUS_V / 1000;
            } else {
                now['Time'] = now['Distance'] / WALK_V / 1000;
            }
            detail.push(now);
    
            if (pre < stops.length) {
                if (dist[curNode][num].lastRoute != -1) {
                    stopLs = stopLs.concat(getStopsBetween(pre, curNode, dist[curNode][num].lastRoute,
                        dist[curNode][num].routeDir));
                }
                stopLs.push(stops[pre]);
            }
    
            if (dist[curNode][num].lastRoute != -1) {
                let keyNow = now['RouteNo'] + '_' + now['GetIn'] + '_' + now['GetOff'];
                let valNow = getCoordRouteBetween(pre, curNode, dist[curNode][num].lastRoute,
                    dist[curNode][num].routeDir);
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
        allRoute.push(res);
    }

    return allRoute;
}