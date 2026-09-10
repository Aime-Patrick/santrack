"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  MapPin,
  Check,
  X,
  Navigation,
  LoaderCircle,
  ChevronDown,
} from "lucide-react";

const RWANDA_DISTRICT_COORDS: Record<string, { lat: number; lng: number; label: string }> = {
  Nyarugenge:  { lat: -1.9536, lng: 30.0587, label: "Kigali – Nyarugenge" },
  Gasabo:      { lat: -1.9022, lng: 30.1342, label: "Kigali – Gasabo" },
  Kicukiro:    { lat: -1.9705, lng: 30.1044, label: "Kigali – Kicukiro" },
  Musanze:     { lat: -1.4998, lng: 29.6350, label: "Musanze" },
  Rubavu:      { lat: -1.6764, lng: 29.2636, label: "Rubavu" },
  Nyagatare:   { lat: -1.2982, lng: 30.3278, label: "Nyagatare" },
  Huye:        { lat: -2.5967, lng: 29.7394, label: "Huye" },
  Rwamagana:   { lat: -1.9489, lng: 30.4347, label: "Rwamagana" },
  Rusizi:      { lat: -2.4842, lng: 28.9075, label: "Rusizi" },
  Karongi:     { lat: -2.1556, lng: 29.3528, label: "Karongi" },
  Burera:      { lat: -1.4500, lng: 29.8500, label: "Burera" },
  Gicumbi:     { lat: -1.6167, lng: 30.0167, label: "Gicumbi" },
  Kayonza:     { lat: -1.9333, lng: 30.6500, label: "Kayonza" },
  Kirehe:      { lat: -2.2667, lng: 30.6500, label: "Kirehe" },
  Muhanga:     { lat: -2.0833, lng: 29.7500, label: "Muhanga" },
  Ngoma:       { lat: -2.1667, lng: 30.5000, label: "Ngoma" },
};

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

function buildMapHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body,html,#map{width:100%;height:100%}
    .pin-wrap{width:32px;height:32px;display:flex;align-items:center;justify-content:center}
    .pin{width:20px;height:20px;background:#2563eb;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 10px rgba(37,99,235,0.6)}
  </style>
</head>
<body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:true}).setView([${lat},${lng}],15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:19}).addTo(map);
var icon=L.divIcon({className:'',html:'<div class="pin-wrap"><div class="pin"></div></div>',iconSize:[32,32],iconAnchor:[16,32]});
var marker=L.marker([${lat},${lng}],{icon:icon,draggable:true}).addTo(map);
function emit(lat,lng){window.parent.postMessage({type:'MAP_LOCATION',lat:lat,lng:lng},'*');}
emit(${lat},${lng});
map.on('click',function(e){marker.setLatLng(e.latlng);map.panTo(e.latlng);emit(e.latlng.lat,e.latlng.lng);});
marker.on('dragend',function(){var p=marker.getLatLng();emit(p.lat,p.lng);});
window.addEventListener('message',function(e){
  if(e.data&&e.data.type==='MAP_JUMP'){
    var ll=L.latLng(e.data.lat,e.data.lng);
    marker.setLatLng(ll);
    map.flyTo(ll,e.data.zoom||15,{animate:true,duration:0.8});
    emit(e.data.lat,e.data.lng);
  }
});
<\/script>
</body>
</html>`;
}

interface MapPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number) => void;
}

export function MapPickerModal({
  open,
  onOpenChange,
  initialLat = -1.9441,
  initialLng = 30.0619,
  onConfirm,
}: MapPickerModalProps) {
  const [pickedLat, setPickedLat] = useState(initialLat);
  const [pickedLng, setPickedLng] = useState(initialLng);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showDistricts, setShowDistricts] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setPickedLat(initialLat);
      setPickedLng(initialLng);
      setIframeKey((k) => k + 1);
      setSearchQuery("");
      setSearchResults([]);
      setShowResults(false);
    }
  }, [open, initialLat, initialLng]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "MAP_LOCATION") {
        setPickedLat(parseFloat(Number(e.data.lat).toFixed(6)));
        setPickedLng(parseFloat(Number(e.data.lng).toFixed(6)));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const jumpMap = useCallback((lat: number, lng: number, zoom = 15) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "MAP_JUMP", lat, lng, zoom },
      "*",
    );
    setPickedLat(lat);
    setPickedLng(lng);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    clearTimeout(debounceRef.current);
    if (!value.trim() || value.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value + ", Rwanda")}&limit=6&accept-language=en`,
        );
        const data: NominatimResult[] = await res.json();
        setSearchResults(data);
        setShowResults(true);
      } catch {
        /* silent */
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleSelectResult = (r: NominatimResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    jumpMap(lat, lng, 16);
    setSearchQuery(r.display_name.split(",")[0]);
    setShowResults(false);
  };

  const iframeSrc = `data:text/html;charset=utf-8,${encodeURIComponent(buildMapHtml(initialLat, initialLng))}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="flex h-[100dvh] w-screen max-w-none flex-col overflow-hidden rounded-none border-0 p-0 sm:max-w-none">
        {/* Top Bar */}
        <div className="shrink-0 border-b border-border bg-card px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-sm font-semibold flex items-center gap-1.5">
              <MapPin className="size-4 text-primary" />
              Select Premise Location
            </DialogTitle>
            <DialogDescription className="text-[11px] text-muted-foreground">
              Click on the map or drag the pin · Search address or jump to a district
            </DialogDescription>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs font-mono text-foreground">
            <MapPin className="size-3 text-primary shrink-0" />
            {pickedLat.toFixed(5)}, {pickedLng.toFixed(5)}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close map"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search & Tools Bar */}
        <div className="shrink-0 border-b border-border bg-card px-4 py-2.5 flex flex-wrap items-center gap-2">
          {/* Address search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search address, sector, or landmark..."
              className="h-8 pl-8 pr-8 text-xs"
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
            />
            {isSearching && (
              <LoaderCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-muted-foreground" />
            )}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-card shadow-xl">
                {searchResults.map((r) => (
                  <button
                    key={r.place_id}
                    type="button"
                    onMouseDown={() => handleSelectResult(r)}
                    className="w-full flex items-start gap-2 px-3 py-2.5 text-left text-xs hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                  >
                    <MapPin className="size-3 text-primary mt-0.5 shrink-0" />
                    <span className="line-clamp-2 text-foreground leading-relaxed">{r.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* District quick-jump */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDistricts((v) => !v)}
              onBlur={() => setTimeout(() => setShowDistricts(false), 200)}
              className="flex items-center gap-1.5 h-8 rounded-md border border-border bg-muted/40 px-3 text-xs text-foreground hover:bg-muted transition-colors whitespace-nowrap"
            >
              <Navigation className="size-3 text-primary" />
              Jump to District
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
            {showDistricts && (
              <div className="absolute top-full right-0 z-50 mt-1 w-52 max-h-72 overflow-y-auto rounded-md border border-border bg-card shadow-xl">
                {Object.entries(RWANDA_DISTRICT_COORDS).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onMouseDown={() => {
                      jumpMap(val.lat, val.lng, 13);
                      setShowDistricts(false);
                    }}
                    className="w-full px-3 py-2.5 text-left text-xs text-foreground hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* My Location */}
          <button
            type="button"
            onClick={() => {
              if (!navigator.geolocation) return;
              navigator.geolocation.getCurrentPosition(
                (pos) => jumpMap(pos.coords.latitude, pos.coords.longitude, 17),
                () => {},
                { enableHighAccuracy: true, timeout: 8000 },
              );
            }}
            className="flex items-center gap-1.5 h-8 rounded-md border border-border bg-muted/40 px-3 text-xs text-foreground hover:bg-muted transition-colors whitespace-nowrap"
          >
            <Navigation className="size-3 text-primary" />
            My Location
          </button>
        </div>

        {/* Map Canvas */}
        <div className="relative flex-1 min-h-0">
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={iframeSrc}
            title="Interactive Rwanda Map"
            sandbox="allow-scripts allow-same-origin"
            className="h-full w-full border-0"
          />
          {/* Floating coords pill */}
          <div className="pointer-events-none absolute bottom-16 sm:bottom-4 left-1/2 -translate-x-1/2 sm:left-4 sm:translate-x-0">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card/95 backdrop-blur-sm px-4 py-2 shadow-lg text-xs font-mono">
              <MapPin className="size-3.5 text-primary shrink-0" />
              <span className="text-foreground font-medium sm:hidden">
                {pickedLat.toFixed(5)}, {pickedLng.toFixed(5)}
              </span>
              <span className="text-foreground font-medium hidden sm:block">
                Lat {pickedLat.toFixed(6)} · Lng {pickedLng.toFixed(6)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="shrink-0 border-t border-border bg-card px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          {/* Fine-tune inputs */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground shrink-0">Lat</Label>
              <input
                type="number"
                step="0.00001"
                value={pickedLat}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) jumpMap(v, pickedLng);
                }}
                className="w-28 h-7 rounded-md border border-border bg-background px-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground shrink-0">Lng</Label>
              <input
                type="number"
                step="0.00001"
                value={pickedLng}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) jumpMap(pickedLat, v);
                }}
                className="w-28 h-7 rounded-md border border-border bg-background px-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8">
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => { onConfirm(pickedLat, pickedLng); onOpenChange(false); }}
              className="h-8 gap-1.5"
            >
              <Check className="size-3.5" />
              Confirm Location
            </Button>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
