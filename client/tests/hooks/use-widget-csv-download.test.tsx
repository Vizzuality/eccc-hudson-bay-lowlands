import { renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalysisResult } from "@/containers/analysis/types";
import { useWidgetCsvDownload } from "@/hooks/use-widget-csv-download";
import messages from "@/i18n/messages/en.json";

const { analysisResultMock, paramsMock } = vi.hoisted(() => ({
  analysisResultMock: vi.fn(),
  paramsMock: vi.fn(),
}));

vi.mock("@/hooks/use-analysis-settings", () => ({
  useAnalysisResult: analysisResultMock,
}));

vi.mock("next/navigation", () => ({
  useParams: paramsMock,
}));

const translatable = (en: string) => ({ en, fr: en });

const dataset = {
  id: 1,
  category_id: 1,
  metadata: {
    title: translatable("Carbon and Peatlands"),
    description: translatable(""),
    source: translatable("ECCC"),
    citation: translatable("ECCC 2026"),
  },
  layers: [
    {
      id: "ecosystem_classification_cog",
      categories: [{ value: 2, label: translatable("Treed Wetland") }],
    },
  ],
};

const analysisResult = {
  aoi_size: 1240.5,
  peat_carbon: {
    unit: "cm",
    stats: { peat_depth_avg: 42.3, carbon_total: 8.4 },
    chart: { peat_cog: [{ x: 12, y: 340 }] },
    dataset,
  },
  ecosystem_classification: {
    unit: "%",
    stats: { dominant_ecosystem: 2, eco_bog_perc: 31.2 },
    chart: {
      ecosystem_classification_cog: [{ key: "eco_bog_perc", value: 31.2 }],
    },
    dataset,
  },
} as unknown as AnalysisResult;

const wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {children}
  </NextIntlClientProvider>
);

const capturedCsv = () => {
  const blob = vi.mocked(URL.createObjectURL).mock.calls[0]?.[0] as Blob;
  return blob.text();
};

describe("useWidgetCsvDownload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analysisResultMock.mockReturnValue(analysisResult);
    paramsMock.mockReturnValue({});
    URL.createObjectURL = vi.fn(() => "blob:csv");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
  });

  it("writes the widget's stats and chart points into the downloaded file", async () => {
    const { result } = renderHook(() => useWidgetCsvDownload("peat_carbon"), {
      wrapper,
    });

    result.current.download();

    const csv = await capturedCsv();

    expect(csv).toContain(
      "stats;;peat_depth_avg;;Average peat depth;42.3;cm\r\n",
    );
    expect(csv).toContain("stats;;carbon_total;;Total carbon;8.4;Mt\r\n");
    expect(csv).toContain(
      "chart;peat_cog;12;cm;Weighted pixel count;340;count\r\n",
    );
  });

  it("resolves the dominant ecosystem class id to its name", async () => {
    const { result } = renderHook(
      () => useWidgetCsvDownload("ecosystem_classification"),
      { wrapper },
    );

    result.current.download();

    const csv = await capturedCsv();

    expect(csv).toContain("dominant_ecosystem_label");
    expect(csv).toContain("Treed Wetland");
  });

  it("leaves the area value empty when the analysis has no aoi_size", async () => {
    analysisResultMock.mockReturnValue({ ...analysisResult, aoi_size: null });

    const { result } = renderHook(() => useWidgetCsvDownload("peat_carbon"), {
      wrapper,
    });

    result.current.download();

    const csv = await capturedCsv();

    expect(csv).toContain("metadata;;aoi_size;;Area of interest;;km²\r\n");
    expect(csv).not.toContain("null");
  });

  it("includes the analysis URL only when viewing a shared analysis", async () => {
    paramsMock.mockReturnValue({ id: "abc123" });

    const { result } = renderHook(() => useWidgetCsvDownload("peat_carbon"), {
      wrapper,
    });

    result.current.download();

    expect(await capturedCsv()).toContain("/en/analysis/abc123");
  });

  it("does nothing before an analysis has been run", () => {
    analysisResultMock.mockReturnValue(null);

    const { result } = renderHook(() => useWidgetCsvDownload("peat_carbon"), {
      wrapper,
    });

    result.current.download();

    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
