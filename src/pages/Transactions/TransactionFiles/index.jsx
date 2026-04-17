import React, { useState, useMemo } from "react";
import {
  FolderOpen,
  Settings,
  Trash2,
  X,
  Search,
  CheckSquare,
  Loader2,
  Star,
  User,
  Copy,
  FolderOpen as FolderIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";

// 💡 استيراد المكونات
import { DEFAULT_CATEGORIES } from "./utils";
import EnhancedListItem from "./components/EnhancedListItem";
import FolderViewerWindow from "./components/FolderViewerWindow";
import FolderCategoriesModal from "./components/modals/FolderCategoriesModal";
import TrashModal from "./components/modals/TrashModal";
import { LinkedTransactionsModal } from "./components/modals/Modals";

// 💡 (السحر هنا) شبكة أعمدة محسنة خصيصاً للابتوب تمنع الفراغات وتلغي السكرول الأفقي
const OPTIMIZED_GRID_COLUMNS =
  "35px 30px minmax(130px, 2.5fr) minmax(80px, 1.2fr) minmax(90px, 1.2fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(60px, 0.7fr) minmax(75px, 0.9fr) minmax(75px, 0.9fr) minmax(70px, 0.8fr) minmax(75px, 0.9fr) minmax(75px, 0.9fr) minmax(80px, 1fr) 30px 35px";

// ============================================================================
// 💡 TABLE HEADER COMPONENT
// ============================================================================

function TableHeaderRow({ gridColumns }) {
  return (
    <div
      className="grid gap-2 items-center px-3 py-3 bg-slate-800 text-white text-[11px] font-bold sticky top-0 z-20 shadow-sm"
      style={{ gridTemplateColumns: gridColumns }}
      dir="rtl"
    >
      <div className="text-center">✓</div>
      <div className="text-center">
        <Star size={13} className="mx-auto" />
      </div>
      <div>المجلد / المالك</div>
      <div>رقم / نوع</div>
      <div>القطاع / الحي</div>
      <div>المكتب المصمم</div>
      <div>المكتب المشرف</div>
      <div>الحجم</div>
      <div>آخر تعديل</div>
      <div>تاريخ الإنشاء</div>
      <div className="text-center">تواصل</div>
      <div className="text-center">الحالة المالية</div>
      <div className="text-center">الحالة الفنية</div>
      <div className="text-center">الحالة الإجرائية</div>
      <div className="text-center">🔒</div>
      <div className="text-center">➡️</div>
    </div>
  );
}

// ============================================================================
// 💡 MAIN COMPONENT
// ============================================================================

export default function TransactionFilesManager({ onClose }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [deletedItems, setDeletedItems] = useState([]);
  const [openedTransaction, setOpenedTransaction] = useState(null);
  const [viewLinkedTx, setViewLinkedTx] = useState(null);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [mainContextMenu, setMainContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    transaction: null,
  });

  const { data: rawTransactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["private-transactions-files-list"],
    queryFn: async () => {
      const res = await api.get("/private-transactions");
      return res.data?.data || [];
    },
  });

  const { data: trashData } = useQuery({
    queryKey: ["trash-items"],
    queryFn: async () => {
      const res = await api.get("/files/trash");
      return res.data;
    },
  });

  const trashCount =
    (trashData?.folders?.length || 0) + (trashData?.files?.length || 0);

  const { data: categories = DEFAULT_CATEGORIES } = useQuery({
    queryKey: ["folder-categories"],
    queryFn: async () => {
      try {
        const res = await api.get("/files/categories");
        return res.data?.data?.length > 0 ? res.data.data : DEFAULT_CATEGORIES;
      } catch {
        return DEFAULT_CATEGORIES;
      }
    },
  });

  const saveCategoriesMutation = useMutation({
    mutationFn: async (cats) =>
      await api.post("/files/categories", { categories: cats }),
    onSuccess: () => {
      queryClient.invalidateQueries(["folder-categories"]);
      setShowCategoriesModal(false);
      toast.success("تم الحفظ");
    },
  });

  const transactions = useMemo(() => {
    return rawTransactions.map((tx) => {
      const rawName =
        tx.clientName || tx.client || tx.ownerNames || "عميل غير محدد";
      const cleanName = rawName.split("-")[0].split("(")[0].trim();

      const nameParts = cleanName
        .split(" ")
        .filter((part) => part.trim() !== "");

      let firstName = "عميل";
      let lastName = "";

      if (nameParts.length === 1) {
        firstName = nameParts[0];
      } else if (nameParts.length === 2) {
        firstName = nameParts[0];
        lastName = nameParts[1];
      } else if (nameParts.length > 2) {
        firstName = nameParts.slice(0, nameParts.length - 1).join(" ");
        lastName = nameParts[nameParts.length - 1];
      }

      const isWord = /^[a-zA-Z\u0600-\u06FF\s]+$/.test(lastName);
      if (!isWord && lastName !== "") {
        firstName = cleanName;
        lastName = "";
      }

      return {
        id: tx.id,
        transactionId: tx.id,
        transactionCode: tx.ref || tx.transactionCode || tx.id.substring(0, 8),
        ownerFirstName: firstName,
        ownerLastName: lastName,
        transactionType: tx.type || tx.category || "معاملة",
        district: tx.districtName || tx.district || "غير محدد",
        sector: tx.sector || "غير محدد",
        commonName: tx.internalName || "",
        officeName: tx.office || tx.source || "غير محدد",
        supervisingOffice: tx.supervisingOffice || "غير محدد",
        financialStatus: tx.financialStatus || "غير مسدد",
        technicalStatus: tx.technicalStatus || "قيد المراجعة",
        proceduralStatus: tx.proceduralStatus || tx.status || "جارية",
        brokerName: tx.mediator || "",
        agentName:
          Array.isArray(tx.agents) && tx.agents.length > 0
            ? tx.agents.map((a) => a.name).join(" و ")
            : "",
        createdAt: tx.created || tx.createdAt || "—",
        modifiedAt: tx.updated || tx.modifiedAt || tx.created || "—",
        clientPhone:
          tx.phone && !tx.phone.includes("غير متوفر") ? tx.phone : "",
        clientEmail: tx.email || tx.client?.email || "",
        isUrgent: tx.isUrgent || false,
        locked: tx.locked || false,
        hasLinked:
          tx.linkedParentId ||
          (tx.linkedChildren && tx.linkedChildren.length > 0) ||
          false,
        totalSize: tx.totalSize || 0,
      };
    });
  }, [rawTransactions]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.transactionCode.toLowerCase().includes(q) ||
          tx.ownerFirstName.toLowerCase().includes(q) ||
          tx.ownerLastName.toLowerCase().includes(q) ||
          tx.district.toLowerCase().includes(q) ||
          tx.clientPhone?.includes(q),
      );
    }
    return [...result].sort((a, b) => {
      if (sortBy === "newest")
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      if (sortBy === "modified")
        return (
          new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
        );
      if (sortBy === "largest") return (b.totalSize || 0) - (a.totalSize || 0);
      return 0;
    });
  }, [transactions, searchQuery, sortBy]);

  const handleSelectAll = () => {
    setSelectedItems(new Set(filteredTransactions.map((t) => t.transactionId)));
    toast.success(`تم تحديد ${filteredTransactions.length} مجلد`);
  };

  const handleStatusChange = async (id, newStatus) =>
    toast.success(`تم تغيير الحالة إلى ${newStatus}`);
  const handleUrgentToggle = async (id, isUrgent) =>
    toast.success(isUrgent ? "تم تفعيل الاستعجال" : "إلغاء الاستعجال");

  const handleMainContextMenu = (e, transaction) => {
    e.preventDefault();
    e.stopPropagation();
    setMainContextMenu({ show: true, x: e.clientX, y: e.clientY, transaction });
    if (!selectedItems.has(transaction.transactionId))
      setSelectedItems(new Set([transaction.transactionId]));
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ", { description: label });
  };

  return (
    <div
      className="flex flex-col h-full bg-[#f3f4f6] font-[Tajawal] overflow-hidden"
      dir="rtl"
      onClick={() => {
        setSelectedItems(new Set());
        setMainContextMenu({ show: false, x: 0, y: 0, transaction: null });
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setMainContextMenu({ show: false, x: 0, y: 0, transaction: null });
      }}
    >
      {/* ── 💡 Header & Toolbar Combined (شريط علوي مدمج للابتوب) ── */}
      <div
        className="flex flex-col xl:flex-row items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-gray-200 shadow-sm shrink-0 z-30 gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. الشعار والعنوان */}
        <div className="flex items-center gap-2.5 sm:gap-3 w-full xl:w-auto shrink-0">
          <div className="bg-orange-100 p-2 sm:p-2.5 rounded-xl">
            <FolderOpen size={20} className="text-orange-600 sm:size-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-800">
              إدارة ملفات المعاملات
            </h2>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5 hidden sm:block">
              استكشاف، تنظيم، ومشاركة المستندات
            </p>
          </div>
        </div>

        {/* 2. منطقة البحث والترتيب (تم دمجها في المنتصف) */}
        <div className="flex flex-1 items-center justify-center gap-3 w-full max-w-2xl px-2">
          <div className="relative w-full">
            <Search
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث برقم المعاملة، المالك، الحي..."
              className="w-full pl-3 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 shrink-0">
            {["newest", "modified", "largest"].map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${sortBy === key ? "bg-white text-blue-600 shadow-sm border border-gray-100" : "text-gray-500 hover:text-gray-800"}`}
              >
                {key === "newest"
                  ? "الأحدث"
                  : key === "modified"
                    ? "آخر تعديل"
                    : "الحجم"}
              </button>
            ))}
          </div>
        </div>

        {/* 3. الإجراءات والإعدادات (في اليسار) */}
        <div className="flex items-center gap-2 shrink-0 w-full xl:w-auto justify-end">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[10px] font-bold transition-colors"
          >
            <CheckSquare size={14} />{" "}
            <span className="hidden sm:inline">تحديد الكل</span>
          </button>
          <button
            onClick={() => setShowCategoriesModal(true)}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-gray-200 transition-colors"
            title="إعدادات النظام"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => setShowTrashModal(true)}
            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100 transition-colors relative"
            title="سلة المحذوفات"
          >
            <Trash2 size={16} />
            {trashCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white flex items-center justify-center rounded-full text-[9px] font-bold">
                {trashCount}
              </span>
            )}
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            onClick={onClose}
            className="p-2 bg-gray-200 hover:bg-red-100 hover:text-red-600 rounded-lg text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── 💡 TABLE CONTAINER (بدون فراغات، يستجيب لحجم الشاشة) ── */}
      <div className="flex-1 overflow-hidden p-4 relative z-10">
        {/* حواف الجدول دائرية مع خلفية بيضاء */}
        <div className="overflow-auto h-full rounded-2xl border border-gray-200 shadow-sm bg-white custom-scrollbar-slim">
          {/* min-w-full تجعل الجدول يأخذ عرض الشاشة كاملاً على اللابتوب ولا يترك فراغات، وإذا صغرت الشاشة يظهر سكرول */}
          <div className="w-full min-w-[1200px] xl:min-w-full inline-block align-middle">
            <div className="flex flex-col bg-white">
              {/* تمرير الشبكة المحسنة للـ Header */}
              <TableHeaderRow gridColumns={OPTIMIZED_GRID_COLUMNS} />

              <div className="divide-y divide-gray-100">
                {txLoading ? (
                  <div className="flex justify-center items-center h-[400px]">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                    <FolderOpen size={48} className="mb-3 opacity-30" />
                    <p className="text-sm font-bold">لا توجد نتائج</p>
                    <p className="text-xs">جرب تعديل بحثك أو الفلاتر</p>
                  </div>
                ) : (
                  filteredTransactions.map((tx) => (
                    <EnhancedListItem
                      key={tx.transactionId}
                      transaction={tx}
                      gridColumns={OPTIMIZED_GRID_COLUMNS} // 👈 نمرر الشبكة المحسنة لكل صف
                      isSelected={selectedItems.has(tx.transactionId)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItems(new Set([tx.transactionId]));
                      }}
                      onDoubleClick={() => setOpenedTransaction(tx)}
                      onContextMenu={handleMainContextMenu}
                      onStatusChange={handleStatusChange}
                      onUrgentToggle={handleUrgentToggle}
                      onOpenLinks={(tx) => setViewLinkedTx(tx)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Context Menu ── */}
      {mainContextMenu.show && mainContextMenu.transaction && (
        <div
          className="fixed z-[500] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-gray-200 py-1.5 min-w-[180px] font-bold animate-in fade-in"
          style={{ top: mainContextMenu.y, left: mainContextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 border-b border-gray-100 mb-1 bg-blue-50/50">
            <p className="text-xs text-blue-800 truncate">
              {mainContextMenu.transaction.transactionCode}
            </p>
          </div>
          <button
            onClick={() => {
              if (!mainContextMenu.transaction.locked)
                setOpenedTransaction(mainContextMenu.transaction);
              else toast.error("المعاملة مقفلة");
              setMainContextMenu({ show: false });
            }}
            className="w-full text-right px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 text-blue-600 text-[11px] transition-colors"
          >
            <FolderIcon size={16} /> <span>فتح المجلد</span>
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => {
              copyToClipboard(
                mainContextMenu.transaction.transactionCode,
                "رقم المعاملة",
              );
              setMainContextMenu({ show: false });
            }}
            className="w-full text-right px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-gray-700 text-[11px] transition-colors"
          >
            <Copy size={16} className="text-gray-500" /> <span>نسخ الرقم</span>
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      {viewLinkedTx && (
        <LinkedTransactionsModal
          transaction={viewLinkedTx}
          onClose={() => setViewLinkedTx(null)}
        />
      )}
      {openedTransaction && (
        <FolderViewerWindow
          transaction={openedTransaction}
          categories={categories}
          onClose={() => setOpenedTransaction(null)}
          user={user}
        />
      )}
      {showCategoriesModal && (
        <FolderCategoriesModal
          categories={categories}
          isSaving={saveCategoriesMutation.isPending}
          onSave={(cats) => saveCategoriesMutation.mutate(cats)}
          onClose={() => setShowCategoriesModal(false)}
        />
      )}
      {showTrashModal && (
        <TrashModal
          deletedItems={deletedItems}
          onRestore={(id) =>
            setDeletedItems((d) => d.filter((x) => x.id !== id))
          }
          onPermanentDelete={(id) =>
            setDeletedItems((d) => d.filter((x) => x.id !== id))
          }
          onClose={() => setShowTrashModal(false)}
        />
      )}
    </div>
  );
}
