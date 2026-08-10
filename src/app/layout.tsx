import type { Metadata, Viewport } from "next";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import PwaRegister from "@/components/pwa/pwa-register";
import PwaInstallPrompt from "@/components/pwa/pwa-install-prompt";
import TimezoneSetter from "@/components/timezone-setter";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quizflash.click';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "QuizFlash - Học Từ Vựng Tiếng Anh & Flashcard Spaced Repetition",
    template: "%s | QuizFlash",
  },
  description: "QuizFlash - Ứng dụng học từ vựng tiếng Anh theo phương pháp lặp lại ngắt quãng (Spaced Repetition SM-2), bộ thẻ Oxford 3000, game ghép từ, luyện nghe và phát âm miễn phí.",
  keywords: [
    "QuizFlash",
    "flashcards tiếng anh",
    "học từ vựng lặp lại ngắt quãng",
    "spaced repetition app",
    "thẻ ghi nhớ oxford 3000",
    "học từ vựng ielts",
    "flashcard online miễn phí",
    "game ghép từ vựng",
    "luyện phát âm tiếng anh",
  ],
  authors: [{ name: "QuizFlash Team" }],
  creator: "QuizFlash",
  publisher: "QuizFlash",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "QuizFlash - Học Từ Vựng Tiếng Anh & Flashcard Spaced Repetition",
    description: "Ghi nhớ từ vựng tiếng Anh x5 lần với phương pháp Spaced Repetition (SM-2), flashcards tương tác, phát âm chuẩn và các trò chơi thú vị.",
    url: siteUrl,
    siteName: "QuizFlash",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "QuizFlash - Spaced Repetition Learning App",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuizFlash - Học Từ Vựng Tiếng Anh & Flashcard Spaced Repetition",
    description: "Ghi nhớ từ vựng tiếng Anh x5 lần với phương pháp Spaced Repetition (SM-2), flashcards tương tác & trò chơi ghép từ.",
    images: ["/icons/icon-512.png"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QuizFlash",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "QuizFlash",
  "url": siteUrl,
  "description": "Ứng dụng học từ vựng tiếng Anh bằng Flashcard lặp lại ngắt quãng (Spaced Repetition), tích hợp bộ từ vựng Oxford và các trò chơi học tập tương tác.",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "All",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "VND"
  },
  "inLanguage": "vi"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="antialiased" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
          <TimezoneSetter />
          <PwaRegister />
          <PwaInstallPrompt />
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
