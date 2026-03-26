"use client";

import type { FC, ReactNode } from "react";
import { useIntersectionObserver } from "usehooks-ts";
import {
  useAnalysisScrollRoot,
  useAnalysisWidgetSpy,
} from "@/containers/analysis/analysis-context";

type WidgetSectionProps = {
  id: string;
  children: ReactNode;
};

/** Wraps a widget so intersection with the sidebar scroll viewport can be tracked. */
const WidgetSection: FC<WidgetSectionProps> = ({ id, children }) => {
  const scrollRoot = useAnalysisScrollRoot();
  const { reportWidgetIntersection } = useAnalysisWidgetSpy();

  const [ref] = useIntersectionObserver({
    root: scrollRoot,
    rootMargin: "0px 0px -90% 0px",
    threshold: 0,
    onChange: (isIntersecting, entry) => {
      if (!scrollRoot) {
        reportWidgetIntersection(id, false, undefined);
        return;
      }
      reportWidgetIntersection(id, isIntersecting, entry);
    },
  });

  return <div ref={ref}>{children}</div>;
};

export default WidgetSection;
