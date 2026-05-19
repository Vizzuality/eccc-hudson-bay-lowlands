import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/fr";
import relativeTime from "dayjs/plugin/relativeTime";
import type { Locale } from "next-intl";

dayjs.extend(relativeTime);

export function formatDate(date: dayjs.ConfigType = undefined): string {
  return dayjs(date).format("YYYY-MM-DD");
}

export function getRemainingTime(
  date: dayjs.ConfigType = undefined,
  locale: Locale,
): string {
  const expirationDate = dayjs(date).locale(locale).add(1, "month");

  return expirationDate.fromNow();
}
