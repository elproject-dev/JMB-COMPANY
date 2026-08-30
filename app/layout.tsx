import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toast";

const outfit = Outfit({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jaya Makmur Bersama",
  description: "Aplikasi pencatatan Jaya Makmur Bersama",
};

import { ThemeProvider } from "@/components/theme-provider";
import { BottomNavigation } from "@/components/bottom-navigation";
import { DraggableFab } from "@/components/draggable-fab";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, jetbrainsMono.variable, "font-sans", outfit.variable)}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedColor = localStorage.getItem("app-primary-color");
                if (savedColor) {
                  document.documentElement.style.setProperty("--primary", savedColor);
                  document.documentElement.style.setProperty("--sidebar-primary", savedColor);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <div className="pb-16 md:pb-0 flex flex-1 flex-col h-full">
              {children}
            </div>
            <ToastViewport />
            <PwaInstallPrompt />
          </ToastProvider>
          <BottomNavigation />
          <DraggableFab />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
