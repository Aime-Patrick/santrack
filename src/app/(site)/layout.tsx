import { LandingNav } from "@/components/landing/landing-nav";
import { FooterSection } from "@/components/landing/footer-section";

/**
 * Public site shell: fixed header + page content + footer.
 *
 * Route group `(site)` does not appear in URLs — `/`, `/verify`, `/verify/TOKEN`
 * stay stable for labels and consumer scans.
 *
 * Nav is fixed (`h-16`). Pages that need clearance (verify, about hero, etc.)
 * add their own top padding; the landing hero deliberately paints under the bar.
 * `flex-1` on the content slot keeps short pages from leaving a gap above the
 * footer without each page inventing its own full-viewport height.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f7f9fc]">
      <LandingNav />
      <div className="flex flex-1 flex-col">{children}</div>
      <FooterSection />
    </div>
  );
}
