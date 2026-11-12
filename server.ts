import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { Order, DashboardStats } from "./src/types.js";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini API Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Cache for storing parsed orders
let cachedOrders: Order[] = [];
let isFetching = false;
let fetchError: string | null = null;

// Helper to parse dates from format "DD/MM/YYYY" to Date object
function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
}

// Add business/working days (excluding Saturday & Sunday)
function addWorkingDays(startDate: Date, days: number): Date {
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

// Calculate number of working days between two calendar dates (excluding Sat/Sun)
function getWorkingDaysBetween(startDate: Date, endDate: Date): number {
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

// Custom CSV Parser with proper quoted-string handling
function parseCSV(text: string): Order[] {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  const orders: Order[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const row: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    row.push(current.trim());

    // Minimal column count verification
    if (row.length < 15) continue;

    const costIn = parseFloat(row[5]) || 0;
    const costOut = parseFloat(row[7]) || 0;
    const totalCost = costIn + costOut;

    const order: Order = {
      id: row[0] || `row-${i}`,
      date: row[1] || "",
      area: row[2] || "ไม่ระบุ",
      daysLimit: row[3] || "",
      workTypeIn: row[4] || "",
      costIn,
      workTypeOut: row[6] || "",
      costOut,
      totalCost,
      deviceIndex: row[8] || "",
      requestId: row[9] || "",
      customerName: row[10] || "ไม่ระบุนาม",
      location: row[11] || "ไม่ระบุที่อยู่",
      wireNum: row[12] || "",
      meterSize: row[13] || "ไม่ระบุขนาด",
      peaMeter: row[14] || "",
      meterUnit: row[15] || "",
      gps: row[16] || "",
      phase: row[17] || "N/A",
      photoMeterFace: row[18] || "",
      photoConnectedPhase: row[19] || "",
      photoElectricalPole: row[20] || "",
      photoOldMeter: row[24] || "",
      photoCompletedWork: row[25] || "",
      photoNewInstallation: row[26] || "",
      photoHouseWiring: row[28] || "",
      phone: row[30] || "",
      supervisor: row[31] || "ไม่ระบุ",
      technician: row[32] || "ไม่ระบุ",
      status: row[33] || "Complete",
      scheduledDelivery: row[34] || "",
      deliveryDate: row[35] || "",
    };

    orders.push(order);
  }

  return orders;
}

// Fetch and Cache Spreadsheet Data
async function loadSpreadsheetData() {
  if (isFetching) return;
  isFetching = true;
  fetchError = null;

  try {
    console.log("Fetching order data from Google Sheets...");
    const url = "https://docs.google.com/spreadsheets/d/1g6URDMzYVzuziAxEoIyWqyZ9lJxpq_A0aJ1HR3rSpYc/export?format=csv&gid=771430600";
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const csvText = await res.text();
    const parsed = parseCSV(csvText);
    
    if (parsed.length > 0) {
      cachedOrders = parsed;
      console.log(`Successfully parsed and cached ${cachedOrders.length} orders.`);
    } else {
      throw new Error("Parsed zero records from Google Sheets CSV.");
    }
  } catch (error: any) {
    console.error("Failed to fetch Google Sheets CSV:", error);
    fetchError = error.message || "Unknown error";
    
    // Safety Net: If cache is empty and remote fetch fails, generate a rich mock dataset
    if (cachedOrders.length === 0) {
      console.log("Generating resilient mock data...");
      const mockOrders: Order[] = [];
      const areas = ["ติดตั้งนอกเขตเทศบาล", "ติดตั้งในเขตเทศบาล", "เลิกใช้นอกเขตเทศบาล", "เลิกใช้ในเขตเทศบาล"];
      const meterSizes = ["E-meter 5(100)A 1P 2W", "15(45)A 1P 2W", "5(15)A 1P 2W", "E-meter 5(100)A 3P 4W", "30(100)A 1P 2W"];
      const supervisors = ["นายศราวุธ คำงาม", "นายสมชาย ใจดี", "นางสาววิภา พรหมมา"];
      const technicians = ["นายประจักร ฤทธิ์คำ", "นายสุรพล ยอดแก้ว", "นายกิตติศักดิ์ พูลเพิ่ม"];
      
      const years = [2024, 2025, 2026];
      let mockId = 1000;
      
      for (const year of years) {
        for (let month = 1; month <= 12; month++) {
          const numOrders = Math.floor(Math.random() * 50) + 30; // 30-80 orders per month
          for (let o = 0; o < numOrders; o++) {
            const day = Math.floor(Math.random() * 28) + 1;
            const dateStr = `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
            const area = areas[Math.floor(Math.random() * areas.length)];
            const size = meterSizes[Math.floor(Math.random() * meterSizes.length)];
            const costIn = area.includes("ในเขต") ? 150 : 0;
            const costOut = area.includes("นอกเขต") ? 200 : 0;
            const rand = Math.random();
            const status = rand < 0.05 ? "Cancel" : (rand < 0.15 ? "Pending" : "Complete");
            
            mockOrders.push({
              id: `mock-${mockId++}`,
              date: dateStr,
              area,
              daysLimit: "ภายใน 3 วัน",
              workTypeIn: costIn > 0 ? "ติดตั้งใหม่พร้อมเดินสายเข้ามิเตอร์" : "",
              costIn,
              workTypeOut: costOut > 0 ? "ติดตั้งใหม่พร้อมเดินสายเข้ามิเตอร์" : "",
              costOut,
              totalCost: costIn + costOut,
              deviceIndex: "1",
              requestId: `DBPI${year.toString().slice(-2)}000${mockId}`,
              customerName: `ผู้ใช้ไฟฟ้า #${mockId}`,
              location: `ขอนแก่น 40110`,
              wireNum: `9095-${mockId}`,
              meterSize: size,
              peaMeter: `660044${mockId}`,
              meterUnit: "0",
              gps: `16.0${Math.floor(Math.random() * 900)}, 102.7${Math.floor(Math.random() * 900)}`,
              phase: Math.random() > 0.5 ? "A" : "B",
              photoMeterFace: "",
              photoConnectedPhase: "",
              photoElectricalPole: "",
              photoOldMeter: "",
              photoCompletedWork: "",
              photoNewInstallation: "",
              photoHouseWiring: "",
              phone: "0800000000",
              supervisor: supervisors[Math.floor(Math.random() * supervisors.length)],
              technician: technicians[Math.floor(Math.random() * technicians.length)],
              status,
              scheduledDelivery: dateStr,
              deliveryDate: dateStr,
            });
          }
        }
      }
      cachedOrders = mockOrders;
    }

    applyStatusOverrides();
    applyOrderOverrides();
  } finally {
    isFetching = false;
  }
}

