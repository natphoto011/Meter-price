import React from "react";
import { DollarSign, ClipboardCheck, Award, TrendingUp } from "lucide-react";

interface KPICardsProps {
  totalRevenue: number;
  totalOrders: number;
  averageValue: number;
  completionRate: number;
  isMock: boolean;
}

export default function KPICards({
  totalRevenue,
  totalOrders,
  averageValue,
  completionRate,
  isMock,
}: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-container">
      {/* Revenue Card */}
      <div
        id="kpi-card-revenue"
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-md dark:hover:border-teal-500/30 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300 opacity-20 dark:opacity-[0.07]" style={{ backgroundColor: "#16d3c5" }} />
        <div className="flex justify-between items-start relative">
          <div>
            <p className="text-slate-400 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              ยอดรายได้ / ค่าแรงรวม
            </p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight font-sans">
              ฿{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full mt-2.5 border border-emerald-100 dark:border-emerald-500/20">
              <TrendingUp className="w-3 h-3 mr-1" />
              PEA Labor Fee
            </span>
          </div>
          <div className="bg-teal-500 text-white p-3 rounded-xl shadow-md shadow-teal-100 dark:shadow-none">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Orders Card */}
      <div
        id="kpi-card-orders"
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-md dark:hover:border-sky-500/30 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300 opacity-20 dark:opacity-[0.07]" style={{ backgroundColor: "#0d88e5" }} />
        <div className="flex justify-between items-start relative">
          <div>
            <p className="text-slate-400 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              จำนวนคำร้องติดตั้งทั้งหมด
            </p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight font-sans">
              {totalOrders.toLocaleString()} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">งาน</span>
            </h3>
            <span className="inline-flex items-center text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2.5 py-0.5 rounded-full mt-2.5 border border-sky-100 dark:border-sky-500/20">
              ประเมินตามช่วงปี
            </span>
          </div>
          <div className="bg-sky-500 text-white p-3 rounded-xl shadow-md shadow-sky-100 dark:shadow-none">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Average Labor Fee */}
      <div
        id="kpi-card-avg-fee"
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-md dark:hover:border-purple-500/30 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300 opacity-20 dark:opacity-[0.07]" style={{ backgroundColor: "#9333ea" }} />
        <div className="flex justify-between items-start relative">
          <div>
            <p className="text-slate-400 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              ค่าแรงเฉลี่ยต่อคำร้อง
            </p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight font-sans">
              ฿{averageValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </h3>
            <span className="inline-flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2.5 py-0.5 rounded-full mt-2.5 border border-purple-100 dark:border-purple-500/20">
              คุ้มค่าภายนอก/ภายในเขต
            </span>
          </div>
          <div className="bg-purple-500 text-white p-3 rounded-xl shadow-md shadow-purple-100 dark:shadow-none">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Complete Rate */}
      <div
        id="kpi-card-completion"
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-md dark:hover:border-amber-500/30 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300 opacity-20 dark:opacity-[0.07]" style={{ backgroundColor: "#ff7c07" }} />
        <div className="flex justify-between items-start relative">
          <div>
            <p className="text-slate-400 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              อัตราติดตั้งเสร็จสิ้น
            </p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight font-sans">
              {completionRate.toFixed(1)}%
            </h3>
            <span className="inline-flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-full mt-2.5 border border-amber-100 dark:border-amber-500/20">
              อิงตามกำหนดส่งมอบงาน
            </span>
          </div>
          <div className="bg-amber-500 text-white p-3 rounded-xl shadow-md shadow-amber-100 dark:shadow-none">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
