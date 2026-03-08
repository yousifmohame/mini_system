import React, { useState } from "react";
import { useAppStore } from "../../../stores/useAppStore";
import { useAuth } from "../../../context/AuthContext";
import { usePermissionBuilder } from "../../../context/PermissionBuilderContext";

import {
  Building2,
  LayoutDashboard,
  Gauge,
  ChevronDown,
  MapPin,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Layers,
  Handshake,
  UserCheck,
  Users,
  Star,
  Receipt,
  Vault,
  Landmark,
  Wallet,
  Briefcase,
  MapPinned,
  Clock,
  Calculator,
  Link2,
  CircleUser,
  BookUser,
} from "lucide-react";

const Sidebar = () => {
  const { activeScreenId, openScreen } = useAppStore();
  const [openCategories, setOpenCategories] = useState([
    "CAT_CLIENTS",
    "CAT_TRANSACTIONS",
    "CAT_HR",
  ]);

  const { user } = useAuth();
  const { isBuildMode } = usePermissionBuilder();
  const userPermissions = user?.permissions || [];

  const isSuperAdmin = user?.email === "admin@wms.com";

  const toggleCategory = (categoryId) => {
    setOpenCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  // =========================================================
  // دالة لفتح الشاشات في النظام وتحديث الـ GlobalScreenTabs
  // =========================================================
  const handleNavigation = (screenId, screenTitle, screenProps = {}) => {
    // 👈 التعديل هنا: تمرير المتغيرات بشكل منفصل (وليس كـ Object) لكي تتوافق مع الستور
    openScreen(screenId, screenTitle, screenProps);
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

      {/* 2. القائمة (Navigation) */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar-slim py-1">
        {/* ===================== المجموعة الأولى: لوحة التحكم ===================== */}
        <div className="mb-0.5" style={{ backgroundColor: "transparent" }}>
          <button
            onClick={() => handleNavigation("DASH", "لوحة التحكم")}
            className={`w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors ${activeScreenId === "DASH" ? "bg-[var(--wms-surface-2)] text-[var(--wms-text)] border-l-2 border-[var(--wms-accent-blue)]" : "text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)] border-l-2 border-transparent"}`}
            style={{ fontSize: "13px", fontWeight: 600, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(37, 99, 235, 0.12)",
                color: "var(--wms-accent-blue)",
              }}
            >
              1
            </span>
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span className="truncate">لوحة التحكم</span>
          </button>

          <button
            onClick={() =>
              handleNavigation("FINANCE_DASH", "مركز التحكم المالي")
            }
            className={`w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors ${activeScreenId === "FINANCE_DASH" ? "bg-[var(--wms-surface-2)] text-[var(--wms-text)] border-l-2 border-[var(--wms-accent-blue)]" : "text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)] border-l-2 border-transparent"}`}
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              2
            </span>
            <Gauge className="w-4 h-4 shrink-0" />
            <span className="truncate">مركز التحكم المالي</span>
          </button>
        </div>

        {/* ===================== المجموعة الثانية: المعاملات (تم التفعيل) ===================== */}
        <div
          className="mb-0.5"
          style={{ backgroundColor: "rgba(37, 99, 235, 0.03)" }}
        >
          <button
            className="w-full flex items-center justify-between px-4 py-1.5 hover:text-[var(--wms-text-sec)] cursor-pointer"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "rgb(37, 99, 235)",
            }}
          >
            <span>المعاملات</span>
            <ChevronDown className="w-3 h-3 transition-transform" />
          </button>

          <button
            onClick={() =>
              handleNavigation("TXN_LIST", "المعاملات - قطاع الوسط", {
                sector: "وسط",
              })
            }
            className={`w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors ${activeScreenId === "TXN_LIST" ? "bg-[var(--wms-surface-2)] text-[var(--wms-text)]" : "text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"}`}
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              3
            </span>
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">قطاع الوسط</span>
          </button>

          <button
            // 👈 نرسل sector: "شمال"
            onClick={() =>
              handleNavigation("TXN_LIST", "المعاملات - قطاع الشمال", {
                sector: "شمال",
              })
            }
            className={`w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors ${activeScreenId === "TXN_LIST" ? "bg-[var(--wms-surface-2)] text-[var(--wms-text)]" : "text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"}`}
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              4
            </span>
            <ArrowUp className="w-4 h-4 shrink-0" />
            <span className="truncate">قطاع الشمال</span>
          </button>

          <button
            onClick={() =>
              handleNavigation("TXN_LIST", "المعاملات - قطاع الجنوب", {
                sector: "جنوب",
              })
            }
            className={`w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors ${activeScreenId === "TXN_LIST" ? "bg-[var(--wms-surface-2)] text-[var(--wms-text)]" : "text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"}`}
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              5
            </span>
            <ArrowDown className="w-4 h-4 shrink-0" />
            <span className="truncate">قطاع الجنوب</span>
          </button>

          <button
            onClick={() =>
              handleNavigation("TXN_LIST", "المعاملات - قطاع الشرق", {
                sector: "شرق",
              })
            }
            className={`w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors ${activeScreenId === "TXN_LIST" ? "bg-[var(--wms-surface-2)] text-[var(--wms-text)]" : "text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"}`}
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              6
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" />
            <span className="truncate">قطاع الشرق</span>
          </button>

          <button
            onClick={() =>
              handleNavigation("TXN_LIST", "المعاملات - قطاع الغرب", {
                sector: "غرب",
              })
            }
            className={`w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors ${activeScreenId === "TXN_LIST" ? "bg-[var(--wms-surface-2)] text-[var(--wms-text)]" : "text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"}`}
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              7
            </span>
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">قطاع الغرب</span>
          </button>

          <button
            onClick={() =>
              handleNavigation("TXN_LIST", "كل المعاملات", { sector: "الكل" })
            }
            className={`w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors ${activeScreenId === "TXN_LIST" ? "bg-[var(--wms-surface-2)] text-[var(--wms-text)]" : "text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"}`}
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              8
            </span>
            <Layers className="w-4 h-4 shrink-0" />
            <span className="truncate">كل القطاعات</span>
          </button>
        </div>

        {/* ===================== المجموعة الثالثة: التسويات ===================== */}
        <div
          className="mb-0.5"
          style={{ backgroundColor: "rgba(34, 197, 94, 0.03)" }}
        >
          <button
            className="w-full flex items-center justify-between px-4 py-1.5 hover:text-[var(--wms-text-sec)] cursor-pointer"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "rgb(22, 163, 74)",
            }}
          >
            <span>التسويات</span>
            <ChevronDown className="w-3 h-3 transition-transform" />
          </button>
          <button
            onClick={() =>
              handleNavigation("BROKER_SETTLEMENTS", "تسوية الوسطاء")
            }
            className={`w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors ${activeScreenId === "BROKER_SETTLEMENTS" ? "bg-[var(--wms-surface-2)] text-[var(--wms-text)]" : "text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"}`}
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span className="flex items-center justify-center shrink-0 rounded bg-slate-100 text-slate-500 w-4 h-4 text-[8px] font-bold">
              9
            </span>
            <Handshake className="w-4 h-4 shrink-0" />
            <span className="truncate">تسوية الوسطاء</span>
          </button>
          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              10
            </span>
            <UserCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">تسوية المعقبين</span>
          </button>
          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              11
            </span>
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">تسوية أرباح الشركاء</span>
          </button>
          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              12
            </span>
            <Star className="w-4 h-4 shrink-0" />
            <span className="truncate">تسويات أصحاب المصلحة</span>
          </button>
        </div>

        {/* ===================== المجموعة الرابعة: الماليات التشغيلية ===================== */}
        <div
          className="mb-0.5"
          style={{ backgroundColor: "rgba(245, 158, 11, 0.03)" }}
        >
          <button
            className="w-full flex items-center justify-between px-4 py-1.5 hover:text-[var(--wms-text-sec)] cursor-pointer"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "rgb(217, 119, 6)",
            }}
          >
            <span>الماليات التشغيلية</span>
            <ChevronDown className="w-3 h-3 transition-transform" />
          </button>

          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              13
            </span>
            <Receipt className="w-4 h-4 shrink-0" />
            <span className="truncate">مصروفات المكتب</span>
          </button>

          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              14
            </span>
            <Vault className="w-4 h-4 shrink-0" />
            <span className="truncate">الخزنة</span>
          </button>

          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              15
            </span>
            <Landmark className="w-4 h-4 shrink-0" />
            <span className="truncate">الحسابات البنكية</span>
          </button>

          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              16
            </span>
            <Wallet className="w-4 h-4 shrink-0" />
            <span className="truncate">إدارة الصرف</span>
          </button>
        </div>

        {/* ===================== المجموعة الخامسة: المكاتب المتعاونة ===================== */}
        <div
          className="mb-0.5"
          style={{ backgroundColor: "rgba(124, 58, 237, 0.03)" }}
        >
          <button
            className="w-full flex items-center justify-between px-4 py-1.5 hover:text-[var(--wms-text-sec)] cursor-pointer"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "rgb(124, 58, 237)",
            }}
          >
            <span>المكاتب المتعاونة</span>
            <ChevronDown className="w-3 h-3 transition-transform" />
          </button>

          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              17
            </span>
            <Briefcase className="w-4 h-4 shrink-0" />
            <span className="truncate">حسابات أتعاب المكاتب</span>
          </button>

          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              18
            </span>
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="truncate">بروفايلات المكاتب المتعاونة</span>
          </button>
        </div>

        {/* ===================== المجموعة السادسة: الإعدادات ===================== */}
        <div
          className="mb-0.5"
          style={{ backgroundColor: "rgba(100, 116, 139, 0.03)" }}
        >
          <button
            className="w-full flex items-center justify-between px-4 py-1.5 hover:text-[var(--wms-text-sec)] cursor-pointer"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "rgb(100, 116, 139)",
            }}
          >
            <span>الإعدادات</span>
            <ChevronDown className="w-3 h-3 transition-transform" />
          </button>

          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              19
            </span>
            <MapPinned className="w-4 h-4 shrink-0" />
            <span className="truncate">إعدادات الأحياء والقطاعات</span>
          </button>

          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              20
            </span>
            <Clock className="w-4 h-4 shrink-0" />
            <span className="truncate">إعدادات التأخير</span>
          </button>

          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              21
            </span>
            <Calculator className="w-4 h-4 shrink-0" />
            <span className="truncate">إعدادات التقدير الضريبي</span>
          </button>

          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              22
            </span>
            <Link2 className="w-4 h-4 shrink-0" />
            <span className="truncate">بوابة الربط</span>
          </button>
        </div>

        {/* ===================== المجموعة السابعة: حسابات خاصة ===================== */}
        <div
          className="mb-0.5"
          style={{ backgroundColor: "rgba(217, 119, 6, 0.03)" }}
        >
          <button
            className="w-full flex items-center justify-between px-4 py-1.5 hover:text-[var(--wms-text-sec)] cursor-pointer"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "rgb(217, 119, 6)",
            }}
          >
            <span>حسابات خاصة</span>
            <ChevronDown className="w-3 h-3 transition-transform" />
          </button>

          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              23
            </span>
            <CircleUser className="w-4 h-4 shrink-0" />
            <span className="truncate">حسابات العبودي</span>
          </button>

          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              24
            </span>
            <CircleUser className="w-4 h-4 shrink-0" />
            <span className="truncate">حسابات إبراهيم الراجحي</span>
          </button>

          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              25
            </span>
            <CircleUser className="w-4 h-4 shrink-0" />
            <span className="truncate">حسابات أحمد طلعت</span>
          </button>

          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              26
            </span>
            <CircleUser className="w-4 h-4 shrink-0" />
            <span className="truncate">حسابات محمد فؤاد</span>
          </button>
        </div>

        {/* ===================== المجموعة الثامنة: السجلات ===================== */}
        <div
          className="mb-0.5"
          style={{ backgroundColor: "rgba(14, 165, 233, 0.03)" }}
        >
          <button
            className="w-full flex items-center justify-between px-4 py-1.5 hover:text-[var(--wms-text-sec)] cursor-pointer"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "rgb(14, 165, 233)",
            }}
          >
            <span>السجلات</span>
            <ChevronDown className="w-3 h-3 transition-transform" />
          </button>

          <button
            className="w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)]/50 hover:text-[var(--wms-text)]"
            style={{ fontSize: "13px", fontWeight: 400, height: "32px" }}
          >
            <span
              className="flex items-center justify-center shrink-0 rounded"
              style={{
                width: "16px",
                height: "16px",
                fontSize: "8px",
                fontWeight: 700,
                backgroundColor: "rgba(100, 116, 139, 0.08)",
                color: "var(--wms-text-muted)",
              }}
            >
              27
            </span>
            <BookUser className="w-4 h-4 shrink-0" />
            <span className="truncate">سجل الأشخاص</span>
          </button>
        </div>
      </nav>

      {/* الفوتر الخاص بالقائمة */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 text-center shrink-0">
        <div className="text-[10px] text-slate-500 font-mono">
          Master List v2.0 (Dynamic)
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
