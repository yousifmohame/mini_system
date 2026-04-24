import React from "react";
import { useAppStore } from "../../stores/useAppStore";
import ClientsDashboard from "./ClientsDashboard";
import CreateClientWizard from "./CreateClientWizard";
import ClientsLog from "./ClientsLog";
import ClientFileView from "./ClientFileView";
import ClientsRatingsPanel from "./ClientsRatingsPanel";
import ClientsDocsPanel from "./ClientsDocsPanel";

const ClientsScreenWrapper = () => {
  const screenId = "300";

  const { activeTabPerScreen, setActiveTab, addTab, removeTab } = useAppStore();
  const activeTabId = activeTabPerScreen[screenId] || "DASHBOARD_CLIENTS";

  // 👇 تحديث دالة التنقل لفتح "تاب جديد" في كل مرة عبر توليد ID فريد
  const handleNavigate = (targetId, extraData = null) => {
    // توليد معرف فريد يعتمد على الوقت لضمان فتح تاب جديد دائماً
    const uniqueTabId = `${targetId}_${Date.now()}`;

    switch (targetId) {
      case "NEW_CLIENT_TAB":
        addTab(screenId, {
          id: uniqueTabId,
          title: "إنشاء عميل جديد",
          type: "wizard",
          closable: true,
        });
        setActiveTab(screenId, uniqueTabId);
        break;
      case "300-MAIN":
        addTab(screenId, {
          id: uniqueTabId,
          title: extraData?.title || "دليل العملاء",
          type: "list",
          closable: true,
          // تمرير أي فلاتر قادمة من لوحة التحكم (الداشبورد)
          filter: extraData?.filter, 
        });
        setActiveTab(screenId, uniqueTabId);
        break;
      case "CLIENTS_RATINGS":
        addTab(screenId, {
          id: uniqueTabId,
          title: "تقييمات وتصنيفات",
          type: "panel",
          closable: true,
        });
        setActiveTab(screenId, uniqueTabId);
        break;
      case "CLIENTS_DOCS":
        addTab(screenId, {
          id: uniqueTabId,
          title: "وثائق العملاء المركزية",
          type: "panel",
          closable: true,
        });
        setActiveTab(screenId, uniqueTabId);
        break;
      default:
        // للرجوع لتابات ثابتة موجودة مسبقاً مثل الداشبورد
        setActiveTab(screenId, targetId);
    }
  };

  const renderContent = () => {
    // حالة: إنشاء عميل جديد
    // نستخدم startsWith لتجاهل الطابع الزمني المرفق بالـ ID
    if (activeTabId?.startsWith("NEW_CLIENT_TAB")) {
      return (
        <CreateClientWizard
          onComplete={() => {
            removeTab(screenId, activeTabId);
            handleNavigate("300-MAIN");
          }}
          onBack={() => {
            removeTab(screenId, activeTabId);
            setActiveTab(screenId, "DASHBOARD_CLIENTS");
          }}
        />
      );
    }

    // حالة: دليل العملاء
    if (activeTabId?.startsWith("300-MAIN")) {
      return (
        <ClientsLog
          onOpenDetails={(clientId, clientCode) => {
            // فتح ملف العميل في تاب جديد أيضاً
            const tabId = `CLIENT-${clientId}_${Date.now()}`;
            addTab(screenId, {
              id: tabId,
              title: `ملف: ${clientCode}`,
              type: "details",
              clientId: clientId,
              closable: true,
            });
            setActiveTab(screenId, tabId);
          }}
          onBack={() => {
            // زر العودة يغلق التاب الحالي (دليل العملاء) ويرجع للداشبورد
            removeTab(screenId, activeTabId);
            setActiveTab(screenId, "DASHBOARD_CLIENTS");
          }}
        />
      );
    }

    // حالة: ملف العميل الفردي
    if (activeTabId?.startsWith("CLIENT-")) {
      // استخراج الـ ID الأصلي للعميل (نقوم بفصل الطابع الزمني)
      // الصيغة الحالية: CLIENT-{id}_{timestamp}
      const clientId = activeTabId.replace("CLIENT-", "").split("_")[0];
      
      return (
        <ClientFileView
          clientId={clientId}
          onBack={() => {
            // إغلاق تاب ملف العميل والعودة للصفحة الرئيسية
            removeTab(screenId, activeTabId);
            setActiveTab(screenId, "DASHBOARD_CLIENTS"); 
          }}
        />
      );
    }

    // حالة: التقييمات
    if (activeTabId?.startsWith("CLIENTS_RATINGS")) {
      return (
        <div className="p-6 h-full overflow-y-auto">
          <ClientsRatingsPanel 
             onBack={() => {
               removeTab(screenId, activeTabId);
               setActiveTab(screenId, "DASHBOARD_CLIENTS");
             }}
          />
        </div>
      );
    }

    // حالة: وثائق العملاء
    if (activeTabId?.startsWith("CLIENTS_DOCS")) {
      return (
        <div className="p-6 h-full overflow-y-auto">
          <ClientsDocsPanel 
             onBack={() => {
               removeTab(screenId, activeTabId);
               setActiveTab(screenId, "DASHBOARD_CLIENTS");
             }}
          />
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