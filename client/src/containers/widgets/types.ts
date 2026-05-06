import type { Layer } from "@/types";

export interface WidgetCardBaseProps {
  id: string;
}

export interface WidgetCardProps extends WidgetCardBaseProps {
  title: string;
  description?: React.ReactNode;
  icon: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  layers?: Layer[];
  onDowloadButtonClick: () => void;
  onInfoButtonClick: () => void;
  onAddToMapButtonClick: () => void;
}
