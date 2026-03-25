import { FeatureBentoSection } from "@/components/landing/feature-bento-section";
import { HeroSection } from "@/components/landing/hero-section";
import { MoneyInMotionSection } from "@/components/landing/money-in-motion-section";
import { NeonTickerSection } from "@/components/landing/neon-ticker-section";

export const revalidate = 60;

export default function Home() {
  return (
    <>
      <HeroSection />
      <MoneyInMotionSection />
      <FeatureBentoSection />
      <NeonTickerSection />
    </>
  );
}
