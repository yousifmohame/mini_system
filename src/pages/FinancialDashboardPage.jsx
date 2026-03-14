import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  DollarSign,
  Receipt,
  FileText,
  Download,
  Vault,
  Landmark,
  TriangleAlert,
  ArrowUpRight,
  Info,
  Loader2,
  RefreshCw,
  X,
  Save,
  CheckCircle2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// 💡 استيراد نافذة إنشاء المعاملة (تأكد من مسارها في مشروعك)
import { CreateTransactionModal } from "../components/CreateTransactionModal";

// ==========================================
// 💡 دوال مساعدة لحماية الصفحة من الانهيار
// ==========================================
const safeText = (val) => {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object")
    return val.ar || val.name || val.en || JSON.stringify(val);
  return val;
};

const safeNum = (val) => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

// ==========================================
// 💡 المكون الرئيسي
// ==========================================
const FinancialDashboardPage = () => {
  const queryClient = useQueryClient();

  // ----------------------------------------
  // 1. States للنوافذ المنبثقة (Modals)
  // ----------------------------------------
  const [isCreateTxOpen, setIsCreateTxOpen] = useState(false);
  const [isQuickPaymentOpen, setIsQuickPaymentOpen] = useState(false);
  const [isQuickCollectionOpen, setIsQuickCollectionOpen] = useState(false);
  const [isQuickSettlementOpen, setIsQuickSettlementOpen] = useState(false);

  // States لنموذج الدفع
  const [payForm, setPayForm] = useState({
    targetId: "",
    amount: "",
    method: "بنكي",
    accountId: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // States لنموذج التحصيل
  const [colForm, setColForm] = useState({
    transactionId: "",
    amount: "",
    method: "بنكي",
    accountId: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // States لنموذج التسوية
  const [setForm, setSetForm] = useState({
    personId: "",
    amount: "",
    type: "دائن",
    notes: "",
  });

  // ----------------------------------------
  // 2. API Queries (جلب البيانات الحقيقية)
  // ----------------------------------------

  // أ. جلب بيانات الداشبورد الرئيسية
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["financial-dashboard-full"],
    queryFn: async () => {
      const res = await api.get("/financial-dashboard");
      return res.data?.data;
    },
    refetchInterval: 120000,
  });

  // ب. جلب الأشخاص (للقوائم المنسدلة في الدفع والتسوية)
  const { data: persons = [], isLoading: isPersonsLoading } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => {
      const res = await api.get("/persons");
      return res.data?.data || [];
    },
  });

  // ج. جلب المعاملات (للقوائم المنسدلة في التحصيل)
  const { data: transactions = [], isLoading: isTxLoading } = useQuery({
    queryKey: ["private-transactions-list"],
    queryFn: async () => {
      const res = await api.get("/private-transactions?limit=100");
      return res.data?.data || [];
    },
  });

  // د. جلب الحسابات البنكية (للقوائم المنسدلة)
  const { data: bankAccounts = [], isLoading: isBanksLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const res = await api.get("/bank-accounts");
      return res.data?.data || [];
    },
  });

  // ----------------------------------------
  // 3. API Mutations (إرسال البيانات للباك إند)
  // ----------------------------------------

  // تسجيل دفعة (منصرف)
  const paymentMutation = useMutation({
    mutationFn: async (payload) => await api.post("/finance/payments", payload),
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة بنجاح");
      setIsQuickPaymentOpen(false);
      setPayForm({
        targetId: "",
        amount: "",
        method: "بنكي",
        accountId: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      refetch();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ أثناء حفظ الدفعة"),
  });

  // تسجيل تحصيل
  const collectionMutation = useMutation({
    mutationFn: async (payload) =>
      await api.post("/private-transactions/payments", payload),
    onSuccess: () => {
      toast.success("تم تسجيل التحصيل بنجاح");
      setIsQuickCollectionOpen(false);
      setColForm({
        transactionId: "",
        amount: "",
        method: "بنكي",
        accountId: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      refetch();
      // 💡 إصلاح التحذير: استخدام الصيغة الصحيحة لـ React Query v5
      queryClient.invalidateQueries({
        queryKey: ["private-transactions-full"],
      });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ أثناء حفظ التحصيل"),
  });

  // إنشاء تسوية
  const settlementMutation = useMutation({
    mutationFn: async (payload) =>
      await api.post("/finance/settlements", payload),
    onSuccess: () => {
      toast.success("تم إنشاء قيد التسوية بنجاح");
      setIsQuickSettlementOpen(false);
      setSetForm({ personId: "", amount: "", type: "دائن", notes: "" });
      refetch();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ أثناء حفظ التسوية"),
  });

  // ----------------------------------------
  // 4. Handlers (إرسال البيانات الصحيحة للباك إند)
  // ----------------------------------------

  const handleSavePayment = () => {
    if (!payForm.targetId || !payForm.amount)
      return toast.error("يرجى اختيار المستفيد وإدخال المبلغ");
    if (payForm.method === "بنكي" && !payForm.accountId)
      return toast.error("يرجى تحديد الحساب البنكي");

    // 💡 تم إضافة targetType لمنع الخطأ 500
    paymentMutation.mutate({
      targetType: "شخص",
      targetId: payForm.targetId,
      amount: payForm.amount,
      method: payForm.method,
      bankAccountId: payForm.accountId,
      date: payForm.date,
      notes: payForm.notes,
    });
  };

  const handleSaveCollection = () => {
    if (!colForm.transactionId || !colForm.amount)
      return toast.error("يرجى اختيار المعاملة وإدخال المبلغ");
    if (colForm.method === "بنكي" && !colForm.accountId)
      return toast.error("يرجى تحديد الحساب البنكي");

    collectionMutation.mutate({
      transactionId: colForm.transactionId,
      amount: colForm.amount,
      method: colForm.method,
      bankAccountId: colForm.accountId,
      date: colForm.date,
      notes: colForm.notes,
    });
  };

  const handleSaveSettlement = () => {
    if (!setForm.personId || !setForm.amount)
      return toast.error("يرجى اختيار الطرف وإدخال المبلغ");

    // 💡 تم إضافة targetType لمنع الخطأ 500
    settlementMutation.mutate({
      targetType: "شخص",
      targetId: setForm.personId,
      amount: setForm.amount,
      source: setForm.type, // لتحديد دائن أم مدين
      notes: setForm.notes,
    });
  };

  // ----------------------------------------
  // 5. Loading & Error States
  // ----------------------------------------
  if (isDashboardLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 font-bold text-sm">
          جاري تجميع الإحصائيات المالية المباشرة...
        </p>
      </div>
    );
  }

  if (isError || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 bg-slate-50">
        <TriangleAlert className="w-12 h-12 mb-4" />
        <p className="font-bold text-lg">
          حدث خطأ أثناء جلب بيانات لوحة التحكم المالية
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const {
    kpis,
    upcomingObligations = [],
    expectedCollections = [],
    profitabilityAnalysis = [],
    undistributedProfits = [],
    chartData = [],
    riskAlerts = [],
  } = dashboardData;

  // ----------------------------------------
  // 6. Main Render
  // ----------------------------------------
  return (
    <div
      className="p-4 space-y-4 overflow-y-auto custom-scrollbar-slim h-full bg-slate-50/50 animate-in fade-in duration-500 font-sans"
      dir="rtl"
      id="finance-dashboard-content"
    >
      {/* استدعاء نافذة المعاملة الجديدة */}
      {isCreateTxOpen && (
        <CreateTransactionModal
          isOpen={isCreateTxOpen}
          onClose={() => setIsCreateTxOpen(false)}
          refetchTable={refetch}
        />
      )}

      {/* ========================================== */}
      {/* 👑 Header & Refresh Button */}
      {/* ========================================== */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <LineChart className="w-5 h-5 text-blue-600" />
          </div>
          <span className="font-black text-lg text-gray-800">
            مركز التحكم المالي الشامل
          </span>
        </div>
        <button
          onClick={() => {
            refetch();
            toast.success("تم تحديث البيانات بنجاح");
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors shadow-sm"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefetching ? "animate-spin text-blue-600" : ""}`}
          />
          تحديث البيانات
        </button>
      </div>

      {/* ========================================== */}
      {/* 1. KPIs Top Grid */}
      {/* ========================================== */}
      <div className="grid grid-cols-9 gap-2">
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-gray-500 text-[10px] font-bold mb-1">
            المعاملات النشطة
          </div>
          <div className="font-mono text-[16px] font-black text-blue-600">
            {safeNum(kpis?.activeTxs)}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-gray-500 text-[10px] font-bold mb-1">
            الإيرادات المتوقعة
          </div>
          <div className="font-mono text-[16px] font-black text-gray-800">
            {safeNum(kpis?.expectedRevenue).toLocaleString()}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-green-700 text-[10px] font-bold mb-1">
            الإيرادات المحصّلة
          </div>
          <div className="font-mono text-[16px] font-black text-green-700 flex gap-1 items-center">
            {safeNum(kpis?.collectedRevenue).toLocaleString()}{" "}
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-amber-700 text-[10px] font-bold mb-1">
            الإيرادات المعلّقة
          </div>
          <div className="font-mono text-[16px] font-black text-amber-700">
            {safeNum(kpis?.pendingRevenue).toLocaleString()}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-red-700 text-[10px] font-bold mb-1">
            إجمالي التكاليف
          </div>
          <div className="font-mono text-[16px] font-black text-red-700 flex gap-1 items-center">
            {safeNum(kpis?.totalCosts).toLocaleString()}{" "}
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-emerald-800 text-[10px] font-bold mb-1">
            ربح تقديري
          </div>
          <div className="font-mono text-[16px] font-black text-emerald-700 flex gap-1 items-center">
            {safeNum(kpis?.estimatedProfit).toLocaleString()}{" "}
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-gray-500 text-[10px] font-bold mb-1">
            رصيد الاحتياطي
          </div>
          <div className="font-mono text-[16px] font-black text-blue-700">
            {safeNum(kpis?.reserveBalance).toLocaleString()}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-gray-500 text-[10px] font-bold mb-1">
            رصيد الخزنة
          </div>
          <div className="font-mono text-[16px] font-black text-orange-600">
            {safeNum(kpis?.treasuryBalance).toLocaleString()}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-gray-500 text-[10px] font-bold mb-1">
            رصيد البنوك
          </div>
          <div className="font-mono text-[16px] font-black text-green-600">
            {safeNum(kpis?.bankBalance).toLocaleString()}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. Toolbar Actions */}
      {/* ========================================== */}
      <div className="flex items-center gap-2 flex-wrap bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <button
          onClick={() => setIsCreateTxOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md font-bold text-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> <span>معاملة جديدة</span>
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        <button
          onClick={() => setIsQuickPaymentOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white font-bold text-xs transition-colors"
        >
          <DollarSign className="w-4 h-4" /> <span>تسجيل دفعة</span>
        </button>

        <button
          onClick={() => setIsQuickCollectionOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white font-bold text-xs transition-colors"
        >
          <Receipt className="w-4 h-4" /> <span>تسجيل تحصيل</span>
        </button>

        <button
          onClick={() => setIsQuickSettlementOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-600 hover:text-white font-bold text-xs transition-colors"
        >
          <FileText className="w-4 h-4" /> <span>إنشاء تسوية</span>
        </button>

        <div className="flex-1"></div>

        <button
          onClick={() => {
            window.print();
            toast.success("جاري تجهيز التقرير...");
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 font-bold text-xs shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" /> <span>تصدير وطباعة</span>
        </button>
      </div>

      {/* ========================================== */}
      {/* 3. Middle Tables Grid (Obligations & Collections) */}
      {/* ========================================== */}
      <div className="grid grid-cols-2 gap-4">
        {/* Obligations Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
            <span className="text-gray-800 text-sm font-black">
              الالتزامات المالية القادمة (أوامر صرف وتسويات)
            </span>
            <span className="bg-white border border-gray-200 text-gray-500 font-mono text-xs px-2 py-1 rounded-md font-bold">
              {upcomingObligations.length} التزام
            </span>
          </div>
          <div className="overflow-x-auto min-h-[160px] max-h-[250px] custom-scrollbar-slim">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-gray-600 font-bold">التاريخ</th>
                  <th className="px-4 py-3 text-gray-600 font-bold">المرجع</th>
                  <th className="px-4 py-3 text-gray-600 font-bold">
                    المستفيد/الجهة
                  </th>
                  <th className="px-4 py-3 text-gray-600 font-bold">المبلغ</th>
                  <th className="px-4 py-3 text-gray-600 font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {upcomingObligations.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-10 text-gray-400 font-bold"
                    >
                      لا توجد التزامات متأخرة أو قادمة
                    </td>
                  </tr>
                ) : (
                  upcomingObligations.map((item, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-500 font-mono">
                        {safeText(item.date)}
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-mono font-bold">
                        {safeText(item.ref)}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-bold">
                        {safeText(item.owner)}
                      </td>
                      <td className="px-4 py-3 font-mono font-black text-red-600">
                        {safeNum(item.total).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded-md font-bold text-[10px] ${item.status === "متأخر" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {safeText(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Collections Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
            <span className="text-gray-800 text-sm font-black">
              التحصيلات المتوقعة (ديون العملاء)
            </span>
            <span className="bg-white border border-gray-200 text-gray-500 font-mono text-xs px-2 py-1 rounded-md font-bold">
              {expectedCollections.length} تحصيل
            </span>
          </div>
          <div className="overflow-x-auto min-h-[160px] max-h-[250px] custom-scrollbar-slim">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-gray-600 font-bold">التاريخ</th>
                  <th className="px-4 py-3 text-gray-600 font-bold">
                    المعاملة
                  </th>
                  <th className="px-4 py-3 text-gray-600 font-bold">العميل</th>
                  <th className="px-4 py-3 text-gray-600 font-bold">المتوقع</th>
                  <th className="px-4 py-3 text-gray-600 font-bold">المتبقي</th>
                  <th className="px-4 py-3 text-gray-600 font-bold">الوسيط</th>
                </tr>
              </thead>
              <tbody>
                {expectedCollections.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-10 text-gray-400 font-bold"
                    >
                      لا توجد ديون أو تحصيلات معلقة
                    </td>
                  </tr>
                ) : (
                  expectedCollections.map((item, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-500 font-mono">
                        {safeText(item.date)}
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-mono font-bold">
                        {safeText(item.ref)}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-bold">
                        {safeText(item.owner)}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700 font-bold">
                        {safeNum(item.expected).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono font-black text-red-600">
                        {safeNum(item.remaining).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-[11px] font-bold">
                        {safeText(item.broker)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 4. Bottom 12-Col Grid (Profitability, Risk, Reserve) */}
      {/* ========================================== */}
      <div className="grid grid-cols-12 gap-4">
        {/* Profitability (Col 5) */}
        <div className="col-span-5 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
            <span className="text-gray-800 text-sm font-black">
              تحليل الربحية (للمعاملات)
            </span>
          </div>
          <div className="overflow-x-auto max-h-[300px] custom-scrollbar-slim">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-gray-600 font-bold">
                    المعاملة
                  </th>
                  <th className="px-4 py-3 text-gray-600 font-bold">المالك</th>
                  <th className="px-4 py-3 text-gray-600 font-bold">الإيراد</th>
                  <th className="px-4 py-3 text-gray-600 font-bold">
                    التكاليف
                  </th>
                  <th className="px-4 py-3 text-gray-600 font-bold">الربح</th>
                  <th className="px-4 py-3 text-gray-600 font-bold">الهامش</th>
                </tr>
              </thead>
              <tbody>
                {profitabilityAnalysis.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-10 text-gray-400 font-bold"
                    >
                      لا توجد بيانات ربحية كافية
                    </td>
                  </tr>
                ) : (
                  profitabilityAnalysis.map((item, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-blue-600 font-mono font-bold">
                        {safeText(item.ref)}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-bold">
                        {safeText(item.owner)}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700 font-bold">
                        {safeNum(item.revenue).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-red-600 font-bold">
                        {safeNum(item.costs).toLocaleString()}
                      </td>
                      <td
                        className={`px-4 py-3 font-mono font-black ${safeNum(item.profit) < 0 ? "text-red-600" : "text-green-600"}`}
                      >
                        {safeNum(item.profit).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded-md font-mono font-bold text-[10px] ${safeNum(item.profit) < 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                        >
                          {safeText(item.margin)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Monitoring (Col 4) */}
        <div className="col-span-4 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50/50">
            <TriangleAlert className="w-4 h-4 text-orange-500" />
            <span className="text-gray-800 text-sm font-black">
              مراقبة المخاطر الآلية
            </span>
          </div>
          <div className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar-slim">
            {riskAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-6 text-gray-400">
                <CheckCircle2 className="w-8 h-8 mb-2 text-green-400 opacity-50" />
                <span className="font-bold text-sm">
                  مؤشرات الخطر ممتازة ولا توجد تنبيهات
                </span>
              </div>
            ) : (
              riskAlerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100 border-r-4 border-r-red-500"
                >
                  <TriangleAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span className="text-red-900 text-xs leading-relaxed font-bold flex-1">
                    {safeText(alert)}
                  </span>
                  <ArrowUpRight className="w-4 h-4 shrink-0 text-red-400" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reserve Monitoring (Col 3) */}
        <div className="col-span-3 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
            <span className="text-gray-800 text-sm font-black">
              مراقبة الاحتياطي
            </span>
          </div>
          <div className="p-6 space-y-6 text-center flex-1 flex flex-col justify-center">
            <div>
              <div className="text-gray-500 text-xs font-bold mb-2">
                الرصيد المخصص الحالي
              </div>
              <div className="font-mono text-4xl font-black text-blue-600">
                {safeNum(kpis?.reserveBalance).toLocaleString()}
              </div>
              <div className="text-gray-400 text-[10px] mt-1 font-bold">
                ريال سعودي
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <div className="text-gray-500 text-[10px] font-bold mb-1">
                  النقدي (خزنة)
                </div>
                <div className="font-mono text-gray-800 text-sm font-black">
                  {safeNum(kpis?.treasuryBalance).toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                <div className="text-green-700 text-[10px] font-bold mb-1">
                  حسابات البنوك
                </div>
                <div className="font-mono text-green-700 text-sm font-black">
                  {safeNum(kpis?.bankBalance).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 5. Bottom Most Section (Chart & Profits) */}
      {/* ========================================== */}
      <div className="grid grid-cols-2 gap-4">
        {/* Cash Flow Chart */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50/50">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <span className="text-gray-800 text-sm font-black">
              التدفق المالي الفعلي (آخر 6 أشهر)
            </span>
          </div>
          <div className="p-4 h-[250px] min-h-[250px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#6b7280", fontWeight: "bold" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280", fontWeight: "bold" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                    direction: "rtl",
                    fontWeight: "bold",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    paddingTop: "10px",
                  }}
                />
                <Line
                  type="monotone"
                  name="الإيرادات"
                  dataKey="الإيرادات"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#16a34a" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  name="التكاليف"
                  dataKey="التكاليف"
                  stroke="#dc2626"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#dc2626" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Undistributed Profits */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
            <span className="text-gray-800 text-sm font-black">
              الأرباح غير الموزّعة للشركاء
            </span>
          </div>
          <div className="overflow-x-auto max-h-[250px] custom-scrollbar-slim">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-gray-600 font-bold">المرجع</th>
                  <th className="px-4 py-3 text-gray-600 font-bold">الشريك</th>
                  <th className="px-4 py-3 text-gray-600 font-bold">
                    الربح المخصص
                  </th>
                  <th className="px-4 py-3 text-gray-600 font-bold">
                    مخصوم الاحتياطي
                  </th>
                  <th className="px-4 py-3 text-gray-600 font-bold">
                    الصافي المستحق
                  </th>
                  <th className="px-4 py-3 text-gray-600 font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {undistributedProfits.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-12 text-gray-400 font-bold"
                    >
                      لا توجد أرباح غير موزعة مسجلة حالياً
                    </td>
                  </tr>
                ) : (
                  undistributedProfits.map((item, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors h-[38px]"
                    >
                      <td className="px-4 py-2 text-blue-600 font-mono font-bold">
                        {safeText(item.ref)}
                      </td>
                      <td className="px-4 py-2 text-gray-800 font-bold">
                        {safeText(item.owner)}
                      </td>
                      <td className="px-4 py-2 font-mono text-green-600 font-bold">
                        {safeNum(item.profit).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 font-mono text-gray-500 font-bold">
                        {safeNum(item.reserve).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 font-mono font-black text-green-700">
                        {safeNum(item.remaining).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-block px-2 py-1 rounded-md font-bold text-[10px] bg-amber-100 text-amber-700">
                          {safeText(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 px-2 pb-2 pt-1 text-gray-400">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span className="text-[11px] font-bold">
          هذا النظام يقرأ بياناته من المعاملات والتسويات والخزنة بشكل حي
          (Real-time). الأرقام تعكس الوضع التشغيلي اللحظي للنظام.
        </span>
      </div>

      {/* ========================================================================================= */}
      {/* 💡 النوافذ المصغرة (Modals للإجراءات السريعة - متصلة بالداتابيز) */}
      {/* ========================================================================================= */}

      {/* 1. نافذة: تسجيل دفعة سريعة (منصرف) */}
      {isQuickPaymentOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-100">
                  <DollarSign className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-gray-800 text-lg font-black">
                  تسجيل دفعة سريعة (منصرف)
                </span>
              </div>
              <button
                onClick={() => setIsQuickPaymentOpen(false)}
                className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg border bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  المستفيد / الجهة (اختياري)
                </label>
                <select
                  value={payForm.targetId}
                  onChange={(e) =>
                    setPayForm({ ...payForm, targetId: e.target.value })
                  }
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-red-500 bg-white"
                >
                  <option value="">-- اختر من القائمة --</option>
                  {isPersonsLoading ? (
                    <option disabled>جاري التحميل...</option>
                  ) : (
                    persons.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  المبلغ (ر.س) *
                </label>
                <input
                  type="number"
                  value={payForm.amount}
                  onChange={(e) =>
                    setPayForm({ ...payForm, amount: e.target.value })
                  }
                  className="w-full border border-red-300 p-3 rounded-xl text-xl font-mono font-black text-red-600 outline-none focus:border-red-600 bg-red-50"
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    طريقة الدفع
                  </label>
                  <select
                    value={payForm.method}
                    onChange={(e) =>
                      setPayForm({
                        ...payForm,
                        method: e.target.value,
                        accountId: "",
                      })
                    }
                    className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-red-500 bg-white"
                  >
                    <option value="بنكي">تحويل بنكي</option>
                    <option value="نقدي">نقدي (خزنة)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={payForm.date}
                    onChange={(e) =>
                      setPayForm({ ...payForm, date: e.target.value })
                    }
                    className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {payForm.method === "بنكي" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    الحساب البنكي المسحوب منه *
                  </label>
                  <select
                    value={payForm.accountId}
                    onChange={(e) =>
                      setPayForm({ ...payForm, accountId: e.target.value })
                    }
                    className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-red-500 bg-white"
                  >
                    <option value="">-- اختر الحساب --</option>
                    {isBanksLoading ? (
                      <option disabled>جاري التحميل...</option>
                    ) : (
                      bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} - {b.accountNumber}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ملاحظات / بيان
                </label>
                <input
                  type="text"
                  value={payForm.notes}
                  onChange={(e) =>
                    setPayForm({ ...payForm, notes: e.target.value })
                  }
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-red-500"
                  placeholder="رقم الحوالة، سبب الصرف..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsQuickPaymentOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-100 transition-colors shadow-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleSavePayment}
                disabled={paymentMutation.isPending}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm shadow-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {paymentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}{" "}
                تأكيد الصرف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. نافذة: تسجيل تحصيل سريع (وارد) */}
      {isQuickCollectionOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-green-100">
                  <Receipt className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-gray-800 text-lg font-black">
                  تسجيل تحصيل مالي (إيراد)
                </span>
              </div>
              <button
                onClick={() => setIsQuickCollectionOpen(false)}
                className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg border bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  المعاملة المرتبطة *
                </label>
                <select
                  value={colForm.transactionId}
                  onChange={(e) =>
                    setColForm({ ...colForm, transactionId: e.target.value })
                  }
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-green-500 bg-white"
                >
                  <option value="">-- اختر المعاملة --</option>
                  {isTxLoading ? (
                    <option disabled>جاري التحميل...</option>
                  ) : (
                    transactions.map((tx) => (
                      // 💡 تم إصلاح الخطأ بتغيير maskName إلى safeText
                      <option key={tx.id} value={tx.id}>
                        {tx.ref} - {safeText(tx.client)}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  المبلغ المحصّل (ر.س) *
                </label>
                <input
                  type="number"
                  value={colForm.amount}
                  onChange={(e) =>
                    setColForm({ ...colForm, amount: e.target.value })
                  }
                  className="w-full border border-green-300 p-3 rounded-xl text-xl font-mono font-black text-green-700 outline-none focus:border-green-600 bg-green-50"
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    طريقة التحصيل
                  </label>
                  <select
                    value={colForm.method}
                    onChange={(e) =>
                      setColForm({
                        ...colForm,
                        method: e.target.value,
                        accountId: "",
                      })
                    }
                    className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-green-500 bg-white"
                  >
                    <option value="بنكي">تحويل بنكي</option>
                    <option value="نقدي">نقدي (خزنة)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={colForm.date}
                    onChange={(e) =>
                      setColForm({ ...colForm, date: e.target.value })
                    }
                    className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-green-500"
                  />
                </div>
              </div>

              {colForm.method === "بنكي" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    إيداع في حساب *
                  </label>
                  <select
                    value={colForm.accountId}
                    onChange={(e) =>
                      setColForm({ ...colForm, accountId: e.target.value })
                    }
                    className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-green-500 bg-white"
                  >
                    <option value="">-- اختر الحساب --</option>
                    {isBanksLoading ? (
                      <option disabled>جاري التحميل...</option>
                    ) : (
                      bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} - {b.accountNumber}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ملاحظات / مرجع
                </label>
                <input
                  type="text"
                  value={colForm.notes}
                  onChange={(e) =>
                    setColForm({ ...colForm, notes: e.target.value })
                  }
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-green-500"
                  placeholder="اسم المودع، رقم الإيصال..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsQuickCollectionOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-100 transition-colors shadow-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveCollection}
                disabled={collectionMutation.isPending}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm shadow-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {collectionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}{" "}
                تأكيد التحصيل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. نافذة: إنشاء تسوية سريعة */}
      {isQuickSettlementOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-gray-800 text-lg font-black">
                  إنشاء قيد تسوية مالي
                </span>
              </div>
              <button
                onClick={() => setIsQuickSettlementOpen(false)}
                className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg border bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الطرف (موظف / وسيط / شريك) *
                </label>
                <select
                  value={setForm.personId}
                  onChange={(e) =>
                    setSetForm({ ...setForm, personId: e.target.value })
                  }
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">-- اختر من القائمة --</option>
                  {isPersonsLoading ? (
                    <option disabled>جاري التحميل...</option>
                  ) : (
                    persons.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    المبلغ (ر.س) *
                  </label>
                  <input
                    type="number"
                    value={setForm.amount}
                    onChange={(e) =>
                      setSetForm({ ...setForm, amount: e.target.value })
                    }
                    className="w-full border border-gray-300 p-3 rounded-xl text-lg font-mono font-black text-blue-700 outline-none focus:border-blue-500 bg-blue-50/50"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    نوع التسوية
                  </label>
                  <select
                    value={setForm.type}
                    onChange={(e) =>
                      setSetForm({ ...setForm, type: e.target.value })
                    }
                    className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="دائن">مستحق له (دائن +)</option>
                    <option value="مدين">مستحق عليه (مدين -)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  سبب التسوية / ملاحظات
                </label>
                <textarea
                  value={setForm.notes}
                  onChange={(e) =>
                    setSetForm({ ...setForm, notes: e.target.value })
                  }
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 resize-none h-24"
                  placeholder="توضيح سبب إنشاء القيد اليدوي..."
                ></textarea>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsQuickSettlementOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-100 transition-colors shadow-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveSettlement}
                disabled={settlementMutation.isPending}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {settlementMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}{" "}
                حفظ التسوية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboardPage;
