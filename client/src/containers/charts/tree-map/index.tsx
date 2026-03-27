import type { FC } from "react";
import { Treemap as TreeMapChart } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import ChartLegend from "@/containers/charts/legend";

interface TreeMapProps {
  data: { key: string; label: string; value: number; fill: string }[];
  chartConfig: ChartConfig;
}

const TreeMap: FC<TreeMapProps> = ({ data, chartConfig }) => {
  return (
    <section>
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <TreeMapChart data={data} dataKey="value">
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        </TreeMapChart>
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

export default TreeMap;
