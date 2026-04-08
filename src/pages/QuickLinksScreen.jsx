import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  ExternalLink,
  Plus,
  Settings,
  Lock,
  Pin,
  Pen,
  Trash2,
  LayoutDashboard,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import api from "../api/axios";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext"; // 👈 استيراد الصلاحيات

// 💡 دوال مساعدة لحساب التواريخ
const getRemainingTime = (dateString) => {
  if (!dateString) return null;
  const target = new Date(dateString);
  const now = new Date();
  const diff = target - now;
  if (diff <= 0)
    return { text: "منتهي الصلاحية", color: "bg-rose-100 text-rose-700" };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return {
    text: `متبقي ${days} يوم`,
    color:
      days < 3
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700",
  };
};

const getDaysSince = (dateString) => {
  if (!dateString) return "";
  const diff = new Date() - new Date(dateString);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "اليوم";
  if (days === 1) return "أمس";
  return `منذ ${days} يوم`;
};

const getImportanceBadge = (imp) => {
  if (imp === "عالي الأهمية")
    return "bg-rose-100 text-rose-700 border-rose-200";
  if (imp === "متوسط") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-blue-50 text-blue-600 border-blue-200";
};

export default function QuickLinksScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // 👈 جلب بيانات الموظف المسجل
  const currentUser = user?.name || "موظف النظام";

  // States
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("usage"); // usage | date
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [editingLink, setEditingLink] = useState(null);

  // Form States
  const [newCategoryName, setNewCategoryName] = useState("");

  const initialForm = {
    title: "",
    url: "",
    description: "",
    categoryId: "",
    accessLevel: "الموظفين",
    requiresLogin: false,
    loginData: "",
    assignedEmployees: "",
    hasInfiniteExpiry: false,
    validUntil: "",
    loginExpiry: "", // 👈 خيار مفتوح
    importance: "عادي",
    notes: "",
  };
  const [formData, setFormData] = useState(initialForm);

  // Queries
  const { data: links = [] } = useQuery({
    queryKey: ["quick-links"],
    queryFn: async () => (await api.get("/quick-links")).data.data,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["link-categories"],
    queryFn: async () => (await api.get("/quick-links/categories")).data.data,
  });

  // Mutations
  const saveLinkMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data };
      if (payload.hasInfiniteExpiry) payload.validUntil = null; // 👈 غير محدد

      if (editingLink) {
        payload.updatedBy = currentUser;
        return api.put(`/quick-links/${editingLink.id}`, payload);
      }
      payload.createdBy = currentUser;
      return api.post("/quick-links", payload);
    },
    onSuccess: () => {
      toast.success("تم حفظ الرابط بنجاح");
      queryClient.invalidateQueries(["quick-links"]);
      closeLinkModal();
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (id) => api.delete(`/quick-links/${id}`),
    onSuccess: () => {
      toast.success("تم الحذف");
      queryClient.invalidateQueries(["quick-links"]);
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, isPinned }) =>
      api.put(`/quick-links/${id}`, { isPinned, updatedBy: currentUser }),
    onSuccess: () => queryClient.invalidateQueries(["quick-links"]),
  });

  const reorderLinksMutation = useMutation({
    mutationFn: async (data) => api.post("/quick-links/reorder", data),
    onSuccess: () => queryClient.invalidateQueries(["quick-links"]),
  });

  const incrementUsageMutation = useMutation({
    mutationFn: async (id) => api.post(`/quick-links/${id}/increment`),
    onSuccess: () => queryClient.invalidateQueries(["quick-links"]),
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (name) => api.post("/quick-links/categories", { name }),
    onSuccess: () => {
      toast.success("تم إضافة التصنيف");
      setNewCategoryName("");
      queryClient.invalidateQueries(["link-categories"]);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => api.delete(`/quick-links/categories/${id}`),
    onSuccess: () => {
      toast.success("تم الحذف");
      queryClient.invalidateQueries(["link-categories"]);
    },
  });

  // Logic
  const groupedLinks = useMemo(() => {
    let sorted = [...links];
    // لا نعبث بترتيب المثبت (دائماً في الأعلى بالترتيب)
    if (sortBy === "usage") {
      sorted.sort((a, b) => {
        if (a.isPinned && b.isPinned) return a.pinOrder - b.pinOrder;
        if (a.isPinned) return -1;
        if (b.isPinned) return 1;
        return b.usageCount - a.usageCount;
      });
    }
    if (sortBy === "date") {
      sorted.sort((a, b) => {
        if (a.isPinned && b.isPinned) return a.pinOrder - b.pinOrder;
        if (a.isPinned) return -1;
        if (b.isPinned) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    const groups = {};
    sorted.forEach((link) => {
      const catName = link.category?.name || "بدون تصنيف";
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(link);
    });
    return groups;
  }, [links, sortBy]);

  const handleOpenLink = (link) => {
    incrementUsageMutation.mutate(link.id);
    window.open(link.url, "_blank");
  };

  const handlePinToggle = (link) => {
    const pinnedCount = links.filter((l) => l.isPinned).length;
    if (!link.isPinned && pinnedCount >= 10) {
      return toast.error("لا يمكن تثبيت أكثر من 10 روابط (الحد الأقصى).");
    }
    togglePinMutation.mutate({ id: link.id, isPinned: !link.isPinned });
  };

  const handleMovePinned = (catLinks, index, direction) => {
    // الحصول على الروابط المثبتة فقط في هذا التصنيف لتغيير ترتيبها
    const pinnedOnly = catLinks.filter((l) => l.isPinned);
    const globalIndex = pinnedOnly.findIndex(
      (l) => l.id === catLinks[index].id,
    );

    if (direction === "up" && globalIndex > 0) {
      reorderLinksMutation.mutate({
        link1Id: pinnedOnly[globalIndex].id,
        link1Order: pinnedOnly[globalIndex - 1].pinOrder || 0,
        link2Id: pinnedOnly[globalIndex - 1].id,
        link2Order: pinnedOnly[globalIndex].pinOrder || 0,
      });
    } else if (direction === "down" && globalIndex < pinnedOnly.length - 1) {
      reorderLinksMutation.mutate({
        link1Id: pinnedOnly[globalIndex].id,
        link1Order: pinnedOnly[globalIndex + 1].pinOrder || 0,
        link2Id: pinnedOnly[globalIndex + 1].id,
        link2Order: pinnedOnly[globalIndex].pinOrder || 0,
      });
    }
  };

  const openLinkModal = (link = null) => {
    if (link) {
      setEditingLink(link);
      setFormData({
        ...link,
        hasInfiniteExpiry: !link.validUntil,
        validUntil: link.validUntil ? link.validUntil.split("T")[0] : "",
        loginExpiry: link.loginExpiry ? link.loginExpiry.split("T")[0] : "",
      });
    } else {
      setEditingLink(null);
      setFormData({ ...initialForm, categoryId: categories[0]?.id || "" });
    }
    setIsLinkModalOpen(true);
  };

  const closeLinkModal = () => {
    setIsLinkModalOpen(false);
    setEditingLink(null);
    setFormData(initialForm);
  };

  const togglePassword = (id) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      className="p-4 md:p-6 space-y-6 font-sans bg-slate-50 min-h-screen"
      dir="rtl"
    >
      {/* Header - مكثف (صغير) */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button className="p-1.5 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
          <h3 className="text-lg font-black text-slate-900">الروابط السريعة</h3>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSortBy("usage")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${sortBy === "usage" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}
          >
            الاستخدام
          </button>
          <button
            onClick={() => setSortBy("date")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${sortBy === "date" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}
          >
            التاريخ
          </button>
          <button
            onClick={() => openLinkModal()}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> رابط جديد
          </button>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg shadow-sm"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tables Grouped by Category - مكثفة */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {Object.entries(groupedLinks).map(
          ([categoryName, catLinks], catIdx) => (
            <div
              key={categoryName}
              className={catIdx !== 0 ? "border-t-[3px] border-slate-200" : ""}
            >
              <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 font-black text-slate-800 text-xs flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                {categoryName}
              </div>
              <div className="overflow-x-auto custom-scrollbar-slim">
                <table className="w-full text-right text-[11px]">
                  <thead className="bg-slate-50 text-slate-500 font-bold whitespace-nowrap">
                    <tr>
                      <th className="px-3 py-2 border-l border-slate-100">
                        الرابط
                      </th>
                      <th className="px-3 py-2 border-l border-slate-100">
                        الأهمية
                      </th>
                      <th className="px-3 py-2 border-l border-slate-100">
                        مستوى الوصول
                      </th>
                      <th className="px-3 py-2 border-l border-slate-100">
                        الدخول/الباسوورد
                      </th>
                      <th className="px-3 py-2 border-l border-slate-100">
                        الصلاحية
                      </th>
                      <th className="px-3 py-2 border-l border-slate-100">
                        الإنشاء
                      </th>
                      <th className="px-3 py-2 border-l border-slate-100">
                        آخر تعديل
                      </th>
                      <th className="px-3 py-2 text-center border-l border-slate-100">
                        استخدام
                      </th>
                      <th className="px-3 py-2 text-center w-28">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {catLinks.map((link, index) => {
                      const validity = link.validUntil
                        ? getRemainingTime(link.validUntil)
                        : null;
                      return (
                        <tr
                          key={link.id}
                          className={`hover:bg-blue-50/40 transition-colors ${link.isPinned ? "bg-amber-50/20" : ""}`}
                        >
                          <td className="px-3 py-2 border-l border-slate-100">
                            <button
                              onClick={() => handleOpenLink(link)}
                              className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-900 rounded font-bold flex items-center gap-1.5 hover:bg-blue-600 hover:text-white transition-all w-fit shadow-sm"
                            >
                              {link.title} <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                          <td className="px-3 py-2 border-l border-slate-100">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getImportanceBadge(link.importance)}`}
                            >
                              {link.importance}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-l border-slate-100 font-bold text-slate-700">
                            {link.accessLevel}
                            {link.assignedEmployees && (
                              <div className="text-[9px] text-slate-400 mt-0.5 font-normal truncate max-w-[100px]">
                                {link.assignedEmployees}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 border-l border-slate-100">
                            {link.requiresLogin ? (
                              <button
                                onClick={() => togglePassword(link.id)}
                                className="px-2 py-1 bg-rose-50 border border-rose-100 text-rose-700 rounded font-bold flex items-center gap-1.5 hover:bg-rose-100 text-[10px]"
                              >
                                <Lock className="w-3 h-3" />{" "}
                                {revealedPasswords[link.id]
                                  ? link.loginData
                                  : "*****"}
                              </button>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 border-l border-slate-100">
                            {validity ? (
                              <div
                                className={`px-2 py-1 rounded text-[9px] font-black inline-block border border-transparent ${validity.color.replace("bg-", "border-")}`}
                              >
                                <span className="block">
                                  {link.validUntil.split("T")[0]}
                                </span>
                                <span className="opacity-80 block mt-0.5">
                                  {validity.text}
                                </span>
                              </div>
                            ) : (
                              <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[9px] font-bold border border-slate-200">
                                غير محدد (مفتوح)
                              </span>
                            )}
                          </td>

                          {/* 👈 عمود الإنشاء مع العداد */}
                          <td className="px-3 py-2 border-l border-slate-100 text-slate-600">
                            <div className="font-bold text-[10px]">
                              {link.createdBy}
                            </div>
                            <div className="text-[9px] font-mono">
                              {link.createdAt.split("T")[0]}
                            </div>
                            <div className="text-[8.5px] font-bold text-blue-600 bg-blue-50 px-1 rounded w-max mt-0.5">
                              {getDaysSince(link.createdAt)}
                            </div>
                          </td>

                          {/* 👈 عمود التعديل مع العداد */}
                          <td className="px-3 py-2 border-l border-slate-100 text-slate-600">
                            <div className="font-bold text-[10px]">
                              {link.updatedBy}
                            </div>
                            <div className="text-[9px] font-mono">
                              {link.updatedAt.split("T")[0]}
                            </div>
                            <div className="text-[8.5px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded w-max mt-0.5">
                              {getDaysSince(link.updatedAt)}
                            </div>
                          </td>

                          <td className="px-3 py-2 text-center border-l border-slate-100 font-black text-slate-800 font-mono">
                            {link.usageCount}
                          </td>

                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {link.isPinned && sortBy === "usage" && (
                                <div className="flex flex-col gap-0.5 ml-1 mr-2">
                                  <button
                                    onClick={() =>
                                      handleMovePinned(catLinks, index, "up")
                                    }
                                    className="text-slate-400 hover:text-blue-600 bg-slate-100 rounded p-0.5"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleMovePinned(catLinks, index, "down")
                                    }
                                    className="text-slate-400 hover:text-blue-600 bg-slate-100 rounded p-0.5"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              <button
                                onClick={() => handlePinToggle(link)}
                                className={`p-1.5 rounded transition-colors ${link.isPinned ? "bg-amber-100 text-amber-600" : "text-slate-400 hover:bg-slate-100"}`}
                                title={
                                  link.isPinned
                                    ? "إلغاء التثبيت"
                                    : "تثبيت في الأعلى"
                                }
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openLinkModal(link)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Pen className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm("حذف؟"))
                                    deleteLinkMutation.mutate(link.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ),
        )}
        {Object.keys(groupedLinks).length === 0 && (
          <div className="p-10 text-center text-slate-400 font-bold text-sm">
            لا توجد روابط مضافة بعد.
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* Modal: إضافة/تعديل رابط (مكثف) */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 bg-slate-800 text-white flex justify-between items-center shrink-0 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 rounded">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black">
                  {editingLink ? "تعديل بيانات الرابط" : "إضافة رابط سريع جديد"}
                </h3>
              </div>
              <button
                onClick={closeLinkModal}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar-slim">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">
                    اسم الرابط *
                  </label>
                  <input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="نظام بلدي..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">
                    التصنيف *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold outline-none bg-white"
                  >
                    <option value="">اختر...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">
                    الرابط (URL) *
                  </label>
                  <input
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    dir="ltr"
                    placeholder="https://..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono font-bold outline-none focus:border-blue-500 text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">
                    الأهمية
                  </label>
                  <select
                    value={formData.importance}
                    onChange={(e) =>
                      setFormData({ ...formData, importance: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold outline-none bg-white"
                  >
                    <option value="عادي">عادي</option>
                    <option value="متوسط">متوسط</option>
                    <option value="عالي الأهمية">عالي الأهمية</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">
                    مستوى الوصول
                  </label>
                  <select
                    value={formData.accessLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, accessLevel: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold outline-none bg-white"
                  >
                    <option>الإدارة العليا</option>
                    <option>الموظفين</option>
                    <option>الكل</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">
                    تاريخ الانتهاء
                  </label>
                  {/* 👈 خيار غير محدد (مفتوح) */}
                  <label className="flex items-center gap-1 mb-1 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={formData.hasInfiniteExpiry}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hasInfiniteExpiry: e.target.checked,
                          validUntil: "",
                        })
                      }
                    />
                    <span className="text-[9px] font-bold text-blue-700">
                      غير محدد (مفتوح دائماً)
                    </span>
                  </label>
                  <input
                    type="date"
                    disabled={formData.hasInfiniteExpiry}
                    value={formData.validUntil}
                    onChange={(e) =>
                      setFormData({ ...formData, validUntil: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-blue-600 w-4 h-4"
                    checked={formData.requiresLogin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requiresLogin: e.target.checked,
                      })
                    }
                  />
                  <span className="text-xs font-bold text-slate-800">
                    تفعيل حماية بيانات الدخول (يوزر/باسوورد)
                  </span>
                </label>
                {formData.requiresLogin && (
                  <input
                    type="text"
                    value={formData.loginData}
                    onChange={(e) =>
                      setFormData({ ...formData, loginData: e.target.value })
                    }
                    placeholder="بيانات الدخول..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold outline-none"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600">
                  وصف / ملاحظات
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold outline-none min-h-[60px] resize-none"
                ></textarea>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-slate-200 flex justify-end gap-2 shrink-0 rounded-b-2xl">
              <button
                onClick={closeLinkModal}
                className="px-6 py-2 bg-white text-slate-600 border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => saveLinkMutation.mutate(formData)}
                disabled={
                  saveLinkMutation.isPending ||
                  !formData.title ||
                  !formData.url ||
                  !formData.categoryId
                }
                className="px-8 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {saveLinkMutation.isPending ? "جاري الحفظ..." : "حفظ الرابط"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: إدارة التصنيفات */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 space-y-5"
            dir="rtl"
          >
            <h3 className="text-sm font-black flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" /> التصنيفات
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar-slim">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <span className="font-bold text-xs">{cat.name}</span>
                  <button
                    onClick={() => deleteCategoryMutation.mutate(cat.id)}
                    className="text-rose-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="تصنيف جديد..."
                className="flex-1 p-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
              />
              <button
                onClick={() => addCategoryMutation.mutate(newCategoryName)}
                disabled={!newCategoryName.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="w-full p-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
