import type { ReactNode } from "react";

type Tag = "p" | "b" | "i";

type Props = {
  children(tags: Record<Tag, (chunks: ReactNode) => ReactNode>): ReactNode;
};

export default function RichText({ children }: Props) {
  return (
    <>
      {children({
        p: (chunks: ReactNode) => <p>{chunks}</p>,
        b: (chunks: ReactNode) => (
          <b className="text-foreground font-bold">{chunks}</b>
        ),
        i: (chunks: ReactNode) => <i className="italic">{chunks}</i>,
      })}
    </>
  );
}
