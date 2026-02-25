import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  PopoverProvider,
  usePopover,
} from "@/containers/map/controls/provider";

const TestConsumer = () => {
  const { open, setOpen } = usePopover();
  return (
    <>
      <span data-testid="open-value">{String(open)}</span>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <button type="button" onClick={() => setOpen(false)}>
        Close
      </button>
    </>
  );
};

describe("@containers/map/controls/provider", () => {
  it("throws when usePopover is used outside PopoverProvider", () => {
    expect(() => render(<TestConsumer />)).toThrow(
      "usePopover must be used within a PopoverProvider",
    );
  });

  it("provides a default closed state", () => {
    render(
      <PopoverProvider>
        <TestConsumer />
      </PopoverProvider>,
    );

    expect(screen.getByTestId("open-value")).toHaveTextContent("false");
  });

  it("updates open state via setOpen", async () => {
    const user = userEvent.setup();
    render(
      <PopoverProvider>
        <TestConsumer />
      </PopoverProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByTestId("open-value")).toHaveTextContent("true");

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByTestId("open-value")).toHaveTextContent("false");
  });
});
