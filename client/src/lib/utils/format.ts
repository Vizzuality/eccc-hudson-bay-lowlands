import type { Locale } from "next-intl";

export const format = (
  locale: Locale,
  value: number,
  options?: Intl.NumberFormatOptions,
  customUnit?: string,
) => {
  const formatter = new Intl.NumberFormat(locale, {
    style: "decimal",
    maximumFractionDigits: 1,
    ...options,
  });

  // We make sure that we don't display small values as 0
  let formattedValue = formatter.format(value);
  if (formattedValue === "0" && value !== 0) {
    formattedValue = `< ${formatter.format(0.1)}`;
  }
  if (customUnit) {
    formattedValue = `${formattedValue} ${customUnit}`;
  }

  return formattedValue;
};
