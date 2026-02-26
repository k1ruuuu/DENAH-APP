'use client';

import React, { useRef, useEffect, useCallback, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Plus, RefreshCw as RefreshCwIcon } from "lucide-react";

interface InteractiveMapProps {
  svgContent: string;
  onRoomClick: (roomId: string) => void;
  onRoomHover?: (roomId: string | null) => void;
  hoveredRoomId?: string | null;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  svgContent,
  onRoomClick,
  onRoomHover,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const eventListenersRef = useRef<Map<Element, () => void>>(new Map());
  const [scale, setScale] = useState(1);

  const setupEventListeners = useCallback(() => {
    if (!containerRef.current || !svgContent) return;

    const svgElement = containerRef.current.querySelector("svg");
    if (!svgElement) return;

    // Atur ukuran SVG agar responsif
    svgElement.style.width = "100%";
    svgElement.style.height = "100%";
    svgElement.style.maxHeight = "100%";
    svgElement.style.objectFit = "contain";
    svgElement.style.display = "block";

    // Bersihkan listener lama
    eventListenersRef.current.forEach((cleanup) => cleanup());
    eventListenersRef.current.clear();

    const interactiveElements = svgElement.querySelectorAll(
      '[id^="room"], [class*="room"], rect, path, polygon, circle'
    );

    interactiveElements.forEach((element) => {
      const id = element.getAttribute("id");
      const className = element.getAttribute("class") ?? "";

      if (!id && !className.includes("room")) return;

      const roomId =
        id ??
        className.split(" ").find((cls) => cls.includes("room")) ??
        "unknown";

      const handleClick = () => onRoomClick(roomId);

      const handleMouseEnter = () => {
        if (!(element instanceof SVGElement)) return;

        element.setAttribute("data-original-fill", element.getAttribute("fill") ?? "#E2E8F0");
        element.setAttribute("data-original-stroke", element.getAttribute("stroke") ?? "none");
        element.setAttribute("data-original-stroke-width", element.getAttribute("stroke-width") ?? "0");

        element.style.transition = "fill 0.3s ease, stroke 0.3s ease";
        element.style.fill = "#3B82F6";
        element.style.stroke = "#1D4ED8";
        element.style.strokeWidth = "2";
        element.style.cursor = "pointer";

        onRoomHover?.(roomId);
      };

      const handleMouseLeave = () => {
        if (!(element instanceof SVGElement)) return;

        element.style.fill = element.getAttribute("data-original-fill") ?? "";
        element.style.stroke = element.getAttribute("data-original-stroke") ?? "";
        element.style.strokeWidth = element.getAttribute("data-original-stroke-width") ?? "";
        element.style.cursor = "";

        onRoomHover?.(null);
      };

      const handleMouseDown = () => {
        if (element instanceof SVGElement) element.style.fill = "#2563EB";
      };

      const handleMouseUp = () => {
        if (element instanceof SVGElement) element.style.fill = "#3B82F6";
      };

      element.addEventListener("click", handleClick);
      element.addEventListener("mouseenter", handleMouseEnter);
      element.addEventListener("mouseleave", handleMouseLeave);
      element.addEventListener("mousedown", handleMouseDown);
      element.addEventListener("mouseup", handleMouseUp);

      eventListenersRef.current.set(element, () => {
        element.removeEventListener("click", handleClick);
        element.removeEventListener("mouseenter", handleMouseEnter);
        element.removeEventListener("mouseleave", handleMouseLeave);
        element.removeEventListener("mousedown", handleMouseDown);
        element.removeEventListener("mouseup", handleMouseUp);
      });
    });

    return () => {
      eventListenersRef.current.forEach((cleanup) => cleanup());
      eventListenersRef.current.clear();
    };
  }, [svgContent, onRoomClick, onRoomHover]);

  useEffect(() => {
    const cleanup = setupEventListeners();
    return cleanup;
  }, [setupEventListeners]);

  useEffect(() => {
    if (!svgContent || !containerRef.current) return;

    const observer = new MutationObserver(() => setupEventListeners());
    observer.observe(containerRef.current, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [svgContent, setupEventListeners]);

  return (
    <div className="w-full h-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] relative border border-slate-200 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-white shadow-lg">
      <TransformWrapper
        initialScale={1}
        minScale={0.3}
        maxScale={8}
        wheel={{ step: 0.1 }}
        panning={{
          excluded: ["input", "select", "textarea", "button", "label"],
          velocityDisabled: false,
        }}
        centerOnInit={true}
        centerZoomedOut={true}
        onZoom={(ref) => setScale(ref.state.scale)}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Kontrol Zoom */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-6 z-10 space-y-2 sm:space-y-3">
              <div className="bg-white/95 backdrop-blur-sm p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl border border-slate-200">
                <div className="text-xs font-semibold text-slate-700 mb-1 sm:mb-2 px-1">Navigasi</div>
                <div className="flex gap-1 sm:gap-1.5">
                  <button
                    onClick={() => zoomIn()}
                    className="p-2 sm:p-2.5 bg-blue-50 text-blue-600 rounded-lg sm:rounded-xl hover:bg-blue-100 transition-all active:scale-95 shadow-sm"
                    title="Zoom In"
                  >
                    <Plus size={14} className="sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={() => zoomOut()}
                    className="p-2 sm:p-2.5 bg-blue-50 text-blue-600 rounded-lg sm:rounded-xl hover:bg-blue-100 transition-all active:scale-95 shadow-sm"
                    title="Zoom Out"
                  >
                    <span className="text-sm sm:text-lg font-bold">−</span>
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="p-2 sm:p-2.5 bg-slate-100 text-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-200 transition-all active:scale-95 shadow-sm"
                    title="Reset Zoom"
                  >
                    <RefreshCwIcon size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
                <div className="mt-2 text-[10px] sm:text-xs text-slate-500 font-medium px-1">
                  Zoom: <span className="font-bold">{Math.round(scale * 100)}%</span>
                </div>
              </div>
            </div>

            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%", position: "relative" }}
              contentStyle={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "20px",
              }}
            >
              <div
                ref={containerRef}
                id="svg-map-container"
                className="w-full h-full flex justify-center items-center"
                dangerouslySetInnerHTML={{ __html: svgContent }}
                style={{ maxWidth: "100%", maxHeight: "100%", overflow: "hidden" }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Status Bar */}
      <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 bg-white/95 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl shadow-lg border border-slate-200">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-600">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-xs sm:text-sm">Sistem Aktif</span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="hidden sm:inline">Klik ruangan untuk detail</span>
        </div>
      </div>
    </div>
  );
};