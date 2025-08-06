import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto, Orbitron, Quantico, Poppins, Foldit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ['400'],
  subsets: ["latin"],
});

const foldit = Foldit({
  variable: "--font-foldit",
  weight: ['400'],
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  display: 'swap'
});


const roboto = Roboto({
  variable: "--font-roboto",
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const quantico = Quantico({
  variable: "--font-quantico",
  weight: ['400'],
  subsets: ["latin"],
  display: 'swap'
});

export const metadata: Metadata = {
  title: "Pod",
  description: "A simple podcast app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} ${orbitron.variable} ${quantico.variable} ${poppins.variable} ${foldit.variable} antialiased`}
      >
        {children}
        <Toaster richColors />
        <Analytics />
      </body>
    </html>
  );
}