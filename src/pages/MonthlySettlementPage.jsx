import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Check,
  AlertTriangle,
  Info,
  Scale,
  Eye,
  Search,
  Handshake,
  UserCheck,
  Monitor,
  Users,
  Clock,
  CheckCircle2,
  FileText,
  Edit3,
  Save,
  X,
  Zap,
  ClipboardList,
  FastForward,
  Rewind,
  User,
  PackageCheck,
  Calculator,
  Loader2,
  Wallet,
} from "lucide-react";
import { TransactionDetailsModal } from "../components/TransactionDetails/components/TransactionDetailsModal";

const MONTHLY_UI = {
  TITLE: "مركز التسوية الشهرية (إغلاق الشهر)",
  BTN_EXPORT_REPORT: "تصدير التقرير",
  BTN_REVIEW: "مراجعة نهائية",
  BTN_APPROVE: "اعتماد الشهر",
  DISCLAIMER:
    "تنبيه: اعتماد التسوية الشهرية سيقوم بإغلاق جميع المعاملات المحددة وترحيل الأرصدة المتبقية إلى الشهر القادم. لا يمكن التراجع عن هذه الخطوة بعد التنفيذ.",
  MONTH_SELECTOR: "اختر شهر التسوية",
  PANEL_TX: "المعاملات",
  PANEL_MEDIATORS: "الوسطاء",
  PANEL_AGENTS: "المعقبين",
  PANEL_REMOTE: "العمل عن بعد",
  PANEL_PROFIT: "الشركاء",
  PANEL_HISTORY: "سجل التسويات",
};

const GREGORIAN_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const HIJRI_MONTHS = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الثاني",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
];

const SETTLEMENT_TYPE_LABELS = {
  quick: {
    label: "تسوية سريعة",
    desc: "تسوية آلية بدون تعديل",
    color: "var(--wms-success)",
  },
  detailed: {
    label: "تسوية تفصيلية",
    desc: "مراجعة وتعديل كل معاملة",
    color: "var(--wms-blue)",
  },
  advanced: {
    label: "تسوية مقدمة",
    desc: "تسوية قبل انتهاء الشهر",
    color: "var(--wms-warning)",
  },
  delayed: {
    label: "تسوية متأخرة",
    desc: "تسوية بعد الشهر",
    color: "var(--wms-danger)",
  },
};

const DELIVERY_STATUS_LABELS = {
  not_delivered: {
    label: "لم يتم التسليم",
    color: "var(--wms-danger)",
    bg: "rgba(239,68,68,0.12)",
  },
  partial_delivery: {
    label: "تسليم جزئي",
    color: "var(--wms-warning)",
    bg: "rgba(245,158,11,0.12)",
  },
  fully_delivered: {
    label: "تم التسليم كلياً",
    color: "var(--wms-success)",
    bg: "rgba(34,197,94,0.12)",
  },
};

const SETTLEMENT_STATUS_MAP = {
  pending: {
    label: "معلقة",
    bg: "rgba(245,158,11,0.12)",
    color: "var(--wms-warning)",
  },
  partial: {
    label: "جزئية",
    bg: "rgba(59,130,246,0.12)",
    color: "var(--wms-accent-blue)",
  },
  settled: {
    label: "مُسوّاة",
    bg: "rgba(34,197,94,0.12)",
    color: "var(--wms-success)",
  },
};

// ============================================================================
// 💡 Helpers
// ============================================================================
const maskName = (name) => name; // يمكنك إضافة دالة إخفاء هنا إذا أردت
const maskAmount = (amount) => amount;
const safeNum = (val) => (isNaN(Number(val)) ? 0 : Number(val));

