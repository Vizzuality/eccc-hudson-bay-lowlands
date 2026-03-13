import type { FC, PropsWithChildren } from "react";
import { Separator } from "@/components/ui/separator";

const ItemContainer: FC<PropsWithChildren> = ({ children }) => (
  <article className="relative group block **:transition-all **:duration-200 **:ease-out">
    {children}
    <div className="px-5">
      <Separator className="bg-linear-to-r from-secondary/30 to-primary/20 group-hover:bg-[linear-gradient(90deg,rgba(230,244,241,0.30)_0%,#10B981_100%)]" />
    </div>
  </article>
);

export default ItemContainer;
