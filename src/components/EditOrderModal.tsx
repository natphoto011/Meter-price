import React, { useState, useEffect } from "react";
import { Order } from "../types";
import {
  validateOrderSizeAndWorkType,
  PEA_METER_SIZE_OPTIONS,
  PEA_WORK_TYPE_PRESETS,
  OrderValidationResult,
} from "../utils/orderValidation";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Save,
  Loader2,
  Sparkles,
  Zap,
  Info,
} from "lucide-react";

interface EditOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedOrder: Order) => void;
}

export default function EditOrderModal({
  order,
  isOpen,
  onClose,
  onSaved,
}: EditOrderModalProps) {
  if (!isOpen || !order) return null;

  const [meterSize, setMeterSize] = useState<string>(order.meterSize || "");
  const [workTypeIn, setWorkTypeIn] = useState<string>(order.workTypeIn || "");
  const [costIn, setCostIn] = useState<number>(order.costIn || 0);
  const [workTypeOut, setWorkTypeOut] = useState<string>(order.workTypeOut || "");
  const [costOut, setCostOut] = useState<number>(order.costOut || 0);
  const [phase, setPhase] = useState<string>(order.phase || "1");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync state when incoming order changes
  useEffect(() => {
    if (order) {
      setMeterSize(order.meterSize || "");
      setWorkTypeIn(order.workTypeIn || "");
      
      const numIn = Number(order.costIn) || 0;
      const numOut = Number(order.costOut) || 0;
      const numTotal = Number(order.totalCost) || 0;

      if (numIn === 0 && numOut === 0 && numTotal > 0) {
        const isOut = (order.area || "").toLowerCase().includes("นอกเขต");
        if (isOut) {
          setCostIn(0);
          setCostOut(numTotal);
        } else {
          setCostIn(numTotal);
          setCostOut(0);
        }
      } else {
        setCostIn(numIn);
        setCostOut(numOut);
      }

      setWorkTypeOut(order.workTypeOut || "");
      setPhase(order.phase || "1");
      setSaveError(null);
    }
  }, [order]);

  // Live preview order
  const previewOrder: Order = {
    ...order,
    meterSize,
    workTypeIn,
    costIn,
    workTypeOut,
    costOut,
    totalCost: (Number(costIn) || 0) + (Number(costOut) || 0),
    phase,
  };

  const validation: OrderValidationResult = validateOrderSizeAndWorkType(previewOrder);

  // Handler for selecting a standard preset work type
  const handleApplyPreset = (preset: (typeof PEA_WORK_TYPE_PRESETS)[0]) => {
    const isOut = (order.area || "").toLowerCase().includes("นอกเขต");
    if (isOut) {
      setWorkTypeOut(preset.description);
      setCostOut(preset.priceOut);
    } else {
      setWorkTypeIn(preset.description);
      setCostIn(preset.priceIn);
    }
    setPhase(preset.phase);

    // If current meter size contradicts the new work type's phase, auto-suggest standard meter size
    if (preset.phase === "3" && !meterSize.toLowerCase().includes("3p")) {
      setMeterSize("30(100)A 3P 4W");
    } else if (preset.phase === "1" && !meterSize.toLowerCase().includes("1p")) {
      setMeterSize("15(45)A 1P 2W");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaveError(null);

    try {
      const numIn = Number(costIn) || 0;
      const numOut = Number(costOut) || 0;
      let finalTotalCost = numIn + numOut;
      if (finalTotalCost === 0 && (Number(order.totalCost) || 0) > 0) {
        finalTotalCost = Number(order.totalCost) || 0;
      }

      const updates = {
        meterSize: meterSize.trim(),
        workTypeIn: workTypeIn.trim(),
        costIn: numIn,
        workTypeOut: workTypeOut.trim(),
        costOut: numOut,
        phase: phase.trim(),
        totalCost: finalTotalCost,
      };

      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }

      const resData = await res.json();
      const updatedOrder = resData.order || { ...order, ...updates };
      onSaved(updatedOrder);
      onClose();
    } catch (err: any) {
      console.error("Save order error:", err);
      setSaveError(err.message || "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                แก้ไขข้อมูลใบสั่งจ้าง
              </span>
              <span className="font-mono text-xs text-slate-500 font-semibold">
                คำร้อง: {order.requestId || order.id}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-800 mt-1 truncate max-w-md">
              {order.customerName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Live Validation Alert Banner */}
          {validation.hasMismatch ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1">
                <span className="font-bold text-rose-900 block mb-0.5">
                  ตรวจพบข้อมูลไม่ตรงกัน:
                </span>
                <p className="font-medium text-rose-700">{validation.reason}</p>
                <p className="text-[11px] text-rose-600 mt-1">
                  กรุณาปรับขนาดมิเตอร์หรือประเภทงานให้สอดคล้องกัน (เช่น ขนาด 1P ต้องตรงกับประเภทงาน 1P2W หรือ 3P ตรงกับ 3P4W)
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-bold">
                ข้อมูลขนาด ({previewOrder.meterSize}) และประเภทงานสอดคล้องกันเรียบร้อย
              </span>
            </div>
          )}

          {/* Quick Presets / Suggestions */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                เลือกประเภทงานมาตรฐาน PEA (คลิกเพื่อแก้ไขอัตโนมัติ):
              </span>
              <span className="text-[10px] text-slate-400">
                พื้นที่: {order.area || "ไม่ระบุ"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
              {PEA_WORK_TYPE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="text-left px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="truncate mr-2">
                    <span className={`inline-block px-1 py-0.2 mr-1 rounded text-[9px] font-bold ${p.phase === "3" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"}`}>
                      {p.phase}P
                    </span>
                    <span className="text-slate-700 text-[11px] group-hover:text-blue-700">
                      {p.description}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 flex-shrink-0">
                    ฿{p.priceIn}/{p.priceOut}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Meter Size Column */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>ขนาดมิเตอร์ (Meter Size)</span>
                {validation.sizeMismatch && (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    ⚠️ ข้อมูลไม่ตรง
                  </span>
                )}
              </label>

              {/* Quick Size Select */}
              <select
                value={PEA_METER_SIZE_OPTIONS.includes(meterSize) ? meterSize : ""}
                onChange={(e) => {
                  if (e.target.value) setMeterSize(e.target.value);
                }}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">-- เลือกขนาดมิเตอร์มาตรฐาน --</option>
                {PEA_METER_SIZE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              {/* Free-text input */}
              <input
                type="text"
                value={meterSize}
                onChange={(e) => setMeterSize(e.target.value)}
                placeholder="เช่น 15(45)A 1P 2W หรือ 30(100)A 3P 4W"
                className={`w-full px-3 py-2 text-xs rounded-xl border font-medium transition-all ${
                  validation.sizeMismatch
                    ? "border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-400"
                    : "border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                }`}
                required
              />
            </div>

            {/* Phase Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>เฟสที่เชื่อมสาย (Phase)</span>
                <span className="text-[10px] text-slate-400">1 เฟส หรือ 3 เฟส</span>
              </label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPhase("1")}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    phase === "1" || phase === "1P"
                      ? "bg-sky-50 border-sky-500 text-sky-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>1 เฟส (1P)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhase("3")}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    phase === "3" || phase === "3P"
                      ? "bg-purple-50 border-purple-500 text-purple-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>3 เฟส (3P)</span>
                </button>
              </div>
            </div>

            {/* Work Type In-Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>ประเภทงานในเขต (Work Type In)</span>
                <span className="text-[10px] text-slate-400">ในเขตเทศบาล</span>
              </label>
              <input
                type="text"
                value={workTypeIn}
                onChange={(e) => setWorkTypeIn(e.target.value)}
                placeholder="เช่น ติดตั้งใหม่พร้อมเดินสายเข้ามิเตอร์และติดตั้งไม้แป้น(1P2W)"
                className={`w-full px-3 py-2 text-xs rounded-xl border font-medium transition-all ${
                  validation.workTypeMismatch && workTypeIn
                    ? "border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-400"
                    : "border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                }`}
              />
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">ค่าแรงในเขต:</span>
                <input
                  type="number"
                  value={costIn || ""}
                  onChange={(e) => setCostIn(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-lg text-right font-mono"
                />
                <span className="text-xs text-slate-400">บาท</span>
              </div>
            </div>

            {/* Work Type Out-Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>ประเภทงานนอกเขต (Work Type Out)</span>
                <span className="text-[10px] text-slate-400">นอกเขตเทศบาล</span>
              </label>
              <input
                type="text"
                value={workTypeOut}
                onChange={(e) => setWorkTypeOut(e.target.value)}
                placeholder="เช่น ติดตั้งใหม่พร้อมเดินสายเข้ามิเตอร์และติดตั้งไม้แป้น(1P2W)"
                className={`w-full px-3 py-2 text-xs rounded-xl border font-medium transition-all ${
                  validation.workTypeMismatch && workTypeOut
                    ? "border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-400"
                    : "border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                }`}
              />
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">ค่าแรงนอกเขต:</span>
                <input
                  type="number"
                  value={costOut || ""}
                  onChange={(e) => setCostOut(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-lg text-right font-mono"
                />
                <span className="text-xs text-slate-400">บาท</span>
              </div>
            </div>
          </div>

          {/* Wage Summary */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">ค่าแรงรวมที่คำนวณได้:</span>
            <span className="font-mono text-sm font-bold text-slate-900">
              ฿{((Number(costIn) || 0) + (Number(costOut) || 0)).toLocaleString()} บาท
            </span>
          </div>

          {/* Error Message */}
          {saveError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {saveError}
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกการแก้ไข</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
