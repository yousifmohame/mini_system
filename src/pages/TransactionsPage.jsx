import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useAppStore } from "../stores/useAppStore";
import { useAuth } from "../context/AuthContext";
import { usePermissionBuilder } from "../context/PermissionBuilderContext";
import AccessControl from "../components/AccessControl";
import { toast } from "sonner"; // 👈 استيراد الإشعارات

// 💡 الاستيرادات للمودالز المنفصلة
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
  Lock,
  Filter,
} from "lucide-react";

// =========================================================================
// مكون الصفحة الرئيسي (الجدول والداشبورد)
// =========================================================================
const TransactionsPage = () => {
  const queryClient = useQueryClient();
  const { openScreens, activeScreenId } = useAppStore();
  const activeScreen = openScreens.find((s) => s.id === activeScreenId);
  const activeSector = activeScreen?.props?.sector || "الكل";

  const { user } = useAuth();
  const { isBuildMode } = usePermissionBuilder();
  const userPermissions = user?.permissions || [];
  const isSuperAdmin = user?.email === "admin@wms.com";

  // متغيرات الصلاحيات المنفصلة لكل عمود
  const hasTotalAccess =
    isSuperAdmin || isBuildMode || userPermissions.includes("TXN_COL_TOTAL");
  const hasPaidAccess =
    isSuperAdmin || isBuildMode || userPermissions.includes("TXN_COL_PAID");
  const hasRemainingAccess =
    isSuperAdmin ||
    isBuildMode ||
    userPermissions.includes("TXN_COL_REMAINING");
  const hasCollStatusAccess =
    isSuperAdmin || isBuildMode || userPermissions.includes("TXN_COL_STATUS");

  let totalVisibleColumns = 10;
  if (hasTotalAccess) totalVisibleColumns++;
  if (hasPaidAccess) totalVisibleColumns++;
  if (hasRemainingAccess) totalVisibleColumns++;
  if (hasCollStatusAccess) totalVisibleColumns++;

  const [activeSourceFilter, setActiveSourceFilter] = useState("الكل");
  const [searchQuery, setSearchQuery] = useState("");

  // 👈 State للفلاتر المتقدمة
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advFilters, setAdvFilters] = useState({
    type: "الكل",
    sysStatus: "الكل",
  });

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // جلب البيانات من الباك إند
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

  const { data: persons = [] } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => {
      const res = await api.get("/persons");
      return res.data?.data || [];
    },
  });

  const filterSources = useMemo(() => {
    const sourcesSet = new Set();
    sourcesSet.add("الكل");
    sourcesSet.add("مكتب ديتيلز");

    persons.forEach((person) => {
      if (
        person.role === "وسيط المكتب الهندسي" ||
        person.role === "مكتب خارجي" ||
        person.role === "شركة"
      ) {
        sourcesSet.add(person.name);
      }
    });

    transactionsData.forEach((tx) => {
      const source = tx.sourceName || tx.source;
      if (source && source !== "مباشر" && source !== "غير محدد")
        sourcesSet.add(source);
    });

    return Array.from(sourcesSet);
  }, [persons, transactionsData]);

  // 👈 فلترة البيانات (شاملة الفلاتر المتقدمة والبحث)
  const filteredTransactions = useMemo(() => {
    return transactionsData.filter((tx) => {
      const internalName = tx.internalName || tx.notes?.internalName || "";

      const matchesSearch =
        searchQuery === "" ||
        tx.ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        internalName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSource =
        activeSourceFilter === "الكل" ||
        tx.sourceName === activeSourceFilter ||
        tx.sourceType === activeSourceFilter ||
        tx.source === activeSourceFilter;

      const matchesSector =
        activeSector === "الكل" || tx.sector?.includes(activeSector);

      const matchesType =
        advFilters.type === "الكل" || tx.type === advFilters.type;
      const sysStat = tx.status || tx.transactionStatus || "مسجلة";
      const matchesSysStatus =
        advFilters.sysStatus === "الكل" || sysStat === advFilters.sysStatus;

      return (
        matchesSearch &&
        matchesSource &&
        matchesSector &&
        matchesType &&
        matchesSysStatus
      );
    });
  }, [
    transactionsData,
    searchQuery,
    activeSourceFilter,
    activeSector,
    advFilters,
  ]);

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

  // 👈 دالة التصدير الاحترافية إلى CSV (تدعم العربية)
  const exportToCSV = () => {
    try {
      const headers = [
        "رقم المعاملة",
        "الاسم المتداول",
        "اسم المالك",
        "الحي",
        "القطاع",
        "نوع المعاملة",
        "المصدر",
      ];
      if (hasTotalAccess) headers.push("إجمالي الأتعاب");
      if (hasPaidAccess) headers.push("المدفوع");
      if (hasRemainingAccess) headers.push("المتبقي");
      headers.push("حالة النظام", "التاريخ");

      const rows = filteredTransactions.map((tx) => {
        const row = [
          tx.ref || tx.id,
          tx.internalName || tx.notes?.internalName || "—",
          tx.client || tx.owner,
          tx.district,
          tx.sector,
          tx.type,
          tx.sourceName || tx.source || "مباشر",
        ];

        if (hasTotalAccess) row.push(tx.totalPrice || tx.totalFees || 0);
        if (hasPaidAccess) row.push(tx.collectionAmount || tx.paidAmount || 0);
        if (hasRemainingAccess) row.push(tx.remainingAmount || 0);

        row.push(
          tx.status || tx.transactionStatus || "مسجلة",
          tx.created || tx.date,
        );

        // تنظيف النصوص من الفواصل لتجنب تكسير ملف CSV
        return row
          .map((item) => `"${String(item).replace(/"/g, '""')}"`)
          .join(",");
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n"); // \uFEFF لدعم اللغة العربية في Excel
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `Transactions_Export_${new Date().toLocaleDateString("en-GB")}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("تم تصدير البيانات إلى Excel بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء التصدير");
    }
  };

  // 👈 دالة التحديث مع إشعار
  const handleRefresh = async () => {
    await refetch();
    toast.success("تم تحديث بيانات المعاملات");
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden bg-[var(--wms-bg-0)] font-sans"
      dir="rtl"
    >
      {isTxModalOpen && (
        <TransactionDetailsModal
          isOpen={isTxModalOpen}
          onClose={() => setIsTxModalOpen(false)}
          tx={selectedTx}
          refetchTable={refetch}
        />
      )}

      {isCreateModalOpen && (
        <CreateTransactionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          refetchTable={refetch}
        />
      )}

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

      <div className="p-3 flex flex-col gap-2 flex-1 overflow-hidden">
        {/* شريط الأدوات العلوي */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="relative flex-1 max-w-[300px]">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالرقم، المالك، الحي، الاسم المتداول..."
              className="w-full bg-white border border-gray-200 rounded-md pr-8 pl-3 text-gray-700 placeholder:text-gray-400 h-[32px] text-[12px] outline-none focus:border-blue-500"
            />
          </div>

          {/* 👈 زر الفلاتر */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-1.5 px-3 rounded-md border h-[32px] text-[11px] font-semibold transition-colors ${showAdvancedFilters ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>فلاتر متقدمة</span>
          </button>

          {/* 👈 زر التحديث */}
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center w-[32px] rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 h-[32px] transition-colors"
            title="تحديث البيانات"
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

            {hasPaidAccess && (
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
            )}

            {hasRemainingAccess && (
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
            )}

            {hasTotalAccess && (
              <span className="text-gray-500">
                إجمالي الأتعاب:{" "}
                <span className="font-mono font-bold text-green-600">
                  {totals.totalFees.toLocaleString()}
                </span>
              </span>
            )}
          </div>

          <AccessControl
            code="TXN_ACTION_CREATE"
            name="إنشاء معاملة جديدة"
            moduleName="إدارة المعاملات"
            tabName="الجدول"
            type="action"
          >
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 rounded-md bg-green-600 text-white hover:opacity-90 h-[32px] text-[11px] font-bold transition-opacity shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>معاملة جديدة</span>
            </button>
          </AccessControl>

          {/* 👈 زر التصدير */}
          <AccessControl
            code="TXN_ACTION_EXPORT"
            name="تصدير جدول المعاملات"
            moduleName="إدارة المعاملات"
            tabName="الجدول"
            type="action"
          >
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 h-[32px] text-[11px] font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير Excel</span>
            </button>
          </AccessControl>
        </div>

        {/* 👈 لوحة الفلاتر المتقدمة (تظهر وتختفي) */}
        {showAdvancedFilters && (
          <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 shrink-0">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-500" />
              <span className="text-[11px] font-bold text-gray-700">
                تصفية إضافية:
              </span>
            </div>

            <select
              value={advFilters.type}
              onChange={(e) =>
                setAdvFilters({ ...advFilters, type: e.target.value })
              }
              className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-[11px] font-semibold text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="الكل">كل أنواع المعاملات</option>
              <option value="اصدار">اصدار</option>
              <option value="تجديد">تجديد</option>
              <option value="تعديل">تعديل</option>
            </select>

            <select
              value={advFilters.sysStatus}
              onChange={(e) =>
                setAdvFilters({ ...advFilters, sysStatus: e.target.value })
              }
              className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-[11px] font-semibold text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="الكل">كل حالات النظام</option>
              <option value="جارية">جارية</option>
              <option value="مكتملة">مكتملة</option>
              <option value="مجمّدة">مجمّدة</option>
            </select>

            <div className="flex-1"></div>

            <button
              onClick={() => setAdvFilters({ type: "الكل", sysStatus: "الكل" })}
              className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded"
            >
              مسح الفلاتر
            </button>
          </div>
        )}

        {/* شريط ملخص مصادر المعاملات */}
        <div className="shrink-0 space-y-1.5">
          <div className="flex items-center gap-1.5 px-1 flex-wrap">
            <span className="text-gray-400 text-[10px]">فلتر المصدر:</span>
            {filterSources.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveSourceFilter(filter)}
                className={`px-2.5 py-0.5 rounded-md cursor-pointer transition-colors text-[10px] font-semibold ${
                  activeSourceFilter === filter
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* الجدول الرئيسي */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex-1 flex flex-col focus:outline-none shadow-sm">
          <div className="flex-1 overflow-auto custom-scrollbar-slim relative min-h-0">
            <table className="w-full border-collapse text-[12px] min-w-[1300px]">
              <thead className="sticky top-0 z-30">
                <tr className="h-[36px] bg-gray-50 border-b border-gray-200">
                  <th className="text-center select-none w-[36px] min-w-[36px] border-l border-gray-200">
                    <Square className="w-3.5 h-3.5 inline text-gray-400" />
                  </th>
                  <th
                    className="text-right px-2 whitespace-nowrap font-bold text-[11px] text-gray-600 border-l border-gray-200"
                    style={{ width: "105px" }}
                  >
                    رقم المعاملة
                  </th>
                  <th
                    className="text-right px-2 whitespace-nowrap font-bold text-[11px] text-gray-600 border-l border-gray-200"
                    style={{ width: "140px" }}
                  >
                    الاسم المتداول
                  </th>
                  <th
                    className="text-right px-2 whitespace-nowrap font-bold text-[11px] text-gray-600 border-l border-gray-200"
                    style={{ width: "140px" }}
                  >
                    اسم المالك
                  </th>
                  <th
                    className="text-right px-2 whitespace-nowrap font-bold text-[11px] text-gray-600 border-l border-gray-200"
                    style={{ width: "75px" }}
                  >
                    الحي
                  </th>
                  <th
                    className="text-right px-2 whitespace-nowrap font-bold text-[11px] text-gray-600 border-l border-gray-200"
                    style={{ width: "80px" }}
                  >
                    القطاع
                  </th>
                  <th
                    className="text-right px-2 whitespace-nowrap font-bold text-[11px] text-gray-600 border-l border-gray-200"
                    style={{ width: "80px" }}
                  >
                    نوع المعاملة
                  </th>
                  <th
                    className="text-right px-2 whitespace-nowrap font-bold text-[11px] text-gray-600 border-l border-gray-200"
                    style={{ width: "120px" }}
                  >
                    المصدر
                  </th>

                  {hasTotalAccess && (
                    <th
                      className="text-right px-2 whitespace-nowrap font-bold text-[11px] text-gray-600 border-l border-gray-200"
                      style={{ width: "110px" }}
                    >
                      <AccessControl
                        code="TXN_COL_TOTAL"
                        name="عمود إجمالي الأتعاب"
                        moduleName="إدارة المعاملات"
                        tabName="الجدول"
                      >
                        <span>إجمالي الأتعاب</span>
                      </AccessControl>
                    </th>
                  )}

                  {hasPaidAccess && (
                    <th
                      className="text-right px-2 whitespace-nowrap font-bold text-[11px] text-gray-600 border-l border-gray-200"
                      style={{ width: "100px" }}
                    >
                      <AccessControl
                        code="TXN_COL_PAID"
                        name="عمود المدفوع"
                        moduleName="إدارة المعاملات"
                        tabName="الجدول"
                      >
                        <span>المدفوع</span>
                      </AccessControl>
                    </th>
                  )}

                  {hasRemainingAccess && (
                    <th
                      className="text-right px-2 whitespace-nowrap font-bold text-[11px] text-gray-600 border-l border-gray-200"
                      style={{ width: "110px" }}
                    >
                      <AccessControl
                        code="TXN_COL_REMAINING"
                        name="عمود المتبقي"
                        moduleName="إدارة المعاملات"
                        tabName="الجدول"
                      >
                        <span>المتبقي</span>
                      </AccessControl>
                    </th>
                  )}

                  {hasCollStatusAccess && (
                    <th
                      className="text-right px-2 whitespace-nowrap font-bold text-[11px] text-gray-600 border-l border-gray-200"
                      style={{ width: "110px" }}
                    >
                      <AccessControl
                        code="TXN_COL_STATUS"
                        name="عمود حالة التحصيل"
                        moduleName="إدارة المعاملات"
                        tabName="الجدول"
                      >
                        <span>حالة التحصيل المالي</span>
                      </AccessControl>
                    </th>
                  )}

                  <th
                    className="text-right px-2 whitespace-nowrap font-bold text-[11px] text-gray-600 border-l border-gray-200"
                    style={{ width: "90px" }}
                  >
                    حالة المعاملة
                  </th>
                  <th
                    className="text-right px-2 whitespace-nowrap font-bold text-[11px] text-gray-600 border-l border-gray-200"
                    style={{ width: "100px" }}
                  >
                    التاريخ
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={totalVisibleColumns}
                      className="text-center py-10"
                    >
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                      <span className="text-slate-500 font-bold">
                        جاري جلب المعاملات...
                      </span>
                    </td>
                  </tr>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => {
                    const internalName =
                      tx.internalName || tx.notes?.internalName || "—";

                    // 👈 حسابات حالة التحصيل المتقدمة
                    const total =
                      parseFloat(tx.totalPrice || tx.totalFees) || 0;
                    const paid =
                      parseFloat(tx.collectionAmount || tx.paidAmount) || 0;
                    const remaining =
                      parseFloat(tx.remainingAmount) ||
                      (total > 0 ? total - paid : 0);
                    const percent =
                      total > 0
                        ? Math.min(100, Math.round((paid / total) * 100))
                        : 0;
                    const progressColor =
                      percent === 100
                        ? "bg-green-500"
                        : percent > 0
                          ? "bg-amber-400"
                          : "bg-red-500";

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => handleRowClick(tx)}
                        className="cursor-pointer transition-colors border-b border-gray-100 hover:bg-blue-50 group"
                      >
                        <td className="text-center border-l border-gray-100 py-2">
                          <Square className="w-3.5 h-3.5 inline text-gray-300" />
                        </td>
                        <td className="px-2 border-l border-gray-100 py-2">
                          <span className="font-mono text-[11.5px] font-bold text-blue-600 group-hover:underline">
                            {tx.ref || tx.id}
                          </span>
                        </td>
                        <td className="px-2 border-l border-gray-100 font-bold text-gray-600 text-[10px] py-2">
                          {internalName}
                        </td>
                        <td className="px-2 border-l border-gray-100 font-bold text-gray-700 py-2">
                          {tx.client || tx.owner}
                        </td>
                        <td className="px-2 border-l border-gray-100 text-gray-500 py-2">
                          {tx.district}
                        </td>
                        <td className="px-2 border-l border-gray-100 text-gray-500 py-2">
                          {tx.sector}
                        </td>
                        <td className="px-2 border-l border-gray-100 font-bold text-gray-600 py-2">
                          {tx.type}
                        </td>
                        <td className="px-2 border-l border-gray-100 py-2">
                          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                            {tx.sourceName || tx.source || "مباشر"}
                          </span>
                        </td>

                        {hasTotalAccess && (
                          <td className="px-2 border-l border-gray-100 font-mono font-bold text-gray-800 py-2">
                            {(
                              tx.totalPrice ||
                              tx.totalFees ||
                              0
                            ).toLocaleString()}
                          </td>
                        )}

                        {hasPaidAccess && (
                          <td className="px-2 border-l border-gray-100 font-mono font-bold text-green-600 py-2">
                            {(
                              tx.collectionAmount ||
                              tx.paidAmount ||
                              0
                            ).toLocaleString()}
                          </td>
                        )}

                        {hasRemainingAccess && (
                          <td className="px-2 border-l border-gray-100 font-mono font-bold text-red-600 py-2">
                            {(tx.remainingAmount || 0).toLocaleString()}
                          </td>
                        )}

                        {/* 👈 تصميم حالة التحصيل المدمج المتطور */}
                        {hasCollStatusAccess && (
                          <td className="px-2 border-l border-gray-100 align-middle py-1.5">
                            <AccessControl
                              code="TXN_COL_STATUS"
                              name="رؤية حالة التحصيل"
                              moduleName="إدارة المعاملات"
                              tabName="الجدول"
                              fallback={
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                  <Lock className="w-2 h-2" /> محمي
                                </span>
                              }
                            >
                              <div className="flex flex-col gap-1 w-full max-w-[100px]">
                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden border border-gray-300/50">
                                  <div
                                    className={`h-full ${progressColor} transition-all duration-500`}
                                    style={{ width: `${percent}%` }}
                                  ></div>
                                </div>
                                <div className="flex flex-col text-[9.5px] font-mono leading-tight">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      النسبة:
                                    </span>
                                    <span className="font-bold text-gray-800">
                                      {percent}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">محصل:</span>
                                    <span className="font-bold text-green-600">
                                      {paid.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">
                                      متبقي:
                                    </span>
                                    <span className="font-bold text-red-500">
                                      {remaining.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </AccessControl>
                          </td>
                        )}

                        <td className="px-2 border-l border-gray-100 py-2">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-600">
                            {tx.status || tx.transactionStatus || "مسجلة"}
                          </span>
                        </td>
                        <td className="px-2 border-l border-gray-100 font-mono text-[10px] text-gray-400 py-2">
                          {tx.created || tx.date}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={totalVisibleColumns}
                      className="text-center py-10 text-gray-400 font-bold"
                    >
                      لا توجد معاملات مطابقة للبحث
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
                  <td className="border-l border-gray-200"></td>

                  {hasTotalAccess && (
                    <td className="px-2 font-mono font-bold text-[12px] text-blue-700 border-l border-gray-200">
                      {totals.totalFees.toLocaleString()}
                    </td>
                  )}
                  {hasPaidAccess && (
                    <td className="px-2 font-mono font-bold text-[12px] text-green-700 border-l border-gray-200">
                      {totals.paidAmount.toLocaleString()}
                    </td>
                  )}
                  {hasRemainingAccess && (
                    <td className="px-2 font-mono font-bold text-[12px] text-red-700 border-l border-gray-200">
                      {totals.remainingAmount.toLocaleString()}
                    </td>
                  )}
                  {hasCollStatusAccess && (
                    <td className="border-l border-gray-200"></td>
                  )}

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
