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
  className?: string;
}

const DonutChart: FC<DonutChartProps> = ({ data, chartConfig, className }) => {
  const legendItems = data.map((item) => ({
    ...item,
    fill: chartConfig[item.key]?.color ?? "",
  }));

  return (
    <section className={className}>
      <ChartContainer config={chartConfig} className="w-[200px] h-[200px]">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name, item) => (
                  <>
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                      style={{
                        backgroundColor: item.payload?.fill ?? item.color,
                      }}
                    />
                    <div className="flex flex-1 justify-between leading-none items-center gap-1">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {typeof value === "number"
                          ? `${value.toLocaleString()}%`
                          : String(value)}
                      </span>
                    </div>
                  </>
                )}
              />
            }
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
