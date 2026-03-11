import React, { useState } from "react";
import { useAppStore } from "../../../stores/useAppStore";
import { useAuth } from "../../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { usePermissionBuilder } from "../../../context/PermissionBuilderContext";
import api from "../../../api/axios";
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
  Workflow,
  Loader2
} from "lucide-react";

const Sidebar = () => {
  const { activeScreenId, openScreens, openScreen } = useAppStore();
  // نجلب الشاشة النشطة حالياً بكل بياناتها (بما فيها القطاع props)
  const activeScreen = openScreens.find((s) => s.id === activeScreenId);

  // التحكم في القوائم المفتوحة افتراضياً
  const [openCategories, setOpenCategories] = useState([
    "CAT_MAIN",
    "CAT_TRANSACTIONS",
    "CAT_SETTLEMENTS",
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

  const handleNavigation = (screenId, screenTitle, screenProps = {}) => {
    openScreen(screenId, screenTitle, screenProps);
  };

  // 💡 جلب أسماء الحسابات الخاصة من إعدادات النظام (Database)
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["system-settings-sidebar"],
    queryFn: async () => (await api.get("/settings")).data.data,
  });

  const specialAccounts = settings?.specialAccounts || [];
  // مكون مساعد (Component) لزر القائمة للحفاظ على تناسق التصميم
  const NavItem = ({ screenId, title, icon: Icon, props = {} }) => {
    // 1. نتأكد أولاً أن معرف الشاشة متطابق
    let isActive = activeScreenId === screenId;

    // 2. إذا كانت الشاشة هي المعاملات (أو أي شاشة تستخدم props)، يجب أن يتطابق القطاع أيضاً لتصبح نشطة
    if (isActive && props.sector) {
      isActive = activeScreen?.props?.sector === props.sector;
    }

    if (isActive && props.accountName)
      isActive = activeScreen?.props?.accountName === props.accountName;

    return (
      <button
        onClick={() => handleNavigation(screenId, title, props)}
        className={`w-full flex items-center gap-3 px-5 py-2.5 transition-all duration-200 outline-none ${
          isActive
            ? "bg-blue-600/20 text-blue-600 border-r-2 border-blue-600 font-semibold"
            : "text-slate-800 hover:bg-slate-800/50 hover:text-slate-100 border-r-2 border-transparent font-medium"
        }`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-blue-400" : "text-slate-500"}`}
        />
        <span className="text-[13px] tracking-wide truncate">{title}</span>
      </button>
    );
  };

  // مكون مساعد لعنوان المجموعة (Category Header)
  const CategoryHeader = ({ id, title, defaultOpen = false }) => {
    const isOpen = openCategories.includes(id);
    return (
      <button
        onClick={() => toggleCategory(id)}
        className="w-full flex items-center justify-between px-5 py-3 mt-1 group outline-none"
      >
        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase group-hover:text-slate-300 transition-colors">
          {title}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
    );
  };

  return (
    <aside className="w-[280px] bg-[#fff] text-slate-800 flex flex-col h-screen fixed right-0 top-0 z-40 shadow-2xl direction-rtl border-l border-slate-800/60 select-none">
      {/* 1. الشعار (Header) */}
      <div className="h-[65px] flex items-center px-6 border-b border-slate-800/80 bg-[#020617] shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-lg shadow-blue-900/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[15px] tracking-wide text-white leading-tight">
              النظام الهندسي
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              Enterprise ERP
            </p>
          </div>
        </div>
      </div>

      {/* 2. القائمة (Navigation) */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar-slim py-3 scroll-smooth">
        {/* ===================== المجموعة الأولى: الرئيسية ===================== */}
        <div className="mb-2">
          <NavItem screenId="DASH" title="لوحة التحكم" icon={LayoutDashboard} />
          <NavItem
            screenId="FINANCE_DASH"
            title="مركز التحكم المالي"
            icon={Gauge}
          />
        </div>

        {/* ===================== المجموعة الثانية: المعاملات ===================== */}
        <div className="mb-1 border-t border-slate-800/50 pt-1">
          <CategoryHeader id="CAT_TRANSACTIONS" title="إدارة المعاملات" />

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${openCategories.includes("CAT_TRANSACTIONS") ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            <NavItem
              screenId="TXN_LIST"
              title="قطاع الوسط"
              icon={MapPin}
              props={{ sector: "وسط" }}
            />
            <NavItem
              screenId="TXN_LIST"
              title="قطاع الشمال"
              icon={ArrowUp}
              props={{ sector: "شمال" }}
            />
            <NavItem
              screenId="TXN_LIST"
              title="قطاع الجنوب"
              icon={ArrowDown}
              props={{ sector: "جنوب" }}
            />
            <NavItem
              screenId="TXN_LIST"
              title="قطاع الشرق"
              icon={ArrowRight}
              props={{ sector: "شرق" }}
            />
            <NavItem
              screenId="TXN_LIST"
              title="قطاع الغرب"
              icon={ArrowLeft}
              props={{ sector: "غرب" }}
            />
            <NavItem
              screenId="TXN_LIST"
              title="كل القطاعات"
              icon={Layers}
              props={{ sector: "الكل" }}
            />
          </div>
        </div>

        {/* ===================== المجموعة الثالثة: التسويات ===================== */}
        <div className="mb-1 border-t border-slate-800/50 pt-1">
          <CategoryHeader id="CAT_SETTLEMENTS" title="نظام التسويات" />

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${openCategories.includes("CAT_SETTLEMENTS") ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            <NavItem
              screenId="BROKER_SETTLEMENTS"
              title="تسوية الوسطاء"
              icon={Handshake}
            />
            <NavItem
              screenId="AGENT_SETTLEMENTS"
              title="تسوية المعقبين"
              icon={UserCheck}
            />
            <NavItem
              screenId="PARTNER_SETTLEMENTS"
              title="تسوية أرباح الشركاء"
              icon={Users}
            />
            <NavItem
              screenId="STAKEHOLDER_SETTLEMENTS"
              title="تسويات أصحاب المصلحة"
              icon={Star}
            />
          </div>
        </div>

        {/* ===================== المجموعة الرابعة: الماليات التشغيلية ===================== */}
        <div className="mb-1 border-t border-slate-800/50 pt-1">
          <CategoryHeader id="CAT_FINANCE" title="الماليات التشغيلية" />

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${openCategories.includes("CAT_FINANCE") ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            <NavItem
              screenId="EXPENSES"
              title="مصروفات المكتب"
              icon={Receipt}
            />
            <NavItem screenId="TREASURY" title="الخزنة" icon={Vault} />
            <NavItem
              screenId="BANK_ACCOUNTS"
              title="الحسابات البنكية"
              icon={Landmark}
            />
            <NavItem screenId="PAYMENTS" title="إدارة الصرف" icon={Wallet} />
          </div>
        </div>

        {/* ===================== المجموعة الخامسة: المكاتب المتعاونة ===================== */}
        <div className="mb-1 border-t border-slate-800/50 pt-1">
          <CategoryHeader id="CAT_PARTNERS" title="المكاتب المتعاونة" />

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${openCategories.includes("CAT_PARTNERS") ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            <NavItem
              screenId="COOP_FEES"
              title="حسابات أتعاب المكاتب"
              icon={Briefcase}
            />
            <NavItem
              screenId="COOP_PROFILES"
              title="بروفايلات المكاتب"
              icon={Building2}
            />
            <NavItem
              screenId="REMOTE_WORK"
              title="حسابات العمل عن بعد"
              icon={Workflow}
            />
          </div>
        </div>

        {/* ===================== المجموعة السادسة: حسابات خاصة ===================== */}
        <div className="mb-1 border-t border-slate-800/50 pt-1">
          <CategoryHeader id="CAT_SPECIAL" title="حسابات خاصة" />
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${openCategories.includes("CAT_SPECIAL") ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            {isLoadingSettings ? (
              <div className="px-5 py-2 text-slate-500 text-xs flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> جاري تحميل
                الحسابات...
              </div>
            ) : specialAccounts.length > 0 ? (
              specialAccounts.map((acc, idx) => (
                <NavItem
                  key={idx}
                  // نستخدم شاشة موحدة اسمها SPECIAL_ACCOUNT
                  screenId="SPECIAL_ACCOUNT"
                  title={acc.systemName} // الاسم الذي يظهر في القائمة
                  icon={CircleUser}
                  props={{ accountName: acc.reportName }} // نمرر اسم العرض كـ prop للشاشة
                />
              ))
            ) : (
              <div className="px-5 py-2 text-slate-500 text-xs">
                لا توجد حسابات مضافة
              </div>
            )}
          </div>
        </div>

        {/* ===================== المجموعة السابعة: السجلات ===================== */}
        <div className="mb-1 border-t border-slate-800/50 pt-1">
          <CategoryHeader id="CAT_RECORDS" title="سجلات النظام" />

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${openCategories.includes("CAT_RECORDS") ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            <NavItem
              screenId="PEOPLE_RECORDS"
              title="سجل الأشخاص"
              icon={BookUser}
            />
          </div>
        </div>

        {/* ===================== المجموعة الثامنة: الإعدادات ===================== */}
        <div className="mb-4 border-t border-slate-800/50 pt-1">
          <CategoryHeader id="CAT_SETTINGS" title="الإعدادات" />

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${openCategories.includes("CAT_SETTINGS") ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            <NavItem
              screenId="SET_ZONES"
              title="إعدادات الأحياء والقطاعات"
              icon={MapPinned}
            />
            <NavItem
              screenId="SET_DELAYS"
              title="إعدادات النظام"
              icon={Clock}
            />
            
          </div>
        </div>
      </nav>

      {/* الفوتر الخاص بالقائمة */}
      <div className="p-4 border-t border-slate-800/80 bg-[#020617] shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-300 font-bold text-xs">
            {user?.email ? user.email.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-200 truncate w-[160px]">
              {user?.name || "مدير النظام"}
            </span>
            <span className="text-[10px] text-slate-500 font-mono truncate w-[160px]">
              v2.0 (Stable)
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
