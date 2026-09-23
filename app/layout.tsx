import type { Metadata } from "next";
import { Hind_Siliguri, Lato, Teachers } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { siteConfig } from "@/config/site";
import "@/app/globals.css";

const teachers = Teachers({
  variable: "--font-teachers",
  subsets: ["latin"],
});

const lato = Lato({
  variable: "--font-heading-lato",
  weight: ["400", "700", "900"],
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hindi",
  weight: ["400", "500", "600", "700"],
  subsets: ["bengali"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      className={`${teachers.variable} ${lato.variable} ${hindSiliguri.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
