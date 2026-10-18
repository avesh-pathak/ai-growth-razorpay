import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { ThemeProvider } from "@/lib/theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConditionalFooter } from "@/components/ConditionalFooter";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SlashCheckout — AI makes the sale. You set the limits.",
  description:
    "See AI agents sell and buy within spending limits and pricing rules you control. Explore the SlashCheckout test-mode demo; no real money moves.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Pre-paint theme sync — applies stored dark theme before first paint (no flash, no hydration mismatch) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('slashcheckout-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
        <ThemeProvider>
          <TooltipProvider>
            <CartProvider>
              <Header />
              <main className="flex flex-1 flex-col">{children}</main>
              <ConditionalFooter>
                <Footer />
              </ConditionalFooter>
              <Toaster />
            </CartProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
