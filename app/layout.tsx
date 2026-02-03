import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: "Handld Command Center",
  description: "The operating center for Handld Home Services",
  icons: {
    icon: "/icon.png",
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
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
