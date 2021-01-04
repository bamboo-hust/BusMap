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

def get_path(start_stop, end_stop):
    path_request = requests.get("http://apicms.ebms.vn/pathfinding/getpathbystop/" + str(start_stop) + "/" + str(end_stop) + "/1")
    return json.loads(path_request.text)

for route in routes:
    stops_names = [each.strip() for each in route["RouteName"].split("-")]
    print(stops_names)
    start_stop = get_stop_id(stops_names[0])
    end_stop = get_stop_id(stops_names[-1])
    route["forward"] = get_path(start_stop, end_stop)
    route["reverse"] = get_path(end_stop, start_stop)
    with open("route_" + str(route["RouteId"]) + ".json", "w") as f:
        f.write(json.dumps(route))
    print("done route ", route["RouteName"])

with open("routes_details.json") as f:
    f.write(json.dumps(routes))
