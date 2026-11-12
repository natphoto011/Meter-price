import React, { useState } from "react";
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Bell, 
  MapPin, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  BrainCircuit,
  Coins,
  Calendar,
  Activity,
  RefreshCw
} from "lucide-react";
import { maskCustomerName } from "../utils/masking";

interface AIInsightsProps {
  stats: any;
  selectedYear: string;
  selectedMonth: string;
}

export default function AIInsights({ stats, selectedYear, selectedMonth }: AIInsightsProps) {
  const [activeSubTab, setActiveSubTab] = useState<"sla" | "predict">("sla");
  const [notifiedOrders, setNotifiedOrders] = useState<Record<string, boolean>>({});
  
  // Predict States
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [predictResult, setPredictResult] = useState<any>(null);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const handleFollowUp = (id: string) => {
    setNotifiedOrders(prev => ({ ...prev, [id]: true }));
  };

  const runPrediction = async () => {
    setLoadingPredict(true);
    setPredictError(null);
    setLoadingStep(1);

    // Simulated premium step sequencing matching actual timing
    const step1 = setTimeout(() => setLoadingStep(2), 1000);
    const step2 = setTimeout(() => setLoadingStep(3), 2000);
    const step3 = setTimeout(() => setLoadingStep(4), 3200);

    try {
      const response = await fetch("/api/predict-next-month", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stats, selectedYear, selectedMonth }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Delay to ensure smooth presentation of steps
      setTimeout(() => {
        setPredictResult(data);
        setLoadingPredict(false);
      }, 4200);

    } catch (err: any) {
      console.error(err);
      setPredictError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI");
      setLoadingPredict(false);
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    }
  };

  const sla = stats?.slaStats || {
    inAreaCompletedTotal: 0,
    inAreaCompletedOnTime: 0,
    inAreaRate: 100,
    outAreaCompletedTotal: 0,
    outAreaCompletedOnTime: 0,
    outAreaRate: 100,
    pendingTotal: 0,
    pendingCriticalTotal: 0,
    criticalPendingList: []
  };

  // Helper to safely format currency
  const formatMoney = (val: number) => {
    if (val === undefined || val === null) return "0";
    return val.toLocaleString("th-TH");
  };

  return (
    <div
      id="ai-insights-panel"
      className="bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden space-y-6"
    >
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header section with Sub Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Ai วิเคราะห์ข้อมูลและติดตามงานให้ทันตามกำหนด
              <span className="text-[10px] uppercase tracking-wider bg-purple-500/30 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono">
                AI Agent
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              ระบบตรวจสอบและวิเคราะห์ข้อมูลบริการ (SLA) พยากรณ์ความต้องการติดตั้งมิเตอร์และงบประมาณ
            </p>
          </div>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 self-start md:self-center">
          <button
            onClick={() => setActiveSubTab("sla")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === "sla"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            ระบบเฝ้าระวัง SLA
          </button>
          <button
            onClick={() => setActiveSubTab("predict")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === "predict"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            คาดการณ์ความต้องการ & ค่าใช้จ่ายด้วย AI
          </button>
        </div>
      </div>

      {/* Active Tab rendering */}
      {activeSubTab === "sla" ? (
        <>
          {/* 1. SLA Performance Panel */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4" id="sla-performance-cards">
            {/* In-Area SLA */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-purple-900/50 transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    SLA งานในเขตเทศบาล
                  </span>
                  <p className="text-xs text-slate-300">ระยะเวลาติดตั้งภายใน 3 วันทำการ</p>
                </div>
                <span className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-white font-mono">
                    {sla.inAreaRate.toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-400">
                    ตรงเวลา {sla.inAreaCompletedOnTime} / {sla.inAreaCompletedTotal} งาน
                  </span>
                </div>
                {/* Custom progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${sla.inAreaRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Out-of-Area SLA */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-purple-900/50 transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    SLA งานนอกเขตเทศบาล
                  </span>
                  <p className="text-xs text-slate-300">ระยะเวลาติดตั้งภายใน 5 วันทำการ</p>
                </div>
                <span className="p-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/10 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-white font-mono">
                    {sla.outAreaRate.toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-400">
                    ตรงเวลา {sla.outAreaCompletedOnTime} / {sla.outAreaCompletedTotal} งาน
                  </span>
                </div>
                {/* Custom progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${sla.outAreaRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Pending & Alert Counter */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-rose-950/40 transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    งานคงเหลือ & ติดตามความล่าช้า
                  </span>
                  <p className="text-xs text-slate-300">ตรวจสอบงานรอดำเนินการ</p>
                </div>
                {sla.pendingCriticalTotal > 0 ? (
                  <span className="p-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg animate-pulse">
                    <ShieldAlert className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="p-1.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">งานค้างทั้งหมด</p>
                  <span className="text-2xl font-bold text-white font-mono">{sla.pendingTotal}</span>
                  <span className="text-slate-400 text-xs"> งาน</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold flex items-center justify-end gap-1">
                    {sla.pendingCriticalTotal > 0 && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />}
                    ใกล้/เกินกำหนด (วิกฤต)
                  </p>
                  <span className="text-2xl font-bold text-rose-500 font-mono">
                    {sla.pendingCriticalTotal}
                  </span>
                  <span className="text-rose-400 text-xs"> งาน</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Red Alarm Panel for Critical Pending Jobs */}
          {sla.pendingCriticalTotal > 0 ? (
            <div 
              className="bg-gradient-to-r from-rose-950/40 to-slate-900/80 border border-rose-950/70 rounded-2xl p-5 relative overflow-hidden"
              id="critical-sla-alerts-panel"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-4">
                <span className="p-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl">
                  <Bell className="w-4 h-4 animate-bounce" />
                </span>
                <div>
                  <h5 className="text-sm font-bold text-rose-200 flex items-center gap-2">
                    🚨 ระบบแจ้งเตือนงานวิกฤตความคืบหน้า (SLA Critical Alerts)
                  </h5>
                  <p className="text-xs text-rose-300/80 mt-0.5">
                    รายชื่อผู้ใช้ไฟฟ้าที่สถานะยังไม่เสร็จสิ้น (Pending) และเลยกำหนดเวลาติดตั้ง หรือเหลือเวลาทำงานน้อยกว่า 1 วัน
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-rose-950/40 bg-slate-950/60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-rose-950/30 text-rose-200 uppercase font-bold border-b border-rose-950/40">
                    <tr>
                      <th className="py-2.5 px-3">เลขที่ใบสั่งงาน / ชื่อผู้ใช้ไฟ</th>
                      <th className="py-2.5 px-3">พื้นที่ / วันเริ่มสร้างงาน</th>
                      <th className="py-2.5 px-3">กำหนดส่งมอบ</th>
                      <th className="py-2.5 px-3 text-center">สถานะติดตาม</th>
                      <th className="py-2.5 px-3 text-right">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-950/25">
                    {sla.criticalPendingList.map((item: any) => {
                      const isNotified = notifiedOrders[item.id];
                      return (
                        <tr 
                          key={item.id} 
                          className="hover:bg-rose-950/15 transition-all"
                        >
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-rose-300 font-bold block">{item.requestId}</span>
                            <span className="text-slate-300 block text-[11px] truncate max-w-[150px]">
                              {maskCustomerName(item.customerName)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-slate-300 block text-[11px] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {item.area}
                            </span>
                            <span className="text-slate-500 block text-[10px]">เริ่ม: {item.date}</span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-200">
                            {item.dueDate}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {item.isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                <AlertCircle className="w-3 h-3" />
                                เกินกำหนด {Math.abs(item.workingDaysLeft)} วัน
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                <Clock className="w-3 h-3" />
                                เหลือ {item.workingDaysLeft} วันทำการ
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleFollowUp(item.id)}
                              disabled={isNotified}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ml-auto ${
                                isNotified 
                                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/20 cursor-default" 
                                  : "bg-rose-600 hover:bg-rose-500 text-white shadow-xs hover:scale-102"
                              }`}
                            >
                              {isNotified ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  ส่งเรื่องแล้ว
                                </>
                              ) : (
                                <>
                                  <Bell className="w-3 h-3" />
                                  ติดตามด่วน
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 text-center text-xs text-slate-400">
              🎉 ยอดเยี่ยม! ไม่มีงานค้างรอดำเนินการที่ใกล้หรือเกินกำหนดส่งมอบ (SLA) ในขณะนี้
            </div>
          )}
        </>
      ) : (
        /* Predictive Tab view */
        <div className="relative z-10 space-y-6">
          {predictError && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-xs text-rose-300 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">เกิดข้อผิดพลาดในการดึงข้อมูลคาดการณ์จาก AI</p>
                <p className="opacity-90 mt-0.5">{predictError}</p>
              </div>
            </div>
          )}

          {loadingPredict ? (
            /* Loading sequence */
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 border border-slate-800/80 rounded-2xl bg-slate-950/40">
              <div className="relative mb-6">
                <div className="w-14 h-14 rounded-full border-4 border-purple-500/10 border-t-purple-500 animate-spin" />
                <BrainCircuit className="w-6 h-6 text-purple-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">กำลังรันการวิเคราะห์พยากรณ์ PEA AI</h4>
              <p className="text-xs text-slate-400 max-w-sm mb-6">กำลังเชื่อมต่อกับโมเดลประมวลผลข้อมูลระดับสูงและจัดอันดับความต้องการในเดือนถัดไป...</p>
              
              <div className="w-full max-w-md space-y-3">
                {[
                  { id: 1, label: "รวบรวมประวัติการดำเนินงานและสถิติขนาดมิเตอร์สะสม" },
                  { id: 2, label: "วิเคราะห์พฤติกรรมการเติบโตและความหนาแน่นรายพื้นที่" },
                  { id: 3, label: "ประมวลผลการจำลองแนวโน้มปริมาณร่วมกับ Gemini 3.5 Flash" },
                  { id: 4, label: "สรุปงบประมาณค่าใช้จ่ายและประมาณการความต้องการพัสดุรายขนาด" }
                ].map((step) => {
                  const isActive = loadingStep === step.id;
                  const isDone = loadingStep > step.id;
                  return (
                    <div 
                      key={step.id} 
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        isActive 
                          ? "bg-purple-950/50 border-purple-700 text-purple-300" 
                          : isDone 
                            ? "bg-slate-900/30 border-slate-800/50 text-slate-400" 
                            : "bg-transparent border-transparent text-slate-600"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isDone 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                          : isActive 
                            ? "bg-purple-600 text-white border border-purple-500 animate-pulse" 
                            : "bg-slate-950 text-slate-500 border border-slate-800"
                      }`}>
                        {isDone ? "✓" : step.id}
                      </div>
                      <span className="text-xs font-medium">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : predictResult ? (
            /* Prediction Results */
            <div className="space-y-6 animate-fadeIn">
              {/* 1. Side-by-Side Comparison Container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="prediction-comparison-container">
                
                {/* Meter Demand Comparison Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-purple-900/30 transition-all space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">ประมาณการความต้องการใช้มิเตอร์</h5>
                      <p className="text-[10px] text-slate-500">เปรียบเทียบเดือนฐานและเดือนพยากรณ์ถัดไป</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 items-center text-center gap-2 pt-2">
                    {/* Left: Base Month */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium block truncate">
                        {predictResult.referenceMonthName || "เดือนฐานอ้างอิง"}
                      </span>
                      <span className="text-xl font-bold font-mono text-slate-300 block">
                        {predictResult.referenceDemand || 0}
                      </span>
                      <span className="text-[10px] text-slate-500 block">เครื่อง (ติดตั้งจริง)</span>
                    </div>

                    {/* Middle: Arrow and Change Rate */}
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <div className="flex items-center justify-center text-slate-400 bg-slate-950/80 p-1.5 rounded-full border border-slate-800">
                        <ArrowRight className="w-4 h-4 text-purple-400" />
                      </div>
                      {predictResult.demandChangePercent !== undefined && (
                        <span className={`text-[11px] font-bold font-mono flex items-center gap-0.5 ${
                          predictResult.demandChangePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {predictResult.demandChangePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {predictResult.demandChangePercent >= 0 ? "+" : ""}{predictResult.demandChangePercent}%
                        </span>
                      )}
                    </div>

                    {/* Right: Predicted Month */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-purple-300 font-bold block truncate">
                        {predictResult.nextMonthName || "เดือนถัดไป"}
                      </span>
                      <span className="text-2xl font-black font-mono text-emerald-400 block">
                        {predictResult.predictedDemand || 0}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold block">เครื่อง (พยากรณ์ AI)</span>
                    </div>
                  </div>
                </div>

                {/* Labor Budget Cost Comparison Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-purple-900/30 transition-all space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">ประมาณการงบประมาณค่าใช้จ่าย/ค่าแรงช่าง</h5>
                      <p className="text-[10px] text-slate-500">เปรียบเทียบรวมระหว่างสองเดือน</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 items-center text-center gap-2 pt-2">
                    {/* Left: Base Month */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium block truncate">
                        {predictResult.referenceMonthName || "เดือนฐานอ้างอิง"}
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-300 block truncate">
                        ฿{formatMoney(predictResult.referenceCost || 0)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">บาท (จ่ายจริง)</span>
                    </div>

                    {/* Middle: Arrow and Change Rate */}
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <div className="flex items-center justify-center text-slate-400 bg-slate-950/80 p-1.5 rounded-full border border-slate-800">
                        <ArrowRight className="w-4 h-4 text-purple-400" />
                      </div>
                      {predictResult.costChangePercent !== undefined && (
                        <span className={`text-[11px] font-bold font-mono flex items-center gap-0.5 ${
                          predictResult.costChangePercent >= 0 ? "text-indigo-400" : "text-rose-400"
                        }`}>
                          {predictResult.costChangePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {predictResult.costChangePercent >= 0 ? "+" : ""}{predictResult.costChangePercent}%
                        </span>
                      )}
                    </div>

                    {/* Right: Predicted Month */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-purple-300 font-bold block truncate">
                        {predictResult.nextMonthName || "เดือนถัดไป"}
                      </span>
                      <span className="text-lg font-black font-mono text-indigo-400 block truncate">
                        ฿{formatMoney(predictResult.predictedCost || 0)}
                      </span>
                      <span className="text-[10px] text-indigo-400 font-semibold block">บาท (พยากรณ์ AI)</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bento Grid: Meter Sizes and Operating Areas Predictions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Meter Sizes Predict Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                      ขนาดมิเตอร์คาดว่าความต้องการสูง
                    </h5>
                    <span className="text-[10px] text-slate-400">Demand Rank</span>
                  </div>

                  <div className="space-y-3">
                    {predictResult.topMeterSizes?.map((m: any, idx: number) => (
                      <div key={idx} className="bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-xl space-y-1.5 hover:border-purple-900/30 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-300">ขนาด {m.name}</span>
                          <span className="text-xs font-mono font-bold text-white bg-purple-900/40 border border-purple-800/30 px-2 py-0.5 rounded-md">
                            ~ {m.count} เครื่อง
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{m.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operating Areas Predict Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      พื้นที่เป้าหมายความหนาแน่นสูง
                    </h5>
                    <span className="text-[10px] text-slate-400">Density Share</span>
                  </div>

                  <div className="space-y-3">
                    {predictResult.topAreas?.map((a: any, idx: number) => (
                      <div key={idx} className="bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-xl space-y-1.5 hover:border-emerald-900/30 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {a.name}
                          </span>
                          <span className="text-xs font-mono font-bold text-white bg-emerald-900/40 border border-emerald-800/30 px-2 py-0.5 rounded-md">
                            {a.percentage}%
                          </span>
                        </div>
                        {/* Custom visual horizontal bar */}
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden my-1">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${a.percentage}%` }} />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{a.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Executive Strategy Text (Detailed analysis) */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-purple-500/15 text-purple-400 border border-purple-500/10 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <h5 className="text-xs font-bold text-purple-200 uppercase tracking-wider">บทวิเคราะห์แผนกลยุทธ์เชิงปฏิบัติสำหรับผู้บริหาร PEA AI</h5>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-900/60 px-2.5 py-0.5 rounded-full font-bold">
                    ความแม่นยำคาดการณ์: {predictResult.confidenceLevel}%
                  </span>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed space-y-2 font-sans whitespace-pre-wrap">
                  {predictResult.aiAnalysisText}
                </div>
              </div>

              {/* Footer Controls */}
              <div className="flex justify-between items-center bg-slate-950/60 p-4 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  ประมวลผลข้อมูลสดของยอดช่างเทคนิคและข้อมูลการติดตั้งล่าสุด ณ ปัจจุบัน
                </span>
                <button
                  onClick={runPrediction}
                  className="px-4 py-2 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-slate-900/50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  วิเคราะห์ผลใหม่อีกครั้ง
                </button>
              </div>
            </div>
          ) : (
            /* Teaser screen */
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 border border-slate-800/80 rounded-2xl bg-slate-950/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="p-4 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 mb-4 animate-pulse">
                <BrainCircuit className="w-10 h-10" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">คาดการณ์แนวโน้มพัสดุมิเตอร์และประมาณการค่าใช้จ่ายด้วย AI</h4>
              <p className="text-xs text-slate-400 max-w-lg mb-6 leading-relaxed">
                จำลองความต้องการใช้พัสดุมิเตอร์รายขนาด คาดคะเนยอดความหนาแน่นรายพื้นที่ปฏิบัติการ และวิเคราะห์ประมาณการงบประมาณค่าแรงช่างใน <strong>"เดือนถัดไป"</strong> อย่างเป็นวิทยาศาสตร์ด้วยโมเดลวิเคราะห์ความเชื่อมโยงฤดูกาลของการไฟฟ้าส่วนภูมิภาค
              </p>
              <button
                onClick={runPrediction}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950/50 hover:scale-102 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                เริ่มต้นการวิเคราะห์และคาดการณ์ AI
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
