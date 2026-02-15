import { parseAsBoolean, parseAsStringEnum, useQueryState } from "nuqs";

export enum MapStatus {
	default = "default",
	upload = "upload",
	analysis = "analysis",
}

export function useMapStatus() {
	const [mapStatus, setMapStatus] = useQueryState(
		"mapStatus",
		parseAsStringEnum(Object.values(MapStatus)).withDefault(MapStatus.default),
	);

	return { mapStatus, setMapStatus };
}

// TODO: Probably should be a shape object
export function useMapShape() {
	const [mapShape, setMapShape] = useQueryState(
		"mapShape",
		parseAsBoolean.withDefault(false),
	);

	return { mapShape, setMapShape };
}

export function useMapAnalysis() {
	const [datasets, setDatasets] = useQueryState(
		"datasets",
		parseAsBoolean.withDefault(false),
	);

	return { datasets, setDatasets };
}
