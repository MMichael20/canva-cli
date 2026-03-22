"use client";
import { useState, useEffect } from "react";

const LABELS = [
  "קוראים את תיאור המשרה...",
  "מנתחים את הדרישות...",
  "מעצבים את הפוסטרים...",
  "מוסיפים נגיעות אחרונות...",
];

const TIMINGS = [0, 2000, 3500, 5000]; // ms when each label appears

interface LoadingSequenceProps {
  onComplete: () => void;
}

export default function LoadingSequence({ onComplete }: LoadingSequenceProps) {
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    const timers = TIMINGS.slice(1).map((time, i) =>
      setTimeout(() => setLabelIndex(i + 1), time)
    );
    const completeTimer = setTimeout(onComplete, 3000); // 3s minimum
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-ring" />
        <p className="loading-label" key={labelIndex}>
          {LABELS[labelIndex]}
        </p>
      </div>
    </div>
  );
}
