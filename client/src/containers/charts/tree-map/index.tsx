import type { FC } from "react";
import { Treemap as TreeMapChart } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import ChartLegend from "@/containers/charts/legend";

const MIN_LABEL_WIDTH = 50;
const MIN_LABEL_HEIGHT = 30;

interface CellProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  label?: string;
  value?: number;
}

const TreeMapCell: FC<CellProps> = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill,
  label,
  value,
}) => {
  const gap = 1;
  const gx = x + gap;
  const gy = y + gap;
  const gw = Math.max(width - gap * 2, 0);
  const gh = Math.max(height - gap * 2, 0);
  const showLabel = gw > MIN_LABEL_WIDTH && gh > MIN_LABEL_HEIGHT;
  return (
    <g>
      <rect x={gx} y={gy} width={gw} height={gh} fill={fill} rx={4} />
      {showLabel && (
        <text
          x={gx + gw / 2}
          y={gy + gh / 2}
          textAnchor="middle"
          fill="white"
          fontSize={12}
          fontWeight={700}
        >
          <tspan x={gx + gw / 2} dy="-0.4em">
            {label}
          </tspan>
          <tspan x={gx + gw / 2} dy="1.2em">
            {value}%
          </tspan>
        </text>
      )}
    </g>
  );
};

interface TreeMapProps {
  data: { key: string; label: string; value: number; fill: string }[];
  chartConfig: ChartConfig;
}

const TreeMap: FC<TreeMapProps> = ({ data, chartConfig }) => {
  return (
    <section className="space-y-1.5">
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <TreeMapChart
          data={data}
          dataKey="value"
          nameKey="label"
          stroke="transparent"
          fill="transparent"
          content={<TreeMapCell />}
        >
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        </TreeMapChart>
      </ChartContainer>
      <ChartLegend
        items={data.map((item) => ({
          ...item,
          fill: chartConfig[item.key]?.color ?? "",
        }))}
        className="justify-start"
      />
    </section>
  );
};

export { TreeMapCell };
export default TreeMap;
