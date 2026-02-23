import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resident Event Ideas",
  description: "Share and discover community event ideas",
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
