import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import {
  Users,
  Calendar,
  FileSpreadsheet,
  Download,
  Check,
  RefreshCw,
  Coins,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ClipboardCheck,
  ChevronDown,
  Search,
  X,
  UserCheck
} from "lucide-react";

interface MonthlyLaborItem {
  month: string;
  totalOrders: number;
  costIn: number;
  costOut: number;
  totalCost: number;
}

interface LaborSummaryData {
  technician: string;
  technicians?: string[];
  year: string;
  summary: MonthlyLaborItem[];
  totals: {
    totalOrders: number;
    costIn: number;
    costOut: number;
    totalCost: number;
  };
}

interface LaborCostSummaryProps {
  techniciansList: string[];
  yearsList: string[];
  initialYear: string;
}

export default function LaborCostSummary({
  techniciansList,
  yearsList,
  initialYear
}: LaborCostSummaryProps) {
  const defaultYear = initialYear && initialYear !== "All"
    ? initialYear
    : (yearsList && yearsList.length > 0 ? yearsList[0] : "2024");

  // Multi-select technicians state (array of technician names or ["All"])
  const [selectedTechs, setSelectedTechs] = useState<string[]>(["All"]);
  const [isTechDropdownOpen, setIsTechDropdownOpen] = useState<boolean>(false);
  const [techSearch, setTechSearch] = useState<string>("");
  const techDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [data, setData] = useState<LaborSummaryData | null>(null);

  // Available unique valid technicians
  const availableTechs = useMemo(() => {
    return Array.from(new Set(techniciansList.filter((name) => name && name !== "ไม่ระบุ"))).sort();
  }, [techniciansList]);

  // Determine if all technicians are effectively selected
  const isAllSelected = useMemo(() => {
    return (
      selectedTechs.includes("All") ||
      selectedTechs.length === 0 ||
      (availableTechs.length > 0 && selectedTechs.length === availableTechs.length)
    );
  }, [selectedTechs, availableTechs]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (techDropdownRef.current && !techDropdownRef.current.contains(event.target as Node)) {
        setIsTechDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync year filter from prop if it changes
  useEffect(() => {
    if (initialYear && initialYear !== "All") {
      setSelectedYear(initialYear);
    } else if (initialYear === "All" && yearsList && yearsList.length > 0) {
      setSelectedYear(yearsList[0]);
    }
  }, [initialYear, yearsList]);

  // Fetch labor summary data from Express API
  const fetchLaborSummary = async (techs: string[], year: string, month: string, status: string) => {
    setLoading(true);
    try {
      const techParam = isAllSelected ? "All" : techs.join(",");
      const response = await fetch(
        `/api/labor-summary?year=${year}&technicians=${encodeURIComponent(techParam)}&month=${month}&status=${status}`
      );
      if (!response.ok) throw new Error("Failed to load labor summary");
      const resData = await response.json();
      setData(resData);
    } catch (err) {
      console.error("Error fetching labor summary:", err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch on filter change to prevent page jumping and multi-request flickers
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLaborSummary(selectedTechs, selectedYear, selectedMonth, selectedStatus);
    }, 260);

    return () => clearTimeout(timer);
  }, [selectedTechs, isAllSelected, selectedYear, selectedMonth, selectedStatus]);

  // Multi-select handlers with smooth toggle
  const handleToggleTech = (tech: string) => {
    if (tech === "All") {
      setSelectedTechs(["All"]);
      return;
    }

    if (isAllSelected) {
      // If currently all are selected, clicking one selects only that one
      setSelectedTechs([tech]);
      return;
    }

    if (selectedTechs.includes(tech)) {
      const updated = selectedTechs.filter((t) => t !== tech);
      if (updated.length === 0) {
        setSelectedTechs(["All"]);
      } else {
        setSelectedTechs(updated);
      }
    } else {
      const updated = [...selectedTechs, tech];
      if (availableTechs.length > 0 && updated.length === availableTechs.length) {
        setSelectedTechs(["All"]);
      } else {
        setSelectedTechs(updated);
      }
    }
  };

  const handleSelectAll = () => {
    setSelectedTechs(["All"]);
  };

  const handleClearAll = () => {
    if (availableTechs.length > 0) {
      setSelectedTechs([availableTechs[0]]);
    } else {
      setSelectedTechs(["All"]);
    }
  };

  const handleRemoveTech = (tech: string) => {
    if (isAllSelected) {
      const updated = availableTechs.filter((t) => t !== tech);
      setSelectedTechs(updated.length > 0 ? updated : ["All"]);
    } else {
      const updated = selectedTechs.filter((t) => t !== tech);
      setSelectedTechs(updated.length > 0 ? updated : ["All"]);
    }
  };

  // Filter technicians by search query in dropdown
  const filteredTechsInDropdown = useMemo(() => {
    if (!techSearch.trim()) return availableTechs;
    return availableTechs.filter((t) => t.toLowerCase().includes(techSearch.toLowerCase()));
  }, [availableTechs, techSearch]);

  // Format month to Thai
  const formatMonthThai = (monthStr: string) => {
    if (!monthStr) return "";
    const parts = monthStr.split("/");
    if (parts.length === 2) {
      const monthNum = parseInt(parts[0], 10);
      const yearFull = parseInt(parts[1], 10) + 543; // Convert AD to BE for localization
      const thMonthsFull = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
      ];
      return `${thMonthsFull[monthNum - 1]} ${yearFull}`;
    }
    return monthStr;
  };

  // Format month abbreviation for chart axis label
  const formatMonthChart = (monthStr: string) => {
    if (!monthStr) return "";
    const parts = monthStr.split("/");
    if (parts.length === 2) {
      const monthNum = parseInt(parts[0], 10);
      const yearShort = parts[1].slice(-2);
      const thMonthsShort = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
      ];
      return `${thMonthsShort[monthNum - 1]} ${yearShort}`;
    }
    return monthStr;
  };

  // Compute active summary strictly excluding zero labor cost items (แสดงเฉพาะงานที่มีค่าแรง งานไหนค่าแรง 0 บาทไม่ต้องแสดง)
  const activeSummary = useMemo(() => {
    if (!data || !data.summary) return [];
    return data.summary.filter((item) => (item.totalCost || 0) > 0 && (item.totalOrders || 0) > 0);
  }, [data]);

  const activeTotals = useMemo(() => {
    if (!data) return { totalOrders: 0, costIn: 0, costOut: 0, totalCost: 0 };
    return activeSummary.reduce(
      (acc, curr) => ({
        totalOrders: acc.totalOrders + curr.totalOrders,
        costIn: acc.costIn + curr.costIn,
        costOut: acc.costOut + curr.costOut,
        totalCost: acc.totalCost + curr.totalCost,
      }),
      { totalOrders: 0, costIn: 0, costOut: 0, totalCost: 0 }
    );
  }, [data, activeSummary]);

  // Export/Copy as Tab-Separated Values (TSV) for direct paste into Excel/Google Sheets
  const handleCopyToClipboard = () => {
    if (!data || activeSummary.length === 0) return;

    const techLabel = isAllSelected
      ? `ผู้ปฏิบัติงานทุกคน (${availableTechs.length} คน)`
      : selectedTechs.join(", ");

    // Header row
    let text = `รายงานสรุปค่าแรงรายเดือน (เฉพาะงานที่มีค่าแรง, ผู้ปฏิบัติงาน: ${techLabel})\n`;
    text += "เดือน/ปี\tจำนวนงานที่มีค่าแรง\tค่าแรงภายใน (บาท)\tค่าแรงภายนอก (บาท)\tค่าแรงรวมทั้งหมด (บาท)\n";

    // Data rows
    activeSummary.forEach((item) => {
      text += `${formatMonthThai(item.month)}\t${item.totalOrders}\t${item.costIn}\t${item.costOut}\t${item.totalCost}\n`;
    });

    // Total row
    text += `รวมสะสม\t${activeTotals.totalOrders}\t${activeTotals.costIn}\t${activeTotals.costOut}\t${activeTotals.totalCost}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Label text for technician selector button
  const getTechButtonLabel = () => {
    if (isAllSelected) {
      return `ทั้งหมด (${availableTechs.length} คน)`;
    }
    if (selectedTechs.length === 1) {
      return selectedTechs[0];
    }
    if (selectedTechs.length === 2) {
      return `${selectedTechs[0]}, ${selectedTechs[1]}`;
    }
    return `เลือกแล้ว ${selectedTechs.length} คน (${selectedTechs.slice(0, 2).join(", ")}...)`;
  };

  return (
    <div
      id="labor-cost-summary-section"
      className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 scroll-mt-24"
    >
      {/* Title Header block with Copy Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2" style={{ fontFamily: "Prompt" }}>
              <FileSpreadsheet className="w-5.5 h-5.5 text-purple-600 dark:text-purple-400" />
              รายงานสรุปค่าแรงรายเดือน
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full">
              <Check className="w-3 h-3 stroke-[3]" />
              เฉพาะงานที่มีค่าแรง (&gt; 0 บาท)
            </span>
            {loading && data && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-0.5 rounded-full animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                กำลังอัปเดตข้อมูล...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            สรุปยอดสะสมเงินค่าแรงภายในและภายนอกแบ่งตามเดือน (แสดงเฉพาะงานที่มีค่าแรง ไม่รวมงานค่าแรง 0 บาท)
          </p>
        </div>

        {/* Copy TSV to clipboard button */}
        <button
          id="copy-labor-summary-tsv-btn"
          type="button"
          onClick={handleCopyToClipboard}
          disabled={!data || data.summary.length === 0}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title="คัดลอกตารางข้อมูลไปวางใน Excel หรือ Google Sheets"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300 font-bold">คัดลอกตารางแล้ว!</span>
            </>
          ) : (
            <>
              <ClipboardCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>คัดลอกตาราง (Excel/Sheets)</span>
            </>
          )}
        </button>
      </div>

      {/* Selectors Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
        
        {/* Multi-Select Technician Dropdown */}
        <div className="relative" ref={techDropdownRef}>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-500" />
              เลือกผู้ปฏิบัติงาน (ช่าง)
            </span>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100/60 dark:bg-purple-950/60 px-1.5 py-0.2 rounded">
              เลือกได้หลายคน
            </span>
          </label>

          {/* Trigger Button */}
          <button
            id="multi-tech-summary-select-btn"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsTechDropdownOpen((prev) => !prev);
            }}
            className={`w-full flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border rounded-xl px-3 py-2 text-xs font-medium transition-all text-left cursor-pointer h-10 min-h-[40px] ${
              isTechDropdownOpen
                ? "border-purple-500 ring-2 ring-purple-500/20 text-slate-900 dark:text-white"
                : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="truncate block font-medium max-w-[170px]" title={getTechButtonLabel()}>
              {getTechButtonLabel()}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {!isAllSelected && (
                <span className="inline-flex items-center justify-center bg-purple-600 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5">
                  {selectedTechs.length}
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isTechDropdownOpen ? "rotate-180 text-purple-600" : ""
                }`}
              />
            </div>
          </button>

          {/* Dropdown Menu Popover */}
          {isTechDropdownOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-2 space-y-2 min-w-[280px] sm:w-[320px] animate-in fade-in zoom-in-95 duration-100"
            >
              {/* Quick Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={techSearch}
                  onChange={(e) => setTechSearch(e.target.value)}
                  placeholder="ค้นหาชื่อช่าง..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500"
                />
                {techSearch && (
                  <button
                    type="button"
                    onClick={() => setTechSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action Buttons: Select All / Clear */}
              <div className="flex items-center justify-between px-1 py-1 border-b border-slate-100 dark:border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectAll();
                  }}
                  className="font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  เลือกทุกคน ({availableTechs.length})
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleClearAll();
                  }}
                  className="font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  ล้างการเลือก
                </button>
              </div>

              {/* Technicians List with Checkboxes */}
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {/* Option: All */}
                {!techSearch && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleTech("All");
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                      isAllSelected
                        ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isAllSelected
                            ? "bg-purple-600 border-purple-600 text-white"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                        }`}
                      >
                        {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>ทั้งหมด (ทุกผู้ปฏิบัติงาน)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {availableTechs.length} คน
                    </span>
                  </button>
                )}

                {/* Individual Technicians */}
                {filteredTechsInDropdown.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    ไม่พบชื่อช่างที่ค้นหา
                  </div>
                ) : (
                  filteredTechsInDropdown.map((tech) => {
                    const isChecked = isAllSelected || selectedTechs.includes(tech);
                    return (
                      <button
                        key={tech}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleTech(tech);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                          isChecked && !isAllSelected
                            ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold"
                            : isAllSelected
                            ? "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                              isChecked
                                ? "bg-purple-600 border-purple-600 text-white"
                                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{tech}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Done button */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsTechDropdownOpen(false);
                  }}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  เสร็จสิ้น ({isAllSelected ? "ทุกคน" : `${selectedTechs.length} คน`})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Year Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-500" />
            เลือกปีดำเนินงาน
          </label>
          <select
            id="year-summary-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
          >
            {yearsList.map((yr) => (
              <option key={yr} value={yr}>
                ปี {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Month Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-500" />
            เลือกเดือนดำเนินงาน
          </label>
          <select
            id="month-summary-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
          >
            <option value="All">ทั้งหมด (ทุกเดือน)</option>
            <option value="01">มกราคม (01)</option>
            <option value="02">กุมภาพันธ์ (02)</option>
            <option value="03">มีนาคม (03)</option>
            <option value="04">เมษายน (04)</option>
            <option value="05">พฤษภาคม (05)</option>
            <option value="06">มิถุนายน (06)</option>
            <option value="07">กรกฎาคม (07)</option>
            <option value="08">สิงหาคม (08)</option>
            <option value="09">กันยายน (09)</option>
            <option value="10">ตุลาคม (10)</option>
            <option value="11">พฤศจิกายน (11)</option>
            <option value="12">ธันวาคม (12)</option>
          </select>
        </div>

        {/* Status Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-500" />
            เลือกสถานะใบงาน
          </label>
          <select
            id="status-summary-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
          >
            <option value="All">ทั้งหมด (ทุกสถานะ)</option>
            <option value="Complete">เสร็จสิ้น (Complete)</option>
            <option value="Handover">ส่งมอบงาน (Handover)</option>
            <option value="Pending">รอดำเนินการ (Pending)</option>
            <option value="Cancel">ยกเลิก (Cancel)</option>
          </select>
        </div>

        <div className="flex items-end justify-end">
          <div className="text-[11px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 py-2 px-3 rounded-lg w-full flex items-center gap-2 h-10 min-h-[40px]">
            <SlidersHorizontal className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="truncate">ซ่อนงานค่าแรง 0 บาทอัตโนมัติ</span>
          </div>
        </div>
      </div>

      {/* Stable Technicians Indicator Bar: Constant presence and fixed min-height so feed NEVER jumps */}
      <div className="min-h-[34px] flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-purple-500" />
            ผู้ปฏิบัติงานที่เลือก:
          </span>
          {isAllSelected ? (
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              ทุกคนทั้งหมด ({availableTechs.length} คน)
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedTechs.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-medium px-2 py-0.5 rounded-md"
                >
                  <span className="truncate max-w-[130px]">{tech}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveTech(tech);
                    }}
                    className="text-purple-400 hover:text-purple-700 dark:hover:text-purple-200 rounded p-0.5 cursor-pointer"
                    title={`นำ ${tech} ออก`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedTechs.length > 4 && (
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                  +{selectedTechs.length - 4} คน
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectAll();
                }}
                className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold hover:underline ml-1 cursor-pointer"
              >
                (รีเซ็ตเป็นทุกคน)
              </button>
            </div>
          )}
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
          * แสดงเฉพาะรายการที่มีค่าแรง (&gt; 0 บาท)
        </span>
      </div>

      {/* Main Content Area: Zero-jump rendering */}
      {!data && loading ? (
        <div className="min-h-[420px] flex flex-col items-center justify-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-xs text-slate-400 font-medium animate-pulse">กำลังประมวลผลสรุปบัญชีค่าแรง...</p>
        </div>
      ) : data ? (
        <div className={`space-y-6 transition-opacity duration-150 ${loading ? "opacity-75" : "opacity-100"}`}>
          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="labor-summary-kpis">
            {/* Total Orders Card */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50/50 dark:bg-purple-950/20 rounded-full translate-x-5 -translate-y-5" />
              <div className="relative">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold block mb-1">
                  จำนวนงานที่มีค่าแรงสะสม
                </span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                  {activeTotals.totalOrders.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">งาน</span>
              </div>
            </div>

            {/* Cost In Card */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-teal-50/50 dark:bg-teal-950/20 rounded-full translate-x-5 -translate-y-5" />
              <div className="relative">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold block mb-1">
                  ค่าแรงภายในสะสม (In-house)
                </span>
                <span className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono">
                  ฿{activeTotals.costIn.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Cost Out Card */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-sky-50/50 dark:bg-sky-950/20 rounded-full translate-x-5 -translate-y-5" />
              <div className="relative">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold block mb-1">
                  ค่าแรงภายนอกสะสม (Outsource)
                </span>
                <span className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
                  ฿{activeTotals.costOut.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Total Cost Card */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50/50 dark:bg-amber-950/20 rounded-full translate-x-5 -translate-y-5" />
              <div className="relative">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold block mb-1">
                  ค่าแรงรวมสะสมสุทธิ
                </span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  ฿{activeTotals.totalCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Grid Layout: Chart and Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Table block */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-purple-500" />
                  ตารางสรุปรายรับค่าแรงแยกตามรายเดือน
                </h4>
                <span className="text-[10px] bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 font-bold px-2 py-0.5 rounded-full max-w-[280px] truncate" title={isAllSelected ? "ผู้ปฏิบัติงานทุกคน" : selectedTechs.join(", ")}>
                  {isAllSelected
                    ? `ผู้ปฏิบัติงานทุกคน (${availableTechs.length} คน)`
                    : selectedTechs.length === 1
                    ? selectedTechs[0]
                    : `ผู้ปฏิบัติงาน (${selectedTechs.length} คน): ${selectedTechs.join(", ")}`}
                </span>
              </div>

              {activeSummary.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  ไม่พบสถิติการปฏิบัติงานที่มีค่าแรงในช่วงเวลาหรือบุคคลดังกล่าว
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">เดือน / ปีดำเนินงาน</th>
                        <th className="py-3 px-4 text-center">จำนวนงานที่มีค่าแรง (เครื่อง)</th>
                        <th className="py-3 px-4 text-right">ค่าแรงภายใน (฿)</th>
                        <th className="py-3 px-4 text-right">ค่าแรงภายนอก (฿)</th>
                        <th className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200">รวมค่าแรง (฿)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activeSummary.map((item, idx) => (
                        <tr
                          key={item.month}
                          className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors ${
                            idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/20 dark:bg-slate-850"
                          }`}
                        >
                          <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            {formatMonthThai(item.month)}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-medium text-slate-600 dark:text-slate-300">
                            {item.totalOrders}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                            {item.costIn.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                            {item.costOut.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                            {item.totalCost.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {/* Overall Totals row */}
                      <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                        <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">สรุปยอดรวมสะสมปี</td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-800 dark:text-slate-200">
                          {activeTotals.totalOrders}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                          {activeTotals.costIn.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                          {activeTotals.costOut.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-purple-700 dark:text-purple-300 text-sm">
                          {activeTotals.totalCost.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recharts chart block */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  กราฟเปรียบเทียบค่าแรงใน-นอกรายเดือน
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-4">
                  แสดงความสอดคล้องของค่าแรงเพื่อวิเคราะห์โครงสร้างต้นทุนประกอบการเบิกเงิน
                </p>
              </div>

              {activeSummary.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  ไม่มีชุดข้อมูลพอสรุปเป็นแผนภูมิได้
                </div>
              ) : (
                <div className="h-64 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activeSummary}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        tickFormatter={formatMonthChart}
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        content={({ active, payload, label }: any) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs font-sans">
                                <p className="font-semibold text-slate-300 mb-1">
                                  {formatMonthThai(label)}
                                </p>
                                <div className="space-y-1 mt-2">
                                  <p className="text-purple-400 flex justify-between gap-6">
                                    <span>ค่าแรงภายใน:</span>
                                    <span className="font-mono font-bold">฿{payload[0].value.toLocaleString()}</span>
                                  </p>
                                  <p className="text-orange-400 flex justify-between gap-6">
                                    <span>ค่าแรงภายนอก:</span>
                                    <span className="font-mono font-bold">฿{payload[1].value.toLocaleString()}</span>
                                  </p>
                                  <div className="border-t border-slate-700/60 my-1 pt-1">
                                    <p className="text-amber-400 flex justify-between gap-6 font-semibold">
                                      <span>รวมค่าแรง:</span>
                                      <span className="font-mono font-bold">฿{((payload[0].value || 0) + (payload[1].value || 0)).toLocaleString()}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: "10px" }}
                      />
                      <Bar
                        name="ค่าแรงภายใน"
                        dataKey="costIn"
                        stackId="a"
                        fill="#9333ea"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        name="ค่าแรงภายนอก"
                        dataKey="costOut"
                        stackId="a"
                        fill="#ea580c"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-xs text-slate-400">กรุณาเลือกตัวกรองเพื่อเรียกดูข้อมูลสรุป</div>
      )}
    </div>
  );
}
