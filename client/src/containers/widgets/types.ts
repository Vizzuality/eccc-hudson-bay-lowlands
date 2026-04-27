import type { WidgetLayer } from "@/containers/analysis/types";

export interface WidgetCardBaseProps {
  id: string;
}

export interface WidgetCardProps extends WidgetCardBaseProps {
  title: string;
  description?: React.ReactNode;
  icon: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  layers?: WidgetLayer[];
  onDowloadButtonClick: () => void;
  onInfoButtonClick: () => void;
  onAddToMapButtonClick: () => void;
}
