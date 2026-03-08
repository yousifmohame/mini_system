import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Loader2,
  MapPin,
  X,
  FilePlus,
  Send,
  Search,
  ChevronDown,
  Banknote,
  CreditCard,
  User,
  Info,
  Upload,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] =
    useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);

  // ==================================================
  // 1. حالة نموذج المعاملة الجديدة
  // ==================================================
  const initialTransactionFormState = {
    transactionType: "اصدار",
    surveyType: "برافع",
    clientId: "",
    plotNumber: "",
    planId: "",
    districtId: "",
    sectorId: "",
    sectorName: "",
    entities: [],
    source: "مكتب ديتيلز",
    attachments: [],
    brokerId: "",
    followUpAgentId: "",
    stakeholderId: "",
    receiverId: "",
    engOfficeBrokerId: "",
    totalFees: "",
  };
  const [transactionFormData, setTransactionFormData] = useState(
    initialTransactionFormState,
  );

  // ==================================================
  // 2. حالة نموذج تسجيل تحصيل
  // ==================================================
  const initialCollectionFormState = {
    transactionId: "",
    collectedFromType: "من أشخاص النظام", // "من أشخاص النظام", "شخص آخر"
    collectedFromId: "", // ID العميل/الموظف
    collectedFromOther: "", // اسم الشخص الآخر
    amount: "",
    periodRef: "",
    paymentMethod: "بنكي", // "بنكي", "نقدي", "غير مسلم للشركة"
    bankAccountId: "",
    date: new Date().toISOString().split("T")[0],
    receiverId: "",
    splitReceivers: false,
    notes: "",
    attachment: null,
  };
  const [collectionFormData, setCollectionFormData] = useState(
    initialCollectionFormState,
  );

  // تفاصيل المعاملة المختارة للتحصيل (لإظهار المبلغ المستحق والمتبقي)
  const [selectedTransactionDetails, setSelectedTransactionDetails] =
    useState(null);

  // ==================================================
  // جلب البيانات (Queries)
  // ==================================================

  // جلب العملاء
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients-simple"],
    queryFn: async () => {
      const res = await api.get("/clients/simple");
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
    enabled: isNewTransactionModalOpen || isCollectionModalOpen,
  });

  // جلب المناطق والأحياء
  const { data: riyadhZones = [], isLoading: isLoadingZones } = useQuery({
    queryKey: ["riyadhZones"],
    queryFn: async () => {
      const res = await api.get("/riyadh-zones");
      return res.data?.data || [];
    },
    enabled: isNewTransactionModalOpen,
  });

  // جلب المخططات
  const { data: plans = [] } = useQuery({
    queryKey: ["riyadh-plans-simple"],
    queryFn: async () => {
      const res = await api.get("/riyadh-streets/plans");
      return res.data || [];
    },
    enabled: isNewTransactionModalOpen,
  });

  // جلب الموظفين
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-simple"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data || [];
    },
    enabled: isNewTransactionModalOpen || isCollectionModalOpen,
  });

  // جلب المعاملات الخاصة (قائمة منسدلة للتحصيل)
  const { data: privateTransactions = [], isLoading: isLoadingTransactions } =
    useQuery({
      queryKey: ["private-transactions-simple"],
      queryFn: async () => {
        const res = await api.get("/private-transactions"); // افترضنا أن الـ endpoint ترجع قائمة
        return res.data?.data || [];
      },
      enabled: isCollectionModalOpen,
    });

  // 🚀 جلب إحصائيات لوحة القيادة للمعاملات الخاصة من الباك إند
  const { data: dashboardStats = {}, isLoading: isLoadingStats } = useQuery({
    queryKey: ["private-dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/private-transactions/dashboard-stats");
      // نعتمد على هيكل البيانات الذي أنشأناه في الباك إند
      return res.data?.data || {};
    },
  });

  // ==================================================
  // 3. دوال التعامل مع المدخلات
  // ==================================================

  const handleTransactionChange = (field, value) => {
    setTransactionFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTransactionArrayItem = (field, value) => {
    setTransactionFormData((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value)
          ? arr.filter((item) => item !== value)
          : [...arr, value],
      };
    });
  };

  const handleDistrictChange = (districtId) => {
    let foundSector = null;
    for (const sector of riyadhZones) {
      if (sector.districts?.some((d) => d.id === districtId)) {
        foundSector = sector;
        break;
      }
    }
    setTransactionFormData((prev) => ({
      ...prev,
      districtId,
      sectorId: foundSector?.id || "",
      sectorName: foundSector?.name || "",
    }));
  };

  // ==================================================
  // 4. دالة الإرسال والحفظ (Mutation)
  // ==================================================
  const submitTransactionMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/private-transactions", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("تم تسجيل المعاملة بنجاح!");
      queryClient.invalidateQueries(["private-dashboard-stats"]); // 🚀 تحديث الإحصائيات
      queryClient.invalidateQueries(["private-transactions-simple"]);
      setIsNewTransactionModalOpen(false);
      setTransactionFormData(initialTransactionFormState);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "حدث خطأ أثناء تسجيل المعاملة",
      );
    },
  });

  const handleTransactionSubmit = () => {
    if (!transactionFormData.clientId)
      return toast.error("الرجاء اختيار المالك");
    if (!transactionFormData.districtId)
      return toast.error("الرجاء اختيار الحي");

    submitTransactionMutation.mutate(transactionFormData);
  };

  // ==================================================
  // دوال معالجة نموذج التحصيل
  // ==================================================

  const handleCollectionChange = (field, value) => {
    setCollectionFormData((prev) => ({ ...prev, [field]: value }));
  };

  // تحديث تفاصيل المعاملة عند اختيار معاملة جديدة في مودال التحصيل
  useEffect(() => {
    if (collectionFormData.transactionId && privateTransactions.length > 0) {
      const selectedTx = privateTransactions.find(
        (tx) => tx.id === collectionFormData.transactionId,
      );
      if (selectedTx) {
        setSelectedTransactionDetails({
          totalFees: selectedTx.totalFees || 0,
          paidAmount: selectedTx.paidAmount || 0,
          remainingAmount:
            selectedTx.remainingAmount ||
            (selectedTx.totalFees || 0) - (selectedTx.paidAmount || 0),
        });
      }
    } else {
      setSelectedTransactionDetails(null);
    }
  }, [collectionFormData.transactionId, privateTransactions]);

  const submitCollectionMutation = useMutation({
    mutationFn: async (payload) => {
      // 1. إذا كان هناك مرفق، يجب إرساله عبر FormData
      const formDataToSend = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === "attachment" && payload[key]) {
          formDataToSend.append("file", payload[key]);
        } else if (key !== "attachment") {
          formDataToSend.append(key, payload[key]);
        }
      });

      const res = await api.post(
        "/private-transactions/payments",
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("تم تسجيل التحصيل بنجاح!");
      queryClient.invalidateQueries(["private-dashboard-stats"]); // 🚀 تحديث الإحصائيات
      queryClient.invalidateQueries(["private-transactions-simple"]);
      setIsCollectionModalOpen(false);
      setCollectionFormData(initialCollectionFormState);
      setSelectedTransactionDetails(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "حدث خطأ أثناء تسجيل التحصيل");
    },
  });

  const handleCollectionSubmit = () => {
    if (!collectionFormData.transactionId)
      return toast.error("الرجاء اختيار رقم المعاملة");
    if (!collectionFormData.amount || collectionFormData.amount <= 0)
      return toast.error("الرجاء إدخال مبلغ صحيح");

    // التحقق من أن المبلغ لا يتجاوز المتبقي
    if (
      selectedTransactionDetails &&
      parseFloat(collectionFormData.amount) >
        selectedTransactionDetails.remainingAmount
    ) {
      return toast.error("المبلغ المدخل أكبر من المتبقي للمعاملة!");
    }

    submitCollectionMutation.mutate(collectionFormData);
  };

  const calculatePercentageAmount = (percentage) => {
    if (!selectedTransactionDetails?.totalFees) return;
    const amount = (
      selectedTransactionDetails.totalFees *
      (percentage / 100)
    ).toFixed(2);
    handleCollectionChange("amount", amount);
  };

  return (
    <>
      {/* ================================================== */}
      {/* الواجهة الرئيسية (Dashboard Main View) */}
      {/* ================================================== */}
      <main
        className="overflow-y-auto custom-scrollbar-slim direction-rtl"
        style={{
          marginTop: "48px",
          height: "calc(-76px + 100vh)",
          backgroundColor: "var(--wms-bg-0)",
        }}
      >
        <div>
          {/* شريط الإجراءات السريعة */}
          <div
            className="flex items-center gap-2.5 px-4 overflow-x-auto custom-scrollbar-slim"
            style={{
              height: "46px",
              borderBottom: "1px solid var(--wms-border)",
              backgroundColor: "var(--wms-surface-1)",
            }}
          >
            <button
              onClick={() => setIsNewTransactionModalOpen(true)}
              className="flex items-center gap-1.5 px-3 rounded-md cursor-pointer hover:opacity-90 transition-opacity shrink-0"
              style={{
                height: "32px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "var(--wms-accent-blue)",
                color: "rgb(255, 255, 255)",
              }}
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>تسجيل معاملة جديدة</span>
            </button>

            <button
              onClick={() => setIsCollectionModalOpen(true)}
              className="flex items-center gap-1.5 px-3 rounded-md cursor-pointer hover:opacity-90 transition-opacity shrink-0"
              style={{
                height: "32px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "var(--wms-success)",
                color: "rgb(255, 255, 255)",
              }}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>تسجيل تحصيل</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 rounded-md cursor-pointer hover:opacity-90 transition-opacity shrink-0"
              style={{
                height: "32px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "var(--wms-success)",
                color: "rgb(255, 255, 255)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-hand-coins w-3.5 h-3.5"
              >
                <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"></path>
                <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"></path>
                <path d="m2 16 6 6"></path>
                <circle cx="16" cy="9" r="2.9"></circle>
                <circle cx="6" cy="5" r="3"></circle>
              </svg>
              <span>تسجيل تسوية</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 rounded-md cursor-pointer hover:opacity-90 transition-opacity shrink-0"
              style={{
                height: "32px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "var(--wms-success)",
                color: "rgb(255, 255, 255)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-send w-3.5 h-3.5"
              >
                <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
                <path d="m21.854 2.147-10.94 10.939"></path>
              </svg>
              <span>تسجيل تسليم تسوية</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 rounded-md cursor-pointer hover:opacity-90 transition-opacity shrink-0"
              style={{
                height: "32px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "rgb(245, 158, 11)",
                color: "rgb(255, 255, 255)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-vault w-3.5 h-3.5"
              >
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle>
                <path d="m7.9 7.9 2.7 2.7"></path>
                <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
                <path d="m13.4 10.6 2.7-2.7"></path>
                <circle cx="7.5" cy="16.5" r=".5" fill="currentColor"></circle>
                <path d="m7.9 16.1 2.7-2.7"></path>
                <circle cx="16.5" cy="16.5" r=".5" fill="currentColor"></circle>
                <path d="m13.4 13.4 2.7 2.7"></path>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
              <span>جرد خزنة</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 rounded-md cursor-pointer hover:opacity-90 transition-opacity shrink-0"
              style={{
                height: "32px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "rgb(245, 158, 11)",
                color: "rgb(255, 255, 255)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-landmark w-3.5 h-3.5"
              >
                <line x1="3" x2="21" y1="22" y2="22"></line>
                <line x1="6" x2="6" y1="18" y2="11"></line>
                <line x1="10" x2="10" y1="18" y2="11"></line>
                <line x1="14" x2="14" y1="18" y2="11"></line>
                <line x1="18" x2="18" y1="18" y2="11"></line>
                <polygon points="12 2 20 7 4 7"></polygon>
              </svg>
              <span>جرد حساب بنكي</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 rounded-md cursor-pointer hover:opacity-90 transition-opacity shrink-0"
              style={{
                height: "32px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "rgb(245, 158, 11)",
                color: "rgb(255, 255, 255)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-refresh-cw w-3.5 h-3.5"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M8 16H3v5"></path>
              </svg>
              <span>تحديث رصيد البنك</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 rounded-md cursor-pointer hover:opacity-90 transition-opacity shrink-0"
              style={{
                height: "32px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "var(--wms-accent-blue)",
                color: "rgb(255, 255, 255)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-receipt w-3.5 h-3.5"
              >
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path>
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                <path d="M12 17.5v-11"></path>
              </svg>
              <span>تسجيل مصروف</span>
            </button>
            <span
              className="shrink-0 text-wms-text-muted mr-auto"
              style={{ fontSize: "10px", opacity: 0.7 }}
            >
              هذا النظام مخصص للتسويات الداخلية والمتابعة المالية المبسطة فقط
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* الإحصائيات العلوية */}
          <div className="flex items-center gap-5 px-4 py-2.5 bg-wms-surface-1 border border-wms-border rounded-lg">
            {/* إجمالي المعاملات */}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--wms-accent-blue)20" }}
              >
                <FilePlus
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--wms-accent-blue)" }}
                />
              </div>
              <div>
                <div
                  className="text-wms-text-muted"
                  style={{ fontSize: "10px" }}
                >
                  إجمالي المعاملات
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--wms-accent-blue)",
                    }}
                  >
                    {isLoadingStats
                      ? "..."
                      : (dashboardStats.totalCount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-px h-8 bg-wms-border"></div>
              {/* إجمالي المبالغ */}
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--wms-success)20" }}
              >
                <Banknote
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--wms-success)" }}
                />
              </div>
              <div>
                <div
                  className="text-wms-text-muted"
                  style={{ fontSize: "10px" }}
                >
                  إجمالي المبالغ
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--wms-success)",
                    }}
                  >
                    {isLoadingStats
                      ? "..."
                      : (
                          dashboardStats.totalProfits || 0
                        ).toLocaleString()}{" "}
                    ر.س
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-px h-8 bg-wms-border"></div>
              {/* الوسطاء النشطون */}
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--chart-4)20" }}
              >
                <User
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--chart-4)" }}
                />
              </div>
              <div>
                <div
                  className="text-wms-text-muted"
                  style={{ fontSize: "10px" }}
                >
                  الوسطاء النشطون
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--chart-4)",
                    }}
                  >
                    {isLoadingStats
                      ? "..."
                      : (dashboardStats.activeBrokers || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-px h-8 bg-wms-border"></div>
              {/* السيولة المحصلة */}
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--wms-warning)20" }}
              >
                <CreditCard
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--wms-warning)" }}
                />
              </div>
              <div>
                <div
                  className="text-wms-text-muted"
                  style={{ fontSize: "10px" }}
                >
                  السيولة المحصلة
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--wms-warning)",
                    }}
                  >
                    {isLoadingStats
                      ? "..."
                      : (
                          dashboardStats.vaultBalance || 0
                        ).toLocaleString()}{" "}
                    ر.س
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* الجداول والإحصائيات */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 bg-wms-surface-1 border border-wms-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-wms-border">
                <span
                  className="text-wms-text"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  آخر المعاملات الداخلية
                </span>
                <span
                  className="text-wms-text-muted"
                  style={{ fontSize: "11px" }}
                >
                  حسب الأحدث
                </span>
              </div>

              <div className="overflow-x-auto max-h-[300px] custom-scrollbar-slim">
                <table
                  className="w-full text-right"
                  style={{ fontSize: "12px" }}
                >
                  <thead className="sticky top-0 z-10">
                    <tr style={{ backgroundColor: "var(--wms-surface-2)" }}>
                      <th
                        className="px-3 py-2 text-wms-text-sec"
                        style={{ fontWeight: 600, fontSize: "11px" }}
                      >
                        رقم المعاملة
                      </th>
                      <th
                        className="px-3 py-2 text-wms-text-sec"
                        style={{ fontWeight: 600, fontSize: "11px" }}
                      >
                        النوع
                      </th>
                      <th
                        className="px-3 py-2 text-wms-text-sec"
                        style={{ fontWeight: 600, fontSize: "11px" }}
                      >
                        المالك
                      </th>
                      <th
                        className="px-3 py-2 text-wms-text-sec"
                        style={{ fontWeight: 600, fontSize: "11px" }}
                      >
                        القطاع
                      </th>
                      <th
                        className="px-3 py-2 text-wms-text-sec"
                        style={{ fontWeight: 600, fontSize: "11px" }}
                      >
                        المبلغ
                      </th>
                      <th
                        className="px-3 py-2 text-wms-text-sec"
                        style={{ fontWeight: 600, fontSize: "11px" }}
                      >
                        الحالة
                      </th>
                      <th
                        className="px-3 py-2 text-wms-text-sec"
                        style={{ fontWeight: 600, fontSize: "11px" }}
                      >
                        التاريخ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingStats ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="text-center py-4 text-slate-400"
                        >
                          جاري التحميل...
                        </td>
                      </tr>
                    ) : dashboardStats.recentTransactions &&
                      dashboardStats.recentTransactions.length > 0 ? (
                      dashboardStats.recentTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="border-b border-wms-border/50 hover:bg-wms-surface-2/30 transition-colors"
                        >
                          <td
                            className="px-3 py-2 text-wms-blue font-mono font-bold"
                            style={{ fontSize: "11px" }}
                          >
                            {tx.ref}
                          </td>
                          <td className="px-3 py-2 text-wms-text-sec font-bold">
                            {tx.type}
                          </td>
                          <td className="px-3 py-2 text-wms-text">
                            {tx.client}
                          </td>
                          <td className="px-3 py-2 text-wms-text-sec">
                            {tx.sector || tx.district}
                          </td>
                          <td className="px-3 py-2 text-wms-text font-mono font-bold">
                            {tx.value?.toLocaleString()}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className="inline-block px-2 py-0.5 rounded-md"
                              style={{
                                backgroundColor:
                                  tx.status === "مكتملة"
                                    ? "rgba(34, 197, 94, 0.15)"
                                    : "rgba(59, 130, 246, 0.15)",
                                color:
                                  tx.status === "مكتملة"
                                    ? "var(--wms-success)"
                                    : "var(--wms-accent-blue)",
                                fontSize: "10px",
                                fontWeight: 600,
                              }}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td
                            className="px-3 py-2 text-wms-text-muted font-mono"
                            style={{ fontSize: "11px" }}
                          >
                            {tx.date}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="text-center py-4 text-slate-400"
                        >
                          لا توجد معاملات مسجلة حتى الآن
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ملخص المبالغ والمديونيات */}
            <div className="bg-wms-surface-1 border border-wms-border rounded-lg">
              <div className="px-3 py-2 border-b border-wms-border">
                <span
                  className="text-wms-text"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  التدفق النقدي
                </span>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded border border-blue-100">
                  <span className="text-slate-600 text-xs font-bold">
                    إجمالي المطالبات
                  </span>
                  <span className="font-mono font-bold text-blue-700">
                    {isLoadingStats
                      ? "..."
                      : (
                          dashboardStats.totalProfits || 0
                        ).toLocaleString()}{" "}
                    ر.س
                  </span>
                </div>
                <div className="flex justify-between items-center bg-emerald-50/50 p-2 rounded border border-emerald-100">
                  <span className="text-slate-600 text-xs font-bold">
                    المبالغ المحصلة
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    {isLoadingStats
                      ? "..."
                      : (
                          dashboardStats.vaultBalance || 0
                        ).toLocaleString()}{" "}
                    ر.س
                  </span>
                </div>
                <div className="flex justify-between items-center bg-amber-50/50 p-2 rounded border border-amber-100">
                  <span className="text-slate-600 text-xs font-bold">
                    المتبقي (المديونيات)
                  </span>
                  <span className="font-mono font-bold text-amber-700">
                    {isLoadingStats
                      ? "..."
                      : (
                          (dashboardStats.totalProfits || 0) -
                          (dashboardStats.vaultBalance || 0)
                        ).toLocaleString()}{" "}
                    ر.س
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================================================== */}
      {/* 1. نافذة (Modal) تسجيل معاملة جديدة */}
      {/* ================================================== */}
      {isNewTransactionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.6)" }}
          dir="rtl"
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
            style={{ backgroundColor: "#ffffff" }}
          >
            {/* عنوان المودال */}
            <div
              className="flex justify-between items-center px-5 py-3 border-b border-slate-200 shrink-0"
              style={{ backgroundColor: "#f8fafc" }}
            >
              <h2
                className="font-bold flex items-center gap-2 text-slate-800"
                style={{ fontSize: "14px" }}
              >
                <FilePlus className="w-4 h-4 text-blue-600" />
                تسجيل معاملة جديدة
              </h2>
              <button
                onClick={() => setIsNewTransactionModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1 rounded-md hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* محتوى المودال */}
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar-slim">
              {/* 1. نوع المعاملة */}
              <div>
                <label
                  className="block mb-1.5 text-slate-600"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  نوع المعاملة
                </label>
                <div className="flex gap-2">
                  {["اصدار", "تجديد", "تعديل", "تصحيح وضع مبني قائم"].map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() =>
                          handleTransactionChange("transactionType", type)
                        }
                        className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                          transactionFormData.transactionType === type
                            ? "bg-blue-600 text-white"
                            : "bg-slate-50 text-slate-600 hover:text-slate-800 border border-slate-200"
                        }`}
                        style={{ fontSize: "11px", fontWeight: 600 }}
                      >
                        {type}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* 2. نوع الرفع */}
              <div>
                <label
                  className="block mb-1.5 text-slate-600"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  نوع الرفع
                </label>
                <div className="flex gap-2">
                  {["برافع", "بدون رفع"].map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        handleTransactionChange("surveyType", type)
                      }
                      className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                        transactionFormData.surveyType === type
                          ? "bg-blue-600 text-white"
                          : "bg-slate-50 text-slate-600 hover:text-slate-800 border border-slate-200"
                      }`}
                      style={{ fontSize: "11px", fontWeight: 600 }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. المالك */}
              <div>
                <label
                  className="mb-1.5 text-slate-600 flex justify-between"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  <span>
                    المالك * <span className="text-red-500">*</span>
                  </span>
                  {isLoadingClients && (
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                  )}
                </label>
                <div className="relative">
                  <select
                    value={transactionFormData.clientId}
                    onChange={(e) =>
                      handleTransactionChange("clientId", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
                    style={{ height: "34px", fontSize: "12px" }}
                  >
                    <option value="">-- اختر المالك --</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name?.ar || client.name}{" "}
                        {client.idNumber ? `(${client.idNumber})` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 4. القطعة والمخطط */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block mb-1.5 text-slate-600"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    القطعة
                  </label>
                  <input
                    type="text"
                    value={transactionFormData.plotNumber}
                    onChange={(e) =>
                      handleTransactionChange("plotNumber", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="رقم القطعة"
                    style={{ height: "34px", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label
                    className="block mb-1.5 text-slate-600"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    المخطط
                  </label>
                  <div className="relative">
                    <select
                      value={transactionFormData.planId}
                      onChange={(e) =>
                        handleTransactionChange("planId", e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
                      style={{ height: "34px", fontSize: "12px" }}
                    >
                      <option value="">-- اختر المخطط --</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.planNumber}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* === القسم الجديد: مبلغ المعاملة (المالية) === */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="text-slate-700 flex items-center gap-1.5"
                    style={{ fontSize: "12px", fontWeight: 700 }}
                  >
                    <Banknote className="w-4 h-4 text-blue-600" />
                    إجمالي أتعاب المعاملة (ر.س){" "}
                    <span className="text-red-500">*</span>
                  </label>
                </div>
                <input
                  type="number"
                  required
                  value={transactionFormData.totalFees}
                  onChange={(e) =>
                    handleTransactionChange("totalFees", e.target.value)
                  }
                  className="w-full bg-white border border-blue-200 rounded-lg px-4 text-blue-700 font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-lg font-bold"
                  placeholder="مثال: 4500"
                  style={{ height: "42px" }}
                />
              </div>

              {/* 5. الحي والقطاع */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label
                    className="mb-1.5 text-slate-600 flex justify-between"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    <span>الحي *</span>
                    {isLoadingZones && (
                      <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                    )}
                  </label>
                  <div className="relative">
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <select
                      value={transactionFormData.districtId}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md pr-8 pl-8 text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
                      style={{ height: "34px", fontSize: "12px" }}
                    >
                      <option value="">ابحث عن الحي...</option>
                      {riyadhZones.map((sector) => (
                        <optgroup key={sector.id} label={`قطاع ${sector.name}`}>
                          {sector.districts?.map((dist) => (
                            <option key={dist.id} value={dist.id}>
                              {dist.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label
                    className="block mb-1.5 text-slate-600"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    القطاع (تلقائي)
                  </label>
                  <div
                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3"
                    style={{ height: "34px", fontSize: "12px" }}
                  >
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span
                      className={
                        transactionFormData.sectorName
                          ? "text-slate-800"
                          : "text-slate-400"
                      }
                      style={{ fontWeight: 600 }}
                    >
                      {transactionFormData.sectorName
                        ? `قطاع ${transactionFormData.sectorName}`
                        : "يتحدد تلقائياً"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. الجهة */}
              <div>
                <label
                  className="block mb-1.5 text-slate-600"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  الجهة
                </label>
                <div className="flex gap-4">
                  {["الأمانة", "الهيئة", "الهيئة العليا"].map((entity) => (
                    <label
                      key={entity}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={transactionFormData.entities.includes(entity)}
                        onChange={() =>
                          toggleTransactionArrayItem("entities", entity)
                        }
                        className="accent-blue-600 w-3.5 h-3.5"
                      />
                      <span
                        className="text-slate-600"
                        style={{ fontSize: "12px" }}
                      >
                        {entity}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 7. مصدر المعاملة */}
              <div>
                <label
                  className="block mb-1.5 text-slate-600"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  مصدر المعاملة
                </label>
                <div className="flex gap-2">
                  {["مكتب ديتيلز", "مكتب خارجي"].map((source) => (
                    <button
                      key={source}
                      onClick={() => handleTransactionChange("source", source)}
                      className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                        transactionFormData.source === source
                          ? "bg-blue-600 text-white"
                          : "bg-slate-50 text-slate-600 hover:text-slate-800 border border-slate-200"
                      }`}
                      style={{ fontSize: "11px", fontWeight: 600 }}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </div>

              {/* 8. المرفقات */}
              <div
                className="p-3 rounded-lg border border-blue-100"
                style={{ backgroundColor: "#eff6ff" }} // blue-50
              >
                <label
                  className="block mb-2 text-slate-600"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  المرفقات المستلمة
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    "عرض سعر",
                    "فاتورة",
                    "عقد",
                    "رخصة البناء",
                    "صورة الطلب",
                  ].map((doc) => (
                    <label
                      key={doc}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={transactionFormData.attachments.includes(doc)}
                        onChange={() =>
                          toggleTransactionArrayItem("attachments", doc)
                        }
                        className="accent-blue-600 w-3.5 h-3.5"
                      />
                      <span
                        className="text-slate-600"
                        style={{ fontSize: "11px" }}
                      >
                        {doc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 9. الوسطاء والمعقبين */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label
                    className="block mb-1.5 text-slate-600"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    الوسيط
                  </label>
                  <div className="relative">
                    <select
                      value={transactionFormData.brokerId}
                      onChange={(e) =>
                        handleTransactionChange("brokerId", e.target.value)
                      }
                      className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-3 text-right cursor-pointer hover:border-blue-300 transition-colors appearance-none focus:outline-none focus:border-blue-500 text-slate-700"
                      style={{ height: "34px", fontSize: "12px" }}
                    >
                      <option value="">اختر وسيط...</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="relative">
                  <label
                    className="block mb-1.5 text-slate-600"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    المعقب
                  </label>
                  <div className="relative">
                    <select
                      value={transactionFormData.followUpAgentId}
                      onChange={(e) =>
                        handleTransactionChange(
                          "followUpAgentId",
                          e.target.value,
                        )
                      }
                      className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-3 text-right cursor-pointer hover:border-blue-300 transition-colors appearance-none focus:outline-none focus:border-blue-500 text-slate-700"
                      style={{ height: "34px", fontSize: "12px" }}
                    >
                      <option value="">اختر معقب...</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label
                    className="block mb-1.5 text-slate-600"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    صاحب المصلحة
                  </label>
                  <div className="relative">
                    <select
                      value={transactionFormData.stakeholderId}
                      onChange={(e) =>
                        handleTransactionChange("stakeholderId", e.target.value)
                      }
                      className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-3 text-right cursor-pointer hover:border-blue-300 transition-colors appearance-none focus:outline-none focus:border-blue-500 text-slate-700"
                      style={{ height: "34px", fontSize: "12px" }}
                    >
                      <option value="">اختر صاحب مصلحة...</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="relative">
                  <label
                    className="block mb-1.5 text-slate-600"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    المستلم
                  </label>
                  <div className="relative">
                    <select
                      value={transactionFormData.receiverId}
                      onChange={(e) =>
                        handleTransactionChange("receiverId", e.target.value)
                      }
                      className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-3 text-right cursor-pointer hover:border-blue-300 transition-colors appearance-none focus:outline-none focus:border-blue-500 text-slate-700"
                      style={{ height: "34px", fontSize: "12px" }}
                    >
                      <option value="">اختر مستلم...</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="relative">
                <label
                  className="block mb-1.5 text-slate-600"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  وسيط المكتب الهندسي
                </label>
                <div className="relative">
                  <select
                    value={transactionFormData.engOfficeBrokerId}
                    onChange={(e) =>
                      handleTransactionChange(
                        "engOfficeBrokerId",
                        e.target.value,
                      )
                    }
                    className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-3 text-right cursor-pointer hover:border-blue-300 transition-colors appearance-none focus:outline-none focus:border-blue-500 text-slate-700"
                    style={{ height: "34px", fontSize: "12px" }}
                  >
                    <option value="">اختر وسيط المكتب الهندسي...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* أزرار الإجراءات السفلية */}
            <div
              className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-200 shrink-0"
              style={{ backgroundColor: "#f8fafc" }}
            >
              <button
                onClick={() => setIsNewTransactionModalOpen(false)}
                className="px-4 py-1.5 rounded-md text-slate-600 hover:bg-slate-200 transition-colors"
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                إلغاء
              </button>
              <button
                onClick={handleTransactionSubmit}
                disabled={submitTransactionMutation.isPending}
                className="px-4 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                {submitTransactionMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                حفظ وإنشاء المعاملة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 2. نافذة (Modal) تسجيل تحصيل (Collection) */}
      {/* ================================================== */}
      {isCollectionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.6)" }}
          dir="rtl"
        >
          <div
            className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
            style={{ backgroundColor: "#ffffff" }}
          >
            {/* عنوان المودال */}
            <div
              className="flex justify-between items-center px-5 py-3 border-b border-slate-200 shrink-0"
              style={{ backgroundColor: "#f8fafc" }}
            >
              <h2
                className="font-bold flex items-center gap-2 text-slate-800"
                style={{ fontSize: "14px" }}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                تسجيل تحصيل مالي
              </h2>
              <button
                onClick={() => setIsCollectionModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1 rounded-md hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* محتوى المودال */}
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar-slim">
              {/* 1. رقم المعاملة */}
              <div>
                <label
                  className="mb-1.5 text-slate-600 flex justify-between"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  <span>
                    رقم المعاملة * <span className="text-red-500">*</span>
                  </span>
                  {isLoadingTransactions && (
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                  )}
                </label>
                <div className="relative">
                  <select
                    value={collectionFormData.transactionId}
                    onChange={(e) =>
                      handleCollectionChange("transactionId", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none"
                    style={{ height: "34px", fontSize: "12px" }}
                  >
                    <option value="">-- اختر المعاملة --</option>
                    {privateTransactions.map((tx) => (
                      <option key={tx.id} value={tx.id}>
                        {tx.ref} - {tx.client} ({tx.type})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 2. ملخص المبالغ (يظهر فقط إذا تم اختيار معاملة) */}
              {selectedTransactionDetails && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in">
                  <div
                    className="p-2.5 rounded-md border border-blue-200"
                    style={{ backgroundColor: "#eff6ff" }}
                  >
                    <div
                      className="text-blue-600 font-bold"
                      style={{ fontSize: "10px" }}
                    >
                      إجمالي أتعاب المعاملة
                    </div>
                    <div
                      className="font-mono mt-0.5"
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#1d4ed8",
                      }}
                    >
                      {selectedTransactionDetails.totalFees.toLocaleString()}
                    </div>
                  </div>
                  <div
                    className="p-2.5 rounded-md border border-amber-200"
                    style={{ backgroundColor: "#fffbeb" }}
                  >
                    <div
                      className="text-amber-600 font-bold"
                      style={{ fontSize: "10px" }}
                    >
                      المبلغ المتبقي للتحصيل
                    </div>
                    <div
                      className="font-mono mt-0.5"
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#b45309",
                      }}
                    >
                      {selectedTransactionDetails.remainingAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. ممن تم التحصيل */}
              <div>
                <label
                  className="block mb-1.5 text-slate-600"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  ممن تم التحصيل
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() =>
                      handleCollectionChange(
                        "collectedFromType",
                        "من أشخاص النظام",
                      )
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                      collectionFormData.collectedFromType === "من أشخاص النظام"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                    style={{ fontSize: "11px", fontWeight: 600 }}
                  >
                    من أشخاص النظام
                  </button>
                  <button
                    onClick={() =>
                      handleCollectionChange("collectedFromType", "شخص آخر")
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                      collectionFormData.collectedFromType === "شخص آخر"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                    style={{ fontSize: "11px", fontWeight: 600 }}
                  >
                    شخص آخر (خارجي)
                  </button>
                </div>

                {collectionFormData.collectedFromType === "من أشخاص النظام" ? (
                  <div className="relative">
                    <select
                      value={collectionFormData.collectedFromId}
                      onChange={(e) =>
                        handleCollectionChange(
                          "collectedFromId",
                          e.target.value,
                        )
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none"
                      style={{ height: "34px", fontSize: "12px" }}
                    >
                      <option value="">-- ابحث عن العميل أو الموظف --</option>
                      <optgroup label="العملاء (الملاك)">
                        {clients.map((c) => (
                          <option key={`c-${c.id}`} value={c.id}>
                            {c.name?.ar || c.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="الموظفين والوسطاء">
                        {employees.map((e) => (
                          <option key={`e-${e.id}`} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={collectionFormData.collectedFromOther}
                    onChange={(e) =>
                      handleCollectionChange(
                        "collectedFromOther",
                        e.target.value,
                      )
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                    placeholder="اكتب اسم الشخص المحول للمبلغ..."
                    style={{ height: "34px", fontSize: "12px" }}
                  />
                )}
              </div>

              {/* 4. المبلغ المحصل */}
              <div>
                <label
                  className="block mb-1.5 text-slate-600"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  المبلغ المحصّل *
                </label>
                <input
                  type="number"
                  value={collectionFormData.amount}
                  onChange={(e) =>
                    handleCollectionChange("amount", e.target.value)
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 font-mono focus:outline-none focus:border-emerald-500 text-lg font-bold"
                  placeholder="0"
                  style={{ height: "40px" }}
                />

                {/* أزرار النسب المئوية */}
                <div className="flex gap-2 mt-2">
                  {[25, 50, 75, 100].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => calculatePercentageAmount(percent)}
                      disabled={!selectedTransactionDetails?.totalFees}
                      className="flex-1 py-1.5 rounded-md bg-slate-100 text-slate-600 hover:bg-emerald-500 hover:text-white cursor-pointer transition-colors disabled:opacity-50"
                      style={{ fontSize: "11px", fontWeight: 600 }}
                    >
                      {percent}%
                    </button>
                  ))}
                </div>

                {/* حساب المتبقي بعد هذا التحصيل ديناميكياً */}
                {selectedTransactionDetails && collectionFormData.amount && (
                  <div
                    className="mt-2 text-slate-500"
                    style={{ fontSize: "11px" }}
                  >
                    المتبقي بعد هذا التحصيل:{" "}
                    <span
                      className="font-mono font-bold"
                      style={{
                        color:
                          selectedTransactionDetails.remainingAmount -
                            parseFloat(collectionFormData.amount) <
                          0
                            ? "red"
                            : "var(--wms-warning)",
                      }}
                    >
                      {(
                        selectedTransactionDetails.remainingAmount -
                        parseFloat(collectionFormData.amount)
                      ).toLocaleString()}{" "}
                      ريال
                    </span>
                  </div>
                )}
              </div>

              {/* 5. فترة التحصيل / طريقة التحصيل / المستلم */}
              <div>
                <label
                  className="block mb-1.5 text-slate-600"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  فترة التحصيل / مرجعية التحصيل
                </label>
                <input
                  type="text"
                  value={collectionFormData.periodRef}
                  onChange={(e) =>
                    handleCollectionChange("periodRef", e.target.value)
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                  placeholder="مثال: الدفعة الثانية — فبراير 2026"
                  style={{ height: "34px", fontSize: "12px" }}
                />
              </div>

              <div>
                <label
                  className="block mb-1.5 text-slate-600"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  طريقة التحصيل
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleCollectionChange("paymentMethod", "بنكي")
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                      collectionFormData.paymentMethod === "بنكي"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                    style={{ fontSize: "11px", fontWeight: 600 }}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>بنكي</span>
                  </button>
                  <button
                    onClick={() =>
                      handleCollectionChange("paymentMethod", "نقدي")
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                      collectionFormData.paymentMethod === "نقدي"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                    style={{ fontSize: "11px", fontWeight: 600 }}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>نقدي</span>
                  </button>
                  <button
                    onClick={() =>
                      handleCollectionChange("paymentMethod", "غير مسلم للشركة")
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                      collectionFormData.paymentMethod === "غير مسلم للشركة"
                        ? "bg-amber-500 text-white"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                    style={{ fontSize: "11px", fontWeight: 600 }}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>غير مسلم للشركة</span>
                  </button>
                </div>
              </div>

              {/* إذا كان بنكي، نطلب الحساب */}
              {collectionFormData.paymentMethod === "بنكي" && (
                <div
                  className="rounded-lg p-3 space-y-3"
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.05)", // emerald-50
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                  }}
                >
                  <div className="relative">
                    <label
                      className="block mb-1.5 text-slate-600"
                      style={{ fontSize: "11px", fontWeight: 700 }}
                    >
                      حساب البنك
                    </label>
                    <select
                      value={collectionFormData.bankAccountId}
                      onChange={(e) =>
                        handleCollectionChange("bankAccountId", e.target.value)
                      }
                      className="w-full flex items-center justify-between bg-white border border-emerald-200 rounded-md px-3 text-right cursor-pointer hover:border-emerald-300 transition-colors appearance-none focus:outline-none focus:border-emerald-500 text-slate-700"
                      style={{ height: "34px", fontSize: "12px" }}
                    >
                      <option value="">-- اختر الحساب البنكي --</option>
                      <option value="bank_1">البنك الأهلي - حساب الشركة</option>
                      <option value="bank_2">مصرف الراجحي - حساب الشركة</option>
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="flex items-start gap-1.5 mt-2">
                    <Info className="w-3 h-3 mt-0.5 shrink-0 text-emerald-600" />
                    <span
                      className="text-emerald-700"
                      style={{ fontSize: "10px" }}
                    >
                      هذا المبلغ سيدخل ضمن رصيد البنك الرسمي للشركة.
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block mb-1.5 text-slate-600"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    تاريخ التحصيل
                  </label>
                  <input
                    type="date"
                    value={collectionFormData.date}
                    onChange={(e) =>
                      handleCollectionChange("date", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                    style={{ height: "34px", fontSize: "12px" }}
                  />
                </div>
                <div className="relative">
                  <label
                    className="block mb-1.5 text-slate-600"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    المستلم (الموظف)
                  </label>
                  <select
                    value={collectionFormData.receiverId}
                    onChange={(e) =>
                      handleCollectionChange("receiverId", e.target.value)
                    }
                    className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-3 text-right cursor-pointer hover:border-emerald-300 transition-colors appearance-none focus:outline-none focus:border-emerald-500 text-slate-700"
                    style={{ height: "34px", fontSize: "12px" }}
                  >
                    <option value="">-- من استلم المبلغ؟ --</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 6. المرفقات والملاحظات */}
              <div>
                <label
                  className="block mb-1.5 text-slate-600"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  ملاحظات إضافية
                </label>
                <textarea
                  value={collectionFormData.notes}
                  onChange={(e) =>
                    handleCollectionChange("notes", e.target.value)
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 resize-none focus:outline-none focus:border-emerald-500"
                  placeholder="ملاحظات حول هذه الدفعة..."
                  style={{ height: "60px", fontSize: "12px" }}
                ></textarea>
              </div>

              <div>
                <label
                  className="block mb-1.5 text-slate-600"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  إرفاق إيصال الحوالة / السند
                </label>
                <label
                  className="flex flex-col items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                  style={{ fontSize: "11px" }}
                >
                  <Upload className="w-5 h-5" />
                  <span>
                    {collectionFormData.attachment
                      ? collectionFormData.attachment.name
                      : "اضغط لاختيار ملف (صورة أو PDF)"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      handleCollectionChange("attachment", e.target.files[0])
                    }
                    accept="image/*,application/pdf"
                  />
                </label>
              </div>

              <div className="flex items-start gap-1.5 bg-slate-50 p-2 rounded-md">
                <Info className="w-3 h-3 mt-0.5 shrink-0 text-slate-400" />
                <span
                  className="text-slate-500"
                  style={{ fontSize: "9px", opacity: 0.8 }}
                >
                  هذا النظام مخصص للتسويات والمتابعة الداخلية المبسطة، والأرقام
                  المعروضة تقديرية تشغيلية وليست معالجة محاسبية أو ضريبية رسمية.
                </span>
              </div>
            </div>

            {/* أزرار الإجراءات السفلية */}
            <div
              className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-200 shrink-0"
              style={{ backgroundColor: "#f8fafc" }}
            >
              <button
                onClick={() => setIsCollectionModalOpen(false)}
                className="px-4 py-1.5 rounded-md text-slate-600 hover:bg-slate-200 transition-colors"
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                إلغاء
              </button>
              <button
                onClick={handleCollectionSubmit}
                disabled={submitCollectionMutation.isPending}
                className="px-6 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                {submitCollectionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Banknote className="w-4 h-4" />
                )}
                تسجيل التحصيل
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
