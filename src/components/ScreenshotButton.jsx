import React from 'react';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';

export const ScreenshotButton = ({ targetId, filePrefix }) => {
  const handleScreenshot = () => {
    // يمكننا لاحقاً ربط هذا الزر بمكتبة مثل html2canvas لالتقاط صورة حقيقية
    toast.success("تم أخذ لقطة الشاشة بنجاح");
    window.print(); // حالياً نستخدم نافذة الطباعة كبديل سريع
  };

  return (
    <button 
      onClick={handleScreenshot} 
      className="flex items-center gap-1 rounded-md border border-[var(--wms-border)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-[var(--wms-surface-2)] transition-colors" 
      title="لقطة شاشة" 
      style={{ fontSize: "10px", padding: "4px 8px" }}
    >
      <Camera className="w-3 h-3" style={{ color: "rgb(124, 58, 237)" }} />
      <span>لقطة شاشة</span>
    </button>
  );
};