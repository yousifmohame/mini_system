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
  X,
  Upload,
  CreditCard,
  Banknote,
  Printer,
  Loader2,
  Trash2,
  Star,
  ChevronDown,
} from "lucide-react";

const StakeholderSettlementsPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // ==========================================
  // States للتحكم في النوافذ المنبثقة
  // ==========================================
  const [isPrevSettlementOpen, setIsPrevSettlementOpen] = useState(false);
  const [isRecordSettlementOpen, setIsRecordSettlementOpen] = useState(false);
  const [isDeliverSettlementOpen, setIsDeliverSettlementOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [selectedStakeholder, setSelectedStakeholder] = useState(null);
  const [isStakeholderModalOpen, setIsStakeholderModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // ==========================================
  // 💡 1. جلب بيانات سجل الأشخاص الشامل
  // ==========================================
  const { data: persons = [], isLoading: isLoadingPersons } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => {
      const res = await api.get("/persons");
      return res.data?.data || [];
    },
  });

  // 💡 2. فلترة الأشخاص حسب الدور
  const stakeholdersList = useMemo(
    () => persons.filter((p) => p.role === "صاحب مصلحة"),
    [persons],
  );
  const employeesList = useMemo(
    () => persons.filter((p) => p.role === "موظف"),
    [persons],
  );

  // ==========================================
  // جلب إحصائيات الصفحة من الباك إند
  // ==========================================
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["stakeholder-settlements-dashboard"],
    queryFn: async () => {
      const res = await api.get(
        "/private-settlements/dashboard?type=صاحب مصلحة",
      );
      return res.data;
    },
  });

  const financials = dashboardData?.financials || {
    bankBalance: 0,
    cashBalance: 0,
    taxEstimate: 0,
    undelivered: 0,
    availableBalance: 0,
  };

  // 💡 3. فلترة صارمة: منع ظهور أي شخص ليس "صاحب مصلحة"
  const stakeholders = (dashboardData?.brokers || [])
    .filter((stakeholder) => {
      const personInfo = persons.find((p) => p.id === stakeholder.id);
      return personInfo && personInfo.role === "صاحب مصلحة";
    })
    .map((stakeholder) => {
      const personInfo = persons.find((p) => p.id === stakeholder.id);
      return { ...stakeholder, name: personInfo.name };
    });

  // ==========================================
  // جلب تفاصيل المودال (معاملات، تسويات، مدفوعات)
  // ==========================================
  const {
    data: stakeholderTransactions = [],
    isLoading: isLoadingStakeholderTx,
  } = useQuery({
    queryKey: ["stakeholder-transactions", selectedStakeholder?.id],
    queryFn: async () => {
      const res = await api.get(
        `/private-settlements/broker/${selectedStakeholder.id}/transactions?role=stakeholder`,
      );
      return res.data?.data || [];
    },
    enabled:
      !!selectedStakeholder &&
      isStakeholderModalOpen &&
      activeTab === "transactions",
  });

  const {
    data: stakeholderSettlements = [],
    isLoading: isLoadingStakeholderStl,
  } = useQuery({
    queryKey: ["stakeholder-settlements", selectedStakeholder?.id],
    queryFn: async () => {
      const res = await api.get(
        `/private-settlements/broker/${selectedStakeholder.id}/settlements`,
      );
      return res.data?.data || [];
    },
    enabled:
      !!selectedStakeholder &&
      isStakeholderModalOpen &&
      activeTab === "settlements",
  });

  const { data: stakeholderPayments = [], isLoading: isLoadingStakeholderPay } =
    useQuery({
      queryKey: ["stakeholder-payments", selectedStakeholder?.id],
      queryFn: async () => {
        const res = await api.get(
          `/private-settlements/broker/${selectedStakeholder.id}/payments`,
        );
        return res.data?.data || [];
      },
      enabled:
        !!selectedStakeholder &&
        isStakeholderModalOpen &&
        activeTab === "payments",
    });

  // ==========================================
  // حساب المجاميع
  // ==========================================

  // 💡 حساب مجاميع المعاملات داخل المودال ديناميكياً
  const modalTotals = stakeholderTransactions.reduce(
    (acc, tx) => {
      acc.totalFees += parseFloat(tx.totalFees) || 0;
      acc.paidAmount += parseFloat(tx.paidAmount) || 0;
      acc.remainingAmount += parseFloat(tx.remainingAmount) || 0;
      return acc;
    },
    { totalFees: 0, paidAmount: 0, remainingAmount: 0 },
  );

  const totals = stakeholders.reduce(
    (acc, curr) => {
      acc.fees += curr.totalFees;
      acc.received += curr.received;
      acc.remaining += curr.remaining;
      return acc;
    },
    { fees: 0, received: 0, remaining: 0 },
  );

  const currentStakeholderStats = stakeholders.find(
    (p) => p.id === selectedStakeholder?.id,
  ) || {
    totalFees: 0,
    received: 0,
    remaining: 0,
    txCount: 0,
    statusText: "غير محدد",
  };

  // ==========================================
  // دوال الإرسال (Mutations)
  // ==========================================

  const [prevForm, setPrevForm] = useState({
    type: "صاحب مصلحة",
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
      toast.success("تم الحفظ بنجاح");
      queryClient.invalidateQueries(["stakeholder-settlements-dashboard"]);
      setIsPrevSettlementOpen(false);
    },
  });

  const [recordForm, setRecordForm] = useState({
    type: "صاحب مصلحة",
    targetId: "",
    amount: "",
    source: "",
    notes: "",
  });
  const recordMutation = useMutation({
    mutationFn: async (data) => api.post("/private-settlements/record", data),
    onSuccess: () => {
      toast.success("تم الحفظ بنجاح");
      queryClient.invalidateQueries(["stakeholder-settlements-dashboard"]);
      setIsRecordSettlementOpen(false);
    },
  });

  const deleteStakeholderMutation = useMutation({
    mutationFn: async (stakeholderId) =>
      api.delete(`/private-settlements/broker/${stakeholderId}`),
    onSuccess: () => {
      toast.success("تم مسح السجل المالي لصاحب المصلحة بنجاح");
      queryClient.invalidateQueries(["stakeholder-settlements-dashboard"]);
    },
    onError: () => toast.error("حدث خطأ أثناء محاولة الحذف"),
  });

  const [deliverForm, setDeliverForm] = useState({
    type: "صاحب مصلحة",
    targetId: "",
    amount: "",
    method: "تحويل بنكي",
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
      toast.success("تم تسليم المبلغ بنجاح");
      queryClient.invalidateQueries(["stakeholder-settlements-dashboard"]);
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
              المتبقي في الصندوق
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
              أصحاب المصلحة
            </div>
            <div className="font-mono text-[15px] font-bold text-[var(--wms-warning)]">
              {stakeholders.length}
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
          <span>رصيد افتتاحي مستحق</span>
        </button>
        <button
          onClick={() => setIsRecordSettlementOpen(true)}
          className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90 h-[32px] text-[12px]"
        >
          <HandCoins className="w-3.5 h-3.5" />
          <span>إضافة مستحق (ربح/نسبة)</span>
        </button>
        <button
          onClick={() => setIsDeliverSettlementOpen(true)}
          className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-success)] text-white cursor-pointer hover:opacity-90 h-[32px] text-[12px]"
        >
          <Send className="w-3.5 h-3.5" />
          <span>صرف مبلغ لصاحب مصلحة</span>
        </button>
      </div>

      {/* 4. الجدول الرئيسي */}
      <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[var(--wms-surface-2)] h-[36px]">
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                اسم صاحب المصلحة
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                حركات مسجلة
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                إجمالي المستحقات
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                ما تم صرفه
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                المتبقي له بالصندوق
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                حالة الحساب
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {stakeholders.map((stakeholder) => (
              <tr
                key={stakeholder.id}
                className="border-b border-[var(--wms-border)]/30 hover:bg-[var(--wms-surface-2)]/40 transition-colors h-[36px]"
              >
                <td className="px-3 text-[var(--wms-text)] font-bold flex items-center gap-2 mt-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  {stakeholder.name}
                </td>
                <td className="px-3 font-mono text-[var(--wms-text-sec)]">
                  {stakeholder.txCount}
                </td>
                <td className="px-3 font-mono text-[var(--wms-text)] font-bold">
                  {stakeholder.totalFees.toLocaleString()}
                </td>
                <td className="px-3 font-mono text-[var(--wms-success)]">
                  {stakeholder.received.toLocaleString()}
                </td>
                <td
                  className={`px-3 font-mono font-bold ${stakeholder.remaining === 0 ? "text-gray-500" : "text-amber-600"}`}
                >
                  {stakeholder.remaining.toLocaleString()}
                </td>
                <td className="px-3">
                  <span
                    className={`inline-flex items-center h-[20px] px-1.5 rounded-full text-[10px] font-semibold ${stakeholder.remaining === 0 ? "bg-gray-100 text-gray-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {stakeholder.statusText}
                  </span>
                </td>
                <td className="px-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedStakeholder({
                          id: stakeholder.id,
                          name: stakeholder.name,
                        });
                        setActiveTab("overview");
                        setIsStakeholderModalOpen(true);
                      }}
                      className="p-1.5 rounded-md hover:bg-blue-50 cursor-pointer transition-colors text-[var(--wms-accent-blue)]"
                      title="كشف حساب"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `هل أنت متأكد من مسح وتصفير حساب صاحب المصلحة "${stakeholder.name}" بالكامل؟`,
                          )
                        ) {
                          deleteStakeholderMutation.mutate(stakeholder.id);
                        }
                      }}
                      disabled={deleteStakeholderMutation.isPending}
                      className="p-1.5 rounded-md hover:bg-red-50 cursor-pointer transition-colors text-red-500 disabled:opacity-50"
                      title="تصفير ومسح السجل"
                    >
                      {deleteStakeholderMutation.isPending &&
                      deleteStakeholderMutation.variables === stakeholder.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {stakeholders.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  لا توجد حسابات مسجلة لأصحاب المصلحة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ======================= MODALS ======================= */}
      {/* 1. Modal: رصيد افتتاحي */}
      {isPrevSettlementOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full animate-in zoom-in-95"
            style={{ maxWidth: "500px" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <div>
                <span className="text-[var(--wms-text)] font-bold">
                  تسجيل رصيد افتتاحي (مستحقات سابقة)
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
                  الاسم *
                </label>
                <select
                  value={prevForm.targetId}
                  onChange={(e) =>
                    setPrevForm({ ...prevForm, targetId: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 h-[34px] text-[12px] outline-none appearance-none cursor-pointer"
                >
                  <option value="">اختر صاحب المصلحة...</option>
                  {stakeholdersList.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
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
                    إجمالي مسلّم (دفعات)
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
                    صافي المتبقي
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

      {/* 2. Modal: إضافة مستحق جديد */}
      {isRecordSettlementOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full animate-in zoom-in-95"
            style={{ maxWidth: "460px" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <span className="text-[var(--wms-text)] font-bold text-[15px]">
                تسجيل مستحق (نسبة أو ربح)
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
                  اسم صاحب المصلحة *
                </label>
                <select
                  value={recordForm.targetId}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, targetId: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 h-[34px] text-[12px] outline-none appearance-none cursor-pointer"
                >
                  <option value="">اختر صاحب المصلحة...</option>
                  {stakeholdersList.map((e) => (
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
                  مصدر المستحق / البيان
                </label>
                <input
                  type="text"
                  value={recordForm.source}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, source: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] outline-none text-[12px]"
                  placeholder="مثال: نسبة من مشروع الملقا"
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
                  placeholder="ملاحظات إضافية..."
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

      {/* 3. Modal: صرف مبلغ */}
      {isDeliverSettlementOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full animate-in zoom-in-95"
            style={{ maxWidth: "500px" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <span className="text-[var(--wms-text)] font-bold text-[15px]">
                صرف دفعة مالية
              </span>
              <button
                onClick={() => setIsDeliverSettlementOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-[var(--wms-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="relative">
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  المستفيد *
                </label>
                <select
                  value={deliverForm.targetId}
                  onChange={(e) =>
                    setDeliverForm({ ...deliverForm, targetId: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 h-[34px] text-[12px] outline-none appearance-none cursor-pointer"
                >
                  <option value="">اختر صاحب المصلحة...</option>
                  {stakeholdersList.map((e) => (
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
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] font-mono outline-none text-[16px] font-bold text-green-600"
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
                      setDeliverForm({ ...deliverForm, method: "تحويل بنكي" })
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-[11px] ${deliverForm.method === "تحويل بنكي" ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>تحويل بنكي</span>
                  </button>
                  <button
                    onClick={() =>
                      setDeliverForm({ ...deliverForm, method: "شيك" })
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-[11px] ${deliverForm.method === "شيك" ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>شيك بنكي</span>
                  </button>
                  <button
                    onClick={() =>
                      setDeliverForm({ ...deliverForm, method: "نقدي" })
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-[11px] ${deliverForm.method === "نقدي" ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>نقدي</span>
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
                    بواسطة / من حساب
                  </label>
                  <select
                    value={deliverForm.deliveredById}
                    onChange={(e) =>
                      setDeliverForm({
                        ...deliverForm,
                        deliveredById: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] text-[12px] outline-none appearance-none cursor-pointer"
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
                  مرفق (إيصال التحويل / الشيك)
                </label>
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[var(--wms-border)] rounded-lg text-[var(--wms-text-muted)] cursor-pointer hover:border-blue-500 bg-gray-50 text-[12px]">
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
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--wms-border)]">
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
                className="px-4 py-1.5 rounded-md bg-green-600 text-white text-[12px] font-bold disabled:opacity-50"
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

      {/* 4. Modal: كشف الحساب والمعاينة الشاملة */}
      {isStakeholderModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          dir="rtl"
        >
          <div
            className="bg-white border border-[var(--wms-border)] rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
            style={{ width: "75vw", height: "88vh" }}
          >
            {/* Header المودال */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-500/10">
                  <Star className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--wms-text)] text-[15px] font-bold">
                      كشف حساب صاحب مصلحة
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100">
                      صاحب مصلحة
                    </span>
                  </div>
                  <div className="text-[var(--wms-text-sec)] mt-0.5 text-[12px] relative">
                    {!selectedStakeholder ? (
                      <select
                        value={selectedStakeholder?.id || ""}
                        onChange={(e) => {
                          const emp = stakeholdersList.find(
                            (x) => x.id === e.target.value,
                          );
                          if (emp)
                            setSelectedStakeholder({
                              id: emp.id,
                              name: emp.name,
                            });
                        }}
                        className="bg-transparent border-none outline-none font-bold text-amber-600 cursor-pointer p-0 pr-1 appearance-none"
                      >
                        <option value="" disabled>
                          -- اختر صاحب مصلحة --
                        </option>
                        {stakeholdersList.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-semibold text-gray-700">
                        {selectedStakeholder.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ fontSize: "12px", fontWeight: "bold" }}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير كشف حساب PDF</span>
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
                    setIsStakeholderModalOpen(false);
                    setSelectedStakeholder(null);
                  }}
                  className="text-gray-400 hover:text-red-500 cursor-pointer p-1 rounded hover:bg-red-50 transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--wms-border)] px-5 shrink-0 bg-gray-50/50">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 cursor-pointer transition-colors ${activeTab === "overview" ? "text-amber-600 border-b-2 border-amber-500 font-bold" : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-medium"}`}
                style={{ fontSize: "12px" }}
              >
                نظرة عامة
              </button>
              <button
                onClick={() => setActiveTab("transactions")}
                className={`px-4 py-2 cursor-pointer transition-colors ${activeTab === "transactions" ? "text-amber-600 border-b-2 border-amber-500 font-bold" : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-medium"}`}
                style={{ fontSize: "12px" }}
              >
                المعاملات
              </button>
              <button
                onClick={() => setActiveTab("settlements")}
                className={`px-4 py-2 cursor-pointer transition-colors ${activeTab === "settlements" ? "text-amber-600 border-b-2 border-amber-500 font-bold" : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-medium"}`}
                style={{ fontSize: "12px" }}
              >
                سجل المستحقات المضافة
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`px-4 py-2 cursor-pointer transition-colors ${activeTab === "payments" ? "text-amber-600 border-b-2 border-amber-500 font-bold" : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-medium"}`}
                style={{ fontSize: "12px" }}
              >
                سجل الدفعات والمسحوبات
              </button>
            </div>

            {/* Content Area */}
            <div
              className="flex-1 overflow-y-auto p-8 custom-scrollbar-slim"
              style={{ backgroundColor: "rgb(249, 250, 251)" }}
            >
              {!selectedStakeholder ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Star className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-bold">
                    الرجاء اختيار صاحب مصلحة من الأعلى لعرض الحساب
                  </p>
                </div>
              ) : isLoadingStakeholderTx ||
                isLoadingStakeholderStl ||
                isLoadingStakeholderPay ? (
                <div className="flex flex-col items-center justify-center h-full text-amber-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="text-sm font-semibold">
                    جاري جلب البيانات من السيرفر...
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-w-[900px] mx-auto animate-in fade-in duration-300">
                  {/* === نظرة عامة === */}
                  {activeTab === "overview" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
                      <div className="text-center mb-6 pb-4 border-b border-gray-100">
                        <div
                          style={{
                            fontSize: "20px",
                            fontWeight: 800,
                            color: "rgb(26, 35, 50)",
                          }}
                        >
                          كشف حساب: {selectedStakeholder.name}
                        </div>
                        <div
                          className="flex items-center justify-center gap-4 mt-2 text-gray-400"
                          style={{ fontSize: "11px" }}
                        >
                          <span>الفترة: حتى تاريخه</span>
                          <span>•</span>
                          <span>
                            تاريخ الإصدار:{" "}
                            <span className="font-mono text-gray-700 font-bold">
                              {new Date().toISOString().split("T")[0]}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="p-4 rounded-xl text-center bg-gray-50 border border-gray-200">
                          <div className="text-[11px] text-gray-500 font-semibold mb-1">
                            إجمالي المبالغ المستحقة له
                          </div>
                          <div className="font-mono text-2xl font-bold text-gray-800">
                            {currentStakeholderStats.totalFees.toLocaleString()}{" "}
                            <span className="text-[10px]">ر.س</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl text-center bg-green-50 border border-green-100">
                          <div className="text-[11px] text-green-700 font-semibold mb-1">
                            إجمالي المسحوبات (الدفعات)
                          </div>
                          <div className="font-mono text-2xl font-bold text-green-700">
                            {currentStakeholderStats.received.toLocaleString()}{" "}
                            <span className="text-[10px]">ر.س</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl text-center bg-amber-50 border border-amber-100">
                          <div className="text-[11px] text-amber-700 font-semibold mb-1">
                            رصيد المتبقي له بالصندوق
                          </div>
                          <div className="font-mono text-2xl font-bold text-amber-700">
                            {currentStakeholderStats.remaining.toLocaleString()}{" "}
                            <span className="text-[10px]">ر.س</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === المعاملات === */}
                  {activeTab === "transactions" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 bg-blue-50 p-3 rounded border border-blue-100">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-[13px] font-bold text-gray-800">
                          جميع المعاملات المرتبطة بـ {selectedStakeholder.name}
                        </span>
                      </div>
                      <table className="w-full text-[12px] border-collapse">
                        <thead>
                          <tr>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              المرجع
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              العميل / الوصف
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              إجمالي الأتعاب
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              المدفوع
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              المتبقي
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              التاريخ
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              الحالة
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stakeholderTransactions.length > 0 ? (
                            stakeholderTransactions.map((tx, idx) => (
                              <tr
                                key={tx.id}
                                className={
                                  idx % 2 === 0
                                    ? "bg-white hover:bg-blue-50/30"
                                    : "bg-gray-50 hover:bg-blue-50/30"
                                }
                              >
                                <td className="px-3 py-2.5 font-mono text-blue-600 font-bold border-b border-gray-200">
                                  {tx.ref}
                                </td>
                                <td className="px-3 py-2.5 font-bold text-gray-700 border-b border-gray-200">
                                  {tx.client} — {tx.type}
                                </td>
                                <td className="px-3 py-2.5 font-mono font-bold border-b border-gray-200">
                                  {tx.totalFees.toLocaleString()}
                                </td>
                                <td className="px-3 py-2.5 font-mono font-bold text-green-600 border-b border-gray-200">
                                  {tx.paidAmount.toLocaleString()}
                                </td>
                                <td className="px-3 py-2.5 font-mono font-bold text-red-600 border-b border-gray-200">
                                  {tx.remainingAmount.toLocaleString()}
                                </td>
                                <td className="px-3 py-2.5 font-mono text-gray-500 border-b border-gray-200">
                                  {tx.date}
                                </td>
                                <td className="px-3 py-2.5 border-b border-gray-200">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${tx.status === "مكتملة" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                                  >
                                    {tx.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="7"
                                className="text-center py-8 text-gray-400 font-semibold"
                              >
                                لا توجد معاملات مرتبطة بهذا الشخص
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
                              المجموع ({stakeholderTransactions.length})
                            </td>
                            <td className="px-3 py-2 font-mono font-bold text-gray-800">
                              {modalTotals.totalFees.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 font-mono font-bold text-green-600">
                              {modalTotals.paidAmount.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 font-mono font-bold text-red-600">
                              {modalTotals.remainingAmount.toLocaleString()}
                            </td>
                            <td colSpan="2"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* === سجل المستحقات === */}
                  {activeTab === "settlements" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 bg-gray-50 p-3 rounded border border-gray-100">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-[13px] font-bold text-gray-800">
                          سجل المستحقات والمبالغ المضافة (رصيد موجب)
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
                              المصدر / البيان
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
                          {stakeholderSettlements.length > 0 ? (
                            stakeholderSettlements.map((stl, idx) => (
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
                        {stakeholderSettlements.length > 0 && (
                          <tfoot>
                            <tr className="bg-blue-50/50">
                              <td
                                colSpan="4"
                                className="px-3 py-3 font-bold text-[12px] text-left text-gray-700"
                              >
                                إجمالي المستحقات المضافة:
                              </td>
                              <td className="px-3 py-3 font-mono font-bold text-blue-700 text-[14px]">
                                {stakeholderSettlements
                                  .reduce((acc, curr) => acc + curr.amount, 0)
                                  .toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}

                  {/* === سجل المسحوبات === */}
                  {activeTab === "payments" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 bg-green-50 p-3 rounded border border-green-100">
                        <Send className="w-4 h-4 text-green-600" />
                        <span className="text-[13px] font-bold text-green-800">
                          سجل المسحوبات والمبالغ المصروفة (رصيد سالب)
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
                              بواسطة / ملاحظات
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300 w-[15%]">
                              المبلغ المسحوب
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stakeholderPayments.length > 0 ? (
                            stakeholderPayments.map((pay, idx) => (
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
                                لا توجد أي مسحوبات مسجلة
                              </td>
                            </tr>
                          )}
                        </tbody>
                        {stakeholderPayments.length > 0 && (
                          <tfoot>
                            <tr className="bg-green-50/50">
                              <td
                                colSpan="4"
                                className="px-3 py-3 font-bold text-[12px] text-left text-gray-700"
                              >
                                إجمالي المبالغ المسلمة:
                              </td>
                              <td className="px-3 py-3 font-mono font-bold text-green-700 text-[14px]">
                                {stakeholderPayments
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

export default StakeholderSettlementsPage;
