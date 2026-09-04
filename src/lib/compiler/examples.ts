export interface CompilerExample {
  name: string;
  description: string;
  code: string;
  stdin: string;
}

/** Languages available in the compiler playground. */
export type CompilerLanguage = "dart" | "js" | "ts";

const HELLO = `void main() {
  print('Hello from Dart, running entirely in your browser!');
}
`;

const LOOPS_AND_COLLECTIONS = `void main() {
  final squares = [for (var i = 1; i <= 10; i++) i * i];
  print('Squares: $squares');

  var sum = squares.reduce((a, b) => a + b);
  print('Sum of squares 1..10 = $sum');
}
`;

const STDIN_ECHO = `// Reads lines from the STDIN box below the output pane.
// The bridge exposes each line through a JS function, which we
// bind here with dart:js_interop.
import 'dart:js_interop';

@JS('dartpadReadLine')
external String? dartpadReadLine();

void main() {
  while (true) {
    final line = dartpadReadLine();
    if (line == null) break; // no more input
    print('you typed: \$line');
  }
  print('stdin closed — bye!');
}
`;

const CLASSES = `class Shape {
  final String name;
  Shape(this.name);
  double area() => 0;
  @override
  String toString() => '$name (area \${area().toStringAsFixed(2)})';
}

class Circle extends Shape {
  final double radius;
  Circle(this.radius) : super('Circle');
  @override
  double area() => 3.14159 * radius * radius;
}

class Square extends Shape {
  final double side;
  Square(this.side) : super('Square');
  @override
  double area() => side * side;
}

void main() {
  final shapes = <Shape>[Circle(2), Square(3)];
  for (final shape in shapes) {
    print(shape);
  }
}
`;

const ASYNC = `import 'dart:async';

Future<String> fetchGreeting(String name) async {
  await Future.delayed(const Duration(milliseconds: 300));
  return 'Hello, $name!';
}

void main() async {
  final greeting = await fetchGreeting('async Dart');
  print(greeting);
  print('done after a real wall-clock wait');
}
`;

const FIZZBUZZ = `void main() {
  for (var i = 1; i <= 20; i++) {
    if (i % 15 == 0) {
      print('FizzBuzz');
    } else if (i % 3 == 0) {
      print('Fizz');
    } else if (i % 5 == 0) {
      print('Buzz');
    } else {
      print(i);
    }
  }
}
`;

export const COMPILER_EXAMPLES: CompilerExample[] = [
  { name: "Hello, world", description: "The classic one-liner", code: HELLO, stdin: "" },
  { name: "FizzBuzz", description: "Loops & branching", code: FIZZBUZZ, stdin: "" },
  {
    name: "Collections",
    description: "List comprehensions & reduce",
    code: LOOPS_AND_COLLECTIONS,
    stdin: "",
  },
  { name: "Classes", description: "Inheritance & overrides", code: CLASSES, stdin: "" },
  { name: "Async/await", description: "Futures with real delays", code: ASYNC, stdin: "" },
  {
    name: "stdin echo",
    description: "Read lines from the STDIN box",
    code: STDIN_ECHO,
    stdin: "first line\nsecond line\nthird line\n",
  },
];

export const DEFAULT_EXAMPLE = COMPILER_EXAMPLES[0];

// ---------------------------------------------------------------------------
// JavaScript examples — executed directly in a sandboxed Web Worker.
// ---------------------------------------------------------------------------

const JS_HELLO = `const name = 'JavaScript';
console.log('Hello from ' + name + ', running entirely in your browser!');
console.log({ runtime: 'Web Worker', server: false });
`;

const JS_FIZZBUZZ = `for (let i = 1; i <= 20; i++) {
  if (i % 15 === 0) console.log('FizzBuzz');
  else if (i % 3 === 0) console.log('Fizz');
  else if (i % 5 === 0) console.log('Buzz');
  else console.log(i);
}
`;

const JS_ASYNC = `const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('fetching a fake response…');
  await wait(300);
  console.log('done after a real wall-clock wait');
  // Top-level await works too:
  return 'ok';
}

await main();
`;

const JS_STDIN = `// Reads lines from the STDIN box below the output pane.
// readLine() returns the next line, or null when input is exhausted.
let line;
while ((line = readLine()) !== null) {
  console.log('you typed: ' + line);
}
console.log('stdin closed — bye!');
`;

export const JS_EXAMPLES: CompilerExample[] = [
  { name: "Hello, world", description: "Objects & template output", code: JS_HELLO, stdin: "" },
  { name: "FizzBuzz", description: "Loops & branching", code: JS_FIZZBUZZ, stdin: "" },
  { name: "Async/await", description: "Promises with real delays", code: JS_ASYNC, stdin: "" },
  {
    name: "stdin echo",
    description: "Read lines from the STDIN box",
    code: JS_STDIN,
    stdin: "first line\nsecond line\nthird line\n",
  },
];

// ---------------------------------------------------------------------------
// TypeScript examples — transpiled in-browser (type-check-free), then run in
// the same worker. Types are erased; they exist for editor clarity.
// ---------------------------------------------------------------------------

const TS_HELLO = `interface Greeting {
  audience: string;
  excited: boolean;
}

function greet(greeting: Greeting): string {
  const mark = greeting.excited ? '!' : '.';
  return \`Hello \${greeting.audience}\${mark}\`;
}

console.log(greet({ audience: 'TypeScript', excited: true }));
console.log([1, 2, 3].map((n: number): number => n * n));
`;

const TS_GENERICS = `type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function parse<T>(input: string, cast: (raw: string) => T): Result<T> {
  try {
    return { ok: true, value: cast(input) };
  } catch {
    return { ok: false, error: \`could not parse: \${input}\` };
  }
}

const numbers = ['1', '2', 'oops'].map((s) => parse(s, Number.parseInt));
for (const result of numbers) {
  if (result.ok) console.log('parsed:', result.value);
  else console.log('failed —', result.error);
}
`;

const TS_STDIN = `// readLine() is available in TypeScript programs too.
while (true) {
  const line: string | null = readLine();
  if (line === null) break;
  console.log('you typed:', line.toUpperCase());
}
console.log('done.');
`;

export const TS_EXAMPLES: CompilerExample[] = [
  { name: "Hello, world", description: "Interfaces & type erasure", code: TS_HELLO, stdin: "" },
  { name: "Generics", description: "Union results & casts", code: TS_GENERICS, stdin: "" },
  {
    name: "stdin echo",
    description: "Read lines, upper-cased",
    code: TS_STDIN,
    stdin: "first line\nsecond line\n",
  },
];

export const COMPILER_EXAMPLES_BY_LANGUAGE: Record<CompilerLanguage, CompilerExample[]> = {
  dart: COMPILER_EXAMPLES,
  js: JS_EXAMPLES,
  ts: TS_EXAMPLES,
};

/** First-run program per language. */
export const DEFAULT_EXAMPLE_BY_LANGUAGE: Record<CompilerLanguage, CompilerExample> = {
  dart: DEFAULT_EXAMPLE,
  js: JS_EXAMPLES[0],
  ts: TS_EXAMPLES[0],
};
