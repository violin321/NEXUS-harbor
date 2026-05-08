import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { appConfig } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Boot script that respects next-themes stored preference
const themeBootScript = `(()=>{
  try {
    const stored = localStorage.getItem('theme');
    const hour = new Date().getHours();
    const isDark = stored === 'system' ? (hour >= 19 || hour < 7) : stored === 'dark';
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
  } catch(e) {}
})();`;

export const metadata: Metadata = {
  title: `${appConfig.productName} · NEXUS-9`,
  description: "自托管服务入口与状态面板",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          id="theme-boot"
          dangerouslySetInnerHTML={{ __html: themeBootScript }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
