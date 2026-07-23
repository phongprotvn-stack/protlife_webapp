'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { eventService } from '@/lib/services/event-service';
import { organizationService } from '@/lib/services/organization-service';
import type { EventItem } from '@/types/database';
import type { Organization } from '@/lib/services/organization-service';
import { useAuthStore } from '@/stores/auth-store';
import { Search, Navigation, MapPin, X, Building2, Calendar } from 'lucide-react';

type FilterType = 'all' | 'event' | 'org';

interface MapPlace {
  id: string;
  type: 'event' | 'org';
  title: string;
  meta: string;
  date: string;
  lat: number;
  lng: number;
}

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const user = useAuthStore((s) => s.user);

  // Load data
  useEffect(() => {
    if (!user?.id) return;
    const loadPlaces = async () => {
      try {
        console.log('[map] Loading events...');
        const events = await eventService.getAll();
        console.log('[map] Events loaded:', events.length);
        const eventPlaces: MapPlace[] = events
          .filter((e) => e.Lat && e.Lng && e.Place)
          .map((e) => ({
            id: `event-${e.EventID}`,
            type: 'event' as const,
            title: e.Title,
            meta: e.Place || '',
            date: e.StartDate || '',
            lat: Number(e.Lat),
            lng: Number(e.Lng),
          }));
        console.log('[map] Event places with coords:', eventPlaces.length);

        const orgs = await organizationService.getAll();
        const orgPlaces: MapPlace[] = orgs
          .filter((o) => o.Lat && o.Lng && o.Address)
          .map((o) => ({
            id: `org-${o.OrganizationID}`,
            type: 'org' as const,
            title: o.Name,
            meta: o.Address || '',
            date: '',
            lat: Number(o.Lat),
            lng: Number(o.Lng),
          }));
        console.log('[map] Org places with coords:', orgPlaces.length);
        console.log('[map] Total places:', eventPlaces.length + orgPlaces.length);

        setPlaces([...eventPlaces, ...orgPlaces]);
      } catch (e) {
        console.error('[map] Failed to load map data', e);
      }
    };
    loadPlaces();
  }, [user?.id]);

  // Init Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || leafletReady) return;

    const initMap = async () => {
      const L = await import('leaflet');
      
      // Fix default icon paths for Next.js bundling
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current!, {
        zoomControl: false,
        attributionControl: true,
        fadeAnimation: true,
      }).setView([21.028, 105.804], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      L.control.zoom({ position: 'bottomleft' }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
      setLeafletReady(true);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setLeafletReady(false);
      }
    };
  }, []);

  // Update markers when places or filter changes
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current || !markersLayerRef.current) return;

    const initMarkers = async () => {
      const L = await import('leaflet');
      const layer = markersLayerRef.current;
      layer.clearLayers();

      const filtered = places.filter((p) => {
        if (activeFilter === 'event') return p.type === 'event';
        if (activeFilter === 'org') return p.type === 'org';
        return true;
      }).filter((p) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.meta.toLowerCase().includes(q);
      });

      filtered.forEach((p) => {
        const isEvent = p.type === 'event';
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:34px; height:34px; border-radius:50% 50% 50% 0; transform:rotate(-45deg);
            display:flex; align-items:center; justify-content:center;
            box-shadow:0 4px 10px rgba(0,0,0,.25);
            border:2.5px solid #fff; cursor:pointer;
            background:${isEvent ? 'linear-gradient(135deg,#E6002D,#FF1A4A)' : 'linear-gradient(135deg,#007AFF,#3395FF)'};
          "><span style="transform:rotate(45deg); font-size:15px;">${isEvent ? '📅' : '🏢'}</span></div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 32],
        });

        const marker = L.marker([p.lat, p.lng], { icon }).addTo(layer);
        marker.on('click', () => {
          setSelectedPlace(p);
          mapInstanceRef.current!.flyTo([p.lat, p.lng], 15, { duration: 0.6 });
        });
      });
    };

    initMarkers();
  }, [places, activeFilter, searchTerm, leafletReady]);

  const filteredPlaces = places.filter((p) => {
    if (activeFilter === 'event') return p.type === 'event';
    if (activeFilter === 'org') return p.type === 'org';
    return true;
  }).filter((p) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.meta.toLowerCase().includes(q);
  });

  const handleLocate = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([21.028, 105.804], 13, { duration: 0.6 });
    }
  };

  const handleCloseSheet = () => setSelectedPlace(null);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Map container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0"
        style={{ filter: 'saturate(0.85) brightness(1.02)' }} />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-2.5">
        <div className="flex-1 flex items-center gap-2 px-3.5 py-[11px] rounded-[14px] bg-white/72 backdrop-blur-xl border border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          <Search size={15} className="text-[#8E8E93] shrink-0" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 text-[14px] bg-transparent outline-none text-[#111] placeholder:text-[#8E8E93]"
            placeholder="Tìm địa điểm, sự kiện, tổ chức..." />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-[#8E8E93] hover:text-[#111]">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="absolute top-[72px] left-4 right-4 z-10 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {([
          { key: 'all', label: '🗺️ Tất cả', count: places.length },
          { key: 'event', label: '📅 Sự kiện', count: places.filter((p) => p.type === 'event').length },
          { key: 'org', label: '🏢 Tổ chức', count: places.filter((p) => p.type === 'org').length },
        ] as const).map((pill) => (
          <button key={pill.key} onClick={() => setActiveFilter(pill.key as FilterType)}
            className={`shrink-0 px-[15px] py-[8px] rounded-full text-[12.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === pill.key
                ? 'bg-[#E6002D] text-white shadow-[0_4px_16px_rgba(230,0,45,0.35)]'
                : 'bg-white/72 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] text-[#6B7280] border border-white/25'
            }`}>
            {pill.label} <span className="opacity-70">({pill.count})</span>
          </button>
        ))}
      </div>

      {/* No data hint */}
      {leafletReady && places.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="bg-white/80 backdrop-blur-xl rounded-[20px] px-6 py-5 text-center shadow-lg max-w-[260px]">
            <div className="text-[32px] mb-2">🗺️</div>
            <p className="text-[14px] font-semibold text-[#111]">Chưa có địa điểm</p>
            <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed">
              Thêm toạ độ cho sự kiện hoặc tổ chức bằng nút "📍 Lấy toạ độ" trong form sửa.
            </p>
          </div>
        </div>
      )}

      {/* Desktop side panel */}
      <div className="hidden xl:block absolute top-[130px] left-4 bottom-4 w-[320px] z-10 bg-white/72 backdrop-blur-xl border border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[28px] overflow-y-auto p-3.5">
        <div className="text-[13px] font-extrabold text-[#111] px-2 pb-2.5">
          📍 {filteredPlaces.length} địa điểm
        </div>
        {filteredPlaces.map((p) => (
          <div key={p.id} onClick={() => {
            setSelectedPlace(p);
            mapInstanceRef.current?.flyTo([p.lat, p.lng], 15, { duration: 0.6 });
          }}
            className={`flex items-center gap-2.5 px-2.5 py-[11px] rounded-[16px] cursor-pointer mb-1 transition-colors ${
              selectedPlace?.id === p.id ? 'bg-[rgba(230,0,45,0.06)]' : 'hover:bg-[rgba(230,0,45,0.04)]'
            }`}>
            <div className="w-[36px] h-[36px] rounded-[11px] flex items-center justify-center text-[15px] text-white shrink-0"
              style={{ background: p.type === 'event' ? 'linear-gradient(135deg,#E6002D,#FF1A4A)' : 'linear-gradient(135deg,#007AFF,#3395FF)' }}>
              {p.type === 'event' ? '📅' : '🏢'}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-[#111] truncate">{p.title}</div>
              <div className="text-[11px] text-[#8E8E93] truncate">{p.meta}</div>
            </div>
          </div>
        ))}
        {filteredPlaces.length === 0 && (
          <p className="text-[12px] text-[#8E8E93] text-center py-8">Không có địa điểm nào</p>
        )}
      </div>

      {/* FAB locate */}
      <button onClick={handleLocate}
        className="absolute bottom-6 right-4 xl:right-[352px] z-10 w-[48px] h-[48px] rounded-full bg-white shadow-[0_6px_20px_rgba(0,0,0,0.15)] flex items-center justify-center text-[18px] cursor-pointer hover:scale-105 active:scale-95 transition-transform">
        📍
      </button>

      {/* Bottom sheet overlay */}
      {selectedPlace && (
        <div onClick={handleCloseSheet}
          className="absolute inset-0 z-20 bg-black/15 transition-opacity" />
      )}

      {/* Bottom sheet or desktop panel */}
      {selectedPlace && (
        <div className={`glass-card z-20 transition-transform duration-[320ms] ${
          selectedPlace ? 'translate-y-0' : 'translate-y-full'
        } xl:absolute xl:bottom-4 xl:left-auto xl:right-4 xl:w-[360px] xl:rounded-[24px] xl:translate-y-0
        fixed bottom-0 left-0 right-0 rounded-t-[28px] max-w-[480px] mx-auto p-3.5 pb-6`}>
          <div className="hidden xl:block">
            <button onClick={handleCloseSheet} className="absolute top-3 right-3 text-[#8E8E93] hover:text-[#111] cursor-pointer">
              <X size={16} />
            </button>
          </div>
          <div className="xl:hidden w-[36px] h-[4px] bg-[rgba(0,0,0,0.15)] rounded-full mx-auto mb-3.5" />
          <div className="flex gap-3 items-start mb-3.5">
            <div className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center text-[20px] text-white shrink-0"
              style={{ background: selectedPlace.type === 'event' ? 'linear-gradient(135deg,#E6002D,#FF1A4A)' : 'linear-gradient(135deg,#007AFF,#3395FF)' }}>
              {selectedPlace.type === 'event' ? '📅' : '🏢'}
            </div>
            <div className="min-w-0">
              <div className="text-[16px] font-bold text-[#111]">{selectedPlace.title}</div>
              <div className="text-[12.5px] text-[#8E8E93] mt-0.5 leading-relaxed">
                📍 {selectedPlace.meta}
                {selectedPlace.date && <> · {new Date(selectedPlace.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</>}
              </div>
              <div className="text-[10.5px] font-bold px-[9px] py-[3px] rounded-[8px] bg-[rgba(230,0,45,0.08)] text-[#E6002D] inline-block mt-1.5">
                {selectedPlace.type === 'event' ? '📅 Sự kiện' : '🏢 Tổ chức'}
              </div>
            </div>
          </div>
          <div className="flex gap-2.5 mt-4">
            <button onClick={handleCloseSheet}
              className="flex-1 py-3 rounded-[14px] text-[13px] font-semibold bg-[rgba(0,0,0,0.05)] text-[#111] cursor-pointer">Đóng</button>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 py-3 rounded-[14px] text-[13px] font-semibold text-white bg-[#E6002D] shadow-[0_4px_16px_rgba(230,0,45,0.3)] flex items-center justify-center gap-1.5 no-underline">
              🧭 Chỉ đường
            </a>
          </div>
        </div>
      )}

      <style jsx global>{`
        .leaflet-control-attribution { font-size: 9px !important; opacity: 0.6 !important; }
        .leaflet-control-zoom a { background: #fff !important; color: #111 !important; border: none !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
        .leaflet-control-zoom { border: none !important; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
