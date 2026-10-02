export const MASK_LAYER_ID = "default-mask-layer";

export const getLayerAboveMask = (
  styleLayerIds: string[],
  ownLayerIds: string[],
): string | null | undefined => {
  const ids = styleLayerIds.filter((id) => !ownLayerIds.includes(id));
  const maskIndex = ids.indexOf(MASK_LAYER_ID);
  return maskIndex === -1 ? null : ids[maskIndex + 1];
};
