import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "FORGE — AI-Powered SDE Placement OS",
  description:
    "Transform ambition into achievement. AI-powered placement preparation for future software engineers.",
};

export const viewport: Viewport = {
  themeColor: "#09090B",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-text-primary antialiased font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
