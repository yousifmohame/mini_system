import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useAppStore } from "../stores/useAppStore";
import {
  FilePlus,
  Banknote,
  HandCoins,
  Send,
  Vault,
  Landmark,
  RefreshCw,
  Receipt,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Settings2,
  EyeOff,
  Plus,
  Download,
  Eye,
  ChartColumn,
  Trophy,
  Square,
  Pin,
  Filter,
  ArrowUpDown,
  Crown,
  Handshake,
  User,
  TriangleAlert,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

// ==========================================
// مكون الصفحة الرئيسي
// ==========================================
const TransactionsPage = () => {
  // 👈 الكود الصحيح (استخدام openScreens بدلاً من screens)
  const { openScreens, activeScreenId } = useAppStore();
  const activeScreen = openScreens.find((s) => s.id === activeScreenId);
  const activeSector = activeScreen?.props?.sector || "الكل";
  const [activeSourceFilter, setActiveSourceFilter] = useState("الكل");
  const [searchQuery, setSearchQuery] = useState("");

  // 1. جلب البيانات من الباك إند
  const {
    data: transactionsData = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["private-transactions-full"],
    queryFn: async () => {
      // قم بالتأكد من أن هذا المسار يرجع جميع المعاملات من الباك إند
      const res = await api.get("/private-transactions");
      return res.data?.data || [];
    },
  });

  // 2. فلترة البيانات (حسب البحث ومصدر المعاملة)
  const filteredTransactions = useMemo(() => {
    return transactionsData.filter((tx) => {
      // أ) فلترة البحث النصي
      const matchesSearch =
        searchQuery === "" ||
        tx.ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.district?.toLowerCase().includes(searchQuery.toLowerCase());

      // ب) فلترة المصدر
      const matchesSource =
        activeSourceFilter === "الكل" || tx.source === activeSourceFilter;

      // ج) 👈 فلترة القطاع (تعتمد على ما ضغط عليه المستخدم في الشريط الجانبي)
      const matchesSector =
        activeSector === "الكل" || tx.sector?.includes(activeSector); // نفترض أن القطاع مسجل كـ "قطاع وسط" أو "وسط"

      return matchesSearch && matchesSource && matchesSector;
    });
  }, [transactionsData, searchQuery, activeSourceFilter, activeSector]);

  // 3. حساب مجاميع الفوتر (Footer Totals)
  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        acc.totalFees += parseFloat(tx.totalFees) || 0;
        acc.paidAmount += parseFloat(tx.paidAmount) || 0;
        acc.remainingAmount += parseFloat(tx.remainingAmount) || 0;
        return acc;
      },
      { totalFees: 0, paidAmount: 0, remainingAmount: 0 },
    );
  }, [filteredTransactions]);

  // دالة مساعدة لتحديد حالة وألوان التحصيل
  const getCollectionStatus = (paid, total) => {
    if (paid >= total && total > 0)
      return { label: "محصل بالكامل", color: "bg-green-100 text-green-700" };
    if (paid > 0 && paid < total)
      return { label: "محصل جزئي", color: "bg-amber-100 text-amber-700" };
    return { label: "غير محصل", color: "bg-red-100 text-red-700" };
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden bg-[var(--wms-bg-0)] font-sans"
      dir="rtl"
    >
      {/* ========================================================= */}
      {/* 👈 تم إضافة عنوان فرعي اختياري ليوضح للمستخدم أي قطاع يتصفح حالياً */}
      {activeSector !== "الكل" && (
        <div className="bg-blue-50/50 border-b border-blue-100 px-4 py-1.5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-[12px]">
            <Pin className="w-3.5 h-3.5" />
            <span>عرض المعاملات المخصصة لـ: قطاع {activeSector}</span>
          </div>
          <span className="text-[10px] text-blue-500 font-semibold bg-white px-2 py-0.5 rounded shadow-sm border border-blue-100">
            {filteredTransactions.length} نتيجة
          </span>
        </div>
      )}
      {/* محتوى الصفحة الرئيسي */}
      <div className="p-3 flex flex-col gap-2 flex-1 overflow-hidden">
        {/* شريط الفلاتر والبحث */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="relative flex-1 max-w-[300px]">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--wms-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالرقم، المالك، الحي، الوسيط..."
              className="w-full bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-md pr-8 pl-3 text-[var(--wms-text)] placeholder:text-[var(--wms-text-muted)] h-[32px] text-[12px] outline-none focus:border-blue-500"
            />
          </div>

          <button className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] h-[32px] text-[11px] font-semibold transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>فلاتر</span>
          </button>

          <button
            className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] h-[32px] text-[11px] font-semibold transition-colors"
            title="إعدادات الأعمدة"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>الأعمدة</span>
          </button>

          <button
            className="flex items-center gap-1 px-2.5 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] h-[32px] text-[11px] font-semibold transition-colors"
            title="إخفاء المُسوّى"
          >
            <EyeOff className="w-3 h-3" />
            <span>إخفاء المُسوّى</span>
          </button>

          <button
            onClick={() => refetch()}
            className="flex items-center justify-center w-[32px] rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] h-[32px] transition-colors"
            title="تحديث"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-blue-500" : ""}`}
            />
          </button>

          <div className="flex-1"></div>

          {/* ملخص المبالغ العلوية */}
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-[var(--wms-text-muted)]">
              الإجمالي:{" "}
              <span className="text-[var(--wms-text)] font-mono font-bold">
                {transactionsData.length}
              </span>
            </span>
            <span className="text-[var(--wms-text-muted)]">
              محصّل:{" "}
              <span className="font-mono font-bold text-[var(--wms-success)]">
                {
                  transactionsData.filter(
                    (tx) => tx.paidAmount >= tx.totalFees && tx.totalFees > 0,
                  ).length
                }
              </span>
            </span>
            <span className="text-[var(--wms-text-muted)]">
              معلّق:{" "}
              <span className="font-mono font-bold text-[var(--wms-warning)]">
                {
                  transactionsData.filter(
                    (tx) => tx.paidAmount > 0 && tx.paidAmount < tx.totalFees,
                  ).length
                }
              </span>
            </span>
            <span className="text-[var(--wms-text-muted)]">
              متأخر:{" "}
              <span className="font-mono font-bold text-[var(--wms-danger)]">
                {transactionsData.filter((tx) => tx.paidAmount === 0).length}
              </span>
            </span>
            <span className="text-[var(--wms-text-muted)]">
              إجمالي الأتعاب:{" "}
              <span className="font-mono font-bold text-[var(--wms-success)]">
                {totals.totalFees.toLocaleString()}
              </span>
            </span>
          </div>

          <button className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-success)] text-white hover:opacity-90 h-[32px] text-[11px] font-bold transition-opacity shadow-sm">
            <Plus className="w-3.5 h-3.5" />
            <span>معاملة جديدة</span>
          </button>

          <button className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] hover:bg-[var(--wms-surface-2)] h-[32px] text-[11px] font-semibold transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>تصدير</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* شريط ملخص مصادر المعاملات */}
        <div className="shrink-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg px-3 py-1.5">
            <ChartColumn className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-[var(--wms-text-sec)] text-[11px] font-semibold">
              ملخص مصادر المعاملات
            </span>
            <span className="w-px bg-[var(--wms-border)] mx-1 h-[16px]"></span>

            {/* فلتر المصادر (ديناميكي يمكن ربطه بالباك إند مستقبلاً) */}
            {["شركاء", "وسطاء", "موظفين", "مكاتب وسطاء", "عميل مباشر"].map(
              (source) => (
                <span
                  key={source}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
                >
                  <span>{source}</span>
                </span>
              ),
            )}
          </div>

          {/* أزرار فلترة المصدر */}
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[var(--wms-text-muted)] text-[10px]">
              فلتر المصدر:
            </span>
            {["الكل", "مكتب ديتيلز", "مكتب خارجي"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveSourceFilter(filter)}
                className={`px-2.5 py-0.5 rounded-md cursor-pointer transition-colors text-[10px] font-semibold ${
                  activeSourceFilter === filter
                    ? "bg-[var(--wms-accent-blue)] text-white"
                    : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)] hover:text-[var(--wms-text)]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================== */}
        {/* الجدول الرئيسي (Table Area) */}
        {/* ========================================== */}
        <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden flex-1 flex flex-col focus:outline-none">
          <div className="flex-1 overflow-auto custom-scrollbar-slim relative min-h-0">
            <table className="w-full border-collapse text-[12px] min-w-[1236px]">
              <thead className="sticky top-0 z-30">
                <tr className="h-[36px] bg-gradient-to-b from-[var(--wms-surface-2)] to-gray-200">
                  <th className="text-center select-none w-[36px] min-w-[36px] border-l border-black/5 bg-gradient-to-b from-[var(--wms-surface-2)] to-gray-200">
                    <button className="cursor-pointer text-[var(--wms-text-muted)] hover:text-[var(--wms-text)]">
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  {/* أعمدة الجدول */}
                  {[
                    { label: "رقم المعاملة", width: "105px" },
                    { label: "اسم المالك", width: "140px" },
                    { label: "الحي", width: "75px", filter: true },
                    { label: "القطاع", width: "80px", filter: true },
                    { label: "نوع المعاملة", width: "80px", filter: true },
                    { label: "المصدر", width: "120px", filter: true },
                    { label: "إجمالي الأتعاب", width: "110px" },
                    { label: "المدفوع", width: "100px" },
                    { label: "المتبقي", width: "110px" },
                    { label: "حالة التحصيل", width: "90px", filter: true },
                    { label: "حالة النظام", width: "90px", filter: true },
                    { label: "التاريخ", width: "100px" },
                  ].map((col, index) => (
                    <th
                      key={index}
                      className="text-right px-2 whitespace-nowrap select-none relative font-bold text-[13px] text-gray-800 border-l border-black/5 cursor-pointer"
                      style={{ width: col.width, minWidth: "45px" }}
                    >
                      <div className="flex items-center gap-1">
                        {index < 3 && (
                          <Pin className="w-2.5 h-2.5 opacity-30" />
                        )}
                        {col.filter && (
                          <Filter className="w-2.5 h-2.5 opacity-40" />
                        )}
                        <span>{col.label}</span>
                        <span className="inline-flex mr-0.5 opacity-30 text-gray-800">
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </div>
                      <div className="absolute left-0 top-0 h-full hover:bg-black/10 cursor-col-resize w-[4px]"></div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="13" className="text-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                      <span className="text-slate-500 font-bold">
                        جاري جلب المعاملات...
                      </span>
                    </td>
                  </tr>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => {
                    const collectionInfo = getCollectionStatus(
                      tx.paidAmount,
                      tx.totalFees,
                    );

                    return (
                      <tr
                        key={tx.id}
                        className={`cursor-pointer transition-colors h-[30px] border-b border-black/5 border-r-[3px] border-r-transparent hover:bg-blue-50/50`}
                      >
                        <td className="text-center sticky right-0 z-10 w-[36px] min-w-[36px] bg-[var(--wms-surface-1)] border-l border-black/5">
                          <button className="cursor-pointer text-[var(--wms-text-muted)] hover:text-[var(--wms-text)]">
                            <Square className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="px-2 whitespace-nowrap sticky right-[36px] z-10 bg-[var(--wms-surface-1)] border-l border-black/5">
                          <span className="font-mono text-[11px] font-semibold text-[var(--wms-accent-blue)]">
                            {tx.ref}
                          </span>
                        </td>
                        <td className="px-2 whitespace-nowrap sticky right-[141px] z-10 bg-[var(--wms-surface-1)] border-l border-black/5 text-[var(--wms-text)] font-bold">
                          {tx.client}
                        </td>
                        <td className="px-2 whitespace-nowrap sticky right-[281px] z-10 bg-[var(--wms-surface-1)] border-l border-black/5 text-[var(--wms-text-sec)]">
                          {tx.district}
                        </td>
                        <td className="px-2 whitespace-nowrap border-l border-black/5 text-[var(--wms-text-sec)]">
                          {tx.sector}
                        </td>
                        <td className="px-2 whitespace-nowrap border-l border-black/5 text-[var(--wms-text-sec)] font-bold">
                          {tx.type}
                        </td>
                        <td className="px-2 whitespace-nowrap border-l border-black/5">
                          <span className="truncate text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                            {tx.source || "غير محدد"}
                          </span>
                        </td>
                        <td className="px-2 whitespace-nowrap border-l border-black/5 font-mono text-[13px] font-bold text-[var(--wms-text-primary)]">
                          {tx.totalFees?.toLocaleString()}
                        </td>
                        <td className="px-2 whitespace-nowrap border-l border-black/5 font-mono text-[13px] font-semibold text-[var(--wms-success)]">
                          {tx.paidAmount?.toLocaleString()}
                        </td>
                        <td className="px-2 whitespace-nowrap border-l border-black/5 font-mono text-[13px] font-bold text-[var(--wms-danger)]">
                          {tx.remainingAmount?.toLocaleString()}
                        </td>
                        <td className="px-2 whitespace-nowrap border-l border-black/5">
                          <span
                            className={`inline-flex items-center h-[20px] px-1.5 rounded-full text-[10px] font-bold ${collectionInfo.color}`}
                          >
                            {collectionInfo.label}
                          </span>
                        </td>
                        <td className="px-2 whitespace-nowrap border-l border-black/5">
                          <span className="inline-flex items-center h-[20px] px-1.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-2 whitespace-nowrap border-l border-black/5 font-mono text-[11px] text-slate-500">
                          {tx.date}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="13"
                      className="text-center py-10 text-slate-400 font-bold"
                    >
                      لا توجد معاملات مسجلة تطابق بحثك
                    </td>
                  </tr>
                )}
              </tbody>

              {/* الفوتر (المجاميع) */}
              <tfoot className="sticky bottom-0 z-30">
                <tr className="h-[34px] bg-gradient-to-b from-gray-200 to-[var(--wms-surface-2)] shadow-inner">
                  <td className="border-l border-black/5"></td>
                  <td className="px-2 font-bold text-[12px] text-[var(--wms-text)] border-l border-black/5">
                    المجموع ({filteredTransactions.length})
                  </td>
                  <td className="border-l border-black/5"></td>
                  <td className="border-l border-black/5"></td>
                  <td className="border-l border-black/5"></td>
                  <td className="border-l border-black/5"></td>
                  <td className="border-l border-black/5"></td>
                  <td className="px-2 font-mono font-bold text-[13px] text-blue-700 border-l border-black/5">
                    {totals.totalFees.toLocaleString()}
                  </td>
                  <td className="px-2 font-mono font-bold text-[13px] text-green-700 border-l border-black/5">
                    {totals.paidAmount.toLocaleString()}
                  </td>
                  <td className="px-2 font-mono font-bold text-[13px] text-red-700 border-l border-black/5">
                    {totals.remainingAmount.toLocaleString()}
                  </td>
                  <td className="border-l border-black/5"></td>
                  <td className="border-l border-black/5"></td>
                  <td className="border-l border-black/5"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* شريط التحكم السفلي (Pagination) */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-[var(--wms-border)] shrink-0 text-[11px] bg-[var(--wms-surface-1)]">
            <span className="text-[var(--wms-text-muted)]">
              عرض {filteredTransactions.length > 0 ? 1 : 0}-
              {filteredTransactions.length} من {filteredTransactions.length} —
              ارتفاع 30px مدمج
            </span>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded hover:bg-[var(--wms-surface-2)] text-[var(--wms-text-muted)] cursor-pointer">
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="px-2 py-0.5 rounded bg-[var(--wms-accent-blue)] text-white text-center min-w-[24px]">
                1
              </span>
              <button className="p-1 rounded hover:bg-[var(--wms-surface-2)] text-[var(--wms-text-muted)] cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
