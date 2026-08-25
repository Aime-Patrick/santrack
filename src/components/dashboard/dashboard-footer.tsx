"use client";

export function DashboardFooter() {
  return (
    <footer className="shrink-0">
      {/* Imigongo pattern strip */}
      <div
        className="w-full h-4 bg-repeat-x bg-center"
        style={{
          backgroundImage: "url('/images/imigongo2.png')",
          backgroundSize: "auto 100%",
        }}
      />
      {/* Copyright */}
      <div className="bg-white py-3 text-center border-t border-border/60">
        <p className="text-[11px] text-faint tracking-wide">
          © 2026 SAN TECH — Powering Rwanda&apos;s Industries
        </p>
      </div>
    </footer>
  );
}
