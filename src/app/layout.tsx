import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EV Exec | Airport Transfer Calendar",
  description: "Premium airport transfer management for EV Exec operators.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-navy-900 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
