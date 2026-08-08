import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "DevTools — JSON & Base64 Utilities",
  description:
    "Privacy-first developer tools for JSON formatting, minification, validation, and Base64 encode/decode with automatic JSON detection. Everything runs locally in your browser.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full `}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col antialiased">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("devtools-theme");var d=t==="light"?"":"dark";document.documentElement.classList.toggle("dark",d==="dark")}catch(e){document.documentElement.classList.add("dark")}})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}