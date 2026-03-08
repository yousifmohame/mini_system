import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Search,
  SlidersHorizontal,
  Clock,
  HandCoins,
  Send,
  Eye,
  Download,
  FileText,
  Info,
  CodeXml,
  X,
  ChevronDown,
  Upload,
  CreditCard,
  Banknote,
  User,
  Printer,
  Camera,
  TrendingUp,
  TriangleAlert,
  Loader2,
  ExternalLink,
} from "lucide-react";

const BrokerSettlementsPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // ==========================================
  // States للتحكم في النوافذ المنبثقة
  // ==========================================
  const [isPrevSettlementOpen, setIsPrevSettlementOpen] = useState(false);
  const [isRecordSettlementOpen, setIsRecordSettlementOpen] = useState(false);
  const [isDeliverSettlementOpen, setIsDeliverSettlementOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // أضف هذا السطر مع باقي الـ States
  const [isViewTransactionsOpen, setIsViewTransactionsOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState(null);
  // أضف هذا السطر مع باقي الـ States في أعلى المكون
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // للتحكم بالتبويبات داخل النافذة (overview أو transactions)

  // ==========================================
  // جلب الموظفين (للـ Select)
  // ==========================================
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-simple"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data || [];
    },
  });

  // ==========================================
  // جلب إحصائيات الصفحة من الباك إند
  // ==========================================
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["settlements-dashboard"],
    queryFn: async () => {
      const res = await api.get("/private-settlements/dashboard");
      return res.data;
    },
  });

  const { data: brokerTransactions = [], isLoading: isLoadingBrokerTx } =
    useQuery({
      queryKey: ["broker-transactions", selectedBroker?.id],
      queryFn: async () => {
        const res = await api.get(
          `/private-settlements/broker/${selectedBroker.id}/transactions`,
        );
        return res.data?.data || [];
      },
      enabled:
        (!!selectedBroker && isBrokerModalOpen) || isViewTransactionsOpen, // 👈 التعديل هنا
    });

  const financials = dashboardData?.financials || {
    bankBalance: 0,
    cashBalance: 0,
    taxEstimate: 0,
    undelivered: 0,
    availableBalance: 0,
  };
  const brokers = dashboardData?.brokers || [];

  const { data: brokerSettlements = [], isLoading: isLoadingBrokerStl } =
    useQuery({
      queryKey: ["broker-settlements", selectedBroker?.id],
      queryFn: async () => {
        const res = await api.get(
          `/private-settlements/broker/${selectedBroker.id}/settlements`,
        );
        return res.data?.data || [];
      },
      enabled:
        !!selectedBroker && isBrokerModalOpen && activeTab === "settlements",
    });

  const { data: brokerPayments = [], isLoading: isLoadingBrokerPay } = useQuery(
    {
      queryKey: ["broker-payments", selectedBroker?.id],
      queryFn: async () => {
        const res = await api.get(
          `/private-settlements/broker/${selectedBroker.id}/payments`,
        );
        return res.data?.data || [];
      },
      enabled:
        !!selectedBroker && isBrokerModalOpen && activeTab === "payments",
    },
  );

  // حساب مجاميع المودال ديناميكياً
  const modalTotals = brokerTransactions.reduce(
    (acc, tx) => {
      acc.totalFees += parseFloat(tx.totalFees) || 0;
      acc.paidAmount += parseFloat(tx.paidAmount) || 0;
      acc.remainingAmount += parseFloat(tx.remainingAmount) || 0;
      return acc;
    },
    { totalFees: 0, paidAmount: 0, remainingAmount: 0 },
  );

  const totals = brokers.reduce(
    (acc, curr) => {
      acc.fees += curr.totalFees;
      acc.received += curr.received;
      acc.remaining += curr.remaining;
      return acc;
    },
    { fees: 0, received: 0, remaining: 0 },
  );

  // ==========================================
  // دوال الإرسال (Mutations)
  // ==========================================

  // 1. تسوية سابقة
  const [prevForm, setPrevForm] = useState({
    type: "شريك",
    targetId: "",
    periodDate: "",
    totalSettled: "",
    totalDelivered: "",
    remaining: "",
    notes: "",
  });
  const prevMutation = useMutation({
    mutationFn: async (data) => api.post("/private-settlements/previous", data),
    onSuccess: () => {
      toast.success("تم الحفظ");
      queryClient.invalidateQueries(["settlements-dashboard"]);
      setIsPrevSettlementOpen(false);
    },
  });

  // 2. تسجيل تسوية
  const [recordForm, setRecordForm] = useState({
    type: "شريك",
    name: "",
    amount: "",
    source: "",
    notes: "",
  });
  const recordMutation = useMutation({
    mutationFn: async (data) => api.post("/private-settlements/record", data),
    onSuccess: () => {
      toast.success("تم الحفظ");
      queryClient.invalidateQueries(["settlements-dashboard"]);
      setIsRecordSettlementOpen(false);
    },
  });

  // 3. تسليم تسوية
  const [deliverForm, setDeliverForm] = useState({
    type: "وسيط",
    targetId: "",
    amount: "",
    method: "نقدي",
    date: new Date().toISOString().split("T")[0],
    deliveredById: "",
    notes: "",
    file: null,
  });
  const deliverMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      Object.keys(data).forEach((key) => formData.append(key, data[key]));
      return api.post("/private-settlements/deliver", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("تم التسليم");
      queryClient.invalidateQueries(["settlements-dashboard"]);
      setIsDeliverSettlementOpen(false);
    },
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );

  return (
    <div
      className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar-slim h-full bg-[var(--wms-bg-0)] relative"
      dir="rtl"
    >
      {/* 1. المعادلة المالية العلوية */}
      <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg p-3">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              الرصيد البنكي
            </div>
            <div className="font-mono text-[15px] font-bold text-[var(--wms-accent-blue)]">
              {financials.bankBalance.toLocaleString()}
            </div>
          </div>
          <span className="text-[var(--wms-text-muted)] text-[16px]">+</span>
          <div>
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              الرصيد النقدي
            </div>
            <div className="font-mono text-[15px] font-bold text-[var(--wms-success)]">
              {financials.cashBalance.toLocaleString()}
            </div>
          </div>
          <span className="text-[var(--wms-text-muted)] text-[16px]">−</span>
          <div>
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              التقدير الضريبي
            </div>
            <div className="font-mono text-[15px] font-bold text-[var(--wms-warning)]">
              {financials.taxEstimate.toLocaleString()}
            </div>
          </div>
          <span className="text-[var(--wms-text-muted)] text-[16px]">−</span>
          <div>
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              تحصيل غير مسلم
            </div>
            <div className="font-mono text-[15px] font-bold text-[var(--wms-danger)]">
              {financials.undelivered.toLocaleString()}
            </div>
          </div>
          <span className="text-[var(--wms-text-muted)] text-[16px]">=</span>
          <div className="px-3 py-1.5 rounded-md bg-blue-500/10">
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              الرصيد المتاح للتسوية
            </div>
            <div className="font-mono text-[17px] font-bold text-[var(--wms-accent-blue)]">
              {financials.availableBalance.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 2. شريط الإحصائيات المصغر */}
      <div className="flex items-center gap-5 px-4 py-2 bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg">
        <div className="flex items-center gap-2">
          <div>
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              إجمالي الأتعاب
            </div>
            <div className="font-mono text-[15px] font-bold text-[var(--wms-accent-blue)]">
              {totals.fees.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-px h-6 bg-[var(--wms-border)]"></div>
          <div>
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              المبالغ المستلمة
            </div>
            <div className="font-mono text-[15px] font-bold text-[var(--wms-success)]">
              {totals.received.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-px h-6 bg-[var(--wms-border)]"></div>
          <div>
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              المبالغ المتبقية
            </div>
            <div className="font-mono text-[15px] font-bold text-[var(--wms-danger)]">
              {totals.remaining.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-px h-6 bg-[var(--wms-border)]"></div>
          <div>
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              عدد الوسطاء
            </div>
            <div className="font-mono text-[15px] font-bold text-[var(--wms-warning)]">
              {brokers.length}
            </div>
          </div>
        </div>
      </div>

      {/* 3. شريط الأدوات */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative w-[240px]">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--wms-text-muted)]" />
          <input
            type="text"
            placeholder="بحث بالاسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-md pr-8 pl-3 text-[var(--wms-text)] placeholder:text-[var(--wms-text-muted)] h-[32px] text-[12px] outline-none focus:border-blue-500"
          />
        </div>
        <button className="flex items-center gap-1.5 px-3 rounded-md cursor-pointer bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] h-[32px] text-[12px]">
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
          <span>فلاتر</span>
        </button>
        <div className="flex-1"></div>
        <button
          onClick={() => setIsPrevSettlementOpen(true)}
          className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] cursor-pointer h-[32px] text-[11px]"
        >
          <Clock className="w-3.5 h-3.5 text-purple-600" />
          <span>تسويات سابقة</span>
        </button>
        <button
          onClick={() => setIsRecordSettlementOpen(true)}
          className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90 h-[32px] text-[12px]"
        >
          <HandCoins className="w-3.5 h-3.5" />
          <span>تسجيل تسوية</span>
        </button>
        <button
          onClick={() => setIsDeliverSettlementOpen(true)}
          className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-success)] text-white cursor-pointer hover:opacity-90 h-[32px] text-[12px]"
        >
          <Send className="w-3.5 h-3.5" />
          <span>تسليم تسوية لـوسيط</span>
        </button>
        {/* استبدل هذا الزر الموجود في الكود الحالي */}
        <button
          onClick={() => setIsViewTransactionsOpen(true)}
          className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] cursor-pointer h-[32px] text-[12px]"
        >
          <Eye className="w-3.5 h-3.5 text-blue-600" />
          <span>عرض المعاملات</span>
        </button>
        <button
          onClick={() => setIsExportOpen(true)}
          className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] cursor-pointer h-[32px] text-[12px]"
        >
          <Download className="w-3.5 h-3.5 text-green-600" />
          <span>تصدير</span>
        </button>
      </div>

      {/* 4. الجدول الرئيسي */}
      <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[var(--wms-surface-2)] h-[36px]">
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                اسم الوسيط
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                عدد المعاملات
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                إجمالي الأتعاب
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                المبالغ المستلمة
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                المتبقي
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                حالة التسوية
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                معاينة
              </th>
            </tr>
          </thead>
          <tbody>
            {brokers.map((broker) => (
              <tr
                key={broker.id}
                className="border-b border-[var(--wms-border)]/30 hover:bg-[var(--wms-surface-2)]/40 transition-colors h-[36px]"
              >
                <td className="px-3 text-[var(--wms-text)] font-semibold">
                  {broker.name}
                </td>
                <td className="px-3 font-mono text-[var(--wms-text-sec)]">
                  {broker.txCount}
                </td>
                <td className="px-3 font-mono text-[var(--wms-text)]">
                  {broker.totalFees.toLocaleString()}
                </td>
                <td className="px-3 font-mono text-[var(--wms-success)]">
                  {broker.received.toLocaleString()}
                </td>
                <td
                  className={`px-3 font-mono ${broker.remaining === 0 ? "text-[var(--wms-success)]" : "text-[var(--wms-danger)]"}`}
                >
                  {broker.remaining.toLocaleString()}
                </td>
                <td className="px-3">
                  <span
                    className={`inline-flex items-center h-[20px] px-1.5 rounded-full text-[10px] font-semibold ${broker.remaining === 0 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {broker.statusText}
                  </span>
                </td>
                {/* ابحث عن هذا الجزء داخل الجدول الرئيسي */}
                <td className="px-3">
                  <button
                    onClick={() => {
                      setSelectedBroker({ id: broker.id, name: broker.name });
                      setActiveTab("overview"); // يفتح على النظرة العامة
                      setIsBrokerModalOpen(true);
                    }}
                    className="p-1 rounded hover:bg-[var(--wms-surface-2)] cursor-pointer transition-colors"
                    title="عرض المعاملات"
                  >
                    <Eye className="w-3.5 h-3.5 text-[var(--wms-accent-blue)]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ======================= MODALS ======================= */}

      {/* 1. Modal: تسجيل تسويات سابقة */}
      {isPrevSettlementOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full animate-in zoom-in-95"
            style={{ maxWidth: "500px" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <div>
                <span className="text-[var(--wms-text)] font-bold">
                  تسجيل تسويات سابقة
                </span>
                <div className="text-[var(--wms-text-muted)] text-[10px]">
                  رصيد افتتاحي / تاريخي مختصر
                </div>
              </div>
              <button
                onClick={() => setIsPrevSettlementOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-[var(--wms-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  نوع التسوية *
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {["شريك", "وسيط", "معقب", "صاحب مصلحة", "موظف"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setPrevForm({ ...prevForm, type: t })}
                      className={`px-3 py-1.5 rounded-md font-semibold text-[11px] ${prevForm.type === t ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  الاسم *
                </label>
                <select
                  value={prevForm.targetId}
                  onChange={(e) =>
                    setPrevForm({ ...prevForm, targetId: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 h-[34px] text-[12px] outline-none"
                >
                  <option value="">اختر...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  الفترة السابقة حتى تاريخ
                </label>
                <input
                  type="date"
                  value={prevForm.periodDate}
                  onChange={(e) =>
                    setPrevForm({ ...prevForm, periodDate: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 h-[34px] text-[12px] outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    إجمالي تسوية
                  </label>
                  <input
                    type="number"
                    value={prevForm.totalSettled}
                    onChange={(e) =>
                      setPrevForm({ ...prevForm, totalSettled: e.target.value })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] font-mono outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    إجمالي تسليم
                  </label>
                  <input
                    type="number"
                    value={prevForm.totalDelivered}
                    onChange={(e) =>
                      setPrevForm({
                        ...prevForm,
                        totalDelivered: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] font-mono outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    المتبقي
                  </label>
                  <input
                    type="number"
                    value={prevForm.remaining}
                    onChange={(e) =>
                      setPrevForm({ ...prevForm, remaining: e.target.value })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] font-mono outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  ملاحظات
                </label>
                <textarea
                  value={prevForm.notes}
                  onChange={(e) =>
                    setPrevForm({ ...prevForm, notes: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 py-2 outline-none h-[50px]"
                  placeholder="ملاحظات..."
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t">
              <button
                onClick={() => setIsPrevSettlementOpen(false)}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-surface-2)] text-[12px]"
              >
                إلغاء
              </button>
              <button
                onClick={() => prevMutation.mutate(prevForm)}
                disabled={prevMutation.isPending}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white text-[12px] font-bold"
              >
                {prevMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "حفظ"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: تسجيل تسوية (مستحقات) */}
      {isRecordSettlementOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full animate-in zoom-in-95"
            style={{ maxWidth: "460px" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <span className="text-[var(--wms-text)] font-bold text-[15px]">
                تسجيل تسوية
              </span>
              <button
                onClick={() => setIsRecordSettlementOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-[var(--wms-text)]"
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
                  {["شريك", "وسيط", "معقب", "موظف"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setRecordForm({ ...recordForm, type: t })}
                      className={`px-3 py-1.5 rounded-md font-semibold text-[11px] ${recordForm.type === t ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  الاسم *
                </label>
                <input
                  type="text"
                  value={recordForm.name}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, name: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] outline-none"
                  placeholder="الاسم"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  المبلغ *
                </label>
                <input
                  type="number"
                  value={recordForm.amount}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, amount: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] font-mono outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  المصدر
                </label>
                <input
                  type="text"
                  value={recordForm.source}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, source: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] outline-none"
                  placeholder="مصدر التسوية"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  ملاحظات
                </label>
                <textarea
                  value={recordForm.notes}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, notes: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 py-2 outline-none h-[60px]"
                  placeholder="ملاحظات..."
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t">
              <button
                onClick={() => setIsRecordSettlementOpen(false)}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-surface-2)] text-[12px]"
              >
                إلغاء
              </button>
              <button
                onClick={() => recordMutation.mutate(recordForm)}
                disabled={recordMutation.isPending}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white text-[12px] font-bold"
              >
                {recordMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "تسجيل"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: تسليم تسوية (دفع للوسيط) */}
      {isDeliverSettlementOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full animate-in zoom-in-95"
            style={{ maxWidth: "500px" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <span className="text-[var(--wms-text)] font-bold text-[15px]">
                تسليم تسوية
              </span>
              <button
                onClick={() => setIsDeliverSettlementOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-[var(--wms-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  المستلم *
                </label>
                <select
                  value={deliverForm.targetId}
                  onChange={(e) =>
                    setDeliverForm({ ...deliverForm, targetId: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 h-[34px] text-[12px] outline-none"
                >
                  <option value="">اختر مستلم...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  المبلغ المسلم *
                </label>
                <input
                  type="number"
                  value={deliverForm.amount}
                  onChange={(e) =>
                    setDeliverForm({ ...deliverForm, amount: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] font-mono outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  طريقة التسليم
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setDeliverForm({ ...deliverForm, method: "نقدي" })
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-[11px] ${deliverForm.method === "نقدي" ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>نقدي</span>
                  </button>
                  <button
                    onClick={() =>
                      setDeliverForm({ ...deliverForm, method: "تحويل بنكي" })
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-[11px] ${deliverForm.method === "تحويل بنكي" ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
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
                    onChange={(e) =>
                      setDeliverForm({ ...deliverForm, date: e.target.value })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    المسلِّم
                  </label>
                  <select
                    value={deliverForm.deliveredById}
                    onChange={(e) =>
                      setDeliverForm({
                        ...deliverForm,
                        deliveredById: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] text-[12px] outline-none"
                  >
                    <option value="">اختر...</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  ملاحظات
                </label>
                <textarea
                  value={deliverForm.notes}
                  onChange={(e) =>
                    setDeliverForm({ ...deliverForm, notes: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 py-2 outline-none h-[50px]"
                  placeholder="ملاحظات..."
                ></textarea>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  مرفق (صورة أو PDF)
                </label>
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[var(--wms-border)] rounded-lg text-[var(--wms-text-muted)] cursor-pointer hover:border-blue-500">
                  <Upload className="w-4 h-4" />
                  <span>
                    {deliverForm.file
                      ? deliverForm.file.name
                      : "اضغط لاختيار ملف"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      setDeliverForm({
                        ...deliverForm,
                        file: e.target.files[0],
                      })
                    }
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t">
              <button
                onClick={() => setIsDeliverSettlementOpen(false)}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-surface-2)] text-[12px]"
              >
                إلغاء
              </button>
              <button
                onClick={() => deliverMutation.mutate(deliverForm)}
                disabled={deliverMutation.isPending}
                className="px-4 py-1.5 rounded-md bg-green-600 text-white text-[12px] font-bold"
              >
                {deliverMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "تسليم"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. Modal: معاينة تفاصيل الوسيط (مودال شامل بالتبويبات) */}
      {/* ========================================================= */}
      {isBrokerModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white border border-[var(--wms-border)] rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
            style={{ width: "75vw", height: "88vh" }}
          >
            {/* Header المودال */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)] shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(37, 99, 235, 0.082)" }}
                >
                  <User
                    className="w-4 h-4"
                    style={{ color: "rgb(37, 99, 235)" }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[var(--wms-text)]"
                      style={{ fontSize: "15px", fontWeight: 700 }}
                    >
                      معاينة وسيط
                    </span>
                    <span
                      className="inline-flex items-center justify-center px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "rgba(37, 99, 235, 0.082)",
                        color: "rgb(37, 99, 235)",
                        fontSize: "10px",
                        fontWeight: 600,
                      }}
                    >
                      وسيط
                    </span>
                  </div>
                  <div
                    className="text-[var(--wms-text-sec)] mt-0.5"
                    style={{ fontSize: "12px" }}
                  >
                    {!selectedBroker ? (
                      <select
                        value={selectedBroker?.id || ""}
                        onChange={(e) => {
                          const emp = employees.find(
                            (x) => x.id === e.target.value,
                          );
                          if (emp)
                            setSelectedBroker({ id: emp.id, name: emp.name });
                        }}
                        className="bg-transparent border-none outline-none font-bold text-[var(--wms-accent-blue)] cursor-pointer p-0"
                      >
                        <option value="" disabled>
                          -- اختر وسيطاً --
                        </option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-semibold text-gray-700">
                        {selectedBroker.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--wms-surface-2)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-[var(--wms-surface-2)]/80 transition-colors"
                  style={{ fontSize: "11px" }}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>لقطة</span>
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ fontSize: "12px" }}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير PDF</span>
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--wms-surface-2)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-[var(--wms-surface-2)]/80 transition-colors"
                  style={{ fontSize: "12px" }}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
                <button
                  onClick={() => {
                    setIsBrokerModalOpen(false); // 👈 إغلاق النافذة فقط هنا
                    setSelectedBroker(null);
                  }}
                  className="text-[var(--wms-text-muted)] hover:text-red-500 cursor-pointer p-1 transition-colors bg-gray-100 rounded hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabs (أزرار التبويبات) */}
            <div className="flex border-b border-[var(--wms-border)] px-5 shrink-0 bg-gray-50/50">
              <button
                onClick={() => setActiveTab("overview")} // 👈 تحديث الـ Tab فقط
                className={`px-4 py-2 cursor-pointer transition-colors ${
                  activeTab === "overview"
                    ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                    : "text-[var(--wms-text-muted)] hover:text-[var(--wms-text-sec)] border-b-2 border-transparent"
                }`}
                style={{ fontSize: "12px" }}
              >
                نظرة عامة
              </button>
              <button
                onClick={() => setActiveTab("transactions")} // 👈 تحديث الـ Tab فقط
                className={`px-4 py-2 cursor-pointer transition-colors ${
                  activeTab === "transactions"
                    ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                    : "text-[var(--wms-text-muted)] hover:text-[var(--wms-text-sec)] border-b-2 border-transparent"
                }`}
                style={{ fontSize: "12px" }}
              >
                المعاملات
              </button>
              <button
                onClick={() => setActiveTab("settlements")}
                className={`px-4 py-2 text-[12px] ${activeTab === "settlements" ? "text-blue-600 border-b-2 border-blue-600 font-semibold" : "text-gray-400 hover:text-gray-600 border-b-2 border-transparent"}`}
              >
                التسويات
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`px-4 py-2 text-[12px] ${activeTab === "payments" ? "text-blue-600 border-b-2 border-blue-600 font-semibold" : "text-gray-400 hover:text-gray-600 border-b-2 border-transparent"}`}
              >
                سجل المدفوعات
              </button>
            </div>

            {/* Content Area */}
            <div
              className="flex-1 overflow-y-auto p-6 custom-scrollbar-slim"
              style={{ backgroundColor: "rgb(249, 250, 251)" }}
            >
              {/* رسالة في حال عدم اختيار وسيط */}
              {!selectedBroker ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <User className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-bold">
                    الرجاء اختيار وسيط من الأعلى لعرض بياناته
                  </p>
                </div>
              ) : isLoadingBrokerTx ? (
                <div className="flex flex-col items-center justify-center h-full text-blue-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="text-sm font-semibold">جاري جلب البيانات...</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-[900px] mx-auto animate-in fade-in duration-300">
                  {/* ============================================================ */}
                  {/* محتوى تبويب: نظرة عامة */}
                  {/* ============================================================ */}
                  {activeTab === "overview" && (
                    <>
                      <div
                        className="bg-white rounded-lg border border-gray-200 p-5"
                        style={{ boxShadow: "rgba(0, 0, 0, 0.06) 0px 1px 3px" }}
                      >
                        <div
                          className="text-center mb-4 pb-3 border-b-2"
                          style={{ borderColor: "rgba(37, 99, 235, 0.125)" }}
                        >
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 700,
                              color: "rgb(26, 35, 50)",
                            }}
                          >
                            {selectedBroker.name}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "rgb(37, 99, 235)",
                              fontWeight: 600,
                            }}
                          >
                            وسيط
                          </div>
                          <div
                            className="flex items-center justify-center gap-4 mt-2"
                            style={{
                              fontSize: "10px",
                              color: "rgb(139, 153, 171)",
                            }}
                          >
                            <span>
                              تاريخ المعاينة:{" "}
                              <span className="font-mono text-[var(--wms-text)]">
                                {new Date().toISOString().split("T")[0]}
                              </span>
                            </span>
                            <span>|</span>
                            <span>أُعد بواسطة: النظام</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-5 gap-3 mb-4">
                          <div
                            className="p-3 rounded-lg text-center"
                            style={{
                              backgroundColor: "rgba(37, 99, 235, 0.03)",
                              border: "1px solid rgba(37, 99, 235, 0.082)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "10px",
                                color: "rgb(139, 153, 171)",
                              }}
                            >
                              إجمالي المعاملات
                            </div>
                            <div
                              className="font-mono"
                              style={{
                                fontSize: "16px",
                                fontWeight: 700,
                                color: "rgb(37, 99, 235)",
                              }}
                            >
                              {brokerTransactions.length}
                            </div>
                          </div>
                          <div
                            className="p-3 rounded-lg text-center"
                            style={{
                              backgroundColor: "rgba(26, 35, 50, 0.03)",
                              border: "1px solid rgba(26, 35, 50, 0.082)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "10px",
                                color: "rgb(139, 153, 171)",
                              }}
                            >
                              إجمالي الأتعاب
                            </div>
                            <div
                              className="font-mono"
                              style={{
                                fontSize: "16px",
                                fontWeight: 700,
                                color: "rgb(26, 35, 50)",
                              }}
                            >
                              {modalTotals.totalFees.toLocaleString()}
                            </div>
                          </div>
                          <div
                            className="p-3 rounded-lg text-center"
                            style={{
                              backgroundColor: "rgba(22, 163, 74, 0.03)",
                              border: "1px solid rgba(22, 163, 74, 0.082)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "10px",
                                color: "rgb(139, 153, 171)",
                              }}
                            >
                              المستلم
                            </div>
                            <div
                              className="font-mono"
                              style={{
                                fontSize: "16px",
                                fontWeight: 700,
                                color: "rgb(22, 163, 74)",
                              }}
                            >
                              {modalTotals.paidAmount.toLocaleString()}
                            </div>
                          </div>
                          <div
                            className="p-3 rounded-lg text-center"
                            style={{
                              backgroundColor: "rgba(220, 38, 38, 0.03)",
                              border: "1px solid rgba(220, 38, 38, 0.082)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "10px",
                                color: "rgb(139, 153, 171)",
                              }}
                            >
                              المتبقي
                            </div>
                            <div
                              className="font-mono"
                              style={{
                                fontSize: "16px",
                                fontWeight: 700,
                                color: "rgb(220, 38, 38)",
                              }}
                            >
                              {modalTotals.remainingAmount.toLocaleString()}
                            </div>
                          </div>
                          <div
                            className="p-3 rounded-lg text-center"
                            style={{
                              backgroundColor: "rgba(100, 116, 139, 0.03)",
                              border: "1px solid rgba(100, 116, 139, 0.082)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "10px",
                                color: "rgb(139, 153, 171)",
                              }}
                            >
                              آخر معاملة
                            </div>
                            <div
                              className="font-mono"
                              style={{
                                fontSize: "16px",
                                fontWeight: 700,
                                color: "rgb(100, 116, 139)",
                              }}
                            >
                              {brokerTransactions[0]
                                ? brokerTransactions[0].date
                                : "—"}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div
                            className="p-3 rounded-lg"
                            style={{
                              backgroundColor: "rgb(248, 250, 252)",
                              border: "1px solid rgb(226, 232, 240)",
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-3.5 h-3.5 text-wms-blue" />
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: "rgb(26, 35, 50)",
                                }}
                              >
                                أداء الفترة
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              <div
                                className="flex justify-between"
                                style={{ fontSize: "11px" }}
                              >
                                <span className="text-wms-text-muted">
                                  معاملات نشطة
                                </span>
                                <span
                                  className="font-mono"
                                  style={{ fontWeight: 600 }}
                                >
                                  {brokerTransactions.length}
                                </span>
                              </div>
                              <div
                                className="flex justify-between"
                                style={{ fontSize: "11px" }}
                              >
                                <span className="text-wms-text-muted">
                                  مكتملة
                                </span>
                                <span
                                  className="font-mono"
                                  style={{
                                    fontWeight: 600,
                                    color: "rgb(22, 163, 74)",
                                  }}
                                >
                                  {
                                    brokerTransactions.filter(
                                      (tx) => tx.remainingAmount === 0,
                                    ).length
                                  }
                                </span>
                              </div>
                              <div
                                className="flex justify-between"
                                style={{ fontSize: "11px" }}
                              >
                                <span className="text-wms-text-muted">
                                  جزئية
                                </span>
                                <span
                                  className="font-mono"
                                  style={{
                                    fontWeight: 600,
                                    color: "rgb(217, 119, 6)",
                                  }}
                                >
                                  {
                                    brokerTransactions.filter(
                                      (tx) =>
                                        tx.paidAmount > 0 &&
                                        tx.remainingAmount > 0,
                                    ).length
                                  }
                                </span>
                              </div>
                              <div
                                className="flex justify-between"
                                style={{ fontSize: "11px" }}
                              >
                                <span className="text-wms-text-muted">
                                  معلقة
                                </span>
                                <span
                                  className="font-mono"
                                  style={{
                                    fontWeight: 600,
                                    color: "rgb(220, 38, 38)",
                                  }}
                                >
                                  {
                                    brokerTransactions.filter(
                                      (tx) => tx.paidAmount === 0,
                                    ).length
                                  }
                                </span>
                              </div>
                            </div>
                          </div>

                          <div
                            className="p-3 rounded-lg"
                            style={{
                              backgroundColor: "rgb(248, 250, 252)",
                              border: "1px solid rgb(226, 232, 240)",
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <HandCoins
                                className="w-3.5 h-3.5"
                                style={{ color: "rgb(22, 163, 74)" }}
                              />
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: "rgb(26, 35, 50)",
                                }}
                              >
                                آخر التسويات
                              </span>
                            </div>
                            <div className="flex flex-col h-full justify-center text-center text-gray-400 text-xs">
                              لا توجد تسويات حديثة مسجلة
                            </div>
                          </div>

                          <div
                            className="p-3 rounded-lg"
                            style={{
                              backgroundColor: "rgb(248, 250, 252)",
                              border: "1px solid rgb(226, 232, 240)",
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <TriangleAlert className="w-3.5 h-3.5 text-wms-warning" />
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: "rgb(26, 35, 50)",
                                }}
                              >
                                تنبيهات
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {modalTotals.remainingAmount > 0 && (
                                <div
                                  className="flex items-center gap-1.5"
                                  style={{ fontSize: "11px" }}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-wms-danger"></div>
                                  <span className="text-wms-text-sec">
                                    مبالغ متبقية غير مسلمة (
                                    {modalTotals.remainingAmount.toLocaleString()}
                                    )
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ============================================================ */}
                  {/* محتوى تبويب: المعاملات */}
                  {/* ============================================================ */}
                  {activeTab === "transactions" && (
                    <>
                      <div
                        className="bg-white rounded-lg border border-gray-200 p-4"
                        style={{ boxShadow: "rgba(0, 0, 0, 0.06) 0px 1px 3px" }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-[var(--wms-accent-blue)]" />
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "rgb(26, 35, 50)",
                              }}
                            >
                              المعاملات المرتبطة بالوسيط
                            </span>
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded border border-gray-200">
                          <table
                            className="w-full"
                            style={{
                              fontSize: "11px",
                              borderCollapse: "collapse",
                            }}
                          >
                            <thead>
                              <tr>
                                <th
                                  className="text-right px-2 py-1.5"
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "10px",
                                    color: "rgb(55, 65, 81)",
                                    backgroundColor: "rgb(243, 244, 246)",
                                    borderBottom:
                                      "1px solid rgb(209, 213, 219)",
                                  }}
                                >
                                  المرجع
                                </th>
                                <th
                                  className="text-right px-2 py-1.5"
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "10px",
                                    color: "rgb(55, 65, 81)",
                                    backgroundColor: "rgb(243, 244, 246)",
                                    borderBottom:
                                      "1px solid rgb(209, 213, 219)",
                                  }}
                                >
                                  المالك
                                </th>
                                <th
                                  className="text-right px-2 py-1.5"
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "10px",
                                    color: "rgb(55, 65, 81)",
                                    backgroundColor: "rgb(243, 244, 246)",
                                    borderBottom:
                                      "1px solid rgb(209, 213, 219)",
                                  }}
                                >
                                  الحي / القطاع
                                </th>
                                <th
                                  className="text-right px-2 py-1.5"
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "10px",
                                    color: "rgb(55, 65, 81)",
                                    backgroundColor: "rgb(243, 244, 246)",
                                    borderBottom:
                                      "1px solid rgb(209, 213, 219)",
                                  }}
                                >
                                  النوع
                                </th>
                                <th
                                  className="text-right px-2 py-1.5"
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "10px",
                                    color: "rgb(55, 65, 81)",
                                    backgroundColor: "rgb(243, 244, 246)",
                                    borderBottom:
                                      "1px solid rgb(209, 213, 219)",
                                  }}
                                >
                                  الأتعاب
                                </th>
                                <th
                                  className="text-right px-2 py-1.5"
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "10px",
                                    color: "rgb(55, 65, 81)",
                                    backgroundColor: "rgb(243, 244, 246)",
                                    borderBottom:
                                      "1px solid rgb(209, 213, 219)",
                                  }}
                                >
                                  المدفوع
                                </th>
                                <th
                                  className="text-right px-2 py-1.5"
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "10px",
                                    color: "rgb(55, 65, 81)",
                                    backgroundColor: "rgb(243, 244, 246)",
                                    borderBottom:
                                      "1px solid rgb(209, 213, 219)",
                                  }}
                                >
                                  المتبقي
                                </th>
                                <th
                                  className="text-right px-2 py-1.5"
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "10px",
                                    color: "rgb(55, 65, 81)",
                                    backgroundColor: "rgb(243, 244, 246)",
                                    borderBottom:
                                      "1px solid rgb(209, 213, 219)",
                                  }}
                                >
                                  التاريخ
                                </th>
                                <th
                                  className="text-right px-2 py-1.5"
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "10px",
                                    color: "rgb(55, 65, 81)",
                                    backgroundColor: "rgb(243, 244, 246)",
                                    borderBottom:
                                      "1px solid rgb(209, 213, 219)",
                                  }}
                                >
                                  الحالة
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {brokerTransactions.length > 0 ? (
                                brokerTransactions.map((tx, idx) => (
                                  <tr
                                    key={tx.id}
                                    style={{
                                      backgroundColor:
                                        idx % 2 === 0
                                          ? "white"
                                          : "rgb(250, 251, 252)",
                                    }}
                                  >
                                    <td
                                      className="px-2 py-2 font-mono"
                                      style={{
                                        color: "rgb(37, 99, 235)",
                                        fontWeight: 600,
                                        borderBottom:
                                          "1px solid rgb(229, 231, 235)",
                                      }}
                                    >
                                      {tx.ref}
                                    </td>
                                    <td
                                      className="px-2 py-2 text-[var(--wms-text-sec)] font-semibold"
                                      style={{
                                        borderBottom:
                                          "1px solid rgb(229, 231, 235)",
                                      }}
                                    >
                                      {tx.client}
                                    </td>
                                    <td
                                      className="px-2 py-2 text-[var(--wms-text-sec)]"
                                      style={{
                                        borderBottom:
                                          "1px solid rgb(229, 231, 235)",
                                      }}
                                    >
                                      {tx.district} - {tx.sector}
                                    </td>
                                    <td
                                      className="px-2 py-2 font-bold text-gray-700"
                                      style={{
                                        borderBottom:
                                          "1px solid rgb(229, 231, 235)",
                                      }}
                                    >
                                      {tx.type}
                                    </td>
                                    <td
                                      className="px-2 py-2 font-mono font-bold"
                                      style={{
                                        borderBottom:
                                          "1px solid rgb(229, 231, 235)",
                                      }}
                                    >
                                      {tx.totalFees.toLocaleString()}
                                    </td>
                                    <td
                                      className="px-2 py-2 font-mono"
                                      style={{
                                        color: "rgb(22, 163, 74)",
                                        borderBottom:
                                          "1px solid rgb(229, 231, 235)",
                                      }}
                                    >
                                      {tx.paidAmount.toLocaleString()}
                                    </td>
                                    <td
                                      className="px-2 py-2 font-mono"
                                      style={{
                                        color:
                                          tx.remainingAmount === 0
                                            ? "rgb(22, 163, 74)"
                                            : "rgb(220, 38, 38)",
                                        fontWeight: 600,
                                        borderBottom:
                                          "1px solid rgb(229, 231, 235)",
                                      }}
                                    >
                                      {tx.remainingAmount.toLocaleString()}
                                    </td>
                                    <td
                                      className="px-2 py-2 font-mono text-[var(--wms-text-muted)]"
                                      style={{
                                        borderBottom:
                                          "1px solid rgb(229, 231, 235)",
                                      }}
                                    >
                                      {tx.date}
                                    </td>
                                    <td
                                      className="px-2 py-2"
                                      style={{
                                        borderBottom:
                                          "1px solid rgb(229, 231, 235)",
                                      }}
                                    >
                                      <span
                                        className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                                        style={{
                                          backgroundColor:
                                            tx.remainingAmount === 0
                                              ? "rgba(22, 163, 74, 0.12)"
                                              : tx.paidAmount > 0
                                                ? "rgba(245, 158, 11, 0.12)"
                                                : "rgba(239, 68, 68, 0.12)",
                                          color:
                                            tx.remainingAmount === 0
                                              ? "rgb(22, 163, 74)"
                                              : tx.paidAmount > 0
                                                ? "rgb(217, 119, 6)"
                                                : "rgb(239, 68, 68)",
                                        }}
                                      >
                                        {tx.remainingAmount === 0
                                          ? "مكتمل"
                                          : tx.paidAmount > 0
                                            ? "جزئي"
                                            : "غير مدفوع"}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td
                                    colSpan="9"
                                    className="text-center py-6 text-gray-400"
                                  >
                                    لا توجد معاملات لهذا الوسيط
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* خلاصة المعاملات */}
                        <div className="rounded-lg p-3 mt-4 bg-slate-50 border border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-gray-800">
                              إجمالي نتائج الجدول:
                            </span>
                            <div className="flex gap-6">
                              <div className="flex flex-col text-left">
                                <span className="text-[10px] text-gray-500">
                                  إجمالي المستحق
                                </span>
                                <span className="font-mono text-[13px] font-bold text-gray-800">
                                  {modalTotals.totalFees.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-[10px] text-gray-500">
                                  إجمالي المسلم
                                </span>
                                <span className="font-mono text-[13px] font-bold text-green-600">
                                  {modalTotals.paidAmount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-[10px] text-gray-500">
                                  صافي المتبقي
                                </span>
                                <span className="font-mono text-[13px] font-bold text-red-600">
                                  {modalTotals.remainingAmount.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          className="flex items-start gap-2 mt-4 p-2.5 rounded-md"
                          style={{
                            backgroundColor: "rgb(255, 251, 235)",
                            border: "1px solid rgba(234, 179, 8, 0.2)",
                          }}
                        >
                          <Info
                            className="w-3.5 h-3.5 mt-0.5 shrink-0"
                            style={{ color: "rgb(146, 64, 14)" }}
                          />
                          <span
                            style={{
                              fontSize: "9px",
                              color: "rgb(146, 64, 14)",
                            }}
                          >
                            هذا النظام مخصص للتسويات والمتابعة الداخلية المبسطة
                            — الأرقام تشغيلية وليست معالجة محاسبية رسمية.
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ============================================================ */}
                  {/* 3. تبويب: التسويات (من الديزاين المرسل) */}
                  {/* ============================================================ */}
                  {activeTab === "transactions" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      {isLoadingBrokerTx ? (
                        <div className="text-center py-6 text-blue-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        </div>
                      ) : (
                        <table className="w-full text-[11px] border-collapse">
                          <thead>
                            <tr>
                              <th className="text-right px-2 py-1.5 font-bold text-gray-600 bg-gray-100 border-b">
                                المرجع
                              </th>
                              <th className="text-right px-2 py-1.5 font-bold text-gray-600 bg-gray-100 border-b">
                                المالك
                              </th>
                              <th className="text-right px-2 py-1.5 font-bold text-gray-600 bg-gray-100 border-b">
                                الأتعاب
                              </th>
                              <th className="text-right px-2 py-1.5 font-bold text-gray-600 bg-gray-100 border-b">
                                المدفوع
                              </th>
                              <th className="text-right px-2 py-1.5 font-bold text-gray-600 bg-gray-100 border-b">
                                المتبقي
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {brokerTransactions.map((tx, idx) => (
                              <tr
                                key={tx.id}
                                className={
                                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }
                              >
                                <td className="px-2 py-2 font-mono text-blue-600 font-semibold border-b">
                                  {tx.ref}
                                </td>
                                <td className="px-2 py-2 text-gray-600 border-b">
                                  {tx.client}
                                </td>
                                <td className="px-2 py-2 font-mono font-bold border-b">
                                  {tx.totalFees.toLocaleString()}
                                </td>
                                <td className="px-2 py-2 font-mono text-green-600 border-b">
                                  {tx.paidAmount.toLocaleString()}
                                </td>
                                <td
                                  className={`px-2 py-2 font-mono font-bold border-b ${tx.remainingAmount > 0 ? "text-red-600" : "text-green-600"}`}
                                >
                                  {tx.remainingAmount.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* === التسويات === */}
                  {activeTab === "settlements" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-[13px] font-bold text-gray-800">
                          سجل التسويات — {selectedBroker.name}
                        </span>
                      </div>
                      {isLoadingBrokerStl ? (
                        <div className="text-center py-6 text-blue-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        </div>
                      ) : (
                        <table className="w-full text-[11px] border-collapse">
                          <thead>
                            <tr>
                              <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2">
                                المرجع
                              </th>
                              <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2">
                                التاريخ
                              </th>
                              <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2">
                                النوع
                              </th>
                              <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2">
                                المبلغ
                              </th>
                              <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2">
                                ملاحظات
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {brokerSettlements.map((stl, idx) => (
                              <tr
                                key={stl.id}
                                className={
                                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }
                              >
                                <td className="px-3 py-2 border-b text-gray-500 font-mono">
                                  {stl.ref}
                                </td>
                                <td className="px-3 py-2 border-b text-gray-600 font-mono">
                                  {stl.date}
                                </td>
                                <td className="px-3 py-2 border-b font-bold text-gray-800">
                                  {stl.type}
                                </td>
                                <td className="px-3 py-2 border-b font-mono font-bold text-blue-600">
                                  {stl.amount.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 border-b text-gray-500 truncate max-w-[150px]">
                                  {stl.notes}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* === سجل المدفوعات === */}
              {activeTab === "payments" && (
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Send className="w-4 h-4 text-purple-600" />
                    <span className="text-[13px] font-bold text-gray-800">
                      سجل المدفوعات والتسليمات — {selectedBroker.name}
                    </span>
                  </div>
                  {isLoadingBrokerPay ? (
                    <div className="text-center py-6 text-blue-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </div>
                  ) : (
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr>
                          <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2">
                            المرجع
                          </th>
                          <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2">
                            التاريخ
                          </th>
                          <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2">
                            المبلغ
                          </th>
                          <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2">
                            الطريقة
                          </th>
                          <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2">
                            المسلِّم
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {brokerPayments.map((pay, idx) => (
                          <tr
                            key={pay.id}
                            className={
                              idx % 2 === 0
                                ? "bg-white hover:bg-blue-50/30"
                                : "bg-gray-50 hover:bg-blue-50/30"
                            }
                          >
                            <td className="px-3 py-2 font-mono text-purple-600 font-bold border-b">
                              {pay.ref}
                            </td>
                            <td className="px-3 py-2 font-mono text-gray-400 border-b">
                              {pay.date}
                            </td>
                            <td className="px-3 py-2 font-mono font-bold text-green-600 border-b">
                              {pay.amount.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 border-b">
                              <span
                                className={`inline-flex px-1.5 rounded ${pay.method === "بنكي" ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-600"}`}
                              >
                                {pay.method}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-500 border-b">
                              {pay.deliveredBy}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. Modal: عرض المعاملات المرتبطة بوسيط */}
      {/* ========================================================= */}
      {isViewTransactionsOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full animate-in zoom-in-95 duration-200"
            style={{ maxWidth: "720px" }}
          >
            {/* رأس المودال (Header) مع قائمة اختيار الوسيط */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[var(--wms-text)]"
                    style={{ fontSize: "15px", fontWeight: 700 }}
                  >
                    معاملات الوسيط:
                  </span>
                  {/* 👈 هنا أضفنا القائمة المنسدلة لاختيار الوسيط */}
                  <select
                    value={selectedBroker?.id || ""}
                    onChange={(e) => {
                      const emp = employees.find(
                        (x) => x.id === e.target.value,
                      );
                      if (emp)
                        setSelectedBroker({ id: emp.id, name: emp.name });
                    }}
                    className="bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 py-1 text-[13px] font-bold text-[var(--wms-accent-blue)] outline-none cursor-pointer"
                  >
                    <option value="" disabled>
                      -- اختر وسيطاً لعرض معاملاته --
                    </option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className="text-[var(--wms-text-muted)] mt-1"
                  style={{ fontSize: "11px" }}
                >
                  {selectedBroker
                    ? `${brokerTransactions.length} معاملة مرتبطة`
                    : "الرجاء اختيار وسيط من القائمة"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-[var(--wms-surface-2)]/80 transition-colors"
                  style={{ fontSize: "11px" }}
                >
                  <Download className="w-3 h-3" />
                  <span>تصدير</span>
                </button>
                <button
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-[var(--wms-surface-2)]/80 transition-colors"
                  style={{ fontSize: "11px" }}
                >
                  <Eye className="w-3 h-3" />
                  <span>معاينة</span>
                </button>
                <button
                  onClick={() => {
                    setIsViewTransactionsOpen(false);
                    setSelectedBroker(null);
                  }}
                  className="text-[var(--wms-text-muted)] hover:text-[var(--wms-text)] cursor-pointer transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* جدول المعاملات */}
            <div
              className="overflow-x-auto custom-scrollbar-slim"
              style={{ maxHeight: "400px", minHeight: "200px" }}
            >
              <table className="w-full text-[12px] border-collapse">
                <thead className="sticky top-0 z-10 bg-[var(--wms-surface-2)]">
                  <tr className="h-[32px]">
                    <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px] bg-[var(--wms-surface-2)] border-b border-gray-300">
                      رقم المعاملة
                    </th>
                    <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px] bg-[var(--wms-surface-2)] border-b border-gray-300">
                      اسم المالك
                    </th>
                    <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px] bg-[var(--wms-surface-2)] border-b border-gray-300">
                      الحي
                    </th>
                    <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px] bg-[var(--wms-surface-2)] border-b border-gray-300">
                      القطاع
                    </th>
                    <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px] bg-[var(--wms-surface-2)] border-b border-gray-300">
                      النوع
                    </th>
                    <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px] bg-[var(--wms-surface-2)] border-b border-gray-300">
                      الأتعاب
                    </th>
                    <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px] bg-[var(--wms-surface-2)] border-b border-gray-300">
                      المدفوع
                    </th>
                    <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px] bg-[var(--wms-surface-2)] border-b border-gray-300">
                      المتبقي
                    </th>
                    <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px] bg-[var(--wms-surface-2)] border-b border-gray-300">
                      الحالة
                    </th>
                    <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px] bg-[var(--wms-surface-2)] border-b border-gray-300"></th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedBroker ? (
                    <tr>
                      <td
                        colSpan="10"
                        className="text-center py-12 text-gray-400 font-semibold"
                      >
                        يرجى اختيار وسيط من القائمة العلوية لعرض معاملاته
                      </td>
                    </tr>
                  ) : isLoadingBrokerTx ? (
                    <tr>
                      <td
                        colSpan="10"
                        className="text-center py-12 text-gray-500"
                      >
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--wms-accent-blue)]" />
                        جاري جلب المعاملات...
                      </td>
                    </tr>
                  ) : brokerTransactions.length > 0 ? (
                    brokerTransactions.map((tx, idx) => (
                      <tr
                        key={tx.id}
                        className={`border-b border-[var(--wms-border)]/30 hover:bg-[var(--wms-surface-2)]/40 transition-colors h-[34px] ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                      >
                        <td className="px-3 font-mono text-[var(--wms-accent-blue)] font-semibold">
                          {tx.ref}
                        </td>
                        <td className="px-3 text-[var(--wms-text)]">
                          {tx.client}
                        </td>
                        <td className="px-3 text-[var(--wms-text-sec)]">
                          {tx.district}
                        </td>
                        <td className="px-3 text-[var(--wms-text-muted)]">
                          {tx.sector}
                        </td>
                        <td className="px-3 text-[var(--wms-text-sec)]">
                          {tx.type}
                        </td>
                        <td className="px-3 font-mono text-[var(--wms-text)]">
                          {tx.totalFees.toLocaleString()}
                        </td>
                        <td className="px-3 font-mono text-[var(--wms-success)]">
                          {tx.paidAmount.toLocaleString()}
                        </td>
                        <td
                          className={`px-3 font-mono font-semibold ${tx.remainingAmount > 0 ? "text-[var(--wms-danger)]" : "text-[var(--wms-success)]"}`}
                        >
                          {tx.remainingAmount.toLocaleString()}
                        </td>
                        <td className="px-3">
                          <span
                            className={`inline-flex items-center h-[20px] px-1.5 rounded-full text-[10px] font-semibold ${tx.remainingAmount === 0 ? "bg-green-100 text-green-700" : tx.paidAmount > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}
                          >
                            {tx.remainingAmount === 0
                              ? "مُسوّى"
                              : tx.paidAmount > 0
                                ? "جزئي"
                                : "غير مدفوع"}
                          </span>
                        </td>
                        <td className="px-3">
                          <button
                            className="text-[var(--wms-accent-blue)] hover:underline cursor-pointer"
                            title="فتح المعاملة"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="10"
                        className="text-center py-12 text-gray-500 font-semibold"
                      >
                        لا توجد معاملات مسجلة لهذا الوسيط
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* الفوتر (المجاميع) */}
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-[var(--wms-border)] bg-[var(--wms-surface-2)] shrink-0">
              <span className="text-[var(--wms-text-sec)] text-[11px] font-semibold">
                المجموع ({brokerTransactions.length})
              </span>
              <div className="flex items-center gap-6 text-[12px]">
                <span className="text-[var(--wms-text-muted)]">
                  الأتعاب:{" "}
                  <span className="text-[var(--wms-text)] font-mono font-semibold">
                    {modalTotals.totalFees.toLocaleString()}
                  </span>
                </span>
                <span className="text-[var(--wms-text-muted)]">
                  المدفوع:{" "}
                  <span className="text-[var(--wms-success)] font-mono font-semibold">
                    {modalTotals.paidAmount.toLocaleString()}
                  </span>
                </span>
                <span className="text-[var(--wms-text-muted)]">
                  المتبقي:{" "}
                  <span className="text-[var(--wms-danger)] font-mono font-semibold">
                    {modalTotals.remainingAmount.toLocaleString()}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerSettlementsPage;
