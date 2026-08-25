import { HeroSection } from "@/components/landing/hero-section";
import { TrustedBySection } from "@/components/landing/trusted-by-section";

/** The landing page. Nav and footer come from the `(site)` layout. */
export default function Home() {
  return (
    <>
      <HeroSection />
      <TrustedBySection />
    </>
  );
}
