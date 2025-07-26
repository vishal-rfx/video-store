import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderAuth from "./_components/sessionProviderAuth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "VideoStore",
  description: "VideoStore is a platform for storing and sharing videos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <SessionProviderAuth>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
      </SessionProviderAuth>

    </html>
  );
}
