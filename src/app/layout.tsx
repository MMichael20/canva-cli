import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Hire | AI Recruitment Posters",
  description: "Create professional AI recruitment posters for the Israeli market",
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
        {/* No nav — brand is in the hero section */}
        <main className="relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
