import { TreesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
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
    ></WidgetCard>
  );
};

export default TreeCoverChange;
