import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { Order } from "../types";
import { maskCustomerName } from "../utils/masking";
import { 
  Printer, 
  FileText, 
  Check, 
  RefreshCw, 
  ChevronRight, 
  ChevronUp,
  Download, 
  Edit3, 
  Settings, 
  AlertCircle,
  HelpCircle,
  UserCheck,
  List,
  Lock,
  Unlock,
  Trash2,
  Receipt,
  Plus,
  RotateCcw,
  Sparkles,
  Sliders,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowDownWideNarrow,
  Pencil
} from "lucide-react";
import { validateOrderSizeAndWorkType, OrderValidationResult } from "../utils/orderValidation";
import EditOrderModal from "./EditOrderModal";

interface ReportForm52Props {
  initialYear: string;
  initialMonth: string;
  yearsList: string[];
  selectedArea: string;
  selectedSize: string;
  selectedStatus: string;
  searchQuery: string;
  onOrderUpdated?: () => void;
}

interface RowData {
  key: string;
  category: string;
  description: string;
  priceIn: number;
  priceOut: number;
  ordersIn: Order[];
  ordersOut: Order[];
}

export const BASE_ROWS: { key: string; category: string; description: string; priceIn: number; priceOut: number }[] = [
  { key: "1.1", category: "ติดตั้งมิเตอร์ใหม่ 3 เฟส 4 สาย", description: "ติดตั้งพร้อมอุปกรณ์ประกอบ และติดตั้งตู้", priceIn: 310, priceOut: 374 },
  { key: "1.2", category: "ติดตั้งมิเตอร์ใหม่ 3 เฟส 4 สาย", description: "ติดตั้งพร้อมอุปกรณ์ประกอบ ไม่ติดตั้งตู้", priceIn: 263, priceOut: 310 },
  { key: "1.3", category: "ติดตั้งมิเตอร์ใหม่ 3 เฟส 4 สาย", description: "ติดตั้งเฉพาะมิเตอร์อย่างเดียว", priceIn: 124, priceOut: 133 },
  { key: "2.1", category: "สับเปลี่ยนมิเตอร์ (เพิ่มขนาด และเปลี่ยนชำรุด) 3 เฟส 4 สาย", description: "กรณีต้องเปลี่ยนสายเข้ามิเตอร์", priceIn: 373, priceOut: 468 },
  { key: "2.2", category: "สับเปลี่ยนมิเตอร์ (เพิ่มขนาด และเปลี่ยนชำรุด) 3 เฟส 4 สาย", description: "กรณีไม่ต้องเปลี่ยนสายเข้ามิเตอร์", priceIn: 187, priceOut: 208 },
  { key: "3.1", category: "รื้อถอนมิเตอร์ 3 เฟส 4 สาย", description: "รื้อถอนเฉพาะมิเตอร์", priceIn: 117, priceOut: 127 },
  { key: "3.2", category: "รื้อถอนมิเตอร์ 3 เฟส 4 สาย", description: "รื้อถอนยกเลิกการใช้ไฟ", priceIn: 170, priceOut: 187 },
  { key: "4.1", category: "ติดตั้งมิเตอร์ใหม่ 1 เฟส 2 สาย", description: "ติดตั้งพร้อมเดินสายเข้ามิเตอร์และติดตั้งไม้แป้น", priceIn: 188, priceOut: 209 },
  { key: "4.2", category: "ติดตั้งมิเตอร์ใหม่ 1 เฟส 2 สาย", description: "ติดตั้งพร้อมเดินสายเข้ามิเตอร์แต่ไม่ติดตั้งไม้แป้น", priceIn: 157, priceOut: 171 },
  { key: "4.3", category: "ติดตั้งมิเตอร์ใหม่ 1 เฟส 2 สาย", description: "ติดตั้งเฉพาะมิเตอร์อย่างเดียว", priceIn: 67, priceOut: 75 },
  { key: "5.1", category: "สับเปลี่ยนมิเตอร์ (เพิ่มขนาด และเปลี่ยนชำรุด) 1 เฟส 2 สาย", description: "กรณีต้องเปลี่ยนสายเข้ามิเตอร์", priceIn: 209, priceOut: 235 },
  { key: "5.2", category: "สับเปลี่ยนมิเตอร์ (เพิ่มขนาด และเปลี่ยนชำรุด) 1 เฟส 2 สาย", description: "กรณีไม่ต้องเปลี่ยนสายเข้ามิเตอร์", priceIn: 104, priceOut: 111 },
  { key: "6.1", category: "ย้ายมิเตอร์ 1 เฟส 2 สาย", description: "ติดตั้งพร้อมสายไฟ และไม้แป้น", priceIn: 188, priceOut: 209 },
  { key: "7.1", category: "ตัดฝากมิเตอร์/ถอนคืนมิเตอร์/เลิกใช้ถอนคืนมิเตอร์พร้อมอุปกรณ์ประกอบ 1 เฟส 2 สาย", description: "ตัดฝากมิเตอร์/ถอนคืนมิเตอร์", priceIn: 67, priceOut: 75 },
  { key: "7.2", category: "ตัดฝากมิเตอร์/ถอนคืนมิเตอร์/เลิกใช้ถอนคืนมิเตอร์พร้อมอุปกรณ์ประกอบ 1 เฟส 2 สาย", description: "รื้อถอนมิเตอร์พร้อมอุปกรณ์ประกอบ (เลิกใช้ไฟ)", priceIn: 125, priceOut: 139 },
];

