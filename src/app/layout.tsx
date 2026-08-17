import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes"; // ✅ إضافة
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "فرصة العمر - منصة السحوبات الفاخرة",
  description:
    "اشترِ بطاقتك المرقمة وانتظر السحب العشوائي لتفوز بجوائز قيّمة. سحوبات شفافة وعادلة، جوائز مذهلة في انتظارك.",
  keywords:
    "سحوبات, جوائز, فرصة العمر, بطاقات رقمية, مسابقات, فوز, حظ, سحب عشوائي",
  openGraph: {
    title: "فرصة العمر - منصة السحوبات الفاخرة",
    description: "انضم إلى آلاف المشتركين واربح جوائز قيمة. السحب العشوائي ينتظرك!",
    url: "https://forsa-app-ten.vercel.app",
    siteName: "فرصة العمر",
    images: [
      {
        url: "https://forsa-app-ten.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "فرصة العمر - منصة السحوبات الفاخرة",
      },
    ],
    locale: "ar_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "فرصة العمر - منصة السحوبات الفاخرة",
    description: "اشترِ بطاقتك واربح جوائز قيمة في سحوبات شفافة وعادلة.",
    images: ["https://forsa-app-ten.vercel.app/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://forsa-app-ten.vercel.app",
  },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning> {/* ✅ إضافة suppressHydrationWarning */}
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#f59e0b" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "فرصة العمر",
              url: "https://forsa-app-ten.vercel.app",
              description: "منصة السحوبات الفاخرة - اشترِ بطاقتك واربح جوائز قيمة",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://forsa-app.com/tickets?search={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body style={{ fontFamily: "'Cairo', 'Inter', sans-serif" }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="forsa-theme"
        >
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
