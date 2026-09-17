import { describe, expect, it } from "vitest";
import { type CsvRow, toCsv } from "@/lib/csv/serialize";

const row = (overrides: Partial<CsvRow> = {}): CsvRow => ({
  section: "stats",
  series: "",
  key: "peat_depth_avg",
  label: "Average peat depth",
  value: "42.3",
  unit: "cm",
  ...overrides,
});

describe("toCsv", () => {
  it("quotes a field containing the delimiter so it stays in one column", () => {
    const csv = toCsv([
      row({ key: "dataset_citation", label: "Citation", value: "ECCC; 2026" }),
    ]);

    expect(csv).toContain('dataset_citation;Citation;"ECCC; 2026";cm');
  });

  it("doubles embedded quotes so the field survives a round trip", () => {
    const csv = toCsv([row({ value: 'the "wet" zone' })]);

    expect(csv).toContain('"the ""wet"" zone"');
  });

  it("writes the header in the fixed column order", () => {
    const [header] = toCsv([]).split("\r\n");

    expect(header).toBe("﻿section;series;key;label;value;unit");
  });
});
