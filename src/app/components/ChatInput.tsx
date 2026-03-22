"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";

const MODELS = [
  { id: "gpt-5.4-nano", label: "GPT-5.4 Nano", description: "הכי מהיר וזול" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 Mini", description: "מהיר ואיכותי" },
  { id: "gpt-5.4", label: "GPT-5.4", description: "הכי חזק" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", description: "דור קודם" },
];

interface ChatInputProps {
  onSubmit: (text: string, model: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const [model, setModel] = useState("gpt-5.4-mini");
  const [showModels, setShowModels] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showModels) return;
    const handleClick = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setShowModels(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showModels]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed.length < 20 || disabled) return;
    onSubmit(trimmed, model);
    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (value: string) => {
    setText(value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  };

  const canSubmit = text.trim().length >= 20 && !disabled;
  const currentModel = MODELS.find((m) => m.id === model) || MODELS[0];

  return (
    <div className="chat-input-container">
      <div className="chat-input-inner">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="הדביקו כאן תיאור משרה..."
          disabled={disabled}
          rows={1}
          className="chat-textarea"
        />
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || undefined}
          className="chat-send-btn"
          aria-label="שלח"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 5 5 12 12 19" />
          </svg>
        </button>
      </div>

      <div className="model-selector-row">
        <div className="model-selector-wrapper" ref={modelRef}>
          <button
            className="model-selector-btn"
            onClick={() => setShowModels(!showModels)}
            disabled={disabled}
          >
            <i className="fa-solid fa-microchip" />
            <span>{currentModel.label}</span>
            <i className={`fa-solid fa-chevron-${showModels ? "up" : "down"} model-chevron`} />
          </button>

          {showModels && (
            <div className="model-dropdown">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  className={`model-option ${m.id === model ? "active" : ""}`}
                  onClick={() => { setModel(m.id); setShowModels(false); }}
                >
                  <span className="model-option-label">{m.label}</span>
                  <span className="model-option-desc">{m.description}</span>
                  {m.id === model && <i className="fa-solid fa-check model-check" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
