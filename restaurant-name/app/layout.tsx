import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import localFont from 'next/font/local';
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const manrope = Manrope({subsets:['latin'],variable:'--font-sans'});

const Chillax = localFont({
  src: '../public/fonts/Chillax_Complete/Fonts/TTF/Chillax-Variable.ttf', 
  variable: '--font-custom',
});

export const metadata: Metadata = {
  title: "Waiter App",
  description: "Waiter App for restaurants built with Next.js and Tailwind CSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", Chillax.className , manrope.variable)}
    >
      <body className="min-h-full flex flex-col">
        {children}

        <Toaster position="bottom-center"/>
      </body>
    </html>
  );
}
