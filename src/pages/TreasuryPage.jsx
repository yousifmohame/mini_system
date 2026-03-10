import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Eye,
  Download,
  Camera,
  X,
  Vault,
  ShieldCheck,
  Info,
  CodeXml,
  Loader2,
  Save,
  Printer,
  ChevronDown,
  Upload,
  Paperclip,
  BellRing,
  TriangleAlert,
  Settings2,
  FileText,
  Edit3,
} from "lucide-react";

const TreasuryPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Modals States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingId, setEditingId] = useState(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [viewingTransaction, setViewingTransaction] = useState(null);

  // 💡 تحديث النموذج لدعم transactionId و personId
  const initialForm = {
    type: "إيداع",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    statement: "",
    reference: "",
    transactionId: "", // للربط بقاعدة البيانات
    personId: "", // للربط بقاعدة البيانات
    notes: "",
    attachment: null,
    isRelatedToTx: "لا", // جعلتها "لا" افتراضياً لتسهيل الإدخال
    beneficiary: "",
    returnMethod: "دفعة واحدة",
    returnDate: "",
  };
  const [formData, setFormData] = useState(initialForm);

  const [reserveSettings, setReserveSettings] = useState({
    enabled: true,
    type: "نسبة مئوية",
    value: 27.3,
    method: "على كل معاملة",
  });

  const { data: reserveSettingsData } = useQuery({
    queryKey: ["reserve-settings"],
    queryFn: async () => {
      const res = await api.get("/treasury/settings/reserve");
      return res.data?.data;
    },
  });

  useEffect(() => {
    if (reserveSettingsData) setReserveSettings(reserveSettingsData);
  }, [reserveSettingsData]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (payload) =>
      await api.post("/treasury/settings/reserve", payload),
    onSuccess: () => {
      toast.success("تم حفظ إعدادات الاحتياطي بنجاح");
      queryClient.invalidateQueries(["reserve-settings"]);
      setIsSettingsModalOpen(false);
    },
  });

  const handleSaveSettings = () => saveSettingsMutation.mutate(reserveSettings);

  // ==========================================
  // 1. جلب البيانات
  // ==========================================
  const { data: responseData, isLoading } = useQuery({
    queryKey: ["treasury-transactions"],
    queryFn: async () => {
      const res = await api.get("/treasury");
      return res.data || { data: [], currentBalance: 0 };
    },
  });

  const transactions = responseData?.data || [];
  const currentBalance = responseData?.currentBalance || 0;

  // 💡 استبدال Employees بـ Persons
  const { data: persons = [] } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => {
      const res = await api.get("/persons");
      return res.data?.data || [];
    },
  });

  const { data: systemTransactions = [] } = useQuery({
    queryKey: ["private-transactions-simple"],
    queryFn: async () => {
      const res = await api.get("/private-transactions");
      return res.data?.data || [];
    },
  });

  // ==========================================
  // 2. الحسابات والفلترة
  // ==========================================
  const activeTransactions = useMemo(
    () => transactions.filter((t) => t.isActive),
    [transactions],
  );

  const overdueAdvances = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activeTransactions
      .filter((tx) => {
        if (tx.type !== "سلفة" || !tx.metadata?.returnDate) return false;
        const returnDate = new Date(tx.metadata.returnDate);
        return returnDate < today;
      })
      .map((tx) => {
        const returnDate = new Date(tx.metadata.returnDate);
        const diffTime = Math.abs(today - returnDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...tx, diffDays };
      });
  }, [activeTransactions]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      (t) =>
        t.statement?.toLowerCase().includes(q) ||
        t.reference?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q),
    );
  }, [transactions, searchQuery]);

  const reserveAmount = reserveSettings.enabled
    ? currentBalance * (reserveSettings.value / 100)
    : 0;
  const activeAdvances = activeTransactions
    .filter((t) => t.type === "سلفة")
    .reduce((sum, t) => sum + t.amount, 0);

  const getTypeStyle = (type) => {
    switch (type) {
      case "إيداع":
        return { bg: "rgba(34, 197, 94, 0.15)", text: "var(--wms-success)" };
      case "تحصيل":
        return {
          bg: "rgba(59, 130, 246, 0.15)",
          text: "var(--wms-accent-blue)",
        };
      case "سحب":
        return { bg: "rgba(245, 158, 11, 0.15)", text: "var(--wms-warning)" };
      case "مصروف":
        return { bg: "rgba(239, 68, 68, 0.15)", text: "var(--wms-danger)" };
      case "سلفة":
        return { bg: "rgba(180, 83, 9, 0.15)", text: "rgb(180, 83, 9)" };
      default:
        return {
          bg: "rgba(100, 116, 139, 0.15)",
          text: "var(--wms-text-muted)",
        };
    }
  };

  // ==========================================
  // 3. العمليات (الـ Mutations)
  // ==========================================
  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setFormData(initialForm);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (row) => {
    setModalMode("edit");
    setEditingId(row.id);
    setFormData({
      type: row.type,
      amount: row.amount,
      date: row.date,
      statement: row.statement || "",
      reference: row.reference || "",
      transactionId: row.transactionId || "", // 💡 استرجاع الـ ID
      personId: row.personId || "", // 💡 استرجاع الـ ID
      notes: row.notes || "",
      attachment: null,
      isRelatedToTx: row.metadata?.isRelatedToTx || "لا",
      beneficiary: row.metadata?.beneficiary || "",
      returnMethod: row.metadata?.returnMethod || "دفعة واحدة",
      returnDate: row.metadata?.returnDate || "",
    });
    setIsAddModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const fd = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === "attachment" && payload[key])
          fd.append("file", payload[key]);
        else if (key === "metadata")
          fd.append("metadata", JSON.stringify(payload.metadata));
        else fd.append(key, payload[key]);
      });
      return await api.post("/treasury", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("تم تسجيل الحركة بنجاح");
      queryClient.invalidateQueries(["treasury-transactions"]);
      setIsAddModalOpen(false);
      setFormData(initialForm);
    },
    onError: (err) => toast.error(err.response?.data?.message || "حدث خطأ"),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const fd = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === "attachment" && payload[key])
          fd.append("file", payload[key]);
        else if (key === "metadata")
          fd.append("metadata", JSON.stringify(payload.metadata));
        else fd.append(key, payload[key]);
      });
      return await api.put(`/treasury/${editingId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("تم تعديل الحركة بنجاح");
      queryClient.invalidateQueries(["treasury-transactions"]);
      setIsAddModalOpen(false);
      setFormData(initialForm);
    },
    onError: (err) => toast.error(err.response?.data?.message || "حدث خطأ"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.put(`/treasury/${id}/toggle`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries(["treasury-transactions"]);
    },
  });

  const handleFormChange = (field, value) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const handleSubmit = () => {
    if (!formData.amount || !formData.type)
      return toast.error("أدخل المبلغ ونوع الحركة");

    const metadata = {
      isRelatedToTx: formData.isRelatedToTx,
      beneficiary: formData.beneficiary,
      returnMethod: formData.returnMethod,
      returnDate: formData.returnDate,
    };

    if (modalMode === "edit") updateMutation.mutate({ ...formData, metadata });
    else createMutation.mutate({ ...formData, metadata });
  };

  return (
    <div
      className="p-3 flex flex-col h-full overflow-hidden bg-[var(--wms-bg-0)] font-sans"
      dir="rtl"
    >
      <div
        className="space-y-3 flex-1 flex flex-col min-h-0"
        id="treasury-report"
      >
        {/* 1. التنبيهات العلوية */}
        <div className="rounded-lg overflow-hidden bg-[var(--wms-surface-1)] border border-[var(--wms-border)] shrink-0">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--wms-border)]">
            <div className="flex items-center gap-2">
              <BellRing
                className={`w-4 h-4 ${overdueAdvances.length > 0 ? "text-[var(--wms-danger)]" : "text-slate-400"}`}
              />
              <span
                className="text-[var(--wms-text)]"
                style={{ fontSize: "12px", fontWeight: 700 }}
              >
                التذكيرات والمتابعات
              </span>
              <span
                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500"
                style={{ fontSize: "9px", fontWeight: 700 }}
              >
                {overdueAdvances.length}
              </span>
            </div>
            <button className="text-[var(--wms-text-muted)] hover:text-[var(--wms-text)]">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <div
            className="p-2 space-y-1.5"
            style={{ maxHeight: "200px", overflowY: "auto" }}
          >
            {overdueAdvances.length === 0 ? (
              <div
                className="text-center py-3 text-slate-400"
                style={{ fontSize: "11px" }}
              >
                لا توجد سلف متأخرة أو تذكيرات حالياً
              </div>
            ) : (
              overdueAdvances.map((adv) => (
                <div
                  key={adv.id}
                  className="flex items-start gap-2 p-2 rounded-md transition-colors hover:opacity-90 cursor-pointer bg-red-50 border border-red-100"
                >
                  <TriangleAlert className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-500" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "var(--wms-danger)",
                        }}
                      >
                        سلفة متأخرة
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600"
                        style={{ fontSize: "9px", fontWeight: 700 }}
                      >
                        متأخر {adv.diffDays} يوم
                      </span>
                    </div>
                    <div
                      className="text-[var(--wms-text-sec)] truncate mt-0.5"
                      style={{ fontSize: "10px" }}
                    >
                      {adv.metadata?.beneficiary || "موظف"} — سلفة{" "}
                      {adv.amount.toLocaleString()} ريال — كان يجب الرد{" "}
                      {adv.metadata?.returnDate}
                    </div>
                  </div>
                  <span
                    className="font-mono shrink-0 text-red-600"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    {adv.amount.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. شريط الإحصائيات الرئيسي */}
        <div className="flex items-center gap-5 px-4 py-2.5 bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-green-100">
              <Vault className="w-3.5 h-3.5 text-green-600" />
            </div>
            <div>
              <div
                className="text-[var(--wms-text-muted)]"
                style={{ fontSize: "10px" }}
              >
                رصيد الخزنة الحالي
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--wms-success)",
                }}
              >
                {currentBalance.toLocaleString()} ر.س
              </div>
            </div>
          </div>
          <div className="w-px h-8 bg-[var(--wms-border)]"></div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-blue-100">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div>
              <div
                className="text-[var(--wms-text-muted)]"
                style={{ fontSize: "10px" }}
              >
                الاحتياطي ({reserveSettings.value}%)
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="font-mono"
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "var(--wms-accent-blue)",
                  }}
                >
                  {reserveAmount.toLocaleString()} ر.س
                </span>
              </div>
            </div>
          </div>
          <div className="w-px h-8 bg-[var(--wms-border)]"></div>
          <div>
            <div
              className="text-[var(--wms-text-muted)]"
              style={{ fontSize: "10px" }}
            >
              السلف القائمة
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "rgb(180, 83, 9)",
              }}
            >
              {activeAdvances.toLocaleString()} ر.س
            </div>
          </div>
          <div className="w-px h-8 bg-[var(--wms-border)]"></div>
          <div>
            <div
              className="text-[var(--wms-text-muted)]"
              style={{ fontSize: "10px" }}
            >
              عدد الحركات النشطة
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--wms-text-sec)",
              }}
            >
              {activeTransactions.length}
            </div>
          </div>
        </div>

        {/* 3. شريط الأدوات */}
        <div className="flex items-center gap-2 shrink-0 print:hidden">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90"
            style={{ height: "32px", fontSize: "12px" }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>حركة جديدة</span>
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] cursor-pointer"
            style={{ height: "32px", fontSize: "12px" }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير</span>
          </button>
          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] cursor-pointer"
            style={{ height: "32px", fontSize: "12px" }}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>معاينة</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 rounded-md border border-[var(--wms-border)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-[var(--wms-surface-2)] transition-colors"
            title="لقطة شاشة"
            style={{ fontSize: "10px", padding: "4px 8px" }}
          >
            <Camera className="w-3 h-3 text-purple-600" />
            <span>لقطة شاشة</span>
          </button>
          <div className="flex-1"></div>
          <div className="relative">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--wms-text-muted)]" />
            <input
              type="text"
              placeholder="بحث في الحركات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-8 pl-3 rounded-md border border-[var(--wms-border)] text-[var(--wms-text)] bg-[var(--wms-surface-1)] outline-none focus:border-blue-500"
              style={{ height: "32px", fontSize: "12px", width: "200px" }}
            />
          </div>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] cursor-pointer ml-2"
            style={{ height: "32px", fontSize: "12px" }}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>إعدادات الاحتياطي</span>
          </button>
        </div>

        {/* 4. الجدول الرئيسي */}
        <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
          <div className="overflow-auto custom-scrollbar-slim flex-1">
            <table
              className="w-full text-right whitespace-nowrap"
              style={{ fontSize: "12px" }}
            >
              <thead className="sticky top-0 z-10">
                <tr
                  style={{
                    backgroundColor: "var(--wms-surface-2)",
                    height: "36px",
                  }}
                >
                  <th
                    className="px-3 text-[var(--wms-text-sec)]"
                    style={{ fontWeight: 600, fontSize: "11px" }}
                  >
                    التاريخ
                  </th>
                  <th
                    className="px-3 text-[var(--wms-text-sec)]"
                    style={{ fontWeight: 600, fontSize: "11px" }}
                  >
                    نوع الحركة
                  </th>
                  <th
                    className="px-3 text-[var(--wms-text-sec)]"
                    style={{ fontWeight: 600, fontSize: "11px" }}
                  >
                    المبلغ
                  </th>
                  <th
                    className="px-3 text-[var(--wms-text-sec)]"
                    style={{ fontWeight: 600, fontSize: "11px" }}
                  >
                    المصدر / المرجع
                  </th>
                  <th
                    className="px-3 text-[var(--wms-text-sec)]"
                    style={{ fontWeight: 600, fontSize: "11px" }}
                  >
                    ملاحظات / بيان
                  </th>
                  <th
                    className="px-3 text-[var(--wms-text-sec)]"
                    style={{ fontWeight: 600, fontSize: "11px" }}
                  >
                    الرصيد قبل
                  </th>
                  <th
                    className="px-3 text-[var(--wms-text-sec)]"
                    style={{ fontWeight: 600, fontSize: "11px" }}
                  >
                    الرصيد بعد
                  </th>
                  <th
                    className="px-3 text-center text-[var(--wms-text-sec)]"
                    style={{ fontWeight: 600, fontSize: "11px" }}
                  >
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      لا توجد حركات مسجلة
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => {
                    const style = getTypeStyle(row.type);
                    const isPlus = ["إيداع", "تحصيل"].includes(row.type);
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-[var(--wms-border)]/30 hover:bg-[var(--wms-surface-2)] transition-colors"
                        style={{
                          height: "36px",
                          opacity: row.isActive ? 1 : 0.5,
                          backgroundColor: row.isActive
                            ? "transparent"
                            : "rgba(100, 116, 139, 0.05)",
                        }}
                      >
                        <td
                          className="px-3 text-[var(--wms-text-muted)] font-mono"
                          style={{ fontSize: "11px" }}
                        >
                          {row.date}
                        </td>
                        <td className="px-3">
                          <span
                            className="inline-block px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: style.bg,
                              color: style.text,
                              fontSize: "10px",
                              fontWeight: 600,
                            }}
                          >
                            {row.type}
                          </span>
                          {!row.isActive && (
                            <span
                              className="inline-block px-1 py-0.5 rounded ml-1 bg-gray-200 text-gray-500"
                              style={{ fontSize: "9px" }}
                            >
                              ملغاة
                            </span>
                          )}
                        </td>
                        <td className="px-3">
                          <div className="flex flex-col leading-tight">
                            <span
                              className="font-mono"
                              style={{
                                fontWeight: 600,
                                color: isPlus
                                  ? "var(--wms-success)"
                                  : "var(--wms-danger)",
                                textDecoration: row.isActive
                                  ? "none"
                                  : "line-through",
                              }}
                            >
                              {isPlus ? "+" : "-"}
                              {row.amount.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-3 text-[var(--wms-text-sec)]"
                          style={{ fontSize: "11px" }}
                        >
                          {row.reference || "—"}
                        </td>
                        <td
                          className="px-3 text-[var(--wms-text-sec)] truncate max-w-[200px]"
                          style={{ fontSize: "11px" }}
                          title={row.statement}
                        >
                          {row.statement || row.notes || "—"}
                        </td>
                        <td
                          className="px-3 text-[var(--wms-text-muted)] font-mono"
                          style={{ fontSize: "11px" }}
                        >
                          {row.balanceBefore?.toLocaleString()}
                        </td>
                        <td
                          className="px-3 text-[var(--wms-text)] font-mono"
                          style={{ fontWeight: 600 }}
                        >
                          {row.balanceAfter?.toLocaleString()}
                        </td>
                        <td className="px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setViewingTransaction(row)}
                              className="text-[var(--wms-accent-blue)] hover:text-blue-800 cursor-pointer"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(row)}
                              className="text-amber-600 hover:text-amber-800 cursor-pointer"
                              title="تعديل الحركة"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                toggleStatusMutation.mutate(row.id)
                              }
                              disabled={toggleStatusMutation.isPending}
                              className="px-1.5 py-0.5 rounded cursor-pointer transition-colors disabled:opacity-50"
                              style={{
                                fontSize: "10px",
                                fontWeight: "bold",
                                backgroundColor: row.isActive
                                  ? "rgba(245, 158, 11, 0.1)"
                                  : "rgba(34, 197, 94, 0.1)",
                                color: row.isActive
                                  ? "var(--wms-warning)"
                                  : "var(--wms-success)",
                              }}
                            >
                              {row.isActive ? "إلغاء" : "تفعيل"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 px-3 py-2 border-t border-[var(--wms-border)] bg-[var(--wms-surface-2)]">
            <span
              className="text-[var(--wms-text-muted)]"
              style={{ fontSize: "9px" }}
            >
              السجلات الرمادية = ملغاة ولا تدخل في الاحتساب
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Modals Section */}
      {/* ========================================================================= */}

      {/* 1. Add/Edit Transaction Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div
            className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full overflow-y-auto"
            style={{ maxWidth: "520px", maxHeight: "90vh" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <span
                className="text-[var(--wms-text)]"
                style={{ fontSize: "15px", fontWeight: 700 }}
              >
                {modalMode === "add" ? "تسجيل حركة خزنة" : "تعديل حركة"}
              </span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-red-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label
                  className="block mb-1.5 text-[var(--wms-text-sec)]"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  نوع الحركة *
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {["إيداع", "سحب", "مصروف", "سلفة", "تحصيل"].map((t) => (
                    <button
                      key={t}
                      onClick={() => handleFormChange("type", t)}
                      className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${formData.type === t ? (t === "إيداع" || t === "تحصيل" ? "bg-green-600 text-white" : t === "سلفة" ? "bg-amber-600 text-white" : "bg-red-600 text-white") : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
                      style={{ fontSize: "11px", fontWeight: 600 }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="rounded-lg p-3 space-y-3 border"
                style={{
                  backgroundColor: "rgba(0,0,0,0.02)",
                  borderColor: "var(--wms-border)",
                }}
              >
                {["إيداع", "سحب", "تحصيل"].includes(formData.type) && (
                  <>
                    <div>
                      <label
                        className="block mb-1 text-[var(--wms-text-sec)]"
                        style={{ fontSize: "10px", fontWeight: 700 }}
                      >
                        هل يخص معاملة؟
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleFormChange("isRelatedToTx", "نعم");
                            handleFormChange("reference", "");
                            handleFormChange("transactionId", "");
                          }}
                          className={`px-2.5 py-1 rounded-md cursor-pointer ${formData.isRelatedToTx === "نعم" ? "bg-blue-600 text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
                          style={{ fontSize: "11px", fontWeight: 600 }}
                        >
                          نعم
                        </button>
                        <button
                          onClick={() => {
                            handleFormChange("isRelatedToTx", "لا");
                            handleFormChange("transactionId", "");
                          }}
                          className={`px-2.5 py-1 rounded-md cursor-pointer ${formData.isRelatedToTx === "لا" ? "bg-blue-600 text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
                          style={{ fontSize: "11px", fontWeight: 600 }}
                        >
                          لا
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <label
                        className="block mb-1.5 text-[var(--wms-text-sec)]"
                        style={{ fontSize: "11px", fontWeight: 700 }}
                      >
                        {formData.isRelatedToTx === "نعم"
                          ? "المعاملة المرتبطة"
                          : "المصدر / البيان"}
                      </label>
                      {formData.isRelatedToTx === "نعم" ? (
                        <div className="relative">
                          {/* 💡 التعديل هنا لإرسال transactionId للباك إند */}
                          <select
                            value={formData.transactionId || ""}
                            onChange={(e) => {
                              const selectedTx = systemTransactions.find(
                                (t) => (t.dbId || t.id) === e.target.value,
                              );
                              setFormData({
                                ...formData,
                                transactionId: e.target.value,
                                reference: selectedTx ? selectedTx.ref : "",
                              });
                            }}
                            className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none focus:border-blue-500 appearance-none cursor-pointer"
                            style={{ height: "34px", fontSize: "12px" }}
                          >
                            <option value="">-- اختر المعاملة --</option>
                            {systemTransactions.map((tx) => (
                              <option
                                key={tx.dbId || tx.id}
                                value={tx.dbId || tx.id}
                              >
                                {tx.ref || tx.id} - {tx.client || tx.owner}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formData.reference}
                          onChange={(e) =>
                            handleFormChange("reference", e.target.value)
                          }
                          className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none focus:border-blue-500"
                          placeholder="اكتب المصدر..."
                          style={{ height: "34px", fontSize: "12px" }}
                        />
                      )}
                    </div>
                  </>
                )}

                {formData.type === "مصروف" && (
                  <>
                    <div>
                      <label
                        className="block mb-1 text-[var(--wms-text-sec)]"
                        style={{ fontSize: "10px", fontWeight: 700 }}
                      >
                        وصف المصروف
                      </label>
                      <input
                        type="text"
                        value={formData.statement}
                        onChange={(e) =>
                          handleFormChange("statement", e.target.value)
                        }
                        className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none focus:border-red-500"
                        placeholder="وصف المصروف..."
                        style={{ height: "32px", fontSize: "12px" }}
                      />
                    </div>
                    <div className="relative">
                      <label
                        className="block mb-1.5 text-[var(--wms-text-sec)]"
                        style={{ fontSize: "11px", fontWeight: 700 }}
                      >
                        من طلب الصرف
                      </label>
                      {/* 💡 التعديل هنا: جلب أشخاص وإرسال personId */}
                      <select
                        value={formData.personId || ""}
                        onChange={(e) => {
                          const p = persons.find(
                            (x) => x.id === e.target.value,
                          );
                          setFormData({
                            ...formData,
                            personId: e.target.value,
                            beneficiary: p ? p.name : "",
                          });
                        }}
                        className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] outline-none appearance-none cursor-pointer"
                        style={{ height: "34px", fontSize: "12px" }}
                      >
                        <option value="">اختر الشخص...</option>
                        {persons.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                  </>
                )}

                {formData.type === "سلفة" && (
                  <>
                    <div className="relative">
                      <label
                        className="block mb-1.5 text-[var(--wms-text-sec)]"
                        style={{ fontSize: "11px", fontWeight: 700 }}
                      >
                        المستفيد
                      </label>
                      {/* 💡 التعديل هنا: جلب أشخاص وإرسال personId */}
                      <select
                        value={formData.personId || ""}
                        onChange={(e) => {
                          const p = persons.find(
                            (x) => x.id === e.target.value,
                          );
                          setFormData({
                            ...formData,
                            personId: e.target.value,
                            beneficiary: p ? p.name : "",
                          });
                        }}
                        className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] outline-none appearance-none cursor-pointer"
                        style={{ height: "34px", fontSize: "12px" }}
                      >
                        <option value="">اختر الشخص المستفيد...</option>
                        {persons.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          className="block mb-1 text-[var(--wms-text-sec)]"
                          style={{ fontSize: "10px", fontWeight: 700 }}
                        >
                          طريقة الرد
                        </label>
                        <select
                          value={formData.returnMethod}
                          onChange={(e) =>
                            handleFormChange("returnMethod", e.target.value)
                          }
                          className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] outline-none cursor-pointer"
                          style={{ height: "32px", fontSize: "12px" }}
                        >
                          <option>دفعة واحدة</option>
                          <option>على دفعات / خصم راتب</option>
                        </select>
                      </div>
                      <div>
                        <label
                          className="block mb-1 text-[var(--wms-text-sec)]"
                          style={{ fontSize: "10px", fontWeight: 700 }}
                        >
                          تاريخ الرد المتوقع
                        </label>
                        <input
                          type="date"
                          value={formData.returnDate}
                          onChange={(e) =>
                            handleFormChange("returnDate", e.target.value)
                          }
                          className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none cursor-pointer"
                          style={{ height: "32px", fontSize: "12px" }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label
                  className="block mb-1.5 text-[var(--wms-text-sec)]"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  المبلغ *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleFormChange("amount", e.target.value)}
                  className="w-full bg-white border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] font-mono text-lg font-bold outline-none focus:border-blue-500"
                  placeholder="0"
                  style={{ height: "40px" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block mb-1.5 text-[var(--wms-text-sec)]"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleFormChange("date", e.target.value)}
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none cursor-pointer"
                    style={{ height: "34px", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label
                    className="block mb-1.5 text-[var(--wms-text-sec)]"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    البيان (يظهر في الجدول)
                  </label>
                  <input
                    type="text"
                    value={formData.statement}
                    onChange={(e) =>
                      handleFormChange("statement", e.target.value)
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none"
                    placeholder="بيان..."
                    style={{ height: "34px", fontSize: "12px" }}
                  />
                </div>
              </div>
              <div>
                <label
                  className="block mb-1.5 text-[var(--wms-text-sec)]"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 py-2 text-[var(--wms-text)] resize-none outline-none"
                  placeholder="ملاحظات اختيارية..."
                  style={{ height: "45px", fontSize: "12px" }}
                ></textarea>
              </div>
              <div>
                <label
                  className="block mb-1.5 text-[var(--wms-text-sec)]"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  {modalMode === "edit"
                    ? "إرفاق ملف جديد (سيستبدل القديم إن وجد)"
                    : "المرفق (اختياري)"}
                </label>
                <label
                  className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-[var(--wms-border)] rounded-lg text-[var(--wms-text-muted)] cursor-pointer hover:border-blue-500 transition-colors"
                  style={{ fontSize: "11px" }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {formData.attachment
                      ? formData.attachment.name
                      : "اضغط لاختيار ملف (صورة أو PDF)"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      handleFormChange("attachment", e.target.files[0])
                    }
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--wms-border)]">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] cursor-pointer"
                style={{ fontSize: "12px" }}
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90 disabled:opacity-50"
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}{" "}
                {modalMode === "add" ? "تسجيل الحركة" : "حفظ التعديلات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingTransaction && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
          onClick={() => setViewingTransaction(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-blue-700 flex items-center gap-2">
                <Vault className="w-5 h-5" /> تفاصيل الحركة
              </h3>
              <X
                className="w-5 h-5 cursor-pointer text-gray-400 hover:text-red-500"
                onClick={() => setViewingTransaction(null)}
              />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">النوع:</span>
                <span className="font-bold">{viewingTransaction.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">التاريخ:</span>
                <span className="font-mono">{viewingTransaction.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">المبلغ:</span>
                <span className="font-mono font-bold text-blue-600">
                  {viewingTransaction.amount.toLocaleString()} ر.س
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">المرجع:</span>
                <span>{viewingTransaction.reference || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">البيان:</span>
                <span>{viewingTransaction.statement || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">الملاحظات:</span>
                <span>{viewingTransaction.notes || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">الحالة:</span>
                <span className="font-bold">
                  {viewingTransaction.isActive ? "نشط" : "ملغى"}
                </span>
              </div>
              {viewingTransaction.attachmentUrl && (
                <div className="pt-2 border-t flex justify-between items-center">
                  <span className="text-gray-500">المرفق:</span>
                  <a
                    href={viewingTransaction.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <Paperclip className="w-4 h-4" /> عرض المرفق
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Settings Modal */}
      {isSettingsModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div
            className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full"
            style={{ maxWidth: "460px" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <span
                className="text-[var(--wms-text)]"
                style={{ fontSize: "15px", fontWeight: 700 }}
              >
                إعدادات الاحتياطي
              </span>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-red-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label
                  className="text-[var(--wms-text)]"
                  style={{ fontSize: "12px", fontWeight: 600 }}
                >
                  تفعيل الاحتياطي التلقائي
                </label>
                <button
                  onClick={() =>
                    setReserveSettings((p) => ({ ...p, enabled: !p.enabled }))
                  }
                  className={`w-10 h-5 rounded-full cursor-pointer transition-colors ${reserveSettings.enabled ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${reserveSettings.enabled ? "translate-x-5" : "translate-x-1"}`}
                  ></div>
                </button>
              </div>
              <div
                className={`space-y-4 transition-opacity ${reserveSettings.enabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}
              >
                <div>
                  <label
                    className="block mb-1.5 text-[var(--wms-text-sec)]"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    نوع الاحتياطي
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setReserveSettings((p) => ({
                          ...p,
                          type: "نسبة مئوية",
                        }))
                      }
                      className={`flex-1 py-1.5 rounded-md cursor-pointer transition-colors ${reserveSettings.type === "نسبة مئوية" ? "bg-blue-600 text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
                      style={{ fontSize: "12px", fontWeight: 600 }}
                    >
                      نسبة مئوية
                    </button>
                    <button
                      onClick={() =>
                        setReserveSettings((p) => ({ ...p, type: "مبلغ ثابت" }))
                      }
                      className={`flex-1 py-1.5 rounded-md cursor-pointer transition-colors ${reserveSettings.type === "مبلغ ثابت" ? "bg-blue-600 text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
                      style={{ fontSize: "12px", fontWeight: 600 }}
                    >
                      مبلغ ثابت
                    </button>
                  </div>
                </div>
                <div>
                  <label
                    className="block mb-1.5 text-[var(--wms-text-sec)]"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    القيمة
                  </label>
                  <input
                    type="number"
                    value={reserveSettings.value}
                    onChange={(e) =>
                      setReserveSettings((p) => ({
                        ...p,
                        value: e.target.value,
                      }))
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] font-mono outline-none"
                    style={{ height: "34px", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label
                    className="block mb-1.5 text-[var(--wms-text-sec)]"
                    style={{ fontSize: "11px", fontWeight: 700 }}
                  >
                    طريقة التطبيق
                  </label>
                  <div className="space-y-2">
                    {[
                      "على الجزء النقدي فقط",
                      "على كل معاملة",
                      "على الإيداعات فقط",
                    ].map((m) => (
                      <label
                        key={m}
                        className="flex items-center gap-2 p-2 rounded-md border border-[var(--wms-border)] cursor-pointer hover:bg-[var(--wms-surface-2)] transition-colors"
                      >
                        <input
                          type="radio"
                          checked={reserveSettings.method === m}
                          onChange={() =>
                            setReserveSettings((p) => ({ ...p, method: m }))
                          }
                          className="accent-blue-600"
                        />
                        <span
                          className="text-[var(--wms-text)]"
                          style={{ fontSize: "12px" }}
                        >
                          {m}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--wms-border)]">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] cursor-pointer"
                style={{ fontSize: "12px" }}
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90"
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                حفظ الإعدادات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Export Modal */}
      {isExportModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div
            className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full"
            style={{ maxWidth: "440px" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <span
                className="text-[var(--wms-text)]"
                style={{ fontSize: "15px", fontWeight: 700 }}
              >
                تصدير تقرير الخزنة
              </span>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-red-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label
                  className="block mb-1.5 text-[var(--wms-text-sec)]"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  نوع التقرير
                </label>
                <div className="space-y-2">
                  {["ملخص الخزنة", "حركات الخزنة", "تقرير فترة محددة"].map(
                    (t, idx) => (
                      <label
                        key={t}
                        className="flex items-center gap-2 p-2 rounded-md border border-[var(--wms-border)] cursor-pointer hover:bg-[var(--wms-surface-2)] transition-colors"
                      >
                        <input
                          type="radio"
                          name="trRepType"
                          className="accent-blue-600"
                          defaultChecked={idx === 0}
                        />
                        <span
                          className="text-[var(--wms-text)]"
                          style={{ fontSize: "12px" }}
                        >
                          {t}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>
              <div>
                <label
                  className="block mb-1.5 text-[var(--wms-text-sec)]"
                  style={{ fontSize: "11px", fontWeight: 700 }}
                >
                  صيغة الملف
                </label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--wms-border)] cursor-pointer hover:bg-[var(--wms-surface-2)] transition-colors">
                    <input
                      type="radio"
                      name="trFormat"
                      className="accent-blue-600"
                      defaultChecked
                    />
                    <span
                      className="text-[var(--wms-text)]"
                      style={{ fontSize: "12px" }}
                    >
                      PDF
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--wms-border)] cursor-pointer hover:bg-[var(--wms-surface-2)] transition-colors">
                    <input
                      type="radio"
                      name="trFormat"
                      className="accent-blue-600"
                    />
                    <span
                      className="text-[var(--wms-text)]"
                      style={{ fontSize: "12px" }}
                    >
                      Excel
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--wms-border)]">
              <button
                onClick={() => {
                  setIsExportModalOpen(false);
                  setIsPreviewModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] cursor-pointer"
                style={{ fontSize: "12px" }}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>معاينة التقرير</span>
              </button>
              <button
                onClick={() => {
                  toast.success("جاري التصدير...");
                  setIsExportModalOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90"
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Preview Modal (A4 Print Layout) */}
      {isPreviewModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div
            className="bg-white border border-[var(--wms-border)] rounded-xl shadow-2xl flex flex-col"
            style={{ width: "70vw", height: "85vh" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)] shrink-0 print:hidden">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-blue-600" />
                <span
                  className="text-[var(--wms-text)]"
                  style={{ fontSize: "15px", fontWeight: 700 }}
                >
                  معاينة تقرير حركات الخزنة
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200"
                  style={{ fontSize: "12px" }}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="text-gray-400 hover:text-red-500 cursor-pointer ml-1 p-1.5 rounded bg-gray-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50 custom-scrollbar-slim">
              <div
                className="bg-white rounded-lg border border-gray-200 p-8 mx-auto print:border-none print:shadow-none print:p-0"
                style={{
                  maxWidth: "900px",
                  boxShadow: "rgba(0,0,0,0.06) 0px 1px 3px",
                }}
              >
                <div className="text-center mb-6 pb-4 border-b-2 border-blue-100">
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#1a2332",
                    }}
                  >
                    تقرير حركات الخزنة
                  </div>
                  <div
                    className="flex items-center justify-center gap-4 mt-2 text-gray-500"
                    style={{ fontSize: "11px" }}
                  >
                    <span>الفترة: جميع الحركات النشطة</span>
                    <span>•</span>
                    <span>
                      تاريخ الإصدار: {new Date().toISOString().split("T")[0]}
                    </span>
                    <span>•</span>
                    <span>أُعد بواسطة: النظام</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-6 print:break-inside-avoid">
                  <div className="p-3 rounded-lg text-center bg-gray-50 border border-gray-200">
                    <div className="text-gray-500 text-[10px]">
                      الرصيد الافتتاحي (افتراضي)
                    </div>
                    <div className="font-mono mt-0.5 text-[16px] font-bold text-gray-600">
                      0 ر.س
                    </div>
                  </div>
                  <div className="p-3 rounded-lg text-center bg-green-50 border border-green-100">
                    <div className="text-gray-500 text-[10px]">
                      إجمالي الإيداعات
                    </div>
                    <div className="font-mono mt-0.5 text-[16px] font-bold text-green-600">
                      +
                      {activeTransactions
                        .filter((t) => ["إيداع", "تحصيل"].includes(t.type))
                        .reduce((s, t) => s + t.amount, 0)
                        .toLocaleString()}{" "}
                      ر.س
                    </div>
                  </div>
                  <div className="p-3 rounded-lg text-center bg-red-50 border border-red-100">
                    <div className="text-gray-500 text-[10px]">
                      إجمالي السحب/المصروفات
                    </div>
                    <div className="font-mono mt-0.5 text-[16px] font-bold text-red-600">
                      -
                      {activeTransactions
                        .filter((t) =>
                          ["سحب", "مصروف", "سلفة"].includes(t.type),
                        )
                        .reduce((s, t) => s + t.amount, 0)
                        .toLocaleString()}{" "}
                      ر.س
                    </div>
                  </div>
                  <div className="p-3 rounded-lg text-center bg-blue-50 border border-blue-100">
                    <div className="text-gray-500 text-[10px]">
                      الرصيد النهائي
                    </div>
                    <div className="font-mono mt-0.5 text-[16px] font-bold text-blue-600">
                      {currentBalance.toLocaleString()} ر.س
                    </div>
                  </div>
                </div>

                <table
                  className="w-full mb-6 print:text-[10px]"
                  style={{ fontSize: "12px", borderCollapse: "collapse" }}
                >
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300 text-gray-700">
                      <th className="text-right px-3 py-2 font-bold text-[11px]">
                        التاريخ
                      </th>
                      <th className="text-right px-3 py-2 font-bold text-[11px]">
                        نوع الحركة
                      </th>
                      <th className="text-right px-3 py-2 font-bold text-[11px]">
                        البيان
                      </th>
                      <th className="text-right px-3 py-2 font-bold text-[11px]">
                        المرجع
                      </th>
                      <th className="text-right px-3 py-2 font-bold text-[11px]">
                        المبلغ
                      </th>
                      <th className="text-right px-3 py-2 font-bold text-[11px]">
                        الرصيد المتراكم
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTransactions
                      .slice()
                      .reverse()
                      .map((row, i) => {
                        const isPlus = ["إيداع", "تحصيل"].includes(row.type);
                        return (
                          <tr
                            key={row.id}
                            style={{
                              backgroundColor:
                                i % 2 === 1 ? "#fafbfc" : "white",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            <td className="px-3 py-2 font-mono text-gray-500">
                              {row.date}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {row.type}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {row.statement || row.notes || "—"}
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {row.reference || "—"}
                            </td>
                            <td
                              className={`px-3 py-2 font-mono font-bold ${isPlus ? "text-green-600" : "text-red-600"}`}
                            >
                              {isPlus ? "+" : "-"}
                              {row.amount.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 font-mono font-bold text-gray-800">
                              {row.balanceAfter?.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasuryPage;
