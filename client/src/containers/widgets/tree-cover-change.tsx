import { TreesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";

const TreeCoverChange = () => {
  const t = useTranslations("widgets.tree-cover-change");

  return (
    <WidgetCard
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
    ></WidgetCard>
  );
};

export default TreeCoverChange;
