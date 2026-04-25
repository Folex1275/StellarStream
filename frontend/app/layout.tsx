import type { Metadata } from "next";
import { Lato, Poppins } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/toast-provider";
import { WalletProvider } from "@/lib/wallet-context";
import { StellarProvider } from "@/lib/providers/StellarProvider";
import { ProtocolStatusProvider } from "@/lib/use-protocol-status";
import { EmergencyBanner } from "@/components/emergency-banner";
import ErrorTracker from "@/components/error-tracker";
import OnboardingTour from '@/components/OnboardingTour';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';

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
        <WalletProvider>
          <StellarProvider>
            <ProtocolStatusProvider>
              {/* High-visibility emergency banner — rendered above everything */}
              <EmergencyBanner />
              <Nav />
              
              <main className="flex-1">
                {children}
              </main>

              <Footer />
              <ToastProvider />

              {/* Wave 3 Onboarding Tour - Shows only for first-time users */}
              <OnboardingTour />
              <ServiceWorkerRegistrar />
            </ProtocolStatusProvider>
          </StellarProvider>
        </WalletProvider>
      </body>
    </html>
  );
}