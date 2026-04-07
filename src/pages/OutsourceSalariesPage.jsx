import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Search,
  Plus,
  X,
  Info,
  Calendar,
  DollarSign,
  Users,
  Edit3,
  Trash2,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
  Banknote,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Clock,
  Upload,
  FileText,
  Paperclip,
  Loader2,
  Save,
  Printer,
  Undo2,
} from "lucide-react";

const OUTSOURCE_UI = {
  DISCLAIMER:
    "تنبيه: هذه الشاشة مخصصة لإدارة رواتب ومستحقات المتعاونين الخارجيين. يرجى التأكد من حساب الأيام والخصومات بدقة قبل تسجيل الدفعة.",
  REPORT_TITLE: "تقرير رواتب المتعاونين",
};

const COUNTRY_CODES = [
  { code: "+966", label: "السعودية 🇸🇦" },
  { code: "+20", label: "مصر 🇪🇬" },
  { code: "+971", label: "الإمارات 🇦🇪" },
  { code: "+965", label: "الكويت 🇰🇼" },
  { code: "+973", label: "قطر 🇶🇦" },
  { code: "+974", label: "البحرين 🇧🇭" },
  { code: "+968", label: "عمان 🇴🇲" },
  { code: "+962", label: "الأردن 🇯🇴" },
];

const MONTHS_OPTIONS = [
  { value: "2026-03", label: "مارس 2026" },
  { value: "2026-02", label: "فبراير 2026" },
  { value: "2026-01", label: "يناير 2026" },
  { value: "2025-12", label: "ديسمبر 2025" },
  { value: "2025-11", label: "نوفمبر 2025" },
];

// ============================================================================
// 💡 Helpers
// ============================================================================
const maskName = (name) => name;
const maskAmount = (amount) => amount;
const safeText = (val) =>
  val === null || val === undefined ? "—" : String(val);
