import React, { useState, useMemo } from "react";
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
  Trash2,
} from "lucide-react";

const AgentSettlementsPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // ==========================================
  // States للتحكم في النوافذ المنبثقة
  // ==========================================
  const [isPrevSettlementOpen, setIsPrevSettlementOpen] = useState(false);
  const [isRecordSettlementOpen, setIsRecordSettlementOpen] = useState(false);
  const [isDeliverSettlementOpen, setIsDeliverSettlementOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // نافذة المعاينة الموحدة الشاملة
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // ==========================================
  // Forms States (For Reset)
  // ==========================================
  const initialPrevForm = {
    type: "معقب",
    targetId: "",
    periodDate: "",
    totalSettled: "",
    totalDelivered: "",
    remaining: "",
    notes: "",
  };
  const initialRecordForm = {
    type: "معقب",
    targetId: "",
    amount: "",
    source: "",
    notes: "",
  };
  const initialDeliverForm = {
    type: "معقب",
    targetId: "",
    amount: "",
    method: "نقدي",
    date: new Date().toISOString().split("T")[0],
    deliveredById: "",
    notes: "",
    file: null,
  };

  const [prevForm, setPrevForm] = useState(initialPrevForm);
  const [recordForm, setRecordForm] = useState(initialRecordForm);
  const [deliverForm, setDeliverForm] = useState(initialDeliverForm);

  // ==========================================
  // 1. جلب بيانات سجل الأشخاص الشامل
  // ==========================================
  const { data: persons = [], isLoading: isLoadingPersons } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => {
      const res = await api.get("/persons");
      return res.data?.data || [];
    },
  });

  // 2. فلترة الأشخاص حسب الدور
  const agentsList = useMemo(
    () => persons.filter((p) => p.role === "معقب"),
    [persons],
  );
  const employeesList = useMemo(
    () => persons.filter((p) => p.role === "موظف"),
    [persons],
  );

  // ==========================================
  // 3. جلب إحصائيات الصفحة من الباك إند (المعقبين فقط)
  // ==========================================
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["agent-settlements-dashboard"],
    queryFn: async () => {
      const res = await api.get("/private-settlements/dashboard?type=معقب");
      return res.data;
    },
  });

  // 💡 حماية البيانات بالـ useMemo لمنع الـ Re-renders
  const financials = useMemo(
    () =>
      dashboardData?.financials || {
        bankBalance: 0,
        cashBalance: 0,
        taxEstimate: 0,
        undelivered: 0,
        availableBalance: 0,
      },
    [dashboardData],
  );

  // 4. فلترة صارمة للمعقبين (Strict Filter)
  const brokers = useMemo(() => {
    return (dashboardData?.brokers || [])
      .filter((broker) => {
        const personInfo = persons.find((p) => p.id === broker.id);
        return personInfo && personInfo.role === "معقب";
      })
      .map((broker) => {
        const personInfo = persons.find((p) => p.id === broker.id);
        return { ...broker, name: personInfo.name };
      });
  }, [dashboardData, persons]);

  // ==========================================
  // 5. جلب بيانات المعقب المحدد بداخل المودال
  // ==========================================
  const {
    data: brokerTransactions = [],
    isLoading: isLoadingBrokerTx,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ["agent-transactions", selectedBroker?.id],
    queryFn: async () => {
      const res = await api.get(
        `/private-settlements/broker/${selectedBroker.id}/transactions?role=agent`,
      );
      return res.data?.data || [];
    },
    enabled: !!selectedBroker && isBrokerModalOpen,
  });

  const { data: brokerSettlements = [], isLoading: isLoadingBrokerStl } =
    useQuery({
      queryKey: ["agent-settlements", selectedBroker?.id],
      queryFn: async () => {
        const res = await api.get(
          `/private-settlements/broker/${selectedBroker.id}/settlements?role=agent`,
        );
        return res.data?.data || [];
      },
      enabled:
        !!selectedBroker && isBrokerModalOpen && activeTab === "settlements",
    });

  const { data: brokerPayments = [], isLoading: isLoadingBrokerPay } = useQuery(
    {
      queryKey: ["agent-payments", selectedBroker?.id],
      queryFn: async () => {
        const res = await api.get(
          `/private-settlements/broker/${selectedBroker.id}/payments?role=agent`,
        );
        return res.data?.data || [];
      },
      enabled:
        !!selectedBroker && isBrokerModalOpen && activeTab === "payments",
    },
  );

  // ==========================================
  // 💡 الحل الجذري لمشكلة الـ Loop: استخدام useMemo بدلاً من useState + useEffect
  // ==========================================
  const modalTotals = useMemo(() => {
    if (!brokerTransactions || brokerTransactions.length === 0) {
      return { totalFees: 0, paidAmount: 0, remainingAmount: 0 };
    }
    return brokerTransactions.reduce(
      (acc, tx) => {
        acc.totalFees += parseFloat(tx.totalFees) || 0;
        acc.paidAmount += parseFloat(tx.paidAmount) || 0;
        acc.remainingAmount += parseFloat(tx.remainingAmount) || 0;
        return acc;
      },
      { totalFees: 0, paidAmount: 0, remainingAmount: 0 },
    );
  }, [brokerTransactions]);

  // مجاميع الصفحة كاملة محمية بـ useMemo
  const totals = useMemo(() => {
    return brokers.reduce(
      (acc, curr) => {
        acc.fees += curr.totalFees;
        acc.received += curr.received;
        acc.remaining += curr.remaining;
        return acc;
      },
      { fees: 0, received: 0, remaining: 0 },
    );
  }, [brokers]);

  const currentAgentStats = useMemo(() => {
    return (
      brokers.find((b) => b.id === selectedBroker?.id) || {
        totalFees: 0,
        received: 0,
        remaining: 0,
        txCount: 0,
        statusText: "غير محدد",
      }
    );
  }, [brokers, selectedBroker]);

  // ==========================================
  // دوال فتح المودالات مع تنظيف الداتا
  // ==========================================
  const handleOpenPrevSettlement = () => {
    setPrevForm(initialPrevForm);
    setIsPrevSettlementOpen(true);
  };
  const handleOpenRecordSettlement = () => {
    setRecordForm(initialRecordForm);
    setIsRecordSettlementOpen(true);
  };
  const handleOpenDeliverSettlement = () => {
    setDeliverForm(initialDeliverForm);
    setIsDeliverSettlementOpen(true);
  };

  const handleOpenBrokerModal = (broker) => {
    setSelectedBroker({ id: broker.id, name: broker.name });
    setActiveTab("overview");
    setIsBrokerModalOpen(true);
    refetchTx();
  };

  // ==========================================
  // دوال الإرسال (Mutations)
  // ==========================================
  const prevMutation = useMutation({
    mutationFn: async (data) => api.post("/private-settlements/previous", data),
    onSuccess: () => {
      toast.success("تم حفظ التسوية السابقة");
      queryClient.invalidateQueries(["agent-settlements-dashboard"]);
      setIsPrevSettlementOpen(false);
    },
  });

  const recordMutation = useMutation({
    mutationFn: async (data) => api.post("/private-settlements/record", data),
    onSuccess: () => {
      toast.success("تم تسجيل المستحق بنجاح");
      queryClient.invalidateQueries(["agent-settlements-dashboard"]);
      setIsRecordSettlementOpen(false);
    },
  });

  const deleteBrokerMutation = useMutation({
    mutationFn: async (brokerId) =>
      api.delete(`/private-settlements/broker/${brokerId}`),
    onSuccess: () => {
      toast.success("تم مسح السجل المالي للشخص بنجاح");
      queryClient.invalidateQueries(["agent-settlements-dashboard"]);
    },
    onError: () => toast.error("حدث خطأ أثناء محاولة الحذف"),
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
      toast.success("تم تسليم المبلغ بنجاح");
      queryClient.invalidateQueries(["agent-settlements-dashboard"]);
      setIsDeliverSettlementOpen(false);
    },
  });

  if (isLoading || isLoadingPersons)
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
              الرصيد المتاح للشركة
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
              إجمالي المستحقات
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
              المبالغ المسلمة
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
              المتبقي للمعقبين
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
              عدد المعقبين
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
          onClick={handleOpenPrevSettlement}
          className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] cursor-pointer h-[32px] text-[11px]"
        >
          <Clock className="w-3.5 h-3.5 text-purple-600" />
          <span>تسويات سابقة</span>
        </button>
        <button
          onClick={handleOpenRecordSettlement}
          className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90 h-[32px] text-[12px]"
        >
          <HandCoins className="w-3.5 h-3.5" />
          <span>تسجيل مستحق لمعقب</span>
        </button>
        <button
          onClick={handleOpenDeliverSettlement}
          className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-success)] text-white cursor-pointer hover:opacity-90 h-[32px] text-[12px]"
        >
          <Send className="w-3.5 h-3.5" />
          <span>تسليم مبلغ لمعقب</span>
        </button>
      </div>

      {/* 4. الجدول الرئيسي */}
      <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[var(--wms-surface-2)] h-[36px]">
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                اسم المعقب
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                حركات مسجلة
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                إجمالي المستحق
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                المبالغ المسلمة
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                المتبقي
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                حالة التسوية
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {brokers.map((broker) => (
              <tr
                key={broker.id}
                className="border-b border-[var(--wms-border)]/30 hover:bg-[var(--wms-surface-2)]/40 transition-colors h-[36px]"
              >
                <td className="px-3 text-[var(--wms-text)] font-semibold flex items-center gap-1.5 mt-1.5">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  {broker.name}
                </td>
                <td className="px-3 font-mono text-[var(--wms-text-sec)]">
                  {broker.txCount}
                </td>
                <td className="px-3 font-mono text-[var(--wms-text)] font-bold">
                  {broker.totalFees.toLocaleString()}
                </td>
                <td className="px-3 font-mono text-[var(--wms-success)]">
                  {broker.received.toLocaleString()}
                </td>
                <td
                  className={`px-3 font-mono font-bold ${broker.remaining === 0 ? "text-[var(--wms-success)]" : "text-[var(--wms-danger)]"}`}
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
                <td className="px-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenBrokerModal(broker)}
                      className="p-1.5 rounded-md hover:bg-blue-50 cursor-pointer transition-colors text-[var(--wms-accent-blue)]"
                      title="كشف حساب"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`هل أنت متأكد من الحذف؟`)) {
                          deleteBrokerMutation.mutate(broker.id);
                        }
                      }}
                      disabled={deleteBrokerMutation.isPending}
                      className="p-1.5 rounded-md hover:bg-red-50 cursor-pointer transition-colors text-red-500 disabled:opacity-50"
                      title="تصفير ومسح السجل"
                    >
                      {deleteBrokerMutation.isPending &&
                      deleteBrokerMutation.variables === broker.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {brokers.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  لا توجد بيانات للمعقبين حالياً
                </td>
              </tr>
            )}
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
                  تسجيل رصيد افتتاحي (تسويات سابقة)
                </span>
              </div>
              <button
                onClick={() => setIsPrevSettlementOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-[var(--wms-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="relative">
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  الاسم (معقب) *
                </label>
                <select
                  value={prevForm.targetId}
                  onChange={(e) =>
                    setPrevForm({ ...prevForm, targetId: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 h-[34px] text-[12px] outline-none appearance-none cursor-pointer"
                >
                  <option value="">اختر المعقب...</option>
                  {agentsList.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-2 top-[10px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  حتى تاريخ
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
                    إجمالي مستحق
                  </label>
                  <input
                    type="number"
                    value={prevForm.totalSettled}
                    onChange={(e) => {
                      const settled = e.target.value;
                      const remaining =
                        (parseFloat(settled) || 0) -
                        (parseFloat(prevForm.totalDelivered) || 0);
                      setPrevForm({
                        ...prevForm,
                        totalSettled: settled,
                        remaining: remaining.toString(),
                      });
                    }}
                    className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] font-mono outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    إجمالي مُسلّم
                  </label>
                  <input
                    type="number"
                    value={prevForm.totalDelivered}
                    onChange={(e) => {
                      const delivered = e.target.value;
                      const remaining =
                        (parseFloat(prevForm.totalSettled) || 0) -
                        (parseFloat(delivered) || 0);
                      setPrevForm({
                        ...prevForm,
                        totalDelivered: delivered,
                        remaining: remaining.toString(),
                      });
                    }}
                    className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] font-mono outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    المتبقي له
                  </label>
                  <input
                    type="number"
                    value={prevForm.remaining}
                    readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-md px-3 h-[34px] font-mono outline-none text-gray-500"
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
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 py-2 outline-none h-[50px] resize-none"
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

      {/* 2. Modal: تسجيل مستحق (إضافة تسوية) */}
      {isRecordSettlementOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full animate-in zoom-in-95"
            style={{ maxWidth: "460px" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <span className="text-[var(--wms-text)] font-bold text-[15px]">
                تسجيل مستحق لمعقب
              </span>
              <button
                onClick={() => setIsRecordSettlementOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-[var(--wms-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="relative">
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  اسم المعقب *
                </label>
                <select
                  value={recordForm.targetId}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, targetId: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 h-[34px] text-[12px] outline-none appearance-none cursor-pointer"
                >
                  <option value="">اختر المعقب...</option>
                  {agentsList.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  المبلغ المستحق *
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
                  البيان / المصدر
                </label>
                <input
                  type="text"
                  value={recordForm.source}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, source: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] outline-none text-[12px]"
                  placeholder="مثال: تعقيب رخصة بناء"
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
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 py-2 outline-none h-[60px] resize-none text-[12px]"
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t bg-gray-50">
              <button
                onClick={() => setIsRecordSettlementOpen(false)}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-surface-2)] text-[12px]"
              >
                إلغاء
              </button>
              <button
                onClick={() => recordMutation.mutate(recordForm)}
                disabled={
                  recordMutation.isPending ||
                  !recordForm.targetId ||
                  !recordForm.amount
                }
                className="px-4 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white text-[12px] font-bold disabled:opacity-50"
              >
                {recordMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "إضافة المستحق"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: صرف مبلغ للمعقب */}
      {isDeliverSettlementOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full animate-in zoom-in-95"
            style={{ maxWidth: "500px" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <span className="text-[var(--wms-text)] font-bold text-[15px]">
                صرف مبلغ لمعقب
              </span>
              <button
                onClick={() => setIsDeliverSettlementOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-[var(--wms-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar-slim">
              <div className="relative">
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  المستلم (المعقب) *
                </label>
                <select
                  value={deliverForm.targetId}
                  onChange={(e) =>
                    setDeliverForm({ ...deliverForm, targetId: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 h-[34px] text-[12px] outline-none appearance-none cursor-pointer"
                >
                  <option value="">اختر المعقب...</option>
                  {agentsList.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  المبلغ المصروف *
                </label>
                <input
                  type="number"
                  value={deliverForm.amount}
                  onChange={(e) =>
                    setDeliverForm({ ...deliverForm, amount: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] font-mono outline-none text-[16px] font-bold text-green-600 focus:border-green-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  طريقة الدفع
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
                    تاريخ الدفع
                  </label>
                  <input
                    type="date"
                    value={deliverForm.date}
                    onChange={(e) =>
                      setDeliverForm({ ...deliverForm, date: e.target.value })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] outline-none text-[12px]"
                  />
                </div>
                <div className="relative">
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    بواسطة (موظف)
                  </label>
                  <select
                    value={deliverForm.deliveredById}
                    onChange={(e) =>
                      setDeliverForm({
                        ...deliverForm,
                        deliveredById: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border rounded-md px-2 h-[34px] text-[12px] outline-none appearance-none cursor-pointer"
                  >
                    <option value="">اختر الموظف...</option>
                    {employeesList.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  ملاحظات / رقم الحوالة
                </label>
                <textarea
                  value={deliverForm.notes}
                  onChange={(e) =>
                    setDeliverForm({ ...deliverForm, notes: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 py-2 outline-none h-[50px] resize-none text-[12px]"
                ></textarea>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  مرفق (إيصال التحويل)
                </label>
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[var(--wms-border)] rounded-lg text-[var(--wms-text-muted)] cursor-pointer hover:border-blue-500 bg-gray-50 text-[12px]">
                  <Upload className="w-4 h-4 text-blue-500" />
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
            <div className="flex justify-end gap-2 px-5 py-3 border-t bg-gray-50">
              <button
                onClick={() => setIsDeliverSettlementOpen(false)}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-surface-2)] text-[12px]"
              >
                إلغاء
              </button>
              <button
                onClick={() => deliverMutation.mutate(deliverForm)}
                disabled={
                  deliverMutation.isPending ||
                  !deliverForm.targetId ||
                  !deliverForm.amount
                }
                className="px-4 py-1.5 rounded-md bg-green-600 text-white text-[12px] font-bold flex gap-2 disabled:opacity-50"
              >
                {deliverMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "صرف المبلغ"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: كشف الحساب والمعاينة الشاملة للمعقب */}
      {isBrokerModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[40] flex items-center justify-center p-4"
          dir="rtl"
        >
          <div
            className="bg-white border border-[var(--wms-border)] rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
            style={{ width: "75vw", height: "88vh" }}
          >
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
                    <span className="text-[var(--wms-text)] text-[15px] font-bold">
                      كشف حساب وتفاصيل
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                      معقب
                    </span>
                  </div>
                  <div className="text-[var(--wms-text-sec)] mt-0.5 text-[12px] relative">
                    {!selectedBroker ? (
                      <select
                        value={selectedBroker?.id || ""}
                        onChange={(e) => {
                          const emp = agentsList.find(
                            (x) => x.id === e.target.value,
                          );
                          if (emp)
                            setSelectedBroker({ id: emp.id, name: emp.name });
                        }}
                        className="bg-transparent border-none outline-none font-bold text-blue-600 cursor-pointer p-0 pr-1 appearance-none"
                      >
                        <option value="" disabled>
                          -- اختر معقباً --
                        </option>
                        {agentsList.map((emp) => (
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
                  style={{ fontSize: "12px", fontWeight: "bold" }}
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
                    setIsBrokerModalOpen(false);
                    setSelectedBroker(null);
                  }}
                  className="text-gray-400 hover:text-red-500 cursor-pointer p-1 rounded hover:bg-red-50 transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex border-b border-[var(--wms-border)] px-5 shrink-0 bg-gray-50/50">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 cursor-pointer transition-colors ${activeTab === "overview" ? "text-blue-600 border-b-2 border-blue-600 font-bold" : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-medium"}`}
                style={{ fontSize: "12px" }}
              >
                نظرة عامة
              </button>
              <button
                onClick={() => setActiveTab("transactions")}
                className={`px-4 py-2 cursor-pointer transition-colors ${activeTab === "transactions" ? "text-blue-600 border-b-2 border-blue-600 font-bold" : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-medium"}`}
                style={{ fontSize: "12px" }}
              >
                المعاملات
              </button>
              <button
                onClick={() => setActiveTab("settlements")}
                className={`px-4 py-2 cursor-pointer transition-colors ${activeTab === "settlements" ? "text-blue-600 border-b-2 border-blue-600 font-bold" : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-medium"}`}
                style={{ fontSize: "12px" }}
              >
                التسويات (المستحقات)
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`px-4 py-2 cursor-pointer transition-colors ${activeTab === "payments" ? "text-blue-600 border-b-2 border-blue-600 font-bold" : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-medium"}`}
                style={{ fontSize: "12px" }}
              >
                سجل المدفوعات (المنصرف)
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto p-8 custom-scrollbar-slim"
              style={{ backgroundColor: "rgb(249, 250, 251)" }}
            >
              {!selectedBroker ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <User className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-bold">
                    الرجاء اختيار معقب من الأعلى لعرض بياناته
                  </p>
                </div>
              ) : isLoadingBrokerTx ||
                isLoadingBrokerStl ||
                isLoadingBrokerPay ? (
                <div className="flex flex-col items-center justify-center h-full text-blue-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="text-sm font-semibold">
                    جاري جلب البيانات من السيرفر...
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-w-[900px] mx-auto animate-in fade-in duration-300">
                  {/* نظرة عامة */}
                  {activeTab === "overview" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
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
                          معقب
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
                            <span className="font-mono text-[var(--wms-text)] font-bold">
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
                            إجمالي المستحق له
                          </div>
                          <div
                            className="font-mono"
                            style={{
                              fontSize: "16px",
                              fontWeight: 700,
                              color: "rgb(26, 35, 50)",
                            }}
                          >
                            {currentAgentStats.totalFees.toLocaleString()}
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
                            إجمالي المسلّم
                          </div>
                          <div
                            className="font-mono"
                            style={{
                              fontSize: "16px",
                              fontWeight: 700,
                              color: "rgb(22, 163, 74)",
                            }}
                          >
                            {currentAgentStats.received.toLocaleString()}
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
                            المتبقي (عليه / له)
                          </div>
                          <div
                            className="font-mono"
                            style={{
                              fontSize: "16px",
                              fontWeight: 700,
                              color: "rgb(220, 38, 38)",
                            }}
                          >
                            {currentAgentStats.remaining.toLocaleString()}
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
                            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "rgb(26, 35, 50)",
                              }}
                            >
                              أداء الفترة (معاملات)
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div
                              className="flex justify-between"
                              style={{ fontSize: "11px" }}
                            >
                              <span className="text-gray-500">
                                معاملات مسجلة باسمه
                              </span>
                              <span className="font-mono font-bold text-gray-800">
                                {brokerTransactions.length}
                              </span>
                            </div>
                            <div
                              className="flex justify-between"
                              style={{ fontSize: "11px" }}
                            >
                              <span className="text-gray-500">
                                معاملات مكتملة
                              </span>
                              <span className="font-mono font-bold text-green-600">
                                {
                                  brokerTransactions.filter(
                                    (tx) => tx.status === "مكتملة",
                                  ).length
                                }
                              </span>
                            </div>
                            <div
                              className="flex justify-between"
                              style={{ fontSize: "11px" }}
                            >
                              <span className="text-gray-500">
                                معاملات جارية
                              </span>
                              <span className="font-mono font-bold text-amber-600">
                                {
                                  brokerTransactions.filter(
                                    (tx) => tx.status !== "مكتملة",
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
                            <HandCoins className="w-3.5 h-3.5 text-green-600" />
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "rgb(26, 35, 50)",
                              }}
                            >
                              آخر المستحقات
                            </span>
                          </div>
                          <div className="flex flex-col h-full justify-center text-center text-gray-400 text-xs">
                            {brokerSettlements.length > 0 ? (
                              <div className="text-right space-y-2">
                                <div className="flex justify-between border-b pb-1">
                                  <span className="text-gray-600 font-bold">
                                    {brokerSettlements[0].date}
                                  </span>
                                  <span className="text-blue-600 font-mono font-bold">
                                    +{brokerSettlements[0].amount}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              "لا توجد حركات مسجلة"
                            )}
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
                            <TriangleAlert className="w-3.5 h-3.5 text-amber-500" />
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
                            {currentAgentStats.remaining > 0 ? (
                              <div
                                className="flex items-center gap-1.5"
                                style={{ fontSize: "11px" }}
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                <span className="text-gray-600">
                                  مبالغ مستحقة للمعقب لم يتم صرفها (
                                  {currentAgentStats.remaining.toLocaleString()}
                                  )
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-green-600 font-bold">
                                الحساب مُسوّى بالكامل
                              </span>
                            )}
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
                          style={{ fontSize: "9px", color: "rgb(146, 64, 14)" }}
                        >
                          هذا النظام مخصص للتسويات والمتابعة الداخلية المبسطة —
                          الأرقام تشغيلية وليست معالجة محاسبية رسمية.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* المعاملات */}
                  {activeTab === "transactions" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-2 mb-4 bg-gray-50 p-3 rounded border border-gray-100">
                        <Eye className="w-4 h-4 text-gray-500" />
                        <span className="text-[13px] font-bold text-gray-700">
                          سجل المعاملات المرتبطة بهذا المعقب (للاطلاع فقط)
                        </span>
                      </div>
                      <table className="w-full text-[11px] border-collapse">
                        <thead className="sticky top-0 z-10 bg-[var(--wms-surface-2)]">
                          <tr>
                            <th className="text-right px-2 py-1.5 font-bold text-gray-500 bg-gray-100 border-b border-gray-200">
                              المرجع
                            </th>
                            <th className="text-right px-2 py-1.5 font-bold text-gray-500 bg-gray-100 border-b border-gray-200">
                              المالك / الوصف
                            </th>
                            <th className="text-right px-2 py-1.5 font-bold text-gray-500 bg-gray-100 border-b border-gray-200">
                              إجمالي أتعاب المعاملة
                            </th>
                            <th className="text-right px-2 py-1.5 font-bold text-gray-500 bg-gray-100 border-b border-gray-200">
                              حالة المعاملة
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {brokerTransactions.length > 0 ? (
                            brokerTransactions.map((tx, idx) => (
                              <tr
                                key={tx.id}
                                className={
                                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }
                              >
                                <td className="px-2 py-2 font-mono text-gray-500 border-b border-gray-200">
                                  {tx.ref}
                                </td>
                                <td className="px-2 py-2 text-gray-600 border-b border-gray-200 font-semibold">
                                  {tx.client} —{" "}
                                  <span className="font-normal text-gray-400">
                                    {tx.type}
                                  </span>
                                </td>
                                <td className="px-2 py-2 font-mono text-gray-600 border-b border-gray-200">
                                  {tx.totalFees.toLocaleString()}
                                </td>
                                <td className="px-2 py-2 border-b border-gray-200">
                                  <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] bg-gray-200 text-gray-600">
                                    {tx.status || "مسجلة"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="4"
                                className="text-center py-6 text-gray-400"
                              >
                                لا توجد معاملات مرتبطة مسجلة
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                          <tr>
                            <td
                              colSpan="2"
                              className="px-3 py-2 font-bold text-gray-700"
                            >
                              المجموع ({brokerTransactions.length})
                            </td>
                            <td className="px-3 py-2 font-mono font-bold text-gray-800">
                              {modalTotals.totalFees.toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* سجل التسويات */}
                  {activeTab === "settlements" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 bg-gray-50 p-3 rounded border border-gray-100">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-[13px] font-bold text-gray-800">
                          سجل المستحقات والأتعاب المضافة للمعقب (رصيد موجب)
                        </span>
                      </div>
                      <table className="w-full text-[12px] border-collapse">
                        <thead>
                          <tr>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300 w-[15%]">
                              المرجع
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300 w-[15%]">
                              التاريخ
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300 w-[20%]">
                              النوع
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300 w-[35%]">
                              ملاحظات
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300 w-[15%]">
                              المبلغ المستحق
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {brokerSettlements.length > 0 ? (
                            brokerSettlements.map((stl, idx) => (
                              <tr
                                key={stl.id}
                                className={
                                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }
                              >
                                <td className="px-3 py-2.5 border-b border-gray-200 text-gray-600 font-mono font-semibold">
                                  {stl.ref}
                                </td>
                                <td className="px-3 py-2.5 border-b border-gray-200 text-gray-500 font-mono">
                                  {stl.date}
                                </td>
                                <td className="px-3 py-2.5 border-b border-gray-200 font-bold text-gray-700">
                                  {stl.type}
                                </td>
                                <td className="px-3 py-2.5 border-b border-gray-200 text-gray-600">
                                  {stl.notes}
                                </td>
                                <td className="px-3 py-2.5 border-b border-gray-200 font-mono font-bold text-blue-700">
                                  +{stl.amount.toLocaleString()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="5"
                                className="text-center py-8 text-gray-400 font-semibold"
                              >
                                لا توجد حركات مستحقات مسجلة
                              </td>
                            </tr>
                          )}
                        </tbody>
                        {brokerSettlements.length > 0 && (
                          <tfoot>
                            <tr className="bg-blue-50/50">
                              <td
                                colSpan="4"
                                className="px-3 py-3 font-bold text-[12px] text-left text-gray-700"
                              >
                                إجمالي المستحقات:
                              </td>
                              <td className="px-3 py-3 font-mono font-bold text-blue-700 text-[14px]">
                                {brokerSettlements
                                  .reduce((acc, curr) => acc + curr.amount, 0)
                                  .toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}

                  {/* سجل المدفوعات */}
                  {activeTab === "payments" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 bg-green-50 p-3 rounded border border-green-100">
                        <Send className="w-4 h-4 text-green-600" />
                        <span className="text-[13px] font-bold text-green-800">
                          سجل المدفوعات والمبالغ المسلمة (رصيد سالب)
                        </span>
                      </div>
                      <table className="w-full text-[12px] border-collapse">
                        <thead>
                          <tr>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300 w-[15%]">
                              المرجع
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300 w-[15%]">
                              التاريخ
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300 w-[15%]">
                              الطريقة
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300 w-[40%]">
                              المسلِّم / ملاحظات
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300 w-[15%]">
                              المبلغ المصروف
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {brokerPayments.length > 0 ? (
                            brokerPayments.map((pay, idx) => (
                              <tr
                                key={pay.id}
                                className={
                                  idx % 2 === 0
                                    ? "bg-white hover:bg-green-50/30"
                                    : "bg-gray-50 hover:bg-green-50/30"
                                }
                              >
                                <td className="px-3 py-2.5 font-mono text-gray-600 font-bold border-b border-gray-200">
                                  {pay.ref}
                                </td>
                                <td className="px-3 py-2.5 font-mono text-gray-500 border-b border-gray-200">
                                  {pay.date}
                                </td>
                                <td className="px-3 py-2.5 border-b border-gray-200">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${pay.method === "تحويل بنكي" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-700"}`}
                                  >
                                    {pay.method}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-gray-600 border-b border-gray-200 text-[11px] truncate max-w-[200px]">
                                  {pay.deliveredBy}
                                </td>
                                <td className="px-3 py-2.5 font-mono font-bold text-green-600 border-b border-gray-200">
                                  -{pay.amount.toLocaleString()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="5"
                                className="text-center py-8 text-gray-400 font-semibold"
                              >
                                لا توجد أي مسحوبات مسجلة لهذا المعقب
                              </td>
                            </tr>
                          )}
                        </tbody>
                        {brokerPayments.length > 0 && (
                          <tfoot className="bg-green-50/50">
                            <tr>
                              <td
                                colSpan="4"
                                className="px-3 py-3 font-bold text-[12px] text-left text-gray-700"
                              >
                                إجمالي المبالغ المسلمة:
                              </td>
                              <td className="px-3 py-3 font-mono font-bold text-green-700 text-[14px]">
                                {brokerPayments
                                  .reduce((acc, curr) => acc + curr.amount, 0)
                                  .toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSettlementsPage;
