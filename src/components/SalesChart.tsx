import React, { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { BarChart3, LineChart, TrendingUp, Calendar, X } from "lucide-react";

interface SalesChartProps {
  data: {
    month: string;
    revenue: number;
    orderCount: number;
  }[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export default function SalesChart({ data, selectedMonth, onMonthChange }: SalesChartProps) {
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  // Format month label from "MM/YYYY" to readable Thai month abbreviation e.g. "ม.ค. 67"
  const formatMonth = (monthStr: string) => {
    if (!monthStr || monthStr === "Unknown") return "";
    const parts = monthStr.split("/");
    if (parts.length === 2) {
      const monthNum = parseInt(parts[0], 10);
      const yearShort = parts[1].slice(-2);
      const thMonths = [
        "ม.ค.",
        "ก.พ.",
        "มี.ค.",
        "เม.ย.",
        "พ.ค.",
        "มิ.ย.",
        "ก.ค.",
        "ส.ค.",
        "ก.ย.",
        "ต.ค.",
        "พ.ย.",
        "ธ.ค.",
      ];
      return `${thMonths[monthNum - 1]} ${yearShort}`;
    }
    return monthStr;
  };

  const getMonthNameThai = (monthNumStr: string) => {
    const monthNum = parseInt(monthNumStr, 10);
    const thMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    if (monthNum >= 1 && monthNum <= 12) {
      return thMonths[monthNum - 1];
    }
    return `เดือน ${monthNumStr}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-2xl border border-slate-800 text-xs font-sans z-50">
          <p className="font-semibold text-slate-200 mb-1.5 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            {formatMonth(label)} (คลิกกรองเดือนนี้)
          </p>
          <div className="space-y-1 mt-2 font-mono">
            <p className="text-orange-400 flex justify-between gap-6">
              <span>รายได้ค่าแรง:</span>
              <span className="font-bold">฿{payload[0].value.toLocaleString()}</span>
            </p>
            {payload[1] && (
              <p className="text-purple-400 flex justify-between gap-6">
                <span>ปริมาณงานติดตั้ง:</span>
                <span className="font-bold">{payload[1].value.toLocaleString()} งาน</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleChartClick = (state: any) => {
    if (state && state.activeLabel) {
      const monthKey = state.activeLabel; // e.g. "05/2026"
      const parts = monthKey.split("/");
      if (parts.length === 2) {
        const clickedMonth = parts[0]; // e.g. "05"
        onMonthChange(selectedMonth === clickedMonth ? "All" : clickedMonth);
        
        // Smooth scroll to orders table
        const element = document.getElementById("order-explorer-section");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col h-full" id="sales-chart-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h4 className="text-lg font-black text-slate-800 dark:text-white flex items-center flex-wrap gap-2 tracking-tight">
            <TrendingUp className="w-5 h-5 text-purple-600 animate-pulse" />
            แนวโน้มปริมาณงาน
            {selectedMonth !== "All" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMonthChange("All");
                }}
                className="inline-flex items-center gap-1 text-[10px] bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer border border-purple-200/50"
                title="คลิกเพื่อล้างตัวกรองเดือน"
              >
                กรอง: {getMonthNameThai(selectedMonth)}
                <X className="w-3 h-3 text-purple-500" />
              </button>
            )}
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">
            สถิติตัวเลขรายได้ค่าแรง (PEA Labor Cost) และปริมาณยอดการติดตั้งมิเตอร์ (คลิกที่กราฟเพื่อกรองข้อมูลรายเดือนได้)
          </p>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl self-start sm:self-center border border-slate-100 dark:border-slate-800/60" id="chart-type-toggle">
          <button
            id="toggle-area-chart"
            onClick={() => setChartType("area")}
            className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartType === "area"
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs border border-slate-200/20 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <LineChart className="w-3.5 h-3.5 mr-1" />
            พื้นที่สะสม
          </button>
          <button
            id="toggle-bar-chart"
            onClick={() => setChartType("bar")}
            className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartType === "bar"
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs border border-slate-200/20 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 mr-1" />
            แผนภูมิแท่ง
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[280px]" id="sales-chart-wrapper">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-sm">
            ไม่มีข้อมูลแสดงผลตามตัวกรองปัจจุบัน
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {chartType === "area" ? (
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                onClick={handleChartClick}
                className="cursor-pointer"
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#ea580c"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `฿${val.toLocaleString()}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#9333ea"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val} งาน`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "15px" }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="รายได้รวม (บาท)"
                  stroke="#ea580c"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="orderCount"
                  name="จำนวนงานทั้งหมด (ครั้ง)"
                  stroke="#9333ea"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            ) : (
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                onClick={handleChartClick}
                className="cursor-pointer"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#ea580c"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `฿${val.toLocaleString()}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#9333ea"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val} งาน`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "15px" }} />
                <Bar yAxisId="left" dataKey="revenue" name="รายได้รวม (บาท)" fill="#ea580c" radius={[4, 4, 0, 0]} barSize={16}>
                  {data.map((entry, index) => {
                    const entryMonth = entry.month.split("/")[0];
                    const isSelected = selectedMonth === entryMonth;
                    const isAnySelected = selectedMonth !== "All";
                    return (
                      <Cell
                        key={`cell-rev-${index}`}
                        fill="#ea580c"
                        opacity={isAnySelected ? (isSelected ? 1.0 : 0.35) : 1.0}
                      />
                    );
                  })}
                </Bar>
                <Bar yAxisId="right" dataKey="orderCount" name="จำนวนงานทั้งหมด (ครั้ง)" fill="#9333ea" radius={[4, 4, 0, 0]} barSize={8}>
                  {data.map((entry, index) => {
                    const entryMonth = entry.month.split("/")[0];
                    const isSelected = selectedMonth === entryMonth;
                    const isAnySelected = selectedMonth !== "All";
                    return (
                      <Cell
                        key={`cell-cnt-${index}`}
                        fill="#9333ea"
                        opacity={isAnySelected ? (isSelected ? 1.0 : 0.35) : 1.0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
