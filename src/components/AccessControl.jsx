import React from "react";
import { usePermissionBuilder } from "../context/PermissionBuilderContext";
import { usePermissions } from "../hooks/usePermissions";
import { CheckCircle2, ShieldAlert } from "lucide-react"; // أيقونات للتوضيح

const AccessControl = ({ 
  code,         
  name,         
  moduleName,   
  tabName = "عام", 
  type = "action", 
  children,     
  fallback = null 
}) => {
  // 👈 جلب activeRolePermissions لنعرف حالة الزر
  const { isBuilderMode, togglePermission, activeRolePermissions } = usePermissionBuilder();
  const { hasPermission } = usePermissions();

  // ==========================================
  // 1. حالة المدير (وضع بناء الصلاحيات 🏗️)
  // ==========================================
  if (isBuilderMode) {
    // 👈 التحقق هل الصلاحية ممنوحة لهذا الدور؟
    const isAssigned = activeRolePermissions.includes(code);

    // تحديد الألوان بناءً على الحالة
    const borderClass = isAssigned 
      ? "border-emerald-500 bg-emerald-500/20 hover:bg-emerald-500/40" // 🟢 أخضر للممنوح
      : "border-red-500 border-dashed bg-red-500/10 hover:bg-red-500/30"; // 🔴 أحمر لغير الممنوح

    return (
      <div 
        className={`relative group mt-5 inline-block w-full transition-all border-2 rounded-md ${borderClass}`}
        onClick={(e) => {
          e.preventDefault();   
          e.stopPropagation();  
          togglePermission({ code, name, screenName: moduleName, tabName, level: type });
        }}
        title={isAssigned ? "انقر لسحب الصلاحية" : "انقر لمنح الصلاحية"}
      >
        {/* شريط صغير يظهر اسم الصلاحية */}
        <div className={`absolute -top-6 right-0 z-[60] text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none flex items-center gap-1 ${isAssigned ? "bg-emerald-600" : "bg-red-600"}`}>
          {isAssigned ? <CheckCircle2 className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
          {name} ({code})
        </div>

        {/* تعطيل التفاعل مع العنصر الداخلي */}
        <div className="pointer-events-none opacity-90">
          {children}
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. حالة الموظف (الوضع الطبيعي 🏢)
  // ==========================================
  const isAuthorized = hasPermission(code);

  if (!isAuthorized) {
    return fallback;
  }

  return <>{children}</>;
};

export default AccessControl;