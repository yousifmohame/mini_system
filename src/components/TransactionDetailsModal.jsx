import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../api/axios";
import {
  X,
  Plus,
  FileText,
  Printer,
  Loader2,
  ChevronDown,
  ChevronUp,
  Settings2,
  RefreshCw,
  Archive,
  Edit3,
  Square,
  Circle,
  TrendingUp,
  Crown,
  Handshake,
  User,
  Briefcase,
  Check,
  Banknote,
  CreditCard,
  Monitor,
  Scale,
  PieChart,
  Trash2,
  Wallet,
  TriangleAlert,
  Info,
  Paperclip,
  ArrowLeftRight,
  Calculator,
  Image as ImageIcon,
  DollarSign,
  PenLine,
  Send,
  CalendarDays,
  Timer,
  History,
  Save,
  Search,
} from "lucide-react";

// ============================================================================
// 💡 Helpers
// ============================================================================
const safeNum = (val) => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const safeText = (val) => {
  if (!val) return "—";
  if (typeof val === "object") return val.ar || val.name || JSON.stringify(val);
  return String(val);
};

const getCollectionStatus = (paid, total) => {
  if (paid >= total && total > 0)
    return { label: "محصل بالكامل", color: "bg-green-100 text-green-700" };
  if (paid > 0 && paid < total)
    return { label: "محصل جزئي", color: "bg-amber-100 text-amber-700" };
  return { label: "غير محصل", color: "bg-red-100 text-red-700" };
};

// ============================================================================
// 💡 مكون محول العملات الثلاثي (Triple Currency Input)
// ============================================================================
const TripleCurrencyInput = ({ valueSar, onChangeSar, rates }) => {
  const usdRate = rates.find((r) => r.currency === "USD")?.rate || 0.266;
  const egpRate = rates.find((r) => r.currency === "EGP")?.rate || 13.2;
  const handleFocus = (e) => e.target.select();

  return (
    <div className="flex gap-2 w-full">
      <div className="flex-1 relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
          SAR
        </span>
        <input
          type="number"
          value={valueSar || ""}
          onChange={(e) => onChangeSar(e.target.value)}
          onFocus={handleFocus}
          className="w-full bg-white border border-gray-300 rounded-md py-1.5 pl-8 pr-2 text-xs font-mono font-bold focus:border-blue-500 outline-none"
        />
      </div>
      <div className="flex-1 relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
          EGP
        </span>
        <input
          type="number"
          value={valueSar ? (valueSar * egpRate).toFixed(2) : ""}
          onChange={(e) =>
            onChangeSar(
              e.target.value ? (e.target.value / egpRate).toFixed(2) : "",
            )
          }
          onFocus={handleFocus}
          className="w-full bg-slate-50 border border-gray-200 rounded-md py-1.5 pl-8 pr-2 text-xs font-mono focus:border-blue-500 outline-none"
        />
      </div>
      <div className="flex-1 relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
          USD
        </span>
        <input
          type="number"
          value={valueSar ? (valueSar * usdRate).toFixed(2) : ""}
          onChange={(e) =>
            onChangeSar(
              e.target.value ? (e.target.value / usdRate).toFixed(2) : "",
            )
          }
          onFocus={handleFocus}
          className="w-full bg-slate-50 border border-gray-200 rounded-md py-1.5 pl-8 pr-2 text-xs font-mono focus:border-blue-500 outline-none"
        />
      </div>
    </div>
  );
};

