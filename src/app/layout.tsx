import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luxe CRM",
  description: "Internal CRM for Luxe Landscaping Limited",
  appleWebApp: {
    capable: true,
    title: "Luxe CRM",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  themeColor: "#101010",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body className="antialiased">{children}</body>
    </html>
  );
}
