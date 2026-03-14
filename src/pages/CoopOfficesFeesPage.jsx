import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Plus,
  Eye,
  FileText,
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
} from "lucide-react";
import AccessControl from "../components/AccessControl"; // تأكد من مسار الملف الصحيح

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
  const [searchQuery, setSearchQuery] = useState("");

  // States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportOfficeId, setReportOfficeId] = useState("");

  const initialForm = {
    transactionId: "", // الربط بالمعاملة
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

  // دالة الإرسال وحفظ البيانات
  const handleSubmit = () => {
    if (!formData.internalName || !formData.officeId || !formData.officeFees) {
      return toast.error(
        "الرجاء إكمال الحقول الإلزامية (الاسم، المكتب، الأتعاب)",
      );
    }
    saveMutation.mutate(formData);
  };

  // ==========================================
  // Queries
  // ==========================================
  const { data: offices = [] } = useQuery({
    queryKey: ["coop-offices"],
    queryFn: async () => (await api.get("/coop-offices")).data?.data || [],
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["private-transactions-simple"],
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

  // ==========================================
  // Derived Data
  // ==========================================
  const filteredData = useMemo(() => {
    if (!searchQuery) return feesData;
    const q = searchQuery.toLowerCase();
    return feesData.filter(
      (item) =>
        item.officeName?.toLowerCase().includes(q) ||
        item.internalName?.toLowerCase().includes(q),
    );
  }, [feesData, searchQuery]);

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
    mutationFn: async (data) => {
      if (modalMode === "add") return await api.post("/coop-office-fees", data);
      else return await api.put(`/coop-office-fees/${selectedRecordId}`, data);
    },
    onSuccess: () => {
      toast.success(
        modalMode === "add" ? "تم التسجيل بنجاح" : "تم التعديل بنجاح",
      );
      queryClient.invalidateQueries(["coop-office-fees"]);
      setIsAddModalOpen(false);
    },
    onError: () => toast.error("حدث خطأ أثناء الحفظ"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/coop-office-fees/${id}`),
    onSuccess: () => {
      toast.success("تم الحذف بنجاح");
      queryClient.invalidateQueries(["coop-office-fees"]);
    },
  });

  // تعديل سريع لحالة الدفع
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) =>
      await api.put(`/coop-office-fees/${id}`, { status }),
    onSuccess: () => {
      toast.success("تم تحديث حالة الدفع");
      queryClient.invalidateQueries(["coop-office-fees"]);
    },
  });

  // ==========================================
  // Handlers
  // ==========================================
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

  // دالة الطباعة
  const handlePrint = () => {
    window.print();
  };

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
              عدد المطالبات المسجلة
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

      {/* شريط الأدوات والبحث */}
      <div className="flex items-center justify-between gap-3 shrink-0 mb-4 bg-white p-3 border border-gray-200 rounded-xl shadow-sm">
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
            <span>إصدار تقرير لمكتب</span>
          </button>
        </div>
        <div className="relative w-[300px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="ابحث بالاسم أو المكتب..."
            className="w-full pr-9 pl-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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

                {/* 💡 إخفاء عمود الأتعاب بصلاحية */}
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

                {/* 💡 إخفاء عمود المدفوع بصلاحية */}
                <AccessControl
                  code="COOP_FEES_COL_PAID"
                  name="رؤية المبلغ المدفوع"
                  moduleName="أتعاب المكاتب"
                  tabName="الجدول"
                >
                  <th className="px-4 py-3 font-bold text-gray-600">المدفوع</th>
                </AccessControl>

                {/* 💡 إخفاء عمود المتبقي بصلاحية */}
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
                  حالة الدفع (انقر للتعديل)
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

                  // استخراج حالة المعاملة الأصلية إذا كانت مربوطة
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

                      {/* 💡 إخفاء بيانات الأتعاب بصلاحية مع وضع Fallback (بديل) إذا لم يملك الصلاحية */}
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

                      {/* عمود حالة المعاملة المربوطة */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold ${txStatus === "مكتملة" ? "bg-green-100 text-green-700" : txStatus === "جارية" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {txStatus}
                        </span>
                      </td>

                      {/* عمود حالة الدفع القابل للتعديل المباشر */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: row.id,
                              status: isFullyPaid
                                ? "غير مدفوع"
                                : "مدفوع بالكامل",
                            })
                          }
                          disabled={updateStatusMutation.isPending}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold w-full max-w-[90px] transition-colors border ${isFullyPaid ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"}`}
                        >
                          {isFullyPaid ? "مدفوع" : "غير مدفوع"}
                        </button>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* 💡 يمكن أيضاً إخفاء أزرار التعديل والحذف بصلاحيات */}
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
                              onClick={() => {
                                if (window.confirm("حذف السجل نهائياً؟"))
                                  deleteMutation.mutate(row.id);
                              }}
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
                    لا توجد بيانات (أو جميع المعاملات مدفوعة ومخفية)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* نافذة الإضافة والتعديل (مُحدثة حسب الصور) */}
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
              {/* القسم 1: الربط والأساسيات */}
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

              {/* القسم 2: المكتب والماليات */}
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

              {/* القسم 3: الخدمات والرفع */}
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

              {/* القسم 4: بيانات الرخصة والجهات */}
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
      {/* 6. نافذة تقرير المكتب الخاص (إصدار تقرير لكل مكتب على حدى) */}
      {/* ========================================================================= */}
      {isReportModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
          onClick={() => setIsReportModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl overflow-hidden h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-800 text-white print:hidden">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Printer className="w-5 h-5 text-purple-400" /> إصدار تقرير
                تفصيلي لمكتب متعاون
              </h2>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="hover:text-red-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-gray-50 border-b border-gray-200 print:hidden flex items-end gap-4 shrink-0">
              <div className="flex-1 max-w-md">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  اختر المكتب لإصدار التقرير الخاص به:
                </label>
                <select
                  value={reportOfficeId}
                  onChange={(e) => setReportOfficeId(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold outline-none focus:border-purple-500"
                >
                  <option value="">-- يرجى اختيار مكتب --</option>
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handlePrint}
                disabled={!reportOfficeId}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" /> طباعة التقرير
              </button>
            </div>

            <div
              className="flex-1 p-8 overflow-y-auto bg-white print:p-0 print:overflow-visible"
              id="office-specific-report"
            >
              {reportOfficeId ? (
                (() => {
                  const selectedOfficeData = offices.find(
                    (o) => o.id === reportOfficeId,
                  );
                  const officeTransactions = feesData.filter(
                    (f) => f.officeId === reportOfficeId,
                  );
                  const totals = officeTransactions.reduce(
                    (acc, curr) => {
                      acc.fees += Number(curr.officeFees) || 0;
                      acc.paid += Number(curr.paidAmount) || 0;
                      return acc;
                    },
                    { fees: 0, paid: 0 },
                  );
                  const totalRemaining = totals.fees - totals.paid;

                  return (
                    <div className="space-y-6">
                      {/* ترويسة التقرير (تظهر في الطباعة بشكل جيد) */}
                      <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                        <h1 className="text-2xl font-black text-gray-900 mb-1">
                          بيان حساب مكتب متعاون
                        </h1>
                        <h2 className="text-lg font-bold text-gray-600">
                          {selectedOfficeData?.name}
                        </h2>
                        <p className="text-xs text-gray-500 mt-2">
                          تاريخ الإصدار:{" "}
                          {new Date().toLocaleDateString("ar-SA")}
                        </p>
                      </div>

                      {/* ملخص مالي */}
                      <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="border-2 border-gray-800 p-4 text-center rounded-xl">
                          <p className="text-sm font-bold text-gray-600 mb-1">
                            إجمالي الأتعاب المستحقة
                          </p>
                          <p className="text-2xl font-black font-mono">
                            {totals.fees.toLocaleString()} SAR
                          </p>
                        </div>
                        <div className="border-2 border-gray-800 p-4 text-center rounded-xl bg-gray-50">
                          <p className="text-sm font-bold text-gray-600 mb-1">
                            إجمالي المدفوعات
                          </p>
                          <p className="text-2xl font-black font-mono text-green-700">
                            {totals.paid.toLocaleString()} SAR
                          </p>
                        </div>
                        <div className="border-2 border-gray-800 p-4 text-center rounded-xl bg-gray-800 text-white">
                          <p className="text-sm font-bold text-gray-300 mb-1">
                            الرصيد المتبقي للمكتب
                          </p>
                          <p className="text-2xl font-black font-mono">
                            {totalRemaining.toLocaleString()} SAR
                          </p>
                        </div>
                      </div>

                      {/* تفاصيل المعاملات */}
                      <table className="w-full text-right border-collapse border border-gray-300 text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-300 p-2 font-bold">
                              م
                            </th>
                            <th className="border border-gray-300 p-2 font-bold">
                              المعاملة
                            </th>
                            <th className="border border-gray-300 p-2 font-bold">
                              نوع الطلب
                            </th>
                            <th className="border border-gray-300 p-2 font-bold">
                              الخدمات المقدمة
                            </th>
                            <th className="border border-gray-300 p-2 font-bold">
                              أتعاب المكتب
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
                          {officeTransactions.length > 0 ? (
                            officeTransactions.map((tx, idx) => (
                              <tr key={tx.id}>
                                <td className="border border-gray-300 p-2 text-center">
                                  {idx + 1}
                                </td>
                                <td className="border border-gray-300 p-2 font-bold">
                                  {tx.internalName}
                                </td>
                                <td className="border border-gray-300 p-2 text-gray-600">
                                  {tx.requestType || "—"}
                                </td>
                                <td className="border border-gray-300 p-2 text-xs">
                                  {tx.providedServices || "—"}
                                </td>
                                <td className="border border-gray-300 p-2 font-mono font-bold text-blue-700">
                                  {Number(tx.officeFees).toLocaleString()}
                                </td>
                                <td className="border border-gray-300 p-2 font-mono font-bold text-green-700">
                                  {Number(tx.paidAmount).toLocaleString()}
                                </td>
                                <td className="border border-gray-300 p-2 font-mono font-bold text-red-600">
                                  {(
                                    Number(tx.officeFees) -
                                    Number(tx.paidAmount)
                                  ).toLocaleString()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="7"
                                className="text-center py-6 font-bold text-gray-400"
                              >
                                لا توجد معاملات مسجلة لهذا المكتب.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-300">
                  <FileText className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-bold">
                    الرجاء اختيار مكتب من القائمة العلوية لعرض تقريره
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
