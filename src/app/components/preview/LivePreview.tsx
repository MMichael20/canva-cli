"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PosterData, PosterFormat, FORMAT_DIMENSIONS } from "@/lib/types";
import { generateTemplateHtml } from "@/lib/templates/index";

interface LivePreviewProps {
  posterData: PosterData;
}

const FORMAT_TABS: { value: PosterFormat; label: string }[] = [
  { value: "square", label: "ריבוע" },
  { value: "story", label: "סטורי" },
  { value: "a4", label: "A4" },
];

export default function LivePreview({ posterData }: LivePreviewProps) {
  // Preview format is independent of posterData.format
  const [previewFormat, setPreviewFormat] = useState<PosterFormat>(posterData.format);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(440);

  // Measure container width with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Update preview format when posterData.format changes
  useEffect(() => {
    setPreviewFormat(posterData.format);
  }, [posterData.format]);

  // Generate HTML for the preview format
  const previewData = useMemo<PosterData>(
    () => ({ ...posterData, format: previewFormat }),
    [posterData, previewFormat]
  );

  const liveHtml = useMemo(() => {
    try {
      return generateTemplateHtml(previewData);
    } catch {
      return null;
    }
  }, [previewData]);

  // Close fullscreen on Escape
  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen]);

  const dims = FORMAT_DIMENSIONS[previewFormat];
  const iframeScale = containerWidth / dims.width;
  const scaledHeight = dims.height * iframeScale;

  // Fullscreen scale: fit poster inside viewport with padding
  const fullscreenScale =
    typeof window !== "undefined"
      ? Math.min(
          (window.innerWidth - 48) / dims.width,
          (window.innerHeight - 48) / dims.height
        )
      : 1;

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(posterData),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `שגיאה ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      // Revoke previous URL if any
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בייצוא");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLive = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = "poster.jpg";
    a.click();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Container */}
      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden border border-white/[0.06] bg-[#111118] relative"
        style={{
          height: `${Math.min(scaledHeight, window?.innerHeight ? window.innerHeight * 0.75 : 700)}px`,
          maxHeight: "75vh",
        }}
      >
        {previewUrl ? (
          /* Rendered JPG */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="poster preview"
            className="w-full h-full object-contain"
          />
        ) : liveHtml ? (
          /* Live iframe */
          <iframe
            srcDoc={liveHtml}
            title="Live poster preview"
            sandbox="allow-same-origin"
            className="border-0 pointer-events-none"
            style={{
              width: `${dims.width}px`,
              height: `${dims.height}px`,
              transform: `scale(${iframeScale})`,
              transformOrigin: "top right",
              position: "absolute",
              top: 0,
              right: 0,
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-center text-white/20 p-8">
            <div>
              <i className="fa-solid fa-image text-5xl mb-4 block" />
              <p>הפוסטר יופיע כאן</p>
            </div>
          </div>
        )}
      </div>

      {/* Format tabs + fullscreen button */}
      <div className="flex gap-2">
        {FORMAT_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setPreviewFormat(tab.value);
              setPreviewUrl(null);
            }}
            className={`flex-1 py-2 rounded-xl text-sm border transition-all cursor-pointer ${
              previewFormat === tab.value
                ? "border-[#6366f1] bg-[rgba(99,102,241,0.12)] text-[#a5b4fc]"
                : "border-white/[0.06] text-white/40 hover:border-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          title="מסך מלא"
          className="py-2 px-3 rounded-xl text-sm border border-white/[0.06] text-white/40 hover:border-white/10 hover:text-white/70 transition-all cursor-pointer"
        >
          <i className="fa-solid fa-expand" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {previewUrl ? (
          <>
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all text-sm font-medium cursor-pointer"
            >
              <i className="fa-solid fa-download ml-2" />
              הורידו JPG
            </button>
            <button
              type="button"
              onClick={handleBackToLive}
              className="py-3 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all text-sm cursor-pointer text-white/40"
              title="חזרה לתצוגה חיה"
            >
              <i className="fa-solid fa-arrow-rotate-left" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="accent-btn w-full flex items-center justify-center gap-3 py-3 text-sm"
          >
            {loading ? (
              <>
                <div className="loading-spinner" />
                מייצר...
              </>
            ) : (
              <>
                <i className="fa-solid fa-file-export" />
                ייצוא JPG
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <i className="fa-solid fa-triangle-exclamation ml-2" />
          {error}
        </div>
      )}

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.9)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setFullscreen(false);
          }}
        >
          {/* Close button — top-left for RTL layout */}
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            title="סגור"
            className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer z-10"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>

          {/* Scaled iframe container */}
          <div
            style={{
              width: `${dims.width}px`,
              height: `${dims.height}px`,
              transform: `scale(${fullscreenScale})`,
              transformOrigin: "center center",
              position: "relative",
              flexShrink: 0,
            }}
          >
            {liveHtml && (
              <iframe
                srcDoc={liveHtml}
                title="Fullscreen poster preview"
                sandbox="allow-same-origin"
                className="border-0 pointer-events-none"
                style={{
                  width: `${dims.width}px`,
                  height: `${dims.height}px`,
                  position: "absolute",
                  top: 0,
                  right: 0,
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
