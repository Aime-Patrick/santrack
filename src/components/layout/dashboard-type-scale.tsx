"use client";

import { useEffect } from "react";

/** Raises rem-based type (text-sm, text-xs, headings) for the signed-in app. */
export function DashboardTypeScale() {
  useEffect(() => {
    document.documentElement.classList.add("dashboard-ui");
    return () => document.documentElement.classList.remove("dashboard-ui");
  }, []);
  return null;
}
