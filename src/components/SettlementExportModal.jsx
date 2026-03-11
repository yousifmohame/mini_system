import React, { useState } from "react";
import { X, Download, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import { ReportPreviewModal } from "./ReportPreviewModal";

const PRESETS = ["تقرير مختصر", "تقرير تفصيلي", "تقرير فترة محددة", "تقرير لشخص محدد"];

export function SettlementExportModal({ title, onClose, reportType }) {
  const [selectedPreset, setSelectedPreset] = useState("تقرير تفصيلي");
  const [selectedFormat, setSelectedFormat] = useState("PDF");
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" dir="rtl">
        <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="text-gray-800 text-[15px] font-bold">تصدير — {title}</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-1 rounded-md transition-colors"><X className="w-4 h-4" /></button>
          </div>
          
          <div className="p-5 space-y-6">
            <div>
              <label className="block mb-3 text-gray-700 text-xs font-bold">نموذج التقرير</label>
              <div className="space-y-2">
                {PRESETS.map((p) => (
                  <label key={p} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedPreset === p ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="preset" className="accent-purple-600 w-4 h-4" checked={selectedPreset === p} onChange={() => setSelectedPreset(p)} />
                    <span className="text-gray-800 text-xs font-bold">{p}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block mb-3 text-gray-700 text-xs font-bold">صيغة الملف</label>
              <div className="flex gap-3">
                {["PDF", "Excel"].map((fmt) => (
                  <label key={fmt} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedFormat === fmt ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 text-gray-700"}`}>
                    <input type="radio" name="format" className="hidden" checked={selectedFormat === fmt} onChange={() => setSelectedFormat(fmt)} />
                    <span className="text-sm font-black">{fmt}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50">
            <button onClick={() => setShowPreview(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-xs font-bold">
              <Eye className="w-4 h-4" /> معاينة التقرير
            </button>
            <button onClick={() => { toast.success(`تم تصدير التقرير بصيغة ${selectedFormat}`); onClose(); }} className="flex items-center gap-1.5 px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors text-xs font-bold shadow-sm">
              <Download className="w-4 h-4" /> تحميل
            </button>
          </div>
        </div>
      </div>

      {showPreview && (
        <ReportPreviewModal
          type={reportType || "settlement"}
          title={`${selectedPreset} — ${title}`}
          onClose={() => setShowPreview(false)}
          period="الشهر الحالي"
        />
      )}
    </>
  );
}