import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Layers, X, Activity, Coins, Percent, Sparkles } from "lucide-react";

interface CategoryChartProps {
  data: {
    name: string;
    value: number; // Order Count
    revenue: number; // Total Labor Cost
  }[];
  selectedSize: string;
  onSizeChange: (size: string) => void;
}

// A highly-refined modern neon tech palette
const COLORS = [
  "#a855f7", // Radiant Purple
  "#06b6d4", // Electric Cyan
  "#10b981", // Emerald Green
  "#f97316", // Bright Amber
  "#3b82f6", // Neon Blue
  "#ec4899", // Vivid Rose
  "#64748b"  // Tech Slate
];

export default function CategoryChart({ data, selectedSize, onSizeChange }: CategoryChartProps) {
  const [metric, setMetric] = useState<"count" | "revenue">("count");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Sort and process data based on the selected metric
  const sortedAndProcessedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const sorted = [...data].sort((a, b) => {
      const valA = metric === "count" ? a.value : a.revenue;
      const valB = metric === "count" ? b.value : b.revenue;
      return valB - valA;
    });

    if (sorted.length <= 6) return sorted;

    const top = sorted.slice(0, 5);
    const rest = sorted.slice(5);
    const restCount = rest.reduce((sum, item) => sum + item.value, 0);
    const restRevenue = rest.reduce((sum, item) => sum + item.revenue, 0);
    
    return [
      ...top,
      {
        name: "อื่น ๆ",
        value: restCount,
        revenue: restRevenue,
      },
    ];
  }, [data, metric]);

  const totalValue = sortedAndProcessedData.reduce((sum, item) => sum + (metric === "count" ? item.value : item.revenue), 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const totalOriginalCount = data.reduce((s, x) => s + x.value, 0);
      const totalOriginalRevenue = data.reduce((s, x) => s + x.revenue, 0);
      
      const countPercentage = totalOriginalCount > 0 ? ((item.value / totalOriginalCount) * 100).toFixed(1) : "0";
      const revenuePercentage = totalOriginalRevenue > 0 ? ((item.revenue / totalOriginalRevenue) * 100).toFixed(1) : "0";
      const idx = sortedAndProcessedData.findIndex(x => x.name === item.name);
      const itemColor = COLORS[idx % COLORS.length];

      return (
        <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-slate-800 text-[11px] font-sans z-50 animate-fadeIn">
          <p className="font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-800 pb-1 mb-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: itemColor }} />
            ขนาด {item.name}
          </p>
          <div className="space-y-1 font-mono">
            <p className="text-cyan-400 flex justify-between gap-4">
              <span>สัดส่วนงาน:</span>
              <span className="font-bold">{item.value.toLocaleString()} เครื่อง ({countPercentage}%)</span>
            </p>
            <p className="text-purple-400 flex justify-between gap-4">
              <span>มูลค่าค่าแรง:</span>
              <span className="font-bold">฿{item.revenue.toLocaleString()} ({revenuePercentage}%)</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col h-full hover:shadow-md transition-all duration-300 relative overflow-hidden" id="category-chart-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center flex-wrap gap-2.5">
            <span className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </span>
            <span>สัดส่วนตามประเภทขนาดมิเตอร์</span>
            {selectedSize !== "All" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSizeChange("All");
                }}
                className="inline-flex items-center gap-1.5 text-xs bg-purple-50 dark:bg-purple-950 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full font-bold transition-all cursor-pointer border border-purple-100 dark:border-purple-900"
                title="ล้างตัวกรอง"
              >
                กรอง: {selectedSize}
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5 pl-1">
            <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
            วิเคราะห์พิกัดมิเตอร์รายเครื่องและรายได้สะสม
          </p>
        </div>
        
        {/* Toggle metric */}
        <div className="flex bg-slate-100/80 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/60 self-start sm:self-center" id="category-metric-toggle">
          <button
            onClick={() => setMetric("count")}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              metric === "count"
                ? "bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-xs border border-slate-200/40 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            จำนวนเครื่อง
          </button>
          <button
            onClick={() => setMetric("revenue")}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              metric === "revenue"
                ? "bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-xs border border-slate-200/40 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            ค่าแรง (บาท)
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 py-2" id="category-chart-body">
        {sortedAndProcessedData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-sm py-8">
            ไม่มีข้อมูลตามขนาดมิเตอร์
          </div>
        ) : (
          <>
            {/* Donut Chart */}
            <div className="w-[170px] h-[170px] md:w-[190px] md:h-[190px] flex-shrink-0 flex items-center justify-center relative" id="pie-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={sortedAndProcessedData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={3.5}
                    dataKey={metric === "count" ? "value" : "revenue"}
                    onMouseEnter={(_, index) => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {sortedAndProcessedData.map((entry, index) => {
                      const isSelected = selectedSize === entry.name;
                      const isAnySelected = selectedSize !== "All";
                      const isHovered = hoveredIndex === index;
                      const baseColor = COLORS[index % COLORS.length];
                      
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={baseColor}
                          opacity={isAnySelected ? (isSelected ? 1.0 : 0.25) : (hoveredIndex !== null ? (isHovered ? 1.0 : 0.75) : 0.95)}
                          className="cursor-pointer focus:outline-none transition-all duration-300"
                          onClick={() => {
                            const targetSize = entry.name;
                            onSizeChange(selectedSize === targetSize ? "All" : targetSize);
                          }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ยอดรวม</span>
                <span className="text-base md:text-lg font-black text-slate-800 dark:text-white font-mono mt-0.5">
                  {metric === "count"
                    ? `${totalValue.toLocaleString()}`
                    : `฿${(totalValue / 1000).toFixed(0)}k`}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {metric === "count" ? "เครื่อง" : "บาท"}
                </span>
              </div>
            </div>

            {/* Redesigned, ultra-clean, legible interactive list legend */}
            <div className="flex-1 w-full space-y-2 font-prompt" id="pie-legend-breakdown" style={{ fontFamily: "'Prompt', sans-serif" }}>
              {sortedAndProcessedData.map((item, index) => {
                const val = metric === "count" ? item.value : item.revenue;
                const percentage = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : "0";
                const isSelected = selectedSize === item.name;
                const isAnySelected = selectedSize !== "All";
                const isHovered = hoveredIndex === index;
                const itemColor = COLORS[index % COLORS.length];

                return (
                  <div
                    key={item.name}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => {
                      const targetSize = item.name;
                      onSizeChange(selectedSize === targetSize ? "All" : targetSize);
                    }}
                    className={`group flex flex-col px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-purple-50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200 font-bold border border-purple-100/50 dark:border-purple-900/40"
                        : isAnySelected
                        ? "opacity-30 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        : isHovered
                        ? "bg-slate-50 dark:bg-slate-800/40"
                        : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Perfect dot indicator */}
                        <span 
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 transition-transform duration-200 group-hover:scale-115 shadow-xs" 
                          style={{ backgroundColor: itemColor }} 
                        />
                        <span className="font-bold text-sm sm:text-base text-slate-700 dark:text-slate-200 truncate font-prompt" style={{ fontFamily: "'Prompt', sans-serif" }}>
                          ขนาด {item.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2.5 font-mono text-sm sm:text-base">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">
                          {metric === "count" ? `${item.value.toLocaleString()} เครื่อง` : `฿${item.revenue.toLocaleString()}`}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-400 dark:text-slate-500">
                          ({percentage}%)
                        </span>
                      </div>
                    </div>

                    {/* Proportional micro indicator line */}
                    <div className="w-full pl-6.5 mt-2">
                      <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: itemColor
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
