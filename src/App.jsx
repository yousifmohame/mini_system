import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useAppStore } from "./stores/useAppStore";
import { Toaster } from "sonner";

// --- Components (Layout & Shell) ---
import Sidebar from "./components/layout/shell/Sidebar";
import GlobalScreenTabs from "./components/layout/shell/GlobalScreenTabs";
import ScreenHeader from "./components/layout/shell/ScreenHeader";
import SystemFooter from "./components/layout/shell/SystemFooter";
import ServerSettings from "./components/ServerSettings";

// --- Pages / Screens ---
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TransactionsPage from "./pages/Transactions/TransactionContinu/TransactionsPage"; // 👈 استيراد صفحة المعاملات الجديدة
import BrokerSettlementsPage from "./pages/BrokerSettlementsPage";
import AgentSettlementsPage from "./pages/AgentSettlementsPage";
import PartnerSettlementsPage from "./pages/PartnerSettlementsPage";
import StakeholderSettlementsPage from "./pages/StakeholderSettlementsPage";
import CoopOfficesProfiles from "./pages/CoopOfficesProfiles";
import CoopOfficesFeesPage from "./pages/CoopOfficesFeesPage";
import OfficeExpensesPage from "./pages/OfficeExpensesPage";
import TreasuryPage from "./pages/TreasuryPage";
import BankAccountsPage from "./pages/BankAccountsPage";
import DisbursementsPage from "./pages/DisbursementsPage";
import PersonsDirectoryPage from "./pages/PersonsDirectoryPage";
import RiyadhDivisionScreen from "./pages/Riyadh/RiyadhDivisionScreen";
import FinancialDashboardPage from "./pages/FinancialDashboardPage";
import RemoteWorkAccountsPage from "./pages/RemoteWorkAccountsPage";
import SettingsPage from "./pages/SettingsPage";
import { ScreenSpecialAccount } from "./pages/ScreenSpecialAccount"; // تأكد من مسار الاستيراد
import MonthlySettlementPage from "./pages/MonthlySettlementPage";
import OutsourceSalariesPage from "./pages/OutsourceSalariesPage";
import ScreenPersonStatement from "./pages/ScreenPersonStatement";
import {ScreenQuickEntry} from "./pages/ScreenQuickEntry";
import ClientsScreenWrapper from "./pages/Clients/ClientsScreenWrapper";
import QuickLinksScreen from "./pages/QuickLinksScreen";

// --- Icons & Context ---
import { Wrench } from "lucide-react";
import SystemHeader from "./components/layout/shell/SystemHeader";
import { PermissionBuilderProvider } from "./context/PermissionBuilderContext";
import PermissionBuilderToolbar from "./components/PermissionBuilderToolbar";

const queryClient = new QueryClient();