const OVERRIDES_FILE = path.join(process.cwd(), "status_overrides.json");
const ORDER_OVERRIDES_FILE = path.join(process.cwd(), "order_overrides.json");

function getStatusOverrides(): Record<string, string> {
  try {
    if (fs.existsSync(OVERRIDES_FILE)) {
      const data = fs.readFileSync(OVERRIDES_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading status_overrides.json:", err);
  }
  return {};
}

function saveStatusOverride(orderId: string, status: string) {
  try {
    const overrides = getStatusOverrides();
    overrides[orderId] = status;
    fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(overrides, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving status override:", err);
  }
}

function applyStatusOverrides() {
  const overrides = getStatusOverrides();
  cachedOrders = cachedOrders.map((order) => {
    if (overrides[order.id]) {
      return { ...order, status: overrides[order.id] };
    }
    return order;
  });
}

function getOrderOverrides(): Record<string, Partial<Order>> {
  try {
    if (fs.existsSync(ORDER_OVERRIDES_FILE)) {
      const data = fs.readFileSync(ORDER_OVERRIDES_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading order_overrides.json:", err);
  }
  return {};
}

function saveOrderOverride(orderId: string, updates: Partial<Order>) {
  try {
    const overrides = getOrderOverrides();
    overrides[orderId] = { ...(overrides[orderId] || {}), ...updates };
    fs.writeFileSync(ORDER_OVERRIDES_FILE, JSON.stringify(overrides, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving order override:", err);
  }
}

function applyOrderOverrides() {
  const overrides = getOrderOverrides();
  cachedOrders = cachedOrders.map((order) => {
    if (overrides[order.id]) {
      const updated = { ...order, ...overrides[order.id] };
      if (overrides[order.id].costIn !== undefined || overrides[order.id].costOut !== undefined) {
        const sum = (Number(updated.costIn) || 0) + (Number(updated.costOut) || 0);
        updated.totalCost = sum > 0 ? sum : (order.totalCost || 0);
      }
      return updated;
    }
    return order;
  });
}

// Trigger initial load asynchronously so server boots instantly
loadSpreadsheetData();

app.use(express.json());

// API: Update full order details (meterSize, workType, phase, costs, status, etc.)
app.put("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!updates || typeof updates !== "object") {
    return res.status(400).json({ error: "Invalid updates payload" });
  }

  let index = cachedOrders.findIndex((o) => o.id === id);
  if (index === -1) {
    index = cachedOrders.findIndex((o) => o.requestId === id);
  }

  if (index === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const currentOrder = cachedOrders[index];
  const updatedOrder = {
    ...currentOrder,
    ...updates,
  };

  if (updates.costIn !== undefined || updates.costOut !== undefined) {
    const sum = (Number(updatedOrder.costIn) || 0) + (Number(updatedOrder.costOut) || 0);
    updatedOrder.totalCost = sum > 0 ? sum : (currentOrder.totalCost || 0);
  }

  cachedOrders[index] = updatedOrder;
  saveOrderOverride(currentOrder.id, updates);

  return res.json({ success: true, order: updatedOrder });
});

// API: Update order status
app.put("/api/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  // Save override
  saveStatusOverride(id, status);

  // Update memory
  const index = cachedOrders.findIndex((o) => o.id === id);
  if (index !== -1) {
    cachedOrders[index].status = status;
    return res.json({ success: true, order: cachedOrders[index] });
  } else {
    const idxReq = cachedOrders.findIndex((o) => o.requestId === id);
    if (idxReq !== -1) {
      cachedOrders[idxReq].status = status;
      return res.json({ success: true, order: cachedOrders[idxReq] });
    }
    return res.status(404).json({ error: "Order not found" });
  }
});

// API: Get Google Drive file mapping
app.get("/api/drive-mapping", (req, res) => {
  try {
    const mappingPath = path.join(process.cwd(), "drive_mapping.json");
    if (fs.existsSync(mappingPath)) {
      const data = fs.readFileSync(mappingPath, "utf8");
      res.json(JSON.parse(data));
    } else {
      res.json({});
    }
  } catch (error) {
    console.error("Failed to read drive_mapping.json:", error);
    res.status(500).json({ error: "Failed to read drive mapping" });
  }
});

// API: Refresh dataset manually
app.post("/api/refresh", async (req, res) => {
  await loadSpreadsheetData();
  res.json({
    success: !fetchError,
    count: cachedOrders.length,
    error: fetchError,
  });
});

// API: Get non-paginated GPS orders for map visualization
app.get("/api/map-orders", (req, res) => {
  const search = (req.query.search as string || "").toLowerCase();
  const year = req.query.year as string || "All";
  const areaFilter = req.query.area as string || "All";
  const sizeFilter = req.query.meterSize as string || "All";
  const statusFilter = req.query.status as string || "All";
  const monthFilter = req.query.month as string || "All";

  let filtered = cachedOrders.filter(o => o.gps && o.gps.trim().length > 0);

  // Apply Year filter
  if (year !== "All") {
    filtered = filtered.filter((o) => {
      const parts = o.date.split("/");
      return parts.length === 3 && parts[2] === year;
    });
  }

  // Apply Month filter
  if (monthFilter !== "All") {
    filtered = filtered.filter((o) => {
      const parts = o.date.split("/");
      return parts.length === 3 && parts[1] === monthFilter.padStart(2, "0");
    });
  }

  // Apply Area filter
  if (areaFilter !== "All") {
    filtered = filtered.filter((o) => o.area === areaFilter);
  }

  // Apply Meter Size filter
  if (sizeFilter !== "All") {
    filtered = filtered.filter((o) => o.meterSize === sizeFilter);
  }

  // Apply Status filter
  if (statusFilter !== "All") {
    filtered = filtered.filter((o) => {
      if (statusFilter === "Complete") {
        return o.status === "Complete" || o.status === "เสร็จสิ้น";
      }
      if (statusFilter === "Handover") {
        return o.status === "Handover" || o.status === "ส่งมอบงาน";
      }
      if (statusFilter === "Cancel") {
        return o.status === "Cancel" || o.status === "ยกเลิก";
      }
      if (statusFilter === "Pending") {
        return o.status === "Pending" || o.status === "รอดำเนินการ";
      }
      return o.status === statusFilter;
    });
  }

  // Apply Search filter
  if (search) {
    filtered = filtered.filter(
      (o) =>
        o.customerName.toLowerCase().includes(search) ||
        o.requestId.toLowerCase().includes(search) ||
        o.technician.toLowerCase().includes(search) ||
        o.peaMeter.toLowerCase().includes(search) ||
        o.id.toLowerCase().includes(search)
    );
  }

  res.json({
    orders: filtered
  });
});

// API: Paginated and Filterable Orders
app.get("/api/orders", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = (req.query.search as string || "").toLowerCase();
  const year = req.query.year as string || "All";
  const areaFilter = req.query.area as string || "All";
  const sizeFilter = req.query.meterSize as string || "All";
  const statusFilter = req.query.status as string || "All";
  const monthFilter = req.query.month as string || "All";

  let filtered = [...cachedOrders];

  // Apply Year filter
  if (year !== "All") {
    filtered = filtered.filter((o) => {
      const parts = o.date.split("/");
      return parts.length === 3 && parts[2] === year;
    });
  }

  // Apply Month filter
  if (monthFilter !== "All") {
    filtered = filtered.filter((o) => {
      const parts = o.date.split("/");
      return parts.length === 3 && parts[1] === monthFilter.padStart(2, "0");
    });
  }

  // Apply Area filter
  if (areaFilter !== "All") {
    filtered = filtered.filter((o) => o.area === areaFilter);
  }

  // Apply Meter Size filter
  if (sizeFilter !== "All") {
    filtered = filtered.filter((o) => o.meterSize === sizeFilter);
  }

  // Apply Status filter
  if (statusFilter !== "All") {
    filtered = filtered.filter((o) => {
      if (statusFilter === "Complete") {
        return o.status === "Complete" || o.status === "เสร็จสิ้น";
      }
      if (statusFilter === "Handover") {
        return o.status === "Handover" || o.status === "ส่งมอบงาน";
      }
      if (statusFilter === "Cancel") {
        return o.status === "Cancel" || o.status === "ยกเลิก";
      }
      if (statusFilter === "Pending") {
        return o.status === "Pending" || o.status === "รอดำเนินการ";
      }
      return o.status === statusFilter;
    });
  }

  // Apply Search filter (customer name, requestId, technician, peaMeter, id)
  if (search) {
    filtered = filtered.filter(
      (o) =>
        o.customerName.toLowerCase().includes(search) ||
        o.requestId.toLowerCase().includes(search) ||
        o.technician.toLowerCase().includes(search) ||
        o.peaMeter.toLowerCase().includes(search) ||
        o.id.toLowerCase().includes(search)
    );
  }

  // Sort orders descending by date
  filtered.sort((a, b) => {
    const dateA = parseDate(a.date).getTime();
    const dateB = parseDate(b.date).getTime();
    return dateB - dateA;
  });

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  res.json({
    orders: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// API: Aggregated Metrics & Statistics
app.get("/api/stats", (req, res) => {
  const year = req.query.year as string || "All";
  const month = req.query.month as string || "All";

  let filtered = [...cachedOrders];
  if (year !== "All") {
    filtered = filtered.filter((o) => {
      const parts = o.date.split("/");
      return parts.length === 3 && parts[2] === year;
    });
  }

  // Calculate monthly trend using the year-filtered list so that it always shows the whole year's trend
  const monthlyMap: Record<string, { revenue: number; orderCount: number }> = {};
  filtered.forEach((o) => {
    const revenue = o.totalCost;
    const dateParts = o.date.split("/");
    if (dateParts.length === 3) {
      const m = dateParts[1];
      const y = dateParts[2];
      const key = `${m}/${y}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { revenue: 0, orderCount: 0 };
      }
      monthlyMap[key].revenue += revenue;
      monthlyMap[key].orderCount += 1;
    }
  });

  // Apply Month filter
  if (month !== "All") {
    filtered = filtered.filter((o) => {
      const parts = o.date.split("/");
      return parts.length === 3 && parts[1] === month.padStart(2, "0");
    });
  }

  const totalOrders = filtered.length;
  let totalRevenue = 0;
  let completedCount = 0;

  const meterMap: Record<string, { count: number; revenue: number }> = {};
  const areaMap: Record<string, { count: number; revenue: number }> = {};
  const techMap: Record<string, { count: number; revenue: number }> = {};
  const statusMap: Record<string, number> = {};

  filtered.forEach((o) => {
    const revenue = o.totalCost;
    totalRevenue += revenue;

    const statKey = o.status || "ไม่ระบุสถานะ";
    statusMap[statKey] = (statusMap[statKey] || 0) + 1;

    if (o.status === "Complete" || o.status === "เสร็จสิ้น" || o.status === "Handover" || o.status === "ส่งมอบงาน") {
      completedCount++;
    }

    // Meter sizes aggregation
    const size = o.meterSize || "ไม่ระบุขนาด";
    if (!meterMap[size]) {
      meterMap[size] = { count: 0, revenue: 0 };
    }
    meterMap[size].count += 1;
    meterMap[size].revenue += revenue;

    // Operating area aggregation
    const area = o.area || "ไม่ระบุพื้นที่";
    if (!areaMap[area]) {
      areaMap[area] = { count: 0, revenue: 0 };
    }
    areaMap[area].count += 1;
    areaMap[area].revenue += revenue;

    // Technician aggregation
    const tech = o.technician || "ไม่ระบุช่าง";
    if (!techMap[tech]) {
      techMap[tech] = { count: 0, revenue: 0 };
    }
    techMap[tech].count += 1;
    techMap[tech].revenue += revenue;
  });

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const completionRate = totalOrders > 0 ? (completedCount / totalOrders) * 100 : 0;

  // Format and sort monthly trend (chronologically)
  const byMonth = Object.entries(monthlyMap)
    .map(([month, stats]) => ({
      month,
      revenue: stats.revenue,
      orderCount: stats.orderCount,
    }))
    .sort((a, b) => {
      const [mA, yA] = a.month.split("/").map(Number);
      const [mB, yB] = b.month.split("/").map(Number);
      return yA !== yB ? yA - yB : mA - mB;
    });

  // Format and sort meter sizes
  const byMeterSize = Object.entries(meterMap)
    .map(([name, stats]) => ({
      name,
      value: stats.count,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.value - a.value);

  // Format and sort areas
  const byArea = Object.entries(areaMap)
    .map(([name, stats]) => ({
      name,
      value: stats.count,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.value - a.value);

  // Format and sort technicians
  const byTechnician = Object.entries(techMap)
    .map(([name, stats]) => ({
      name,
      value: stats.count,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.value - a.value);

  // Available filters info
  const uniqueAreas = Array.from(new Set(cachedOrders.map((o) => o.area))).filter(Boolean);
  const uniqueMeterSizes = Array.from(new Set(cachedOrders.map((o) => o.meterSize))).filter(Boolean);
  const uniqueYears = Array.from(
    new Set(
      cachedOrders.map((o) => {
        const parts = o.date.split("/");
        return parts.length === 3 ? parts[2] : null;
      })
    )
  )
    .filter(Boolean)
    .sort();

  // SLA Calculation (In-area 3 days, Out-of-area 5 days)
  let inAreaCompletedTotal = 0;
  let inAreaCompletedOnTime = 0;
  let outAreaCompletedTotal = 0;
  let outAreaCompletedOnTime = 0;
  let pendingTotal = 0;
  let pendingCriticalTotal = 0;
  const criticalPendingList: any[] = [];

  const refDate = new Date(); // Current date (2026-07-16)

  filtered.forEach((o) => {
    const isOut = o.area && o.area.includes("นอกเขต");
    const limit = isOut ? 5 : 3;
    const isComplete = o.status === "Complete" || o.status === "เสร็จสิ้น" || o.status === "Handover" || o.status === "ส่งมอบงาน";
    const isPending = o.status === "Pending" || o.status === "รอดำเนินการ";

    if (isComplete) {
      const start = parseDate(o.date);
      const end = parseDate(o.deliveryDate || o.scheduledDelivery || o.date);
      if (start.getTime() > 0 && end.getTime() > 0) {
        const days = getWorkingDaysBetween(start, end);
        if (isOut) {
          outAreaCompletedTotal++;
          if (days <= limit) outAreaCompletedOnTime++;
        } else {
          inAreaCompletedTotal++;
          if (days <= limit) inAreaCompletedOnTime++;
        }
      }
    } else if (isPending) {
      pendingTotal++;
      const start = parseDate(o.date);
      if (start.getTime() > 0) {
        const dueDate = addWorkingDays(start, limit);
        const isOverdue = refDate.getTime() > dueDate.getTime();
        const workingDaysLeft = getWorkingDaysBetween(refDate, dueDate);
        
        // Is critical if overdue, today, or 1 working day left
        const isTodayOrPassed = refDate.getTime() >= new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
        const isCritical = isOverdue || isTodayOrPassed || workingDaysLeft <= 1;

        if (isCritical) {
          pendingCriticalTotal++;
          criticalPendingList.push({
            id: o.id,
            requestId: o.requestId,
            customerName: o.customerName,
            area: o.area,
            date: o.date,
            dueDate: `${dueDate.getDate().toString().padStart(2, "0")}/${(dueDate.getMonth() + 1).toString().padStart(2, "0")}/${dueDate.getFullYear()}`,
            daysLimit: limit,
            workingDaysLeft: isOverdue ? -getWorkingDaysBetween(dueDate, refDate) : workingDaysLeft,
            isOverdue
          });
        }
      }
    }
  });

  // Sort critical pending list: oldest/most overdue first
  criticalPendingList.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return a.workingDaysLeft - b.workingDaysLeft;
  });

  res.json({
    totalRevenue,
    totalOrders,
    averageOrderValue,
    completionRate,
    byMonth,
    byMeterSize,
    byArea,
    byTechnician,
    byStatus: Object.entries(statusMap).map(([name, count]) => ({ name, count })),
    uniqueAreas,
    uniqueMeterSizes,
    uniqueYears,
    isMock: cachedOrders.length > 0 && cachedOrders[0].id.startsWith("mock"),
    error: fetchError,
    slaStats: {
      inAreaCompletedTotal,
      inAreaCompletedOnTime,
      inAreaRate: inAreaCompletedTotal > 0 ? (inAreaCompletedOnTime / inAreaCompletedTotal) * 100 : 100,
      outAreaCompletedTotal,
      outAreaCompletedOnTime,
      outAreaRate: outAreaCompletedTotal > 0 ? (outAreaCompletedOnTime / outAreaCompletedTotal) * 100 : 100,
      pendingTotal,
      pendingCriticalTotal,
      criticalPendingList: criticalPendingList.slice(0, 15), // Top 15 critical alerts
    }
  });
});

// API: Monthly Labor Fees Summary per Operator/Technician
app.get("/api/labor-summary", (req, res) => {
  let year = req.query.year as string || "All";
  const techQuery = req.query.technicians || req.query.technician || "All";
  const month = req.query.month as string || "All";
  const status = req.query.status as string || "All";

  // Parse multi-technician query parameter
  let techList: string[] = [];
  if (Array.isArray(techQuery)) {
    techList = techQuery.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof techQuery === "string") {
    techList = techQuery.split(",").map((t) => t.trim()).filter(Boolean);
  }
  const isAllTechs = techList.length === 0 || techList.includes("All") || techList.includes("ทั้งหมด");

  // Default to the latest year if "All" is selected to avoid long list and show exactly 12 months
  if (year === "All" && cachedOrders.length > 0) {
    const years = cachedOrders
      .map((o) => {
        const parts = o.date.split("/");
        return parts.length === 3 ? parts[2] : null;
      })
      .filter((y): y is string => !!y);
    const uniqueYears = [...new Set(years)].sort().reverse();
    year = uniqueYears[0] || "2024";
  } else if (year === "All") {
    year = "2024";
  }

  let filtered = [...cachedOrders];

  // Filter by year
  filtered = filtered.filter((o) => {
    const parts = o.date.split("/");
    return parts.length === 3 && parts[2] === year;
  });

  // Filter by month
  if (month !== "All") {
    filtered = filtered.filter((o) => {
      const parts = o.date.split("/");
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10);
        const targetM = parseInt(month, 10);
        return m === targetM;
      }
      return false;
    });
  }

  // Filter by technician (supports multiple technicians)
  if (!isAllTechs) {
    filtered = filtered.filter((o) => techList.includes(o.technician));
  }

  // Filter by status
  if (status !== "All") {
    filtered = filtered.filter((o) => {
      if (status === "Complete") {
        return o.status === "Complete" || o.status === "เสร็จสิ้น";
      }
      if (status === "Handover") {
        return o.status === "Handover" || o.status === "ส่งมอบงาน";
      }
      if (status === "Cancel") {
        return o.status === "Cancel" || o.status === "ยกเลิก";
      }
      if (status === "Pending") {
        return o.status === "Pending" || o.status === "รอดำเนินการ";
      }
      return o.status === status;
    });
  }

  // Helper to get actual labor cost
  const getLaborCost = (o: Order) => {
    const directLabor = (o.costIn || 0) + (o.costOut || 0);
    if (directLabor > 0) return directLabor;
    return (o.totalCost || 0);
  };

  // Filter only orders with labor cost > 0 (แสดงเฉพาะงานที่มีค่าแรง, งานไหนค่าแรง 0 บาทไม่ต้องแสดง)
  filtered = filtered.filter((o) => getLaborCost(o) > 0);

  // Pre-populate months based on month filter (only include selected month or all 12)
  const monthlyMap: Record<string, {
    month: string;
    totalOrders: number;
    costIn: number;
    costOut: number;
    totalCost: number;
  }> = {};

  if (month !== "All") {
    const mStr = month.padStart(2, "0");
    const key = `${mStr}/${year}`;
    monthlyMap[key] = {
      month: key,
      totalOrders: 0,
      costIn: 0,
      costOut: 0,
      totalCost: 0
    };
  } else {
    for (let i = 1; i <= 12; i++) {
      const mStr = i.toString().padStart(2, "0");
      const key = `${mStr}/${year}`;
      monthlyMap[key] = {
        month: key,
        totalOrders: 0,
        costIn: 0,
        costOut: 0,
        totalCost: 0
      };
    }
  }

  // Populate actual order data
  filtered.forEach((o) => {
    const dateParts = o.date.split("/");
    if (dateParts.length === 3) {
      const m = dateParts[1];
      const y = dateParts[2];
      const key = `${m}/${y}`;
      if (monthlyMap[key]) {
        monthlyMap[key].totalOrders += 1;
        monthlyMap[key].costIn += o.costIn || 0;
        monthlyMap[key].costOut += o.costOut || 0;
        monthlyMap[key].totalCost += getLaborCost(o);
      }
    }
  });

  let summary = Object.values(monthlyMap).sort((a, b) => {
    const mA = parseInt(a.month.split("/")[0], 10);
    const mB = parseInt(b.month.split("/")[0], 10);
    return mA - mB;
  });

  // Filter to show only months that have labor cost > 0 (งานไหนค่าแรง 0 บาทไม่ต้องแสดง)
  summary = summary.filter((item) => item.totalOrders > 0 && item.totalCost > 0);

  // Calculate overall totals
  let totalOrdersSum = 0;
  let costInSum = 0;
  let costOutSum = 0;
  let totalCostSum = 0;

  summary.forEach((item) => {
    totalOrdersSum += item.totalOrders;
    costInSum += item.costIn;
    costOutSum += item.costOut;
    totalCostSum += item.totalCost;
  });

  res.json({
    technician: isAllTechs ? "All" : techList.join(", "),
    technicians: isAllTechs ? ["All"] : techList,
    year,
    summary,
    totals: {
      totalOrders: totalOrdersSum,
      costIn: costInSum,
      costOut: costOutSum,
      totalCost: totalCostSum,
    }
  });
});

// API: AI-Powered Sales & Performance Insights (Gemini API Server-Side)
app.post("/api/insights", async (req, res) => {
  const { stats, year } = req.body;

  if (!stats) {
    return res.status(400).json({ error: "Missing dashboard statistics data." });
  }

  try {
    const sla = stats.slaStats || {
      inAreaCompletedTotal: 0,
      inAreaCompletedOnTime: 0,
      inAreaRate: 100,
      outAreaCompletedTotal: 0,
      outAreaCompletedOnTime: 0,
      outAreaRate: 100,
      pendingTotal: 0,
      pendingCriticalTotal: 0
    };

    const summaryData = {
      yearSelected: year,
      totalRevenue: stats.totalRevenue,
      totalOrders: stats.totalOrders,
      averageOrderValue: stats.averageOrderValue,
      completionRate: stats.completionRate,
      topMeterSizes: stats.byMeterSize.slice(0, 5),
      topOperatingAreas: stats.byArea.slice(0, 5),
      recentMonths: stats.byMonth.slice(-6),
    };

    const prompt = `
คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์ข้อมูลและพัฒนาธุรกิจขององค์กรการไฟฟ้าส่วนภูมิภาค (PEA) 
ได้รับมอบหมายให้วิเคราะห์รายงานวิเคราะห์ผลการปฏิบัติงานติดตั้งมิเตอร์ประจำปี ${year} จากชุดข้อมูลสรุปด้านล่างนี้:

ข้อมูลสรุปแดชทบอร์ด:
- ยอดขาย/ค่าแรงรวมทั้งหมด: ${summaryData.totalRevenue.toLocaleString()} บาท
- จำนวนงาน/คำร้องทั้งหมด: ${summaryData.totalOrders.toLocaleString()} รายการ
- ค่าแรงเฉลี่ยต่องาน: ${summaryData.averageOrderValue.toFixed(2)} บาท
- อัตราการติดตั้งเสร็จสมบูรณ์: ${summaryData.completionRate.toFixed(2)}%

ข้อมูลดัชนีชี้วัดระยะเวลาส่งมอบงาน (SLA Compliance):
- งานในเขต (SLA 3 วันทำการ): สำเร็จตามกำหนด ${sla.inAreaCompletedOnTime} จากทั้งหมด ${sla.inAreaCompletedTotal} งาน (คิดเป็นอัตราความสอดคล้อง SLA: ${sla.inAreaRate.toFixed(2)}%)
- งานนอกเขต (SLA 5 วันทำการ): สำเร็จตามกำหนด ${sla.outAreaCompletedOnTime} จากทั้งหมด ${sla.outAreaCompletedTotal} งาน (คิดเป็นอัตราความสอดคล้อง SLA: ${sla.outAreaRate.toFixed(2)}%)
- งานรอดำเนินการที่ค้างอยู่ (Pending): ทั้งหมด ${sla.pendingTotal} งาน โดยเป็นงานวิกฤตใกล้หรือเกินกำหนดส่งมอบ (Critical Alert) จำนวน ${sla.pendingCriticalTotal} งาน

หมวดหมู่ประเภทมิเตอร์ที่ได้รับความนิยมสูงสุด (5 อันดับแรก):
${summaryData.topMeterSizes.map((m: any) => `- ${m.name}: ${m.value} งาน (สร้างยอดเงินสะสม ${m.revenue.toLocaleString()} บาท)`).join("\n")}

พื้นที่ดำเนินงานที่มีปริมาณงานมากที่สุด (5 อันดับแรก):
${summaryData.topOperatingAreas.map((a: any) => `- ${a.name}: ${a.value} งาน (สร้างยอดเงินสะสม ${a.revenue.toLocaleString()} บาท)`).join("\n")}

แนวโน้มความเปลี่ยนแปลงรายเดือนย้อนหลัง (ไม่เกิน 6 เดือนหลังสุด):
${summaryData.recentMonths.map((m: any) => `- เดือน ${m.month}: ${m.orderCount} งาน (รายได้ ${m.revenue.toLocaleString()} บาท)`).join("\n")}

คำแนะนำในการวิเคราะห์งาน:
ช่วยเรียบเรียงบทวิเคราะห์เชิงธุรกิจในรูปแบบภาษาไทยที่สละสลวย เป็นทางการ และน่าเชื่อถือ โดยครอบคลุมหัวข้อหลักดังต่อไปนี้:
1. **สรุปภาพรวมผลการดำเนินงาน**: วิเคราะห์ความสมบูรณ์ของยอดงานติดตั้งและทิศทางรายได้โดยเฉลี่ย
2. **รายงานและการติดตาม SLA (ในเขต 3 วัน / นอกเขต 5 วัน)**: เจาะลึกอัตราความสำเร็จตามกำหนดเวลาของงานในเขตและนอกเขต เปรียบเทียบประสิทธิภาพในการบริหารงานตามระยะเวลาที่กำหนด พร้อมระบุถึงปัญหาคอขวดและข้อเสนอแนะในการจัดการงานรอดำเนินการ (Pending) ที่วิกฤตเพื่อติดตามงานไม่ให้ล่าช้า
3. **บทวิเคราะห์หมวดหมู่ผลิตภัณฑ์ (มิเตอร์)**: ประเมินว่ามิเตอร์ประเภทใดสร้างยอดขายและความต้องการได้มากที่สุด และพิจารณาแง่มุมความต้องการทางการตลาด
4. **คำแนะนำเชิงกลยุทธ์สำหรับผู้บริหาร**: เสนอแนะแนวทางการบริหารจัดการบุคลากร (ช่างเทคนิค/ผู้ควบคุม), แนะนำวิธีลดต้นทุนการทำงาน และกลยุทธ์เชิงปฏิบัติในการเพิ่มประสิทธิภาพการส่งมอบงานติดตั้ง (SLA Compliance Rate) ให้สูงยิ่งขึ้น

หมายเหตุ: หลีกเลี่ยงภาษาเขียนที่เป็นกันเองเกินไป ให้เน้นรูปแบบกระชับ ได้ใจความ พร้อมใช้สัญลักษณ์ Markdown และ bullet points เพื่อให้อ่านเข้าใจง่าย น่าดึงดูดบนหน้าจอ Dashboard
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({
      insights: response.text || "ขออภัย ไม่สามารถสร้างผลการวิเคราะห์ได้ในขณะนี้",
    });
  } catch (error: any) {
    console.error("Gemini AI generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI insights." });
  }
});

// API: Next-Month Demand & Budget Forecasting (Gemini API Server-Side)
app.post("/api/predict-next-month", async (req, res) => {
  const { stats, selectedYear, selectedMonth } = req.body;

  if (!stats) {
    return res.status(400).json({ error: "Missing dashboard statistics data." });
  }

  try {
    // Determine the reference (base) month from the statistics or filter
    let referenceMonthObj = null;
    if (selectedMonth && selectedMonth !== "All" && selectedYear && selectedYear !== "All") {
      const refKey = `${selectedMonth.padStart(2, "0")}/${selectedYear}`;
      referenceMonthObj = stats.byMonth?.find((m: any) => m.month === refKey);
    }
    
    // Fallback to the latest month in byMonth if not found or if "All" is selected
    if (!referenceMonthObj && stats.byMonth && stats.byMonth.length > 0) {
      referenceMonthObj = stats.byMonth[stats.byMonth.length - 1];
    }

    if (!referenceMonthObj) {
      return res.status(400).json({ error: "Could not determine a reference month for prediction." });
    }

    const prompt = `
คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์ข้อมูลและการพยากรณ์เชิงสถิติของการไฟฟ้าส่วนภูมิภาค (PEA)
กรุณาวิเคราะห์แนวโน้มข้อมูลการติดตั้งมิเตอร์และการใช้จ่ายค่าแรง เพื่อทำการคาดการณ์ความต้องการใช้มิเตอร์และงบประมาณสำหรับ "เดือนถัดไปเพียง 1 เดือน" โดยเปรียบเทียบกับ "เดือนฐานอ้างอิง" ด้านล่างนี้:

ข้อมูลเดือนฐานอ้างอิง (เดือนปัจจุบัน/เดือนล่าสุดที่มีข้อมูลจริง):
- เดือนฐานอ้างอิง: ${referenceMonthObj.month}
- จำนวนการใช้/ติดตั้งมิเตอร์ในเดือนฐาน: ${referenceMonthObj.orderCount} เครื่อง
- ค่าใช้จ่าย/ค่าแรงติดตั้งจริงในเดือนฐาน: ${referenceMonthObj.revenue} บาท

ข้อมูลสถิติภาพรวมและประวัติการดำเนินงานย้อนหลังเพื่อวิเคราะห์แนวโน้ม:
- จำนวนงานสะสมทั้งหมด: ${stats.totalOrders} งาน
- มูลค่าค่าแรง/งบประมาณติดตั้งสะสมทั้งหมด: ${stats.totalRevenue} บาท
- อัตราเฉลี่ยค่าแรงต่อเครื่อง: ${stats.averageOrderValue} บาท
- รายละเอียดรายเดือนย้อนหลังทั้งหมด:
${stats.byMonth ? stats.byMonth.map((m: any) => `- เดือน ${m.month}: ติดตั้ง ${m.orderCount} เครื่อง, ยอดค่าแรง ${m.revenue} บาท`).join("\n") : "ไม่มีข้อมูล"}

- รายละเอียดขนาดมิเตอร์ที่ใช้จริง:
${stats.byMeterSize ? stats.byMeterSize.map((m: any) => `- ขนาด ${m.name}: ${m.value} เครื่อง, รายได้สะสม ${m.revenue} บาท`).join("\n") : "ไม่มีข้อมูล"}

- รายละเอียดพื้นที่ดำเนินงาน:
${stats.byArea ? stats.byArea.map((a: any) => `- พื้นที่ ${a.name}: ${a.value} งาน, รายได้สะสม ${a.revenue} บาท`).join("\n") : "ไม่มีข้อมูล"}

จงใช้ข้อมูลนี้ร่วมกับหลักการพยากรณ์เชิงสถิติ แนวโน้มฤดูกาล (Seasonal Trend) และแนวโน้มเติบโต (Growth Trend) เพื่อสร้างการคาดการณ์ของ "เดือนถัดไปอีก 1 เดือน" (เช่น หากเดือนฐานคือ 07/2026 เดือนถัดไปที่จะพยากรณ์คือ 08/2026) 
โดยต้องส่งกลับผลลัพธ์เป็น JSON Object เท่านั้น ห้ามเขียนคำเกริ่นนำหรือคำลงท้ายใดๆ นอกเหนือจาก JSON รูปแบบต่อไปนี้:

{
  "referenceMonthName": "ชื่อเดือนฐานอ้างอิงภาษาไทย เช่น กรกฎาคม 2569",
  "referenceDemand": ${referenceMonthObj.orderCount},
  "referenceCost": ${referenceMonthObj.revenue},
  "nextMonthName": "ชื่อเดือนและปีถัดไปที่พยากรณ์ภาษาไทย เช่น สิงหาคม 2569",
  "predictedDemand": ตัวเลขจำนวนเครื่องติดตั้งที่คาดการณ์ในเดือนถัดไป (integer),
  "predictedCost": ตัวเลขงบประมาณค่าใช้จ่าย/ค่าแรงรวมที่คาดการณ์ในเดือนถัดไป (number, บาท),
  "demandChangePercent": อัตราการเปลี่ยนแปลงเปอร์เซ็นต์ของความต้องการมิเตอร์เมื่อเทียบกับเดือนฐาน (number เช่น 12.5 หรือ -4.2),
  "costChangePercent": อัตราการเปลี่ยนแปลงเปอร์เซ็นต์ของค่าใช้จ่ายเมื่อเทียบกับเดือนฐาน (number เช่น 10.8 หรือ -3.5),
  "topMeterSizes": [
    { "name": "ขนาดมิเตอร์ เช่น 5(15)A", "count": ตัวเลขจำนวนที่คาดว่าจะใช้ในเดือนถัดไป, "reason": "เหตุผลประกอบการพยากรณ์สำหรับขนาดนี้" }
  ],
  "topAreas": [
    { "name": "ชื่อพื้นที่ดำเนินงาน", "percentage": ตัวเลขเปอร์เซ็นต์ส่วนแบ่งงานในเดือนถัดไป (number เช่น 45.5), "reason": "เหตุผลประกอบสำหรับการเติบโตในพื้นที่นี้" }
  ],
  "aiAnalysisText": "บทวิเคราะห์สถิติสรุปความน่าจะเป็น แนวโน้มความต้องการและคำแนะนำเชิงกลยุทธ์สำหรับผู้บริหารในการวางแผนสำรองพัสดุมิเตอร์และจัดสรรแรงงานช่างในเดือนหน้า เขียนด้วยภาษาไทยที่เป็นทางการ น่าเชื่อถือ (จัดรูปแบบด้วย Bullet points และ Markdown ได้ตามเหมาะสม)",
  "confidenceLevel": ตัวเลขระดับความมั่นใจของการคาดการณ์ในครั้งนี้เป็นเปอร์เซ็นต์ (เช่น 85)
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const predictionData = JSON.parse(response.text || "{}");
    res.json(predictionData);
  } catch (error: any) {
    console.error("Gemini AI prediction generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI next-month prediction." });
  }
});

// Vite Middleware for client SPA setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
