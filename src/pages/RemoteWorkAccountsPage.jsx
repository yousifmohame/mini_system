import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Info,
  Laptop,
  Plus,
  Eye,
  Download,
  Camera,
  Search,
  User,
  ClipboardList,
  Receipt,
  FileText,
  Send,
  ArrowUpDown,
  Check,
  X,
  Banknote,
  CreditCard,
  Image as ImageIcon,
  Settings2,
  DollarSign,
  PenLine,
  Printer,
  ChevronDown,
  Loader2,
  Edit3,
  Trash2,
  Phone,
  Globe2,
  Upload,
  Paperclip,
  Save,
  Wallet
} from "lucide-react";

// ==========================================
// 💡 دوال مساعدة لحماية الواجهة
// ==========================================
const safeText = (val) => {
  if (!val) return "—";
  if (typeof val === "object") return val.ar || val.name || JSON.stringify(val);
  return String(val);
};

const safeNum = (val) => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

// ==========================================
// 💡 قائمة رموز الدول الشائعة
// ==========================================
const COUNTRY_CODES = [
  { code: "+20", label: "مصر 🇪🇬" },
  { code: "+966", label: "السعودية 🇸🇦" },
  { code: "+971", label: "الإمارات 🇦🇪" },
  { code: "+965", label: "الكويت 🇰🇼" },
  { code: "+973", label: "قطر 🇶🇦" },
  { code: "+974", label: "البحرين 🇧🇭" },
  { code: "+968", label: "عمان 🇴🇲" },
  { code: "+962", label: "الأردن 🇯🇴" },
];

