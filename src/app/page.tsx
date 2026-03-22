"use client";
import { useState, useCallback } from "react";
import type { PosterVariant } from "@/lib/types";
import ChatInput from "./components/ChatInput";
import LoadingSequence from "./components/LoadingSequence";
import PosterGrid from "./components/PosterGrid";
import FormatModal from "./components/FormatModal";

type Phase = "idle" | "loading" | "results" | "error";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [variants, setVariants] = useState<PosterVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<PosterVariant | null>(null);
  const [error, setError] = useState<string>("");
  const [apiDone, setApiDone] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const [pendingVariants, setPendingVariants] = useState<PosterVariant[] | null>(null);
  const [imageQuery, setImageQuery] = useState("");
  const [imagePage, setImagePage] = useState(1);
  const [swapping, setSwapping] = useState(false);

  const handleSubmit = async (description: string, model?: string) => {
    setPhase("loading");
    setError("");
    setApiDone(false);
    setTimerDone(false);
    setPendingVariants(null);

    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, model }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "שגיאה בשרת" }));
        throw new Error(data.error || "שגיאה בשרת");
      }
      const data = await res.json();
      setPendingVariants(data.variants);
      setImageQuery(data.imageQuery || "");
      setImagePage(1);
      setApiDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה");
      setPhase("error");
    }
  };

  const handleTimerComplete = useCallback(() => {
    setTimerDone(true);
  }, []);

  // Transition to results when both API and timer are done
  if (apiDone && timerDone && pendingVariants && phase === "loading") {
    setVariants(pendingVariants);
    setPhase("results");
    setApiDone(false);
    setTimerDone(false);
    setPendingVariants(null);
  }

  const handleSwapImage = async () => {
    if (swapping || !imageQuery || variants.length === 0) return;
    setSwapping(true);

    const nextPage = imagePage + 1;
    try {
      const res = await fetch("/api/swap-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageQuery,
          page: nextPage,
          variants: variants.map((v) => ({ posterData: v.posterData })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "שגיאה" }));
        throw new Error(data.error || "שגיאה בהחלפת תמונה");
      }

      const { imageUrl, thumbnails } = await res.json();

      setVariants((prev) =>
        prev.map((v, i) => ({
          ...v,
          posterData: { ...v.posterData, imageUrl },
          thumbnail: thumbnails[i] || v.thumbnail,
        }))
      );

      // Update selectedVariant if modal is open
      setSelectedVariant((prev) => {
        if (!prev) return null;
        const idx = variants.findIndex((v) => v.id === prev.id);
        if (idx === -1) return prev;
        return {
          ...prev,
          posterData: { ...prev.posterData, imageUrl },
          thumbnail: thumbnails[idx] || prev.thumbnail,
        };
      });

      setImagePage(nextPage);
    } catch (err) {
      alert(err instanceof Error ? err.message : "שגיאה בהחלפת תמונה");
    } finally {
      setSwapping(false);
    }
  };

  const handleReset = () => {
    setPhase("idle");
    setVariants([]);
    setSelectedVariant(null);
    setError("");
    setImageQuery("");
    setImagePage(1);
  };

  return (
    <div className="chat-page">
      {/* Brand Header — shown in idle state */}
      {phase === "idle" && (
        <div className="brand-hero">
          <div className="brand-glow" />
          <h1 className="brand-title">Personal Hire</h1>
          <p className="brand-subtitle">AI Recruitment Posters</p>
          <p className="brand-description">
            הדביקו תיאור משרה ותקבלו פוסטר מקצועי לגיוס תוך שניות
          </p>
        </div>
      )}

      {/* Loading */}
      {phase === "loading" && (
        <LoadingSequence onComplete={handleTimerComplete} />
      )}

      {/* Results */}
      {phase === "results" && (
        <PosterGrid
          variants={variants}
          onSelect={(v) => setSelectedVariant(v)}
          onReset={handleReset}
          onSwapImage={imageQuery ? handleSwapImage : undefined}
          swapping={swapping}
        />
      )}

      {/* Error */}
      {phase === "error" && (
        <div className="error-container">
          <div className="error-icon">
            <i className="fa-solid fa-triangle-exclamation" />
          </div>
          <p className="error-message">{error}</p>
          <button onClick={handleReset} className="accent-btn">
            נסו שוב
          </button>
        </div>
      )}

      {/* Chat Input — shown in idle state */}
      {phase === "idle" && (
        <ChatInput onSubmit={handleSubmit} disabled={false} />
      )}

      {/* Format Modal */}
      {selectedVariant && (
        <FormatModal
          variant={selectedVariant}
          onClose={() => setSelectedVariant(null)}
        />
      )}
    </div>
  );
}
