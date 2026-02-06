import { Cormorant_Garamond, Manrope } from "next/font/google";

import ApiAuthBridge from "@/components/ApiAuthBridge";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display"
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body"
});

export const metadata = {
  title: "CONVERTIX — Premium PDF & Image Studio",
  description: "Apple-level premium PDF editing, image resizing, and image editing in one studio.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Convertix',
              operatingSystem: 'Web, Windows, macOS',
              applicationCategory: 'BusinessApplication',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              url: 'https://convertix.app',
              description: 'AI-ready PDF and image studio with enterprise-grade workflows',
              creator: { '@type': 'Organization', name: 'Convertix' }
            })
          }}
        />
</head>
      <body
        className={`min-h-screen bg-obsidian-50 font-body text-ink-950 ${display.variable} ${body.variable}`}
      >
        <ApiAuthBridge />
        {children}
      </body>
    </html>
  );
}
