import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthHashBootstrap } from "@/components/auth-hash-bootstrap";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Indigo Marketplace",
  description: "Manage your online store easily",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex flex-col min-h-full">
        <AuthHashBootstrap />
        {children}
      </body>
    </html>
  );
}
