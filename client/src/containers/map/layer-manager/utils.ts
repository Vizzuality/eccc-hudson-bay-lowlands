export const MASK_LAYER_ID = "default-mask-layer";

export const getLayerAboveMask = (
  styleLayerIds: string[],
  ownLayerIds: string[],
): string | null | undefined => {
  const ids = styleLayerIds.filter((id) => !ownLayerIds.includes(id));
  const maskIndex = ids.indexOf(MASK_LAYER_ID);
  return maskIndex === -1 ? null : ids[maskIndex + 1];
};

export const pinAboveMaskLayers = (
  topFirstIds: string[],
  aboveMaskIds: Set<string>,
): string[] => [
  ...topFirstIds.filter((id) => aboveMaskIds.has(id)),
  ...topFirstIds.filter((id) => !aboveMaskIds.has(id)),
];

const chainLayers = (ids: string[], firstBeforeId: string | undefined) =>
  ids.map((id, i) => ({
    id,
    beforeId: i === 0 ? firstBeforeId : `${ids[i - 1]}-layer`,
  }));

export const getLayerPlacements = (
  topFirstIds: string[],
  aboveMaskIds: Set<string>,
  baseLayer: string | undefined,
  maskAnchor: string | null | undefined,
): { id: string; beforeId: string | undefined }[] => {
  if (maskAnchor === null) {
    return chainLayers(
      pinAboveMaskLayers(topFirstIds, aboveMaskIds),
      baseLayer,
    );
  }

  return [
    ...chainLayers(
      topFirstIds.filter((id) => aboveMaskIds.has(id)),
      maskAnchor,
    ),
    ...chainLayers(
      topFirstIds.filter((id) => !aboveMaskIds.has(id)),
      baseLayer,
    ),
  ];
};
