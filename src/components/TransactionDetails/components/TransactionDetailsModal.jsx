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
  Receipt,
  Building,
  FileSignature,
  MessageSquare,
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
  EyeOff,
  Menu,
  FolderOpen,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import AccessControl from "../../../components/AccessControl";
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
import { RequestDataTab } from "./tabs/RequestDataTab";
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
import { AuthorityNotesTab } from "./tabs/AuthorityNotesTab";

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

import FolderViewerWindow from "../../../pages/Transactions/TransactionFiles/components/FolderViewerWindow";

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

  // حالة التحكم بالشريط الجانبي في الموبايل
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // حالة التحكم بنافذة مدير الملفات
  const [isFolderViewerOpen, setIsFolderViewerOpen] = useState(false);

  // 🚀 جلب الفئات (Categories) لاستخدامها في نافذة إدارة الملفات
  const { data: categories = [] } = useQuery({
    queryKey: ["transaction-categories"],
    queryFn: async () => {
      // ✅ تم تصحيح المسار ليتطابق مع إعدادات الباك إند
      const res = await api.get("/files/categories");
      return res.data?.data || [];
    },
    enabled: isOpen,
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

  // 🚀 تهيئة كائن المعاملة ليتطابق مع ما تتوقعه نافذة FolderViewerWindow
  const formattedTransactionForFolderViewer = useMemo(() => {
    if (!tx) return null;

    const rawName =
      tx.clientName || tx.client || tx.ownerNames || "عميل غير محدد";
    const cleanName = rawName.split("-")[0].split("(")[0].trim();
    const nameParts = cleanName.split(" ").filter((part) => part.trim() !== "");

    let firstName = "عميل";
    let lastName = "";

    if (nameParts.length === 1) {
      firstName = nameParts[0];
    } else if (nameParts.length === 2) {
      firstName = nameParts[0];
      lastName = nameParts[1];
    } else if (nameParts.length > 2) {
      firstName = nameParts.slice(0, nameParts.length - 1).join(" ");
      lastName = nameParts[nameParts.length - 1];
    }

    const isWord = /^[a-zA-Z\u0600-\u06FF\s]+$/.test(lastName);
    if (!isWord && lastName !== "") {
      firstName = cleanName;
      lastName = "";
    }

    return {
      id: tx.id,
      transactionId: tx.id,
      transactionCode: tx.ref || tx.transactionCode || tx.id.substring(0, 8),
      ownerFirstName: firstName,
      ownerLastName: lastName,
      transactionType: tx.type || tx.category || "معاملة",
      district: tx.districtName || tx.district || "غير محدد",
      sector: tx.sector || "غير محدد",
      commonName: tx.internalName || "",
      officeName: tx.office || tx.source || "غير محدد",
      supervisingOffice: tx.supervisingOffice || "غير محدد",
      financialStatus: tx.financialStatus || "غير مسدد",
      technicalStatus: tx.technicalStatus || "قيد المراجعة",
      proceduralStatus: tx.proceduralStatus || tx.status || "جارية",
      brokerName: tx.mediator || "",
      agentName:
        Array.isArray(tx.agents) && tx.agents.length > 0
          ? tx.agents.map((a) => a.name).join(" و ")
          : "",
      createdAt: tx.created || tx.createdAt || "—",
      modifiedAt: tx.updated || tx.modifiedAt || tx.created || "—",
      clientPhone: tx.phone && !tx.phone.includes("غير متوفر") ? tx.phone : "",
      clientEmail: tx.email || tx.client?.email || "",
      isUrgent: tx.isUrgent || false,
      locked: tx.locked || false,
      hasLinked:
        tx.linkedParentId ||
        (tx.linkedChildren && tx.linkedChildren.length > 0) ||
        false,
      totalSize: tx.totalSize || 0,
    };
  }, [tx]);

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

  const [requestDataForm, setRequestDataForm] = useState({
    designerOffice: "",
    supervisorOffice: "",
    electronicLicenseNumber: "",
    electronicLicenseHijriYear: "",
    electronicLicenseDate: "",
    oldLicenseNumber: "",
    oldLicenseHijriYear: "",
    oldLicenseDate: "",
    requestNumber: "",
    requestYear: "",
    serviceNumber: "",
    serviceYear: "",
    responsibleEmployee: currentUser,
    surveyRequestNumber: "",
    surveyRequestYear: "",
    surveyServiceNumber: "",
    surveyServiceYear: "",
    surveyReportNumber: "",
    surveyReportDate: "",
    contractNumber: "",
    contractApprovalDate: "",
    contractApprovedBy: "",
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

      let additionalOwners = [];
      if (
        tx.detailedOwnersList &&
        Array.isArray(tx.detailedOwnersList) &&
        tx.detailedOwnersList.length > 1
      ) {
        additionalOwners = tx.detailedOwnersList
          .filter((o) => !o.isPrimary)
          .map((o) => ({
            clientId: o.clientId || "",
            ownerName: o.ownerName,
          }));
      }

      const initialHasAgreement =
        tx.hasAgreement || tx.requestData?.hasAgreement || false;

      setEditFormData({
        year: new Date(tx.created || tx.date).getFullYear().toString(),
        month: (new Date(tx.created || tx.date).getMonth() + 1)
          .toString()
          .padStart(2, "0"),
        clientId: currentClient?.id || "",
        clientName: safeText(tx.client || tx.owner),
        additionalOwners: additionalOwners,
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

      const reqData = tx.requestData || {};
      setRequestDataForm({
        designerOffice: reqData.designerOffice || "",
        supervisorOffice: reqData.supervisorOffice || "",
        hasAgreement: initialHasAgreement,
        electronicLicenseNumber: reqData.electronicLicenseNumber || "",
        electronicLicenseHijriYear: reqData.electronicLicenseHijriYear || "",
        electronicLicenseDate: reqData.electronicLicenseDate
          ? reqData.electronicLicenseDate.split("T")[0]
          : "",
        oldLicenseNumber: reqData.oldLicenseNumber || "",
        oldLicenseHijriYear: reqData.oldLicenseHijriYear || "",
        oldLicenseDate: reqData.oldLicenseDate
          ? reqData.oldLicenseDate.split("T")[0]
          : "",
        requestNumber: reqData.requestNumber || "",
        requestYear: reqData.requestYear || "",
        serviceNumber: reqData.serviceNumber || "",
        serviceYear: reqData.serviceYear || "",
        responsibleEmployee: reqData.responsibleEmployee || currentUser,
        // 🚀 تم إضافة الحقول الجديدة هنا لتتم قراءتها بنجاح عند فتح المعاملة
        surveyRequestNumber: reqData.surveyRequestNumber || "",
        surveyRequestYear: reqData.surveyRequestYear || "",
        surveyServiceNumber: reqData.surveyServiceNumber || "",
        surveyServiceYear: reqData.surveyServiceYear || "",
        surveyReportNumber: reqData.surveyReportNumber || "",
        surveyReportDate: reqData.surveyReportDate
          ? reqData.surveyReportDate.split("T")[0]
          : "",
        contractNumber: reqData.contractNumber || "",
        contractApprovalDate: reqData.contractApprovalDate
          ? reqData.contractApprovalDate.split("T")[0]
          : "",
        contractApprovedBy: reqData.contractApprovedBy || "",
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

  // ==========================================================
  // 💡 4. Handlers & Dynamic Data
  // ==========================================================

  // 🚀 تحديد المراحل ديناميكياً بناءً على النوع
  const getDynamicPipeline = () => {
    const type = tx?.type || "";
    if (type.includes("رخصة بناء") || type.includes("اصدار")) {
      return [
        "إنشاء الطلب",
        "الدراسات الفنية",
        "الإدارة المالية",
        "الاعتماد وإصدار الرخصة",
      ];
    } else if (type.includes("فرز") || type.includes("دمج")) {
      return [
        "إنشاء الطلب",
        "الرفع المساحي",
        "الإدارة المالية",
        "اعتماد الأمانة",
      ];
    } else {
      return [
        "إنشاء الطلب",
        "المتابعة والمراجعة",
        "التحصيل والتسوية",
        "الإغلاق",
      ];
    }
  };
  const dynamicPipeline = getDynamicPipeline();

  // 🚀 دالة لتحديد المرحلة النشطة (Active Step Index) بناءً على حالة المعاملة
  const getActiveStepIndex = () => {
    if (!tx) return 0;

    const status = tx.status || "جارية";

    // إذا كانت مكتملة، كل المراحل تعتبر مكتملة (نأخذ آخر مرحلة)
    if (status === "مكتملة") return dynamicPipeline.length - 1;

    // حالة مبدئية
    if (status === "جديدة") return 0;

    // إذا كانت جارية، نتحقق من نسبة التحصيل أو المهام كتقدير للمرحلة الحالية
    // (يمكنك تخصيص هذه الشروط بناءً على نظامك)
    if (status === "جارية") {
      // إذا كان هناك تسوية جزئية أو تحصيل
      if (collectionPercent > 0 && collectionPercent < 100)
        return Math.min(2, dynamicPipeline.length - 2);
      // إذا كان التحصيل مكتمل ولم تغلق بعد
      if (collectionPercent === 100)
        return Math.min(3, dynamicPipeline.length - 1);

      // الافتراضي للـ "جارية" هو المرحلة الثانية
      return 1;
    }

    // الافتراضي
    return 0;
  };

  const activeStepIndex = getActiveStepIndex();

  // 🚀 تحديد ظهور التبويبات بناءً على النوع (مثال: الدراسات الفنية للرخص فقط)
  const needsEngineeringStudies =
    tx?.type?.includes("بناء") ||
    tx?.type?.includes("اصدار") ||
    tx?.type?.includes("تعديل");
  const needsPledges =
    tx?.type?.includes("بناء") || tx?.type?.includes("اشراف");

  const saveRequestDataEdits = () => {
    // 💡 نستخرج الحقول التي يجب أن ترسل بشكل مباشر خارج كائن requestData
    const {
      designerOffice,
      supervisorOffice,
      hasAgreement,
      ...restRequestData
    } = requestDataForm;

    updateTxMutation.mutate({
      requestData: requestDataForm, // نرسل كامل الكائن لدعم التوافقية السابقة
      designerOfficeId: designerOffice, // إرسال صريح للحقل المخصص
      supervisorOfficeId: supervisorOffice, // إرسال صريح للحقل المخصص
      hasAgreement: hasAgreement, // إرسال صريح للاتفاقية
    });
  };

  const saveBasicEdits = (passedData) => {
    // استخدم البيانات الممررة أو الـ State كاحتياط
    const dataToSave = passedData || editFormData;

    let parsedPlots = [];
    if (Array.isArray(dataToSave.plots)) {
      parsedPlots = dataToSave.plots;
    } else if (typeof dataToSave.plots === "string") {
      parsedPlots = dataToSave.plots
        .split(/[,،]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const updatedNotes = {
      ...(tx.notes || {}),
      // 💡 وضع قائمة الملاك داخل النوتس لإرسالها للباك إند
      detailedOwnersList:
        dataToSave.detailedOwnersList || tx.notes?.detailedOwnersList || [],
      refs: {
        ...((tx.notes || {}).refs || {}),
        plots: parsedPlots,
        plan: dataToSave.plan,
        area: dataToSave.area,
        mapsLink: dataToSave.mapsLink,
      },
    };

    updateTxMutation.mutate({
      ...dataToSave,
      plots: parsedPlots,
      notes: updatedNotes,
    });
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
    requestDataForm,
    setRequestDataForm,
    saveRequestDataEdits,
    isApprovalRequest: tx?.type?.includes("تصحيح وضع"),
  };

  // 💡 دالة التصيير المحدثة للتبويبات (تم حل مشكلة تداخل النصوص)
  const renderTabButton = (id, label, Icon, activeColor = "#2563eb") => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => {
          setActiveTab(id);
          setIsSidebarOpenMobile(false);
        }}
        // أضفنا tab-item للتحكم بإخفاء المجموعة، و whitespace-normal ليسمح بسطرين
        className={`tab-item flex items-start gap-3 px-4 py-3 relative transition-all duration-200 text-right group w-full ${
          isActive
            ? "font-black bg-blue-50/80"
            : "text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900"
        }`}
        style={{ color: isActive ? activeColor : undefined }}
      >
        <div
          className={`absolute right-0 top-0 bottom-0 w-[3px] transition-all duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}
          style={{ backgroundColor: activeColor }}
        />
        <Icon
          className={`w-[18px] h-[18px] shrink-0 mt-0.5 transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <span className="whitespace-normal leading-relaxed text-[12px]">
          {label}
        </span>
      </button>
    );
  };

  // 💡 دالة التصيير المحدثة للمجموعات (تم حل مشكلة الصلاحيات والمجموعات الفارغة)
  const renderSidebarGroup = (title, groupId, icon, children) => {
    const isOpen = openSidebarGroups[groupId];
    return (
      // هذا السطر السحري سيخفي المجموعة بالكامل إذا لم يظهر بداخلها أي تبويب (بسبب الصلاحيات)
      <div className="mb-1 hidden has-[.tab-item]:block">
        <button
          onClick={() => toggleSidebarGroup(groupId)}
          className="flex items-center justify-between w-full px-4 py-3 bg-slate-100/50 hover:bg-slate-100 transition-colors border-y border-slate-200/60"
        >
          <div className="flex items-center gap-2 text-slate-800 font-black text-[12px] tracking-wide whitespace-normal text-right leading-snug">
            <span className="shrink-0">{icon}</span>
            <span>{title}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[1500px] opacity-100" : "max-h-0 opacity-0"}`}
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
      className="fixed inset-0 pt-16 bg-slate-900/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
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

      {/* 🚀 نافذة ملفات المعاملة */}
      {isFolderViewerOpen && formattedTransactionForFolderViewer && (
        <FolderViewerWindow
          transaction={formattedTransactionForFolderViewer} // 👈 التمرير بالشكل المهيأ
          categories={categories}
          user={user} // 👈 تمرير المستخدم كما في الملف الأصلي
          onClose={() => setIsFolderViewerOpen(false)}
        />
      )}

      {/* --- Main Modal Container --- */}
      <div
        className="bg-white rounded-2xl flex flex-col overflow-hidden shadow-2xl relative w-[98vw] max-w-[1600px] h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- Header (Responsive) --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50 shrink-0 gap-3">
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            {/* زر القائمة الجانبية للموبايل */}
            <button
              onClick={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
              className="md:hidden p-1.5 bg-white border border-gray-200 rounded-lg text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="text-blue-600 bg-blue-100 border border-blue-200 px-2 md:px-3 py-1 rounded-lg font-mono text-xs md:text-sm font-black">
              {tx.ref || tx.id?.slice(-6)}
            </span>
            <span className="text-slate-800 text-sm md:text-[16px] font-black flex items-center gap-1.5 md:gap-2">
              <User className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />{" "}
              {safeText(tx.client || tx.owner)}
            </span>
            <span className="text-gray-400 text-xs md:text-sm font-bold sm:border-r border-gray-300 sm:pr-4">
              {tx.type}
            </span>
            {isFrozen && (
              <span className="px-2 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1">
                <Archive className="w-3 h-3" /> مجمّدة
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto overflow-x-auto pb-1 sm:pb-0">
            {/* 🚀 الزر الجديد: ملفات المعاملة */}
            <AccessControl
              code="File_ACTION_QUICK_EDIT_01"
              name="ملفات المعاملة"
              moduleName="الملفات والمرفقات"
              tabName="ملفات المعاملة"
            >
              <button
                onClick={() => setIsFolderViewerOpen(true)}
                className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[10px] md:text-xs font-black transition-colors shadow-sm whitespace-nowrap"
              >
                <FolderOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />{" "}
                <span>ملفات المعاملة</span>
              </button>
            </AccessControl>
            <AccessControl
              code="Transaction_ACTION_TOGGLE_FREEZE_02"
              name="تجميد/تنشيط المعاملة"
              moduleName="المعاملات"
              tabName="تفاصيل المعاملة"
            >
              <button
                onClick={() => freezeMutation.mutate(tx.id)}
                disabled={freezeMutation.isPending}
                className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-[10px] md:text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
              >
                {isFrozen ? (
                  <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
                ) : (
                  <Archive className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600" />
                )}
                <span className="hidden sm:inline">
                  {isFrozen ? "تنشيط" : "تجميد"}
                </span>
              </button>
            </AccessControl>
            <AccessControl
              code="Transaction_ACTION_DELETE_03"
              name="حذف المعاملة"
              moduleName="المعاملات"
              tabName="تفاصيل المعاملة"
            >
              <button
                onClick={() => {
                  if (window.confirm("حذف نهائي؟ لا يمكن التراجع!"))
                    deleteMutation.mutate(tx.id);
                }}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-[10px] md:text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />{" "}
                <span className="hidden sm:inline">حذف</span>
              </button>
            </AccessControl>

            <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1"></div>
            <button
              onClick={onClose}
              className="p-1.5 md:p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100 shrink-0"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* 🚀 Pipeline Strip (Dynamic & Interactive) */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--wms-border)] bg-slate-50 shrink-0 overflow-x-auto custom-scrollbar-slim">
          {dynamicPipeline.map((step, i, arr) => {
            // تحديد حالة المرحلة بناءً على الـ index
            const isCompleted =
              i < activeStepIndex ||
              (i === activeStepIndex && tx.status === "مكتملة");
            const isActive = i === activeStepIndex && tx.status !== "مكتملة";

            return (
              <React.Fragment key={step}>
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors
                    ${
                      isCompleted
                        ? "text-emerald-700 bg-emerald-100 border border-emerald-200"
                        : isActive
                          ? "text-blue-700 bg-blue-100 border border-blue-200 ring-2 ring-blue-100 ring-offset-1"
                          : "text-slate-500 bg-white border border-slate-200"
                    }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : isActive ? (
                    <Activity className="w-3 h-3 animate-pulse" /> // أيقونة متحركة للمرحلة الحالية
                  ) : (
                    <Circle className="w-2.5 h-2.5" />
                  )}{" "}
                  <span>{step}</span>
                </div>

                {/* السهم بين المراحل */}
                {i < arr.length - 1 && (
                  <ArrowLeftRight
                    className={`w-2.5 h-2.5 md:w-3 md:h-3 mx-0.5 md:mx-1 shrink-0 transition-colors
                      ${i < activeStepIndex ? "text-emerald-400" : "text-slate-300"}`}
                  />
                )}
              </React.Fragment>
            );
          })}
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
                <AccessControl
                  code="Transaction_TAB_BASIC_04"
                  name="البيانات الأساسية"
                  moduleName="المعاملات"
                  tabName="البيانات الأساسية"
                >
                  {renderTabButton(
                    "basic",
                    "البيانات الأساسية",
                    FileText,
                    "#2563eb",
                  )}
                </AccessControl>
                <AccessControl
                  code="Transaction_TAB_REQUEST_DATA_05"
                  name="بيانات الطلب والرخصة"
                  moduleName="المعاملات"
                  tabName="بيانات الطلب والرخصة"
                >
                  {renderTabButton(
                    "request_data",
                    "بيانات الطلب والرخصة",
                    ClipboardList,
                    "#0891b2",
                  )}
                </AccessControl>
                <AccessControl
                  code="Transaction_TAB_STATUS_06"
                  name="حالة المعاملة والتوجيهات"
                  moduleName="المعاملات"
                  tabName="حالة المعاملة والتوجيهات"
                >
                  {renderTabButton(
                    "status",
                    "حالة المعاملة والتوجيهات",
                    History,
                    "#ea580c",
                  )}
                </AccessControl>
                <AccessControl
                  code="Transaction_TAB_TASKS_07"
                  name="مهام المعاملة (الداخلية)"
                  moduleName="المعاملات"
                  tabName="مهام المعاملة (الداخلية)"
                >
                  {renderTabButton(
                    "tasks",
                    "مهام المعاملة (الداخلية)",
                    CalendarDays,
                    "#4f46e5",
                  )}
                </AccessControl>
                <AccessControl
                  code="Transaction_TAB_REMOTE_08"
                  name="العمل عن بعد"
                  moduleName="المعاملات"
                  tabName="العمل عن بعد"
                >
                  {renderTabButton(
                    "remote",
                    "العمل عن بعد",
                    Monitor,
                    "#059669",
                  )}
                </AccessControl>
                <AccessControl
                  code="Transaction_TAB_ATTACHMENTS_09"
                  name="ملفات المعاملة"
                  moduleName="المعاملات"
                  tabName="ملفات المعاملة"
                >
                  {renderTabButton(
                    "attachments",
                    "ملفات المعاملة",
                    Paperclip,
                    "#64748b",
                  )}
                </AccessControl>
                <AccessControl
                  code="Transaction_TAB_AUTHORITY_NOTES_10"
                  name="ملاحظات الجهات والإفادات"
                  moduleName="المعاملات"
                  tabName="ملاحظات الجهات والإفادات"
                >
                  {renderTabButton(
                    "authority_notes",
                    "ملاحظات الجهات والإفادات",
                    MessageSquare,
                    "#8b5cf6",
                  )}
                </AccessControl>
                <AccessControl
                  code="Transaction_TAB_COMMENTS_LOGS_11"
                  name="التعليقات والسجلات"
                  moduleName="المعاملات"
                  tabName="التعليقات والسجلات"
                >
                  {renderTabButton(
                    "comments",
                    "التعليقات",
                    MessageCircle,
                    "#f97316",
                  )}
                </AccessControl>
                <AccessControl
                  code="Transaction_TAB_COMMENTS_LOGS_12"
                  name="سجل الأحداث"
                  moduleName="المعاملات"
                  tabName="سجل الأحداث"
                >
                  {renderTabButton("logs", "سجل الأحداث", Activity, "#475569")}
                </AccessControl>
              </>,
            )}

            {/* مجموعة الإدارة المالية */}
            
              {renderSidebarGroup(
                "الإدارة المالية والتسويات",
                "financial",
                <Landmark className="w-4 h-4 text-emerald-600" />,
                <>
                  <AccessControl
                    code="Transaction_TAB_FINANCIAL_15"
                    name="المحرك المالي"
                    moduleName="المعاملات"
                    tabName="المحرك المالي"
                  >
                    {renderTabButton(
                      "financial",
                      "المحرك المالي",
                      Calculator,
                      "#059669",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_BROKERS_16"
                    name="حساب الوسطاء"
                    moduleName="المعاملات"
                    tabName="حساب الوسطاء"
                  >
                    {renderTabButton(
                      "brokers",
                      "حساب الوسطاء",
                      Handshake,
                      "#0891b2",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_QUOTATION_31"
                    name="عرض السعر"
                    moduleName="المعاملات"
                    tabName="عرض السعر"
                  >
                    {renderTabButton(
                      "quotation",
                      "عرض السعر",
                      FileText,
                      "#0ea5e9",
                    )}
                  </AccessControl>

                  {/* عقد المعاملة مع المالك */}
                  <AccessControl
                    code="Transaction_TAB_OWNER_CONTRACT_32"
                    name="عقد المعاملة مع المالك"
                    moduleName="المعاملات"
                    tabName="عقد المعاملة مع المالك"
                  >
                    {renderTabButton(
                      "owner_contract",
                      "عقد المعاملة مع المالك",
                      FileSignature,
                      "#f59e0b",
                    )}
                  </AccessControl>

                  {/* فواتير أتعاب المعاملة */}
                  <AccessControl
                    code="Transaction_TAB_FEES_INVOICES_33"
                    name="فواتير أتعاب المعاملة"
                    moduleName="المعاملات"
                    tabName="فواتير أتعاب المعاملة"
                  >
                    {renderTabButton(
                      "fees_invoices",
                      "فواتير أتعاب المعاملة",
                      Receipt,
                      "#10b981",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_COOP_OFFICE_17"
                    name="المكاتب المتعاونة"
                    moduleName="المعاملات"
                    tabName="المكاتب المتعاونة"
                  >
                    {renderTabButton(
                      "coop_office",
                      "المكاتب المتعاونة",
                      Building2,
                      "#0284c7",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_AGENTS_18"
                    name="حساب المعقبين"
                    moduleName="المعاملات"
                    tabName="حساب المعقبين"
                  >
                    {renderTabButton(
                      "agents",
                      "حساب المعقبين",
                      User,
                      "#7c3aed",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_PAYMENTS_19"
                    name="دفعات العميل"
                    moduleName="المعاملات"
                    tabName="دفعات العميل"
                  >
                    {renderTabButton(
                      "payments",
                      "دفعات العميل",
                      Banknote,
                      "#16a34a",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_DATES_20"
                    name="مواعيد التحصيل"
                    moduleName="المعاملات"
                    tabName="مواعيد التحصيل"
                  >
                    {renderTabButton(
                      "dates",
                      "مواعيد التحصيل",
                      CalendarDays,
                      "#d946ef",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_SETTLEMENT_21"
                    name="التسوية الشاملة"
                    moduleName="المعاملات"
                    tabName="التسوية الشاملة"
                  >
                    {renderTabButton(
                      "settlement",
                      "التسوية الشاملة",
                      Scale,
                      "#2563eb",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_PROFITS_22"
                    name="توزيع الأرباح"
                    moduleName="المعاملات"
                    tabName="توزيع الأرباح"
                  >
                    {renderTabButton(
                      "profits",
                      "توزيع الأرباح",
                      PieChart,
                      "#8b5cf6",
                    )}
                  </AccessControl>
                </>,
              )}
            
            {/* مجموعة الدراسات الهندسية الفنية */}
            
              {renderSidebarGroup(
                "الدراسات الهندسية الفنية",
                "engineering",
                <HardHat className="w-4 h-4 text-amber-500" />,
                <>
                  <AccessControl
                    code="Transaction_TAB_ARCH_STUDY_24"
                    name="الدراسات المعمارية"
                    moduleName="المعاملات"
                    tabName="الدراسات المعمارية"
                  >
                    {renderTabButton(
                      "arch_study",
                      "الدراسات المعمارية",
                      Building,
                      "#d97706",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_STRUCT_STUDY_25"
                    name="الدراسات الإنشائية"
                    moduleName="المعاملات"
                    tabName="الدراسات الإنشائية"
                  >
                    {renderTabButton(
                      "struct_study",
                      "الدراسات الإنشائية",
                      Pickaxe,
                      "#ea580c",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_SOIL_TEST_26"
                    name="فحص التربة"
                    moduleName="المعاملات"
                    tabName="فحص التربة"
                  >
                    {renderTabButton("soil_test", "فحص التربة", Map, "#b45309")}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_TRAFFIC_STUDY_27"
                    name="الدراسات المرورية"
                    moduleName="المعاملات"
                    tabName="الدراسات المرورية"
                  >
                    {renderTabButton(
                      "traffic_study",
                      "الدراسات المرورية",
                      Car,
                      "#dc2626",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_PARKING_28"
                    name="مواقف السيارات"
                    moduleName="المعاملات"
                    tabName="مواقف السيارات"
                  >
                    {renderTabButton(
                      "parking",
                      "مواقف السيارات",
                      Archive,
                      "#475569",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_MECH_STUDY_29"
                    name="الدراسات الميكانيكية"
                    moduleName="المعاملات"
                    tabName="الدراسات الميكانيكية"
                  >
                    {renderTabButton(
                      "mech_study",
                      "الدراسات الميكانيكية",
                      Wind,
                      "#0284c7",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_ELEC_STUDY_30"
                    name="الدراسات الكهربائية"
                    moduleName="المعاملات"
                    tabName="الدراسات الكهربائية"
                  >
                    {renderTabButton(
                      "elec_study",
                      "الدراسات الكهربائية",
                      Zap,
                      "#eab308",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_SAFETY_31"
                    name="الأمن والسلامة"
                    moduleName="المعاملات"
                    tabName="الأمن والسلامة"
                  >
                    {renderTabButton(
                      "safety",
                      "الأمن والسلامة",
                      ShieldCheck,
                      "#16a34a",
                    )}
                  </AccessControl>
                </>,
              )}
            
            {/* مجموعة التعهدات والمستندات */}
            
              {renderSidebarGroup(
                "مستندات وتعهدات",
                "documents",
                <FileCheck className="w-4 h-4 text-indigo-500" />,
                <>
                  <AccessControl
                    code="Transaction_TAB_OWNER_PLEDGE_33"
                    name="تعهدات المالك"
                    moduleName="المعاملات"
                    tabName="تعهدات المالك"
                  >
                    {renderTabButton(
                      "owner_pledge",
                      "تعهدات المالك",
                      FileText,
                      "#4f46e5",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_DESIGNER_PLEDGE_34"
                    name="تعهدات المكتب المصمم"
                    moduleName="المعاملات"
                    tabName="تعهدات المكتب المصمم"
                  >
                    {renderTabButton(
                      "designer_pledge",
                      "تعهدات المكتب المصمم",
                      PenLine,
                      "#6366f1",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_SUPERVISOR_PLEDGE_35"
                    name="تعهدات المكتب المشرف"
                    moduleName="المعاملات"
                    tabName="تعهدات المكتب المشرف"
                  >
                    {renderTabButton(
                      "supervisor_pledge",
                      "تعهدات المكتب المشرف",
                      ClipboardList,
                      "#8b5cf6",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_INSURANCE_36"
                    name="وثيقة التأمين"
                    moduleName="المعاملات"
                    tabName="وثيقة التأمين"
                  >
                    {renderTabButton(
                      "insurance",
                      "وثيقة التأمين",
                      ShieldCheck,
                      "#14b8a6",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_TECH_REPORT_37"
                    name="التقرير الفني"
                    moduleName="المعاملات"
                    tabName="التقرير الفني"
                  >
                    {renderTabButton(
                      "tech_report",
                      "التقرير الفني",
                      FileEdit,
                      "#f59e0b",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_OFFICIAL_ARCHIVE_38"
                    name="الأرشيف الرسمي"
                    moduleName="المعاملات"
                    tabName="الأرشيف الرسمي"
                  >
                    {renderTabButton(
                      "official_archive",
                      "الأرشيف الرسمي",
                      FolderCog,
                      "#64748b",
                    )}
                  </AccessControl>
                  <AccessControl
                    code="Transaction_TAB_OWNER_ATTACHMENTS_39"
                    name="مرفقات من المالك"
                    moduleName="المعاملات"
                    tabName="مرفقات من المالك"
                  >
                    {renderTabButton(
                      "owner_attachments",
                      "مرفقات من المالك",
                      Paperclip,
                      "#3b82f6",
                    )}
                  </AccessControl>
                </>,
              )}
            
            {/* التبويبات الفردية المتبقية (خارج المجموعات) */}
            <div className="mt-4 border-t border-slate-200 pt-2">
              <AccessControl
                code="Transaction_TAB_SUPERVISION_40"
                name="الإشراف الهندسي"
                moduleName="المعاملات"
                tabName="الإشراف الهندسي"
              >
                {renderTabButton(
                  "supervision",
                  "الإشراف الهندسي",
                  EyeOff,
                  "#ef4444",
                )}
              </AccessControl>
              <AccessControl
                code="Transaction_TAB_EXECUTION_41"
                name="التنفيذ والمقاولات"
                moduleName="المعاملات"
                tabName="التنفيذ والمقاولات"
              >
                {renderTabButton(
                  "execution",
                  "التنفيذ والمقاولات",
                  Building2,
                  "#f97316",
                )}
              </AccessControl>
            </div>
          </div>

          {/* 💡 Dynamic Content Area (Left in RTL) */}
          <div
            className={`flex-1 overflow-y-auto custom-scrollbar-slim relative ${isSidebarOpenMobile ? "hidden md:block" : "block"}`}
          >
            <div className="p-3 md:p-6 mx-auto min-h-full w-full">
              {/* المكونات الأساسية المتوفرة حالياً */}
              {activeTab === "basic" && <BasicTab {...tabContext} />}
              {activeTab === "request_data" && (
                <RequestDataTab {...tabContext} />
              )}
              {activeTab === "status" && <StatusTab {...tabContext} />}
              {activeTab === "financial" && <FinancialTab {...tabContext} />}
              {activeTab === "brokers" && <BrokersTab {...tabContext} />}
              {activeTab === "authority_notes" && (
                <AuthorityNotesTab {...tabContext} />
              )}
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
                "request_data",
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
                "authority_notes",
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
