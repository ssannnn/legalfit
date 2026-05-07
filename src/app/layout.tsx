import type { Metadata } from "next";

import "./styles.css";

export const metadata: Metadata = {
  title: "legalfit",
  description: "Anden Lead Inbox"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
