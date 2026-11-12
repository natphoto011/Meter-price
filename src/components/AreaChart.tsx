import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { MapPin, X } from "lucide-react";

interface AreaChartProps {
  data: {
    name: string;
    value: number; // Count
    revenue: number; // Revenue
  }[];
  selectedArea: string;
  onAreaChange: (area: string) => void;
}

const BAR_COLORS = ["#14b8a6", "#3b82f6", "#6366f1", "#f59e0b", "#ec4899", "#10b981", "#8b5cf6"];

export default function AreaChart({ data, selectedArea, onAreaChange }: AreaChartProps) {
  // Take top 6 locations/operation areas to avoid cluttering
  const displayData = React.useMemo(() => {
    return data.slice(0, 6);
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-2xl border border-slate-800 text-xs font-sans z-50">
          <p className="font-semibold text-slate-200 mb-1.5 flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            {item.name}
          </p>
          <div className="space-y-1 mt-2 font-mono text-[11px]">
            <p className="text-sky-300 flex justify-between gap-6">
              <span>จำนวนงาน:</span>
              <span className="font-bold">{item.value.toLocaleString()} งาน</span>
            </p>
            <p className="text-teal-300 flex justify-between gap-6">
              <span>มูลค่าค่าแรงรวม:</span>
              <span className="font-bold">฿{item.revenue.toLocaleString()}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col h-full" id="area-chart-card">
      <div className="mb-6">
        <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center flex-wrap gap-2.5">
          <span className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600 dark:text-rose-400">
            <MapPin className="w-5 h-5 animate-pulse" />
          </span>
          <span>ปริมาณงานแยกตามประเภทพื้นที่</span>
          {selectedArea !== "All" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAreaChange("All");
              }}
              className="inline-flex items-center gap-1.5 text-xs bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer border border-rose-200/50"
              title="คลิกเพื่อล้างตัวกรอง"
            >
              กรอง: {selectedArea}
              <X className="w-3 h-3 text-rose-500" />
            </button>
          )}
        </h4>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 pl-1">
          พื้นที่การปฏิบัติงาน (ในเขตเทศบาล / นอกเขตเทศบาล)
        </p>
      </div>

      <div className="flex-1 min-h-[260px]" id="area-chart-wrapper">
        {displayData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-sm">
            ไม่มีข้อมูลแสดงผลตามตัวกรองปัจจุบัน
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={displayData}
              layout="vertical"
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={120}
                tickFormatter={(val) => (val.length > 18 ? val.slice(0, 15) + "..." : val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                name="ปริมาณงาน (เคส)"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
                barSize={14}
                onClick={(item) => {
                  if (item) {
                    const targetArea = item.name;
                    onAreaChange(selectedArea === targetArea ? "All" : targetArea);
                    // Smooth scroll to orders table
                    const element = document.getElementById("order-explorer-section");
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }
                }}
                className="cursor-pointer"
              >
                {displayData.map((entry, index) => {
                  const isSelected = selectedArea === entry.name;
                  const isAnySelected = selectedArea !== "All";
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={BAR_COLORS[index % BAR_COLORS.length]}
                      opacity={isAnySelected ? (isSelected ? 1.0 : 0.3) : 1.0}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
