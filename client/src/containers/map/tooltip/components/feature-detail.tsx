import { useTranslations } from "next-intl";
import { type FC, Fragment } from "react";

interface FeatureDetailTooltipProps {
  properties: Record<string, unknown>;
}

const FeatureDetailTooltip: FC<FeatureDetailTooltipProps> = ({
  properties,
}) => {
  const tLabels = useTranslations("map.popup-properties");
  const tDetails = useTranslations("map.detail-values");

  const items = Object.entries(properties).map(([key, rawValue]) => {
    const value = String(rawValue ?? "");
    const detailLabelKey = `${key}.${value}.label`;
    const detailDescKey = `${key}.${value}.description`;

    if (tDetails.has(detailLabelKey)) {
      return {
        key,
        label: tLabels(key),
        value: {
          label: tDetails(detailLabelKey),
          description: tDetails.has(detailDescKey)
            ? tDetails(detailDescKey)
            : undefined,
        },
      };
    }

    return { key, label: tLabels(key), value };
  });

  return (
    <dl className="grid grid-cols-2 gap-x-2 gap-y-3">
      {items.map((item) => {
        if (!item.value) return null;

        return (
          <Fragment key={item.key}>
            <dt className="uppercase text-xs font-bold leading-4 text-muted-foreground flex flex-col justify-start">
              {item.label}
            </dt>
            {typeof item.value === "object" ? (
              <dd className="text-sm font-medium leading-5 flex flex-col justify-start">
                <p>{item.value.label}</p>
                {item.value.description && (
                  <p className="text-muted-foreground">
                    {item.value.description}
                  </p>
                )}
              </dd>
            ) : (
              <dd className="text-sm font-medium leading-5 flex flex-col justify-start">
                {item.value}
              </dd>
            )}
          </Fragment>
        );
      })}
    </dl>
  );
};

export default FeatureDetailTooltip;
