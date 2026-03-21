import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "פוסטר מייקר | יצירת פוסטרים מקצועיים לגיוס",
  description: "כלי חכם ליצירת פוסטרים מקצועיים לגיוס עובדים — מותאם לשוק הישראלי",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className="antialiased min-h-screen">
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />
        <nav className="relative z-10 border-b border-white/[0.06] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg"
                style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}>
                <i className="fa-solid fa-wand-magic-sparkles" />
              </div>
              <span className="text-xl font-bold">פוסטר מייקר</span>
            </a>
            <div className="flex items-center gap-4 text-sm text-white/40">
              <span>יצירת פוסטרים לגיוס</span>
            </div>
          </div>
        </nav>
        <main className="relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
