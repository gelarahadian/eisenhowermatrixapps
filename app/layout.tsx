import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextAuthSessionProvider from "@/components/SessionProvider";

/* Inter dipilih karena kelegaan bentuknya menenangkan dan netral, cocok
   dengan prinsip "Tenang & Profesional" di DESIGN.md; fallback system-ui. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eisenhower Todo",
  description: "Prioritize what matters",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="antialiased">
        <NextAuthSessionProvider>
            {children}
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
