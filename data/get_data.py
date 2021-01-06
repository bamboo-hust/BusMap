import requests
import json
import pylcs

stops_json = ""

# stops_request = requests.get("http://apicms.ebms.vn/businfo/getstopsinbounds/0/0/180/180")
# with open("stops.json", "w") as f:
#     stops_json = stops_request.text
#     f.write(stops_request.text)

with open("stops.json", "r") as f:
    stops_json = f.read()

stops = json.loads(stops_json)

def get_stop_id(stop_name):
    best = 0
    res = -1
    for stop in stops:
        cur = pylcs.lcs(stop["Name"], stop_name)
        if best < cur:
            best = cur
            res = stop["StopId"]
    return res

# print(stops_json)

# routes_by_id = {}

# for stop in stops:
#     routes_through_request = requests.get("http://apicms.ebms.vn/businfo/getroutesthroughstop/" + str(stop["StopId"]))
#     routes_through = json.loads(routes_through_request.text)
#     for route in routes_through:
#         if route["RouteId"] not in routes_by_id:
#             routes_by_id[route["RouteId"]] = route
#             with open("routes" + "_" + str(route["RouteId"]) + ".json", "w") as f:
#                 f.write(json.dumps(route))
#     print("done stop ", stop["StopId"])

routes = []
with open("routes.json") as f:
    routes = json.loads(f.read())

# print(routes)

# def get_path(start_stop, end_stop):
#     path_request = requests.get("http://apicms.ebms.vn/pathfinding/getpathbystop/" + str(start_stop) + "/" + str(end_stop) + "/1")
#     return json.loads(path_request.text)

# for route in routes:
#     stops_names = [each.strip() for each in route["RouteName"].split("-")]
#     print(stops_names)
#     start_stop = get_stop_id(stops_names[0])
#     end_stop = get_stop_id(stops_names[-1])
#     route["forward"] = get_path(start_stop, end_stop)
#     route["reverse"] = get_path(end_stop, start_stop)
#     with open("route_" + str(route["RouteId"]) + ".json", "w") as f:
#         f.write(json.dumps(route))
#     print("done route ", route["RouteName"])

# with open("routes_details.json", "w") as f:
#     f.write(json.dumps(routes))

with open("routesdetails.json", "r") as f:
    routes = json.loads(f.read())


def extract_path(route, path):
    for route_use in path["detail"]:
        if route_use["RouteNo"] == route["RouteNo"]:
            return True
    return False

feasible_routes = []
for route in routes:
    forward = None
    reverse = None
    for path in route["forward"]:
        if extract_path(route, path):
            forward = path
            break
    for path in route["reverse"]:
        if extract_path(route, path):
            reverse = path
            break
    if forward and reverse:
        route["forward"] = forward
        route["reverse"] = reverse
        feasible_routes += [route]

print(len(feasible_routes), "routes feasible")

with open("feasible_routes.json", "w") as f:
    f.write(json.dumps(feasible_routes))


routes_of = {}

for route in feasible_routes:
    for direction in ["forward", "reverse"]:
        for stop in route[direction]["stops"]:
            code = stop["Name"][str(stop["Name"]).find('[')+1:str(stop["Name"]).find(']')]
            if code not in routes_of:
                routes_of[code] = []
            routes_of[code] += [route["RouteNo"] + "_" + direction]

new_stops = []
for stop in stops:
    if stop["Code"] in routes_of:
        stop["Routes"] = routes_of[stop["Code"]]
        new_stops += [stop]

# print(new_stops)
with open("stops_new.json", "w") as f:
    f.write(json.dumps(new_stops))