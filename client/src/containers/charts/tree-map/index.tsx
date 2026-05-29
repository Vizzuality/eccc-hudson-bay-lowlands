import type { FC } from "react";
import { Treemap as TreeMapChart } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import ChartLegend from "@/containers/charts/legend";
import { layoutLabel } from "@/containers/charts/tree-map/utils";

const AVG_CHAR_WIDTH = 7;
const LINE_HEIGHT = 14;

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
  const cx = gx + gw / 2;

  const { lines, fits } = layoutLabel(label ?? "", gw, AVG_CHAR_WIDTH);
  const totalLines = lines.length + 1;
  const requiredHeight = totalLines * LINE_HEIGHT;
  const showLabel = fits && gh > requiredHeight;
  const firstLineOffset = -((totalLines - 1) / 2) * LINE_HEIGHT;

  return (
    <g>
      <rect x={gx} y={gy} width={gw} height={gh} fill={fill} rx={4} />
      {showLabel && (
        <text
          x={cx}
          y={gy + gh / 2}
          textAnchor="middle"
          fill="white"
          fontSize={12}
          fontWeight={700}
        >
          {lines.map((line, index) => (
            <tspan
              key={line}
              x={cx}
              dy={index === 0 ? firstLineOffset : LINE_HEIGHT}
            >
              {line}
            </tspan>
          ))}
          <tspan x={cx} dy={LINE_HEIGHT}>
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
  const legendItems = data.map((item) => ({
    ...item,
    fill: chartConfig[item.key]?.color ?? "",
  }));

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
      <div data-download-exclude>
        <ChartLegend items={legendItems} className="justify-start" />
      </div>
      <div data-download-only className="hidden">
        <ChartLegend items={legendItems} showValues className="justify-start" />
      </div>
    </section>
  );
};

export { TreeMapCell };
export default TreeMap;
