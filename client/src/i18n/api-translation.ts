import { useLocale } from "next-intl";
import type { Translatable } from "@/types";

/**
 *
 * A simple hook to get the translation of any translatable field from the API.
 */
export function useApiTranslation() {
  const locale = useLocale();
  const getTranslation = (field: Translatable) => {
    return field[locale] ?? field.en;
  };

  return { getTranslation };
}
