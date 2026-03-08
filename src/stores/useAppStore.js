import { create } from "zustand";

// تعريف الشاشات المبرمجة والمعروفة مسبقاً
export const SCREENS = {
  DASH: {
    id: "DASH",
    title: "لوحة التحكم",
    icon: "LayoutDashboard",
    closable: false,
  },
  "055": { id: "055", title: "المعاملات", icon: "FileText" },
  300: { id: "300", title: "العملاء", icon: "Users" },
  310: { id: "310", title: "إدارة الملكيات", icon: "ShieldCheck" },
  815: { id: "815", title: "عروض الأسعار", icon: "FileSignature" },
  942: { id: "942", title: "المستندات والقوالب", icon: "FileCode" },
  285: { id: "285", title: "المشاريع", icon: "Briefcase" },
  817: { id: "817", title: "شؤون الموظفين", icon: "UserCog" },
  937: { id: "937", title: "إدارة المعقبين", icon: "Truck" },
  939: { id: "939", title: "شوارع الرياض", icon: "Map" },
  FIN: { id: "FIN", title: "المالية", icon: "Banknote" },
  SET: { id: "SET", title: "إعدادات النظام", icon: "Settings" },
};

export const useAppStore = create((set, get) => ({
  // ==========================================
  // 1. Global State (الشريط العلوي - الشاشات المفتوحة)
  // ==========================================
  activeScreenId: "DASH",
  openScreens: [{ id: "DASH", title: "لوحة التحكم", isClosable: false }],

  // ==========================================
  // 2. Local State (التابات الداخلية لكل شاشة)
  // ==========================================
  screenTabs: {
    DASH: [
      {
        id: "DASH-MAIN",
        title: "النظرة العامة",
        type: "dashboard",
        closable: false,
      },
    ],
    "055": [
      {
        id: "055-MAIN",
        title: "إدارة المعاملات",
        type: "wrapper",
        closable: false,
      },
    ],
    300: [
      {
        id: "DASHBOARD_CLIENTS",
        title: "لوحة العملاء",
        type: "dashboard",
        closable: false,
      },
    ],
    310: [
      {
        id: "DASHBOARD_TAB",
        title: "لوحة الملكيات",
        type: "dashboard",
        closable: false,
      },
    ],
    815: [
      {
        id: "QUOTATIONS_DASH",
        title: "لوحة عروض الأسعار",
        type: "dashboard",
        closable: false,
      },
    ],
    942: [
      {
        id: "942-MAIN",
        title: "الإعدادات العامة",
        type: "wrapper",
        closable: false,
      },
    ],
    SET: [
      {
        id: "SET-SERVER",
        title: "حالة السيرفر",
        type: "wrapper",
        closable: false,
      },
    ],
  },

  activeTabPerScreen: {
    DASH: "DASH-MAIN",
    "055": "055-MAIN",
    300: "DASHBOARD_CLIENTS",
    310: "DASHBOARD_TAB",
    815: "QUOTATIONS_DASH",
    942: "942-MAIN",
    SET: "SET-SERVER",
  },

  // ==========================================
  // 3. Actions (الوظائف والأوامر)
  // ==========================================

  // 👈 تم التحديث: نقبل dynamicTitle من السايدبار لفتح الشاشات غير المبرمجة
  // 👈 تم التحديث: نقبل dynamicTitle و props (مثل sector)
  openScreen: (
    screenId,
    dynamicTitle = "شاشة جديدة",
    props = {}, // 👈 أضفنا props هنا
  ) =>
    set((state) => {
      const screenConfig = SCREENS[screenId] || {
        id: screenId,
        title: dynamicTitle,
      };

      const isAlreadyOpenIndex = state.openScreens.findIndex(
        (s) => s.id === screenId,
      );

      // أ) إذا كانت مفتوحة مسبقاً، قم بتنشيطها "وتحديث الـ props الخاصة بها"
      if (isAlreadyOpenIndex !== -1) {
        const updatedScreens = [...state.openScreens];
        // تحديث الـ props (مثل تحديث القطاع من 'وسط' إلى 'شمال' دون إغلاق الشاشة)
        updatedScreens[isAlreadyOpenIndex] = {
          ...updatedScreens[isAlreadyOpenIndex],
          title:
            dynamicTitle !== "شاشة جديدة"
              ? dynamicTitle
              : updatedScreens[isAlreadyOpenIndex].title,
          props: { ...updatedScreens[isAlreadyOpenIndex].props, ...props }, // 👈 تحديث الـ props
        };

        return {
          openScreens: updatedScreens,
          activeScreenId: screenId,
        };
      }

      // ب) إذا كانت شاشة جديدة:
      const mainTabId = `${screenId}-MAIN`;
      const hasExistingTabs = !!state.screenTabs[screenId];

      return {
        // إضافتها للشريط العلوي مع الـ props
        openScreens: [
          ...state.openScreens,
          { id: screenId, title: screenConfig.title, isClosable: true, props }, // 👈 حفظ الـ props هنا
        ],
        activeScreenId: screenId,

        // تهيئة التاب الداخلي الأساسي
        screenTabs: {
          ...state.screenTabs,
          ...(hasExistingTabs
            ? {}
            : {
                [screenId]: [
                  {
                    id: mainTabId,
                    title: screenConfig.title,
                    type: "wrapper",
                    closable: false,
                  },
                ],
              }),
        },
        activeTabPerScreen: {
          ...state.activeTabPerScreen,
          ...(hasExistingTabs ? {} : { [screenId]: mainTabId }),
        },
      };
    }),
  // إغلاق شاشة بالكامل من الشريط العلوي (Global)
  closeScreen: (screenId) =>
    set((state) => {
      const newScreens = state.openScreens.filter((s) => s.id !== screenId);

      let newActiveId = state.activeScreenId;
      if (state.activeScreenId === screenId) {
        newActiveId =
          newScreens.length > 0 ? newScreens[newScreens.length - 1].id : "DASH";
      }

      return { openScreens: newScreens, activeScreenId: newActiveId };
    }),

  // تنشيط تاب داخلي معين
  setActiveTab: (screenId, tabId) =>
    set((state) => ({
      activeTabPerScreen: { ...state.activeTabPerScreen, [screenId]: tabId },
    })),

  // إضافة تاب فرعي جديد داخل شاشة (مثلاً: فتح "تفاصيل معاملة")
  addTab: (screenId, tab) =>
    set((state) => {
      const existingTabs = state.screenTabs[screenId] || [];
      const isTabExists = existingTabs.find((t) => t.id === tab.id);

      // إذا كان التاب مفتوحاً بالفعل، قم بالانتقال إليه فقط
      if (isTabExists) {
        return {
          activeTabPerScreen: {
            ...state.activeTabPerScreen,
            [screenId]: tab.id,
          },
        };
      }

      // إذا كان التاب جديداً، أضفه (مع التأكد أنه قابل للإغلاق افتراضياً)
      const newTab = { ...tab, closable: tab.closable !== false };

      return {
        screenTabs: {
          ...state.screenTabs,
          [screenId]: [...existingTabs, newTab],
        },
        activeTabPerScreen: { ...state.activeTabPerScreen, [screenId]: tab.id },
      };
    }),

  // إغلاق تاب فرعي داخلي
  removeTab: (screenId, tabId) =>
    set((state) => {
      const tabs = state.screenTabs[screenId].filter((t) => t.id !== tabId);

      // إذا أغلق التاب النشط، نعود للتاب الأخير في القائمة المتبقية
      let newActiveTab = state.activeTabPerScreen[screenId];
      if (newActiveTab === tabId) {
        newActiveTab = tabs[tabs.length - 1]?.id || tabs[0]?.id;
      }

      return {
        screenTabs: { ...state.screenTabs, [screenId]: tabs },
        activeTabPerScreen: {
          ...state.activeTabPerScreen,
          [screenId]: newActiveTab,
        },
      };
    }),
}));
