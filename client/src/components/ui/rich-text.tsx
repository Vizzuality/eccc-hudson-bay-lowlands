import type { ReactNode } from "react";

type Tag = "p" | "b" | "i";

type Props = {
  className?: string;
  children(tags: Record<Tag, (chunks: ReactNode) => ReactNode>): ReactNode;
};

export default function RichText({ className, children }: Props) {
  return (
    <>
      {children({
        p: (chunks: ReactNode) => <p className={className}>{chunks}</p>,
        b: (chunks: ReactNode) => <b className="font-bold">{chunks}</b>,
        i: (chunks: ReactNode) => <i className="italic">{chunks}</i>,
      })}
    </>
  );
}
