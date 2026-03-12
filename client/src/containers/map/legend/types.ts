import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListeners } from "@dnd-kit/core/dist/hooks/utilities";
import type { LucideIcon } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";

type Sortable = {
  enabled: boolean;
  handle?: boolean;
  handleIcon?: React.ReactNode;
};

type OnChangeOrder = (id: string[]) => void;
type OnChangeOpacity = (opacity: number) => void;
type OnChangeVisibility = (visibility: boolean) => void;
type OnChangeColumn = (column: string) => void;
type OnRemove = (id: string) => void;

export type Settings = Record<string, unknown> & {
  opacity?: number;
  visibility?: boolean;
};

export type SettingsManager = {
  opacity?: boolean;
  visibility?: boolean;
  info?: boolean;
  remove?: boolean;
};

export type LegendItemEvents = {
  onChangeOpacity?: OnChangeOpacity;
  onChangeVisibility?: OnChangeVisibility;
  onChangeColumn?: OnChangeColumn;
  onRemove?: OnRemove;
};
/*
 * Legend
 */
export interface MapLegendProps extends PropsWithChildren {
  className?: string;
  sortable: Sortable;
  onChangeOrder?: OnChangeOrder;
}

export interface MapLegendItemProps extends LegendItemEvents {
  id: string;
  title?: string;
  className?: string;

  // components
  InfoContent?: ReactNode;

  // sortable
  sortable: Sortable;
  listeners?: SyntheticListeners;
  attributes?: DraggableAttributes;

  // settings
  // I extends Dataset['id'] so you can get the correct setting depending on the dataset id
  settings?: Settings;
  settingsManager?: SettingsManager;
}

export interface LegendItemToolbarProps extends LegendItemEvents {
  id: string;
  className?: string;
  // components
  InfoContent?: ReactNode;
  // settings
  settings?: Settings;
  settingsManager?: SettingsManager;
}

export interface LegendItemButtonProps {
  Icon: LucideIcon;
  selected?: boolean;
  className?: string;
  value?: number;
}

/*
 * Sortable
 */
export interface SortableListProps extends PropsWithChildren {
  className?: string;
  sortable: Sortable;
  onChangeOrder: OnChangeOrder;
}

export interface SortableItemProps extends PropsWithChildren {
  id: string;
  sortable: Sortable;
}

export interface LegendTypeProps {
  className?: string;
  items: Array<{
    color: string;
    label?: string;
    value?: string | number;
  }>;
}

export interface LegendMatrixIntersectionsProps {
  intersections: Array<{
    id: string;
    color: string;
  }>;
}
