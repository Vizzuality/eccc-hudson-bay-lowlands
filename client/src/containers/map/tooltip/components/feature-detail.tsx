import type { FC } from "react";

interface FeatureDetailTooltipProps {
  properties: Record<string, unknown>;
}

const FeatureDetailTooltip: FC<FeatureDetailTooltipProps> = ({
  properties,
}) => {
  return (
    <div>
      <pre>{JSON.stringify(properties, null, 2)}</pre>
    </div>
  );
};

export default FeatureDetailTooltip;
