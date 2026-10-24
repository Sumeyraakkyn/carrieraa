import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import DarkModeSync from "@/components/DarkModeSync";
import AchievementToast from "@/components/AchievementToast";
import AchievementTracker from "@/components/AchievementTracker";

export const metadata: Metadata = {
  title: "Carriera",
  description: "Carriera - Kariyer Gelişim Platformu",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        {/* Tüm sayfa CSS'leri — FOUC önlemek için head'de yüklenir */}
        <link rel="stylesheet" href="/styles/anasayfa.css" />
      </head>
      <body>
        {/*
          ThemeProvider: next-themes ile dark/light mode yönetimi.
          - storageKey: localStorage'daki anahtar (eski 'darkMode' yerine 'theme')
          - attribute: HTML elementine 'class' olarak uygulanır
          - defaultTheme: İlk açılışta sistem tercihini kullanır
          Hydration mismatch olmaması için suppressHydrationWarning <html>'ye eklendi.
        */}
        <ThemeProvider
          attribute="class"
          storageKey="theme"
          defaultTheme="system"
          enableSystem
        >
          <DarkModeSync />
          <AchievementToast />
          <AchievementTracker />
          {children}
          {/* Global toast/bildirim sistemi — tüm sayfalardan toast() çağrısıyla kullanılabilir */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
                fontSize: '0.9rem',
              },
              success: {
                style: { background: '#1a7a4a', color: '#fff' },
                iconTheme: { primary: '#fff', secondary: '#1a7a4a' },
              },
              error: {
                style: { background: '#c0392b', color: '#fff' },
                iconTheme: { primary: '#fff', secondary: '#c0392b' },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
