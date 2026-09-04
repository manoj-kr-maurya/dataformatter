/**
 * In-browser TypeScript → JavaScript transpilation via the `typescript`
 * package (already a project dependency). The package is large, so it is
 * imported lazily: nothing loads until a TypeScript program actually runs.
 *
 * transpileModule is deliberately type-CHECK-free (like ts-node's fast path
 * and the official TS Playground's "transpile only" mode) — type errors do
 * not block execution, which is what people expect from a quick playground.
 */

export async function transpileTypeScript(source: string): Promise<string> {
  const ts = await import("typescript");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      // Single-file playground: no module rewrites. `import` statements stay
      // as-is and surface as a clear syntax error in the runner.
      module: ts.ModuleKind.None,
    },
    reportDiagnostics: false,
  });
  return result.outputText;
}
