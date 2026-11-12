import React from "react";
import { CheckCircle2, Clock, XCircle, HelpCircle, Layers, Clipboard, Check } from "lucide-react";

interface StatusCardsProps {
  byStatus: { name: string; count: number }[];
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export default function StatusCards({
  byStatus,
  selectedStatus,
  onStatusChange,
}: StatusCardsProps) {
  
  const categories = [
    {
      key: "Complete",
      aliases: ["Complete", "เสร็จสิ้น", "เสร็จ"],
      label: "งานเสร็จสิ้น",
      sublabel: "งานติดตั้งและสับเปลี่ยนสำเร็จ",
      colorClass: "border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      activeColorClass: "border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-500/20",
      badgeColorClass: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/30",
      badgeActiveColorClass: "bg-emerald-800 text-white",
      icon: CheckCircle2,
      rawValues: ["Complete", "เสร็จสิ้น", "เสร็จ"],
    },
    {
      key: "Handover",
      aliases: ["Handover", "ส่งมอบงาน"],
      label: "ส่งมอบงาน",
      sublabel: "ส่งมอบงานเรียบร้อย",
      colorClass: "border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
      activeColorClass: "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-500/20",
      badgeColorClass: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-500/30",
      badgeActiveColorClass: "bg-indigo-800 text-white",
      icon: Check,
      rawValues: ["Handover", "ส่งมอบงาน"],
    },
    {
      key: "Pending",
      aliases: ["Pending", "รอดำเนินการ", "กำลังดำเนินการ", "In Progress"],
      label: "รอดำเนินการ",
      sublabel: "อยู่ระหว่างดำเนินงาน/รอคิว",
      colorClass: "border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
      activeColorClass: "border-amber-500 bg-amber-600 text-white shadow-md shadow-amber-500/20",
      badgeColorClass: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 group-hover:bg-amber-200 dark:group-hover:bg-amber-500/30",
      badgeActiveColorClass: "bg-amber-800 text-white",
      icon: Clock,
      rawValues: ["Pending", "รอดำเนินการ", "กำลังดำเนินการ", "In Progress"],
    },
    {
      key: "Cancel",
      aliases: ["Cancel", "ยกเลิก"],
      label: "ยกเลิก",
      sublabel: "ยกเลิกการดำเนินงานติดตั้ง",
      colorClass: "border-rose-100 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400",
      activeColorClass: "border-rose-500 bg-rose-600 text-white shadow-md shadow-rose-500/20",
      badgeColorClass: "bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 group-hover:bg-rose-200 dark:group-hover:bg-rose-500/30",
      badgeActiveColorClass: "bg-rose-800 text-white",
      icon: XCircle,
      rawValues: ["Cancel", "ยกเลิก"],
    },
  ];

  const categoryStats = categories.map((cat) => {
    const totalCount = byStatus
      .filter((s) => cat.aliases.some((alias) => s.name.toLowerCase() === alias.toLowerCase()))
      .reduce((sum, item) => sum + item.count, 0);

    return {
      ...cat,
      count: totalCount,
    };
  });

  const allCount = byStatus.reduce((sum, item) => sum + item.count, 0);

  const mappedRawValues = categories.flatMap((cat) => cat.aliases.map((a) => a.toLowerCase()));
  const otherCount = byStatus
    .filter((s) => !mappedRawValues.includes(s.name.toLowerCase()))
    .reduce((sum, item) => sum + item.count, 0);

  const hasOther = otherCount > 0;

  const handleCategoryClick = (cat: typeof categoryStats[0]) => {
    const activeRawValue = cat.rawValues.find((val) => 
      byStatus.some((s) => s.name.toLowerCase() === val.toLowerCase() && s.count > 0)
    ) || cat.rawValues[0];

    onStatusChange(selectedStatus === activeRawValue ? "All" : activeRawValue);

    const element = document.getElementById("order-explorer-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-3" id="operation-status-cards-section">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-600 animate-pulse" />
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">สถานะงานติดตั้ง</h4>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-400">คลิกที่การ์ดสถานะเพื่อคัดกรองข้อมูลอย่างรวดเร็ว</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* All Statuses Card */}
        <button
          onClick={() => {
            onStatusChange("All");
            const element = document.getElementById("order-explorer-section");
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
          className={`group flex items-center justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer duration-300 relative overflow-hidden ${
            selectedStatus === "All"
              ? "border-purple-500 bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 -translate-y-0.5"
              : "border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-purple-200 dark:hover:border-purple-500/30 text-slate-800 dark:text-slate-100 hover:-translate-y-0.5 shadow-sm"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl ${
              selectedStatus === "All"
                ? "bg-purple-700/60 text-purple-100"
                : "bg-purple-50 dark:bg-purple-500/10 text-purple-600 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20"
            }`}>
              <Clipboard className="w-5 h-5" />
            </div>
            <div>
              <p className={`font-bold text-sm ${selectedStatus === "All" ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>
                ทุกสถานะคำร้อง
              </p>
              <p className={`text-[11px] font-medium ${selectedStatus === "All" ? "text-purple-200" : "text-slate-400 dark:text-slate-400"}`}>
                งานติดตั้งทั้งหมดของปีนี้
              </p>
            </div>
          </div>
          <span className={`font-mono font-bold text-base px-2.5 py-0.5 rounded-lg transition-all duration-300 ${
            selectedStatus === "All"
              ? "bg-purple-800/60 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-purple-50 dark:group-hover:bg-purple-500/20 group-hover:text-purple-700 dark:group-hover:text-purple-300"
          }`}>
            {allCount.toLocaleString()}
          </span>
        </button>

        {/* Dynamic Status Cards */}
        {categoryStats.map((cat) => {
          const IconComponent = cat.icon;
          const isSelected = cat.rawValues.some(
            (val) => selectedStatus.toLowerCase() === val.toLowerCase()
          );

          return (
            <button
              key={cat.key}
              onClick={() => handleCategoryClick(cat)}
              className={`group flex items-center justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer duration-300 relative overflow-hidden ${
                isSelected
                  ? cat.activeColorClass + " -translate-y-0.5 shadow-md"
                  : "border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 text-slate-800 dark:text-slate-100 hover:-translate-y-0.5 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2.5 rounded-xl transition-colors ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : cat.colorClass
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold text-sm ${isSelected ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>
                    {cat.label}
                  </p>
                  <p className={`text-[11px] font-medium ${isSelected ? "opacity-80" : "text-slate-400 dark:text-slate-400"}`}>
                    {cat.sublabel}
                  </p>
                </div>
              </div>
              <span className={`font-mono font-bold text-base px-2.5 py-0.5 rounded-lg transition-colors ${
                isSelected
                  ? "bg-white/25 text-white"
                  : cat.badgeColorClass
              }`}>
                {cat.count.toLocaleString()}
              </span>
            </button>
          );
        })}

        {/* Other / Unspecified Card (Only if hasOther is true) */}
        {hasOther && (
          <button
            onClick={() => {
              const otherVal = byStatus.find((s) => !mappedRawValues.includes(s.name.toLowerCase()))?.name || "All";
              onStatusChange(selectedStatus === otherVal ? "All" : otherVal);
              const element = document.getElementById("order-explorer-section");
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            className={`group flex items-center justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer duration-300 relative overflow-hidden ${
              selectedStatus !== "All" && !mappedRawValues.includes(selectedStatus.toLowerCase())
                ? "border-slate-500 bg-slate-700 text-white shadow-md shadow-slate-200/20 -translate-y-0.5"
                : "border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 text-slate-800 dark:text-slate-100 hover:-translate-y-0.5 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-xl ${
                selectedStatus !== "All" && !mappedRawValues.includes(selectedStatus.toLowerCase())
                  ? "bg-slate-600 text-slate-100"
                  : "bg-slate-50 dark:bg-slate-500/10 text-slate-500 group-hover:bg-slate-100 dark:group-hover:bg-slate-500/20"
              }`}>
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className={`font-bold text-sm ${selectedStatus !== "All" && !mappedRawValues.includes(selectedStatus.toLowerCase()) ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>
                  ส่งมอบงาน
                </p>
                <p className={`text-[11px] font-medium ${selectedStatus !== "All" && !mappedRawValues.includes(selectedStatus.toLowerCase()) ? "opacity-80" : "text-slate-400 dark:text-slate-400"}`}>
                  สถานะเสริมประเภทอื่นๆ
                </p>
              </div>
            </div>
            <span className={`font-mono font-bold text-base px-2.5 py-0.5 rounded-lg ${
              selectedStatus !== "All" && !mappedRawValues.includes(selectedStatus.toLowerCase())
                ? "bg-slate-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}>
              {otherCount.toLocaleString()}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
