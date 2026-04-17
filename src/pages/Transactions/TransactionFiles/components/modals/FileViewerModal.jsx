import React from "react";
import { X, Download, Printer, Share2, MessageSquare, Mail, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { getFullUrl, getFileIcon, getFileColor, formatFileSize, copyToClipboard } from "../../utils";

export default function FileViewerModal({ file, onClose }) {
  const fileUrl = getFullUrl(file.url);
  const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(file.extension?.toLowerCase());
  const isPdf = file.extension?.toLowerCase() === "pdf";
  const FileIconComponent = getFileIcon(file.extension);
  const iconColor = getFileColor(file.extension);

  const handlePrint = () => {
    const iframe = document.getElementById("print-iframe");
    if (iframe) iframe.contentWindow.print();
    else window.print();
  };

  const handleShare = (method) => toast.info(`مشاركة عبر ${method}`, { description: file.name || file.originalName });

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-[400] animate-in fade-in duration-200" dir="rtl">
      {/* ── Top Toolbar ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <div className="bg-gray-800 p-2 rounded-lg">
            <FileIconComponent size={24} color={iconColor} />
          </div>
          <div>
            <h3 className="font-bold text-base truncate max-w-md" dir="ltr">{file.name || file.originalName}</h3>
            <p className="text-xs text-gray-400 font-mono mt-1">{formatFileSize(file.size)} • {file.extension?.toUpperCase()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-800 rounded-lg p-1 mr-4">
            <button onClick={() => handleShare("WhatsApp")} className="p-2 text-green-400 hover:bg-gray-700 rounded"><MessageSquare size={18} /></button>
            <button onClick={() => handleShare("Email")} className="p-2 text-blue-400 hover:bg-gray-700 rounded"><Mail size={18} /></button>
            <button onClick={() => handleShare("SMS")} className="p-2 text-purple-400 hover:bg-gray-700 rounded"><Smartphone size={18} /></button>
            <button onClick={() => { copyToClipboard(fileUrl, "رابط الملف"); handleShare("Link"); }} className="p-2 text-gray-300 hover:bg-gray-700 rounded"><Share2 size={18} /></button>
          </div>
          <div className="w-px h-6 bg-gray-700 mx-2" />
          {isPdf && (
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-bold">
              <Printer size={16} /> طباعة
            </button>
          )}
          <button onClick={() => window.open(fileUrl, "_blank")} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold">
            <Download size={16} /> تحميل
          </button>
          <button onClick={onClose} className="p-2 ml-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg">
            <X size={24} />
          </button>
        </div>
      </div>
      {/* ── Viewer Content ── */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-8">
        {isPdf ? (
          <iframe id="print-iframe" src={`${fileUrl}#toolbar=0`} className="w-full h-full rounded-xl bg-white shadow-2xl" title={file.name} />
        ) : isImage ? (
          <img src={fileUrl} alt={file.name} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
        ) : (
          <div className="text-center text-white">
            <p className="text-xl font-bold mb-4">لا يمكن معاينة هذا النوع من الملفات داخل النظام</p>
            <button onClick={() => window.open(fileUrl, "_blank")} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">
              تحميل الملف لفتحه
            </button>
          </div>
        )}
      </div>
    </div>
  );
}