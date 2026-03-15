import React, { useState, useRef, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Zap,
  Plus,
  FileText,
  Upload,
  X,
  Check,
  AlertCircle,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  FileType,
  Clipboard,
  Edit3,
  TrendingUp,
  Receipt,
  DollarSign,
  Users,
  Briefcase,
  Building2,
  Laptop,
  Wallet,
  Landmark,
  CreditCard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Info,
  Search,
  MessageSquare,
  Star,
  Save,
  Trash2,
  FileSpreadsheet,
  Printer,
  ArrowUpDown,
  RotateCcw,
  CalendarDays,
  Bell,
  Loader2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { usePrivacy } from "../context/PrivacyContext";
import { ScreenshotButton } from "../components/ScreenshotButton";

// ══════════════════════════════════════════════════════════
// Constants & Helpers
// ══════════════════════════════════════════════════════════

const ENTRY_TYPE_OPTIONS = [
  { value: "collection", label: "تحصيل", icon: TrendingUp },
  { value: "expense", label: "مصروف", icon: Receipt },
  { value: "salary", label: "راتب", icon: Users },
  { value: "agent-fee", label: "أتعاب تعقيب", icon: Briefcase },
  { value: "mediator-fee", label: "أتعاب وساطة", icon: Building2 },
  { value: "employee-commission", label: "عمولة موظف", icon: DollarSign },
  { value: "outsource", label: "تسورس", icon: Users },
  { value: "remote-fee", label: "أتعاب عن بعد", icon: Laptop },
  { value: "advance", label: "سلفة", icon: Wallet },
  { value: "treasury-withdraw", label: "سحب من خزنة", icon: ArrowUpFromLine },
  { value: "treasury-deposit", label: "إيداع للخزنة", icon: ArrowDownToLine },
  { value: "bank-withdraw", label: "سحب من بنك", icon: Landmark },
  { value: "bank-deposit", label: "إيداع لبنك", icon: Landmark },
  { value: "bank-payment", label: "دفع من حساب بنك", icon: CreditCard },
];

const getMonthRange = (monthOffset = 0) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + monthOffset;
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 0, 23, 59, 59),
  };
};

const isDateInRange = (dateStr, start, end) => {
  const date = new Date(dateStr);
  return date >= start && date <= end;
};

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════

