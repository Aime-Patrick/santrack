"use client";

import React from "react";
import {
  LayoutDashboard,
  Package,
  Layers,
  Factory,
  Truck,
  DollarSign,
  Users,
  BarChart3,
  Settings,
  Search,
  Bell,
  ChevronDown,
  TrendingUp,
  ClipboardList,
  MoreHorizontal,
  Wifi,
  Battery,
  Signal,
} from "lucide-react";

const RECENT = [
  { label: "New Purchase Order", ref: "PO#2026-865", status: "Pending", color: "text-amber-500" },
  { label: "Stock Received",     ref: "INV#2026-078", status: "Done",    color: "text-emerald-500" },
  { label: "Sales Order",        ref: "SO#2026-723",  status: "Active",  color: "text-blue-500" },
];

export function DashboardMockup() {
  return (
    /* Outer wrapper — reduced max-w vs before */
    <div className="relative w-full max-w-[400px] lg:max-w-[420px] xl:max-w-[440px] mx-auto select-none">

      {/* ── LAPTOP MOCKUP ── */}
      <div className="relative w-full drop-shadow-[0_16px_44px_rgba(0,0,0,0.38)]">

        {/* Screen Bezel */}
        <div className="relative mx-auto w-[93%] rounded-t-[13px] bg-[#1a1c20] p-[5px] pb-0
                        shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
          {/* Camera */}
          <div className="absolute top-[2.5px] left-1/2 -translate-x-1/2">
            <div className="size-[3px] rounded-full bg-[#0d0e11] ring-1 ring-white/10" />
          </div>

          {/* Screen */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-[8px]
                          bg-[#f4f6f9] text-[7.5px] font-sans">
            <div className="flex h-full w-full">

              {/* ── SIDEBAR — blue background ── */}
              <div className="w-[21%] shrink-0 bg-[#0057b8] flex flex-col justify-between
                              py-1.5 px-1">
                <div>
                  {/* Brand */}
                  <div className="flex items-center gap-1 px-0.5 pb-1.5 border-b border-white/20">
                    <div className="size-3.5 rounded bg-white flex items-center justify-center
                                    text-[#0057b8] font-black text-[7px]">
                      S
                    </div>
                    <span className="font-extrabold text-[8px] tracking-tight text-white">
                      SAN TRACK
                    </span>
                  </div>

                  {/* Nav */}
                  <div className="mt-1 space-y-0.5">
                    {/* Active */}
                    <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-white/20
                                    text-white font-semibold text-[7px]">
                      <LayoutDashboard className="size-2 shrink-0" />
                      <span className="truncate">Dashboard</span>
                    </div>
                    {[
                      { Icon: Package,    label: "Products" },
                      { Icon: Layers,     label: "Inventory" },
                      { Icon: Factory,    label: "Manufacturing" },
                      { Icon: Truck,      label: "Logistics" },
                      { Icon: DollarSign, label: "Finance" },
                      { Icon: Users,      label: "HR & Payroll" },
                      { Icon: BarChart3,  label: "Reports" },
                    ].map(({ Icon, label }) => (
                      <div key={label}
                           className="flex items-center gap-1 px-1 py-0.5 rounded
                                      text-white/70 font-medium text-[7px] hover:bg-white/10">
                        <Icon className="size-2 shrink-0" />
                        <span className="truncate">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 px-1 py-0.5 text-white/60 text-[7px]">
                  <Settings className="size-2 shrink-0" />
                  <span className="truncate">Settings</span>
                </div>
              </div>

              {/* ── MAIN WORKSPACE ── */}
              <div className="flex-1 bg-[#f4f6f9] overflow-hidden flex flex-col p-1.5 gap-1">

                {/* Topbar */}
                <div className="flex items-center justify-between bg-white px-2 py-0.5
                                rounded border border-slate-100 shadow-2xs">
                  <h3 className="font-bold text-[8.5px] text-slate-900">Dashboard</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="hidden sm:flex items-center gap-0.5 bg-slate-50
                                    border border-slate-200 rounded px-1 py-0.5
                                    text-[6.5px] text-slate-400 w-16">
                      <Search className="size-1.5" /><span>Search...</span>
                    </div>
                    <div className="relative">
                      <Bell className="size-2 text-slate-500" />
                      <span className="absolute -top-px -right-px size-[3px] bg-red-500 rounded-full" />
                    </div>
                    <div className="flex items-center gap-0.5">
                      <div className="size-3.5 rounded-full bg-gradient-to-tr from-blue-600
                                      to-indigo-500 text-white font-bold text-[6px]
                                      flex items-center justify-center">
                        AS
                      </div>
                      <ChevronDown className="size-1.5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: "Total Revenue", value: "RWF 128M", pct: "+18.5%" },
                    { label: "Total Orders",  value: "1,245",    pct: "+12.2%" },
                    { label: "Products",      value: "568",      pct: "+8.2%"  },
                    { label: "Clients",       value: "320",      pct: "+7.1%"  },
                  ].map((c) => (
                    <div key={c.label}
                         className="bg-white p-1 rounded border border-slate-100 shadow-2xs">
                      <span className="text-[5.5px] text-slate-400 font-medium block truncate">
                        {c.label}
                      </span>
                      <p className="font-extrabold text-[8px] text-slate-900 leading-tight mt-0.5 truncate">
                        {c.value}
                      </p>
                      <div className="flex items-center gap-0.5 text-emerald-600 text-[5px] font-bold mt-0.5">
                        <TrendingUp className="size-1.5 shrink-0" />
                        <span>{c.pct}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts row — smaller height */}
                <div className="grid grid-cols-12 gap-1">

                  {/* Sales Overview */}
                  <div className="col-span-7 bg-white p-1 rounded border border-slate-100 shadow-2xs flex flex-col">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-[6.5px] text-slate-800">Sales Overview</span>
                      <div className="flex gap-1 text-[5px]">
                        <span className="flex items-center gap-0.5 text-[#0062cc] font-semibold">
                          <span className="size-1 rounded-full bg-[#0062cc]" /> This Yr
                        </span>
                        <span className="flex items-center gap-0.5 text-[#00953c] font-semibold">
                          <span className="size-1 rounded-full bg-[#00953c]" /> Last Yr
                        </span>
                      </div>
                    </div>
                    <div className="h-[36px] w-full">
                      <svg viewBox="0 0 300 80" className="w-full h-full">
                        <defs>
                          <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0062cc" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#0062cc" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                        <path d="M10 60 Q50 52 90 56 T170 40 T250 32 T290 28"
                              fill="none" stroke="#00953c" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M10 65 Q50 36 90 48 T170 24 T250 36 T290 12 L290 76 L10 76Z"
                              fill="url(#sg2)" />
                        <path d="M10 65 Q50 36 90 48 T170 24 T250 36 T290 12"
                              fill="none" stroke="#0062cc" strokeWidth="1.8" strokeLinecap="round" />
                        <circle cx="170" cy="24" r="1.5" fill="#fff" stroke="#0062cc" strokeWidth="1.2" />
                        <circle cx="290" cy="12" r="2" fill="#0062cc" />
                      </svg>
                    </div>
                    <div className="flex justify-between text-[5px] text-slate-400 font-medium">
                      {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"].map(m => (
                        <span key={m}>{m}</span>
                      ))}
                    </div>
                  </div>

                  {/* Top Products donut */}
                  <div className="col-span-5 bg-white p-1 rounded border border-slate-100 shadow-2xs flex flex-col">
                    <span className="font-bold text-[6.5px] text-slate-800 mb-0.5">Top Products</span>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="size-9 shrink-0">
                        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                          <circle cx="50" cy="50" r="38" fill="transparent"
                                  stroke="#0062cc" strokeWidth="18"
                                  strokeDasharray="95 145" strokeDashoffset="0" />
                          <circle cx="50" cy="50" r="38" fill="transparent"
                                  stroke="#00953c" strokeWidth="18"
                                  strokeDasharray="65 175" strokeDashoffset="-95" />
                          <circle cx="50" cy="50" r="38" fill="transparent"
                                  stroke="#f97316" strokeWidth="18"
                                  strokeDasharray="45 195" strokeDashoffset="-160" />
                          <circle cx="50" cy="50" r="38" fill="transparent"
                                  stroke="#fac600" strokeWidth="18"
                                  strokeDasharray="35 205" strokeDashoffset="-205" />
                        </svg>
                      </div>
                      <div className="space-y-0.5 text-[5px] text-slate-600">
                        {[
                          { c: "#0062cc", l: "Product A" },
                          { c: "#00953c", l: "Product B" },
                          { c: "#f97316", l: "Product C" },
                          { c: "#fac600", l: "Product D" },
                        ].map(({ c, l }) => (
                          <div key={l} className="flex items-center gap-0.5">
                            <span className="size-1 rounded-full shrink-0" style={{ background: c }} />
                            <span className="font-medium">{l}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Events mini-table */}
                <div className="bg-white rounded border border-slate-100 shadow-2xs overflow-hidden">
                  <div className="flex items-center justify-between px-1.5 py-0.5 border-b border-slate-100">
                    <span className="font-bold text-[6px] text-slate-700">Recent Events</span>
                    <span className="text-[5px] text-[#0062cc] font-semibold">View all</span>
                  </div>
                  <table className="w-full text-[5.5px]">
                    <thead>
                      <tr className="text-slate-400 font-semibold">
                        <td className="px-1.5 py-0.5">Event</td>
                        <td className="px-1.5 py-0.5">Ref</td>
                        <td className="px-1.5 py-0.5 text-right">Status</td>
                      </tr>
                    </thead>
                    <tbody>
                      {RECENT.map((r) => (
                        <tr key={r.ref} className="border-t border-slate-50">
                          <td className="px-1.5 py-0.5 text-slate-700 font-medium truncate max-w-[60px]">
                            {r.label}
                          </td>
                          <td className="px-1.5 py-0.5 text-slate-400 font-mono">{r.ref}</td>
                          <td className={`px-1.5 py-0.5 text-right font-bold ${r.color}`}>
                            {r.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>{/* end workspace */}
            </div>
          </div>{/* end screen */}
        </div>

        {/* Keyboard Chassis */}
        <div className="relative mx-auto w-full">
          <div className="h-[7px] bg-gradient-to-b from-[#8f96a3] via-[#b4bac4] to-[#7a818e]
                          rounded-t-[2px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]
                          flex items-center justify-center">
            <div className="w-[14%] h-[2.5px] bg-[#3a3e47] rounded-b-xs" />
          </div>
          <div className="h-[5px] bg-gradient-to-b from-[#d5dbe3] via-[#adb5c2] to-[#808794]
                          rounded-b-[10px] shadow-[0_10px_25px_rgba(0,0,0,0.35)]" />
        </div>
      </div>

      {/* ── SMARTPHONE ── */}
      <div className="absolute -right-2 bottom-[-8px] w-[28%] max-w-[100px] min-w-[90px]
                      z-30 drop-shadow-[0_14px_30px_rgba(0,0,0,0.42)]">
        <div className="relative rounded-[22px] bg-[#1a1d24] p-[4px]
                        ring-1 ring-white/20 shadow-2xl">
          <div className="relative aspect-[9/18.5] w-full overflow-hidden rounded-[18px]
                          bg-white flex flex-col">
            {/* Header */}
            <div className="bg-[#0057b8] text-white px-2 pt-1 pb-2 rounded-b-[14px]">
              <div className="flex justify-center mb-1">
                <div className="w-8 h-2 bg-black rounded-full" />
              </div>
              <div className="flex items-center justify-between text-[5.5px] font-semibold opacity-90 mb-1">
                <span>9:41</span>
                <div className="flex items-center gap-0.5">
                  <Signal className="size-1.5" /><Wifi className="size-1.5" /><Battery className="size-2" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[5.5px] font-medium opacity-80 leading-none">Welcome back,</div>
                  <div className="font-extrabold text-[8px] tracking-tight leading-tight mt-0.5">Admin</div>
                </div>
                <div className="size-4 rounded-full bg-white/20 flex items-center justify-center">
                  <Bell className="size-2 text-white" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex-1 p-1.5 grid grid-cols-2 gap-1 content-start">
              {[
                { Icon: Package,      label: "Inventory",      bg: "bg-blue-50",    color: "text-[#0062cc]" },
                { Icon: ClipboardList,label: "Orders",         bg: "bg-amber-50",   color: "text-amber-600" },
                { Icon: Factory,      label: "Manufacturing",  bg: "bg-indigo-50",  color: "text-indigo-600" },
                { Icon: Truck,        label: "Logistics",      bg: "bg-emerald-50", color: "text-emerald-600" },
                { Icon: DollarSign,   label: "Finance",        bg: "bg-emerald-50", color: "text-emerald-600" },
                { Icon: Users,        label: "HR & Payroll",   bg: "bg-amber-50",   color: "text-amber-600" },
                { Icon: BarChart3,    label: "Reports",        bg: "bg-blue-50",    color: "text-[#0062cc]" },
                { Icon: MoreHorizontal,label: "More",          bg: "bg-slate-100",  color: "text-slate-500" },
              ].map(({ Icon, label, bg, color }) => (
                <div key={label}
                     className="bg-slate-50 rounded-lg p-1 flex flex-col items-center
                                justify-center text-center border border-slate-100">
                  <div className={`size-3.5 rounded-md ${bg} ${color} flex items-center justify-center mb-0.5`}>
                    <Icon className="size-2" />
                  </div>
                  <span className="text-[5px] font-bold text-slate-700 leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* Home bar */}
            <div className="pb-1 flex justify-center">
              <div className="w-10 h-0.5 bg-slate-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
