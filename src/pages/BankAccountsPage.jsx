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
  Info,
  CodeXml,
  Loader2,
  Save,
  Printer,
  ChevronDown,
  UserPlus,
  Landmark,
  FileText,
  Edit3,
  Trash2,
} from "lucide-react";

const BankAccountsPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Modals States
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Forms States
  const initialAccountForm = {
    bankName: "",
    accountName: "",
    accountNumber: "",
    iban: "",
    openedById: "",
    openDate: "",
    controlledById: "",
    authorizedPersons: "",
    initialBalance: "",
    initialBalanceDate: "",
    initialBalanceNotes: "",
  };
  const [accountForm, setAccountForm] = useState(initialAccountForm);

  const initialRechargeForm = {
    partnerId: "",
    amount: "",
    accountId: "",
    date: "",
    notes: "",
  };
  const [rechargeForm, setRechargeForm] = useState(initialRechargeForm);

  // ==========================================
  // 1. Queries (جلب البيانات)
  // ==========================================
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const res = await api.get("/bank-accounts");
      return res.data?.data || [];
    },
  });

  const { data: persons = [] } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => {
      const res = await api.get("/persons");
      return res.data?.data || [];
    },
  });

  // ==========================================
  // 2. Mutations (العمليات)
  // ==========================================
  const saveAccountMutation = useMutation({
    mutationFn: async (payload) => {
      if (modalMode === "add") return await api.post("/bank-accounts", payload);
      return await api.put(`/bank-accounts/${selectedAccountId}`, payload);
    },
    onSuccess: () => {
      toast.success(
        modalMode === "add"
          ? "تمت إضافة الحساب بنجاح"
          : "تم تعديل الحساب بنجاح",
      );
      queryClient.invalidateQueries(["bank-accounts"]);
      setIsAddAccountOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || "حدث خطأ"),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/bank-accounts/${id}`),
    onSuccess: () => {
      toast.success("تم حذف الحساب البنكي بنجاح");
      queryClient.invalidateQueries(["bank-accounts"]);
    },
    onError: (err) => toast.error(err.response?.data?.message || "حدث خطأ"),
  });

  const rechargeMutation = useMutation({
    mutationFn: async (payload) =>
      await api.post("/bank-accounts/recharge", payload),
    onSuccess: () => {
      toast.success("تم تسجيل الشحن الشخصي بنجاح");
      queryClient.invalidateQueries(["bank-accounts"]);
      setIsRechargeOpen(false);
      setRechargeForm(initialRechargeForm);
    },
    onError: (err) => toast.error(err.response?.data?.message || "حدث خطأ"),
  });

  // ==========================================
  // 3. Handlers
  // ==========================================
  const handleOpenAdd = () => {
    setModalMode("add");
    setAccountForm(initialAccountForm);
    setIsAddAccountOpen(true);
  };

  const handleOpenEdit = (acc) => {
    setModalMode("edit");
    setSelectedAccountId(acc.id);
    setAccountForm({
      bankName: acc.bankName,
      accountName: acc.accountName || "",
      accountNumber: acc.accountNumber,
      iban: acc.iban || "",
      openedById: acc.openedById || "",
      openDate: acc.openDate ? acc.openDate.split("T")[0] : "",
      controlledById: acc.controlledById || "",
      authorizedPersons: acc.authorizedPersons || "",
      initialBalance: acc.initialBalance,
      initialBalanceDate: acc.initialBalanceDate
        ? acc.initialBalanceDate.split("T")[0]
        : "",
      initialBalanceNotes: acc.initialBalanceNotes || "",
    });
    setIsAddAccountOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الحساب البنكي؟")) {
      deleteAccountMutation.mutate(id);
    }
  };

  const handleSaveAccount = () => {
    if (
      !accountForm.bankName ||
      !accountForm.accountNumber ||
      accountForm.initialBalance === ""
    ) {
      return toast.error(
        "الرجاء إكمال الحقول الإلزامية (البنك، رقم الحساب، الرصيد)",
      );
    }
    saveAccountMutation.mutate(accountForm);
  };

  const handleRecharge = () => {
    if (
      !rechargeForm.partnerId ||
      !rechargeForm.amount ||
      !rechargeForm.accountId
    ) {
      return toast.error("الرجاء إكمال الحقول الإلزامية");
    }
    rechargeMutation.mutate(rechargeForm);
  };

  // ==========================================
  // 4. Stats & Filters
  // ==========================================
  const filteredAccounts = useMemo(() => {
    if (!searchQuery) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter(
      (acc) =>
        acc.bankName.toLowerCase().includes(q) || acc.accountNumber.includes(q),
    );
  }, [accounts, searchQuery]);

  const stats = useMemo(() => {
    return accounts.reduce(
      (acc, curr) => {
        acc.total += curr.totalBalance;
        acc.system += curr.systemBalance;
        acc.external += curr.externalBalance;
        return acc;
      },
      { total: 0, system: 0, external: 0 },
    );
  }, [accounts]);

  const taxEstimate = stats.total * 0.15;

  return (
    <div
      className="p-3 flex flex-col h-full overflow-hidden bg-[var(--wms-bg-0)] font-sans"
      dir="rtl"
    >
      <div className="space-y-3 flex-1 flex flex-col min-h-0">
        {/* التقدير الضريبي العلوي */}
        <div
          className="flex items-center gap-4 p-3 rounded-lg border shrink-0"
          style={{
            backgroundColor: "rgba(59, 130, 246, 0.04)",
            borderColor: "rgba(59, 130, 246, 0.15)",
          }}
        >
          <div className="flex items-center gap-6 flex-1">
            <div>
              <div
                className="text-[var(--wms-text-muted)]"
                style={{ fontSize: "10px" }}
              >
                إجمالي الرصيد البنكي
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--wms-accent-blue)",
                }}
              >
                {stats.total.toLocaleString()}
              </div>
            </div>
            <div>
              <div
                className="text-[var(--wms-text-muted)]"
                style={{ fontSize: "10px" }}
              >
                المبلغ الخاضع للتقدير
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--wms-warning)",
                }}
              >
                {stats.total.toLocaleString()}
              </div>
            </div>
            <div>
              <div
                className="text-[var(--wms-text-muted)]"
                style={{ fontSize: "10px" }}
              >
                النسبة التقديرية
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--wms-warning)",
                }}
              >
                15%
              </div>
            </div>
            <div>
              <div
                className="text-[var(--wms-text-muted)]"
                style={{ fontSize: "10px" }}
              >
                قيمة التقدير الضريبي
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--wms-warning)",
                }}
              >
                {taxEstimate.toLocaleString()}
              </div>
            </div>
          </div>
          <div
            className="flex items-start gap-1.5 shrink-0"
            style={{ maxWidth: "200px" }}
          >
            <Info
              className="w-3 h-3 mt-0.5 shrink-0 text-[var(--wms-text-muted)]"
              style={{ opacity: 0.5 }}
            />
            <span
              className="text-[var(--wms-text-muted)]"
              style={{ fontSize: "9px", opacity: 0.6 }}
            >
              هذا الرقم تقديري داخلي وليس احتساباً ضريبياً رسمياً
            </span>
          </div>
        </div>

        {/* شريط الأدوات */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90"
            style={{ height: "32px", fontSize: "12px" }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة حساب</span>
          </button>
          <button
            onClick={() => setIsRechargeOpen(true)}
            className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] cursor-pointer"
            style={{ height: "32px", fontSize: "12px" }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>شحن شخصي لشريك</span>
          </button>
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] cursor-pointer"
            style={{ height: "32px", fontSize: "12px" }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير</span>
          </button>
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] cursor-pointer"
            style={{ height: "32px", fontSize: "12px" }}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>معاينة</span>
          </button>
        </div>

        {/* الجدول الرئيسي */}
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
                  <th className="px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                    البنك
                  </th>
                  <th className="px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                    رقم الحساب
                  </th>
                  <th className="px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                    الرصيد الافتتاحي
                  </th>
                  <th className="px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                    رصيد النظام
                  </th>
                  <th className="px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                    الرصيد الخارجي
                  </th>
                  <th className="px-3 text-[var(--wms-text-sec)] font-semibold text-[11px]">
                    الإجمالي
                  </th>
                  <th className="px-3 text-center text-[var(--wms-text-sec)] font-semibold text-[11px]">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      لا توجد حسابات مسجلة
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc, index) => (
                    <tr
                      key={acc.id}
                      className={`border-b border-[var(--wms-border)]/30 hover:bg-[var(--wms-surface-2)]/40 transition-colors ${index % 2 === 1 ? "bg-[var(--wms-row-alt)]" : "bg-transparent"}`}
                      style={{ height: "36px" }}
                    >
                      <td className="px-3">
                        <div className="flex items-center gap-2">
                          <Landmark className="w-3.5 h-3.5 text-[var(--wms-text-muted)]" />
                          <span className="text-[var(--wms-text)] font-bold">
                            {acc.bankName}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 text-[var(--wms-text-sec)] font-mono text-[11px]">
                        {acc.accountNumber}
                      </td>
                      <td className="px-3 text-[var(--wms-text)] font-mono">
                        {acc.initialBalance.toLocaleString()}
                      </td>
                      <td className="px-3 font-mono text-[var(--wms-success)]">
                        {acc.systemBalance.toLocaleString()}
                      </td>
                      <td className="px-3 font-mono text-[var(--wms-accent-blue)]">
                        {acc.externalBalance.toLocaleString()}
                      </td>
                      <td className="px-3 text-[var(--wms-text)] font-mono font-bold">
                        {acc.totalBalance.toLocaleString()}
                      </td>
                      <td className="px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(acc)}
                            className="text-amber-500 hover:text-amber-700 transition-colors"
                            title="تعديل"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(acc.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
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
        </div>

        {/* إحصائيات سفلية */}
        <div className="flex items-center gap-6 px-4 py-2.5 bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg shrink-0 overflow-x-auto custom-scrollbar-slim">
          <div>
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              إجمالي الأرصدة البنكية
            </div>
            <div className="font-mono text-[15px] font-bold text-[var(--wms-success)]">
              {stats.total.toLocaleString()} ر.س
            </div>
          </div>
          <div className="w-px h-7 bg-[var(--wms-border)]"></div>
          <div>
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              رصيد معاملات النظام
            </div>
            <div className="font-mono text-[15px] font-bold text-[var(--wms-accent-blue)]">
              {stats.system.toLocaleString()} ر.س
            </div>
          </div>
          <div className="w-px h-7 bg-[var(--wms-border)]"></div>
          <div>
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              رصيد التفاصيل الخارجية
            </div>
            <div className="font-mono text-[15px] font-bold text-[var(--wms-warning)]">
              {stats.external.toLocaleString()} ر.س
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. Modal: إضافة/تعديل حساب بنكي */}
      {/* ========================================================================= */}
      {isAddAccountOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
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
                {modalMode === "add" ? "إضافة حساب بنكي" : "تعديل حساب بنكي"}
              </span>
              <button
                onClick={() => setIsAddAccountOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-red-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    اسم البنك *
                  </label>
                  <input
                    type="text"
                    value={accountForm.bankName}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        bankName: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none focus:border-blue-500 h-[34px] text-[12px]"
                    placeholder="مثال: البنك الأهلي"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    اسم الحساب
                  </label>
                  <input
                    type="text"
                    value={accountForm.accountName}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        accountName: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none focus:border-blue-500 h-[34px] text-[12px]"
                    placeholder="حساب جاري رئيسي"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    رقم الحساب *
                  </label>
                  <input
                    type="text"
                    value={accountForm.accountNumber}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        accountNumber: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] font-mono outline-none focus:border-blue-500 h-[34px] text-[12px]"
                    placeholder="**** 0000"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    IBAN
                  </label>
                  <input
                    type="text"
                    value={accountForm.iban}
                    onChange={(e) =>
                      setAccountForm({ ...accountForm, iban: e.target.value })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] font-mono outline-none focus:border-blue-500 h-[34px] text-[12px]"
                    placeholder="SA00 0000 0000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    من فتح الحساب
                  </label>
                  <select
                    value={accountForm.openedById}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        openedById: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] outline-none h-[34px] text-[12px] appearance-none"
                  >
                    <option value="">اختر الشخص...</option>
                    {persons.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    تاريخ فتح الحساب
                  </label>
                  <input
                    type="date"
                    value={accountForm.openDate}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        openDate: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none h-[34px] text-[12px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    تحت سيطرة من
                  </label>
                  <select
                    value={accountForm.controlledById}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        controlledById: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] outline-none h-[34px] text-[12px] appearance-none"
                  >
                    <option value="">اختر الشخص...</option>
                    {persons.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-[26px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    المخولون بالسحب (أسماء)
                  </label>
                  <input
                    type="text"
                    value={accountForm.authorizedPersons}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        authorizedPersons: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none focus:border-blue-500 h-[34px] text-[12px]"
                    placeholder="مثال: أحمد، محمد"
                  />
                </div>
              </div>

              <div className="border-t border-[var(--wms-border)] pt-3">
                <div className="text-[var(--wms-text)] mb-2 text-[12px] font-bold">
                  الرصيد الافتتاحي
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                      الرصيد الافتتاحي *
                    </label>
                    <input
                      type="number"
                      value={accountForm.initialBalance}
                      onChange={(e) =>
                        setAccountForm({
                          ...accountForm,
                          initialBalance: e.target.value,
                        })
                      }
                      className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] font-mono outline-none focus:border-blue-500 h-[34px] text-[13px]"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                      تاريخ الرصيد الافتتاحي
                    </label>
                    <input
                      type="date"
                      value={accountForm.initialBalanceDate}
                      onChange={(e) =>
                        setAccountForm({
                          ...accountForm,
                          initialBalanceDate: e.target.value,
                        })
                      }
                      className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none h-[34px] text-[12px]"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    ملاحظات
                  </label>
                  <input
                    type="text"
                    value={accountForm.initialBalanceNotes}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        initialBalanceNotes: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none h-[34px] text-[12px]"
                    placeholder="ملاحظات اختيارية"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--wms-border)]">
              <button
                onClick={() => setIsAddAccountOpen(false)}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-gray-200 text-[12px]"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveAccount}
                disabled={saveAccountMutation.isPending}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90 disabled:opacity-50 text-[12px] font-bold"
              >
                {saveAccountMutation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {modalMode === "add" ? "إضافة الحساب" : "حفظ التعديلات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Modal: شحن شخصي لشريك */}
      {/* ========================================================================= */}
      {isRechargeOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl shadow-2xl w-full max-w-[480px]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--wms-border)]">
              <span className="text-[var(--wms-text)] text-[15px] font-bold">
                شحن شخصي لشريك
              </span>
              <button
                onClick={() => setIsRechargeOpen(false)}
                className="text-[var(--wms-text-muted)] hover:text-red-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  اسم الشريك *
                </label>
                <div className="relative">
                  <select
                    value={rechargeForm.partnerId}
                    onChange={(e) =>
                      setRechargeForm({
                        ...rechargeForm,
                        partnerId: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] outline-none h-[34px] text-[12px] appearance-none"
                  >
                    <option value="">اختر الشريك...</option>
                    {persons
                      .filter((p) => p.role === "شريك")
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-[10px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  المبلغ *
                </label>
                <input
                  type="number"
                  value={rechargeForm.amount}
                  onChange={(e) =>
                    setRechargeForm({ ...rechargeForm, amount: e.target.value })
                  }
                  className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] font-mono outline-none focus:border-blue-500 h-[34px] text-[12px]"
                  placeholder="المبلغ المراد شحنه"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                  الحساب البنكي المودع فيه *
                </label>
                <div className="relative">
                  <select
                    value={rechargeForm.accountId}
                    onChange={(e) =>
                      setRechargeForm({
                        ...rechargeForm,
                        accountId: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-2 text-[var(--wms-text)] outline-none focus:border-blue-500 h-[34px] text-[12px] appearance-none"
                  >
                    <option value="">اختر الحساب البنكي...</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} - {acc.accountNumber}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-[10px] w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={rechargeForm.date}
                    onChange={(e) =>
                      setRechargeForm({ ...rechargeForm, date: e.target.value })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none h-[34px] text-[12px]"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-[var(--wms-text-sec)] text-[11px] font-bold">
                    ملاحظات
                  </label>
                  <input
                    type="text"
                    value={rechargeForm.notes}
                    onChange={(e) =>
                      setRechargeForm({
                        ...rechargeForm,
                        notes: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md px-3 text-[var(--wms-text)] outline-none h-[34px] text-[12px]"
                    placeholder="ملاحظات اختيارية"
                  />
                </div>
              </div>
              <div
                className="flex items-start gap-1.5 p-2 rounded-md border border-[var(--wms-warning)]/30"
                style={{ backgroundColor: "rgba(217, 119, 6, 0.06)" }}
              >
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--wms-warning)]" />
                <span className="text-[var(--wms-text-sec)] text-[10px]">
                  هذا الشحن يزيد رصيد البنك لكنه{" "}
                  <b className="text-[var(--wms-danger)]">
                    لا يُدخل في توزيع أرباح الشركاء
                  </b>{" "}
                  — يُصنّف كحركة شخصية غير قابلة للتوزيع.
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--wms-border)]">
              <button
                onClick={() => setIsRechargeOpen(false)}
                className="px-4 py-1.5 rounded-md bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-gray-200 text-[12px]"
              >
                إلغاء
              </button>
              <button
                onClick={handleRecharge}
                disabled={rechargeMutation.isPending}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90 disabled:opacity-50 text-[12px] font-bold"
              >
                {rechargeMutation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}{" "}
                شحن الشريك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Export Modal */}
      {isExportOpen && (
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
                تصدير تقرير البنوك
              </span>
              <button
                onClick={() => setIsExportOpen(false)}
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
                  صيغة الملف
                </label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--wms-border)] cursor-pointer hover:bg-[var(--wms-surface-2)] transition-colors">
                    <input
                      type="radio"
                      name="bankFormat"
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
                      name="bankFormat"
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
                  setIsExportOpen(false);
                  setIsPreviewOpen(true);
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
                  setIsExportOpen(false);
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
      {isPreviewOpen && (
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
                  معاينة التقرير
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
                  onClick={() => setIsPreviewOpen(false)}
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
                    تقرير الحسابات البنكية المجمعة
                  </div>
                  <div
                    className="flex items-center justify-center gap-4 mt-2 text-gray-500"
                    style={{ fontSize: "11px" }}
                  >
                    <span>الفترة: حتى تاريخه</span>
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
                      الرصيد الافتتاحي الإجمالي
                    </div>
                    <div className="font-mono mt-0.5 text-[16px] font-bold text-gray-600">
                      {accounts
                        .reduce((s, a) => s + a.initialBalance, 0)
                        .toLocaleString()}{" "}
                      ر.س
                    </div>
                  </div>
                  <div className="p-3 rounded-lg text-center bg-green-50 border border-green-100">
                    <div className="text-gray-500 text-[10px]">
                      رصيد المعاملات (النظام)
                    </div>
                    <div className="font-mono mt-0.5 text-[16px] font-bold text-green-600">
                      +{stats.system.toLocaleString()} ر.س
                    </div>
                  </div>
                  <div className="p-3 rounded-lg text-center bg-amber-50 border border-amber-100">
                    <div className="text-gray-500 text-[10px]">
                      رصيد التفاصيل الخارجية
                    </div>
                    <div className="font-mono mt-0.5 text-[16px] font-bold text-amber-600">
                      +{stats.external.toLocaleString()} ر.س
                    </div>
                  </div>
                  <div className="p-3 rounded-lg text-center bg-blue-50 border border-blue-100">
                    <div className="text-gray-500 text-[10px]">
                      الرصيد النهائي الإجمالي
                    </div>
                    <div className="font-mono mt-0.5 text-[16px] font-bold text-blue-600">
                      {stats.total.toLocaleString()} ر.س
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
                        البنك
                      </th>
                      <th className="text-right px-3 py-2 font-bold text-[11px]">
                        رقم الحساب
                      </th>
                      <th className="text-right px-3 py-2 font-bold text-[11px]">
                        الرصيد الافتتاحي
                      </th>
                      <th className="text-right px-3 py-2 font-bold text-[11px]">
                        رصيد النظام
                      </th>
                      <th className="text-right px-3 py-2 font-bold text-[11px]">
                        الرصيد الخارجي
                      </th>
                      <th className="text-right px-3 py-2 font-bold text-[11px]">
                        الإجمالي
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((row, i) => (
                      <tr
                        key={row.id}
                        style={{
                          backgroundColor: i % 2 === 1 ? "#fafbfc" : "white",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <td className="px-3 py-2 font-bold text-gray-700">
                          {row.bankName}
                        </td>
                        <td className="px-3 py-2 font-mono text-gray-500">
                          {row.accountNumber}
                        </td>
                        <td className="px-3 py-2 font-mono text-gray-600">
                          {row.initialBalance.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 font-mono text-green-600">
                          {row.systemBalance.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 font-mono text-amber-600">
                          {row.externalBalance.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-blue-600">
                          {row.totalBalance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="rounded-lg p-4 bg-gray-50 border border-gray-200 mt-6 print:break-inside-avoid">
                  <div className="text-[12px] font-bold text-gray-800 mb-2">
                    التقدير الضريبي المبدئي
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 rounded bg-blue-50 border border-blue-100">
                    <span className="text-[11px] text-gray-600">
                      الضريبة التقديرية بناءً على الأرصدة (15%)
                    </span>
                    <span className="font-mono text-[14px] font-bold text-blue-700">
                      {taxEstimate.toLocaleString()} ر.س
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankAccountsPage;
