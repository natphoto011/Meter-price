import React, { useState, useEffect } from "react";
import { Order } from "../types";
import { maskCustomerName, maskLocation, maskPhone } from "../utils/masking";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  MapPin,
  Phone,
  User,
  Cpu,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Check,
  Loader2,
  AlertTriangle,
  Lock,
  Pencil,
} from "lucide-react";
import { validateOrderSizeAndWorkType } from "../utils/orderValidation";
import EditOrderModal from "./EditOrderModal";

interface OrderExplorerProps {
  orders: Order[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchQuery: string;
  onSearchChange: (search: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  selectedArea: string;
  onAreaChange: (area: string) => void;
  selectedSize: string;
  onSizeChange: (size: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  uniqueYears: string[];
  uniqueAreas: string[];
  uniqueSizes: string[];
  onStatusUpdate?: () => void;
}

export default function OrderExplorer({
  orders,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  searchQuery,
  onSearchChange,
  selectedYear,
  onYearChange,
  selectedMonth,
  onMonthChange,
  selectedArea,
  onAreaChange,
  selectedSize,
  onSizeChange,
  selectedStatus,
  onStatusChange,
  uniqueYears,
  uniqueAreas,
  uniqueSizes,
  onStatusUpdate,
}: OrderExplorerProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [driveMapping, setDriveMapping] = useState<Record<string, string>>({});
  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; title: string } | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Password verification states
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleStatusClick = (statusValue: string) => {
    if (!selectedOrder) return;
    
    // Check if the clicked status is already the current status
    const isCurrent = 
      selectedOrder.status === statusValue || 
      (statusValue === "Complete" && (selectedOrder.status === "เสร็จสิ้น" || selectedOrder.status === "Completed" || selectedOrder.status === "Complete")) ||
      (statusValue === "Handover" && (selectedOrder.status === "ส่งมอบงาน" || selectedOrder.status === "Handover")) ||
      (statusValue === "Pending" && (selectedOrder.status === "รอดำเนินการ" || selectedOrder.status === "Pending")) ||
      (statusValue === "Cancel" && (selectedOrder.status === "ยกเลิก" || selectedOrder.status === "Cancel"));

    if (isCurrent) return;

    setPendingStatus(statusValue);
    setPasswordInput("");
    setPasswordError(null);
    setShowPasswordModal(true);
  };

  const handleConfirmPassword = () => {
    if (passwordInput === "meter") {
      if (pendingStatus) {
        handleUpdateStatus(pendingStatus);
      }
      setShowPasswordModal(false);
      setPendingStatus(null);
      setPasswordInput("");
      setPasswordError(null);
    } else {
      setPasswordError("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
    }
  };

  useEffect(() => {
    fetch("/api/drive-mapping")
      .then((res) => res.json())
      .then((data) => setDriveMapping(data))
      .catch((err) => console.error("Error loading drive mapping:", err));
  }, []);

  useEffect(() => {
    setActivePhotoIndex(0);
    setStatusMessage(null);
  }, [selectedOrder]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status on the server");
      }

      const result = await response.json();
      if (result.success) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
        });

        setStatusMessage({
          type: "success",
          text: `เปลี่ยนสถานะเป็น "${newStatus}" สำเร็จ!`,
        });

        if (onStatusUpdate) {
          onStatusUpdate();
        }
      } else {
        throw new Error(result.error || "Failed to update");
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: err.message || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getDriveFileId = (sheetPhotoPath?: string) => {
    if (!sheetPhotoPath) return null;
    
    // Extract filename from path (e.g. "Order2024_Images/xyz.jpg" -> "xyz.jpg")
    const parts = sheetPhotoPath.split("/");
    const filename = parts[parts.length - 1];
    if (!filename) return null;

    // 1. Try exact match
    if (driveMapping[filename]) {
      return driveMapping[filename];
    }

    // 2. Try fuzzy match by photo type and timestamp
    const fnParts = filename.split(".");
    if (fnParts.length >= 3) {
      const photoType = fnParts[1];
      const timestamp = fnParts[2]; // e.g. "085905"
      if (photoType && timestamp) {
        // Look for a key in driveMapping that contains both photoType and timestamp
        const matchKey = Object.keys(driveMapping).find(
          (k) => k.includes(photoType) && k.includes(timestamp)
        );
        if (matchKey) {
          return driveMapping[matchKey];
        }
      }
    }
    
    return null;
  };

  const THAI_MONTHS = [
    { value: "01", label: "มกราคม (Jan)" },
    { value: "02", label: "กุมภาพันธ์ (Feb)" },
    { value: "03", label: "มีนาคม (Mar)" },
    { value: "04", label: "เมษายน (Apr)" },
    { value: "05", label: "พฤษภาคม (May)" },
    { value: "06", label: "มิถุนายน (Jun)" },
    { value: "07", label: "กรกฎาคม (Jul)" },
    { value: "08", label: "สิงหาคม (Aug)" },
    { value: "09", label: "กันยายน (Sep)" },
    { value: "10", label: "ตุลาคม (Oct)" },
    { value: "11", label: "พฤศจิกายน (Nov)" },
    { value: "12", label: "ธันวาคม (Dec)" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="order-explorer-section">
      {/* Header & Controls */}
      <div className="p-6 border-b border-slate-100" id="explorer-header">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h4 className="text-lg font-bold text-slate-800">
              รายการงานติดตั้งมิเตอร์
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              ค้นหา ตรวจสอบ และวิเคราะห์ประวัติคำร้องงานติดตั้ง อุปกรณ์เครื่องวัด พร้อมรายละเอียดของช่างปฏิบัติการ (คลิกองค์ประกอบบนกราฟด้านบนเพื่อกรองข้อมูลตรงนี้ได้)
            </p>
          </div>

          {/* Quick Stats Summary */}
          <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 self-start lg:self-center">
            พบข้อมูลทั้งหมด <span className="text-purple-600 font-bold font-mono text-sm">{totalCount.toLocaleString()}</span> แถว
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" id="filters-form-grid">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              id="search-orders-input"
              type="text"
              placeholder="ค้นหาชื่อ, เลขที่คำร้อง, เลขมิเตอร์..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {/* Year Filter */}
          <div className="relative">
            <select
              id="filter-year-select"
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-slate-700 appearance-none cursor-pointer"
            >
              <option value="All">ทุกปีดำเนินงาน</option>
              {uniqueYears.map((y) => (
                <option key={y} value={y}>
                  ปี ค.ศ. {y}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>

          {/* Month Filter */}
          <div className="relative">
            <select
              id="filter-month-select"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-slate-700 appearance-none cursor-pointer"
            >
              <option value="All">ทุกเดือนดำเนินงาน</option>
              {THAI_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>

          {/* Area Filter */}
          <div className="relative">
            <select
              id="filter-area-select"
              value={selectedArea}
              onChange={(e) => onAreaChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-slate-700 appearance-none cursor-pointer truncate pr-8"
            >
              <option value="All">ทุกประเภทพื้นที่ดำเนินงาน</option>
              {uniqueAreas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>

          {/* Meter Size Filter */}
          <div className="relative">
            <select
              id="filter-size-select"
              value={selectedSize}
              onChange={(e) => onSizeChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-slate-700 appearance-none cursor-pointer truncate pr-8"
            >
              <option value="All">ทุกขนาดมิเตอร์</option>
              {uniqueSizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              id="filter-status-select"
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-slate-700 appearance-none cursor-pointer truncate pr-8"
            >
              <option value="All">ทุกสถานะใบงาน</option>
              <option value="Complete">เสร็จสิ้น (Complete)</option>
              <option value="Handover">ส่งมอบงาน (Handover)</option>
              <option value="Pending">รอดำเนินการ (Pending)</option>
              <option value="Cancel">ยกเลิก (Cancel)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto" id="orders-table-wrapper">
        <table className="w-full text-left border-collapse" id="orders-data-table">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <th className="py-4 px-6">เลขที่คำร้อง / วันที่</th>
              <th className="py-4 px-6">ชื่อผู้ใช้ไฟฟ้า</th>
              <th className="py-4 px-6">ขนาดมิเตอร์ / เฟส</th>
              <th className="py-4 px-6">พื้นที่ปฏิบัติงาน</th>
              <th className="py-4 px-6 text-right">ค่าแรงรวม</th>
              <th className="py-4 px-6 text-center">สถานะ</th>
              <th className="py-4 px-6 text-center">ดูรายละเอียด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm text-slate-600">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  ไม่พบรายการติดตั้งมิเตอร์ตามเกณฑ์การค้นหาของคุณ
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const validation = validateOrderSizeAndWorkType(order);
                return (
                  <tr
                    key={order.id}
                    className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${
                      validation.hasMismatch ? "bg-rose-50/20" : ""
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Request ID & Date */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800 font-mono text-xs">
                        {order.requestId || order.id}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-slate-300" />
                        {order.date}
                      </div>
                    </td>

                    {/* Customer Name */}
                    <td className="py-4 px-6 font-medium text-slate-700 max-w-[180px] truncate">
                      {maskCustomerName(order.customerName)}
                    </td>

                    {/* Meter size */}
                    <td className="py-4 px-6">
                      <div 
                        className={`text-xs max-w-[180px] truncate ${
                          validation.sizeMismatch 
                            ? "text-rose-600 font-bold underline decoration-rose-300 decoration-dotted" 
                            : "font-medium text-slate-700"
                        }`}
                        title={validation.hasMismatch ? validation.reason : order.meterSize}
                      >
                        {order.meterSize || "-"}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {order.phase && (
                          <span className="inline-flex items-center text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                            Phase {order.phase}
                          </span>
                        )}
                        {validation.hasMismatch && (
                          <span 
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded"
                            title={validation.reason}
                          >
                            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                            <span>ไม่ตรงกัน</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Operational Area */}
                    <td className="py-4 px-6 text-xs font-medium text-slate-500">
                      {order.area}
                    </td>

                    {/* Cost */}
                    <td className="py-4 px-6 text-right font-semibold font-mono text-slate-800">
                      ฿{order.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold ${
                          order.status === "Complete" || order.status === "เสร็จสิ้น"
                            ? "bg-emerald-50 text-emerald-600"
                            : order.status === "Handover" || order.status === "ส่งมอบงาน"
                            ? "bg-indigo-50 text-indigo-600"
                            : order.status === "Cancel" || order.status === "ยกเลิก"
                            ? "bg-rose-50 text-rose-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {order.status === "Complete" || order.status === "เสร็จสิ้น" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        ) : order.status === "Handover" || order.status === "ส่งมอบงาน" ? (
                          <Check className="w-3.5 h-3.5 mr-1" />
                        ) : order.status === "Cancel" || order.status === "ยกเลิก" ? (
                          <X className="w-3.5 h-3.5 mr-1" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 mr-1" />
                        )}
                        {order.status || "Complete"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-1 justify-center">
                        <button
                          id={`view-order-btn-${order.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingOrder(order);
                          }}
                          className={`p-1.5 rounded-lg transition-all ${
                            validation.hasMismatch
                              ? "text-rose-600 hover:text-rose-800 hover:bg-rose-100 bg-rose-50"
                              : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          }`}
                          title="แก้ไขขนาด/ประเภทงาน"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between" id="pagination-controls-bar">
          <button
            id="prev-page-btn"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            ก่อนหน้า
          </button>

          <span className="text-xs font-medium text-slate-500">
            หน้า <span className="font-bold text-slate-700 font-mono">{currentPage}</span> จาก <span className="font-bold text-slate-700 font-mono">{totalPages}</span>
          </span>

          <button
            id="next-page-btn"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            ถัดไป
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Side Slide-out Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" id="drawer-backdrop">
          {/* Overlay mask */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedOrder(null)}
          />

          {/* Drawer content panel */}
          <div
            className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in-right border-l border-slate-100"
            id="drawer-panel"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  รายละเอียดใบคำร้องงาน
                </span>
                <h5 className="text-base font-bold text-slate-800 mt-1 font-mono">
                  {selectedOrder.requestId || selectedOrder.id}
                </h5>
              </div>
              <button
                id="close-drawer-btn"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable details list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Mismatch Warning in Drawer if present */}
              {(() => {
                const val = validateOrderSizeAndWorkType(selectedOrder);
                if (!val.hasMismatch) return null;
                return (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <span className="font-bold text-rose-900 block mb-0.5">ตรวจพบข้อมูลไม่ตรงกัน:</span>
                        <p className="text-rose-700 font-medium">{val.reason}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingOrder(selectedOrder)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>แก้ไขข้อมูล</span>
                    </button>
                  </div>
                );
              })()}

              {/* Customer summary */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-5 rounded-2xl border border-purple-100 flex items-start gap-4">
                <div className="p-3 bg-purple-500 text-white rounded-xl shadow-md">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wide">
                    ชื่อผู้ขอใช้ไฟ
                  </p>
                  <p className="font-bold text-slate-800 text-base truncate mt-0.5">
                    {maskCustomerName(selectedOrder.customerName)}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center mt-1">
                    <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {maskPhone(selectedOrder.phone) || "ไม่ระบุเบอร์โทรศัพท์"}
                  </p>
                </div>
              </div>

              {/* Interactive Status Editor */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    จัดการสถานะการติดตั้งปัจจุบัน
                  </h6>
                  {isUpdatingStatus ? (
                    <span className="text-[10px] text-purple-600 font-bold flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      กำลังบันทึก...
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">คลิกเพื่อเปลี่ยนสถานะ</span>
                  )}
                </div>

                {/* Status Selection Pill Options */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: "Complete", label: "เสร็จสิ้น", color: "emerald" },
                    { value: "Handover", label: "ส่งมอบงาน", color: "indigo" },
                    { value: "Pending", label: "รอดำเนินการ", color: "amber" },
                    { value: "Cancel", label: "ยกเลิก", color: "rose" },
                  ].map((statusOpt) => {
                    const isSelected = 
                      selectedOrder.status === statusOpt.value || 
                      (statusOpt.value === "Complete" && (selectedOrder.status === "เสร็จสิ้น" || selectedOrder.status === "Complete")) ||
                      (statusOpt.value === "Handover" && (selectedOrder.status === "ส่งมอบงาน" || selectedOrder.status === "Handover")) ||
                      (statusOpt.value === "Pending" && (selectedOrder.status === "รอดำเนินการ" || selectedOrder.status === "Pending")) ||
                      (statusOpt.value === "Cancel" && (selectedOrder.status === "ยกเลิก" || selectedOrder.status === "Cancel"));

                    let btnStyle = "";
                    if (isSelected) {
                      if (statusOpt.color === "emerald") {
                        btnStyle = "bg-emerald-50 border border-emerald-500 text-emerald-700 font-bold";
                      } else if (statusOpt.color === "indigo") {
                        btnStyle = "bg-indigo-50 border border-indigo-500 text-indigo-700 font-bold";
                      } else if (statusOpt.color === "amber") {
                        btnStyle = "bg-amber-50 border border-amber-500 text-amber-700 font-bold";
                      } else {
                        btnStyle = "bg-rose-50 border border-rose-500 text-rose-700 font-bold";
                      }
                    } else {
                      btnStyle = "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50";
                    }

                    return (
                      <button
                        key={statusOpt.value}
                        disabled={isUpdatingStatus}
                        onClick={() => handleStatusClick(statusOpt.value)}
                        className={`py-2 px-1 rounded-xl text-xs transition-all flex items-center justify-center gap-1 ${btnStyle} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{statusOpt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Success/Error Message Notification */}
                {statusMessage && (
                  <div 
                    className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      statusMessage.type === "success" 
                        ? "bg-emerald-50 border border-emerald-100 text-emerald-700" 
                        : "bg-rose-50 border border-rose-100 text-rose-700"
                    }`}
                  >
                    {statusMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    )}
                    <span>{statusMessage.text}</span>
                  </div>
                )}
              </div>

              {/* Photo Proof Gallery - Dynamic and Interactive */}
              {(() => {
                const photoItems = [
                  { label: "หน้ามิเตอร์", path: selectedOrder.photoMeterFace },
                  { label: "เฟสสายไฟ", path: selectedOrder.photoConnectedPhase },
                  { label: "เสาหลักไฟ", path: selectedOrder.photoElectricalPole },
                  { label: "เครื่องเก่า", path: selectedOrder.photoOldMeter },
                  { label: "งานเสร็จสิ้น", path: selectedOrder.photoCompletedWork },
                  { label: "จุดติดตั้งใหม่", path: selectedOrder.photoNewInstallation },
                  { label: "ในบ้าน", path: selectedOrder.photoHouseWiring },
                ].filter(item => item.path && item.path.trim().length > 0);

                const validPhotos = photoItems.map(item => {
                  const fileId = getDriveFileId(item.path);
                  return {
                    ...item,
                    fileId,
                    imageUrl: fileId ? `https://lh3.googleusercontent.com/d/${fileId}=s0` : null,
                    thumbUrl: fileId ? `https://lh3.googleusercontent.com/d/${fileId}=w400-h400-n` : null,
                  };
                });

                if (validPhotos.length === 0) {
                  return (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center text-slate-400 text-xs">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      ไม่พบหลักฐานรูปถ่ายใน Google Drive สำหรับใบงานนี้
                    </div>
                  );
                }

                // Ensure activePhotoIndex is within bounds
                const safeIndex = activePhotoIndex < validPhotos.length ? activePhotoIndex : 0;
                const featuredPhoto = validPhotos[safeIndex];

                return (
                  <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        ภาพหลักฐานใน Google Drive ({validPhotos.length})
                      </h6>
                      <span className="text-[10px] bg-purple-50 text-purple-600 font-bold px-2 py-0.5 rounded-full">
                        แสดงผลทันที
                      </span>
                    </div>

                    {/* Main Active Photo Display */}
                    <div className="relative aspect-video w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                      {featuredPhoto.fileId ? (
                        <>
                          <img
                            src={featuredPhoto.imageUrl || ""}
                            alt={featuredPhoto.label}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain cursor-zoom-in"
                            onClick={() => setZoomedPhoto({ url: featuredPhoto.imageUrl || "", title: `${featuredPhoto.label} (${featuredPhoto.path?.split("/").pop()})` })}
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 p-2 text-white backdrop-blur-[2px] flex items-center justify-between">
                            <div className="min-w-0 flex-1 mr-2">
                              <p className="text-[10px] font-bold truncate">{featuredPhoto.label}</p>
                              <p className="text-[8px] text-slate-300 truncate">{featuredPhoto.path?.split("/").pop()}</p>
                            </div>
                            <span className="text-[8px] bg-emerald-500 text-white font-bold px-1 py-0.5 rounded flex-shrink-0">
                              DRIVE
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 bg-slate-100">
                          <FileText className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-500">{featuredPhoto.label}</p>
                          <p className="text-[8px] text-slate-400 mt-1">ไฟล์ไม่อยู่ในสารบบสำรองข้อมูล</p>
                        </div>
                      )}
                    </div>

                    {/* Thumbnails Navigation */}
                    {validPhotos.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {validPhotos.map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActivePhotoIndex(idx)}
                            className={`relative w-14 h-14 rounded-lg overflow-hidden border flex-shrink-0 transition-all ${
                              safeIndex === idx
                                ? "border-purple-600 ring-2 ring-purple-100"
                                : "border-slate-200 opacity-70 hover:opacity-100"
                            }`}
                          >
                            {p.fileId ? (
                              <img
                                src={p.thumbUrl || ""}
                                alt={p.label}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-slate-950/60 text-white text-[8px] font-bold py-0.5 truncate text-center">
                              {p.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    วันที่ดำเนินการ
                  </span>
                  <p className="font-bold text-slate-700 text-sm mt-1">{selectedOrder.date}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center">
                    <Layers className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    พื้นที่งาน
                  </span>
                  <p className="font-bold text-slate-700 text-xs mt-1 truncate" title={selectedOrder.area}>
                    {selectedOrder.area}
                  </p>
                </div>
              </div>

              {/* Equipment Specifications */}
              <div className="space-y-3">
                <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  ข้อมูลอุปกรณ์มิเตอร์
                </h6>
                <div className="p-4 border border-slate-100 rounded-2xl space-y-3">
                  <div className="flex justify-between text-xs py-1.5 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">ขนาดมิเตอร์:</span>
                    <span className="font-bold text-slate-800">{selectedOrder.meterSize}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">PEA มิเตอร์:</span>
                    <span className="font-bold font-mono text-slate-800">{selectedOrder.peaMeter || "ไม่ระบุ"}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-slate-50">
                    <span className="text-slate-400 font-medium">เฟสเชื่อมต่อ (Phase):</span>
                    <span className="font-bold text-slate-800">{selectedOrder.phase || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5">
                    <span className="text-slate-400 font-medium">หน่วยหน้ามิเตอร์:</span>
                    <span className="font-bold font-mono text-slate-800">{selectedOrder.meterUnit || "0"}</span>
                  </div>
                </div>
              </div>

              {/* Labor Fees Breakdown */}
              <div className="space-y-3">
                <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  รายละเอียดรายได้ค่าแรงงาน
                </h6>
                <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl space-y-2.5">
                  {selectedOrder.costIn > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">ค่าแรงงานในเขต:</span>
                      <span className="font-semibold font-mono text-slate-800">฿{selectedOrder.costIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {selectedOrder.costOut > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">ค่าแรงงานนอกเขต:</span>
                      <span className="font-semibold font-mono text-slate-800">฿{selectedOrder.costOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="border-t border-teal-100/50 pt-2 flex justify-between text-sm font-bold text-teal-800">
                    <span>ยอดสุทธิรวม:</span>
                    <span className="font-mono text-base">฿{selectedOrder.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Location and Mapping Card */}
              <div className="space-y-3">
                <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  พิกัดปฏิบัติงาน
                </h6>
                <div className="p-4 border border-slate-100 rounded-2xl space-y-3">
                  <p className="text-xs text-slate-600 flex items-start leading-relaxed">
                    <MapPin className="w-4 h-4 mr-2 text-rose-500 flex-shrink-0 mt-0.5" />
                    {maskLocation(selectedOrder.location)}
                  </p>
                  {selectedOrder.gps && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] font-mono flex items-center justify-between">
                      <span className="text-slate-500">GPS: {selectedOrder.gps}</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.gps)}`}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="text-purple-600 hover:underline font-bold text-[10px] bg-purple-50 px-2 py-1 rounded"
                      >
                        เปิดแผนที่ Google
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Operator and Supervisor */}
              <div className="space-y-3">
                <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  ช่างผู้รับผิดชอบงาน
                </h6>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/60">
                    <span className="text-slate-400">ผู้ควบคุมงาน:</span>
                    <p className="font-bold text-slate-700 mt-0.5">{selectedOrder.supervisor || "ไม่ระบุ"}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/60">
                    <span className="text-slate-400">ช่างปฏิบัติการ:</span>
                    <p className="font-bold text-slate-700 mt-0.5">{selectedOrder.technician || "ไม่ระบุ"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
              <button
                id="drawer-close-action-btn"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-950 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-100 transition-all text-center"
              >
                ปิดหน้าต่างหลัก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Photo Modal */}
      {zoomedPhoto && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setZoomedPhoto(null)}
        >
          <div 
            className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h5 className="font-bold text-slate-800 text-xs sm:text-sm truncate pr-4">{zoomedPhoto.title}</h5>
              <button 
                onClick={() => setZoomedPhoto(null)}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-hidden">
              <img 
                src={zoomedPhoto.url} 
                alt={zoomedPhoto.title} 
                referrerPolicy="no-referrer"
                className="max-h-[70vh] max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <span className="text-slate-400">รูปภาพเชื่อมโยงอัตโนมัติจาก Google Drive</span>
              <a 
                href={zoomedPhoto.url} 
                target="_blank" 
                rel="noreferrer" 
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-bold text-center"
              >
                เปิดรูปในแท็บใหม่
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div 
          className="fixed inset-0 z-[110] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => {
            setShowPasswordModal(false);
            setPendingStatus(null);
          }}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden p-6 relative border border-slate-100 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 text-sm" style={{ fontFamily: "Prompt" }}>
                  กรุณาใส่รหัสผ่านเพื่อแก้ไขสถานะ
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  การแก้ไขสถานะใบคำร้องจำเป็นต้องยืนยันตัวตน
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPendingStatus(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider" style={{ fontFamily: "Prompt" }}>
                รหัสผ่านสำหรับแก้ไข (Password)
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleConfirmPassword();
                  }
                }}
                placeholder="ใส่รหัสผ่าน (เช่น meter)"
                className="w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-slate-700"
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPendingStatus(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all text-center"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmPassword}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-100 transition-all text-center"
              >
                ยืนยันรหัสผ่าน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      <EditOrderModal
        order={editingOrder}
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        onSaved={(updatedOrder) => {
          if (selectedOrder && selectedOrder.id === updatedOrder.id) {
            setSelectedOrder(updatedOrder);
          }
          if (onStatusUpdate) {
            onStatusUpdate();
          }
        }}
      />
    </div>
  );
}
