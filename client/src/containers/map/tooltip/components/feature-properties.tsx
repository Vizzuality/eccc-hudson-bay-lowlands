import { useTranslations } from "next-intl";
import { type FC, Fragment } from "react";

interface FeaturePropertiesTooltipProps {
  properties: Record<string, unknown>;
}

const FeaturePropertiesTooltip: FC<FeaturePropertiesTooltipProps> = ({
  properties,
}) => {
  const t = useTranslations("map.popup-properties");

  return (
    <dl className="grid grid-cols-2 gap-x-2 gap-y-3">
      {Object.entries(properties).map(([key, rawValue]) => {
        const value = String(rawValue ?? "");
        return (
          <Fragment key={key}>
            <dt className="uppercase text-xs font-bold leading-4 text-muted-foreground inline-flex items-center flex-1">
              {t(key)}
            </dt>
            <dd className="text-sm font-semibold leading-5 inline-flex items-center">
              {value || "-"}
            </dd>
          </Fragment>
        );
      })}
    </dl>
  );
};

export default FeaturePropertiesTooltip;
