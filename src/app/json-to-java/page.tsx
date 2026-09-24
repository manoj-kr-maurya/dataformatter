import type { Metadata } from "next";
import { ToolLandingPage } from "@/components/seo/tool-landing";
import { EmbeddedWorkspace } from "@/components/seo/embedded-workspace";
import {
  Section,
  Bullets,
  Faq,
  FaqJsonLd,
  Example,
  QuickStart,
  UseCases,
  Troubleshooting,
  ProTips,
} from "@/components/seo/content-blocks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("/json-to-java");

const faqs = [
  {
    q: "What does JSON to Java generate?",
    a: "A POJO-style class definition: private fields with inferred Java types, a default constructor, and getter/setter pairs. Nested JSON objects and arrays become nested static classes and List<T> fields respectively.",
  },
  {
    q: "Which Java types are inferred?",
    a: "Strings become String, booleans become Boolean, and numbers become Long when they are integers or Double when they have a fractional part — the types you'd actually choose in a POJO.",
  },
  {
    q: "How are arrays and nested objects handled?",
    a: "An array becomes a List<…> whose element type is inferred from the first item — a nested object array becomes List<NestedClass>. Objects nested inside the root are emitted as static nested classes on the parent, so the file stays self-contained.",
  },
  {
    q: "What happens to keys that collide with Java keywords?",
    a: "They are renamed safely: a field named class becomes ClassField and a class named matching a keyword gets a Value suffix, so the generated code always compiles.",
  },
  {
    q: "Does my JSON leave the browser?",
    a: "No. The conversion runs entirely in your browser — nothing you paste is uploaded, which makes it safe to model real API payloads.",
  },
  {
    q: "What about more languages?",
    a: "JSON to Code generates TypeScript, C#, Go, Python, Swift, Kotlin and Dart from the same sample, and the JSON Converters hub covers XML, CSV, YAML and Excel targets.",
  },
] as const;

export default function JsonToJavaPage() {
  return (
    <ToolLandingPage
      path="/json-to-java"
      summary="Generate Java POJO classes from JSON instantly. Paste an object above and get private fields with inferred types, constructors and getters/setters — nested objects and arrays mapped to nested classes and List<T>. Local and free."
    >
      <EmbeddedWorkspace mode="JSON_TO_JAVA" label="JSON to Java generator editor" />
      <QuickStart
        steps={[
          "Paste a JSON object (for example an example API response) into the editor above.",
          "A Root class is generated: one private field per key, typed to match the value.",
          "Copy the class, or Download it as a .java file and drop it into your project.",
          "Nested objects arrive as static nested classes — import nothing extra.",
        ]}
      />
      <FaqJsonLd items={faqs} />

      <Section title="Type mapping">
        <Bullets
          items={[
            "Strings map to String, booleans map to Boolean, and integers map to Long.",
            "Floating-point numbers map to Double, and null maps to a wide Object.",
            "Arrays map to List<T>; arrays of objects map to List<NestedClass>.",
            "Objects nested in the root map to static nested classes so one file compiles standalone.",
            "Java keywords are escaped (class → ClassField) so output always compiles.",
          ]}
        />
      </Section>

      <Section title="JSON to Java example">
        <Example
          input='{ "name": "Ada", "active": true }'
          output={`public class Root {
  
    private String name;
    private Boolean active;
  
    public Root() {
    }
  
    public String getName() {
      return name;
    }
  
    public void setName(String name) {
      this.name = name;
    }
  
    public Boolean getActive() {
      return active;
    }
  
    public void setActive(Boolean active) {
      this.active = active;
    }
}`}
          inputLabel="JSON input"
          outputLabel="Generated Java"
        />
      </Section>

      <Section title="Handy for">
        <UseCases
          cases={[
            {
              title: "Modeling an API response",
              body: "Paste a real response sample and get the DTO skeleton instantly — fields, types and nested classes exactly matching the payload shape.",
            },
            {
              title: "Bootstrapping config objects",
              body: "JSON-based config (service descriptors, feature flags) becomes typed Java objects without hand-writing the mapping layer.",
            },
            {
              title: "Migrating between service contracts",
              body: "When a legacy endpoint's JSON drifts from your types, regenerate the class and diff it against the current one with JSON Diff.",
            },
          ]}
        />
      </Section>

      <Section title="Java surprises">
        <Troubleshooting
          items={[
            {
              error: "JSON to Java requires a JSON object to map onto a class.",
              cause: "You pasted a top-level array or a scalar. A Java class maps onto one object, not a list or a value.",
              fix: "Wrap the object: convert the list you care about by pasting the whole response object, or pick a representative item and paste it directly.",
            },
            {
              error: "Invalid JSON: Unexpected token '<', \"<html>…\" is not valid JSON",
              cause: "You pasted HTML (often an error page) instead of JSON — the body started with a tag like <html>.",
              fix: "Confirm the request actually returned JSON first; the API Client shows status codes and headers so you can spot redirects or 500 pages.",
            },
            {
              error: "A field name came out different from the JSON key",
              cause: "Keys with invalid identifier characters or Java keywords were renamed so the generated class compiles.",
              fix: "That's intentional. If you need the exact JSON name, add an annotation (for example @JsonProperty) in your own code.",
            },
          ]}
        />
      </Section>

      <Section title="Pro tips">
        <ProTips
          tips={[
            "Keep the sample small and flat for the cleanest class — deep nesting produces many nested classes.",
            "Validate the sample first with the JSON Validator so type inference runs on well-formed input.",
            "Generate the same sample in TypeScript or Go with JSON to Code to keep multi-language clients in sync.",
            "Nothing you paste here is sent anywhere, so real payloads are safe to model.",
          ]}
        />
      </Section>

      <Faq items={faqs} />
    </ToolLandingPage>
  );
}