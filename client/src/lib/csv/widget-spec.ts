import type { WidgetId } from "@/containers/analysis/types";

// Stat units mirror api/services/widgets.py; see docs/ADR/006-per-stat-units-duplicated-in-client.md
export interface WidgetCsvSpec {
  stats: Record<string, string>;
  chart: Record<string, { unit?: string; keyUnit?: string }>;
}

const PERCENT = "%";
const COUNT = "count";
const NONE = "";

const WINTERS = ["1819", "1920", "2021", "2122", "2223", "2324"] as const;

const snowStats = (): Record<string, string> =>
  Object.fromEntries(
    WINTERS.flatMap((winter) => [
      [`lengthT_mean_${winter}`, "days"],
      [`endL_mean_date_${winter}`, NONE],
    ]),
  );

export const WIDGET_CSV_SPEC: Record<WidgetId, WidgetCsvSpec> = {
  peat_carbon: {
    stats: {
      peat_depth_avg: "cm",
      peat_depth_max: "cm",
      carbon_total: "Mt",
      carbon_density: "kg/m²",
    },
    chart: {
      peat_cog: { unit: COUNT, keyUnit: "cm" },
      carbon_cog: { unit: COUNT, keyUnit: "kg/m²" },
    },
  },
  water_dynamics: {
    stats: {
      water_perm_perc: PERCENT,
      water_ephemeral_perc: PERCENT,
      land_perm_perc: PERCENT,
      trend_wetter_perc: PERCENT,
      trend_drier_perc: PERCENT,
      trend_stable_perc: PERCENT,
    },
    chart: {},
  },
  flood_susceptibility: {
    stats: {
      fsi_low_perc: PERCENT,
      fsi_moderate_perc: PERCENT,
      fsi_high_perc: PERCENT,
    },
    chart: {},
  },
  snow_dynamics: {
    stats: snowStats(),
    chart: { lengthT_mean: { unit: "days", keyUnit: "year" } },
  },
  treed_area: {
    stats: {
      non_treed_area: "km²",
      always_treed_area: "km²",
      newly_treed_area: "km²",
      was_treed_area: "km²",
      total_treed_area: "km²",
      changed_treed_area: "km²",
      non_treed_perc: PERCENT,
      always_treed_perc: PERCENT,
      newly_treed_perc: PERCENT,
      was_treed_perc: PERCENT,
    },
    chart: {},
  },
  ecosystem_classification: {
    stats: {
      eco_temperate_perc: PERCENT,
      eco_treed_perc: PERCENT,
      eco_grassland_perc: PERCENT,
      eco_fire_perc: PERCENT,
      eco_graminoid_perc: PERCENT,
      eco_shrub_perc: PERCENT,
      eco_emergent_perc: PERCENT,
      eco_bog_perc: PERCENT,
      eco_mudflats_perc: PERCENT,
      eco_coastal_perc: PERCENT,
      eco_marine_perc: PERCENT,
      eco_water_perc: PERCENT,
      dominant_ecosystem_perc: PERCENT,
      ecosystem_count: NONE,
      dominant_ecosystem: NONE,
      dominant_ecosystem_label: NONE,
    },
    chart: {},
  },
};
