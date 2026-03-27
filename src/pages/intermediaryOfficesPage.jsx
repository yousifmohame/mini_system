import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Building2,
  Search,
  Plus,
  Download,
  Upload,
  Copy,
  Share2,
  Camera,
  Phone,
  Mail,
  Globe,
  MapPin,
  Hash,
  FileText,
  Users,
  Palette,
  Link2,
  Edit3,
  Trash2,
  Eye,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Save,
  Image,
  Stamp,
  PenTool,
  LayoutTemplate,
  UserCheck,
  Briefcase,
  Calendar,
  Clock,
  Shield,
  BadgeCheck,
  Pause,
  CircleDot,
  FileType,
  TrendingUp,
  ClipboardList,
  Loader2,
  UploadCloud,
  Layers,
  Type,
  File,
} from "lucide-react";

// ═══════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════

const StatusBadge = ({ status }) => {
  const config = {
    نشط: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    موقوف: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      icon: <XCircle className="w-3 h-3" />,
    },
    مجمد: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: <Pause className="w-3 h-3" />,
    },
  };
  const c = config[status] || config["نشط"];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${c.bg} ${c.text} border ${c.border}`}
    >
      {c.icon} {status}
    </span>
  );
};

const RelTypeBadge = ({ type }) => {
  const colors = {
    وسيط: "bg-blue-50 text-blue-700 border-blue-200",
    شريك: "bg-purple-50 text-purple-700 border-purple-200",
    "مكتب تابع": "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border ${colors[type] || "bg-slate-50 text-slate-600 border-slate-200"}`}
    >
      {type}
    </span>
  );
};

const AssetTypeIcon = ({ type, className = "w-4 h-4" }) => {
  const icons = {
    logo: <Image className={`${className} text-blue-500`} />,
    stamp: <Stamp className={`${className} text-red-500`} />,
    signature: <PenTool className={`${className} text-green-500`} />,
    header: <LayoutTemplate className={`${className} text-purple-500`} />,
    footer: <LayoutTemplate className={`${className} text-orange-500`} />,
    background: <Layers className={`${className} text-cyan-500`} />,
    template: <FileText className={`${className} text-indigo-500`} />,
  };
  return icons[type] || <FileText className={className} />;
};

const assetTypeLabels = {
  logo: "شعار",
  stamp: "ختم",
  signature: "توقيع",
  header: "هيدر",
  footer: "فوتر",
  background: "خلفية",
  template: "كليشة",
};

const FileTypeIcon = ({ fileType, className = "w-4 h-4" }) => {
  switch (fileType) {
    case "image":
      return <Image className={`${className} text-green-500`} />;
    case "pdf":
      return <File className={`${className} text-red-500`} />;
    case "dwg":
      return <FileType className={`${className} text-purple-500`} />;
    case "text":
      return <Type className={`${className} text-slate-500`} />;
    default:
      return <FileText className={`${className} text-slate-400`} />;
  }
};

// ═══════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════

