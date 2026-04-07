import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../../.../../../api/axios";
import {
  X,
  Archive,
  RefreshCw,
  Trash2,
  FileText,
  History,
  Calculator,
  Handshake,
  Building2,
  User,
  Monitor,
  Banknote,
  Scale,
  PieChart,
  Paperclip,
  CalendarDays,
  Activity,
  Check,
  Circle,
  ArrowLeftRight,
  FileEdit,
  Image,
  MessageCircle,
  Map,
  AlertCircle,
  FolderCog,
  UploadCloud,
  Building,
  Bug,
  CheckCircle,
  ChevronDown,
  ShieldCheck,
  ClipboardList,
  HardHat,
  Car,
  Wind,
  Zap,
  Pickaxe,
  Briefcase,
  FileCheck,
  Landmark,
  PenLine,
  EyeOff
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

// 💡 1. استيراد المساعدات
import {
  safeNum,
  safeText,
  parseNumber,
  formatDateTime,
  getDayNameAndDate,
} from "../utils/transactionUtils";

// 💡 2. استيراد التبويبات المقسمة
import { BasicTab } from "./tabs/BasicTab";
import { StatusTab } from "./tabs/StatusTab";
import { AttachmentsTab } from "./tabs/AttachmentsTab";
import { LogsTab } from "./tabs/LogsTab";

import { FinancialTab } from "./tabs/FinancialTab";
import { PaymentsTab } from "./tabs/PaymentsTab";
import { SettlementTab } from "./tabs/SettlementTab";
import { ProfitsTab } from "./tabs/ProfitsTab";
import { DatesTab } from "./tabs/DatesTab";

import { BrokersTab } from "./tabs/BrokersTab";
import { AgentsTab } from "./tabs/AgentsTab";
import { RemoteTab } from "./tabs/RemoteTab";
import { CoopOfficeTab } from "./tabs/CoopOfficeTab";
import { TasksTab } from "./tabs/TasksTab";
import { CommentsTab } from "./tabs/CommentsTab";

// 💡 3. استيراد النوافذ المنبثقة الفرعية (Modals)
import {
  PreviewModal,
  AddPaymentModal,
  AddAgentModal,
  AddBrokerModal,
  AddRemoteTaskModal,
  CoopFeeModal,
  PayPersonModal,
  PayTaskModal,
} from "./TransactionModals";

export const TransactionDetailsModal = ({
  isOpen,
  onClose,
  tx: initialTx,
  refetchTable,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");

  // حالات فتح/إغلاق المجموعات في الشريط الجانبي
  const [openSidebarGroups, setOpenSidebarGroups] = useState({
    main: true,
    engineering: true,
    documents: true,
    financial: true,
    others: false,
  });

  const toggleSidebarGroup = (group) => {
    setOpenSidebarGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const backendUrl = api.defaults.baseURL.replace("/api", "");

  const { user } = useAuth();
  const empId = user?.jobNumber || user?.employeeId || "";
  const currentUser = user?.name
    ? empId
      ? `${user.name} (${empId})`
      : user.name
    : "موظف النظام";

  // ==========================================================
  // 💡 1. Queries (جلب البيانات)
  // ==========================================================
  const { data: transactionsData = [] } = useQuery({
    queryKey: ["private-transactions-full"],
    queryFn: async () => {
      const res = await api.get("/private-transactions");
      return res.data?.data || res.data || [];
    },
  });

  const tx = useMemo(() => {
    if (!initialTx) return null;
    return transactionsData.find((t) => t.id === initialTx.id) || initialTx;
  }, [transactionsData, initialTx]);

  const { data: exchangeRates = [] } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: async () =>
      (await api.get("/remote-workers/exchange-rates")).data?.data || [],
    enabled: isOpen,
  });

  const { data: offices = [] } = useQuery({
    queryKey: ["coop-offices-modal"],
    queryFn: async () => (await api.get("/coop-offices")).data?.data || [],
    enabled: isOpen,
  });

  const { data: riyadhZones = [] } = useQuery({
    queryKey: ["riyadhZones-modal"],
    queryFn: async () => (await api.get("/riyadh-zones")).data?.data || [],
    enabled: isOpen,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-simple-modal"],
    queryFn: async () => {
      const res = await api.get("/clients/simple");
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
    enabled: isOpen,
  });

  const { data: systemSettings } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => (await api.get("/settings")).data?.data || {},
    enabled: isOpen,
  });

  const { data: allCoopFees = [] } = useQuery({
    queryKey: ["coop-office-fees"],
    queryFn: async () => (await api.get("/coop-office-fees")).data?.data || [],
    enabled: isOpen,
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bank-accounts-modal"],
    queryFn: async () => (await api.get("/bank-accounts")).data?.data || [],
    enabled: isOpen,
  });

  const { data: persons = [] } = useQuery({
    queryKey: ["persons-directory-modal"],
    queryFn: async () => (await api.get("/persons")).data?.data || [],
    enabled: isOpen,
  });

  // ==========================================================
  // 💡 2. States (الحالات)
  // ==========================================================
  const [openSections, setOpenSections] = useState({
    brokers: true,
    agents: true,
    remote: true,
    expenses: true,
  });
  const toggleSection = (sec) =>
    setOpenSections((p) => ({ ...p, [sec]: !p[sec] }));

  const [previewFile, setPreviewFile] = useState(null);
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingFinancial, setIsEditingFinancial] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [payTaskData, setPayTaskData] = useState(null);
  const [payPersonData, setPayPersonData] = useState(null);

  const [isCoopFeeModalOpen, setIsCoopFeeModalOpen] = useState(false);
  const [coopFeeMode, setCoopFeeMode] = useState("add");
  const [editingCoopFeeId, setEditingCoopFeeId] = useState(null);
  const initialCoopFeeForm = {
    officeId: "",
    requestType: tx?.type || "اصدار",
    officeFees: "",
    paidAmount: "",
    dueDate: "",
    providedServices: "",
    uploadStatus: "مع الرفع على النظام",
    licenseNumber: "",
    licenseYear: "",
    serviceNumber: "",
    serviceYear: "",
    entityName: "",
    notes: "",
  };
  const [coopFeeForm, setCoopFeeForm] = useState(initialCoopFeeForm);

  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    method: "تحويل بنكي",
    ref: "",
    notes: "",
    bankAccountId: "",
    isDepositedToSafe: false,
    receiptFile: null,
  });

  const [isAddAgentOpen, setIsAddAgentOpen] = useState(false);
  const [agentForm, setAgentForm] = useState({
    agentId: "",
    role: "معقب",
    fees: "",
    dueDate: "",
  });

  const [isAddRemoteTaskOpen, setIsAddRemoteTaskOpen] = useState(false);
  const [remoteTaskForm, setRemoteTaskForm] = useState({
    workerId: "",
    taskName: "",
    costSar: "",
    isPaid: false,
    paymentAmount: "",
    paymentCurrency: "SAR",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  const [dateForm, setDateForm] = useState({
    amountType: "full",
    amount: "",
    type: "specific_date",
    date: "",
    person: "",
    notes: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [statusForm, setStatusForm] = useState({
    currentStatus: "عند المهندس للدراسة",
    serviceNumber: "",
    hijriYear1: "",
    licenseNumber: "",
    hijriYear2: "",
    oldLicenseNumber: "",
    newAuthorityNote: "",
    noteAttachment: null,
    approvalAttachments: [],
  });
  const [uploadData, setUploadData] = useState({ file: null, description: "" });

  const [distributionScheme, setDistributionScheme] = useState("default");
  const [roundingMode, setRoundingMode] = useState("none");

  const [isAddBrokerModalOpen, setIsAddBrokerModalOpen] = useState(false);
  const [brokerForm, setBrokerForm] = useState({ brokerId: "", fees: "" });

  // ==========================================================
  // 💡 3. Memos & Calculations
  // ==========================================================
  const agentsList = useMemo(
    () => persons.filter((p) => p.role === "معقب"),
    [persons],
  );
  const remoteWorkersList = useMemo(
    () => persons.filter((p) => p.role === "موظف عن بعد"),
    [persons],
  );
  const brokersList = useMemo(
    () => persons.filter((p) => p.role === "وسيط"),
    [persons],
  );

  const clientsOptions = useMemo(
    () => clients.map((c) => ({ label: c.name?.ar || c.name, value: c.id })),
    [clients],
  );
  const txCoopFees = useMemo(
    () => allCoopFees.filter((fee) => fee.transactionId === tx?.id),
    [allCoopFees, tx?.id],
  );
  const districtsOptions = useMemo(() => {
    let opts = [];
    riyadhZones.forEach((sector) => {
      sector.districts?.forEach((dist) => {
        opts.push({
          label: `${dist.name} (قطاع ${sector.name})`,
          value: dist.id,
          sectorName: sector.name,
        });
      });
    });
    return opts;
  }, [riyadhZones]);

  useEffect(() => {
    if (tx) {
      const currentClient = clients.find(
        (c) => (c.name?.ar || c.name) === safeText(tx.client),
      );
      setEditFormData({
        year: new Date(tx.created || tx.date).getFullYear().toString(),
        month: (new Date(tx.created || tx.date).getMonth() + 1)
          .toString()
          .padStart(2, "0"),
        clientId: currentClient?.id || "",
        clientName: safeText(tx.client || tx.owner),
        district: tx.district || "",
        districtId: "",
        sector: tx.sector || "",
        type: tx.type,
        office: tx.office || "مكتب ديتيلز",
        sourceName: tx.sourceName || "مباشر",
        totalFees: tx.totalFees || 0,
        taxType:
          tx.taxData?.taxType ||
          tx.notes?.taxData?.taxType ||
          "بدون احتساب ضريبة",
        mediatorFees:
          tx.mediatorFees ||
          tx.brokers?.reduce((sum, b) => sum + safeNum(b.fees), 0) ||
          0,
        agentCost:
          tx.agentCost ||
          tx.agents?.reduce((sum, a) => sum + safeNum(a.fees), 0) ||
          0,
        internalName: tx.internalName || tx.notes?.internalName || "",
        isInternalNameHidden: tx.notes?.isInternalNameHidden || false,
        plots: tx.plots || tx.notes?.refs?.plots || "",
        plan: tx.plan || tx.notes?.refs?.plan || "",
        area:
          tx.landArea || tx.notes?.refs?.landArea || tx.notes?.refs?.area || "",
        mapsLink: tx.mapsLink || tx.notes?.refs?.mapsLink || "",
      });

      const existingStatusData = tx.notes?.transactionStatusData || {};

      setStatusForm({
        currentStatus:
          existingStatusData.currentStatus || "عند المهندس للدراسة",
        serviceNumber:
          tx.serviceNo ||
          tx.requestNo ||
          existingStatusData.serviceNumber ||
          "",
        hijriYear1: existingStatusData.hijriYear1 || "",
        licenseNumber: tx.licenseNo || existingStatusData.licenseNumber || "",
        hijriYear2: existingStatusData.hijriYear2 || "",
        oldLicenseNumber:
          tx.oldDeed || existingStatusData.oldLicenseNumber || "",
        newAuthorityNote: "",
        noteAttachment: null,
        approvalAttachments: existingStatusData.approvalAttachments || [],
        approvalDate: existingStatusData.approvalDate || null,
      });
    }
  }, [tx, clients]);

  const calculateEditTax = () => {
    const total = parseNumber(editFormData.totalFees) || 0;
    if (total === 0) return { net: 0, tax: 0 };
    if (editFormData.taxType === "شامل الضريبة")
      return { net: total / 1.15, tax: total - total / 1.15 };
    if (editFormData.taxType === "غير شامل الضريبة")
      return { net: total, tax: total * 0.15 };
    return { net: total, tax: 0 };
  };
  const { net: editNetAmount, tax: editTaxAmount } = calculateEditTax();

  const totalFees = safeNum(tx?.totalPrice || tx?.totalFees);
  const totalPaid = safeNum(tx?.collectionAmount || tx?.paidAmount);
  const remaining = totalFees - totalPaid;
  const collectionPercent =
    totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0;
  const actualExpenses =
    tx?.expenses?.reduce((sum, exp) => sum + safeNum(exp.amount), 0) || 0;
  const totalCosts =
    safeNum(tx?.agentCost) +
    safeNum(tx?.remoteCost) +
    safeNum(tx?.expensesCost);
  const estimatedProfit = totalFees - totalCosts;
  const reserveDeduction = estimatedProfit * 0.1;
  const distributableProfit = estimatedProfit - reserveDeduction;

  const officeShareData = useMemo(() => {
    if (distributableProfit <= 0 || !systemSettings)
      return { amount: 0, label: "0%" };
    let appliedType = systemSettings.officeShareType || "percentage";
    let appliedValue = safeNum(systemSettings.officeShareValue) || 10;
    const matchingTier = (systemSettings.officeShareCategories || []).find(
      (c) =>
        distributableProfit >= safeNum(c.minAmount) &&
        distributableProfit <= safeNum(c.maxAmount),
    );
    if (matchingTier) {
      appliedType = matchingTier.type;
      appliedValue = safeNum(matchingTier.value);
    }
    let calculatedShare =
      appliedType === "percentage"
        ? distributableProfit * (appliedValue / 100)
        : appliedValue;
    return {
      amount: Math.min(calculatedShare, distributableProfit),
      label:
        appliedType === "percentage"
          ? `${appliedValue}%`
          : `مبلغ ثابت (${appliedValue.toLocaleString()})`,
    };
  }, [distributableProfit, systemSettings]);

  const officeShareAmount = officeShareData.amount;
  const officeShareLabel = officeShareData.label;
  const netAfterOfficeShare = distributableProfit - officeShareAmount;
  const sourcePercent = safeNum(tx?.sourcePercent) || 5;
  const sourceShare = (netAfterOfficeShare * sourcePercent) / 100;
  const availableForPartners = netAfterOfficeShare - sourceShare;

  const partnersDistribution = useMemo(() => {
    if (!tx) return [];
    let scheme = [
      { id: "p1", name: "شريك 1 (المدير)", percent: 50 },
      { id: "p2", name: "شريك 2", percent: 30 },
      { id: "p3", name: "شريك 3", percent: 20 },
    ];
    if (distributionScheme === "fouad")
      scheme = [
        { id: "p1", name: "شريك 1", percent: 33.33 },
        { id: "p2", name: "شريك 2", percent: 33.33 },
        { id: "p3", name: "شريك 3", percent: 33.34 },
      ];
    else if (distributionScheme === "custom")
      scheme = [
        { id: "p1", name: "شريك 1", percent: 40 },
        { id: "p2", name: "شريك 2", percent: 35 },
        { id: "p3", name: "شريك 3", percent: 25 },
      ];

    return scheme.map((p) => {
      let rawAmount = (availableForPartners * p.percent) / 100;
      let finalAmount = rawAmount;
      if (roundingMode === "10") finalAmount = Math.round(rawAmount / 10) * 10;
      if (roundingMode === "50") finalAmount = Math.round(rawAmount / 50) * 50;
      if (roundingMode === "100")
        finalAmount = Math.round(rawAmount / 100) * 100;
      return {
        ...p,
        rawAmount,
        finalAmount,
        roundDiff: finalAmount - rawAmount,
      };
    });
  }, [availableForPartners, distributionScheme, roundingMode, tx]);

  const safeAttachments = useMemo(() => {
    let allAtts = [];
    if (tx?.notes?.attachments && Array.isArray(tx.notes.attachments))
      allAtts = [...tx.notes.attachments];
    if (tx?.attachments && Array.isArray(tx.attachments)) {
      tx.attachments.forEach((url) => {
        if (typeof url === "string" && !allAtts.find((a) => a.url === url)) {
          allAtts.push({
            url,
            name: "مرفق قديم",
            uploadedBy: "النظام",
            date: tx.createdAt,
          });
        }
      });
    }
    return allAtts;
  }, [tx]);
  const safePayments =
    tx?.paymentsList || tx?.payments || tx?.notes?.payments || [];
  const safeCollectionDates =
    tx?.collectionDates || tx?.notes?.collectionDates || [];
  const safeAuthorityHistory = tx?.notes?.authorityNotesHistory || [];
  const systemLogs = useMemo(() => {
    const logs = tx?.logs || tx?.notes?.logs || [];
    return [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [tx?.logs, tx?.notes?.logs]);

  // ==========================================================
  // 💡 4. Handlers
  // ==========================================================
  const handlePreviewAttachmentSafe = (url, name) => {
    try {
      if (!url) return;
      if (url.startsWith("http")) return window.open(url, "_blank");
      setPreviewFile({ url: `${backendUrl}${url}`, name });
    } catch (error) {
      toast.error("حدث خطأ أثناء فتح الملف");
    }
  };

  const saveBasicEdits = () => {
    let parsedPlots = [];
    if (Array.isArray(editFormData.plots)) {
      parsedPlots = editFormData.plots;
    } else if (typeof editFormData.plots === "string") {
      // التقسيم باستخدام الفاصلة الإنجليزية والعربية
      parsedPlots = editFormData.plots.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
    }
    const updatedNotes = {
      ...(tx.notes || {}),
      refs: {
        ...((tx.notes || {}).refs || {}),
        plots: parsedPlots,
        plan: editFormData.plan,
        area: editFormData.area,
        mapsLink: editFormData.mapsLink,
      },
    };
    updateTxMutation.mutate({ ...editFormData, plots: parsedPlots, notes: updatedNotes });
  };

  const calculateDays = (targetDate, isApprovalRelated) => {
    const today = new Date();
    if (isApprovalRelated) {
      if (statusForm.currentStatus === "تم الاعتماد") {
        const approvalDate = statusForm.approvalDate
          ? new Date(statusForm.approvalDate)
          : today;
        return Math.floor((today - approvalDate) / (1000 * 60 * 60 * 24));
      }
      return null;
    }
    if (!targetDate) return null;
    return Math.ceil((new Date(targetDate) - today) / (1000 * 60 * 60 * 24));
  };

  // ==========================================================
  // 💡 5. Mutations
  // ==========================================================
  const updateTxMutation = useMutation({
    mutationFn: async (data) =>
      api.put(`/private-transactions/${tx.id}`, {
        ...data,
        updatedBy: currentUser,
      }),
    onSuccess: () => {
      toast.success("تم تحديث البيانات بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setIsEditingBasic(false);
      setIsEditingFinancial(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data) => {
      const fd = new FormData();
      Object.keys(data).forEach((k) => {
        if (
          k !== "noteAttachment" &&
          k !== "approvalAttachments" &&
          data[k] !== null &&
          data[k] !== undefined
        )
          fd.append(k, data[k]);
      });
      if (data.noteAttachment) fd.append("file", data.noteAttachment);
      if (data.approvalAttachments?.length > 0) {
        data.approvalAttachments.forEach((att, index) => {
          if (att.file) {
            fd.append("approvalFiles", att.file);
            fd.append("approvalNames", att.name || `مرفق اعتماد ${index + 1}`);
          }
        });
      }
      fd.append("addedBy", currentUser);
      return api.post(`/private-transactions/${tx?.id}/status`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("تم تحديث الحالة بنجاح");
      setStatusForm({
        ...statusForm,
        newAuthorityNote: "",
        noteAttachment: null,
        approvalAttachments: [],
      });
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const payload = { ...taskData, addedBy: currentUser };
      return api.post(`/private-transactions/${tx.id}/tasks`, payload);
    },
    onSuccess: () => {
      toast.success("تم حفظ المهمة بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
  });

  const submitTaskMutation = useMutation({
    mutationFn: async ({ taskId, comment, file }) => {
      const fd = new FormData();
      if (comment) fd.append("comment", comment);
      if (file) fd.append("file", file);
      fd.append("submittedBy", currentUser);
      return api.post(
        `/private-transactions/${tx.id}/tasks/${taskId}/submit`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
    },
    onSuccess: () => {
      toast.success("تم تسليم المهمة للتدقيق بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
  });

  const freezeMutation = useMutation({
    mutationFn: async (id) =>
      await api.patch(`/private-transactions/${id}/toggle-freeze`, {
        updatedBy: currentUser,
      }),
    onSuccess: () => {
      toast.success("تم تغيير حالة المعاملة");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/private-transactions/${id}`),
    onSuccess: () => {
      toast.success("تم حذف المعاملة");
      queryClient.invalidateQueries(["private-transactions-full"]);
      onClose();
    },
    onError: () =>
      toast.error("لا يمكن حذف هذه المعاملة لوجود ارتباطات مالية."),
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (data) => {
      const fd = new FormData();
      fd.append("transactionId", tx?.id);
      fd.append("collectedFromType", "عميل");
      fd.append("collectedBy", currentUser);
      Object.keys(data).forEach((k) => {
        if (k === "receiptFile" && data[k]) fd.append("file", data[k]);
        else if (data[k] !== null && data[k] !== undefined)
          fd.append(k, data[k]);
      });
      return api.post(`/private-transactions/payments`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("تمت إضافة الدفعة بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setIsAddPaymentOpen(false);
      setPaymentForm({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        method: "تحويل بنكي",
        ref: "",
        notes: "",
        bankAccountId: "",
        isDepositedToSafe: false,
        receiptFile: null,
      });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id) =>
      api.delete(`/private-transactions/payments/${id}`),
    onSuccess: () => {
      toast.success("تم حذف الدفعة");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
  });

  const addAgentMutation = useMutation({
    mutationFn: async (data) =>
      api.post(`/private-transactions/${tx?.id}/agents`, {
        ...data,
        addedBy: currentUser,
      }),
    onSuccess: () => {
      toast.success("تم ربط المعقب بالمعاملة");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setIsAddAgentOpen(false);
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async (agentIdToRemove) => {
      const currentAgents = tx.notes?.agents || [];
      const updatedAgents = currentAgents.filter(
        (a) => a.id !== agentIdToRemove,
      );
      return api.put(`/private-transactions/${tx.id}`, {
        notes: {
          ...tx.notes,
          agents: updatedAgents,
          agentFees: updatedAgents.reduce((sum, a) => sum + a.fees, 0),
        },
      });
    },
    onSuccess: () => {
      toast.success("تم إزالة المعقب من المعاملة");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
  });

  const addBrokerMutation = useMutation({
    mutationFn: async (data) =>
      api.post(`/private-transactions/${tx?.id}/brokers`, {
        ...data,
        addedBy: currentUser,
      }),
    onSuccess: () => {
      toast.success("تم تعيين الوسيط بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setIsAddBrokerModalOpen(false);
      setBrokerForm({ brokerId: "", fees: "" });
    },
  });

  const deleteBrokerMutation = useMutation({
    mutationFn: async (brokerRecordId) =>
      api.delete(`/private-transactions/brokers/${brokerRecordId}`, {
        data: { addedBy: currentUser },
      }),
    onSuccess: () => {
      toast.success("تم حذف الوسيط");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
  });

  const deleteRemoteTaskMutation = useMutation({
    mutationFn: async (taskId) =>
      api.delete(`/private-transactions/${tx.id}/tasks/${taskId}`, {
        data: { deletedBy: currentUser },
      }),
    onSuccess: () => {
      toast.success("تم حذف المهمة بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
  });

  const payRemoteTaskMutation = useMutation({
    mutationFn: async (payload) =>
      api.post(`/remote-workers/tasks/pay`, payload),
    onSuccess: () => {
      toast.success("تم تسجيل الدفع للموظف بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setPayTaskData(null);
    },
  });

  const payPersonMutation = useMutation({
    mutationFn: async (payload) => api.post(`/finance/settlements`, payload),
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setPayPersonData(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ أثناء تسجيل الدفع"),
  });

  const addDateMutation = useMutation({
    mutationFn: async (data) =>
      await api.post(`/private-transactions/${tx?.id}/collection-dates`, {
        ...data,
        addedBy: currentUser,
      }),
    onSuccess: () => {
      toast.success("تمت إضافة الموعد");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setDateForm({
        amountType: "full",
        amount: "",
        type: "specific_date",
        date: "",
        notes: "",
      });
    },
  });

  const deleteDateMutation = useMutation({
    mutationFn: async (dateId) =>
      await api.delete(
        `/private-transactions/${tx?.id}/collection-dates/${dateId}`,
      ),
    onSuccess: () => {
      toast.success("تم حذف الموعد بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
  });

  const addRemoteTaskMutation = useMutation({
    mutationFn: async (payload) =>
      api.post(`/remote-workers/assign-tasks`, {
        ...payload,
        assignedBy: currentUser,
      }),
    onSuccess: () => {
      toast.success("تم تعيين المهمة للموظف بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setIsAddRemoteTaskOpen(false);
      setRemoteTaskForm({
        workerId: "",
        taskName: "",
        costSar: "",
        isPaid: false,
        paymentAmount: "",
        paymentCurrency: "SAR",
        paymentDate: new Date().toISOString().split("T")[0],
      });
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (data) =>
      api.post(`/private-transactions/${tx?.id}/expenses`, {
        ...data,
        addedBy: currentUser,
      }),
    onSuccess: () => {
      toast.success("تم تسجيل المصروف التشغيلي بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setExpenseForm({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("files", uploadData.file);
      fd.append("description", uploadData.description);
      fd.append("uploadedBy", currentUser);
      return api.post(`/private-transactions/${tx?.id}/attachments`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("تم رفع المرفق بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setUploadData({ file: null, description: "" });
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (fileUrlToRemove) => {
      const currentAttachments = tx.notes?.attachments || [];
      const updatedAttachments = currentAttachments.filter(
        (att) => att.url !== fileUrlToRemove,
      );
      return api.put(`/private-transactions/${tx.id}`, {
        notes: { ...tx.notes, attachments: updatedAttachments },
      });
    },
    onSuccess: () => {
      toast.success("تم حذف المرفق بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
  });

  const deleteAuthorityNoteMutation = useMutation({
    mutationFn: async (updatedHistory) =>
      api.put(`/private-transactions/${tx.id}`, {
        notes: { authorityNotesHistory: updatedHistory },
      }),
    onSuccess: () => {
      toast.success("تم حذف الملاحظة بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
  });

  const finalizeSettlementMutation = useMutation({
    mutationFn: async () =>
      api.put(`/private-transactions/${tx.id}`, { status: "مكتملة" }),
    onSuccess: () => {
      toast.success("تم تنفيذ التسوية الشاملة بنجاح وإغلاق المعاملة!");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
  });

  const saveCoopFeeMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        transactionId: tx.id,
        internalName: tx.internalName || tx.client || "معاملة بدون اسم",
      };
      if (coopFeeMode === "add")
        return await api.post("/coop-office-fees", payload);
      else
        return await api.put(`/coop-office-fees/${editingCoopFeeId}`, payload);
    },
    onSuccess: () => {
      toast.success(
        coopFeeMode === "add" ? "تم تسجيل أتعاب المكتب" : "تم التعديل بنجاح",
      );
      queryClient.invalidateQueries(["coop-office-fees"]);
      setIsCoopFeeModalOpen(false);
    },
  });

  const deleteCoopFeeMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/coop-office-fees/${id}`),
    onSuccess: () => {
      toast.success("تم الحذف بنجاح");
      queryClient.invalidateQueries(["coop-office-fees"]);
    },
  });

  const handleOpenCoopFeeEdit = (record) => {
    setCoopFeeMode("edit");
    setEditingCoopFeeId(record.id);
    setCoopFeeForm({
      ...initialCoopFeeForm,
      ...record,
      officeFees: record.officeFees || "",
      paidAmount: record.paidAmount || "",
    });
    setIsCoopFeeModalOpen(true);
  };

  if (!isOpen || !tx) return null;
  const isFrozen = tx.status === "مجمّدة";
  const isSettlementComplete = totalCosts > 0 && tx?.status !== "جارية";

  // ==========================================================
  // 💡 6. The Context Object
  // ==========================================================
  const tabContext = {
    tx,
    currentUser,
    backendUrl,
    safeNum,
    safeText,
    parseNumber,
    formatDateTime,
    getDayNameAndDate,
    isEditingBasic,
    setIsEditingBasic,
    editFormData,
    setEditFormData,
    saveBasicEdits,
    updateTxMutation,
    clientsOptions,
    districtsOptions,
    offices,
    persons,
    statusForm,
    setStatusForm,
    updateStatusMutation,
    safeAuthorityHistory,
    deleteAuthorityNoteMutation,
    handlePreviewAttachmentSafe,
    uploadData,
    setUploadData,
    uploadAttachmentMutation,
    safeAttachments,
    deleteAttachmentMutation,
    systemLogs,
    isEditingFinancial,
    setIsEditingFinancial,
    totalFees,
    editNetAmount,
    editTaxAmount,
    exchangeRates,
    openSections,
    toggleSection,
    actualExpenses,
    estimatedProfit,
    totalCosts,
    reserveDeduction,
    distributableProfit,
    availableForPartners,
    setActiveTab,
    setIsAddBrokerModalOpen,
    deleteBrokerMutation,
    setIsAddAgentOpen,
    deleteAgentMutation,
    setIsAddRemoteTaskOpen,
    deleteRemoteTaskMutation,
    setPayPersonData,
    setPayTaskData,
    addExpenseMutation,
    expenseForm,
    setExpenseForm,
    setIsAddPaymentOpen,
    totalPaid,
    remaining,
    collectionPercent,
    safePayments,
    deletePaymentMutation,
    finalizeSettlementMutation,
    isSettlementComplete,
    officeShareLabel,
    officeShareAmount,
    sourcePercent,
    sourceShare,
    partnersDistribution,
    safeCollectionDates,
    dateForm,
    setDateForm,
    addDateMutation,
    calculateDays,
    deleteDateMutation,
    txCoopFees,
    setIsCoopFeeModalOpen,
    setCoopFeeMode,
    setCoopFeeForm,
    initialCoopFeeForm,
    handleOpenCoopFeeEdit,
    deleteCoopFeeMutation,
    txType: tx?.type,
    isSuperAdmin: user?.role === "ADMIN" || user?.email === "admin@wms.com",
    addTaskMutation,
    submitTaskMutation,
  };

  // 💡 دالة التصيير المحدثة للشريط الجانبي (Sidebar)
  const renderTabButton = (id, label, Icon, activeColor = "#2563eb") => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-3 px-6 py-2.5 relative transition-all duration-200 text-right group w-full ${
          isActive
            ? "font-black bg-blue-50/80"
            : "text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900"
        }`}
        style={{
          fontSize: "12px",
          color: isActive ? activeColor : undefined,
        }}
      >
        <div
          className={`absolute right-0 top-0 bottom-0 w-[3px] transition-all duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}
          style={{ backgroundColor: activeColor }}
        />
        <Icon
          className={`w-[16px] h-[16px] shrink-0 transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <span className="truncate">{label}</span>
      </button>
    );
  };

  const renderSidebarGroup = (title, groupId, icon, children) => {
    const isOpen = openSidebarGroups[groupId];
    return (
      <div className="mb-1">
        <button
          onClick={() => toggleSidebarGroup(groupId)}
          className="flex items-center justify-between w-full px-4 py-2.5 bg-slate-100/50 hover:bg-slate-100 transition-colors border-y border-slate-200/60"
        >
          <div className="flex items-center gap-2 text-slate-700 font-black text-[11px] tracking-wide">
            {icon}
            <span>{title}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="py-1 bg-white">{children}</div>
        </div>
      </div>
    );
  };

  // ==========================================================
  // 💡 7. JSX Render
  // ==========================================================
  return (
    <div
      className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      {/* --- Modals Render Area --- */}
      <PreviewModal previewFile={previewFile} setPreviewFile={setPreviewFile} />
      <AddPaymentModal
        isAddPaymentOpen={isAddPaymentOpen}
        setIsAddPaymentOpen={setIsAddPaymentOpen}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        bankAccounts={bankAccounts}
        addPaymentMutation={addPaymentMutation}
      />
      <AddAgentModal
        isAddAgentOpen={isAddAgentOpen}
        setIsAddAgentOpen={setIsAddAgentOpen}
        agentForm={agentForm}
        setAgentForm={setAgentForm}
        agentsList={agentsList}
        addAgentMutation={addAgentMutation}
      />
      <AddBrokerModal
        isAddBrokerModalOpen={isAddBrokerModalOpen}
        setIsAddBrokerModalOpen={setIsAddBrokerModalOpen}
        brokerForm={brokerForm}
        setBrokerForm={setBrokerForm}
        brokersList={brokersList}
        addBrokerMutation={addBrokerMutation}
      />
      <AddRemoteTaskModal
        isAddRemoteTaskOpen={isAddRemoteTaskOpen}
        setIsAddRemoteTaskOpen={setIsAddRemoteTaskOpen}
        remoteTaskForm={remoteTaskForm}
        setRemoteTaskForm={setRemoteTaskForm}
        remoteWorkersList={remoteWorkersList}
        exchangeRates={exchangeRates}
        addRemoteTaskMutation={addRemoteTaskMutation}
        tx={tx}
      />
      <CoopFeeModal
        isCoopFeeModalOpen={isCoopFeeModalOpen}
        setIsCoopFeeModalOpen={setIsCoopFeeModalOpen}
        coopFeeMode={coopFeeMode}
        coopFeeForm={coopFeeForm}
        setCoopFeeForm={setCoopFeeForm}
        offices={offices}
        saveCoopFeeMutation={saveCoopFeeMutation}
        tx={tx}
      />
      <PayPersonModal
        payPersonData={payPersonData}
        setPayPersonData={setPayPersonData}
        payPersonMutation={payPersonMutation}
        payRemoteTaskMutation={payRemoteTaskMutation}
        tx={tx}
        remoteWorkersList={remoteWorkersList}
        exchangeRates={exchangeRates}
      />
      <PayTaskModal
        payTaskData={payTaskData}
        setPayTaskData={setPayTaskData}
        remoteWorkersList={remoteWorkersList}
        tx={tx}
        exchangeRates={exchangeRates}
        payRemoteTaskMutation={payRemoteTaskMutation}
      />

      {/* --- Main Modal Container --- */}
      <div
        className="bg-white rounded-2xl flex flex-col overflow-hidden shadow-2xl relative w-[98vw] max-w-[1600px] h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-[var(--wms-accent-blue)] bg-blue-100 border border-blue-200 px-3 py-1 rounded-lg font-mono text-[14px] font-black">
              {tx.ref || tx.id?.slice(-6)}
            </span>
            <span className="text-[var(--wms-text)] text-[16px] font-black flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              {safeText(tx.client || tx.owner)}
            </span>
            <span className="text-gray-400 text-sm font-bold border-r border-gray-300 pr-4">
              {tx.type}
            </span>
            {isFrozen && (
              <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5" /> مجمّدة مؤقتاً
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => freezeMutation.mutate(tx.id)}
              disabled={freezeMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors shadow-sm"
            >
              {isFrozen ? (
                <RefreshCw className="w-4 h-4 text-green-600" />
              ) : (
                <Archive className="w-4 h-4 text-amber-600" />
              )}
              <span>{isFrozen ? "تنشيط المعاملة" : "تجميد"}</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm("حذف نهائي؟ لا يمكن التراجع!"))
                  deleteMutation.mutate(tx.id);
              }}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-bold transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> <span>حذف نهائي</span>
            </button>
            <div className="w-px h-8 bg-gray-200 mx-2"></div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Pipeline Strip */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--wms-border)] bg-[var(--wms-surface-2)] shrink-0 overflow-x-auto custom-scrollbar-slim">
          {[
            "إنشاء الطلب",
            "الدراسات الفنية",
            "الإدارة المالية",
            "التحصيل والتسوية",
            "الاعتماد والإغلاق",
          ].map((step, i, arr) => (
            <React.Fragment key={step}>
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap ${i === 0 ? "text-green-700 bg-green-100 border border-green-200" : "text-gray-500 bg-white border border-gray-200 hover:bg-gray-50"}`}
              >
                {i === 0 ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}{" "}
                <span>{step}</span>
              </div>
              {i < arr.length - 1 && (
                <ArrowLeftRight className="w-3 h-3 text-gray-300 mx-1 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Layout Wrapper for Sidebar and Content */}
        <div className="flex flex-1 overflow-hidden bg-slate-50/30">
          {/* 💡 Sidebar Tabs (Right in RTL) - Updated Layout */}
          <div className="w-[280px] shrink-0 bg-white border-l border-gray-200 overflow-y-auto custom-scrollbar-slim pb-10 flex flex-col z-10 shadow-[2px_0_15px_-5px_rgba(0,0,0,0.1)]">
            {/* المجموعة الرئيسية */}
            {renderSidebarGroup(
              "البيانات وسير العمل",
              "main",
              <Briefcase className="w-4 h-4 text-blue-500" />,
              <>
                {renderTabButton(
                  "basic",
                  "البيانات الأساسية",
                  FileText,
                  "#2563eb",
                )}
                {renderTabButton(
                  "status",
                  "حالة المعاملة والتوجيهات",
                  History,
                  "#ea580c",
                )}
                {renderTabButton(
                  "tasks",
                  "مهام المعاملة (الداخلية)",
                  CalendarDays,
                  "#4f46e5",
                )}
                {renderTabButton("remote", "العمل عن بعد", Monitor, "#059669")}
                {renderTabButton(
                  "attachments",
                  "المرفقات الأساسية",
                  Paperclip,
                  "#64748b",
                )}
                {renderTabButton("comments", "التعليقات", MessageCircle, "#f97316")}
                {renderTabButton("logs", "سجل الأحداث", Activity, "#475569")}
              </>,
            )}

            {/* مجموعة الإدارة المالية */}
            {renderSidebarGroup(
              "الإدارة المالية والتسويات",
              "financial",
              <Landmark className="w-4 h-4 text-emerald-600" />,
              <>
                {renderTabButton(
                  "financial",
                  "المحرك المالي",
                  Calculator,
                  "#059669",
                )}
                {renderTabButton(
                  "brokers",
                  "حساب الوسطاء",
                  Handshake,
                  "#0891b2",
                )}
                {renderTabButton(
                  "coop_office",
                  "المكاتب المتعاونة",
                  Building2,
                  "#0284c7",
                )}
                {renderTabButton("agents", "حساب المعقبين", User, "#7c3aed")}
                {renderTabButton(
                  "payments",
                  "دفعات العميل",
                  Banknote,
                  "#16a34a",
                )}
                {renderTabButton(
                  "dates",
                  "مواعيد التحصيل",
                  CalendarDays,
                  "#d946ef",
                )}
                {renderTabButton(
                  "settlement",
                  "التسوية الشاملة",
                  Scale,
                  "#2563eb",
                )}
                {renderTabButton(
                  "profits",
                  "توزيع الأرباح",
                  PieChart,
                  "#8b5cf6",
                )}
              </>,
            )}

            {/* مجموعة الدراسات الهندسية الفنية */}
            {renderSidebarGroup(
              "الدراسات الهندسية الفنية",
              "engineering",
              <HardHat className="w-4 h-4 text-amber-500" />,
              <>
                {renderTabButton(
                  "arch_study",
                  "الدراسات المعمارية",
                  Building,
                  "#d97706",
                )}
                {renderTabButton(
                  "struct_study",
                  "الدراسات الإنشائية",
                  Pickaxe,
                  "#ea580c",
                )}
                {renderTabButton("soil_test", "فحص التربة", Map, "#b45309")}
                {renderTabButton(
                  "traffic_study",
                  "الدراسات المرورية",
                  Car,
                  "#dc2626",
                )}
                {renderTabButton(
                  "parking",
                  "مواقف السيارات",
                  Archive,
                  "#475569",
                )}
                {renderTabButton(
                  "mech_study",
                  "الدراسات الميكانيكية",
                  Wind,
                  "#0284c7",
                )}
                {renderTabButton(
                  "elec_study",
                  "الدراسات الكهربائية",
                  Zap,
                  "#eab308",
                )}
                {renderTabButton(
                  "safety",
                  "الأمن والسلامة",
                  ShieldCheck,
                  "#16a34a",
                )}
              </>,
            )}

            {/* مجموعة التعهدات والمستندات */}
            {renderSidebarGroup(
              "مستندات وتعهدات",
              "documents",
              <FileCheck className="w-4 h-4 text-indigo-500" />,
              <>
                {renderTabButton(
                  "owner_pledge",
                  "تعهدات المالك",
                  FileText,
                  "#4f46e5",
                )}
                {renderTabButton(
                  "designer_pledge",
                  "تعهدات المكتب المصمم",
                  PenLine,
                  "#6366f1",
                )}
                {renderTabButton(
                  "supervisor_pledge",
                  "تعهدات المكتب المشرف",
                  ClipboardList,
                  "#8b5cf6",
                )}
                {renderTabButton(
                  "insurance",
                  "وثيقة التأمين",
                  ShieldCheck,
                  "#14b8a6",
                )}
                {renderTabButton(
                  "tech_report",
                  "التقرير الفني",
                  FileEdit,
                  "#f59e0b",
                )}
                {renderTabButton(
                  "official_archive",
                  "الأرشيف الرسمي",
                  FolderCog,
                  "#64748b",
                )}
                {renderTabButton(
                  "owner_attachments",
                  "مرفقات من المالك",
                  Paperclip,
                  "#3b82f6",
                )}
              </>,
            )}

            {/* التبويبات الفردية المتبقية (خارج المجموعات) */}
            <div className="mt-4 border-t border-slate-200 pt-2">
              {renderTabButton(
                "supervision",
                "الإشراف الهندسي",
                EyeOff,
                "#ef4444",
              )}
              {renderTabButton(
                "execution",
                "التنفيذ والمقاولات",
                Building2,
                "#f97316",
              )}
            </div>
          </div>

          {/* 💡 Dynamic Content Area (Left in RTL) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar-slim relative">
            <div className="p-6 max-w-7xl mx-auto min-h-full">
              {/* المكونات الأساسية المتوفرة حالياً */}
              {activeTab === "basic" && <BasicTab {...tabContext} />}
              {activeTab === "status" && <StatusTab {...tabContext} />}
              {activeTab === "financial" && <FinancialTab {...tabContext} />}
              {activeTab === "brokers" && <BrokersTab {...tabContext} />}
              {activeTab === "comments" && <CommentsTab {...tabContext} />}
              {activeTab === "coop_office" && <CoopOfficeTab {...tabContext} />}
              {activeTab === "agents" && <AgentsTab {...tabContext} />}
              {activeTab === "remote" && <RemoteTab {...tabContext} />}
              {activeTab === "tasks" && <TasksTab {...tabContext} />}
              {activeTab === "payments" && <PaymentsTab {...tabContext} />}
              {activeTab === "settlement" && <SettlementTab {...tabContext} />}
              {activeTab === "profits" && <ProfitsTab {...tabContext} />}
              {activeTab === "attachments" && (
                <AttachmentsTab {...tabContext} />
              )}
              {activeTab === "dates" && <DatesTab {...tabContext} />}
              {activeTab === "logs" && <LogsTab {...tabContext} />}

              {/* عناصر نائبة (Placeholders) للتبويبات الجديدة الفارغة */}
              {![
                "basic",
                "status",
                "financial",
                "brokers",
                "coop_office",
                "agents",
                "remote",
                "tasks",
                "payments",
                "settlement",
                "profits",
                "attachments",
                "dates",
                "comments",
                "logs",
              ].includes(activeTab) && (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                  <FolderCog className="w-16 h-16 mb-4 opacity-20 text-slate-500" />
                  <h3 className="text-xl font-bold text-slate-600 mb-2">
                    جاري استكمال التبويب
                  </h3>
                  <p className="text-sm font-semibold max-w-sm text-center">
                    سيتم برمجة وربط التبويب
                    <span className="text-blue-500 mx-1">({activeTab})</span>
                    قريباً ليحتوي على الحقول المخصصة له.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
