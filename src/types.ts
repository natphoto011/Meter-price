export interface Order {
  id: string;
  date: string; // DD/MM/YYYY
  area: string;
  daysLimit: string;
  workTypeIn: string;
  costIn: number;
  workTypeOut: string;
  costOut: number;
  totalCost: number;
  deviceIndex: string;
  requestId: string;
  customerName: string;
  location: string;
  wireNum: string;
  meterSize: string;
  peaMeter: string;
  meterUnit: string;
  gps: string;
  phase: string;
  phone: string;
  supervisor: string;
  technician: string;
  status: string;
  scheduledDelivery: string;
  deliveryDate: string;
  photoMeterFace?: string;
  photoConnectedPhase?: string;
  photoElectricalPole?: string;
  photoOldMeter?: string;
  photoCompletedWork?: string;
  photoNewInstallation?: string;
  photoHouseWiring?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  completionRate: number;
  byMonth: {
    month: string; // MM/YYYY
    revenue: number;
    orderCount: number;
  }[];
  byMeterSize: {
    name: string;
    value: number;
    revenue: number;
  }[];
  byArea: {
    name: string;
    value: number;
    revenue: number;
  }[];
  byTechnician: {
    name: string;
    value: number;
    revenue: number;
  }[];
  byStatus: {
    name: string;
    count: number;
  }[];
}
