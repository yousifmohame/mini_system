import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Building2,
  X,
  Loader2,
  Save,
  Printer,
  Trash2,
  Edit3,
  Link as LinkIcon,
  CheckCircle,
  FileDigit,
  Banknote,
  Filter,
  EyeOff,
  Eye,
  CalendarDays,
  CheckSquare,
  FileText
} from "lucide-react";
import AccessControl from "../components/AccessControl";

// ============================================================================
// 💡 مكون القائمة المنسدلة القابلة للبحث (للربط بالمعاملات)
// ============================================================================
const SearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold bg-white flex justify-between items-center cursor-pointer focus:border-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate text-gray-700">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95">
          <div className="sticky top-0 bg-white p-2 border-b border-gray-100 z-10">
            <input
              type="text"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded outline-none focus:border-blue-500 bg-gray-50"
              placeholder="ابحث بالاسم أو الرقم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs font-bold text-gray-700 rounded transition-colors"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-xs text-gray-400 text-center font-bold">
                لا توجد نتائج
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CoopOfficesFeesPage = () => {
  const queryClient = useQueryClient();

  // States للبحث والفلترة
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState("all");
  const [hidePaid, setHidePaid] = useState(true);

  // States النوافذ
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  // 💡 State نافذة السداد المباشر
  const [payData, setPayData] = useState(null);

  // 💡 States منشئ التقارير
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportOfficeId, setReportOfficeId] = useState("");
  const [reportFilters, setReportFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: "",
  });
  const [selectedReportTxs, setSelectedReportTxs] = useState([]); // لاختيار المعاملات في التقرير

  const initialForm = {
    transactionId: "",
    requestType: "اصدار",
    internalName: "",
    officeId: "",
    officeFees: "",
    paidAmount: "",
    dueDate: "",
    providedServices: "",
    uploadStatus: "مع الرفع على النظام",
    licenseNumber: "",
    licenseYear: "",
    serviceNumber: "",
    serviceYear: "",
    entityName: "",
    notes: "",
  };
  const [formData, setFormData] = useState(initialForm);

  // ==========================================
  // Queries
  // ==========================================
  const { data: offices = [] } = useQuery({
    queryKey: ["coop-offices"],
    queryFn: async () => (await api.get("/coop-offices")).data?.data || [],
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["private-transactions-full"], // نستخدم full لجلب الـ notes التي تحتوي على تاريخ الاعتماد
    queryFn: async () =>
      (await api.get("/private-transactions")).data?.data || [],
  });

  const txOptions = transactions.map((t) => ({
    label: `${t.internalName || t.client} - ${t.ref || t.id.slice(-6)}`,
    value: t.id,
    type: t.type || t.category,
    internalName: t.internalName || t.client,
  }));

  const { data: feesData = [], isLoading } = useQuery({
    queryKey: ["coop-office-fees"],
    queryFn: async () => (await api.get("/coop-office-fees")).data?.data || [],
  });

  // 💡 دالة مساعدة لاستخراج تاريخ الاعتماد من المعاملة المربوطة بشكل آمن
  const getApprovalDate = (txId) => {
    if (!txId) return null;
    
    // البحث عن المعاملة المربوطة
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return null;

    // 1. محاولة جلب تاريخ الاعتماد الفعلي من الملاحظات
    const approvalDate = tx.notes?.transactionStatusData?.approvalDate;
    if (approvalDate) return approvalDate;

    // 2. إذا لم يكن معتمداً، نستخدم تاريخ إنشاء المعاملة كبديل (Fallback)
    // لاحظ أن الباك إند يرسل تاريخ الإنشاء تحت اسم "created"
    if (tx.created) return tx.created;
    
    return null;
  };

  // ==========================================
  // Derived Data (الجدول الرئيسي)
  // ==========================================
  const filteredData = useMemo(() => {
    let result = feesData;
    if (selectedOfficeFilter !== "all") {
      result = result.filter((item) => item.officeId === selectedOfficeFilter);
    }
    if (hidePaid) {
      result = result.filter((item) => {
        const remaining =
          (Number(item.officeFees) || 0) - (Number(item.paidAmount) || 0);
        return remaining > 0;
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.officeName?.toLowerCase().includes(q) ||
          item.internalName?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [feesData, searchQuery, selectedOfficeFilter, hidePaid]);

  const stats = useMemo(() => {
    return filteredData.reduce(
      (acc, curr) => {
        acc.totalFees += Number(curr.officeFees) || 0;
        acc.totalPaid += Number(curr.paidAmount) || 0;
        acc.totalRemaining +=
          (Number(curr.officeFees) || 0) - (Number(curr.paidAmount) || 0);
        return acc;
      },
      { totalFees: 0, totalPaid: 0, totalRemaining: 0 },
    );
  }, [filteredData]);

  // ==========================================
  // Mutations
  // ==========================================
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (modalMode === "add")
        return await api.post("/coop-office-fees", payload);
      else
        return await api.put(`/coop-office-fees/${selectedRecordId}`, payload);
    },
    onSuccess: () => {
      toast.success(
        modalMode === "add" ? "تم التسجيل بنجاح" : "تم التعديل بنجاح",
      );
      queryClient.invalidateQueries(["coop-office-fees"]);
      setIsAddModalOpen(false);
    },
    onError: () => toast.error("حدث خطأ أثناء الحفظ. تأكد من البيانات."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/coop-office-fees/${id}`),
    onSuccess: () => {
      toast.success("تم الحذف بنجاح");
      queryClient.invalidateQueries(["coop-office-fees"]);
    },
  });

  // 💡 الميوتايشن الخاص بسداد الدفعة
  const payFeeMutation = useMutation({
    mutationFn: async ({ id, newPaidAmount }) =>
      await api.put(`/coop-office-fees/${id}`, { paidAmount: newPaidAmount }),
    onSuccess: () => {
      toast.success("تم تسجيل السداد وتحديث الحالة بنجاح");
      queryClient.invalidateQueries(["coop-office-fees"]);
      setPayData(null);
    },
    onError: () => toast.error("حدث خطأ أثناء تسجيل السداد"),
  });

  // ==========================================
  // Handlers
  // ==========================================
  const handleSubmit = () => {
    if (!formData.internalName || !formData.officeId || !formData.officeFees) {
      return toast.error(
        "الرجاء إكمال الحقول الإلزامية (الاسم، المكتب، الأتعاب)",
      );
    }
    // 💡 تنظيف الـ Payload لتجنب الخطأ 500
    const payload = {
      transactionId: formData.transactionId || null,
      requestType: formData.requestType,
      internalName: formData.internalName,
      officeId: formData.officeId,
      officeFees: parseFloat(formData.officeFees) || 0,
      paidAmount: parseFloat(formData.paidAmount) || 0,
      dueDate: formData.dueDate || null,
      providedServices: formData.providedServices || "",
      uploadStatus: formData.uploadStatus,
      licenseNumber: formData.licenseNumber || "",
      licenseYear: formData.licenseYear || "",
      serviceNumber: formData.serviceNumber || "",
      serviceYear: formData.serviceYear || "",
      entityName: formData.entityName || "",
      notes: formData.notes || "",
    };
    saveMutation.mutate(payload);
  };

  const handlePaySubmit = (e) => {
    e.preventDefault();
    const amountToAdd = parseFloat(payData.amountToAdd);
    if (!amountToAdd || amountToAdd <= 0)
      return toast.error("الرجاء إدخال مبلغ صحيح");

    const newPaidAmount =
      (Number(payData.record.paidAmount) || 0) + amountToAdd;
    payFeeMutation.mutate({ id: payData.record.id, newPaidAmount });
  };

  const openAddModal = () => {
    setModalMode("add");
    setFormData(initialForm);
    setIsAddModalOpen(true);
  };

  const openEditModal = (record) => {
    setModalMode("edit");
    setSelectedRecordId(record.id);
    setFormData({
      ...initialForm,
      ...record,
      officeFees: record.officeFees || "",
      paidAmount: record.paidAmount || "",
    });
    setIsAddModalOpen(true);
  };

  const handleTransactionLink = (val) => {
    const selectedTx = transactions.find((t) => t.id === val);
    if (selectedTx) {
      setFormData({
        ...formData,
        transactionId: val,
        internalName: selectedTx.internalName || selectedTx.client || "",
        requestType: selectedTx.type || selectedTx.category || "اصدار",
      });
      toast.success("تم سحب بيانات المعاملة بنجاح");
    } else {
      setFormData({ ...formData, transactionId: "" });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // 💡 دالة فلترة بيانات التقرير
  const getFilteredReportData = () => {
    if (!reportOfficeId) return [];
    let data = feesData.filter((f) => f.officeId === reportOfficeId);

    // فلتر الحالة
    if (reportFilters.status === "paid")
      data = data.filter((f) => f.paidAmount >= f.officeFees);
    if (reportFilters.status === "unpaid")
      data = data.filter((f) => f.paidAmount < f.officeFees);

    // فلتر التاريخ (يعتمد على تاريخ الاعتماد أو الإنشاء)
    if (reportFilters.dateFrom || reportFilters.dateTo) {
      data = data.filter((f) => {
        const approvalDateStr = getApprovalDate(f.transactionId);
        if (!approvalDateStr) return true; // إذا لم يكن لها تاريخ، نظهرها افتراضياً (أو يمكنك إخفاءها)

        const approvalDate = new Date(approvalDateStr).getTime();
        const fromTime = reportFilters.dateFrom
          ? new Date(reportFilters.dateFrom).getTime()
          : 0;
        const toTime = reportFilters.dateTo
          ? new Date(reportFilters.dateTo).setHours(23, 59, 59, 999)
          : Infinity;

        return approvalDate >= fromTime && approvalDate <= toTime;
      });
    }
    return data;
  };

  // تحديث قائمة التحديد عند تغيير فلاتر التقرير أو المكتب
  React.useEffect(() => {
    if (isReportModalOpen && reportOfficeId) {
      const availableIds = getFilteredReportData().map((t) => t.id);
      setSelectedReportTxs(availableIds); // تحديد الكل افتراضياً بناءً على الفلتر
    } else {
      setSelectedReportTxs([]);
    }
  }, [
    reportOfficeId,
    reportFilters,
    isReportModalOpen,
    feesData,
    transactions,
  ]);

  const reportData = getFilteredReportData().filter((t) =>
    selectedReportTxs.includes(t.id),
  );

  const reportTotals = reportData.reduce(
    (acc, curr) => {
      acc.fees += Number(curr.officeFees) || 0;
      acc.paid += Number(curr.paidAmount) || 0;
      return acc;
    },
    { fees: 0, paid: 0 },
  );
  const reportRemaining = reportTotals.fees - reportTotals.paid;

  return (
    <div
      className="p-4 flex flex-col h-full overflow-hidden bg-slate-50 font-sans"
      dir="rtl"
    >
      {/* الإحصائيات العلوية */}
      <div className="grid grid-cols-4 gap-4 shrink-0 mb-4">
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-500 mb-1">
              إجمالي أتعاب المكاتب
            </p>
            <p className="text-xl font-black text-blue-600 font-mono">
              {stats.totalFees.toLocaleString()}{" "}
              <span className="text-[10px]">SAR</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-500 mb-1">
              المدفوع للمكاتب
            </p>
            <p className="text-xl font-black text-green-600 font-mono">
              {stats.totalPaid.toLocaleString()}{" "}
              <span className="text-[10px]">SAR</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-500 mb-1">
              المتبقي (المستحقات)
            </p>
            <p className="text-xl font-black text-red-600 font-mono">
              {stats.totalRemaining.toLocaleString()}{" "}
              <span className="text-[10px]">SAR</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <Banknote className="w-5 h-5 text-red-500" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-500 mb-1">
              عدد المطالبات المعروضة
            </p>
            <p className="text-xl font-black text-purple-600 font-mono">
              {filteredData.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
            <FileDigit className="w-5 h-5 text-purple-500" />
          </div>
        </div>
      </div>

      {/* شريط الأدوات والبحث والفلترة */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 mb-4 bg-white p-3 border border-gray-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> <span>تسجيل أتعاب مكتب</span>
          </button>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4 text-purple-600" />{" "}
            <span>منشئ التقارير</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setHidePaid(!hidePaid)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors border ${hidePaid ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
          >
            {hidePaid ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            {hidePaid ? "إظهار المدفوع" : "إخفاء المدفوع"}
          </button>

          <div className="relative flex items-center">
            <Filter className="absolute right-2.5 w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedOfficeFilter}
              onChange={(e) => setSelectedOfficeFilter(e.target.value)}
              className="pl-2 pr-8 py-2 rounded-lg border border-gray-300 text-xs font-bold text-gray-700 focus:border-blue-500 outline-none bg-gray-50 appearance-none min-w-[150px]"
            >
              <option value="all">جميع المكاتب (الكل)</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-[220px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="ابحث بالاسم أو المكتب..."
              className="w-full pr-9 pl-3 py-2 rounded-lg border border-gray-300 text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all bg-gray-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* الجدول الرئيسي */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar-slim">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-bold text-gray-600">
                  الاسم الداخلي (المعاملة)
                </th>
                <th className="px-4 py-3 font-bold text-gray-600">
                  المكتب المتعاون
                </th>
                <th className="px-4 py-3 font-bold text-gray-600">نوع الطلب</th>
                <AccessControl
                  code="COOP_FEES_COL_TOTAL"
                  name="رؤية الأتعاب المستحقة"
                  moduleName="أتعاب المكاتب"
                  tabName="الجدول"
                >
                  <th className="px-4 py-3 font-bold text-gray-600">
                    الأتعاب المستحقة
                  </th>
                </AccessControl>
                <AccessControl
                  code="COOP_FEES_COL_PAID"
                  name="رؤية المبلغ المدفوع"
                  moduleName="أتعاب المكاتب"
                  tabName="الجدول"
                >
                  <th className="px-4 py-3 font-bold text-gray-600">المدفوع</th>
                </AccessControl>
                <AccessControl
                  code="COOP_FEES_COL_REMAINING"
                  name="رؤية المتبقي للمكتب"
                  moduleName="أتعاب المكاتب"
                  tabName="الجدول"
                >
                  <th className="px-4 py-3 font-bold text-gray-600">المتبقي</th>
                </AccessControl>
                <th className="px-4 py-3 font-bold text-gray-600 text-center">
                  حالة المعاملة
                </th>
                <th className="px-4 py-3 font-bold text-gray-600 text-center">
                  الإجراء المالي
                </th>
                <th className="px-4 py-3 font-bold text-gray-600 text-center">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((row) => {
                  const remaining =
                    (Number(row.officeFees) || 0) -
                    (Number(row.paidAmount) || 0);
                  const isFullyPaid = remaining <= 0;

                  const linkedTx = transactions.find(
                    (t) => t.id === row.transactionId,
                  );
                  const txStatus =
                    linkedTx?.status === "in_progress"
                      ? "جارية"
                      : linkedTx?.status === "مكتملة"
                        ? "مكتملة"
                        : "غير مربوطة";

                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-100 hover:bg-gray-50/80 transition-colors ${isFullyPaid ? "bg-gray-50/30 opacity-70" : ""}`}
                    >
                      <td className="px-4 py-3 font-bold text-gray-800">
                        {row.internalName}
                        {row.transactionId && (
                          <LinkIcon
                            className="w-3 h-3 text-blue-400 inline mr-1"
                            title="مربوطة بمعاملة بالنظام"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700">
                        {row.officeName}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {row.requestType || "—"}
                      </td>

                      <AccessControl
                        code="COOP_FEES_COL_TOTAL"
                        fallback={
                          <td className="px-4 py-3 text-gray-300 font-mono tracking-widest text-xs">
                            ***
                          </td>
                        }
                      >
                        <td className="px-4 py-3 font-mono font-bold text-blue-700">
                          {Number(row.officeFees).toLocaleString()}
                        </td>
                      </AccessControl>

                      <AccessControl
                        code="COOP_FEES_COL_PAID"
                        fallback={
                          <td className="px-4 py-3 text-gray-300 font-mono tracking-widest text-xs">
                            ***
                          </td>
                        }
                      >
                        <td className="px-4 py-3 font-mono font-bold text-green-600">
                          {Number(row.paidAmount).toLocaleString()}
                        </td>
                      </AccessControl>

                      <AccessControl
                        code="COOP_FEES_COL_REMAINING"
                        fallback={
                          <td className="px-4 py-3 text-gray-300 font-mono tracking-widest text-xs">
                            ***
                          </td>
                        }
                      >
                        <td className="px-4 py-3 font-mono font-bold text-red-600">
                          {remaining.toLocaleString()}
                        </td>
                      </AccessControl>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold ${txStatus === "مكتملة" ? "bg-green-100 text-green-700" : txStatus === "جارية" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {txStatus}
                        </span>
                      </td>

                      {/* 💡 زر السداد الفعلي */}
                      <td className="px-4 py-3 text-center">
                        {isFullyPaid ? (
                          <span className="px-3 py-1 rounded-lg text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> مدفوع بالكامل
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              setPayData({
                                record: row,
                                amountToAdd: remaining,
                                remaining,
                              })
                            }
                            className="px-4 py-1.5 rounded-lg text-[10px] font-bold transition-colors border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white inline-flex items-center gap-1 shadow-sm"
                          >
                            <Banknote className="w-3 h-3" /> سداد دفعة
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <AccessControl
                            code="COOP_FEES_ACTION_EDIT"
                            fallback={<div className="w-7 h-7"></div>}
                          >
                            <button
                              onClick={() => openEditModal(row)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </AccessControl>
                          <AccessControl
                            code="COOP_FEES_ACTION_DELETE"
                            fallback={<div className="w-7 h-7"></div>}
                          >
                            <button
                              onClick={() => handleDeleteClick(row.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </AccessControl>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    className="text-center py-10 text-gray-400 font-bold"
                  >
                    لا توجد بيانات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 💡 Modal: نافذة السداد السريع */}
      {/* ========================================================================= */}
      {payData && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
          onClick={() => setPayData(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-emerald-600 p-4 flex items-center justify-between text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Banknote className="w-5 h-5" /> سداد أتعاب مكتب
              </h3>
              <button
                onClick={() => setPayData(null)}
                className="hover:text-red-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-sm text-emerald-800 font-bold mb-4">
                سداد لصالح مكتب: {payData.record.officeName} <br />
                <span className="text-xs text-emerald-600">
                  المعاملة: {payData.record.internalName}
                </span>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  المبلغ المتبقي
                </label>
                <input
                  type="text"
                  disabled
                  value={payData.remaining}
                  className="w-full border border-gray-200 p-3 rounded-lg text-lg font-mono font-bold text-red-500 bg-gray-50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  الدفعة الحالية (المراد سدادها الآن) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={payData.remaining}
                  required
                  autoFocus
                  value={payData.amountToAdd}
                  onChange={(e) =>
                    setPayData({ ...payData, amountToAdd: e.target.value })
                  }
                  className="w-full border border-gray-300 p-3 rounded-lg text-xl font-mono font-black text-emerald-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all shadow-inner"
                  placeholder="0"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPayData(null)}
                  className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={payFeeMutation.isPending}
                  className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {payFeeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  تأكيد السداد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* نافذة الإضافة والتعديل */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-800 text-white">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />{" "}
                {modalMode === "add"
                  ? "تسجيل أتعاب مكتب متعاون (مستحقات)"
                  : "تعديل بيانات المطالبة"}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="hover:text-red-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar-slim max-h-[75vh] space-y-6">
              <div className="grid grid-cols-2 gap-5 p-4 bg-blue-50/30 rounded-xl border border-blue-100">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    إمكانية الربط بمعاملة مسجلة في النظام (اختياري)
                  </label>
                  <SearchableSelect
                    options={[
                      { label: "بدون ربط (معاملة خارجية)", value: "" },
                      ...txOptions,
                    ]}
                    value={formData.transactionId}
                    onChange={handleTransactionLink}
                    placeholder="ابحث باسم العميل أو رقم المعاملة للربط الآلي..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    الاسم الداخلي للمعاملة *
                  </label>
                  <input
                    type="text"
                    value={formData.internalName}
                    onChange={(e) =>
                      setFormData({ ...formData, internalName: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none"
                    placeholder="مثال: عمارة الملقا"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    نوع الطلب *
                  </label>
                  <select
                    value={formData.requestType}
                    onChange={(e) =>
                      setFormData({ ...formData, requestType: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold focus:border-blue-500 outline-none"
                  >
                    <option value="اصدار">إصدار</option>
                    <option value="تجديد وتعديل">تجديد وتعديل</option>
                    <option value="تصحيح وضع مبني قائم">
                      تصحيح وضع مبنى قائم
                    </option>
                    <option value="اخرى">أخرى</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    اسم المكتب المتعاون *
                  </label>
                  <select
                    value={formData.officeId}
                    onChange={(e) =>
                      setFormData({ ...formData, officeId: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold focus:border-blue-500 outline-none"
                  >
                    <option value="">اختر المكتب...</option>
                    {offices.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    أتعاب المكتب (المبلغ المستحق) *
                  </label>
                  <input
                    type="number"
                    value={formData.officeFees}
                    onChange={(e) =>
                      setFormData({ ...formData, officeFees: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-lg font-mono font-bold text-blue-700 focus:border-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    المبلغ المدفوع (مُقدم إن وجد)
                  </label>
                  <input
                    type="number"
                    value={formData.paidAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, paidAmount: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-lg font-mono font-bold text-green-600 focus:border-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    خدمات مقدمة من المكتب (فري تكست)
                  </label>
                  <input
                    type="text"
                    value={formData.providedServices}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        providedServices: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none"
                    placeholder="مثال: تصميم معماري، انشائي، تنسيق حدائق..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    تاريخ الاستحقاق
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    حالة الرفع على النظام
                  </label>
                  <select
                    value={formData.uploadStatus}
                    onChange={(e) =>
                      setFormData({ ...formData, uploadStatus: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold focus:border-blue-500 outline-none"
                  >
                    <option value="مع الرفع على النظام">
                      مع الرفع على النظام
                    </option>
                    <option value="بدون رفع على النظام">
                      بدون رفع على النظام
                    </option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 p-4 border border-orange-100 bg-orange-50/30 rounded-xl">
                <div className="col-span-3 pb-2 border-b border-orange-100 mb-2">
                  <span className="text-xs font-bold text-orange-800">
                    بيانات الرخصة والمنصات (إن وجدت)
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">
                    رقم الرخصة
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        licenseNumber: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded text-sm outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">
                    سنة الرخصة (هجرية)
                  </label>
                  <input
                    type="text"
                    value={formData.licenseYear}
                    onChange={(e) =>
                      setFormData({ ...formData, licenseYear: e.target.value })
                    }
                    className="w-full border p-2 rounded text-sm outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">
                    رقم الخدمة
                  </label>
                  <input
                    type="text"
                    value={formData.serviceNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        serviceNumber: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded text-sm outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">
                    سنة الخدمة (هجرية)
                  </label>
                  <input
                    type="text"
                    value={formData.serviceYear}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceYear: e.target.value })
                    }
                    className="w-full border p-2 rounded text-sm outline-none focus:border-orange-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">
                    اسم الجهة (الأمانة / القطاع)
                  </label>
                  <input
                    type="text"
                    value={formData.entityName}
                    onChange={(e) =>
                      setFormData({ ...formData, entityName: e.target.value })
                    }
                    placeholder="مثال: أمانة منطقة الرياض - بلدية الشمال"
                    className="w-full border p-2 rounded text-sm outline-none focus:border-orange-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  ملاحظات إضافية
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm focus:border-blue-500 outline-none min-h-[80px] resize-none"
                  placeholder="أي ملاحظات تخص الاتفاقية أو الدفعات..."
                ></textarea>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {modalMode === "add" ? "تسجيل وحفظ البيانات" : "حفظ التعديلات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💡 نافذة منشئ التقارير المتقدم */}
      {/* ========================================================================= */}
      {isReportModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
          onClick={() => setIsReportModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-6xl overflow-hidden h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-800 text-white print:hidden shrink-0">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" /> منشئ التقارير
                المخصص للمكاتب المتعاونة
              </h2>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="hover:text-red-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* لوحة تحكم التقرير (لاتطبع) */}
            <div className="p-5 bg-gray-50 border-b border-gray-200 print:hidden flex flex-col gap-4 shrink-0">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    اختر المكتب:
                  </label>
                  <select
                    value={reportOfficeId}
                    onChange={(e) => setReportOfficeId(e.target.value)}
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold outline-none focus:border-purple-500 bg-white"
                  >
                    <option value="">-- يرجى اختيار مكتب --</option>
                    {offices.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    حالة الدفع:
                  </label>
                  <select
                    value={reportFilters.status}
                    onChange={(e) =>
                      setReportFilters({
                        ...reportFilters,
                        status: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold outline-none focus:border-purple-500 bg-white"
                  >
                    <option value="all">كل الحالات</option>
                    <option value="paid">المدفوعة فقط</option>
                    <option value="unpaid">المتبقي (غير مدفوعة) فقط</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 border-t border-gray-200 pt-4 mt-2">
                <div className="col-span-4 flex items-center gap-2 mb-1">
                  <CalendarDays className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-gray-700">
                    فلتر حسب تاريخ الاعتماد (من المعاملة المربوطة)
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">
                    من تاريخ
                  </label>
                  <input
                    type="date"
                    value={reportFilters.dateFrom}
                    onChange={(e) =>
                      setReportFilters({
                        ...reportFilters,
                        dateFrom: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 p-2 rounded-lg text-sm outline-none focus:border-purple-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">
                    إلى تاريخ
                  </label>
                  <input
                    type="date"
                    value={reportFilters.dateTo}
                    onChange={(e) =>
                      setReportFilters({
                        ...reportFilters,
                        dateTo: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 p-2 rounded-lg text-sm outline-none focus:border-purple-500 bg-white"
                  />
                </div>
                <div className="col-span-2 flex items-end justify-end gap-2">
                  <button
                    onClick={() =>
                      setReportFilters({
                        status: "all",
                        dateFrom: "",
                        dateTo: "",
                      })
                    }
                    className="px-4 py-2 bg-gray-200 text-gray-700 font-bold text-xs rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    مسح الفلاتر
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={!reportOfficeId || selectedReportTxs.length === 0}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Printer className="w-4 h-4" /> طباعة التقرير (
                    {selectedReportTxs.length})
                  </button>
                </div>
              </div>
            </div>

            {/* محتوى التقرير الفعلي */}
            <div
              className="flex-1 p-8 overflow-y-auto bg-white print:p-0 print:overflow-visible"
              id="office-specific-report"
            >
              {reportOfficeId ? (
                <div className="space-y-6">
                  {/* ترويسة التقرير */}
                  <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                    <h1 className="text-2xl font-black text-gray-900 mb-1">
                      بيان حساب مكتب متعاون
                    </h1>
                    <h2 className="text-lg font-bold text-gray-600">
                      {offices.find((o) => o.id === reportOfficeId)?.name}
                    </h2>
                    <p className="text-xs text-gray-500 mt-2">
                      تاريخ الإصدار: {new Date().toLocaleDateString("ar-SA")}
                    </p>
                  </div>

                  {/* الملخص المالي للتقرير */}
                  <div className="grid grid-cols-3 gap-4 mb-8 print:break-inside-avoid">
                    <div className="border-2 border-gray-800 p-4 text-center rounded-xl">
                      <p className="text-sm font-bold text-gray-600 mb-1">
                        إجمالي الأتعاب للبنود المختارة
                      </p>
                      <p className="text-2xl font-black font-mono">
                        {reportTotals.fees.toLocaleString()} SAR
                      </p>
                    </div>
                    <div className="border-2 border-gray-800 p-4 text-center rounded-xl bg-gray-50">
                      <p className="text-sm font-bold text-gray-600 mb-1">
                        إجمالي المدفوع للبنود المختارة
                      </p>
                      <p className="text-2xl font-black font-mono text-green-700">
                        {reportTotals.paid.toLocaleString()} SAR
                      </p>
                    </div>
                    <div className="border-2 border-gray-800 p-4 text-center rounded-xl bg-gray-800 text-white">
                      <p className="text-sm font-bold text-gray-300 mb-1">
                        المتبقي للمكتب (للبنود المختارة)
                      </p>
                      <p className="text-2xl font-black font-mono">
                        {reportRemaining.toLocaleString()} SAR
                      </p>
                    </div>
                  </div>

                  {/* جدول الاختيار (يظهر كجدول عادي في الطباعة بدون Checkboxes) */}
                  <table className="w-full text-right border-collapse border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 p-2 print:hidden w-10 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-purple-600"
                            checked={
                              selectedReportTxs.length ===
                                getFilteredReportData().length &&
                              getFilteredReportData().length > 0
                            }
                            onChange={(e) =>
                              setSelectedReportTxs(
                                e.target.checked
                                  ? getFilteredReportData().map((t) => t.id)
                                  : [],
                              )
                            }
                          />
                        </th>
                        <th className="border border-gray-300 p-2 font-bold w-10 text-center">
                          م
                        </th>
                        <th className="border border-gray-300 p-2 font-bold">
                          المعاملة
                        </th>
                        <th className="border border-gray-300 p-2 font-bold">
                          ت. الاعتماد
                        </th>
                        <th className="border border-gray-300 p-2 font-bold">
                          الخدمات المقدمة
                        </th>
                        <th className="border border-gray-300 p-2 font-bold">
                          الأتعاب
                        </th>
                        <th className="border border-gray-300 p-2 font-bold">
                          المدفوع
                        </th>
                        <th className="border border-gray-300 p-2 font-bold">
                          المتبقي
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredReportData().length > 0 ? (
                        getFilteredReportData().map((tx, idx) => {
                          const isChecked = selectedReportTxs.includes(tx.id);
                          // في وضع الطباعة، نخفي الصفوف الغير محددة
                          return (
                            <tr
                              key={tx.id}
                              className={`${!isChecked ? "print:hidden opacity-50 bg-gray-50" : "bg-white"} hover:bg-purple-50/30 transition-colors`}
                            >
                              <td
                                className="border border-gray-300 p-2 text-center print:hidden cursor-pointer"
                                onClick={() =>
                                  setSelectedReportTxs((prev) =>
                                    prev.includes(tx.id)
                                      ? prev.filter((id) => id !== tx.id)
                                      : [...prev, tx.id],
                                  )
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-4 h-4 accent-purple-600 pointer-events-none"
                                />
                              </td>
                              <td className="border border-gray-300 p-2 text-center text-xs">
                                {idx + 1}
                              </td>
                              <td className="border border-gray-300 p-2 font-bold text-xs">
                                {tx.internalName}
                              </td>
                              <td className="border border-gray-300 p-2 font-mono text-[10px] text-gray-500">
                                {getApprovalDate(tx.transactionId)
                                  ? new Date(
                                      getApprovalDate(tx.transactionId),
                                    ).toLocaleDateString("en-GB")
                                  : "—"}
                              </td>
                              <td className="border border-gray-300 p-2 text-[11px] text-gray-600">
                                {tx.providedServices || tx.requestType || "—"}
                              </td>
                              <td className="border border-gray-300 p-2 font-mono font-bold text-blue-700">
                                {Number(tx.officeFees).toLocaleString()}
                              </td>
                              <td className="border border-gray-300 p-2 font-mono font-bold text-green-700">
                                {Number(tx.paidAmount).toLocaleString()}
                              </td>
                              <td className="border border-gray-300 p-2 font-mono font-bold text-red-600">
                                {(
                                  Number(tx.officeFees) - Number(tx.paidAmount)
                                ).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="8"
                            className="text-center py-6 font-bold text-gray-400"
                          >
                            لا توجد معاملات مطابقة للفلاتر المحددة.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-300">
                  <FileText className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-bold">
                    الرجاء اختيار مكتب من القائمة العلوية للبدء
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoopOfficesFeesPage;
