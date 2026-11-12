import { Order } from "../types";

export interface OrderValidationResult {
  hasMismatch: boolean;
  sizeMismatch: boolean;
  workTypeMismatch: boolean;
  sizePhase: "1P" | "3P" | "empty" | "unknown";
  workTypePhase: "1P" | "3P" | "empty" | "unknown";
  resolvedWorkType: string;
  reason: string;
  severity: "error" | "warning" | "ok";
}

/**
 * Detect electrical phase (1P vs 3P) from meterSize and fallback phase field.
 */
export function detectPhaseFromSize(
  meterSize?: string,
  phaseField?: string
): "1P" | "3P" | "empty" | "unknown" {
  const size = (meterSize || "").trim();
  const phase = (phaseField || "").trim();

  if (!size || size === "-" || size === "ไม่ระบุ" || size === "ไม่ระบุขนาด") {
    // If meterSize is empty but phase is specified
    if (phase === "3" || phase.toLowerCase() === "3p" || phase.includes("3")) return "3P";
    if (phase === "1" || phase.toLowerCase() === "1p" || phase.includes("1")) return "1P";
    return "empty";
  }

  const sLower = size.toLowerCase();

  // Explicit 3-phase checks in size
  if (
    sLower.includes("3p") ||
    sLower.includes("3 เฟส") ||
    sLower.includes("3เฟส") ||
    sLower.includes("3 phase") ||
    sLower.includes("3p4w") ||
    sLower.includes("3p 4w")
  ) {
    return "3P";
  }

  // Explicit 1-phase checks in size
  if (
    sLower.includes("1p") ||
    sLower.includes("1 เฟส") ||
    sLower.includes("1เฟส") ||
    sLower.includes("1 phase") ||
    sLower.includes("1p2w") ||
    sLower.includes("1p 2w")
  ) {
    return "1P";
  }

  // Secondary check on phase field
  if (phase === "3" || phase.toLowerCase() === "3p") return "3P";
  if (phase === "1" || phase.toLowerCase() === "1p") return "1P";

  // Common amp rating conventions
  if (sLower.includes("5(15)") || sLower.includes("5(100)")) {
    return "1P";
  }

  return "unknown";
}

/**
 * Detect electrical phase (1P vs 3P) from work description and wage tariff.
 */
export function detectPhaseFromWorkType(
  workTypeIn?: string,
  workTypeOut?: string,
  wage?: number
): "1P" | "3P" | "empty" | "unknown" {
  const parts = [workTypeIn?.trim(), workTypeOut?.trim()].filter(Boolean);
  const text = parts.join(" / ").toLowerCase();

  if (!text || text === "-") {
    // Cross check with distinct standard tariffs if text is empty
    if (wage) {
      if ([310, 374, 263, 124, 133, 373, 468, 208, 117, 127, 170].includes(wage)) return "3P";
      if ([188, 187, 157, 156, 67, 75, 74, 104, 111, 209, 235, 120, 130].includes(wage)) return "1P";
    }
    return "empty";
  }

  // Explicit 3-Phase keywords
  if (
    text.includes("3p") ||
    text.includes("3p4w") ||
    text.includes("3 เฟส") ||
    text.includes("3เฟส") ||
    text.includes("3 phase") ||
    text.includes("พร้อมตู้") ||
    text.includes("ติดตั้งตู้") ||
    text.includes("หมวด 1") ||
    text.includes("หมวด 2") ||
    text.includes("หมวด 3")
  ) {
    return "3P";
  }

  // Explicit 1-Phase keywords
  if (
    text.includes("1p") ||
    text.includes("1p2w") ||
    text.includes("1 เฟส") ||
    text.includes("1เฟส") ||
    text.includes("1 phase") ||
    text.includes("ไม้แป้น") ||
    text.includes("ไม่ติดตั้งไม้แป้น") ||
    text.includes("ตัดฝาก") ||
    text.includes("ถอนคืน") ||
    text.includes("หมวด 4") ||
    text.includes("หมวด 5") ||
    text.includes("หมวด 6") ||
    text.includes("หมวด 7")
  ) {
    return "1P";
  }

  // Fallback to tariff rates if text doesn't explicitly mention 1P or 3P
  if (wage) {
    if ([310, 374, 263, 124, 133, 373, 468, 208, 117, 127, 170].includes(wage)) return "3P";
    if ([188, 187, 157, 156, 67, 75, 74, 104, 111, 209, 235, 120, 130].includes(wage)) return "1P";
  }

  return "unknown";
}

/**
 * Validate consistency between Order's Meter Size ("ขนาด") and Work Type ("ประเภทงาน").
 */
