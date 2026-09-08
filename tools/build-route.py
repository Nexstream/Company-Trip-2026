#!/usr/bin/env python3
"""
build-route.py — generate route.js from real pedestrian routing.

Fetches walking-path geometry for the handful of legs in the trip route that
the group actually walks (as opposed to train/plane/ropeway hops, which stay
straight dashed lines because a road router would draw nonsense for them —
see WALK_LEGS below) and writes it out as route.js, a plain data file loaded
by index.html.

Re-run this whenever a SPOTS coordinate changes or a walking leg is added —
route.js is generated output, not something to hand-edit. It needs network
access to the public Valhalla instance at valhalla1.openstreetmap.de.

Usage:
    python3 tools/build-route.py

Stdlib only: urllib, json, math, time, re. No pip install.
"""
import json
import math
import re
import sys
import time
import urllib.request
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX_HTML = ROOT / "index.html"
OUT_FILE = ROOT / "route.js"

VALHALLA_URL = "https://valhalla1.openstreetmap.de/route"
SLEEP_BETWEEN_CALLS = 1.0  # seconds — this is a free public instance, don't hammer it

# Douglas-Peucker tolerance. ~3 metres; at Kansai's latitude (~35N) one degree
# of latitude is ~111km and one degree of longitude is ~91km, so 3e-5 degrees
# is roughly 3m either way — close enough for a decorative ribbon, not a nav
# track. Not worth a proper projection for this.
SIMPLIFY_TOLERANCE_DEG = 3e-5

# A routed leg more than 3x the straight-line haversine distance means a bad
# snap somewhere (e.g. Valhalla routed around the wrong side of a river).
MAX_ROUTED_OVER_STRAIGHT = 3.0

# Sanity box for "is this even in Japan" — catches a polyline5-vs-polyline6
# decode mistake dead in its tracks, since a wrong divisor puts points many
# degrees away.
JAPAN_BBOX = {"lat": (30.0, 46.0), "lng": (128.0, 146.0)}

# Above this, warn (not fail) about how far endpoint-pinning moved Valhalla's
# snapped point. See the pin-offset check in build() for why this is a
# warning rather than a fail() — the likely cause is a stale/off SPOTS
# coordinate, which this script has no business rewriting.
PIN_WARN_METERS = 50.0

# The eight legs the group actually walks, keyed by SPOTS keys. Chosen and
# confirmed by hand — do not add to or remove from this list without
# re-confirming with the trip route. In particular ropeway -> terrace must
# NEVER appear here: it's a cable car over a mountain, and footpath geometry
# for it would be a lie.
WALK_LEGS = [
    ("nishiki", "yasaka"),
    ("yasaka", "sannen"),
    ("sannen", "kiyomizu"),
    ("arimaH", "ropeway"),
    ("todaiji", "narapark"),
    ("osakaH", "ebisu"),
    ("tsuten", "kuromon"),
    ("kuromon", "nyasaka"),
]


def fail(msg):
    print(f"FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def load_spots():
    """Parse the SPOTS object literal out of index.html rather than
    hardcoding coordinates here, so this script stays correct if a stop's
    lat/lng ever moves in the app."""
    html = INDEX_HTML.read_text(encoding="utf-8")
    m = re.search(r"const SPOTS\s*=\s*\{(.*?)\n\};", html, re.S)
    if not m:
        fail("could not find `const SPOTS = {...};` block in index.html")
    body = m.group(1)
    # Each entry looks like:  key:  {n:"...", lat:35.0034, lng:135.7443, icon:"..."},
    entry_re = re.compile(
        r'(\w+)\s*:\s*\{[^{}]*?lat\s*:\s*(-?\d+(?:\.\d+)?)\s*,\s*lng\s*:\s*(-?\d+(?:\.\d+)?)'
    )
    spots = {}
    for km, lat, lng in entry_re.findall(body):
        spots[km] = (float(lat), float(lng))
    if not spots:
        fail("SPOTS block found but no entries parsed out of it")
    return spots


def load_order():
    """Parse the `order` array inside initMap() so we can confirm each walk
    leg names two genuinely consecutive stops — a typo'd key would otherwise
    silently degrade that leg back to a straight line with no error."""
    html = INDEX_HTML.read_text(encoding="utf-8")
    m = re.search(r'const order\s*=\s*\[(.*?)\];', html, re.S)
    if not m:
        fail("could not find `const order = [...];` in index.html")
    keys = re.findall(r'"(\w+)"', m.group(1))
    if not keys:
        fail("order array found but no keys parsed out of it")
    return keys


def consecutive_pairs(order):
    return set(zip(order, order[1:]))


def haversine_km(a, b):
    lat1, lng1 = a
    lat2, lng2 = b
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    x = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(x))


