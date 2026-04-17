import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../api/axios";
import { useAppStore } from "../../../stores/useAppStore";
import { useAuth } from "../../../context/AuthContext";
import { usePermissionBuilder } from "../../../context/PermissionBuilderContext";
import AccessControl from "../../../components/AccessControl";
import { toast } from "sonner";

import { CreateTransactionModal } from "../../../components/CreateTransactionModal";
import { TransactionDetailsModal } from "../../../components/TransactionDetails/components/TransactionDetailsModal";

import {
  Search,
  SlidersHorizontal,
  Plus,
  Download,
  RefreshCw,
  Square,
  Pin,
  Loader2,
  ChevronDown,
  Lock,
  Filter,
  Settings2,
  Trash2,
  X,
  Edit3,
  Users,
  Activity,
} from "lucide-react";

// =========================================================================
// مكون إدارة مصادر المعاملات (Modal)
// =========================================================================
const ManageSourcesModal = ({ isOpen, onClose, availableEntities = [] }) => {
  const queryClient = useQueryClient();
  const [newSourceName, setNewSourceName] = useState("");
  const [isManualInput, setIsManualInput] = useState(false);

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["transaction-sources"],
    queryFn: async () => {
      const res = await api.get("/transaction-sources");
      return res.data?.data || [];
    },
    enabled: isOpen,
  });

  const addMutation = useMutation({
    mutationFn: async (name) =>
      await api.post("/transaction-sources", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries(["transaction-sources"]);
      setNewSourceName("");
      toast.success("تمت إضافة المصدر بنجاح");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "هذا المصدر موجود مسبقاً"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/transaction-sources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["transaction-sources"]);
      toast.success("تم الحذف بنجاح");
    },
    onError: () => toast.error("لا يمكن الحذف، قد يكون مرتبطاً ببيانات أخرى"),
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (newSourceName.trim()) {
      addMutation.mutate(newSourceName);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 font-sans"
      dir="rtl"
    >
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-gray-50 px-5 py-3.5 flex justify-between items-center border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-[14px] flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-blue-600" />
            إدارة مصادر المعاملات
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-5">
            <label className="text-[11px] font-bold text-gray-600">
              إضافة (مكتب / شخص) كجهة مصدر للفلترة:
            </label>
            <div className="flex gap-2">
              {!isManualInput ? (
                <div className="relative flex-1">
                  <select
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-[12px] font-semibold outline-none focus:border-blue-500 appearance-none bg-white"
                  >
                    <option value="" disabled>
                      اختر من المكاتب والأشخاص المسجلين...
                    </option>
                    {availableEntities.map((entity, idx) => (
                      <option key={idx} value={entity}>
                        {entity}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              ) : (
                <input
                  type="text"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  placeholder="اكتب اسم المصدر يدوياً..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[12px] outline-none focus:border-blue-500"
                  autoFocus
                />
              )}

              <button
                type="submit"
                disabled={addMutation.isPending || !newSourceName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 text-[12px] font-bold disabled:opacity-50 transition-colors"
              >
                {addMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                إضافة
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsManualInput(!isManualInput);
                setNewSourceName("");
              }}
              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold self-start mt-1 flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              {isManualInput
                ? "العودة لاختيار جهة من القائمة المسجلة"
                : "إضافة مصدر غير موجود في القائمة يدوياً؟"}
            </button>
          </form>

          <div className="max-h-[250px] overflow-y-auto pr-1 custom-scrollbar-slim border border-gray-100 rounded-lg p-1 bg-gray-50/50">
            {isLoading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : sources.length === 0 ? (
              <p className="text-center text-gray-400 text-[11px] py-6 font-semibold">
                لم تقم بإضافة أي مصادر خاصة للفلترة حتى الآن.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {sources.map((source) => (
                  <li
                    key={source.id}
                    className="flex justify-between items-center bg-white border border-gray-100 px-3 py-2 rounded-lg shadow-sm"
                  >
                    <span className="font-bold text-gray-700 text-[11.5px]">
                      {source.name}
                    </span>
                    <button
                      onClick={() => deleteMutation.mutate(source.id)}
                      disabled={deleteMutation.isPending}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// مكون الصفحة الرئيسي
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

  // الفلاتر
  const [activeSourceFilter, setActiveSourceFilter] = useState("الكل");
  const [activeClientFilter, setActiveClientFilter] = useState("الكل");
  const [activeStatusFilter, setActiveStatusFilter] = useState("الكل");
  const [searchQuery, setSearchQuery] = useState("");

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advFilters, setAdvFilters] = useState({
    type: "الكل",
  });

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManageSourcesOpen, setIsManageSourcesOpen] = useState(false);

  // 💡 1. إعداد حالة التمرير اللانهائي
  const [visibleCount, setVisibleCount] = useState(50);

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

  const { data: coopOffices = [] } = useQuery({
    queryKey: ["coop-offices-list"],
    queryFn: async () => {
      const res = await api.get("/coop-offices");
      return res.data?.data || [];
    },
  });

  const { data: persons = [] } = useQuery({
    queryKey: ["persons-list"],
    queryFn: async () => {
      const res = await api.get("/persons");
      return res.data?.data || [];
    },
  });

  const { data: dbSources = [] } = useQuery({
    queryKey: ["transaction-sources"],
    queryFn: async () => {
      const res = await api.get("/transaction-sources");
      return res.data?.data || [];
    },
  });

  const availableEntities = useMemo(() => {
    const offices = coopOffices.map((o) => o.name).filter(Boolean);
    const people = persons.map((p) => p.name).filter(Boolean);
    return Array.from(new Set([...offices, ...people])).sort();
  }, [coopOffices, persons]);

  const uniqueClients = useMemo(() => {
    const clients = transactionsData
      .map((tx) => tx.client || tx.owner)
      .filter(Boolean);
    return ["الكل", ...new Set(clients)].sort();
  }, [transactionsData]);

  const uniqueStatuses = useMemo(() => {
    const statuses = transactionsData
      .map(
        (tx) =>
          tx.status ||
          tx.transactionStatus ||
          tx.notes?.transactionStatusData?.currentStatus ||
          tx.notes?.status ||
          "مسجلة",
      )
      .filter(Boolean);
    return ["الكل", ...new Set(statuses)].sort();
  }, [transactionsData]);

  const mainFilters = useMemo(() => {
    const base = ["الكل"];
    const custom = dbSources.map((s) => s.name);
    return Array.from(new Set([...base, ...custom]));
  }, [dbSources]);

  const dynamicSources = useMemo(() => {
    const sourcesSet = new Set();
    transactionsData.forEach((tx) => {
      const source = tx.sourceName || tx.source;
      if (source && source !== "غير محدد") {
        sourcesSet.add(source);
      }
    });
    mainFilters.forEach((f) => sourcesSet.delete(f));
    return Array.from(sourcesSet).sort();
  }, [transactionsData, mainFilters]);

  // 💡 2. إعادة تعيين العداد عند تغيير أي فلتر
  useEffect(() => {
    setVisibleCount(50);
  }, [
    searchQuery,
    activeSourceFilter,
    activeClientFilter,
    activeStatusFilter,
    activeSector,
    advFilters,
  ]);

  const filteredTransactions = useMemo(() => {
    return transactionsData.filter((tx) => {
      const internalName = tx.internalName || tx.notes?.internalName || "";
      const txClientName = tx.client || tx.owner || "";
      const sysStat =
        tx.status ||
        tx.transactionStatus ||
        tx.notes?.transactionStatusData?.currentStatus ||
        tx.notes?.status ||
        "مسجلة";

      const matchesSearch =
        searchQuery === "" ||
        tx.ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txClientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        internalName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSource =
        activeSourceFilter === "الكل" ||
        tx.sourceName === activeSourceFilter ||
        tx.sourceType === activeSourceFilter ||
        tx.source === activeSourceFilter;

      const matchesClient =
        activeClientFilter === "الكل" || txClientName === activeClientFilter;

      const matchesStatus =
        activeStatusFilter === "الكل" || sysStat === activeStatusFilter;

      const matchesSector =
        activeSector === "الكل" || tx.sector?.includes(activeSector);

      const matchesType =
        advFilters.type === "الكل" || tx.type === advFilters.type;

      return (
        matchesSearch &&
        matchesSource &&
        matchesClient &&
        matchesStatus &&
        matchesSector &&
        matchesType
      );
    });
  }, [
    transactionsData,
    searchQuery,
    activeSourceFilter,
    activeClientFilter,
    activeStatusFilter,
    activeSector,
    advFilters,
  ]);

  // 💡 3. استخراج العناصر المرئية فقط
  const visibleTransactions = useMemo(() => {
    return filteredTransactions.slice(0, visibleCount);
  }, [filteredTransactions, visibleCount]);

  // 💡 4. دالة التقاط التمرير (Scroll) لزيادة العناصر
  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    // إذا وصل لقبل النهاية بـ 100 بكسل، حمّل 50 عنصر إضافي
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (visibleCount < filteredTransactions.length) {
        setVisibleCount((prev) => prev + 50);
      }
    }
  };

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
        return row
          .map((item) => `"${String(item).replace(/"/g, '""')}"`)
          .join(",");
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Transactions_Export_${new Date().toLocaleDateString("en-GB")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("تم تصدير البيانات بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء التصدير");
    }
  };

  const handleRefresh = async () => {
    await refetch();
    toast.success("تم تحديث بيانات المعاملات");
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden bg-[var(--wms-bg-0)] font-sans"
      dir="rtl"
    >
      <ManageSourcesModal
        isOpen={isManageSourcesOpen}
        onClose={() => setIsManageSourcesOpen(false)}
        availableEntities={availableEntities}
      />

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
          <div className="relative flex-1 max-w-[250px]">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم، مالك، حي..."
              className="w-full bg-white border border-gray-200 rounded-md pr-8 pl-3 text-gray-700 placeholder:text-gray-400 h-[32px] text-[12px] outline-none focus:border-blue-500"
            />
          </div>

          <div className="relative flex items-center">
            <Users className="absolute right-2 w-3.5 h-3.5 text-blue-500 pointer-events-none" />
            <select
              value={activeClientFilter}
              onChange={(e) => setActiveClientFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-md pr-7 pl-6 h-[32px] text-[11px] font-semibold text-gray-700 outline-none focus:border-blue-500 cursor-pointer min-w-[140px] max-w-[200px] truncate"
            >
              {uniqueClients.map((client) => (
                <option key={client} value={client}>
                  {client === "الكل" ? "جميع العملاء" : client}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute left-2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative flex items-center">
            <Activity className="absolute right-2 w-3.5 h-3.5 text-amber-500 pointer-events-none" />
            <select
              value={activeStatusFilter}
              onChange={(e) => setActiveStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-md pr-7 pl-6 h-[32px] text-[11px] font-semibold text-gray-700 outline-none focus:border-blue-500 cursor-pointer min-w-[130px]"
            >
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status === "الكل" ? "كل الحالات" : status}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute left-2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-1.5 px-3 rounded-md border h-[32px] text-[11px] font-semibold transition-colors ${showAdvancedFilters ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>نوع المعاملة</span>
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center justify-center w-[32px] rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 h-[32px] transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-blue-500" : ""}`}
            />
          </button>

          <div className="flex-1"></div>

          <div className="hidden lg:flex items-center gap-3 text-[11px] bg-white border border-gray-100 px-3 py-1.5 rounded-md shadow-sm">
            <span className="text-gray-500">
              الإجمالي:{" "}
              <span className="text-gray-800 font-mono font-bold">
                {transactionsData.length}
              </span>
            </span>
            {hasPaidAccess && (
              <span className="text-gray-500 border-r border-gray-200 pr-3">
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
              <span className="text-gray-500 border-r border-gray-200 pr-3">
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
              <span className="text-gray-500 border-r border-gray-200 pr-3">
                الأتعاب:{" "}
                <span className="font-mono font-bold text-blue-600">
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
              <span>تصدير</span>
            </button>
          </AccessControl>
        </div>

        {showAdvancedFilters && (
          <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 shrink-0">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-500" />
              <span className="text-[11px] font-bold text-gray-700">
                تصفية إضافية للنوع:
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

            <div className="flex-1"></div>

            <button
              onClick={() => setAdvFilters({ type: "الكل" })}
              className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
            >
              مسح فلاتر النوع
            </button>
          </div>
        )}

        <div className="shrink-0 bg-white border border-gray-200 rounded-md py-1.5 px-2 flex items-center shadow-sm">
          <span className="text-gray-400 text-[10px] font-bold ml-3">
            المصدر (مكتب/شخص):
          </span>

          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {mainFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveSourceFilter(filter)}
                className={`px-3 py-1 rounded text-[10.5px] font-bold transition-all ${
                  activeSourceFilter === filter
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {filter}
              </button>
            ))}

            {dynamicSources.length > 0 && (
              <div className="relative flex items-center mr-1">
                <select
                  value={
                    mainFilters.includes(activeSourceFilter)
                      ? ""
                      : activeSourceFilter
                  }
                  onChange={(e) => setActiveSourceFilter(e.target.value)}
                  className={`appearance-none pl-7 pr-3 py-1 rounded cursor-pointer transition-all text-[10.5px] font-bold border outline-none h-[26px] ${
                    !mainFilters.includes(activeSourceFilter)
                      ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <option value="" disabled className="bg-white text-gray-400">
                    + مصادر أخرى قديمة...
                  </option>
                  {dynamicSources.map((source) => (
                    <option
                      key={source}
                      value={source}
                      className="text-gray-800 bg-white font-semibold"
                    >
                      {source}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={`absolute left-2 w-3 h-3 pointer-events-none ${!mainFilters.includes(activeSourceFilter) ? "text-white" : "text-gray-400"}`}
                />
              </div>
            )}
          </div>

          <AccessControl
            code="TXN_MANAGE_SOURCES"
            name="إدارة المصادر"
            moduleName="إدارة المعاملات"
            type="action"
            fallback={<div />}
          >
            <button
              onClick={() => setIsManageSourcesOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded transition-all"
            >
              <Settings2 className="w-3.5 h-3.5" />
              إدارة أزرار الفلترة
            </button>
          </AccessControl>
        </div>

        {/* الجدول الرئيسي 💡 إضافة التمرير هنا */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex-1 flex flex-col focus:outline-none shadow-sm">
          <div
            className="flex-1 overflow-auto custom-scrollbar-slim relative min-h-0"
            onScroll={handleScroll} // 👈 التقاط حركة السكرول
          >
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
                      إجمالي الأتعاب
                    </th>
                  )}
                  {hasPaidAccess && (
                    <th
                      className="text-right px-2 whitespace-nowrap font-bold text-[11px] text-gray-600 border-l border-gray-200"
                      style={{ width: "100px" }}
                    >
                      المدفوع
                    </th>
                  )}
                  {hasRemainingAccess && (
                    <th
                      className="text-right px-2 whitespace-nowrap font-bold text-[11px] text-gray-600 border-l border-gray-200"
                      style={{ width: "110px" }}
                    >
                      المتبقي
                    </th>
                  )}
                  {hasCollStatusAccess && (
                    <th
                      className="text-right px-2 whitespace-nowrap font-bold text-[11px] text-gray-600 border-l border-gray-200"
                      style={{ width: "110px" }}
                    >
                      حالة التحصيل المالي
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
                ) : visibleTransactions.length > 0 ? (
                  <>
                    {/* 💡 رسم البيانات المرئية فقط */}
                    {visibleTransactions.map((tx) => {
                      const internalName =
                        tx.internalName || tx.notes?.internalName || "—";
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
                          className="cursor-pointer transition-colors border-b border-gray-100 hover:bg-blue-50/50 group"
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
                            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 whitespace-nowrap">
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

                          {hasCollStatusAccess && (
                            <td className="px-2 border-l border-gray-100 align-middle py-1.5">
                              <AccessControl
                                code="TXN_COL_STATUS"
                                name="رؤية حالة التحصيل"
                                moduleName="إدارة المعاملات"
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
                                      <span className="text-gray-500">
                                        محصل:
                                      </span>
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
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${
                                (tx.status ||
                                  tx.notes?.transactionStatusData
                                    ?.currentStatus ||
                                  "مسجلة") === "تم الاعتماد"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : (tx.status ||
                                        tx.notes?.transactionStatusData
                                          ?.currentStatus ||
                                        "مسجلة") === "ملاحظات من الجهات"
                                    ? "bg-orange-50 text-orange-700 border-orange-200"
                                    : (tx.status ||
                                          tx.notes?.transactionStatusData
                                            ?.currentStatus ||
                                          "مسجلة") === "تم الرفع"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-gray-100 text-gray-600 border-gray-200"
                              }`}
                            >
                              {tx.status ||
                                tx.transactionStatus ||
                                tx.notes?.transactionStatusData
                                  ?.currentStatus ||
                                tx.notes?.status ||
                                "مسجلة"}
                            </span>
                          </td>
                          <td className="px-2 border-l border-gray-100 font-mono text-[10px] text-gray-400 py-2">
                            {tx.created || tx.date}
                          </td>
                        </tr>
                      );
                    })}

                    {/* 💡 مؤشر تحميل عند التمرير إن وُجد المزيد */}
                    {visibleCount < filteredTransactions.length && (
                      <tr>
                        <td
                          colSpan={totalVisibleColumns}
                          className="text-center py-4 text-[10px] font-bold text-gray-400 bg-gray-50/50"
                        >
                          قم بالتمرير للأسفل لتحميل المزيد... (معروض{" "}
                          {visibleCount} من {filteredTransactions.length})
                        </td>
                      </tr>
                    )}
                  </>
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
                <tr className="h-[34px] bg-gray-50 border-t border-gray-200 shadow-[0_-2px_4px_rgba(0,0,0,0.02)]">
                  <td
                    colSpan="8"
                    className="px-4 font-bold text-[12px] text-gray-700 text-left border-l border-gray-200"
                  >
                    مجموع المعاملات ({filteredTransactions.length})
                  </td>
                  {hasTotalAccess && (
                    <td className="px-2 font-mono font-bold text-[12.5px] text-blue-700 border-l border-gray-200">
                      {totals.totalFees.toLocaleString()}
                    </td>
                  )}
                  {hasPaidAccess && (
                    <td className="px-2 font-mono font-bold text-[12.5px] text-green-700 border-l border-gray-200">
                      {totals.paidAmount.toLocaleString()}
                    </td>
                  )}
                  {hasRemainingAccess && (
                    <td className="px-2 font-mono font-bold text-[12.5px] text-red-700 border-l border-gray-200">
                      {totals.remainingAmount.toLocaleString()}
                    </td>
                  )}
                  {hasCollStatusAccess && (
                    <td className="border-l border-gray-200"></td>
                  )}
                  <td
                    colSpan="2"
                    className="border-l border-gray-200 bg-gray-100/50"
                  ></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5 border-t border-gray-200 shrink-0 text-[11px] bg-white">
            <span className="text-gray-500 font-semibold">
              يتم عرض {Math.min(visibleCount, filteredTransactions.length)} من
              أصل {filteredTransactions.length} نتيجة (استخدم التمرير للأسفل
              لعرض المزيد)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
