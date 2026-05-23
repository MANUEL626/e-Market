import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { AuthHashBootstrap } from "@/components/auth-hash-bootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indigo Marketplace",
  description: "Manage your online store easily",
  icons: {
    icon: [{ url: "/emall_icon_violet.svg", type: "image/svg+xml" }],
    shortcut: "/emall_icon_violet.svg",
    apple: "/emall_icon_violet.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
      <body className="flex flex-col min-h-full">
        <AuthHashBootstrap />
        {children}
      </body>
    </html>
  );
}
