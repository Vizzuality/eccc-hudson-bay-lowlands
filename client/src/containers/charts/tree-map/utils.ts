interface LabelLayout {
  lines: string[];
  fits: boolean;
}

const MAX_LINES = 2;
const LABEL_PADDING = 8;

function estimateWidth(text: string, charWidth: number): number {
  return text.length * charWidth + LABEL_PADDING;
}

function layoutLabel(
  label: string,
  maxWidth: number,
  charWidth: number,
): LabelLayout {
  const words = label.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return { lines: [], fits: false };
  }

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (estimateWidth(word, charWidth) > maxWidth) {
      return { lines: [], fits: false };
    }

    const candidate = current ? `${current} ${word}` : word;

    if (estimateWidth(candidate, charWidth) <= maxWidth) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = word;

    if (lines.length === MAX_LINES) {
      return { lines: [], fits: false };
    }
  }

  lines.push(current);

  return { lines, fits: true };
}

export { layoutLabel };
export type { LabelLayout };
