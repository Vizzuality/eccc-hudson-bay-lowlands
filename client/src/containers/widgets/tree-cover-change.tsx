import { TreesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import RichText from "@/components/ui/rich-text";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";

const TreeCoverChange: FC<WidgetCardBaseProps> = ({ id }) => {
  const t = useTranslations("widgets.tree-cover-change");

  return (
    <WidgetCard
      id={id}
      title={t("title")}
      icon={
        <WidgetCardIcon
          icon={<TreesIcon className="size-5 text-green-600" />}
          backgroundColor="#16A34A"
        />
      }
      onDowloadButtonClick={() => {}}
      onInfoButtonClick={() => {}}
      onAddToMapButtonClick={() => {}}
    >
      <MoreInfoTooltip title={t("more-info.title")}>
        {t("more-info.description")}
      </MoreInfoTooltip>
      <RichText className="text-muted-foreground text-sm font-medium leading-5">
        {(tags) =>
          t.rich("description", {
            ...tags,
            total_treed_area: 100,
            newly_treed_area: 50,
            was_treed_area: 30,
            changed_treed_area: 20,
          })
        }
      </RichText>
    </WidgetCard>
  );
};

export default TreeCoverChange;
