import React from "react";
import { useAppStore } from "../../stores/useAppStore";
import ClientsDashboard from "./ClientsDashboard";
import CreateClientWizard from "./CreateClientWizard";
import ClientsLog from "./ClientsLog";
import ClientFileView from "./ClientFileView";
// 👇 1. استيراد اللوحات الجديدة التي قمنا بإنشائها
import ClientsRatingsPanel from "./ClientsRatingsPanel";
import ClientsDocsPanel from "./ClientsDocsPanel";

const ClientsScreenWrapper = () => {
  const screenId = "300-MAIN";

  const { activeTabPerScreen, setActiveTab, addTab, removeTab } = useAppStore();
  const activeTabId = activeTabPerScreen[screenId] || "DASHBOARD_CLIENTS";

  // 👇 2. تحديث دالة التنقل لدعم التابات الجديدة
  const handleNavigate = (targetId) => {
    switch (targetId) {
      case "NEW_CLIENT_TAB":
        addTab(screenId, {
          id: "NEW_CLIENT_TAB",
          title: "إنشاء عميل جديد",
          type: "wizard",
          closable: true,
        });
        setActiveTab(screenId, "NEW_CLIENT_TAB");
        break;
      case "300-MAIN":
        addTab(screenId, {
          id: "300-MAIN",
          title: "دليل العملاء",
          type: "list",
          closable: true,
        });
        setActiveTab(screenId, "300-MAIN");
        break;
      case "CLIENTS_RATINGS":
        addTab(screenId, {
          id: "CLIENTS_RATINGS",
          title: "تقييمات وتصنيفات",
          type: "panel",
          closable: true,
        });
        setActiveTab(screenId, "CLIENTS_RATINGS");
        break;
      case "CLIENTS_DOCS":
        addTab(screenId, {
          id: "CLIENTS_DOCS",
          title: "وثائق العملاء المركزية",
          type: "panel",
          closable: true,
        });
        setActiveTab(screenId, "CLIENTS_DOCS");
        break;
      default:
        setActiveTab(screenId, targetId);
    }
  };

  const renderContent = () => {
    // حالة: إنشاء عميل جديد
    if (activeTabId === "NEW_CLIENT_TAB") {
      return (
        <CreateClientWizard
          onComplete={() => {
            removeTab(screenId, "NEW_CLIENT_TAB");
            handleNavigate("300-MAIN");
          }}
        />
      );
    }

    // حالة: دليل العملاء
    if (activeTabId === "300-MAIN") {
      return (
        <ClientsLog
          onOpenDetails={(clientId, clientCode) => {
            const tabId = `CLIENT-${clientId}`;
            addTab(screenId, {
              id: tabId,
              title: `ملف: ${clientCode}`,
              type: "details",
              clientId: clientId,
              closable: true,
            });
            setActiveTab(screenId, tabId);
          }}
        />
      );
    }

    // حالة: ملف العميل الفردي
    if (activeTabId?.startsWith("CLIENT-")) {
      const clientId = activeTabId.replace("CLIENT-", "");
      return (
        <ClientFileView
          clientId={clientId}
          onBack={() => {
            removeTab(screenId, activeTabId);
            setActiveTab(screenId, "300-MAIN");
          }}
        />
      );
    }

    // 👇 3. إضافة الحالات الجديدة للوحات
    if (activeTabId === "CLIENTS_RATINGS") {
      return (
        <div className="p-6 h-full overflow-y-auto">
          <ClientsRatingsPanel />
        </div>
      );
    }

    if (activeTabId === "CLIENTS_DOCS") {
      return (
        <div className="p-6 h-full overflow-y-auto">
          <ClientsDocsPanel />
        </div>
      );
    }

    // الحالة الافتراضية: لوحة التحكم (Dashboard)
    return <ClientsDashboard onNavigate={handleNavigate} />;
  };

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden" dir="rtl">
      <div className="flex-1 flex flex-col min-w-0 bg-white shadow-xl m-3 rounded-2xl border border-slate-200 overflow-hidden relative">
        <div className="flex-1 relative h-full overflow-y-auto custom-scrollbar">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ClientsScreenWrapper;