const RemoteWorkAccountsPage = () => {
  const queryClient = useQueryClient();

  // ==========================================
  // States - حالة الواجهة
  // ==========================================
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [selectedTaskToSettle, setSelectedTaskToSettle] = useState(null);

  // Modals States
  const [isAddEmpOpen, setIsAddEmpOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);
  const [isPrevPaymentOpen, setIsPrevPaymentOpen] = useState(false);
  const [isAssignTxOpen, setIsAssignTxOpen] = useState(false);
  const [isSettleTxOpen, setIsSettleTxOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isEditRateOpen, setIsEditRateOpen] = useState(false);

  // Forms States
  const initialEmpForm = {
    id: null,
    name: "",
    phoneCode: "+20", // افتراضي مصر لأن الغالبية عن بعد من مصر
    phoneWithoutCode: "",
    whatsappCode: "+20",
    whatsappWithoutCode: "",
    phone: "",
    whatsapp: "",
    telegram: "",
    email: "",
    country: "",
    currency: "EGP", // العملة المفضلة
    transferMethod: "",
    transferDetails: {},
    firstNameAr: "",
    secondNameAr: "",
    thirdNameAr: "",
    fourthNameAr: "",
    firstNameEn: "",
    secondNameEn: "",
    thirdNameEn: "",
    fourthNameEn: "",
    notes: "",
    files: [],
  };
  const [empForm, setEmpForm] = useState(initialEmpForm);

  const [transferForm, setTransferForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    currency: "EGP",
    method: "تحويل بنكي",
    targetName: "",
    notes: "",
    file: null,
  });
  const [tasksForm, setTasksForm] = useState({
    transactionId: "",
    isFinal: false,
    tasks: [{ name: "", cost: "" }],
  });
  const [prevPaymentForm, setPrevPaymentForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    currency: "SAR",
    notes: "دفعة سابقة — رصيد افتتاحي",
  });
  const [settleForm, setSettleForm] = useState({
    amount: "",
    type: "تسوية كاملة",
  });
  const [rateForm, setRateForm] = useState({
    id: "",
    currency: "",
    rate: "",
    transferFee: "",
  });

  // الآلة الحاسبة للتقريب
  const [calcAmount, setCalcAmount] = useState("");
  const [calcCurrency, setCalcCurrency] = useState("EGP");

  // ==========================================
  // Queries - جلب البيانات من الباك إند
  // ==========================================
  const { data: workers = [], isLoading: isLoadingWorkers } = useQuery({
    queryKey: ["remote-workers"],
    queryFn: async () => (await api.get("/remote-workers")).data?.data || [],
  });

  const { data: exchangeRates = [], isLoading: isLoadingRates } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: async () =>
      (await api.get("/remote-workers/exchange-rates")).data?.data || [],
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions-simple"],
    queryFn: async () =>
      (await api.get("/private-transactions")).data?.data || [],
  });

  // ==========================================
  // Derived State (useMemo)
  // ==========================================
  const filteredEmployees = useMemo(() => {
    return workers.filter(
      (emp) =>
        emp.name.includes(searchQuery) || emp.phone?.includes(searchQuery),
    );
  }, [workers, searchQuery]);

  const selectedEmp = useMemo(() => {
    return workers.find((w) => w.id === selectedEmpId) || null;
  }, [workers, selectedEmpId]);

  const calcResult = useMemo(() => {
    if (!calcAmount || isNaN(calcAmount)) return null;
    const rateObj = exchangeRates.find((r) => r.currency === calcCurrency);
    if (!rateObj) return null;
    return {
      converted: (Number(calcAmount) * rateObj.rate).toFixed(2),
      fee: rateObj.transferFee,
    };
  }, [calcAmount, calcCurrency, exchangeRates]);

  // ==========================================
  // Mutations - إرسال البيانات للباك إند
  // ==========================================
  const saveEmpMutation = useMutation({
    mutationFn: async (data) => {
      const fd = new FormData();
      Object.keys(data).forEach((key) => {
        if (key === "files") {
          Array.from(data.files || []).forEach((f) => fd.append("files", f));
        } else if (key === "transferDetails") {
          fd.append("transferDetails", JSON.stringify(data[key]));
        } else {
          fd.append(key, data[key]);
        }
      });

      if (modalMode === "add") {
        return api.post("/remote-workers", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      return api.put(`/remote-workers/${data.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (res) => {
      toast.success(
        modalMode === "add"
          ? "تم إضافة الموظف بنجاح"
          : "تم تعديل البيانات بنجاح",
      );
      queryClient.invalidateQueries(["remote-workers"]);
      setIsAddEmpOpen(false);
      if (modalMode === "add") setSelectedEmpId(res.data.data.id);
    },
    onError: (err) => toast.error(err.response?.data?.message || "حدث خطأ"),
  });

  const deleteEmpMutation = useMutation({
    mutationFn: async (id) => api.delete(`/remote-workers/${id}`),
    onSuccess: () => {
      toast.success("تم حذف الموظف");
      queryClient.invalidateQueries(["remote-workers"]);
      setSelectedEmpId(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || "حدث خطأ"),
  });

  const assignTasksMutation = useMutation({
    mutationFn: async (data) => api.post("/remote-workers/assign-tasks", data),
    onSuccess: () => {
      toast.success("تم تعيين المهام بنجاح");
      queryClient.invalidateQueries(["remote-workers"]);
      setIsAssignTxOpen(false);
      setTasksForm({
        transactionId: "",
        isFinal: false,
        tasks: [{ name: "", cost: "" }],
      });
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (data) => {
      const fd = new FormData();
      Object.keys(data).forEach((k) => {
        if (k === "file" && data[k]) fd.append("file", data[k]);
        else fd.append(k, data[k]);
      });
      return api.post("/remote-workers/transfer", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("تم تسجيل التحويل وخصم الرصيد بنجاح");
      queryClient.invalidateQueries(["remote-workers"]);
      setIsTransferOpen(false);
    },
  });

  const prevPaymentMutation = useMutation({
    mutationFn: async (data) => api.post("/private-settlements/record", data),
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة السابقة بنجاح");
      queryClient.invalidateQueries(["remote-workers"]);
      setIsPrevPaymentOpen(false);
    },
  });

  const settleTxMutation = useMutation({
    mutationFn: async (data) => api.post("/private-settlements/record", data),
    onSuccess: () => {
      toast.success("تم تسجيل التسوية (إضافة للمستحق)");
      queryClient.invalidateQueries(["remote-workers"]);
      setIsSettleTxOpen(false);
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async (data) => api.put("/remote-workers/exchange-rates", data),
    onSuccess: () => {
      toast.success("تم تحديث أسعار الصرف");
      queryClient.invalidateQueries(["exchange-rates"]);
      setIsEditRateOpen(false);
    },
  });

  // ==========================================
  // Handlers (وظائف مساعدة للنماذج)
  // ==========================================
  const addTaskRow = () =>
    setTasksForm((p) => ({
      ...p,
      tasks: [...p.tasks, { name: "", cost: "" }],
    }));
  const updateTaskRow = (idx, field, val) => {
    const newTasks = [...tasksForm.tasks];
    newTasks[idx][field] = val;
    setTasksForm((p) => ({ ...p, tasks: newTasks }));
  };
  const tasksTotalCost = tasksForm.tasks.reduce(
    (sum, t) => sum + safeNum(t.cost),
    0,
  );

  const openSettleModal = (task) => {
    setSelectedTaskToSettle(task);
    setSettleForm({ amount: task.cost, type: "تسوية كاملة" });
    setIsSettleTxOpen(true);
  };

  const handlePhoneChange = (field, val) => {
    if (!val.startsWith("+")) val = "+" + val.replace(/\+/g, "");
    setEmpForm({ ...empForm, [field]: val });
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setEmpForm(initialEmpForm);
    setIsAddEmpOpen(true);
  };

  const handleOpenEdit = () => {
    let pCode = "+20",
      pNum = selectedEmp.phone || "";
    if (selectedEmp.phone && selectedEmp.phone.startsWith("+")) {
      const matched = COUNTRY_CODES.find((c) =>
        selectedEmp.phone.startsWith(c.code),
      );
      if (matched) {
        pCode = matched.code;
        pNum = selectedEmp.phone.slice(matched.code.length);
      }
    }

    let wCode = "+20",
      wNum = selectedEmp.whatsapp || "";
    if (selectedEmp.whatsapp && selectedEmp.whatsapp.startsWith("+")) {
      const matched = COUNTRY_CODES.find((c) =>
        selectedEmp.whatsapp.startsWith(c.code),
      );
      if (matched) {
        wCode = matched.code;
        wNum = selectedEmp.whatsapp.slice(matched.code.length);
      }
    }

    setEmpForm({
      ...initialEmpForm,
      ...selectedEmp,
      phoneCode: pCode,
      phoneWithoutCode: pNum,
      whatsappCode: wCode,
      whatsappWithoutCode: wNum,
      files: [],
    });
    setModalMode("edit");
    setIsAddEmpOpen(true);
  };

  const handleSaveEmp = () => {
    let finalData = { ...empForm };

    // تجميع الاسم الرباعي
    finalData.name =
      `${finalData.firstNameAr || ""} ${finalData.secondNameAr || ""} ${finalData.thirdNameAr || ""} ${finalData.fourthNameAr || ""}`.trim();

    if (!finalData.name) return toast.error("الاسم الأول على الأقل مطلوب");

    // دمج رمز الدولة مع الرقم النهائي
    finalData.phone = finalData.phoneWithoutCode
      ? `${finalData.phoneCode}${finalData.phoneWithoutCode}`
      : "";
    finalData.whatsapp = finalData.whatsappWithoutCode
      ? `${finalData.whatsappCode}${finalData.whatsappWithoutCode}`
      : "";

    saveEmpMutation.mutate(finalData);
  };

  return (
    <div
      className="p-3 flex flex-col h-full bg-[var(--wms-bg-0)] font-sans"
      dir="rtl"
    >
      {/* 1. Header & Toolbar */}
      <div className="space-y-3 shrink-0 mb-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50/50 border border-amber-200/50 text-[10px] text-amber-700">
          <Info className="w-3 h-3 shrink-0" />
          <span>
            هذا النظام مخصص للتسويات والمتابعة الداخلية المبسطة — الأرقام
            تشغيلية وليست معالجة محاسبية رسمية.
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Laptop className="w-5 h-5 text-cyan-600" />
            <span className="text-[16px] font-bold text-[var(--wms-text-primary)]">
              حسابات العمل عن بعد
            </span>
          </div>
          <div className="flex-1"></div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-[12px] font-semibold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة موظف</span>
          </button>
          <button
            onClick={() => setIsReportPreviewOpen(true)}
            disabled={!selectedEmp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--wms-border)] text-[var(--wms-text-sec)] bg-white hover:bg-gray-50 transition-colors text-[12px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>معاينة تقرير</span>
          </button>
        </div>
      </div>

      {/* 2. Main Split Layout */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Sidebar: Employees List */}
        <div className="shrink-0 bg-white border border-[var(--wms-border)] rounded-lg overflow-hidden flex flex-col w-[260px] shadow-sm">
          <div className="px-3 py-2 border-b border-[var(--wms-border)] bg-gray-50">
            <div className="relative">
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                placeholder="بحث بالاسم أو الهاتف..."
                className="w-full pr-8 pl-2 py-1.5 rounded-md border border-gray-200 bg-white text-[11px] outline-none focus:border-blue-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 custom-scrollbar-slim">
            {isLoadingWorkers ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-[11px] font-bold">
                لا يوجد موظفين مسجلين
              </div>
            ) : (
              filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmpId(emp.id)}
                  className={`w-full text-right px-3 py-2.5 border-b border-[var(--wms-border)] transition-colors ${selectedEmp?.id === emp.id ? "bg-blue-50/70 border-l-2 border-l-blue-600" : "hover:bg-gray-50"}`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedEmp?.id === emp.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`truncate text-[12px] font-bold ${selectedEmp?.id === emp.id ? "text-blue-900" : "text-gray-800"}`}
                      >
                        {emp.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500 font-mono">
                          {emp.phone || "—"}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${emp.status === "نشط" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {emp.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content: Details & Tabs */}
        <div className="flex-1 bg-white border border-[var(--wms-border)] rounded-lg overflow-hidden flex flex-col shadow-sm">
          {!selectedEmp ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <User className="w-16 h-16 mb-4 opacity-20" />
              <span className="font-bold text-[14px]">
                الرجاء تحديد موظف من القائمة الجانبية لعرض حساباته
              </span>
            </div>
          ) : (
            <>
              {/* Employee Header */}
              <div className="shrink-0">
                <div className="flex items-center gap-4 px-5 py-4 border-b border-[var(--wms-border)] bg-gray-50/50">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-cyan-100 text-cyan-600 shadow-sm border border-cyan-200">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[16px] font-bold text-gray-800 flex items-center gap-2">
                      {selectedEmp.name}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedEmp.status === "نشط" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                      >
                        {selectedEmp.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-gray-500 mt-1 font-medium">
                      <span className="font-mono">
                        {selectedEmp.phone || "—"}
                      </span>
                      <span>{selectedEmp.email || "—"}</span>
                      <span>
                        انضمام:{" "}
                        <span className="font-mono">
                          {selectedEmp.joinDate}
                        </span>
                      </span>
                      {/* 💡 أزرار التعديل والحذف */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleOpenEdit}
                          className="p-1.5 rounded border hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors text-gray-500 shadow-sm bg-white"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("هل أنت متأكد من الحذف؟"))
                              deleteEmpMutation.mutate(selectedEmp.id);
                          }}
                          disabled={deleteEmpMutation.isPending}
                          className="p-1.5 rounded border hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-gray-500 disabled:opacity-50 shadow-sm bg-white"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="bg-gray-100 px-2 py-0.5 rounded border">
                        العملة:{" "}
                        <strong className="text-gray-700 font-mono">
                          {selectedEmp.currency}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Summary Strip */}
                <div className="flex items-center gap-6 px-5 py-3 border-b border-[var(--wms-border)] bg-gray-50 overflow-x-auto">
                  <div>
                    <div className="text-gray-500 text-[10px] font-bold">
                      دفعات سابقة
                    </div>
                    <div className="font-mono text-[15px] font-bold text-slate-700">
                      {safeNum(selectedEmp.stats?.prev).toLocaleString()}{" "}
                      <span className="text-[9px]">ر.س</span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div>
                    <div className="text-gray-500 text-[10px] font-bold">
                      أتعاب المعاملات
                    </div>
                    <div className="font-mono text-[15px] font-bold text-blue-600">
                      {safeNum(selectedEmp.stats?.txFees).toLocaleString()}{" "}
                      <span className="text-[9px]">ر.س</span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div>
                    <div className="text-gray-500 text-[10px] font-bold">
                      الإجمالي العام
                    </div>
                    <div className="font-mono text-[15px] font-bold text-slate-800">
                      {safeNum(selectedEmp.stats?.total).toLocaleString()}{" "}
                      <span className="text-[9px]">ر.س</span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div>
                    <div className="text-gray-500 text-[10px] font-bold">
                      تم تسويته
                    </div>
                    <div className="font-mono text-[15px] font-bold text-green-600">
                      {safeNum(selectedEmp.stats?.settled).toLocaleString()}{" "}
                      <span className="text-[9px]">ر.س</span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div>
                    <div className="text-gray-500 text-[10px] font-bold">
                      المتبقي له
                    </div>
                    <div className="font-mono text-[15px] font-bold text-red-600">
                      {safeNum(selectedEmp.stats?.remaining).toLocaleString()}{" "}
                      <span className="text-[9px]">ر.س</span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div>
                    <div className="text-gray-500 text-[10px] font-bold">
                      المنصرف والمحول
                    </div>
                    <div className="font-mono text-[15px] font-bold text-purple-600">
                      {safeNum(selectedEmp.stats?.transferred).toLocaleString()}{" "}
                      <span className="text-[9px]">ر.س</span>
                    </div>
                  </div>
                </div>

                {/* Tabs Row */}
                <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--wms-border)] bg-white flex-wrap">
                  {[
                    { id: "overview", label: "نظرة عامة", icon: ClipboardList },
                    {
                      id: "prev_payments",
                      label: "الدفعات السابقة",
                      icon: Receipt,
                    },
                    {
                      id: "transactions",
                      label: "المهام والمعاملات",
                      icon: FileText,
                    },
                    { id: "transfers", label: "التحويلات", icon: Send },
                    { id: "exchange", label: "أسعار الصرف", icon: ArrowUpDown },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-[11px] font-bold ${activeTab === tab.id ? "bg-blue-600 text-white shadow-sm" : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"}`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  ))}

                  <div className="flex-1"></div>

                  {/* Dynamic Action Buttons */}
                  {activeTab === "prev_payments" && (
                    <button
                      onClick={() => setIsPrevPaymentOpen(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-bold shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                      <span>دفعة سابقة</span>
                    </button>
                  )}
                  {activeTab === "transactions" && (
                    <button
                      onClick={() => setIsAssignTxOpen(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-bold shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                      <span>تعيين معاملة أو مهمة</span>
                    </button>
                  )}
                  {activeTab === "transfers" && (
                    <button
                      onClick={() => setIsTransferOpen(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-bold shadow-sm"
                    >
                      <Send className="w-3 h-3" />
                      <span>تسجيل تحويل (دفع)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tab Content Area */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar-slim bg-gray-50/30">
                <div className="animate-in fade-in duration-300">
                  {/* === TAB 1: OVERVIEW === */}
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-4 gap-3">
                        <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                          <div className="text-[11px] font-bold text-gray-500 mb-1">
                            إجمالي الدفعات السابقة
                          </div>
                          <div className="font-mono text-[18px] font-bold text-slate-700">
                            {safeNum(selectedEmp.stats?.prev).toLocaleString()}{" "}
                            <span className="text-[10px]">ر.س</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 shadow-sm">
                          <div className="text-[11px] font-bold text-blue-600/70 mb-1">
                            إجمالي أتعاب المعاملات
                          </div>
                          <div className="font-mono text-[18px] font-bold text-blue-700">
                            {safeNum(
                              selectedEmp.stats?.txFees,
                            ).toLocaleString()}{" "}
                            <span className="text-[10px]">ر.س</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50 shadow-sm">
                          <div className="text-[11px] font-bold text-purple-600/70 mb-1">
                            إجمالي المحول الفعلي
                          </div>
                          <div className="font-mono text-[18px] font-bold text-purple-700">
                            {safeNum(
                              selectedEmp.stats?.transferred,
                            ).toLocaleString()}{" "}
                            <span className="text-[10px]">ر.س</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl border border-red-100 bg-red-50/50 shadow-sm">
                          <div className="text-[11px] font-bold text-red-600/70 mb-1">
                            صافي المستحق للموظف
                          </div>
                          <div className="font-mono text-[18px] font-bold text-red-700">
                            {safeNum(
                              selectedEmp.stats?.remaining,
                            ).toLocaleString()}{" "}
                            <span className="text-[10px]">ر.س</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Latest Tasks */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                            <span className="text-[13px] font-bold text-gray-800">
                              آخر المهام المعينة
                            </span>
                          </div>
                          <table className="w-full text-[11px] text-right">
                            <thead className="bg-slate-800 text-white">
                              <tr>
                                <th className="px-3 py-2 font-bold">
                                  المعاملة / المرجع
                                </th>
                                <th className="px-3 py-2 font-bold">المهمة</th>
                                <th className="px-3 py-2 font-bold">الأتعاب</th>
                                <th className="px-3 py-2 font-bold">
                                  حالة التسوية
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {(selectedEmp.tasks || [])
                                .slice(0, 5)
                                .map((task, idx) => {
                                  const isSettled = (
                                    selectedEmp.settlements || []
                                  ).some((s) =>
                                    s.source?.includes(task.taskName),
                                  );
                                  return (
                                    <tr
                                      key={task.id}
                                      className={`border-b border-gray-100 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                                    >
                                      <td className="px-3 py-2 font-mono text-blue-600 font-bold">
                                        {task.transaction?.transactionCode ||
                                          "—"}
                                      </td>
                                      <td className="px-3 py-2 font-bold text-gray-700">
                                        {task.taskName}
                                      </td>
                                      <td className="px-3 py-2 font-mono font-bold text-gray-800">
                                        {safeNum(task.cost).toLocaleString()}{" "}
                                        ر.س
                                      </td>
                                      <td className="px-3 py-2">
                                        <span
                                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${isSettled ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                                        >
                                          {isSettled ? "مسواة" : "غير مسواة"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              {(!selectedEmp.tasks ||
                                selectedEmp.tasks.length === 0) && (
                                <tr>
                                  <td
                                    colSpan="4"
                                    className="text-center py-6 text-gray-400"
                                  >
                                    لا توجد مهام مسجلة
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Latest Transfers */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                            <span className="text-[13px] font-bold text-gray-800">
                              آخر التحويلات المنصرفة
                            </span>
                          </div>
                          <table className="w-full text-[11px] text-right">
                            <thead className="bg-slate-800 text-white">
                              <tr>
                                <th className="px-3 py-2 font-bold">التاريخ</th>
                                <th className="px-3 py-2 font-bold">
                                  المبلغ (ر.س)
                                </th>
                                <th className="px-3 py-2 font-bold">الطريقة</th>
                                <th className="px-3 py-2 font-bold">
                                  ملاحظات / السند
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {(selectedEmp.transfers || [])
                                .slice(0, 5)
                                .map((pay, idx) => (
                                  <tr
                                    key={pay.id}
                                    className={`border-b border-gray-100 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                                  >
                                    <td className="px-3 py-2 font-mono text-gray-500">
                                      {new Date(pay.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-3 py-2 font-mono font-bold text-purple-600">
                                      {safeNum(pay.amount).toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2 font-bold text-gray-700">
                                      {pay.method}
                                    </td>
                                    <td
                                      className="px-3 py-2 text-gray-500 truncate max-w-[100px]"
                                      title={pay.notes}
                                    >
                                      {pay.notes}
                                    </td>
                                  </tr>
                                ))}
                              {(!selectedEmp.transfers ||
                                selectedEmp.transfers.length === 0) && (
                                <tr>
                                  <td
                                    colSpan="4"
                                    className="text-center py-6 text-gray-400"
                                  >
                                    لا توجد تحويلات مسجلة
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === TAB 2: PREV PAYMENTS === */}
                  {activeTab === "prev_payments" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-100">
                        <Info className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-[11px] font-bold text-blue-800">
                          هنا تسجل الأرصدة والدفعات المتراكمة من قبل بداية
                          النظام الحالي لضبط الرصيد.
                        </span>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-[12px] text-right">
                          <thead className="bg-slate-800 text-white">
                            <tr>
                              <th className="px-4 py-3 font-bold">المرجع</th>
                              <th className="px-4 py-3 font-bold">التاريخ</th>
                              <th className="px-4 py-3 font-bold">
                                المبلغ المضاف (ر.س)
                              </th>
                              <th className="px-4 py-3 font-bold">ملاحظة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedEmp.settlements || [])
                              .filter(
                                (s) =>
                                  s.source === "رصيد افتتاحي" ||
                                  s.notes?.includes("دفعة سابقة"),
                              )
                              .map((s, idx) => (
                                <tr
                                  key={s.id}
                                  className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                                >
                                  <td className="px-4 py-2 font-mono text-gray-400">
                                    {s.id.slice(-6)}
                                  </td>
                                  <td className="px-4 py-2 font-mono font-bold">
                                    {new Date(s.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-2 font-mono font-bold text-blue-600">
                                    {safeNum(s.amount).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2 text-gray-600 text-[11px] font-semibold">
                                    {s.notes}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* === TAB 3: TRANSACTIONS & TASKS === */}
                  {activeTab === "transactions" && (
                    <div className="space-y-3">
                      {(selectedEmp.tasks || []).map((task) => {
                        const isSettled = (selectedEmp.settlements || []).some(
                          (s) => s.source?.includes(task.taskName),
                        );
                        return (
                          <div
                            key={task.id}
                            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:border-blue-300 transition-all"
                          >
                            <div className="w-full flex items-center gap-4 px-4 py-3 bg-gray-50">
                              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                              <span className="font-mono text-[12px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                {task.transaction?.transactionCode || "عام"}
                              </span>
                              <span className="text-[14px] font-bold text-gray-800">
                                {task.taskName}
                              </span>
                              <div className="flex-1"></div>
                              <div className="flex items-center gap-4">
                                <div className="text-left leading-tight">
                                  <div className="text-[10px] text-gray-500 font-bold">
                                    أتعاب المهمة
                                  </div>
                                  <div className="font-mono text-[13px] font-bold text-gray-800">
                                    {safeNum(task.cost).toLocaleString()} ر.س
                                  </div>
                                </div>
                                <span
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${task.isFinal ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                                >
                                  {task.isFinal ? "نهائية" : "مبدئية"}
                                </span>
                                <span
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold border ${isSettled ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}
                                >
                                  {isSettled
                                    ? "مسواة (أضيفت للرصيد)"
                                    : "غير مسواة"}
                                </span>
                                {!isSettled && (
                                  <button
                                    onClick={() => openSettleModal(task)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 text-white font-bold text-[11px] shadow-sm hover:bg-blue-700 transition-colors"
                                  >
                                    <Banknote className="w-3.5 h-3.5" />
                                    <span>اعتماد وتسوية</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {(!selectedEmp.tasks ||
                        selectedEmp.tasks.length === 0) && (
                        <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                          لا توجد مهام معينة لهذا الموظف
                        </div>
                      )}
                    </div>
                  )}

                  {/* === TAB 4: TRANSFERS === */}
                  {activeTab === "transfers" && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-[12px] text-right">
                        <thead className="bg-slate-800 text-white">
                          <tr>
                            <th className="px-4 py-3 font-bold">التاريخ</th>
                            <th className="px-4 py-3 font-bold">
                              المبلغ المخصوم (ر.س)
                            </th>
                            <th className="px-4 py-3 font-bold">
                              طريقة التحويل
                            </th>
                            <th className="px-4 py-3 font-bold">
                              ملاحظات / السند
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedEmp.transfers || []).map((pay, idx) => (
                            <tr
                              key={pay.id}
                              className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                            >
                              <td className="px-4 py-2.5 font-mono font-bold text-gray-600">
                                {new Date(pay.date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2.5 font-mono font-bold text-purple-600">
                                -{safeNum(pay.amount).toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 font-bold text-gray-700">
                                {pay.method}
                              </td>
                              <td className="px-4 py-2.5 text-gray-500 text-[11px] font-semibold">
                                {pay.notes}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-purple-50/50 border-t-2 border-purple-100">
                          <tr>
                            <td
                              colSpan="1"
                              className="px-4 py-3 font-bold text-gray-800 text-[13px]"
                            >
                              إجمالي التحويلات
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-purple-700 text-[14px]">
                              {safeNum(
                                selectedEmp.stats?.transferred,
                              ).toLocaleString()}{" "}
                              ر.س
                            </td>
                            <td colSpan="2"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* === TAB 5: EXCHANGE RATES === */}
                  {activeTab === "exchange" && (
                    <div className="space-y-6">
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                          <Settings2 className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-[13px] text-gray-800">
                            أسعار الصرف والرسوم (نسبة للريال السعودي)
                          </span>
                        </div>
                        <table className="w-full text-[12px] text-right">
                          <thead className="bg-slate-800 text-white">
                            <tr>
                              <th className="px-4 py-2.5 font-bold">العملة</th>
                              <th className="px-4 py-2.5 font-bold">
                                سعر الصرف (= 1 ر.س)
                              </th>
                              <th className="px-4 py-2.5 font-bold">
                                رسوم التحويل الثابتة (ر.س)
                              </th>
                              <th className="px-4 py-2.5 font-bold text-center">
                                إجراء
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-gray-100 bg-blue-50/30">
                              <td className="px-4 py-3 flex items-center gap-2 font-bold text-gray-800">
                                <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                                  <DollarSign className="w-3.5 h-3.5" />
                                </div>
                                ريال سعودي{" "}
                                <span className="text-[10px] text-gray-400 font-mono">
                                  (SAR)
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-lg text-gray-700">
                                1
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-gray-500">
                                0
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  العملة الأساسية
                                </span>
                              </td>
                            </tr>
                            {exchangeRates.map((r) => (
                              <tr
                                key={r.id}
                                className="border-b border-gray-100 hover:bg-gray-50"
                              >
                                <td className="px-4 py-3 flex items-center gap-2 font-bold text-gray-800">
                                  <div className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center">
                                    <DollarSign className="w-3.5 h-3.5" />
                                  </div>
                                  {r.currency}
                                </td>
                                <td className="px-4 py-3 font-mono font-bold text-lg text-green-700">
                                  {r.rate}
                                </td>
                                <td className="px-4 py-3 font-mono font-bold text-gray-500">
                                  {r.transferFee}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => {
                                      setRateForm({
                                        id: r.id,
                                        currency: r.currency,
                                        rate: r.rate,
                                        transferFee: r.transferFee,
                                      });
                                      setIsEditRateOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 text-[10px] font-bold shadow-sm mx-auto"
                                  >
                                    <PenLine className="w-3 h-3" />
                                    تعديل
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Calculator */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <Banknote className="w-5 h-5 text-amber-500" />
                            <span className="font-bold text-[14px] text-gray-800">
                              أداة التقريب السريع
                            </span>
                          </div>
                          <div className="flex items-end gap-3">
                            <div className="flex-1">
                              <label className="block text-[11px] font-bold text-gray-500 mb-1.5">
                                المبلغ (ر.س)
                              </label>
                              <input
                                type="number"
                                value={calcAmount}
                                onChange={(e) => setCalcAmount(e.target.value)}
                                placeholder="أدخل المبلغ..."
                                className="w-full px-3 py-2.5 rounded-md border border-gray-300 font-mono font-bold text-[14px] outline-none focus:border-amber-500 bg-gray-50"
                              />
                            </div>
                            <div className="w-[140px]">
                              <label className="block text-[11px] font-bold text-gray-500 mb-1.5">
                                العملة المستهدفة
                              </label>
                              <select
                                value={calcCurrency}
                                onChange={(e) =>
                                  setCalcCurrency(e.target.value)
                                }
                                className="w-full px-3 py-2.5 rounded-md border border-gray-300 font-bold text-[12px] outline-none focus:border-amber-500 bg-white appearance-none"
                              >
                                {exchangeRates.map((r) => (
                                  <option key={r.id} value={r.currency}>
                                    {r.currency}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
                          {calcResult ? (
                            <>
                              <div className="text-[11px] font-bold text-blue-600/70 mb-1">
                                المبلغ المحول تقريباً
                              </div>
                              <div className="font-mono text-[32px] font-black text-blue-700 leading-tight">
                                {calcResult.converted}{" "}
                                <span className="text-[14px]">
                                  {calcCurrency}
                                </span>
                              </div>
                              <div className="text-[10px] font-bold text-gray-500 mt-2 bg-white px-3 py-1 rounded-full border border-gray-200">
                                شامل رسوم التحويل ({calcResult.fee} ر.س)
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center opacity-40">
                              <ArrowUpDown className="w-8 h-8 mb-2 text-blue-800" />
                              <div className="font-bold text-[12px] text-blue-900">
                                أدخل مبلغاً في أداة التقريب لترى النتيجة هنا
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Modals Portals */}
      {/* ========================================================================= */}

      {/* 1. Modal: إضافة/تعديل موظف عن بعد (النموذج الشامل Enterprise) */}
      {isAddEmpOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0 rounded-t-2xl">
              <span className="text-gray-800 text-[16px] font-black">
                {modalMode === "add"
                  ? "إضافة موظف عن بعد جديد"
                  : "تعديل بيانات الموظف"}
              </span>
              <button
                onClick={() => setIsAddEmpOpen(false)}
                className="text-gray-400 hover:text-red-500 bg-white border border-gray-300 shadow-sm p-1.5 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar-slim flex-1 bg-gray-50/30">
              <div className="bg-pink-50 border border-pink-200 p-3 rounded-lg flex items-start gap-2">
                <Info className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                <span className="text-pink-800 text-[11px] font-bold leading-relaxed">
                  هذا الملف مستقل تماماً عن الفرع الرئيسي ولا يتزامن إلا إذا تم
                  تحويله إلى "موظف رسمي". قم بتعبئة بيانات التحويل المالي بدقة
                  لتسهيل صرف أتعابه.
                </span>
              </div>

              {/* الأسماء 4 رباعية */}
              <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
                <label className="block mb-3 text-[14px] font-black text-gray-800 border-b border-gray-100 pb-2">
                  <User className="w-4 h-4 inline-block text-blue-500 ml-1" />{" "}
                  الاسم الرباعي والبيانات الديموغرافية
                </label>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                      الاسم الأول *
                    </label>
                    <input
                      type="text"
                      placeholder="الاسم الأول (Ar)"
                      value={empForm.firstNameAr}
                      onChange={(e) =>
                        setEmpForm({ ...empForm, firstNameAr: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold focus:border-blue-500 focus:bg-white outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                      الاسم الثاني
                    </label>
                    <input
                      type="text"
                      placeholder="الاسم الثاني"
                      value={empForm.secondNameAr}
                      onChange={(e) =>
                        setEmpForm({ ...empForm, secondNameAr: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:bg-white outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                      الاسم الثالث
                    </label>
                    <input
                      type="text"
                      placeholder="الاسم الثالث"
                      value={empForm.thirdNameAr}
                      onChange={(e) =>
                        setEmpForm({ ...empForm, thirdNameAr: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:bg-white outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                      الاسم الرابع (العائلة)
                    </label>
                    <input
                      type="text"
                      placeholder="الاسم الرابع"
                      value={empForm.fourthNameAr}
                      onChange={(e) =>
                        setEmpForm({ ...empForm, fourthNameAr: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold focus:border-blue-500 focus:bg-white outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block text-right">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="First Name"
                      value={empForm.firstNameEn}
                      onChange={(e) =>
                        setEmpForm({ ...empForm, firstNameEn: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-500 focus:bg-white outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block text-right">
                      Second Name
                    </label>
                    <input
                      type="text"
                      placeholder="Second Name"
                      value={empForm.secondNameEn}
                      onChange={(e) =>
                        setEmpForm({ ...empForm, secondNameEn: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-500 focus:bg-white outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block text-right">
                      Third Name
                    </label>
                    <input
                      type="text"
                      placeholder="Third Name"
                      value={empForm.thirdNameEn}
                      onChange={(e) =>
                        setEmpForm({ ...empForm, thirdNameEn: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-500 focus:bg-white outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block text-right">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={empForm.fourthNameEn}
                      onChange={(e) =>
                        setEmpForm({ ...empForm, fourthNameEn: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-500 focus:bg-white outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block mb-1 text-[11px] font-bold text-gray-700">
                      دولة الإقامة الحالية
                    </label>
                    <div className="relative">
                      <Globe2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={empForm.country}
                        onChange={(e) =>
                          setEmpForm({ ...empForm, country: e.target.value })
                        }
                        placeholder="مثال: السعودية، مصر..."
                        className="w-full border border-gray-300 rounded-lg pr-9 pl-3 py-2 text-xs outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-[11px] font-bold text-gray-700">
                      عملة التحويل المفضلة
                    </label>
                    <select
                      value={empForm.currency}
                      onChange={(e) =>
                        setEmpForm({ ...empForm, currency: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                    >
                      <option value="SAR">ريال سعودي (SAR)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                      <option value="EGP">جنيه مصري (EGP)</option>
                      <option value="USDT">عملة رقمية (USDT)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* التواصل بالصيغة الدولية (الحديثة المدمجة) */}
              <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
                <h3 className="text-[14px] font-black text-gray-800 border-b border-gray-100 pb-2 mb-4">
                  <Phone className="w-4 h-4 inline-block text-blue-500 ml-1" />{" "}
                  معلومات التواصل (مدمجة بالرمز الدولي)
                </h3>
                <div className="grid grid-cols-3 gap-5">
                  {/* Phone Input with Country Code */}
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-gray-700">
                      رقم الجوال الأساسي *
                    </label>
                    <div className="flex" dir="ltr">
                      <select
                        value={empForm.phoneCode}
                        onChange={(e) =>
                          setEmpForm({ ...empForm, phoneCode: e.target.value })
                        }
                        className="bg-gray-100 border border-gray-300 border-r-0 rounded-l-lg px-2 text-xs font-mono outline-none focus:border-blue-500 w-24"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} {c.label.split(" ")[1]}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={empForm.phoneWithoutCode}
                        onChange={(e) =>
                          setEmpForm({
                            ...empForm,
                            phoneWithoutCode: e.target.value,
                          })
                        }
                        className="flex-1 bg-white border border-gray-300 rounded-r-lg px-3 py-2 text-xs font-mono font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        placeholder="5XXXXXXXX"
                      />
                    </div>
                  </div>

                  {/* Whatsapp Input with Country Code */}
                  <div>
                    <label className="block mb-1.5 text-[11px] font-bold text-green-700">
                      رقم الواتساب
                    </label>
                    <div className="flex" dir="ltr">
                      <select
                        value={empForm.whatsappCode}
                        onChange={(e) =>
                          setEmpForm({
                            ...empForm,
                            whatsappCode: e.target.value,
                          })
                        }
                        className="bg-green-50 border border-green-300 border-r-0 rounded-l-lg px-2 text-xs font-mono outline-none focus:border-green-500 w-24 text-green-800"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} {c.label.split(" ")[1]}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={empForm.whatsappWithoutCode}
                        onChange={(e) =>
                          setEmpForm({
                            ...empForm,
                            whatsappWithoutCode: e.target.value,
                          })
                        }
                        className="flex-1 bg-white border border-green-300 rounded-r-lg px-3 py-2 text-xs font-mono font-bold outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200"
                        placeholder="5XXXXXXXX"
                      />
                    </div>
                  </div>

                  {/* Telegram */}
                  <div dir="ltr">
                    <label className="block mb-1.5 text-[11px] font-bold text-blue-500 text-right">
                      معرّف التليجرام (Telegram)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 font-mono text-xs">
                        @
                      </span>
                      <input
                        type="text"
                        value={empForm.telegram}
                        onChange={(e) =>
                          setEmpForm({ ...empForm, telegram: e.target.value })
                        }
                        className="w-full bg-white border border-blue-300 rounded-lg pl-8 pr-3 py-2 text-xs font-mono font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        placeholder="username"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* تفاصيل التحويل */}
              <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
                <label className="block mb-3 text-[14px] font-black text-gray-800 border-b border-gray-100 pb-2">
                  <Wallet className="w-4 h-4 inline-block text-blue-500 ml-1" />{" "}
                  بيانات استلام المستحقات (Transfer Details)
                </label>
                <div className="flex gap-3 mb-4 flex-wrap">
                  {[
                    "حساب بنكي محلي/دولي",
                    "ويسترن يونيون",
                    "InstaPay",
                    "محفظة رقمية USDT",
                  ].map((method) => (
                    <label
                      key={method}
                      className={`flex items-center gap-2 px-4 py-2 border-2 rounded-xl cursor-pointer transition-colors ${empForm.transferMethod === method ? "border-blue-600 bg-blue-50 shadow-sm" : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}
                    >
                      <input
                        type="radio"
                        checked={empForm.transferMethod === method}
                        onChange={() =>
                          setEmpForm({
                            ...empForm,
                            transferMethod: method,
                            transferDetails: {},
                          })
                        }
                        className="accent-blue-600 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-gray-700">
                        {method}
                      </span>
                    </label>
                  ))}
                </div>

                {/* حقول ديناميكية حسب الطريقة */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  {!empForm.transferMethod && (
                    <div className="col-span-2 text-center text-xs text-gray-400 font-bold">
                      يرجى اختيار طريقة التحويل لعرض الحقول المناسبة
                    </div>
                  )}
                  {empForm.transferMethod === "حساب بنكي محلي/دولي" && (
                    <>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                          اسم البنك
                        </label>
                        <input
                          type="text"
                          placeholder="اسم البنك"
                          value={empForm.transferDetails?.bankName || ""}
                          onChange={(e) =>
                            setEmpForm({
                              ...empForm,
                              transferDetails: {
                                ...empForm.transferDetails,
                                bankName: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-gray-300 p-2 rounded-lg text-xs focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                          IBAN / رقم الحساب
                        </label>
                        <input
                          type="text"
                          placeholder="IBAN"
                          value={empForm.transferDetails?.iban || ""}
                          onChange={(e) =>
                            setEmpForm({
                              ...empForm,
                              transferDetails: {
                                ...empForm.transferDetails,
                                iban: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-gray-300 p-2 rounded-lg text-xs font-mono focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                          SWIFT Code
                        </label>
                        <input
                          type="text"
                          placeholder="SWIFT Code"
                          value={empForm.transferDetails?.swift || ""}
                          onChange={(e) =>
                            setEmpForm({
                              ...empForm,
                              transferDetails: {
                                ...empForm.transferDetails,
                                swift: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-gray-300 p-2 rounded-lg text-xs font-mono focus:border-blue-500 outline-none"
                        />
                      </div>
                    </>
                  )}
                  {empForm.transferMethod === "InstaPay" && (
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                        عنوان InstaPay
                      </label>
                      <input
                        type="text"
                        placeholder="username@instapay"
                        value={empForm.transferDetails?.instapayAddress || ""}
                        onChange={(e) =>
                          setEmpForm({
                            ...empForm,
                            transferDetails: {
                              ...empForm.transferDetails,
                              instapayAddress: e.target.value,
                            },
                          })
                        }
                        className="w-full border border-gray-300 p-2 rounded-lg text-xs font-mono focus:border-blue-500 outline-none"
                      />
                    </div>
                  )}
                  {empForm.transferMethod === "ويسترن يونيون" && (
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                        الاسم المطابق للهوية بالإنجليزية
                      </label>
                      <input
                        type="text"
                        placeholder="Full Name in English"
                        value={empForm.transferDetails?.westernNameEn || ""}
                        onChange={(e) =>
                          setEmpForm({
                            ...empForm,
                            transferDetails: {
                              ...empForm.transferDetails,
                              westernNameEn: e.target.value,
                            },
                          })
                        }
                        className="w-full border border-gray-300 p-2 rounded-lg text-xs font-mono focus:border-blue-500 outline-none"
                        dir="ltr"
                      />
                    </div>
                  )}
                  {empForm.transferMethod === "محفظة رقمية USDT" && (
                    <>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                          الشبكة (Network)
                        </label>
                        <select
                          value={empForm.transferDetails?.network || ""}
                          onChange={(e) =>
                            setEmpForm({
                              ...empForm,
                              transferDetails: {
                                ...empForm.transferDetails,
                                network: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-gray-300 p-2 rounded-lg text-xs focus:border-blue-500 outline-none"
                        >
                          <option value="">اختر الشبكة...</option>
                          <option>TRC20 (Tron)</option>
                          <option>ERC20 (Ethereum)</option>
                          <option>BEP20 (BSC)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                          عنوان المحفظة (Address)
                        </label>
                        <input
                          type="text"
                          placeholder="Wallet Address"
                          value={empForm.transferDetails?.address || ""}
                          onChange={(e) =>
                            setEmpForm({
                              ...empForm,
                              transferDetails: {
                                ...empForm.transferDetails,
                                address: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-gray-300 p-2 rounded-lg text-xs font-mono focus:border-blue-500 outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* الملاحظات والمرفقات */}
              <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
                  <label className="block mb-2 text-[13px] font-black text-gray-800">
                    ملاحظات داخلية (الإدارة فقط)
                  </label>
                  <textarea
                    value={empForm.notes}
                    onChange={(e) =>
                      setEmpForm({ ...empForm, notes: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 h-[110px] resize-none"
                    placeholder="أي ملاحظات، تقييم، الخ..."
                  />
                </div>

                <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
                  <label className="block mb-2 text-[13px] font-black text-gray-800">
                    <Paperclip className="w-4 h-4 inline text-gray-500" />{" "}
                    المستندات والمرفقات (صورة الهوية، الجواز، CV)
                  </label>
                  <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-blue-50 hover:border-blue-400 rounded-xl text-gray-500 cursor-pointer transition-all h-[110px]">
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-600">
                      {empForm.files.length > 0
                        ? `تم تحديد ${empForm.files.length} ملف للرفع`
                        : "اضغط هنا لرفع المرفقات"}
                    </span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) =>
                        setEmpForm({
                          ...empForm,
                          files: Array.from(e.target.files),
                        })
                      }
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white rounded-b-2xl shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button
                onClick={() => setIsAddEmpOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-gray-100 border border-gray-300 text-gray-700 text-[12px] font-bold hover:bg-gray-200 transition-colors shadow-sm"
              >
                إلغاء الأمر
              </button>
              <button
                onClick={handleSaveEmp}
                disabled={saveEmpMutation.isPending}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
              >
                {saveEmpMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {modalMode === "add"
                  ? "اعتماد وحفظ الملف"
                  : "تحديث بيانات الملف"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: معاينة تقرير */}
      {isReportPreviewOpen && selectedEmp && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-6 animate-in zoom-in duration-200">
          <div
            className="bg-white border border-[var(--wms-border)] rounded-xl shadow-2xl flex flex-col w-full max-w-4xl h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)] shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-[var(--wms-text)] text-[16px] font-bold">
                  معاينة التقرير
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition-colors text-[12px] font-bold shadow-sm">
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير PDF</span>
                </button>
                <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-gray-100 border border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors text-[12px] font-bold">
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <button
                  onClick={() => setIsReportPreviewOpen(false)}
                  className="text-gray-400 hover:text-red-500 bg-white p-1.5 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto p-8"
              style={{ backgroundColor: "rgb(249, 250, 251)" }}
            >
              <div
                className="bg-white rounded-xl border border-gray-200 p-8 mx-auto shadow-sm"
                style={{ maxWidth: "800px" }}
              >
                {/* Header التقرير */}
                <div
                  className="text-center mb-6 pb-4 border-b-2"
                  style={{ borderColor: "rgba(37, 99, 235, 0.15)" }}
                >
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 900,
                      color: "rgb(26, 35, 50)",
                    }}
                  >
                    تقرير حسابات العمل عن بعد
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "rgb(37, 99, 235)",
                      marginTop: "6px",
                    }}
                  >
                    {selectedEmp.name}
                  </div>
                  <div
                    className="flex items-center justify-center gap-4 mt-3"
                    style={{
                      fontSize: "11px",
                      color: "rgb(139, 153, 171)",
                      fontWeight: 600,
                    }}
                  >
                    <span className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200 text-gray-600">
                      الفترة: شامل
                    </span>
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

                {/* إحصائيات علوية */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{
                      backgroundColor: "rgba(37, 99, 235, 0.05)",
                      border: "1px solid rgba(37, 99, 235, 0.15)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgb(100, 116, 139)",
                        fontWeight: "bold",
                        marginBottom: "4px",
                      }}
                    >
                      إجمالي الأتعاب (له)
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "rgb(37, 99, 235)",
                      }}
                    >
                      {safeNum(selectedEmp.stats.total).toLocaleString()}{" "}
                      <span className="text-[10px]">ر.س</span>
                    </div>
                  </div>
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{
                      backgroundColor: "rgba(22, 163, 74, 0.05)",
                      border: "1px solid rgba(22, 163, 74, 0.15)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgb(100, 116, 139)",
                        fontWeight: "bold",
                        marginBottom: "4px",
                      }}
                    >
                      إجمالي المحول (إليه)
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "rgb(22, 163, 74)",
                      }}
                    >
                      {safeNum(selectedEmp.stats.transferred).toLocaleString()}{" "}
                      <span className="text-[10px]">ر.س</span>
                    </div>
                  </div>
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{
                      backgroundColor: "rgba(168, 85, 247, 0.05)",
                      border: "1px solid rgba(168, 85, 247, 0.15)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgb(100, 116, 139)",
                        fontWeight: "bold",
                        marginBottom: "4px",
                      }}
                    >
                      مهام منجزة
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "rgb(147, 51, 234)",
                      }}
                    >
                      {selectedEmp.tasks?.length || 0}
                    </div>
                  </div>
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{
                      backgroundColor: "rgba(220, 38, 38, 0.05)",
                      border: "1px solid rgba(220, 38, 38, 0.15)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgb(100, 116, 139)",
                        fontWeight: "bold",
                        marginBottom: "4px",
                      }}
                    >
                      المتبقي (المستحق)
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "rgb(220, 38, 38)",
                      }}
                    >
                      {safeNum(selectedEmp.stats.remaining).toLocaleString()}{" "}
                      <span className="text-[10px]">ر.س</span>
                    </div>
                  </div>
                </div>

                {/* جدول الحركات الشامل */}
                <div className="text-[13px] font-bold text-gray-800 mb-3 border-r-4 border-blue-500 pr-2">
                  سجل الحركات التفصيلي
                </div>
                <table
                  className="w-full mb-6 text-right border-collapse"
                  style={{ fontSize: "11px" }}
                >
                  <thead>
                    <tr>
                      <th className="px-3 py-2.5 font-bold text-gray-700 bg-gray-100 border-b-2 border-gray-300">
                        المرجع
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-700 bg-gray-100 border-b-2 border-gray-300">
                        النوع
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-700 bg-gray-100 border-b-2 border-gray-300">
                        التاريخ
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-700 bg-gray-100 border-b-2 border-gray-300">
                        ملاحظات / وصف
                      </th>
                      <th className="px-3 py-2.5 font-bold text-gray-700 bg-gray-100 border-b-2 border-gray-300 text-left">
                        المبلغ (ر.س)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* طباعة المهام المنجزة (موجب) */}
                    {(selectedEmp.tasks || []).map((t, i) => (
                      <tr
                        key={`t-${i}`}
                        className="border-b border-gray-200 bg-white"
                      >
                        <td className="px-3 py-2.5 font-mono text-gray-500 font-bold">
                          {t.transaction?.transactionCode || "عام"}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-blue-600">
                          <span className="bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                            أتعاب مهمة
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-gray-500">
                          {t.createdAt?.split("T")[0]}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600 font-semibold">
                          {t.taskName}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-blue-700 text-left">
                          +{safeNum(t.cost).toLocaleString()}
                        </td>
                      </tr>
                    ))}

                    {/* طباعة التسويات والأرصدة السابقة (موجب) */}
                    {(selectedEmp.settlements || []).map((s, i) => (
                      <tr
                        key={`s-${i}`}
                        className="border-b border-gray-200 bg-gray-50/50"
                      >
                        <td className="px-3 py-2.5 font-mono text-gray-500 font-bold">
                          {s.id.slice(-6)}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-blue-600">
                          <span className="bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                            تسوية مالية
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-gray-500">
                          {new Date(s.createdAt).toISOString().split("T")[0]}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600 font-semibold">
                          {s.notes || s.source}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-blue-700 text-left">
                          +{safeNum(s.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}

                    {/* طباعة التحويلات المنصرفة (سالب) */}
                    {(selectedEmp.transfers || []).map((p, i) => (
                      <tr
                        key={`p-${i}`}
                        className="border-b border-gray-200 bg-white"
                      >
                        <td className="px-3 py-2.5 font-mono text-gray-500 font-bold">
                          {p.id.slice(-6)}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-red-600">
                          <span className="bg-red-50 px-2 py-0.5 rounded text-[10px]">
                            تحويل منصرف
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-gray-500">
                          {new Date(p.date).toISOString().split("T")[0]}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600 font-semibold">
                          {p.method} - {p.notes}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-red-600 text-left">
                          -{safeNum(p.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}

                    {/* رسالة عند عدم وجود حركات */}
                    {!selectedEmp.tasks?.length &&
                      !selectedEmp.settlements?.length &&
                      !selectedEmp.transfers?.length && (
                        <tr>
                          <td
                            colSpan="5"
                            className="text-center py-8 text-gray-400 font-bold"
                          >
                            لا توجد حركات مسجلة لهذا الموظف
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>

                {/* خلاصة التقرير */}
                <div
                  className="rounded-lg p-4 mb-6"
                  style={{
                    backgroundColor: "rgb(248, 250, 252)",
                    border: "1px solid rgb(226, 232, 240)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "rgb(26, 35, 50)",
                      marginBottom: "8px",
                    }}
                  >
                    الخلاصة النهائية
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="flex items-center justify-between px-3 py-2 rounded border border-blue-100"
                      style={{ backgroundColor: "rgba(37, 99, 235, 0.04)" }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          color: "rgb(107, 114, 128)",
                          fontWeight: "bold",
                        }}
                      >
                        صافي الرصيد المستحق:
                      </span>
                      <span
                        className="font-mono text-blue-700"
                        style={{ fontSize: "14px", fontWeight: 900 }}
                      >
                        {safeNum(selectedEmp.stats.remaining).toLocaleString()}{" "}
                        ر.س
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 rounded bg-white border border-gray-200">
                      <span
                        style={{
                          fontSize: "11px",
                          color: "rgb(107, 114, 128)",
                          fontWeight: "bold",
                        }}
                      >
                        إجمالي السجلات المرتبطة:
                      </span>
                      <span
                        className="font-mono text-gray-800"
                        style={{ fontSize: "14px", fontWeight: 900 }}
                      >
                        {(selectedEmp.tasks?.length || 0) +
                          (selectedEmp.settlements?.length || 0) +
                          (selectedEmp.transfers?.length || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* توقيعات */}
                <div className="flex justify-between items-end mt-12 px-10 border-t border-gray-200 pt-8">
                  <div className="text-center">
                    <div className="text-[12px] font-bold text-gray-500 mb-6">
                      المدير المالي
                    </div>
                    <div className="w-32 border-b border-dashed border-gray-400 mx-auto"></div>
                  </div>
                  <div className="text-center">
                    <div className="text-[12px] font-bold text-gray-500 mb-4">
                      ختم النظام المعتمد
                    </div>
                    <div className="w-20 h-20 rounded-full border-[3px] border-blue-100 flex items-center justify-center mx-auto opacity-40">
                      <Check className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[12px] font-bold text-gray-500 mb-6">
                      توقيع الموظف (الاستلام)
                    </div>
                    <div className="w-32 border-b border-dashed border-gray-400 mx-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: تعيين معاملة ومهام */}
      {isAssignTxOpen && selectedEmp && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-[650px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 bg-slate-800 border-b border-slate-700">
              <span className="text-[15px] font-bold text-white">
                تعيين مهام للموظف: {selectedEmp.name}
              </span>
              <button
                onClick={() => setIsAssignTxOpen(false)}
                className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-red-500 p-1.5 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar-slim">
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  المعاملة المستهدفة *
                </label>
                <div className="relative">
                  <select
                    value={tasksForm.transactionId}
                    onChange={(e) =>
                      setTasksForm({
                        ...tasksForm,
                        transactionId: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-blue-300 shadow-sm rounded-md px-4 py-2.5 text-[12px] font-bold text-gray-700 outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="">اختر المعاملة من النظام...</option>
                    {transactions.map((tx) => (
                      <option key={tx.id} value={tx.id}>
                        {tx.transactionCode} - {safeText(tx.client)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                  <label className="text-[13px] font-bold text-gray-800">
                    المهام المطلوبة وتسعيرها
                  </label>
                  <button
                    onClick={addTaskRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 text-[11px] font-bold shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة مهمة أخرى</span>
                  </button>
                </div>
                <div className="space-y-3">
                  {tasksForm.tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm"
                    >
                      <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </div>
                      <input
                        value={task.name}
                        onChange={(e) =>
                          updateTaskRow(idx, "name", e.target.value)
                        }
                        placeholder="اسم المهمة (مثال: رسم معماري)"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-[12px] font-bold outline-none focus:border-blue-400"
                      />
                      <div className="relative w-32 shrink-0">
                        <input
                          type="number"
                          value={task.cost}
                          onChange={(e) =>
                            updateTaskRow(idx, "cost", e.target.value)
                          }
                          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-md bg-gray-50 font-mono font-bold text-[13px] outline-none focus:border-blue-400"
                          placeholder="التكلفة"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                          ر.س
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <div className="text-[12px] font-bold text-blue-900">
                  إجمالي تكلفة المهام:
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[18px] font-black text-blue-700">
                    {tasksTotalCost.toLocaleString()}{" "}
                    <span className="text-[11px]">ر.س</span>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-2">
                  حالة تسوية الأتعاب حالياً
                </label>
                <div className="flex items-center gap-4 bg-white p-1 rounded-lg border border-gray-200 w-fit">
                  <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="feeStatus"
                      className="w-4 h-4 accent-amber-500"
                      checked={!tasksForm.isFinal}
                      onChange={() =>
                        setTasksForm({ ...tasksForm, isFinal: false })
                      }
                    />
                    <span className="text-[12px] font-bold text-amber-700">
                      مبدئية (قيد العمل)
                    </span>
                  </label>
                  <div className="w-px h-4 bg-gray-200"></div>
                  <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="feeStatus"
                      className="w-4 h-4 accent-green-500"
                      checked={tasksForm.isFinal}
                      onChange={() =>
                        setTasksForm({ ...tasksForm, isFinal: true })
                      }
                    />
                    <span className="text-[12px] font-bold text-gray-600">
                      نهائية (مكتملة ومستحقة)
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setIsAssignTxOpen(false)}
                className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 font-bold text-[12px] hover:bg-gray-100 transition-colors bg-white"
              >
                إلغاء
              </button>
              <button
                onClick={() =>
                  assignTasksMutation.mutate({
                    workerId: selectedEmp.id,
                    ...tasksForm,
                  })
                }
                disabled={
                  assignTasksMutation.isPending || !tasksForm.transactionId
                }
                className="px-6 py-2 rounded-md bg-blue-600 text-white font-bold text-[12px] hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {assignTasksMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}{" "}
                حفظ وتعيين المهام
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: تسوية مهمة/معاملة */}
      {isSettleTxOpen && selectedTaskToSettle && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-[450px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 bg-slate-800 border-b border-slate-700">
              <span className="text-[15px] font-bold text-white flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" /> تسوية أتعاب مهمة
              </span>
              <button
                onClick={() => setIsSettleTxOpen(false)}
                className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-red-500 p-1.5 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="text-center pb-4 border-b border-gray-100">
                <div className="text-[12px] font-bold text-gray-500 mb-1">
                  المهمة المستهدفة
                </div>
                <div className="text-[16px] font-black text-gray-800">
                  {selectedTaskToSettle.taskName}{" "}
                  <span className="font-mono text-[12px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 mr-2">
                    {selectedTaskToSettle.transaction?.transactionCode || "عام"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="text-center">
                  <div className="text-[10px] font-bold text-gray-500 mb-1">
                    الإجمالي المستحق
                  </div>
                  <div className="font-mono text-[16px] font-black text-gray-800">
                    {safeNum(selectedTaskToSettle.cost)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  مبلغ التسوية الذي سيضاف لرصيده (ر.س)
                </label>
                <input
                  type="number"
                  value={settleForm.amount}
                  onChange={(e) =>
                    setSettleForm({ ...settleForm, amount: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 font-mono font-black text-[20px] text-center outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all text-blue-700"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setIsSettleTxOpen(false)}
                className="px-5 py-2.5 rounded-md border border-gray-300 text-gray-700 font-bold text-[12px] hover:bg-gray-100 transition-colors bg-white"
              >
                إلغاء
              </button>
              <button
                onClick={() =>
                  settleTxMutation.mutate({
                    targetType: "موظف",
                    targetId: selectedEmp.id,
                    amount: settleForm.amount,
                    source: selectedTaskToSettle.taskName,
                    notes: "تسوية مهام عمل عن بعد",
                  })
                }
                disabled={settleTxMutation.isPending || !settleForm.amount}
                className="flex-1 py-2.5 rounded-md bg-blue-600 text-white font-bold text-[13px] hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
              >
                {settleTxMutation.isPending
                  ? "جاري الحفظ..."
                  : "اعتماد وإضافة لرصيد الموظف"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: تسجيل تحويل مالي */}
      {isTransferOpen && selectedEmp && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 bg-slate-800 border-b border-slate-700">
              <span className="text-[15px] font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" /> تسجيل تحويل مالي
                (خصم رصيد)
              </span>
              <button
                onClick={() => setIsTransferOpen(false)}
                className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-red-500 p-1.5 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200 mb-2">
                <div className="text-[12px] font-bold text-gray-600">
                  الرصيد المستحق للموظف حالياً:
                </div>
                <div className="font-mono text-[18px] font-black text-red-600">
                  {safeNum(selectedEmp.stats?.remaining).toLocaleString()}{" "}
                  <span className="text-[11px] text-gray-400">ر.س</span>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  تاريخ التحويل
                </label>
                <input
                  type="date"
                  value={transferForm.date}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, date: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 font-mono text-[13px] outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  المبلغ المدفوع (بالريال السعودي) *
                </label>
                <input
                  type="number"
                  value={transferForm.amount}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, amount: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 font-mono font-black text-[20px] text-emerald-600 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all"
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                    العملة المرسلة فعلياً
                  </label>
                  <select
                    value={transferForm.currency}
                    onChange={(e) =>
                      setTransferForm({
                        ...transferForm,
                        currency: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-bold text-[12px] outline-none focus:border-emerald-500 appearance-none"
                  >
                    {exchangeRates.map((r) => (
                      <option key={r.id} value={r.currency}>
                        {r.currency}
                      </option>
                    ))}
                    <option value="SAR">SAR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                    طريقة التحويل
                  </label>
                  <select
                    value={transferForm.method}
                    onChange={(e) =>
                      setTransferForm({
                        ...transferForm,
                        method: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-bold text-[12px] outline-none focus:border-emerald-500 appearance-none"
                  >
                    <option>تحويل بنكي</option>
                    <option>ويسترن يونيون</option>
                    <option>نقداً</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  اسم المستلم (إذا كان مختلفاً)
                </label>
                <input
                  value={transferForm.targetName}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      targetName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-bold text-[12px] outline-none focus:border-emerald-500"
                  placeholder="اتركه فارغاً إذا كان للموظف نفسه"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  ملاحظات / رقم الحوالة
                </label>
                <input
                  value={transferForm.notes}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-bold text-[12px] outline-none focus:border-emerald-500"
                  placeholder="أدخل الملاحظات هنا..."
                />
              </div>
              <div className="pt-2">
                <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl cursor-pointer transition-colors text-emerald-700">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-[12px] font-bold">
                    {transferForm.file
                      ? transferForm.file.name
                      : "اضغط هنا لإرفاق صورة سند التحويل"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      setTransferForm({
                        ...transferForm,
                        file: e.target.files[0],
                      })
                    }
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setIsTransferOpen(false)}
                className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 font-bold text-[12px] hover:bg-gray-100 transition-colors bg-white"
              >
                إلغاء
              </button>
              <button
                onClick={() =>
                  transferMutation.mutate({
                    workerId: selectedEmp.id,
                    ...transferForm,
                  })
                }
                disabled={transferMutation.isPending || !transferForm.amount}
                className="flex-1 py-2 rounded-md bg-emerald-600 text-white font-bold text-[13px] hover:bg-emerald-700 transition-colors shadow-sm flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {transferMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" /> تأكيد وخصم الرصيد
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: تسجيل دفعة سابقة */}
      {isPrevPaymentOpen && selectedEmp && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 bg-slate-800 border-b border-slate-700">
              <span className="text-[15px] font-bold text-white">
                تسجيل دفعة سابقة (إجمالي)
              </span>
              <button
                onClick={() => setIsPrevPaymentOpen(false)}
                className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-red-500 p-1.5 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-blue-50 border border-blue-100 mb-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-[11px] font-bold text-blue-800 leading-relaxed">
                  إدخال رصيد مستحق قديم للموظف قبل استخدام النظام.
                </span>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  المبلغ المستحق (الرصيد الافتتاحي)
                </label>
                <input
                  type="number"
                  value={prevPaymentForm.amount}
                  onChange={(e) =>
                    setPrevPaymentForm({
                      ...prevPaymentForm,
                      amount: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono font-bold text-[14px] outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  ملاحظة / البيان
                </label>
                <input
                  value={prevPaymentForm.notes}
                  onChange={(e) =>
                    setPrevPaymentForm({
                      ...prevPaymentForm,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-bold text-[13px] outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setIsPrevPaymentOpen(false)}
                className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 font-bold text-[12px] hover:bg-gray-100 transition-colors bg-white"
              >
                إلغاء
              </button>
              <button
                onClick={() =>
                  prevPaymentMutation.mutate({
                    targetType: "موظف",
                    targetId: selectedEmp.id,
                    amount: prevPaymentForm.amount,
                    source: "رصيد افتتاحي",
                    notes: prevPaymentForm.notes,
                  })
                }
                disabled={
                  prevPaymentMutation.isPending || !prevPaymentForm.amount
                }
                className="px-6 py-2 rounded-md bg-blue-600 text-white font-bold text-[12px] hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                حفظ وتحديث الرصيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Edit Exchange Rate Modal */}
      {isEditRateOpen && (
        <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b font-bold flex justify-between bg-gray-50">
              تعديل سعر الصرف ({rateForm.currency}){" "}
              <button
                onClick={() => setIsEditRateOpen(false)}
                className="hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  السعر مقابل 1 ريال سعودي
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={rateForm.rate}
                  onChange={(e) =>
                    setRateForm({ ...rateForm, rate: e.target.value })
                  }
                  className="w-full border p-2 rounded font-mono font-bold outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  رسوم التحويل الثابتة (بالريال)
                </label>
                <input
                  type="number"
                  value={rateForm.transferFee}
                  onChange={(e) =>
                    setRateForm({ ...rateForm, transferFee: e.target.value })
                  }
                  className="w-full border p-2 rounded font-mono font-bold text-red-600 outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
              <button
                onClick={() => setIsEditRateOpen(false)}
                className="px-4 py-2 border bg-white rounded text-sm font-bold text-gray-600"
              >
                إلغاء
              </button>
              <button
                onClick={() => updateRateMutation.mutate(rateForm)}
                disabled={updateRateMutation.isPending}
                className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-bold disabled:opacity-50"
              >
                حفظ التحديث
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemoteWorkAccountsPage;
