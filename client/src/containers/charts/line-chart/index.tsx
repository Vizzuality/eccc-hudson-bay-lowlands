import type { FC } from "react";
import {
  CartesianGrid,
  Line,
  LineChart as LineChartComponent,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { TimeSeriesDataPoint } from "@/containers/analysis/types";
import ChartTitle from "@/containers/charts/title";

interface LineChartProps {
  title: string;
  data: TimeSeriesDataPoint[];
  chartConfig: ChartConfig;
}

const LineChart: FC<LineChartProps> = ({ title, data, chartConfig }) => {
  return (
    <section className="space-y-2">
      <ChartTitle>{title}</ChartTitle>
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <LineChartComponent data={data} dataKey="value">
          <CartesianGrid vertical={false} strokeDasharray="4 4" />
          <XAxis
            dataKey="x"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="y"
            stroke={chartConfig.y.color}
            dot={false}
            strokeWidth={3}
          />
        </LineChartComponent>
      </ChartContainer>
    </section>
  );
};

export default LineChart;
