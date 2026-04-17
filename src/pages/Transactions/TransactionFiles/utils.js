import { toast } from "sonner";
import { File, FileText, Image as ImageIcon, FileSpreadsheet, Archive, Video, Music, Code } from "lucide-react";

export const PREDEFINED_ICONS = ["📁", "📎", "📝", "⚙️", "📜", "🪪", "📋", "📐", "📷", "📊", "🔒", "🔑", "🏠", "🏗️"];

export const DEFAULT_CATEGORIES = [
  { id: "cat-1", name: "مرفقات عامة", code: "001", icon: "📎", color: "#3b82f6", order: 1, subFolders: [] },
  { id: "cat-2", name: "مخططات مقترحة", code: "002", icon: "📐", color: "#8b5cf6", order: 2, subFolders: ["dwg", "pdf", "صور ثلاثية الأبعاد"] },
  { id: "cat-3", name: "مستندات ملكية", code: "003", icon: "📜", color: "#f59e0b", order: 3, subFolders: [] },
  { id: "cat-4", name: "هويات وتفويض", code: "004", icon: "🪪", color: "#06b6d4", order: 4, subFolders: [] },
  { id: "cat-5", name: "التقارير الفنية", code: "005", icon: "📊", color: "#10b981", order: 5, subFolders: [] },
];

export const TRANSACTION_PACKAGES = {
  "إصدار رخصة": ["cat-3", "cat-4", "cat-2"],
  "تصحيح وضع": ["cat-3", "cat-5", "cat-1"],
  "نقل ملكية": ["cat-3", "cat-4", "cat-6"],
};

// 💡 13 عمود لضمان التجاوب والسكرول الأفقي بشكل متطابق 100%
export const GRID_COLUMNS = "35px 35px 2fr 1.5fr 1.5fr 1fr 1fr 70px 80px 80px 70px 100px 100px 100px 35px 40px";

export const copyToClipboard = (text, label = "النص") => {
  if (!text) return toast.error("الحقل فارغ لا يوجد شيء لنسخه!");
  navigator.clipboard.writeText(text);
  toast.success("تم النسخ بنجاح! 📋", { description: label });
};

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024, sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export const formatDateWithTime = (dateStr) => {
  if (!dateStr) return { date: "—", time: "" };
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }),
    time: d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
  };
};

export function getFileIcon(type) {
  if (!type) return File;
  const ext = type.toLowerCase();
  if (["pdf"].includes(ext)) return FileText;
  if (["doc", "docx", "txt"].includes(ext)) return FileText;
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return ImageIcon;
  if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet;
  if (["zip", "rar", "7z"].includes(ext)) return Archive;
  if (["mp4", "mkv", "avi"].includes(ext)) return Video;
  if (["mp3", "wav", "ogg"].includes(ext)) return Music;
  if (["html", "css", "js", "json"].includes(ext)) return Code;
  return File;
}

export function getFileColor(type) {
  if (!type) return "#64748b";
  const ext = type.toLowerCase();
  if (["pdf"].includes(ext)) return "#dc2626";
  if (["doc", "docx", "txt"].includes(ext)) return "#2563eb";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "#16a34a";
  if (["xls", "xlsx", "csv"].includes(ext)) return "#15803d";
  if (["zip", "rar", "7z"].includes(ext)) return "#92400e";
  if (["mp4", "mkv", "avi"].includes(ext)) return "#7c3aed";
  if (["mp3", "wav", "ogg"].includes(ext)) return "#db2777";
  if (["html", "css", "js", "json"].includes(ext)) return "#475569";
  return "#64748b";
}

export const getFullUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  let fixedUrl = url;
  if (url.startsWith("/uploads/")) fixedUrl = `/api${url}`;
  const baseUrl = "https://details-worksystem1.com"; // 💡 الدومين والبورت
  return `${baseUrl}${fixedUrl}`;
};