import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://www.dataformatter.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "JSON Formatter & Base64 Encoder / Decoder – Free Online Dev Tool",
    template: "%s | DataFormatter",
  },
  description:
    "Free online JSON formatter, validator, and minifier plus a Base64 encoder/decoder with automatic format detection. Decode JWT tokens too. 100% private — all processing runs locally in your browser.",
  keywords: [
    "json formatter",
    "json pretty print",
    "json validator",
    "json minifier",
    "base64 encoder",
    "base64 decoder",
    "jwt decoder",
    "base64 to json",
    "json to base64",
    "online developer tools",
    "free json tools",
  ],
  authors: [{ name: "DataFormatter" }],
  creator: "DataFormatter",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "DataFormatter",
    locale: "en_US",
    title: "JSON Formatter & Base64 Encoder / Decoder – Free Online Dev Tool",
    description:
      "Free online JSON formatter, validator, and minifier plus a Base64 encoder/decoder with automatic format detection. 100% private — nothing leaves your browser.",
  },
  twitter: {
    card: "summary",
    title: "JSON Formatter & Base64 Encoder / Decoder – Free Online Dev Tool",
    description:
      "Free online JSON formatter, validator, and minifier plus a Base64 encoder/decoder with automatic detection. 100% private.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "DataFormatter – JSON Formatter, Minifier & Base64 Encoder/Decoder",
  url: SITE_URL,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript. All processing happens locally.",
  description:
    "Free online JSON formatter, validator and minifier, plus Base64 encode/decode and JWT decoding with automatic format detection. Privacy-first: all processing happens in the browser and nothing is uploaded.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Automatic format detection (JSON, Base64, JWT)",
    "JSON pretty-printing and validation",
    "JSON minification",
    "Base64 encode and decode (with embedded JSON detection)",
    "JWT decode of header and payload",
    "Split view input/output editor",
    "100% client-side processing for privacy",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full `}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col antialiased">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}