export default function ReportForm52({
  initialYear,
  initialMonth,
  yearsList,
  selectedArea,
  selectedSize,
  selectedStatus,
  searchQuery,
  onOrderUpdated,
}: ReportForm52Props) {
  const isInIframe = typeof window !== "undefined" && window.self !== window.top;
  const [selectedYear, setSelectedYear] = useState<string>(initialYear !== "All" ? initialYear : "2026");
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth !== "All" ? initialMonth : "06");
  const [loading, setLoading] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [excludedOrderIds, setExcludedOrderIds] = useState<string[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Form states customizable by user
  const [docNumber, setDocNumber] = useState<string>("1 มิ.ย. 2569 - 30 มิ.ย. 2569");
  const [orderStartPeriod, setOrderStartPeriod] = useState<string>("1 มิ.ย. 2569");
  const [orderEndPeriod, setOrderEndPeriod] = useState<string>("30 มิ.ย. 2569");
  const [handoverDate, setHandoverDate] = useState<string>("7 ก.ค. 69");
  const [overrideScheduledDelivery, setOverrideScheduledDelivery] = useState<string>("");
  const [overrideDeliveryDate, setOverrideDeliveryDate] = useState<string>("");
  const [contractorName, setContractorName] = useState<string>("นายประจักร ฤทธิ์คำ");
  const [contractNumber, setContractNumber] = useState<string>("จ.บผ. 6/2569 ลว. 6 มกราคม 2569");
  
  // Signers
  const [supervisorName, setSupervisorName] = useState<string>("นายศราวุธ คำงาม");
  const [supervisorRole, setSupervisorRole] = useState<string>("พชง.6 ผมต.กฟส.บผ.");
  const [contractorRole, setContractorRole] = useState<string>("ผู้รับจ้างติดตั้งมิเตอร์");
  const [supervisorSignDate, setSupervisorSignDate] = useState<string>("");
  const [contractorSignDate, setContractorSignDate] = useState<string>("");
  const [chairmanName, setChairmanName] = useState<string>("นายทรงพล ศิริพรรณ");
  const [chairmanRole, setChairmanRole] = useState<string>("หผ.ปบ.กฟส.บผ.");
  const [committee1Name, setCommittee1Name] = useState<string>("นายภูริเชษฐ์ เกษจินดา");
  const [committee1Role, setCommittee1Role] = useState<string>("พชง.6 ผบส.กฟส.บผ.");
  const [committee2Name, setCommittee2Name] = useState<string>("นายธนศักดิ์ ซาซุม");
  const [committee2Role, setCommittee2Role] = useState<string>("พชง.5 ผบส.กฟส.บผ.");
  const [approverName, setApproverName] = useState<string>("");
  const [approverRole, setApproverRole] = useState<string>("ผจก.กฟส.บผ.");
  const [approverSignDate, setApproverSignDate] = useState<string>("");
  const [signatureSpacing, setSignatureSpacing] = useState<"normal" | "wide" | "extra-wide">("wide");

  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [activeReportTab, setActiveReportTab] = useState<"summary" | "list" | "receipt">("summary");

  // Receipt Bill States
  const [receiptBookNo, setReceiptBookNo] = useState<string>("1");
  const [receiptBillNo, setReceiptBillNo] = useState<string>("001");
  const [receiptIssuerName, setReceiptIssuerName] = useState<string>("นายประจักร ฤทธิ์คำ");
  const [receiptIssuerAddress, setReceiptIssuerAddress] = useState<string>("8/1 หมู่ 3 ถนนศรีบุญเรือง ตำบลบ้านไผ่ อำเภอบ้านไผ่ จังหวัดขอนแก่น 40110");
  const [receiptIssuerPhone, setReceiptIssuerPhone] = useState<string>("โทร. 095-887-2915");
  const [receiptCustomerName, setReceiptCustomerName] = useState<string>("การไฟฟ้าส่วนภูมิภาค สาขาบ้านไผ่ (สาขาที่ 115)");
  const [receiptCustomerAddress, setReceiptCustomerAddress] = useState<string>("65 หมู่ 2 ถนนมิตรภาพ ตำบลบ้านไผ่ อำเภอบ้านไผ่ จังหวัดขอนแก่น 40110");
  const [receiptTaxId, setReceiptTaxId] = useState<string>("0994000165501");
  const [receiptCitizenId, setReceiptCitizenId] = useState<string>("0994000165501");
  const [receiptDate, setReceiptDate] = useState<string>("");
  const [receiptCollector, setReceiptCollector] = useState<string>("");
  const [receiptMode, setReceiptMode] = useState<"itemized" | "single">("itemized");
  const [receiptCustomItems, setReceiptCustomItems] = useState<{ id: string; quantity: string | number; description: string; unitPrice: number; amount: number }[] | null>(null);
  const [isReceiptEditOpen, setIsReceiptEditOpen] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  // Manual overrides state for Form 52 Summary Report: { [rowKey]: { countIn?: number; countOut?: number; sumIn?: number; sumOut?: number } }
  const [summaryOverrides, setSummaryOverrides] = useState<Record<string, { countIn?: number; countOut?: number; sumIn?: number; sumOut?: number }>>({});
  const [isEditingSummary, setIsEditingSummary] = useState<boolean>(false);
  const [orderSortMode, setOrderSortMode] = useState<"wage_desc" | "category">("wage_desc");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [onlyShowMismatches, setOnlyShowMismatches] = useState<boolean>(false);

  const handleOrderSaved = (updatedOrder: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    // When saved, automatically reset onlyShowMismatches so that ALL items are displayed as requested
    setOnlyShowMismatches(false);
    if (onOrderUpdated) {
      onOrderUpdated();
    }
  };

  // Helper to calculate precise order wage/cost with proper in-out area prioritization
  const getOrderWage = (order: Order): number => {
    const areaLower = (order.area || "").toLowerCase();
    const costIn = order.costIn || 0;
    const costOut = order.costOut || 0;
    
    if (costIn > 0 && costOut > 0) {
      if (areaLower.includes("นอกเขต")) return costOut;
      if (areaLower.includes("ในเขต")) return costIn;
      return costOut || costIn;
    }
    if (costIn > 0) return costIn;
    if (costOut > 0) return costOut;
    if (order.totalCost) return order.totalCost;
    return 0;
  };

  // Classification logic matching PEA Form 52 categories
  const classifyOrder = (order: Order) => {
    const areaLower = (order.area || "").toLowerCase();
    const workTypeInLower = (order.workTypeIn || "").toLowerCase();
    const workTypeOutLower = (order.workTypeOut || "").toLowerCase();
    const costIn = order.costIn || 0;
    const costOut = order.costOut || 0;
    const meterSizeLower = (order.meterSize || "").toLowerCase();
    const phaseLower = (order.phase || "").toLowerCase();

    let locType: "in" | "out" = "in";
    let matchedCost = 0;

    if (costIn > 0 && costOut === 0) {
      locType = "in";
      matchedCost = costIn;
    } else if (costOut > 0 && costIn === 0) {
      locType = "out";
      matchedCost = costOut;
    } else {
      if (areaLower.includes("นอกเขต")) {
        locType = "out";
        matchedCost = costOut || costIn;
      } else {
        locType = "in";
        matchedCost = costIn || costOut;
      }
    }

    // Determine 3-phase vs 1-phase
    const is3Phase = 
      meterSizeLower.includes("3p") || 
      meterSizeLower.includes("3 เฟส") || 
      meterSizeLower.includes("3เฟส") || 
      meterSizeLower.includes("3 phase") ||
      workTypeInLower.includes("3p") || 
      workTypeInLower.includes("3 เฟส") || 
      workTypeInLower.includes("3เฟส") ||
      workTypeOutLower.includes("3p") || 
      workTypeOutLower.includes("3 เฟส") || 
      workTypeOutLower.includes("3เฟส") ||
      phaseLower.includes("3");

    let rowKey = "";

    if (is3Phase) {
      // 3-Phase Rows: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2
      const isRemoval = 
        workTypeInLower.includes("รื้อถอน") || 
        workTypeInLower.includes("ยกเลิก") || 
        workTypeInLower.includes("เลิกใช้") ||
        workTypeOutLower.includes("รื้อถอน") || 
        workTypeOutLower.includes("ยกเลิก") || 
        workTypeOutLower.includes("เลิกใช้");

      const isReplace = 
        workTypeInLower.includes("สับเปลี่ยน") || 
        workTypeInLower.includes("เพิ่มขนาด") ||
        workTypeInLower.includes("ลดขนาด") ||
        workTypeInLower.includes("เปลี่ยน") ||
        workTypeOutLower.includes("สับเปลี่ยน") || 
        workTypeOutLower.includes("เพิ่มขนาด") ||
        workTypeOutLower.includes("ลดขนาด") ||
        workTypeOutLower.includes("เปลี่ยน");

      const isNewInstall = !isRemoval && !isReplace;

      if (isNewInstall) {
        // 1.1, 1.2, 1.3
        if (locType === "in") {
          if (matchedCost === 310) rowKey = "1.1";
          else if (matchedCost === 263) rowKey = "1.2";
          else if (matchedCost === 124) rowKey = "1.3";
          else {
            if (workTypeInLower.includes("ติดตั้งตู้") || workTypeInLower.includes("พร้อมตู้") || workTypeOutLower.includes("ติดตั้งตู้") || workTypeOutLower.includes("พร้อมตู้")) rowKey = "1.1";
            else if (workTypeInLower.includes("เฉพาะมิเตอร์") || workTypeOutLower.includes("เฉพาะมิเตอร์")) rowKey = "1.3";
            else rowKey = "1.2";
          }
        } else {
          if (matchedCost === 374) rowKey = "1.1";
          else if (matchedCost === 310) rowKey = "1.2";
          else if (matchedCost === 133) rowKey = "1.3";
          else {
            if (workTypeInLower.includes("ติดตั้งตู้") || workTypeInLower.includes("พร้อมตู้") || workTypeOutLower.includes("ติดตั้งตู้") || workTypeOutLower.includes("พร้อมตู้")) rowKey = "1.1";
            else if (workTypeInLower.includes("เฉพาะมิเตอร์") || workTypeOutLower.includes("เฉพาะมิเตอร์")) rowKey = "1.3";
            else rowKey = "1.2";
          }
        }
      } else if (isReplace) {
        // 2.1, 2.2
        if (locType === "in") {
          if (matchedCost === 373) rowKey = "2.1";
          else if (matchedCost === 187) rowKey = "2.2";
          else {
            rowKey = (workTypeInLower.includes("เปลี่ยนสาย") || workTypeOutLower.includes("เปลี่ยนสาย")) ? "2.1" : "2.2";
          }
        } else {
          if (matchedCost === 468) rowKey = "2.1";
          else if (matchedCost === 208) rowKey = "2.2";
          else {
            rowKey = (workTypeInLower.includes("เปลี่ยนสาย") || workTypeOutLower.includes("เปลี่ยนสาย")) ? "2.1" : "2.2";
          }
        }
      } else if (isRemoval) {
        // 3.1, 3.2
        if (locType === "in") {
          if (matchedCost === 117) rowKey = "3.1";
          else if (matchedCost === 170) rowKey = "3.2";
          else {
            rowKey = (workTypeInLower.includes("ยกเลิก") || workTypeOutLower.includes("ยกเลิก")) ? "3.2" : "3.1";
          }
        } else {
          if (matchedCost === 127) rowKey = "3.1";
          else if (matchedCost === 187) rowKey = "3.2";
          else {
            rowKey = (workTypeInLower.includes("ยกเลิก") || workTypeOutLower.includes("ยกเลิก")) ? "3.2" : "3.1";
          }
        }
      } else {
        if (matchedCost > 300) rowKey = "1.1";
        else if (matchedCost > 200) rowKey = "1.2";
        else rowKey = "1.3";
      }
    } else {
      // 1-Phase Rows: 4.1, 4.2, 4.3, 5.1, 5.2, 6.1, 7.1, 7.2
      const isMoving = 
        workTypeInLower.includes("ย้าย") || 
        workTypeOutLower.includes("ย้าย");

      const isCutOrReturn = 
        workTypeInLower.includes("ตัดฝาก") || workTypeInLower.includes("ถอนคืน") || 
        workTypeOutLower.includes("ตัดฝาก") || workTypeOutLower.includes("ถอนคืน");

      const isDecommission = 
        workTypeInLower.includes("รื้อถอน") || 
        workTypeInLower.includes("เลิกใช้") ||
        workTypeOutLower.includes("รื้อถอน") || 
        workTypeOutLower.includes("เลิกใช้");

      const isReplace = 
        workTypeInLower.includes("สับเปลี่ยน") || 
        workTypeInLower.includes("เพิ่มขนาด") ||
        workTypeInLower.includes("เปลี่ยน") ||
        workTypeOutLower.includes("สับเปลี่ยน") || 
        workTypeOutLower.includes("เพิ่มขนาด") ||
        workTypeOutLower.includes("เปลี่ยน");

      if (isMoving) {
        rowKey = "6.1";
      } else if (isCutOrReturn) {
        rowKey = "7.1";
      } else if (isDecommission) {
        rowKey = "7.2";
      } else if (isReplace) {
        // 5.1, 5.2
        if (locType === "in") {
          if (matchedCost === 209) rowKey = "5.1";
          else if (matchedCost === 104) rowKey = "5.2";
          else {
            rowKey = (workTypeInLower.includes("เปลี่ยนสาย") || workTypeOutLower.includes("เปลี่ยนสาย")) ? "5.1" : "5.2";
          }
        } else {
          if (matchedCost === 235) rowKey = "5.1";
          else if (matchedCost === 111) rowKey = "5.2";
          else {
            rowKey = (workTypeInLower.includes("เปลี่ยนสาย") || workTypeOutLower.includes("เปลี่ยนสาย")) ? "5.1" : "5.2";
          }
        }
      } else {
        // New Installation: 4.1, 4.2, 4.3
        if (locType === "in") {
          if (matchedCost === 188 || matchedCost === 187) rowKey = "4.1";
          else if (matchedCost === 157 || matchedCost === 156) rowKey = "4.2";
          else if (matchedCost === 67) rowKey = "4.3";
          else {
            if (workTypeInLower.includes("ไม้แป้น") || workTypeOutLower.includes("ไม้แป้น")) rowKey = "4.1";
            else if (workTypeInLower.includes("ไม่ติดตั้งไม้แป้น") || workTypeOutLower.includes("ไม่ติดตั้งไม้แป้น")) rowKey = "4.2";
            else if (workTypeInLower.includes("เฉพาะมิเตอร์") || workTypeOutLower.includes("เฉพาะมิเตอร์")) rowKey = "4.3";
            else rowKey = "4.1";
          }
        } else {
          if (matchedCost === 209 || matchedCost === 207) rowKey = "4.1";
          else if (matchedCost === 171 || matchedCost === 170) rowKey = "4.2";
          else if (matchedCost === 75 || matchedCost === 74) rowKey = "4.3";
          else {
            if (workTypeInLower.includes("ไม้แป้น") || workTypeOutLower.includes("ไม้แป้น")) rowKey = "4.1";
            else if (workTypeInLower.includes("ไม่ติดตั้งไม้แป้น") || workTypeOutLower.includes("ไม่ติดตั้งไม้แป้น")) rowKey = "4.2";
            else if (workTypeInLower.includes("เฉพาะมิเตอร์") || workTypeOutLower.includes("เฉพาะมิเตอร์")) rowKey = "4.3";
            else rowKey = "4.1";
          }
        }
      }
    }

    return { rowKey, locationType: locType };
  };

  // Helper to extract category sequence number (1 to 7) matching PEA Form 52
  const getOrderCategoryInfo = (order: Order) => {
    const classification = classifyOrder(order);
    let rowKey = classification?.rowKey || "";
    let majorRank = 99;

    if (rowKey) {
      const parsedMajor = parseInt(rowKey.split(".")[0], 10);
      if (!isNaN(parsedMajor) && parsedMajor >= 1 && parsedMajor <= 7) {
        majorRank = parsedMajor;
      }
    }

    // Fallback classification if needed
    if (majorRank === 99) {
      const text = `${order.workTypeIn || ""} ${order.workTypeOut || ""} ${order.meterSize || ""} ${order.phase || ""} ${order.area || ""}`.toLowerCase();
      const is3Phase = 
        text.includes("3p") || 
        text.includes("3 เฟส") || 
        text.includes("3เฟส") || 
        text.includes("3 phase") ||
        (order.phase || "").includes("3");

      if (is3Phase) {
        if (text.includes("รื้อถอน") || text.includes("ยกเลิก") || text.includes("เลิกใช้")) {
          majorRank = 3;
          rowKey = "3.1";
        } else if (text.includes("สับเปลี่ยน") || text.includes("เพิ่มขนาด") || text.includes("ลดขนาด") || text.includes("เปลี่ยน")) {
          majorRank = 2;
          rowKey = "2.1";
        } else {
          majorRank = 1;
          rowKey = "1.1";
        }
      } else {
        if (text.includes("ตัดฝาก") || text.includes("ถอนคืน") || text.includes("เลิกใช้") || text.includes("รื้อถอน")) {
          majorRank = 7;
          rowKey = "7.1";
        } else if (text.includes("ย้าย")) {
          majorRank = 6;
          rowKey = "6.1";
        } else if (text.includes("สับเปลี่ยน") || text.includes("เพิ่มขนาด") || text.includes("ลดขนาด") || text.includes("เปลี่ยน")) {
          majorRank = 5;
          rowKey = "5.1";
        } else {
          majorRank = 4;
          rowKey = "4.1";
        }
      }
    }

    return {
      majorRank,
      rowKey,
      locationType: classification?.locationType || "in",
    };
  };

  // Dedicated sort function:
  // - Mode "wage_desc" (Default): Strictly sort from highest wage to lowest wage (ค่าจ้าง มาก-น้อย).
  //   When wages are identical, items are grouped by Work Category (1 to 7) without intermixing.
  // - Mode "category": Group by Work Category (1 to 7) first, then wage descending within category.
  const sortReportOrders = (a: Order, b: Order): number => {
    const infoA = getOrderCategoryInfo(a);
    const infoB = getOrderCategoryInfo(b);
    const wageA = getOrderWage(a);
    const wageB = getOrderWage(b);

    if (orderSortMode === "wage_desc") {
      // 1. เรียงจากค่าจ้าง มาก-น้อย (Wage descending from highest to lowest)
      if (wageB !== wageA) {
        return wageB - wageA;
      }
      // 2. หากค่าจ้างเท่ากัน จัดกลุ่มตามประเภทงาน (Category 1 -> 7 ไม่สลับขั้น)
      if (infoA.majorRank !== infoB.majorRank) {
        return infoA.majorRank - infoB.majorRank;
      }
      // 3. ลำดับข้อย่อยตามแบบฟอร์ม (Sub-row in BASE_ROWS e.g. 4.1 before 4.2)
      if (infoA.rowKey !== infoB.rowKey) {
        const idxA = BASE_ROWS.findIndex(r => r.key === infoA.rowKey);
        const idxB = BASE_ROWS.findIndex(r => r.key === infoB.rowKey);
        if (idxA !== -1 && idxB !== -1 && idxA !== idxB) {
          return idxA - idxB;
        }
        return infoA.rowKey.localeCompare(infoB.rowKey);
      }
    } else {
      // โหมดตามประเภทงาน: เรียงตามลำดับหมวด 1 ถึง 7 ก่อน
      if (infoA.majorRank !== infoB.majorRank) {
        return infoA.majorRank - infoB.majorRank;
      }
      if (wageB !== wageA) {
        return wageB - wageA;
      }
      if (infoA.rowKey !== infoB.rowKey) {
        const idxA = BASE_ROWS.findIndex(r => r.key === infoA.rowKey);
        const idxB = BASE_ROWS.findIndex(r => r.key === infoB.rowKey);
        if (idxA !== -1 && idxB !== -1 && idxA !== idxB) {
          return idxA - idxB;
        }
        return infoA.rowKey.localeCompare(infoB.rowKey);
      }
    }

    // 4. Stable tie-breaker: Date descending, then Request ID
    const dateComp = (b.date || "").localeCompare(a.date || "");
    if (dateComp !== 0) return dateComp;
    return (a.requestId || "").localeCompare(b.requestId || "");
  };

  const handleUpdateRowOverride = (
    rowKey: string,
    fieldOrPartial: "countIn" | "countOut" | "sumIn" | "sumOut" | { countIn?: number; countOut?: number; sumIn?: number; sumOut?: number },
    value?: number
  ) => {
    const targetRow = BASE_ROWS.find(r => r.key === rowKey);
    const priceIn = targetRow?.priceIn || 0;
    const priceOut = targetRow?.priceOut || 0;

    setSummaryOverrides(prev => {
      const current = prev[rowKey] || {};
      const updated = { ...current };

      if (typeof fieldOrPartial === "object") {
        if (fieldOrPartial.countIn !== undefined) updated.countIn = fieldOrPartial.countIn;
        if (fieldOrPartial.countOut !== undefined) updated.countOut = fieldOrPartial.countOut;
        if (fieldOrPartial.sumIn !== undefined) updated.sumIn = fieldOrPartial.sumIn;
        if (fieldOrPartial.sumOut !== undefined) updated.sumOut = fieldOrPartial.sumOut;
      } else if (value !== undefined) {
        if (fieldOrPartial === "countIn") {
          updated.countIn = value;
          updated.sumIn = value * priceIn;
        } else if (fieldOrPartial === "countOut") {
          updated.countOut = value;
          updated.sumOut = value * priceOut;
        } else if (fieldOrPartial === "sumIn") {
          updated.sumIn = value;
        } else if (fieldOrPartial === "sumOut") {
          updated.sumOut = value;
        }
      }

      return {
        ...prev,
        [rowKey]: updated
      };
    });
  };

  const handleResetRowOverride = (rowKey: string) => {
    setSummaryOverrides(prev => {
      const next = { ...prev };
      delete next[rowKey];
      return next;
    });
  };

  const handleResetAllSummaryOverrides = () => {
    setSummaryOverrides({});
  };

  const formatGregorianToThaiFullDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const thMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const day = date.getDate();
    const month = thMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // Convert to Buddhist Era
    return `${day} ${month} ${year}`;
  };

  // Export to Excel handler - Generates full PEA Form 52 Summary & Detailed List worksheets
  const handleExportExcel = () => {
    // Filter out orders with 0 wage and excluded orders, sorted by Work Category (ประเภทงาน 1-7) and wage descending (จำนวนเงินมากไปน้อย)
    const listOrders = [...orders]
      .filter(o => getOrderWage(o) > 0 && !excludedOrderIds.includes(o.id))
      .sort(sortReportOrders);

    const wb = XLSX.utils.book_new();

    // ==========================================
    // WORKSHEET 1: Summary Form 52 (ตารางสรุป สร.4-ป.52)
    // ==========================================
    const summaryData: any[][] = [];
    const mergesSheet1: any[] = [];

    // Header Title Rows
    summaryData.push(["การไฟฟ้าส่วนภูมิภาค สาขาบ้านไผ่ จังหวัดขอนแก่น"]);
    mergesSheet1.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } });

    summaryData.push(["ใบส่งมอบงานจ้างเหมาติดตั้งมิเตอร์ (สร.4 - ป.52)"]);
    mergesSheet1.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 7 } });

    summaryData.push([
      `สัญญาจ้างเลขที่: ${contractNumber}`,
      "", "", "",
      `ผู้รับจ้าง: ${contractorName}`,
      "", "",
      `วันที่ส่งมอบ: ${handoverDate}`
    ]);
    mergesSheet1.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 3 } });
    mergesSheet1.push({ s: { r: 2, c: 4 }, e: { r: 2, c: 6 } });

    summaryData.push([
      `ช่วงเวลาสั่งจ้าง: ${orderStartPeriod} ถึง ${orderEndPeriod}`,
      "", "", "",
      `เลขที่ใบสั่งจ้าง: ${computedDocNumber}`,
      "", "", ""
    ]);
    mergesSheet1.push({ s: { r: 3, c: 0 }, e: { r: 3, c: 3 } });
    mergesSheet1.push({ s: { r: 3, c: 4 }, e: { r: 3, c: 7 } });

    summaryData.push([]); // Spacing row

    // Table Header Row
    const headerRowIdx = 5;
    summaryData.push([
      "รายละเอียด",
      "ราคา(ในเขต)",
      "ราคา(นอกเขต)",
      "จำนวนเครื่องในเขต",
      "จำนวนเครื่องนอกเขต",
      "เป็นเงินในเขต (บาท)",
      "เป็นเงินนอกเขต (บาท)",
      "รวมเป็นเงิน (บาท)"
    ]);

    let currentRowIdx = headerRowIdx + 1;

    // Rows Data loop matching Form 52
    rowsWithData.forEach((row) => {
      const isGroupHeader = row.key.endsWith(".1");
      if (isGroupHeader) {
        summaryData.push([row.category, "", "", "", "", "", "", ""]);
        mergesSheet1.push({ s: { r: currentRowIdx, c: 0 }, e: { r: currentRowIdx, c: 7 } });
        currentRowIdx++;
      }

      const countIn = row.countIn;
      const countOut = row.countOut;
      const sumIn = row.sumIn;
      const sumOut = row.sumOut;
      const totalSum = row.totalSum;

      summaryData.push([
        row.description,
        row.priceIn,
        row.priceOut,
        countIn > 0 ? countIn : "-",
        countOut > 0 ? countOut : "-",
        sumIn > 0 ? sumIn : "-",
        sumOut > 0 ? sumOut : "-",
        totalSum > 0 ? totalSum : "-"
      ]);
      currentRowIdx++;
    });

    // Total Summary Row
    summaryData.push([
      "รวมทั้งสิ้น",
      "",
      "",
      totalCountIn,
      totalCountOut,
      totalAmountIn,
      totalAmountOut,
      grandTotalAmount
    ]);
    mergesSheet1.push({ s: { r: currentRowIdx, c: 0 }, e: { r: currentRowIdx, c: 2 } });
    currentRowIdx++;

    summaryData.push([]); // Spacing

    // Bottom text statement
    summaryData.push([
      `บัดนี้ข้าพเจ้าได้ดำเนินการตามใบสั่งเลขที่ ${docNumber} รวมเป็นจำนวน ${totalMeters} เครื่อง เป็นเงิน ${grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท (${bahtText})`
    ]);
    mergesSheet1.push({ s: { r: currentRowIdx + 1, c: 0 }, e: { r: currentRowIdx + 1, c: 7 } });
    currentRowIdx += 2;

    summaryData.push([]); // Spacing

    // Signature Blocks
    summaryData.push(["ขอแสดงความนับถือ", "", "", "", "(1) เรียน คณะกรรมการตรวจรับงานจ้าง", "", "", ""]);
    summaryData.push(["", "", "", "", "", "", "", ""]);
    summaryData.push([`(${contractorName})`, "", "", "", `(${supervisorName})`, "", "", ""]);
    summaryData.push([contractorRole, "", "", "", supervisorRole, "", "", ""]);
    summaryData.push([]);
    summaryData.push(["(3) อนุมัติ", "", "", "", "(2) เห็นควรอนุมัติให้จ่ายเงินได้", "", "", ""]);
    summaryData.push([`(${approverName || "........................................................"})`, "", "", "", `ประธาน: (${chairmanName})`, "", "", ""]);
    summaryData.push([approverRole || "ผจก.กฟส.บผ.", "", "", "", `กรรมการ: (${committee1Name})`, "", "", ""]);
    summaryData.push(["", "", "", "", `กรรมการ: (${committee2Name})`, "", "", ""]);

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary["!merges"] = mergesSheet1;
    wsSummary["!cols"] = [
      { wch: 42 }, // รายละเอียด
      { wch: 14 }, // ราคาในเขต
      { wch: 14 }, // ราคานอกเขต
      { wch: 16 }, // จำนวนในเขต
      { wch: 16 }, // จำนวนนอกเขต
      { wch: 18 }, // เป็นเงินในเขต
      { wch: 18 }, // เป็นเงินนอกเขต
      { wch: 20 }  // รวมเป็นเงิน
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, "สรุปใบส่งมอบงาน (Form 52)");

    // ==========================================
    // WORKSHEET 2: Detailed Order List (รายการใบสั่งจ้างปฏิบัติงาน)
    // ==========================================
    const listData: any[][] = [
      ["การไฟฟ้าส่วนภูมิภาค สาขาบ้านไผ่ จังหวัดขอนแก่น"],
      ["รายการใบสั่งจ้างปฏิบัติงานเกี่ยวกับมิเตอร์ (ยกเว้นกรณีงดจ่ายไฟฟ้า)"],
      [`ตามสัญญาจ้างเลขที่: ${contractNumber}`, `ผู้รับจ้าง: ${contractorName}`, `เลขที่ใบสั่งจ้าง: ${computedDocNumber}`],
      [], // spacing
      [
        "ลำดับที่",
        "ว/ด/ป",
        "เลขที่คำร้อง",
        "ชื่อผู้ใช้ไฟฟ้า",
        "สาย-หมายเลข",
        "ขนาดมิเตอร์",
        "PEA มิเตอร์",
        "พื้นที่ดำเนินการ",
        "ประเภทงานที่ให้ดำเนินการ",
        "ค่าจ้าง (บาท)",
        "กำหนดส่งงาน",
        "ส่งมอบงาน",
        "หมายเหตุ"
      ]
    ];

    const mergesSheet2: any[] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } }
    ];

    let totalListWage = 0;

    listOrders.forEach((order, index) => {
      const hasWorkIn = order.workTypeIn && order.workTypeIn.trim().length > 0;
      const hasWorkOut = order.workTypeOut && order.workTypeOut.trim().length > 0;
      
      let workType = "-";
      let wage = getOrderWage(order);
      totalListWage += wage;
      
      if (hasWorkIn && hasWorkOut) {
        workType = `${order.workTypeIn} / ${order.workTypeOut}`;
      } else if (hasWorkIn) {
        workType = order.workTypeIn;
      } else if (hasWorkOut) {
        workType = order.workTypeOut;
      }

      if (workType === "-" || !workType.trim()) {
        const info = getOrderCategoryInfo(order);
        const baseRow = BASE_ROWS.find(r => r.key === info.rowKey);
        if (baseRow) {
          workType = `${baseRow.category} (${baseRow.description})`;
        }
      }

      listData.push([
        index + 1,
        order.date || "",
        order.requestId || "",
        order.customerName || "-",
        order.wireNum || "-",
        order.meterSize || "-",
        order.peaMeter || "-",
        order.area || "-",
        workType,
        wage,
        overrideScheduledDelivery || order.scheduledDelivery || order.date || "",
        overrideDeliveryDate || order.deliveryDate || order.date || "",
        ""
      ]);
    });

    // Total Row for List
    const listTotalRowIdx = listData.length;
    listData.push([
      "รวมทั้งสิ้น",
      "",
      "",
      `${listOrders.length} รายการ`,
      "",
      "",
      "",
      "",
      "",
      totalListWage,
      "",
      "",
      ""
    ]);
    mergesSheet2.push({ s: { r: listTotalRowIdx, c: 0 }, e: { r: listTotalRowIdx, c: 2 } });

    // Signatures for List
    listData.push([]);
    listData.push(["", "", "", "", "", "", "", "ผู้ควบคุมงาน: " + supervisorName, "", "", "ผู้รับจ้าง: " + contractorName]);

    const wsList = XLSX.utils.aoa_to_sheet(listData);
    wsList["!merges"] = mergesSheet2;
    wsList["!cols"] = [
      { wch: 8 },  // ลลำดับที่
      { wch: 12 }, // ว/ด/ป
      { wch: 15 }, // เลขที่คำร้อง
      { wch: 28 }, // ชื่อผู้ใช้ไฟฟ้า
      { wch: 16 }, // สาย-หมายเลข
      { wch: 12 }, // ขนาดมิเตอร์
      { wch: 16 }, // PEA มิเตอร์
      { wch: 22 }, // พื้นที่ดำเนินการ
      { wch: 35 }, // ประเภทงานที่ให้ดำเนินการ
      { wch: 15 }, // ค่าจ้าง
      { wch: 14 }, // กำหนดส่งงาน
      { wch: 14 }, // ส่งมอบงาน
      { wch: 15 }  // หมายเหตุ
    ];

    XLSX.utils.book_append_sheet(wb, wsList, "รายการใบสั่งจ้าง (Detail List)");

    // ==========================================
    // WORKSHEET 3: Receipt Bill (บิลใบเสร็จรับเงิน)
    // ==========================================
    const receiptData: any[][] = [
      [`ผู้ออกใบเสร็จ / ผู้รับเงิน: ${receiptIssuerName || contractorName}`],
      [`ที่อยู่: ${receiptIssuerAddress}`],
      [`โทรศัพท์: ${receiptIssuerPhone}`],
      [],
      ["ใบเสร็จรับเงิน / RECEIPT"],
      [`เล่มที่: ${receiptBookNo}`, "", "", `เลขที่: ${receiptBillNo}`],
      [`นาม CUSTOMER: ${receiptCustomerName}`, "", "", `วันที่ DATE: ${receiptDate || ""}`],
      [`ที่อยู่ ADDRESS: ${receiptCustomerAddress}`],
      [`เลขประจำตัวผู้เสียภาษี TAX ID: ${receiptTaxId}`],
      [], // Spacing
      ["จำนวน QUANTITY", "รายการ DESCRIPTION", "หน่วยละ UNIT PRICE", "จำนวนเงิน AMOUNT (บาท)"]
    ];

    activeReceiptItems.forEach((item) => {
      receiptData.push([
        item.quantity || "-",
        item.description || "-",
        item.unitPrice ? item.unitPrice : "-",
        item.amount ? item.amount : "-"
      ]);
    });

    receiptData.push([
      "รวมเงิน TOTAL",
      `(${receiptBahtText})`,
      "",
      receiptTotalAmount
    ]);

    receiptData.push([]);
    receiptData.push(["", "", "", `ผู้รับเงิน COLLECTOR: ${receiptCollector || contractorName}`]);

    const wsReceipt = XLSX.utils.aoa_to_sheet(receiptData);
    wsReceipt["!cols"] = [
      { wch: 18 },
      { wch: 60 },
      { wch: 20 },
      { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(wb, wsReceipt, "บิลใบเสร็จรับเงิน (Receipt)");

    // Save File
    const yearText = selectedYear === "All" ? "ทุกปี" : `ปี_พศ_${parseInt(selectedYear, 10) + 543}`;
    const monthText = selectedMonth === "All" ? "ทุกเดือน" : thMonthsFull[parseInt(selectedMonth, 10) - 1];
    const fileName = `ใบสั่งจ้างและรายงานส่งมอบงานมิเตอร์_Form52_${yearText}_${monthText}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  // Thai months mapping
  const thMonthsFull = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const thMonthsShort = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];

  // Auto update period text when year/month changes
  useEffect(() => {
    if (selectedYear && selectedMonth) {
      const isYearAll = selectedYear === "All";
      const isMonthAll = selectedMonth === "All";

      const yearBE = isYearAll ? (yearsList.length > 0 ? parseInt(yearsList[0], 10) + 543 : 2569) : parseInt(selectedYear, 10) + 543;

      if (isMonthAll) {
        setOrderStartPeriod(isYearAll ? "ทุกช่วงเวลา" : `1 ม.ค. ${yearBE}`);
        setOrderEndPeriod(isYearAll ? "ทุกช่วงเวลา" : `31 ธ.ค. ${yearBE}`);
        setDocNumber(`1/รวม-${isYearAll ? "ทั้งหมด" : yearBE.toString().slice(-2)}`);
        setHandoverDate("-");
      } else {
        const monthIdx = parseInt(selectedMonth, 10) - 1;
        const monthText = thMonthsFull[monthIdx];
        const monthShort = thMonthsShort[monthIdx] || monthText.substring(0, 4);
        
        const lastDay = isYearAll ? 30 : new Date(parseInt(selectedYear, 10), monthIdx + 1, 0).getDate();
        
        setOrderStartPeriod(`1 ${monthText} ${isYearAll ? "" : yearBE}`);
        setOrderEndPeriod(`${lastDay} ${monthText} ${isYearAll ? "" : yearBE}`);
        
        setDocNumber(`1/${monthShort}${isYearAll ? "ทั้งหมด" : yearBE.toString().slice(-2)}`);
        setHandoverDate(`7 ${thMonthsFull[(monthIdx + 1) % 12]} ${isYearAll ? "" : (yearBE + (monthIdx === 11 ? 1 : 0))}`);
      }
    }
  }, [selectedYear, selectedMonth, yearsList]);

  // Sync from props
  useEffect(() => {
    if (initialYear) {
      setSelectedYear(initialYear);
    }
    if (initialMonth) {
      setSelectedMonth(initialMonth);
    }
  }, [initialYear, initialMonth]);

  // Auto-detect contractor name from search query
  useEffect(() => {
    if (searchQuery && searchQuery.trim().length > 0) {
      if (/^(นาย|นาง|น\.ส\.)/.test(searchQuery)) {
        setContractorName(searchQuery);
      }
    }
  }, [searchQuery]);

  // Fetch all orders for report matching month/year (non-paginated)
  const fetchReportOrders = async () => {
    setLoading(true);
    try {
      // Build fetch URL matching dashboard filters but with selectedYear/selectedMonth
      const response = await fetch(
        `/api/orders?year=${selectedYear}&month=${selectedMonth}&area=${encodeURIComponent(selectedArea)}&meterSize=${encodeURIComponent(selectedSize)}&status=All&search=${encodeURIComponent(searchQuery)}&limit=1000000`
      );
      if (!response.ok) throw new Error("Failed to load report orders");
      const resData = await response.json();
      if (resData && resData.orders) {
        setOrders(resData.orders);
      }
    } catch (err) {
      console.error("Error fetching report orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setExcludedOrderIds([]);
    fetchReportOrders();
  }, [selectedYear, selectedMonth, selectedArea, selectedSize, selectedStatus, searchQuery]);

  // Define rows matching PDF template
  const baseRows = BASE_ROWS;

  // Map orders to these rows
  const mappedRows: RowData[] = baseRows.map(row => ({
    ...row,
    ordersIn: [],
    ordersOut: []
  }));

  // Populate orders based on classification, using only active orders with wage > 0 and not excluded (matching the detailed list)
  const completedOrders = orders.filter(o => getOrderWage(o) > 0 && !excludedOrderIds.includes(o.id));
  completedOrders.forEach(order => {
    const classification = classifyOrder(order);
    if (classification) {
      const row = mappedRows.find(r => r.key === classification.rowKey);
      if (row) {
        if (classification.locationType === "in") {
          row.ordersIn.push(order);
        } else {
          row.ordersOut.push(order);
        }
      }
    }
  });

  // Process and calculate each row with support for manual overrides
  const processedRows = mappedRows.map(row => {
    const autoCountIn = row.ordersIn.length;
    const autoCountOut = row.ordersOut.length;
    
    // Auto wages:
    const autoSumIn = autoCountIn > 0
      ? (row.ordersIn.reduce((sum, o) => sum + getOrderWage(o), 0) || autoCountIn * row.priceIn)
      : 0;
    const autoSumOut = autoCountOut > 0
      ? (row.ordersOut.reduce((sum, o) => sum + getOrderWage(o), 0) || autoCountOut * row.priceOut)
      : 0;

    const override = summaryOverrides[row.key];
    const isOverridden = override !== undefined && (
      override.countIn !== undefined ||
      override.countOut !== undefined ||
      override.sumIn !== undefined ||
      override.sumOut !== undefined
    );

    const countIn = override?.countIn !== undefined ? Math.max(0, override.countIn) : autoCountIn;
    const countOut = override?.countOut !== undefined ? Math.max(0, override.countOut) : autoCountOut;

    const sumIn = override?.sumIn !== undefined 
      ? override.sumIn 
      : (override?.countIn !== undefined ? countIn * row.priceIn : autoSumIn);

    const sumOut = override?.sumOut !== undefined 
      ? override.sumOut 
      : (override?.countOut !== undefined ? countOut * row.priceOut : autoSumOut);

    const totalSum = sumIn + sumOut;

    return {
      ...row,
      autoCountIn,
      autoCountOut,
      autoSumIn,
      autoSumOut,
      countIn,
      countOut,
      sumIn,
      sumOut,
      totalSum,
      isOverridden
    };
  });

  // Keep ALL rows to ensure complete data (do not filter out 0 Baht rows), in their original fixed sequence to match the PDF template
  const rowsWithData = processedRows;

  // Calculate totals based on filtered non-zero rows
  let totalCountIn = 0;
  let totalCountOut = 0;
  let totalAmountIn = 0;
  let totalAmountOut = 0;
  let grandTotalAmount = 0;

  rowsWithData.forEach(row => {
    totalCountIn += row.countIn;
    totalCountOut += row.countOut;
    totalAmountIn += row.sumIn;
    totalAmountOut += row.sumOut;
  });
  const totalMeters = totalCountIn + totalCountOut;
  grandTotalAmount = totalAmountIn + totalAmountOut;

  // Thai Number to Words converter (Helper)
  function thaiBahtText(num: number): string {
    if (num === 0) return "ศูนย์บาทถ้วน";
    
    const thaiNumbers = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
    const thaiPositions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
    
    const bahtStr = Math.floor(num).toString();
    const satangStr = Math.round((num % 1) * 100).toString();
    
    let text = "";
    
    // Baht conversion
    for (let i = 0; i < bahtStr.length; i++) {
      const digit = parseInt(bahtStr[i], 10);
      const position = bahtStr.length - 1 - i;
      
      if (digit !== 0) {
        if (position === 1 && digit === 1) {
          text += "สิบ";
        } else if (position === 1 && digit === 2) {
          text += "ยี่สิบ";
        } else if (position === 0 && digit === 1 && bahtStr.length > 1) {
          text += "เอ็ด";
        } else {
          text += thaiNumbers[digit] + thaiPositions[position];
        }
      }
    }
    
    text += "บาท";
    
    // Satang conversion
    const satangVal = parseInt(satangStr, 10);
    if (satangVal === 0) {
      text += "ถ้วน";
    } else {
      let satangText = "";
      for (let i = 0; i < satangStr.length; i++) {
        const digit = parseInt(satangStr[i], 10);
        const position = satangStr.length - 1 - i;
        if (digit !== 0) {
          if (position === 1 && digit === 1) {
            satangText += "สิบ";
          } else if (position === 1 && digit === 2) {
            satangText += "ยี่สิบ";
          } else if (position === 0 && digit === 1 && satangStr.length > 1) {
            satangText += "เอ็ด";
          } else {
            satangText += thaiNumbers[digit] + thaiPositions[position];
          }
        }
      }
      text += satangText + "สตางค์";
    }
    
    return text;
  }

  const bahtText = thaiBahtText(grandTotalAmount);

  const getThaiShortMonthAndYear = (yearStr: string, monthStr: string) => {
    const monthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const isYearAll = yearStr === "All";
    const isMonthAll = monthStr === "All";

    const yearBE = isYearAll ? 2569 : parseInt(yearStr, 10) + 543;
    const yearTwoDigits = yearBE.toString().slice(-2);

    const monthIdx = isMonthAll ? 5 : parseInt(monthStr, 10) - 1; // Default to June (index 5) if All
    const monthShort = monthsShort[monthIdx];

    return { monthShort, yearTwoDigits, yearBE };
  };

  const getPageDocNumber = (pageIndex: number) => {
    if (/^\d+\//.test(docNumber)) {
      return docNumber.replace(/^\d+/, (pageIndex + 1).toString());
    }
    return `${pageIndex + 1}/${docNumber}`;
  };

  // Active report orders and total page count calculation
  // Strictly sorted by selected orderSortMode (Default: ค่าจ้าง มาก-น้อย)
  const activeReportOrders = React.useMemo(() => {
    return [...orders]
      .filter(o => getOrderWage(o) > 0 && !excludedOrderIds.includes(o.id))
      .sort(sortReportOrders);
  }, [orders, excludedOrderIds, orderSortMode]);

  // Pre-validate all orders for size vs workType consistency
  const orderValidationMap = React.useMemo(() => {
    const map = new Map<string, OrderValidationResult>();
    orders.forEach((o) => {
      map.set(o.id, validateOrderSizeAndWorkType(o));
    });
    return map;
  }, [orders]);

  const mismatchCount = React.useMemo(() => {
    let count = 0;
    activeReportOrders.forEach((o) => {
      const v = orderValidationMap.get(o.id);
      if (v?.hasMismatch) count++;
    });
    return count;
  }, [activeReportOrders, orderValidationMap]);

  // Automatically reset onlyShowMismatches if all mismatches are resolved
  useEffect(() => {
    if (mismatchCount === 0 && onlyShowMismatches) {
      setOnlyShowMismatches(false);
    }
  }, [mismatchCount, onlyShowMismatches]);

  const totalListWage = React.useMemo(() => {
    return activeReportOrders.reduce((sum, o) => sum + getOrderWage(o), 0);
  }, [activeReportOrders]);

  const totalReportPages = Math.max(1, Math.ceil(activeReportOrders.length / 15));

  const overrideCount = Object.keys(summaryOverrides).length;
  const hasOverrides = overrideCount > 0;

  const computedDocNumber = (() => {
    if (docNumber.includes("-")) {
      return docNumber;
    }
    if (totalReportPages > 1) {
      const startNum = getPageDocNumber(0);
      const endNum = getPageDocNumber(totalReportPages - 1);
      return `${startNum} - ${endNum}`;
    }
    return getPageDocNumber(0);
  })();

  // Auto-generated receipt items derived directly from Summary Report (rowsWithData)
  const autoReceiptItems = React.useMemo(() => {
    if (receiptMode === "single") {
      return [
        {
          id: "summary-single",
          quantity: totalMeters > 0 ? totalMeters : 1,
          description: `ค่าจ้างเหมางานติดตั้งมิเตอร์แรงต่ำ 1 เฟส และ 3 เฟส ตามสัญญาจ้างเลขที่ ${contractNumber}`,
          unitPrice: grandTotalAmount,
          amount: grandTotalAmount,
        }
      ];
    } else {
      const items: { id: string; quantity: string | number; description: string; unitPrice: number; amount: number }[] = [];
      rowsWithData.forEach((row) => {
        if (row.countIn > 0) {
          items.push({
            id: `in-${row.key}`,
            quantity: row.countIn,
            description: `ค่าจ้างเหมา${row.category} (${row.description}) [ในเขต]`,
            unitPrice: row.priceIn,
            amount: row.sumIn,
          });
        }
        if (row.countOut > 0) {
          items.push({
            id: `out-${row.key}`,
            quantity: row.countOut,
            description: `ค่าจ้างเหมา${row.category} (${row.description}) [นอกเขต]`,
            unitPrice: row.priceOut,
            amount: row.sumOut,
          });
        }
      });
      if (items.length === 0) {
        items.push({
          id: "fallback-1",
          quantity: totalMeters > 0 ? totalMeters : 1,
          description: `ค่าจ้างเหมางานติดตั้งมิเตอร์แรงต่ำ 1 เฟส และ 3 เฟส ตามสัญญาจ้างเลขที่ ${contractNumber}`,
          unitPrice: grandTotalAmount,
          amount: grandTotalAmount,
        });
      }
      return items;
    }
  }, [rowsWithData, receiptMode, totalMeters, contractNumber, grandTotalAmount]);

  const activeReceiptItems = receiptCustomItems ?? autoReceiptItems;

  const receiptTotalAmount = React.useMemo(() => {
    return activeReceiptItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [activeReceiptItems]);

  const receiptTotalMeters = React.useMemo(() => {
    if (receiptMode === "single") return totalMeters;
    return activeReceiptItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [receiptMode, totalMeters, activeReceiptItems]);

  const isCountsMatched = activeReportOrders.length === totalMeters;
  const isWageMatched = Math.abs(totalListWage - grandTotalAmount) < 0.01;
  const isReceiptWageMatched = Math.abs(receiptTotalAmount - grandTotalAmount) < 0.01;
  const isFullyConsistent = isCountsMatched && isWageMatched && isReceiptWageMatched;

  const paddedReceiptRows = React.useMemo(() => {
    const totalTargetRows = Math.max(11, activeReceiptItems.length);
    const rows = [...activeReceiptItems];
    while (rows.length < totalTargetRows) {
      rows.push({
        id: `empty-${rows.length}`,
        quantity: "",
        description: "",
        unitPrice: 0,
        amount: 0,
      });
    }
    return rows;
  }, [activeReceiptItems]);

  const receiptBahtText = thaiBahtText(receiptTotalAmount);

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  const handleOpenClick = () => {
    if (isUnlocked) {
      setIsOpen(true);
    } else {
      setShowPasswordModal(true);
      setPasswordInput("");
      setPasswordError("");
    }
  };

  if (!isOpen) {
    return (
      <div 
        id="report-form52-section"
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-purple-300 transition-all cursor-pointer scroll-mt-24 relative"
        onClick={handleOpenClick}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "Prompt" }}>
                สรุปรายงานค่าแรง
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ใบส่งมอบงานจ้างเหมาติดตั้งมิเตอร์ และใบสั่งจ้างปฏิบัติงานเกี่ยวกับมิเตอร์
              </p>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleOpenClick();
            }}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-100 transition-all whitespace-nowrap self-start sm:self-center flex items-center gap-1.5"
            style={{ fontFamily: "Prompt" }}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>สร้างเอกสารสรุปรายงานค่าแรง</span>
          </button>
        </div>

        {/* Custom Password Modal */}
        {showPasswordModal && (
          <div 
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              e.stopPropagation();
              setShowPasswordModal(false);
            }}
          >
            <div 
              className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-5 relative cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto text-purple-600 shadow-sm border border-purple-100">
                <Lock className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: "Prompt" }}>ยืนยันรหัสผ่านเพื่อเข้าใช้งาน</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed px-4">
                  รายงานนี้มีความสำคัญสูง <br />กรุณากรอกรหัสผ่านเพื่อเข้าถึงข้อมูล
                </p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (passwordInput === "meter") {
                    setIsUnlocked(true);
                    setIsOpen(true);
                    setShowPasswordModal(false);
                    setPasswordError("");
                  } else {
                    setPasswordError("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
                  }
                }} 
                className="space-y-4"
              >
                <div className="relative">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    autoFocus
                    placeholder="รหัสผ่าน (Password)"
                    className={`w-full bg-slate-50 border text-center text-sm font-semibold rounded-2xl py-3 px-4 focus:outline-hidden focus:ring-2 focus:bg-white transition-all text-slate-800 ${
                      passwordError 
                        ? "border-red-300 focus:ring-red-100 placeholder-red-300 text-red-900" 
                        : "border-slate-200 focus:ring-purple-100 focus:border-purple-400"
                    }`}
                    style={{ fontFamily: "Prompt" }}
                  />
                </div>

                {passwordError && (
                  <p className="text-xs font-semibold text-red-500 flex items-center justify-center gap-1.5 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{passwordError}</span>
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-xs font-bold transition-all border border-slate-200/50"
                    style={{ fontFamily: "Prompt" }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-purple-100 transition-all"
                    style={{ fontFamily: "Prompt" }}
                  >
                    ยืนยัน
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      id="report-form52-section"
      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 scroll-mt-24 relative"
    >
      {/* Settings Panel Toggle */}
      <div className="absolute top-6 right-6 flex items-center gap-2 print:hidden">
        {excludedOrderIds.length > 0 && (
          <button
            onClick={() => setExcludedOrderIds([])}
            className="p-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold animate-fade-in"
            title="คืนค่าข้อมูลรายการที่ลบกลับมาทั้งหมด"
          >
            <RefreshCw className="w-4 h-4" />
            <span>คืนค่ารายการที่ลบ ({excludedOrderIds.length})</span>
          </button>
        )}

        <button
          onClick={() => setIsOpen(false)}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all border border-slate-100 bg-white shadow-xs flex items-center gap-1.5 text-xs font-semibold"
        >
          <ChevronUp className="w-4 h-4" />
          <span>ย่อรายงาน</span>
        </button>

        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all border border-slate-100 bg-white shadow-xs flex items-center gap-1.5 text-xs font-semibold"
        >
          <Settings className="w-4 h-4" />
          <span>ปรับแต่งชื่อ/เลขที่ใบสั่ง</span>
        </button>

        <button
          onClick={handlePrint}
          className="p-2 text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-100 transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <Printer className="w-4 h-4" />
          <span>พิมพ์{activeReportTab === "summary" ? "รายงาน สร.4-ป.52" : activeReportTab === "receipt" ? "บิลใบเสร็จรับเงิน" : "ใบสั่งปฏิบัติงานมิเตอร์"}</span>
        </button>

        <button
          onClick={handleExportExcel}
          className="p-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-100 transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <Download className="w-4 h-4" />
          <span>ส่งออก Excel</span>
        </button>
      </div>

      <div className="border-b border-slate-100 pb-5 print:hidden">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "Prompt" }}>
          <FileText className="w-5.5 h-5.5 text-purple-600" />
          ใบส่งมอบงานจ้างเหมาติดตั้งมิเตอร์ (สร.4 - ป.52)
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          คำนวณยอดเงินส่งมอบงานจ้างเหมาติดตั้งตาม อัตราค่าจ้างประเภทงาน ในเขต/นอกเขตเทศบาล อัตโนมัติจากฐานข้อมูล
        </p>

        {/* Sync Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 bg-purple-50/50 p-4 rounded-xl border border-purple-100/30">
          <div>
            <label className="block text-[10px] font-bold text-purple-600 uppercase mb-1">ปีดำเนินงาน</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border border-purple-200/50 rounded-lg text-xs font-semibold px-2.5 py-1.5 w-full text-slate-700"
            >
              <option value="All">ทุกปีดำเนินงาน (All)</option>
              {yearsList.map(y => (
                <option key={y} value={y}>ปี พ.ศ. {parseInt(y, 10) + 543} ({y})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-purple-600 uppercase mb-1">เดือนที่สรุปงาน</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-purple-200/50 rounded-lg text-xs font-semibold px-2.5 py-1.5 w-full text-slate-700"
            >
              <option value="All">ทุกเดือน</option>
              <option value="01">มกราคม</option>
              <option value="02">กุมภาพันธ์</option>
              <option value="03">มีนาคม</option>
              <option value="04">เมษายน</option>
              <option value="05">พฤษภาคม</option>
              <option value="06">มิถุนายน</option>
              <option value="07">กรกฎาคม</option>
              <option value="08">สิงหาคม</option>
              <option value="09">กันยายน</option>
              <option value="10">ตุลาคม</option>
              <option value="11">พฤศจิกายน</option>
              <option value="12">ธันวาคม</option>
            </select>
          </div>
          <div className="flex items-end justify-end">
            <button
              onClick={fetchReportOrders}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-100/60 hover:bg-purple-100 rounded-lg border border-purple-200 w-full justify-center transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>ดึงข้อมูลล่าสุด</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Tab Selector (Hidden when printing) */}
      <div className="flex border-b border-slate-100 print:hidden mt-2">
        <button
          onClick={() => setActiveReportTab("summary")}
          className={`px-5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeReportTab === "summary"
              ? "border-purple-600 text-purple-600 font-bold border-b-2 border-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          style={{ fontFamily: "Prompt" }}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>สรุปใบรายงานส่งมอบงาน ({totalMeters} เครื่อง | ฿{grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
          {hasOverrides && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full border border-amber-300">
              แก้ไข {overrideCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveReportTab("list")}
          className={`px-5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeReportTab === "list"
              ? "border-purple-600 text-purple-600 font-bold border-b-2 border-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          style={{ fontFamily: "Prompt" }}
        >
          <List className="w-3.5 h-3.5" />
          <span>รายการใบสั่งจ้างปฏิบัติงาน ({activeReportOrders.length} รายการ | ฿{totalListWage.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
        </button>
        <button
          onClick={() => setActiveReportTab("receipt")}
          className={`px-5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeReportTab === "receipt"
              ? "border-purple-600 text-purple-600 font-bold border-b-2 border-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          style={{ fontFamily: "Prompt" }}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>บิลใบเสร็จรับเงิน (฿{receiptTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
        </button>
      </div>

      {/* 3-Way Consistency Verification & Status Overview (Hidden when printing) */}
      <div className="print:hidden my-4 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900" style={{ fontFamily: "Prompt" }}>
                ระบบตรวจสอบความสอดคล้อง 3 ส่วน (ใบสั่งจ้าง • สรุปส่งมอบงาน • บิลใบเสร็จ)
              </h4>
              <p className="text-[11px] text-slate-500">
                ตรวจสอบยอดเงินรวมและจำนวนงานระหว่าง 3 เอกสารให้ถูกต้องตรงกัน
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasOverrides && (
              <button
                type="button"
                onClick={handleResetAllSummaryOverrides}
                className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="ล้างค่าที่แก้ไขด้วยตนเองทั้งหมด แล้วคืนค่าเริ่มต้นตามใบสั่งจ้าง"
              >
                <RotateCcw className="w-3 h-3" />
                <span>รีเซ็ตยอดอัตโนมัติ</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setActiveReportTab("summary");
                setIsEditingSummary(!isEditingSummary);
              }}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                isEditingSummary
                  ? "text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100"
                  : "text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
              }`}
            >
              {isEditingSummary ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>กำลังอยู่ในโหมดแก้ไข (เสร็จสิ้น)</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3 h-3" />
                  <span>แก้ไขยอดจำนวนในตารางสรุป</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3 Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: รายการใบสั่งจ้าง */}
          <div 
            onClick={() => setActiveReportTab("list")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeReportTab === "list" 
                ? "bg-purple-50/60 border-purple-300 ring-1 ring-purple-400" 
                : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/70"
            }`}
          >
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-[11px] font-bold flex items-center gap-1">
                <List className="w-3.5 h-3.5 text-purple-600" />
                1. รายการใบสั่งจ้างปฏิบัติงาน
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded">
                ข้อมูลดิบ
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-lg font-extrabold text-slate-900 font-mono">
                {activeReportOrders.length} <span className="text-xs font-normal text-slate-500 font-sans">รายการ</span>
              </span>
              <span className="text-sm font-extrabold text-purple-700 font-mono">
                ฿{totalListWage.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              คำนวณจากงานที่มีค่าแรง {activeReportOrders.length} รายการ
            </p>
          </div>

          {/* Card 2: สรุปส่งมอบงาน (สร.4-ป.52) */}
          <div 
            onClick={() => setActiveReportTab("summary")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeReportTab === "summary" 
                ? "bg-purple-50/60 border-purple-300 ring-1 ring-purple-400" 
                : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/70"
            }`}
          >
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-[11px] font-bold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                2. สรุปส่งมอบงาน (สร.4-ป.52)
              </span>
              {hasOverrides ? (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-300 flex items-center gap-0.5">
                  <Edit3 className="w-2.5 h-2.5" /> ปรับเอง {overrideCount}
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                  ตามสัญญา
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-lg font-extrabold text-slate-900 font-mono">
                {totalMeters} <span className="text-xs font-normal text-slate-500 font-sans">เครื่อง</span>
              </span>
              <span className="text-sm font-extrabold text-purple-700 font-mono">
                ฿{grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {hasOverrides ? `มีการแก้ไขตัวเลขเอง ${overrideCount} หมวดรายการ` : "จำแนกตามอัตราค่าจ้างสัญญาและประเภทงาน"}
            </p>
          </div>

          {/* Card 3: บิลใบเสร็จรับเงิน */}
          <div 
            onClick={() => setActiveReportTab("receipt")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeReportTab === "receipt" 
                ? "bg-purple-50/60 border-purple-300 ring-1 ring-purple-400" 
                : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/70"
            }`}
          >
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-[11px] font-bold flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-purple-600" />
                3. บิลใบเสร็จรับเงิน
              </span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded">
                {receiptMode === "itemized" ? "แจกแจงรายข้อ" : "ยอดรวมเหมา"}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-lg font-extrabold text-slate-900 font-mono">
                {receiptTotalMeters} <span className="text-xs font-normal text-slate-500 font-sans">เครื่อง</span>
              </span>
              <span className="text-sm font-extrabold text-purple-700 font-mono">
                ฿{receiptTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              ซิงค์ตรงตามตารางสรุปส่งมอบงานอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="mt-3">
          {isFullyConsistent && !hasOverrides ? (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>ตรวจสอบเรียบร้อย:</strong> ยอดเงินและจำนวนงานตรงกัน 100% ทั้ง 3 ส่วน (ใบสั่งจ้าง = สรุปส่งมอบงาน = บิลใบเสร็จ: รวม <strong>{totalMeters} เครื่อง</strong> ยอดเงิน <strong>฿{grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท</strong>)
              </span>
            </div>
          ) : hasOverrides ? (
            <div className="flex items-center justify-between gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>กำลังใช้งานยอดที่ปรับแต่งด้วยตนเอง:</strong> แก้ไขตัวเลขในใบสรุปส่งมอบงาน ({overrideCount} รายการ) — บิลใบเสร็จรับเงินซิงค์ตรงตามยอดที่แก้ไขแล้ว (฿{grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท)
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetAllSummaryOverrides}
                className="shrink-0 text-xs underline font-bold text-amber-800 hover:text-amber-950 cursor-pointer"
              >
                คืนค่ายอดอัตโนมัติ
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-medium">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>หมายเหตุ:</strong> บิลใบเสร็จรับเงินซิงค์ตรงกับใบสรุปส่งมอบงานแล้ว (฿{grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท) หากต้องการปรับจำนวนหรือยอดเงินให้ตรงกับใบสั่งจ้าง (฿{totalListWage.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท) สามารถกดปุ่มแก้ไขเพื่อปรับแต่งได้ทันที
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveReportTab("summary");
                  setIsEditingSummary(true);
                }}
                className="shrink-0 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
              >
                แก้ไขยอดในตารางสรุป
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings configuration block */}
      {isConfigOpen && (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4 print:hidden animate-fade-in">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-purple-500" />

            </h4>
            <button
              onClick={() => setIsConfigOpen(false)}
              className="text-xs text-purple-600 hover:underline font-bold"
            >
              ตกลง/ปิด
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">เลขที่ใบสั่งจ้าง:</label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              />
              <p className="text-[10px] text-purple-600 mt-1 font-medium">
                ดึงจากจำนวนแผ่นอัตโนมัติ ({totalReportPages} แผ่น): <span className="font-bold">{computedDocNumber}</span>
              </p>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">สัญญาจ้างเลขที่/ลงวันที่:</label>
              <input
                type="text"
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">ผู้รับจ้างงานติดตั้ง:</label>
              <input
                type="text"
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">ช่วงเวลาสั่งจ้างเริ่มต้น:</label>
              <input
                type="text"
                value={orderStartPeriod}
                onChange={(e) => setOrderStartPeriod(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">ช่วงเวลาสิ้นสุดงานติดตั้ง:</label>
              <input
                type="text"
                value={orderEndPeriod}
                onChange={(e) => setOrderEndPeriod(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">วันที่รายงานส่งมอบงาน:</label>
              <input
                type="text"
                value={handoverDate}
                onChange={(e) => setHandoverDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">วันที่กำหนดส่งงาน (แก้อัตโนมัติทุกแถว - ถ้าต้องการ):</label>
              <input
                type="text"
                value={overrideScheduledDelivery}
                onChange={(e) => setOverrideScheduledDelivery(e.target.value)}
                placeholder="ปล่อยว่างหากใช้ตามระบบ"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 placeholder-slate-300"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">วันที่ส่งมอบงาน (แก้อัตโนมัติทุกแถว - ถ้าต้องการ):</label>
              <input
                type="text"
                value={overrideDeliveryDate}
                onChange={(e) => setOverrideDeliveryDate(e.target.value)}
                placeholder="ปล่อยว่างหากใช้ตามระบบ เช่น วันที่ 7 กรกฎาคม 2569"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 placeholder-slate-300"
              />
            </div>
          </div>

          <div className="border-t pt-3 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 mb-1 font-bold">ผู้ควบคุมงาน:</label>
              <input
                type="text"
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold mb-1"
                placeholder="ชื่อสกุล"
              />
              <input
                type="text"
                value={supervisorRole}
                onChange={(e) => setSupervisorRole(e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-lg px-2.5 py-1 text-slate-400 text-[10px]"
                placeholder="ตำแหน่ง"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-bold">ประธานกรรมการ:</label>
              <input
                type="text"
                value={chairmanName}
                onChange={(e) => setChairmanName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold mb-1"
                placeholder="ชื่อสกุล"
              />
              <input
                type="text"
                value={chairmanRole}
                onChange={(e) => setChairmanRole(e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-lg px-2.5 py-1 text-slate-400 text-[10px]"
                placeholder="ตำแหน่ง"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-bold">กรรมการคนที่ 1:</label>
              <input
                type="text"
                value={committee1Name}
                onChange={(e) => setCommittee1Name(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold mb-1"
                placeholder="ชื่อสกุล"
              />
              <input
                type="text"
                value={committee1Role}
                onChange={(e) => setCommittee1Role(e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-lg px-2.5 py-1 text-slate-400 text-[10px]"
                placeholder="ตำแหน่ง"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-bold">กรรมการคนที่ 2:</label>
              <input
                type="text"
                value={committee2Name}
                onChange={(e) => setCommittee2Name(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold mb-1"
                placeholder="ชื่อสกุล"
              />
              <input
                type="text"
                value={committee2Role}
                onChange={(e) => setCommittee2Role(e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-lg px-2.5 py-1 text-slate-400 text-[10px]"
                placeholder="ตำแหน่ง"
              />
            </div>
          </div>

          <div className="border-t pt-3 space-y-2">
            <h5 className="font-bold text-slate-600">ข้อมูลผู้อนุมัติ (ช่อง 3 อนุมัติ)</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-bold">ชื่อผู้อนุมัติ:</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="ปล่อยว่างเพื่อเป็นจุดไข่ปลา หรือพิมพ์ชื่อ เช่น นายชาญชัย วันแสง"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">ตำแหน่งผู้อนุมัติ:</label>
                <input
                  type="text"
                  value={approverRole}
                  onChange={(e) => setApproverRole(e.target.value)}
                  placeholder="เช่น ผจก.กฟส.บผ."
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-bold">ลงวันที่อนุมัติ (ลว.):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={approverSignDate}
                    onChange={(e) => setApproverSignDate(e.target.value)}
                    placeholder="เช่น 7 กรกฎาคม 2569"
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
                  />
                  <div className="relative">
                    <input
                      type="date"
                      onChange={(e) => {
                        const formatted = formatGregorianToThaiFullDate(e.target.value);
                        if (formatted) setApproverSignDate(formatted);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      title="กดเลือกวันที่จากปฏิทิน"
                    />
                    <button
                      type="button"
                      className="h-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-600 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold text-xs transition-colors whitespace-nowrap cursor-pointer"
                    >
                      เลือกวันที่
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-bold">ระยะห่างช่องเซ็นชื่อ (ลายเซ็น):</label>
                <select
                  value={signatureSpacing}
                  onChange={(e: any) => setSignatureSpacing(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 font-semibold text-purple-700 shadow-xs"
                >
                  <option value="normal">มาตรฐาน (Normal)</option>
                  <option value="wide">กว้างพิเศษ - แนะนำ (Wide - Recommended)</option>
                  <option value="extra-wide">กว้างสูงสุด - สำหรับเซ็นชื่อใหญ่ (Extra Wide)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t pt-3 space-y-2">
            <h5 className="font-bold text-slate-600">ข้อมูลลายเซ็นท้ายตาราง (รายการใบสั่งจ้างปฏิบัติงาน)</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">ลงวันที่ผู้ควบคุมงาน (ลว.):</label>
                <input
                  type="text"
                  value={supervisorSignDate}
                  onChange={(e) => setSupervisorSignDate(e.target.value)}
                  placeholder="เช่น 30 มิ.ย. 2569 (ปล่อยว่างหากต้องการเป็นจุดไข่ปลา)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">ตำแหน่งผู้รับจ้าง (ท้ายตาราง):</label>
                <input
                  type="text"
                  value={contractorRole}
                  onChange={(e) => setContractorRole(e.target.value)}
                  placeholder="ผู้รับจ้างติดตั้งมิเตอร์"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">ลงวันที่ผู้รับจ้าง (ลว.):</label>
                <input
                  type="text"
                  value={contractorSignDate}
                  onChange={(e) => setContractorSignDate(e.target.value)}
                  placeholder="เช่น 30 มิ.ย. 2569 (ปล่อยว่างหากต้องการเป็นจุดไข่ปลา)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">กำลังเตรียมแบบฟอร์มเอกสาร...</p>
        </div>
      ) : (
        /* The Actual printable template conforming strictly to PDF page 1 */
        <div className="print:p-0 print:m-0 space-y-6" id="printable-report-area">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              html, body {
                height: auto !important;
                overflow: visible !important;
                background-color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body * {
                visibility: hidden !important;
              }
              #report-form52-section, #report-form52-section * {
                visibility: visible !important;
              }
              #report-form52-section {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
                overflow: visible !important;
              }
              /* Ensure table borders render crisp and solid in print */
              table {
                border-collapse: collapse !important;
                border: 1px solid #000000 !important;
              }
              th, td {
                border-color: #000000 !important;
              }
              /* Ensure parent containers do not restrict height or overflow during printing */
              #app-main-body, #main-content-wrapper, #app-root-container, #app-main-layout {
                overflow: visible !important;
                height: auto !important;
                position: static !important;
                display: block !important;
              }
              [class*="print:hidden"] {
                display: none !important;
              }
              @page {
                size: ${activeReportTab === "list" ? "landscape" : "portrait"};
                margin: ${activeReportTab === "summary" ? "6mm 5mm 3mm 5mm" : activeReportTab === "receipt" ? "8mm 10mm 8mm 10mm" : "4mm 6mm"};
              }
              .landscape-page-break {
                page-break-after: always;
                break-after: page;
              }
            }
          ` }} />
          {activeReportTab === "summary" && (
            /* Printable page container */
            <div className="bg-white rounded-2xl border border-slate-100 p-8 print:border-0 print:p-0 font-sarabun text-slate-800 text-[14px] leading-relaxed max-w-5xl mx-auto shadow-sm print:shadow-none print:max-h-none print:overflow-visible">
            {/* Top document details aligned right */}
            <div className="text-right space-y-0.5 text-[10px] font-semibold text-slate-600 mb-3 print:mb-1 print:text-[9.5px] print:text-black">
              <p className="print:h-auto">บ้านเลขที่ 8/1 หมู่ที่ 3 ถนนศรีบุญเรือง ตำบลบ้านไผ่</p>
              <p>อำเภอบ้านไผ่ จังหวัดขอนแก่น</p>
              <p className="print:w-auto print:h-auto">วันที่ {handoverDate}</p>
            </div>

            {/* Document Title Header */}
            <div className="space-y-0.5 mb-3 print:mb-1 text-[10.5px] print:text-[9.5px]">
              <div className="flex gap-4 items-start">
                <span className="font-bold text-slate-900 w-12 print:text-black">เรื่อง</span>
                <p className="font-bold text-slate-900 flex-1 print:text-black">ขอส่งมอบงานจ้างเหมางานติดตั้งมิเตอร์</p>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-bold text-slate-900 w-12 print:text-black">เรียน</span>
                <p className="font-semibold text-slate-800 flex-1 print:text-black">ผู้จัดการ การไฟฟ้าส่วนภูมิภาค สาขาบ้านไผ่</p>
              </div>
            </div>

            {/* Document Context Description */}
            <div className="text-justify indent-8 leading-relaxed mb-3 print:mb-1.5 text-[10.5px] print:text-[9.5px] print:leading-normal font-medium text-slate-700 print:text-black">
              ตามใบสั่งจ้างเลขที่ <span className="font-bold border-b border-dotted border-black px-1.5">{computedDocNumber || "...................................."}</span> ลว. <span className="font-bold border-b border-dotted border-black px-1.5">{orderStartPeriod}{orderEndPeriod ? ` ถึง ${orderEndPeriod}` : ""}</span> ตกลงจ้างเหมางานติดตั้งมิเตอร์ (ผู้รับจ้าง) <span className="font-bold border-b border-dotted border-black px-1.5">{contractorName}</span> ให้ดำเนินการเกี่ยวกับงานด้านมิเตอร์แรงต่ำ 1 เฟส และ 3 เฟส ตามสัญญาจ้างเลขที่ <span className="font-bold border-b border-dotted border-black px-1.5">{contractNumber}</span> ลักษณะงานดังนี้
            </div>

            {/* Main Form Table */}
            <div className="overflow-x-auto border border-black rounded-lg overflow-hidden mb-3 print:mb-1.5">
              <table className="w-full text-center border-collapse text-[10px] print:text-[9.5px] text-black leading-tight print:leading-tight">
                <thead>
                  <tr className="border-b border-black bg-slate-100 print:bg-slate-100/90 text-black font-bold">
                    <th className="py-2 px-2 print:py-1 print:px-1 border-r border-black w-[30%] text-left font-bold">รายละเอียด</th>
                    <th className="py-2 px-1 print:py-1 print:px-1 border-r border-black w-[10%]">ราคา(ในเขต<br className="hidden print:inline" />เทศบาล)</th>
                    <th className="py-2 px-1 print:py-1 print:px-1 border-r border-black w-[10%]">ราคา(นอกเขต<br className="hidden print:inline" />เทศบาล)</th>
                    <th className="py-2 px-1 print:py-1 print:px-1 border-r border-black w-[8%]">จำนวน<br className="hidden print:inline" />เครื่องในเขต</th>
                    <th className="py-2 px-1 print:py-1 print:px-1 border-r border-black w-[8%]">จำนวน<br className="hidden print:inline" />เครื่องนอกเขต</th>
                    <th className="py-2 px-1 print:py-1 print:px-1 border-r border-black w-[11%]">เป็นเงินในเขต</th>
                    <th className="py-2 px-1 print:py-1 print:px-1 border-r border-black w-[11%]">เป็นเงินนอก<br className="hidden print:inline" />เขต</th>
                    <th className="py-2 px-2 print:py-1 print:px-1 font-bold w-[12%]">รวมเป็นเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {rowsWithData.map((row) => {
                    const countIn = row.countIn;
                    const countOut = row.countOut;
                    const sumIn = row.sumIn;
                    const sumOut = row.sumOut;
                    const totalSum = row.totalSum;
                    const hasData = countIn > 0 || countOut > 0;
                    const isGroupHeader = row.key.endsWith(".1");

                    return (
                      <React.Fragment key={row.key}>
                        {/* Group Header Title in Table (matches PDF template exactly) */}
                        {isGroupHeader && (
                          <tr className="bg-slate-100/60 print:bg-slate-100/60 border-t border-black">
                            <td colSpan={8} className="py-2 px-3 print:py-1 print:px-2 text-left font-bold border-b border-black text-slate-900 print:text-[9.5px] print:leading-tight">
                              {row.category}
                            </td>
                          </tr>
                        )}
                        <tr 
                          onClick={(e) => {
                            // Don't expand when clicking inside an input or button
                            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return;
                            if (hasData) setExpandedRow(expandedRow === row.key ? null : row.key);
                          }}
                          className={`transition-all print:hover:bg-transparent ${
                            row.isOverridden
                              ? "bg-amber-50/40 hover:bg-amber-50/60"
                              : hasData 
                              ? "hover:bg-purple-50/30 cursor-pointer font-semibold bg-purple-50/5" 
                              : "text-slate-700 bg-white"
                          }`}
                        >
                          {/* 1. Description */}
                          <td className="py-2 px-3 print:py-1 print:px-1.5 border-r border-black text-left print:leading-tight">
                            <div className="flex items-start gap-1">
                              {hasData && (
                                <span className="w-1 h-1 rounded-full bg-purple-600 mt-1 mr-1 flex-shrink-0 print:hidden" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`font-semibold text-slate-800 leading-normal ${!hasData && "opacity-85"} print:text-[9.5px] print:leading-tight print:text-black`}>
                                    {row.description}
                                  </span>
                                  {row.isOverridden && (
                                    <span className="text-[9px] text-amber-800 bg-amber-100 border border-amber-300 font-bold px-1 py-0.2 rounded inline-flex items-center gap-0.5 print:hidden">
                                      ปรับยอดเอง
                                    </span>
                                  )}
                                  {row.isOverridden && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleResetRowOverride(row.key);
                                      }}
                                      className="text-[9px] text-rose-600 hover:text-rose-800 underline font-semibold print:hidden ml-1"
                                      title="คืนค่าอัตโนมัติสำหรับแถวนี้"
                                    >
                                      คืนค่าเดิม
                                    </button>
                                  )}
                                </div>
                                {hasData && (
                                  <span className="text-[8px] text-purple-600 font-bold bg-purple-50/80 px-1 py-0.2 rounded mt-1 inline-block print:hidden">
                                    ฐานข้อมูล: {row.autoCountIn + row.autoCountOut} งาน (฿{(row.autoSumIn + row.autoSumOut).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 2. Price In */}
                          <td className="py-2 px-1 print:py-1 print:px-1 border-r border-black font-mono text-center print:text-[9.5px] print:leading-none">
                            {row.priceIn.toFixed(2)}
                          </td>

                          {/* 3. Price Out */}
                          <td className="py-2 px-1 print:py-1 print:px-1 border-r border-black font-mono text-center print:text-[9.5px] print:leading-none">
                            {row.priceOut.toFixed(2)}
                          </td>

                          {/* 4. Count In */}
                          <td className="py-1 px-1 print:py-1 print:px-1 border-r border-black font-mono text-center bg-slate-50/20 print:text-[9.5px] print:leading-none">
                            {isEditingSummary ? (
                              <div className="flex items-center justify-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={countIn === 0 && !row.isOverridden ? "" : countIn}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0;
                                    handleUpdateRowOverride(row.key, {
                                      countIn: val,
                                      sumIn: val * row.priceIn
                                    });
                                  }}
                                  className="w-12 text-center font-bold text-xs bg-amber-50 border border-amber-300 rounded px-1 py-0.5 text-amber-950 focus:ring-1 focus:ring-purple-500 print:hidden"
                                />
                                <span className="hidden print:inline font-bold text-black">{countIn > 0 ? countIn : "-"}</span>
                              </div>
                            ) : (
                              countIn > 0 ? (
                                <span className="font-bold text-slate-900 print:text-black">{countIn}</span>
                              ) : (
                                <span className="text-slate-300 print:text-black">-</span>
                              )
                            )}
                          </td>

                          {/* 5. Count Out */}
                          <td className="py-1 px-1 print:py-1 print:px-1 border-r border-black font-mono text-center bg-slate-50/20 print:text-[9.5px] print:leading-none">
                            {isEditingSummary ? (
                              <div className="flex items-center justify-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={countOut === 0 && !row.isOverridden ? "" : countOut}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0;
                                    handleUpdateRowOverride(row.key, {
                                      countOut: val,
                                      sumOut: val * row.priceOut
                                    });
                                  }}
                                  className="w-12 text-center font-bold text-xs bg-amber-50 border border-amber-300 rounded px-1 py-0.5 text-amber-950 focus:ring-1 focus:ring-purple-500 print:hidden"
                                />
                                <span className="hidden print:inline font-bold text-black">{countOut > 0 ? countOut : "-"}</span>
                              </div>
                            ) : (
                              countOut > 0 ? (
                                <span className="font-bold text-slate-900 print:text-black">{countOut}</span>
                              ) : (
                                <span className="text-slate-300 print:text-black">-</span>
                              )
                            )}
                          </td>

                          {/* 6. Sum In */}
                          <td className="py-1 px-1 print:py-1 print:px-1 border-r border-black font-mono text-right pr-2 print:pr-1 print:text-[9.5px] print:leading-none">
                            {isEditingSummary ? (
                              <div className="flex items-center justify-end">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={sumIn === 0 && !row.isOverridden ? "" : sumIn}
                                  placeholder="0.00"
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                                    handleUpdateRowOverride(row.key, { sumIn: val });
                                  }}
                                  className="w-20 text-right font-bold text-xs bg-amber-50 border border-amber-300 rounded px-1 py-0.5 text-amber-950 focus:ring-1 focus:ring-purple-500 print:hidden"
                                />
                                <span className="hidden print:inline font-semibold text-black">
                                  {sumIn > 0 ? sumIn.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                                </span>
                              </div>
                            ) : (
                              sumIn > 0 ? (
                                <span className="font-semibold text-slate-800 print:text-black">{sumIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              ) : (
                                <span className="text-slate-300 print:text-black">-</span>
                              )
                            )}
                          </td>

                          {/* 7. Sum Out */}
                          <td className="py-1 px-1 print:py-1 print:px-1 border-r border-black font-mono text-right pr-2 print:pr-1 print:text-[9.5px] print:leading-none">
                            {isEditingSummary ? (
                              <div className="flex items-center justify-end">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={sumOut === 0 && !row.isOverridden ? "" : sumOut}
                                  placeholder="0.00"
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                                    handleUpdateRowOverride(row.key, { sumOut: val });
                                  }}
                                  className="w-20 text-right font-bold text-xs bg-amber-50 border border-amber-300 rounded px-1 py-0.5 text-amber-950 focus:ring-1 focus:ring-purple-500 print:hidden"
                                />
                                <span className="hidden print:inline font-semibold text-black">
                                  {sumOut > 0 ? sumOut.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                                </span>
                              </div>
                            ) : (
                              sumOut > 0 ? (
                                <span className="font-semibold text-slate-800 print:text-black">{sumOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              ) : (
                                <span className="text-slate-300 print:text-black">-</span>
                              )
                            )}
                          </td>

                          {/* 8. Total Row Sum */}
                          <td className="py-2 px-2 print:py-1 print:px-1.5 font-mono text-right pr-2 print:pr-1 font-bold text-purple-700 print:text-black print:text-[9.5px] print:leading-none">
                            {totalSum > 0 ? (
                              <span>{totalSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            ) : (
                              <span className="text-slate-300 print:text-black">-</span>
                            )}
                          </td>
                        </tr>

                        {/* Dropdown list of orders matched in this row (For Interactive Drilldown) */}
                        {expandedRow === row.key && (
                          <tr className="bg-slate-50 border-t border-b border-black print:hidden animate-fade-in">
                            <td colSpan={8} className="p-4">
                              <div className="space-y-2 text-left bg-white p-3 rounded-xl border border-slate-200">
                                <p className="text-[10px] font-bold text-purple-700 uppercase flex items-center gap-1.5 mb-2">
                                  <AlertCircle className="w-4 h-4" />
                                  รายชื่อและรหัสผู้ใช้ไฟฟ้าที่นับคำนวณในรายการ ({row.category} - {row.description})
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                                  {row.ordersIn.map(o => (
                                    <div key={o.id} className="p-2 border border-slate-100 rounded-lg flex justify-between bg-slate-50/30">
                                      <span>{o.requestId} | {maskCustomerName(o.customerName)}</span>
                                      <span className="font-bold text-emerald-600 font-mono">ในเขต: ฿{row.priceIn}</span>
                                    </div>
                                  ))}
                                  {row.ordersOut.map(o => (
                                    <div key={o.id} className="p-2 border border-slate-100 rounded-lg flex justify-between bg-slate-50/30">
                                      <span>{o.requestId} | {maskCustomerName(o.customerName)}</span>
                                      <span className="font-bold text-orange-600 font-mono">นอกเขต: ฿{row.priceOut}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Summary Footer Row */}
                  <tr className="border-t-2 border-black font-bold bg-slate-100 print:bg-slate-100/90 text-[11px] print:text-[9.5px]">
                    <td className="py-2 px-3 print:py-1.5 print:px-2 text-center font-bold border-r border-black" colSpan={3}>
                      รวม
                    </td>
                    <td className="py-2 print:py-1.5 border-r border-black font-mono">{totalCountIn || "-"}</td>
                    <td className="py-2 print:py-1.5 border-r border-black font-mono">{totalCountOut || "-"}</td>
                    <td className="py-2 px-2 print:py-1.5 print:px-1.5 text-right border-r border-black font-mono font-bold">
                      {totalAmountIn > 0 ? totalAmountIn.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                    </td>
                    <td className="py-2 px-2 print:py-1.5 print:px-1.5 text-right border-r border-black font-mono font-bold">
                      {totalAmountOut > 0 ? totalAmountOut.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                    </td>
                    <td className="py-2 px-2 print:py-1.5 print:px-1.5 text-right font-mono font-black text-purple-800 print:text-black">
                      {grandTotalAmount > 0 ? grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Statement Matching PDF */}
            <div className="space-y-0.5 mb-2.5 print:mb-1.5 text-slate-700 print:text-black font-medium text-[10.5px] print:text-[9.5px] leading-relaxed print:leading-normal">
              <div className="indent-8 text-justify">
                บัดนี้ข้าพเจ้าได้ดำเนินการตามใบสั่งเลขที่ดังกล่าวข้างต้นเสร็จเรียบร้อยแล้ว รวมเป็นจำนวน <span className="font-bold border-b border-dotted border-black px-4 font-mono">{totalMeters}</span> เครื่อง 
                เป็นเงิน <span className="font-bold border-b border-dotted border-black px-4 font-mono">{grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> บาท (<span className="font-bold px-1">{bahtText}</span>) ตามรายละเอียดที่แนบมาพร้อมนี้ด้วยแล้ว ดังนั้น ข้าพเจ้าจึงขอส่งมอบงานและขอรับค่าจ้างเหมาตามสัญญาต่อไป
              </div>
            </div>

            {/* Signature section */}
            <div className="mt-4 print:mt-1.5 grid grid-cols-2 gap-6 print:gap-3 leading-normal text-slate-700 print:text-black text-[10px] print:text-[9.5px]">
              {/* Left Column Signatures */}
              <div className="flex flex-col h-full justify-between gap-3 print:gap-2">
                {/* Contractor Signature Box */}
                <div className="border border-black rounded-xl p-4 print:p-2 print:rounded-lg bg-slate-50/50 print:bg-white flex flex-col justify-between">
                  <p className="font-semibold text-center text-[10.5px] print:text-[9.5px] mb-0.5">ขอแสดงความนับถือ</p>
                  <div className={`text-center transition-all ${
                    signatureSpacing === "extra-wide" 
                      ? "pt-12 print:pt-7 mb-1" 
                      : signatureSpacing === "normal" 
                        ? "pt-6 print:pt-3.5 mb-0.5" 
                        : "pt-9 print:pt-5 mb-1"
                  }`}>
                    <p className="border-b border-dotted border-black w-48 mx-auto mb-1 print:mb-0.5"></p>
                    <p className="font-bold text-[10.5px] print:text-[9.5px]">({contractorName})</p>
                    <p className="text-[9.5px] print:text-[8.5px] text-slate-500 print:text-black mt-0.5">{contractorRole}</p>
                  </div>
                </div>

                {/* Box containing (1) and (3) */}
                <div className="border border-black rounded-xl p-4 print:p-2 print:rounded-lg bg-slate-50/50 print:bg-white flex flex-col justify-between flex-grow gap-3 print:gap-2">
                  {/* (1) เรียน คณะกรรมการตรวจรับงานจ้าง */}
                  <div className="flex flex-col justify-between flex-grow">
                    <div>
                      <p className="font-bold text-slate-900 print:text-black border-b border-black pb-0.5 text-[10.5px] print:text-[9.5px]">
                        (1) เรียน คณะกรรมการตรวจรับงานจ้าง
                      </p>
                      <p className="indent-4 text-[9.5px] print:text-[8.5px] text-slate-600 print:text-black leading-relaxed print:leading-normal mt-0.5">
                        ผู้รับจ้างได้ดำเนินการครบถ้วนถูกต้อง ตามสัญญา ใบสั่งจ้างแล้ว จึงเรียนมาเพื่อโปรดพิจารณา
                      </p>
                    </div>
                    <div className={`text-center mt-auto transition-all ${
                      signatureSpacing === "extra-wide" 
                        ? "pt-10 print:pt-6" 
                        : signatureSpacing === "normal" 
                          ? "pt-5 print:pt-3" 
                          : "pt-7 print:pt-4.5"
                    }`}>
                      <p className="border-b border-dotted border-black w-40 mx-auto mb-1 print:mb-0.5"></p>
                      <p className="font-bold text-[10.5px] print:text-[9.5px]">({supervisorName})</p>
                      <p className="text-[9.5px] print:text-[8.5px] text-slate-600 print:text-black font-semibold mt-0.5">{supervisorRole}</p>
                      <p className="text-[8.5px] print:text-[7.5px] text-slate-400 print:text-black">ผู้ควบคุมงาน</p>
                    </div>
                  </div>

                  {/* Horizontal Divider */}
                  <div className="border-t border-black my-0.5"></div>

                  {/* (3) อนุมัติ */}
                  <div className="flex flex-col justify-between flex-grow">
                    <div>
                      <p className="font-bold text-slate-900 print:text-black border-b border-black pb-0.5 text-[10.5px] print:text-[9.5px]">(3) อนุมัติ</p>
                    </div>
                    <div className={`text-center mt-auto transition-all ${
                      signatureSpacing === "extra-wide" 
                        ? "pt-10 print:pt-6" 
                        : signatureSpacing === "normal" 
                          ? "pt-5 print:pt-3" 
                          : "pt-7 print:pt-4.5"
                    }`}>
                      <p className="border-b border-dotted border-black w-40 mx-auto mb-1 print:mb-0.5"></p>
                      <p className="font-bold text-[10.5px] print:text-[9.5px] text-slate-800 print:text-black mb-0.5">
                        ( {approverName || "........................................................"} )
                      </p>
                      <p className="text-[9.5px] print:text-[8.5px] text-slate-600 print:text-black font-semibold mb-0.5">{approverRole}</p>
                      <p className="text-[8.5px] print:text-[7.5px] text-slate-500 print:text-black">
                        ลว. {approverSignDate || "............................................................"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column Committee Signatures */}
              <div className="border border-black rounded-xl p-4 print:p-2 print:rounded-lg bg-slate-50/30 print:bg-white flex flex-col justify-between">
                <div>
                  <p className="font-normal text-slate-900 print:text-black border-b border-black pb-1 leading-relaxed print:leading-normal text-[9.5px] print:text-[8.5px]">
                    (2)&nbsp;&nbsp;เรียน ผจก.กฟส.บผ. ผ่าน รจก.(ท.) ,หผ.มต.กฟส.บผ&nbsp;&nbsp;ตามที่คณะกรรมการตรวจรับงานจ้างฯ ตามใบสั่งจ้างเลขที่&nbsp;&nbsp;<span className="font-bold border-b border-dotted border-black px-1">{computedDocNumber}</span> ซึ่งได้ทำการส่งมอบงาน ลว. <span className="font-bold border-b border-dotted border-black px-1">{handoverDate}</span> แล้ว ครบถ้วนและถูกต้องตามสัญญาใบสั่งจ้าง จึงเห็นควรอนุมัติให้จ่ายเงินได้ เป็นเงิน <span className="font-bold border-b border-dotted border-black px-1 font-mono">{grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> บาท ({bahtText || "............................................................"})
                  </p>

                  <div className={`pt-4 print:pt-2 pb-0.5 transition-all ${
                    signatureSpacing === "extra-wide"
                      ? "space-y-7 print:space-y-4"
                      : signatureSpacing === "normal"
                        ? "space-y-3 print:space-y-2"
                        : "space-y-5 print:space-y-3"
                  }`}>
                    <div className="text-center">
                      <div className={signatureSpacing === "extra-wide" ? "h-8 print:h-5" : signatureSpacing === "normal" ? "h-2 print:h-1" : "h-5 print:h-3"}></div>
                      <p className="text-[9.5px] print:text-[8.5px] text-slate-600 print:text-black mb-1 print:mb-0.5">
                        ลงชื่อ............................................................ประธานกรรมการ
                      </p>
                      <p className="font-bold text-[10px] print:text-[8.5px]">( {chairmanName} )</p>
                      <p className="text-[9px] print:text-[7.5px] text-slate-500 print:text-black mt-0.5">{chairmanRole}</p>
                    </div>

                    <div className="text-center">
                      <div className={signatureSpacing === "extra-wide" ? "h-8 print:h-5" : signatureSpacing === "normal" ? "h-2 print:h-1" : "h-5 print:h-3"}></div>
                      <p className="text-[9.5px] print:text-[8.5px] text-slate-600 print:text-black mb-1 print:mb-0.5">
                        ลงชื่อ............................................................กรรมการ
                      </p>
                      <p className="font-bold text-[10px] print:text-[8.5px]">( {committee1Name} )</p>
                      <p className="text-[9.5px] print:text-[7.5px] text-slate-500 print:text-black mt-0.5">{committee1Role}</p>
                    </div>
                    
                    <div className="text-center">
                      <div className={signatureSpacing === "extra-wide" ? "h-8 print:h-5" : signatureSpacing === "normal" ? "h-2 print:h-1" : "h-5 print:h-3"}></div>
                      <p className="text-[9.5px] print:text-[8.5px] text-slate-600 print:text-black mb-1 print:mb-0.5">
                        ลงชื่อ............................................................กรรมการ
                      </p>
                      <p className="font-bold text-[10px] print:text-[8.5px]">( {committee2Name} )</p>
                      <p className="text-[8.5px] print:text-[7.5px] text-slate-500 print:text-black mt-0.5">{committee2Role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {activeReportTab === "list" && (
            <div className="space-y-8 font-sarabun text-black text-[12px] print:text-[11px] max-w-7xl mx-auto">
              
              {(() => {
                const CHUNK_SIZE = 15; // 15 rows per page fits A4 Landscape perfectly with title headers and zero overflow
                
                // If filtering only mismatches, ensure it only filters when there are actual mismatches
                const displayOrders = (onlyShowMismatches && mismatchCount > 0)
                  ? activeReportOrders.filter((o) => orderValidationMap.get(o.id)?.hasMismatch)
                  : activeReportOrders;

                const pageChunks: Order[][] = [];
                for (let i = 0; i < displayOrders.length; i += CHUNK_SIZE) {
                  pageChunks.push(displayOrders.slice(i, i + CHUNK_SIZE));
                }
                if (pageChunks.length === 0) {
                  pageChunks.push([]);
                }
                
                const { monthShort, yearTwoDigits } = getThaiShortMonthAndYear(selectedYear, selectedMonth);

                return (
                  <>
                    {/* Information banner with interactive sort mode selection and mismatch validation (print:hidden) */}
                    <div className="print:hidden bg-slate-50 border border-slate-200/90 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                          <span className="font-bold text-slate-800">การจัดเรียง:</span>
                        </div>
                        <div className="inline-flex items-center p-0.5 bg-slate-200/70 rounded-lg text-xs">
                          <button
                            type="button"
                            onClick={() => setOrderSortMode("wage_desc")}
                            className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                              orderSortMode === "wage_desc"
                                ? "bg-white text-blue-700 shadow-xs font-bold"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <ArrowDownWideNarrow className="w-3.5 h-3.5" />
                            เรียงจากค่าจ้าง มาก-น้อย
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderSortMode("category")}
                            className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                              orderSortMode === "category"
                                ? "bg-white text-blue-700 shadow-xs font-bold"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            เรียงตามประเภทงาน (หมวด 1–7)
                          </button>
                        </div>
                      </div>

                      {/* Mismatch Validation & Filter Controls */}
                      <div className="flex flex-wrap items-center gap-2">
                        {mismatchCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => setOnlyShowMismatches(!onlyShowMismatches)}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                              onlyShowMismatches
                                ? "bg-red-600 text-white border-red-700 shadow-xs"
                                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            }`}
                            title="คลิกเพื่อกรองหรือยกเลิกการกรองเฉพาะรายการที่ขนาดและประเภทงานไม่ตรงกัน"
                          >
                            <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
                            <span>พบข้อมูลขนาดและประเภทงานไม่ตรงกัน {mismatchCount} รายการ</span>
                            <span className="text-[11px] font-normal underline ml-1">
                              {onlyShowMismatches ? "(คลิกแสดงทั้งหมด)" : "(คลิกเพื่อกรองตรวจเช็ค)"}
                            </span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>ตรวจเช็คขนาดและประเภทงาน: ข้อมูลตรงกันทุกรายการ</span>
                            </div>
                            {onlyShowMismatches && (
                              <button
                                type="button"
                                onClick={() => setOnlyShowMismatches(false)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                              >
                                แสดงรายการทั้งหมด
                              </button>
                            )}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg">
                          <span>{displayOrders.length} รายการ ({pageChunks.length} แผ่น)</span>
                        </div>
                      </div>
                    </div>

                    {pageChunks.map((chunk, pageIndex) => {
                      const pageDocNumber = getPageDocNumber(pageIndex);
                  
                  return (
                    <div 
                      key={pageIndex} 
                      className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm print:shadow-none print:border-0 print:p-0 landscape-page-break relative"
                    >
                      {/* Header / Title block repeating on each page */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 text-center">
                          <h2 className="text-sm font-bold text-center">การไฟฟ้าส่วนภูมิภาค สาขาบ้านไผ่ จังหวัดขอนแก่น</h2>
                          <h3 className="text-xs font-bold text-center mt-1">ใบสั่งจ้างปฏิบัติงานเกี่ยวกับมิเตอร์ (ยกเว้นกรณีงดจ่ายไฟฟ้า)</h3>
                          <p className="text-[10px] text-center mt-0.5">ตามสัญญาจ้างเลขที่ {contractNumber}</p>
                          <p className="text-[10px] text-center mt-0.5 font-bold">ผู้รับจ้าง {contractorName}</p>
                        </div>
                        <div className="text-right font-bold text-[11px] self-start border border-black/20 px-3 py-1.5 rounded-lg bg-slate-50 print:bg-white flex flex-col items-end">
                          <span>เลขที่ใบสั่งจ้าง {pageDocNumber}</span>
                          <span className="text-[9px] text-slate-400 font-normal mt-0.5 print:text-black">แผ่นที่ {pageIndex + 1} / {pageChunks.length}</span>
                        </div>
                      </div>

                      {/* Main Table */}
                      <div className="overflow-x-auto border border-black rounded-lg overflow-hidden">
                        <table className="w-full text-center border-collapse text-[9px] text-black">
                          <thead>
                            <tr className="border-b border-black bg-slate-50 print:bg-white text-[9px] font-bold">
                              <th className="border-r border-black px-1 py-1.5 text-center w-[4%]" rowSpan={2}>ลำดับที่</th>
                              <th className="border-r border-black px-1 py-1.5 text-center w-[7%]" rowSpan={2}>ว/ด/ป</th>
                              <th className="border-r border-black px-1 py-1.5 text-center w-[8%]" rowSpan={2}>เลขที่คำร้อง</th>
                              <th className="border-r border-black px-2 py-1.5 text-left w-[14%]" rowSpan={2}>ชื่อผู้ใช้ไฟฟ้า</th>
                              <th className="border-r border-black px-1 py-1 text-center w-[15%]" colSpan={2}>หมายเลขผู้ใช้ไฟฟ้า</th>
                              <th className="border-r border-black px-1 py-1 text-center w-[8%]" colSpan={1}>รายละเอียดมิเตอร์</th>
                              <th className="border-r border-black px-2 py-1.5 text-left w-[12%]" rowSpan={2}>พื้นที่ดำเนินการ</th>
                              <th className="border-r border-black px-1 py-1 text-center w-[20%]" colSpan={2}>รายละเอียดงานที่ให้ดำเนินการ</th>
                              <th className="border-r border-black px-1 py-1 text-center w-[16%]" colSpan={2}>วันที่</th>
                              <th className="border-r border-black px-1 py-1.5 text-center w-[6%]" rowSpan={2}>หมายเหตุ</th>
                              <th className="px-1 py-1.5 text-center w-[4%] print:hidden text-rose-600 font-bold font-sans" rowSpan={2}>จัดการ</th>
                            </tr>
                            <tr className="border-b border-black bg-slate-50 print:bg-white text-[8px] font-bold">
                              <th className="border-r border-black px-1 py-1 text-center w-[10%]">สาย-หมายเลข</th>
                              <th className="border-r border-black px-1 py-1 text-center w-[5%]">ขนาด</th>
                              <th className="border-r border-black px-1 py-1 text-center w-[8%]">PEA</th>
                              <th className="border-r border-black px-1 py-1 text-left w-[14%]">ประเภทงาน</th>
                              <th className="border-r border-black px-1 py-1 text-right w-[6%]">ค่าจ้าง</th>
                              <th className="border-r border-black px-1 py-1 text-center w-[8%]">กำหนดส่งงาน</th>
                              <th className="border-r border-black px-1 py-1 text-center w-[8%]">ส่งมอบงาน</th>
                            </tr>
                          </thead>
                          <tbody>
                            {chunk.map((order, idx) => {
                              const globalIndex = pageIndex * CHUNK_SIZE + idx + 1;
                              
                              const hasWorkIn = order.workTypeIn && order.workTypeIn.trim().length > 0;
                              const hasWorkOut = order.workTypeOut && order.workTypeOut.trim().length > 0;
                              
                              let workType = "-";
                              let wage = 0;
                              
                              if (hasWorkIn && hasWorkOut) {
                                workType = `${order.workTypeIn} / ${order.workTypeOut}`;
                                wage = (order.costIn || 0) + (order.costOut || 0);
                              } else if (hasWorkIn) {
                                workType = order.workTypeIn;
                                wage = order.costIn || 0;
                              } else if (hasWorkOut) {
                                workType = order.workTypeOut;
                                wage = order.costOut || 0;
                              }
                              
                              if (wage === 0 && order.totalCost) {
                                wage = order.totalCost;
                              }

                              if (workType === "-" || !workType.trim()) {
                                const info = getOrderCategoryInfo(order);
                                const baseRow = BASE_ROWS.find(r => r.key === info.rowKey);
                                if (baseRow) {
                                  workType = `${baseRow.category} (${baseRow.description})`;
                                }
                              }

                                const validation = orderValidationMap.get(order.id) || validateOrderSizeAndWorkType(order);

                                return (
                                  <tr 
                                    key={order.id || idx} 
                                    className={`border-b border-black text-[7.5px] print:text-[7px] leading-tight h-7 font-medium text-black ${
                                      validation.hasMismatch ? "bg-red-50/30 print:bg-transparent" : ""
                                    }`}
                                  >
                                    <td className="border-r border-black text-left py-0.5 px-1 whitespace-nowrap">{globalIndex}</td>
                                    <td className="border-r border-black text-left font-mono py-0.5 px-1 whitespace-nowrap">{order.date}</td>
                                    <td className="border-r border-black text-left font-mono py-0.5 px-1 whitespace-nowrap">{order.requestId}</td>
                                    <td className="border-r border-black text-left px-1 py-0.5 whitespace-nowrap" title={order.customerName}>{order.customerName}</td>
                                    <td className="border-r border-black text-left font-mono py-0.5 px-1 whitespace-nowrap">{order.wireNum || "-"}</td>
                                    <td 
                                      className={`border-r border-black text-left font-mono py-0.5 px-1 whitespace-nowrap transition-colors ${
                                        validation.sizeMismatch 
                                          ? "text-red-600 font-bold bg-red-100/70 print:text-red-600 print:font-bold" 
                                          : ""
                                      }`}
                                      title={validation.sizeMismatch ? `⚠️ ขนาดไม่ตรงกับประเภทงาน: ${validation.reason}` : order.meterSize}
                                    >
                                      <span className={validation.sizeMismatch ? "text-red-600 font-bold underline decoration-red-400 decoration-dotted" : ""}>
                                        {order.meterSize || "-"}
                                      </span>
                                      {validation.sizeMismatch && (
                                        <span className="ml-1 text-[8px] print:hidden text-red-600 font-sans font-bold" title={validation.reason}>
                                          ⚠️
                                        </span>
                                      )}
                                    </td>
                                    <td className="border-r border-black text-left font-mono py-0.5 px-1 whitespace-nowrap">{order.peaMeter || "-"}</td>
                                    <td className="border-r border-black text-left px-1 py-0.5 whitespace-nowrap" title={order.area}>{order.area || "-"}</td>
                                    <td 
                                      className={`border-r border-black text-left px-1 py-0.5 whitespace-nowrap transition-colors ${
                                        validation.workTypeMismatch 
                                          ? "text-red-600 font-bold bg-red-100/70 print:text-red-600 print:font-bold" 
                                          : ""
                                      }`}
                                      title={validation.workTypeMismatch ? `⚠️ ประเภทงานไม่ตรงกับขนาด: ${validation.reason}` : workType}
                                    >
                                      <span className={validation.workTypeMismatch ? "text-red-600 font-bold underline decoration-red-400 decoration-dotted" : ""}>
                                        {workType}
                                      </span>
                                      {validation.workTypeMismatch && (
                                        <span className="ml-1 text-[8px] print:hidden text-red-600 font-sans font-bold" title={validation.reason}>
                                          ⚠️
                                        </span>
                                      )}
                                    </td>
                                    <td className="border-r border-black text-left px-1 py-0.5 font-mono whitespace-nowrap">{wage > 0 ? wage.toLocaleString() : "-"}</td>
                                    <td className="border-r border-black text-left font-mono py-0.5 px-1 whitespace-nowrap">{overrideScheduledDelivery || order.scheduledDelivery || order.date}</td>
                                    <td className="border-r border-black text-left font-mono py-0.5 px-1 whitespace-nowrap">{overrideDeliveryDate || order.deliveryDate || order.date}</td>
                                    <td className="border-r border-black text-left py-0.5 px-1 whitespace-nowrap">
                                      {validation.hasMismatch && (
                                        <span className="text-[7px] text-red-600 font-bold print:inline hidden" title={validation.reason}>
                                          *ขนาด/งานไม่ตรง
                                        </span>
                                      )}
                                    </td>
                                    <td className="text-center py-0.5 px-1 whitespace-nowrap print:hidden">
                                      <div className="inline-flex items-center gap-1">
                                        <button
                                          onClick={() => setEditingOrder(order)}
                                          className={`p-1 rounded-lg transition-all inline-flex items-center justify-center cursor-pointer font-sans ${
                                            validation.hasMismatch
                                              ? "text-red-600 hover:text-red-800 hover:bg-red-100 bg-red-50"
                                              : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                          }`}
                                          title="แก้ไขขนาด/ประเภทงาน"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setExcludedOrderIds(prev => [...prev, order.id])}
                                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all inline-flex items-center justify-center cursor-pointer font-sans"
                                          title="ลบรายการนี้"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                            })}
                            {/* No empty rows padding - make table fit actual data only */}
                          </tbody>
                        </table>
                      </div>

                      {/* Signature Section under the table */}
                      <div className="mt-12 print:mt-8 grid grid-cols-2 gap-12 text-[12px] print:text-[11px] text-slate-700 print:text-black font-sarabun">
                        {/* Left Column: ผู้ควบคุมงาน */}
                        <div className="text-center flex flex-col items-center">
                          <div className={signatureSpacing === "extra-wide" ? "h-10 print:h-8" : signatureSpacing === "normal" ? "h-4 print:h-3" : "h-7 print:h-5"}></div>
                          <p className={`text-[11px] print:text-[10px] font-semibold text-slate-800 print:text-black ${
                            signatureSpacing === "extra-wide" 
                              ? "mb-10 print:mb-8" 
                              : signatureSpacing === "normal" 
                                ? "mb-5 print:mb-4" 
                                : "mb-8 print:mb-6"
                          }`}>
                            (ลงชื่อ)................................................................. ผู้ควบคุมงาน
                          </p>
                          <p className="font-bold text-[11px] print:text-[10px]">
                            ( {supervisorName} )
                          </p>
                          <p className="text-[9.5px] print:text-[8.5px] text-slate-500 print:text-black mt-0.5">
                            {supervisorRole}
                          </p>
                          <p className="mt-3 text-[10px] print:text-[9px]">
                            ลว. {supervisorSignDate || "............................................................"}
                          </p>
                        </div>

                        {/* Right Column: ผู้รับจ้าง */}
                        <div className="text-center flex flex-col items-center">
                          <div className={signatureSpacing === "extra-wide" ? "h-10 print:h-8" : signatureSpacing === "normal" ? "h-4 print:h-3" : "h-7 print:h-5"}></div>
                          <p className={`text-[11px] print:text-[10px] font-semibold text-slate-800 print:text-black ${
                            signatureSpacing === "extra-wide" 
                              ? "mb-10 print:mb-8" 
                              : signatureSpacing === "normal" 
                                ? "mb-5 print:mb-4" 
                                : "mb-8 print:mb-6"
                          }`}>
                            (ลงชื่อ)................................................................. ผู้รับจ้าง
                          </p>
                          <p className="font-bold text-[11px] print:text-[10px]">
                            ( {contractorName} )
                          </p>
                          <p className="text-[9.5px] print:text-[8.5px] text-slate-500 print:text-black mt-0.5">
                            {contractorRole}
                          </p>
                          <p className="mt-3 text-[10px] print:text-[9px]">
                            ลว. {contractorSignDate || "............................................................"}
                          </p>
                        </div>
                      </div>
                      

                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      )}

          {/* Receipt Bill Tab Component */}
          {activeReportTab === "receipt" && (
            <div className="space-y-6 max-w-4xl mx-auto font-sarabun">
              {/* Receipt Control & Settings Panel (Hidden when printing) */}
              <div className="bg-white border border-purple-200 rounded-2xl p-5 shadow-sm print:hidden space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">การตั้งค่าเอกสารบิลใบเสร็จรับเงิน (Receipt Generator)</h3>
                      <p className="text-xs text-slate-500">ดึงยอดและรายการอัตโนมัติจากรายงานสรุปการส่งมอบงาน (สร.4-ป.52)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReceiptMode(receiptMode === "itemized" ? "single" : "itemized")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        receiptMode === "itemized"
                          ? "bg-purple-50 border-purple-300 text-purple-700"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      โหมด: {receiptMode === "itemized" ? "แสดงแยกประเภทงาน" : "แสดงรวมเหมาจ่ายก้อนเดียว"}
                    </button>

                    <button
                      onClick={() => setIsReceiptEditOpen(!isReceiptEditOpen)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      {isReceiptEditOpen ? "ซ่อนแบบฟอร์มแก้ไข" : "แก้ไขข้อมูลใบเสร็จ"}
                    </button>

                    <button
                      onClick={handlePrint}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-md shadow-purple-100 transition-all flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      สั่งพิมพ์ใบเสร็จ
                    </button>
                  </div>
                </div>

                {/* Inline Editing Controls */}
                {isReceiptEditOpen && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs animate-fade-in">
                    <div className="md:col-span-3 border-b border-slate-200 pb-2">
                      <span className="font-bold text-purple-800 flex items-center gap-1.5 text-xs">
                        <Receipt className="w-3.5 h-3.5" /> ข้อมูลผู้ออกใบเสร็จ / ผู้รับเงิน (มุมบนซ้ายเอกสาร)
                      </span>
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">ชื่อผู้ออกใบเสร็จ / ผู้รับจ้าง:</label>
                      <input
                        type="text"
                        value={receiptIssuerName}
                        onChange={(e) => setReceiptIssuerName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
                        placeholder="นายประจักร ฤทธิ์คำ"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">ที่อยู่ผู้ออกใบเสร็จ:</label>
                      <input
                        type="text"
                        value={receiptIssuerAddress}
                        onChange={(e) => setReceiptIssuerAddress(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                        placeholder="123 หมู่ 4 ต.บ้านไผ่ อ.บ้านไผ่ จ.ขอนแก่น 40110"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">เบอร์โทรศัพท์ / ข้อมูลติดต่อ:</label>
                      <input
                        type="text"
                        value={receiptIssuerPhone}
                        onChange={(e) => setReceiptIssuerPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono"
                        placeholder="โทร. 081-234-5678"
                      />
                    </div>

                    <div className="md:col-span-3 border-b border-slate-200 pb-2 my-1">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                        <Sliders className="w-3.5 h-3.5" /> ข้อมูลเลขที่เอกสาร และ นามลูกค้าผู้รับบริการ
                      </span>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-600 mb-1">เล่มที่ (BOOK NO.):</label>
                      <input
                        type="text"
                        value={receiptBookNo}
                        onChange={(e) => setReceiptBookNo(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">เลขที่ (BILL NO.):</label>
                      <input
                        type="text"
                        value={receiptBillNo}
                        onChange={(e) => setReceiptBillNo(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
                        placeholder="001"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">วันที่ (DATE):</label>
                      <input
                        type="text"
                        value={receiptDate}
                        onChange={(e) => setReceiptDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
                        placeholder="ระบุวันที่..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-medium text-slate-600 mb-1">นามลูกค้า (CUSTOMER):</label>
                      <input
                        type="text"
                        value={receiptCustomerName}
                        onChange={(e) => setReceiptCustomerName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">เลขประจำตัวผู้เสียภาษี (TAX ID):</label>
                      <input
                        type="text"
                        value={receiptTaxId}
                        onChange={(e) => setReceiptTaxId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-medium text-slate-600 mb-1">ที่อยู่ลูกค้า (ADDRESS):</label>
                      <input
                        type="text"
                        value={receiptCustomerAddress}
                        onChange={(e) => setReceiptCustomerAddress(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">ผู้รับเงิน (COLLECTOR):</label>
                      <input
                        type="text"
                        value={receiptCollector}
                        onChange={(e) => setReceiptCollector(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold"
                        placeholder={receiptIssuerName || contractorName}
                      />
                    </div>

                    {receiptCustomItems && (
                      <div className="md:col-span-3 flex justify-end pt-2">
                        <button
                          onClick={() => setReceiptCustomItems(null)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          รีเซ็ตรายการกลับเป็นค่าดึงจากสรุปส่งมอบงานอัตโนมัติ
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Print Sheet Canvas - Matches the template image exactly */}
              <div className="bg-white rounded-2xl border border-slate-200 print:border-0 p-8 sm:p-10 print:p-0 shadow-lg print:shadow-none text-black font-sarabun max-w-4xl mx-auto relative">
                
                {/* Header Section: Left = Issuer Info (นายประจักร ฤทธิ์คำ), Right = Title & Book/Bill No */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4 border-b border-black pb-3">
                  {/* Top Left: Issuer Information (ชื่อและที่อยู่นายประจักร ฤทธิ์คำ) */}
                  <div className="space-y-0.5 text-xs print:text-[11px] max-w-md">
                    <h2 className="font-bold text-sm print:text-xs text-black leading-tight border-b border-black/40 pb-0.5 mb-1 inline-block">
                      {receiptIssuerName || contractorName || "นายประจักร ฤทธิ์คำ"}
                    </h2>
                    {receiptIssuerAddress && (
                      <p className="text-slate-900 print:text-black leading-snug">
                        <span className="font-semibold">ที่อยู่:</span> {receiptIssuerAddress}
                      </p>
                    )}
                    {receiptIssuerPhone && (
                      <p className="text-slate-900 print:text-black leading-snug font-mono text-[11px] print:text-[10px]">
                        {receiptIssuerPhone}
                      </p>
                    )}
                  </div>

                  {/* Top Right: Document Title & BOOK NO / BILL NO */}
                  <div className="flex flex-col items-end gap-2">
                    <h1 className="text-base sm:text-lg font-bold tracking-wide text-black text-right">
                      ใบเสร็จรับเงิน / RECEIPT
                    </h1>
                    <div className="border border-black text-center text-xs print:text-[11px] grid grid-cols-2 divide-x divide-black rounded-none">
                      <div className="px-4 py-1.5">
                        <span className="block font-bold">เล่มที่</span>
                        <span className="block text-[9px] text-slate-600 print:text-black tracking-tighter">BOOK NO.</span>
                        <span className="block font-mono font-bold text-sm mt-0.5">{receiptBookNo || "1"}</span>
                      </div>
                      <div className="px-4 py-1.5">
                        <span className="block font-bold">เลขที่</span>
                        <span className="block text-[9px] text-slate-600 print:text-black tracking-tighter">BILL NO.</span>
                        <span className="block font-mono font-bold text-sm mt-0.5">{receiptBillNo || "001"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer and ID Info Block */}
                <div className="space-y-2 text-xs print:text-[11px] mb-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dotted border-black/40 pb-1">
                    <div className="flex items-baseline gap-2 flex-1">
                      <span className="font-bold shrink-0">นาม <span className="text-[10px] text-slate-600 print:text-black font-normal">CUSTOMER</span></span>
                      <span className="font-semibold text-slate-900 print:text-black">{receiptCustomerName}</span>
                    </div>
                    <div className="flex items-baseline gap-2 shrink-0">
                      <span className="font-bold">วันที่ <span className="text-[10px] text-slate-600 print:text-black font-normal">DATE</span></span>
                      <span className="font-semibold border-b border-black px-3">{receiptDate || "...................."}</span>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 border-b border-dotted border-black/40 pb-1">
                    <span className="font-bold shrink-0">ที่อยู่ <span className="text-[10px] text-slate-600 print:text-black font-normal">ADDRESS</span></span>
                    <span className="text-slate-900 print:text-black">{receiptCustomerAddress}</span>
                  </div>

                  <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-dotted border-black/40 pb-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold">เลขประจำตัวผู้เสียภาษี <span className="text-[10px] text-slate-600 print:text-black font-normal">Tax Identification Number</span></span>
                      <span className="font-mono font-semibold border-b border-black px-2">{receiptTaxId}</span>
                    </div>
                  </div>
                </div>

                {/* Main Receipt Table */}
                <div className="mb-6">
                  <table className="w-full border-collapse border border-black text-xs print:text-[10.5px]">
                    <thead>
                      <tr className="bg-sky-100/60 print:bg-slate-200 text-center font-bold divide-x divide-black border-b border-black">
                        <th className="border border-black py-2 px-2 w-24">
                          <span className="block">จำนวน</span>
                          <span className="block text-[9px] font-normal tracking-tight">QUANTITY</span>
                        </th>
                        <th className="border border-black py-2 px-3 text-center">
                          <span className="block">รายการ</span>
                          <span className="block text-[9px] font-normal tracking-tight">DESCRIPTION</span>
                        </th>
                        <th className="border border-black py-2 px-2 w-28 text-center">
                          <span className="block">หน่วยละ</span>
                          <span className="block text-[9px] font-normal tracking-tight">UNIT PRICE</span>
                        </th>
                        <th className="border border-black py-2 px-2 w-32 text-center">
                          <span className="block">จำนวนเงิน</span>
                          <span className="block text-[9px] font-normal tracking-tight">AMOUNT</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {paddedReceiptRows.map((row, idx) => {
                        const isRowFilled = row.description !== "";
                        return (
                          <tr key={row.id || idx} className="divide-x divide-black h-8 text-center">
                            <td className="px-2 py-1 font-mono font-medium">
                              {row.quantity}
                            </td>
                            <td className="px-3 py-1 text-left">
                              {row.description}
                            </td>
                            <td className="px-2 py-1 text-right font-mono">
                              {isRowFilled && row.unitPrice ? row.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ""}
                            </td>
                            <td className="px-2 py-1 text-right font-mono font-semibold relative">
                              {isRowFilled ? (
                                <div className="flex justify-between items-center w-full">
                                  <span>{Math.floor(row.amount).toLocaleString()}</span>
                                  <span className="text-[10px] border-l border-slate-300 print:border-black pl-1 font-mono">
                                    {((row.amount % 1) * 100).toFixed(0).padStart(2, '0')}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex justify-end text-[10px] text-slate-300 print:text-black">
                                  <span>00</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Total Amount & Baht Text Summary Row */}
                      <tr className="divide-x divide-black border-t-2 border-black bg-sky-100/60 print:bg-slate-200 font-bold">
                        <td colSpan={2} className="px-3 py-2 text-left">
                          <div className="flex items-center gap-2">
                            <span className="shrink-0">บาท <span className="text-[9px] font-normal">BATH</span> :</span>
                            <span className="text-purple-950 print:text-black text-xs border-b border-black/40 px-2 flex-1">
                              ({receiptBahtText})
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center text-xs">
                          <span>รวมเงิน</span>
                          <span className="block text-[9px] font-normal">TOTAL</span>
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-sm font-black text-purple-950 print:text-black">
                          <div className="flex justify-between items-center w-full">
                            <span>{Math.floor(receiptTotalAmount).toLocaleString()}</span>
                            <span className="text-xs border-l border-black pl-1 font-mono">
                              {((receiptTotalAmount % 1) * 100).toFixed(0).padStart(2, '0')}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Collector Signature Row */}
                <div className="mt-8 pt-4 flex justify-between items-end text-xs print:text-[11px]">
                  <div className="text-slate-500 text-[10px] print:hidden">
                    * พิมพ์จากระบบบันทึกรายงานส่งมอบงาน กฟฟ.
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold">ผู้รับเงิน <span className="text-[10px] text-slate-600 print:text-black font-normal">COLLECTOR</span> :</span>
                    <div className="border-b border-dotted border-black w-64 text-center pb-0.5">
                      <span className="font-bold">{receiptCollector || contractorName || "............................................................"}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Edit Order Modal */}
          <EditOrderModal
            order={editingOrder}
            isOpen={!!editingOrder}
            onClose={() => setEditingOrder(null)}
            onSaved={handleOrderSaved}
          />
        </div>
      )}
    </div>
  );
}
