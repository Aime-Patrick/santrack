"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Package,
  Factory,
  Truck,
  DollarSign,
  Users,
  BarChart3,
  ArrowRight,
  TrendingUp,
  CheckSquare,
  Activity,
} from "lucide-react";

const MODULES = [
  {
    icon: Package,
    title: "Inventory",
    desc: "Manage stock levels, warehouses and movements",
    color: "text-[#067eda]",
    bg: "bg-blue-50",
  },
  {
    icon: Factory,
    title: "Manufacturing",
    desc: "Production planning, work orders and quality control",
    color: "text-[#00953c]",
    bg: "bg-green-50",
  },
  {
    icon: Truck,
    title: "Logistics",
    desc: "Shipment tracking, route optimization and delivery",
    color: "text-[#fac600]",
    bg: "bg-yellow-50",
  },
  {
    icon: DollarSign,
    title: "Finance",
    desc: "Accounting, expenses, invoicing and financial reporting",
    color: "text-[#067eda]",
    bg: "bg-blue-50",
  },
  {
    icon: Users,
    title: "HR & Payroll",
    desc: "Employee management, payroll processing and attendance",
    color: "text-[#00953c]",
    bg: "bg-green-50",
  },
  {
    icon: BarChart3,
    title: "Reports & BI",
    desc: "Real-time analytics and customizable reports",
    color: "text-[#fac600]",
    bg: "bg-yellow-50",
  },
];

const RECENT = [
  { label: "New Purchase Order", id: "PO# 2026-00865", time: "2 min ago" },
  { label: "Stock Received", id: "INV# 2026-00078", time: "15 min ago" },
  { label: "Sales Order Created", id: "SO# 2026-00723", time: "1 hour ago" },
  { label: "Payment Received", id: "INV# 2026-00074", time: "3 hours ago" },
];

const TASKS = [
  "Approve Purchase Order PO# 2026-00045",
  "Review Inventory Levels",
  "Monthly Financial Report",
  "Payroll Processing",
  "Delivery Confirmation",
];

export function ModulesSection() {
  return (
    <section id="solutions" className="bg-[#f7f9fc] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Left — Copy + Module Cards */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-0.5 bg-[#067eda]" />
              <span className="text-[#067eda] text-xs font-bold tracking-[0.2em] uppercase">
                Powerful Modules
              </span>
            </div>
            <h2 className="text-3xl xl:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Everything You Need,{" "}
              <span className="text-[#067eda]">All in One Place</span>
            </h2>
            <p className="text-slate-500 text-base leading-relaxed mb-8 max-w-lg">
              SAN TRACK integrates all core business operations into one seamless
              platform to help you work smarter, faster and more efficiently.
            </p>

            {/* Module Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {MODULES.map((mod, index) => {
                const Icon = mod.icon;
                return (
                  <motion.div
                    key={mod.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white rounded-xl p-4 border border-slate-100 hover:border-[#067eda]/30 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className={`p-2.5 rounded-lg ${mod.bg} w-fit mb-3 group-hover:scale-105 transition-transform`}>
                      <Icon className={`size-5 ${mod.color}`} />
                    </div>
                    <p className="text-sm font-bold text-slate-800">{mod.title}</p>
                    <p className="text-[13px] text-slate-400 mt-0.5 leading-tight">{mod.desc}</p>
                  </motion.div>
                );
              })}
            </div>

            <Link href="/register">
              <Button className="bg-[#067eda] hover:bg-[#0569c0] text-white font-semibold px-6 rounded-full gap-2">
                View All Modules <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>

          {/* Right — Business Overview Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                <h3 className="text-sm font-bold text-slate-800">Business Overview</h3>
                <span className="text-[13px] text-slate-400 bg-slate-50 px-3 py-1 rounded-full border">
                  May 1 – May 31, 2026
                </span>
              </div>

              <div className="p-5 space-y-5">
                {/* Revenue */}
                <div>
                  <p className="text-[13px] text-slate-400 font-medium uppercase tracking-wide mb-1">Revenue Overview</p>
                  <div className="flex items-end gap-3">
                    <div>
                      <p className="text-2xl font-extrabold text-slate-900">RWF 128,450,000</p>
                      <p className="text-[13px] text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                        <TrendingUp className="size-3" /> +18.5% from last month
                      </p>
                    </div>
                  </div>
                  {/* Simple bar sparkline */}
                  <div className="flex items-end gap-1 mt-3 h-12">
                    {[40, 55, 45, 70, 60, 80, 75, 90, 85, 100].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-[#067eda]/20 rounded-sm hover:bg-[#067eda]/40 transition-colors"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-300 mt-1">
                    {["May 1","May 8","May 15","May 22","May 31"].map(d => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  {/* Recent Activities */}
                  <div>
                    <p className="text-[13px] text-slate-400 font-medium uppercase tracking-wide mb-2">Recent Activities</p>
                    <div className="space-y-2">
                      {RECENT.map((r) => (
                        <div key={r.id} className="flex items-start gap-2">
                          <div className="mt-0.5 size-5 rounded bg-[#067eda]/10 flex items-center justify-center shrink-0">
                            <Activity className="size-2.5 text-[#067eda]" />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-slate-700 leading-tight">{r.label}</p>
                            <p className="text-[9px] text-slate-400">{r.id} · {r.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tasks */}
                  <div>
                    <p className="text-[13px] text-slate-400 font-medium uppercase tracking-wide mb-2">Tasks</p>
                    <div className="space-y-1.5">
                      {TASKS.map((t) => (
                        <div key={t} className="flex items-start gap-1.5">
                          <CheckSquare className="size-3 text-[#00953c] shrink-0 mt-0.5" />
                          <span className="text-[10px] text-slate-600 leading-tight">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button className="w-full text-center text-[12px] font-semibold text-[#067eda] border border-[#067eda]/30 rounded-lg py-2 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5">
                  View Full Dashboard <ArrowRight className="size-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