const safeNum = (val) => (isNaN(Number(val)) ? 0 : Number(val));

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function daysBetween(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

// ============================================================================
// 💡 Main Component
// ============================================================================
export default function ScreenOutsourceSalaries() {
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState("employees");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  // Modals
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showCreateSalaryModal, setShowCreateSalaryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [selectedSalaryRecord, setSelectedSalaryRecord] = useState(null);
  const [detailsRecord, setDetailsRecord] = useState(null); // لعرض التفاصيل

  // Form States
  const initialEmpForm = {
    id: null,
    name: "",
    phoneCode: "+966",
    phoneWithoutCode: "",
    email: "",
    nationalId: "",
    monthlySalary: "",
    joinDate: "",
    status: "active",
    address: "",
    bankAccount: "",
    emergencyContact: "",
    jobTitle: "",
  };
  const [empForm, setEmpForm] = useState(initialEmpForm);

  const [salEmpId, setSalEmpId] = useState("");
  const [salDateMode, setSalDateMode] = useState("month");
  const [salMonth, setSalMonth] = useState("");
  const [salStartDate, setSalStartDate] = useState("");
  const [salEndDate, setSalEndDate] = useState("");
  const [salDeductions, setSalDeductions] = useState("");
  const [salAdjustment, setSalAdjustment] = useState(""); // 💡 تعديل التقريب ليكون تسوية موجبة/سالبة
  const [salType, setSalType] = useState("regular");

  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("bank");
  const [payDate, setPayDate] = useState("");
  const [payTime, setPayTime] = useState("");
  const [payCurrency, setPayCurrency] = useState("SAR");
  const [payNotes, setPayNotes] = useState("");
  const [payIsPartial, setPayIsPartial] = useState(false);
  const [payCustomPercentage, setPayCustomPercentage] = useState("");
  const [payAttachment, setPayAttachment] = useState(null); // 💡 المرفق للدفعة

  // ============================================================================
  // 💡 API Queries
  // ============================================================================
  const { data: rawPersons = [], isLoading: isPersonsLoading } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => (await api.get("/persons")).data?.data || [],
  });

  const employees = useMemo(() => {
    return rawPersons
      .filter((p) => p.role === "خارجي")
      .map((p) => ({
        id: p.id,
        personCode: p.personCode,
        name: p.name,
        phone: p.phone || "",
        email: p.email || "",
        nationalId: p.idNumber || "",
        monthlySalary: safeNum(p.monthlySalary),
        jobTitle: p.jobTitle || "متعاون خارجي",
        joinDate: p.createdAt ? p.createdAt.split("T")[0] : "",
        status: p.isActive ? "active" : "inactive",
      }));
  }, [rawPersons]);

  const { data: salaryRecords = [], isLoading: isSalariesLoading } = useQuery({
    queryKey: ["outsource-salaries", filterMonth],
    queryFn: async () => {
      const res = await api.get("/finance/outsource-salaries", {
        params: { month: filterMonth === "all" ? undefined : filterMonth },
      });
      return res.data?.data || [];
    },
  });

  const { data: paymentTransactions = [], isLoading: isPaymentsLoading } =
    useQuery({
      queryKey: ["outsource-payments", filterMonth],
      queryFn: async () => {
        const res = await api.get("/finance/outsource-payments", {
          params: { month: filterMonth === "all" ? undefined : filterMonth },
        });
        return res.data?.data || [];
      },
    });

  // ============================================================================
  // 💡 Mutations
  // ============================================================================
  const saveEmployeeMutation = useMutation({
    mutationFn: async (payload) => {
      const fd = new FormData();
      fd.append("name", payload.name);
      fd.append("role", "خارجي");
      fd.append("phone", payload.phone);
      fd.append("email", payload.email || "");
      fd.append("isActive", payload.status === "active");
      fd.append("notes", payload.notes || "");
      fd.append("idNumber", payload.nationalId || "");
      fd.append("monthlySalary", payload.monthlySalary || 0);
      fd.append("jobTitle", payload.jobTitle || "");

      if (editEmployee) return await api.put(`/persons/${editEmployee.id}`, fd);
      return await api.post("/persons", fd);
    },
    onSuccess: () => {
      toast.success(
        editEmployee ? "تم تعديل الموظف بنجاح" : "تمت إضافة الموظف بنجاح",
      );
      queryClient.invalidateQueries(["persons-directory"]);
      closeAddEmployeeModal();
    },
    onError: () => toast.error("حدث خطأ أثناء حفظ الموظف"),
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/persons/${id}`),
    onSuccess: () => {
      toast.success("تم حذف الموظف");
      queryClient.invalidateQueries(["persons-directory"]);
    },
  });

  const createSalaryMutation = useMutation({
    mutationFn: async (payload) =>
      await api.post("/finance/outsource-salaries", payload),
    onSuccess: () => {
      toast.success("تم تسجيل الراتب بنجاح");
      queryClient.invalidateQueries(["outsource-salaries"]);
      closeCreateSalaryModal();
    },
    onError: () => toast.error("تأكد من إعدادات الباك إند"),
  });

  const deleteSalaryMutation = useMutation({
    mutationFn: async (id) =>
      await api.delete(`/finance/outsource-salaries/${id}`),
    onSuccess: () => {
      toast.success("تم التراجع عن سجل الراتب بنجاح");
      queryClient.invalidateQueries(["outsource-salaries"]);
    },
    onError: () => toast.error("لا يمكن الحذف لتواجد دفعات مرتبطة به"),
  });

  const paySalaryMutation = useMutation({
    mutationFn: async (payload) => {
      const fd = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === "file" && payload[key]) {
          fd.append("file", payload[key]);
        } else {
          fd.append(key, payload[key]);
        }
      });
      // 💡 استخدم FormData لدعم المرفقات
      return await api.post("/finance/outsource-payments", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة بنجاح");
      queryClient.invalidateQueries(["outsource-salaries"]);
      queryClient.invalidateQueries(["outsource-payments"]);
      closePaymentModal();
    },
    onError: () => toast.error("حدث خطأ أثناء الدفع"),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id) =>
      await api.delete(`/finance/outsource-payments/${id}`),
    onSuccess: () => {
      toast.success("تم إلغاء الدفعة والتراجع بنجاح");
      queryClient.invalidateQueries(["outsource-salaries"]);
      queryClient.invalidateQueries(["outsource-payments"]);
    },
    onError: () => toast.error("حدث خطأ أثناء التراجع عن الدفعة"),
  });

  // ============================================================================
  // 💡 Calculations & Logic
  // ============================================================================
  const activeEmployees = employees.filter((e) => e.status === "active");
  const currentMonthStr = "2026-03";
  const totalSalariesThisMonth = salaryRecords
    .filter((s) => s.period === currentMonthStr)
    .reduce((sum, s) => sum + s.roundedAmount, 0);
  const totalPaidThisMonth = salaryRecords
    .filter((s) => s.period === currentMonthStr)
    .reduce((sum, s) => sum + s.paidAmount, 0);
  const totalRemainingThisMonth = salaryRecords
    .filter((s) => s.period === currentMonthStr)
    .reduce((sum, s) => sum + s.remainingAmount, 0);

  const filteredEmployees = employees.filter((emp) => {
    const matchSearch =
      !searchTerm ||
      emp.name.includes(searchTerm) ||
      emp.phone.includes(searchTerm);
    const matchStatus = filterStatus === "all" || emp.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filteredSalaries = salaryRecords.filter((sal) => {
    return (
      !searchTerm ||
      sal.employeeName?.includes(searchTerm) ||
      sal.period.includes(searchTerm)
    );
  });

  const filteredPayments = paymentTransactions.filter((txn) => {
    return (
      !searchTerm ||
      txn.notes?.includes(searchTerm) ||
      txn.salaryRecordId?.includes(searchTerm)
    );
  });

  const salaryCalculation = useMemo(() => {
    const emp = employees.find((e) => e.id === salEmpId);
    if (!emp || !emp.monthlySalary) return null;

    let daysCount = 0;
    let daysInMonth = 30;

    if (salDateMode === "month" && salMonth) {
      const [year, month] = salMonth.split("-").map(Number);
      daysInMonth = getDaysInMonth(year, month);
      daysCount = daysInMonth;
    } else if (salDateMode === "custom" && salStartDate && salEndDate) {
      daysCount = daysBetween(salStartDate, salEndDate);
      const startMonth = new Date(salStartDate).getMonth() + 1;
      const startYear = new Date(salStartDate).getFullYear();
      daysInMonth = getDaysInMonth(startYear, startMonth);
    }

    if (daysCount <= 0) return null;

    const dailyRate = emp.monthlySalary / daysInMonth;
    const grossAmount = dailyRate * daysCount;
    const deductions = parseFloat(salDeductions) || 0;
    const netAmount = grossAmount - deductions;
    const adjustment = parseFloat(salAdjustment) || 0; // 💡 التسوية (موجب أو سالب)
    const roundedAmount = netAmount + adjustment;

    return {
      daysCount,
      daysInMonth,
      dailyRate,
      grossAmount,
      deductions,
      adjustment,
      netAmount,
      roundedAmount,
    };
  }, [
    salEmpId,
    salDateMode,
    salMonth,
    salStartDate,
    salEndDate,
    salDeductions,
    salAdjustment,
    employees,
  ]);

  // ============================================================================
  // 💡 Handlers
  // ============================================================================
  const handleAddEmployee = () => {
    if (!empForm.name || !empForm.phoneWithoutCode || !empForm.monthlySalary) {
      return toast.error("يرجى تعبئة الحقول الأساسية (الاسم، الجوال، الراتب)");
    }
    const finalPhone = `${empForm.phoneCode}${empForm.phoneWithoutCode}`;
    saveEmployeeMutation.mutate({ ...empForm, phone: finalPhone });
  };

  const handleCreateSalary = () => {
    if (!salEmpId || !salaryCalculation)
      return toast.error("يرجى إكمال بيانات الراتب");
    const emp = employees.find((e) => e.id === salEmpId);
    let period =
      salDateMode === "month" ? salMonth : salStartDate.substring(0, 7);

    const payload = {
      employeeId: emp.id,
      employeeName: emp.name,
      period,
      startDate: salDateMode === "month" ? `${salMonth}-01` : salStartDate,
      endDate:
        salDateMode === "month"
          ? `${salMonth}-${salaryCalculation.daysInMonth}`
          : salEndDate,
      daysCount: salaryCalculation.daysCount,
      dailyRate: salaryCalculation.dailyRate,
      grossAmount: salaryCalculation.grossAmount,
      deductions: salaryCalculation.deductions,
      netAmount: salaryCalculation.netAmount,
      roundedAmount: salaryCalculation.roundedAmount,
      paymentType: salType,
    };
    createSalaryMutation.mutate(payload);
  };

  const handlePayment = () => {
    if (!selectedSalaryRecord)
      return toast.error("يرجى تحديد الراتب المستحق للدفع");
    const amount = parseFloat(payAmount);
    if (!amount || !payDate || !payTime)
      return toast.error("يرجى تعبئة بيانات الدفع");
    if (amount > selectedSalaryRecord.remainingAmount)
      return toast.error("المبلغ أكبر من المتبقي");

    const payload = {
      salaryRecordId: selectedSalaryRecord.id,
      amount,
      paymentMethod: payMethod,
      paymentDate: payDate,
      paymentTime: payTime,
      currency: payCurrency,
      notes: payNotes,
      isPartial: payIsPartial || amount < selectedSalaryRecord.remainingAmount,
      file: payAttachment,
    };
    paySalaryMutation.mutate(payload);
  };

  const openEditEmployee = (emp) => {
    setEditEmployee(emp);
    let pCode = "+966",
      pNum = emp.phone || "";
    if (emp.phone?.startsWith("+")) {
      const matched = COUNTRY_CODES.find((c) => emp.phone.startsWith(c.code));
      if (matched) {
        pCode = matched.code;
        pNum = emp.phone.slice(matched.code.length);
      }
    }
    setEmpForm({
      ...empForm,
      name: emp.name,
      phoneCode: pCode,
      phoneWithoutCode: pNum,
      email: emp.email,
      nationalId: emp.nationalId,
      monthlySalary: emp.monthlySalary,
      status: emp.status,
      jobTitle: emp.jobTitle,
    });
    setShowAddEmployeeModal(true);
  };

  const closeAddEmployeeModal = () => {
    setShowAddEmployeeModal(false);
    setEditEmployee(null);
    setEmpForm(initialEmpForm);
  };

  const closeCreateSalaryModal = () => {
    setShowCreateSalaryModal(false);
    setSalEmpId("");
    setSalMonth("");
    setSalStartDate("");
    setSalEndDate("");
    setSalDeductions("");
    setSalAdjustment("");
  };

  const openPaymentModal = (record = null) => {
    setSelectedSalaryRecord(record);
    if (record) {
      setPayAmount(String(record.remainingAmount));
    } else {
      setPayAmount("");
    }
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayTime(new Date().toTimeString().substring(0, 5));
    setPayIsPartial(false);
    setPayCustomPercentage("");
    setPayAttachment(null);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedSalaryRecord(null);
    setPayAmount("");
    setPayNotes("");
    setPayAttachment(null);
  };

  // 💡 طباعة تقرير الدفعات المعروضة
  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>تقرير الدفعات</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px; }
            th { background-color: #f3f4f6; }
            .header { text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>تقرير دفعات المتعاونين الخارجيين</h2>
            <p>الفترة: ${filterMonth === "all" ? "الكل" : filterMonth}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>المرجع</th>
                <th>رقم الراتب</th>
                <th>المبلغ (ر.س)</th>
                <th>طريقة الدفع</th>
                <th>التاريخ</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPayments
                .map(
                  (txn) => `
                <tr>
                  <td>${txn.id.slice(-6)}</td>
                  <td>${txn.salaryRecordId?.slice(-6) || "—"}</td>
                  <td>${txn.amount.toLocaleString()}</td>
                  <td>${txn.paymentMethod === "cash" ? "نقدي" : txn.paymentMethod === "bank" ? "بنكي" : "تحويل"}</td>
                  <td>${txn.paymentDate}</td>
                  <td>${txn.notes || "—"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <script>
            window.print();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 💡 طباعة سند صرف نقدي
  const handlePrintCashReceipt = () => {
    if (!selectedSalaryRecord || !payAmount) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>سند صرف نقدي</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            .receipt-box { border: 2px solid #333; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px; }
            .label { font-weight: bold; color: #555; }
            .value { font-weight: bold; font-size: 16px; border-bottom: 1px border-dotted #999; flex: 1; margin-right: 10px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; }
            .sig-line { border-top: 1px solid #333; width: 150px; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <h2>سند صرف نقدي / مستحقات متعاون</h2>
              <p>تاريخ السند: ${payDate}</p>
            </div>
            <div class="row">
              <span class="label">اصرفوا للأستاذ/ة:</span>
              <span class="value">${selectedSalaryRecord.employeeName}</span>
            </div>
            <div class="row">
              <span class="label">مبلغ وقدره:</span>
              <span class="value">${parseFloat(payAmount).toLocaleString()} ريال سعودي</span>
            </div>
            <div class="row">
              <span class="label">وذلك عبارة عن:</span>
              <span class="value">مستحقات الفترة (${selectedSalaryRecord.period}) ${payNotes ? `- ${payNotes}` : ""}</span>
            </div>
            <div class="signatures">
              <div>
                <span>المحاسب/المدير</span>
                <div class="sig-line"></div>
              </div>
              <div>
                <span>توقيع المستلم (المقر بما فيه)</span>
                <div class="sig-line"></div>
              </div>
            </div>
          </div>
          <script>
            window.print();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isPersonsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div
      className="p-3 space-y-3 font-sans bg-[var(--wms-bg-0)] min-h-screen"
      dir="rtl"
    >
      {/* Disclaimer */}
      <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-blue-900" style={{ fontSize: 11, lineHeight: 1.5 }}>
          {OUTSOURCE_UI.DISCLAIMER}
        </p>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center gap-5 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
        {[
          {
            label: "إجمالي المتعاونين",
            value: employees.length,
            color: "text-blue-600",
            isCount: true,
          },
          {
            label: "النشطون",
            value: activeEmployees.length,
            color: "text-green-600",
            isCount: true,
          },
          {
            label: "رواتب الشهر الحالي",
            value: totalSalariesThisMonth,
            color: "text-blue-600",
            isCount: false,
          },
          {
            label: "المدفوع",
            value: totalPaidThisMonth,
            color: "text-green-600",
            isCount: false,
          },
          {
            label: "المتبقي",
            value: totalRemainingThisMonth,
            color: "text-orange-500",
            isCount: false,
          },
        ].map((item, idx) => (
          <div key={item.label} className="flex items-center gap-3 shrink-0">
            {idx > 0 && <div className="w-px h-6 bg-gray-200" />}
            <div>
              <div className="text-gray-500 font-bold" style={{ fontSize: 10 }}>
                {item.label}
              </div>
              <div
                className={`font-mono font-black ${item.color}`}
                style={{ fontSize: 15 }}
              >
                {item.isCount
                  ? item.value
                  : maskAmount(item.value.toLocaleString())}
                {!item.isCount && (
                  <span
                    className="text-gray-500 font-normal"
                    style={{ fontSize: 10 }}
                  >
                    {" "}
                    ر.س
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 bg-white rounded-t-lg px-2 pt-2">
        {[
          { id: "employees", label: "المتعاونين", icon: Users },
          { id: "salaries", label: "الرواتب والمستحقات", icon: Calculator },
          { id: "payments", label: "سجل الدفعات", icon: Banknote },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-md text-[12px] font-bold border-b-2 transition-colors ${isActive ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 bg-white p-2 border-x border-gray-200 flex-wrap">
        {activeTab === "employees" && (
          <button
            onClick={() => setShowAddEmployeeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white font-bold text-[11px] shadow-sm hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" /> <span>إضافة متعاون</span>
          </button>
        )}

        {activeTab === "salaries" && (
          <button
            onClick={() => setShowCreateSalaryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white font-bold text-[11px] shadow-sm hover:bg-emerald-700"
          >
            <DollarSign className="w-3.5 h-3.5" /> <span>تسجيل راتب/مستحق</span>
          </button>
        )}

        {activeTab === "payments" && (
          <>
            <button
              onClick={() => openPaymentModal(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white font-bold text-[11px] shadow-sm hover:bg-emerald-700"
            >
              <Plus className="w-3.5 h-3.5" /> <span>إضافة دفعة جديدة</span>
            </button>
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 font-bold text-[11px] shadow-sm hover:bg-gray-50"
            >
              <Printer className="w-3.5 h-3.5" />{" "}
              <span>طباعة تقرير الدفعات</span>
            </button>
          </>
        )}

        <div className="flex-1" />

        <div className="relative w-full max-w-[200px]">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md pr-8 pl-3 py-1.5 text-xs outline-none focus:border-blue-500"
            placeholder="بحث..."
          />
        </div>

        {activeTab === "employees" && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-xs outline-none bg-white"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
        )}

        {(activeTab === "salaries" || activeTab === "payments") && (
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-xs outline-none bg-white"
          >
            <option value="all">جميع الفترات</option>
            {MONTHS_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. Employees Tab */}
      {activeTab === "employees" && (
        <div className="bg-white border border-gray-200 rounded-b-lg overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-right text-[11px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "الكود",
                  "الاسم",
                  "الوظيفة",
                  "الجوال",
                  "الراتب الشهري",
                  "تاريخ الانضمام",
                  "الحالة",
                  "إجراءات",
                ].map((th) => (
                  <th
                    key={th}
                    className="px-4 py-3 font-bold text-gray-600 whitespace-nowrap"
                  >
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-8 text-gray-400 font-bold"
                  >
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, i) => (
                  <tr
                    key={emp.id}
                    className={`border-b border-gray-100 hover:bg-blue-50/30 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                  >
                    <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap">
                      {emp.personCode || emp.id.slice(-5)}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800 whitespace-nowrap">
                      {maskName(emp.name)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{emp.jobTitle}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 whitespace-nowrap">
                      {emp.phone}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {maskAmount(emp.monthlySalary.toLocaleString())} ر.س
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap">
                      {emp.joinDate}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap ${emp.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {emp.status === "active" ? "نشط" : "غير نشط"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditEmployee(emp)}
                          className="p-1.5 rounded hover:bg-amber-100 text-amber-600 transition-colors"
                          title="تعديل"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("حذف الموظف؟"))
                              deleteEmployeeMutation.mutate(emp.id);
                          }}
                          className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. Salaries Tab */}
      {activeTab === "salaries" && (
        <div className="bg-white border border-gray-200 rounded-b-lg overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-right text-[11px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "الرقم",
                  "الموظف",
                  "الفترة",
                  "الأيام",
                  "الراتب الأساسي",
                  "تسوية/تقريب",
                  "الصافي",
                  "المدفوع",
                  "المتبقي",
                  "الحالة",
                  "إجراء",
                ].map((th) => (
                  <th
                    key={th}
                    className="px-3 py-3 font-bold text-gray-600 whitespace-nowrap"
                  >
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isSalariesLoading ? (
                <tr>
                  <td colSpan="11" className="text-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : filteredSalaries.length === 0 ? (
                <tr>
                  <td
                    colSpan="11"
                    className="text-center py-8 text-gray-400 font-bold"
                  >
                    لا توجد رواتب مسجلة
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((sal, i) => (
                  <tr
                    key={sal.id}
                    className={`border-b border-gray-100 hover:bg-blue-50/30 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                  >
                    <td className="px-3 py-2.5 font-mono text-gray-500 whitespace-nowrap">
                      {sal.id.slice(-6)}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-gray-800 whitespace-nowrap">
                      {maskName(sal.employeeName)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 font-mono whitespace-nowrap">
                      <div className="font-bold">{sal.period}</div>
                    </td>
                    <td className="px-3 py-2.5 font-bold text-center">
                      {sal.daysCount}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold whitespace-nowrap">
                      {maskAmount(sal.grossAmount.toLocaleString())}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-gray-600 whitespace-nowrap text-[10px]">
                      {sal.deductions > 0 ? (
                        <span className="text-red-500 block">
                          خصم: {sal.deductions}
                        </span>
                      ) : null}
                      {sal.roundedAmount -
                        (sal.grossAmount - sal.deductions) !==
                      0 ? (
                        <span className="text-blue-500 block">
                          تسوية:{" "}
                          {(
                            sal.roundedAmount -
                            (sal.grossAmount - sal.deductions)
                          ).toFixed(2)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-black text-blue-800 whitespace-nowrap">
                      {maskAmount(sal.roundedAmount.toLocaleString())}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-green-600 whitespace-nowrap">
                      {maskAmount(sal.paidAmount.toLocaleString())}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-orange-600 whitespace-nowrap">
                      {sal.remainingAmount > 0
                        ? maskAmount(sal.remainingAmount.toLocaleString())
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold ${sal.status === "paid" ? "bg-green-100 text-green-700" : sal.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}
                      >
                        {sal.status === "paid"
                          ? "مدفوع"
                          : sal.status === "partial"
                            ? "جزئي"
                            : "لم يُدفع"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {sal.status !== "paid" && (
                          <button
                            onClick={() => openPaymentModal(sal)}
                            className="px-2 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white rounded text-[10px] font-bold transition-colors"
                          >
                            دفع
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setDetailsRecord({ type: "salary", data: sal });
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors border border-transparent hover:border-blue-200"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm("تأكيد حذف/تراجع عن سجل الراتب؟")
                            )
                              deleteSalaryMutation.mutate(sal.id);
                          }}
                          disabled={sal.paidAmount > 0}
                          className="p-1.5 rounded text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors border border-transparent hover:border-red-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={
                            sal.paidAmount > 0
                              ? "لا يمكن الحذف لتواجد دفعات"
                              : "حذف السجل"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. Payments Tab */}
      {activeTab === "payments" && (
        <div className="bg-white border border-gray-200 rounded-b-lg overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-right text-[11px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "المرجع",
                  "رقم الراتب",
                  "المبلغ",
                  "طريقة الدفع",
                  "التاريخ",
                  "ملاحظات",
                  "مرفق",
                  "إجراءات",
                ].map((th) => (
                  <th
                    key={th}
                    className="px-4 py-3 font-bold text-gray-600 whitespace-nowrap"
                  >
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isPaymentsLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-8 text-gray-400 font-bold"
                  >
                    لا توجد دفعات مسجلة
                  </td>
                </tr>
              ) : (
                filteredPayments.map((txn, i) => (
                  <tr
                    key={txn.id}
                    className={`border-b border-gray-100 hover:bg-blue-50/30 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                  >
                    <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap">
                      {txn.id.slice(-6)}
                    </td>
                    <td className="px-4 py-3 font-mono text-blue-600 font-bold whitespace-nowrap">
                      {txn.salaryRecordId?.slice(-6) || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono font-black text-green-700 whitespace-nowrap">
                      {maskAmount(txn.amount.toLocaleString())}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-700 whitespace-nowrap">
                      {txn.paymentMethod === "cash"
                        ? "نقدي"
                        : txn.paymentMethod === "bank"
                          ? "بنكي"
                          : "تحويل"}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600 whitespace-nowrap">
                      {txn.paymentDate}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">
                      {txn.notes || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {txn.receiptUrl ? (
                        <button className="text-blue-500 hover:underline text-[10px] flex items-center gap-1 font-bold">
                          <Paperclip className="w-3 h-3" /> عرض المرفق
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400">
                          لا يوجد
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setDetailsRecord({ type: "payment", data: txn });
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                "تأكيد التراجع عن هذه الدفعة؟ (سيعود الراتب لحالته السابقة)",
                              )
                            )
                              deletePaymentMutation.mutate(txn.id);
                          }}
                          className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
                          title="تراجع / الغاء הדفع"
                        >
                          <Undo2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================= */}
      {/* 💡 Modals */}

      {/* Modal: عرض تفاصيل السجل/الدفعة */}
      {showDetailsModal && detailsRecord && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="bg-slate-800 px-5 py-4 flex items-center justify-between text-white shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                {detailsRecord.type === "salary"
                  ? "تفاصيل الراتب المستحق"
                  : "تفاصيل الدفعة المالية"}
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setDetailsRecord(null);
                }}
                className="hover:bg-white/20 p-1.5 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {detailsRecord.type === "salary" ? (
                <>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500 font-bold text-xs">
                      رقم المرجع
                    </span>{" "}
                    <span className="font-mono text-sm">
                      {detailsRecord.data.id.slice(-6)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500 font-bold text-xs">
                      الموظف
                    </span>{" "}
                    <span className="font-bold text-sm">
                      {detailsRecord.data.employeeName}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500 font-bold text-xs">
                      الفترة
                    </span>{" "}
                    <span className="font-mono text-sm">
                      {detailsRecord.data.period}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500 font-bold text-xs">
                      الإجمالي (قبل الخصم)
                    </span>{" "}
                    <span className="font-mono text-sm">
                      {detailsRecord.data.grossAmount} ر.س
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500 font-bold text-xs">
                      خصومات
                    </span>{" "}
                    <span className="font-mono text-sm text-red-500">
                      {detailsRecord.data.deductions} ر.س
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500 font-bold text-xs">
                      الصافي المعتمد
                    </span>{" "}
                    <span className="font-mono text-sm font-bold text-blue-600">
                      {detailsRecord.data.roundedAmount} ر.س
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500 font-bold text-xs">
                      إجمالي المدفوع
                    </span>{" "}
                    <span className="font-mono text-sm text-green-600">
                      {detailsRecord.data.paidAmount} ر.س
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold text-xs">
                      المتبقي
                    </span>{" "}
                    <span className="font-mono text-sm text-orange-600">
                      {detailsRecord.data.remainingAmount} ر.س
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500 font-bold text-xs">
                      رقم الدفعة
                    </span>{" "}
                    <span className="font-mono text-sm">
                      {detailsRecord.data.id.slice(-6)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500 font-bold text-xs">
                      مرتبطة براتب رقم
                    </span>{" "}
                    <span className="font-mono text-sm text-blue-600">
                      {detailsRecord.data.salaryRecordId?.slice(-6)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500 font-bold text-xs">
                      المبلغ
                    </span>{" "}
                    <span className="font-mono text-sm font-bold text-green-600">
                      {detailsRecord.data.amount} ر.س
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500 font-bold text-xs">
                      الطريقة
                    </span>{" "}
                    <span className="font-bold text-sm">
                      {detailsRecord.data.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500 font-bold text-xs">
                      التاريخ والوقت
                    </span>{" "}
                    <span className="font-mono text-sm">
                      {detailsRecord.data.paymentDate} -{" "}
                      {detailsRecord.data.paymentTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold text-xs">
                      ملاحظات
                    </span>{" "}
                    <span className="text-sm">
                      {detailsRecord.data.notes || "—"}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-end shrink-0">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setDetailsRecord(null);
                }}
                className="px-5 py-2 bg-white border rounded-lg text-xs font-bold text-gray-600"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Payment (صرف المستحقات الذكي) */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-blue-700 px-5 py-4 flex items-center justify-between text-white shrink-0">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-blue-300" /> صرف وتسديد راتب
                </h3>
                {selectedSalaryRecord && (
                  <span className="text-[10px] text-blue-200 mt-1 block">
                    لصالح: {selectedSalaryRecord.employeeName} | فترة:{" "}
                    {selectedSalaryRecord.period}
                  </span>
                )}
              </div>
              <button
                onClick={closePaymentModal}
                className="hover:bg-white/20 p-1.5 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar-slim flex-1">
              {/* 💡 إذا لم يكن هناك راتب محدد، نعرض قائمة لاختيار الراتب */}
              {!selectedSalaryRecord ? (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                  <label className="block text-xs font-bold text-blue-900 mb-2">
                    اختر الراتب المستحق للدفع *
                  </label>
                  <select
                    onChange={(e) => {
                      const sal = salaryRecords.find(
                        (s) => s.id === e.target.value,
                      );
                      setSelectedSalaryRecord(sal);
                      if (sal) setPayAmount(String(sal.remainingAmount));
                    }}
                    className="w-full border border-blue-300 p-2.5 rounded-lg text-sm font-bold bg-white outline-none focus:border-blue-600"
                  >
                    <option value="">-- اختر من الرواتب المعلقة --</option>
                    {salaryRecords
                      .filter((s) => s.status !== "paid")
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.employeeName} - {s.period} (متبقي:{" "}
                          {s.remainingAmount} ر.س)
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center justify-between">
                  <span className="text-orange-800 text-xs font-bold">
                    المتبقي من الراتب (المستحق):
                  </span>
                  <span className="font-mono text-xl font-black text-orange-600">
                    {selectedSalaryRecord.remainingAmount.toLocaleString()} ر.س
                  </span>
                </div>
              )}

              {/* إذا تم اختيار راتب، نظهر باقي الحقول */}
              {selectedSalaryRecord && (
                <>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-blue-600 w-4 h-4"
                        checked={payIsPartial}
                        onChange={(e) => {
                          setPayIsPartial(e.target.checked);
                          if (!e.target.checked)
                            setPayAmount(
                              String(selectedSalaryRecord.remainingAmount),
                            );
                          else
                            setPayAmount(
                              String(
                                Math.round(
                                  selectedSalaryRecord.remainingAmount * 0.5,
                                ),
                              ),
                            );
                        }}
                      />
                      <span className="text-sm font-bold text-gray-800">
                        صرف دفعة جزئية (سلفة أو مقطوع)
                      </span>
                    </label>

                    {payIsPartial && (
                      <div className="space-y-3 pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={payCustomPercentage}
                            placeholder="نسبة..."
                            onChange={(e) => {
                              setPayCustomPercentage(e.target.value);
                              const p = parseFloat(e.target.value) || 0;
                              if (p > 0 && p <= 100)
                                setPayAmount(
                                  String(
                                    Math.round(
                                      selectedSalaryRecord.remainingAmount *
                                        (p / 100),
                                    ),
                                  ),
                                );
                            }}
                            className="w-20 border p-2 rounded-lg text-sm font-mono outline-none focus:border-blue-500 text-center"
                          />
                          <span className="font-bold text-gray-500">
                            % من المتبقي
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      المبلغ الفعلي للصرف (ر.س) *
                    </label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      disabled={!payIsPartial}
                      className="w-full border border-gray-300 p-3 rounded-xl text-lg font-mono font-bold text-blue-700 focus:border-blue-500 outline-none disabled:bg-gray-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        طريقة الدفع
                      </label>
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value)}
                        className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="bank">تحويل بنكي</option>
                        <option value="cash">نقدي (كاش)</option>
                        <option value="transfer">ويسترن يونيون / حوالة</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        تاريخ الصرف
                      </label>
                      <input
                        type="date"
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold outline-none focus:border-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      المرجع / ملاحظات
                    </label>
                    <input
                      type="text"
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500"
                      placeholder="رقم الحوالة، اسم المستلم..."
                    />
                  </div>

                  {/* 💡 إرفاق صورة حوالة أو مستند */}
                  <div className="pt-2">
                    <label className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors">
                      <Upload className="w-4 h-4" />
                      {payAttachment
                        ? payAttachment.name
                        : "إرفاق صورة الحوالة أو سند الدفع (اختياري)"}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => setPayAttachment(e.target.files[0])}
                        accept="image/*,application/pdf"
                      />
                    </label>
                  </div>

                  {/* 💡 طباعة سند للموظف عند الدفع النقدي */}
                  {payMethod === "cash" && payAmount > 0 && (
                    <button
                      onClick={handlePrintCashReceipt}
                      className="w-full flex items-center justify-center gap-2 p-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 border border-gray-300 transition-colors"
                    >
                      <Printer className="w-4 h-4" /> طباعة سند صرف نقدي لتوقيع
                      الموظف
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2 shrink-0">
              <button
                onClick={closePaymentModal}
                className="px-5 py-2 bg-white border rounded-lg text-xs font-bold text-gray-600"
              >
                إلغاء
              </button>
              <button
                onClick={handlePayment}
                disabled={paySalaryMutation.isPending || !selectedSalaryRecord}
                className="px-8 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {paySalaryMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                تأكيد الدفع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: إضافة/تعديل موظف أوتسورس */}
      {showAddEmployeeModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-800 px-5 py-4 flex items-center justify-between text-white shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                {editEmployee
                  ? "تعديل بيانات الموظف"
                  : "إضافة موظف أوتسورس جديد"}
              </h3>
              <button
                onClick={closeAddEmployeeModal}
                className="hover:bg-white/20 p-1.5 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar-slim flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  value={empForm.name}
                  onChange={(e) =>
                    setEmpForm({ ...empForm, name: e.target.value })
                  }
                  className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-blue-500"
                  placeholder="الاسم الرباعي"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    المسمى الوظيفي
                  </label>
                  <input
                    type="text"
                    value={empForm.jobTitle}
                    onChange={(e) =>
                      setEmpForm({ ...empForm, jobTitle: e.target.value })
                    }
                    className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-blue-500"
                    placeholder="مثال: مبرمج واجهات"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    الراتب الشهري المتفق عليه (ر.س) *
                  </label>
                  <input
                    type="number"
                    value={empForm.monthlySalary}
                    onChange={(e) =>
                      setEmpForm({ ...empForm, monthlySalary: e.target.value })
                    }
                    className="w-full border p-2.5 rounded-lg text-sm font-mono font-bold outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    رقم الجوال *
                  </label>
                  <div className="flex" dir="ltr">
                    <select
                      value={empForm.phoneCode}
                      onChange={(e) =>
                        setEmpForm({ ...empForm, phoneCode: e.target.value })
                      }
                      className="bg-gray-100 border rounded-l-lg px-2 text-xs font-mono outline-none w-20"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code}
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
                      className="flex-1 border rounded-r-lg px-3 py-2 text-sm font-mono outline-none focus:border-blue-500"
                      placeholder="5XXXXXXXX"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={empForm.email}
                    onChange={(e) =>
                      setEmpForm({ ...empForm, email: e.target.value })
                    }
                    className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 text-left"
                    dir="ltr"
                    placeholder="email@domain.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    رقم الهوية / الجواز
                  </label>
                  <input
                    type="text"
                    value={empForm.nationalId}
                    onChange={(e) =>
                      setEmpForm({ ...empForm, nationalId: e.target.value })
                    }
                    className="w-full border p-2.5 rounded-lg text-sm font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    حالة الموظف
                  </label>
                  <select
                    value={empForm.status}
                    onChange={(e) =>
                      setEmpForm({ ...empForm, status: e.target.value })
                    }
                    className="w-full border p-2.5 rounded-lg text-sm font-bold outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="active">نشط (يعمل حالياً)</option>
                    <option value="inactive">غير نشط (متوقف)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2 shrink-0">
              <button
                onClick={closeAddEmployeeModal}
                className="px-5 py-2 bg-white border rounded-lg text-xs font-bold text-gray-600"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddEmployee}
                disabled={saveEmployeeMutation.isPending}
                className="px-8 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saveEmployeeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                حفظ بيانات الموظف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: تسجيل راتب جديد */}
      {showCreateSalaryModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-emerald-700 px-5 py-4 flex items-center justify-between text-white shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-300" /> حساب وتسجيل
                راتب
              </h3>
              <button
                onClick={closeCreateSalaryModal}
                className="hover:bg-white/20 p-1.5 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar-slim flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  اختر الموظف *
                </label>
                <select
                  value={salEmpId}
                  onChange={(e) => setSalEmpId(e.target.value)}
                  className="w-full border p-2.5 rounded-lg text-sm font-bold bg-gray-50 outline-none focus:border-emerald-500"
                >
                  <option value="">-- اختر من القائمة --</option>
                  {activeEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} (راتب: {e.monthlySalary} ر.س)
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  طريقة حساب الفترة
                </label>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSalDateMode("month")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${salDateMode === "month" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"}`}
                  >
                    شهر ميلادي كامل
                  </button>
                  <button
                    onClick={() => setSalDateMode("custom")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${salDateMode === "custom" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"}`}
                  >
                    فترة مخصصة باليوم
                  </button>
                </div>

                {salDateMode === "month" ? (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">
                      اختر الشهر
                    </label>
                    <select
                      value={salMonth}
                      onChange={(e) => setSalMonth(e.target.value)}
                      className="w-full border p-2 rounded-lg text-sm outline-none focus:border-emerald-500 bg-white"
                    >
                      <option value="">-- الشهر --</option>
                      {MONTHS_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">
                        من تاريخ
                      </label>
                      <input
                        type="date"
                        value={salStartDate}
                        onChange={(e) => setSalStartDate(e.target.value)}
                        className="w-full border p-2 rounded-lg text-sm outline-none focus:border-emerald-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">
                        إلى تاريخ
                      </label>
                      <input
                        type="date"
                        value={salEndDate}
                        onChange={(e) => setSalEndDate(e.target.value)}
                        className="w-full border p-2 rounded-lg text-sm outline-none focus:border-emerald-500 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {salaryCalculation && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-sm border-b border-blue-200 pb-2">
                    <Calculator className="w-4 h-4" /> الحاسبة التلقائية
                    (معاينة)
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">راتب الشهر الكامل:</span>
                      <span className="font-mono font-bold">
                        {
                          employees.find((e) => e.id === salEmpId)
                            ?.monthlySalary
                        }{" "}
                        ر.س
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        عدد أيام الشهر المرجعي:
                      </span>
                      <span className="font-mono font-bold">
                        {salaryCalculation.daysInMonth} يوم
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">راتب اليوم الواحد:</span>
                      <span className="font-mono font-bold">
                        {salaryCalculation.dailyRate.toFixed(2)} ر.س
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-bold">
                        أيام العمل المحسوبة:
                      </span>
                      <span className="font-mono font-bold text-blue-700">
                        {salaryCalculation.daysCount} يوم
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="font-bold text-gray-800 text-sm">
                      الإجمالي المستحق (قبل الخصم):
                    </span>
                    <span className="font-mono font-black text-blue-800 text-lg">
                      {salaryCalculation.grossAmount.toFixed(2)} ر.س
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    خصومات (ر.س)
                  </label>
                  <input
                    type="number"
                    value={salDeductions}
                    onChange={(e) => setSalDeductions(e.target.value)}
                    className="w-full border p-2.5 rounded-lg text-sm font-mono outline-none focus:border-red-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    تسوية إضافية (موجب للزيادة، سالب للخصم)
                  </label>
                  <input
                    type="number"
                    value={salAdjustment}
                    onChange={(e) => setSalAdjustment(e.target.value)}
                    className="w-full border p-2.5 rounded-lg text-sm font-mono outline-none focus:border-emerald-500 bg-white"
                    placeholder="مثال: +50 أو -20"
                  />
                </div>
              </div>

              {salaryCalculation && (
                <div className="bg-emerald-50 border-2 border-emerald-500 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-emerald-900 font-black text-sm">
                      صافي الراتب المستحق (النهائي)
                    </div>
                    {salDeductions > 0 && (
                      <div className="text-[10px] text-red-600 mt-0.5">
                        تم خصم {salDeductions} ر.س
                      </div>
                    )}
                    {salaryCalculation.adjustment !== 0 && (
                      <div className="text-[10px] text-blue-600 mt-0.5">
                        تسوية: {salaryCalculation.adjustment > 0 ? "+" : ""}
                        {salaryCalculation.adjustment} ر.س
                      </div>
                    )}
                  </div>
                  <div className="font-mono font-black text-2xl text-emerald-700">
                    {salaryCalculation.roundedAmount.toLocaleString()}{" "}
                    <span className="text-xs">ر.س</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2 shrink-0">
              <button
                onClick={closeCreateSalaryModal}
                className="px-5 py-2 bg-white border rounded-lg text-xs font-bold text-gray-600"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateSalary}
                disabled={createSalaryMutation.isPending || !salaryCalculation}
                className="px-8 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {createSalaryMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                اعتماد الراتب كمديونية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
