import { Order } from "../types";

/**
 * Parses date string in format "DD/MM/YYYY" to Date object safely
 */
export function parseDateStr(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split("/");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Adds business/working days (excluding Saturday & Sunday) to a starting Date
 */
export function addWorkingDays(startDate: Date, days: number): Date {
  const result = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
      added++;
    }
  }
  return result;
}

/**
 * Calculates number of working days between two calendar dates (excluding Sat/Sun)
 */
export function getWorkingDaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  if (start.getTime() > end.getTime()) return 0;

  let count = 0;
  const current = new Date(start.getTime());
  while (current.getTime() < end.getTime()) {
    current.setDate(current.getDate() + 1);
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }
  return count;
}

/**
 * Checks if a job is in-area (ในเขต) or out-of-area (นอกเขต) and returns its SLA limit in days
 */
export function getSlaLimitDays(area: string | undefined | null): number {
  if (!area) return 3; // Default
  if (area.includes("นอกเขต")) {
    return 5;
  }
  return 3; // Default 3 days for "ในเขต"
}

export interface SlaAnalysisResult {
  slaLimit: number;
  dueDate: Date | null;
  dueDateStr: string;
  actualWorkingDays: number | null;
  isOverdue: boolean;
  isNearDeadline: boolean; // 1 day before or today
  statusText: string;
  statusColor: string; // "emerald", "amber", "rose"
}

/**
 * Analyzes an Order's SLA compliance and deadline status
 */
export function analyzeOrderSla(order: Order, referenceDate: Date = new Date()): SlaAnalysisResult {
  const creationDate = parseDateStr(order.date);
  const slaLimit = getSlaLimitDays(order.area);

  if (!creationDate) {
    return {
      slaLimit,
      dueDate: null,
      dueDateStr: "-",
      actualWorkingDays: null,
      isOverdue: false,
      isNearDeadline: false,
      statusText: "ข้อมูลไม่สมบูรณ์",
      statusColor: "slate"
    };
  }

  const dueDate = addWorkingDays(creationDate, slaLimit);
  const formattedDueDate = `${dueDate.getDate().toString().padStart(2, "0")}/${(dueDate.getMonth() + 1).toString().padStart(2, "0")}/${dueDate.getFullYear()}`;

  const isComplete = order.status === "Complete" || order.status === "เสร็จสิ้น" || order.status === "Handover" || order.status === "ส่งมอบงาน";
  const isCancel = order.status === "Cancel" || order.status === "ยกเลิก";

  if (isComplete) {
    const completionDate = parseDateStr(order.deliveryDate || order.scheduledDelivery || order.date);
    const isHandoverText = order.status === "Handover" || order.status === "ส่งมอบงาน";
    const baseText = isHandoverText ? "ส่งมอบงาน" : "เสร็จสิ้น";

    if (!completionDate) {
      return {
        slaLimit,
        dueDate,
        dueDateStr: formattedDueDate,
        actualWorkingDays: null,
        isOverdue: false,
        isNearDeadline: false,
        statusText: `${baseText} (ไม่มีวันที่ส่งงาน)`,
        statusColor: isHandoverText ? "indigo" : "emerald"
      };
    }

    const actualWorkingDays = getWorkingDaysBetween(creationDate, completionDate);
    const isOverdue = actualWorkingDays > slaLimit;

    return {
      slaLimit,
      dueDate,
      dueDateStr: formattedDueDate,
      actualWorkingDays,
      isOverdue,
      isNearDeadline: false,
      statusText: isOverdue 
        ? `${baseText} (เกินกำหนด SLA: ใช้ ${actualWorkingDays} วัน)` 
        : `${baseText}ตาม SLA (ใช้ ${actualWorkingDays} วัน)`,
      statusColor: isOverdue ? "rose" : (isHandoverText ? "indigo" : "emerald")
    };
  }

  if (isCancel) {
    return {
      slaLimit,
      dueDate,
      dueDateStr: formattedDueDate,
      actualWorkingDays: null,
      isOverdue: false,
      isNearDeadline: false,
      statusText: "ยกเลิกใบงาน",
      statusColor: "slate"
    };
  }

  // Pending (รอดำเนินการ)
  const daysElapsed = getWorkingDaysBetween(creationDate, referenceDate);
  const isOverdue = referenceDate.getTime() > dueDate.getTime();
  
  // Calculate difference in working days to deadline
  const workingDaysLeft = getWorkingDaysBetween(referenceDate, dueDate);
  const isTodayOrPassed = referenceDate.getTime() >= new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
  
  // Close to deadline: today, passed, or 1 working day left
  const isNearDeadline = isOverdue || isTodayOrPassed || workingDaysLeft <= 1;

  let statusText = "";
  let statusColor = "amber";

  if (isOverdue) {
    statusText = `เกินกำหนดติดตั้ง (เลยกำหนดมา ${getWorkingDaysBetween(dueDate, referenceDate)} วัน)`;
    statusColor = "rose";
  } else if (isTodayOrPassed) {
    statusText = "ครบกำหนดส่งงานวันนี้";
    statusColor = "rose";
  } else if (workingDaysLeft <= 1) {
    statusText = "ใกล้ถึงกำหนด (เหลือ 1 วันทำการ)";
    statusColor = "rose"; // Warning red for immediate follow-up
  } else {
    statusText = `ปกติ (เหลือ ${workingDaysLeft} วันทำการ)`;
    statusColor = "amber";
  }

  return {
    slaLimit,
    dueDate,
    dueDateStr: formattedDueDate,
    actualWorkingDays: daysElapsed,
    isOverdue,
    isNearDeadline,
    statusText,
    statusColor
  };
}