export default function ScreenMonthlySettlement() {
  const queryClient = useQueryClient();

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  // State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [search, setSearch] = useState("");
  const [activePanel, setActivePanel] = useState("transactions");

  // Modals
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showIndividualModal, setShowIndividualModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedSettlementType, setSelectedSettlementType] = useState("quick");
  const [selectedPerson, setSelectedPerson] = useState(null);

  // Delivery Modal State
  const [deliveryAmount, setDeliveryAmount] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [deliveredBy, setDeliveredBy] = useState("مدير الحسابات");
  const [deliveredTo, setDeliveredTo] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isPartialDelivery, setIsPartialDelivery] = useState(false);
  const [deliveryPercentage, setDeliveryPercentage] = useState(50);
  const [deliveryCustomPercentage, setDeliveryCustomPercentage] = useState("");

  // 💡 2. استخراج refetch لتمريرها للمودال
  const {
    data: settlementData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["monthly-settlement", selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await api.get(
        `/finance/monthly-settlement?year=${selectedYear}&month=${selectedMonth}`,
      );
      return res.data?.data;
    },
  });

  // استخراج البيانات الجاهزة للواجهة
  const transactions = settlementData?.transactions || [];
  const summary = settlementData?.summary || {
    totalTx: 0,
    totalRevenue: 0,
    totalCollected: 0,
    outstanding: 0,
    totalCosts: 0,
    netProfit: 0,
  };
  const mediators = settlementData?.mediators || [];
  const agents = settlementData?.agents || [];
  const remoteWorkers = settlementData?.remoteWorkers || [];

  const filteredTx = transactions.filter(
    (t) =>
      !search ||
      t.ref.includes(search) ||
      t.owner.includes(search) ||
      t.district.includes(search),
  );

  const officeProfit = useMemo(() => {
    const reservePercent = 10;
    const reserveDeduction = Math.round(
      (summary.netProfit * reservePercent) / 100,
    );
    const finalProfit = summary.netProfit - reserveDeduction;
    return {
      revenue: summary.totalRevenue,
      costs: summary.totalCosts,
      net: summary.netProfit,
      reserve: reserveDeduction,
      final: finalProfit,
    };
  }, [summary]);

  const partnersWithCalc = [
    { name: "شريك 1 (المدير)", percent: 50 },
    { name: "شريك 2", percent: 30 },
    { name: "شريك 3", percent: 20 },
  ].map((p) => ({
    ...p,
    calculated: Math.round((officeProfit.final * p.percent) / 100),
    distributed: 0,
    remaining: Math.round((officeProfit.final * p.percent) / 100),
  }));

  const PANELS = [
    {
      id: "transactions",
      label: MONTHLY_UI.PANEL_TX,
      icon: FileText,
      count: summary.totalTx,
    },
    {
      id: "mediators",
      label: MONTHLY_UI.PANEL_MEDIATORS,
      icon: Handshake,
      count: mediators.length,
    },
    {
      id: "agents",
      label: MONTHLY_UI.PANEL_AGENTS,
      icon: UserCheck,
      count: agents.length,
    },
    {
      id: "remote",
      label: MONTHLY_UI.PANEL_REMOTE,
      icon: Monitor,
      count: remoteWorkers.length,
    },
    {
      id: "profit",
      label: MONTHLY_UI.PANEL_PROFIT,
      icon: Users,
      count: partnersWithCalc.length,
    },
    { id: "history", label: MONTHLY_UI.PANEL_HISTORY, icon: Clock, count: 0 },
  ];

  // ============================================================================
  // 💡 Mutations
  // ============================================================================
  const payPersonMutation = useMutation({
    mutationFn: async (payload) => api.post(`/finance/settlements`, payload),
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة والتسليم بنجاح!");
      queryClient.invalidateQueries(["persons-directory"]);
      queryClient.invalidateQueries(["private-transactions-full"]);
      closeDeliveryModal();
    },
    onError: () => toast.error("حدث خطأ أثناء تسجيل الدفعة"),
  });

  const handleDelivery = () => {
    if (!selectedPerson) return;
    const amount = parseFloat(deliveryAmount);
    if (!amount || !deliveryDate || !deliveredBy || !deliveredTo) {
      return toast.error("يرجى تعبئة جميع الحقول المطلوبة");
    }

    const roleNameAr =
      selectedPerson.type === "mediator"
        ? "وسيط"
        : selectedPerson.type === "agent"
          ? "معقب"
          : "موظف عن بعد";

    payPersonMutation.mutate({
      targetType: roleNameAr,
      targetId: selectedPerson.id,
      amount: amount,
      status: "DELIVERED",
      source: "التسوية الشهرية المجمعة",
      notes: `تسليم عبر التسوية الشهرية بواسطة ${deliveredBy} إلى ${deliveredTo}. ملاحظات: ${deliveryNotes}`,
    });
  };

  const openIndividualSettlement = (person) => {
    setSelectedPerson(person);
    setShowIndividualModal(true);
  };

  const openDeliveryModal = (person) => {
    setSelectedPerson(person);
    setDeliveryAmount(String(person.remaining));
    setDeliveredTo(person.name);
    setIsPartialDelivery(false);
    setDeliveryPercentage(50);
    setDeliveryCustomPercentage("");
    setShowDeliveryModal(true);
  };

  const closeDeliveryModal = () => {
    setShowDeliveryModal(false);
    setSelectedPerson(null);
    setDeliveryAmount("");
    setDeliveryNotes("");
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div
      className="space-y-2 p-3 bg-[var(--wms-bg-0)] min-h-screen font-sans"
      dir="rtl"
      id="screen-monthly-settlement"
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-blue-600" />
          <h2 className="text-gray-800 font-bold text-[15px]">
            {MONTHLY_UI.TITLE}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.success("جارٍ التصدير...")}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md text-xs font-bold text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-3.5 h-3.5" />{" "}
            <span>{MONTHLY_UI.BTN_EXPORT_REPORT}</span>
          </button>
          <button
            onClick={() => setShowExecuteModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-bold shadow-sm hover:bg-blue-700"
          >
            <Check className="w-3.5 h-3.5" />{" "}
            <span>{MONTHLY_UI.BTN_APPROVE}</span>
          </button>
        </div>
      </div>

      {/* Month Selection & Summary Cards */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-gray-800 text-[13px] font-bold">
              {MONTHLY_UI.MONTH_SELECTOR}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="font-mono text-sm font-bold w-12 text-center">
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-6 lg:grid-cols-12 gap-2 mb-4">
          {GREGORIAN_MONTHS.map((gMonth, idx) => {
            const monthNum = idx + 1;
            const isSelected = monthNum === selectedMonth;
            return (
              <button
                key={monthNum}
                onClick={() => setSelectedMonth(monthNum)}
                className={`p-2 rounded-lg border text-center transition-all ${isSelected ? "bg-blue-600 border-blue-600 text-white shadow-md" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300"}`}
              >
                <div className="font-bold text-[11px] mb-0.5">{gMonth}</div>
                <div
                  className={`text-[9px] ${isSelected ? "text-blue-100" : "text-gray-400"}`}
                >
                  {HIJRI_MONTHS[idx]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-3">
          {[
            {
              label: "المعاملات",
              value: summary.totalTx,
              color: "text-blue-600",
              bg: "bg-blue-50",
              border: "border-blue-100",
            },
            {
              label: "الإيرادات",
              value: summary.totalRevenue,
              color: "text-green-600",
              bg: "bg-green-50",
              border: "border-green-100",
            },
            {
              label: "المُحصّل",
              value: summary.totalCollected,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
              border: "border-emerald-100",
            },
            {
              label: "المتبقي",
              value: summary.outstanding,
              color: "text-amber-600",
              bg: "bg-amber-50",
              border: "border-amber-100",
            },
            {
              label: "صافي الربح",
              value: summary.netProfit,
              color: "text-purple-600",
              bg: "bg-purple-50",
              border: "border-purple-100",
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border ${item.bg} ${item.border}`}
            >
              <div className="text-gray-500 text-[10px] font-bold mb-1">
                {item.label}
              </div>
              <div className={`font-mono text-[16px] font-black ${item.color}`}>
                {item.value.toLocaleString()}{" "}
                {i > 0 && <span className="text-[9px] font-normal">ر.س</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-lg px-2 pt-2">
        {PANELS.map((panel) => {
          const Icon = panel.icon;
          const isActive = activePanel === panel.id;
          return (
            <button
              key={panel.id}
              onClick={() => setActivePanel(panel.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-md text-[12px] font-bold border-b-2 transition-colors ${isActive ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}
            >
              <Icon className="w-4 h-4" />
              <span>{panel.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}
              >
                {panel.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      {["transactions", "mediators", "agents", "remote"].includes(
        activePanel,
      ) && (
        <div className="bg-white p-2 border-x border-gray-200 flex items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الرقم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pr-9 pl-3 py-1.5 text-xs outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. Transactions Panel */}
      {activePanel === "transactions" && (
        <div className="bg-white border border-gray-200 rounded-b-lg overflow-hidden shadow-sm">
          <table className="w-full text-right text-[11px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "الرقم",
                  "المالك",
                  "الحي",
                  "الوسيط",
                  "المعقب",
                  "القيمة الكلية",
                  "المُحصّل",
                  "المتبقي",
                  "التكاليف",
                  "الربح",
                  "الحالة",
                  "إجراءات", // 👈 1. تمت إضافة عنوان العمود هنا
                ].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-bold text-gray-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTx.length === 0 ? (
                <tr>
                  <td
                    colSpan="12"
                    className="text-center py-8 text-gray-400 font-bold"
                  >
                    لا توجد معاملات في هذا الشهر
                  </td>
                </tr>
              ) : (
                filteredTx.map((tx, i) => (
                  <tr
                    key={tx.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                  >
                    <td className="px-3 py-2.5 font-mono text-blue-600 font-bold">
                      {tx.ref}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-gray-800">
                      {tx.owner}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{tx.district}</td>
                    <td className="px-3 py-2.5 text-gray-500">{tx.mediator}</td>
                    <td className="px-3 py-2.5 text-gray-500">{tx.agent}</td>
                    <td className="px-3 py-2.5 font-mono font-bold">
                      {tx.totalPrice.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-green-600">
                      {tx.collected.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-red-500">
                      {tx.remaining > 0 ? tx.remaining.toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-gray-600">
                      {tx.totalCosts.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-black text-blue-800">
                      {tx.netProfit.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="px-2 py-1 rounded text-[10px] font-bold"
                        style={{
                          backgroundColor: SETTLEMENT_STATUS_MAP[tx.status].bg,
                          color: SETTLEMENT_STATUS_MAP[tx.status].color,
                        }}
                      >
                        {SETTLEMENT_STATUS_MAP[tx.status].label}
                      </span>
                    </td>

                    {/* 👈 2. خلية الأزرار والإجراءات */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            // 💡 3. تمرير المعاملة المحددة وفتح المودال
                            setSelectedTx({ id: tx.id });
                            setIsTxModalOpen(true);
                          }}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. Mediators & Agents & Remote (Reusable Panel) */}
      {["mediators", "agents", "remote"].includes(activePanel) && (
        <div className="bg-white border border-gray-200 rounded-b-lg overflow-hidden shadow-sm">
          <table className="w-full text-right text-[11px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "الاسم",
                  activePanel === "remote" ? "عدد المهام" : "المعاملات",
                  "إجمالي الأتعاب",
                  "المدفوع",
                  "المتبقي",
                  "حالة التسليم",
                  "إجراء",
                ].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-bold text-gray-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(activePanel === "mediators"
                ? mediators
                : activePanel === "agents"
                  ? agents
                  : remoteWorkers
              ).map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                >
                  <td className="px-3 py-3 font-bold text-gray-800">
                    {p.name}
                  </td>
                  <td className="px-3 py-3 text-gray-600 font-bold">
                    {p.txCount || p.tasks}
                  </td>
                  <td className="px-3 py-3 font-mono font-bold">
                    {p.totalFees.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 font-mono font-bold text-green-600">
                    {p.paid.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 font-mono font-bold text-red-500">
                    {p.remaining > 0 ? p.remaining.toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className="px-2 py-1 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor:
                          DELIVERY_STATUS_LABELS[p.deliveryStatus].bg,
                        color: DELIVERY_STATUS_LABELS[p.deliveryStatus].color,
                      }}
                    >
                      {DELIVERY_STATUS_LABELS[p.deliveryStatus].label}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openIndividualSettlement(p)}
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-colors"
                        title="كشف حساب"
                      >
                        <User className="w-3.5 h-3.5" />
                      </button>
                      {p.remaining > 0 && (
                        <button
                          onClick={() => openDeliveryModal(p)}
                          className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white rounded text-[10px] font-bold transition-colors"
                        >
                          <PackageCheck className="w-3 h-3" /> سداد
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. Profit Panel */}
      {activePanel === "profit" && (
        <div className="space-y-4 bg-white p-4 border border-gray-200 rounded-b-lg shadow-sm">
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
            <h3 className="text-blue-800 font-bold text-sm mb-3 border-b border-blue-100 pb-2">
              ملخص أرباح المكتب ({GREGORIAN_MONTHS[selectedMonth - 1]})
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {[
                { l: "الإيرادات", v: officeProfit.revenue, c: "text-blue-600" },
                { l: "التكاليف", v: officeProfit.costs, c: "text-red-500" },
                { l: "الصافي", v: officeProfit.net, c: "text-emerald-600" },
                {
                  l: "الاحتياطي (10%)",
                  v: officeProfit.reserve,
                  c: "text-amber-500",
                },
                {
                  l: "الربح للتوزيع",
                  v: officeProfit.final,
                  c: "text-purple-600",
                },
              ].map((x) => (
                <div key={x.l}>
                  <div className="text-gray-500 text-[10px] font-bold mb-1">
                    {x.l}
                  </div>
                  <div className={`font-mono text-lg font-black ${x.c}`}>
                    {x.v.toLocaleString()}{" "}
                    <span className="text-[9px]">ر.س</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-right text-[11px]">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  {[
                    "الشريك",
                    "النسبة",
                    "المبلغ المستحق",
                    "المدفوع",
                    "المتبقي",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 font-bold text-gray-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partnersWithCalc.map((p, i) => (
                  <tr key={i} className="border-b border-gray-100 bg-white">
                    <td className="px-4 py-3 font-bold text-gray-800">
                      {p.name}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      {p.percent}%
                    </td>
                    <td className="px-4 py-3 font-mono font-black text-gray-800">
                      {p.calculated.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-green-600">
                      {p.distributed.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-red-500">
                      {p.remaining > 0 ? p.remaining.toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 💡 Modals */}

      {/* 1. Modal: Delivery (السداد الجزئي أو الكلي) */}
      {showDeliveryModal && selectedPerson && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-emerald-700 px-5 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-300" /> تسديد
                  مستحقات مالية
                </h3>
                <span className="text-[10px] text-emerald-200 mt-1 block">
                  لصالح: {selectedPerson.name}
                </span>
              </div>
              <button
                onClick={closeDeliveryModal}
                className="hover:bg-white/20 p-1.5 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center justify-between">
                <span className="text-orange-800 text-xs font-bold">
                  المبلغ المستحق (المتبقي):
                </span>
                <span className="font-mono text-xl font-black text-orange-600">
                  {selectedPerson.remaining.toLocaleString()} ر.س
                </span>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-blue-600 w-4 h-4"
                    checked={isPartialDelivery}
                    onChange={(e) => {
                      setIsPartialDelivery(e.target.checked);
                      if (!e.target.checked)
                        setDeliveryAmount(String(selectedPerson.remaining));
                      else
                        setDeliveryAmount(
                          String(Math.round(selectedPerson.remaining * 0.5)),
                        );
                    }}
                  />
                  <span className="text-sm font-bold text-gray-800">
                    تسديد جزء من المبلغ فقط (نسبة محددة)
                  </span>
                </label>

                {isPartialDelivery && (
                  <div className="space-y-3 pt-2 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-2">
                      {[25, 50, 75].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => {
                            setDeliveryPercentage(pct);
                            setDeliveryCustomPercentage("");
                            setDeliveryAmount(
                              String(
                                Math.round(
                                  selectedPerson.remaining * (pct / 100),
                                ),
                              ),
                            );
                          }}
                          className={`py-2 rounded-lg text-xs font-bold transition-all border ${deliveryPercentage === pct ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"}`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={deliveryCustomPercentage}
                        placeholder="نسبة مخصصة..."
                        onChange={(e) => {
                          setDeliveryCustomPercentage(e.target.value);
                          const p = parseFloat(e.target.value) || 0;
                          if (p > 0 && p <= 100) {
                            setDeliveryPercentage("");
                            setDeliveryAmount(
                              String(
                                Math.round(
                                  selectedPerson.remaining * (p / 100),
                                ),
                              ),
                            );
                          }
                        }}
                        className="flex-1 border p-2 rounded-lg text-sm font-mono outline-none focus:border-blue-500"
                      />
                      <span className="font-bold text-gray-500">%</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  المبلغ الفعلي للدفع (ر.س) *
                </label>
                <input
                  type="number"
                  value={deliveryAmount}
                  onChange={(e) => setDeliveryAmount(e.target.value)}
                  disabled={isPartialDelivery}
                  className="w-full border border-gray-300 p-3 rounded-xl text-lg font-mono font-bold text-blue-700 focus:border-blue-500 outline-none disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  تاريخ الدفع
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none resize-none h-20"
                  placeholder="رقم الحوالة، طريقة الدفع..."
                ></textarea>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
              <button
                onClick={closeDeliveryModal}
                className="px-5 py-2 bg-white border rounded-lg text-xs font-bold text-gray-600"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelivery}
                disabled={payPersonMutation.isPending}
                className="px-8 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {payPersonMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                تأكيد السداد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Execute Monthly Settlement */}
      {showExecuteModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-800 px-5 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-400" /> تنفيذ وإغلاق التسوية
                الشهرية
              </h3>
              <button
                onClick={() => setShowExecuteModal(false)}
                className="hover:bg-white/20 p-1.5 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800 text-xs font-bold leading-relaxed">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                إغلاق الشهر يعني قفل التعديلات على المعاملات المحددة وترحيل
                الأرصدة. هل أنت متأكد من مراجعة كافة المبالغ؟
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">
                  نوع الاعتماد
                </label>
                <div className="space-y-2">
                  {Object.entries(SETTLEMENT_TYPE_LABELS).map(([key, val]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors ${selectedSettlementType === key ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
                    >
                      <input
                        type="radio"
                        checked={selectedSettlementType === key}
                        onChange={() => setSelectedSettlementType(key)}
                        className="accent-blue-600 w-4 h-4"
                      />
                      <div>
                        <div className="font-bold text-sm text-gray-800">
                          {val.label}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {val.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowExecuteModal(false)}
                className="px-5 py-2 bg-white border rounded-lg text-xs font-bold text-gray-600"
              >
                تراجع
              </button>
              <button
                onClick={() => {
                  toast.success("تم الإغلاق بنجاح");
                  setShowExecuteModal(false);
                }}
                className="px-8 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700"
              >
                اعتماد وإغلاق الشهر
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* 💡 نافذة تفاصيل المعاملة الشاملة */}
      {/* ========================================================= */}
      {isTxModalOpen && selectedTx && (
        <TransactionDetailsModal
          isOpen={isTxModalOpen}
          onClose={() => {
            setIsTxModalOpen(false);
            setSelectedTx(null);
          }}
          tx={selectedTx}
          refetchTable={refetch}
        />
      )}
    </div>
  );
}
