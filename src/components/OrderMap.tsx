import React, { useEffect, useState, useRef } from "react";
import L from "leaflet";
import { Globe, MapPin, Search, Navigation, Info, X, Clock, User, ShieldAlert, CheckCircle2, AlertTriangle, FileText, Phone, Award, Check } from "lucide-react";
import { Order } from "../types";
import { maskCustomerName, maskLocation } from "../utils/masking";

interface OrderMapProps {
  selectedYear: string;
  selectedMonth: string;
  selectedArea: string;
  selectedSize: string;
  selectedStatus: string;
  searchQuery: string;
  onSelectOrder?: (order: Order) => void; // Optionally trigger the main app drawer
  refreshTrigger?: number;
}

export default function OrderMap({
  selectedYear,
  selectedMonth,
  selectedArea,
  selectedSize,
  selectedStatus,
  searchQuery,
  onSelectOrder,
  refreshTrigger = 0
}: OrderMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapOrders, setMapOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMapOrder, setSelectedMapOrder] = useState<Order | null>(null);
  const [driveMapping, setDriveMapping] = useState<Record<string, string>>({});

  // Fetch Google Drive File Mapping for photo previews inside the map panel
  useEffect(() => {
    fetch("/api/drive-mapping")
      .then((res) => res.json())
      .then((data) => setDriveMapping(data))
      .catch((err) => console.error("Error loading drive mapping in map:", err));
  }, []);

  // Fetch coordinates based on current filters
  useEffect(() => {
    const fetchCoordinates = async () => {
      setLoading(true);
      try {
        const url = `/api/map-orders?search=${encodeURIComponent(searchQuery)}&year=${selectedYear}&month=${encodeURIComponent(selectedMonth)}&area=${encodeURIComponent(selectedArea)}&meterSize=${encodeURIComponent(selectedSize)}&status=${encodeURIComponent(selectedStatus)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setMapOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Error loading map coordinates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoordinates();
  }, [selectedYear, selectedMonth, selectedArea, selectedSize, selectedStatus, searchQuery, refreshTrigger]);

  // Initialize Map container
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create Map
      const map = L.map(mapContainerRef.current, {
        center: [16.0536071, 102.7136741], // Center on Ban Phai District
        zoom: 12,
        zoomControl: false // We will place zoom control in a nice clean position
      });

      // Add elegant carto light or standard OSM tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Add zoom control at bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapInstanceRef.current = map;
      markerLayerGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerLayerGroupRef.current = null;
      }
    };
  }, []);

  // Update map markers when mapOrders or selectedMapOrder changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markerLayerGroupRef.current;

    if (!map || !layerGroup) return;

    // Clear old markers
    layerGroup.clearLayers();

    if (mapOrders.length === 0) return;

    const bounds: L.LatLngTuple[] = [];

    mapOrders.forEach((order) => {
      if (!order.gps) return;

      // Extract coordinates: clean spacing and split by comma
      const gpsClean = order.gps.replace(/[^0-9.,-]/g, "");
      const parts = gpsClean.split(",");
      if (parts.length !== 2) return;

      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);

      if (isNaN(lat) || isNaN(lng)) return;

      bounds.push([lat, lng]);

      // Map PEA status to clean categories and choose colors
      // Complete = emerald (#10b981), Handover = indigo (#6366f1), Pending = amber (#f59e0b), Cancel = rose (#f43f5e)
      const isComplete = order.status === "Complete" || order.status === "เสร็จสิ้น";
      const isHandover = order.status === "Handover" || order.status === "ส่งมอบงาน";
      const isCancel = order.status === "Cancel" || order.status === "ยกเลิก";
      
      let markerColor = "#f59e0b"; // Pending default
      let bgClass = "bg-amber-500 border-white";
      let ringClass = "ring-amber-200";

      if (isComplete) {
        markerColor = "#10b981";
        bgClass = "bg-emerald-500 border-white";
        ringClass = "ring-emerald-200";
      } else if (isHandover) {
        markerColor = "#6366f1";
        bgClass = "bg-indigo-500 border-white";
        ringClass = "ring-indigo-200";
      } else if (isCancel) {
        markerColor = "#e11d48";
        bgClass = "bg-rose-600 border-white";
        ringClass = "ring-rose-200";
      }

      // Create beautiful custom HTML DivIcon (modern pins, no legacy Leaflet blue images)
      const customIcon = L.divIcon({
        className: "custom-leaflet-pin",
        html: `
          <div class="relative flex items-center justify-center w-12 h-12">
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full opacity-55" style="background-color: ${markerColor}"></span>
            <div class="relative rounded-full w-9 h-9 shadow-lg border-2 border-white flex items-center justify-center text-white" style="background-color: ${markerColor}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      // Create Marker
      const marker = L.marker([lat, lng], { icon: customIcon });

      // Handle Click to load detail immediately
      marker.on("click", () => {
        setSelectedMapOrder(order);
        map.setView([lat, lng], 15, { animate: true });
      });

      marker.addTo(layerGroup);
    });

    // Auto-fit bounds if we have coordinates
    if (bounds.length > 0 && map) {
      // Zoom tightly to the group of markers
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [mapOrders]);

  // Helper to parse drive file id
  const getDriveFileId = (sheetPhotoPath?: string) => {
    if (!sheetPhotoPath) return null;
    const cleanPath = sheetPhotoPath.trim();
    if (driveMapping[cleanPath]) {
      return driveMapping[cleanPath];
    }
    // Check match for filename-only as fallback
    const filename = cleanPath.split("/").pop();
    if (filename && driveMapping[filename]) {
      return driveMapping[filename];
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[680px]" id="pea-gis-map-card">
      {/* Header Panel */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xs">
            <Globe className="w-5 h-5 text-purple-100" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              แผนที่จุดติดตั้งมิเตอร์ GIS (PEA Coordinates)
              <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full">
                Interactive Map
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">แสดงจุดพิกัดแยกตามสถานะของงานติดตั้งในฐานข้อมูลแบบทันที</p>
          </div>
        </div>

        {/* Legend Panel & Counts */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-600 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>เสร็จสิ้น: {mapOrders.filter(o => o.status === "Complete" || o.status === "เสร็จสิ้น").length}</span>
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-600 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>ส่งมอบงาน: {mapOrders.filter(o => o.status === "Handover" || o.status === "ส่งมอบงาน").length}</span>
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-600 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>รอดำเนินการ: {mapOrders.filter(o => o.status === "Pending" || o.status === "รอดำเนินการ").length}</span>
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-600 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>ยกเลิก: {mapOrders.filter(o => o.status === "Cancel" || o.status === "ยกเลิก").length}</span>
          </div>
          <div className="bg-purple-50 border border-purple-100 text-purple-700 rounded-xl px-2.5 py-1 shadow-2xs">
            รวมทั้งหมด: {mapOrders.length} จุดพิกัด
          </div>
        </div>
      </div>

      {/* Map + Detail Side Panel Split Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        
        {/* Loader Overlays */}
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-20 flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium animate-pulse">กำลังดึงพิกัดจุดติดตั้ง...</p>
          </div>
        )}

        {/* The Leaflet Container */}
        <div 
          ref={mapContainerRef} 
          className="flex-1 h-full min-h-[300px] z-10"
          id="pea-order-map"
        />

        {/* Detail sliding sidebar overlay (on right/bottom) */}
        {selectedMapOrder ? (
          <div className="w-full lg:w-[360px] bg-white border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col h-[220px] lg:h-full z-15 overflow-y-auto animate-fade-in relative shadow-lg">
            
            {/* Sidebar header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ใบสั่งงานที่เลือก</p>
                <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5 flex items-center gap-1">
                  <span className="text-purple-600">ID:</span> {selectedMapOrder.requestId}
                </h4>
              </div>
              <button 
                onClick={() => setSelectedMapOrder(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="ปิดหน้านี้"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Body Info */}
            <div className="p-4 space-y-4 flex-1">
              
              {/* Quick Summary Strip */}
              <div className="flex items-start justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold">ชื่อผู้ใช้ไฟฟ้า</p>
                  <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{maskCustomerName(selectedMapOrder.customerName)}</p>
                </div>

                {/* Status Badge */}
                {(() => {
                  const isComplete = selectedMapOrder.status === "Complete" || selectedMapOrder.status === "เสร็จสิ้น";
                  const isHandover = selectedMapOrder.status === "Handover" || selectedMapOrder.status === "ส่งมอบงาน";
                  const isCancel = selectedMapOrder.status === "Cancel" || selectedMapOrder.status === "ยกเลิก";
                  
                  if (isComplete) {
                    return (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        เสร็จสิ้น
                      </span>
                    );
                  } else if (isHandover) {
                    return (
                      <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-indigo-500" />
                        ส่งมอบงาน
                      </span>
                    );
                  } else if (isCancel) {
                    return (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        ยกเลิก
                      </span>
                    );
                  } else {
                    return (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        <Clock className="w-3 h-3 text-amber-500" />
                        รอดำเนินการ
                      </span>
                    );
                  }
                })()}
              </div>

              {/* Specifications grid */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-lg">
                  <span className="text-slate-400 font-semibold block mb-0.5">ประเภทขนาดมิเตอร์</span>
                  <span className="font-bold text-slate-800 truncate block">{selectedMapOrder.meterSize}</span>
                </div>
                <div className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-lg">
                  <span className="text-slate-400 font-semibold block mb-0.5">ประเภทพื้นที่ติดตั้ง</span>
                  <span className="font-bold text-slate-800 truncate block">{selectedMapOrder.area}</span>
                </div>
                <div className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-lg col-span-2">
                  <span className="text-slate-400 font-semibold block mb-0.5">สถานที่และที่อยู่ผู้ใช้ไฟฟ้า</span>
                  <span className="font-bold text-slate-800 block line-clamp-2">{maskLocation(selectedMapOrder.location)}</span>
                </div>
                <div className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-lg">
                  <span className="text-slate-400 font-semibold block mb-0.5">ช่างผู้ควบคุม / ติดตั้ง</span>
                  <span className="font-bold text-slate-800 truncate block">{selectedMapOrder.technician || "ไม่ระบุ"}</span>
                </div>
                <div className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-lg">
                  <span className="text-slate-400 font-semibold block mb-0.5">เบอร์ติดต่อ</span>
                  <span className="font-bold text-slate-800 truncate block flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {selectedMapOrder.phone || "-"}
                  </span>
                </div>
              </div>

              {/* Photo Proof thumbnail inside Map panel */}
              {(() => {
                const photoPath = selectedMapOrder.photoMeterFace || selectedMapOrder.photoCompletedWork || selectedMapOrder.photoNewInstallation;
                if (!photoPath) return null;

                const fileId = getDriveFileId(photoPath);
                if (!fileId) return null;

                const imageUrl = `https://lh3.googleusercontent.com/d/${fileId}=w300`;

                return (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ภาพตัวอย่างติดตั้งล่าสุด</span>
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 group">
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 p-1 text-center text-[9px] font-bold text-white">
                        ภาพหลักฐานหน้ามิเตอร์
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedMapOrder.gps}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 transition-colors py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99]"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>นำทางใน Google Maps</span>
                </a>

                {onSelectOrder && (
                  <button
                    onClick={() => onSelectOrder(selectedMapOrder)}
                    className="w-full bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>เปิดดูใบงานฉบับเต็ม</span>
                  </button>
                )}
              </div>

            </div>

          </div>
        ) : (
          <div className="hidden lg:flex w-[300px] bg-slate-50/50 border-l border-slate-100 flex-col items-center justify-center p-6 text-center text-slate-400">
            <MapPin className="w-8 h-8 text-slate-300 animate-bounce mb-2" />
            <h5 className="text-xs font-bold text-slate-600">แสดงผลข้อมูลทันที</h5>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
              คลิกเลือกจุดหมุดพิกัดบนแผนที่ เพื่อแสดงรายละเอียดใบงาน ผลการติดตั้ง และภาพหลักฐานในทันที
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
