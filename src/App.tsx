import React, { useState, useEffect } from "react";
import KPICards from "./components/KPICards";
import StatusCards from "./components/StatusCards";
import SalesChart from "./components/SalesChart";
import CategoryChart from "./components/CategoryChart";
import AreaChart from "./components/AreaChart";
import OrderExplorer from "./components/OrderExplorer";
import AIInsights from "./components/AIInsights";
import LaborCostSummary from "./components/LaborCostSummary";
import ReportForm52 from "./components/ReportForm52";
import { Order, DashboardStats } from "./types";
import {
  RefreshCw,
  LayoutDashboard,
  Database,
  HelpCircle,
  AlertCircle,
  Menu,
  X,
  BarChart3,
  Sparkles,
  FileSpreadsheet,
  Coins,
  FileText,
  User,
  Sun,
  Moon,
  Eye
} from "lucide-react";

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("pea-dashboard-theme");
    return saved ? saved === "dark" : false;
  });

  const [visitCount, setVisitCount] = useState<number>(() => {
    const saved = localStorage.getItem("pea-dashboard-visits");
    // Reset old mock values (like 14258) to start fresh from 1
    if (saved && parseInt(saved, 10) < 14000) {
      const num = parseInt(saved, 10);
      const updated = num + 1;
      localStorage.setItem("pea-dashboard-visits", updated.toString());
      return updated;
    } else {
      const initial = 1;
      localStorage.setItem("pea-dashboard-visits", initial.toString());
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem("pea-dashboard-theme", darkMode ? "dark" : "light");
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  // Sidebar responsive toggle & section states
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Filters & Pagination State
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedArea, setSelectedArea] = useState<string>("All");
  const [selectedSize, setSelectedSize] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Data States
  const [stats, setStats] = useState<any>(null);
  const [ordersData, setOrdersData] = useState<{ orders: Order[]; total: number; totalPages: number }>({
    orders: [],
    total: 0,
    totalPages: 0,
  });

  // UI Status States
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Dashboard Statistics
  const fetchStats = async (year: string, month: string = "All") => {
    try {
      const response = await fetch(`/api/stats?year=${year}&month=${encodeURIComponent(month)}`);
      if (!response.ok) throw new Error("Failed to load statistics");
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error(err);
      setError("ไม่สามารถโหลดข้อมูลสถิติรวมได้สำเร็จ");
    }
  };

  // Fetch Paginated & Filtered Orders
  const fetchOrders = async (
    page: number,
    search: string,
    year: string,
    month: string,
    area: string,
    size: string,
    status: string
  ) => {
    try {
      const response = await fetch(
        `/api/orders?page=${page}&limit=15&search=${encodeURIComponent(
          search
        )}&year=${year}&month=${encodeURIComponent(month)}&area=${encodeURIComponent(area)}&meterSize=${encodeURIComponent(size)}&status=${encodeURIComponent(status)}`
      );
      if (!response.ok) throw new Error("Failed to load orders list");
      const data = await response.json();
      setOrdersData({
        orders: data.orders,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err: any) {
      console.error(err);
      setError("ไม่สามารถโหลดฐานข้อมูลรายการติดตั้งได้");
    }
  };

  // Synchronized initial data fetch or fetch upon primary filters update
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(selectedYear, selectedMonth),
        fetchOrders(currentPage, searchQuery, selectedYear, selectedMonth, selectedArea, selectedSize, selectedStatus),
      ]);
      setLoading(false);
    };
    loadAllData();
  }, [selectedYear, selectedMonth, selectedArea, selectedSize, selectedStatus, currentPage]);

  // Debounced/Triggered search query loader
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (!loading) {
        fetchOrders(1, searchQuery, selectedYear, selectedMonth, selectedArea, selectedSize, selectedStatus);
        setCurrentPage(1);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Trigger cache refresh on Express server
  const handleRefreshData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        // Reload all data
        await Promise.all([
          fetchStats(selectedYear, selectedMonth),
          fetchOrders(currentPage, searchQuery, selectedYear, selectedMonth, selectedArea, selectedSize, selectedStatus),
        ]);
      } else {
        throw new Error(data.error || "Refresh failed");
      }
    } catch (err: any) {
      console.error(err);
      setError("การรีเฟรชอัปเดตชีตขัดข้อง แต่ยังใช้ข้อมูลสำรองเดิมได้");
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusUpdate = async () => {
    await Promise.all([
      fetchStats(selectedYear, selectedMonth),
      fetchOrders(currentPage, searchQuery, selectedYear, selectedMonth, selectedArea, selectedSize, selectedStatus),
    ]);
  };

  const scrollToSection = (id: string, tabName: string) => {
    setActiveTab(tabName);
    setMobileSidebarOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 95;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"} flex font-sans transition-colors duration-300`} id="app-root-container">
      {/* Sidebar Navigation - Persistent on Desktop, Toggleable on Mobile */}
      <aside
        id="sidebar-nav"
        className={`w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-50 transform ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0 transition-transform duration-300 ease-in-out`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 p-1 shadow-2xs">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7lNYrLaOUdME8vl2S614_rB4brjSmZkGM5cStiMZlHA&s=10"
              alt="PEA Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
            <div>
              <span
                className="text-lg font-bold tracking-tight text-slate-900 block leading-none"
                style={{ fontFamily: 'Prompt', fontSize: '31px' }}
              >
                PEA Order
              </span>
              <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-pea-gold"></span>
                Dashboard
              </span>
            </div>
        </div>

        {/* Sidebar navigation options */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => scrollToSection("app-main-body", "overview")}
            className={`w-full flex items-center justify-start text-left gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-purple-100/75 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span>ภาพรวมแดชบอร์ด</span>
          </button>

          <button
            onClick={() => scrollToSection("dashboard-insights-grid", "insights")}
            className={`w-full flex items-center justify-start text-left gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "insights"
                ? "bg-purple-100/75 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <span>AI ช่วยติดตามงาน</span>
          </button>

          <button
            onClick={() => scrollToSection("dashboard-charts-grid", "trends")}
            className={`w-full flex items-center justify-start text-left gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "trends"
                ? "bg-purple-100/75 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <BarChart3 className="w-5 h-5 flex-shrink-0" />
            <span>แนวโน้มปริมาณงาน</span>
          </button>

          <button
            onClick={() => scrollToSection("order-explorer-section", "explorer")}
            className={`w-full flex items-center justify-start text-left gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "explorer"
                ? "bg-purple-100/75 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 flex-shrink-0" />
            <span>รายการงานติดตั้ง</span>
          </button>

          <button
            onClick={() => scrollToSection("labor-cost-summary-section", "labor")}
            className={`w-full flex items-center justify-start text-left gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "labor"
                ? "bg-purple-100/75 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Coins className="w-5 h-5 flex-shrink-0" />
            <span>รายงานสรุปค่าแรง</span>
          </button>

          <button
            onClick={() => scrollToSection("report-form52-section", "report52")}
            className={`w-full flex items-center justify-start text-left gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "report52"
                ? "bg-purple-100/75 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span>สร้างเอกสารค่าแรง</span>
          </button>
        </nav>

        {/* Sidebar Footer Metric Goal Widget */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
              <span>เป้าหมายงานติดตั้ง</span>
              <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">{(stats?.completionRate || 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats?.completionRate || 100}%` }}
              ></div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 font-medium">งานที่ติดตั้งเสร็จสิ้นตามเกณฑ์ปี</p>
          </div>

          {/* Styled Developer Credit Block */}
          <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/20 dark:via-slate-900/40 dark:to-indigo-950/20 border border-purple-100/70 dark:border-purple-900/30 p-3 rounded-xl flex items-start gap-2.5 shadow-xs">
            <div className="p-1.5 bg-white dark:bg-slate-900 rounded-lg text-purple-600 dark:text-purple-400 shadow-xs border border-purple-100/50 dark:border-purple-900/20 flex-shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold uppercase tracking-wider" style={{ color: '#c500c8', fontSize: '10px', fontFamily: 'Prompt' }}>พัฒนาระบบโดย</p>
              <p className="font-bold mt-0.5 truncate font-sans" style={{ fontSize: '18px', color: '#780067', fontFamily: 'Prompt' }}>นายศราวุธ คำงาม</p>
              <p className="font-medium mt-0.5 font-sans" style={{ fontSize: '14px', lineHeight: '15.25px', color: '#5f0063', fontFamily: 'Prompt' }}>พชง.6 ผมต.กฟส.บผ.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0" id="main-content-wrapper">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs" id="app-main-header">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Sidebar Toggle Button */}
            <button
              id="mobile-sidebar-toggle"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors mr-1"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="truncate flex items-center gap-3">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7lNYrLaOUdME8vl2S614_rB4brjSmZkGM5cStiMZlHA&s=10"
                alt="PEA Logo"
                className="h-10 w-auto object-contain hidden md:block"
                referrerPolicy="no-referrer"
              />
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <h1
                    className="font-bold text-slate-900 tracking-tight border-b-2 border-purple-600 pb-0.5"
                    style={{
                      fontFamily: 'Prompt',
                      fontStyle: 'normal',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      lineHeight: '45px',
                      fontSize: '28px'
                    }}
                  >
                    Meter BPI Order Dashboard
                  </h1>
                  {stats?.isMock && (
                    <span className="inline-flex items-center text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                      Resilient Mock Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5 hidden sm:block">
                  ระบบรายงานและวิเคราะห์งานติดตั้งอุปกรณ์มิเตอร์ด้วย AI
                </p>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right hidden md:block">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">สถานะข้อมูลล่าสุด</p>
              <p className="text-xs font-semibold text-slate-600 flex items-center justify-end gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </p>
            </div>

            {/* Dark Mode Toggle Button */}
            <button
              id="dark-mode-toggle"
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all shadow-xs hover:shadow-sm cursor-pointer"
              title={darkMode ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-500 animate-[spin_12s_linear_infinite]" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>
            
            <button
              id="refresh-database-btn"
              disabled={refreshing}
              onClick={handleRefreshData}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs hover:shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-purple-600" : "text-slate-500"}`} />
              <span className="hidden sm:inline">{refreshing ? "กำลังรีเฟรช..." : "อัพเดทข้อมูล"}</span>
              <span className="sm:hidden">{refreshing ? "..." : "รีเฟรช"}</span>
            </button>
          </div>
        </header>

        {/* Main Padded scroll area */}
        <main className="flex-1 p-4 lg:p-8 space-y-6 overflow-y-auto w-full" id="app-main-body">
          {/* Error Notification Alert */}
          {error && (
            <div
              id="error-banner-alert"
              className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">ระบบแสดงคำเตือน</p>
                <p className="text-amber-700/90 mt-0.5 leading-relaxed">
                  {error} - คุณยังคงใช้งานรายงานได้ตามปกติ เนื่องจากระบบจัดสรรฐานข้อมูลสำรองความปลอดภัยไว้เรียบร้อยแล้ว
                </p>
              </div>
              <button onClick={() => setError(null)} className="text-amber-500 hover:text-amber-800 font-bold px-1 text-sm">
                ✕
              </button>
            </div>
          )}

          {/* Dashboard Skeleton Loading */}
          {loading && !stats ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3" id="app-loading-skeleton">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-xs text-slate-400 font-medium animate-pulse">
                กำลังจัดเตรียมภาพสรุปรายงาน แดชทบอร์ดระบบติดตั้งมิเตอร์...
              </p>
            </div>
          ) : (
            <>
              {/* Year and Month filter selector strip */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4" id="year-filter-banner">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-4.5 h-4.5 text-purple-500" />
                    <span className="text-xs font-bold text-slate-700">กรองปีดำเนินงาน:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5" id="year-pills-container">
                    <button
                      id="year-pill-all"
                      onClick={() => {
                        setSelectedYear("All");
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                        selectedYear === "All"
                          ? "bg-purple-600 text-white shadow-sm shadow-purple-100"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      ทั้งหมด (รวมปี)
                    </button>
                    {stats?.uniqueYears?.map((yr: string) => (
                      <button
                        key={yr}
                        id={`year-pill-${yr}`}
                        onClick={() => {
                          setSelectedYear(yr);
                          setCurrentPage(1);
                        }}
                        className={`px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                          selectedYear === yr
                            ? "bg-purple-600 text-white shadow-sm shadow-purple-100"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        ปี {yr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t pt-3 lg:border-t-0 lg:pt-0 border-slate-100">
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">กรองเดือน:</span>
                  <select
                    id="month-selector-dropdown"
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                  >
                    <option value="All">ทุกเดือน (All Months)</option>
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
              </div>

              {/* KPI Summary Strip */}
              {stats && (
                <KPICards
                  totalRevenue={stats.totalRevenue}
                  totalOrders={stats.totalOrders}
                  averageValue={stats.averageOrderValue}
                  completionRate={stats.completionRate}
                  isMock={stats.isMock}
                />
              )}

              {/* Operations Status Interactive Filter Cards */}
              {stats && stats.byStatus && (
                <StatusCards
                  byStatus={stats.byStatus}
                  selectedStatus={selectedStatus}
                  onStatusChange={(status) => {
                    setSelectedStatus(status);
                    setCurrentPage(1);
                  }}
                />
              )}

              {/* AI Strategic Consultant (SLA Tracking) */}
              <div id="dashboard-insights-grid" className="scroll-mt-24">
                {stats && <AIInsights stats={stats} selectedYear={selectedYear} selectedMonth={selectedMonth} />}
              </div>

              {/* Charts Grid layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 scroll-mt-24" id="dashboard-charts-grid">
                <div className="lg:col-span-12 h-full">
                  {stats && (
                    <SalesChart
                      data={stats.byMonth}
                      selectedMonth={selectedMonth}
                      onMonthChange={(m) => {
                        setSelectedMonth(m);
                        setCurrentPage(1);
                      }}
                    />
                  )}
                </div>
                <div className="lg:col-span-6 h-full">
                  {stats && (
                    <CategoryChart
                      data={stats.byMeterSize}
                      selectedSize={selectedSize}
                      onSizeChange={(s) => {
                        setSelectedSize(s);
                        setCurrentPage(1);
                      }}
                    />
                  )}
                </div>
                <div className="lg:col-span-6 h-full">
                  {stats && (
                    <AreaChart
                      data={stats.byArea}
                      selectedArea={selectedArea}
                      onAreaChange={(a) => {
                        setSelectedArea(a);
                        setCurrentPage(1);
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Raw orders database table explorer */}
              {stats && (
                <OrderExplorer
                  orders={ordersData.orders}
                  totalCount={ordersData.total}
                  currentPage={currentPage}
                  totalPages={ordersData.totalPages}
                  onPageChange={setCurrentPage}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedYear={selectedYear}
                  onYearChange={setSelectedYear}
                  selectedMonth={selectedMonth}
                  onMonthChange={(m) => {
                    setSelectedMonth(m);
                    setCurrentPage(1);
                  }}
                  selectedArea={selectedArea}
                  onAreaChange={setSelectedArea}
                  selectedSize={selectedSize}
                  onSizeChange={setSelectedSize}
                  selectedStatus={selectedStatus}
                  onStatusChange={setSelectedStatus}
                  uniqueYears={stats.uniqueYears || []}
                  uniqueAreas={stats.uniqueAreas || []}
                  uniqueSizes={stats.uniqueMeterSizes || []}
                  onStatusUpdate={handleStatusUpdate}
                />
              )}

              {/* Labor cost summary report section */}
              {stats && (
                <LaborCostSummary
                  techniciansList={stats.byTechnician?.map((t: any) => t.name) || []}
                  yearsList={stats.uniqueYears || []}
                  initialYear={selectedYear}
                />
              )}

              {/* Form สร.4-ป.52 Monthly Report section */}
              {stats && (
                <ReportForm52
                  initialYear={selectedYear}
                  initialMonth={selectedMonth}
                  yearsList={stats.uniqueYears || []}
                  selectedArea={selectedArea}
                  selectedSize={selectedSize}
                  selectedStatus={selectedStatus}
                  searchQuery={searchQuery}
                  onOrderUpdated={handleStatusUpdate}
                />
              )}

            </>
          )}
        </main>

        {/* Aesthetic Footer with Visitor Counter at the very bottom of the board */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 py-6 px-6 text-slate-400 text-xs" id="app-footer">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-bold" style={{ fontSize: "15px", color: "#850599" }}>
              <HelpCircle className="w-4 h-4" style={{ color: "#850599" }} />
              แผนกมิเตอร์และหม้อแปลง การไฟฟ้าส่วนภูมิภาค สาขาบ้านไผ่
            </span>
            
            <div className="flex items-center gap-2.5 bg-purple-50/50 dark:bg-purple-950/15 px-3.5 py-1.5 rounded-xl border border-purple-100/40 dark:border-purple-900/15">
              <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">จำนวนเข้าชมเว็บ</span>
              <span className="font-mono text-xs font-black text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-purple-100/75 dark:border-purple-900/40 shadow-xs">
                {visitCount.toLocaleString()}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
