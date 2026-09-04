import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PipeForge Control Center",
  description: "Incremental Data Pipeline Control Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
