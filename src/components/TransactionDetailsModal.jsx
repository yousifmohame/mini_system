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
  Upload,
  FileBox,
  Clock,
  EyeOff,
  Building2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

const parseNumber = (val) => {
  if (!val) return 0;
  return Number(val.toString().replace(/,/g, ""));
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

  const { user } = useAuth();
  const currentUser = user?.name || "موظف النظام";

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

  const { data: allCoopFees = [] } = useQuery({
    queryKey: ["coop-office-fees"],
    queryFn: async () => (await api.get("/coop-office-fees")).data?.data || [],
    enabled: isOpen,
  });

  // تجهيز قوائم البحث الذكية
  const clientsOptions = useMemo(
    () => clients.map((c) => ({ label: c.name?.ar || c.name, value: c.id })),
    [clients],
  );

  const txCoopFees = useMemo(() => {
    return allCoopFees.filter((fee) => fee.transactionId === tx?.id);
  }, [allCoopFees, tx?.id]);

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

  // فورم المصروفات التشغيلية (جديد)
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  // فورم الحالة وملاحظات الجهات
  const [statusForm, setStatusForm] = useState({
    currentStatus: "عند المهندس للدراسة",
    serviceNumber: "",
    hijriYear1: "",
    licenseNumber: "",
    hijriYear2: "",
    oldLicenseNumber: "",
    newAuthorityNote: "",
    noteAttachment: null,
    // 👈 جديد: لدعم رفع المرفقات المتعددة عند الاعتماد
    approvalAttachments: [],
  });

  // فورم رفع المرفقات (جديد)
  const [uploadData, setUploadData] = useState({
    file: null,
    description: "",
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

  // 💡 تحديث الحالة والملاحظات (مع إصلاح رفع مرفقات الاعتماد المتعددة)
  const updateStatusMutation = useMutation({
    mutationFn: async (data) => {
      const fd = new FormData();

      // 1. إضافة الحقول النصية العادية
      Object.keys(data).forEach((k) => {
        if (
          k !== "noteAttachment" &&
          k !== "approvalAttachments" &&
          data[k] !== null &&
          data[k] !== undefined
        ) {
          fd.append(k, data[k]);
        }
      });

      // 2. مرفق ملاحظة الجهات (إن وجد)
      if (data.noteAttachment) {
        fd.append("file", data.noteAttachment);
      }

      // 3. 💡 مرفقات الاعتماد المتعددة (هنا يكمن الحل)
      if (data.approvalAttachments && data.approvalAttachments.length > 0) {
        data.approvalAttachments.forEach((att, index) => {
          if (att.file) {
            // نرفق كل ملف على حدة بنفس المفتاح
            fd.append("approvalFiles", att.file);
            // نرفق الاسم المرادف له بنفس المفتاح
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
        approvalAttachments: [], // تصفير قائمة الرفع بعد النجاح
      });
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
    onError: () => toast.error("حدث خطأ أثناء التحديث"),
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
        collectedBy: currentUser, // 👈 توثيق المحصل
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

  // 💡 تسجيل مصروف تشغيلي
  const addExpenseMutation = useMutation({
    mutationFn: async (data) =>
      api.post(`/private-transactions/${tx?.id}/expenses`, {
        ...data,
        addedBy: currentUser,
      }),
    onSuccess: () => {
      toast.success("تم تسجيل المصروف التشغيلي بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      // تصفير الفورم بعد النجاح
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
      fd.append("uploadedBy", currentUser); // 👈 توثيق الرافع

      return api.post(`/private-transactions/${tx?.id}/attachments`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("تم رفع المرفق بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setUploadData({ file: null, description: "" });
    },
    onError: () => toast.error("حدث خطأ أثناء رفع المرفق"),
  });

  // 💡 Mutation حذف مرفق معين من المعاملة بشكل دقيق
  const deleteAttachmentMutation = useMutation({
    mutationFn: async (fileUrlToRemove) => {
      // 1. قراءة المرفقات من الـ notes فقط (لأننا نحفظ المرفقات الجديدة هناك)
      const currentAttachments = tx.notes?.attachments || [];

      // 2. فلترة المرفقات واستبعاد الملف الذي نريد حذفه
      const updatedAttachments = currentAttachments.filter(
        (att) => att.url !== fileUrlToRemove,
      );

      // 3. إرسالها للباك إند مع الاحتفاظ بباقي الـ notes
      return api.put(`/private-transactions/${tx.id}`, {
        notes: { ...tx.notes, attachments: updatedAttachments },
      });
    },
    onSuccess: () => {
      toast.success("تم حذف المرفق بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
    onError: () => toast.error("حدث خطأ أثناء حذف المرفق"),
  });

  // 💡 Mutation حذف ملاحظة من الجهات
  const deleteAuthorityNoteMutation = useMutation({
    mutationFn: async (updatedHistory) => {
      return api.put(`/private-transactions/${tx.id}`, {
        notes: { authorityNotesHistory: updatedHistory },
      });
    },
    onSuccess: () => {
      toast.success("تم حذف الملاحظة بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
    onError: () => toast.error("حدث خطأ أثناء حذف الملاحظة"),
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

  const saveCoopFeeMutation = useMutation({
    mutationFn: async (data) => {
      // حقن بيانات المعاملة تلقائياً
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
    onError: () => toast.error("حدث خطأ أثناء الحفظ"),
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

  // 💡 Mutation لحذف الموعد
  const deleteDateMutation = useMutation({
    mutationFn: async (dateId) =>
      await api.delete(
        `/private-transactions/${tx?.id}/collection-dates/${dateId}`,
      ),
    onSuccess: () => {
      toast.success("تم حذف الموعد بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
    onError: () => toast.error("حدث خطأ أثناء حذف الموعد"),
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
        taxType: tx.notes?.taxData?.taxType || "بدون احتساب ضريبة", // 👈 جلب نوع الضريبة المسجل
        mediatorFees: tx.mediatorFees || totalRealMediatorFees,
        agentCost: tx.agentCost || totalRealAgentFees,
        internalName: tx.internalName || tx.notes?.internalName || "",
        isInternalNameHidden: tx.notes?.isInternalNameHidden || false,
      });

      if (tx.notes?.transactionStatusData) {
        setStatusForm({
          ...tx.notes.transactionStatusData,
          newAuthorityNote: "", // تصفير الحقل الجديد
        });
      }
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

  // ==========================================================
  // 💡 Calculations (الحسابات المالية المعقدة)
  // ==========================================================
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

  // دالة فورمات التاريخ والوقت
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("ar-SA")} - ${d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}`;
  };

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

  // 💡 إصلاح قراءة المرفقات لضمان جلبها من الـ Notes والأساسي معاً
  const safeAttachments = useMemo(() => {
    let allAtts = [];

    // 1. جلب المرفقات المتقدمة (من الـ Notes)
    if (tx?.notes?.attachments && Array.isArray(tx.notes.attachments)) {
      allAtts = [...tx.notes.attachments];
    }

    // 2. جلب المرفقات القديمة (لو كانت مسجلة كنصوص في الحقل الأساسي)
    if (tx?.attachments && Array.isArray(tx.attachments)) {
      tx.attachments.forEach((url) => {
        if (typeof url === "string") {
          // التأكد من عدم تكرار المرفق
          if (!allAtts.find((a) => a.url === url)) {
            allAtts.push({
              url,
              name: "مرفق قديم",
              uploadedBy: "النظام",
              date: tx.createdAt,
            });
          }
        }
      });
    }

    return allAtts;
  }, [tx]);
  const safePayments =
    tx.paymentsList || tx.payments || tx.notes?.payments || [];
  const safeCollectionDates =
    tx.collectionDates || tx.notes?.collectionDates || [];
  const safeAuthorityHistory = tx.notes?.authorityNotesHistory || []; // 👈 سجل ملاحظات الجهات

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
          {renderTabButton(
            "coop_office",
            "المكتب المتعاون",
            Building2,
            "rgb(8, 145, 178)",
          )}
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                >
                  {isEditingBasic ? (
                    <X className="w-3.5 h-3.5" />
                  ) : (
                    <Edit3 className="w-3.5 h-3.5" />
                  )}
                  {isEditingBasic ? "إلغاء التعديل" : "تعديل البيانات"}
                </button>
              </div>

              {/* 💡 بطاقة منشئ المعاملة */}
              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-blue-600 mb-0.5">
                    مُنشئ المعاملة
                  </div>
                  <div className="text-sm font-black text-gray-800">
                    {tx.createdBy || tx.notes?.createdBy || "مدير النظام"}
                  </div>
                  <div className="text-[11px] font-mono text-gray-500 mt-0.5">
                    {formatDateTime(tx.createdAt)}
                  </div>
                </div>
              </div>

              {/* 💡 الاسم المتداول (جديد) */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-blue-500"></div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[11px] font-bold text-gray-500 flex items-center gap-2">
                    الاسم المتداول للمعامله (داخلي للمكتب)
                  </label>
                  {isEditingBasic && (
                    <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                      <input
                        type="checkbox"
                        className="accent-blue-600 w-3.5 h-3.5"
                        checked={editFormData.isInternalNameHidden}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            isInternalNameHidden: e.target.checked,
                          })
                        }
                      />
                      <span className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> إخفاء عن العميل/التقارير
                      </span>
                    </label>
                  )}
                </div>
                {isEditingBasic ? (
                  <input
                    type="text"
                    value={editFormData.internalName}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        internalName: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="مثال: فيلا الياسمين - مشروع أبو محمد..."
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-gray-800">
                      {tx.internalName || tx.notes?.internalName || "—"}
                    </span>
                    {tx.notes?.isInternalNameHidden && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded-md flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> مخفي عن التقارير
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* باقي الحقول (رقم المعاملة، المالك، النوع) */}
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
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    {updateTxMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    ) : (
                      <Save className="w-4 h-4 inline mr-2" />
                    )}{" "}
                    حفظ التعديلات
                  </button>
                </div>
              )}
            </div>
          )}

          {/* === 2. TRANSACTION STATUS (حالة المعاملة المتقدمة) === */}
          {activeTab === "status" && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-10">
              {/* شريط التقدم التفاعلي (Progress Stepper) */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center relative overflow-hidden">
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
                      className="flex flex-col items-center gap-2 bg-white px-4 cursor-pointer group"
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all shadow-sm ${isActive ? "border-orange-500 bg-orange-50 text-orange-600 scale-110" : isPassed ? "border-green-500 bg-green-500 text-white" : "border-gray-200 bg-white text-gray-400 group-hover:border-orange-200"}`}
                      >
                        {isPassed ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          <span className="font-black text-sm">{idx + 1}</span>
                        )}
                      </div>
                      <span
                        className={`text-xs font-black transition-colors ${isActive ? "text-orange-600" : isPassed ? "text-green-600" : "text-gray-400"}`}
                      >
                        {step}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* محتوى الحالة النشطة */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* حالة 1: قيد الدراسة */}
                {statusForm.currentStatus === "عند المهندس للدراسة" && (
                  <div className="p-16 flex flex-col items-center justify-center text-center bg-slate-50/50">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                      <Briefcase className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-black text-gray-800 mb-2">
                      المعاملة قيد الدراسة الهندسية
                    </h3>
                    <p className="text-sm font-semibold text-gray-500 max-w-md">
                      لم يتم رفع المعاملة على منصة (بلدي/إحكام) حتى الآن. يُرجى
                      استكمال المخططات والدراسات الفنية المطلوبة.
                    </p>
                  </div>
                )}

                {/* حالة 2: تم الرفع */}
                {statusForm.currentStatus === "تم الرفع" && (
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                      <Send className="w-5 h-5 text-blue-600" />
                      <h3 className="text-sm font-black text-gray-800">
                        بيانات الرفع على المنصات (بلدي / إحكام)
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">
                          رقم الخدمة / الطلب{" "}
                          <span className="text-red-500">*</span>
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
                          placeholder="مثال: 450000123"
                          className="w-full border border-gray-300 p-3 rounded-xl text-sm font-mono font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">
                          سنة الخدمة (هجري)
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
                          className="w-full border border-gray-300 p-3 rounded-xl text-sm font-mono font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">
                          رقم الرخصة (إن وجد)
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
                          placeholder="رقم الرخصة الجديد"
                          className="w-full border border-gray-300 p-3 rounded-xl text-sm font-mono font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">
                          سنة الرخصة (هجري)
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
                          className="w-full border border-gray-300 p-3 rounded-xl text-sm font-mono font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-1.5 pt-2 border-t border-gray-100">
                        <label className="text-xs font-bold text-gray-700">
                          رقم الرخصة القديمة (لأغراض التجديد والتعديل)
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
                          placeholder="مثال: 4100000000"
                          className="w-full border border-gray-300 p-3 rounded-xl text-sm font-mono font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* حالة 3: ملاحظات الجهات (Timeline الاحترافي) */}
                {statusForm.currentStatus === "ملاحظات من الجهات" && (
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                      <History className="w-5 h-5 text-orange-600" />
                      <h3 className="text-sm font-black text-gray-800">
                        السجل الزمني للتوجيهات والملاحظات
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* السجل الزمني (اليمين) */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 h-[400px] overflow-y-auto custom-scrollbar-slim">
                        {safeAuthorityHistory.length > 0 ? (
                          <div className="relative border-r-2 border-orange-200 pr-5 ml-2 space-y-6">
                            {safeAuthorityHistory.map((note, idx) => {
                              const safeUrl = note.attachment?.startsWith(
                                "http",
                              )
                                ? note.attachment
                                : note.attachment
                                  ? `${backendUrl}${note.attachment}`
                                  : null;
                              return (
                                <div key={idx} className="relative group">
                                  <div className="absolute -right-[27px] top-1 w-4 h-4 bg-orange-100 border-2 border-orange-500 rounded-full"></div>
                                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                      <div className="flex items-center gap-2">
                                        <div className="bg-orange-100 text-orange-700 p-1.5 rounded-lg">
                                          <User className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-[11px] font-black text-gray-800">
                                          {note.addedBy || "موظف النظام"}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-gray-400 font-mono font-bold bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                        {formatDateTime(note.date)}
                                      </span>
                                    </div>
                                    <p className="text-[13px] text-gray-700 font-bold leading-relaxed mb-3 whitespace-pre-wrap">
                                      {note.text}
                                    </p>

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                      {safeUrl ? (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            setPreviewFile({
                                              url: safeUrl,
                                              name: "مرفق الملاحظة",
                                            });
                                          }}
                                          className="inline-flex items-center gap-1.5 text-[11px] text-blue-600 font-black bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                                        >
                                          <ImageIcon className="w-3.5 h-3.5" />{" "}
                                          معاينة المرفق
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-gray-400 font-bold">
                                          بدون مرفقات
                                        </span>
                                      )}

                                      {/* زر حذف الملاحظة */}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          if (
                                            window.confirm(
                                              "حذف هذه الملاحظة نهائياً؟",
                                            )
                                          ) {
                                            const updatedHistory =
                                              safeAuthorityHistory.filter(
                                                (_, i) => i !== idx,
                                              );
                                            deleteAuthorityNoteMutation.mutate(
                                              updatedHistory,
                                            );
                                          }
                                        }}
                                        disabled={
                                          deleteAuthorityNoteMutation.isPending
                                        }
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                        title="حذف الملاحظة"
                                      >
                                        {deleteAuthorityNoteMutation.isPending ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <History className="w-12 h-12 mb-3 opacity-20" />
                            <span className="text-sm font-bold">
                              لا يوجد سجل ملاحظات سابق
                            </span>
                          </div>
                        )}
                      </div>

                      {/* إضافة ملاحظة جديدة (اليسار) */}
                      <div className="bg-orange-50/50 border border-orange-200 rounded-2xl p-5">
                        <h4 className="text-xs font-black text-orange-800 mb-4 flex items-center gap-2">
                          <PenLine className="w-4 h-4" /> تدوين توجيه أو ملاحظة
                          جديدة
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <textarea
                              value={statusForm.newAuthorityNote}
                              onChange={(e) =>
                                setStatusForm({
                                  ...statusForm,
                                  newAuthorityNote: e.target.value,
                                })
                              }
                              className="w-full border border-orange-200 p-4 rounded-xl text-sm font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 h-[180px] resize-none shadow-sm bg-white"
                              placeholder="اكتب التوجيه الجديد أو الملاحظة الواردة من الجهة (بلدي، إحكام)..."
                            />
                          </div>
                          <div>
                            <label className="flex items-center justify-center gap-2 px-5 py-3 bg-white border-2 border-dashed border-orange-300 text-orange-600 rounded-xl cursor-pointer hover:bg-orange-50 transition-all font-bold text-xs">
                              <Upload className="w-4 h-4" />
                              <span>
                                {statusForm.noteAttachment
                                  ? statusForm.noteAttachment.name
                                  : "إرفاق صورة من الملاحظة (اختياري)"}
                              </span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) =>
                                  setStatusForm({
                                    ...statusForm,
                                    noteAttachment: e.target.files[0],
                                  })
                                }
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* حالة 4: تم الاعتماد */}
                {statusForm.currentStatus === "تم الاعتماد" && (
                  <div className="p-8 animate-in fade-in">
                    <div className="flex flex-col items-center justify-center text-center bg-green-50/50 p-8 rounded-2xl border border-green-100 mb-6">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 border-[4px] border-green-200 shadow-inner">
                        <Check className="w-10 h-10 text-green-600" />
                      </div>
                      <h3 className="text-xl font-black text-green-800 mb-2">
                        تم اعتماد المعاملة بنجاح!
                      </h3>
                      <p className="text-sm font-bold text-green-600 max-w-md">
                        تم تفعيل عدادات التحصيل الآلية للمبالغ المتبقية على
                        العميل بناءً على خطة الدفع المبرمجة.
                      </p>
                    </div>

                    {/* 💡 قسم عرض المستندات والمرفقات الخاصة بالاعتماد */}
                    <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                        <h4 className="text-sm font-black text-gray-800 flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-blue-600" />{" "}
                          مستندات ومرفقات المعاملة
                        </h4>
                        <button
                          onClick={() =>
                            setStatusForm({
                              ...statusForm,
                              approvalAttachments: [
                                ...(statusForm.approvalAttachments || []),
                                { file: null, name: "" },
                              ],
                            })
                          }
                          className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> رفع مرفق جديد
                        </button>
                      </div>

                      {/* 1️⃣ عرض المرفقات المحفوظة مسبقاً (تم جلبها من الداتابيز) */}
                      {safeAttachments.length > 0 && (
                        <div className="mb-6">
                          <span className="text-xs font-bold text-gray-500 mb-3 block">
                            المستندات المحفوظة في النظام:
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {safeAttachments.map((file, idx) => {
                              let safeName =
                                file.name ||
                                file.description ||
                                `مرفق ${idx + 1}`;
                              try {
                                safeName = decodeURIComponent(safeName);
                              } catch (e) {}
                              const safeUrl = file.url?.startsWith("http")
                                ? file.url
                                : `${backendUrl}${file.url}`;

                              return (
                                <div
                                  key={`saved-${idx}`}
                                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="bg-white p-1.5 rounded border border-gray-200 shrink-0">
                                      <FileText className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <span
                                      className="text-xs font-bold text-gray-700 truncate"
                                      title={safeName}
                                    >
                                      {safeName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setPreviewFile({
                                          url: safeUrl,
                                          name: safeName,
                                        });
                                      }}
                                      className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-200 transition-colors"
                                    >
                                      معاينة
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        if (
                                          window.confirm("حذف المرفق نهائياً؟")
                                        ) {
                                          deleteAttachmentMutation.mutate(
                                            file.url,
                                          );
                                        }
                                      }}
                                      className="text-red-400 hover:text-red-600 bg-white border border-gray-200 hover:border-red-200 p-1 rounded transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 2️⃣ فورم رفع المرفقات الجديدة (المؤقتة قبل الحفظ) */}
                      {statusForm.approvalAttachments?.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-dashed border-gray-200">
                          <span className="text-xs font-bold text-blue-600 mb-2 block">
                            مرفقات جديدة (بانتظار الحفظ):
                          </span>
                          {statusForm.approvalAttachments.map((att, idx) => (
                            <div
                              key={`new-${idx}`}
                              className="flex flex-col md:flex-row items-center gap-3 p-3 bg-blue-50/30 border border-blue-100 rounded-xl animate-in slide-in-from-top-2"
                            >
                              <div className="flex-1 w-full">
                                <input
                                  type="text"
                                  value={att.name}
                                  onChange={(e) => {
                                    const newAtts = [
                                      ...statusForm.approvalAttachments,
                                    ];
                                    newAtts[idx].name = e.target.value;
                                    setStatusForm({
                                      ...statusForm,
                                      approvalAttachments: newAtts,
                                    });
                                  }}
                                  placeholder="اسم المستند (مثال: رخصة البناء النهائية)"
                                  className="w-full border border-gray-300 p-2.5 rounded-lg text-xs font-bold outline-none focus:border-blue-500 bg-white"
                                />
                              </div>
                              <div className="flex-1 w-full flex gap-2">
                                <label className="flex-1 flex items-center justify-center gap-2 border border-blue-300 bg-blue-50 text-blue-700 p-2.5 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors text-xs font-bold">
                                  <Upload className="w-4 h-4" />
                                  <span className="truncate max-w-[120px]">
                                    {att.file ? att.file.name : "اختر ملف..."}
                                  </span>
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      const newAtts = [
                                        ...statusForm.approvalAttachments,
                                      ];
                                      newAtts[idx].file = e.target.files[0];
                                      if (!newAtts[idx].name)
                                        newAtts[idx].name =
                                          e.target.files[0].name;
                                      setStatusForm({
                                        ...statusForm,
                                        approvalAttachments: newAtts,
                                      });
                                    }}
                                  />
                                </label>
                                <button
                                  onClick={() => {
                                    const newAtts =
                                      statusForm.approvalAttachments.filter(
                                        (_, i) => i !== idx,
                                      );
                                    setStatusForm({
                                      ...statusForm,
                                      approvalAttachments: newAtts,
                                    });
                                  }}
                                  className="p-2.5 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* رسالة توجيهية إذا كان المكان فارغاً تماماً */}
                      {safeAttachments.length === 0 &&
                        (!statusForm.approvalAttachments ||
                          statusForm.approvalAttachments.length === 0) && (
                          <div className="text-center py-6 text-gray-400 text-xs font-bold">
                            لم يتم إدراج أي مرفقات للاعتماد. اضغط على "رفع مرفق
                            جديد" للبدء.
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* زر الحفظ العائم في الأسفل */}
                <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end">
                  <button
                    onClick={() => updateStatusMutation.mutate(statusForm)}
                    disabled={
                      updateStatusMutation.isPending ||
                      (statusForm.currentStatus === "ملاحظات من الجهات" &&
                        !statusForm.newAuthorityNote)
                    }
                    className="px-8 py-3 bg-slate-800 text-white rounded-xl text-sm font-black shadow-lg hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    حفظ الحالة وتحديث النظام
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
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${isEditingFinancial ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}
                >
                  {isEditingFinancial ? (
                    <X className="w-3.5 h-3.5" />
                  ) : (
                    <Edit3 className="w-3.5 h-3.5" />
                  )}
                  {isEditingFinancial ? "إغلاق التعديل" : "إمكانية التعديل"}
                </button>
              </div>

              {/* 1. الإيرادات والضرائب */}
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
                    <div className="w-[400px] flex gap-2">
                      <select
                        value={editFormData.taxType}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            taxType: e.target.value,
                          })
                        }
                        className="border border-green-200 bg-white rounded-md px-2 py-1.5 text-[11px] font-bold text-gray-700 outline-none w-1/2"
                      >
                        <option value="بدون احتساب ضريبة">
                          بدون ضريبة (صافي)
                        </option>
                        <option value="شامل الضريبة">شامل الضريبة (15%)</option>
                        <option value="غير شامل الضريبة">
                          غير شامل (تضاف 15%)
                        </option>
                      </select>
                      <TripleCurrencyInput
                        valueSar={editFormData.totalFees}
                        onChangeSar={(v) =>
                          setEditFormData({ ...editFormData, totalFees: v })
                        }
                        rates={exchangeRates}
                      />
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="font-mono text-lg font-black text-green-700">
                        {totalFees.toLocaleString()} ر.س
                      </div>
                      {tx.notes?.taxData?.taxType &&
                        tx.notes?.taxData?.taxType !== "بدون احتساب ضريبة" && (
                          <div className="text-[10px] text-gray-500 font-bold mt-1">
                            النوع: {tx.notes.taxData.taxType} | الضريبة:{" "}
                            {safeNum(
                              tx.notes.taxData.taxAmount,
                            ).toLocaleString()}{" "}
                            ر.س
                          </div>
                        )}
                    </div>
                  )}
                </div>
                {/* 💡 عرض حساب الضرائب أثناء التعديل */}
                {isEditingFinancial &&
                  editFormData.taxType !== "بدون احتساب ضريبة" && (
                    <div className="bg-white p-3 flex justify-between items-center text-xs font-mono font-bold border-t border-green-100">
                      <span className="text-gray-600">
                        المبلغ الصافي:{" "}
                        <span className="text-gray-900 text-sm">
                          {editNetAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </span>
                      <span className="text-red-600">
                        قيمة الضريبة المضافة:{" "}
                        <span className="text-red-700 text-sm">
                          {editTaxAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </span>
                    </div>
                  )}
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

              {/* 4. مصاريف أخرى (تم تفعيلها وإضافة جدول لها) */}
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
                    <Wallet className="w-4 h-4" /> مصاريف وتشغيل —{" "}
                    {actualExpenses.toLocaleString()} ر.س
                  </div>
                  <div className="flex items-center gap-3">
                    {isEditingFinancial && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          document
                            .getElementById("add-expense-form")
                            .classList.toggle("hidden");
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
                  <div className="p-4 bg-white">
                    {/* فورم إضافة مصروف */}
                    <div
                      id="add-expense-form"
                      className="hidden mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl"
                    >
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <input
                          type="date"
                          value={expenseForm.date}
                          onChange={(e) =>
                            setExpenseForm({
                              ...expenseForm,
                              date: e.target.value,
                            })
                          }
                          className="border p-2 rounded text-xs outline-none focus:border-red-500"
                        />
                        <input
                          type="text"
                          value={expenseForm.description}
                          onChange={(e) =>
                            setExpenseForm({
                              ...expenseForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="وصف المصروف..."
                          className="border p-2 rounded text-xs outline-none focus:border-red-500"
                        />
                        <input
                          type="number"
                          value={expenseForm.amount}
                          onChange={(e) =>
                            setExpenseForm({
                              ...expenseForm,
                              amount: e.target.value,
                            })
                          }
                          placeholder="المبلغ (ر.س)"
                          className="border p-2 rounded text-xs font-mono font-bold outline-none focus:border-red-500"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => addExpenseMutation.mutate(expenseForm)}
                          disabled={
                            addExpenseMutation.isPending ||
                            !expenseForm.amount ||
                            !expenseForm.description
                          }
                          className="bg-red-600 text-white px-4 py-1.5 rounded text-xs font-bold shadow-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          حفظ المصروف
                        </button>
                      </div>
                    </div>

                    {tx.expenses?.length > 0 ? (
                      <table className="w-full text-right text-xs">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                          <tr>
                            <th className="p-2">التاريخ</th>
                            <th className="p-2">الوصف</th>
                            <th className="p-2">المبلغ</th>
                            <th className="p-2">بواسطة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tx.expenses.map((exp, i) => (
                            <tr key={i} className="border-b border-gray-100">
                              <td className="p-2 font-mono text-gray-500">
                                {new Date(
                                  exp.date || exp.createdAt,
                                ).toLocaleDateString("en-GB")}
                              </td>
                              <td className="p-2 font-bold text-gray-800">
                                {exp.description || exp.notes || exp.item}
                              </td>
                              <td className="p-2 font-mono font-bold text-red-600">
                                {safeNum(exp.amount).toLocaleString()}
                              </td>
                              <td className="p-2 text-[10px] text-gray-400">
                                {exp.addedBy || "النظام"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-4 text-[11px] text-gray-400 font-bold">
                        لا توجد مصاريف أخرى مسجلة
                      </div>
                    )}
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
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
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

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-right text-[12px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        المهمة والموظف
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        المبلغ بالعملات
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        المُنشئ والتاريخ
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
                        const taskCost = safeNum(rt.cost);
                        const taskPaid = rt.isPaid
                          ? taskCost
                          : safeNum(rt.paidAmount);
                        const taskRemaining = Math.max(0, taskCost - taskPaid);
                        const isFullyPaid =
                          taskPaid >= taskCost && taskCost > 0;

                        const usdRate =
                          exchangeRates.find((r) => r.currency === "USD")
                            ?.rate || 0.266;
                        const egpRate =
                          exchangeRates.find((r) => r.currency === "EGP")
                            ?.rate || 13.2;

                        return (
                          <tr
                            key={rt.id || i}
                            className="border-b border-gray-100 hover:bg-emerald-50/30 transition-colors"
                          >
                            <td className="px-4 py-4">
                              <div className="font-bold text-gray-900">
                                {rt.taskName}
                              </div>
                              <div className="text-[10px] text-emerald-600 font-bold mt-1">
                                <User className="w-3 h-3 inline mr-1" />
                                {rt.workerName}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-mono font-black text-gray-800">
                                {taskCost.toLocaleString()}{" "}
                                <span className="text-[9px] text-gray-400">
                                  SAR
                                </span>
                              </div>
                              <div className="font-mono text-[10px] text-gray-500 mt-0.5">
                                ~ {(taskCost * usdRate).toFixed(2)} USD |{" "}
                                {(taskCost * egpRate).toFixed(2)} EGP
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-[11px] font-bold text-gray-700">
                                {rt.assignedBy || "موظف النظام"}
                              </div>
                              <div className="text-[10px] font-mono text-gray-400 mt-1">
                                {formatDateTime(rt.createdAt)}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {isFullyPaid ? (
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-green-100 text-green-700 inline-flex items-center gap-1">
                                  <Check className="w-3 h-3" /> مُسوى
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 inline-flex items-center gap-1">
                                  <Circle className="w-3 h-3" /> بانتظار التسوية
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {taskRemaining > 0 && (
                                  <button
                                    onClick={() => {
                                      setPayTaskData({
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
                                    className="bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                  >
                                    تسوية
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (window.confirm("حذف المهمة؟"))
                                      deleteRemoteTaskMutation.mutate(rt.id);
                                  }}
                                  className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg transition-colors"
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
                          colSpan="5"
                          className="text-center py-10 text-gray-400 font-bold"
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
            <div className="p-4 space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-[16px] font-black text-gray-800 flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-green-600" /> سجل التحصيلات
                  المالية من العميل
                </span>
                <button
                  onClick={() => setIsAddPaymentOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-xs font-bold shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> إضافة دفعة تحصيل جديدة
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm text-center">
                  <div className="text-gray-500 text-xs font-bold mb-1">
                    إجمالي الأتعاب
                  </div>
                  <div className="font-mono text-2xl font-black text-gray-800">
                    {totalFees.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-green-200 bg-green-50 shadow-sm text-center">
                  <div className="text-green-700 text-xs font-bold mb-1">
                    تم تحصيله
                  </div>
                  <div className="font-mono text-2xl font-black text-green-700">
                    {totalPaid.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-red-200 bg-red-50 shadow-sm text-center">
                  <div className="text-red-700 text-xs font-bold mb-1">
                    المتبقي
                  </div>
                  <div className="font-mono text-2xl font-black text-red-700">
                    {remaining.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 shadow-sm text-center">
                  <div className="text-blue-700 text-xs font-bold mb-1">
                    نسبة التحصيل
                  </div>
                  <div className="font-mono text-2xl font-black text-blue-700">
                    {collectionPercent}%
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-right">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        التاريخ
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        المبلغ
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        طريقة الدفع/المرجع
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        المُحصّل
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600 text-center">
                        إجراء
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {safePayments.length > 0 ? (
                      safePayments.map((p, i) => (
                        <tr
                          key={p.id || i}
                          className="border-b border-gray-100 hover:bg-green-50/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-gray-600">
                            {formatDateTime(p.date || p.createdAt)}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-green-600 text-sm">
                            {safeNum(p.amount).toLocaleString()} ر.س
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-bold">
                            {p.method}{" "}
                            <span className="text-gray-400 font-normal mr-2">
                              ({p.periodRef || p.ref || "بدون مرجع"})
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 font-bold text-[11px]">
                            <User className="w-3 h-3 inline mr-1" />
                            {p.collectedBy || "موظف النظام"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                if (window.confirm("حذف الدفعة؟"))
                                  deletePaymentMutation.mutate(p.id);
                              }}
                              className="text-red-400 hover:text-red-600 p-1.5 bg-red-50 rounded-lg"
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
                          className="text-center py-10 text-gray-400 font-bold"
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

          {/* === 10. COLLECTION DATES (خطة التحصيل المتقدمة) === */}
          {activeTab === "dates" && (
            <div className="space-y-6 animate-in fade-in pb-10">
              {/* 💡 1. لوحة ملخص خطة التحصيل (Context Dashboard) */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                  <span className="text-gray-500 text-[11px] font-bold mb-1">
                    المتبقي الكلي للتحصيل
                  </span>
                  <span className="font-mono text-xl font-black text-gray-800">
                    {remaining.toLocaleString()}{" "}
                    <span className="text-[10px]">ر.س</span>
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm flex flex-col justify-center">
                  <span className="text-purple-600 text-[11px] font-bold mb-1">
                    إجمالي المبالغ المجدولة (في الخطة)
                  </span>
                  <span className="font-mono text-xl font-black text-purple-700">
                    {safeCollectionDates
                      .reduce((acc, curr) => acc + safeNum(curr.amount), 0)
                      .toLocaleString()}{" "}
                    <span className="text-[10px]">ر.س</span>
                  </span>
                </div>
                <div
                  className={`p-4 rounded-xl border shadow-sm flex flex-col justify-center ${Math.max(0, remaining - safeCollectionDates.reduce((acc, curr) => acc + safeNum(curr.amount), 0)) > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}
                >
                  <span
                    className={`${Math.max(0, remaining - safeCollectionDates.reduce((acc, curr) => acc + safeNum(curr.amount), 0)) > 0 ? "text-red-700" : "text-green-700"} text-[11px] font-bold mb-1`}
                  >
                    مبالغ غير مجدولة (تحتاج لجدولة)
                  </span>
                  <span
                    className={`font-mono text-xl font-black ${Math.max(0, remaining - safeCollectionDates.reduce((acc, curr) => acc + safeNum(curr.amount), 0)) > 0 ? "text-red-600" : "text-green-600"}`}
                  >
                    {Math.max(
                      0,
                      remaining -
                        safeCollectionDates.reduce(
                          (acc, curr) => acc + safeNum(curr.amount),
                          0,
                        ),
                    ).toLocaleString()}{" "}
                    <span className="text-[10px]">ر.س</span>
                  </span>
                </div>
              </div>

              {/* 💡 2. نموذج إضافة موعد جديد (Enterprise Form) */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-5 border-b border-gray-100 pb-3">
                  <CalendarDays className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-black text-gray-800">
                    إدراج موعد تحصيل جديد في الخطة
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                  {/* نوع الاستحقاق */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-3">
                      طريقة تحديد تاريخ الاستحقاق{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-300 shadow-sm">
                      <button
                        onClick={() =>
                          setDateForm({ ...dateForm, type: "specific_date" })
                        }
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${dateForm.type === "specific_date" ? "bg-purple-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}
                      >
                        تاريخ تقويمي محدد
                      </button>
                      <button
                        onClick={() =>
                          setDateForm({ ...dateForm, type: "upon_approval" })
                        }
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${dateForm.type === "upon_approval" ? "bg-purple-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}
                      >
                        يُستحق فور الاعتماد
                      </button>
                    </div>
                    {/* تلميحات احترافية */}
                    <p className="text-[10px] text-slate-400 mt-2 font-semibold flex items-start gap-1">
                      <Info className="w-3 h-3 shrink-0 mt-0.5" />
                      {dateForm.type === "specific_date"
                        ? "سيتم تنبيهك عند اقتراب التاريخ المحدد أو تأخره."
                        : "سيظل الموعد معلقاً، ويبدأ عداد التأخير تلقائياً بمجرد تحويل حالة المعاملة إلى (تم الاعتماد)."}
                    </p>
                  </div>

                  {/* التاريخ أو التلميح */}
                  <div className="p-4 flex flex-col justify-center">
                    {dateForm.type === "specific_date" ? (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          التاريخ المتوقع للسداد{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={dateForm.date}
                          onChange={(e) =>
                            setDateForm({ ...dateForm, date: e.target.value })
                          }
                          className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all bg-white shadow-sm"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                        <Timer className="w-8 h-8 opacity-50" />
                        <div>
                          <p className="text-xs font-bold mb-1">
                            العداد متوقف حالياً
                          </p>
                          <p className="text-[10px] font-semibold opacity-80">
                            سيتم ربط هذا الموعد برقم وتاريخ قرار الاعتماد فور
                            صدوره من الجهات المعنية.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  {/* المبلغ المستهدف */}
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      المبلغ المستهدف <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={dateForm.amountType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDateForm({
                            ...dateForm,
                            amountType: val,
                            amount:
                              val === "full"
                                ? Math.max(
                                    0,
                                    remaining -
                                      safeCollectionDates.reduce(
                                        (a, c) => a + safeNum(c.amount),
                                        0,
                                      ),
                                  )
                                : "",
                          });
                        }}
                        className="border border-gray-300 rounded-xl p-3 text-xs font-bold bg-slate-50 w-24 outline-none focus:border-purple-500"
                      >
                        <option value="full">الباقي</option>
                        <option value="partial">مخصص</option>
                      </select>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          disabled={dateForm.amountType === "full"}
                          value={
                            dateForm.amountType === "full"
                              ? Math.max(
                                  0,
                                  remaining -
                                    safeCollectionDates.reduce(
                                      (a, c) => a + safeNum(c.amount),
                                      0,
                                    ),
                                )
                              : dateForm.amount
                          }
                          onChange={(e) =>
                            setDateForm({ ...dateForm, amount: e.target.value })
                          }
                          className="w-full border border-gray-300 p-3 rounded-xl text-lg font-mono font-black outline-none focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all shadow-sm"
                          placeholder="0"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                          SAR
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* الملاحظات */}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      البيان / توجيهات المتابعة (اختياري)
                    </label>
                    <input
                      type="text"
                      value={dateForm.notes}
                      onChange={(e) =>
                        setDateForm({ ...dateForm, notes: e.target.value })
                      }
                      className="w-full border border-gray-300 p-3 rounded-xl text-sm font-semibold outline-none focus:border-purple-500 transition-all shadow-sm"
                      placeholder="مثال: الدفعة الثانية بعد الرفع المساحي، التواصل مع وكيل المالك..."
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      if (dateForm.type === "specific_date" && !dateForm.date)
                        return toast.error("يرجى تحديد التاريخ");
                      if (
                        dateForm.amountType === "partial" &&
                        (!dateForm.amount || dateForm.amount <= 0)
                      )
                        return toast.error("يرجى إدخال مبلغ صحيح");
                      addDateMutation.mutate(dateForm);
                    }}
                    disabled={addDateMutation.isPending || remaining <= 0}
                    className="px-8 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
                  >
                    {addDateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    اعتماد الموعد في الخطة
                  </button>
                </div>
              </div>

              {/* 💡 3. عرض خطة التحصيل (بطاقات احترافية للمواعيد) */}
              <div className="mt-8">
                <h4 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-500" /> السجل الزمني
                  لخطة التحصيل
                </h4>
                <div className="space-y-3">
                  {safeCollectionDates.length > 0 ? (
                    safeCollectionDates.map((d, i) => {
                      const days = calculateDays(
                        d.date,
                        d.type === "upon_approval",
                      );

                      // تحديد الحالة والألوان للموعد
                      let statusConfig = {
                        bg: "bg-white",
                        border: "border-gray-200",
                        badgeBg: "bg-gray-100",
                        badgeText: "text-gray-600",
                        icon: Clock,
                        label: "بانتظار الإجراء",
                      };

                      if (d.type === "specific_date") {
                        if (days < 0)
                          statusConfig = {
                            bg: "bg-red-50/50",
                            border: "border-red-200",
                            badgeBg: "bg-red-100",
                            badgeText: "text-red-700",
                            icon: TriangleAlert,
                            label: `متأخر ${Math.abs(days)} يوم`,
                          };
                        else if (days === 0)
                          statusConfig = {
                            bg: "bg-orange-50/50",
                            border: "border-orange-300",
                            badgeBg: "bg-orange-100",
                            badgeText: "text-orange-700",
                            icon: Timer,
                            label: "يستحق اليوم!",
                          };
                        else
                          statusConfig = {
                            bg: "bg-white",
                            border: "border-blue-200",
                            badgeBg: "bg-blue-50",
                            badgeText: "text-blue-700",
                            icon: CalendarDays,
                            label: `متبقي ${days} يوم`,
                          };
                      } else if (d.type === "upon_approval") {
                        if (days !== null)
                          statusConfig = {
                            bg: "bg-red-50/50",
                            border: "border-red-300",
                            badgeBg: "bg-red-100",
                            badgeText: "text-red-700",
                            icon: TriangleAlert,
                            label: `متأخر! مر ${days} يوم على الاعتماد`,
                          };
                        else
                          statusConfig = {
                            bg: "bg-slate-50",
                            border: "border-slate-200 border-dashed",
                            badgeBg: "bg-slate-200",
                            badgeText: "text-slate-600",
                            icon: Archive,
                            label: "معلق بانتظار الاعتماد",
                          };
                      }

                      return (
                        <div
                          key={i}
                          className={`p-0 rounded-2xl border flex flex-col md:flex-row overflow-hidden shadow-sm transition-all hover:shadow-md ${statusConfig.bg} ${statusConfig.border}`}
                        >
                          {/* الشريط الجانبي الملون */}
                          <div
                            className={`w-1.5 hidden md:block ${statusConfig.badgeBg.replace("bg-", "bg-").replace("100", "500").replace("50", "400")}`}
                          ></div>

                          <div className="flex-1 p-4 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 w-max ${statusConfig.badgeBg} ${statusConfig.badgeText}`}
                              >
                                <statusConfig.icon className="w-3 h-3" />{" "}
                                {statusConfig.label}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono font-bold bg-white px-2 py-1 rounded border border-gray-100 shadow-sm">
                                {d.type === "upon_approval"
                                  ? "نوع الجدولة: شرطية (عند الاعتماد)"
                                  : `تاريخ الاستحقاق: ${new Date(d.date).toLocaleDateString("en-GB")}`}
                              </span>
                            </div>
                            <div className="font-bold text-gray-800 text-[13px]">
                              {d.notes || "متابعة تحصيل دفعة من العميل"}
                            </div>
                            <div className="text-[10px] text-gray-400 font-semibold mt-2 flex items-center gap-1">
                              <User className="w-3 h-3" /> أُضيف بواسطة:{" "}
                              <span className="text-gray-600">
                                {d.addedBy || "النظام"}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 border-t md:border-t-0 md:border-r border-gray-200/60 bg-white/50 flex flex-col items-end justify-center min-w-[180px]">
                            <span className="text-[10px] text-gray-500 font-bold mb-1">
                              قيمة الموعد
                            </span>
                            <div className="font-mono font-black text-2xl text-purple-700 tracking-tight">
                              {safeNum(d.amount).toLocaleString()}{" "}
                              <span className="text-[11px] font-normal text-purple-500">
                                ر.س
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  window.confirm(
                                    "هل أنت متأكد من رغبتك في حذف هذا الموعد نهائياً؟",
                                  )
                                ) {
                                  deleteDateMutation.mutate(d.id);
                                }
                              }}
                              disabled={deleteDateMutation.isPending}
                              className="mt-3 text-[10px] text-red-500 font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                            >
                              حذف الموعد
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center">
                      <CalendarDays className="w-12 h-12 text-gray-300 mb-3" />
                      <span className="text-gray-500 font-bold text-sm">
                        لا توجد خطط أو مواعيد تحصيل مسجلة.
                      </span>
                      <span className="text-gray-400 text-xs mt-1">
                        قم بإضافة المواعيد بالأعلى لتفعيل العدادات الآلية.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* === NEW: COOP OFFICE (المكتب المتعاون) === */}
          {activeTab === "coop_office" && (
            <div className="p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--wms-text)] text-[14px] font-bold">
                    تكاليف المكتب المنفذ (الخارجي)
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded text-[12px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                    {txCoopFees
                      .reduce((a, b) => a + Number(b.officeFees), 0)
                      .toLocaleString()}{" "}
                    ر.س
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCoopFeeMode("add");
                    setCoopFeeForm(initialCoopFeeForm);
                    setIsCoopFeeModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-600 text-white hover:bg-cyan-700 text-[11px] font-bold shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> إضافة مطالبة أتعاب مكتب
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[12px] text-right">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        المكتب المتعاون
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        نوع الطلب
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        الأتعاب المستحقة
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        المدفوع
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        المتبقي
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600">
                        حالة الدفع
                      </th>
                      <th className="px-4 py-3 font-bold text-gray-600 text-center">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {txCoopFees.length > 0 ? (
                      txCoopFees.map((fee, i) => {
                        const cost = Number(fee.officeFees) || 0;
                        const paid = Number(fee.paidAmount) || 0;
                        const remaining = Math.max(0, cost - paid);
                        const isFullyPaid = paid >= cost && cost > 0;

                        return (
                          <tr
                            key={i}
                            className="border-b border-gray-100 hover:bg-cyan-50/30 transition-colors"
                          >
                            <td className="px-4 py-4 font-bold text-gray-800 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-cyan-600" />
                              {fee.officeName}
                            </td>
                            <td className="px-4 py-4 text-gray-600 font-bold">
                              {fee.requestType || "—"}
                            </td>
                            <td className="px-4 py-4 font-mono font-bold text-blue-700">
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
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${isFullyPaid ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
                              >
                                {isFullyPaid
                                  ? "مدفوع بالكامل"
                                  : "غير مدفوع / جزئي"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOpenCoopFeeEdit(fee)}
                                  className="text-cyan-600 hover:bg-cyan-50 p-1.5 rounded-lg transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm("حذف المطالبة؟"))
                                      deleteCoopFeeMutation.mutate(fee.id);
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
                          className="text-center py-8 text-gray-400 font-bold"
                        >
                          لا توجد مطالبات مسجلة للمكاتب في هذه المعاملة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === 6. ATTACHMENTS (المرفقات المتقدمة) === */}
          {activeTab === "attachments" && (
            <div className="p-5 space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-[16px] font-black text-gray-800 flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-blue-600" /> إدارة مرفقات
                  ووثائق المعاملة
                </span>
              </div>

              {/* صندوق الرفع الجديد */}
              <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-end gap-4">
                <div className="flex-1 w-full space-y-3">
                  <label className="block text-xs font-bold text-blue-800">
                    وصف المرفق (إلزامي لسهولة البحث)
                  </label>
                  <input
                    type="text"
                    value={uploadData.description}
                    onChange={(e) =>
                      setUploadData({
                        ...uploadData,
                        description: e.target.value,
                      })
                    }
                    className="w-full border border-blue-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-600"
                    placeholder="مثال: صورة الصك الجديد، عقد المكتب..."
                  />
                </div>
                <div className="w-full md:w-auto">
                  <label className="flex items-center justify-center gap-2 px-8 py-3 bg-white border-2 border-dashed border-blue-400 text-blue-600 rounded-xl cursor-pointer hover:bg-blue-600 hover:text-white transition-all font-bold text-sm h-[42px]">
                    <Upload className="w-4 h-4" />{" "}
                    <span>
                      {uploadData.file
                        ? uploadData.file.name
                        : "اختر ملف لرفعه..."}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        setUploadData({
                          ...uploadData,
                          file: e.target.files[0],
                        })
                      }
                    />
                  </label>
                </div>
                <button
                  onClick={() => uploadAttachmentMutation.mutate()}
                  disabled={
                    !uploadData.file ||
                    !uploadData.description ||
                    uploadAttachmentMutation.isPending
                  }
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm h-[42px] shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploadAttachmentMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "حفظ ورفع"
                  )}
                </button>
              </div>

              {/* شبكة المرفقات */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-6">
                {safeAttachments.length === 0 ? (
                  <div className="col-span-full text-center py-16 text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                    <FileBox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    لا توجد مرفقات مسجلة. قم برفع المستندات أعلاه.
                  </div>
                ) : (
                  safeAttachments.map((file, idx) => {
                    let safeName =
                      file.name || file.description || `مرفق ${idx + 1}`;
                    try {
                      safeName = decodeURIComponent(safeName);
                    } catch (e) {}
                    const safeUrl = file.url?.startsWith("http")
                      ? file.url
                      : `${backendUrl}${file.url}`;

                    return (
                      <div
                        key={idx}
                        className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col items-center text-center group hover:border-blue-400 hover:shadow-md transition-all relative overflow-hidden"
                      >
                        <div className="w-full bg-gray-50 p-2 text-[9px] text-gray-400 font-mono absolute top-0 left-0 right-0 border-b border-gray-100 flex justify-between">
                          <span>
                            {formatDateTime(file.createdAt || file.date)}
                          </span>
                        </div>
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mt-6 mb-3 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {safeUrl.toLowerCase().endsWith(".pdf") ? (
                            <FileText className="w-6 h-6" />
                          ) : (
                            <ImageIcon className="w-6 h-6" />
                          )}
                        </div>
                        <span
                          className="text-[13px] font-bold text-gray-800 truncate w-full mb-1"
                          title={safeName}
                        >
                          {safeName}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold mb-4 bg-gray-100 px-2 py-0.5 rounded-full">
                          <User className="w-3 h-3 inline mr-1" />{" "}
                          {file.uploadedBy || "النظام"}
                        </span>

                        <div className="flex items-center gap-2 w-full mt-auto">
                          <button
                            onClick={() =>
                              setPreviewFile({ url: safeUrl, name: safeName })
                            }
                            className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors"
                          >
                            معاينة
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("حذف المرفق نهائياً؟"))
                                deleteAttachmentMutation.mutate(file.url);
                            }}
                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
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
      {/* 💡 Sub-Modal: إضافة/تعديل أتعاب مكتب متعاون */}
      {/* ========================================================== */}
      {isCoopFeeModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 animate-in fade-in" dir="rtl" onClick={() => setIsCoopFeeModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-cyan-800 p-4 flex justify-between items-center text-white shrink-0">
              <span className="font-bold flex items-center gap-2 text-[15px]">
                <Building2 className="w-5 h-5 text-cyan-200" /> 
                {coopFeeMode === "add" ? "إضافة تكلفة مكتب متعاون" : "تعديل تكلفة المكتب"}
              </span>
              <button onClick={() => setIsCoopFeeModalOpen(false)} className="p-1 rounded-md hover:bg-white/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar-slim space-y-5">
              <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100 flex items-center gap-3 mb-2">
                <Info className="w-5 h-5 text-cyan-600 shrink-0" />
                <span className="text-xs font-bold text-cyan-800">
                  سيتم ربط هذه التكلفة تلقائياً بالمعاملة الحالية ({tx.internalName || tx.client}).
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-2">اسم المكتب المتعاون *</label>
                  <select value={coopFeeForm.officeId} onChange={e => setCoopFeeForm({...coopFeeForm, officeId: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold focus:border-cyan-500 outline-none bg-white">
                    <option value="">-- اختر المكتب --</option>
                    {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">نوع الطلب</label>
                  <select value={coopFeeForm.requestType} onChange={e => setCoopFeeForm({...coopFeeForm, requestType: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold focus:border-cyan-500 outline-none bg-white">
                    <option value="اصدار">إصدار</option>
                    <option value="تجديد وتعديل">تجديد وتعديل</option>
                    <option value="تصحيح وضع مبني قائم">تصحيح وضع مبنى قائم</option>
                    <option value="اخرى">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">الأتعاب المستحقة للمكتب *</label>
                  <input type="number" value={coopFeeForm.officeFees} onChange={e => setCoopFeeForm({...coopFeeForm, officeFees: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-lg font-mono font-bold text-blue-700 focus:border-cyan-500 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">المدفوع مقدماً</label>
                  <input type="number" value={coopFeeForm.paidAmount} onChange={e => setCoopFeeForm({...coopFeeForm, paidAmount: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-lg font-mono font-bold text-green-600 focus:border-cyan-500 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">تاريخ الاستحقاق</label>
                  <input type="date" value={coopFeeForm.dueDate} onChange={e => setCoopFeeForm({...coopFeeForm, dueDate: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:border-cyan-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-2">الخدمات المقدمة (فري تكست)</label>
                  <input type="text" value={coopFeeForm.providedServices} onChange={e => setCoopFeeForm({...coopFeeForm, providedServices: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:border-cyan-500 outline-none bg-white" placeholder="مثال: تصميم معماري، انشائي، تنسيق حدائق..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">حالة الرفع على النظام</label>
                  <select value={coopFeeForm.uploadStatus} onChange={e => setCoopFeeForm({...coopFeeForm, uploadStatus: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold focus:border-cyan-500 outline-none bg-white">
                    <option value="مع الرفع على النظام">مع الرفع على النظام</option>
                    <option value="بدون رفع على النظام">بدون رفع على النظام</option>
                  </select>
                </div>
              </div>

              {/* بيانات الرخصة */}
              <div className="grid grid-cols-3 gap-4 p-4 border border-orange-100 bg-orange-50/30 rounded-xl">
                 <div className="col-span-3 pb-2 border-b border-orange-100 mb-2">
                    <span className="text-xs font-bold text-orange-800">بيانات الرخصة والمنصات التابعة للمكتب</span>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">رقم الرخصة</label>
                    <input type="text" value={coopFeeForm.licenseNumber} onChange={e => setCoopFeeForm({...coopFeeForm, licenseNumber: e.target.value})} className="w-full border p-2 rounded text-sm outline-none focus:border-orange-400 bg-white" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">سنة الرخصة (هجرية)</label>
                    <input type="text" value={coopFeeForm.licenseYear} onChange={e => setCoopFeeForm({...coopFeeForm, licenseYear: e.target.value})} className="w-full border p-2 rounded text-sm outline-none focus:border-orange-400 bg-white" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">رقم الخدمة</label>
                    <input type="text" value={coopFeeForm.serviceNumber} onChange={e => setCoopFeeForm({...coopFeeForm, serviceNumber: e.target.value})} className="w-full border p-2 rounded text-sm outline-none focus:border-orange-400 bg-white" />
                 </div>
                 <div className="col-span-3">
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">اسم الجهة (الأمانة / القطاع)</label>
                    <input type="text" value={coopFeeForm.entityName} onChange={e => setCoopFeeForm({...coopFeeForm, entityName: e.target.value})} placeholder="مثال: أمانة منطقة الرياض" className="w-full border p-2 rounded text-sm outline-none focus:border-orange-400 bg-white" />
                 </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsCoopFeeModalOpen(false)} className="px-6 py-2.5 border border-gray-300 rounded-xl bg-white text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors">إلغاء</button>
              <button
                onClick={() => {
                  if(!coopFeeForm.officeId || !coopFeeForm.officeFees) return toast.error("يرجى اختيار المكتب وكتابة الأتعاب");
                  saveCoopFeeMutation.mutate(coopFeeForm);
                }}
                disabled={saveCoopFeeMutation.isPending}
                className="px-8 py-2.5 bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-md hover:bg-cyan-800 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {saveCoopFeeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {coopFeeMode === "add" ? "حفظ التكلفة" : "تعديل التكلفة"}
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
