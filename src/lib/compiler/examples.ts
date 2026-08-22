export interface CompilerExample {
  name: string;
  description: string;
  code: string;
  stdin: string;
}

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
