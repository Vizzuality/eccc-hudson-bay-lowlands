export type CsvSection = "metadata" | "stats" | "chart";

export interface CsvRow {
  section: CsvSection;
  series: string;
  key: string;
  keyUnit: string;
  label: string;
  value: string;
  unit: string;
}

const COLUMNS = [
  ["section", "section"],
  ["series", "series"],
  ["key", "key"],
  ["key_unit", "keyUnit"],
  ["label", "label"],
  ["value", "value"],
  ["unit", "unit"],
] as const satisfies readonly (readonly [string, keyof CsvRow])[];

const DELIMITER = ";";
const LINE_BREAK = "\r\n";
const BYTE_ORDER_MARK = "﻿";
const NEEDS_QUOTING = /[;"\r\n]/;

const escapeField = (value: string): string =>
  NEEDS_QUOTING.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

const toLine = (fields: readonly string[]): string =>
  fields.map(escapeField).join(DELIMITER);

export const toCsv = (rows: readonly CsvRow[]): string =>
  BYTE_ORDER_MARK +
  [
    toLine(COLUMNS.map(([header]) => header)),
    ...rows.map((row) => toLine(COLUMNS.map(([, field]) => row[field]))),
  ].join(LINE_BREAK) +
  LINE_BREAK;
