import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { absoluteUrl } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl()),
  title: {
    default: "AI Pulse - AI News Dashboard",
    template: "%s | AI Pulse"
  },
  description:
    "OpenAI, Anthropic, Google, Meta, Hugging Face and global AI news summarized in Japanese.",
  openGraph: {
    title: "AI Pulse",
    description: "AI news automatically collected from RSS and summarized in Japanese.",
    url: absoluteUrl(),
    siteName: "AI Pulse",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Pulse",
    description: "Global AI news, summarized in Japanese."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
