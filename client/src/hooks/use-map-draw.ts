import MapboxDraw from "@mapbox/mapbox-gl-draw";
import type { Feature } from "geojson";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  type CircleLayerSpecification,
  type FillLayerSpecification,
  type LineLayerSpecification,
  useMap,
} from "react-map-gl/mapbox";

import type { convertFilesToGeojson } from "@/lib/utils/geometry-upload";

export interface UseMapboxDrawProps {
  /** When false, drawing is disabled (no polygon vertices can be added). */
  enabled?: boolean;
  geometry?: Awaited<ReturnType<typeof convertFilesToGeojson>>;
  onCreate?: (evt: { features: Feature[] }) => void;
  onUpdate?: (evt: { features: Feature[]; action: string }) => void;
  onClick?: () => void;
  onDelete?: (evt: { features: Feature[] }) => void;
  /** Called when the user clicks the map to draw while in polygon draw mode (first vertex and onward). */
  onDrawingStart?: () => void;
}

// See https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/EXAMPLES.md
// Shape tokens (Mapbox GL layers cannot use CSS box-shadow; inset glow is approximated with line-blur + offset).
const SHAPE_FILL = "rgba(16, 185, 129, 0.10)";
const SHAPE_STROKE = "rgb(16, 185, 129)";
const SHAPE_STROKE_WIDTH = 2;
const SHAPE_INSET_LIGHT = "rgba(255, 255, 255, 0.25)";
/** Blur radius approximating box-shadow: 0 4px 5.3px inset */
const SHAPE_INSET_BLUR = 2.65;

export const DRAW_STYLES: (
  | Omit<FillLayerSpecification, "source">
  | Omit<LineLayerSpecification, "source">
  | Omit<CircleLayerSpecification, "source">
)[] = [
  {
    id: "gl-draw-line",
    type: "line",
    filter: ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": SHAPE_STROKE,
      "line-width": SHAPE_STROKE_WIDTH,
    },
  },
  {
    id: "gl-draw-polygon",
    type: "fill",
    filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
    paint: {
      "fill-color": [
        "case",
        ["==", ["get", "active"], "true"],
        SHAPE_FILL,
        "rgba(0, 0, 0, 0)",
      ],
      "fill-outline-color": "rgba(0, 0, 0, 0)",
    },
  },
  {
    id: "gl-draw-line-active-inset",
    type: "line",
    filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": SHAPE_INSET_LIGHT,
      "line-width": SHAPE_STROKE_WIDTH,
      "line-blur": SHAPE_INSET_BLUR,
      "line-offset": -1,
    },
  },
  {
    id: "gl-draw-line-active",
    type: "line",
    filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": SHAPE_STROKE,
      "line-width": SHAPE_STROKE_WIDTH,
    },
  },
  {
    id: "gl-draw-midpoints",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
    paint: {
      "circle-radius": 4,
      "circle-color": "#000",
    },
  },
  {
    id: "gl-draw-midpoints-inner",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
    paint: {
      "circle-radius": 2.5,
      "circle-color": "#fff",
    },
  },
  {
    id: "gl-draw-points",
    type: "circle",
    filter: [
      "all",
      ["!=", "mode", "static"],
      ["!=", "mode", "simple_select"],
      ["!=", "meta", "midpoint"],
    ],
    paint: {
      "circle-radius": 6,
      "circle-color": "#000",
    },
  },
  {
    id: "gl-draw-points-inner",
    type: "circle",
    filter: [
      "all",
      ["!=", "mode", "static"],
      ["!=", "mode", "simple_select"],
      ["!=", "meta", "midpoint"],
    ],
    paint: {
      "circle-radius": 4,
      "circle-color": "#fff",
    },
  },
];

const NOOP = () => {};

export default function useMapDraw(props?: UseMapboxDrawProps) {
  const { default: map } = useMap();
  const onDrawingStartRef = useRef(props?.onDrawingStart);
  onDrawingStartRef.current = props?.onDrawingStart;
  const hadGeometryRef = useRef(false);
  const enabled = props?.enabled ?? true;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const draw = useMemo(
    () =>
      new MapboxDraw({
        defaultMode: "draw_polygon",
        displayControlsDefault: false,
        styles: DRAW_STYLES,
      }),
    [],
  );

  const redraw = useCallback(() => {
    if (!enabledRef.current) return;
    draw.deleteAll();
    draw.changeMode("draw_polygon");
  }, [draw]);

  // Connect Mapbox Draw to the map
  // NOTE: We could rely on `useControl` from react-map-gl if it could read the context from outside
  // the map tree
  // `props` is purposefully missing in the dependency array below to match the react-map-gl's
  // behavior: https://github.com/visgl/react-map-gl/blob/c7112cf50d6985e8427d6b187d23a4d957791bb7/modules/react-mapbox/src/components/use-control.ts#L59
  // biome-ignore lint/correctness/useExhaustiveDependencies: match react-map-gl useControl (stable handler refs)
  useEffect(() => {
    if (!map) {
      return;
    }

    if (!map.hasControl(draw)) {
      map.addControl(draw);
      map.on("draw.create", props?.onCreate ?? NOOP);
      map.on("draw.click", props?.onClick ?? NOOP);
      map.on("draw.update", props?.onUpdate ?? NOOP);
      map.on("draw.delete", props?.onDelete ?? NOOP);
    }

    if (!enabledRef.current && draw.getMode() !== "simple_select") {
      draw.changeMode("simple_select");
    }

    return () => {
      if (!map) {
        return;
      }

      map.off("draw.create", props?.onCreate ?? NOOP);
      map.off("draw.click", props?.onClick ?? NOOP);
      map.off("draw.update", props?.onUpdate ?? NOOP);
      map.off("draw.delete", props?.onDelete ?? NOOP);

      if (map.hasControl(draw)) {
        map.removeControl(draw);
      }
    };
  }, [map, draw]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const onMapClick = () => {
      if (!enabledRef.current) return;
      if (draw.getMode() === "draw_polygon") {
        onDrawingStartRef.current?.();
      }
    };

    map.on("click", onMapClick);

    return () => {
      map.off("click", onMapClick);
    };
  }, [map, draw]);

  useEffect(() => {
    if (!enabled) {
      if (draw.getMode() !== "simple_select") {
        draw.changeMode("simple_select");
      }
      return;
    }

    // If enabled and no geometry is loaded, restore drawing mode.
    if (!props?.geometry && draw.getMode() !== "draw_polygon") {
      draw.changeMode("draw_polygon");
    }
  }, [draw, props?.geometry, enabled]);

  // Pass the geometry to Mapbox Draw when it has changed
  useEffect(() => {
    if (!draw) return;

    if (props?.geometry) {
      hadGeometryRef.current = true;
      const geometryWithId = { ...props.geometry, id: "geometry" };
      draw.deleteAll();
      draw.add(geometryWithId);
      draw.changeMode("direct_select", { featureId: `${geometryWithId.id}` });
      return;
    }

    // Only clear when geometry was previously set and is now cleared.
    // This avoids interfering with the "empty" initial state while the user is drawing.
    if (hadGeometryRef.current) {
      hadGeometryRef.current = false;
      draw.deleteAll();
    }
  }, [draw, props?.geometry]);

  return { redraw };
}
