import { GlobeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import RichText from "@/components/ui/rich-text";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";

const EcosystemTypes: FC<WidgetCardBaseProps> = ({ id }) => {
  const t = useTranslations("widgets.ecosystem-types");
  return (
    <WidgetCard
      id={id}
      title={t("title")}
      description={
        <RichText>
          {(tags) =>
            t.rich("description", {
              ...tags,
              ecosystem_count: 10,
              dominant_ecosystem: "Forest",
              dominant_ecosystem_perc: 50,
            })
          }
        </RichText>
      }
      icon={
        <WidgetCardIcon
          icon={<GlobeIcon className="size-5 text-amber-500" />}
          backgroundColor="#F59E0B"
        />
      }
      onDowloadButtonClick={() => {}}
      onInfoButtonClick={() => {}}
      onAddToMapButtonClick={() => {}}
    >
      <MoreInfoTooltip title={t("more-info.title")}>
        {t("more-info.description")}
      </MoreInfoTooltip>
    </WidgetCard>
  );
};

export default EcosystemTypes;
