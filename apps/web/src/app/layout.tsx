import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuickBiz ERP",
  description: "Adapt the ERP to your business, not your business to the ERP.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      {/* `app` opts into the CoolAdmin overlay (app.css scopes every rule
          under body.app). The stylesheet itself only loads on dashboard
          routes, so auth/onboarding pages are unaffected. */}
      <body className="app min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
