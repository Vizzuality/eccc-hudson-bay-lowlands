import type { FC } from "react";
import { Pie, PieChart } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import ChartLegend from "@/containers/charts/legend";

interface DonutChartProps {
  data: { key: string; label: string; value: number; fill: string }[];
  chartConfig: ChartConfig;
}

const DonutChart: FC<DonutChartProps> = ({ data, chartConfig }) => {
  const legendItems = data.map((item) => ({
    ...item,
    fill: chartConfig[item.key]?.color ?? "",
  }));

  return (
    <section>
      <ChartContainer config={chartConfig} className="w-[200px] h-[200px]">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={60}
            outerRadius={80}
            startAngle={90}
            endAngle={-270}
            stroke="#FFFFFF"
            strokeWidth={1}
          />
        </PieChart>
      </ChartContainer>
      <div data-download-exclude>
        <ChartLegend items={legendItems} />
      </div>
      <div data-download-only className="hidden">
        <ChartLegend items={legendItems} showValues />
      </div>
    </section>
  );
};

export default DonutChart;
