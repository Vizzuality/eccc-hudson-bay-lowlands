import type { FC, PropsWithChildren } from "react";
import { Popup } from "react-map-gl/mapbox";

interface MapTooltipProps {
  longitude: number;
  latitude: number;
  className?: string;
  title?: string;
  onClose: () => void;
}

const MapPopup: FC<PropsWithChildren<MapTooltipProps>> = ({
  longitude,
  latitude,
  children,
  className,
  title,
  onClose,
}) => {
  return (
    <Popup
      className={className}
      longitude={longitude}
      latitude={latitude}
      onClose={onClose}
      closeButton={false}
      maxWidth="300px"
      style={{ zIndex: 10 }}
    >
      <div className="px-3 pt-3 pb-2.5 space-y-1.5">
        {title && <h3 className="text-sm font-bold leading-6">{title}</h3>}
        {children}
      </div>
    </Popup>
  );
};

export default MapPopup;