// ==========================================
// 👈 مكون شاشة "قيد التطوير" (Coming Soon)
// ==========================================
const ComingSoonScreen = ({ screenId }) => (
  <div className="flex-1 flex flex-col items-center justify-center bg-[#f3f4f6] p-6 text-center h-full animate-in fade-in duration-500">
    <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm max-w-md w-full relative overflow-hidden">
      {/* تأثيرات خلفية خفيفة */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-50 rounded-tr-full -z-10"></div>

      <div className="w-20 h-20 bg-blue-50 border-8 border-white shadow-sm text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
        <Wrench size={32} className="animate-[spin_4s_linear_infinite]" />
      </div>

      <h2 className="text-2xl font-black text-slate-800 mb-2">
        هذه الشاشة قيد التطوير
      </h2>
      <p className="text-slate-500 mb-6 text-sm leading-relaxed">
        نحن نعمل بجد لإتاحة هذه الميزة في التحديثات القادمة للنظام. شكراً لثقتكم
        وتفهمكم.
      </p>

      <div className="inline-flex flex-col gap-1 items-center">
        <div className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-widest font-mono border border-slate-200">
          Coming Soon
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-2">
          Screen Code: {screenId || "UNKNOWN"}
        </div>
      </div>
    </div>
  </div>
);

const AppContent = () => {
  const { user, loading } = useAuth();
  const { activeScreenId, openScreens } = useAppStore();

  // 💡 التعديل 2: جلب بيانات الشاشة النشطة حالياً
  const activeScreen = openScreens.find((s) => s.id === activeScreenId);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-sm font-medium">
          جاري تحميل النظام...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // 👈 إضافة TXN_LIST إلى قائمة الشاشات المبرمجة
  const implementedScreens = [
    "DASH",
    "TXN_LIST",
    "BROKER_SETTLEMENTS",
    "AGENT_SETTLEMENTS",
    "PARTNER_SETTLEMENTS",
    "STAKEHOLDER_SETTLEMENTS",
    "COOP_PROFILES",
    "COOP_FEES",
    "EXPENSES",
    "TREASURY",
    "BANK_ACCOUNTS",
    "PAYMENTS",
    "PEOPLE_RECORDS",
    "SET_ZONES",
    "FINANCE_DASH",
    "REMOTE_WORK",
    "SET_DELAYS",
    "SPECIAL_ACCOUNT",
    "MONTHLY_SETTLEMENTS",
    "PAYMENTSـAUTO",
    "PERSON_SETTLEMENTS",
    "EXPERESS",
    "CLIENTS",
    "SpeedLinks"
  ];
  const isImplemented = implementedScreens.includes(activeScreenId);

  return (
    <div
      className="flex h-screen bg-gray-50 direction-rtl font-sans text-right"
      dir="rtl"
    >
      <Sidebar />

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col mr-[280px] h-screen overflow-hidden bg-[#f3f4f6]">
        {/* ================= Header ================= */}
        <SystemHeader />

        {/* ================= Tabs Strip ================= */}
        <GlobalScreenTabs />

        {/* ================= Main Content Viewport ================= */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {/* إخفاء الهيدر الافتراضي عن شاشة المعاملات لأنها تمتلك هيدر خاص بها */}
          {activeScreenId !== "DASH" &&
            activeScreenId !== "TXN_LIST" &&
            activeScreenId !== "BROKER_SETTLEMENTS" && (
              <div className="shrink-0">
                <ScreenHeader screenId={activeScreenId} />
              </div>
            )}

          <div
            className={`flex-1 overflow-auto scroll-smooth relative h-full ${activeScreenId === "TXN_LIST" ? "p-0" : "p-0 pb-8"}`}
          >
            {/* --- الشاشات المبرمجة --- */}

            {/* 1. لوحة التحكم */}
            <div
              className={activeScreenId === "DASH" ? "block h-full" : "hidden"}
            >
              <Dashboard />
            </div>

            {/* 2. صفحة المعاملات (النظام الداخلي) */}
            <div
              className={
                activeScreenId === "TXN_LIST" ? "block h-full" : "hidden"
              }
            >
              <TransactionsPage />
            </div>

            <div
              className={
                activeScreenId === "BROKER_SETTLEMENTS"
                  ? "block h-full"
                  : "hidden"
              }
            >
              <BrokerSettlementsPage />
            </div>
            <div
              className={
                activeScreenId === "AGENT_SETTLEMENTS"
                  ? "block h-full"
                  : "hidden"
              }
            >
              <AgentSettlementsPage />
            </div>

            <div
              className={
                activeScreenId === "PARTNER_SETTLEMENTS"
                  ? "block h-full"
                  : "hidden"
              }
            >
              <PartnerSettlementsPage />
            </div>

            <div
              className={
                activeScreenId === "STAKEHOLDER_SETTLEMENTS"
                  ? "block h-full"
                  : "hidden"
              }
            >
              <StakeholderSettlementsPage />
            </div>

            <div
              className={
                activeScreenId === "COOP_PROFILES" ? "block h-full" : "hidden"
              }
            >
              <CoopOfficesProfiles />
            </div>

            <div
              className={
                activeScreenId === "COOP_FEES" ? "block h-full" : "hidden"
              }
            >
              <CoopOfficesFeesPage />
            </div>

            <div
              className={
                activeScreenId === "EXPENSES" ? "block h-full" : "hidden"
              }
            >
              <OfficeExpensesPage />
            </div>

            <div
              className={
                activeScreenId === "TREASURY" ? "block h-full" : "hidden"
              }
            >
              <TreasuryPage />
            </div>
            <div
              className={
                activeScreenId === "BANK_ACCOUNTS" ? "block h-full" : "hidden"
              }
            >
              <BankAccountsPage />
            </div>

            <div
              className={
                activeScreenId === "PAYMENTS" ? "block h-full" : "hidden"
              }
            >
              <DisbursementsPage />
            </div>

            <div
              className={
                activeScreenId === "PEOPLE_RECORDS" ? "block h-full" : "hidden"
              }
            >
              <PersonsDirectoryPage />
            </div>

            <div
              className={
                activeScreenId === "SET_ZONES" ? "block h-full" : "hidden"
              }
            >
              <RiyadhDivisionScreen />
            </div>

            <div
              className={
                activeScreenId === "FINANCE_DASH" ? "block h-full" : "hidden"
              }
            >
              <FinancialDashboardPage />
            </div>

            <div
              className={
                activeScreenId === "REMOTE_WORK" ? "block h-full" : "hidden"
              }
            >
              <RemoteWorkAccountsPage />
            </div>

            <div
              className={
                activeScreenId === "SET_DELAYS" ? "block h-full" : "hidden"
              }
            >
              <SettingsPage />
            </div>

            {/* 💡 تم تمرير accountName من خصائص الشاشة النشطة */}
            <div
              className={
                activeScreenId === "SPECIAL_ACCOUNT" ? "block h-full" : "hidden"
              }
            >
              {activeScreenId === "SPECIAL_ACCOUNT" && (
                <ScreenSpecialAccount
                  accountName={activeScreen?.props?.accountName || "حساب خاص"}
                />
              )}
            </div>

            <div
              className={
                activeScreenId === "MONTHLY_SETTLEMENTS"
                  ? "block h-full"
                  : "hidden"
              }
            >
              <MonthlySettlementPage />
            </div>

            <div
              className={
                activeScreenId === "PAYMENTSـAUTO" ? "block h-full" : "hidden"
              }
            >
              <OutsourceSalariesPage />
            </div>

            <div
              className={
                activeScreenId === "PERSON_SETTLEMENTS" ? "block h-full" : "hidden"
              }
            >
              <ScreenPersonStatement />
            </div>

            <div
              className={
                activeScreenId === "EXPERESS" ? "block h-full" : "hidden"
              }
            >
              <ScreenQuickEntry />
            </div>

            <div
              className={
                activeScreenId === "CLIENTS" ? "block h-full" : "hidden"
              }
            >
              <ClientsScreenWrapper />
            </div>

            <div
              className={
                activeScreenId === "SpeedLinks" ? "block h-full" : "hidden"
              }
            >
              <QuickLinksScreen />
            </div>

            {/* --- شاشة Fallback لأي كود غير مبرمج --- */}
            {!isImplemented && (
              <div className="block h-full">
                <ComingSoonScreen screenId={activeScreenId} />
              </div>
            )}
          </div>
        </main>

        {/* إخفاء الفوتر الافتراضي من صفحة المعاملات لتأخذ المساحة كاملة */}
        {activeScreenId !== "TXN_LIST" && <SystemFooter />}
      </div>

      <Toaster richColors position="top-center" />
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PermissionBuilderProvider>
          <AppContent />
          <PermissionBuilderToolbar />
        </PermissionBuilderProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
