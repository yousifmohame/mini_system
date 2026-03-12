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
// 💡 Main Component
// ============================================================================
export const TransactionDetailsModal = ({
  isOpen,
  onClose,
  tx: initialTx,
  refetchTable,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");

  // 🔴 التعديل هنا: جلب بيانات المعاملة بشكل حي (Live) من الـ Cache بدلاً من الاعتماد على initialTx الثابت
  const { data: transactionsData = [] } = useQuery({
    queryKey: ["private-transactions-full"],
    // لا نحتاج لعمل queryFn هنا لأنه سيستخدم الـ Cache الذي يتم تحديثه من الصفحة الرئيسية
  });

  const tx = useMemo(() => {
    if (!initialTx) return null;
    return transactionsData.find((t) => t.id === initialTx.id) || initialTx;
  }, [transactionsData, initialTx]);

  // States for toggling inner sections in Settlement tab
  const [openSections, setOpenSections] = useState({
    brokers: true,
    agents: true,
    remote: true,
    expenses: true,
  });
  const toggleSection = (sec) =>
    setOpenSections((p) => ({ ...p, [sec]: !p[sec] }));

  // ==========================================================
  // 💡 Sub-Modals States (نوافذ الإضافة الفرعية)
  // ==========================================================
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
    tasks: [{ name: "", cost: "" }],
    isFinal: false,
  });

  const [dateForm, setDateForm] = useState({
    date: "",
    amount: "",
    person: "",
    notes: "",
  });

  const [distributionScheme, setDistributionScheme] = useState("default");
  const [roundingMode, setRoundingMode] = useState("none");

  // ==========================================================
  // 💡 Data Fetching inside Modal
  // ==========================================================
  const { data: persons = [] } = useQuery({
    queryKey: ["persons-directory"],
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

  // States الخاصة بإضافة وسيط (في تاب الوسطاء)
  const [isAddBrokerModalOpen, setIsAddBrokerModalOpen] = useState(false);
  const [brokerForm, setBrokerForm] = useState({ brokerId: "", fees: "" });

  // قائمة الوسطاء من الأشخاص
  const brokersList = useMemo(
    () => persons.filter((p) => p.role === "وسيط"),
    [persons],
  );

  // Mutation لإضافة وسيط
  // 💡 Mutation إضافة وسيط
  const addBrokerMutation = useMutation({
    mutationFn: async (data) =>
      api.post(`/private-transactions/${tx?.id}/brokers`, data), // 👈 المسار الجديد
    onSuccess: () => {
      toast.success("تم تعيين الوسيط بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setIsAddBrokerModalOpen(false);
      setBrokerForm({ brokerId: "", fees: "" });
    },
  });

  // 💡 Mutation حذف وسيط (أضفها مع باقي الـ Mutations)
  const deleteBrokerMutation = useMutation({
    mutationFn: async (brokerRecordId) =>
      api.delete(`/private-transactions/brokers/${brokerRecordId}`),
    onSuccess: () => {
      toast.success("تم حذف الوسيط");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
  });

  // ==========================================================
  // 💡 Mutations
  // ==========================================================
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
    mutationFn: async (data) =>
      api.post(`/remote-workers/assign-tasks`, {
        transactionId: tx?.id,
        ...data,
      }),
    onSuccess: () => {
      toast.success("تم تعيين المهام للموظف");
      queryClient.invalidateQueries(["private-transactions-full"]);
      setIsAddRemoteTaskOpen(false);
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append("files", file);
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
      setDateForm({ date: "", amount: "", person: "", notes: "" });
    },
  });

  // ==========================================================
  // 🔴 THE FIX: Move all calculations & useMemo BEFORE early return
  // واستخدام المعامل tx?. لحماية الكود عندما يكون المودال مغلق
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

  const sourcePercent = safeNum(tx?.sourcePercent) || 5;
  const sourceShare = (distributableProfit * sourcePercent) / 100;
  const availableForPartners = distributableProfit - sourceShare;

  const partnersDistribution = useMemo(() => {
    if (!tx) return []; // حماية الـ useMemo
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

  const totalCalculatedPartners = partnersDistribution.reduce(
    (acc, curr) => acc + curr.finalAmount,
    0,
  );
  const totalDistributionWithSource = totalCalculatedPartners + sourceShare;
  const isSettlementComplete = totalCosts > 0 && tx?.status !== "جارية";

  // 🔴 الآن يمكننا وضع الـ Return بكل أمان دون التسبب في مشكلة الـ Hooks
  if (!isOpen || !tx) return null;

  const isFrozen = tx.status === "مجمّدة";

  // Helper لتابات المودال
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
        className={`flex items-center gap-1 px-3 py-2.5 whitespace-nowrap cursor-pointer transition-colors shrink-0 ${isActive ? `border-b-2 font-bold` : "text-[var(--wms-text-muted)] hover:text-[var(--wms-text-sec)] font-medium border-b-2 border-transparent"}`}
        style={{
          fontSize: "12px",
          color: isActive ? activeColor : undefined,
          borderColor: isActive ? activeColor : "transparent",
        }}
      >
        <Icon className="w-3.5 h-3.5" /> <span>{label}</span>
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl relative"
        style={{ width: "80vw", maxWidth: "1200px", height: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--wms-border)] bg-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[var(--wms-accent-blue)] bg-blue-100 px-2 py-0.5 rounded font-mono text-[14px] font-bold">
              {tx.ref || tx.id?.slice(-6)}
            </span>
            <span className="text-[var(--wms-text)] text-[14px] font-bold">
              تفاصيل المعاملة: {safeText(tx.client || tx.owner)}
            </span>
            {isFrozen && (
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-1">
                <Archive className="w-3 h-3" /> مجمّدة مؤقتاً
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => freezeMutation.mutate(tx.id)}
              disabled={freezeMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-[11px] font-bold transition-colors"
            >
              {isFrozen ? (
                <RefreshCw className="w-3 h-3 text-green-600" />
              ) : (
                <Archive className="w-3 h-3 text-amber-600" />
              )}
              <span>{isFrozen ? "تنشيط المعاملة" : "تجميد"}</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm("حذف نهائي؟ لا يمكن التراجع!"))
                  deleteMutation.mutate(tx.id);
              }}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-[11px] font-bold transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>حذف نهائي</span>
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="w-5 h-5" />
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
        <div className="flex border-b border-[var(--wms-border)] shrink-0 overflow-x-auto custom-scrollbar-slim bg-white">
          {renderTabButton("basic", "البيانات الأساسية", FileText)}
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
          {renderTabButton("dates", "مواعيد التحصيل", TriangleAlert)}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-slim bg-gray-50/50 relative">
          {/* === 1. BASIC === */}
          {activeTab === "basic" && (
            <div className="p-5 space-y-5 animate-in fade-in">
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <div className="text-gray-400 text-[10px] font-bold mb-1">
                    رقم المعاملة
                  </div>
                  <div className="font-mono text-lg font-bold text-blue-700">
                    {tx.ref || tx.id.slice(-6)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <div className="text-gray-400 text-[10px] font-bold mb-1">
                    نوع المعاملة
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    {safeText(tx.type)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <div className="text-gray-400 text-[10px] font-bold mb-1">
                    اسم المالك
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    {safeText(tx.client || tx.owner)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <div className="text-gray-400 text-[10px] font-bold mb-1">
                    الحي / القطاع
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    {safeText(tx.district)} - {safeText(tx.sector)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <div className="text-gray-400 text-[10px] font-bold mb-1">
                    المصدر
                  </div>
                  <div className="text-md font-bold text-purple-700">
                    {safeText(tx.sourceName || tx.source || "مباشر")}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <div className="text-gray-400 text-[10px] font-bold mb-1">
                    المكتب المنفذ
                  </div>
                  <div className="text-md font-bold text-gray-700">
                    {safeText(tx.office || "مكتب ديتيلز")}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <div className="text-gray-400 text-[10px] font-bold mb-1">
                    تاريخ الإنشاء
                  </div>
                  <div className="font-mono text-md font-bold text-gray-700">
                    {safeText(tx.created || tx.date)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === 1.5. FINANCIAL (المحرك المالي) === */}
          {activeTab === "financial" && (
            <div className="p-4 space-y-4 animate-in fade-in duration-300">
              {/* الإيرادات */}
              <div
                className="rounded-xl border overflow-hidden shadow-sm"
                style={{ borderColor: "rgba(34, 197, 94, 0.2)" }}
              >
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{
                    backgroundColor: "rgba(34, 197, 94, 0.05)",
                    borderBottom: "1px solid rgba(34, 197, 94, 0.2)",
                  }}
                >
                  <div className="flex items-center gap-1.5 text-green-600">
                    <Banknote className="w-4 h-4" />
                    <span className="text-[12px] font-bold">
                      الإيرادات — السعر المتفق
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <span className="font-mono text-xl font-bold text-green-600">
                    {totalFees.toLocaleString()} ر.س
                  </span>
                </div>
              </div>

              {/* أتعاب الوسطاء */}
              <div
                className="rounded-xl border overflow-hidden shadow-sm"
                style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}
              >
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.05)",
                    borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  <div className="flex items-center gap-1.5 text-red-600">
                    <Handshake className="w-4 h-4" />
                    <span className="text-[12px] font-bold">
                      أتعاب الوسطاء —{" "}
                      {safeNum(tx.mediatorFees).toLocaleString()} ر.س
                    </span>
                  </div>
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50">
                    <span className="font-bold text-gray-800 text-[12px]">
                      {tx.mediator || "لا يوجد وسيط"}
                    </span>
                    <span className="font-mono font-bold text-gray-800 text-[12px]">
                      {safeNum(tx.mediatorFees).toLocaleString()}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                      غير مدفوع
                    </span>
                    <span className="font-mono text-gray-500 text-[10px]">
                      —
                    </span>
                  </div>
                </div>
              </div>

              {/* أتعاب المعقبين */}
              <div
                className="rounded-xl border overflow-hidden shadow-sm"
                style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}
              >
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.05)",
                    borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  <div className="flex items-center gap-1.5 text-red-600">
                    <User className="w-4 h-4" />
                    <span className="text-[12px] font-bold">
                      أتعاب المعقبين — {safeNum(tx.agentCost).toLocaleString()}{" "}
                      ر.س
                    </span>
                  </div>
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                </div>
                <div className="p-3 space-y-2">
                  {tx.agents?.length > 0 ? (
                    tx.agents.map((ag, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-bold text-gray-800 text-[12px]">
                          {ag.name}
                        </span>
                        <span className="font-mono font-bold text-gray-800 text-[12px]">
                          {safeNum(ag.fees).toLocaleString()}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                          مدفوع بالكامل
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-[11px] text-gray-500 font-bold py-2">
                      لا يوجد معقبون
                    </div>
                  )}
                </div>
              </div>

              {/* العمل عن بعد */}
              <div
                className="rounded-xl border overflow-hidden shadow-sm"
                style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}
              >
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.05)",
                    borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  <div className="flex items-center gap-1.5 text-red-600">
                    <Monitor className="w-4 h-4" />
                    <span className="text-[12px] font-bold">
                      العمل عن بعد — {safeNum(tx.remoteCost).toLocaleString()}{" "}
                      ر.س
                    </span>
                  </div>
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                </div>
                <div className="p-3 space-y-2">
                  {tx.remoteTasks?.length > 0 ? (
                    tx.remoteTasks.map((rt, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-bold text-gray-800 text-[12px]">
                          {rt.workerName}
                        </span>
                        <span className="text-gray-500 text-[11px]">
                          {rt.taskName}
                        </span>
                        <span className="font-mono font-bold text-gray-800 text-[12px]">
                          {safeNum(rt.cost).toLocaleString()}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                          بانتظار الدفع
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-[11px] text-gray-500 font-bold py-2">
                      لا توجد مهام عمل عن بعد
                    </div>
                  )}
                </div>
              </div>

              {/* مصاريف أخرى */}
              <div
                className="rounded-xl border overflow-hidden shadow-sm"
                style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}
              >
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.05)",
                    borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  <div className="flex items-center gap-1.5 text-red-600">
                    <Wallet className="w-4 h-4" />
                    <span className="text-[12px] font-bold">
                      مصاريف أخرى — {safeNum(tx.expensesCost).toLocaleString()}{" "}
                      ر.س
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-center text-[11px] text-gray-500 font-bold py-2">
                    لا توجد مصاريف أخرى مسجلة
                  </div>
                </div>
              </div>

              {/* نتائج الحساب التلقائي */}
              <div
                className="rounded-xl border overflow-hidden shadow-sm"
                style={{ borderColor: "rgba(59, 130, 246, 0.2)" }}
              >
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{
                    backgroundColor: "rgba(59, 130, 246, 0.05)",
                    borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
                  }}
                >
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <Calculator className="w-4 h-4" />
                    <span className="text-[12px] font-bold">
                      نتائج الحساب التلقائي
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: "rgba(239, 68, 68, 0.06)" }}
                    >
                      <div className="text-red-700 text-[10px] font-bold">
                        إجمالي التكاليف
                      </div>
                      <div className="font-mono mt-1 text-[16px] font-black text-red-700">
                        {totalCosts.toLocaleString()}{" "}
                        <span className="text-[10px] font-normal">ر.س</span>
                      </div>
                    </div>
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: "rgba(34, 197, 94, 0.06)" }}
                    >
                      <div className="text-green-700 text-[10px] font-bold">
                        ربح تقديري
                      </div>
                      <div className="font-mono mt-1 text-[16px] font-black text-green-700">
                        {estimatedProfit.toLocaleString()}{" "}
                        <span className="text-[10px] font-normal">ر.س</span>
                      </div>
                    </div>
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: "rgba(59, 130, 246, 0.06)" }}
                    >
                      <div className="text-blue-700 text-[10px] font-bold">
                        خصم الاحتياطي (10%)
                      </div>
                      <div className="font-mono mt-1 text-[16px] font-black text-blue-700">
                        {reserveDeduction.toLocaleString()}{" "}
                        <span className="text-[10px] font-normal">ر.س</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div
                      className="p-4 rounded-lg flex items-center justify-between"
                      style={{
                        backgroundColor: "rgba(34, 197, 94, 0.1)",
                        border: "1px solid rgba(34, 197, 94, 0.2)",
                      }}
                    >
                      <div>
                        <div className="text-green-700 text-[11px] font-bold">
                          صافي قابل للتسوية
                        </div>
                        <div className="font-mono mt-0.5 text-xl font-black text-green-700">
                          {distributableProfit.toLocaleString()}{" "}
                          <span className="text-[11px] font-normal">ر.س</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("settlement")}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white font-bold text-[12px] flex items-center gap-1 hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4" /> تسوية
                      </button>
                    </div>
                    <div
                      className="p-4 rounded-lg flex items-center justify-between"
                      style={{
                        backgroundColor: "rgba(245, 158, 11, 0.08)",
                        border: "1px solid rgba(245, 158, 11, 0.2)",
                      }}
                    >
                      <div>
                        <div className="text-amber-700 text-[11px] font-bold">
                          ربح قابل للتوزيع
                        </div>
                        <div className="font-mono mt-0.5 text-xl font-black text-amber-700">
                          {availableForPartners.toLocaleString()}{" "}
                          <span className="text-[11px] font-normal">ر.س</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("profits")}
                        className="px-4 py-2 rounded-lg bg-amber-500 text-white font-bold text-[12px] flex items-center gap-1 hover:bg-amber-600 transition-colors"
                      >
                        <PieChart className="w-4 h-4" /> توزيع
                      </button>
                    </div>
                  </div>

                  <div
                    className="p-3 rounded-lg flex items-center justify-between"
                    style={{
                      backgroundColor: "rgba(168, 85, 247, 0.06)",
                      border: "1px solid rgba(168, 85, 247, 0.15)",
                    }}
                  >
                    <div>
                      <div className="text-[11px] font-bold text-purple-700 mb-0.5">
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
              </div>
            </div>
          )}

          {/* === 1.6. BROKERS (الوسطاء) === */}
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
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        الوسيط
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        الأتعاب
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        المدفوع
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        المتبقي
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        الحالة
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600 text-center">
                        إجراء
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.brokers?.length > 0 ? (
                      tx.brokers.map((b, i) => (
                        <tr
                          key={i}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-3 py-3 font-bold text-gray-800">
                            {b.name}
                          </td>
                          <td className="px-3 py-3 font-mono font-bold text-gray-800">
                            {safeNum(b.fees).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 font-mono font-bold text-green-600">
                            0
                          </td>
                          <td className="px-3 py-3 font-mono font-bold text-red-600">
                            {safeNum(b.fees).toLocaleString()}
                          </td>
                          <td className="px-3 py-3">
                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold">
                              غير مدفوع
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {/* 💡 ربط زر الحذف بالدالة الجديدة */}
                            <button
                              onClick={() => {
                                if (window.confirm("هل تريد إزالة هذا الوسيط؟"))
                                  deleteBrokerMutation.mutate(b.id);
                              }}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
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

          {/* === 2. AGENTS === */}
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
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة معقب</span>
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[12px] text-right">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        المعقب
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        الدور / المهمة
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        الأتعاب
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        الحالة
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600 text-center">
                        إجراء
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.agents?.length > 0 ? (
                      tx.agents.map((ag, i) => (
                        <tr
                          key={i}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-3 py-3 font-bold text-gray-800">
                            {ag.name}
                          </td>
                          <td className="px-3 py-3 text-gray-600">
                            {ag.role || "معقب"}
                          </td>
                          <td className="px-3 py-3 font-mono font-bold text-gray-800">
                            {safeNum(ag.fees).toLocaleString()}
                          </td>
                          <td className="px-3 py-3">
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                              قيد الانتظار
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button className="text-red-500 hover:bg-red-50 p-1.5 rounded">
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
                          لا يوجد معقبون مرتبطون بهذه المعاملة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === 3. REMOTE WORKERS === */}
          {activeTab === "remote" && (
            <div className="p-4 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--wms-text)] text-[14px] font-bold">
                    العاملون عن بعد (المهام)
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded text-[12px] font-bold bg-red-50 text-red-600 border border-red-100">
                    {safeNum(tx.remoteCost).toLocaleString()} ر.س
                  </span>
                </div>
                <button
                  onClick={() => setIsAddRemoteTaskOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-bold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تعيين مهمة جديدة</span>
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[12px] text-right">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        الموظف
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        وصف المهمة
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        التكلفة
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600">
                        الحالة
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-600 text-center">
                        إجراء
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.remoteTasks?.length > 0 ? (
                      tx.remoteTasks.map((rt, i) => (
                        <tr
                          key={i}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-3 py-3 font-bold text-gray-800">
                            {rt.workerName}
                          </td>
                          <td className="px-3 py-3 text-gray-600">
                            {rt.taskName}
                          </td>
                          <td className="px-3 py-3 font-mono font-bold text-gray-800">
                            {safeNum(rt.cost).toLocaleString()}
                          </td>
                          <td className="px-3 py-3">
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                              بانتظار الدفع
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button className="text-red-500 hover:bg-red-50 p-1.5 rounded">
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
                          لا توجد مهام عمل عن بعد مسجلة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === 4. PAYMENTS === */}
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
              <div className="flex items-center gap-3 text-[11px] bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-gray-500 font-bold">تقدم التحصيل:</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${collectionPercent}%` }}
                  ></div>
                </div>
                <span className="font-mono font-bold text-green-600">
                  {collectionPercent}%
                </span>
              </div>

              <div className="flex items-center justify-between mt-6 mb-2">
                <span className="text-[14px] font-bold text-gray-800">
                  دفعات التحصيل (من العميل)
                </span>
                <button
                  onClick={() => setIsAddPaymentOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-bold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة دفعة
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

          {/* === 5. SETTLEMENT === */}
          {activeTab === "settlement" && (
            <div className="p-4 space-y-4 animate-in fade-in">
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="text-gray-500 text-[11px] font-bold">
                    السعر المتفق الإجمالي
                  </div>
                  <div className="font-mono mt-1 text-lg font-black text-gray-800">
                    {totalFees.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-red-200 bg-red-50 shadow-sm">
                  <div className="text-red-700 text-[11px] font-bold">
                    إجمالي التكاليف
                  </div>
                  <div className="font-mono mt-1 text-lg font-black text-red-700">
                    {totalCosts.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-green-200 bg-green-50 shadow-sm">
                  <div className="text-green-700 text-[11px] font-bold">
                    ربح تقديري
                  </div>
                  <div className="font-mono mt-1 text-lg font-black text-green-700">
                    {estimatedProfit.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 shadow-sm">
                  <div className="text-blue-700 text-[11px] font-bold">
                    صافي قابل للتسوية
                  </div>
                  <div className="font-mono mt-1 text-xl font-black text-blue-700">
                    {distributableProfit.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between bg-green-50 border border-green-200 p-4 rounded-xl shadow-sm">
                <div>
                  <div className="text-green-800 font-bold text-[14px]">
                    الصافي الجاهز للتسوية وتوزيع الأرباح
                  </div>
                  <div className="text-gray-500 text-[11px] mt-1">
                    تأكد من تسوية جميع المصاريف والوسطاء قبل الاعتماد النهائي
                  </div>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-md transition-all">
                  <Check className="w-5 h-5" /> تنفيذ التسوية
                </button>
              </div>
            </div>
          )}

          {/* === 6. PROFITS === */}
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
              {/* Distribution Table */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-gray-800 text-[14px]">
                    توزيع الأرباح على الشركاء
                  </span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> المجموع 100%
                  </span>
                </div>
                <table className="w-full text-[12px] text-right border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="p-3 font-bold">الشريك</th>
                      <th className="p-3 font-bold">النسبة</th>
                      <th className="p-3 font-bold">المستحق (ر.س)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-purple-50/30">
                      <td className="p-3 font-bold text-purple-700 flex items-center gap-2">
                        <Crown className="w-4 h-4" /> المصدر:{" "}
                        {safeText(tx.sourceName || tx.source)}
                      </td>
                      <td className="p-3 font-mono font-bold text-purple-600">
                        {sourcePercent}%
                      </td>
                      <td className="p-3 font-mono font-bold text-purple-800">
                        {(
                          distributableProfit *
                          (sourcePercent / 100)
                        ).toLocaleString()}
                      </td>
                    </tr>
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

          {/* === 7. ATTACHMENTS === */}
          {activeTab === "attachments" && (
            <div className="p-5 space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-gray-800">
                  مرفقات المعاملة
                </span>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-bold shadow-sm cursor-pointer">
                  {uploadAttachmentMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
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
              <div className="grid grid-cols-2 gap-4">
                {(tx.attachments || []).map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center">
                        <Paperclip className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="text-[12px] font-bold text-gray-700 truncate w-40">
                        {file.name || `مرفق ${idx + 1}`}
                      </span>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-xs font-bold"
                    >
                      عرض
                    </a>
                  </div>
                ))}
                {(!tx.attachments || tx.attachments.length === 0) && (
                  <div className="col-span-2 text-center py-10 text-gray-400 font-bold border-2 border-dashed rounded-xl">
                    لا توجد مرفقات لهذه المعاملة
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === 9. COLLECTION DATES === */}
          {activeTab === "dates" && (
            <div className="p-5 space-y-5 animate-in fade-in">
              <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 shadow-sm">
                <div className="font-bold text-[13px] mb-3 text-blue-800">
                  إضافة موعد تحصيل جديد
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      تاريخ الموعد *
                    </label>
                    <input
                      type="date"
                      value={dateForm.date}
                      onChange={(e) =>
                        setDateForm({ ...dateForm, date: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      المبلغ المتوقع *
                    </label>
                    <input
                      type="number"
                      value={dateForm.amount}
                      onChange={(e) =>
                        setDateForm({ ...dateForm, amount: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded outline-none font-mono text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      المسؤول عن التحصيل
                    </label>
                    <input
                      type="text"
                      value={dateForm.person}
                      onChange={(e) =>
                        setDateForm({ ...dateForm, person: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded outline-none text-sm"
                      placeholder="اسم الموظف"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      ملاحظات (اختياري)
                    </label>
                    <input
                      type="text"
                      value={dateForm.notes}
                      onChange={(e) =>
                        setDateForm({ ...dateForm, notes: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded outline-none text-sm"
                      placeholder="ملاحظات..."
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => addDateMutation.mutate(dateForm)}
                    disabled={
                      !dateForm.date ||
                      !dateForm.amount ||
                      addDateMutation.isPending
                    }
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg text-xs font-bold disabled:opacity-50 shadow-sm"
                  >
                    {addDateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "إضافة الموعد للجدول"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================== */}
        {/* 💡 Sub-Modals Portals */}
        {/* ========================================================== */}

        {/* 1. Modal: إضافة دفعة تحصيل */}
        {isAddPaymentOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                <span className="font-bold flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-green-400" /> إضافة دفعة
                  تحصيل
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
                        setPaymentForm({
                          ...paymentForm,
                          method: e.target.value,
                        })
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

        {/* 2. Modal: إضافة معقب */}
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

        {/* 3. Modal: إضافة مهمة عمل عن بعد */}
        {isAddRemoteTaskOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                <span className="font-bold flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-400" /> تعيين مهمة لموظف
                  عن بعد
                </span>
                <button onClick={() => setIsAddRemoteTaskOpen(false)}>
                  <X className="w-4 h-4 hover:text-red-400" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600">
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
                    className="w-full border p-2 mt-1 rounded text-sm font-bold"
                  >
                    <option value="">-- اختر موظف عن بعد --</option>
                    {remoteWorkersList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="border p-3 rounded-lg bg-gray-50 space-y-2">
                  <label className="text-xs font-bold">المهام المطلوبة</label>
                  {remoteTaskForm.tasks.map((t, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        value={t.name}
                        onChange={(e) => {
                          const newT = [...remoteTaskForm.tasks];
                          newT[idx].name = e.target.value;
                          setRemoteTaskForm({ ...remoteTaskForm, tasks: newT });
                        }}
                        placeholder="اسم المهمة"
                        className="flex-1 border p-1.5 rounded text-xs"
                      />
                      <input
                        value={t.cost}
                        onChange={(e) => {
                          const newT = [...remoteTaskForm.tasks];
                          newT[idx].cost = e.target.value;
                          setRemoteTaskForm({ ...remoteTaskForm, tasks: newT });
                        }}
                        type="number"
                        placeholder="التكلفة"
                        className="w-24 border p-1.5 rounded text-xs font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                <button
                  onClick={() => setIsAddRemoteTaskOpen(false)}
                  className="px-4 py-1.5 border rounded bg-white text-sm font-bold"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => addRemoteTaskMutation.mutate(remoteTaskForm)}
                  disabled={
                    addRemoteTaskMutation.isPending || !remoteTaskForm.workerId
                  }
                  className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-bold disabled:opacity-50"
                >
                  حفظ المهمة
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal: إضافة وسيط */}
        {isAddBrokerModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                <span className="font-bold flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-blue-400" /> تعيين وسيط
                  للمعاملة
                </span>
                <button onClick={() => setIsAddBrokerModalOpen(false)}>
                  <X className="w-4 h-4 hover:text-red-400" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                    اختر الوسيط من القائمة *
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
                    أتعاب الوسيط المتفق عليها (ر.س) *
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
      </div>
    </div>
  );
};
