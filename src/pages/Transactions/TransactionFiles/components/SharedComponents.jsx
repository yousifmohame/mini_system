import React, { useState } from "react";
import { MessageSquare, Send, Phone, Mail, Copy } from "lucide-react";
import { copyToClipboard } from "../utils";
import { toast } from "sonner";

export const CommunicationBlock = ({ phone, email }) => {
  if (!phone) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <div className="flex items-center justify-center gap-1.5 mt-1 bg-white border border-gray-200 rounded-md py-1 px-1.5 w-max mx-auto shadow-sm">
      <button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${phone}`, "_blank"); }} className="text-green-500 hover:bg-green-100 p-1 rounded" title="واتساب">
        <MessageSquare size={13} />
      </button>
      <button onClick={(e) => { e.stopPropagation(); window.open(`tg://resolve?phone=${phone}`, "_blank"); }} className="text-blue-500 hover:bg-blue-100 p-1 rounded" title="تليجرام">
        <Send size={13} />
      </button>
      <button onClick={(e) => { e.stopPropagation(); window.open(`tel:${phone}`, "_self"); }} className="text-gray-600 hover:bg-gray-200 p-1 rounded" title="اتصال">
        <Phone size={13} />
      </button>
      <button onClick={(e) => { e.stopPropagation(); if (email) window.open(`mailto:${email}`, "_self"); else toast.info("لا يوجد بريد إلكتروني"); }} className={`${email ? "text-red-500 hover:bg-red-100" : "text-gray-300"} p-1 rounded`} title="إيميل">
        <Mail size={13} />
      </button>
    </div>
  );
};

export function CopyableCell({ text, className = "", label = "", isHidden = false }) {
  const [showCopy, setShowCopy] = useState(false);
  const displayText = isHidden ? "••••••••" : text;
  return (
    <div className={`relative group ${className}`} onMouseEnter={() => setShowCopy(true)} onMouseLeave={() => setShowCopy(false)}>
      <span className="truncate block leading-relaxed">{displayText}</span>
      {showCopy && !isHidden && (
        <button onClick={(e) => { e.stopPropagation(); copyToClipboard(text, label); }} className="absolute left-0 top-1/2 -translate-y-1/2 p-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700 z-10">
          <Copy size={10} />
        </button>
      )}
    </div>
  );
}