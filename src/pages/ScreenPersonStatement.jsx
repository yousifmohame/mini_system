import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  User,
  Download,
  Eye,
  Info,
  CheckSquare,
  Square,
  Calculator,
  FileText,
  AlertCircle,
  Check,
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Wallet,
  Building,
  UserCheck,
  Printer,
  Filter,
  CheckCircle,
  CircleDot,
  List,
  FileSpreadsheet,
  FileDown,
  Loader2,
  Handshake,
} from "lucide-react";
import { usePrivacy } from "../context/PrivacyContext";
import { ScreenshotButton } from "../components/ScreenshotButton";

// ============================================================================
// 💡 Helpers
// ============================================================================
const maskName = (name) => name;
const maskAmount = (amount) =>
  isNaN(Number(amount)) ? 0 : Number(amount).toLocaleString();
const safeText = (val) =>
  val === null || val === undefined ? "—" : String(val);

const TYPE_ICONS = {
  expense: Receipt,
  advance: Wallet,
  uncollected: DollarSign,
  delivered: TrendingUp,
  received: TrendingDown,
  fee: Handshake,
};

const TYPE_LABELS = {
  expense: "مصروف",
  advance: "سلفة / منصرف",
  uncollected: "تحصيل غير مورد",
  delivered: "مستحقات مسلمة",
  received: "مبلغ مستلم",
  fee: "أتعاب مستحقة",
};

