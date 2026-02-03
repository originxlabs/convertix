import { Cormorant_Garamond, Manrope } from "next/font/google";

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
      <body
        className={`min-h-screen bg-obsidian-50 font-body text-ink-950 ${display.variable} ${body.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
