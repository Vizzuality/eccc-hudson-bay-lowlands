import type { FC, PropsWithChildren } from "react";

const ChartTitle: FC<PropsWithChildren> = ({ children }) => {
  return (
    <h3 className="text-xs font-bold leading-4 text-muted-foreground uppercase">
      {children}
    </h3>
  );
};

export default ChartTitle;
