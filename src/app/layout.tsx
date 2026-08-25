import type { Metadata } from "next";
import { Geist_Mono, Exo } from "next/font/google";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";

const exo = Exo({
  weight: ["500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-exo",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "San Track",
  description: "Product traceability platform",
  icons: {
    icon: "/images/logo-symbol.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${exo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <I18nProvider locale={locale} messages={messages}>
          <QueryProvider>
            <NotificationProvider>
              <div className="flex-1 flex flex-col min-h-0">{children}</div>
              {/* Global Imigongo pattern strip at bottom */}
              <div
                className="w-full h-2.5 shrink-0 bg-repeat-x bg-center pointer-events-none"
                style={{
                  backgroundImage: "url('/images/imigongo2.png')",
                  backgroundSize: "auto 100%",
                }}
              />
            </NotificationProvider>
          </QueryProvider>
          <Toaster position="top-right" richColors />
        </I18nProvider>
      </body>
    </html>
  );
}