export default function ScreenPersonStatement() {
  const queryClient = useQueryClient();
  const { maskAmount, maskName } = usePrivacy();

  // States
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [filterMode, setFilterMode] = useState("all");

  // Modals
  const [showNettingModal, setShowNettingModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // ============================================================================
  // 💡 API Queries
  // ============================================================================
  const { data: persons = [], isLoading: isPersonsLoading } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => (await api.get("/persons")).data?.data || [],
  });

  const { data: statementResponse, isLoading: isStatementLoading } = useQuery({
    queryKey: ["person-statement", selectedPersonId],
    queryFn: async () => {
      if (!selectedPersonId) return null;
      const res = await api.get(`/finance/statement/${selectedPersonId}`);
      return res.data?.data;
    },
    enabled: !!selectedPersonId,
  });

  const rawStatementData = statementResponse?.statement || [];
  const nettingRecords = statementResponse?.nettingHistory || [];
  const selectedPersonData = persons.find((p) => p.id === selectedPersonId);

  // ============================================================================
  // 💡 Data Processing & Filtering
  // ============================================================================
  const statementData = useMemo(() => {
    let data = rawStatementData;
    if (filterMode === "approved-only")
      data = data.filter((item) => item.txStatus === "approved");
    else if (filterMode === "collected-only")
      data = data.filter((item) => item.collected === true);
    return data;
  }, [rawStatementData, filterMode]);

  const totalCredit = useMemo(
    () =>
      statementData
        .filter((i) => i.category === "credit")
        .reduce((sum, item) => sum + (item.amount || 0), 0),
    [statementData],
  );
  const totalDebit = useMemo(
    () =>
      statementData
        .filter((i) => i.category === "debit")
        .reduce((sum, item) => sum + (item.amount || 0), 0),
    [statementData],
  );
  const netBalance = totalCredit - totalDebit;

  const selectedItemsData = useMemo(
    () =>
      statementData.filter(
        (item) => selectedItems.has(item.id) && !item.settled,
      ),
    [statementData, selectedItems],
  );
  const selectedCredit = useMemo(
    () =>
      selectedItemsData
        .filter((i) => i.category === "credit")
        .reduce((s, i) => s + i.amount, 0),
    [selectedItemsData],
  );
  const selectedDebit = useMemo(
    () =>
      selectedItemsData
        .filter((i) => i.category === "debit")
        .reduce((s, i) => s + i.amount, 0),
    [selectedItemsData],
  );
  const selectedNet = selectedCredit - selectedDebit;

  // ============================================================================
  // 💡 Mutations
  // ============================================================================
  const nettingMutation = useMutation({
    mutationFn: async () => {
      return await api.post(`/finance/netting`, {
        personId: selectedPersonId,
        itemIds: Array.from(selectedItems),
        totalCredit: selectedCredit,
        totalDebit: selectedDebit,
        netAmount: selectedNet,
      });
    },
    onSuccess: () => {
      toast.success(
        `تم اعتماد المقاصة بنجاح - صافي المبلغ: ${maskAmount(Math.abs(selectedNet).toLocaleString())} ر.س`,
      );
      queryClient.invalidateQueries(["person-statement", selectedPersonId]);
      setSelectedItems(new Set());
      setShowNettingModal(false);
    },
    onError: () => toast.error("حدث خطأ أثناء إجراء المقاصة"),
  });

  // ============================================================================
  // 💡 Handlers
  // ============================================================================
  const toggleItemSelection = (id) => {
    const item = statementData.find((i) => i.id === id);
    if (!item || item.settled) return;

    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
  };

  const handlePrint = () => {
    window.print();
    toast.success("جاري الطباعة...");
  };

  // ============================================================================
  // 💡 Render: Loading or Selection Screen
  // ============================================================================
  if (isPersonsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!selectedPersonId) {
    return (
      <div className="p-4 space-y-4 font-sans" dir="rtl">
        <div className="flex items-center gap-4 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-3 rounded-xl bg-blue-50">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="text-gray-800 mb-2 text-lg font-bold">
              كشف حساب الأشخاص والجهات
            </div>
            <div className="text-gray-500 mb-4 text-sm">
              اختر شخصاً لعرض كشف حسابه والمستحقات له وعليه
            </div>
            <select
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="w-full max-w-md bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="">-- اختر من القائمة --</option>
              {["موظف", "وسيط", "معقب", "خارجي", "صاحب مصلحة"].map((role) => {
                const rolePersons = persons.filter((p) => p.role === role);
                if (rolePersons.length === 0) return null;
                return (
                  <optgroup key={role} label={`── ${role} ──`}>
                    {rolePersons.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
        </div>

        <div className="flex items-start gap-2 px-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
          <span className="text-gray-500 font-semibold text-xs leading-relaxed">
            هذه الشاشة تجمع البيانات تلقائياً من (الخزنة، البنوك، الرواتب،
            والمعاملات) لتقديم كشف حساب دقيق ومفصل.
          </span>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 💡 Render: Main Statement Screen
  // ============================================================================
  return (
    <div
      className="p-4 space-y-4 font-sans bg-gray-50/30 min-h-screen"
      id="person-statement-content"
      dir="rtl"
    >
      {/* Header Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-gray-500 text-xs font-bold mb-1">
                كشف حساب مفصل
              </div>
              <div className="text-gray-800 text-lg font-black flex items-center gap-3">
                {maskName(selectedPersonData?.name || "—")}
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-bold border border-gray-200">
                  {selectedPersonData?.role}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedPersonId("");
              setSelectedItems(new Set());
            }}
            className="px-5 py-2.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 cursor-pointer font-bold text-xs transition-colors"
          >
            تغيير الشخص
          </button>
        </div>
      </div>

      {isStatementLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-green-800 text-xs font-bold">
                  مستحقات له (Credit)
                </span>
              </div>
              <div className="font-mono text-green-700 text-2xl font-black">
                {maskAmount(totalCredit)}
              </div>
              <div className="text-green-600 mt-1 text-[10px] font-semibold">
                ريال سعودي
              </div>
            </div>

            <div className="bg-white border border-red-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span className="text-red-800 text-xs font-bold">
                  مستحقات عليه (Debit)
                </span>
              </div>
              <div className="font-mono text-red-700 text-2xl font-black">
                {maskAmount(totalDebit)}
              </div>
              <div className="text-red-600 mt-1 text-[10px] font-semibold">
                ريال سعودي
              </div>
            </div>

            <div
              className={`bg-white border rounded-xl p-4 shadow-sm ${netBalance >= 0 ? "border-green-300" : "border-red-300"}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Calculator
                  className={`w-5 h-5 ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                />
                <span className="text-gray-700 text-xs font-bold">
                  صافي الحساب
                </span>
              </div>
              <div
                className={`font-mono text-2xl font-black ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {netBalance >= 0 ? "+" : ""}
                {maskAmount(netBalance)}
              </div>
              <div className="text-gray-500 mt-1 text-[10px] font-semibold">
                {netBalance >= 0 ? "إجمالي يُطلب له" : "إجمالي مطلوب منه"}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 text-xs font-bold">
                  إحصائيات البنود
                </span>
              </div>
              <div className="font-mono text-gray-800 text-2xl font-black">
                {statementData.length}
              </div>
              <div className="text-gray-500 mt-1 text-[10px] font-semibold">
                {statementData.filter((i) => i.settled).length} بنود تمت تسويتها
              </div>
            </div>
          </div>

          {/* Filter & Toolbar */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex-wrap">
            <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-lg p-1.5">
              <Filter className="w-4 h-4 text-gray-500 mx-1" />
              <button
                onClick={() => setFilterMode("all")}
                className={`px-4 py-2 rounded-md cursor-pointer font-bold transition-all text-xs ${filterMode === "all" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"}`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilterMode("approved-only")}
                className={`px-4 py-2 rounded-md cursor-pointer font-bold transition-all text-xs ${filterMode === "approved-only" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"}`}
              >
                المعتمدة فقط
              </button>
            </div>

            <div className="flex-1" />

            <button
              onClick={() => setShowNettingModal(true)}
              disabled={selectedItems.size === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs transition-colors shadow-sm"
            >
              <Calculator className="w-4 h-4" />{" "}
              <span>إجراء مقاصة ({selectedItems.size})</span>
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer font-bold text-xs transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> <span>تصدير</span>
            </button>

            <button
              onClick={() => setShowPreviewModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer font-bold text-xs transition-colors shadow-sm"
            >
              <Eye className="w-4 h-4" /> <span>معاينة للطباعة</span>
            </button>
          </div>

          {/* Statement Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">
                    <Square className="w-4 h-4 inline text-gray-400" />
                  </th>
                  {[
                    "التاريخ",
                    "النوع",
                    "البيان",
                    "المصدر",
                    "له (دائن)",
                    "عليه (مدين)",
                    "الحالة",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 font-bold text-gray-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {statementData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center py-10 text-gray-400 font-bold"
                    >
                      لا توجد حركات مالية مسجلة
                    </td>
                  </tr>
                ) : (
                  statementData.map((item, i) => {
                    const Icon = TYPE_ICONS[item.type] || Receipt;
                    const isSettled = item.settled;
                    const isSelected = selectedItems.has(item.id);

                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${i % 2 === 1 ? "bg-gray-50/40" : "bg-white"}`}
                        style={{ opacity: isSettled ? 0.6 : 1 }}
                      >
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleItemSelection(item.id)}
                            disabled={isSettled}
                            className="cursor-pointer disabled:cursor-not-allowed"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-300 hover:text-blue-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-500 font-semibold">
                          {item.date}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700 font-bold">
                              {TYPE_LABELS[item.type] || item.type}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 font-bold text-gray-800 max-w-xs truncate"
                          title={item.description}
                        >
                          {safeText(item.description)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-semibold">
                          {safeText(item.source)}
                        </td>
                        <td className="px-4 py-3">
                          {item.category === "credit" ? (
                            <span className="font-mono font-black text-green-600 text-sm">
                              {maskAmount(item.amount)}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {item.category === "debit" ? (
                            <span className="font-mono font-black text-red-500 text-sm">
                              {maskAmount(item.amount)}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isSettled ? (
                            <span className="px-2.5 py-1 rounded-md bg-green-100 text-green-700 text-[10px] font-bold flex items-center gap-1 w-max">
                              <Check className="w-3.5 h-3.5" /> مُسوى
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center gap-1 w-max">
                              <AlertCircle className="w-3.5 h-3.5" /> معلق
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* 💡 Modals */}

      {/* Netting Modal (المقاصة) */}
      {showNettingModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100">
                  <Calculator className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-gray-800 text-lg font-black">
                  إجراء مقاصة بنود ({selectedItems.size})
                </span>
              </div>
              <button
                onClick={() => setShowNettingModal(false)}
                className="text-gray-400 hover:text-red-500 p-2 bg-white rounded-lg border shadow-sm transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center shadow-sm">
                  <div className="text-green-700 font-bold text-xs mb-1">
                    مستحقات له
                  </div>
                  <div className="font-mono text-green-700 text-2xl font-black">
                    {maskAmount(selectedCredit)}{" "}
                    <span className="text-xs font-normal">ر.س</span>
                  </div>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center shadow-sm">
                  <div className="text-red-700 font-bold text-xs mb-1">
                    مستحقات عليه
                  </div>
                  <div className="font-mono text-red-700 text-2xl font-black">
                    {maskAmount(selectedDebit)}{" "}
                    <span className="text-xs font-normal">ر.س</span>
                  </div>
                </div>
                <div
                  className={`p-4 border rounded-xl text-center shadow-sm ${selectedNet >= 0 ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}
                >
                  <div className="text-gray-600 font-bold text-xs mb-1">
                    الصافي
                  </div>
                  <div
                    className={`font-mono text-2xl font-black ${selectedNet >= 0 ? "text-green-700" : "text-red-700"}`}
                  >
                    {selectedNet >= 0 ? "+" : ""}
                    {maskAmount(selectedNet)}{" "}
                    <span className="text-xs font-normal">ر.س</span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <div className="text-amber-900 font-bold text-sm mb-1">
                    تأكيد الاعتماد
                  </div>
                  <div className="text-amber-800 text-xs leading-relaxed font-semibold">
                    سيتم تصفية هذه البنود واعتبارها مُسواة نهائياً. إذا كان
                    الصافي إيجابياً سيتم ترحيله كرصيد مستحق له، وإذا كان سلبياً
                    سيتم تسجيله كمديونية عليه.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowNettingModal(false)}
                className="px-6 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors shadow-sm"
              >
                إلغاء
              </button>
              <button
                onClick={() => nettingMutation.mutate()}
                disabled={nettingMutation.isPending}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {nettingMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                اعتماد وتصفية المقاصة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal (الطباعة) */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 animate-in fade-in"
          dir="rtl"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-4xl"
            style={{ height: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-200">
                  <Printer className="w-5 h-5 text-gray-700" />
                </div>
                <span className="text-gray-800 font-black text-lg">
                  معاينة الطباعة الرسمية
                </span>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="hover:bg-gray-200 p-2 rounded-lg border shadow-sm transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* منطقة الطباعة */}
            <div
              id="print-area"
              className="flex-1 p-8 overflow-y-auto bg-white text-black"
            >
              <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
                <h1 className="text-3xl font-black mb-3">كشف حساب مفصل</h1>
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedPersonData?.name}{" "}
                  <span className="text-sm text-gray-500 font-normal">
                    ({selectedPersonData?.role})
                  </span>
                </h2>
                <p className="text-sm text-gray-500 mt-2 font-mono">
                  تاريخ الإصدار: {new Date().toLocaleDateString("ar-SA")}
                </p>
              </div>

              <div className="flex justify-between items-center mb-8 p-6 border-2 border-gray-200 rounded-2xl bg-gray-50">
                <div className="text-center flex-1">
                  <span className="block text-sm font-bold text-gray-500 mb-1">
                    إجمالي الدائن (له)
                  </span>
                  <span className="block text-2xl font-mono font-black text-green-700">
                    {totalCredit.toLocaleString()}
                  </span>
                </div>
                <div className="w-px h-12 bg-gray-300 mx-4"></div>
                <div className="text-center flex-1">
                  <span className="block text-sm font-bold text-gray-500 mb-1">
                    إجمالي المدين (عليه)
                  </span>
                  <span className="block text-2xl font-mono font-black text-red-600">
                    {totalDebit.toLocaleString()}
                  </span>
                </div>
                <div className="w-px h-12 bg-gray-300 mx-4"></div>
                <div className="text-center flex-1">
                  <span className="block text-sm font-bold text-gray-800 mb-1">
                    الرصيد الصافي
                  </span>
                  <span
                    className={`block text-3xl font-mono font-black border-b-4 pb-1 inline-block ${netBalance >= 0 ? "text-green-700 border-green-700" : "text-red-700 border-red-700"}`}
                  >
                    {netBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              <table className="w-full text-right text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 border border-gray-300">
                    <th className="p-3 border border-gray-300 font-bold text-gray-700">
                      التاريخ
                    </th>
                    <th className="p-3 border border-gray-300 font-bold text-gray-700">
                      النوع
                    </th>
                    <th className="p-3 border border-gray-300 font-bold text-gray-700">
                      البيان والتفاصيل
                    </th>
                    <th className="p-3 border border-gray-300 font-bold text-gray-700">
                      له
                    </th>
                    <th className="p-3 border border-gray-300 font-bold text-gray-700">
                      عليه
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statementData.map((item, i) => (
                    <tr
                      key={i}
                      className="border border-gray-200 hover:bg-gray-50"
                    >
                      <td className="p-3 border border-gray-200 font-mono text-gray-600">
                        {item.date}
                      </td>
                      <td className="p-3 border border-gray-200 font-semibold">
                        {TYPE_LABELS[item.type] || item.type}
                      </td>
                      <td className="p-3 border border-gray-200 font-bold text-gray-800">
                        {item.description}
                      </td>
                      <td className="p-3 border border-gray-200 font-mono font-bold text-green-700">
                        {item.category === "credit"
                          ? item.amount.toLocaleString()
                          : ""}
                      </td>
                      <td className="p-3 border border-gray-200 font-mono font-bold text-red-600">
                        {item.category === "debit"
                          ? item.amount.toLocaleString()
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end shrink-0">
              <button
                onClick={() => {
                  handlePrint();
                  setShowPreviewModal(false);
                }}
                className="px-10 py-3 bg-gray-900 text-white font-black rounded-xl flex items-center gap-2 hover:bg-black transition-colors shadow-lg"
              >
                <Printer className="w-5 h-5" /> طباعة الكشف فوراً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
