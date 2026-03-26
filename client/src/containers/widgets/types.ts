export interface WidgetCardBaseProps {
  id: string;
}

export interface WidgetCardProps extends WidgetCardBaseProps {
  title: string;
  description?: React.ReactNode;
  icon: React.ReactNode;
  children?: React.ReactNode;
  onDowloadButtonClick: () => void;
  onInfoButtonClick: () => void;
  onAddToMapButtonClick: () => void;
}