// ============================================================================
// 💡 مكون القائمة المنسدلة القابلة للبحث (Searchable Select)
// ============================================================================
const SearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = React.useRef(null);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className="w-full border border-gray-300 p-1.5 rounded-lg text-xs font-bold bg-white flex justify-between items-center cursor-pointer focus:border-blue-500 h-[34px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate text-gray-700 pr-2">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95">
          <div className="sticky top-0 bg-white p-2 border-b border-gray-100 z-10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full pr-8 pl-2 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-blue-500 bg-gray-50"
                placeholder="ابحث هنا..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs font-bold text-gray-700 rounded transition-colors"
                  onClick={() => {
                    onChange(opt.value, opt);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-xs text-gray-400 text-center font-bold">
                لا توجد نتائج مطابقة
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 💡 Main Component: TransactionDetailsModal
// ============================================================================
export const TransactionDetailsModal = ({
  isOpen,
  onClose,
  tx: initialTx,
  refetchTable,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  const backendUrl = api.defaults.baseURL.replace("/api", "");

  // جلب بيانات المعاملة بشكل حي (Live) من الـ Cache
  const { data: transactionsData = [] } = useQuery({
    queryKey: ["private-transactions-full"],
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

  // جلب المكاتب للاختيار منها في التعديل
  const { data: offices = [] } = useQuery({
    queryKey: ["coop-offices-modal"],
    queryFn: async () => (await api.get("/coop-offices")).data?.data || [],
    enabled: isOpen,
  });

  // جلب الأحياء والقطاعات لاختيارها في التعديل
  const { data: riyadhZones = [] } = useQuery({
    queryKey: ["riyadhZones-modal"],
    queryFn: async () => (await api.get("/riyadh-zones")).data?.data || [],
    enabled: isOpen,
  });

  // جلب العملاء لاختيار المالك
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-simple-modal"],
    queryFn: async () => {
      const res = await api.get("/clients/simple");
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
    enabled: isOpen,
  });

  // 💡 جلب إعدادات النظام الشاملة (لاستخراج حصة المكتب الديناميكية)
  const { data: systemSettings } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => (await api.get("/settings")).data?.data || {},
    enabled: isOpen,
  });

  // تجهيز قوائم البحث الذكية
  const clientsOptions = useMemo(
    () => clients.map((c) => ({ label: c.name?.ar || c.name, value: c.id })),
    [clients],
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

  const [openSections, setOpenSections] = useState({
    brokers: true,
    agents: true,
    remote: true,
    expenses: true,
  });
  const toggleSection = (sec) =>
    setOpenSections((p) => ({ ...p, [sec]: !p[sec] }));

  // ==========================================================
  // 💡 Sub-Modals States & New Feature States
  // ==========================================================
  const [previewFile, setPreviewFile] = useState(null);
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingFinancial, setIsEditingFinancial] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [payTaskData, setPayTaskData] = useState(null);

  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    method: "تحويل بنكي",
    ref: "",
    notes: "",
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

  const [statusForm, setStatusForm] = useState({
    currentStatus: "عند المهندس للدراسة",
    serviceNumber: "",
    hijriYear1: "",
    licenseNumber: "",
    hijriYear2: "",
    oldLicenseNumber: "",
    authorityNotes: "",
    noteAttachment: null,
  });

  const [distributionScheme, setDistributionScheme] = useState("default");
  const [roundingMode, setRoundingMode] = useState("none");

  // ==========================================================
  // 💡 Data Fetching inside Modal
  // ==========================================================
  const { data: persons = [] } = useQuery({
    queryKey: ["persons-directory-modal"],
    queryFn: async () => (await api.get("/persons")).data?.data || [],
    enabled: isOpen,
  });

  const agentsList = useMemo(
    () => persons.filter((p) => p.role === "معقب"),
    [persons],
  );
  const remoteWorkersList = useMemo(
    () => persons.filter((p) => p.role === "موظف عن بعد"),
    [persons],
  );

  const [isAddBrokerModalOpen, setIsAddBrokerModalOpen] = useState(false);
  const [brokerForm, setBrokerForm] = useState({ brokerId: "", fees: "" });
  const brokersList = useMemo(
    () => persons.filter((p) => p.role === "وسيط"),
    [persons],
  );

  // ==========================================================
  // 💡 Mutations
  // ==========================================================
  const updateTxMutation = useMutation({
    mutationFn: async (data) => api.put(`/private-transactions/${tx.id}`, data),
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
        if (k === "noteAttachment" && data[k]) fd.append("file", data[k]);
        else fd.append(k, data[k]);
      });
      return api.post(`/private-transactions/${tx?.id}/status`, fd);
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة المعاملة بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
  });

  const addBrokerMutation = useMutation({
    mutationFn: async (data) =>
      api.post(`/private-transactions/${tx?.id}/brokers`, data),
    onSuccess: () => {
      toast.success("تم تعيين الوسيط بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setIsAddBrokerModalOpen(false);
      setBrokerForm({ brokerId: "", fees: "" });
    },
  });

  const deleteBrokerMutation = useMutation({
    mutationFn: async (brokerRecordId) =>
      api.delete(`/private-transactions/brokers/${brokerRecordId}`),
    onSuccess: () => {
      toast.success("تم حذف الوسيط");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
  });

  const freezeMutation = useMutation({
    mutationFn: async (id) =>
      await api.patch(`/private-transactions/${id}/toggle-freeze`),
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
    mutationFn: async (data) =>
      api.post(`/private-transactions/payments`, {
        transactionId: tx?.id,
        collectedFromType: "عميل",
        ...data,
      }),
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
      api.post(`/private-transactions/${tx?.id}/agents`, data),
    onSuccess: () => {
      toast.success("تم ربط المعقب بالمعاملة");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setIsAddAgentOpen(false);
    },
  });

  const addRemoteTaskMutation = useMutation({
    mutationFn: async (payload) =>
      api.post(`/remote-workers/assign-tasks`, payload), // 👈 نرسل الـ payload كما هو
    onSuccess: () => {
      toast.success("تم تعيين المهام للموظف بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setIsAddRemoteTaskOpen(false);
      // تصفير الفورم
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

  const deleteRemoteTaskMutation = useMutation({
    mutationFn: async (taskId) => api.delete(`/remote-workers/tasks/${taskId}`),
    onSuccess: () => {
      toast.success("تم حذف المهمة بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف"),
  });

  const payRemoteTaskMutation = useMutation({
    mutationFn: async (payload) =>
      api.post(`/remote-workers/tasks/pay`, payload),
    onSuccess: () => {
      toast.success("تم تسجيل الدفع للموظف بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setPayTaskData(null); // إغلاق النافذة
    },
    onError: () => toast.error("حدث خطأ أثناء تسجيل الدفع"),
  });

  // 💡 Mutation عام لدفع أي شخص (وسيط، معقب، عامل)
  const payPersonMutation = useMutation({
    // نستخدم الـ Endpoint الخاص بالتسويات لدفع الأتعاب
    mutationFn: async (payload) => api.post(`/finance/settlements`, payload),
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setPayPersonData(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ أثناء تسجيل الدفع"),
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append("files", file); // 👈 لاحظ أننا نرسل الملف باسم files

      // 💡 التعديل هنا: المسار الصحيح للمعاملات السرية
      return api.post(`/private-transactions/${tx?.id}/attachments`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("تم رفع المرفق بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
    onError: () => toast.error("حدث خطأ أثناء رفع المرفق"),
  });

  const addDateMutation = useMutation({
    mutationFn: async (data) =>
      await api.post(`/private-transactions/${tx?.id}/collection-dates`, data),
    onSuccess: () => {
      toast.success("تمت إضافة الموعد");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setDateForm({
        amountType: "full",
        amount: "",
        type: "specific_date",
        date: "",
        person: "",
        notes: "",
      });
    },
  });

  // 💡 Mutation جديد لحذف مرفق معين من المعاملة
  // 💡 Mutation حذف مرفق معين من المعاملة بشكل دقيق
  const deleteAttachmentMutation = useMutation({
    mutationFn: async (fileUrlToRemove) => {
      // 1. قراءة المرفقات الحالية من المعاملة (tx.attachments) بدلاً من notes
      const currentAttachments = tx.attachments || [];

      // 2. فلترة المرفقات واستبعاد الملف الذي نريد حذفه فقط
      const updatedAttachments = currentAttachments.filter(
        (att) => att.url !== fileUrlToRemove,
      );

      // 3. إرسالها للباك إند داخل حقل notes كما ينتظرها الباك إند
      return api.put(`/private-transactions/${tx.id}`, {
        notes: { attachments: updatedAttachments },
      });
    },
    onSuccess: () => {
      toast.success("تم حذف المرفق بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
    onError: () => toast.error("حدث خطأ أثناء حذف المرفق"),
  });

  // 💡 Mutation لاعتماد التسوية الشاملة
  const finalizeSettlementMutation = useMutation({
    mutationFn: async () => {
      // نرسل طلب تعديل لتغيير حالة المعاملة إلى "مكتملة"
      return api.put(`/private-transactions/${tx.id}`, {
        status: "مكتملة", // أو أي حالة تعتمدها في نظامك لإغلاق المعاملة
        // يمكنك تمرير أي بيانات إضافية هنا
      });
    },
    onSuccess: () => {
      toast.success("تم تنفيذ التسوية الشاملة بنجاح وإغلاق المعاملة!");
      queryClient.invalidateQueries(["private-transactions-full"]);
      // يمكنك إضافة onClose() هنا إذا أردت إغلاق النافذة تلقائياً بعد التسوية
    },
    onError: () => toast.error("حدث خطأ أثناء تنفيذ التسوية"),
  });

  // ==========================================================
  // 💡 Handlers & UseEffects
  // ==========================================================
  // بدلاً من payTaskData، سنستخدم payPersonData ليكون عاماً
  const [payPersonData, setPayPersonData] = useState(null);

  // تحديث editFormData لتحديث الأتعاب التقديرية تلقائياً
  useEffect(() => {
    if (tx) {
      const currentClient = clients.find(
        (c) => (c.name?.ar || c.name) === safeText(tx.client),
      );

      // 💡 حساب إجمالي أتعاب الوسطاء والمعقبين الحقيقية من الداتابيز
      const totalRealMediatorFees =
        tx.brokers?.reduce((sum, b) => sum + safeNum(b.fees), 0) || 0;
      const totalRealAgentFees =
        tx.agents?.reduce((sum, a) => sum + safeNum(a.fees), 0) || 0;

      setEditFormData({
        year: new Date(tx.createdAt || tx.date).getFullYear().toString(),
        month: (new Date(tx.createdAt || tx.date).getMonth() + 1)
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
        // 💡 نأخذ المجموع الفعلي إذا كان التقديري (في الـ notes) صفراً
        mediatorFees: tx.mediatorFees || totalRealMediatorFees,
        agentCost: tx.agentCost || totalRealAgentFees,
      });

      if (tx.notes?.transactionStatusData) {
        setStatusForm(tx.notes.transactionStatusData);
      }
    }
  }, [tx, clients]);

  // ==========================================================
  // 💡 Calculations (الحسابات المالية المعقدة)
  // ==========================================================
  const totalFees = safeNum(tx?.totalPrice || tx?.totalFees);
  const totalPaid = safeNum(tx?.collectionAmount || tx?.paidAmount);
  const remaining = totalFees - totalPaid;
  const collectionPercent =
    totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0;

  const totalCosts =
    safeNum(tx?.agentCost) +
    safeNum(tx?.remoteCost) +
    safeNum(tx?.expensesCost);
  const estimatedProfit = totalFees - totalCosts;
  const reserveDeduction = estimatedProfit * 0.1; // افتراض 10%
  const distributableProfit = estimatedProfit - reserveDeduction;

  // 💡 1. حساب حصة المكتب بناءً على الإعدادات الديناميكية
  // 💡 1. حساب حصة المكتب واستخراج النسبة/القاعدة المطبقة
  const officeShareData = useMemo(() => {
    if (distributableProfit <= 0 || !systemSettings) {
      return { amount: 0, label: "0%" };
    }

    let appliedType = systemSettings.officeShareType || "percentage";
    let appliedValue = safeNum(systemSettings.officeShareValue) || 10;

    // التحقق هل الربح يقع ضمن أي شريحة من الشرائح الديناميكية؟
    const categories = systemSettings.officeShareCategories || [];
    const matchingTier = categories.find(
      (c) =>
        distributableProfit >= safeNum(c.minAmount) &&
        distributableProfit <= safeNum(c.maxAmount),
    );

    if (matchingTier) {
      appliedType = matchingTier.type;
      appliedValue = safeNum(matchingTier.value);
    }

    let calculatedShare = 0;
    let displayLabel = "";

    if (appliedType === "percentage") {
      calculatedShare = distributableProfit * (appliedValue / 100);
      displayLabel = `${appliedValue}%`; // 👈 تجهيز النسبة للعرض
    } else {
      calculatedShare = appliedValue;
      displayLabel = `مبلغ ثابت (${appliedValue.toLocaleString()})`; // 👈 تجهيز المبلغ الثابت للعرض
    }

    return {
      amount: Math.min(calculatedShare, distributableProfit),
      label: displayLabel,
    };
  }, [distributableProfit, systemSettings]);

  // استخراج القيم لسهولة الاستخدام
  const officeShareAmount = officeShareData.amount;
  const officeShareLabel = officeShareData.label;

  // 💡 2. تحديث المتبقي بعد استقطاع حصة المكتب
  const netAfterOfficeShare = distributableProfit - officeShareAmount;

  // 💡 3. حساب حصة المصدر
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

    if (distributionScheme === "fouad") {
      scheme = [
        { id: "p1", name: "شريك 1", percent: 33.33 },
        { id: "p2", name: "شريك 2", percent: 33.33 },
        { id: "p3", name: "شريك 3", percent: 33.34 },
      ];
    } else if (distributionScheme === "custom") {
      scheme = [
        { id: "p1", name: "شريك 1", percent: 40 },
        { id: "p2", name: "شريك 2", percent: 35 },
        { id: "p3", name: "شريك 3", percent: 25 },
      ];
    }

    return scheme.map((p) => {
      let rawAmount = (availableForPartners * p.percent) / 100;
      let finalAmount = rawAmount;

      if (roundingMode === "10") finalAmount = Math.round(rawAmount / 10) * 10;
      if (roundingMode === "50") finalAmount = Math.round(rawAmount / 50) * 50;
      if (roundingMode === "100")
        finalAmount = Math.round(rawAmount / 100) * 100;

      let roundDiff = finalAmount - rawAmount;
      return { ...p, rawAmount, finalAmount, roundDiff };
    });
  }, [availableForPartners, distributionScheme, roundingMode, tx]);

  const isSettlementComplete = totalCosts > 0 && tx?.status !== "جارية";

  if (!isOpen || !tx) return null;

  const isFrozen = tx.status === "مجمّدة";

  const calculateDays = (targetDate, isApprovalRelated) => {
    const today = new Date();

    if (isApprovalRelated) {
      // 💡 إذا كانت الدفعة مستحقة "عند الاعتماد"، نتحقق هل تم الاعتماد أم لا
      if (statusForm.currentStatus === "تم الاعتماد") {
        // إذا كان هناك تاريخ اعتماد مسجل نستخدمه، وإلا نستخدم تاريخ اليوم كبداية
        const approvalDate = statusForm.approvalDate
          ? new Date(statusForm.approvalDate)
          : today;
        const diffTime = today - approvalDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays; // سترجع عدد الأيام التي مرت منذ الاعتماد (تأخير)
      } else {
        return null; // لم يتم الاعتماد بعد، لا يوجد عداد
      }
    }

    // 💡 إذا كان تاريخاً محدداً (specific_date)
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays; // إيجابي = متبقي، سلبي = متأخر
  };

  const renderTabButton = (
    id,
    label,
    Icon,
    activeColor = "var(--wms-accent-blue)",
  ) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-1.5 px-4 py-3 whitespace-nowrap cursor-pointer transition-all shrink-0 ${isActive ? `border-b-2 font-bold bg-slate-50` : "text-[var(--wms-text-muted)] hover:text-[var(--wms-text-sec)] font-medium border-b-2 border-transparent"}`}
        style={{
          fontSize: "12px",
          color: isActive ? activeColor : undefined,
          borderColor: isActive ? activeColor : "transparent",
        }}
      >
        <Icon className="w-4 h-4" /> <span>{label}</span>
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      {/* 💡 نافذة معاينة المرفقات الداخلية (Popup) - بدون روابط خارجية */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/90 z-[200] flex flex-col items-center justify-center p-4 animate-in zoom-in-95"
          onClick={(e) => {
            e.stopPropagation();
            setPreviewFile(null);
          }}
        >
          <div className="w-full max-w-5xl flex justify-between items-center mb-4">
            <span className="text-white font-bold text-lg">
              {previewFile.name}
            </span>
            <button
              onClick={() => setPreviewFile(null)}
              className="text-white hover:text-red-500 bg-white/20 p-2 rounded-full transition-colors"
            >
              <X />
            </button>
          </div>
          <div
            className="w-full max-w-5xl h-[85vh] bg-white rounded-xl overflow-hidden shadow-2xl flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {previewFile.url?.toLowerCase().endsWith(".pdf") ? (
              <iframe
                src={previewFile.url}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            ) : (
              <img
                src={previewFile.url}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            )}
            {/* رسالة بديلة تظهر في حال فشل تحميل الملف */}
            <div className="hidden flex-col items-center justify-center text-gray-500">
              <TriangleAlert className="w-12 h-12 text-red-400 mb-2" />
              <span className="font-bold">تعذر تحميل الملف</span>
              <span className="text-xs mt-1">
                المستند غير متوفر أو مساره غير صحيح
              </span>
            </div>
          </div>
        </div>
      )}

      <div
        className="bg-white rounded-2xl flex flex-col overflow-hidden shadow-2xl relative w-[90vw] max-w-[1200px] h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-[var(--wms-accent-blue)] bg-blue-100 border border-blue-200 px-3 py-1 rounded-lg font-mono text-[14px] font-black">
              {tx.ref || tx.id?.slice(-6)}
            </span>
            <span className="text-[var(--wms-text)] text-[16px] font-black">
              تفاصيل المعاملة: {safeText(tx.client || tx.owner)}
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
              <Trash2 className="w-4 h-4" />
              <span>حذف نهائي</span>
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

        {/* Pipeline / Status Strip */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--wms-border)] bg-[var(--wms-surface-2)] shrink-0">
          {["التحصيل", "التكاليف التشغيلية", "التسوية", "توزيع الأرباح"].map(
            (step, i, arr) => (
              <React.Fragment key={step}>
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold ${i === 0 ? "text-green-600 bg-green-50" : "text-gray-500 hover:bg-gray-100 cursor-pointer"}`}
                >
                  {i === 0 ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}{" "}
                  <span>{step}</span>
                </div>
                {i < arr.length - 1 && (
                  <ArrowLeftRight className="w-3 h-3 text-gray-300 mx-1" />
                )}
              </React.Fragment>
            ),
          )}
        </div>

        {/* Tabs Strip */}
        <div className="flex border-b border-gray-200 shrink-0 overflow-x-auto custom-scrollbar-slim bg-white px-2">
          {renderTabButton("basic", "البيانات الأساسية", FileText)}
          {renderTabButton(
            "status",
            "حالة المعاملة",
            History,
            "rgb(234, 88, 12)",
          )}
          {renderTabButton("financial", "المحرك المالي", Calculator)}
          {renderTabButton("brokers", "الوسطاء", Handshake)}
          {renderTabButton("agents", "المعقبون", User, "rgb(124, 58, 237)")}
          {renderTabButton(
            "remote",
            "العمل عن بعد",
            Monitor,
            "rgb(5, 150, 105)",
          )}
          {renderTabButton("payments", "الدفعات", Banknote, "rgb(34, 197, 94)")}
          {renderTabButton("settlement", "التسوية", Scale, "rgb(37, 99, 235)")}
          {renderTabButton(
            "profits",
            "توزيع الأرباح",
            PieChart,
            "rgb(168, 85, 247)",
          )}
          {renderTabButton("attachments", "المرفقات", Paperclip)}
          {renderTabButton(
            "dates",
            "مواعيد التحصيل",
            CalendarDays,
            "rgb(168, 85, 247)",
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-slim bg-slate-50/50 relative p-6">
          {/* === 1. BASIC === */}
          {activeTab === "basic" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> البيانات
                  الرئيسية
                </h3>
                <button
                  onClick={() => setIsEditingBasic(!isEditingBasic)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm"
                >
                  {isEditingBasic ? (
                    <X className="w-3.5 h-3.5" />
                  ) : (
                    <Edit3 className="w-3.5 h-3.5" />
                  )}
                  {isEditingBasic ? "إلغاء التعديل" : "تعديل البيانات"}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-gray-500 text-[11px] font-bold mb-2">
                    رقم المعاملة (التسكين)
                  </div>
                  {isEditingBasic ? (
                    <div className="flex gap-2">
                      <select
                        value={editFormData.year}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            year: e.target.value,
                          })
                        }
                        className="border p-1.5 rounded text-xs w-1/2 outline-none focus:border-blue-500"
                      >
                        {[2023, 2024, 2025, 2026, 2027].map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <select
                        value={editFormData.month}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            month: e.target.value,
                          })
                        }
                        className="border p-1.5 rounded text-xs w-1/2 outline-none focus:border-blue-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                          <option key={m} value={String(m).padStart(2, "0")}>
                            {String(m).padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="font-mono text-xl font-black text-blue-700">
                      {tx.ref || tx.id.slice(-6)}
                    </div>
                  )}
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm col-span-2">
                  <div className="text-gray-500 text-[11px] font-bold mb-2">
                    اسم المالك
                  </div>
                  {isEditingBasic ? (
                    <SearchableSelect
                      options={clientsOptions}
                      value={editFormData.clientId}
                      placeholder={editFormData.clientName || "ابحث بالاسم..."}
                      onChange={(val, opt) =>
                        setEditFormData({
                          ...editFormData,
                          clientId: val,
                          clientName: opt.label,
                          client: opt.label,
                        })
                      }
                    />
                  ) : (
                    <div className="text-lg font-black text-gray-800">
                      {safeText(tx.client || tx.owner)}
                    </div>
                  )}
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-gray-500 text-[11px] font-bold mb-2">
                    نوع المعاملة
                  </div>
                  {isEditingBasic ? (
                    <select
                      value={editFormData.type}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          type: e.target.value,
                        })
                      }
                      className="w-full border p-1.5 rounded text-sm font-bold outline-none focus:border-blue-500"
                    >
                      <option>اصدار</option>
                      <option>تجديد وتعديل</option>
                      <option>فرز</option>
                      <option>دمج</option>
                    </select>
                  ) : (
                    <div className="text-lg font-black text-gray-800">
                      {safeText(tx.type)}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-gray-500 text-[11px] font-bold mb-2">
                    الحي والقطاع
                  </div>
                  {isEditingBasic ? (
                    <div className="flex gap-2">
                      <SearchableSelect
                        options={districtsOptions}
                        value={editFormData.districtId}
                        placeholder={editFormData.district || "تعديل الحي..."}
                        onChange={(val, opt) =>
                          setEditFormData({
                            ...editFormData,
                            districtId: val,
                            district: opt.label.split(" (")[0],
                            sector: opt.sectorName,
                          })
                        }
                      />
                    </div>
                  ) : (
                    <div className="text-md font-bold text-gray-800">
                      {safeText(tx.district)} - {safeText(tx.sector)}
                    </div>
                  )}
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-gray-500 text-[11px] font-bold mb-2">
                    المكتب المنفذ (الخارجي)
                  </div>
                  {isEditingBasic ? (
                    <select
                      value={editFormData.office}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          office: e.target.value,
                        })
                      }
                      className="w-full border p-1.5 rounded text-sm font-bold outline-none focus:border-blue-500"
                    >
                      <option value="مكتب ديتيلز">مكتب ديتيلز (داخلي)</option>
                      {offices.map((o) => (
                        <option key={o.id} value={o.name}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-md font-bold text-gray-700">
                      {safeText(tx.office || "مكتب ديتيلز")}
                    </div>
                  )}
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-gray-500 text-[11px] font-bold mb-2">
                    مصدر المعاملة (الداخلي)
                  </div>
                  {isEditingBasic ? (
                    <select
                      value={editFormData.sourceName}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          sourceName: e.target.value,
                        })
                      }
                      className="w-full border p-1.5 rounded text-sm font-bold outline-none focus:border-blue-500"
                    >
                      <option value="مباشر">مباشر (بدون مصدر)</option>
                      {persons.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-md font-black text-purple-700">
                      {safeText(tx.sourceName || tx.source || "مباشر")}
                    </div>
                  )}
                </div>
              </div>

              {isEditingBasic && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => updateTxMutation.mutate(editFormData)}
                    disabled={updateTxMutation.isPending}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateTxMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 inline mr-2" />
                    )}{" "}
                    حفظ التعديلات
                  </button>
                </div>
              )}
            </div>
          )}

          {/* === 2. TRANSACTION STATUS (NEW TAB) === */}
          {activeTab === "status" && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center relative">
                <div className="absolute top-1/2 left-10 right-10 h-1 bg-gray-100 -z-10 -translate-y-1/2"></div>
                {[
                  "عند المهندس للدراسة",
                  "تم الرفع",
                  "ملاحظات من الجهات",
                  "تم الاعتماد",
                ].map((step, idx) => {
                  const isActive = statusForm.currentStatus === step;
                  const isPassed =
                    [
                      "عند المهندس للدراسة",
                      "تم الرفع",
                      "ملاحظات من الجهات",
                      "تم الاعتماد",
                    ].indexOf(statusForm.currentStatus) > idx;
                  return (
                    <button
                      key={step}
                      onClick={() => {
                        // 💡 تسجيل تاريخ الاعتماد إذا تم اختيار هذه الحالة
                        if (
                          step === "تم الاعتماد" &&
                          !statusForm.approvalDate
                        ) {
                          setStatusForm({
                            ...statusForm,
                            currentStatus: step,
                            approvalDate: new Date().toISOString(),
                          });
                        } else {
                          setStatusForm({ ...statusForm, currentStatus: step });
                        }
                      }}
                      className="flex flex-col items-center gap-2 bg-white px-2 cursor-pointer group"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all ${isActive ? "border-orange-500 bg-orange-100 text-orange-600 scale-110" : isPassed ? "border-green-500 bg-green-500 text-white" : "border-gray-200 bg-white text-gray-400 group-hover:border-orange-200"}`}
                      >
                        {isPassed ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <span className="font-bold text-sm">{idx + 1}</span>
                        )}
                      </div>
                      <span
                        className={`text-xs font-bold ${isActive ? "text-orange-600" : isPassed ? "text-green-600" : "text-gray-500"}`}
                      >
                        {step}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                {statusForm.currentStatus === "عند المهندس للدراسة" && (
                  <div className="text-center py-10 text-gray-500 font-bold">
                    المعاملة قيد الدراسة لدى القسم الهندسي.
                  </div>
                )}
                {statusForm.currentStatus === "تم الرفع" && (
                  <div className="grid grid-cols-2 gap-6 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        رقم الخدمة
                      </label>
                      <input
                        type="text"
                        value={statusForm.serviceNumber}
                        onChange={(e) =>
                          setStatusForm({
                            ...statusForm,
                            serviceNumber: e.target.value,
                          })
                        }
                        className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        السنة الهجرية
                      </label>
                      <input
                        type="text"
                        value={statusForm.hijriYear1}
                        onChange={(e) =>
                          setStatusForm({
                            ...statusForm,
                            hijriYear1: e.target.value,
                          })
                        }
                        placeholder="مثال: 1445"
                        className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        رقم الرخصة
                      </label>
                      <input
                        type="text"
                        value={statusForm.licenseNumber}
                        onChange={(e) =>
                          setStatusForm({
                            ...statusForm,
                            licenseNumber: e.target.value,
                          })
                        }
                        className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        السنة الهجرية للرخصة
                      </label>
                      <input
                        type="text"
                        value={statusForm.hijriYear2}
                        onChange={(e) =>
                          setStatusForm({
                            ...statusForm,
                            hijriYear2: e.target.value,
                          })
                        }
                        placeholder="مثال: 1445"
                        className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        رقم الرخصة القديمة
                      </label>
                      <input
                        type="text"
                        value={statusForm.oldLicenseNumber}
                        onChange={(e) =>
                          setStatusForm({
                            ...statusForm,
                            oldLicenseNumber: e.target.value,
                          })
                        }
                        className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                )}
                {statusForm.currentStatus === "ملاحظات من الجهات" && (
                  <div className="space-y-5 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        الملاحظات والتوجيه
                      </label>
                      <textarea
                        value={statusForm.authorityNotes}
                        onChange={(e) =>
                          setStatusForm({
                            ...statusForm,
                            authorityNotes: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-lg text-sm outline-none focus:border-orange-500 h-28 resize-none"
                        placeholder="اكتب الملاحظات الواردة من البلدية أو الأمانة..."
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        صورة الملاحظة (اختياري)
                      </label>
                      <input
                        type="file"
                        onChange={(e) =>
                          setStatusForm({
                            ...statusForm,
                            noteAttachment: e.target.files[0],
                          })
                        }
                        className="w-full border p-2 rounded-lg text-sm bg-gray-50"
                      />
                    </div>
                  </div>
                )}
                {statusForm.currentStatus === "تم الاعتماد" && (
                  <div className="text-center py-10 text-green-600 font-bold bg-green-50 rounded-xl border border-green-200">
                    🎉 تم اعتماد المعاملة بنجاح، سيتم تفعيل عدادات التحصيل.
                  </div>
                )}

                <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
                  <button
                    onClick={() => updateStatusMutation.mutate(statusForm)}
                    disabled={updateStatusMutation.isPending}
                    className="px-8 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-orange-700 disabled:opacity-50"
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "حفظ الحالة وتحديث النظام"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* === 3. FINANCIAL ENGINE (المحرك المالي التفاعلي حسب الصورة) === */}
          {activeTab === "financial" && (
            <div className="space-y-4 animate-in fade-in duration-300 pb-20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" /> المحرك المالي
                  والتفاصيل
                </h3>
                <button
                  onClick={() => setIsEditingFinancial(!isEditingFinancial)}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                    isEditingFinancial
                      ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {isEditingFinancial ? (
                    <X className="w-3.5 h-3.5" />
                  ) : (
                    <Edit3 className="w-3.5 h-3.5" />
                  )}
                  {isEditingFinancial ? "إغلاق التعديل" : "إمكانية التعديل"}
                </button>
              </div>

              {/* 1. الإيرادات */}
              <div
                className="rounded-xl border overflow-hidden shadow-sm"
                style={{ borderColor: "rgba(34, 197, 94, 0.3)" }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ backgroundColor: "rgba(34, 197, 94, 0.08)" }}
                >
                  <div className="flex items-center gap-2 text-green-700 font-bold text-[13px]">
                    <Banknote className="w-4 h-4" /> الإيرادات — السعر المتفق
                  </div>
                  {isEditingFinancial ? (
                    <div className="w-[300px]">
                      <TripleCurrencyInput
                        valueSar={editFormData.totalFees}
                        onChangeSar={(v) =>
                          setEditFormData({ ...editFormData, totalFees: v })
                        }
                        rates={exchangeRates}
                      />
                    </div>
                  ) : (
                    <span className="font-mono text-lg font-black text-green-700">
                      {totalFees.toLocaleString()} ر.س
                    </span>
                  )}
                </div>
              </div>

              {/* 2. أتعاب الوسطاء */}
              <div
                className="rounded-xl border overflow-hidden shadow-sm transition-all"
                style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.05)",
                    borderBottom: openSections.brokers
                      ? "1px solid rgba(239, 68, 68, 0.1)"
                      : "none",
                  }}
                  onClick={() => toggleSection("brokers")}
                >
                  <div className="flex items-center gap-2 text-red-600 font-bold text-[12px]">
                    <Handshake className="w-4 h-4" /> أتعاب الوسطاء —{" "}
                    {safeNum(
                      editFormData.mediatorFees || tx.mediatorFees,
                    ).toLocaleString()}{" "}
                    ر.س
                  </div>
                  <div className="flex items-center gap-3">
                    {isEditingFinancial && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAddBrokerModalOpen(true);
                        }}
                        className="flex items-center gap-1 bg-white border border-red-200 text-red-600 px-2.5 py-1 rounded text-[10px] hover:bg-red-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> إضافة وسيط
                      </button>
                    )}
                    {openSections.brokers ? (
                      <ChevronUp className="w-4 h-4 text-red-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </div>
                {openSections.brokers && (
                  <div className="p-4 bg-white">
                    {tx.brokers?.length > 0 ? (
                      <div className="space-y-2">
                        {tx.brokers.map((b, i) => {
                          const cost = safeNum(b.fees);
                          const paid =
                            tx.settlements
                              ?.filter(
                                (s) =>
                                  s.targetId === b.personId &&
                                  s.status === "DELIVERED",
                              )
                              .reduce((sum, s) => sum + s.amount, 0) || 0;
                          const remaining = Math.max(0, cost - paid);
                          const isFullyPaid = paid >= cost;

                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-red-50/30 transition-colors"
                            >
                              <span className="font-bold text-gray-800 text-[12px] w-1/3">
                                {b.name}
                              </span>
                              <div className="flex w-1/3 justify-between items-center text-center px-2">
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400">
                                    التكلفة
                                  </span>
                                  <span className="font-mono font-bold text-gray-800 text-[12px]">
                                    {cost.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400">
                                    المدفوع
                                  </span>
                                  <span className="font-mono font-bold text-green-600 text-[12px]">
                                    {paid.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="w-1/3 flex justify-end items-center gap-2">
                                {isFullyPaid ? (
                                  <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> مدفوع
                                  </span>
                                ) : (
                                  <>
                                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                      متبقي: {remaining}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPayPersonData({
                                          targetType: "وسيط",
                                          targetId: b.personId,
                                          workerName: b.name,
                                          taskName: "أتعاب وساطة",
                                          totalCost: remaining,
                                          paymentType: "full",
                                          amountSar: remaining,
                                          paymentDate: new Date()
                                            .toISOString()
                                            .split("T")[0],
                                        });
                                      }}
                                      className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white px-2.5 py-1 rounded text-[10px] font-bold transition-colors"
                                    >
                                      <Banknote className="w-3 h-3" /> سداد
                                    </button>
                                  </>
                                )}
                                {isEditingFinancial && (
                                  <button
                                    onClick={() =>
                                      deleteBrokerMutation.mutate(b.id)
                                    }
                                    className="text-gray-400 hover:text-red-500 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-[11px] text-gray-400 font-bold">
                        لا يوجد وسطاء مسجلين في هذه المعاملة
                      </div>
                    )}
                    {isEditingFinancial && (
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] text-gray-500 font-bold">
                          تعديل الإجمالي التقديري للوسطاء
                        </span>
                        <div className="w-[300px]">
                          <TripleCurrencyInput
                            valueSar={editFormData.mediatorFees}
                            onChangeSar={(v) =>
                              setEditFormData({
                                ...editFormData,
                                mediatorFees: v,
                              })
                            }
                            rates={exchangeRates}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. أتعاب المعقبين */}
              <div
                className="rounded-xl border overflow-hidden shadow-sm transition-all"
                style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.05)",
                    borderBottom: openSections.agents
                      ? "1px solid rgba(239, 68, 68, 0.1)"
                      : "none",
                  }}
                  onClick={() => toggleSection("agents")}
                >
                  <div className="flex items-center gap-2 text-red-600 font-bold text-[12px]">
                    <User className="w-4 h-4" /> أتعاب المعقبين —{" "}
                    {safeNum(
                      editFormData.agentCost || tx.agentCost,
                    ).toLocaleString()}{" "}
                    ر.س
                  </div>
                  <div className="flex items-center gap-3">
                    {isEditingFinancial && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAddAgentOpen(true);
                        }}
                        className="flex items-center gap-1 bg-white border border-red-200 text-red-600 px-2.5 py-1 rounded text-[10px] hover:bg-red-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> إضافة معقب
                      </button>
                    )}
                    {openSections.agents ? (
                      <ChevronUp className="w-4 h-4 text-red-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </div>
                {openSections.agents && (
                  <div className="p-4 bg-white">
                    {tx.agents?.length > 0 ? (
                      <div className="space-y-2">
                        {tx.agents.map((ag, i) => {
                          const cost = safeNum(ag.fees);
                          const paid =
                            tx.settlements
                              ?.filter(
                                (s) =>
                                  s.targetId === ag.id &&
                                  s.status === "DELIVERED",
                              )
                              .reduce((sum, s) => sum + s.amount, 0) || 0;
                          const remaining = Math.max(0, cost - paid);
                          const isFullyPaid = paid >= cost;

                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-red-50/30 transition-colors"
                            >
                              <div className="flex flex-col w-1/3">
                                <span className="font-bold text-gray-800 text-[12px]">
                                  {ag.name}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  {ag.role}
                                </span>
                              </div>
                              <div className="flex w-1/3 justify-between items-center text-center px-2">
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400">
                                    التكلفة
                                  </span>
                                  <span className="font-mono font-bold text-gray-800 text-[12px]">
                                    {cost.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400">
                                    المدفوع
                                  </span>
                                  <span className="font-mono font-bold text-green-600 text-[12px]">
                                    {paid.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="w-1/3 flex justify-end items-center gap-2">
                                {isFullyPaid ? (
                                  <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> مدفوع
                                  </span>
                                ) : (
                                  <>
                                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                      متبقي: {remaining}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPayPersonData({
                                          targetType: "معقب",
                                          targetId: ag.id,
                                          workerName: ag.name,
                                          taskName: ag.role || "أتعاب تعقيب",
                                          totalCost: remaining,
                                          paymentType: "full",
                                          amountSar: remaining,
                                          paymentDate: new Date()
                                            .toISOString()
                                            .split("T")[0],
                                        });
                                      }}
                                      className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white px-2.5 py-1 rounded text-[10px] font-bold transition-colors"
                                    >
                                      <Banknote className="w-3 h-3" /> سداد
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-[11px] text-gray-400 font-bold">
                        لا يوجد معقبين مسجلين
                      </div>
                    )}
                    {isEditingFinancial && (
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] text-gray-500 font-bold">
                          تعديل الإجمالي التقديري للمعقبين
                        </span>
                        <div className="w-[300px]">
                          <TripleCurrencyInput
                            valueSar={editFormData.agentCost}
                            onChangeSar={(v) =>
                              setEditFormData({ ...editFormData, agentCost: v })
                            }
                            rates={exchangeRates}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. العمل عن بعد */}
              <div
                className="rounded-xl border overflow-hidden shadow-sm transition-all"
                style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.05)",
                    borderBottom: openSections.remote
                      ? "1px solid rgba(239, 68, 68, 0.1)"
                      : "none",
                  }}
                  onClick={() => toggleSection("remote")}
                >
                  <div className="flex items-center gap-2 text-red-600 font-bold text-[12px]">
                    <Monitor className="w-4 h-4" /> العمل عن بعد —{" "}
                    {safeNum(tx.remoteCost).toLocaleString()} ر.س
                  </div>
                  <div className="flex items-center gap-3">
                    {isEditingFinancial && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAddRemoteTaskOpen(true);
                        }}
                        className="flex items-center gap-1 bg-white border border-red-200 text-red-600 px-2.5 py-1 rounded text-[10px] hover:bg-red-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> تعيين مهمة
                      </button>
                    )}
                    {openSections.remote ? (
                      <ChevronUp className="w-4 h-4 text-red-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </div>
                {openSections.remote && (
                  <div className="p-4 bg-white">
                    {tx.remoteTasks?.length > 0 ? (
                      <div className="space-y-2">
                        {tx.remoteTasks.map((rt, i) => {
                          const taskCost = safeNum(rt.cost);
                          const taskPaid = rt.isPaid
                            ? taskCost
                            : safeNum(rt.paidAmount);
                          const taskRemaining = Math.max(
                            0,
                            taskCost - taskPaid,
                          );

                          return (
                            <div
                              key={rt.id || i}
                              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/30 transition-colors"
                            >
                              <div className="flex flex-col w-1/4">
                                <span className="font-bold text-gray-800 text-[12px]">
                                  {rt.workerName}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  {rt.taskName}
                                </span>
                              </div>
                              <div className="flex w-2/4 justify-between items-center text-center px-4">
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400">
                                    التكلفة
                                  </span>
                                  <span className="font-mono font-bold text-gray-800 text-[12px]">
                                    {taskCost.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400">
                                    المدفوع
                                  </span>
                                  <span className="font-mono font-bold text-green-600 text-[12px]">
                                    {taskPaid.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400">
                                    المتبقي
                                  </span>
                                  <span className="font-mono font-bold text-red-600 text-[12px]">
                                    {taskRemaining.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="w-1/4 flex justify-end items-center gap-2">
                                {taskRemaining <= 0 ? (
                                  <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> مدفوع
                                  </span>
                                ) : (
                                  <>
                                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                      بانتظار الدفع
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPayPersonData({
                                          targetType: "موظف عن بعد",
                                          taskId: rt.id,
                                          workerName: rt.workerName,
                                          taskName: rt.taskName,
                                          totalCost: taskRemaining,
                                          paymentType: "full",
                                          amountSar: taskRemaining,
                                          paymentDate: new Date()
                                            .toISOString()
                                            .split("T")[0],
                                        });
                                      }}
                                      className="flex items-center gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white px-2.5 py-1 rounded text-[10px] font-bold transition-colors"
                                    >
                                      <Banknote className="w-3 h-3" /> سداد
                                    </button>
                                  </>
                                )}
                                {isEditingFinancial && (
                                  <button
                                    onClick={() =>
                                      deleteRemoteTaskMutation.mutate(rt.id)
                                    }
                                    className="text-gray-400 hover:text-red-500 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-[11px] text-gray-400 font-bold">
                        لا يوجد مهام عمل عن بعد مسجلة
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 5. مصاريف أخرى */}
              <div
                className="rounded-xl border overflow-hidden shadow-sm transition-all"
                style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.05)",
                    borderBottom: openSections.expenses
                      ? "1px solid rgba(239, 68, 68, 0.1)"
                      : "none",
                  }}
                  onClick={() => toggleSection("expenses")}
                >
                  <div className="flex items-center gap-2 text-red-600 font-bold text-[12px]">
                    <Wallet className="w-4 h-4" /> مصاريف أخرى —{" "}
                    {safeNum(tx.expensesCost).toLocaleString()} ر.س
                  </div>
                  <div className="flex items-center gap-3">
                    {isEditingFinancial && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.info("نموذج المصاريف قيد الإنشاء");
                        }}
                        className="flex items-center gap-1 bg-white border border-red-200 text-red-600 px-2.5 py-1 rounded text-[10px] hover:bg-red-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> إضافة بند
                      </button>
                    )}
                    {openSections.expenses ? (
                      <ChevronUp className="w-4 h-4 text-red-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </div>
                {openSections.expenses && (
                  <div className="p-4 bg-white text-center">
                    <div className="text-[11px] text-gray-400 font-bold py-2">
                      لا توجد مصاريف أخرى مسجلة
                    </div>
                  </div>
                )}
              </div>

              {/* 6. نتائج الحساب التلقائي */}
              <div
                className="rounded-xl border overflow-hidden shadow-sm mt-6"
                style={{ borderColor: "rgba(59, 130, 246, 0.2)" }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    backgroundColor: "rgba(59, 130, 246, 0.05)",
                    borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
                  }}
                >
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <Calculator className="w-4 h-4" />
                    <span className="text-[13px] font-bold">
                      نتائج الحساب التلقائي
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div
                      className="p-4 rounded-xl border border-red-100"
                      style={{ backgroundColor: "rgba(239, 68, 68, 0.03)" }}
                    >
                      <div className="text-red-700 text-[11px] font-bold mb-1">
                        إجمالي التكاليف
                      </div>
                      <div className="font-mono text-xl font-black text-red-700">
                        {totalCosts.toLocaleString()}{" "}
                        <span className="text-[11px] font-normal">ر.س</span>
                      </div>
                    </div>
                    <div
                      className="p-4 rounded-xl border border-green-100"
                      style={{ backgroundColor: "rgba(34, 197, 94, 0.03)" }}
                    >
                      <div className="text-green-700 text-[11px] font-bold mb-1">
                        ربح تقديري
                      </div>
                      <div className="font-mono text-xl font-black text-green-700">
                        {estimatedProfit.toLocaleString()}{" "}
                        <span className="text-[11px] font-normal">ر.س</span>
                      </div>
                    </div>
                    <div
                      className="p-4 rounded-xl border border-blue-100"
                      style={{ backgroundColor: "rgba(59, 130, 246, 0.03)" }}
                    >
                      <div className="text-blue-700 text-[11px] font-bold mb-1">
                        خصم الاحتياطي (10%)
                      </div>
                      <div className="font-mono text-xl font-black text-blue-700">
                        {reserveDeduction.toLocaleString()}{" "}
                        <span className="text-[11px] font-normal">ر.س</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div
                      className="p-4 rounded-xl flex items-center justify-between border border-green-200 shadow-sm"
                      style={{ backgroundColor: "rgba(34, 197, 94, 0.05)" }}
                    >
                      <div>
                        <div className="text-green-800 text-[12px] font-bold mb-1">
                          صافي قابل للتسوية
                        </div>
                        <div className="font-mono text-2xl font-black text-green-700">
                          {distributableProfit.toLocaleString()}{" "}
                          <span className="text-[12px] font-normal">ر.س</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("settlement")}
                        className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-bold text-[12px] flex items-center gap-2 hover:bg-green-700 transition-colors shadow-md"
                      >
                        <Check className="w-4 h-4" /> تسوية
                      </button>
                    </div>
                    <div
                      className="p-4 rounded-xl flex items-center justify-between border border-amber-200 shadow-sm"
                      style={{ backgroundColor: "rgba(245, 158, 11, 0.05)" }}
                    >
                      <div>
                        <div className="text-amber-800 text-[12px] font-bold mb-1">
                          ربح قابل للتوزيع
                        </div>
                        <div className="font-mono text-2xl font-black text-amber-700">
                          {availableForPartners.toLocaleString()}{" "}
                          <span className="text-[12px] font-normal">ر.س</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("profits")}
                        className="px-5 py-2.5 rounded-lg bg-amber-500 text-white font-bold text-[12px] flex items-center gap-2 hover:bg-amber-600 transition-colors shadow-md"
                      >
                        <PieChart className="w-4 h-4" /> توزيع
                      </button>
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-xl border border-purple-200"
                    style={{ backgroundColor: "rgba(168, 85, 247, 0.03)" }}
                  >
                    <div className="text-[11px] font-bold text-purple-700 mb-1">
                      حصة المصدر — {safeText(tx.sourceName || tx.source)} (
                      {sourcePercent}%)
                    </div>
                    <div className="font-mono text-lg font-black text-purple-700">
                      {sourceShare.toLocaleString()}{" "}
                      <span className="text-[11px] font-normal">ر.س</span>
                    </div>
                  </div>
                </div>
              </div>

              {isEditingFinancial && (
                <div className="fixed bottom-6 left-6 z-50">
                  <button
                    onClick={() => updateTxMutation.mutate(editFormData)}
                    disabled={updateTxMutation.isPending}
                    className="px-8 py-3.5 bg-blue-600 text-white rounded-full text-sm font-black shadow-2xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {updateTxMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}{" "}
                    حفظ التعديلات المالية
                  </button>
                </div>
              )}
            </div>
          )}

          {/* === 4. BROKERS === */}
          {/* === 4. BROKERS === */}
          {activeTab === "brokers" && (
            <div className="p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--wms-text)] text-[14px] font-bold">
                    الوسطاء المرتبطون
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded text-[12px] font-bold bg-red-50 text-red-600 border border-red-100">
                    {safeNum(tx.mediatorFees).toLocaleString()} ر.س
                  </span>
                </div>
                <button
                  onClick={() => setIsAddBrokerModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-bold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> إضافة وسيط
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[12px] text-right">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        الوسيط
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        الأتعاب
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        المدفوع
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        المتبقي
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        الحالة
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600 text-center">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.brokers?.length > 0 ? (
                      tx.brokers.map((b, i) => {
                        const cost = safeNum(b.fees);
                        const paid =
                          tx.settlements
                            ?.filter(
                              (s) =>
                                s.targetId === b.personId &&
                                s.status === "DELIVERED",
                            )
                            .reduce((sum, s) => sum + s.amount, 0) || 0;
                        const remaining = Math.max(0, cost - paid);
                        const isFullyPaid = paid >= cost && cost > 0;

                        let statusLabel = "غير مدفوع";
                        let statusClass =
                          "bg-amber-100 text-amber-700 border border-amber-200";

                        if (isFullyPaid) {
                          statusLabel = "تم الدفع";
                          statusClass =
                            "bg-green-100 text-green-700 border border-green-200";
                        } else if (paid > 0) {
                          statusLabel = "دفع جزئي";
                          statusClass =
                            "bg-blue-100 text-blue-700 border border-blue-200";
                        }

                        return (
                          <tr
                            key={i}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-4 font-bold text-gray-800">
                              {b.name}
                            </td>
                            <td className="px-4 py-4 font-mono font-bold text-gray-800">
                              {cost.toLocaleString()}
                            </td>
                            <td className="px-4 py-4 font-mono font-bold text-green-600">
                              {paid.toLocaleString()}
                            </td>
                            <td className="px-4 py-4 font-mono font-bold text-red-600">
                              {remaining.toLocaleString()}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 w-max ${statusClass}`}
                              >
                                {isFullyPaid ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Circle className="w-3 h-3" />
                                )}
                                {statusLabel}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                {remaining > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPayPersonData({
                                        targetType: "وسيط",
                                        targetId: b.personId,
                                        workerName: b.name,
                                        taskName: "أتعاب وساطة",
                                        totalCost: remaining,
                                        paymentType: "full",
                                        amountSar: remaining,
                                        paymentDate: new Date()
                                          .toISOString()
                                          .split("T")[0],
                                      });
                                    }}
                                    className="flex items-center gap-1 bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                  >
                                    <Banknote className="w-3.5 h-3.5" /> سداد
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      window.confirm(
                                        "هل تريد إزالة هذا الوسيط؟",
                                      )
                                    )
                                      deleteBrokerMutation.mutate(b.id);
                                  }}
                                  className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center py-8 text-gray-400 font-bold"
                        >
                          لا يوجد وسطاء مسجلين
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === 5. AGENTS === */}
          {activeTab === "agents" && (
            <div className="p-4 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--wms-text)] text-[14px] font-bold">
                    المعقبون المرتبطون بالمعاملة
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded text-[12px] font-bold bg-red-50 text-red-600 border border-red-100">
                    {safeNum(tx.agentCost).toLocaleString()} ر.س
                  </span>
                </div>
                <button
                  onClick={() => setIsAddAgentOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-bold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> إضافة معقب
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[12px] text-right">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        المعقب
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        الدور / المهمة
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        الأتعاب
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        المدفوع
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        المتبقي
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        الحالة
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600 text-center">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.agents?.length > 0 ? (
                      tx.agents.map((ag, i) => {
                        const cost = safeNum(ag.fees);
                        const paid =
                          tx.settlements
                            ?.filter(
                              (s) =>
                                s.targetId === ag.id &&
                                s.status === "DELIVERED",
                            )
                            .reduce((sum, s) => sum + s.amount, 0) || 0;
                        const remaining = Math.max(0, cost - paid);
                        const isFullyPaid = paid >= cost && cost > 0;

                        let statusLabel = "قيد الانتظار";
                        let statusClass =
                          "bg-amber-100 text-amber-700 border border-amber-200";

                        if (isFullyPaid) {
                          statusLabel = "تم الدفع";
                          statusClass =
                            "bg-green-100 text-green-700 border border-green-200";
                        } else if (paid > 0) {
                          statusLabel = "دفع جزئي";
                          statusClass =
                            "bg-blue-100 text-blue-700 border border-blue-200";
                        }

                        return (
                          <tr
                            key={i}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-4 font-bold text-gray-800">
                              {ag.name}
                            </td>
                            <td className="px-4 py-4 text-gray-600">
                              {ag.role || "معقب"}
                            </td>
                            <td className="px-4 py-4 font-mono font-bold text-gray-800">
                              {cost.toLocaleString()}
                            </td>
                            <td className="px-4 py-4 font-mono font-bold text-green-600">
                              {paid.toLocaleString()}
                            </td>
                            <td className="px-4 py-4 font-mono font-bold text-red-600">
                              {remaining.toLocaleString()}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 w-max ${statusClass}`}
                              >
                                {isFullyPaid ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Circle className="w-3 h-3" />
                                )}
                                {statusLabel}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                {remaining > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPayPersonData({
                                        targetType: "معقب",
                                        targetId: ag.id,
                                        workerName: ag.name,
                                        taskName: ag.role || "أتعاب تعقيب",
                                        totalCost: remaining,
                                        paymentType: "full",
                                        amountSar: remaining,
                                        paymentDate: new Date()
                                          .toISOString()
                                          .split("T")[0],
                                      });
                                    }}
                                    className="flex items-center gap-1 bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                  >
                                    <Banknote className="w-3.5 h-3.5" /> سداد
                                  </button>
                                )}
                                <button className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="text-center py-8 text-gray-400 font-bold"
                        >
                          لا يوجد معقبون مرتبطون بهذه المعاملة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === 6. REMOTE WORKERS === */}
          {activeTab === "remote" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-emerald-600" /> سجل العمل عن
                  بعد
                </h3>
                <button
                  onClick={() => setIsAddRemoteTaskOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> تعيين مهمة جديدة
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-right text-[12px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        الموظف
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        وصف المهمة
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        التكلفة
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        المدفوع
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        المتبقي
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        الحالة
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600 text-center">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.remoteTasks?.length > 0 ? (
                      tx.remoteTasks.map((rt, i) => {
                        // 💡 الحسابات المالية الاحترافية لكل مهمة
                        const taskCost = safeNum(rt.cost);
                        // نعتمد على الحقل الجديد paidAmount، وإذا كان isPaid قديماً نعتبره مدفوع بالكامل
                        const taskPaid = rt.isPaid
                          ? taskCost
                          : safeNum(rt.paidAmount);
                        const taskRemaining = Math.max(0, taskCost - taskPaid);

                        // 💡 تحديد الحالة والألوان بناءً على الأرقام
                        let statusLabel = "بانتظار الدفع";
                        let statusClass =
                          "bg-amber-100 text-amber-700 border border-amber-200";
                        let StatusIcon = Circle;

                        if (taskPaid >= taskCost && taskCost > 0) {
                          statusLabel = "تم الدفع";
                          statusClass =
                            "bg-green-100 text-green-700 border border-green-200";
                          StatusIcon = Check;
                        } else if (taskPaid > 0) {
                          statusLabel = "دفع جزئي";
                          statusClass =
                            "bg-blue-100 text-blue-700 border border-blue-200";
                          StatusIcon = Banknote;
                        }

                        return (
                          <tr
                            key={rt.id || i}
                            className="border-b border-gray-100 hover:bg-emerald-50/30 transition-colors"
                          >
                            <td className="px-4 py-4 font-bold text-gray-900">
                              {rt.workerName}
                            </td>
                            <td className="px-4 py-4 text-gray-600 font-medium">
                              {rt.taskName}
                            </td>
                            <td className="px-4 py-4 font-mono font-black text-gray-800">
                              {taskCost.toLocaleString()}
                            </td>
                            <td className="px-4 py-4 font-mono font-bold text-green-600">
                              {taskPaid.toLocaleString()}
                            </td>
                            <td className="px-4 py-4 font-mono font-bold text-red-600">
                              {taskRemaining.toLocaleString()}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 w-max ${statusClass}`}
                              >
                                <StatusIcon className="w-3 h-3" /> {statusLabel}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                {taskRemaining > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPayPersonData({
                                        targetType: "موظف عن بعد",
                                        targetId: rt.workerId, // 👈 تمت إضافة هذا السطر
                                        taskId: rt.id,
                                        workerName: rt.workerName,
                                        taskName: rt.taskName,
                                        totalCost: taskRemaining,
                                        paymentType: "full",
                                        amountSar: taskRemaining,
                                        paymentDate: new Date()
                                          .toISOString()
                                          .split("T")[0],
                                      });
                                    }}
                                    className="flex items-center gap-1 bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                  >
                                    <Banknote className="w-3.5 h-3.5" /> سداد
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        "هل أنت متأكد من حذف هذه المهمة؟ ستفقد أي ارتباطات مالية بها!",
                                      )
                                    ) {
                                      deleteRemoteTaskMutation.mutate(rt.id);
                                    }
                                  }}
                                  className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="text-center py-10 text-gray-400 font-bold text-sm"
                        >
                          لا توجد مهام مسجلة حتى الآن
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === 7. PAYMENTS === */}
          {activeTab === "payments" && (
            <div className="p-4 space-y-4 animate-in fade-in">
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="text-gray-500 text-[11px] font-bold">
                    إجمالي الأتعاب
                  </div>
                  <div className="font-mono mt-1 text-xl font-black text-gray-800">
                    {totalFees.toLocaleString()}{" "}
                    <span className="text-[10px]">ر.س</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-green-200 bg-green-50 shadow-sm">
                  <div className="text-green-700 text-[11px] font-bold">
                    تم تحصيله
                  </div>
                  <div className="font-mono mt-1 text-xl font-black text-green-700">
                    {totalPaid.toLocaleString()}{" "}
                    <span className="text-[10px]">ر.س</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-red-200 bg-red-50 shadow-sm">
                  <div className="text-red-700 text-[11px] font-bold">
                    المتبقي على العميل
                  </div>
                  <div className="font-mono mt-1 text-xl font-black text-red-700">
                    {remaining.toLocaleString()}{" "}
                    <span className="text-[10px]">ر.س</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 shadow-sm">
                  <div className="text-blue-700 text-[11px] font-bold">
                    نسبة التحصيل
                  </div>
                  <div className="font-mono mt-1 text-xl font-black text-blue-700">
                    {collectionPercent}%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-6 mb-2">
                <span className="text-[14px] font-bold text-gray-800">
                  دفعات التحصيل (من العميل)
                </span>
                <button
                  onClick={() => setIsAddPaymentOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-bold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> إضافة دفعة
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[12px] text-right">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        التاريخ
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        المبلغ
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        طريقة الدفع
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        البنك/المرجع
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        إجراء
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.paymentsList?.length > 0 ? (
                      tx.paymentsList.map((p, i) => (
                        <tr
                          key={p.id}
                          className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                        >
                          <td className="px-3 py-3 font-mono text-gray-500">
                            {new Date(
                              p.date || p.createdAt,
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-3 font-mono font-bold text-green-600">
                            {safeNum(p.amount).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 font-bold text-gray-700">
                            {p.method}
                          </td>
                          <td className="px-3 py-3 font-mono text-gray-600">
                            {p.ref || "—"}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={() => {
                                if (window.confirm("حذف هذه الدفعة؟"))
                                  deletePaymentMutation.mutate(p.id);
                              }}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center py-8 text-gray-400 font-bold"
                        >
                          لا توجد دفعات محصلة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === 8. SETTLEMENT (التسويات المتقدمة) === */}
          {activeTab === "settlement" && (
            <div
              className="flex-1 overflow-y-auto custom-scrollbar-slim p-3 animate-in fade-in"
              style={{ minHeight: "0px" }}
            >
              <div className="space-y-2.5">
                {/* 1. Header Stats */}
                <div className="grid grid-cols-4 gap-1.5">
                  <div
                    className="p-2 rounded-md"
                    style={{ backgroundColor: "var(--wms-surface-2)" }}
                  >
                    <div className="text-gray-500" style={{ fontSize: "9px" }}>
                      السعر المتفق الإجمالي
                    </div>
                    <div
                      className="font-mono mt-0.5 text-gray-800"
                      style={{ fontSize: "14px", fontWeight: 700 }}
                    >
                      {totalFees.toLocaleString()}{" "}
                      <span style={{ fontSize: "9px", fontWeight: 400 }}>
                        ر.س
                      </span>
                    </div>
                  </div>
                  <div
                    className="p-2 rounded-md"
                    style={{ backgroundColor: "rgba(239, 68, 68, 0.06)" }}
                  >
                    <div className="text-gray-500" style={{ fontSize: "9px" }}>
                      إجمالي التكاليف
                    </div>
                    <div
                      className="font-mono mt-0.5 text-red-600"
                      style={{ fontSize: "14px", fontWeight: 700 }}
                    >
                      {totalCosts.toLocaleString()}{" "}
                      <span style={{ fontSize: "9px", fontWeight: 400 }}>
                        ر.س
                      </span>
                    </div>
                  </div>
                  <div
                    className="p-2 rounded-md"
                    style={{ backgroundColor: "rgba(34, 197, 94, 0.06)" }}
                  >
                    <div className="text-gray-500" style={{ fontSize: "9px" }}>
                      ربح تقديري
                    </div>
                    <div
                      className="font-mono mt-0.5 text-green-600"
                      style={{ fontSize: "14px", fontWeight: 700 }}
                    >
                      {estimatedProfit.toLocaleString()}{" "}
                      <span style={{ fontSize: "9px", fontWeight: 400 }}>
                        ر.س
                      </span>
                    </div>
                  </div>
                  <div
                    className="p-2 rounded-md"
                    style={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}
                  >
                    <div className="text-gray-500" style={{ fontSize: "9px" }}>
                      صافي قابل للتسوية
                    </div>
                    <div
                      className="font-mono mt-0.5 text-green-600"
                      style={{ fontSize: "16px", fontWeight: 700 }}
                    >
                      {distributableProfit.toLocaleString()}{" "}
                      <span style={{ fontSize: "9px", fontWeight: 400 }}>
                        ر.س
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Progress Bar */}
                <div
                  className="flex items-center gap-2 px-1"
                  style={{ fontSize: "10px" }}
                >
                  <span className="text-gray-500 font-bold">تقدم التسوية:</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all bg-amber-500"
                      style={{
                        width: `${totalCosts > 0 ? ((totalCosts - (tx.settlements?.filter((s) => s.status === "DELIVERED").reduce((a, b) => a + b.amount, 0) || 0)) / totalCosts) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span
                    className="font-mono text-amber-600"
                    style={{ fontSize: "10px", fontWeight: 600 }}
                  >
                    {(
                      tx.settlements
                        ?.filter((s) => s.status === "DELIVERED")
                        .reduce((a, b) => a + b.amount, 0) || 0
                    ).toLocaleString()}{" "}
                    / {totalCosts.toLocaleString()}
                  </span>
                </div>

                {/* 3. تسوية الوسطاء */}
                <div
                  className="rounded-lg border overflow-hidden"
                  style={{ borderColor: "rgba(8, 145, 178, 0.15)" }}
                >
                  <div
                    className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer select-none"
                    style={{
                      backgroundColor: "rgba(8, 145, 178, 0.04)",
                      borderBottom: openSections.brokers
                        ? "1px solid rgba(8, 145, 178, 0.15)"
                        : "none",
                    }}
                    onClick={() => toggleSection("brokers")}
                  >
                    <div className="flex items-center gap-1.5">
                      <Handshake className="w-3 h-3 text-cyan-600" />
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "rgb(8, 145, 178)",
                        }}
                      >
                        تسوية الوسطاء
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      {openSections.brokers ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                  {openSections.brokers && (
                    <div className="p-2.5">
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table
                          className="w-full text-right"
                          style={{ fontSize: "11px" }}
                        >
                          <thead>
                            <tr className="bg-gray-50 h-[28px]">
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              >
                                الوسيط
                              </th>
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              >
                                المبلغ
                              </th>
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              >
                                المدفوع
                              </th>
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              >
                                المتبقي
                              </th>
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              >
                                الحالة
                              </th>
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              ></th>
                            </tr>
                          </thead>
                          <tbody>
                            {tx.brokers?.length > 0 ? (
                              tx.brokers.map((b, i) => {
                                const cost = safeNum(b.fees);
                                const paid =
                                  tx.settlements
                                    ?.filter(
                                      (s) =>
                                        s.targetId === b.personId &&
                                        s.status === "DELIVERED",
                                    )
                                    .reduce((sum, s) => sum + s.amount, 0) || 0;
                                const remaining = Math.max(0, cost - paid);
                                const isFullyPaid = paid >= cost && cost > 0;
                                return (
                                  <tr
                                    key={i}
                                    className={`border-b border-gray-100 hover:bg-gray-50/50 ${i % 2 === 1 ? "bg-gray-50/30" : "bg-white"}`}
                                    style={{ height: "28px" }}
                                  >
                                    <td
                                      className="px-2 text-gray-700"
                                      style={{
                                        fontSize: "10px",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {b.name}
                                    </td>
                                    <td className="px-2 font-mono font-bold text-gray-800">
                                      {cost.toLocaleString()}
                                    </td>
                                    <td className="px-2 font-mono font-bold text-gray-800">
                                      {paid.toLocaleString()}
                                    </td>
                                    <td
                                      className={`px-2 font-mono font-bold ${remaining > 0 ? "text-red-500" : "text-green-500"}`}
                                    >
                                      {remaining.toLocaleString()}
                                    </td>
                                    <td className="px-2">
                                      <span
                                        style={{
                                          height: "18px",
                                          fontSize: "10px",
                                          borderRadius: "9px",
                                          padding: "0 5px",
                                          lineHeight: "18px",
                                          fontWeight: 600,
                                          display: "inline-flex",
                                          alignItems: "center",
                                          backgroundColor: isFullyPaid
                                            ? "rgba(34, 197, 94, 0.15)"
                                            : "rgba(245, 158, 11, 0.15)",
                                          color: isFullyPaid
                                            ? "var(--wms-success)"
                                            : "var(--wms-warning)",
                                        }}
                                      >
                                        {isFullyPaid
                                          ? "مُسوّى"
                                          : "قيد الانتظار"}
                                      </span>
                                    </td>
                                    <td className="px-2">
                                      <button
                                        className="text-blue-500 hover:underline"
                                        style={{ fontSize: "9px" }}
                                      >
                                        تفاصيل
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td
                                  colSpan="6"
                                  className="text-center py-3 text-gray-400 font-bold"
                                  style={{ fontSize: "10px" }}
                                >
                                  لا يوجد وسطاء
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                        <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-200 bg-gray-50">
                          <div className="flex items-center gap-1.5">
                            <button
                              className="px-2 py-0.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold transition-colors"
                              style={{ fontSize: "9px" }}
                            >
                              تسوية كاملة
                            </button>
                            <button
                              className="px-2 py-0.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold transition-colors"
                              style={{ fontSize: "9px" }}
                            >
                              سجل الدفعات
                            </button>
                          </div>
                          <span
                            className="text-gray-500 font-bold"
                            style={{ fontSize: "10px" }}
                          >
                            المدفوع:{" "}
                            <span
                              className="font-mono text-green-600"
                              style={{ fontWeight: 700 }}
                            >
                              {(
                                tx.settlements
                                  ?.filter(
                                    (s) =>
                                      s.targetType === "وسيط" &&
                                      s.status === "DELIVERED",
                                  )
                                  .reduce((a, b) => a + b.amount, 0) || 0
                              ).toLocaleString()}
                            </span>
                            <span className="mx-1">|</span>
                            المتبقي:{" "}
                            <span
                              className="font-mono text-red-500"
                              style={{ fontWeight: 700 }}
                            >
                              {Math.max(
                                0,
                                safeNum(tx.mediatorFees) -
                                  (tx.settlements
                                    ?.filter(
                                      (s) =>
                                        s.targetType === "وسيط" &&
                                        s.status === "DELIVERED",
                                    )
                                    .reduce((a, b) => a + b.amount, 0) || 0),
                              ).toLocaleString()}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. تسوية المعقبين */}
                <div
                  className="rounded-lg border overflow-hidden"
                  style={{ borderColor: "rgba(124, 58, 237, 0.15)" }}
                >
                  <div
                    className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer select-none"
                    style={{
                      backgroundColor: "rgba(124, 58, 237, 0.04)",
                      borderBottom: openSections.agents
                        ? "1px solid rgba(124, 58, 237, 0.15)"
                        : "none",
                    }}
                    onClick={() => toggleSection("agents")}
                  >
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-purple-600" />
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "rgb(124, 58, 237)",
                        }}
                      >
                        تسوية المعقبين
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      {openSections.agents ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                  {openSections.agents && (
                    <div className="p-2.5">
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table
                          className="w-full text-right"
                          style={{ fontSize: "11px" }}
                        >
                          <thead>
                            <tr className="bg-gray-50 h-[28px]">
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              >
                                المعقب
                              </th>
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              >
                                المبلغ
                              </th>
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              >
                                المدفوع
                              </th>
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              >
                                المتبقي
                              </th>
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              >
                                الحالة
                              </th>
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              ></th>
                            </tr>
                          </thead>
                          <tbody>
                            {tx.agents?.length > 0 ? (
                              tx.agents.map((ag, i) => {
                                const cost = safeNum(ag.fees);
                                const paid =
                                  tx.settlements
                                    ?.filter(
                                      (s) =>
                                        s.targetId === ag.id &&
                                        s.status === "DELIVERED",
                                    )
                                    .reduce((sum, s) => sum + s.amount, 0) || 0;
                                const remaining = Math.max(0, cost - paid);
                                const isFullyPaid = paid >= cost && cost > 0;
                                return (
                                  <tr
                                    key={i}
                                    className={`border-b border-gray-100 hover:bg-gray-50/50 ${i % 2 === 1 ? "bg-gray-50/30" : "bg-white"}`}
                                    style={{ height: "28px" }}
                                  >
                                    <td
                                      className="px-2 text-gray-700"
                                      style={{
                                        fontSize: "10px",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {ag.name}
                                    </td>
                                    <td className="px-2 font-mono font-bold text-gray-800">
                                      {cost.toLocaleString()}
                                    </td>
                                    <td className="px-2 font-mono font-bold text-gray-800">
                                      {paid.toLocaleString()}
                                    </td>
                                    <td
                                      className={`px-2 font-mono font-bold ${remaining > 0 ? "text-red-500" : "text-green-500"}`}
                                    >
                                      {remaining.toLocaleString()}
                                    </td>
                                    <td className="px-2">
                                      <span
                                        style={{
                                          height: "18px",
                                          fontSize: "10px",
                                          borderRadius: "9px",
                                          padding: "0 5px",
                                          lineHeight: "18px",
                                          fontWeight: 600,
                                          display: "inline-flex",
                                          alignItems: "center",
                                          backgroundColor: isFullyPaid
                                            ? "rgba(34, 197, 94, 0.15)"
                                            : "rgba(245, 158, 11, 0.15)",
                                          color: isFullyPaid
                                            ? "var(--wms-success)"
                                            : "var(--wms-warning)",
                                        }}
                                      >
                                        {isFullyPaid
                                          ? "مُسوّى"
                                          : "قيد الانتظار"}
                                      </span>
                                    </td>
                                    <td className="px-2">
                                      <button
                                        className="text-blue-500 hover:underline"
                                        style={{ fontSize: "9px" }}
                                      >
                                        تفاصيل
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td
                                  colSpan="6"
                                  className="text-center py-3 text-gray-400 font-bold"
                                  style={{ fontSize: "10px" }}
                                >
                                  لا يوجد معقبين
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                        <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-200 bg-gray-50">
                          <div className="flex items-center gap-1.5">
                            <button
                              className="px-2 py-0.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold transition-colors"
                              style={{ fontSize: "9px" }}
                            >
                              تسوية كاملة
                            </button>
                            <button
                              className="px-2 py-0.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold transition-colors"
                              style={{ fontSize: "9px" }}
                            >
                              إضافة ملاحظة
                            </button>
                          </div>
                          <span
                            className="text-gray-500 font-bold"
                            style={{ fontSize: "10px" }}
                          >
                            المدفوع:{" "}
                            <span
                              className="font-mono text-green-600"
                              style={{ fontWeight: 700 }}
                            >
                              {(
                                tx.settlements
                                  ?.filter(
                                    (s) =>
                                      s.targetType === "معقب" &&
                                      s.status === "DELIVERED",
                                  )
                                  .reduce((a, b) => a + b.amount, 0) || 0
                              ).toLocaleString()}
                            </span>
                            <span className="mx-1">|</span>
                            المتبقي:{" "}
                            <span
                              className="font-mono text-red-500"
                              style={{ fontWeight: 700 }}
                            >
                              {Math.max(
                                0,
                                safeNum(tx.agentCost) -
                                  (tx.settlements
                                    ?.filter(
                                      (s) =>
                                        s.targetType === "معقب" &&
                                        s.status === "DELIVERED",
                                    )
                                    .reduce((a, b) => a + b.amount, 0) || 0),
                              ).toLocaleString()}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. تسوية العمل عن بعد */}
                <div
                  className="rounded-lg border overflow-hidden"
                  style={{ borderColor: "rgba(5, 150, 105, 0.15)" }}
                >
                  <div
                    className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer select-none"
                    style={{
                      backgroundColor: "rgba(5, 150, 105, 0.04)",
                      borderBottom: openSections.remote
                        ? "1px solid rgba(5, 150, 105, 0.15)"
                        : "none",
                    }}
                    onClick={() => toggleSection("remote")}
                  >
                    <div className="flex items-center gap-1.5">
                      <Monitor className="w-3 h-3 text-emerald-600" />
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "rgb(5, 150, 105)",
                        }}
                      >
                        تسوية العمل عن بعد
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      {openSections.remote ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                  {openSections.remote && (
                    <div className="p-2.5">
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table
                          className="w-full text-right"
                          style={{ fontSize: "11px" }}
                        >
                          <thead>
                            <tr className="bg-gray-50 h-[28px]">
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              >
                                الموظف
                              </th>
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              >
                                المبلغ
                              </th>
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              >
                                المدفوع
                              </th>
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              >
                                المتبقي
                              </th>
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              >
                                الحالة
                              </th>
                              <th
                                className="px-2 text-gray-500"
                                style={{ fontWeight: 600, fontSize: "10px" }}
                              ></th>
                            </tr>
                          </thead>
                          <tbody>
                            {tx.remoteTasks?.length > 0 ? (
                              tx.remoteTasks.map((rt, i) => {
                                const cost = safeNum(rt.cost);
                                const paid = rt.isPaid
                                  ? cost
                                  : safeNum(rt.paidAmount);
                                const remaining = Math.max(0, cost - paid);
                                const isFullyPaid = paid >= cost && cost > 0;
                                return (
                                  <tr
                                    key={i}
                                    className={`border-b border-gray-100 hover:bg-gray-50/50 ${i % 2 === 1 ? "bg-gray-50/30" : "bg-white"}`}
                                    style={{ height: "28px" }}
                                  >
                                    <td
                                      className="px-2 text-gray-700"
                                      style={{
                                        fontSize: "10px",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {rt.workerName}
                                    </td>
                                    <td className="px-2 font-mono font-bold text-gray-800">
                                      {cost.toLocaleString()}
                                    </td>
                                    <td className="px-2 font-mono font-bold text-gray-800">
                                      {paid.toLocaleString()}
                                    </td>
                                    <td
                                      className={`px-2 font-mono font-bold ${remaining > 0 ? "text-red-500" : "text-green-500"}`}
                                    >
                                      {remaining.toLocaleString()}
                                    </td>
                                    <td className="px-2">
                                      <span
                                        style={{
                                          height: "18px",
                                          fontSize: "10px",
                                          borderRadius: "9px",
                                          padding: "0 5px",
                                          lineHeight: "18px",
                                          fontWeight: 600,
                                          display: "inline-flex",
                                          alignItems: "center",
                                          backgroundColor: isFullyPaid
                                            ? "rgba(34, 197, 94, 0.15)"
                                            : "rgba(127, 147, 186, 0.15)",
                                          color: isFullyPaid
                                            ? "var(--wms-success)"
                                            : "var(--wms-text-muted)",
                                        }}
                                      >
                                        {isFullyPaid
                                          ? "مُسوّى"
                                          : "قيد الانتظار"}
                                      </span>
                                    </td>
                                    <td className="px-2">
                                      <button
                                        className="text-blue-500 hover:underline"
                                        style={{ fontSize: "9px" }}
                                      >
                                        تفاصيل
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td
                                  colSpan="6"
                                  className="text-center py-3 text-gray-400 font-bold"
                                  style={{ fontSize: "10px" }}
                                >
                                  لا توجد مهام مسجلة
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                        <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-200 bg-gray-50">
                          <div className="flex items-center gap-1.5">
                            <button
                              className="px-2 py-0.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold transition-colors"
                              style={{ fontSize: "9px" }}
                            >
                              تعديل التكلفة
                            </button>
                            <button
                              className="px-2 py-0.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold transition-colors"
                              style={{ fontSize: "9px" }}
                            >
                              إضافة ملاحظة
                            </button>
                          </div>
                          <span
                            className="text-gray-500 font-bold"
                            style={{ fontSize: "10px" }}
                          >
                            المدفوع:{" "}
                            <span
                              className="font-mono text-green-600"
                              style={{ fontWeight: 700 }}
                            >
                              {(
                                tx.remoteTasks
                                  ?.filter((t) => t.isPaid)
                                  .reduce((a, b) => a + b.cost, 0) || 0
                              ).toLocaleString()}
                            </span>
                            <span className="mx-1">|</span>
                            المتبقي:{" "}
                            <span
                              className="font-mono text-red-500"
                              style={{ fontWeight: 700 }}
                            >
                              {Math.max(
                                0,
                                safeNum(tx.remoteCost) -
                                  (tx.remoteTasks
                                    ?.filter((t) => t.isPaid)
                                    .reduce((a, b) => a + b.cost, 0) || 0),
                              ).toLocaleString()}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Footer Button */}
                <div
                  className="p-3 rounded-lg border flex items-center justify-between mt-4 shadow-sm"
                  style={{
                    backgroundColor: "rgba(34, 197, 94, 0.08)",
                    borderColor: "rgba(34, 197, 94, 0.25)",
                  }}
                >
                  <div>
                    <div
                      className="text-gray-500 font-bold"
                      style={{ fontSize: "10px" }}
                    >
                      صافي قابل للتسوية
                    </div>
                    <div
                      className="font-mono text-green-600"
                      style={{ fontSize: "20px", fontWeight: 700 }}
                    >
                      {distributableProfit.toLocaleString()}{" "}
                      <span style={{ fontSize: "11px", fontWeight: 400 }}>
                        ر.س
                      </span>
                    </div>
                    <div
                      className="text-gray-500 font-bold"
                      style={{ fontSize: "9px" }}
                    >
                      المتبقي من التسويات:{" "}
                      <span
                        className="font-mono text-red-500"
                        style={{ fontWeight: 600 }}
                      >
                        {Math.max(
                          0,
                          totalCosts -
                            (tx.settlements
                              ?.filter((s) => s.status === "DELIVERED")
                              .reduce((a, b) => a + b.amount, 0) || 0),
                        ).toLocaleString()}{" "}
                        ر.س
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "هل أنت متأكد من اعتماد التسوية الشاملة؟ سيتم إغلاق التعديلات المالية لهذه المعاملة.",
                        )
                      ) {
                        finalizeSettlementMutation.mutate();
                      }
                    }}
                    disabled={finalizeSettlementMutation.isPending}
                    className="px-4 py-2.5 rounded-lg bg-green-600 text-white cursor-pointer hover:bg-green-700 flex items-center gap-1.5 shadow-md transition-colors disabled:opacity-50"
                    style={{ fontSize: "12px", fontWeight: 600 }}
                  >
                    {finalizeSettlementMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>تنفيذ التسوية الشاملة</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === 9. PROFITS === */}
          {activeTab === "profits" && (
            <div className="p-4 space-y-4 animate-in fade-in">
              {!isSettlementComplete && (
                <div
                  className="flex items-center gap-2 p-2.5 rounded-lg border"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.06)",
                    borderColor: "rgba(239, 68, 68, 0.2)",
                  }}
                >
                  <TriangleAlert className="w-5 h-5 shrink-0 text-red-500" />
                  <div className="flex-1">
                    <span
                      className="text-red-600 block"
                      style={{ fontSize: "12px", fontWeight: 700 }}
                    >
                      التسوية غير مكتملة
                    </span>
                    <span
                      className="text-gray-500 block"
                      style={{ fontSize: "11px" }}
                    >
                      لا يمكن توزيع الأرباح فعلياً قبل إتمام تسوية جميع التكاليف
                      التشغيلية. (الأرقام أدناه استرشادية).
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab("settlement")}
                    className="px-3 py-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    الذهاب للتسوية
                  </button>
                </div>
              )}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-gray-800 text-[14px]">
                    توزيع الأرباح النهائي والتصفيات
                  </span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> النظام الآلي مُفعل
                  </span>
                </div>
                <table className="w-full text-[12px] text-right border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="p-3 font-bold text-gray-700">
                        البند / الشريك
                      </th>
                      <th className="p-3 font-bold text-gray-700">
                        النسبة / القاعدة
                      </th>
                      <th className="p-3 font-bold text-gray-700">
                        المستحق (ر.س)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 💡 صف حصة المكتب الديناميكية */}
                    <tr className="border-b bg-blue-50/40">
                      <td className="p-3 font-bold text-blue-800 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> حصة المكتب (اقتطاع
                        آلي)
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-600">
                        {officeShareLabel}{" "}
                        {/* 👈 سيطبع هنا 10% أو 15% أو مبلغ ثابت حسب الشريحة */}
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-800">
                        {officeShareAmount.toLocaleString()}
                      </td>
                    </tr>

                    <tr className="border-b bg-purple-50/30">
                      <td className="p-3 font-bold text-purple-700 flex items-center gap-2">
                        <Crown className="w-4 h-4" /> المصدر:{" "}
                        {safeText(tx.sourceName || tx.source)}
                      </td>
                      <td className="p-3 font-mono font-bold text-purple-600">
                        {sourcePercent}%{" "}
                        <span className="text-[9px] text-gray-400 font-sans">
                          (من المتبقي)
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-purple-800">
                        {sourceShare.toLocaleString()}
                      </td>
                    </tr>

                    {/* 💡 صفوف الشركاء */}
                    {partnersDistribution.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                      >
                        <td className="p-3 font-bold text-gray-800">
                          {p.name}
                        </td>
                        <td className="p-3 font-mono font-bold text-green-600">
                          {p.percent}%
                        </td>
                        <td className="p-3 font-mono font-bold text-gray-800">
                          {p.finalAmount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === 10. COLLECTION DATES (مواعيد التحصيل + العدادات) === */}
          {activeTab === "dates" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-6 rounded-2xl border border-purple-200 shadow-sm">
                <h3 className="text-sm font-black text-purple-800 mb-5 border-b border-purple-100 pb-3">
                  إضافة موعد أو خطة تحصيل
                </h3>
                <div className="grid grid-cols-2 gap-6 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      طريقة الاستحقاق
                    </label>
                    <div className="flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                      <button
                        onClick={() =>
                          setDateForm({ ...dateForm, type: "specific_date" })
                        }
                        className={`flex-1 py-2 text-xs font-bold rounded-md ${dateForm.type === "specific_date" ? "bg-purple-600 text-white" : "text-gray-500"}`}
                      >
                        تاريخ محدد
                      </button>
                      <button
                        onClick={() =>
                          setDateForm({ ...dateForm, type: "upon_approval" })
                        }
                        className={`flex-1 py-2 text-xs font-bold rounded-md ${dateForm.type === "upon_approval" ? "bg-purple-600 text-white" : "text-gray-500"}`}
                      >
                        عند الاعتماد
                      </button>
                    </div>
                  </div>
                  {dateForm.type === "specific_date" && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        التاريخ المتوقع
                      </label>
                      <input
                        type="date"
                        value={dateForm.date}
                        onChange={(e) =>
                          setDateForm({ ...dateForm, date: e.target.value })
                        }
                        className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-purple-500"
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      المبلغ المستهدف
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={dateForm.amountType}
                        onChange={(e) =>
                          setDateForm({
                            ...dateForm,
                            amountType: e.target.value,
                          })
                        }
                        className="border border-gray-300 rounded-lg p-2.5 text-xs bg-gray-50 w-24 outline-none"
                      >
                        <option value="full">الكل</option>
                        <option value="partial">جزء</option>
                      </select>
                      <input
                        type="number"
                        disabled={dateForm.amountType === "full"}
                        value={
                          dateForm.amountType === "full"
                            ? remaining
                            : dateForm.amount
                        }
                        onChange={(e) =>
                          setDateForm({ ...dateForm, amount: e.target.value })
                        }
                        className="flex-1 border border-gray-300 p-2.5 rounded-lg text-sm font-mono outline-none focus:border-purple-500 disabled:bg-gray-100"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      ملاحظات / المسؤول
                    </label>
                    <input
                      type="text"
                      value={dateForm.notes}
                      onChange={(e) =>
                        setDateForm({ ...dateForm, notes: e.target.value })
                      }
                      className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-purple-500"
                      placeholder="مثال: التواصل مع العميل أبو محمد..."
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => addDateMutation.mutate(dateForm)}
                    disabled={addDateMutation.isPending}
                    className="px-8 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-purple-700"
                  >
                    إضافة للخطة
                  </button>
                </div>
              </div>
              {/* عرض المواعيد مع العدادات */}
              <div className="space-y-3 mt-6">
                {tx.collectionDates?.map((d, i) => {
                  const days = calculateDays(
                    d.date,
                    d.type === "upon_approval",
                  );
                  const isLate = d.type === "specific_date" && days < 0;
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${isLate || (d.type === "upon_approval" && days > 0) ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}
                    >
                      <div>
                        <div className="font-bold text-gray-800 text-sm mb-1">
                          {d.notes || "متابعة تحصيل"}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {d.type === "upon_approval"
                            ? "تستحق عند الاعتماد"
                            : new Date(d.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="font-mono font-black text-lg text-purple-700">
                        {safeNum(d.amount).toLocaleString()} ر.س
                      </div>

                      {/* العداد الذكي */}
                      {d.type === "specific_date" && (
                        <div
                          className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 ${isLate ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}
                        >
                          <Timer className="w-4 h-4" />
                          {isLate
                            ? `متأخر ${Math.abs(days)} يوم`
                            : `متبقي ${days} يوم`}
                        </div>
                      )}

                      {/* 💡 عداد "عند الاعتماد" المنطقي */}
                      {d.type === "upon_approval" && (
                        <div
                          className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 ${days !== null ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          <Timer className="w-4 h-4" />
                          {days !== null
                            ? `متأخرة! مرت ${days} أيام على الاعتماد`
                            : "بانتظار الاعتماد..."}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === 11. ATTACHMENTS === */}
          {activeTab === "attachments" && (
            <div className="p-5 space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-black text-gray-800">
                  مرفقات ومستندات المعاملة
                </span>
                <label className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95">
                  {uploadAttachmentMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>رفع مرفق جديد</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files[0])
                        uploadAttachmentMutation.mutate(e.target.files[0]);
                    }}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-5">
                {(tx.attachments || []).map((file, idx) => {
                  // 💡 معالجة الاسم العربي بشكل آمن تماماً
                  let safeName = file?.name || `مرفق ${idx + 1}`;
                  try {
                    safeName = decodeURIComponent(safeName);
                  } catch (e) {}

                  // 💡 استخراج المسار بأمان (بدون استخدام startsWith لتجنب الأخطاء)
                  // 💡 دمج الرابط الأساسي مع مسار الملف لتتمكن الواجهة من قراءته
                  const safeUrl = file?.url
                    ? file.url.startsWith("http")
                      ? file.url
                      : `${backendUrl}${file.url}`
                    : "";

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-400 hover:shadow-md transition-all group"
                    >
                      <div
                        className="flex items-center gap-4 cursor-pointer flex-1"
                        onClick={() => {
                          if (safeUrl) {
                            setPreviewFile({ url: safeUrl, name: safeName });
                          } else {
                            toast.error("لا يوجد مسار صالح لهذا المستند");
                          }
                        }}
                      >
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                          <Paperclip className="w-5 h-5 text-blue-500 group-hover:text-white" />
                        </div>
                        <span
                          className="text-[13px] font-bold text-gray-800 truncate w-48"
                          dir="rtl"
                        >
                          {safeName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                          onClick={() => {
                            if (safeUrl)
                              setPreviewFile({ url: safeUrl, name: safeName });
                          }}
                        >
                          معاينة
                        </span>

                        {/* 💡 زر الحذف الجديد */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                `هل أنت متأكد من حذف الملف "${safeName}"؟`,
                              )
                            ) {
                              deleteAttachmentMutation.mutate(file.url); // سنقوم ببرمجة هذا الـ Mutation حالاً
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف المستند"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {(!tx.attachments || tx.attachments.length === 0) && (
                  <div className="col-span-2 text-center py-16 text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                    لا توجد مرفقات مسجلة في هذه المعاملة
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================== */}
      {/* 💡 Sub-Modals (نوافذ منبثقة فرعية إضافية) */}
      {/* ========================================================== */}

      {/* إضافة دفعة تحصيل */}
      {isAddPaymentOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
              <span className="font-bold flex items-center gap-2">
                <Banknote className="w-4 h-4 text-green-400" /> إضافة دفعة تحصيل
              </span>
              <button onClick={() => setIsAddPaymentOpen(false)}>
                <X className="w-4 h-4 hover:text-red-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600">
                  المبلغ المحصل *
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                  className="w-full border p-2 mt-1 rounded text-lg font-mono font-bold text-green-700 focus:border-green-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, date: e.target.value })
                    }
                    className="w-full border p-2 mt-1 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">
                    طريقة الدفع
                  </label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, method: e.target.value })
                    }
                    className="w-full border p-2 mt-1 rounded text-sm"
                  >
                    <option>تحويل بنكي</option>
                    <option>نقدي</option>
                    <option>شيك</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">
                  المرجع / رقم الحوالة
                </label>
                <input
                  value={paymentForm.ref}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, ref: e.target.value })
                  }
                  className="w-full border p-2 mt-1 rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">
                  ملاحظات
                </label>
                <input
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
                  className="w-full border p-2 mt-1 rounded text-sm"
                />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setIsAddPaymentOpen(false)}
                className="px-4 py-1.5 border rounded bg-white text-sm font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => addPaymentMutation.mutate(paymentForm)}
                disabled={addPaymentMutation.isPending || !paymentForm.amount}
                className="px-4 py-1.5 bg-green-600 text-white rounded text-sm font-bold disabled:opacity-50"
              >
                حفظ الدفعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* إضافة معقب */}
      {isAddAgentOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
              <span className="font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" /> تعيين معقب
              </span>
              <button onClick={() => setIsAddAgentOpen(false)}>
                <X className="w-4 h-4 hover:text-red-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600">
                  اسم المعقب *
                </label>
                <select
                  value={agentForm.agentId}
                  onChange={(e) =>
                    setAgentForm({ ...agentForm, agentId: e.target.value })
                  }
                  className="w-full border p-2 mt-1 rounded text-sm font-bold"
                >
                  <option value="">-- اختر معقب --</option>
                  {agentsList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600">
                    الدور/المهمة
                  </label>
                  <input
                    value={agentForm.role}
                    onChange={(e) =>
                      setAgentForm({ ...agentForm, role: e.target.value })
                    }
                    className="w-full border p-2 mt-1 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">
                    الأتعاب (ر.س) *
                  </label>
                  <input
                    type="number"
                    value={agentForm.fees}
                    onChange={(e) =>
                      setAgentForm({ ...agentForm, fees: e.target.value })
                    }
                    className="w-full border p-2 mt-1 rounded font-mono text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setIsAddAgentOpen(false)}
                className="px-4 py-1.5 border rounded bg-white text-sm font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => addAgentMutation.mutate(agentForm)}
                disabled={
                  addAgentMutation.isPending ||
                  !agentForm.agentId ||
                  !agentForm.fees
                }
                className="px-4 py-1.5 bg-purple-600 text-white rounded text-sm font-bold disabled:opacity-50"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* إضافة وسيط */}
      {isAddBrokerModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
              <span className="font-bold flex items-center gap-2">
                <Handshake className="w-4 h-4 text-blue-400" /> تعيين وسيط
              </span>
              <button onClick={() => setIsAddBrokerModalOpen(false)}>
                <X className="w-4 h-4 hover:text-red-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                  اختر الوسيط *
                </label>
                <select
                  value={brokerForm.brokerId}
                  onChange={(e) =>
                    setBrokerForm({ ...brokerForm, brokerId: e.target.value })
                  }
                  className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold focus:border-blue-500 outline-none"
                >
                  <option value="">-- اختر الوسيط --</option>
                  {brokersList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                  أتعاب الوسيط (ر.س) *
                </label>
                <input
                  type="number"
                  value={brokerForm.fees}
                  onChange={(e) =>
                    setBrokerForm({ ...brokerForm, fees: e.target.value })
                  }
                  className="w-full border border-gray-300 p-2.5 rounded-lg font-mono text-lg font-bold text-blue-700 focus:border-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setIsAddBrokerModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-bold text-gray-700"
              >
                إلغاء
              </button>
              <button
                onClick={() => addBrokerMutation.mutate(brokerForm)}
                disabled={
                  addBrokerMutation.isPending ||
                  !brokerForm.brokerId ||
                  !brokerForm.fees
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50"
              >
                حفظ الوسيط
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💡 إضافة مهمة عمل عن بعد (بمحول العملات الثلاثي) */}
      {isAddRemoteTaskOpen && (
        <div className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-800 p-5 flex justify-between items-center text-white">
              <span className="font-bold flex items-center gap-2">
                <Monitor className="w-5 h-5 text-emerald-400" /> تعيين مهمة ودفع
                لموظف عن بعد
              </span>
              <button onClick={() => setIsAddRemoteTaskOpen(false)}>
                <X className="w-5 h-5 hover:text-red-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">
                  الموظف المستهدف *
                </label>
                <select
                  value={remoteTaskForm.workerId}
                  onChange={(e) =>
                    setRemoteTaskForm({
                      ...remoteTaskForm,
                      workerId: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold bg-gray-50 outline-none focus:border-emerald-500"
                >
                  <option value="">-- اختر موظف عن بعد --</option>
                  {remoteWorkersList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">
                  وصف المهمة
                </label>
                <input
                  type="text"
                  value={remoteTaskForm.taskName}
                  onChange={(e) =>
                    setRemoteTaskForm({
                      ...remoteTaskForm,
                      taskName: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm outline-none focus:border-emerald-500"
                  placeholder="مثال: رسم معماري"
                />
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <label className="text-xs font-black text-emerald-800 block mb-3">
                  تكلفة المهمة (إدخال متعدد العملات)
                </label>
                <TripleCurrencyInput
                  valueSar={remoteTaskForm.costSar}
                  onChangeSar={(v) =>
                    setRemoteTaskForm({ ...remoteTaskForm, costSar: v })
                  }
                  rates={exchangeRates}
                />
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={remoteTaskForm.isPaid}
                    onChange={(e) =>
                      setRemoteTaskForm({
                        ...remoteTaskForm,
                        isPaid: e.target.checked,
                      })
                    }
                    className="accent-emerald-600 w-4 h-4"
                  />
                  <span className="font-bold text-sm text-gray-800">
                    تم دفع جزء أو كل المبلغ للموظف الآن
                  </span>
                </label>

                {remoteTaskForm.isPaid && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1">
                        المبلغ المدفوع الفعلي
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={remoteTaskForm.paymentAmount}
                          onChange={(e) =>
                            setRemoteTaskForm({
                              ...remoteTaskForm,
                              paymentAmount: e.target.value,
                            })
                          }
                          className="w-full border p-2 rounded-lg text-sm font-mono outline-none focus:border-emerald-500"
                        />
                        <select
                          value={remoteTaskForm.paymentCurrency}
                          onChange={(e) =>
                            setRemoteTaskForm({
                              ...remoteTaskForm,
                              paymentCurrency: e.target.value,
                            })
                          }
                          className="border p-2 rounded-lg text-xs font-bold bg-white"
                        >
                          <option>SAR</option>
                          <option>EGP</option>
                          <option>USD</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1">
                        تاريخ الدفع
                      </label>
                      <input
                        type="date"
                        value={remoteTaskForm.paymentDate}
                        onChange={(e) =>
                          setRemoteTaskForm({
                            ...remoteTaskForm,
                            paymentDate: e.target.value,
                          })
                        }
                        className="w-full border p-2 rounded-lg text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsAddRemoteTaskOpen(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-xl bg-white text-sm font-bold text-gray-700"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  // 1. التحقق من الحقول الإجبارية
                  if (!remoteTaskForm.workerId || !remoteTaskForm.costSar) {
                    return toast.error(
                      "يرجى تحديد الموظف وإدخال تكلفة المهمة (SAR)",
                    );
                  }

                  // 2. 💡 تجميع البيانات بالشكل الذي يطلبه الباك إند تماماً (مصفوفة Tasks)
                  const payload = {
                    transactionId: tx?.id,
                    workerId: remoteTaskForm.workerId,
                    isPaid: remoteTaskForm.isPaid,
                    paymentAmount: remoteTaskForm.paymentAmount,
                    paymentCurrency: remoteTaskForm.paymentCurrency,
                    paymentDate: remoteTaskForm.paymentDate,
                    tasks: [
                      {
                        name: remoteTaskForm.taskName || "مهمة هندسية / رسم",
                        cost: remoteTaskForm.costSar,
                      },
                    ],
                  };

                  // 3. إرسال الطلب
                  addRemoteTaskMutation.mutate(payload);
                }}
                disabled={
                  addRemoteTaskMutation.isPending || !remoteTaskForm.workerId
                }
                className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {addRemoteTaskMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "حفظ المهمة"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 💡 Sub-Modal: تسديد أتعاب (موظف عن بعد، وسيط، معقب) - دفع مالي مباشر */}
      {payPersonData && (
        <div
          className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
          onClick={(e) => {
            e.stopPropagation();
            setPayPersonData(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-emerald-700 p-5 flex justify-between items-center text-white">
              <div>
                <span className="font-bold flex items-center gap-2 text-[15px]">
                  <Banknote className="w-5 h-5 text-emerald-200" /> تسديد
                  مستحقات ({payPersonData.targetType})
                </span>
                <span className="text-[11px] text-emerald-200 mt-1 block">
                  الاسم: {payPersonData.workerName} | التفاصيل:{" "}
                  {payPersonData.taskName}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPayPersonData(null);
                }}
                className="p-1 rounded-md hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-3">
                  مقدار الدفعة
                </label>
                <div className="flex gap-2 p-1 bg-gray-50 border border-gray-200 rounded-lg">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPayPersonData({
                        ...payPersonData,
                        paymentType: "full",
                        amountSar: payPersonData.totalCost,
                      });
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${payPersonData.paymentType === "full" ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-200"}`}
                  >
                    كامل المتبقي ({payPersonData.totalCost} ر.س)
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPayPersonData({
                        ...payPersonData,
                        paymentType: "partial",
                        amountSar: "",
                      });
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${payPersonData.paymentType === "partial" ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-200"}`}
                  >
                    جزء من المبلغ
                  </button>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <label className="text-xs font-black text-emerald-800 block mb-3">
                  المبلغ الفعلي المدفوع (اكتب بأي عملة)
                </label>
                <TripleCurrencyInput
                  valueSar={payPersonData.amountSar}
                  onChangeSar={(v) =>
                    setPayPersonData({ ...payPersonData, amountSar: v })
                  }
                  rates={exchangeRates}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">
                  تاريخ الدفع
                </label>
                <input
                  type="date"
                  value={payPersonData.paymentDate}
                  onChange={(e) =>
                    setPayPersonData({
                      ...payPersonData,
                      paymentDate: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold outline-none focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPayPersonData(null);
                }}
                className="px-6 py-2.5 border border-gray-300 rounded-xl bg-white text-sm font-bold text-gray-700 hover:bg-gray-100"
              >
                إلغاء
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!payPersonData.amountSar)
                    return toast.error("الرجاء إدخال المبلغ");

                  const payload = {
                    targetType: payPersonData.targetType,
                    targetId:
                      payPersonData.targetId ||
                      remoteWorkersList.find(
                        (w) => w.name === payPersonData.workerName,
                      )?.id,
                    transactionId: tx.id,
                    amount: parseFloat(payPersonData.amountSar),
                    status: "DELIVERED",
                    source: "سداد مباشر من المعاملة",
                    notes: `تاريخ الدفع: ${payPersonData.paymentDate} | نوع السداد: ${payPersonData.paymentType === "full" ? "سداد كلي للمتبقي" : "سداد جزئي"}`,
                  };

                  payPersonMutation.mutate(payload);

                  if (
                    payPersonData.targetType === "موظف عن بعد" &&
                    payPersonData.taskId
                  ) {
                    payRemoteTaskMutation.mutate({
                      taskId: payPersonData.taskId,
                      workerId: payload.targetId,
                      transactionId: tx.id,
                      amountSar: payload.amount,
                      paymentDate: payPersonData.paymentDate,
                      isFullPayment: payPersonData.paymentType === "full",
                    });
                  }
                }}
                disabled={
                  payPersonMutation.isPending || payRemoteTaskMutation.isPending
                }
                className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {payPersonMutation.isPending ||
                payRemoteTaskMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Banknote className="w-4 h-4" />
                )}
                تأكيد الدفع
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================== */}
      {/* 💡 Sub-Modal: تسديد أتعاب مهمة العمل عن بعد (الدفع المباشر) */}
      {/* ========================================================== */}
      {payTaskData && (
        <div
          className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
          onClick={(e) => {
            e.stopPropagation();
            setPayTaskData(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-emerald-700 p-5 flex justify-between items-center text-white">
              <div>
                <span className="font-bold flex items-center gap-2 text-[15px]">
                  <Banknote className="w-5 h-5 text-emerald-200" /> تسديد أتعاب
                  موظف
                </span>
                <span className="text-[11px] text-emerald-200 mt-1 block">
                  الموظف: {payTaskData.workerName} | المهمة:{" "}
                  {payTaskData.taskName}
                </span>
              </div>
              <button
                onClick={() => setPayTaskData(null)}
                className="p-1 rounded-md hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* خيارات الدفع */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-3">
                  مقدار الدفعة
                </label>
                <div className="flex gap-2 p-1 bg-gray-50 border border-gray-200 rounded-lg">
                  <button
                    onClick={() =>
                      setPayTaskData({
                        ...payTaskData,
                        paymentType: "full",
                        amountSar: payTaskData.totalCost,
                      })
                    }
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${payTaskData.paymentType === "full" ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-200"}`}
                  >
                    كامل المبلغ ({payTaskData.totalCost} ر.س)
                  </button>
                  <button
                    onClick={() =>
                      setPayTaskData({
                        ...payTaskData,
                        paymentType: "partial",
                        amountSar: "",
                      })
                    }
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${payTaskData.paymentType === "partial" ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-200"}`}
                  >
                    جزء من المبلغ
                  </button>
                </div>
              </div>

              {/* محول العملات الثلاثي */}
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <label className="text-xs font-black text-emerald-800 block mb-3">
                  المبلغ الفعلي المدفوع (اكتب بأي عملة)
                </label>
                <TripleCurrencyInput
                  valueSar={payTaskData.amountSar}
                  onChangeSar={(v) =>
                    setPayTaskData({ ...payTaskData, amountSar: v })
                  }
                  rates={exchangeRates}
                />
              </div>

              {/* التاريخ */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">
                  تاريخ الدفع
                </label>
                <input
                  type="date"
                  value={payTaskData.paymentDate}
                  onChange={(e) =>
                    setPayTaskData({
                      ...payTaskData,
                      paymentDate: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold outline-none focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setPayTaskData(null)}
                className="px-6 py-2.5 border border-gray-300 rounded-xl bg-white text-sm font-bold text-gray-700 hover:bg-gray-100"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (!payTaskData.amountSar)
                    return toast.error("الرجاء إدخال المبلغ");

                  // تجميع الـ Payload لإرساله للباك إند
                  const payload = {
                    taskId: payTaskData.taskId,
                    workerId: remoteWorkersList.find(
                      (w) => w.name === payTaskData.workerName,
                    )?.id, // استخراج ID الموظف
                    transactionId: tx.id,
                    amountSar: parseFloat(payTaskData.amountSar),
                    paymentDate: payTaskData.paymentDate,
                    isFullPayment: payTaskData.paymentType === "full",
                  };

                  payRemoteTaskMutation.mutate(payload);
                }}
                disabled={payRemoteTaskMutation.isPending}
                className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {payRemoteTaskMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Banknote className="w-4 h-4" />
                )}
                تأكيد الدفع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