export function validateOrderSizeAndWorkType(order: Order): OrderValidationResult {
  const sizePhase = detectPhaseFromSize(order.meterSize, order.phase);

  const hasWorkIn = !!(order.workTypeIn && order.workTypeIn.trim().length > 0);
  const hasWorkOut = !!(order.workTypeOut && order.workTypeOut.trim().length > 0);
  let resolvedWorkType = "-";
  let wage = (order.costIn || 0) + (order.costOut || 0);

  if (hasWorkIn && hasWorkOut) {
    resolvedWorkType = `${order.workTypeIn} / ${order.workTypeOut}`;
  } else if (hasWorkIn) {
    resolvedWorkType = order.workTypeIn;
  } else if (hasWorkOut) {
    resolvedWorkType = order.workTypeOut;
  }

  if (wage === 0 && order.totalCost) {
    wage = order.totalCost;
  }

  const workTypePhase = detectPhaseFromWorkType(order.workTypeIn, order.workTypeOut, wage);

  // Check 1: Size 1P vs Work Type 3P
  if (sizePhase === "1P" && workTypePhase === "3P") {
    return {
      hasMismatch: true,
      sizeMismatch: true,
      workTypeMismatch: true,
      sizePhase,
      workTypePhase,
      resolvedWorkType,
      reason: `ขนาดมิเตอร์ระบุ 1 เฟส (${order.meterSize || "1P"}) แต่ประเภทงานระบุเป็น 3 เฟส (${resolvedWorkType})`,
      severity: "error",
    };
  }

  // Check 2: Size 3P vs Work Type 1P
  if (sizePhase === "3P" && workTypePhase === "1P") {
    return {
      hasMismatch: true,
      sizeMismatch: true,
      workTypeMismatch: true,
      sizePhase,
      workTypePhase,
      resolvedWorkType,
      reason: `ขนาดมิเตอร์ระบุ 3 เฟส (${order.meterSize || "3P"}) แต่ประเภทงานระบุเป็น 1 เฟส (${resolvedWorkType})`,
      severity: "error",
    };
  }

  // Check 3: Empty meterSize when workType is defined
  if (sizePhase === "empty" && workTypePhase !== "empty") {
    return {
      hasMismatch: true,
      sizeMismatch: true,
      workTypeMismatch: false,
      sizePhase,
      workTypePhase,
      resolvedWorkType,
      reason: `ไม่ระบุขนาดมิเตอร์ แต่ระบุประเภทงาน (${resolvedWorkType})`,
      severity: "warning",
    };
  }

  // Check 4: Empty workType when meterSize is defined
  if (workTypePhase === "empty" && sizePhase !== "empty") {
    return {
      hasMismatch: true,
      sizeMismatch: false,
      workTypeMismatch: true,
      sizePhase,
      workTypePhase,
      resolvedWorkType,
      reason: `ระบุขนาดมิเตอร์ (${order.meterSize}) แต่ไม่มีรายละเอียดประเภทงาน`,
      severity: "warning",
    };
  }

  // Check 5: Explicit phase mismatch (e.g. order.phase is "3" but meter size has "1P")
  const phaseClean = (order.phase || "").trim();
  if (phaseClean === "3" && sizePhase === "1P") {
    return {
      hasMismatch: true,
      sizeMismatch: true,
      workTypeMismatch: false,
      sizePhase,
      workTypePhase,
      resolvedWorkType,
      reason: `เฟสในระบบระบุ Phase 3 แต่ขนาดมิเตอร์ระบุเป็น 1 เฟส (${order.meterSize})`,
      severity: "error",
    };
  }
  if (phaseClean === "1" && sizePhase === "3P") {
    return {
      hasMismatch: true,
      sizeMismatch: true,
      workTypeMismatch: false,
      sizePhase,
      workTypePhase,
      resolvedWorkType,
      reason: `เฟสในระบบระบุ Phase 1 แต่ขนาดมิเตอร์ระบุเป็น 3 เฟส (${order.meterSize})`,
      severity: "error",
    };
  }

  return {
    hasMismatch: false,
    sizeMismatch: false,
    workTypeMismatch: false,
    sizePhase,
    workTypePhase,
    resolvedWorkType,
    reason: "ข้อมูลขนาดและประเภทงานสอดคล้องกัน",
    severity: "ok",
  };
}

/**
 * Standard PEA Preset options for easy correction in Edit Modal
 */
export const PEA_METER_SIZE_OPTIONS = [
  "5(15)A 1P 2W",
  "15(45)A 1P 2W",
  "30(100)A 1P 2W",
  "50(150)A 1P 2W",
  "E-meter 5(100)A 1P 2W",
  "TOU 5(100)A 1P 2W",
  "15(45)A 3P 4W",
  "30(100)A 3P 4W",
  "50(150)A 3P 4W",
  "E-meter 5(100)A 3P 4W",
  "TOU 5(100)A 3P 4W",
];

