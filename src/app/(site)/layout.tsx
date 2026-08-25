import { LandingNav } from "@/components/landing/landing-nav";
import { FooterSection } from "@/components/landing/footer-section";

/**
 * The public face of the platform: the landing page and the consumer
 * verification flow.
 *
 * A route group rather than a path segment, so these pages share the nav and
 * footer without `(site)` appearing in any URL — `/` and `/verify/TOKEN` are
 * what a consumer scans and what is printed on a label, and neither may move.
 *
 * No top padding here: `LandingNav` is fixed, and each page decides how it
 * meets it. The hero runs its own colour up under the bar deliberately, which
 * a padded wrapper would break with a white band.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <LandingNav />
      {children}
      <FooterSection />
    </div>
  );
}
