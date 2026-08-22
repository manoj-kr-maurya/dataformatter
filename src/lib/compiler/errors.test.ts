import { describe, expect, it } from "vitest";
import {
  DartPadRpcError,
  DARTPAD_ERROR_CODES,
  describeDartPadError,
} from "@/lib/compiler/errors";

describe("describeDartPadError", () => {
  it("maps known codes to friendly messages", () => {
    const error = new DartPadRpcError(
      DARTPAD_ERROR_CODES.EXECUTION_FAILED,
      "Exception: boom",
    );
    expect(describeDartPadError(error)).toContain("threw an unhandled error");
  });

  it("appends the raw detail for known codes when present", () => {
    const error = new DartPadRpcError(DARTPAD_ERROR_CODES.COMPILATION_FAILED, "line 3: oops");
    const message = describeDartPadError(error);
    expect(message).toContain("Compilation failed.");
    expect(message).toContain("line 3: oops");
  });

  it("passes through unknown codes verbatim", () => {
    const error = new DartPadRpcError(9999, "Mystery failure");
    expect(describeDartPadError(error)).toBe("Mystery failure");
  });

  it("falls back to the plain Error message for non-RPC errors", () => {
    expect(describeDartPadError(new Error("network down"))).toBe("network down");
  });

  it("returns a generic line for opaque values", () => {
    expect(describeDartPadError(42)).toBe("Something went wrong talking to the Dart engine.");
  });
});
