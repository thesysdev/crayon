import { NextRequest } from "next/server";

function buildingFeature(
  id: string,
  centerLon: number,
  centerLat: number,
  width: number,
  depth: number,
  height: number,
) {
  const halfW = width / 2;
  const halfD = depth / 2;
  return {
    type: "Feature",
    properties: { id, height },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [centerLon - halfW, centerLat - halfD],
          [centerLon + halfW, centerLat - halfD],
          [centerLon + halfW, centerLat + halfD],
          [centerLon - halfW, centerLat + halfD],
          [centerLon - halfW, centerLat - halfD],
        ],
      ],
    },
  };
}

function roadFeature(id: string, coordinates: number[][]) {
  return {
    type: "Feature",
    properties: { id },
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
}

export function GET(req: NextRequest) {
  const layer = req.nextUrl.searchParams.get("layer");

  if (layer === "roads") {
    return Response.json({
      type: "FeatureCollection",
      features: [
        roadFeature("market", [
          [-122.4218, 37.7734],
          [-122.4208, 37.7741],
          [-122.4194, 37.7749],
          [-122.4178, 37.7757],
        ]),
        roadFeature("mission", [
          [-122.4212, 37.7761],
          [-122.4201, 37.7752],
          [-122.4187, 37.7742],
          [-122.4175, 37.7733],
        ]),
        roadFeature("cross", [
          [-122.4205, 37.7729],
          [-122.4197, 37.7743],
          [-122.4189, 37.7758],
        ]),
      ],
    });
  }

  return Response.json({
    type: "FeatureCollection",
    features: [
      buildingFeature("a", -122.4205, 37.7741, 0.00035, 0.00025, 38),
      buildingFeature("b", -122.4198, 37.7745, 0.00028, 0.00042, 64),
      buildingFeature("c", -122.4191, 37.775, 0.00048, 0.0003, 92),
      buildingFeature("d", -122.4185, 37.7743, 0.00032, 0.00028, 44),
      buildingFeature("e", -122.4209, 37.7751, 0.00042, 0.00032, 72),
      buildingFeature("f", -122.4181, 37.7754, 0.00028, 0.00036, 56),
      buildingFeature("g", -122.4194, 37.7737, 0.00058, 0.00024, 48),
      buildingFeature("h", -122.4177, 37.7748, 0.00038, 0.00038, 84),
    ],
  });
}