export const PEA_WORK_TYPE_PRESETS = [
  {
    category: "ติดตั้งมิเตอร์ใหม่ 1 เฟส 2 สาย",
    description: "ติดตั้งพร้อมเดินสายเข้ามิเตอร์และติดตั้งไม้แป้น(1P2W)",
    phase: "1",
    priceIn: 188,
    priceOut: 209,
  },
  {
    category: "ติดตั้งมิเตอร์ใหม่ 1 เฟส 2 สาย",
    description: "ติดตั้งพร้อมเดินสายเข้ามิเตอร์ แต่ไม่ติดตั้งไม้แป้น(1P2W)",
    phase: "1",
    priceIn: 157,
    priceOut: 171,
  },
  {
    category: "ติดตั้งมิเตอร์ใหม่ 1 เฟส 2 สาย",
    description: "ติดตั้งใหม่เฉพาะมิเตอร์ และเชื่อมสายเมน(1P2W)",
    phase: "1",
    priceIn: 67,
    priceOut: 75,
  },
  {
    category: "สับเปลี่ยนมิเตอร์ 1 เฟส 2 สาย",
    description: "สับเปลี่ยนมิเตอร์ กรณีต้องเปลี่ยนสายเข้ามิเตอร์(1P2W)",
    phase: "1",
    priceIn: 209,
    priceOut: 235,
  },
  {
    category: "สับเปลี่ยนมิเตอร์ 1 เฟส 2 สาย",
    description: "สับเปลี่ยนมิเตอร์ กรณีไม่ต้องเปลี่ยนสายเข้ามิเตอร์(1P2W)",
    phase: "1",
    priceIn: 104,
    priceOut: 111,
  },
  {
    category: "ตัดฝาก / ถอนคืนมิเตอร์ 1 เฟส 2 สาย",
    description: "ตัดฝากมิเตอร์ /ถอนคืนมิเตอร์(1P2W)",
    phase: "1",
    priceIn: 67,
    priceOut: 75,
  },
  {
    category: "รื้อถอนมิเตอร์ 1 เฟส 2 สาย",
    description: "รื้อถอนมิเตอร์พร้อมอุปกรณ์ประกอบ(1P2W)",
    phase: "1",
    priceIn: 125,
    priceOut: 139,
  },
  {
    category: "ติดตั้งมิเตอร์ใหม่ 3 เฟส 4 สาย",
    description: "ติดตั้งใหม่พร้อมอุปกรณ์ประกอบและติดตั้งตู้(3P4W)",
    phase: "3",
    priceIn: 310,
    priceOut: 374,
  },
  {
    category: "ติดตั้งมิเตอร์ใหม่ 3 เฟส 4 สาย",
    description: "ติดตั้งใหม่พร้อมอุปกรณ์ประกอบไม่ติดตั้งตู้(3P4W)",
    phase: "3",
    priceIn: 263,
    priceOut: 310,
  },
  {
    category: "ติดตั้งมิเตอร์ใหม่ 3 เฟส 4 สาย",
    description: "ติดตั้งใหม่เฉพาะมิเตอร์และเชื่อมสายเมน(3P4W)",
    phase: "3",
    priceIn: 124,
    priceOut: 133,
  },
  {
    category: "สับเปลี่ยนมิเตอร์ 3 เฟส 4 สาย",
    description: "สับเปลี่ยนมิเตอร์ กรณีต้องเปลี่ยนสายเข้ามิเตอร์(3P4W)",
    phase: "3",
    priceIn: 373,
    priceOut: 468,
  },
  {
    category: "สับเปลี่ยนมิเตอร์ 3 เฟส 4 สาย",
    description: "สับเปลี่ยนมิเตอร์ กรณีไม่ต้องเปลี่ยนสายเข้ามิเตอร์(3P4W)",
    phase: "3",
    priceIn: 187,
    priceOut: 208,
  },
  {
    category: "รื้อถอนมิเตอร์ 3 เฟส 4 สาย",
    description: "รื้อถอนมิเตอร์เฉพาะมิเตอร์(3P4W)",
    phase: "3",
    priceIn: 117,
    priceOut: 127,
  },
  {
    category: "รื้อถอนมิเตอร์ 3 เฟส 4 สาย",
    description: "รื้อถอนมิเตอร์พร้อมอุปกรณ์ประกอบ(3P4W)",
    phase: "3",
    priceIn: 170,
    priceOut: 187,
  },
];