export function Screen860IntermediaryOffices() {
  const queryClient = useQueryClient();

  // 💡 Data Fetching
  const { data: offices = [], isLoading } = useQuery({
    queryKey: ["intermediary-offices"],
    queryFn: async () =>
      (await api.get("/intermediary-offices")).data?.data || [],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const cities = useMemo(() => {
    const c = [...new Set(offices.map((o) => o.city).filter(Boolean))];
    return c.sort();
  }, [offices]);

  const filteredOffices = useMemo(() => {
    return offices.filter((o) => {
      const matchSearch =
        !searchQuery ||
        o.nameAr?.includes(searchQuery) ||
        o.code?.includes(searchQuery) ||
        o.city?.includes(searchQuery) ||
        o.contactPerson?.includes(searchQuery) ||
        o.contactMobile?.includes(searchQuery);
      const matchStatus = filterStatus === "all" || o.status === filterStatus;
      const matchCity = filterCity === "all" || o.city === filterCity;
      return matchSearch && matchStatus && matchCity;
    });
  }, [offices, searchQuery, filterStatus, filterCity]);

  const stats = useMemo(
    () => ({
      total: offices.length,
      active: offices.filter((o) => o.status === "نشط").length,
      suspended: offices.filter((o) => o.status === "موقوف").length,
      frozen: offices.filter((o) => o.status === "مجمد").length,
      totalReceivable: offices.reduce(
        (sum, o) => sum + (o.receivableBalance || 0),
        0,
      ),
    }),
    [offices],
  );

  // 💡 Mutations
  const addMutation = useMutation({
    mutationFn: async (data) => api.post("/intermediary-offices", data),
    onSuccess: () => {
      toast.success("تم إضافة المكتب بنجاح");
      queryClient.invalidateQueries(["intermediary-offices"]);
      setShowAddModal(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ أثناء الإضافة"),
  });

  const updateMutation = useMutation({
    mutationFn: async (data) =>
      api.put(`/intermediary-offices/${data.id}`, data),
    onSuccess: () => {
      toast.success("تم تحديث بيانات المكتب بنجاح");
      queryClient.invalidateQueries(["intermediary-offices"]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/intermediary-offices/${id}`),
    onSuccess: () => {
      toast.success("تم حذف المكتب بنجاح");
      queryClient.invalidateQueries(["intermediary-offices"]);
      setShowDetailsDialog(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "لا يمكن حذف المكتب"),
  });

  const freezeMutation = useMutation({
    mutationFn: async (id) =>
      api.patch(`/intermediary-offices/${id}/toggle-freeze`),
    onSuccess: () => {
      toast.success("تم تغيير حالة المكتب بنجاح");
      queryClient.invalidateQueries(["intermediary-offices"]);
    },
  });

  const handleCopyTable = useCallback(() => {
    const header =
      "كود\tالاسم\tالمدينة\tالحالة\tالمسؤول\tالجوال\tالنوع\tرصيد الذمم";
    const rows = filteredOffices.map(
      (o) =>
        `${o.code}\t${o.nameAr}\t${o.city}\t${o.status}\t${o.contactPerson}\t${o.contactMobile}\t${o.relationshipType}\t${(o.receivableBalance || 0).toLocaleString("ar-SA")}`,
    );
    const text = [header, ...rows].join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("تم نسخ الجدول للحافظة"))
      .catch(() => toast.error("فشل النسخ"));
  }, [filteredOffices]);

  return (
    <div
      className="flex flex-col h-full bg-white"
      style={{ direction: "rtl", fontFamily: "Tajawal, sans-serif" }}
    >
      {/* ═══ Top Bar ═══ */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-l from-slate-50 to-white">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] text-slate-800 font-bold">
                المكاتب الوسيطة
              </h1>
              <p className="text-[11px] text-slate-400">
                إدارة ملفات المكاتب الهندسية والوسطاء
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg">
              <span className="text-[11px] text-slate-500">إجمالي:</span>
              <span className="text-[13px] text-slate-800 font-bold">
                {stats.total}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg">
              <CircleDot className="w-3 h-3 text-emerald-500" />
              <span className="text-[11px] text-emerald-700">
                {stats.active} نشط
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg">
              <XCircle className="w-3 h-3 text-red-500" />
              <span className="text-[11px] text-red-700">
                {stats.suspended} موقوف
              </span>
            </div>
            {stats.frozen > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
                <Pause className="w-3 h-3 text-blue-500" />
                <span className="text-[11px] text-blue-700">
                  {stats.frozen} مجمد
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg">
              <span className="text-[11px] text-amber-700 font-bold">
                ذمم: {stats.totalReceivable.toLocaleString("ar-SA")} ر.س
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative w-72">
              <Search className="absolute right-2.5 top-2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالاسم أو الكود أو المدينة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
            >
              <option value="all">جميع الحالات</option>
              <option value="نشط">نشط</option>
              <option value="موقوف">موقوف</option>
              <option value="مجمد">مجمد</option>
            </select>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="px-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
            >
              <option value="all">جميع المدن</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[12px] font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> إضافة مكتب
            </button>
            <button
              onClick={handleCopyTable}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-600 text-[11px] rounded-lg hover:bg-slate-200"
              title="نسخ"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Table ═══ */}
      <div className="flex-1 overflow-auto custom-scrollbar-slim p-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-[12px] border-collapse min-w-[1200px]">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr className="border-b border-slate-200">
                <th className="w-8 px-2.5 py-3 text-center text-slate-500 font-bold">
                  #
                </th>
                <th className="w-16 px-2.5 py-3 text-right text-slate-500 font-bold">
                  الكود
                </th>
                <th className="min-w-[200px] px-2.5 py-3 text-right text-slate-500 font-bold">
                  الاسم التجاري
                </th>
                <th className="w-24 px-2.5 py-3 text-right text-slate-500 font-bold">
                  المدينة
                </th>
                <th className="w-20 px-2.5 py-3 text-right text-slate-500 font-bold">
                  الحالة
                </th>
                <th className="w-24 px-2.5 py-3 text-right text-slate-500 font-bold">
                  النوع
                </th>
                <th className="w-32 px-2.5 py-3 text-right text-slate-500 font-bold">
                  المسؤول
                </th>
                <th className="w-28 px-2.5 py-3 text-right text-slate-500 font-bold">
                  الجوال
                </th>
                <th className="w-28 px-2.5 py-3 text-right text-slate-500 font-bold">
                  رصيد الذمم
                </th>
                <th className="w-20 px-2.5 py-3 text-center text-slate-500 font-bold">
                  المعاملات
                </th>
                <th className="w-28 px-2.5 py-3 text-right text-slate-500 font-bold">
                  آخر معاملة
                </th>
                <th className="w-24 px-2.5 py-3 text-right text-slate-500 font-bold">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="12" className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredOffices.length > 0 ? (
                filteredOffices.map((office, idx) => (
                  <tr
                    key={office.id}
                    onClick={() => {
                      setSelectedOffice(office);
                      setShowDetailsDialog(true);
                    }}
                    className="border-b border-slate-100 cursor-pointer hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="px-2.5 py-3 text-center text-slate-400 font-bold">
                      {idx + 1}
                    </td>
                    <td className="px-2.5 py-3">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-bold font-mono">
                        {office.code}
                      </span>
                    </td>
                    <td className="px-2.5 py-3">
                      <div className="text-[12px] text-slate-800 font-bold">
                        {office.nameAr}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {office.nameEn || "—"}
                      </div>
                    </td>
                    <td className="px-2.5 py-3 text-slate-600 font-semibold">
                      {office.city}
                    </td>
                    <td className="px-2.5 py-3">
                      <StatusBadge status={office.status} />
                    </td>
                    <td className="px-2.5 py-3">
                      <RelTypeBadge type={office.relationshipType} />
                    </td>
                    <td className="px-2.5 py-3 text-slate-700 font-semibold">
                      {office.contactPerson || "—"}
                    </td>
                    <td
                      className="px-2.5 py-3 text-slate-600 font-mono"
                      dir="ltr"
                      style={{ textAlign: "right" }}
                    >
                      {office.contactMobile || "—"}
                    </td>
                    <td className="px-2.5 py-3">
                      <span
                        className={`font-bold ${office.receivableBalance > 0 ? "text-amber-600" : "text-slate-400"}`}
                      >
                        {office.receivableBalance > 0
                          ? `${office.receivableBalance.toLocaleString("ar-SA")} ر.س`
                          : "-"}
                      </span>
                    </td>
                    <td className="px-2.5 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 text-[11px] rounded-full font-bold">
                        {office.transactions?.length || 0}
                      </span>
                    </td>
                    <td className="px-2.5 py-3">
                      <span className="text-[10px] text-blue-600 font-mono font-bold">
                        {office.lastTransactionCode || "—"}
                      </span>
                    </td>
                    <td className="px-2.5 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOffice(office);
                          setShowDetailsDialog(true);
                        }}
                        className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="12"
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <div className="text-[13px] font-bold">
                      لا توجد مكاتب مطابقة
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddOfficeModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(data) => addMutation.mutate(data)}
        isPending={addMutation.isPending}
      />

      {showDetailsDialog && selectedOffice && (
        <OfficeDetailsDialog
          office={selectedOffice}
          open={showDetailsDialog}
          onClose={() => {
            setShowDetailsDialog(false);
            setSelectedOffice(null);
          }}
          onUpdate={(data) => updateMutation.mutate(data)}
          onDelete={(id) => deleteMutation.mutate(id)}
          onFreeze={(id) => freezeMutation.mutate(id)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Add Office Modal (Tailwind Pure)
// ═══════════════════════════════════════════════

function AddOfficeModal({ open, onClose, onAdd, isPending }) {
  const [formData, setFormData] = useState({
    nameAr: "",
    nameEn: "",
    commercialRegister: "",
    engineeringLicense: "",
    vatNumber: "",
    vatStatus: "غير مسجل",
    nationalAddress: "",
    city: "",
    region: "",
    email: "",
    phone: "",
    whatsapp: "",
    website: "",
    specializations: [],
    status: "نشط",
    relationshipType: "وسيط",
    contactPerson: "",
    contactMobile: "",
    internalNotes: "",
  });

  const [specialization, setSpecialization] = useState("");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-3xl overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-800 text-white shrink-0">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" /> إضافة مكتب وسيط جديد
          </h2>
          <button
            onClick={onClose}
            className="hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar-slim space-y-6">
          <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                الاسم التجاري (عربي) *
              </label>
              <input
                type="text"
                value={formData.nameAr}
                onChange={(e) =>
                  setFormData({ ...formData, nameAr: e.target.value })
                }
                className="w-full px-3 py-2 text-[12px] font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="مثال: مكتب الحلول الهندسية"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                السجل التجاري *
              </label>
              <input
                type="text"
                value={formData.commercialRegister}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    commercialRegister: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-[12px] font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="1010456789"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                المدينة *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full px-3 py-2 text-[12px] font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="الرياض"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                نوع العلاقة
              </label>
              <select
                value={formData.relationshipType}
                onChange={(e) =>
                  setFormData({ ...formData, relationshipType: e.target.value })
                }
                className="w-full px-3 py-2 text-[12px] font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="وسيط">وسيط</option>
                <option value="شريك">شريك</option>
                <option value="مكتب تابع">مكتب تابع</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                اسم المسؤول والجوال
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  className="w-1/2 px-3 py-2 text-[12px] font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="اسم المسؤول"
                />
                <input
                  type="text"
                  value={formData.contactMobile}
                  onChange={(e) =>
                    setFormData({ ...formData, contactMobile: e.target.value })
                  }
                  className="w-1/2 px-3 py-2 text-[12px] font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="05XXXXXXXX"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={() => {
              if (
                !formData.nameAr ||
                !formData.commercialRegister ||
                !formData.city
              )
                return toast.error("أكمل الحقول الإلزامية");
              onAdd(formData);
            }}
            disabled={isPending}
            className="flex items-center gap-2 px-8 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}{" "}
            حفظ المكتب
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Office Details Dialog (Tailwind Pure with Tabs)
// ═══════════════════════════════════════════════

function OfficeDetailsDialog({
  office,
  open,
  onClose,
  onUpdate,
  onDelete,
  onFreeze,
}) {
  const [activeTab, setActiveTab] = useState("basic");

  if (!open || !office) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in"
      dir="rtl"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-200 bg-gradient-to-l from-blue-50 to-white px-6 py-4 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-inner">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  {office.nameAr}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] rounded font-bold font-mono">
                    {office.code}
                  </span>
                  <StatusBadge status={office.status} />
                  <RelTypeBadge type={office.relationshipType} />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => {
                if (confirm("متأكد من تجميد/تنشيط المكتب؟"))
                  onFreeze(office.id);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-lg hover:bg-amber-100 border border-amber-200"
            >
              <Pause className="w-3.5 h-3.5" /> تجميد / تنشيط
            </button>
            <button
              onClick={() => {
                if (confirm("حذف المكتب نهائياً؟")) onDelete(office.id);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-[11px] font-bold rounded-lg hover:bg-red-100 border border-red-200"
            >
              <Trash2 className="w-3.5 h-3.5" /> حذف المكتب
            </button>
          </div>
        </div>

        {/* Tabs Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0 overflow-x-auto">
          {[
            { id: "basic", label: "البيانات الأساسية", icon: FileText },
            {
              id: "contacts",
              label: `جهات الاتصال (${office.contacts?.length || 0})`,
              icon: Users,
            },
            {
              id: "assets",
              label: `المكونات الرسمية (${office.officialAssets?.length || 0})`,
              icon: Palette,
            },
            {
              id: "intermediaries",
              label: `الوسطاء (${office.intermediaryLinks?.length || 0})`,
              icon: Link2,
            },
            {
              id: "transactions",
              label: `المعاملات (${office.transactions?.length || 0})`,
              icon: TrendingUp,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar-slim">
          {activeTab === "basic" && (
            <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-500 text-[10px] font-bold">
                    السجل التجاري
                  </span>
                  <div className="font-mono font-bold text-sm text-gray-800 mt-1">
                    {office.commercialRegister}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-500 text-[10px] font-bold">
                    المدينة
                  </span>
                  <div className="font-bold text-sm text-gray-800 mt-1">
                    {office.city}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-500 text-[10px] font-bold">
                    المسؤول
                  </span>
                  <div className="font-bold text-sm text-gray-800 mt-1">
                    {office.contactPerson || "—"}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-500 text-[10px] font-bold">
                    الجوال
                  </span>
                  <div className="font-mono font-bold text-sm text-gray-800 mt-1">
                    {office.contactMobile || "—"}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "contacts" && (
            <div className="text-center py-10 text-gray-400 font-bold">
              محتوى جهات الاتصال (قيد التطوير)
            </div>
          )}
          {activeTab === "assets" && (
            <div className="text-center py-10 text-gray-400 font-bold">
              محتوى المكونات الرسمية (قيد التطوير)
            </div>
          )}
          {activeTab === "intermediaries" && (
            <div className="text-center py-10 text-gray-400 font-bold">
              محتوى الوسطاء (قيد التطوير)
            </div>
          )}
          {activeTab === "transactions" && (
            <div className="text-center py-10 text-gray-400 font-bold">
              سجل المعاملات المربوطة (قيد التطوير)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
