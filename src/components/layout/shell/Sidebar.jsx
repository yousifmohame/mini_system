import React, { useState } from "react";
import { useAppStore } from "../../../stores/useAppStore";
import { clsx } from "clsx";
import AccessControl from "../../AccessControl";
import { useAuth } from "../../../context/AuthContext";
import { usePermissionBuilder } from "../../../context/PermissionBuilderContext";

import {
  LayoutDashboard, Users, FileText, FolderOpen, BrainCircuit,
  Wallet, Building2, Handshake, UserCog, Map as MapIcon,
  BarChart3, ScrollText, Cpu, Laptop, Award, Globe,
  Settings, FileSliders, Sliders, Zap, ChevronDown, CircleDot,
  ShieldCheck, FileSignature, AlertCircle, CheckSquare, Target
} from "lucide-react";

// تم إبقاء المصفوفة في حال احتجت لها لاحقاً للربط الديناميكي
const MENU_CATEGORIES = [
  // ... (محتويات المصفوفة السابقة) ...
];

const Sidebar = () => {
  const { activeScreenId, openScreen } = useAppStore();
  const [openCategories, setOpenCategories] = useState(["CAT_CLIENTS", "CAT_TRANSACTIONS", "CAT_HR"]);

  const { user } = useAuth();
  const { isBuildMode } = usePermissionBuilder();
  const userPermissions = user?.permissions || [];
  
  const isSuperAdmin = user?.email === "admin@wms.com";

  const toggleCategory = (categoryId) => {
    setOpenCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <aside className="w-[280px] bg-slate-900 text-white flex flex-col h-screen fixed right-0 top-0 z-40 shadow-2xl direction-rtl border-l border-slate-800">
      {/* 1. الشعار (Header) */}
      <div className="h-[60px] flex items-center justify-center border-b border-slate-800 bg-slate-950 shadow-sm shrink-0">
        <div className="flex items-center gap-3 font-bold text-lg tracking-wide text-slate-100">
          <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/40">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span>النظام الهندسي ERP</span>
        </div>
      </div>

      {/* 2. القائمة (Navigation) - تم التحديث بالكود الجديد */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar-slim py-1">
        <div className="mb-0.5" style={{ backgroundColor: 'transparent' }}>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors bg-wms-surface-2 text-wms-text border-l-2 border-wms-blue" style={{ fontSize: '13px', fontWeight: 600, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(37, 99, 235, 0.12)', color: 'var(--wms-accent-blue)' }}>1</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard w-4 h-4 shrink-0"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg>
            <span className="truncate">لوحة التحكم</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>2</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gauge w-4 h-4 shrink-0"><path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path></svg>
            <span className="truncate">مركز التحكم المالي</span>
          </button>
        </div>

        <div className="mb-0.5" style={{ backgroundColor: 'rgba(37, 99, 235, 0.03)' }}>
          <button className="w-full flex items-center justify-between px-4 py-1.5 hover:text-wms-text-sec cursor-pointer" style={{ fontSize: '11px', fontWeight: 600, color: 'rgb(37, 99, 235)' }}>
            <span>المعاملات</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down w-3 h-3 transition-transform"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>3</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin w-4 h-4 shrink-0"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span className="truncate">قطاع الوسط</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>4</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up w-4 h-4 shrink-0"><path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path></svg>
            <span className="truncate">قطاع الشمال</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>5</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down w-4 h-4 shrink-0"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg>
            <span className="truncate">قطاع الجنوب</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>6</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right w-4 h-4 shrink-0"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            <span className="truncate">قطاع الشرق</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>7</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left w-4 h-4 shrink-0"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
            <span className="truncate">قطاع الغرب</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>8</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layers w-4 h-4 shrink-0"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"></path><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"></path><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"></path></svg>
            <span className="truncate">كل القطاعات</span>
          </button>
        </div>

        <div className="mb-0.5" style={{ backgroundColor: 'rgba(34, 197, 94, 0.03)' }}>
          <button className="w-full flex items-center justify-between px-4 py-1.5 hover:text-wms-text-sec cursor-pointer" style={{ fontSize: '11px', fontWeight: 600, color: 'rgb(22, 163, 74)' }}>
            <span>التسويات</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down w-3 h-3 transition-transform"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>9</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-handshake w-4 h-4 shrink-0"><path d="m11 17 2 2a1 1 0 1 0 3-3"></path><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"></path><path d="m21 3 1 11h-2"></path><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"></path><path d="M3 4h8"></path></svg>
            <span className="truncate">تسوية الوسطاء</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>10</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-check w-4 h-4 shrink-0"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
            <span className="truncate">تسوية المعقبين</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>11</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-4 h-4 shrink-0"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span className="truncate">تسوية أرباح الشركاء</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>12</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star w-4 h-4 shrink-0"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
            <span className="truncate">تسويات أصحاب المصلحة</span>
          </button>
        </div>

        <div className="mb-0.5" style={{ backgroundColor: 'rgba(245, 158, 11, 0.03)' }}>
          <button className="w-full flex items-center justify-between px-4 py-1.5 hover:text-wms-text-sec cursor-pointer" style={{ fontSize: '11px', fontWeight: 600, color: 'rgb(217, 119, 6)' }}>
            <span>الماليات التشغيلية</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down w-3 h-3 transition-transform"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>13</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-receipt w-4 h-4 shrink-0"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 17.5v-11"></path></svg>
            <span className="truncate">مصروفات المكتب</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>14</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-vault w-4 h-4 shrink-0"><rect width="18" height="18" x="3" y="3" rx="2"></rect><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle><path d="m7.9 7.9 2.7 2.7"></path><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle><path d="m13.4 10.6 2.7-2.7"></path><circle cx="7.5" cy="16.5" r=".5" fill="currentColor"></circle><path d="m7.9 16.1 2.7-2.7"></path><circle cx="16.5" cy="16.5" r=".5" fill="currentColor"></circle><path d="m13.4 13.4 2.7 2.7"></path><circle cx="12" cy="12" r="2"></circle></svg>
            <span className="truncate">الخزنة</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>15</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-landmark w-4 h-4 shrink-0"><line x1="3" x2="21" y1="22" y2="22"></line><line x1="6" x2="6" y1="18" y2="11"></line><line x1="10" x2="10" y1="18" y2="11"></line><line x1="14" x2="14" y1="18" y2="11"></line><line x1="18" x2="18" y1="18" y2="11"></line><polygon points="12 2 20 7 4 7"></polygon></svg>
            <span className="truncate">الحسابات البنكية</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>16</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallet w-4 h-4 shrink-0"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path></svg>
            <span className="truncate">إدارة الصرف</span>
          </button>
        </div>

        <div className="mb-0.5" style={{ backgroundColor: 'rgba(124, 58, 237, 0.03)' }}>
          <button className="w-full flex items-center justify-between px-4 py-1.5 hover:text-wms-text-sec cursor-pointer" style={{ fontSize: '11px', fontWeight: 600, color: 'rgb(124, 58, 237)' }}>
            <span>المكاتب المتعاونة</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down w-3 h-3 transition-transform"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>17</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase w-4 h-4 shrink-0"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path><rect width="20" height="14" x="2" y="6" rx="2"></rect></svg>
            <span className="truncate">حسابات أتعاب المكاتب</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>18</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building2 lucide-building-2 w-4 h-4 shrink-0"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path><path d="M10 6h4"></path><path d="M10 10h4"></path><path d="M10 14h4"></path><path d="M10 18h4"></path></svg>
            <span className="truncate">بروفايلات المكاتب المتعاونة</span>
          </button>
        </div>

        <div className="mb-0.5" style={{ backgroundColor: 'rgba(100, 116, 139, 0.03)' }}>
          <button className="w-full flex items-center justify-between px-4 py-1.5 hover:text-wms-text-sec cursor-pointer" style={{ fontSize: '11px', fontWeight: 600, color: 'rgb(100, 116, 139)' }}>
            <span>الإعدادات</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down w-3 h-3 transition-transform"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>19</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pinned w-4 h-4 shrink-0"><path d="M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 0 1-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0 1 12 0"></path><circle cx="12" cy="8" r="2"></circle><path d="M8.714 14h-3.71a1 1 0 0 0-.948.683l-2.004 6A1 1 0 0 0 3 22h18a1 1 0 0 0 .948-1.316l-2-6a1 1 0 0 0-.949-.684h-3.712"></path></svg>
            <span className="truncate">إعدادات الأحياء والقطاعات</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>20</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock w-4 h-4 shrink-0"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span className="truncate">إعدادات التأخير</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>21</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calculator w-4 h-4 shrink-0"><rect width="16" height="20" x="4" y="2" rx="2"></rect><line x1="8" x2="16" y1="6" y2="6"></line><line x1="16" x2="16" y1="14" y2="18"></line><path d="M16 10h.01"></path><path d="M12 10h.01"></path><path d="M8 10h.01"></path><path d="M12 14h.01"></path><path d="M8 14h.01"></path><path d="M12 18h.01"></path><path d="M8 18h.01"></path></svg>
            <span className="truncate">إعدادات التقدير الضريبي</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>22</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link2 lucide-link-2 w-4 h-4 shrink-0"><path d="M9 17H7A5 5 0 0 1 7 7h2"></path><path d="M15 7h2a5 5 0 1 1 0 10h-2"></path><line x1="8" x2="16" y1="12" y2="12"></line></svg>
            <span className="truncate">بوابة الربط</span>
          </button>
        </div>

        <div className="mb-0.5" style={{ backgroundColor: 'rgba(217, 119, 6, 0.03)' }}>
          <button className="w-full flex items-center justify-between px-4 py-1.5 hover:text-wms-text-sec cursor-pointer" style={{ fontSize: '11px', fontWeight: 600, color: 'rgb(217, 119, 6)' }}>
            <span>حسابات خاصة</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down w-3 h-3 transition-transform"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>23</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-user w-4 h-4 shrink-0"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="10" r="3"></circle><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path></svg>
            <span className="truncate">حسابات العبودي</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>24</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-user w-4 h-4 shrink-0"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="10" r="3"></circle><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path></svg>
            <span className="truncate">حسابات إبراهيم الراجحي</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>25</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-user w-4 h-4 shrink-0"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="10" r="3"></circle><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path></svg>
            <span className="truncate">حسابات أحمد طلعت</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>26</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-user w-4 h-4 shrink-0"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="10" r="3"></circle><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path></svg>
            <span className="truncate">حسابات محمد فؤاد</span>
          </button>
        </div>

        <div className="mb-0.5" style={{ backgroundColor: 'rgba(14, 165, 233, 0.03)' }}>
          <button className="w-full flex items-center justify-between px-4 py-1.5 hover:text-wms-text-sec cursor-pointer" style={{ fontSize: '11px', fontWeight: 600, color: 'rgb(14, 165, 233)' }}>
            <span>السجلات</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down w-3 h-3 transition-transform"><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-wms-text-sec hover:bg-wms-surface-2/50 hover:text-wms-text" style={{ fontSize: '13px', fontWeight: 400, height: '32px' }}>
            <span className="flex items-center justify-center shrink-0 rounded" style={{ width: '16px', height: '16px', fontSize: '8px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.08)', color: 'var(--wms-text-muted)' }}>27</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-user w-4 h-4 shrink-0"><path d="M15 13a3 3 0 1 0-6 0"></path><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path><circle cx="12" cy="8" r="2"></circle></svg>
            <span className="truncate">سجل الأشخاص</span>
          </button>
        </div>
      </nav>
      
      {/* الفوتر الخاص بالقائمة */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 text-center">
        <div className="text-[10px] text-slate-500 font-mono">Master List v2.0 (Static)</div>
      </div>
    </aside>
  );
};

export default Sidebar;