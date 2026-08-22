import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThankYouToast } from "@/components/ui/thank-you-toast";
import { SITE_NAME, SITE_URL, serializeJsonLd, webSiteJsonLd } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DataFormatter — Online Developer Data Tools",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Format, validate, decode, convert and inspect developer data directly in your browser. JSON, Base64, JWT, URL, hash tools and more — private by design, nothing is uploaded.",
  keywords: [
    "json formatter",
    "json pretty print",
    "json validator",
    "json minifier",
    "base64 encoder",
    "base64 decoder",
    "jwt decoder",
    "url encoder",
    "url decoder",
    "hash generator",
    "base64 to json",
    "json to base64",
    "online developer tools",
    "dataformatter",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
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
    siteName: SITE_NAME,
    locale: "en_US",
    title: "DataFormatter — Online Developer Data Tools",
    description:
      "Format, validate, decode and inspect developer data directly in your browser. JSON, Base64, JWT, URL and hash tools — private by design.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DataFormatter — Online Developer Data Tools",
    description:
      "Format, validate, decode and inspect developer data directly in your browser. Private by design.",
  },
};

const applicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: `${SITE_NAME} — JSON Formatter, Minifier & Base64 Encoder/Decoder`,
  url: SITE_URL,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript. All processing happens locally.",
  description:
    "Free online JSON formatter, validator and minifier, plus Base64 encode/decode, URL tools, hash generators and JWT decoding with automatic format detection. Privacy-first: all processing happens in the browser and nothing is uploaded.",
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
    "URL encoding/decoding and parsing",
    "MD5 / SHA-1 / SHA-2 / SHA-3 hash generation",
    "Split view input/output editor",
    "100% client-side processing for privacy",
  ],
};

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full `}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col antialiased">
        {children}
        <ThankYouToast />
        <JsonLd data={applicationJsonLd} />
        <JsonLd data={webSiteJsonLd()} />
      </body>
    </html>
  );
}
