"use client";

import type { FC } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import ChartTitle from "@/containers/charts/title";

const seriesKey = "y" as const;

interface VerticalBarChartProps {
  title: string;
  data: { x: string; y: number }[];
  chartConfig: ChartConfig;
}

const VerticalBarChart: FC<VerticalBarChartProps> = ({
  title,
  data,
  chartConfig,
}) => {
  return (
    <section className="space-y-2">
      <ChartTitle>{title}</ChartTitle>
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={data} margin={{ left: -20 }}>
          <CartesianGrid vertical={false} strokeDasharray="4 4" />
          <XAxis
            dataKey="x"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey={seriesKey}
            fill={`var(--color-${seriesKey})`}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </section>
  );
};

export default VerticalBarChart;
