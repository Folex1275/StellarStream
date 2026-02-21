import type { Metadata } from "next";
import { Lato, Poppins } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/toast-provider";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "StellarStream",
  description:
    "Non-custodial, second-by-second asset streaming protocol built on Soroban. Money as a Stream.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lato.variable} ${poppins.variable} antialiased flex flex-col min-h-screen`}>
        <Nav />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <ToastProvider />
      </body>
    </html>
  );
}
