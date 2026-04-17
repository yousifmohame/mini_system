import React, { useState } from "react";
import { Copy } from "lucide-react";
import { copyToClipboard } from "../utils";

export default function CopyableCell({ text, className = "", label = "" }) {
  const [showCopy, setShowCopy] = useState(false);
  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setShowCopy(true)}
      onMouseLeave={() => setShowCopy(false)}
    >
      <span className="truncate block">{text}</span>
      {showCopy && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(text, label);
          }}
          className="absolute left-1 top-1/2 -translate-y-1/2 p-1 bg-blue-600 text-white rounded shadow-md hover:bg-blue-700 transition-colors z-10"
        >
          <Copy size={12} />
        </button>
      )}
    </div>
  );
}