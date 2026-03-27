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
          />
        </PieChart>
      </ChartContainer>
      <ChartLegend
        items={data.map((item) => ({
          ...item,
          fill: chartConfig[item.key]?.color ?? "",
        }))}
      />
    </section>
  );
};

export default DonutChart;
