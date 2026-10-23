import { flushSync } from "react-dom";

// flushSync: nuqs re-syncs other hook instances urgently after the URL flush, so a React transition would split the commit
export function withViewTransition(update: () => void) {
  if (!document.startViewTransition) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}
