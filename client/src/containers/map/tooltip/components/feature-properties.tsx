import type { FC } from "react";

interface FeaturePropertiesTooltipProps {
  properties: Record<string, unknown>;
}

const FeaturePropertiesTooltip: FC<FeaturePropertiesTooltipProps> = ({
  properties,
}) => {
  return (
    <div>
      <pre>{JSON.stringify(properties, null, 2)}</pre>
    </div>
  );
};

export default FeaturePropertiesTooltip;
