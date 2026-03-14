import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Eye,
  Download,
  Paperclip,
  X,
  Printer,
  Loader2,
  Save,
  FileText,
  Edit3,
  Trash2,
  ChevronDown,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const OfficeExpensesPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // 💡 1. State فلتر التسوية الجديد
  const [settlementFilter, setSettlementFilter] = useState("all"); // "all", "unsettled", "settled"

  const [modalMode, setModalMode] = useState("add");
  const [editingId, setEditingId] = useState(null);

  // States للنوافذ المنبثقة
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isExportReportOpen, setIsExportReportOpen] = useState(false);
  const [isPreviewReportOpen, setIsPreviewReportOpen] = useState(false);

  // States المرفقات (Preview)
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // State نموذج الإضافة/التعديل
  const initialForm = {
    item: "",
    amount: "",
    payerId: "",
    method: "نقدي",
    source: "خزنة",
    date: new Date().toISOString().split("T")[0],
    payeeType: "جهة أخرى",
    payeeName: "",
    notes: "",
    isClearable: false,
    linkToSettlement: false,
    attachment: null,
  };
  const [expenseForm, setExpenseForm] = useState(initialForm);

  // ==========================================
  // 1. جلب البيانات من الباك إند
  // ==========================================
  const { data: expensesData = [], isLoading } = useQuery({
    queryKey: ["office-expenses"],
    queryFn: async () => {
      const res = await api.get("/office-expenses");
      return res.data?.data || [];
    },
  });

  // 💡 جلب سجل الأشخاص بدلاً من الموظفين
  const { data: persons = [] } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => {
      const res = await api.get("/persons");
      return res.data?.data || [];
    },
  });

  // ==========================================
  // 2. العمليات (إنشاء، تعديل، حذف، معاينة)
  // ==========================================
  const handleViewAttachment = async (e, attachmentUrl) => {
    e.stopPropagation();
    if (!attachmentUrl) return;
    setIsPreviewLoading(true);
    try {
      const response = await api.get(attachmentUrl, { responseType: "blob" });
      const blob = response.data;
      const contentType = response.headers["content-type"];
      const localBlobUrl = URL.createObjectURL(blob);
      setPreviewData({
        url: localBlobUrl,
        isPdf:
          contentType?.includes("pdf") ||
          attachmentUrl.toLowerCase().endsWith(".pdf"),
      });
    } catch (error) {
      toast.error("فشل في تحميل المرفق، قد يكون غير موجود.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewData) URL.revokeObjectURL(previewData.url);
    setPreviewData(null);
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setExpenseForm(initialForm);
    setIsAddExpenseOpen(true);
  };

  const handleOpenEditModal = (expense) => {
    setModalMode("edit");
    setEditingId(expense.id);
    setExpenseForm({
      item: expense.item,
      amount: expense.amount,
      payerId: expense.payerId || "",
      method: expense.method,
      source: expense.source,
      date: expense.date,
      payeeType: "جهة أخرى",
      payeeName: expense.payee || "",
      notes: expense.notes === "—" ? "" : expense.notes,
      isClearable: expense.isClearable || false,
      linkToSettlement: expense.linkToSettlement || false,
      attachment: null,
    });
    setIsAddExpenseOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const formData = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === "attachment" && payload[key])
          formData.append("file", payload[key]);
        else formData.append(key, payload[key]);
      });
      return await api.post("/office-expenses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("تم تسجيل المصروف بنجاح");
      queryClient.invalidateQueries(["office-expenses"]);
      setIsAddExpenseOpen(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ أثناء التسجيل"),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const formData = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === "attachment" && payload[key])
          formData.append("file", payload[key]);
        else formData.append(key, payload[key]);
      });
      return await api.put(`/office-expenses/${editingId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("تم تعديل المصروف بنجاح");
      queryClient.invalidateQueries(["office-expenses"]);
      setIsAddExpenseOpen(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ أثناء التعديل"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/office-expenses/${id}`),
    onSuccess: () => {
      toast.success("تم حذف المصروف بنجاح");
      queryClient.invalidateQueries(["office-expenses"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ أثناء الحذف"),
  });

  const handleDeleteClick = (id) => {
    if (
      window.confirm(
        "هل أنت متأكد من رغبتك في حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.",
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmitExpense = () => {
    if (!expenseForm.item || !expenseForm.amount || !expenseForm.payeeName) {
      return toast.error(
        "الرجاء إكمال الحقول الإلزامية (البند، القيمة، المدفوع له)",
      );
    }
    if (modalMode === "add") createMutation.mutate(expenseForm);
    else updateMutation.mutate(expenseForm);
  };

  const handleFormChange = (field, value) => {
    setExpenseForm((prev) => ({ ...prev, [field]: value }));
  };

  // ==========================================
  // 3. الحسابات والفلترة
  // ==========================================
  const filteredData = useMemo(() => {
    let result = expensesData;

    // 💡 2. تطبيق فلتر حالة التسوية أولاً
    if (settlementFilter === "settled") {
      // افتراض أن الباك إند يرسل حقل isSettled = true للمصروفات المسواة
      result = result.filter((exp) => exp.isSettled === true);
    } else if (settlementFilter === "unsettled") {
      result = result.filter((exp) => exp.isSettled !== true);
    }

    // 3. تطبيق فلتر البحث النصي
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (exp) =>
          exp.item.toLowerCase().includes(q) ||
          exp.payer?.toLowerCase().includes(q) ||
          exp.payee?.toLowerCase().includes(q) ||
          exp.notes?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [searchQuery, expensesData, settlementFilter]);

  const stats = useMemo(() => {
    return filteredData.reduce(
      (acc, curr) => {
        acc.total += curr.amount;
        if (curr.method === "نقدي") acc.cash += curr.amount;
        if (curr.method === "تحويل بنكي") acc.bank += curr.amount;
        return acc;
      },
      { total: 0, cash: 0, bank: 0 },
    );
  }, [filteredData]);

  const handleOpenPreview = () => {
    setIsPreviewReportOpen(true);
    setIsExportReportOpen(false);
  };

  return (
    <div
      className="p-3 flex flex-col h-full overflow-hidden bg-[var(--wms-bg-0)] font-sans"
      dir="rtl"
    >
      <div className="space-y-3 flex-1 flex flex-col min-h-0">
        {/* 1. شريط الإحصائيات العلوية */}
        <div className="flex items-center gap-6 px-4 py-2 bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg shrink-0">
          <div className="flex items-center gap-2">
            <div>
              <div
                className="text-[var(--wms-text-muted)]"
                style={{ fontSize: "10px" }}
              >
                إجمالي المصروفات
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--wms-danger)",
                }}
              >
                {stats.total.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-px h-6 bg-[var(--wms-border)]"></div>
            <div>
              <div
                className="text-[var(--wms-text-muted)]"
                style={{ fontSize: "10px" }}
              >
                مصروفات نقدية
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--wms-warning)",
                }}
              >
                {stats.cash.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-px h-6 bg-[var(--wms-border)]"></div>
            <div>
              <div
                className="text-[var(--wms-text-muted)]"
                style={{ fontSize: "10px" }}
              >
                تحويلات بنكية
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--wms-accent-blue)",
                }}
              >
                {stats.bank.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-px h-6 bg-[var(--wms-border)]"></div>
            <div>
              <div
                className="text-[var(--wms-text-muted)]"
                style={{ fontSize: "10px" }}
              >
                عدد العمليات
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--wms-text-sec)",
                }}
              >
                {filteredData.length}
              </div>
            </div>
          </div>
        </div>

        {/* 2. شريط الأدوات والبحث */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 💡 فلتر حالة التسوية الجديد */}
          <div className="relative" style={{ width: "200px" }}>
            <select
              value={settlementFilter}
              onChange={(e) => setSettlementFilter(e.target.value)}
              className="w-full bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] focus:outline-none focus:border-[var(--wms-accent-blue)] appearance-none cursor-pointer font-bold"
              style={{ height: "32px", fontSize: "11px" }}
            >
              <option value="all">الكل (حالات التسوية الافتراضية)</option>
              <option value="unsettled">إظهار الغير مسوّى فقط</option>
              <option value="settled">إظهار المسوّى فقط</option>
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--wms-text-muted)] pointer-events-none" />
          </div>

          <div className="relative" style={{ width: "260px" }}>
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--wms-text-muted)]" />
            <input
              type="text"
              placeholder="بحث في المصروفات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-md pr-8 pl-3 text-[var(--wms-text)] placeholder:text-[var(--wms-text-muted)] focus:outline-none focus:border-[var(--wms-accent-blue)]"
              style={{ height: "32px", fontSize: "12px" }}
            />
          </div>

          <div className="flex-1"></div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90 transition-opacity"
            style={{ height: "32px", fontSize: "12px" }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل مصروف</span>
          </button>
          <button
            onClick={() => setIsPreviewReportOpen(true)}
            className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] cursor-pointer transition-colors"
            style={{ height: "32px", fontSize: "12px" }}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>معاينة التقرير</span>
          </button>
          <button
            onClick={() => setIsExportReportOpen(true)}
            className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] cursor-pointer transition-colors"
            style={{ height: "32px", fontSize: "12px" }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>إصدار تقرير</span>
          </button>
        </div>

        {/* 3. الجدول الرئيسي */}
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
                    البند
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
                    الجهة المستفيدة
                  </th>
                  <th
                    className="px-3 text-[var(--wms-text-sec)]"
                    style={{ fontWeight: 600, fontSize: "11px" }}
                  >
                    من دفع
                  </th>
                  <th
                    className="px-3 text-[var(--wms-text-sec)]"
                    style={{ fontWeight: 600, fontSize: "11px" }}
                  >
                    طريقة الدفع
                  </th>
                  <th
                    className="px-3 text-[var(--wms-text-sec)]"
                    style={{ fontWeight: 600, fontSize: "11px" }}
                  >
                    المصدر
                  </th>
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
                    الملاحظات
                  </th>

                  {/* 💡 العمود الجديد: حالة التسوية */}
                  <th
                    className="px-3 text-center text-[var(--wms-text-sec)]"
                    style={{ fontWeight: 600, fontSize: "11px" }}
                  >
                    حالة التسوية
                  </th>

                  <th
                    className="px-3 text-[var(--wms-text-sec)] text-center"
                    style={{ fontWeight: 600, fontSize: "11px" }}
                  >
                    المرفق
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
                    <td colSpan="11" className="text-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                      <span className="text-slate-500">
                        جاري جلب البيانات...
                      </span>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="11"
                      className="text-center py-10 text-slate-500"
                    >
                      لا توجد مصروفات مسجلة تطابق فلتر البحث
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, index) => (
                    <tr
                      key={row.id}
                      className={`border-b border-[var(--wms-border)]/30 hover:bg-[var(--wms-surface-2)]/40 transition-colors ${index % 2 === 1 ? "bg-[var(--wms-row-alt)]" : "bg-transparent"}`}
                      style={{ height: "36px" }}
                    >
                      <td
                        className="px-3 text-[var(--wms-text)]"
                        style={{ fontWeight: 600 }}
                      >
                        {row.item}
                      </td>
                      <td
                        className="px-3 font-mono"
                        style={{ color: "var(--wms-danger)", fontWeight: 700 }}
                      >
                        {row.amount.toLocaleString()}
                      </td>
                      <td className="px-3 text-[var(--wms-text)]">
                        {row.payee}
                      </td>
                      <td className="px-3 text-[var(--wms-text-sec)] font-bold">
                        {row.payer}
                      </td>
                      <td className="px-3">
                        <span
                          style={{
                            height: "20px",
                            fontSize: "10px",
                            borderRadius: "10px",
                            paddingLeft: "6px",
                            paddingRight: "6px",
                            lineHeight: "20px",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            backgroundColor:
                              row.method === "تحويل بنكي"
                                ? "rgba(59, 130, 246, 0.15)"
                                : "rgba(245, 158, 11, 0.15)",
                            color:
                              row.method === "تحويل بنكي"
                                ? "var(--wms-accent-blue)"
                                : "var(--wms-warning)",
                          }}
                        >
                          {row.method}
                        </span>
                      </td>
                      <td
                        className="px-3 text-[var(--wms-text-sec)]"
                        style={{ fontSize: "11px" }}
                      >
                        {row.source}
                      </td>
                      <td
                        className="px-3 text-[var(--wms-text-muted)] font-mono"
                        style={{ fontSize: "11px" }}
                      >
                        {row.date}
                      </td>
                      <td
                        className="px-3 text-[var(--wms-text-muted)]"
                        style={{ fontSize: "11px", maxWidth: "150px" }}
                      >
                        <span className="truncate block" title={row.notes}>
                          {row.notes}
                        </span>
                      </td>

                      {/* 💡 الخلية الجديدة: حالة التسوية */}
                      <td className="px-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 mx-auto w-max ${
                            row.isSettled
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-amber-50 text-amber-600 border border-amber-200"
                          }`}
                        >
                          {row.isSettled ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> مسوّى
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" /> غير مسوّى
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-3 text-center">
                        {row.hasAttachment ? (
                          <button
                            onClick={(e) =>
                              handleViewAttachment(e, row.attachmentUrl)
                            }
                            disabled={isPreviewLoading}
                            className="flex items-center justify-center gap-1 text-[var(--wms-accent-blue)] cursor-pointer hover:underline bg-transparent border-none mx-auto disabled:opacity-50"
                            style={{ fontSize: "10px" }}
                          >
                            {isPreviewLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Paperclip className="w-3 h-3" />
                            )}
                            <span>مرفق</span>
                          </button>
                        ) : (
                          <span
                            className="text-[var(--wms-text-muted)]"
                            style={{ fontSize: "10px" }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(row)}
                            className="text-[var(--wms-text-muted)] hover:text-[var(--wms-accent-blue)] cursor-pointer transition-colors"
                            title="تعديل"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(row.id)}
                            disabled={deleteMutation.isPending}
                            className="text-[var(--wms-text-muted)] hover:text-[var(--wms-danger)] cursor-pointer transition-colors disabled:opacity-50"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div
            className="flex items-center justify-between px-3 py-2 border-t border-[var(--wms-border)] shrink-0"
            style={{ backgroundColor: "var(--wms-surface-2)" }}
          >
            <span
              className="text-[var(--wms-text-sec)]"
              style={{ fontSize: "11px", fontWeight: 600 }}
            >
              المجموع ({filteredData.length} عملية)
            </span>
            <span
              className="font-mono"
              style={{
                color: "var(--wms-danger)",
                fontWeight: 700,
                fontSize: "13px",
              }}
            >
              {stats.total.toLocaleString()} ريال
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* N1. Modal: إضافة / تعديل مصروف */}
      {/* ========================================================================= */}
      {isAddExpenseOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div
            className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full"
            style={{ maxWidth: "480px" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <span
                className="text-[var(--wms-text)]"
                style={{ fontSize: "15px", fontWeight: 700 }}
              >
                {modalMode === "add" ? "تسجيل مصروف جديد" : "تعديل المصروف"}
              </span>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-red-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[80vh] overflow-y-auto custom-scrollbar-slim">
              <div>
                <label className="block mb-1 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  البند (نوع المصروف) *
                </label>
                <input
                  type="text"
                  value={expenseForm.item}
                  onChange={(e) => handleFormChange("item", e.target.value)}
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none focus:border-[var(--wms-accent-blue)]"
                  placeholder="مثال: إيجار المكتب، فاتورة كهرباء..."
                  style={{ height: "34px", fontSize: "12px" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    القيمة *
                  </label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => handleFormChange("amount", e.target.value)}
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] font-mono outline-none focus:border-[var(--wms-accent-blue)]"
                    placeholder="0"
                    style={{ height: "34px", fontSize: "12px" }}
                  />
                </div>

                <div className="relative">
                  <label className="block mb-1 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    من دفع؟ (الصلاحية)
                  </label>
                  <select
                    value={expenseForm.payerId}
                    onChange={(e) =>
                      handleFormChange("payerId", e.target.value)
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] outline-none focus:border-[var(--wms-accent-blue)] appearance-none cursor-pointer"
                    style={{ height: "34px", fontSize: "12px" }}
                  >
                    <option value="">الشركة (الخزنة / البنك)</option>
                    {persons.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    طريقة الدفع
                  </label>
                  <select
                    value={expenseForm.method}
                    onChange={(e) => handleFormChange("method", e.target.value)}
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] outline-none focus:border-[var(--wms-accent-blue)]"
                    style={{ height: "34px", fontSize: "12px" }}
                  >
                    <option>نقدي</option>
                    <option>تحويل بنكي</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    المصدر (مسحوب من)
                  </label>
                  <select
                    value={expenseForm.source}
                    onChange={(e) => handleFormChange("source", e.target.value)}
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] outline-none focus:border-[var(--wms-accent-blue)]"
                    style={{ height: "34px", fontSize: "12px" }}
                  >
                    <option value="">اختر المصدر</option>
                    <option>خزنة</option>
                    <option>حساب بنكي</option>
                    <option>دفع شخصي شريك</option>
                    <option>دفع شخصي موظف</option>
                    <option>من تحصيل غير مسلم</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  المدفوع له / الجهة المستفيدة *
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() =>
                      handleFormChange("payeeType", "شخص من النظام")
                    }
                    className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${expenseForm.payeeType === "شخص من النظام" ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
                    style={{ fontSize: "11px", fontWeight: 600 }}
                  >
                    شخص من النظام
                  </button>
                  <button
                    onClick={() => handleFormChange("payeeType", "جهة أخرى")}
                    className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${expenseForm.payeeType === "جهة أخرى" ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
                    style={{ fontSize: "11px", fontWeight: 600 }}
                  >
                    جهة أخرى
                  </button>
                </div>
                {expenseForm.payeeType === "شخص من النظام" ? (
                  <div className="relative">
                    <select
                      value={expenseForm.payeeName}
                      onChange={(e) =>
                        handleFormChange("payeeName", e.target.value)
                      }
                      className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] outline-none focus:border-[var(--wms-accent-blue)] appearance-none cursor-pointer"
                      style={{ height: "34px", fontSize: "12px" }}
                    >
                      <option value="">-- اختر من السجل --</option>
                      {persons.map((emp) => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-2 top-[10px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={expenseForm.payeeName}
                    onChange={(e) =>
                      handleFormChange("payeeName", e.target.value)
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none focus:border-[var(--wms-accent-blue)]"
                    placeholder="اكتب اسم الجهة..."
                    style={{ height: "34px", fontSize: "12px" }}
                  />
                )}
              </div>
              <div>
                <label className="block mb-1 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  التاريخ
                </label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => handleFormChange("date", e.target.value)}
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none focus:border-[var(--wms-accent-blue)]"
                  style={{ height: "34px", fontSize: "12px" }}
                />
              </div>
              <div>
                <label className="block mb-1 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  ملاحظات
                </label>
                <textarea
                  value={expenseForm.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 py-2 text-[var(--wms-text)] resize-none outline-none focus:border-[var(--wms-accent-blue)]"
                  style={{ height: "50px", fontSize: "12px" }}
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-2.5 rounded-md border border-[var(--wms-border)] cursor-pointer hover:bg-[var(--wms-surface-2)] transition-colors">
                  <input
                    type="checkbox"
                    checked={expenseForm.isClearable}
                    onChange={(e) =>
                      handleFormChange("isClearable", e.target.checked)
                    }
                    className="accent-[var(--wms-accent-blue)]"
                    style={{ width: "14px", height: "14px" }}
                  />
                  <div>
                    <span className="text-[var(--wms-text)] block text-[11px] font-bold">
                      قابل للمقاصة
                    </span>
                    <span className="text-[var(--wms-text-muted)] block text-[9px]">
                      يمكن خصمه من تسوية لاحقة
                    </span>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-md border border-[var(--wms-border)] cursor-pointer hover:bg-[var(--wms-surface-2)] transition-colors">
                  <input
                    type="checkbox"
                    checked={expenseForm.linkToSettlement}
                    onChange={(e) =>
                      handleFormChange("linkToSettlement", e.target.checked)
                    }
                    className="accent-[var(--wms-accent-blue)]"
                    style={{ width: "14px", height: "14px" }}
                  />
                  <div>
                    <span className="text-[var(--wms-text)] block text-[11px] font-bold">
                      يرتبط بتسوية مستقبلية
                    </span>
                    <span className="text-[var(--wms-text-muted)] block text-[9px]">
                      سيُربط بتسوية عند إنشائها
                    </span>
                  </div>
                </label>
              </div>
              <div>
                <label className="block mb-1 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  مرفق (اختياري)
                </label>
                <label className="flex flex-col items-center justify-center gap-1 p-3 border-2 border-dashed border-[var(--wms-border)] rounded-lg text-[var(--wms-text-muted)] cursor-pointer hover:border-[var(--wms-accent-blue)] hover:bg-blue-50 transition-colors text-[11px]">
                  <Paperclip className="w-4 h-4 mb-1" />
                  <span>
                    {expenseForm.attachment
                      ? expenseForm.attachment.name
                      : "اضغط لإرفاق صورة الإيصال أو ملف PDF"}
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
                onClick={() => setIsAddExpenseOpen(false)}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-gray-200 transition-colors text-[12px] font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmitExpense}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 text-[12px] font-bold"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {modalMode === "add" ? "تسجيل المصروف" : "حفظ التعديلات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* باقي النوافذ كما هي (التصدير، المعاينة، والمرفق) */}
      {isExportReportOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div
            className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full"
            style={{ maxWidth: "460px" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <span className="text-[var(--wms-text)] text-[15px] font-bold">
                إصدار تقرير المصروفات
              </span>
              <button
                onClick={() => setIsExportReportOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-red-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  الفترة
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "هذا الشهر",
                    "الشهر السابق",
                    "آخر 7 أيام",
                    "آخر 30 يوم",
                    "النصف الأول من الشهر",
                    "النصف الثاني من الشهر",
                    "فترة مخصصة",
                  ].map((period, idx) => (
                    <label
                      key={period}
                      className="flex items-center gap-2 p-2 rounded-md border border-[var(--wms-border)] cursor-pointer hover:bg-[var(--wms-surface-2)] transition-colors"
                    >
                      <input
                        type="radio"
                        name="expPeriod"
                        className="accent-[var(--wms-accent-blue)]"
                        defaultChecked={idx === 0}
                      />
                      <span className="text-[var(--wms-text)] text-[11px]">
                        {period}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--wms-border)]">
              <button
                onClick={handleOpenPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-gray-200 transition-colors text-[12px]"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>معاينة التقرير</span>
              </button>
              <button
                onClick={() => {
                  toast.success("تم بدء تصدير الملف");
                  setIsExportReportOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90 transition-opacity text-[12px] font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>إصدار</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isPreviewReportOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div
            className="bg-white border border-[var(--wms-border)] rounded-xl shadow-2xl flex flex-col"
            style={{ width: "75vw", height: "85vh" }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)] shrink-0 print:hidden">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-[var(--wms-accent-blue)]" />
                <span className="text-[var(--wms-text)] text-[15px] font-bold">
                  معاينة التقرير (يُحدّث تلقائياً)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--wms-surface-2)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-gray-100 transition-colors text-[12px]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
                <button
                  onClick={() => setIsPreviewReportOpen(false)}
                  className="text-[var(--wms-text-muted)] hover:text-red-500 cursor-pointer ml-1 transition-colors bg-gray-50 p-1.5 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div
              className="flex-1 overflow-y-auto p-8 custom-scrollbar-slim"
              style={{ backgroundColor: "rgb(249, 250, 251)" }}
            >
              <div
                className="bg-white rounded-lg border border-gray-200 p-8 mx-auto print:border-none print:shadow-none print:p-0"
                style={{
                  maxWidth: "950px",
                  boxShadow: "rgba(0, 0, 0, 0.06) 0px 1px 3px",
                }}
              >
                <div
                  className="text-center mb-6 pb-4 border-b-2"
                  style={{ borderColor: "rgba(37, 99, 235, 0.15)" }}
                >
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "rgb(26, 35, 50)",
                    }}
                  >
                    تقرير مصروفات وتشغيل المكتب
                  </div>
                  <div
                    className="flex items-center justify-center gap-4 mt-2"
                    style={{ fontSize: "11px", color: "rgb(139, 153, 171)" }}
                  >
                    <span>الفترة: إجمالي السجلات</span>
                    <span>•</span>
                    <span>
                      تاريخ الإصدار:{" "}
                      <span className="font-mono text-[var(--wms-text)] font-bold">
                        {new Date().toISOString().split("T")[0]}
                      </span>
                    </span>
                    <span>•</span>
                    <span>أُعد بواسطة: النظام</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-6 print:break-inside-avoid">
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.15)",
                    }}
                  >
                    <div
                      style={{ fontSize: "10px", color: "rgb(139, 153, 171)" }}
                    >
                      إجمالي المصروفات
                    </div>
                    <div className="font-mono mt-0.5 text-[16px] font-bold text-[var(--wms-danger)]">
                      {stats.total.toLocaleString()} ر.س
                    </div>
                  </div>
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{
                      backgroundColor: "rgba(59, 130, 246, 0.08)",
                      border: "1px solid rgba(59, 130, 246, 0.15)",
                    }}
                  >
                    <div
                      style={{ fontSize: "10px", color: "rgb(139, 153, 171)" }}
                    >
                      تحويلات بنكية
                    </div>
                    <div className="font-mono mt-0.5 text-[14px] font-bold text-[var(--wms-accent-blue)]">
                      {stats.bank.toLocaleString()} ر.س
                    </div>
                  </div>
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{
                      backgroundColor: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.15)",
                    }}
                  >
                    <div
                      style={{ fontSize: "10px", color: "rgb(139, 153, 171)" }}
                    >
                      دفع نقدي
                    </div>
                    <div className="font-mono mt-0.5 text-[16px] font-bold text-[var(--wms-warning)]">
                      {stats.cash.toLocaleString()} ر.س
                    </div>
                  </div>
                </div>
                <table
                  className="w-full mb-6 print:text-[10px]"
                  style={{ fontSize: "12px", borderCollapse: "collapse" }}
                >
                  <thead>
                    <tr>
                      <th className="text-right px-3 py-2 font-bold text-[11px] text-gray-700 bg-gray-100 border-b-2 border-gray-300">
                        التاريخ
                      </th>
                      <th className="text-right px-3 py-2 font-bold text-[11px] text-gray-700 bg-gray-100 border-b-2 border-gray-300">
                        وصف البند
                      </th>
                      <th className="text-right px-3 py-2 font-bold text-[11px] text-gray-700 bg-gray-100 border-b-2 border-gray-300">
                        الجهة المستفيدة
                      </th>
                      <th className="text-right px-3 py-2 font-bold text-[11px] text-gray-700 bg-gray-100 border-b-2 border-gray-300">
                        القيمة
                      </th>
                      <th className="text-right px-3 py-2 font-bold text-[11px] text-gray-700 bg-gray-100 border-b-2 border-gray-300">
                        طريقة الدفع
                      </th>
                      <th className="text-right px-3 py-2 font-bold text-[11px] text-gray-700 bg-gray-100 border-b-2 border-gray-300">
                        من دفع
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, i) => (
                      <tr
                        key={row.id}
                        style={{
                          backgroundColor:
                            i % 2 === 1 ? "rgb(250, 251, 252)" : "white",
                        }}
                      >
                        <td className="px-3 py-2 font-mono text-gray-500 border-b border-gray-200">
                          {row.date}
                        </td>
                        <td className="px-3 py-2 text-gray-700 font-bold border-b border-gray-200">
                          {row.item}
                        </td>
                        <td className="px-3 py-2 text-gray-600 border-b border-gray-200">
                          {row.payee}
                        </td>
                        <td className="px-3 py-2 font-mono text-red-600 font-bold border-b border-gray-200">
                          {row.amount.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-gray-600 border-b border-gray-200">
                          {row.method}
                        </td>
                        <td className="px-3 py-2 text-gray-600 border-b border-gray-200">
                          {row.payer}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewData && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.8)" }}
          dir="rtl"
          onClick={closePreview}
        >
          <div
            className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
            style={{ width: "80vw", maxWidth: "900px", height: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)] shrink-0 bg-[var(--wms-surface-1)]">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-[var(--wms-accent-blue)]" />
                <span className="text-[var(--wms-text)] font-bold text-[14px]">
                  معاينة المرفق
                </span>
              </div>
              <button
                onClick={closePreview}
                className="text-[var(--wms-text-muted)] hover:text-red-500 cursor-pointer transition-colors p-1.5 bg-gray-50 rounded-md hover:bg-red-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-gray-100 p-4 flex items-center justify-center overflow-auto custom-scrollbar-slim">
              {previewData.isPdf ? (
                <iframe
                  src={previewData.url}
                  className="w-full h-full rounded-lg border border-gray-300 shadow-sm bg-white"
                  title="معاينة PDF"
                />
              ) : (
                <img
                  src={previewData.url}
                  alt="مرفق المعاملة"
                  className="max-w-full max-h-full rounded-lg shadow-sm border border-gray-300 object-contain bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeExpensesPage;
