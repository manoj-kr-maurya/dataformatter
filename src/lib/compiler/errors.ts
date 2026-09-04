/**
 * JSON-RPC 2.0 error codes returned by the DartPad worker and sandbox,
 * per pkg/dartpad/doc/worker-protocol.md in dart-lang/sdk.
 *
 * Negative numbers are reserved by the JSON-RPC spec itself; DartPad uses
 * positive ranges grouped by subsystem.
 */
export const DARTPAD_ERROR_CODES = {
  // JSON-RPC 2.0 spec codes the worker/sandbox also emit.
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  SERVER_ERROR: -32000,

  // Session (2xxx).
  WORKSPACE_NOT_FOUND: 2001,

  // File system (4xxx).
  FILE_NOT_FOUND: 4001,
  FILE_WRITE_CONFLICT: 4002,
  FILE_DELETION_FAILED: 4003,

  // Language server (5xxx).
  LANGUAGE_SERVER_NOT_FOUND: 5001,

  // Compilation (6xxx).
  COMPILATION_FAILED: 6001,
  PACKAGE_CONFIG_NOT_FOUND: 6020,
  HOT_RELOAD_COMPILER_NOT_FOUND: 6100,
  HOT_RELOAD_REJECTED: 6101,

  // Pub (7xxx).
  PUB_COMMAND_FAILED: 7001,
  PUB_USAGE: 7064,
  PUB_DATA: 7065,
  PUB_NO_INPUT: 7066,
  PUB_NO_USER: 7067,
  PUB_NO_HOST: 7068,
  PUB_UNAVAILABLE: 7069,
  PUB_SOFTWARE: 7070,
  PUB_OS: 7071,
  PUB_OS_FILE: 7072,
  PUB_CANT_CREATE: 7073,
  PUB_IO: 7074,
  PUB_TEMP_FAIL: 7075,
  PUB_PROTOCOL: 7076,
  PUB_NO_PERM: 7077,
  PUB_CONFIG: 7078,

  // Sandbox execution (8xxx).
  MODULE_LOADER_NOT_AVAILABLE: 8001,
  FLUTTER_LOADER_NOT_AVAILABLE: 8002,
  MODULE_LOADING_FAILED: 8100,
  EXECUTION_FAILED: 8200,
  HOT_RESTART_FAILED: 8300,
  HOT_RELOAD_FAILED: 8400,
} as const;

/** An RPC error surfaced as a typed exception with its wire code attached. */
export class DartPadRpcError extends Error {
  readonly code: number;
  readonly data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = "DartPadRpcError";
    this.code = code;
    this.data = data;
  }
}

const FRIENDLY_MESSAGES: Readonly<Record<number, string>> = {
  [DARTPAD_ERROR_CODES.WORKSPACE_NOT_FOUND]: "The compiler session expired. Reset and try again.",
  [DARTPAD_ERROR_CODES.FILE_NOT_FOUND]: "A required file is missing from the workspace.",
  [DARTPAD_ERROR_CODES.FILE_WRITE_CONFLICT]: "Could not write a workspace file.",
  [DARTPAD_ERROR_CODES.FILE_DELETION_FAILED]: "Could not delete a workspace file.",
  [DARTPAD_ERROR_CODES.COMPILATION_FAILED]: "Compilation failed.",
  [DARTPAD_ERROR_CODES.PACKAGE_CONFIG_NOT_FOUND]:
    "Dependencies were never resolved. Add a pubspec.yaml and run pub get.",
  [DARTPAD_ERROR_CODES.HOT_RELOAD_COMPILER_NOT_FOUND]: "The compiler was closed. Run again.",
  [DARTPAD_ERROR_CODES.HOT_RELOAD_REJECTED]:
    "This change cannot be hot-reloaded. Run again from scratch.",
  [DARTPAD_ERROR_CODES.PUB_COMMAND_FAILED]: "pub get failed.",
  [DARTPAD_ERROR_CODES.MODULE_LOADER_NOT_AVAILABLE]: "The code runner is still loading.",
  [DARTPAD_ERROR_CODES.MODULE_LOADING_FAILED]: "Failed to load the compiled program.",
  [DARTPAD_ERROR_CODES.EXECUTION_FAILED]: "The program threw an unhandled error.",
  [DARTPAD_ERROR_CODES.HOT_RESTART_FAILED]: "Hot restart failed.",
  [DARTPAD_ERROR_CODES.HOT_RELOAD_FAILED]: "Hot reload failed.",
};

/**
 * Human-friendly one-liner for an RPC error. Falls back to the raw message
 * for unknown codes so nothing important is swallowed.
 */
export function describeDartPadError(error: unknown): string {
  if (error instanceof DartPadRpcError) {
    const friendly = FRIENDLY_MESSAGES[error.code];
    const detail = error.message.trim();
    if (!friendly) {
      return detail.length > 0 ? detail : `Request failed (code ${error.code}).`;
    }
    return detail.length > 0 && !detail.startsWith("Exception:") ? `${friendly} ${detail}` : friendly;
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return "Something went wrong talking to the Dart engine.";
}
