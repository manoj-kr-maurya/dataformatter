// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { ThankYouToast } from "@/components/ui/thank-you-toast";

const STORAGE_KEY = "devtools-thanks-shown";
const SHOW_DELAY_MS = 6000;
const AUTO_DISMISS_MS = 10000;

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function advance(durationMs: number) {
  act(() => {
    vi.advanceTimersByTime(durationMs);
  });
}

describe("ThankYouToast", () => {
  it("renders nothing before the delay elapses", () => {
    render(<ThankYouToast />);
    expect(screen.queryByText(/Thanks for using/)).toBeNull();
  });

  it("appears once after the delay", () => {
    render(<ThankYouToast />);
    advance(SHOW_DELAY_MS);
    expect(screen.getByText(/Thanks for using DataFormatter/)).toBeInTheDocument();
    expect(screen.getByText(/bookmark this tool/i)).toBeInTheDocument();
  });

  it("is anchored to the top center of the viewport", () => {
    render(<ThankYouToast />);
    advance(SHOW_DELAY_MS);
    const toast = screen.getByText(/Thanks for using DataFormatter/).closest(
      'div[role="status"]',
    );
    expect(toast).not.toBeNull();
    expect((toast as HTMLElement).className).toContain("fixed");
    expect((toast as HTMLElement).className).toContain("left-1/2");
    expect((toast as HTMLElement).className).toContain("top-3");
  });

  it("auto-dismisses after 10 seconds and remembers that it was shown", () => {
    render(<ThankYouToast />);
    advance(SHOW_DELAY_MS);
    expect(screen.getByText(/Thanks for using DataFormatter/)).toBeInTheDocument();

    advance(AUTO_DISMISS_MS);
    expect(screen.queryByText(/Thanks for using DataFormatter/)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("1");
  });

  it("dismisses on Got it and persists the flag", () => {
    render(<ThankYouToast />);
    advance(SHOW_DELAY_MS);

    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.queryByText(/Thanks for using DataFormatter/)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("1");
  });

  it("does not show again once the flag is set", () => {
    localStorage.setItem(STORAGE_KEY, "1");
    render(<ThankYouToast />);
    advance(SHOW_DELAY_MS * 2);
    expect(screen.queryByText(/Thanks for using DataFormatter/)).toBeNull();
  });
});