import { LandingNav } from "@/components/landing/landing-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { TrustedBySection } from "@/components/landing/trusted-by-section";
import { FooterSection } from "@/components/landing/footer-section";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <LandingNav />
      <HeroSection />
      <TrustedBySection />
      <FooterSection />
    </div>
  );
}
