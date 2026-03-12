import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Eye,
  Download,
  X,
  Info,
  Loader2,
  Save,
  Printer,
  ChevronDown,
  UserPlus,
  Landmark,
  FileText,
  Edit3,
  Trash2,
  ArrowDown,
  ArrowUp,
  Receipt,
  Calculator,
} from "lucide-react";

const BankAccountsPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // ==========================================
  // 💡 Modals States
  // ==========================================
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Transaction Modal State
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState("deposit");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [transactionAccount, setTransactionAccount] = useState("");
  const [transactionNotes, setTransactionNotes] = useState("");

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
  // 💡 Queries
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
  // 💡 Mutations
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

  const transactionMutation = useMutation({
    mutationFn: async (payload) =>
      await api.post("/bank-accounts/transaction", payload),
    onSuccess: (res) => {
      toast.success(res.data?.message || "تم تسجيل العملية بنجاح");
      queryClient.invalidateQueries(["bank-accounts"]);
      setShowTransactionModal(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ أثناء تسجيل العملية"),
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
  // 💡 Handlers
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

  const openTransactionModal = (type) => {
    setTransactionType(type);
    setTransactionAmount("");
    setTransactionDate(new Date().toISOString().split("T")[0]);
    setTransactionAccount(accounts[0]?.id || "");
    setTransactionNotes("");
    setShowTransactionModal(true);
  };

  const handleSaveTransaction = () => {
    if (!transactionAmount || !transactionDate || !transactionAccount) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    transactionMutation.mutate({
      accountId: transactionAccount,
      type: transactionType,
      amount: transactionAmount,
      date: transactionDate,
      notes: transactionNotes,
    });
  };

  // ==========================================
  // 💡 Stats & Filters
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

  // ==========================================
  // 💡 Main Render
  // ==========================================
  return (
    <div
      className="p-4 flex flex-col h-full overflow-hidden bg-slate-50 font-sans"
      dir="rtl"
    >
      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        {/* التقدير الضريبي العلوي */}
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-blue-50/50 border-blue-200 shadow-sm shrink-0">
          <div className="flex items-center gap-8 flex-1">
            <div>
              <div className="text-gray-500 font-bold text-[11px] mb-1">
                إجمالي الرصيد البنكي
              </div>
              <div className="font-mono text-blue-700 text-lg font-black">
                {stats.total.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500 font-bold text-[11px] mb-1">
                المبلغ الخاضع للتقدير
              </div>
              <div className="font-mono text-orange-600 text-lg font-black">
                {stats.total.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500 font-bold text-[11px] mb-1">
                النسبة التقديرية
              </div>
              <div className="font-mono text-orange-600 text-lg font-black">
                15%
              </div>
            </div>
            <div>
              <div className="text-gray-500 font-bold text-[11px] mb-1">
                قيمة التقدير الضريبي
              </div>
              <div className="font-mono text-orange-600 text-lg font-black">
                {taxEstimate.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 shrink-0 max-w-[250px] text-gray-500 bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
            <span className="text-[10px] font-bold leading-relaxed">
              هذا الرقم تقديري للاستخدام الداخلي بناءً على إجمالي الأرصدة
              المتوفرة وليس احتساباً ضريبياً رسمياً.
            </span>
          </div>
        </div>

        {/* شريط الأدوات (الأزرار الجديدة) */}
        <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex-wrap shrink-0">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" /> <span>إضافة حساب</span>
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1"></div>

          <button
            onClick={() => openTransactionModal("deposit")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white transition-all text-xs font-bold"
          >
            <ArrowDown className="w-4 h-4" /> <span>إيداع</span>
          </button>
          <button
            onClick={() => openTransactionModal("withdrawal")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-600 hover:text-white transition-all text-xs font-bold"
          >
            <ArrowUp className="w-4 h-4" /> <span>سحب</span>
          </button>
          <button
            onClick={() => openTransactionModal("expense")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white transition-all text-xs font-bold"
          >
            <Receipt className="w-4 h-4" /> <span>مصروف</span>
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1"></div>

          <button
            onClick={() => setIsRechargeOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-all text-xs font-bold"
          >
            <UserPlus className="w-4 h-4" /> <span>ايداع لحساب شريك</span>
          </button>

          <div className="flex-1" />

          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالبنك أو الحساب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-50 border border-gray-300 rounded-lg pr-9 pl-3 py-2 text-xs outline-none focus:border-blue-500 w-56 font-bold text-gray-700 transition-all"
            />
          </div>

          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all text-xs font-bold shadow-sm"
          >
            <Download className="w-4 h-4" /> <span>تصدير</span>
          </button>
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all text-xs font-bold shadow-sm"
          >
            <Eye className="w-4 h-4" /> <span>معاينة للطباعة</span>
          </button>
        </div>

        {/* الجدول الرئيسي */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex-1 flex flex-col shadow-sm min-h-0">
          <div className="overflow-auto custom-scrollbar-slim flex-1">
            <table className="w-full text-right whitespace-nowrap text-xs">
              <thead className="sticky top-0 z-10 bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-4 text-gray-700 font-bold">البنك</th>
                  <th className="px-5 py-4 text-gray-700 font-bold">
                    رقم الحساب
                  </th>
                  <th className="px-5 py-4 text-gray-700 font-bold">
                    الرصيد الافتتاحي
                  </th>
                  <th className="px-5 py-4 text-gray-700 font-bold">
                    رصيد النظام
                  </th>
                  <th className="px-5 py-4 text-gray-700 font-bold">
                    الرصيد الخارجي
                  </th>
                  <th className="px-5 py-4 text-gray-700 font-bold">
                    الإجمالي
                  </th>
                  <th className="px-5 py-4 text-center text-gray-700 font-bold">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-10 text-gray-500 font-bold text-sm"
                    >
                      لا توجد حسابات بنكية مسجلة
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc, index) => (
                    <tr
                      key={acc.id}
                      className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${index % 2 === 1 ? "bg-gray-50/50" : "bg-white"}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-gray-100 rounded-md">
                            <Landmark className="w-4 h-4 text-gray-500" />
                          </div>
                          <span className="text-gray-800 font-bold text-[13px]">
                            {acc.bankName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 font-mono font-bold text-[13px]">
                        {acc.accountNumber}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 font-mono font-bold">
                        {acc.initialBalance.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-black text-green-600 text-[13px]">
                        {acc.systemBalance.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-black text-orange-500 text-[13px]">
                        {acc.externalBalance.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-blue-700 font-mono font-black text-[14px] bg-blue-50/30">
                        {acc.totalBalance.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(acc)}
                            className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(acc.id)}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
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

        {/* إحصائيات سفلية للملخص السريع */}
        <div className="flex items-center gap-8 px-6 py-4 bg-white border border-gray-200 rounded-xl shrink-0 shadow-sm overflow-x-auto custom-scrollbar-slim">
          <div>
            <div className="text-gray-500 font-bold text-xs mb-1">
              إجمالي الأرصدة البنكية
            </div>
            <div className="font-mono text-xl font-black text-green-600">
              {stats.total.toLocaleString()}{" "}
              <span className="text-[10px] text-green-800 font-normal">
                ر.س
              </span>
            </div>
          </div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div>
            <div className="text-gray-500 font-bold text-xs mb-1">
              رصيد معاملات النظام
            </div>
            <div className="font-mono text-xl font-black text-blue-600">
              {stats.system.toLocaleString()}{" "}
              <span className="text-[10px] text-blue-800 font-normal">ر.س</span>
            </div>
          </div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div>
            <div className="text-gray-500 font-bold text-xs mb-1">
              رصيد التفاصيل الخارجية
            </div>
            <div className="font-mono text-xl font-black text-orange-500">
              {stats.external.toLocaleString()}{" "}
              <span className="text-[10px] text-orange-800 font-normal">
                ر.س
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 💡 Modals Windows */}
      {/* ========================================================================= */}

      {/* 1. Modal إضافة/تعديل حساب بنكي */}
      {isAddAccountOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Landmark className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-gray-800 font-black text-lg">
                  {modalMode === "add"
                    ? "إضافة حساب بنكي"
                    : "تعديل بيانات الحساب"}
                </span>
              </div>
              <button
                onClick={() => setIsAddAccountOpen(false)}
                className="text-gray-500 hover:text-red-500 p-2 rounded-lg bg-white border border-gray-200 shadow-sm transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar-slim flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-gray-700 text-xs font-bold">
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
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm outline-none focus:border-blue-500 font-bold text-gray-800"
                    placeholder="مثال: البنك الأهلي"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-gray-700 text-xs font-bold">
                    اسم الحساب (مسمى داخلي)
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
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm outline-none focus:border-blue-500 font-bold text-gray-800"
                    placeholder="مثال: حساب جاري الشركة"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-gray-700 text-xs font-bold">
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
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm font-mono font-bold outline-none focus:border-blue-500"
                    placeholder="**** 0000"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-gray-700 text-xs font-bold">
                    IBAN (الآيبان)
                  </label>
                  <input
                    type="text"
                    value={accountForm.iban}
                    onChange={(e) =>
                      setAccountForm({ ...accountForm, iban: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm font-mono font-bold outline-none focus:border-blue-500 text-left"
                    dir="ltr"
                    placeholder="SA00 0000 0000"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-5 mt-2">
                <div className="text-gray-800 mb-4 text-sm font-black flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-gray-500" /> تفاصيل الرصيد
                  الافتتاحي (عند الإضافة)
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-gray-700 text-xs font-bold">
                      الرصيد الافتتاحي (ر.س) *
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
                      className="w-full bg-blue-50 border border-blue-300 rounded-xl p-3 text-lg font-mono font-black text-blue-700 outline-none focus:border-blue-600"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-700 text-xs font-bold">
                      تاريخ تسجيل الرصيد
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
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
              <button
                onClick={() => setIsAddAccountOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-100 transition-colors shadow-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveAccount}
                disabled={saveAccountMutation.isPending}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saveAccountMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {modalMode === "add" ? "حفظ الحساب" : "تحديث البيانات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal تسجيل معاملة بنكية (إيداع/سحب/مصروف) */}
      {showTransactionModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
              <div className="flex items-center gap-3">
                {transactionType === "deposit" ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-green-100">
                      <ArrowDown className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-gray-800 text-lg font-black">
                      تسجيل إيداع في البنك
                    </span>
                  </div>
                ) : transactionType === "withdrawal" ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-100">
                      <ArrowUp className="w-6 h-6 text-orange-600" />
                    </div>
                    <span className="text-gray-800 text-lg font-black">
                      تسجيل سحب من البنك
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-100">
                      <Receipt className="w-6 h-6 text-red-600" />
                    </div>
                    <span className="text-gray-800 text-lg font-black">
                      تسجيل مصروف بنكي
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="text-gray-500 hover:text-red-500 p-2 rounded-lg border border-gray-200 bg-white transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar-slim flex-1">
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-100 border border-gray-200 rounded-xl">
                <button
                  onClick={() => setTransactionType("deposit")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${transactionType === "deposit" ? "bg-green-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`}
                >
                  <ArrowDown className="w-4 h-4" /> إيداع
                </button>
                <button
                  onClick={() => setTransactionType("withdrawal")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${transactionType === "withdrawal" ? "bg-orange-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`}
                >
                  <ArrowUp className="w-4 h-4" /> سحب
                </button>
                <button
                  onClick={() => setTransactionType("expense")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${transactionType === "expense" ? "bg-red-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`}
                >
                  <Receipt className="w-4 h-4" /> مصروف
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-gray-700 text-xs font-bold">
                    المبلغ (ر.س) *
                  </label>
                  <input
                    type="number"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(e.target.value)}
                    className={`w-full bg-white border-2 rounded-xl p-3 text-2xl font-mono font-black outline-none transition-colors ${transactionType === "deposit" ? "border-green-300 text-green-700 focus:border-green-500 bg-green-50" : transactionType === "withdrawal" ? "border-orange-300 text-orange-700 focus:border-orange-500 bg-orange-50" : "border-red-300 text-red-700 focus:border-red-500 bg-red-50"}`}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-gray-700 text-xs font-bold">
                    تاريخ العملية *
                  </label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-sm font-bold outline-none focus:border-blue-500 text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 text-xs font-bold">
                  في أي حساب بنكي؟ *
                </label>
                <select
                  value={transactionAccount}
                  onChange={(e) => setTransactionAccount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-500 text-gray-800"
                >
                  <option value="">اختر الحساب...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} - {acc.accountNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 text-xs font-bold">
                  ملاحظات وسبب العملية
                </label>
                <textarea
                  value={transactionNotes}
                  onChange={(e) => setTransactionNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-500 resize-none h-24 text-gray-800"
                  placeholder="اكتب تفاصيل الدفعة، رقم الحوالة، أو اسم المودع..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
              <button
                onClick={() => setShowTransactionModal(false)}
                className="px-6 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-100 shadow-sm transition-colors"
              >
                إلغاء الأمر
              </button>
              <button
                onClick={handleSaveTransaction}
                disabled={transactionMutation.isPending}
                className={`flex items-center gap-2 px-10 py-2.5 rounded-xl text-white font-black text-sm shadow-md transition-colors disabled:opacity-50 ${transactionType === "deposit" ? "bg-green-600 hover:bg-green-700" : transactionType === "withdrawal" ? "bg-orange-500 hover:bg-orange-600" : "bg-red-600 hover:bg-red-700"}`}
              >
                {transactionMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                تسجيل وحفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: شحن شخصي لشريك */}
      {isRechargeOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-gray-800 text-lg font-black">
                  ايداع لحساب شريك
                </span>
              </div>
              <button
                onClick={() => setIsRechargeOpen(false)}
                className="text-gray-500 hover:text-red-500 p-2 rounded-lg border bg-white shadow-sm transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block mb-2 text-gray-700 text-xs font-bold">
                  اسم الشريك *
                </label>
                <select
                  value={rechargeForm.partnerId}
                  onChange={(e) =>
                    setRechargeForm({
                      ...rechargeForm,
                      partnerId: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-purple-500 text-gray-800"
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
              </div>
              <div>
                <label className="block mb-2 text-gray-700 text-xs font-bold">
                  المبلغ (ر.س) *
                </label>
                <input
                  type="number"
                  value={rechargeForm.amount}
                  onChange={(e) =>
                    setRechargeForm({ ...rechargeForm, amount: e.target.value })
                  }
                  className="w-full bg-purple-50 border border-purple-300 rounded-xl p-3 text-xl font-mono font-black text-purple-700 outline-none focus:border-purple-600"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700 text-xs font-bold">
                  الحساب البنكي المودع فيه *
                </label>
                <select
                  value={rechargeForm.accountId}
                  onChange={(e) =>
                    setRechargeForm({
                      ...rechargeForm,
                      accountId: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-purple-500 text-gray-800"
                >
                  <option value="">اختر الحساب البنكي...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} - {acc.accountNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-start gap-2 p-4 rounded-xl border border-orange-200 bg-orange-50 shadow-sm mt-4">
                <Info className="w-5 h-5 text-orange-600 shrink-0" />
                <span className="text-orange-900 text-xs font-bold leading-relaxed">
                  هذا الشحن سيزيد من رصيد البنك في النظام ولكنه لا يُحتسب كإيراد
                  ولا يُدخل في توزيع أرباح الشركاء (يُصنّف كحركة خارجية).
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsRechargeOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-100 shadow-sm transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleRecharge}
                disabled={rechargeMutation.isPending}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-purple-600 text-white font-black text-sm shadow-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {rechargeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}{" "}
                تنفيذ الشحن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Export & Preview Modals */}
      {isExportOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <span className="text-gray-800 text-lg font-black">
                تصدير تقرير البنوك
              </span>
              <button
                onClick={() => setIsExportOpen(false)}
                className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg border bg-white shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-8 space-y-4 text-center">
              <Download className="w-14 h-14 text-blue-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-gray-700 leading-relaxed">
                سيتم تصدير كشف الحسابات البنكية والأرصدة الحالية بصيغة Excel
                لغرض المراجعة.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsExportOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-100 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  toast.success("جاري التصدير...");
                  setIsExportOpen(false);
                }}
                className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-black text-sm shadow-md hover:bg-blue-700 transition-colors"
              >
                تأكيد التصدير
              </button>
            </div>
          </div>
        </div>
      )}

      {isPreviewOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-5xl"
            style={{ height: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0 print:hidden">
              <div className="flex items-center gap-3">
                <Printer className="w-6 h-6 text-gray-700" />
                <span className="text-gray-800 font-black text-lg">
                  معاينة للطباعة
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4" /> اطبع الآن
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div
              id="print-area"
              className="flex-1 p-10 overflow-y-auto bg-white text-black"
            >
              <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
                <h1 className="text-3xl font-black mb-3">
                  تقرير الحسابات البنكية المجمعة
                </h1>
                <p className="text-sm font-bold text-gray-600">
                  تاريخ إصدار التقرير: {new Date().toLocaleDateString("ar-SA")}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-8 border-2 border-gray-300 rounded-2xl p-6 bg-gray-50">
                <div className="text-center">
                  <span className="block text-sm font-bold text-gray-600 mb-2">
                    الرصيد الافتتاحي
                  </span>
                  <span className="block text-2xl font-mono font-black text-gray-800">
                    {accounts
                      .reduce((s, a) => s + a.initialBalance, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="text-center border-r-2 border-gray-300">
                  <span className="block text-sm font-bold text-gray-600 mb-2">
                    رصيد النظام
                  </span>
                  <span className="block text-2xl font-mono font-black text-green-700">
                    +{stats.system.toLocaleString()}
                  </span>
                </div>
                <div className="text-center border-r-2 border-gray-300">
                  <span className="block text-sm font-bold text-gray-600 mb-2">
                    رصيد خارجي
                  </span>
                  <span className="block text-2xl font-mono font-black text-orange-600">
                    +{stats.external.toLocaleString()}
                  </span>
                </div>
                <div className="text-center border-r-2 border-gray-800">
                  <span className="block text-sm font-bold text-gray-900 mb-2">
                    الرصيد النهائي
                  </span>
                  <span className="block text-3xl font-mono font-black text-blue-800 border-b-4 border-blue-800 inline-block pb-1">
                    {stats.total.toLocaleString()}
                  </span>
                </div>
              </div>

              <table className="w-full text-right text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200 border-b-2 border-gray-400">
                    <th className="p-3 border border-gray-300 font-bold text-gray-800">
                      البنك
                    </th>
                    <th className="p-3 border border-gray-300 font-bold text-gray-800">
                      رقم الحساب
                    </th>
                    <th className="p-3 border border-gray-300 font-bold text-gray-800">
                      الرصيد الافتتاحي
                    </th>
                    <th className="p-3 border border-gray-300 font-bold text-gray-800">
                      رصيد النظام
                    </th>
                    <th className="p-3 border border-gray-300 font-bold text-gray-800">
                      الرصيد الخارجي
                    </th>
                    <th className="p-3 border border-gray-300 font-bold text-gray-800 bg-gray-300">
                      الإجمالي
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((row, i) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-300 hover:bg-gray-50"
                    >
                      <td className="p-3 border border-gray-300 font-bold text-gray-900">
                        {row.bankName}
                      </td>
                      <td className="p-3 border border-gray-300 font-mono text-gray-700">
                        {row.accountNumber}
                      </td>
                      <td className="p-3 border border-gray-300 font-mono text-gray-800">
                        {row.initialBalance.toLocaleString()}
                      </td>
                      <td className="p-3 border border-gray-300 font-mono text-green-700 font-bold">
                        {row.systemBalance.toLocaleString()}
                      </td>
                      <td className="p-3 border border-gray-300 font-mono text-orange-600 font-bold">
                        {row.externalBalance.toLocaleString()}
                      </td>
                      <td className="p-3 border border-gray-300 font-mono text-blue-800 font-black bg-blue-50/50">
                        {row.totalBalance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-8 p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 text-center print:break-inside-avoid">
                <span className="font-bold text-gray-700 text-lg">
                  التقدير الضريبي الداخلي (15%):{" "}
                </span>
                <span className="font-mono font-black text-2xl text-red-600 mr-2">
                  {taxEstimate.toLocaleString()} ر.س
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankAccountsPage;