def decode_polyline6(encoded):
    """Standard Google encoded-polyline algorithm at precision 6 (divisor
    1e6). Valhalla's default `shape` is polyline6, NOT the more common
    polyline5 — decoding with the wrong divisor silently produces points
    that are off by roughly ten degrees, which is exactly what the Japan
    bounding-box check below exists to catch."""
    coords = []
    index = lat = lng = 0
    length = len(encoded)
    while index < length:
        for field in ("lat", "lng"):
            shift = result = 0
            while True:
                b = ord(encoded[index]) - 63
                index += 1
                result |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            delta = ~(result >> 1) if (result & 1) else (result >> 1)
            if field == "lat":
                lat += delta
            else:
                lng += delta
        coords.append((lat / 1e6, lng / 1e6))
    return coords


def fetch_leg_shape(a, b):
    # Compact separators (no spaces) and explicit quote() rather than
    # urlencode(): urlencode's default quote_plus renders a space as "+",
    # which this Valhalla instance's JSON parser chokes on with a 400
    # ("Failed to parse json request") — %20 or no spaces at all both work.
    body = json.dumps({
        "locations": [
            {"lat": a[0], "lon": a[1]},
            {"lat": b[0], "lon": b[1]},
        ],
        "costing": "pedestrian",
    }, separators=(",", ":"))
    url = VALHALLA_URL + "?json=" + urllib.parse.quote(body, safe="")
    req = urllib.request.Request(url, headers={"User-Agent": "kansai-quest-route-builder/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.load(resp)
    trip = data.get("trip")
    if not trip or trip.get("status") != 0:
        fail(f"Valhalla returned no usable route: {json.dumps(data)[:500]}")
    legs = trip["legs"]
    shape = legs[0]["shape"]
    summary = trip["summary"]
    return shape, summary["length"], summary["time"]


def perpendicular_distance(pt, line_start, line_end):
    """Distance from pt to the SEGMENT line_start->line_end, not the infinite
    line through them. Canonical Douglas-Peucker measures to the segment;
    an unclamped t measures to the infinite line instead, which would let an
    out-and-back detour (one that returns on roughly the same bearing it
    left on) collapse to near-zero distance and get simplified away
    entirely. Clamping t to [0, 1] pins the projection to the segment's
    endpoints when the true projection would fall outside it."""
    (x, y), (x1, y1), (x2, y2) = pt, line_start, line_end
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(x - x1, y - y1)
    t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    px, py = x1 + t * dx, y1 + t * dy
    return math.hypot(x - px, y - py)


def douglas_peucker(points, tolerance):
    if len(points) < 3:
        return points[:]
    dmax, index = 0.0, 0
    for i in range(1, len(points) - 1):
        d = perpendicular_distance(points[i], points[0], points[-1])
        if d > dmax:
            dmax, index = d, i
    if dmax > tolerance:
        left = douglas_peucker(points[: index + 1], tolerance)
        right = douglas_peucker(points[index:], tolerance)
        return left[:-1] + right
    return [points[0], points[-1]]


def in_japan(pt):
    lat, lng = pt
    return (JAPAN_BBOX["lat"][0] <= lat <= JAPAN_BBOX["lat"][1]
            and JAPAN_BBOX["lng"][0] <= lng <= JAPAN_BBOX["lng"][1])


def build():
    spots = load_spots()
    order = load_order()
    valid_pairs = consecutive_pairs(order)

    for frm, to in WALK_LEGS:
        if frm not in spots:
            fail(f"leg {frm}->{to}: '{frm}' is not a key in SPOTS")
        if to not in spots:
            fail(f"leg {frm}->{to}: '{to}' is not a key in SPOTS")
        if (frm, to) not in valid_pairs:
            fail(f"leg {frm}->{to}: these two stops are not consecutive in "
                 f"the route `order` array — check for a typo")

    print(f"Loaded {len(spots)} spots and a {len(order)}-stop route order from index.html")
    print(f"Building {len(WALK_LEGS)} walking legs via Valhalla pedestrian routing\n")

    route = {}
    summary_rows = []

    for i, (frm, to) in enumerate(WALK_LEGS):
        a, b = spots[frm], spots[to]
        straight_km = haversine_km(a, b)

        shape, routed_km, routed_s = fetch_leg_shape(a, b)

        if routed_km > straight_km * MAX_ROUTED_OVER_STRAIGHT:
            fail(f"leg {frm}->{to}: routed distance {routed_km:.2f}km is more "
                 f"than {MAX_ROUTED_OVER_STRAIGHT}x the straight-line "
                 f"{straight_km:.2f}km — looks like a bad snap")

        pts = decode_polyline6(shape)
        for p in pts:
            if not in_japan(p):
                fail(f"leg {frm}->{to}: decoded point {p} is outside the Japan "
                     f"bounding box — likely a polyline5/6 divisor mistake")

        raw_count = len(pts)
        # Pin the endpoints to the exact SPOTS coordinates. Valhalla snaps to
        # the nearest walkable way, which can sit tens of metres off the
        # marker; without this the ribbon visibly detaches from the landmark
        # pins and from the straight segments either side of it. Capture the
        # pre-pin points first so we can measure how far this pin moved
        # things — none of the three checks above catch a bad snap here: it
        # doesn't inflate routed-vs-straight, and it's nowhere near coarse
        # enough to trip the Japan bbox check.
        snapped_first, snapped_last = pts[0], pts[-1]
        pts[0] = a
        pts[-1] = b

        # This is a WARNING, not a fail(): a large offset almost always means
        # the SPOTS coordinate itself is off (e.g. arimaH>ropeway, where the
        # routed endpoint lands ~264m from SPOTS.ropeway and looks like the
        # actual station) rather than something this script did wrong or can
        # fix. Moving a SPOTS coordinate is out of scope for a route-geometry
        # generator — ropeway's also drives the race game's 150m check-in
        # radius — so failing the build over it would just block regeneration
        # on a data problem elsewhere. Printing it loudly means it surfaces
        # on every run instead of getting silently baked into the ribbon.
        start_off_m = haversine_km(snapped_first, a) * 1000
        end_off_m = haversine_km(snapped_last, b) * 1000
        if start_off_m > PIN_WARN_METERS:
            print(f"  WARNING: leg {frm}->{to}: pinning the start moved it "
                  f"{start_off_m:.0f}m (Valhalla snapped to {snapped_first}, "
                  f"pinned to SPOTS['{frm}']={a}) — SPOTS['{frm}'] is the "
                  f"likely culprit, not the route geometry")
        if end_off_m > PIN_WARN_METERS:
            print(f"  WARNING: leg {frm}->{to}: pinning the end moved it "
                  f"{end_off_m:.0f}m (Valhalla snapped to {snapped_last}, "
                  f"pinned to SPOTS['{to}']={b}) — SPOTS['{to}'] is the "
                  f"likely culprit, not the route geometry")

        simplified = douglas_peucker(pts, SIMPLIFY_TOLERANCE_DEG)
        simplified = [(round(lat, 5), round(lng, 5)) for lat, lng in simplified]

        route[f"{frm}>{to}"] = simplified
        summary_rows.append(
            f"  {frm:>9} -> {to:<9}  straight {straight_km:5.2f}km  routed {routed_km:5.2f}km "
            f"({routed_s:5.0f}s)  points {raw_count:4d} -> {len(simplified):3d}"
        )
        print(summary_rows[-1])

        if i < len(WALK_LEGS) - 1:
            time.sleep(SLEEP_BETWEEN_CALLS)

    write_route_js(route)
    print(f"\nWrote {OUT_FILE.relative_to(ROOT)} with {len(route)} legs")


def write_route_js(route):
    lines = []
    lines.append("/* Generated by tools/build-route.py — do not hand-edit; re-run the script instead.")
    lines.append("   ")
    lines.append("   Pedestrian-path geometry for the legs of the trip route that the group")
    lines.append("   actually walks, fetched from a public Valhalla routing instance")
    lines.append("   (https://valhalla1.openstreetmap.de) over OpenStreetMap data. Every other")
    lines.append("   consecutive pair in the route stays a straight dashed line in index.html —")
    lines.append("   most of the route is train, plane or (for Rokko) ropeway, and a road router")
    lines.append("   would draw nonsense geometry for those, so only genuine walking legs are")
    lines.append("   listed in tools/build-route.py's WALK_LEGS and present as keys here.")
    lines.append("   ")
    lines.append("   Map data (c) OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright")
    lines.append("   */")
    lines.append("const ROUTE_WALK = {")
    for key, pts in route.items():
        pts_str = ",".join(f"[{lat},{lng}]" for lat, lng in pts)
        lines.append(f'  "{key}": [{pts_str}],')
    lines.append("};")
    OUT_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    build()
