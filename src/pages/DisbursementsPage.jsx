import React, { useState, useMemo } from "react";
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
  Wallet,
  Clock,
  CheckCircle,
  Bell,
  ChevronUp,
  ChevronDown,
  TriangleAlert,
  Upload,
  Paperclip,
  Loader2,
  Printer,
  FileText,
  Calendar,
  Link2,
  Edit3,
  Trash2,
} from "lucide-react";

const DisbursementsPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Selection & Modals State
  const [selectedRow, setSelectedRow] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [executeData, setExecuteData] = useState(null);

  // 💡 تحديث نموذج البيانات ليدعم سجل الأشخاص
  const initialForm = {
    id: null,
    type: "مصروف",
    beneficiaryType: "شخص من النظام", // 💡 للتبديل في الواجهة
    personId: "", // 💡 للإرسال للباك إند
    beneficiaryName: "", // 💡 للجهات الخارجية
    amount: "",
    date: new Date().toISOString().split("T")[0],
    reason: "",
    notes: "",
    attachment: null,
    isRelatedToTx: false,
    department: "مصاريف إدارية وعمومية",
    importance: "عادية",
    repaymentType: "بالكامل",
    expectedReturnDate: "",
    repaymentMethod: "نقدي",
  };
  const [formData, setFormData] = useState(initialForm);

  const [execForm, setExecForm] = useState({
    status: "تم الدفع",
    executionMethod: "تحويل بنكي",
    executionReference: "",
    executionNotes: "",
    file: null,
  });

  // ==========================================
  // 1. Fetch Data
  // ==========================================
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["disbursements"],
    queryFn: async () => {
      const res = await api.get("/disbursements");
      return res.data?.data || [];
    },
  });

  // 💡 جلب سجل الأشخاص الشامل بدلاً من الموظفين
  const { data: persons = [] } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => {
      const res = await api.get("/persons");
      return res.data?.data || [];
    },
  });

  // فلترة الموظفين والشركاء (للسلف)
  const employeesAndPartners = useMemo(() => {
    return persons.filter((p) => p.role === "موظف" || p.role === "شريك");
  }, [persons]);

  // ==========================================
  // 2. Mutations
  // ==========================================
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const fd = new FormData();
      Object.keys(payload).forEach((k) => {
        if (k === "attachment" && payload[k]) fd.append("file", payload[k]);
        else fd.append(k, payload[k]);
      });
      const res = await api.post("/disbursements", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("تم رفع الطلب بنجاح");
      queryClient.invalidateQueries(["disbursements"]);
      setIsAddOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || "حدث خطأ"),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const fd = new FormData();
      Object.keys(payload).forEach((k) => {
        if (k === "attachment" && payload[k]) fd.append("file", payload[k]);
        else if (k !== "id") fd.append(k, payload[k]);
      });
      const res = await api.put(`/disbursements/${payload.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("تم تعديل الطلب بنجاح");
      queryClient.invalidateQueries(["disbursements"]);
      setIsAddOpen(false);
      if (selectedRow) setSelectedRow(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || "حدث خطأ"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/disbursements/${id}`),
    onSuccess: () => {
      toast.success("تم الحذف بنجاح");
      queryClient.invalidateQueries(["disbursements"]);
      if (selectedRow) setSelectedRow(null);
    },
  });

  const executeMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const fd = new FormData();
      Object.keys(payload).forEach((k) => {
        if (k === "file" && payload[k]) fd.append("file", payload[k]);
        else fd.append(k, payload[k]);
      });
      const res = await api.put(`/disbursements/${id}/execute`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب");
      queryClient.invalidateQueries(["disbursements"]);
      setExecuteData(null);
      if (selectedRow) setSelectedRow(null);
    },
  });

  // ==========================================
  // Handlers
  // ==========================================
  const handleOpenAdd = () => {
    setModalMode("add");
    setFormData(initialForm); // 💡 تصفير البيانات عند الإضافة
    setIsAddOpen(true);
  };

  const handleOpenEdit = (e, row) => {
    e.stopPropagation();
    setModalMode("edit");
    setFormData({
      id: row.id,
      type: row.type,
      // 💡 تحديد النوع والـ ID بذكاء
      beneficiaryType: row.personId ? "شخص من النظام" : "جهة أخرى",
      personId: row.personId || "",
      beneficiaryName: row.personId ? "" : row.beneficiary,
      amount: row.amount,
      date: row.date,
      reason: row.reason,
      notes: row.notes || "",
      attachment: null,
      isRelatedToTx: row.isRelatedToTx || false,
      department: row.department || "مصاريف إدارية وعمومية",
      repaymentType: row.repaymentType || "بالكامل",
      expectedReturnDate: row.expectedReturnDate || "",
      repaymentMethod: row.repaymentMethod || "نقدي",
    });
    setIsAddOpen(true);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = () => {
    // التحقق من صحة البيانات
    if (!formData.amount || !formData.reason)
      return toast.error("أكمل الحقول الأساسية");
    if (formData.beneficiaryType === "شخص من النظام" && !formData.personId)
      return toast.error("الرجاء اختيار الشخص المستفيد");
    if (formData.beneficiaryType === "جهة أخرى" && !formData.beneficiaryName)
      return toast.error("الرجاء كتابة اسم الجهة المستفيدة");

    if (modalMode === "edit") updateMutation.mutate(formData);
    else createMutation.mutate(formData);
  };

  // ==========================================
  // Logic & Stats
  // ==========================================
  const activeRecords = records.filter((r) => r.status !== "مرفوض");

  const overdueAdvances = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return activeRecords
      .filter((r) => {
        if (
          r.type !== "سلفة" ||
          r.status !== "تم الدفع" ||
          r.remainingAmount === 0 ||
          !r.expectedReturnDate
        )
          return false;
        return new Date(r.expectedReturnDate) < today;
      })
      .map((r) => ({
        ...r,
        diffDays: Math.ceil(
          Math.abs(today - new Date(r.expectedReturnDate)) /
            (1000 * 60 * 60 * 24),
        ),
      }));
  }, [activeRecords]);

  const stats = useMemo(() => {
    let totalExpenses = 0,
      activeAdvancesSum = 0;
    activeRecords.forEach((r) => {
      if (r.type === "مصروف" && r.status === "تم الدفع")
        totalExpenses += r.amount;
      if (r.type === "سلفة" && r.status === "تم الدفع")
        activeAdvancesSum += r.remainingAmount || 0;
    });
    return {
      totalExpenses,
      activeAdvancesSum,
      pendingAmount: records
        .filter((r) => r.status === "معلق")
        .reduce((s, r) => s + r.amount, 0),
      completedCount: records.filter((r) => r.status === "تم الدفع").length,
    };
  }, [activeRecords, records]);

  const filteredData = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.beneficiary?.includes(searchQuery) ||
        r.requestNumber?.includes(searchQuery) ||
        r.reason?.includes(searchQuery);
      const matchType = filterType === "all" || r.type === filterType;
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "معلق" && r.status === "معلق") ||
        (filterStatus === "مكتملة" && r.status === "تم الدفع") ||
        (filterStatus === "مرفوضة" && r.status === "مرفوض");
      return matchSearch && matchType && matchStatus;
    });
  }, [records, searchQuery, filterType, filterStatus]);

  const getStatusBadge = (status, repaymentStatus) => {
    if (status === "معلق")
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
          معلق (بانتظار الدفع)
        </span>
      );
    if (status === "مرفوض")
      return (
        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
          مرفوض
        </span>
      );
    if (repaymentStatus === "غير مطلوب")
      return (
        <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold">
          غير مطلوب
        </span>
      );
    if (repaymentStatus === "لم يسدد")
      return (
        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
          لم يسدد
        </span>
      );
    if (repaymentStatus === "جزئي")
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
          جزئي
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
        مسدد
      </span>
    );
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case "مصروف":
        return "background-color: rgba(239, 68, 68, 0.12); color: var(--wms-danger);";
      case "سلفة":
        return "background-color: rgba(234, 179, 8, 0.12); color: rgb(180, 83, 9);";
      case "سحب":
        return "background-color: rgba(245, 158, 11, 0.12); color: var(--wms-warning);";
      default:
        return "background-color: rgba(100, 116, 139, 0.12); color: var(--wms-text-muted);";
    }
  };

  return (
    <div
      className="p-3 flex flex-col h-full overflow-hidden bg-[var(--wms-bg-0)] font-sans"
      dir="rtl"
    >
      {/* Top Stats */}
      <div className="flex items-center gap-5 px-4 py-2 bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg mb-3 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-2">
          <div>
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              إجمالي المصروفات
            </div>
            <div className="font-mono text-[15px] font-bold text-[var(--wms-danger)]">
              {stats.totalExpenses.toLocaleString()}{" "}
              <span className="text-[10px] font-normal">ر.س</span>
            </div>
          </div>
        </div>
        <div className="w-px h-6 bg-[var(--wms-border)]"></div>
        <div className="flex items-center gap-2">
          <div>
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              السلف القائمة
            </div>
            <div
              className="font-mono text-[15px] font-bold"
              style={{ color: "rgb(180, 83, 9)" }}
            >
              {stats.activeAdvancesSum.toLocaleString()}{" "}
              <span className="text-[10px] font-normal">ر.س</span>
            </div>
          </div>
        </div>
        <div className="w-px h-6 bg-[var(--wms-border)]"></div>
        <div className="flex items-center gap-2">
          <div>
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              أوامر معلقة
            </div>
            <div className="font-mono text-[15px] font-bold text-[var(--wms-warning)]">
              {stats.pendingAmount.toLocaleString()}{" "}
              <span className="text-[10px] font-normal">ر.س</span>
            </div>
          </div>
        </div>
        <div className="w-px h-6 bg-[var(--wms-border)]"></div>
        <div className="flex items-center gap-2">
          <div>
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              طلبات مكتملة
            </div>
            <div className="font-mono text-[15px] font-bold text-[var(--wms-text-sec)]">
              {stats.completedCount} طلب
            </div>
          </div>
        </div>
      </div>

      {/* Reminders */}
      <div className="rounded-lg overflow-hidden bg-[var(--wms-surface-1)] border border-[var(--wms-border)] mb-3 shrink-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--wms-border)]">
          <div className="flex items-center gap-2">
            <Bell
              className={`w-4 h-4 ${overdueAdvances.length > 0 ? "text-[var(--wms-danger)]" : "text-slate-400"}`}
            />
            <span className="text-[var(--wms-text)] text-[12px] font-bold">
              التذكيرات والمتابعات
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500">
              {overdueAdvances.length}
            </span>
          </div>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </div>
        {overdueAdvances.length > 0 && (
          <div className="p-2 space-y-1.5 max-h-[120px] overflow-y-auto">
            {overdueAdvances.map((adv) => (
              <div
                key={adv.id}
                className="flex items-start gap-2 p-2 rounded-md bg-red-50 border border-red-100 cursor-pointer hover:opacity-90"
                onClick={() => setSelectedRow(adv)}
              >
                <TriangleAlert className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-500" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-red-600">
                      سلفة متأخرة
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[9px] font-bold">
                      متأخر {adv.diffDays} يوم
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">
                    {adv.beneficiary} — كان يجب الرد {adv.expectedReturnDate}
                  </div>
                </div>
                <span className="font-mono text-[11px] font-bold text-red-600">
                  {adv.remainingAmount?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-accent-blue)] text-white hover:opacity-90 h-[32px] text-[12px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>تسجيل صرف</span>
        </button>
        <div className="flex-1"></div>
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--wms-text-muted)]" />
          <input
            type="text"
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md pr-8 pl-3 text-[var(--wms-text)] outline-none w-[200px] h-[32px] text-[12px]"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] h-[32px] text-[11px] outline-none"
        >
          <option value="all">كل الأنواع</option>
          <option value="مصروف">مصروف</option>
          <option value="سلفة">سلفة</option>
          <option value="سحب">سحب</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] h-[32px] text-[11px] outline-none"
        >
          <option value="all">كل الحالات</option>
          <option value="مسدد">مسدد</option>
          <option value="لم يسدد">لم يسدد</option>
          <option value="معلق">معلق</option>
        </select>
      </div>

      {/* ========================================== */}
      {/* Split Layout: Table + Details Panel */}
      {/* ========================================== */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Table Area */}
        <div
          className={`bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden flex flex-col transition-all duration-300 ${selectedRow ? "w-[65%]" : "w-full"}`}
        >
          <div className="overflow-auto custom-scrollbar-slim flex-1">
            <table className="w-full text-right whitespace-nowrap text-[12px]">
              <thead className="sticky top-0 z-10 bg-[var(--wms-surface-2)]">
                <tr className="h-[36px]">
                  <th className="px-2 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                    رقم
                  </th>
                  <th className="px-2 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                    النوع
                  </th>
                  <th className="px-2 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                    المستفيد
                  </th>
                  <th className="px-2 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                    السبب
                  </th>
                  <th className="px-2 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                    المبلغ
                  </th>
                  <th className="px-2 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                    التاريخ
                  </th>
                  <th className="px-2 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                    الحالة
                  </th>
                  <th className="px-2 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                    المتبقي
                  </th>
                  <th className="px-2 text-center text-[var(--wms-text-sec)] font-semibold text-[11px]">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-gray-500">
                      لا توجد سجلات
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedRow(row)}
                      className={`border-b border-[var(--wms-border)]/30 cursor-pointer transition-colors h-[38px] ${selectedRow?.id === row.id ? "bg-[var(--wms-surface-2)]" : "hover:bg-[var(--wms-surface-2)]/40"}`}
                    >
                      <td className="px-2 text-[var(--wms-accent-blue)] font-mono text-[11px]">
                        {row.requestNumber}
                      </td>
                      <td className="px-2">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                          style={{ cssText: getTypeStyle(row.type) }}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="px-2 text-[var(--wms-text)] font-medium">
                        {row.beneficiary}
                      </td>
                      <td className="px-2 text-[var(--wms-text-sec)] text-[11px] truncate max-w-[120px]">
                        {row.reason}
                      </td>
                      <td className="px-2 font-mono font-bold text-[var(--wms-danger)]">
                        {row.amount.toLocaleString()}
                      </td>
                      <td className="px-2 font-mono text-[var(--wms-text-sec)] text-[11px]">
                        {row.date}
                      </td>
                      <td className="px-2">
                        {getStatusBadge(row.status, row.repaymentStatus)}
                      </td>
                      <td className="px-2 font-mono font-bold text-[11px] text-[var(--wms-warning)]">
                        {row.remainingAmount > 0
                          ? row.remainingAmount.toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {row.status === "معلق" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExecuteData(row);
                                setExecForm({
                                  ...execForm,
                                  status: "تم الدفع",
                                });
                              }}
                              className="px-2 py-0.5 rounded bg-green-600 text-white text-[10px] font-bold hover:bg-green-700"
                            >
                              دفع
                            </button>
                          )}
                          <button
                            onClick={(e) => handleOpenEdit(e, row)}
                            className="text-gray-400 hover:text-amber-600"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, row.id)}
                            className="text-gray-400 hover:text-red-600"
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
        </div>

        {/* Side Details Panel */}
        {selectedRow && (
          <div className="w-[35%] bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg flex flex-col overflow-hidden animate-in slide-in-from-left-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--wms-border)] bg-[var(--wms-surface-2)]">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[var(--wms-accent-blue)] font-mono text-[12px] font-bold">
                    {selectedRow.requestNumber}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{ cssText: getTypeStyle(selectedRow.type) }}
                  >
                    {selectedRow.type}
                  </span>
                </div>
                <div className="text-[var(--wms-text)] text-[14px] font-bold">
                  {selectedRow.beneficiary}
                </div>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="text-gray-400 hover:text-red-500 bg-white p-1 rounded shadow-sm border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-2 rounded border">
                  <div className="text-[var(--wms-text-muted)] text-[10px] font-bold mb-1">
                    المبلغ
                  </div>
                  <div className="font-mono text-[18px] font-bold text-[var(--wms-danger)]">
                    {selectedRow.amount.toLocaleString()}{" "}
                    <span className="text-[10px]">ر.س</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded border">
                  <div className="text-[var(--wms-text-muted)] text-[10px] font-bold mb-1">
                    {selectedRow.type === "مصروف"
                      ? "الحالة"
                      : "المتبقي للاسترداد"}
                  </div>
                  {selectedRow.type === "مصروف" ? (
                    <div className="mt-1">
                      {getStatusBadge(
                        selectedRow.status,
                        selectedRow.repaymentStatus,
                      )}
                    </div>
                  ) : (
                    <div className="font-mono text-[18px] font-bold text-[var(--wms-warning)]">
                      {selectedRow.remainingAmount?.toLocaleString() || 0}{" "}
                      <span className="text-[10px]">ر.س</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[var(--wms-text-muted)] text-[10px] font-bold">
                    التاريخ
                  </div>
                  <div className="font-mono text-[var(--wms-text)] text-[12px]">
                    {selectedRow.date}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--wms-text-muted)] text-[10px] font-bold">
                    السبب
                  </div>
                  <div
                    className="text-[var(--wms-text)] text-[12px] truncate"
                    title={selectedRow.reason}
                  >
                    {selectedRow.reason}
                  </div>
                </div>
              </div>
              {selectedRow.type !== "مصروف" &&
                selectedRow.expectedReturnDate && (
                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[11px] font-bold text-amber-700">
                        تاريخ الرد المتوقع
                      </span>
                    </div>
                    <div className="font-mono text-[var(--wms-text)] text-[12px] font-bold">
                      {selectedRow.expectedReturnDate}
                    </div>
                  </div>
                )}
              {selectedRow.type !== "مصروف" &&
                selectedRow.repaymentType !== "غير محدد" &&
                selectedRow.status === "تم الدفع" && (
                  <div className="border border-[var(--wms-border)] rounded-lg overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--wms-border)] bg-[var(--wms-surface-2)]">
                      <Clock className="w-3.5 h-3.5 text-[var(--wms-text-muted)]" />
                      <span className="text-[var(--wms-text)] text-[12px] font-bold">
                        جدول السداد المتوقع
                      </span>
                    </div>
                    <div className="p-4 text-center text-gray-500 text-[11px]">
                      (سيتم ربط هذا القسم لاحقاً مع نظام التسويات والرواتب)
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--wms-border)] bg-[var(--wms-surface-2)] text-[10px]">
                      <span className="text-[var(--wms-text-sec)]">
                        المسدد:{" "}
                        <span className="font-mono font-bold text-[var(--wms-success)]">
                          {(
                            selectedRow.amount - selectedRow.remainingAmount
                          ).toLocaleString()}
                        </span>
                      </span>
                      <span className="text-[var(--wms-text-sec)]">
                        المتبقي:{" "}
                        <span className="font-mono font-bold text-[var(--wms-warning)]">
                          {selectedRow.remainingAmount.toLocaleString()}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* ==================== Modals ==================== */}

      {/* 1. Add/Edit Request Modal */}
      {isAddOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto custom-scrollbar-slim">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)] sticky top-0 bg-[var(--wms-surface-1)] z-10">
              <span className="text-[var(--wms-text)] text-[15px] font-bold">
                {modalMode === "add" ? "تسجيل عملية صرف" : "تعديل بيانات الصرف"}
              </span>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block mb-1.5 text-[11px] font-bold text-[var(--wms-text-sec)]">
                  النوع *
                </label>
                <div className="flex gap-2">
                  {["مصروف", "سلفة", "سحب"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setFormData({ ...formData, type: t })}
                      className={`px-3 py-1.5 rounded-md font-bold text-[11px] transition-colors ${formData.type === t ? (t === "مصروف" ? "bg-red-600 text-white" : t === "سلفة" ? "bg-amber-600 text-white" : "bg-slate-600 text-white") : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-[11px] font-bold text-[var(--wms-text-sec)]">
                  المستفيد *
                </label>
                {/* 💡 التبديل بين النظام وجهة خارجية */}
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        beneficiaryType: "شخص من النظام",
                        beneficiaryName: "",
                      })
                    }
                    className={`px-3 py-1 rounded-md cursor-pointer transition-colors text-[11px] font-bold ${formData.beneficiaryType === "شخص من النظام" ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
                  >
                    شخص من النظام
                  </button>
                  {formData.type === "مصروف" && (
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          beneficiaryType: "جهة أخرى",
                          personId: "",
                        })
                      }
                      className={`px-3 py-1 rounded-md cursor-pointer transition-colors text-[11px] font-bold ${formData.beneficiaryType === "جهة أخرى" ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
                    >
                      جهة خارجية
                    </button>
                  )}
                </div>

                {formData.beneficiaryType === "شخص من النظام" ||
                formData.type !== "مصروف" ? (
                  <div className="relative">
                    <select
                      value={formData.personId}
                      onChange={(e) =>
                        setFormData({ ...formData, personId: e.target.value })
                      }
                      className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 h-[34px] text-[12px] outline-none appearance-none cursor-pointer"
                    >
                      <option value="">اختر من النظام...</option>
                      {/* عرض الموظفين والشركاء فقط للسلف والسحب */}
                      {(formData.type === "مصروف"
                        ? persons
                        : employeesAndPartners
                      ).map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.role})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-2 top-[10px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.beneficiaryName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        beneficiaryName: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 h-[34px] text-[12px] outline-none focus:border-blue-500"
                    placeholder="مثال: مكتب إنجاز، مؤسسة الصيانة..."
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-[11px] font-bold text-[var(--wms-text-sec)]">
                    المبلغ *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full border border-[var(--wms-border)] rounded-md px-3 h-[34px] font-mono text-[13px] outline-none focus:border-blue-500"
                    style={{ backgroundColor: "rgba(239, 68, 68, 0.05)" }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-[11px] font-bold text-[var(--wms-text-sec)]">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 h-[34px] text-[12px] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-[11px] font-bold text-[var(--wms-text-sec)]">
                  السبب / البيان *
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 h-[34px] text-[12px] outline-none focus:border-blue-500"
                  placeholder="وصف سبب الصرف..."
                />
              </div>

              {formData.type === "مصروف" && (
                <div className="rounded-lg p-3 space-y-3 border bg-blue-50/50 border-blue-100">
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold text-gray-600">
                      هل هذا الصرف مرتبط بمعاملة؟
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setFormData({ ...formData, isRelatedToTx: true })
                        }
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${formData.isRelatedToTx ? "bg-blue-600 text-white" : "bg-white border text-gray-600"}`}
                      >
                        نعم
                      </button>
                      <button
                        onClick={() =>
                          setFormData({ ...formData, isRelatedToTx: false })
                        }
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${!formData.isRelatedToTx ? "bg-blue-600 text-white" : "bg-white border text-gray-600"}`}
                      >
                        لا (مصروف عام)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[10px] font-bold text-gray-600">
                      القسم التابع له المصروف
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="w-full bg-white border border-gray-200 rounded-md px-2 h-[32px] text-[12px] outline-none"
                    >
                      <option>مصاريف إدارية وعمومية</option>
                      <option>مصاريف تشغيلية (مشاريع)</option>
                      <option>أتعاب مكاتب متعاونة</option>
                    </select>
                  </div>
                </div>
              )}

              {(formData.type === "سلفة" || formData.type === "سحب") && (
                <div className="rounded-lg p-3 space-y-3 border bg-amber-50/50 border-amber-100">
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-amber-800">
                      هل سيتم الرد؟
                    </label>
                    <div className="flex gap-2">
                      {["بالكامل", "على دفعات", "غير محدد"].map((t) => (
                        <button
                          key={t}
                          onClick={() =>
                            setFormData({ ...formData, repaymentType: t })
                          }
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${formData.repaymentType === t ? "bg-amber-600 text-white" : "bg-white border text-gray-600"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  {formData.repaymentType !== "غير محدد" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1.5 text-[10px] font-bold text-gray-600">
                          تاريخ الرد المتوقع
                        </label>
                        <input
                          type="date"
                          value={formData.expectedReturnDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              expectedReturnDate: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-gray-200 rounded-md px-2 h-[32px] text-[12px] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block mb-1.5 text-[10px] font-bold text-gray-600">
                          طريقة السداد المتوقعة
                        </label>
                        <select
                          value={formData.repaymentMethod}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              repaymentMethod: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-gray-200 rounded-md px-2 h-[32px] text-[12px] outline-none"
                        >
                          <option>نقدي / تحويل</option>
                          <option>خصم من التسوية</option>
                          <option>خصم من الراتب</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block mb-1.5 text-[11px] font-bold text-[var(--wms-text-sec)]">
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 py-2 text-[12px] outline-none resize-none h-[45px]"
                ></textarea>
              </div>

              <div>
                <label className="block mb-1.5 text-[11px] font-bold text-[var(--wms-text-sec)]">
                  المرفق (مطالبة، فاتورة)
                </label>
                <label className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-[var(--wms-border)] rounded-lg text-gray-400 cursor-pointer hover:border-blue-500 text-[11px]">
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {formData.attachment
                      ? formData.attachment.name
                      : "اضغط لإرفاق مستند"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attachment: e.target.files[0],
                      })
                    }
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--wms-border)] bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-1.5 rounded-md bg-white border border-gray-300 text-gray-600 text-[12px] font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {modalMode === "add" ? "رفع طلب الصرف" : "حفظ التعديلات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Execute/Approve Modal */}
      {executeData && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-[500px]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <span className="text-gray-800 text-[15px] font-bold">
                اعتماد وتنفيذ أمر الصرف
              </span>
              <button
                onClick={() => setExecuteData(null)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-lg p-3 bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[11px]">رقم الطلب:</span>
                  <span className="font-mono text-[12px] font-bold">
                    {executeData.requestNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[11px]">المستفيد:</span>
                  <span className="text-[12px] font-bold">
                    {executeData.beneficiary}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[11px]">
                    المبلغ المطلوب:
                  </span>
                  <span className="font-mono text-[16px] font-bold text-red-600">
                    {executeData.amount.toLocaleString()} ر.س
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[11px]">البيان:</span>
                  <span className="text-[12px]">{executeData.reason}</span>
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-[11px] font-bold text-gray-700">
                  القرار (الإجراء)
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setExecForm({ ...execForm, status: "تم الدفع" })
                    }
                    className={`flex-1 py-2 rounded-md font-bold text-[12px] transition-colors ${execForm.status === "تم الدفع" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}
                  >
                    اعتماد وتنفيذ (دفع)
                  </button>
                  <button
                    onClick={() =>
                      setExecForm({ ...execForm, status: "مرفوض" })
                    }
                    className={`flex-1 py-2 rounded-md font-bold text-[12px] transition-colors ${execForm.status === "مرفوض" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}
                  >
                    رفض الطلب
                  </button>
                </div>
              </div>

              {execForm.status === "تم الدفع" && (
                <div className="space-y-3 pt-3 border-t border-gray-100 animate-in fade-in">
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-gray-700">
                      طريقة الدفع الفعلية
                    </label>
                    <select
                      value={execForm.executionMethod}
                      onChange={(e) =>
                        setExecForm({
                          ...execForm,
                          executionMethod: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-gray-300 rounded-md px-2 h-[34px] text-[12px] outline-none"
                    >
                      <option>تحويل بنكي</option>
                      <option>نقدي من الخزنة</option>
                      <option>شيك</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-gray-700">
                      المرجع البنكي / رقم الإيصال
                    </label>
                    <input
                      type="text"
                      value={execForm.executionReference}
                      onChange={(e) =>
                        setExecForm({
                          ...execForm,
                          executionReference: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-gray-300 rounded-md px-3 h-[34px] text-[12px] font-mono outline-none"
                      placeholder="رقم الحوالة..."
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-gray-700">
                      إرفاق إيصال التحويل (مهم)
                    </label>
                    <label className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 cursor-pointer hover:border-green-500 text-[11px]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {execForm.file
                          ? execForm.file.name
                          : "اضغط لرفع الإيصال"}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          setExecForm({ ...execForm, file: e.target.files[0] })
                        }
                      />
                    </label>
                  </div>
                </div>
              )}

              {execForm.status === "مرفوض" && (
                <div className="pt-3 border-t border-gray-100">
                  <label className="block mb-1.5 text-[11px] font-bold text-gray-700">
                    سبب الرفض
                  </label>
                  <textarea
                    value={execForm.executionNotes}
                    onChange={(e) =>
                      setExecForm({
                        ...execForm,
                        executionNotes: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[12px] outline-none h-[60px]"
                  ></textarea>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setExecuteData(null)}
                className="px-4 py-1.5 rounded-md bg-white border border-gray-300 text-gray-600 text-[12px] font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() =>
                  executeMutation.mutate({
                    id: executeData.id,
                    payload: execForm,
                  })
                }
                disabled={executeMutation.isPending}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-white text-[12px] font-bold hover:opacity-90 disabled:opacity-50 ${execForm.status === "تم الدفع" ? "bg-green-600" : "bg-red-600"}`}
              >
                {executeMutation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}{" "}
                تأكيد وإغلاق الطلب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisbursementsPage;
