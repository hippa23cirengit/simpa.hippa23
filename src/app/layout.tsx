import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DialogProvider } from "@/common/components/dialog-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIMPA HIPPA Cirengit",
  description: "Sistem Informasi Manajemen Pengurus & Anggota HIPPA Cirengit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" rel="stylesheet" />
        
        {/* PWA Configurations */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SIMPA" />
        <meta name="theme-color" content="#1A1A1A" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) {
                      console.log('ServiceWorker scope: ', reg.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker failed: ', err);
                    }
                  );
                });
              }
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F8FAFC]">
        <DialogProvider>
          {children}
        </DialogProvider>
      </body>
    </html>
  );
}
