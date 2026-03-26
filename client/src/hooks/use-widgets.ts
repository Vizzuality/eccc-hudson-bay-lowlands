import { useTranslations } from "next-intl";
import { WIDGETS } from "@/containers/widgets/constants";

export function useWidgets() {
  const t = useTranslations();

  return WIDGETS.map((widget) => ({
    id: widget.id,
    title: t(`widgets.${widget.id}.title`),
  }));
}
