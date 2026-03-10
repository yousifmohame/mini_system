import React, { useState, useEffect, useMemo } from "react";
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
  Landmark,
  RefreshCw,
} from "lucide-react";

const EMPTY_ARRAY = [];

const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ==================================================
  // Modals Visibility States
  // ==================================================
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] =
    useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [isVaultInvModalOpen, setIsVaultInvModalOpen] = useState(false);
  const [isBankInvModalOpen, setIsBankInvModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // ==================================================
  // Forms States
  // ==================================================
  const [transactionFormData, setTransactionFormData] = useState({
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
  });

  const [collectionFormData, setCollectionFormData] = useState({
    transactionId: "",
    collectedFromType: "من أشخاص النظام",
    collectedFromId: "",
    collectedFromOther: "",
    amount: "",
    periodRef: "",
    paymentMethod: "بنكي",
    bankAccountId: "",
    date: new Date().toISOString().split("T")[0],
    receiverId: "",
    notes: "",
    attachment: null,
  });

  const [settlementForm, setSettlementForm] = useState({
    targetType: "وسيط",
    targetId: "",
    amount: "",
    source: "",
    notes: "",
  });
  const [deliverForm, setDeliverForm] = useState({
    targetType: "وسيط",
    targetId: "",
    amount: "",
    method: "نقدي",
    date: new Date().toISOString().split("T")[0],
    deliveredById: "",
    notes: "",
    attachment: null,
  });
  const [vaultInvForm, setVaultInvForm] = useState({
    actualBalance: "",
    recordedById: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [bankInvForm, setBankInvForm] = useState({
    accountId: "",
    actualBalance: "",
    recordedById: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    attachment: null,
  });
  const [expenseForm, setExpenseForm] = useState({
    item: "",
    amount: "",
    payerId: "",
    source: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    attachment: null,
  });

  const [selectedTransactionDetails, setSelectedTransactionDetails] =
    useState(null);

  // ==================================================
  // Data Fetching (Queries)
  // ==================================================
  const { data: clients = EMPTY_ARRAY } = useQuery({
    queryKey: ["clients-simple"],
    queryFn: async () => {
      const res = await api.get("/clients/simple");
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
    enabled: isNewTransactionModalOpen || isCollectionModalOpen,
  });
  const { data: riyadhZones = EMPTY_ARRAY } = useQuery({
    queryKey: ["riyadhZones"],
    queryFn: async () => {
      const res = await api.get("/riyadh-zones");
      return res.data?.data || [];
    },
    enabled: isNewTransactionModalOpen,
  });
  const { data: plans = EMPTY_ARRAY } = useQuery({
    queryKey: ["riyadh-plans-simple"],
    queryFn: async () => {
      const res = await api.get("/riyadh-streets/plans");
      return res.data || [];
    },
    enabled: isNewTransactionModalOpen,
  });
  const { data: persons = [] } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => {
      const res = await api.get("/persons");
      return res.data?.data || [];
    },
  });
  const { data: offices = [], isLoading: isLoadingOffices } = useQuery({
    queryKey: ["coop-offices"],
    queryFn: async () => {
      const res = await api.get("/coop-offices");
      return res.data?.data || [];
    },
    enabled: isNewTransactionModalOpen,
  });
  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const res = await api.get("/bank-accounts");
      return res.data?.data || [];
    },
  });

  const { data: privateTransactionsData, isLoading: isLoadingTransactions } =
    useQuery({
      queryKey: ["private-transactions-simple"],
      queryFn: async () => {
        const res = await api.get("/private-transactions");
        return res.data?.data || [];
      },
      enabled: isCollectionModalOpen,
    });

  // ✅ FIXED: Memoize to prevent reference changes on every render
  const privateTransactions = useMemo(
    () => privateTransactionsData?.data || privateTransactionsData || EMPTY_ARRAY,
    [privateTransactionsData]
  );

  const { data: dashboardStats = {}, isLoading: isLoadingStats } = useQuery({
  queryKey: ["private-dashboard-stats"],
  queryFn: async () => {
    const res = await api.get("/private-transactions/dashboard-stats");
    return res.data?.data || {};
  },
});

  // Filtering persons based on roles for dropdowns
  const brokers = useMemo(
    () => persons.filter((p) => p.role === "وسيط"),
    [persons],
  );
  const agents = useMemo(
    () => persons.filter((p) => p.role === "معقب"),
    [persons],
  );
  const stakeholders = useMemo(
    () => persons.filter((p) => p.role === "صاحب مصلحة"),
    [persons],
  );
  const partners = useMemo(
    () => persons.filter((p) => p.role === "شريك"),
    [persons],
  );
  const employeesList = useMemo(
    () => persons.filter((p) => p.role === "موظف"),
    [persons],
  );

  const engBrokers = useMemo(
    () => persons.filter((p) => p.role === "وسيط المكتب الهندسي"),
    [persons],
  );

  const getTargetList = (type) => {
    if (type === "وسيط") return brokers;
    if (type === "معقب") return agents;
    if (type === "صاحب مصلحة") return stakeholders;
    if (type === "شريك") return partners;
    if (type === "موظف") return employeesList;
    return [];
  };

  // ==================================================
  // Handlers & Change Functions
  // ==================================================
  const handleTransactionChange = (field, value) =>
    setTransactionFormData((prev) => ({ ...prev, [field]: value }));
  const handleCollectionChange = (field, value) =>
    setCollectionFormData((prev) => ({ ...prev, [field]: value }));
  const handleSetChange = (field, value) =>
    setSettlementForm((prev) => ({ ...prev, [field]: value }));
  const handleDelChange = (field, value) =>
    setDeliverForm((prev) => ({ ...prev, [field]: value }));
  const handleVaultChange = (field, value) =>
    setVaultInvForm((prev) => ({ ...prev, [field]: value }));
  const handleBankInvChange = (field, value) =>
    setBankInvForm((prev) => ({ ...prev, [field]: value }));
  const handleExpChange = (field, value) =>
    setExpenseForm((prev) => ({ ...prev, [field]: value }));

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

  useEffect(() => {
    if (collectionFormData.transactionId && privateTransactions.length > 0) {
      const selectedTx = privateTransactions.find(
        (tx) => (tx.dbId || tx.id) === collectionFormData.transactionId,
      );

      if (selectedTx) {
        const newDetails = {
          totalFees: selectedTx.totalPrice ?? selectedTx.totalFees ?? 0,
          paidAmount: selectedTx.collectionAmount ?? selectedTx.paidAmount ?? 0,
          remainingAmount: selectedTx.remainingAmount ?? 0,
        };

        // Only update state if values actually changed
        setSelectedTransactionDetails((prev) => {
          if (
            prev?.totalFees === newDetails.totalFees &&
            prev?.paidAmount === newDetails.paidAmount &&
            prev?.remainingAmount === newDetails.remainingAmount
          ) {
            return prev; // No change needed - prevents infinite loop
          }
          return newDetails;
        });
      } else {
        setSelectedTransactionDetails(null);
      }
    } else {
      setSelectedTransactionDetails(null);
    }
  }, [collectionFormData.transactionId, privateTransactions]);

  const calculatePercentageAmount = (percentage) => {
    if (!selectedTransactionDetails?.totalFees) return;
    const amount = (
      selectedTransactionDetails.totalFees *
      (percentage / 100)
    ).toFixed(2);
    handleCollectionChange("amount", amount);
  };

  // ==================================================
  // Mutations (Save to Backend)
  // ==================================================
  const submitTransactionMutation = useMutation({
    mutationFn: async (payload) =>
      await api.post("/private-transactions", payload),
    onSuccess: () => {
      toast.success("تم تسجيل المعاملة بنجاح!");
      queryClient.invalidateQueries(["private-dashboard-stats"]);
      queryClient.invalidateQueries(["private-transactions-simple"]);
      setIsNewTransactionModalOpen(false);
      setTransactionFormData({
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
      });
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message || "حدث خطأ أثناء تسجيل المعاملة",
      ),
  });

  const submitCollectionMutation = useMutation({
    mutationFn: async (payload) => {
      const fd = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === "attachment" && payload[key])
          fd.append("file", payload[key]);
        else if (key !== "attachment") fd.append(key, payload[key]);
      });
      return await api.post("/private-transactions/payments", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("تم تسجيل التحصيل بنجاح!");
      queryClient.invalidateQueries(["private-dashboard-stats"]);
      queryClient.invalidateQueries(["private-transactions-simple"]);
      setIsCollectionModalOpen(false);
      setCollectionFormData({
        transactionId: "",
        collectedFromType: "من أشخاص النظام",
        collectedFromId: "",
        collectedFromOther: "",
        amount: "",
        periodRef: "",
        paymentMethod: "بنكي",
        bankAccountId: "",
        date: new Date().toISOString().split("T")[0],
        receiverId: "",
        notes: "",
        attachment: null,
      });
      setSelectedTransactionDetails(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ أثناء تسجيل التحصيل"),
  });

  const settleMutation = useMutation({
    mutationFn: async (data) => await api.post("/finance/settlements", data),
    onSuccess: () => {
      toast.success("تم تسجيل التسوية بنجاح!");
      setIsSettlementModalOpen(false);
      setSettlementForm({
        targetType: "وسيط",
        targetId: "",
        amount: "",
        source: "",
        notes: "",
      });
    },
    onError: (err) => toast.error(err.response?.data?.message || "حدث خطأ"),
  });

  const deliverMutation = useMutation({
    mutationFn: async (data) => {
      const fd = new FormData();
      Object.keys(data).forEach((k) => {
        if (k === "attachment" && data[k]) fd.append("file", data[k]);
        else fd.append(k, data[k]);
      });
      return await api.post("/finance/settlements/deliver", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("تم تسليم التسوية بنجاح!");
      setIsDeliverModalOpen(false);
      setDeliverForm({
        targetType: "وسيط",
        targetId: "",
        amount: "",
        method: "نقدي",
        date: new Date().toISOString().split("T")[0],
        deliveredById: "",
        notes: "",
        attachment: null,
      });
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const inventoryMutation = useMutation({
    mutationFn: async (data) => await api.post("/finance/inventory", data),
    onSuccess: () => {
      toast.success("تم تسجيل الجرد بنجاح!");
      setIsVaultInvModalOpen(false);
      setIsBankInvModalOpen(false);
      queryClient.invalidateQueries(["bank-accounts"]);
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const expenseMutation = useMutation({
    mutationFn: async (data) => {
      const fd = new FormData();
      Object.keys(data).forEach((k) => {
        if (k === "attachment" && data[k]) fd.append("file", data[k]);
        else fd.append(k, data[k]);
      });
      return await api.post("/office-expenses", fd);
    },
    onSuccess: () => {
      toast.success("تم تسجيل المصروف بنجاح!");
      setIsExpenseModalOpen(false);
      setExpenseForm({
        item: "",
        amount: "",
        payerId: "",
        source: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        attachment: null,
      });
    },
    onError: () => toast.error("حدث خطأ"),
  });

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
              className="flex items-center gap-1.5 px-3 rounded-md cursor-pointer hover:opacity-90 shrink-0"
              style={{
                height: "32px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "var(--wms-accent-blue)",
                color: "white",
              }}
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>تسجيل معاملة جديدة</span>
            </button>
            <button
              onClick={() => setIsCollectionModalOpen(true)}
              className="flex items-center gap-1.5 px-3 rounded-md cursor-pointer hover:opacity-90 shrink-0"
              style={{
                height: "32px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "var(--wms-success)",
                color: "white",
              }}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>تسجيل تحصيل</span>
            </button>
            <button
              onClick={() => setIsSettlementModalOpen(true)}
              className="flex items-center gap-1.5 px-3 rounded-md cursor-pointer hover:opacity-90 shrink-0"
              style={{
                height: "32px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "var(--wms-success)",
                color: "white",
              }}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>تسجيل تسوية</span>
            </button>
            <button
              onClick={() => setIsDeliverModalOpen(true)}
              className="flex items-center gap-1.5 px-3 rounded-md cursor-pointer hover:opacity-90 shrink-0"
              style={{
                height: "32px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "var(--wms-success)",
                color: "white",
              }}
            >
              <Send className="w-3.5 h-3.5" />
              <span>تسجيل تسليم تسوية</span>
            </button>
            <button
              onClick={() => setIsVaultInvModalOpen(true)}
              className="flex items-center gap-1.5 px-3 rounded-md cursor-pointer hover:opacity-90 shrink-0"
              style={{
                height: "32px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "rgb(245, 158, 11)",
                color: "white",
              }}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>جرد خزنة</span>
            </button>
            <button
              onClick={() => setIsBankInvModalOpen(true)}
              className="flex items-center gap-1.5 px-3 rounded-md cursor-pointer hover:opacity-90 shrink-0"
              style={{
                height: "32px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "rgb(245, 158, 11)",
                color: "white",
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>جرد حساب بنكي</span>
            </button>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center gap-1.5 px-3 rounded-md cursor-pointer hover:opacity-90 shrink-0"
              style={{
                height: "32px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "var(--wms-accent-blue)",
                color: "white",
              }}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>تسجيل مصروف</span>
            </button>
            <span
              className="shrink-0 text-wms-text-muted mr-auto"
              style={{ fontSize: "10px", opacity: 0.7 }}
            >
              هذا النظام مخصص للتسويات الداخلية والمتابعة المالية المبسطة فقط
            </span>
          </div>

          <div className="p-4 space-y-4">
            {/* الإحصائيات العلوية */}
            <div className="flex items-center gap-5 px-4 py-2.5 bg-wms-surface-1 border border-wms-border rounded-lg">
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
                  <div className="text-wms-text-muted text-[10px]">
                    إجمالي المعاملات
                  </div>
                  <div className="font-mono text-[15px] font-bold text-[var(--wms-accent-blue)]">
                    {isLoadingStats
                      ? "..."
                      : (dashboardStats.totalCount || 0).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="w-px h-8 bg-wms-border"></div>
              <div className="flex items-center gap-2">
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
                  <div className="text-wms-text-muted text-[10px]">
                    إجمالي المبالغ
                  </div>
                  <div className="font-mono text-[15px] font-bold text-[var(--wms-success)]">
                    {isLoadingStats
                      ? "..."
                      : (
                          dashboardStats.totalProfits || 0
                        ).toLocaleString()}{" "}
                    ر.س
                  </div>
                </div>
              </div>
              <div className="w-px h-8 bg-wms-border"></div>
              <div className="flex items-center gap-2">
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
                  <div className="text-wms-text-muted text-[10px]">
                    الوسطاء النشطون
                  </div>
                  <div className="font-mono text-[15px] font-bold text-[var(--chart-4)]">
                    {isLoadingStats
                      ? "..."
                      : (dashboardStats.activeBrokers || 0).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="w-px h-8 bg-wms-border"></div>
              <div className="flex items-center gap-2">
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
                  <div className="text-wms-text-muted text-[10px]">
                    السيولة المحصلة
                  </div>
                  <div className="font-mono text-[15px] font-bold text-[var(--wms-warning)]">
                    {isLoadingStats
                      ? "..."
                      : (
                          dashboardStats.vaultBalance || 0
                        ).toLocaleString()}{" "}
                    ر.س
                  </div>
                </div>
              </div>
            </div>

            {/* الجداول والإحصائيات */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 bg-wms-surface-1 border border-wms-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-wms-border">
                  <span className="text-wms-text text-[13px] font-bold">
                    آخر المعاملات الداخلية
                  </span>
                  <span className="text-wms-text-muted text-[11px]">
                    حسب الأحدث
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[300px] custom-scrollbar-slim">
                  <table className="w-full text-right text-[12px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[var(--wms-surface-2)]">
                        <th className="px-3 py-2 text-wms-text-sec font-bold text-[11px]">
                          رقم المعاملة
                        </th>
                        <th className="px-3 py-2 text-wms-text-sec font-bold text-[11px]">
                          النوع
                        </th>
                        <th className="px-3 py-2 text-wms-text-sec font-bold text-[11px]">
                          المالك
                        </th>
                        <th className="px-3 py-2 text-wms-text-sec font-bold text-[11px]">
                          القطاع
                        </th>
                        <th className="px-3 py-2 text-wms-text-sec font-bold text-[11px]">
                          المبلغ
                        </th>
                        <th className="px-3 py-2 text-wms-text-sec font-bold text-[11px]">
                          الحالة
                        </th>
                        <th className="px-3 py-2 text-wms-text-sec font-bold text-[11px]">
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
                            <td className="px-3 py-2 text-wms-blue font-mono font-bold text-[11px]">
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
                                className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold"
                                style={{
                                  backgroundColor:
                                    tx.status === "مكتملة"
                                      ? "rgba(34, 197, 94, 0.15)"
                                      : "rgba(59, 130, 246, 0.15)",
                                  color:
                                    tx.status === "مكتملة"
                                      ? "var(--wms-success)"
                                      : "var(--wms-accent-blue)",
                                }}
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-wms-text-muted font-mono text-[11px]">
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
                  <span className="text-wms-text text-[13px] font-bold">
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
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 1. Modal: تسجيل معاملة جديدة */}
      {/* ========================================================================= */}
      {isNewTransactionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60"
          dir="rtl"
        >
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden border border-slate-200 bg-white animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-5 py-3 border-b border-slate-200 shrink-0 bg-slate-50">
              <h2 className="font-bold flex items-center gap-2 text-slate-800 text-[14px]">
                <FilePlus className="w-4 h-4 text-blue-600" />
                تسجيل معاملة جديدة
              </h2>
              <button
                onClick={() => setIsNewTransactionModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar-slim">
              <div>
                <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
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
                        className={`px-3 py-1.5 rounded-md transition-colors text-[11px] font-bold ${transactionFormData.transactionType === type ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 hover:text-slate-800 border border-slate-200"}`}
                      >
                        {type}
                      </button>
                    ),
                  )}
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                  نوع الرفع
                </label>
                <div className="flex gap-2">
                  {["برافع", "بدون رفع"].map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        handleTransactionChange("surveyType", type)
                      }
                      className={`px-3 py-1.5 rounded-md transition-colors text-[11px] font-bold ${transactionFormData.surveyType === type ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 hover:text-slate-800 border border-slate-200"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 text-slate-600 flex justify-between text-[11px] font-bold">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 outline-none focus:border-blue-500 appearance-none h-[34px] text-[12px]"
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                    القطعة
                  </label>
                  <input
                    type="text"
                    value={transactionFormData.plotNumber}
                    onChange={(e) =>
                      handleTransactionChange("plotNumber", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 outline-none focus:border-blue-500 h-[34px] text-[12px]"
                    placeholder="رقم القطعة"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                    المخطط
                  </label>
                  <div className="relative">
                    <select
                      value={transactionFormData.planId}
                      onChange={(e) =>
                        handleTransactionChange("planId", e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 outline-none focus:border-blue-500 appearance-none h-[34px] text-[12px]"
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
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-700 flex items-center gap-1.5 text-[12px] font-bold">
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
                  className="w-full bg-white border border-blue-200 rounded-lg px-4 text-blue-700 font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-lg font-bold h-[42px]"
                  placeholder="مثال: 4500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="mb-1.5 text-slate-600 flex justify-between text-[11px] font-bold">
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-md pr-8 pl-8 text-slate-800 outline-none focus:border-blue-500 appearance-none h-[34px] text-[12px]"
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
                  <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                    القطاع (تلقائي)
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 h-[34px] text-[12px]">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span
                      className={`font-bold ${transactionFormData.sectorName ? "text-slate-800" : "text-slate-400"}`}
                    >
                      {transactionFormData.sectorName
                        ? `قطاع ${transactionFormData.sectorName}`
                        : "يتحدد تلقائياً"}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
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
                      <span className="text-slate-600 text-[12px]">
                        {entity}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-slate-600 flex justify-between text-[11px] font-bold">
                  <span>مصدر المعاملة</span>
                  {isLoadingOffices && (
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                  )}
                </label>
                <div className="relative">
                  <select
                    value={transactionFormData.source}
                    onChange={(e) =>
                      handleTransactionChange("source", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 outline-none focus:border-blue-500 appearance-none h-[34px] text-[12px]"
                  >
                    <option value="مكتب ديتيلز">مكتب ديتيلز (داخلي)</option>
                    {offices.map((office) => (
                      <option key={office.id} value={office.name}>
                        {office.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/50">
                <label className="block mb-2 text-slate-600 text-[11px] font-bold">
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
                      <span className="text-slate-600 text-[11px]">{doc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                    الوسيط
                  </label>
                  <select
                    value={transactionFormData.brokerId}
                    onChange={(e) =>
                      handleTransactionChange("brokerId", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 outline-none focus:border-blue-500 appearance-none h-[34px] text-[12px]"
                  >
                    <option value="">اختر وسيط...</option>
                    {brokers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                    المعقب
                  </label>
                  <select
                    value={transactionFormData.followUpAgentId}
                    onChange={(e) =>
                      handleTransactionChange("followUpAgentId", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 outline-none focus:border-blue-500 appearance-none h-[34px] text-[12px]"
                  >
                    <option value="">اختر معقب...</option>
                    {agents.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                    صاحب المصلحة
                  </label>
                  <select
                    value={transactionFormData.stakeholderId}
                    onChange={(e) =>
                      handleTransactionChange("stakeholderId", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 outline-none focus:border-blue-500 appearance-none h-[34px] text-[12px]"
                  >
                    <option value="">اختر صاحب مصلحة...</option>
                    {stakeholders.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                    المستلم (موظف)
                  </label>
                  <select
                    value={transactionFormData.receiverId}
                    onChange={(e) =>
                      handleTransactionChange("receiverId", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 outline-none focus:border-blue-500 appearance-none h-[34px] text-[12px]"
                  >
                    <option value="">اختر مستلم...</option>
                    {employeesList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="relative">
                <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                  وسيط المكتب الهندسي
                </label>
                <select
                  value={transactionFormData.engOfficeBrokerId}
                  onChange={(e) =>
                    handleTransactionChange("engOfficeBrokerId", e.target.value)
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 outline-none focus:border-blue-500 appearance-none h-[34px] text-[12px]"
                >
                  <option value="">اختر وسيط المكتب الهندسي...</option>
                  {engBrokers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
              <button
                onClick={() => setIsNewTransactionModalOpen(false)}
                className="px-4 py-1.5 rounded-md text-slate-600 hover:bg-slate-200 transition-colors text-[12px] font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (!transactionFormData.clientId)
                    return toast.error("الرجاء اختيار المالك");
                  if (!transactionFormData.districtId)
                    return toast.error("الرجاء اختيار الحي");
                  submitTransactionMutation.mutate(transactionFormData);
                }}
                disabled={submitTransactionMutation.isPending}
                className="px-4 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 text-[12px] font-bold"
              >
                {submitTransactionMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}{" "}
                حفظ وإنشاء المعاملة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 2. Modal: تسجيل تحصيل (Collection) */}
      {/* ================================================== */}
      {isCollectionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60"
          dir="rtl"
        >
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden border border-slate-200 bg-white animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-5 py-3 border-b border-slate-200 shrink-0 bg-slate-50">
              <h2 className="font-bold flex items-center gap-2 text-slate-800 text-[14px]">
                <Banknote className="w-4 h-4 text-emerald-600" />
                تسجيل تحصيل مالي
              </h2>
              <button
                onClick={() => setIsCollectionModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar-slim">
              <div>
                <label className="mb-1.5 text-slate-600 flex justify-between text-[11px] font-bold">
                  <span>
                    رقم المعاملة واسم العميل *{" "}
                    <span className="text-red-500">*</span>
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 outline-none focus:border-emerald-500 appearance-none h-[34px] text-[12px]"
                  >
                    <option value="">-- اختر المعاملة --</option>
                    {privateTransactions.map((tx) => (
                      <option key={tx.dbId || tx.id} value={tx.dbId || tx.id}>
                        {tx.id} - {tx.owner || tx.client} ({tx.type})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              {selectedTransactionDetails && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in">
                  <div className="p-2.5 rounded-md border border-blue-200 bg-blue-50/50">
                    <div className="text-blue-600 font-bold text-[10px]">
                      إجمالي أتعاب المعاملة
                    </div>
                    <div className="font-mono mt-0.5 text-[15px] font-bold text-blue-700">
                      {selectedTransactionDetails.totalFees.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-md border border-amber-200 bg-amber-50/50">
                    <div className="text-amber-600 font-bold text-[10px]">
                      المبلغ المتبقي للتحصيل
                    </div>
                    <div className="font-mono mt-0.5 text-[15px] font-bold text-amber-700">
                      {selectedTransactionDetails.remainingAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-[11px] font-bold ${collectionFormData.collectedFromType === "من أشخاص النظام" ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
                  >
                    من أشخاص النظام
                  </button>
                  <button
                    onClick={() =>
                      handleCollectionChange("collectedFromType", "شخص آخر")
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-[11px] font-bold ${collectionFormData.collectedFromType === "شخص آخر" ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 outline-none focus:border-emerald-500 appearance-none h-[34px] text-[12px]"
                    >
                      <option value="">-- ابحث عن العميل أو الشخص --</option>
                      <optgroup label="العملاء (الملاك)">
                        {clients.map((c) => (
                          <option key={`c-${c.id}`} value={c.id}>
                            {c.name?.ar || c.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="سجل الأشخاص (موظفين، وسطاء...)">
                        {persons.map((p) => (
                          <option key={`p-${p.id}`} value={p.id}>
                            {p.name} ({p.role})
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 outline-none focus:border-emerald-500 h-[34px] text-[12px]"
                    placeholder="اكتب اسم الشخص المحول للمبلغ..."
                  />
                )}
              </div>
              <div>
                <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                  المبلغ المحصّل *
                </label>
                <input
                  type="number"
                  value={collectionFormData.amount}
                  onChange={(e) =>
                    handleCollectionChange("amount", e.target.value)
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 font-mono outline-none focus:border-emerald-500 text-lg font-bold h-[40px]"
                  placeholder="0"
                />
                <div className="flex gap-2 mt-2">
                  {[25, 50, 75, 100].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => calculatePercentageAmount(percent)}
                      disabled={!selectedTransactionDetails?.totalFees}
                      className="flex-1 py-1.5 rounded-md bg-slate-100 text-slate-600 hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50 text-[11px] font-bold"
                    >
                      {percent}%
                    </button>
                  ))}
                </div>
                {selectedTransactionDetails && collectionFormData.amount && (
                  <div className="mt-2 text-slate-500 text-[11px]">
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
              <div>
                <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                  فترة التحصيل / مرجعية التحصيل
                </label>
                <input
                  type="text"
                  value={collectionFormData.periodRef}
                  onChange={(e) =>
                    handleCollectionChange("periodRef", e.target.value)
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 outline-none focus:border-emerald-500 h-[34px] text-[12px]"
                  placeholder="مثال: الدفعة الثانية — فبراير 2026"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                  طريقة التحصيل
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleCollectionChange("paymentMethod", "بنكي")
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-[11px] font-bold ${collectionFormData.paymentMethod === "بنكي" ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>بنكي</span>
                  </button>
                  <button
                    onClick={() =>
                      handleCollectionChange("paymentMethod", "نقدي")
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-[11px] font-bold ${collectionFormData.paymentMethod === "نقدي" ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>نقدي</span>
                  </button>
                  <button
                    onClick={() =>
                      handleCollectionChange("paymentMethod", "غير مسلم للشركة")
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-[11px] font-bold ${collectionFormData.paymentMethod === "غير مسلم للشركة" ? "bg-amber-500 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>غير مسلم للشركة</span>
                  </button>
                </div>
              </div>
              {collectionFormData.paymentMethod === "بنكي" && (
                <div className="rounded-lg p-3 space-y-3 bg-emerald-50/50 border border-emerald-200/50">
                  <div className="relative">
                    <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                      حساب البنك
                    </label>
                    <select
                      value={collectionFormData.bankAccountId}
                      onChange={(e) =>
                        handleCollectionChange("bankAccountId", e.target.value)
                      }
                      className="w-full bg-white border border-emerald-200 rounded-md px-3 text-slate-800 outline-none focus:border-emerald-500 appearance-none h-[34px] text-[12px]"
                    >
                      <option value="">-- اختر الحساب البنكي --</option>
                      {bankAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.bankName} - {acc.accountNumber}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="flex items-start gap-1.5 mt-2">
                    <Info className="w-3 h-3 mt-0.5 shrink-0 text-emerald-600" />
                    <span className="text-emerald-700 text-[10px]">
                      هذا المبلغ سيدخل ضمن رصيد البنك الرسمي للشركة.
                    </span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                    تاريخ التحصيل
                  </label>
                  <input
                    type="date"
                    value={collectionFormData.date}
                    onChange={(e) =>
                      handleCollectionChange("date", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 outline-none focus:border-emerald-500 h-[34px] text-[12px]"
                  />
                </div>
                <div className="relative">
                  <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                    المستلم (الموظف)
                  </label>
                  <select
                    value={collectionFormData.receiverId}
                    onChange={(e) =>
                      handleCollectionChange("receiverId", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 text-slate-800 outline-none focus:border-emerald-500 appearance-none h-[34px] text-[12px]"
                  >
                    <option value="">-- من استلم المبلغ؟ --</option>
                    {employeesList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                  ملاحظات إضافية
                </label>
                <textarea
                  value={collectionFormData.notes}
                  onChange={(e) =>
                    handleCollectionChange("notes", e.target.value)
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 resize-none outline-none focus:border-emerald-500 h-[60px] text-[12px]"
                  placeholder="ملاحظات حول هذه الدفعة..."
                ></textarea>
              </div>
              <div>
                <label className="block mb-1.5 text-slate-600 text-[11px] font-bold">
                  إرفاق إيصال الحوالة / السند
                </label>
                <label className="flex flex-col items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-[11px]">
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
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
              <button
                onClick={() => setIsCollectionModalOpen(false)}
                className="px-4 py-1.5 rounded-md text-slate-600 hover:bg-slate-200 transition-colors text-[12px] font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (
                    !collectionFormData.transactionId ||
                    !collectionFormData.amount
                  )
                    return toast.error("أكمل الحقول");
                  submitCollectionMutation.mutate(collectionFormData);
                }}
                disabled={submitCollectionMutation.isPending}
                className="px-6 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm text-[12px] font-bold"
              >
                {submitCollectionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Banknote className="w-4 h-4" />
                )}{" "}
                تسجيل التحصيل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 3. Modal: تسجيل تسوية (Record Settlement) */}
      {/* ================================================== */}
      {isSettlementModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white border border-[var(--wms-border)] rounded-xl shadow-2xl w-full max-w-[460px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)] bg-gray-50">
              <span className="text-[var(--wms-text)] text-[15px] font-bold">
                تسجيل تسوية (مستحق)
              </span>
              <button
                onClick={() => setIsSettlementModalOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  نوع التسوية
                </label>
                <div className="flex gap-2">
                  {["شريك", "وسيط", "معقب", "موظف"].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        handleSetChange("targetType", type);
                        handleSetChange("targetId", "");
                      }}
                      className={`px-3 py-1.5 rounded-md transition-colors text-[11px] font-bold ${settlementForm.targetType === type ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] border border-[var(--wms-border)]"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  الاسم ({settlementForm.targetType}) *
                </label>
                <select
                  value={settlementForm.targetId}
                  onChange={(e) => handleSetChange("targetId", e.target.value)}
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] h-[34px] text-[12px] appearance-none outline-none focus:border-blue-500"
                >
                  <option value="">اختر الاسم...</option>
                  {getTargetList(settlementForm.targetType).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  المبلغ *
                </label>
                <input
                  type="number"
                  value={settlementForm.amount}
                  onChange={(e) => handleSetChange("amount", e.target.value)}
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] font-mono h-[34px] text-[13px] outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  المصدر (اختياري)
                </label>
                <input
                  type="text"
                  value={settlementForm.source}
                  onChange={(e) => handleSetChange("source", e.target.value)}
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] h-[34px] text-[12px] outline-none focus:border-blue-500"
                  placeholder="مصدر التسوية (رقم معاملة، مشروع...)"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  ملاحظات
                </label>
                <textarea
                  value={settlementForm.notes}
                  onChange={(e) => handleSetChange("notes", e.target.value)}
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 py-2 text-[var(--wms-text)] resize-none h-[60px] text-[12px] outline-none focus:border-blue-500"
                  placeholder="ملاحظات إضافية..."
                ></textarea>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--wms-border)] bg-gray-50">
              <button
                onClick={() => setIsSettlementModalOpen(false)}
                className="px-4 py-1.5 rounded-md bg-white border border-gray-300 text-gray-600 text-[12px] font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (!settlementForm.targetId || !settlementForm.amount)
                    return toast.error("أكمل الحقول المطلوبة");
                  settleMutation.mutate(settlementForm);
                }}
                disabled={settleMutation.isPending}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white hover:opacity-90 text-[12px] font-bold flex gap-2 disabled:opacity-50"
              >
                {settleMutation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}{" "}
                تسجيل التسوية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 4. Modal: تسليم تسوية (Deliver Settlement) */}
      {/* ================================================== */}
      {isDeliverModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white border border-[var(--wms-border)] rounded-xl shadow-2xl w-full max-w-[500px] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)] bg-gray-50 shrink-0">
              <span className="text-[var(--wms-text)] text-[15px] font-bold">
                تسليم تسوية (دفع فعلي)
              </span>
              <button
                onClick={() => setIsDeliverModalOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar-slim">
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  نوع الطرف *
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {["وسيط", "معقب", "صاحب مصلحة", "شريك", "موظف"].map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => {
                          handleDelChange("targetType", type);
                          handleDelChange("targetId", "");
                        }}
                        className={`px-3 py-1.5 rounded-md transition-colors text-[11px] font-bold ${deliverForm.targetType === type ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] border border-[var(--wms-border)]"}`}
                      >
                        {type}
                      </button>
                    ),
                  )}
                </div>
              </div>
              <div className="relative">
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  المستلم *
                </label>
                <select
                  value={deliverForm.targetId}
                  onChange={(e) => handleDelChange("targetId", e.target.value)}
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] h-[34px] text-[12px] appearance-none outline-none focus:border-blue-500"
                >
                  <option value="">اختر الاسم...</option>
                  {getTargetList(deliverForm.targetType).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  المبلغ المسلم *
                </label>
                <input
                  type="number"
                  value={deliverForm.amount}
                  onChange={(e) => handleDelChange("amount", e.target.value)}
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] font-mono h-[34px] text-[13px] outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  طريقة التسليم
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelChange("method", "نقدي")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-[11px] font-bold ${deliverForm.method === "نقدي" ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] border border-[var(--wms-border)]"}`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>نقدي</span>
                  </button>
                  <button
                    onClick={() => handleDelChange("method", "تحويل بنكي")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-[11px] font-bold ${deliverForm.method === "تحويل بنكي" ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] border border-[var(--wms-border)]"}`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>تحويل بنكي</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    تاريخ التسليم
                  </label>
                  <input
                    type="date"
                    value={deliverForm.date}
                    onChange={(e) => handleDelChange("date", e.target.value)}
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none focus:border-blue-500 h-[34px] text-[12px]"
                  />
                </div>
                <div className="relative">
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    المسلِّم (الموظف)
                  </label>
                  <select
                    value={deliverForm.deliveredById}
                    onChange={(e) =>
                      handleDelChange("deliveredById", e.target.value)
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] h-[34px] text-[12px] appearance-none outline-none focus:border-blue-500"
                  >
                    <option value="">اختر المسلِّم...</option>
                    {employeesList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  ملاحظات
                </label>
                <textarea
                  value={deliverForm.notes}
                  onChange={(e) => handleDelChange("notes", e.target.value)}
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 py-2 text-[var(--wms-text)] resize-none h-[50px] text-[12px] outline-none focus:border-blue-500"
                  placeholder="ملاحظات إضافية..."
                ></textarea>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  مرفق (صورة أو PDF)
                </label>
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[var(--wms-border)] rounded-lg text-[var(--wms-text-muted)] cursor-pointer hover:border-[var(--wms-accent-blue)] bg-gray-50 transition-colors text-[12px]">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span>
                    {deliverForm.attachment
                      ? deliverForm.attachment.name
                      : "اضغط لاختيار ملف"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      handleDelChange("attachment", e.target.files[0])
                    }
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--wms-border)] bg-gray-50 shrink-0">
              <button
                onClick={() => setIsDeliverModalOpen(false)}
                className="px-4 py-1.5 rounded-md bg-white border border-gray-300 text-gray-600 text-[12px] font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (!deliverForm.targetId || !deliverForm.amount)
                    return toast.error("أكمل الحقول المطلوبة");
                  deliverMutation.mutate(deliverForm);
                }}
                disabled={deliverMutation.isPending}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-success)] text-white hover:opacity-90 text-[12px] font-bold flex gap-2 disabled:opacity-50"
              >
                {deliverMutation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}{" "}
                تسليم التسوية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 5. Modal: جرد خزنة (Vault Inventory) */}
      {/* ================================================== */}
      {isVaultInvModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white border border-[var(--wms-border)] rounded-xl shadow-2xl w-full max-w-[520px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)] bg-gray-50">
              <span className="text-[var(--wms-text)] text-[15px] font-bold">
                جرد الخزنة
              </span>
              <button
                onClick={() => setIsVaultInvModalOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  الرصيد المسجل في النظام
                </label>
                <div className="w-full bg-gray-100 border border-gray-200 rounded-md px-3 flex items-center font-mono text-[var(--wms-text)] h-[34px] text-[13px] font-bold text-gray-600">
                  {(dashboardStats.vaultBalance || 0).toLocaleString()} ر.س
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  الرصيد الفعلي في الخزنة *
                </label>
                <input
                  type="number"
                  value={vaultInvForm.actualBalance}
                  onChange={(e) =>
                    handleVaultChange("actualBalance", e.target.value)
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] font-mono outline-none focus:border-amber-500 h-[34px] text-[13px]"
                  placeholder="أدخل الرصيد الفعلي الموجود حالياً"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    من سجل الجرد
                  </label>
                  <select
                    value={vaultInvForm.recordedById}
                    onChange={(e) =>
                      handleVaultChange("recordedById", e.target.value)
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] h-[34px] text-[12px] appearance-none outline-none focus:border-amber-500"
                  >
                    <option value="">اسم المسؤول...</option>
                    {employeesList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={vaultInvForm.date}
                    onChange={(e) => handleVaultChange("date", e.target.value)}
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none focus:border-amber-500 h-[34px] text-[12px]"
                  />
                </div>
              </div>
              <div className="flex items-start gap-1.5 bg-amber-50 p-2 rounded border border-amber-100">
                <Info className="w-3 h-3 mt-0.5 shrink-0 text-amber-600" />
                <span className="text-amber-700 text-[9px] font-bold">
                  سيتم تسجيل هذا الجرد كحركة توثيق في النظام ولن يغير القيود
                  القديمة.
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--wms-border)] bg-gray-50">
              <button
                onClick={() => setIsVaultInvModalOpen(false)}
                className="px-4 py-1.5 rounded-md bg-white border border-gray-300 text-gray-600 text-[12px] font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (!vaultInvForm.actualBalance)
                    return toast.error("أدخل الرصيد الفعلي");
                  inventoryMutation.mutate({ ...vaultInvForm, type: "vault" });
                }}
                disabled={inventoryMutation.isPending}
                className="px-4 py-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 text-[12px] font-bold flex gap-2 disabled:opacity-50"
              >
                {inventoryMutation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}{" "}
                تسجيل الجرد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 6. Modal: جرد حساب بنكي (Bank Inventory) */}
      {/* ================================================== */}
      {isBankInvModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white border border-[var(--wms-border)] rounded-xl shadow-2xl w-full max-w-[520px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)] bg-gray-50">
              <span className="text-[var(--wms-text)] text-[15px] font-bold">
                تحديث وجرد حساب بنكي
              </span>
              <button
                onClick={() => setIsBankInvModalOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="relative">
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  الحساب البنكي *
                </label>
                <select
                  value={bankInvForm.accountId}
                  onChange={(e) =>
                    handleBankInvChange("accountId", e.target.value)
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] outline-none appearance-none focus:border-amber-500 h-[34px] text-[12px]"
                >
                  <option value="">اختر الحساب البنكي...</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} — {acc.accountNumber}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  الرصيد الفعلي (الجديد) *
                </label>
                <input
                  type="number"
                  value={bankInvForm.actualBalance}
                  onChange={(e) =>
                    handleBankInvChange("actualBalance", e.target.value)
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] font-mono outline-none focus:border-amber-500 h-[34px] text-[13px]"
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    من سجل الجرد
                  </label>
                  <select
                    value={bankInvForm.recordedById}
                    onChange={(e) =>
                      handleBankInvChange("recordedById", e.target.value)
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] h-[34px] text-[12px] appearance-none outline-none focus:border-amber-500"
                  >
                    <option value="">اسم المسؤول...</option>
                    {employeesList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={bankInvForm.date}
                    onChange={(e) =>
                      handleBankInvChange("date", e.target.value)
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none focus:border-amber-500 h-[34px] text-[12px]"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  سبب التحديث / ملاحظات
                </label>
                <textarea
                  value={bankInvForm.notes}
                  onChange={(e) => handleBankInvChange("notes", e.target.value)}
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 py-2 text-[var(--wms-text)] resize-none h-[50px] text-[12px] outline-none focus:border-amber-500"
                  placeholder="مثال: تسوية شهرية، عمولة بنكية..."
                ></textarea>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  صورة كشف الحساب (اختياري)
                </label>
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[var(--wms-border)] bg-gray-50 rounded-lg text-[var(--wms-text-muted)] cursor-pointer hover:border-amber-500 transition-colors text-[12px]">
                  <Upload className="w-4 h-4 text-amber-500" />
                  <span>
                    {bankInvForm.attachment
                      ? bankInvForm.attachment.name
                      : "اضغط لاختيار كشف الحساب"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      handleBankInvChange("attachment", e.target.files[0])
                    }
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--wms-border)] bg-gray-50">
              <button
                onClick={() => setIsBankInvModalOpen(false)}
                className="px-4 py-1.5 rounded-md bg-white border border-gray-300 text-gray-600 text-[12px] font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (!bankInvForm.accountId || !bankInvForm.actualBalance)
                    return toast.error("أكمل الحقول المطلوبة");
                  inventoryMutation.mutate({ ...bankInvForm, type: "bank" });
                }}
                disabled={inventoryMutation.isPending}
                className="px-4 py-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 text-[12px] font-bold flex gap-2 disabled:opacity-50"
              >
                {inventoryMutation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}{" "}
                تحديث الرصيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 7. Modal: تسجيل مصروف (Record Expense) */}
      {/* ================================================== */}
      {isExpenseModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white border border-[var(--wms-border)] rounded-xl shadow-2xl w-full max-w-[480px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)] bg-gray-50">
              <span className="text-[var(--wms-text)] text-[15px] font-bold">
                تسجيل مصروف تشغيلي
              </span>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  البند *
                </label>
                <input
                  type="text"
                  value={expenseForm.item}
                  onChange={(e) => handleExpChange("item", e.target.value)}
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none focus:border-blue-500 h-[34px] text-[12px]"
                  placeholder="اسم البند (مثال: إيجار، رواتب...)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    المبلغ *
                  </label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => handleExpChange("amount", e.target.value)}
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] font-mono outline-none focus:border-blue-500 h-[34px] text-[13px]"
                    placeholder="0"
                  />
                </div>
                <div className="relative">
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    من دفع
                  </label>
                  <select
                    value={expenseForm.payerId}
                    onChange={(e) => handleExpChange("payerId", e.target.value)}
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] h-[34px] text-[12px] appearance-none outline-none focus:border-blue-500"
                  >
                    <option value="">اسم الشخص...</option>
                    {employeesList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    المصدر *
                  </label>
                  <select
                    value={expenseForm.source}
                    onChange={(e) => handleExpChange("source", e.target.value)}
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] h-[34px] text-[12px] appearance-none outline-none focus:border-blue-500"
                  >
                    <option value="">اختر المصدر</option>
                    <option value="خزنة">خزنة</option>
                    <option value="حساب بنكي">حساب بنكي</option>
                    <option value="دفع شخصي شريك">دفع شخصي شريك</option>
                    <option value="دفع شخصي موظف">دفع شخصي موظف</option>
                    <option value="من تحصيل غير مسلم">من تحصيل غير مسلم</option>
                  </select>
                  <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => handleExpChange("date", e.target.value)}
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none focus:border-blue-500 h-[34px] text-[12px]"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  ملاحظات
                </label>
                <textarea
                  value={expenseForm.notes}
                  onChange={(e) => handleExpChange("notes", e.target.value)}
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 py-2 text-[var(--wms-text)] resize-none h-[50px] text-[12px] outline-none focus:border-blue-500"
                  placeholder="ملاحظات إضافية..."
                ></textarea>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  المرفق (فاتورة / إيصال)
                </label>
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[var(--wms-border)] bg-gray-50 rounded-lg text-[var(--wms-text-muted)] cursor-pointer hover:border-blue-500 transition-colors text-[12px]">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span>
                    {expenseForm.attachment
                      ? expenseForm.attachment.name
                      : "اضغط لإرفاق ملف"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      handleExpChange("attachment", e.target.files[0])
                    }
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--wms-border)] bg-gray-50">
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="px-4 py-1.5 rounded-md bg-white border border-gray-300 text-gray-600 text-[12px] font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (
                    !expenseForm.item ||
                    !expenseForm.amount ||
                    !expenseForm.source
                  )
                    return toast.error("أكمل الحقول المطلوبة");
                  expenseMutation.mutate(expenseForm);
                }}
                disabled={expenseMutation.isPending}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white hover:opacity-90 text-[12px] font-bold flex gap-2 disabled:opacity-50"
              >
                {expenseMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Banknote className="w-3.5 h-3.5" />
                )}{" "}
                تسجيل المصروف
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
