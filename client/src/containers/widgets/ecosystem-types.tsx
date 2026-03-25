import { GlobeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import RichText from "@/components/ui/rich-text";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";

const EcosystemTypes = () => {
  const t = useTranslations("widgets.ecosystem-types");
  return (
    <WidgetCard
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
    ></WidgetCard>
  );
};

export default EcosystemTypes;
