import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: "Handld Command Center",
  description: "The operating center for Handld Home Services",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Handld Command Center",
    description: "The operating center for Handld Home Services",
    images: ["/logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Handld Command Center",
    description: "The operating center for Handld Home Services",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
