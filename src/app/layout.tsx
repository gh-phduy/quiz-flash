import type { Metadata, Viewport } from "next";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import PwaRegister from "@/components/pwa/pwa-register";
import PwaInstallPrompt from "@/components/pwa/pwa-install-prompt";

export const metadata: Metadata = {
  title: "QuizFlash - Spaced Repetition Flashcards",
  description: "Master any subject with flashcards and practice tests.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QuizFlash",
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
          </QueryProvider>
          <PwaRegister />
          <PwaInstallPrompt />
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

