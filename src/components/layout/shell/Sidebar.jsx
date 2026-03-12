import React from "react";
import { useAppStore } from "../../../stores/useAppStore";
import { useAuth } from "../../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { usePermissionBuilder } from "../../../context/PermissionBuilderContext";
import AccessControl from "../../AccessControl"; // 👈 1. استيراد أداة التحكم بالصلاحيات
import api from "../../../api/axios";
import {
  Building2,
  LayoutDashboard,
  Gauge,
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
  CircleUser,
  BookUser,
  Workflow,
  Loader2,
  Settings,
  ChevronRight,
} from "lucide-react";

const Sidebar = () => {
  const { activeScreenId, openScreens, openScreen } = useAppStore();
  const activeScreen = openScreens.find((s) => s.id === activeScreenId);

  // 👈 2. جلب بيانات المستخدم والصلاحيات
  const { user } = useAuth();
  const { isBuildMode } = usePermissionBuilder();
  const userPermissions = user?.permissions || [];

  // التحقق مما إذا كان المستخدم هو المدير العام (يُفضل استخدام الإيميل أو الرول)
  const isSuperAdmin = user?.email === "admin@wms.com";

  const handleNavigation = (screenId, screenTitle, screenProps = {}) => {
    openScreen(screenId, screenTitle, screenProps);
  };

  // 💡 جلب أسماء الحسابات الخاصة من إعدادات النظام
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["system-settings-sidebar"],
    queryFn: async () => (await api.get("/settings")).data.data,
  });

  const specialAccounts = settings?.specialAccounts || [];

  // 👈 3. دالة مساعدة للتحقق من صلاحية قسم كامل (لإخفاء العناوين الفارغة)
  const hasSectionAccess = (codes = []) => {
    if (isBuildMode || isSuperAdmin) return true;
    return codes.some((code) => userPermissions.includes(code));
  };

  // 🎨 مكون زر القائمة مع دمج AccessControl
  const NavItem = ({
    screenId,
    title,
    icon: Icon,
    props = {},
    badge = null,
    code, // 👈 كود الصلاحية (مثال: SCR_01_VIEW)
    moduleName, // 👈 اسم الوحدة التنظيمية
  }) => {
    let isActive = activeScreenId === screenId;
    if (isActive && props?.sector) {
      isActive = activeScreen?.props?.sector === props.sector;
    }
    if (isActive && props?.accountName) {
      isActive = activeScreen?.props?.accountName === props.accountName;
    }

    return (
      // 👈 4. تغليف الزر بأداة AccessControl
      <AccessControl
        code={code}
        name={`رؤية شاشة: ${title}`}
        moduleName={moduleName}
        type="screen"
      >
        <button
          onClick={() => handleNavigation(screenId, title, props)}
          className={`group w-full flex items-center justify-between px-4 py-2.5 my-0.5 rounded-xl transition-all duration-200 outline-none ${
            isActive
              ? "bg-gradient-to-l from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 font-bold"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:pl-5 font-medium"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-1.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-white/20"
                  : "bg-slate-100 group-hover:bg-blue-100"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-slate-500 group-hover:text-blue-600"
                }`}
              />
            </div>
            <span className="text-[13px] tracking-tight">{title}</span>
          </div>
          {badge && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {badge}
            </span>
          )}
          {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
        </button>
      </AccessControl>
    );
  };

  // 🎨 مكون عنوان المجموعة (ثابت - غير قابل للنقر)
  const CategoryHeader = ({ title, icon: Icon, count = null }) => (
    <div className="flex items-center justify-between px-4 py-3 mt-4 mb-1">
      <div className="flex items-center gap-2">
        {Icon && (
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200">
            <Icon className="w-3.5 h-3.5 text-slate-500" />
          </div>
        )}
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
      </div>
      {count !== null && (
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
          {count}
        </span>
      )}
    </div>
  );

  return (
    <aside
      className="w-[290px] bg-white text-slate-800 flex flex-col h-screen fixed right-0 top-0 z-50 shadow-2xl direction-rtl border-l border-slate-200/60 select-none"
      dir="rtl"
    >
      {/* ✨ 1. الشعار (Header) */}
      <div className="h-[70px] flex items-center px-6 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-600/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <h1 className="font-black text-[16px] tracking-tight text-white leading-tight">
              نظام الحسابات و المتابعة
            </h1>
            <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">
              Enterprise ERP • v2.0
            </p>
          </div>
        </div>
      </div>

      {/* 🧭 2. القائمة (Navigation) */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar-slim py-4 px-3 scroll-smooth">
        {/* ===================== 🏠 الرئيسية ===================== */}
        {/* 👈 5. إخفاء القسم بالكامل إذا لم يكن لديه أي صلاحية بداخله */}
        {hasSectionAccess(["SCR_DASH_VIEW", "SCR_FINANCE_DASH_VIEW"]) && (
          <div>
            <CategoryHeader title="الرئيسية" icon={LayoutDashboard} />
            <NavItem
              screenId="DASH"
              title="لوحة التحكم"
              icon={LayoutDashboard}
              code="SCR_DASH_VIEW"
              moduleName="الرئيسية"
            />
            <NavItem
              screenId="FINANCE_DASH"
              title="مركز التحكم المالي"
              icon={Gauge}
              badge="Pro"
              code="SCR_FINANCE_DASH_VIEW"
              moduleName="الرئيسية"
            />
          </div>
        )}

        {/* ===================== 💼 إدارة المعاملات ===================== */}
        {hasSectionAccess([
          "SCR_TXN_MID",
          "SCR_TXN_NORTH",
          "SCR_TXN_SOUTH",
          "SCR_TXN_EAST",
          "SCR_TXN_WEST",
          "SCR_TXN_ALL",
        ]) && (
          <div className="border-t border-slate-100 pt-2 mt-2">
            <CategoryHeader title="إدارة المعاملات" icon={MapPin} count={6} />
            <NavItem
              screenId="TXN_LIST"
              title="قطاع الوسط"
              icon={MapPin}
              props={{ sector: "وسط" }}
              code="SCR_TXN_MID"
              moduleName="إدارة المعاملات"
            />
            <NavItem
              screenId="TXN_LIST"
              title="قطاع الشمال"
              icon={ArrowUp}
              props={{ sector: "شمال" }}
              code="SCR_TXN_NORTH"
              moduleName="إدارة المعاملات"
            />
            <NavItem
              screenId="TXN_LIST"
              title="قطاع الجنوب"
              icon={ArrowDown}
              props={{ sector: "جنوب" }}
              code="SCR_TXN_SOUTH"
              moduleName="إدارة المعاملات"
            />
            <NavItem
              screenId="TXN_LIST"
              title="قطاع الشرق"
              icon={ArrowRight}
              props={{ sector: "شرق" }}
              code="SCR_TXN_EAST"
              moduleName="إدارة المعاملات"
            />
            <NavItem
              screenId="TXN_LIST"
              title="قطاع الغرب"
              icon={ArrowLeft}
              props={{ sector: "غرب" }}
              code="SCR_TXN_WEST"
              moduleName="إدارة المعاملات"
            />
            <NavItem
              screenId="TXN_LIST"
              title="🌐 كل القطاعات"
              icon={Layers}
              props={{ sector: "الكل" }}
              code="SCR_TXN_ALL"
              moduleName="إدارة المعاملات"
            />
          </div>
        )}

        {/* ===================== 🤝 نظام التسويات ===================== */}
        {hasSectionAccess([
          "SCR_BROKER_SETTLEMENTS",
          "SCR_AGENT_SETTLEMENTS",
          "SCR_PARTNER_SETTLEMENTS",
          "SCR_MONTHLY_SETTLEMENTS",
          "SCR_PERSON_SETTLEMENTS",
        ]) && (
          <div className="border-t border-slate-100 pt-2 mt-2">
            <CategoryHeader title="نظام التسويات" icon={Handshake} count={5} />
            <NavItem
              screenId="BROKER_SETTLEMENTS"
              title="تسوية الوسطاء"
              icon={Handshake}
              code="SCR_BROKER_SETTLEMENTS"
              moduleName="نظام التسويات"
            />
            <NavItem
              screenId="AGENT_SETTLEMENTS"
              title="تسوية المعقبين"
              icon={UserCheck}
              code="SCR_AGENT_SETTLEMENTS"
              moduleName="نظام التسويات"
            />
            <NavItem
              screenId="PARTNER_SETTLEMENTS"
              title="تسوية أرباح الشركاء"
              icon={Users}
              code="SCR_PARTNER_SETTLEMENTS"
              moduleName="نظام التسويات"
            />
            <NavItem
              screenId="MONTHLY_SETTLEMENTS"
              title="مركز التسوية الشهرية"
              icon={Star}
              code="SCR_MONTHLY_SETTLEMENTS"
              moduleName="نظام التسويات"
            />
            <NavItem
              screenId="PERSON_SETTLEMENTS"
              title="كشف حساب الأشخاص"
              icon={Star}
              code="SCR_PERSON_SETTLEMENTS"
              moduleName="نظام التسويات"
            />
          </div>
        )}

        {/* ===================== 💰 الماليات التشغيلية ===================== */}
        {hasSectionAccess([
          "SCR_EXPENSES",
          "SCR_TREASURY",
          "SCR_BANK_ACCOUNTS",
          "SCR_PAYMENTS",
          "SCR_PAYMENTS_AUTO",
        ]) && (
          <div className="border-t border-slate-100 pt-2 mt-2">
            <CategoryHeader
              title="الماليات التشغيلية"
              icon={Wallet}
              count={5}
            />
            <NavItem
              screenId="EXPENSES"
              title="مصروفات المكتب"
              icon={Receipt}
              code="SCR_EXPENSES"
              moduleName="الماليات التشغيلية"
            />
            <NavItem
              screenId="TREASURY"
              title="الخزنة"
              icon={Vault}
              code="SCR_TREASURY"
              moduleName="الماليات التشغيلية"
            />
            <NavItem
              screenId="BANK_ACCOUNTS"
              title="الحسابات البنكية"
              icon={Landmark}
              code="SCR_BANK_ACCOUNTS"
              moduleName="الماليات التشغيلية"
            />
            <NavItem
              screenId="PAYMENTS"
              title="إدارة الصرف"
              icon={Wallet}
              code="SCR_PAYMENTS"
              moduleName="الماليات التشغيلية"
            />
            <NavItem
              screenId="PAYMENTSـAUTO"
              title="رواتب موظفي الأوتسورس"
              icon={Wallet}
              code="SCR_PAYMENTS_AUTO"
              moduleName="الماليات التشغيلية"
            />
          </div>
        )}

        {/* ===================== 🏢 المكاتب المتعاونة ===================== */}
        {hasSectionAccess([
          "SCR_COOP_FEES",
          "SCR_COOP_PROFILES",
          "SCR_REMOTE_WORK",
        ]) && (
          <div className="border-t border-slate-100 pt-2 mt-2">
            <CategoryHeader
              title="المكاتب المتعاونة"
              icon={Briefcase}
              count={3}
            />
            <NavItem
              screenId="COOP_FEES"
              title="حسابات أتعاب المكاتب"
              icon={Briefcase}
              code="SCR_COOP_FEES"
              moduleName="المكاتب المتعاونة"
            />
            <NavItem
              screenId="COOP_PROFILES"
              title="المكاتب المتعاونة"
              icon={Building2}
              code="SCR_COOP_PROFILES"
              moduleName="المكاتب المتعاونة"
            />
            <NavItem
              screenId="REMOTE_WORK"
              title="حسابات العمل عن بعد"
              icon={Workflow}
              code="SCR_REMOTE_WORK"
              moduleName="المكاتب المتعاونة"
            />
          </div>
        )}

        {/* ===================== 🔐 حسابات خاصة ===================== */}
        {hasSectionAccess(["SCR_SPECIAL_ACCOUNTS"]) && (
          <div className="border-t border-slate-100 pt-2 mt-2">
            <CategoryHeader title="حسابات خاصة" icon={CircleUser} />
            {isLoadingSettings ? (
              <div className="px-4 py-3 text-slate-400 text-xs flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span>جاري تحميل الحسابات...</span>
              </div>
            ) : specialAccounts.length > 0 ? (
              specialAccounts.map((acc, idx) => (
                <NavItem
                  key={idx}
                  screenId="SPECIAL_ACCOUNT"
                  title={acc.systemName}
                  icon={CircleUser}
                  props={{ accountName: acc.reportName }}
                  badge="خاص"
                  code="SCR_SPECIAL_ACCOUNTS" // إعطاء صلاحية موحدة للحسابات الخاصة
                  moduleName="حسابات خاصة"
                />
              ))
            ) : (
              <div className="px-4 py-3 text-slate-400 text-xs bg-slate-50 rounded-lg mx-1">
                لا توجد حسابات مضافة
              </div>
            )}
          </div>
        )}

        {/* ===================== 📁 سجلات النظام ===================== */}
        {hasSectionAccess(["SCR_PEOPLE_RECORDS"]) && (
          <div className="border-t border-slate-100 pt-2 mt-2">
            <CategoryHeader title="سجلات النظام" icon={BookUser} count={1} />
            <NavItem
              screenId="PEOPLE_RECORDS"
              title="سجل الأشخاص"
              icon={BookUser}
              code="SCR_PEOPLE_RECORDS"
              moduleName="سجلات النظام"
            />
          </div>
        )}

        {/* ===================== ⚙️ الإعدادات ===================== */}
        {hasSectionAccess(["SCR_SET_ZONES", "SCR_SET_DELAYS"]) && (
          <div className="border-t border-slate-100 pt-2 mt-2">
            <CategoryHeader title="الإعدادات" icon={Settings} count={2} />
            <NavItem
              screenId="SET_ZONES"
              title="إعدادات الأحياء والقطاعات"
              icon={MapPinned}
              code="SCR_SET_ZONES"
              moduleName="الإعدادات"
            />
            <NavItem
              screenId="SET_DELAYS"
              title="إعدادات النظام"
              icon={Clock}
              code="SCR_SET_DELAYS"
              moduleName="الإعدادات"
            />
          </div>
        )}
      </nav>

      {/* ✨ الفوتر - تصميم احترافي */}
      <div className="p-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/25">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-[13px] font-bold text-slate-800 truncate">
              {user?.name || "مدير النظام"}
            </span>
            <span className="block text-[10px] text-slate-400 font-mono">
              {user?.email || "admin@wms.com"}
            </span>
          </div>
          <div className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100">
            <span className="text-[9px] font-bold text-emerald-600">
              ONLINE
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
