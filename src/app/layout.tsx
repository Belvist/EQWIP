import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/Header";
import CookieConsent from "@/components/CookieConsent";
import SuppressConsole from "@/components/SuppressConsole";
import { ThemeProvider } from "next-themes";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EQWIP - Умный поиск IT-вакансий с искусственным интеллектом",
  description: "Платформа для поиска работы и подбора IT-специалистов с AI-технологиями. Находите идеальные вакансии или кандидатов в сфере IT.",
  keywords: ["EQWIP", "IT вакансии", "поиск работы", "IT специалисты", "AI поиск", "работа программист", "удаленная работа", "IT рекрутинг"],
  authors: [{ name: "EQWIP Team" }],
  openGraph: {
    title: "EQWIP - Умный поиск IT-вакансий",
    description: "Находите работу мечты или идеальных специалистов в сфере IT с помощью AI",
    url: "https://eqwip.ru",
    siteName: "EQWIP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EQWIP - Умный поиск IT-вакансий",
    description: "Находите работу мечты или идеальных специалистов в сфере IT с помощью AI",
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <SuppressConsole />
            <Header />
            <main>
              {children}
            </main>
            <CookieConsent />
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