export function ScreenQuickEntry() {
  const { user } = useAuth();
  const { maskAmount, maskName } = usePrivacy();
  const queryClient = useQueryClient();
  const backendUrl = api.defaults.baseURL?.replace("/api", "") || "";

  const fileInputRef = useRef(null);
  const processFileInputRef = useRef(null);

  // 💡 Data Fetching
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["quick-entries"],
    queryFn: async () => {
      const res = await api.get("/quick-entries");
      return (
        res.data?.data?.map((e) => ({
          id: e.id,
          displayId: e.entryCode,
          date: e.date ? e.date.split("T")[0] : "",
          time: e.time,
          // 💡 إزالة .name لأن الباك إند أصبح يرسلها كنص مباشر
          recordedBy: e.recordedBy || "موظف النظام",
          type: e.type,
          description: e.description,
          amount: e.amount,
          relatedPerson: e.relatedPerson,
          priority: e.priority,
          attachments: e.attachments || [],
          processed: e.status === "processed",
          // 💡 إزالة .name
          processedBy: e.processedBy || null,
          processedAt: e.processedAt
            ? new Date(e.processedAt).toLocaleString("ar-SA")
            : undefined,
          processedDetails: e.processedDetails,
          comments:
            e.comments?.map((c) => ({
              id: c.id,
              // 💡 إزالة .name
              author: c.author || "مستخدم",
              text: c.text,
              timestamp: new Date(c.createdAt).toLocaleString("ar-SA"),
            })) || [],
        })) || []
      );
    },
  });

  const { data: personsList = [] } = useQuery({
    queryKey: ["persons-quick-entry"],
    queryFn: async () => (await api.get("/persons")).data?.data || [],
  });

  const PERSON_OPTIONS = useMemo(
    () => personsList.map((p) => p.name),
    [personsList],
  );

  const RECORDER_OPTIONS = useMemo(() => {
    const recorders = new Set(entries.map((e) => e.recordedBy));
    return Array.from(recorders);
  }, [entries]);

  // States (Modals)
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customMonth, setCustomMonth] = useState("");
  const [customYear, setCustomYear] = useState("");
  const [filterRecorder, setFilterRecorder] = useState("");
  const [filterPerson, setFilterPerson] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortAsc, setSortAsc] = useState(false);

  // Forms
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState("collection");
  const [newAmount, setNewAmount] = useState("");
  const [newRelatedPerson, setNewRelatedPerson] = useState("");
  const [newRelatedPersonCustom, setNewRelatedPersonCustom] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [newAttachments, setNewAttachments] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editRelatedPerson, setEditRelatedPerson] = useState("");
  const [editPriority, setEditPriority] = useState("normal");

  const [newComment, setNewComment] = useState("");

  const [processType, setProcessType] = useState("collection");
  const [processDetails, setProcessDetails] = useState({
    deliverToTreasury: true,
  });
  const [processAttachments, setProcessAttachments] = useState([]);
  const [processFiles, setProcessFiles] = useState([]);
  const [processReceivedFromCustom, setProcessReceivedFromCustom] =
    useState("");

  // 💡 Mutations
  const addMutation = useMutation({
    mutationFn: async (fd) =>
      api.post("/quick-entries", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      toast.success("تم إضافة السجل السريع بنجاح");
      queryClient.invalidateQueries({ queryKey: ["quick-entries"] });
      setShowAddModal(false);
      resetAddForm();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ أثناء الحفظ"),
  });

  const editMutation = useMutation({
    mutationFn: async (data) =>
      api.put(`/quick-entries/${selectedEntry?.id}`, data),
    onSuccess: () => {
      toast.success("تم التعديل بنجاح");
      queryClient.invalidateQueries({ queryKey: ["quick-entries"] });
      setShowEditModal(false);
      setSelectedEntry(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/quick-entries/${id}`),
    onSuccess: () => {
      toast.success("تم الحذف بنجاح");
      queryClient.invalidateQueries({ queryKey: ["quick-entries"] });
    },
  });

  const processMutation = useMutation({
    mutationFn: async (fd) =>
      api.post(`/quick-entries/${selectedEntry?.id}/process`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      toast.success("تم تسجيل واعتماد البند في النظام بنجاح");
      queryClient.invalidateQueries({ queryKey: ["quick-entries"] });
      setShowProcessModal(false);
      setSelectedEntry(null);
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (data) =>
      api.post(`/quick-entries/${selectedEntry?.id}/comments`, data),
    onSuccess: () => {
      toast.success("تم إضافة التعليق");
      queryClient.invalidateQueries({ queryKey: ["quick-entries"] });
      setNewComment("");
    },
  });

  const undoProcessMutation = useMutation({
    mutationFn: async (id) => api.patch(`/quick-entries/${id}/undo`),
    onSuccess: () => {
      toast.success("تم التراجع عن المعالجة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["quick-entries"] });
    },
  });

  // Shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        setShowAddModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Filter & Sort
  const filteredEntries = useMemo(() => {
    let result = entries;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(query) ||
          e.displayId.toLowerCase().includes(query) ||
          e.relatedPerson?.toLowerCase().includes(query) ||
          e.recordedBy.toLowerCase().includes(query),
      );
    }

    if (filterStatus !== "all") {
      if (filterStatus === "processed")
        result = result.filter((e) => e.processed);
      else if (filterStatus === "unprocessed")
        result = result.filter((e) => !e.processed);
      else if (filterStatus === "delayed") {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        result = result.filter(
          (e) => !e.processed && new Date(e.date) < oneWeekAgo,
        );
      }
    }

    if (dateFilter !== "all") {
      if (dateFilter === "this-month") {
        const { start, end } = getMonthRange(0);
        result = result.filter((e) => isDateInRange(e.date, start, end));
      } else if (dateFilter === "last-month") {
        const { start, end } = getMonthRange(-1);
        result = result.filter((e) => isDateInRange(e.date, start, end));
      } else if (dateFilter === "custom-month" && customMonth) {
        const [year, month] = customMonth.split("-").map(Number);
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        result = result.filter((e) => isDateInRange(e.date, start, end));
      } else if (dateFilter === "custom-year" && customYear) {
        const year = parseInt(customYear);
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59);
        result = result.filter((e) => isDateInRange(e.date, start, end));
      }
    }

    if (filterRecorder)
      result = result.filter((e) => e.recordedBy === filterRecorder);
    if (filterPerson)
      result = result.filter((e) => e.relatedPerson === filterPerson);

    result.sort((a, b) => {
      let comp = 0;
      if (sortField === "date")
        comp =
          new Date(b.date + "T" + b.time).getTime() -
          new Date(a.date + "T" + a.time).getTime();
      else if (sortField === "amount") comp = (b.amount || 0) - (a.amount || 0);
      else if (sortField === "type") comp = a.type.localeCompare(b.type);
      else if (sortField === "priority")
        comp = a.priority === "urgent" ? -1 : 1;
      return sortAsc ? -comp : comp;
    });

    return result;
  }, [
    entries,
    searchQuery,
    filterStatus,
    dateFilter,
    customMonth,
    customYear,
    filterRecorder,
    filterPerson,
    sortField,
    sortAsc,
  ]);

  const stats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const unprocessed = entries.filter((e) => !e.processed);

    return {
      total: entries.length,
      unprocessed: unprocessed.length,
      processed: entries.filter((e) => e.processed).length,
      delayed: unprocessed.filter((e) => new Date(e.date) < oneWeekAgo).length,
      urgent: unprocessed.filter((e) => e.priority === "urgent").length,
      totalAmount: unprocessed.reduce((sum, e) => sum + (e.amount || 0), 0),
    };
  }, [entries]);

  // Handlers
  const resetAddForm = () => {
    setNewDescription("");
    setNewType("collection");
    setNewAmount("");
    setNewRelatedPerson("");
    setNewRelatedPersonCustom("");
    setNewPriority("normal");
    setNewAttachments([]);
    setNewFiles([]);
  };

  const handleFileUpload = (files) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setNewFiles((prev) => [...prev, ...fileArray]);
    setNewAttachments((prev) => [...prev, ...fileArray.map((f) => f.name)]);
    toast.success(`تم إضافة ${fileArray.length} ملف`);
  };

  const handleProcessFileUpload = (files) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setProcessFiles((prev) => [...prev, ...fileArray]);
    setProcessAttachments((prev) => [...prev, ...fileArray.map((f) => f.name)]);
    toast.success(`تم إضافة ${fileArray.length} ملف`);
  };

  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            const file = new File([blob], `pasted_${Date.now()}.png`, { type });
            setNewFiles((prev) => [...prev, file]);
            setNewAttachments((prev) => [...prev, file.name]);
            toast.success("تم لصق الصورة من الحافظة");
            return;
          }
        }
      }
      toast.info("لا توجد صورة في الحافظة");
    } catch {
      toast.error("فشل اللصق - تأكد من الأذونات");
    }
  };

  const handleAddEntry = () => {
    if (!newDescription.trim()) return toast.error("يرجى إدخال الوصف");
    const fd = new FormData();
    fd.append("type", newType);
    fd.append("description", newDescription);
    fd.append("priority", newPriority);
    // 💡 إرسال الاسم كنص وليس الـ ID
    fd.append("recordedBy", user?.name || "موظف النظام");
    if (newAmount) fd.append("amount", newAmount);

    const finalPerson = newRelatedPersonCustom.trim() || newRelatedPerson;
    if (finalPerson) fd.append("relatedPerson", finalPerson);

    newFiles.forEach((file) => fd.append("files", file));
    addMutation.mutate(fd);
  };

  const handleEditEntry = () => {
    if (!selectedEntry) return;
    editMutation.mutate({
      description: editDescription,
      amount: editAmount ? parseFloat(editAmount) : null,
      relatedPerson: editRelatedPerson || null,
      priority: editPriority,
    });
  };

  const handleDeleteEntry = (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا السجل؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddComment = () => {
    if (!selectedEntry || !newComment.trim()) return;
    // 💡 إرسال الاسم كنص
    commentMutation.mutate({ text: newComment, author: user?.name || "مستخدم" });
  };

  const handleMarkAsProcessed = (entry) => {
    setSelectedEntry(entry);
    setProcessType(entry.type);
    setProcessDetails({
      deliverToTreasury: true,
      processedAmount: entry.amount,
      processedDate: new Date().toISOString().split("T")[0],
    });
    setProcessAttachments([]);
    setProcessFiles([]);
    setProcessReceivedFromCustom("");
    setShowProcessModal(true);
  };

  const handleConfirmProcess = () => {
    if (!selectedEntry) return;
    const fd = new FormData();
    const finalDetails = { ...processDetails };
    if (processType === "collection" && processReceivedFromCustom.trim())
      finalDetails.receivedFrom = processReceivedFromCustom.trim();

    fd.append("type", processType);
    // 💡 إرسال الاسم كنص
    fd.append("processedBy", user?.name || "موظف النظام");
    fd.append("details", JSON.stringify(finalDetails));
    processFiles.forEach((file) => fd.append("files", file));

    processMutation.mutate(fd);
  };

  const handleUndoProcess = (entry) => {
    if (window.confirm("هل تريد إلغاء تسجيل وتوثيق هذا البند؟")) {
      undoProcessMutation.mutate(entry.id);
    }
  };

  const handleEditProcessed = (entry) => {
    setSelectedEntry(entry);
    setProcessType(entry.type);
    setProcessDetails(entry.processedDetails || { deliverToTreasury: true });
    setProcessAttachments(entry.processedDetails?.attachments || []);
    setProcessReceivedFromCustom("");
    setShowProcessModal(true);
  };

  // =========================================================
  // 1. دالة تصدير السجلات المعلقة (Excel / CSV) لدعم اللغة العربية
  // =========================================================
  const handleExportUnprocessed = () => {
    // جلب السجلات المعلقة من ضمن البيانات المفلترة حالياً فقط
    const pendingEntries = filteredEntries.filter((e) => !e.processed);

    if (pendingEntries.length === 0) {
      return toast.error("لا توجد سجلات معلقة لتصديرها");
    }

    // تجهيز عناوين الأعمدة
    const headers = [
      "الرقم",
      "التاريخ",
      "الوقت",
      "النوع",
      "الوصف",
      "المبلغ (ر.س)",
      "الشخص/الجهة",
      "المسجل",
      "الأولوية",
    ];

    // تجهيز الصفوف
    const rows = pendingEntries.map((e) => [
      e.displayId,
      e.date,
      e.time,
      getTypeLabel(e.type),
      `"${e.description.replace(/"/g, '""')}"`, // حماية النصوص التي تحتوي على فواصل
      e.amount || 0,
      e.relatedPerson || "—",
      e.recordedBy,
      e.priority === "urgent" ? "عاجل" : "عادي",
    ]);

    // دمج العناوين مع الصفوف
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    // 💡 إضافة (BOM) لكي يقرأ برنامج Excel الحروف العربية بشكل صحيح
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `السجلات_المعلقة_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`تم تصدير ${pendingEntries.length} سجل بنجاح!`);
  };

  // =========================================================
  // 2. دالة طباعة السجلات المعلقة (نافذة مخصصة للطباعة)
  // =========================================================
  const handlePrintUnprocessed = () => {
    const pendingEntries = filteredEntries.filter((e) => !e.processed);

    if (pendingEntries.length === 0) {
      return toast.error("لا توجد سجلات معلقة لطباعتها");
    }

    toast.success("جاري تجهيز الملف للطباعة...");

    // إنشاء نافذة جديدة للطباعة
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      return toast.error("يرجى السماح بالنوافذ المنبثقة (Pop-ups) للطباعة");
    }

    // تصميم HTML لصفحة الطباعة
    const htmlContent = `
      <html dir="rtl">
        <head>
          <title>طباعة السجلات المعلقة</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            .header h1 { color: #1e3a8a; font-size: 24px; margin: 0 0 5px 0; }
            .header p { color: #6b7280; font-size: 13px; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; font-size: 12px; }
            th { background-color: #f3f4f6; font-weight: bold; color: #374151; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .urgent { color: #dc2626; font-weight: bold; font-size: 14px; }
            .footer { margin-top: 30px; font-size: 11px; text-align: left; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>سجل الحركات السريعة (المعلقة)</h1>
            <p>تاريخ ووقت الطباعة: ${new Date().toLocaleString("ar-SA")}</p>
            <p>عدد السجلات: ${pendingEntries.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px;">م</th>
                <th style="width: 100px;">الرقم</th>
                <th style="width: 100px;">التاريخ</th>
                <th style="width: 90px;">النوع</th>
                <th>الوصف</th>
                <th style="width: 90px;">المبلغ (ر.س)</th>
                <th style="width: 120px;">الشخص/الجهة</th>
                <th style="width: 100px;">المسجل</th>
              </tr>
            </thead>
            <tbody>
              ${pendingEntries
                .map(
                  (e, index) => `
                <tr>
                  <td style="text-align: center;">${index + 1}</td>
                  <td>${e.displayId} ${e.priority === "urgent" ? '<span class="urgent" title="عاجل">★</span>' : ""}</td>
                  <td>${e.date}</td>
                  <td>${getTypeLabel(e.type)}</td>
                  <td>${e.description}</td>
                  <td style="font-weight: bold; color: #2563eb; font-family: monospace;">
                    ${e.amount ? maskAmount(e.amount.toLocaleString()) : "—"}
                  </td>
                  <td>${e.relatedPerson ? maskName(e.relatedPerson) : "—"}</td>
                  <td>${maskName(e.recordedBy)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            تم استخراج هذا التقرير من النظام الآلي
          </div>
          <script>
            // تنفيذ الطباعة تلقائياً بمجرد تحميل الصفحة
            window.onload = () => { 
              window.print(); 
              // window.close(); // يمكنك إزالة التعليق إذا أردت إغلاق النافذة بعد الطباعة تلقائياً
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getTypeLabel = (type) =>
    ENTRY_TYPE_OPTIONS.find((opt) => opt.value === type)?.label || type;
  const getTypeIcon = (type) =>
    ENTRY_TYPE_OPTIONS.find((opt) => opt.value === type)?.icon || FileText;

  return (
    <div className="p-3 space-y-3" id="quick-entry-content">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-gray-800 text-base font-bold">
                التسجيل السريع
              </div>
              <div className="text-gray-500 text-[11px]">
                تسجيل سريع للتحصيلات والمدفوعات - المعالجة تتم لاحقاً بدون عجلة
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 rounded-md bg-blue-600 text-white cursor-pointer hover:opacity-90 h-8 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تسجيل سريع</span>
              <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[9px]">
                Ctrl+N
              </span>
            </button>
            <ScreenshotButton
              targetId="quick-entry-content"
              filePrefix="quick-entry"
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-6 gap-2">
        <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-600 text-[10px] font-semibold">
              الإجمالي
            </span>
          </div>
          <div className="font-mono text-gray-800 text-base font-bold">
            {stats.total}
          </div>
        </div>
        <div className="bg-white border border-amber-200 rounded-lg p-2.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-amber-700 text-[10px] font-semibold">
              غير مسجل
            </span>
          </div>
          <div className="font-mono text-amber-700 text-base font-bold">
            {stats.unprocessed}
          </div>
        </div>
        <div className="bg-white border border-green-200 rounded-lg p-2.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            <span className="text-green-700 text-[10px] font-semibold">
              مسجل
            </span>
          </div>
          <div className="font-mono text-green-700 text-base font-bold">
            {stats.processed}
          </div>
        </div>
        <div className="bg-white border border-red-200 rounded-lg p-2.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            <span className="text-red-700 text-[10px] font-semibold">
              متأخر +7
            </span>
          </div>
          <div className="font-mono text-red-700 text-base font-bold">
            {stats.delayed}
          </div>
        </div>
        <div className="bg-white border border-orange-200 rounded-lg p-2.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Bell className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-orange-700 text-[10px] font-semibold">
              عاجل
            </span>
          </div>
          <div className="font-mono text-orange-600 text-base font-bold">
            {stats.urgent}
          </div>
        </div>
        <div className="bg-white border border-blue-200 rounded-lg p-2.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1.5">
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-blue-700 text-[10px] font-semibold">
              المبلغ المعلق
            </span>
          </div>
          <div className="font-mono text-blue-700 text-[14px] font-bold">
            {maskAmount(stats.totalAmount.toLocaleString())}
          </div>
        </div>
      </div>

      {/* Quick Date Filters */}
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-gray-400" />
        <span className="text-gray-600 text-[11px] font-semibold">
          تصفية سريعة:
        </span>
        <button
          onClick={() => {
            setDateFilter("all");
            setCustomMonth("");
            setCustomYear("");
          }}
          className={`px-3 py-1 rounded-md cursor-pointer transition-colors text-[11px] ${dateFilter === "all" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          الكل
        </button>
        <button
          onClick={() => {
            setDateFilter("this-month");
            setCustomMonth("");
            setCustomYear("");
          }}
          className={`px-3 py-1 rounded-md cursor-pointer transition-colors text-[11px] ${dateFilter === "this-month" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          هذا الشهر
        </button>
        <button
          onClick={() => {
            setDateFilter("last-month");
            setCustomMonth("");
            setCustomYear("");
          }}
          className={`px-3 py-1 rounded-md cursor-pointer transition-colors text-[11px] ${dateFilter === "last-month" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          الشهر الماضي
        </button>
        <div className="flex items-center gap-1">
          <input
            type="month"
            value={customMonth}
            onChange={(e) => {
              setCustomMonth(e.target.value);
              setDateFilter("custom-month");
              setCustomYear("");
            }}
            className="bg-white border border-gray-200 rounded-md px-2 text-gray-800 cursor-pointer h-[28px] text-[11px]"
            placeholder="شهر معين"
          />
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={customYear}
            onChange={(e) => {
              setCustomYear(e.target.value);
              setDateFilter("custom-year");
              setCustomMonth("");
            }}
            placeholder="سنة"
            className="bg-white border border-gray-200 rounded-md px-2 text-gray-800 h-[28px] text-[11px] w-20"
            min="2020"
            max="2030"
          />
        </div>
      </div>

      {/* Search, Filter & Actions Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative w-[250px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في السجلات..."
            className="w-full bg-white border border-gray-200 rounded-md pr-9 pl-3 text-gray-800 h-8 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-gray-200 rounded-md px-3 text-gray-800 cursor-pointer h-8 text-xs outline-none focus:border-blue-500"
        >
          <option value="all">الكل</option>
          <option value="unprocessed">غير مسجل</option>
          <option value="processed">مسجل</option>
          <option value="delayed">متأخر</option>
        </select>
        <select
          value={filterRecorder}
          onChange={(e) => setFilterRecorder(e.target.value)}
          className="bg-white border border-gray-200 rounded-md px-3 text-gray-800 cursor-pointer h-8 text-xs outline-none focus:border-blue-500"
        >
          <option value="">كل المسجلين</option>
          {RECORDER_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={filterPerson}
          onChange={(e) => setFilterPerson(e.target.value)}
          className="bg-white border border-gray-200 rounded-md px-3 text-gray-800 cursor-pointer h-8 text-xs outline-none focus:border-blue-500"
        >
          <option value="">كل الأشخاص</option>
          {PERSON_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          className="bg-white border border-gray-200 rounded-md px-3 text-gray-800 cursor-pointer h-8 text-xs outline-none focus:border-blue-500"
        >
          <option value="date">ترتيب: التاريخ</option>
          <option value="amount">ترتيب: المبلغ</option>
          <option value="type">ترتيب: النوع</option>
          <option value="priority">ترتيب: الأولوية</option>
        </select>
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="flex items-center gap-1 px-2 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer h-8 text-[11px]"
          title={sortAsc ? "تصاعدي" : "تنازلي"}
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1" />
        <button
          onClick={handleExportUnprocessed}
          className="flex items-center gap-1.5 px-3 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer h-8 text-[11px]"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>تصدير المعلقة</span>
        </button>
        <button
          onClick={handlePrintUnprocessed}
          className="flex items-center gap-1.5 px-3 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer h-8 text-[11px]"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>طباعة</span>
        </button>
      </div>

      {/* Entries Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-xs text-right">
          <thead>
            <tr className="bg-gray-50 h-9 border-b border-gray-200">
              <th className="px-3 text-gray-500 font-semibold text-[11px] w-24">
                الرقم
              </th>
              <th className="px-3 text-gray-500 font-semibold text-[11px] w-24">
                التاريخ
              </th>
              <th className="px-3 text-gray-500 font-semibold text-[11px] w-20">
                النوع
              </th>
              <th className="px-3 text-gray-500 font-semibold text-[11px]">
                الوصف
              </th>
              <th className="px-3 text-gray-500 font-semibold text-[11px] w-24">
                المبلغ
              </th>
              <th className="px-3 text-gray-500 font-semibold text-[11px] w-24">
                الشخص/الجهة
              </th>
              <th className="px-3 text-gray-500 font-semibold text-[11px] w-20">
                المسجل
              </th>
              <th className="px-3 text-gray-500 font-semibold text-[11px] w-16">
                المرفقات
              </th>
              <th className="px-3 text-gray-500 font-semibold text-[11px] w-20">
                الحالة
              </th>
              <th className="px-3 text-gray-500 font-semibold text-[11px] w-44">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="10" className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                </td>
              </tr>
            ) : filteredEntries.length > 0 ? (
              filteredEntries.map((entry, i) => {
                const Icon = getTypeIcon(entry.type);
                const now = new Date();
                const entryDate = new Date(entry.date);
                const daysDiff = Math.floor(
                  (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24),
                );
                const isDelayed = !entry.processed && daysDiff > 7;
                const hasComments = entry.comments && entry.comments.length > 0;

                return (
                  <tr
                    key={entry.id}
                    className={`border-b border-gray-100 transition-colors h-10 ${
                      entry.processed
                        ? "bg-[repeating-linear-gradient(45deg,rgba(34,197,94,0.03),rgba(34,197,94,0.03)_10px,rgba(34,197,94,0.06)_10px,rgba(34,197,94,0.06)_20px)] hover:bg-[repeating-linear-gradient(45deg,rgba(34,197,94,0.05),rgba(34,197,94,0.05)_10px,rgba(34,197,94,0.08)_10px,rgba(34,197,94,0.08)_20px)]"
                        : isDelayed
                          ? "bg-red-50/50 hover:bg-red-50"
                          : entry.priority === "urgent"
                            ? "bg-orange-50/50 hover:bg-orange-50"
                            : i % 2 === 1
                              ? "bg-gray-50/50 hover:bg-gray-50"
                              : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-3">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 font-mono text-[11px]">
                          {entry.displayId}
                        </span>
                        {entry.priority === "urgent" && (
                          <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-3">
                      <div className="text-gray-800 text-[11px] font-semibold">
                        {entry.date}
                      </div>
                      <div className="text-gray-500 text-[9px]">
                        {entry.time}
                      </div>
                    </td>
                    <td className="px-3">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-gray-600 text-[11px]">
                          {getTypeLabel(entry.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3">
                      <div className="text-gray-800 font-semibold">
                        {entry.description}
                      </div>
                      {hasComments && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MessageSquare className="w-3 h-3 text-blue-600" />
                          <span className="text-blue-600 text-[9px]">
                            {entry.comments.length} تعليق
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-3">
                      {entry.amount ? (
                        <span className="font-mono text-blue-600 text-xs font-bold">
                          {maskAmount(entry.amount.toLocaleString())}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-3 text-gray-600 text-[11px]">
                      {entry.relatedPerson
                        ? maskName(entry.relatedPerson)
                        : "—"}
                    </td>
                    <td className="px-3 text-gray-600 text-[11px]">
                      {maskName(entry.recordedBy)}
                    </td>
                    <td className="px-3">
                      {entry.attachments?.length > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedEntry(entry);
                            setShowPreviewModal(true);
                          }}
                          className="flex items-center gap-1 text-blue-600 hover:underline cursor-pointer"
                        >
                          <FileType className="w-3.5 h-3.5" />
                          <span className="text-[10px]">
                            {entry.attachments.length}
                          </span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-3">
                      {entry.processed ? (
                        <div className="inline-flex items-center gap-1 px-2 rounded-full h-[18px] text-[9px] font-semibold bg-green-100 text-green-700">
                          <Check className="w-3 h-3" />
                          <span>مُسجل</span>
                        </div>
                      ) : isDelayed ? (
                        <div className="inline-flex items-center gap-1 px-2 rounded-full h-[18px] text-[9px] font-semibold bg-red-100 text-red-700">
                          <AlertCircle className="w-3 h-3" />
                          <span>متأخر</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 rounded-full h-[18px] text-[9px] font-semibold bg-amber-100 text-amber-700">
                          <Clock className="w-3 h-3" />
                          <span>معلق</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3">
                      <div className="flex items-center gap-1">
                        {entry.processed ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditProcessed(entry)}
                              className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer transition-colors"
                              title="تعديل التسجيل"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUndoProcess(entry)}
                              className="p-1 rounded bg-orange-50 text-orange-600 hover:bg-orange-100 cursor-pointer transition-colors"
                              title="إلغاء التسجيل"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMarkAsProcessed(entry)}
                              className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer transition-colors"
                              title="تسجيل في النظام"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEntry(entry);
                                setEditDescription(entry.description);
                                setEditAmount(entry.amount?.toString() || "");
                                setEditRelatedPerson(entry.relatedPerson || "");
                                setEditPriority(entry.priority);
                                setShowEditModal(true);
                              }}
                              className="p-1 rounded bg-amber-50 text-amber-600 hover:bg-amber-100 cursor-pointer transition-colors"
                              title="تعديل"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setSelectedEntry(entry);
                            setShowCommentsModal(true);
                          }}
                          className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer transition-colors"
                          title="التعليقات"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="10" className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3 opacity-50" />
                  <div className="text-gray-500 text-[13px]">
                    لا توجد سجلات مطابقة
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-1.5 px-1">
        <Info className="w-3 h-3 mt-0.5 shrink-0 text-gray-400 opacity-70" />
        <span className="text-gray-400 text-[9px]">
          هذه الشاشة للتسجيل السريع فقط - المعالجة والترحيل للشاشات المناسبة يتم
          لاحقاً بدون عجلة - السرعة في التسجيل وليس المعالجة
        </span>
      </div>

      {/* 💡 Add Entry Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          dir="rtl"
        >
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-[600px]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-md bg-amber-50">
                  <Zap className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-gray-900 text-[15px] font-bold">
                  تسجيل سريع جديد
                </span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-gray-800 mb-2 text-xs font-semibold">
                  نوع العملية
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 text-gray-800 cursor-pointer h-9 text-[13px] focus:outline-none focus:border-blue-500"
                >
                  {ENTRY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-800 mb-2 text-xs font-semibold">
                  الوصف *
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="مثال: تم استلام مبلغ 15000 ريال يخص معاملة العليا..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-800 resize-none text-[13px] min-h-[80px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-800 mb-2 text-xs font-semibold">
                    المبلغ (اختياري)
                  </label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 text-gray-800 font-mono h-9 text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-800 mb-2 text-xs font-semibold">
                    الأولوية
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 text-gray-800 cursor-pointer h-9 text-[13px] focus:outline-none focus:border-blue-500"
                  >
                    <option value="normal">عادي</option>
                    <option value="urgent">عاجل</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-800 mb-2 text-xs font-semibold">
                  الشخص/الجهة المعنية (اختياري)
                </label>
                <select
                  value={newRelatedPerson}
                  onChange={(e) => {
                    setNewRelatedPerson(e.target.value);
                    if (e.target.value) setNewRelatedPersonCustom("");
                  }}
                  className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 text-gray-800 cursor-pointer mb-2 h-9 text-[13px] focus:outline-none focus:border-blue-500"
                >
                  <option value="">اختر من القائمة</option>
                  {PERSON_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <div className="text-gray-400 text-center mb-1 text-[10px]">
                  أو
                </div>
                <input
                  type="text"
                  value={newRelatedPersonCustom}
                  onChange={(e) => {
                    setNewRelatedPersonCustom(e.target.value);
                    if (e.target.value) setNewRelatedPerson("");
                  }}
                  placeholder="اكتب اسم جديد..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 text-gray-800 h-9 text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-800 mb-2 text-xs font-semibold">
                  المرفقات (اختياري)
                </label>
                <div className="space-y-2">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add("bg-blue-50");
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove("bg-blue-50");
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove("bg-blue-50");
                      handleFileUpload(e.dataTransfer.files);
                    }}
                  >
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <div className="text-gray-800 text-[11px]">
                      اسحب الملفات هنا أو انقر للتحميل
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <button
                    onClick={handlePaste}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors text-[11px]"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>لصق من الحافظة</span>
                  </button>
                  {newAttachments.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {newAttachments.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-gray-800 text-[11px]">
                              {file}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setNewAttachments((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              );
                              setNewFiles((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              );
                            }}
                            className="text-gray-400 hover:text-red-600 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-1.5 rounded-md bg-white text-gray-600 cursor-pointer border border-gray-300 hover:bg-gray-50 text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddEntry}
                disabled={addMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-600 text-white cursor-pointer hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold"
              >
                {addMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>حفظ السجل</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💡 Edit Modal */}
      {showEditModal && selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          dir="rtl"
        >
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-[500px]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-md bg-amber-50">
                  <Edit3 className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-gray-900 text-[15px] font-bold">
                  تعديل السجل
                </span>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-gray-800 mb-2 text-xs font-semibold">
                  الوصف
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-800 resize-none text-[13px] min-h-[80px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-800 mb-2 text-xs font-semibold">
                    المبلغ
                  </label>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 text-gray-800 font-mono h-9 text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-800 mb-2 text-xs font-semibold">
                    الأولوية
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 text-gray-800 cursor-pointer h-9 text-[13px] focus:outline-none focus:border-blue-500"
                  >
                    <option value="normal">عادي</option>
                    <option value="urgent">عاجل</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-800 mb-2 text-xs font-semibold">
                  الشخص/الجهة
                </label>
                <select
                  value={editRelatedPerson}
                  onChange={(e) => setEditRelatedPerson(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 text-gray-800 cursor-pointer h-9 text-[13px] focus:outline-none focus:border-blue-500"
                >
                  <option value="">بدون تحديد</option>
                  {PERSON_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-1.5 rounded-md bg-white text-gray-600 cursor-pointer border border-gray-300 hover:bg-gray-50 text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleEditEntry}
                disabled={editMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-600 text-white cursor-pointer hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold"
              >
                {editMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💡 Comments Modal */}
      {showCommentsModal && selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          dir="rtl"
        >
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-[500px]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-md bg-blue-50">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-900 text-[15px] font-bold">
                  التعليقات ({selectedEntry.comments?.length || 0})
                </span>
              </div>
              <button
                onClick={() => setShowCommentsModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar-slim">
                {selectedEntry.comments?.length > 0 ? (
                  selectedEntry.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-900 text-[11px] font-semibold">
                          {maskName(comment.author)}
                        </span>
                        <span className="text-gray-400 text-[9px]">
                          {comment.timestamp}
                        </span>
                      </div>
                      <div className="text-gray-600 text-xs">
                        {comment.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-4 text-xs">
                    لا توجد تعليقات بعد
                  </div>
                )}
              </div>
              <div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="اكتب تعليق..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-800 resize-none text-[13px] min-h-[60px] focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddComment}
                  disabled={commentMutation.isPending || !newComment.trim()}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white cursor-pointer hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold"
                >
                  {commentMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>إضافة تعليق</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 💡 Preview Attachments Modal */}
      {showPreviewModal && selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          dir="rtl"
        >
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-[500px]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-md bg-blue-50">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-900 text-[15px] font-bold">
                  المرفقات ({selectedEntry.attachments.length})
                </span>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-2">
              {selectedEntry.attachments.map((fileUrl, i) => {
                const fileName = fileUrl.split("/").pop();
                const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png)$/) != null;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {isImage ? (
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                      ) : (
                        <FileType className="w-5 h-5 text-blue-600" />
                      )}
                      <span className="text-gray-800 truncate w-48 text-xs">
                        {fileName}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        window.open(`${backendUrl}${fileUrl}`, "_blank")
                      }
                      className="text-blue-600 hover:underline text-[11px]"
                    >
                      عرض
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 💡 Process Modal */}
      {showProcessModal && selectedEntry && (
        <ProcessModal
          selectedEntry={selectedEntry}
          processType={processType}
          setProcessType={setProcessType}
          processDetails={processDetails}
          setProcessDetails={setProcessDetails}
          processAttachments={processAttachments}
          setProcessAttachments={setProcessAttachments}
          setProcessFiles={setProcessFiles}
          processFileInputRef={processFileInputRef}
          processReceivedFromCustom={processReceivedFromCustom}
          setProcessReceivedFromCustom={setProcessReceivedFromCustom}
          onConfirm={handleConfirmProcess}
          onCancel={() => setShowProcessModal(false)}
          maskAmount={maskAmount}
          getTypeLabel={getTypeLabel}
          PERSON_OPTIONS={PERSON_OPTIONS}
          isProcessing={processMutation.isPending}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Process Modal Component
// ══════════════════════════════════════════════════════════

function ProcessModal({
  selectedEntry,
  processType,
  setProcessType,
  processDetails,
  setProcessDetails,
  processAttachments,
  setProcessAttachments,
  setProcessFiles,
  processFileInputRef,
  processReceivedFromCustom,
  setProcessReceivedFromCustom,
  onConfirm,
  onCancel,
  maskAmount,
  getTypeLabel,
  PERSON_OPTIONS,
  isProcessing,
}) {
  const handleProcessFileUpload = (files) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setProcessFiles((prev) => [...prev, ...fileArray]);
    setProcessAttachments((prev) => [...prev, ...fileArray.map((f) => f.name)]);
    toast.success(`تم إضافة ${fileArray.length} ملف`);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60"
      dir="rtl"
    >
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full overflow-hidden max-w-[750px] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-blue-50">
              <Edit3 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-gray-900 text-[15px] font-bold">
              تسجيل البند في النظام - بدون عجلة
            </span>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar-slim flex-1">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-gray-800 mb-2 text-xs font-semibold">
              بيانات السجل
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">الرقم:</span>
                <span className="text-gray-800 font-mono">
                  {selectedEntry.displayId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">النوع:</span>
                <span className="text-gray-800">
                  {getTypeLabel(selectedEntry.type)}
                </span>
              </div>
              <div className="text-gray-800 mt-2">
                {selectedEntry.description}
              </div>
              {selectedEntry.amount && (
                <div className="flex justify-between mt-2">
                  <span className="text-gray-500">المبلغ:</span>
                  <span className="text-blue-600 font-mono font-bold">
                    {maskAmount(selectedEntry.amount.toLocaleString())} ر.س
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-blue-900 mb-1 text-[11px] font-semibold">
                معالجة بطيئة ودقيقة
              </div>
              <div className="text-blue-800 text-[10px]">
                خذ وقتك في مراجعة وإدخال البيانات بدقة - لا حاجة للسرعة هنا
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-800 mb-2 text-xs font-semibold">
              تسجيل كـ
            </label>
            <select
              value={processType}
              onChange={(e) => setProcessType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 text-gray-800 cursor-pointer h-9 text-[13px] focus:outline-none focus:border-blue-500"
            >
              {ENTRY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-800 mb-2 text-xs font-semibold">
                التاريخ
              </label>
              <input
                type="date"
                value={processDetails.processedDate || ""}
                onChange={(e) =>
                  setProcessDetails((prev) => ({
                    ...prev,
                    processedDate: e.target.value,
                  }))
                }
                className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 text-gray-800 h-9 text-[13px] focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-800 mb-2 text-xs font-semibold">
                المبلغ
              </label>
              <input
                type="number"
                value={processDetails.processedAmount || ""}
                onChange={(e) =>
                  setProcessDetails((prev) => ({
                    ...prev,
                    processedAmount: parseFloat(e.target.value),
                  }))
                }
                className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 text-gray-800 font-mono h-9 text-[13px] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Type Specific Fields */}
          {processType === "collection" && (
            <div className="space-y-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-900 mb-2 text-xs font-semibold">
                تفاصيل التحصيل
              </div>
              <div>
                <label className="block text-gray-800 mb-2 text-[11px] font-semibold">
                  مستلم من
                </label>
                <select
                  value={processDetails.receivedFrom || ""}
                  onChange={(e) => {
                    setProcessDetails((prev) => ({
                      ...prev,
                      receivedFrom: e.target.value,
                    }));
                    if (e.target.value) setProcessReceivedFromCustom("");
                  }}
                  className="w-full bg-white border border-green-300 rounded-md px-3 text-gray-800 cursor-pointer mb-2 h-9 text-[13px] focus:outline-none focus:border-green-500"
                >
                  <option value="">اختر من القائمة</option>
                  {PERSON_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <div className="text-gray-400 text-center mb-1 text-[10px]">
                  أو
                </div>
                <input
                  type="text"
                  value={processReceivedFromCustom}
                  onChange={(e) => {
                    setProcessReceivedFromCustom(e.target.value);
                    if (e.target.value)
                      setProcessDetails((prev) => ({
                        ...prev,
                        receivedFrom: "",
                      }));
                  }}
                  placeholder="اكتب اسم جديد..."
                  className="w-full bg-white border border-green-300 rounded-md px-3 text-gray-800 h-9 text-[13px] focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="flex items-center gap-2 p-2 bg-white border border-green-300 rounded">
                <input
                  type="checkbox"
                  id="deliverToTreasury"
                  checked={processDetails.deliverToTreasury || false}
                  onChange={(e) =>
                    setProcessDetails((prev) => ({
                      ...prev,
                      deliverToTreasury: e.target.checked,
                    }))
                  }
                  className="cursor-pointer accent-green-600"
                />
                <label
                  htmlFor="deliverToTreasury"
                  className="text-gray-800 cursor-pointer text-[11px]"
                >
                  توريد للخزنة
                </label>
              </div>
              {!processDetails.deliverToTreasury && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-[10px]">
                  سيتم إضافة المبلغ للتحصيلات غير المسلمة
                </div>
              )}
            </div>
          )}

          {processType === "expense" && (
            <div className="space-y-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-900 mb-2 text-xs font-semibold">
                تفاصيل المصروف
              </div>
              <div>
                <label className="block text-gray-800 mb-2 text-[11px] font-semibold">
                  من دفعه
                </label>
                <select
                  value={processDetails.paidBy || ""}
                  onChange={(e) =>
                    setProcessDetails((prev) => ({
                      ...prev,
                      paidBy: e.target.value,
                    }))
                  }
                  className="w-full bg-white border border-red-300 rounded-md px-3 text-gray-800 cursor-pointer h-9 text-[13px] focus:outline-none focus:border-red-500"
                >
                  <option value="">اختر...</option>
                  {PERSON_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-800 mb-2 text-[11px] font-semibold">
                  من أين
                </label>
                <select
                  value={processDetails.paidFrom || ""}
                  onChange={(e) =>
                    setProcessDetails((prev) => ({
                      ...prev,
                      paidFrom: e.target.value,
                    }))
                  }
                  className="w-full bg-white border border-red-300 rounded-md px-3 text-gray-800 cursor-pointer h-9 text-[13px] focus:outline-none focus:border-red-500"
                >
                  <option value="">اختر...</option>
                  <option value="treasury">الخزنة</option>
                  <option value="bank">البنك</option>
                  <option value="personal">شخصي</option>
                </select>
              </div>
            </div>
          )}

          {/* Notes & Attachments */}
          <div>
            <label className="block text-gray-800 mb-2 text-xs font-semibold">
              ملاحظات المعالجة
            </label>
            <textarea
              value={processDetails.notes || ""}
              onChange={(e) =>
                setProcessDetails((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder="أضف أرقام المراجع البنكية، السندات، إلخ..."
              className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-800 resize-none text-[13px] min-h-[70px] focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-800 mb-2 text-xs font-semibold">
              مرفقات الإثبات
            </label>
            <div className="space-y-2">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => processFileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <div className="text-gray-800 text-[11px]">
                  إضافة مرفقات السداد / التحويل
                </div>
              </div>
              <input
                ref={processFileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => handleProcessFileUpload(e.target.files)}
              />
              {processAttachments.length > 0 && (
                <div className="space-y-1 mt-2">
                  {processAttachments.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <FileType className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-800 truncate w-48 text-[11px]">
                          {file}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setProcessAttachments((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          );
                          setProcessFiles((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          );
                        }}
                        className="text-gray-400 hover:text-red-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 shrink-0">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-md bg-white text-gray-600 cursor-pointer border border-gray-300 hover:bg-gray-50 text-xs"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-600 text-white cursor-pointer hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}{" "}
            <span>اعتماد المعالجة</span>
          </button>
        </div>
      </div>
    </div>
  );
}
