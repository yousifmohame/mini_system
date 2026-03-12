import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useAppStore } from "../stores/useAppStore";

// 💡 1. الاستيرادات للمودالز المنفصلة (تأكد من وجودها في مجلد components)
import { CreateTransactionModal } from "../components/CreateTransactionModal";
import { TransactionDetailsModal } from "../components/TransactionDetailsModal";

import {
  Search,
  SlidersHorizontal,
  Plus,
  Download,
  EyeOff,
  RefreshCw,
  Square,
  Settings2,
  Pin,
  ArrowRight,
  ArrowLeft,
  ChartColumn,
  Loader2,
  ChevronDown,
} from "lucide-react";

// =========================================================================
// مكون الصفحة الرئيسي (الجدول والداشبورد)
// =========================================================================
const TransactionsPage = () => {
  const queryClient = useQueryClient();
  const { openScreens, activeScreenId } = useAppStore();
  const activeScreen = openScreens.find((s) => s.id === activeScreenId);
  const activeSector = activeScreen?.props?.sector || "الكل";

  const [activeSourceFilter, setActiveSourceFilter] = useState("الكل");
  const [searchQuery, setSearchQuery] = useState("");

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  // 💡 التحكم في مودال الإنشاء الجديد
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 1. جلب البيانات من الباك إند
  const {
    data: transactionsData = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["private-transactions-full"],
    queryFn: async () => {
      const res = await api.get("/private-transactions");
      return res.data?.data || [];
    },
  });

  // فلترة البيانات
  const filteredTransactions = useMemo(() => {
    return transactionsData.filter((tx) => {
      const matchesSearch =
        searchQuery === "" ||
        tx.ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.district?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource =
        activeSourceFilter === "الكل" ||
        tx.sourceName === activeSourceFilter ||
        tx.sourceType === activeSourceFilter ||
        tx.source === activeSourceFilter;
      const matchesSector =
        activeSector === "الكل" || tx.sector?.includes(activeSector);
      return matchesSearch && matchesSource && matchesSector;
    });
  }, [transactionsData, searchQuery, activeSourceFilter, activeSector]);

  // حساب المجاميع
  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        acc.totalFees += parseFloat(tx.totalPrice || tx.totalFees) || 0;
        acc.paidAmount += parseFloat(tx.collectionAmount || tx.paidAmount) || 0;
        acc.remainingAmount += parseFloat(tx.remainingAmount) || 0;
        return acc;
      },
      { totalFees: 0, paidAmount: 0, remainingAmount: 0 },
    );
  }, [filteredTransactions]);

  const handleRowClick = (tx) => {
    setSelectedTx(tx);
    setIsTxModalOpen(true);
  };

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
      {/* 💡 استدعاء نافذة التفاصيل (المفصولة) */}
      <TransactionDetailsModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        tx={selectedTx}
        refetchTable={refetch}
      />

      {/* 💡 استدعاء نافذة الإنشاء (المفصولة) */}
      <CreateTransactionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        refetchTable={refetch}
      />

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
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالرقم، المالك، الحي، الوسيط..."
              className="w-full bg-white border border-gray-200 rounded-md pr-8 pl-3 text-gray-700 placeholder:text-gray-400 h-[32px] text-[12px] outline-none focus:border-blue-500"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 h-[32px] text-[11px] font-semibold transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>فلاتر</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 h-[32px] text-[11px] font-semibold transition-colors">
            <Settings2 className="w-3.5 h-3.5" />
            <span>الأعمدة</span>
          </button>
          <button className="flex items-center gap-1 px-2.5 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 h-[32px] text-[11px] font-semibold transition-colors">
            <EyeOff className="w-3 h-3" />
            <span>إخفاء المُسوّى</span>
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center justify-center w-[32px] rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 h-[32px] transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-blue-500" : ""}`}
            />
          </button>
          <div className="flex-1"></div>

          {/* ملخص المبالغ العلوية */}
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-gray-500">
              الإجمالي:{" "}
              <span className="text-gray-800 font-mono font-bold">
                {transactionsData.length}
              </span>
            </span>
            <span className="text-gray-500">
              محصّل:{" "}
              <span className="font-mono font-bold text-green-600">
                {
                  transactionsData.filter(
                    (tx) =>
                      (tx.collectionAmount || tx.paidAmount) >=
                        (tx.totalPrice || tx.totalFees) &&
                      (tx.totalPrice || tx.totalFees) > 0,
                  ).length
                }
              </span>
            </span>
            <span className="text-gray-500">
              معلّق:{" "}
              <span className="font-mono font-bold text-amber-500">
                {
                  transactionsData.filter(
                    (tx) =>
                      (tx.collectionAmount || tx.paidAmount) > 0 &&
                      (tx.collectionAmount || tx.paidAmount) <
                        (tx.totalPrice || tx.totalFees),
                  ).length
                }
              </span>
            </span>
            <span className="text-gray-500">
              متأخر:{" "}
              <span className="font-mono font-bold text-red-600">
                {
                  transactionsData.filter(
                    (tx) => (tx.collectionAmount || tx.paidAmount) === 0,
                  ).length
                }
              </span>
            </span>
            <span className="text-gray-500">
              إجمالي الأتعاب:{" "}
              <span className="font-mono font-bold text-green-600">
                {totals.totalFees.toLocaleString()}
              </span>
            </span>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 rounded-md bg-green-600 text-white hover:opacity-90 h-[32px] text-[11px] font-bold transition-opacity shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>معاملة جديدة</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 h-[32px] text-[11px] font-semibold transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>تصدير</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* شريط ملخص مصادر المعاملات */}
        <div className="shrink-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <ChartColumn className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-gray-600 text-[11px] font-semibold">
              ملخص مصادر المعاملات
            </span>
            <span className="w-px bg-gray-200 mx-1 h-[16px]"></span>
            {["شريك بالمكتب", "مكتب وسيط", "موظف", "عميل مباشر"].map(
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
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-gray-400 text-[10px]">فلتر المصدر:</span>
            {["الكل", "مكتب ديتيلز", "مكتب خارجي"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveSourceFilter(filter)}
                className={`px-2.5 py-0.5 rounded-md cursor-pointer transition-colors text-[10px] font-semibold ${activeSourceFilter === filter ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-500 hover:text-gray-800"}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* الجدول الرئيسي */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex-1 flex flex-col focus:outline-none shadow-sm">
          <div className="flex-1 overflow-auto custom-scrollbar-slim relative min-h-0">
            <table className="w-full border-collapse text-[12px] min-w-[1236px]">
              <thead className="sticky top-0 z-30">
                <tr className="h-[36px] bg-gray-50 border-b border-gray-200">
                  <th className="text-center select-none w-[36px] min-w-[36px] border-l border-gray-200">
                    <Square className="w-3.5 h-3.5 inline text-gray-400" />
                  </th>
                  {[
                    { label: "رقم المعاملة", width: "105px" },
                    { label: "اسم المالك", width: "140px" },
                    { label: "الحي", width: "75px" },
                    { label: "القطاع", width: "80px" },
                    { label: "نوع المعاملة", width: "80px" },
                    { label: "المصدر", width: "120px" },
                    { label: "إجمالي الأتعاب", width: "110px" },
                    { label: "المدفوع", width: "100px" },
                    { label: "المتبقي", width: "110px" },
                    { label: "حالة التحصيل", width: "90px" },
                    { label: "حالة النظام", width: "90px" },
                    { label: "التاريخ", width: "100px" },
                  ].map((col, index) => (
                    <th
                      key={index}
                      className="text-right px-2 whitespace-nowrap select-none font-bold text-[11px] text-gray-600 border-l border-gray-200"
                      style={{ width: col.width, minWidth: "45px" }}
                    >
                      <div className="flex items-center gap-1">
                        <span>{col.label}</span>
                      </div>
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
                      tx.collectionAmount || tx.paidAmount,
                      tx.totalPrice || tx.totalFees,
                    );
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => handleRowClick(tx)}
                        className="cursor-pointer transition-colors h-[32px] border-b border-gray-100 hover:bg-blue-50 group"
                      >
                        <td className="text-center border-l border-gray-100">
                          <Square className="w-3.5 h-3.5 inline text-gray-300" />
                        </td>
                        <td className="px-2 border-l border-gray-100">
                          <span className="font-mono text-[11.5px] font-bold text-blue-600 group-hover:underline">
                            {tx.ref || tx.id}
                          </span>
                        </td>
                        <td className="px-2 border-l border-gray-100 font-bold text-gray-700">
                          {tx.client || tx.owner}
                        </td>
                        <td className="px-2 border-l border-gray-100 text-gray-500">
                          {tx.district}
                        </td>
                        <td className="px-2 border-l border-gray-100 text-gray-500">
                          {tx.sector}
                        </td>
                        <td className="px-2 border-l border-gray-100 font-bold text-gray-600">
                          {tx.type}
                        </td>
                        <td className="px-2 border-l border-gray-100">
                          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                            {tx.sourceName || tx.source || "مباشر"}
                          </span>
                        </td>
                        <td className="px-2 border-l border-gray-100 font-mono font-bold text-gray-800">
                          {(
                            tx.totalPrice ||
                            tx.totalFees ||
                            0
                          ).toLocaleString()}
                        </td>
                        <td className="px-2 border-l border-gray-100 font-mono font-bold text-green-600">
                          {(
                            tx.collectionAmount ||
                            tx.paidAmount ||
                            0
                          ).toLocaleString()}
                        </td>
                        <td className="px-2 border-l border-gray-100 font-mono font-bold text-red-600">
                          {(tx.remainingAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-2 border-l border-gray-100">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${collectionInfo.color}`}
                          >
                            {collectionInfo.label}
                          </span>
                        </td>
                        <td className="px-2 border-l border-gray-100">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-600">
                            {tx.status || tx.transactionStatus || "مسجلة"}
                          </span>
                        </td>
                        <td className="px-2 border-l border-gray-100 font-mono text-[10px] text-gray-400">
                          {tx.created || tx.date}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="13"
                      className="text-center py-10 text-gray-400 font-bold"
                    >
                      لا توجد معاملات
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="sticky bottom-0 z-30">
                <tr className="h-[34px] bg-gray-100 border-t border-gray-200">
                  <td className="border-l border-gray-200"></td>
                  <td className="px-2 font-bold text-[11px] text-gray-700 border-l border-gray-200">
                    المجموع ({filteredTransactions.length})
                  </td>
                  <td className="border-l border-gray-200"></td>
                  <td className="border-l border-gray-200"></td>
                  <td className="border-l border-gray-200"></td>
                  <td className="border-l border-gray-200"></td>
                  <td className="border-l border-gray-200"></td>
                  <td className="px-2 font-mono font-bold text-[12px] text-blue-700 border-l border-gray-200">
                    {totals.totalFees.toLocaleString()}
                  </td>
                  <td className="px-2 font-mono font-bold text-[12px] text-green-700 border-l border-gray-200">
                    {totals.paidAmount.toLocaleString()}
                  </td>
                  <td className="px-2 font-mono font-bold text-[12px] text-red-700 border-l border-gray-200">
                    {totals.remainingAmount.toLocaleString()}
                  </td>
                  <td className="border-l border-gray-200"></td>
                  <td className="border-l border-gray-200"></td>
                  <td className="border-l border-gray-200"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5 border-t border-gray-200 shrink-0 text-[11px] bg-gray-50">
            <span className="text-gray-500">
              عرض {filteredTransactions.length > 0 ? 1 : 0}-
              {filteredTransactions.length} من {filteredTransactions.length}
            </span>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded hover:bg-gray-200 text-gray-500">
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-center min-w-[24px]">
                1
              </span>
              <button className="p-1 rounded hover:bg-gray-200 text-gray-500">
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
