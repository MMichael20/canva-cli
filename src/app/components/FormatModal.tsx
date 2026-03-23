"use client";
import { useState, useRef, useEffect } from "react";
import { FormatId, FORMAT_DIMENSIONS } from "@/lib/types";
import type { PosterVariant } from "@/lib/types";

interface FormatModalProps {
  variant: PosterVariant;
  onClose: () => void;
  onSwapImage?: () => void;
  swapping?: boolean;
}

const FORMAT_ICONS: Record<FormatId, string> = {
  "whatsapp-status": "fa-brands fa-whatsapp",
  "instagram-story": "fa-brands fa-instagram",
  "instagram-post": "fa-brands fa-instagram",
  "facebook-post": "fa-brands fa-facebook",
  "a4-print": "fa-solid fa-print",
};

export default function FormatModal({ variant, onClose, onSwapImage, swapping }: FormatModalProps) {
  const [downloading, setDownloading] = useState<FormatId | null>(null);
  const [previewing, setPreviewing] = useState<FormatId | null>(null);
  const [fullscreenSrc, setFullscreenSrc] = useState<string | null>(null);
  const previewCache = useRef<Partial<Record<FormatId, string>>>({});

  // Clear preview cache when image changes (variant.posterData.imageUrl)
  const prevImageUrl = useRef(variant.posterData.imageUrl);
  useEffect(() => {
    if (prevImageUrl.current !== variant.posterData.imageUrl) {
      previewCache.current = {};
      prevImageUrl.current = variant.posterData.imageUrl;
    }
  }, [variant.posterData.imageUrl]);

  const handleDownload = async (formatId: FormatId) => {
    setDownloading(formatId);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posterData: variant.posterData, formatId }),
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `personal-hire-${formatId}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("שגיאה בהורדה, נסו שוב");
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = async (formatId: FormatId) => {
    if (previewCache.current[formatId]) {
      setFullscreenSrc(previewCache.current[formatId]!);
      return;
    }

    setPreviewing(formatId);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posterData: variant.posterData, formatId }),
      });
      if (!res.ok) throw new Error("Preview failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      previewCache.current[formatId] = url;
      setFullscreenSrc(url);
    } catch (err) {
      console.error(err);
      alert("שגיאה בטעינת תצוגה מקדימה");
    } finally {
      setPreviewing(null);
    }
  };

  const busy = downloading !== null || previewing !== null;

  return (
    <>
      <div className="format-modal-overlay" onClick={onClose}>
        <div className="format-modal" onClick={(e) => e.stopPropagation()}>
          <button className="format-modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>

          <div className="format-modal-preview" style={{ position: "relative" }}>
            <img
              src={variant.thumbnail}
              alt={variant.posterData.title.he}
              style={{ opacity: swapping ? 0.4 : 1 }}
            />
            {swapping && (
              <div className="preview-loading-overlay">
                <div className="loading-spinner" />
              </div>
            )}
            <button
              className="fullscreen-btn"
              onClick={() => setFullscreenSrc(variant.thumbnail)}
              aria-label="תצוגה מלאה"
            >
              <i className="fa-solid fa-expand" />
            </button>
          </div>

          {/* Swap Image Button */}
          {onSwapImage && (
            <button
              onClick={onSwapImage}
              disabled={swapping || busy}
              className="modal-swap-image-btn"
            >
              {swapping ? (
                <div className="loading-spinner" />
              ) : (
                <i className="fa-solid fa-image" style={{ marginLeft: "8px" }} />
              )}
              {swapping ? "מחליף תמונה..." : "תמונה אחרת"}
            </button>
          )}

          <h3 className="format-modal-title">בחרו פורמט להורדה</h3>

          <div className="format-buttons">
            {(Object.keys(FORMAT_DIMENSIONS) as FormatId[]).map((formatId) => {
              const format = FORMAT_DIMENSIONS[formatId];
              const isDownloading = downloading === formatId;
              const isPreviewing = previewing === formatId;
              return (
                <div key={formatId} className="format-row">
                  <button
                    className="format-expand-btn"
                    onClick={() => handlePreview(formatId)}
                    disabled={busy}
                    aria-label={`תצוגה מקדימה ${format.labelHe}`}
                  >
                    {isPreviewing ? (
                      <div className="loading-spinner" />
                    ) : (
                      <i className="fa-solid fa-expand" />
                    )}
                  </button>
                  <button
                    className={`format-btn ${isDownloading ? "downloading" : ""}`}
                    onClick={() => handleDownload(formatId)}
                    disabled={busy}
                  >
                    {isDownloading ? (
                      <div className="loading-spinner" />
                    ) : (
                      <i className={FORMAT_ICONS[formatId]} />
                    )}
                    <span>{format.labelHe}</span>
                    <span className="format-size">{format.width}×{format.height}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {fullscreenSrc && (
        <div className="fullscreen-overlay" onClick={() => setFullscreenSrc(null)}>
          <button
            className="fullscreen-close"
            onClick={() => setFullscreenSrc(null)}
            aria-label="סגור"
          >
            <i className="fa-solid fa-xmark" />
          </button>
          <img
            src={fullscreenSrc}
            alt={variant.posterData.title.he}
            className="fullscreen-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
