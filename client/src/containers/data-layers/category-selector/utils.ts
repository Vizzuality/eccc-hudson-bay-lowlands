import { HandHeartIcon, LayersIcon, LeafIcon, PickaxeIcon } from "lucide-react";

const CATEGORY_ICON_MAP = {
  0: LayersIcon,
  1: LeafIcon,
  2: HandHeartIcon,
  3: PickaxeIcon,
} as const;

type CategoryIconId = keyof typeof CATEGORY_ICON_MAP;

type CategoryIconComponent = (typeof CATEGORY_ICON_MAP)[CategoryIconId];

function hasCategoryIcon(id: number): id is CategoryIconId {
  return id in CATEGORY_ICON_MAP;
}

export function getCategoryIcon(id: number): CategoryIconComponent | null {
  return hasCategoryIcon(id) ? CATEGORY_ICON_MAP[id] : null;
}
