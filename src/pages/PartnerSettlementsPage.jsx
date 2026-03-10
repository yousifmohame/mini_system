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
  Users,
  ChevronDown,
} from "lucide-react";

const PartnerSettlementsPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // ==========================================
  // States للتحكم في النوافذ المنبثقة
  // ==========================================
  const [isPrevSettlementOpen, setIsPrevSettlementOpen] = useState(false);
  const [isRecordSettlementOpen, setIsRecordSettlementOpen] = useState(false);
  const [isDeliverSettlementOpen, setIsDeliverSettlementOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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

  // 2. فلترة الأشخاص حسب الدور لاستخدامهم في القوائم المنسدلة
  const partnersList = useMemo(
    () => persons.filter((p) => p.role === "شريك"),
    [persons],
  );

  // دالة مساعدة لجلب القائمة الصحيحة بناءً على نوع التسوية المحدد (إن لزم الأمر)
  const getTargetList = (type) => {
    if (type === "شريك") return partnersList;
    return persons; // افتراضي
  };

  // ==========================================
  // جلب إحصائيات الصفحة من الباك إند (للشركاء فقط)
  // ==========================================
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["partner-settlements-dashboard"],
    queryFn: async () => {
      const res = await api.get("/private-settlements/dashboard?type=شريك");
      return res.data;
    },
  });

  const { data: partnerTransactions = [], isLoading: isLoadingPartnerTx } =
    useQuery({
      queryKey: ["partner-transactions", selectedPartner?.id],
      queryFn: async () => {
        const res = await api.get(
          `/private-settlements/broker/${selectedPartner.id}/transactions?role=partner`,
        );
        return res.data?.data || [];
      },
      enabled:
        !!selectedPartner && isPartnerModalOpen && activeTab === "transactions",
    });

  const financials = dashboardData?.financials || {
    bankBalance: 0,
    cashBalance: 0,
    taxEstimate: 0,
    undelivered: 0,
    availableBalance: 0,
  };

  // 3. مطابقة الـ ID مع الأسماء الحقيقية من سجل الأشخاص
  const partners = (dashboardData?.brokers || [])
    .filter((partner) => {
      // نبحث عن الشخص في سجل الأشخاص
      const personInfo = persons.find((p) => p.id === partner.id);
      // الشرط الحاسم: يجب أن يكون موجوداً ودوره "شريك" فقط!
      return personInfo && personInfo.role === "شريك";
    })
    .map((partner) => {
      // جلب الاسم الحقيقي
      const personInfo = persons.find((p) => p.id === partner.id);
      return { ...partner, name: personInfo.name };
    });

  const { data: partnerSettlements = [], isLoading: isLoadingPartnerStl } =
    useQuery({
      queryKey: ["partner-settlements", selectedPartner?.id],
      queryFn: async () => {
        const res = await api.get(
          `/private-settlements/broker/${selectedPartner.id}/settlements?role=partner`,
        );
        return res.data?.data || [];
      },
      enabled:
        !!selectedPartner && isPartnerModalOpen && activeTab === "settlements",
    });

  const { data: partnerPayments = [], isLoading: isLoadingPartnerPay } =
    useQuery({
      queryKey: ["partner-payments", selectedPartner?.id],
      queryFn: async () => {
        const res = await api.get(
          `/private-settlements/broker/${selectedPartner.id}/payments?role=partner`,
        );
        return res.data?.data || [];
      },
      enabled:
        !!selectedPartner && isPartnerModalOpen && activeTab === "payments",
    });

  // ==========================================
  // 💡 المتغير المفقود: حساب مجاميع المعاملات داخل المودال ديناميكياً
  // ==========================================
  const modalTotals = partnerTransactions.reduce(
    (acc, tx) => {
      acc.totalFees += parseFloat(tx.totalFees) || 0;
      acc.paidAmount += parseFloat(tx.paidAmount) || 0;
      acc.remainingAmount += parseFloat(tx.remainingAmount) || 0;
      return acc;
    },
    { totalFees: 0, paidAmount: 0, remainingAmount: 0 },
  );

  const totals = partners.reduce(
    (acc, curr) => {
      acc.fees += curr.totalFees;
      acc.received += curr.received;
      acc.remaining += curr.remaining;
      return acc;
    },
    { fees: 0, received: 0, remaining: 0 },
  );

  const currentPartnerStats = partners.find(
    (p) => p.id === selectedPartner?.id,
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

  // 1. رصيد افتتاحي
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
      queryClient.invalidateQueries(["partner-settlements-dashboard"]);
      setIsPrevSettlementOpen(false);
    },
  });

  // 2. إضافة أرباح
  const [recordForm, setRecordForm] = useState({
    type: "شريك",
    targetId: "",
    amount: "",
    source: "",
    notes: "",
  });
  const recordMutation = useMutation({
    mutationFn: async (data) => api.post("/private-settlements/record", data),
    onSuccess: () => {
      toast.success("تم الحفظ");
      queryClient.invalidateQueries(["partner-settlements-dashboard"]);
      setIsRecordSettlementOpen(false);
    },
  });

  // 3. مسح السجل
  const deletePartnerMutation = useMutation({
    mutationFn: async (partnerId) =>
      api.delete(`/private-settlements/broker/${partnerId}`),
    onSuccess: () => {
      toast.success("تم مسح السجل المالي للشريك بنجاح");
      queryClient.invalidateQueries(["partner-settlements-dashboard"]);
    },
    onError: () => toast.error("حدث خطأ أثناء محاولة الحذف"),
  });

  // 4. تسليم أرباح (دفع)
  const [deliverForm, setDeliverForm] = useState({
    type: "شريك",
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
      toast.success("تم تسليم الأرباح بنجاح");
      queryClient.invalidateQueries(["partner-settlements-dashboard"]);
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
              صافي أرباح الشركة (متاح للتوزيع)
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
              إجمالي أرباح الشركاء
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
              إجمالي المسلم لهم
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
              أرباح غير موزعة
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
              عدد الشركاء
            </div>
            <div className="font-mono text-[15px] font-bold text-[var(--wms-warning)]">
              {partners.length}
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
            placeholder="بحث عن شريك..."
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
          <span>رصيد افتتاحي لشريك</span>
        </button>
        <button
          onClick={() => setIsRecordSettlementOpen(true)}
          className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90 h-[32px] text-[12px]"
        >
          <HandCoins className="w-3.5 h-3.5" />
          <span>تسجيل أرباح</span>
        </button>
        <button
          onClick={() => setIsDeliverSettlementOpen(true)}
          className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-success)] text-white cursor-pointer hover:opacity-90 h-[32px] text-[12px]"
        >
          <Send className="w-3.5 h-3.5" />
          <span>صرف أرباح لشريك</span>
        </button>
      </div>

      {/* 4. الجدول الرئيسي للشركاء */}
      <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[var(--wms-surface-2)] h-[36px]">
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                اسم الشريك
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                حركات الأرباح
              </th>
              <th className="text-right px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                إجمالي الأرباح الموزعة له
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
            {partners.map((partner) => (
              <tr
                key={partner.id}
                className="border-b border-[var(--wms-border)]/30 hover:bg-[var(--wms-surface-2)]/40 transition-colors h-[36px]"
              >
                <td className="px-3 text-[var(--wms-text)] font-bold flex items-center gap-2 mt-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  {partner.name}
                </td>
                <td className="px-3 font-mono text-[var(--wms-text-sec)]">
                  {partner.txCount}
                </td>
                <td className="px-3 font-mono text-[var(--wms-text)] font-bold">
                  {partner.totalFees.toLocaleString()}
                </td>
                <td className="px-3 font-mono text-[var(--wms-success)]">
                  {partner.received.toLocaleString()}
                </td>
                <td
                  className={`px-3 font-mono font-bold ${partner.remaining === 0 ? "text-gray-500" : "text-amber-600"}`}
                >
                  {partner.remaining.toLocaleString()}
                </td>
                <td className="px-3">
                  <span
                    className={`inline-flex items-center h-[20px] px-1.5 rounded-full text-[10px] font-semibold ${partner.remaining === 0 ? "bg-gray-100 text-gray-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {partner.statusText}
                  </span>
                </td>
                <td className="px-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedPartner({
                          id: partner.id,
                          name: partner.name,
                        });
                        setActiveTab("overview");
                        setIsPartnerModalOpen(true);
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
                            `هل أنت متأكد من مسح وتصفير حساب الشريك "${partner.name}" بالكامل؟`,
                          )
                        ) {
                          deletePartnerMutation.mutate(partner.id);
                        }
                      }}
                      disabled={deletePartnerMutation.isPending}
                      className="p-1.5 rounded-md hover:bg-red-50 cursor-pointer transition-colors text-red-500 disabled:opacity-50"
                      title="تصفير ومسح السجل"
                    >
                      {deletePartnerMutation.isPending &&
                      deletePartnerMutation.variables === partner.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {partners.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  لا توجد حسابات شركاء مسجلة
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
              <span className="text-[var(--wms-text)] font-bold text-[15px]">
                تسجيل رصيد افتتاحي للشريك
              </span>
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
                  الاسم (شريك) *
                </label>
                <select
                  value={prevForm.targetId}
                  onChange={(e) =>
                    setPrevForm({ ...prevForm, targetId: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 h-[34px] text-[12px] outline-none appearance-none cursor-pointer"
                >
                  <option value="">اختر الشريك...</option>
                  {partnersList.map((e) => (
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
                    أرباح مستحقة
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
                    مسحوبات (مستلم)
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
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 py-2 outline-none h-[50px] text-[12px] resize-none"
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--wms-border)]">
              <button
                onClick={() => setIsPrevSettlementOpen(false)}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-surface-2)] text-[12px]"
              >
                إلغاء
              </button>
              <button
                onClick={() => prevMutation.mutate(prevForm)}
                disabled={prevMutation.isPending}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white text-[12px] font-bold flex gap-2"
              >
                {prevMutation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}{" "}
                حفظ الرصيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: إضافة أرباح */}
      {isRecordSettlementOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full animate-in zoom-in-95"
            style={{ maxWidth: "460px" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <span className="text-[var(--wms-text)] font-bold text-[15px]">
                تسجيل أرباح لشريك
              </span>
              <button
                onClick={() => setIsRecordSettlementOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="relative">
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  اسم الشريك *
                </label>
                <select
                  value={recordForm.targetId}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, targetId: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 h-[34px] text-[12px] outline-none appearance-none cursor-pointer"
                >
                  <option value="">اختر الشريك...</option>
                  {partnersList.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  مبلغ الأرباح الموزعة *
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
                  مصدر الأرباح / المشروع
                </label>
                <input
                  type="text"
                  value={recordForm.source}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, source: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 h-[34px] outline-none text-[12px]"
                  placeholder="مثال: أرباح الربع الأول 2026"
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
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 py-2 outline-none h-[60px] text-[12px] resize-none"
                  placeholder="ملاحظات إضافية..."
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--wms-border)]">
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
                className="px-4 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white text-[12px] font-bold flex gap-2 disabled:opacity-50"
              >
                {recordMutation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}{" "}
                تسجيل الأرباح
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: صرف أرباح */}
      {isDeliverSettlementOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full animate-in zoom-in-95"
            style={{ maxWidth: "500px" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <span className="text-[var(--wms-text)] font-bold text-[15px]">
                صرف أرباح لشريك
              </span>
              <button
                onClick={() => setIsDeliverSettlementOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="relative">
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  اسم الشريك المستلم *
                </label>
                <select
                  value={deliverForm.targetId}
                  onChange={(e) =>
                    setDeliverForm({ ...deliverForm, targetId: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 h-[34px] text-[12px] outline-none appearance-none cursor-pointer"
                >
                  <option value="">اختر الشريك...</option>
                  {partnersList.map((e) => (
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
                      setDeliverForm({ ...deliverForm, method: "تحويل بنكي" })
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-[11px] ${deliverForm.method === "تحويل بنكي" ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] border border-[var(--wms-border)]"}`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>تحويل بنكي</span>
                  </button>
                  <button
                    onClick={() =>
                      setDeliverForm({ ...deliverForm, method: "شيك" })
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-[11px] ${deliverForm.method === "شيك" ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] border border-[var(--wms-border)]"}`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>شيك بنكي</span>
                  </button>
                  <button
                    onClick={() =>
                      setDeliverForm({ ...deliverForm, method: "نقدي" })
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-[11px] ${deliverForm.method === "نقدي" ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] border border-[var(--wms-border)]"}`}
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
                    بواسطة (موظف الصرف)
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
                    {partnersList.map((e) => (
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
                  className="w-full bg-[var(--wms-surface-2)] border rounded-md px-3 py-2 outline-none h-[50px] text-[12px] resize-none"
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
                className="px-4 py-1.5 rounded-md bg-green-600 text-white text-[12px] font-bold flex gap-2 disabled:opacity-50"
              >
                {deliverMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}{" "}
                صرف المبلغ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: كشف حساب الشريك */}
      {isPartnerModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[40] flex items-center justify-center p-4"
          dir="rtl"
        >
          <div
            className="bg-white border border-[var(--wms-border)] rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
            style={{ width: "75vw", height: "88vh" }}
          >
            {/* Header المودال */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/10">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--wms-text)] text-[15px] font-bold">
                      كشف حساب شريك
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                      شريك / مستثمر
                    </span>
                  </div>
                  <div className="text-[var(--wms-text-sec)] mt-0.5 text-[12px] relative">
                    {!selectedPartner ? (
                      <select
                        value={selectedPartner?.id || ""}
                        onChange={(e) => {
                          const p = partnersList.find(
                            (x) => x.id === e.target.value,
                          );
                          if (p) setSelectedPartner({ id: p.id, name: p.name });
                        }}
                        className="bg-transparent border-none outline-none font-bold text-blue-600 cursor-pointer p-0 pr-1 appearance-none"
                      >
                        <option value="" disabled>
                          -- اختر شريكاً --
                        </option>
                        {partnersList.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-semibold text-gray-700">
                        {selectedPartner.name}
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
                    setIsPartnerModalOpen(false);
                    setSelectedPartner(null);
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
                سجل الأرباح (المستحقات)
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`px-4 py-2 cursor-pointer transition-colors ${activeTab === "payments" ? "text-blue-600 border-b-2 border-blue-600 font-bold" : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-medium"}`}
                style={{ fontSize: "12px" }}
              >
                سجل المسحوبات (المدفوع)
              </button>
            </div>

            {/* Content Area */}
            <div
              className="flex-1 overflow-y-auto p-8 custom-scrollbar-slim"
              style={{ backgroundColor: "rgb(249, 250, 251)" }}
            >
              {!selectedPartner ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Users className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-bold">
                    الرجاء اختيار شريك من الأعلى لعرض حساباته
                  </p>
                </div>
              ) : isLoadingPartnerTx ||
                isLoadingPartnerStl ||
                isLoadingPartnerPay ? (
                <div className="flex flex-col items-center justify-center h-full text-blue-500">
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
                          كشف حساب الشريك: {selectedPartner.name}
                        </div>
                        <div
                          className="flex items-center justify-center gap-4 mt-2 text-gray-400"
                          style={{ fontSize: "11px" }}
                        >
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
                            إجمالي الأرباح المخصصة
                          </div>
                          <div className="font-mono text-2xl font-bold text-gray-800">
                            {currentPartnerStats.totalFees.toLocaleString()}{" "}
                            <span className="text-[10px]">ر.س</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl text-center bg-green-50 border border-green-100">
                          <div className="text-[11px] text-green-700 font-semibold mb-1">
                            إجمالي المسحوبات (الدفعات)
                          </div>
                          <div className="font-mono text-2xl font-bold text-green-700">
                            {currentPartnerStats.received.toLocaleString()}{" "}
                            <span className="text-[10px]">ر.س</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl text-center bg-blue-50 border border-blue-100">
                          <div className="text-[11px] text-blue-700 font-semibold mb-1">
                            رصيد الأرباح بالصندوق (المتبقي)
                          </div>
                          <div className="font-mono text-2xl font-bold text-blue-700">
                            {currentPartnerStats.remaining.toLocaleString()}{" "}
                            <span className="text-[10px]">ر.س</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === سجل الأرباح (المستحقات) === */}
                  {activeTab === "settlements" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 bg-gray-50 p-3 rounded border border-gray-100">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-[13px] font-bold text-gray-800">
                          سجل الأرباح والمستحقات المضافة (رصيد موجب)
                        </span>
                      </div>
                      <table className="w-full text-[12px] border-collapse">
                        <thead>
                          <tr>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              المرجع
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              التاريخ
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              المصدر / البيان
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              ملاحظات
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              المبلغ المضاف
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {partnerSettlements.length > 0 ? (
                            partnerSettlements.map((stl, idx) => (
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
                                لا توجد أرباح مسجلة لهذا الشريك
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* === المعاملات === */}
                  {activeTab === "transactions" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 bg-blue-50 p-3 rounded border border-blue-100">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-[13px] font-bold text-gray-800">
                          جميع المعاملات المرتبطة بـ {selectedPartner.name}
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
                          {partnerTransactions.length > 0 ? (
                            partnerTransactions.map((tx, idx) => (
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
                                لا توجد معاملات مرتبطة بهذا الشريك
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
                              المجموع ({partnerTransactions.length})
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
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              المرجع
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              التاريخ
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              الطريقة
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              بواسطة / ملاحظات
                            </th>
                            <th className="text-right px-3 py-2 font-bold text-gray-600 bg-gray-100 border-b-2 border-gray-300">
                              المبلغ المسحوب
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {partnerPayments.length > 0 ? (
                            partnerPayments.map((pay, idx) => (
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
                                <td className="px-3 py-2.5 text-gray-600 border-b border-gray-200 text-[11px]">
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
                                لا توجد أي مسحوبات مسجلة لهذا الشريك
                              </td>
                            </tr>
                          )}
                        </tbody>
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

export default PartnerSettlementsPage;
