"use client";

import React from "react";

export interface FeatureItem {
  id: string;
  title: string;
  sub: string;
  icon: React.ReactNode;
}

export function FeaturesStrip() {
  const features: FeatureItem[] = [
    {
      id: "traceability",
      title: "Digital Product Traceability",
      sub: "Track every product from origin to consumer",
      icon: (
        <div className="size-8 rounded-full bg-[#0062cc] text-white flex items-center justify-center shrink-0 shadow-sm">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7.5 4.27 9 5.15" />
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        </div>
      ),
    },
    {
      id: "inventory",
      title: "Inventory Management",
      sub: "Real-time stock visibility and smart control",
      icon: (
        <div className="size-8 rounded-xl bg-emerald-50 text-[#00953c] flex items-center justify-center shrink-0">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
            <path d="m17 13.5-5 2.5-5-2.5" />
          </svg>
        </div>
      ),
    },
    {
      id: "manufacturing",
      title: "Manufacturing Excellence",
      sub: "Plan, produce and optimize with precision",
      icon: (
        <div className="size-8 rounded-xl bg-amber-50 text-[#fac600] flex items-center justify-center shrink-0">
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 21V10l5 3V7l5 3V4h6v17H4zm2-2h12V6h-2v4.25L11 8v4.25L6 9.5V19zm3-3h2v2H9v-2zm4 0h2v2h-2v-2z" />
          </svg>
        </div>
      ),
    },
    {
      id: "logistics",
      title: "Logistics & Distribution",
      sub: "Efficient delivery and route optimization",
      icon: (
        <div className="size-8 rounded-xl bg-blue-50 text-[#0062cc] flex items-center justify-center shrink-0">
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 18.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm-12 0a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zM20 8h-3V4H3v11h2a3.5 3.5 0 0 0 7 0h3a3.5 3.5 0 0 0 7 0h1v-4l-3-3zM5 6h10v7H5V6zm14 3.2 1.8 1.8H17V9.2h2z" />
          </svg>
        </div>
      ),
    },
    {
      id: "finance",
      title: "Finance Management",
      sub: "Full financial control with insights and reports",
      icon: (
        <div className="size-8 rounded-full bg-[#00953c] text-white flex items-center justify-center shrink-0 shadow-sm">
          <span className="font-extrabold text-base leading-none">$</span>
        </div>
      ),
    },
    {
      id: "payroll",
      title: "Payroll & HR Management",
      sub: "Manage your people and payroll seamlessly",
      icon: (
        <div className="size-8 rounded-xl bg-amber-50 text-[#fac600] flex items-center justify-center shrink-0">
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
        </div>
      ),
    },
    {
      id: "lifecycle",
      title: "Product Lifecycle Management",
      sub: "Manage the entire lifecycle from concept to end of life",
      icon: (
        <div className="size-8 rounded-xl bg-blue-50 text-[#0062cc] flex items-center justify-center shrink-0">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-[0_12px_45px_rgba(2,32,71,0.08)] overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 divide-y lg:divide-y-0 sm:divide-x divide-slate-100">
        {features.map((feat) => (
          <div
            key={feat.id}
            className="group flex items-start gap-2.5 p-2.5 xl:p-3 hover:bg-slate-50/70 transition-colors"
          >
            <div className="transition-transform group-hover:scale-105">
              {feat.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-[11.5px] font-bold text-slate-900 leading-snug">
                {feat.title}
              </h4>
              <p className="mt-0.5 text-[10px] text-slate-500 leading-snug">
                {feat.sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
