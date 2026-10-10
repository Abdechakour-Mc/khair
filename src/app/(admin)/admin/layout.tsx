import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Outfit } from "next/font/google";
import "../../globals.css";

const body = IBM_Plex_Sans_Arabic({
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const display = Outfit({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Khair admin",
  // The Admin view is private; keep it out of search results entirely.
  robots: { index: false, follow: false },
};

/**
 * The Admin view's own root layout. It is English only and carries no
 * language switcher: it has one reader, who reads English, and translating it
 * would double the string count for no reach.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${body.variable} ${display.variable}`}>
      <body>
        <div className="shell shell-admin">{children}</div>
      </body>
    </html>
  );
}
