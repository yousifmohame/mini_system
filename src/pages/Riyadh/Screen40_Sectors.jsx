import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import { toast } from "sonner";
import {
  Landmark,
  Search,
  LayoutGrid,
  List,
  Plus,
  MapPin,
  Building2,
  Edit,
  Trash2,
  Globe,
  Link2,
  Download,
  Printer,
  Loader2,
  X,
  FileText,
  Map,
  Satellite,
  CircleCheck,
  AlertCircle,
  Route
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const Screen40_Sectors = () => {
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const [modal, setModal] = useState({
    isOpen: false,
    mode: "create",
    data: {
      id: null,
      name: "",
      officialLink: "",
      mapImage: "",
      satelliteImage: "",
    },
  });

  const { data: sectors = [], isLoading } = useQuery({
    queryKey: ["sectors-list"],
    queryFn: async () => {
      const response = await api.get("/riyadh-streets/sectors");
      return response.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (modal.mode === "create") {
        return await api.post("/riyadh-streets/sectors", payload);
      } else {
        return await api.put(`/riyadh-streets/sectors/${payload.id}`, payload);
      }
    },
    onSuccess: () => {
      toast.success(
        modal.mode === "create"
          ? "تم تسجيل القطاع بنجاح"
          : "تم تحديث بيانات القطاع",
      );
      queryClient.invalidateQueries(["sectors-list"]);
      queryClient.invalidateQueries(["riyadh-tree"]);
      setModal({ ...modal, isOpen: false });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ في الحفظ"),
  });

  // 👈 إضافة عملية الحذف
  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/riyadh-streets/sectors/${id}`),
    onSuccess: () => {
      toast.success("تم حذف القطاع بنجاح");
      queryClient.invalidateQueries(["sectors-list"]);
      queryClient.invalidateQueries(["riyadh-tree"]);
      setModal({ ...modal, isOpen: false });
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message ||
          "فشل الحذف، قد يكون القطاع مرتبطاً ببيانات أخرى.",
      ),
  });

  const handleDelete = (id, name) => {
    if (
      window.confirm(
        `هل أنت متأكد من رغبتك في حذف (قطاع ${name}) نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`,
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const filteredSectors = useMemo(() => {
    return sectors.filter(
      (s) =>
        s.name.includes(searchQuery) ||
        s.code?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [sectors, searchQuery]);

  const kpis = useMemo(() => {
    const totalDistricts = sectors.reduce(
      (acc, curr) => acc + (curr._count?.districts || 0),
      0,
    );
    const totalStreets = sectors.reduce(
      (acc, curr) => acc + (curr._count?.streets || 0),
      0,
    );
    const linkedMaps = sectors.filter((s) => s.officialLink).length;

    return {
      totalSectors: sectors.length,
      totalDistricts,
      totalStreets,
      coverage:
        sectors.length > 0
          ? Math.round((linkedMaps / sectors.length) * 100)
          : 0,
    };
  }, [sectors]);

  const getSectorStyle = (name) => {
    if (name.includes("وسط"))
      return {
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        gradient: "from-red-50 to-white",
      };
    if (name.includes("شمال"))
      return {
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        gradient: "from-blue-50 to-white",
      };
    if (name.includes("جنوب"))
      return {
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        gradient: "from-emerald-50 to-white",
      };
    if (name.includes("شرق"))
      return {
        color: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-200",
        gradient: "from-orange-50 to-white",
      };
    if (name.includes("غرب"))
      return {
        color: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-200",
        gradient: "from-purple-50 to-white",
      };
    return {
      color: "text-stone-600",
      bg: "bg-stone-100",
      border: "border-stone-200",
      gradient: "from-stone-50 to-white",
    };
  };

  // 👈 دالة الطباعة
  const handlePrint = () => {
    window.print();
  };

  // 👈 دالة استخراج CSV
  const handleDownloadCSV = () => {
    const headers = [
      "اسم القطاع",
      "الكود الداخلي",
      "عدد الأحياء",
      "عدد الشوارع",
      "رابط الخريطة الرسمية",
    ];
    const rows = filteredSectors.map((s) => [
      `قطاع ${s.name}`,
      s.code || "N/A",
      s._count?.districts || 0,
      s._count?.streets || 0,
      s.officialLink || "غير متوفر",
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Riyadh_Sectors_Report_${new Date().toLocaleDateString()}.csv`;
    link.click();
    toast.success("تم تصدير التقرير بنجاح");
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col bg-[#F6F7F9] font-sans text-right"
      dir="rtl"
    >
      {/* 🖨️ منطقة الطباعة المخفية (ستظهر فقط عند ضغط Ctrl+P) 🖨️ */}
      <div className="hidden print:block p-8 bg-white text-black">
        <div className="text-center border-b-2 border-stone-800 pb-4 mb-6">
          <h1 className="text-3xl font-black mb-2">
            تقرير التقسيم الإداري لمدينة الرياض
          </h1>
          <p className="text-lg text-stone-500">إحصائيات القطاعات البلدية</p>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-8 text-center">
          <div className="border p-4 rounded-xl">
            <strong>إجمالي القطاعات:</strong> {kpis.totalSectors}
          </div>
          <div className="border p-4 rounded-xl">
            <strong>الأحياء المعتمدة:</strong> {kpis.totalDistricts}
          </div>
          <div className="border p-4 rounded-xl">
            <strong>الشوارع المسجلة:</strong> {kpis.totalStreets}
          </div>
          <div className="border p-4 rounded-xl">
            <strong>تغطية الخرائط:</strong> {kpis.coverage}%
          </div>
        </div>
        <table className="w-full text-sm border-collapse border border-stone-300">
          <thead>
            <tr className="bg-stone-100">
              <th className="border border-stone-300 p-3">اسم القطاع</th>
              <th className="border border-stone-300 p-3">الكود</th>
              <th className="border border-stone-300 p-3">عدد الأحياء</th>
              <th className="border border-stone-300 p-3">عدد الشوارع</th>
            </tr>
          </thead>
          <tbody>
            {filteredSectors.map((s) => (
              <tr key={s.id}>
                <td className="border border-stone-300 p-3 font-bold">
                  قطاع {s.name}
                </td>
                <td className="border border-stone-300 p-3 text-center">
                  {s.code}
                </td>
                <td className="border border-stone-300 p-3 text-center">
                  {s._count?.districts || 0}
                </td>
                <td className="border border-stone-300 p-3 text-center">
                  {s._count?.streets || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="print:hidden h-full flex flex-col">
        {/* --- Header & Title --- */}
        <div className="bg-white border-b border-stone-200 px-6 py-4 shrink-0 z-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center shadow-lg shadow-stone-900/20">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-stone-900">
                  إدارة القطاعات البلدية
                </h1>
                <p className="text-xs text-stone-500 font-medium mt-1">
                  التحكم في التقسيم الإداري الرئيسي لمدينة الرياض
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 👈 أزرار التحميل والطباعة النشطة */}
              <button
                onClick={handleDownloadCSV}
                className="p-2 text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                title="تصدير CSV"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrint}
                className="p-2 text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                title="طباعة"
              >
                <Printer className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-stone-200 mx-1"></div>
              <button
                onClick={() =>
                  setModal({
                    isOpen: true,
                    mode: "create",
                    data: {
                      id: null,
                      name: "",
                      officialLink: "",
                      mapImage: "",
                      satelliteImage: "",
                    },
                  })
                }
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
              >
                <Plus className="w-4 h-4" /> تسجيل قطاع جديد
              </button>
            </div>
          </div>
        </div>

        {/* --- Main Content --- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-stone-500 text-xs font-bold">
                  إجمالي القطاعات
                </span>
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Landmark className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-stone-900">
                {kpis.totalSectors}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-stone-500 text-xs font-bold">
                  الأحياء المعتمدة
                </span>
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-stone-900">
                {kpis.totalDistricts}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-stone-500 text-xs font-bold">
                  الشوارع المسجلة
                </span>
                <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                  <Route className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-stone-900">
                {kpis.totalStreets}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-500"></div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-stone-500 text-xs font-bold">
                  تغطية الخرائط
                </span>
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-black text-stone-900">
                  {kpis.coverage}%
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
            <div className="relative w-full max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="بحث باسم القطاع أو الكود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center bg-stone-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow text-blue-600" : "text-stone-500 hover:text-stone-700"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-white shadow text-blue-600" : "text-stone-500 hover:text-stone-700"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Data Display */}
          {filteredSectors.length === 0 ? (
            <div className="bg-white border border-stone-200 border-dashed rounded-2xl flex flex-col items-center justify-center py-16">
              <Landmark className="w-12 h-12 text-stone-300 mb-4" />
              <h3 className="text-stone-500 font-bold text-lg">
                لا توجد قطاعات مطابقة للبحث
              </h3>
            </div>
          ) : viewMode === "grid" ? (
            /* ================= GRID VIEW ================= */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {filteredSectors.map((sector) => {
                const style = getSectorStyle(sector.name);
                return (
                  <div
                    key={sector.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col"
                  >
                    <div
                      className={`p-4 border-b ${style.border} bg-gradient-to-bl ${style.gradient} flex justify-between items-start relative overflow-hidden`}
                    >
                      <div className="relative z-10">
                        <div
                          className={`w-10 h-10 rounded-xl ${style.bg} ${style.color} flex items-center justify-center mb-3 shadow-sm`}
                        >
                          <Landmark className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-stone-900 leading-tight mb-1">
                          قطاع {sector.name}
                        </h3>
                        <span className="inline-block px-2 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-mono text-stone-500 font-bold shadow-sm">
                          {sector.code || "N/A"}
                        </span>
                      </div>

                      {/* 👈 أزرار التعديل والحذف في الكارت */}
                      <div className="relative z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            setModal({
                              isOpen: true,
                              mode: "edit",
                              data: sector,
                            })
                          }
                          className="p-2 bg-white rounded-lg border border-stone-200 text-stone-400 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sector.id, sector.name)}
                          className="p-2 bg-white rounded-lg border border-stone-200 text-stone-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div
                        className={`absolute -bottom-4 -left-4 w-24 h-24 rounded-full opacity-10 ${style.bg}`}
                      ></div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col gap-4">
                      <div className="flex gap-3">
                        <div className="flex-1 bg-stone-50 rounded-xl p-3 border border-stone-100 flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm text-stone-500">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xl font-black text-stone-800 leading-none">
                              {sector._count?.districts || 0}
                            </div>
                            <div className="text-[10px] font-bold text-stone-500 mt-1">
                              أحياء معتمدة
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="h-28 bg-stone-100 rounded-xl border border-stone-200 overflow-hidden relative group/map">
                        {sector.mapImage ? (
                          <img
                            src={sector.mapImage}
                            alt="Map"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400">
                            <Map className="w-6 h-6 mb-1 opacity-50" />
                            <span className="text-[10px] font-bold">
                              لا توجد خريطة
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 border-t border-stone-100 bg-stone-50 flex items-center justify-between mt-auto">
                      {sector.officialLink ? (
                        <a
                          href={sector.officialLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" /> الخريطة التفاعلية
                        </a>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400">
                          <Globe className="w-3.5 h-3.5" /> غير مرتبط بخريطة
                        </span>
                      )}
                      {sector.officialLink && (
                        <div className="w-8 h-8 bg-white border border-stone-200 rounded-lg flex items-center justify-center p-0.5 shadow-sm">
                          <QRCodeSVG
                            value={sector.officialLink}
                            size={100}
                            className="w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ================= TABLE VIEW ================= */
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
                    <tr>
                      <th className="px-6 py-4">اسم القطاع</th>
                      <th className="px-6 py-4">الكود الداخلي</th>
                      <th className="px-6 py-4 text-center">عدد الأحياء</th>
                      <th className="px-6 py-4 text-center">عدد الشوارع</th>
                      <th className="px-6 py-4">الارتباط الجغرافي</th>
                      <th className="px-6 py-4 text-center w-28">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredSectors.map((sector) => (
                      <tr
                        key={sector.id}
                        className="hover:bg-stone-50/80 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${getSectorStyle(sector.name).bg} ${getSectorStyle(sector.name).color}`}
                            >
                              <Landmark className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-stone-900">
                              قطاع {sector.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs bg-stone-100 px-2 py-1 rounded text-stone-600 border border-stone-200">
                            {sector.code || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-stone-700">
                          {sector._count?.districts || 0}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-stone-700">
                          {sector._count?.streets || 0}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {sector.officialLink ? (
                              <div
                                className="w-6 h-6 rounded bg-green-50 text-green-600 flex items-center justify-center"
                                title="رابط متوفر"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded bg-stone-100 text-stone-300 flex items-center justify-center">
                                <Link2 className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {sector.mapImage ? (
                              <div
                                className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center"
                                title="مخطط متوفر"
                              >
                                <Map className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded bg-stone-100 text-stone-300 flex items-center justify-center">
                                <Map className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {/* 👈 أزرار التعديل والحذف في الجدول */}
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() =>
                                setModal({
                                  isOpen: true,
                                  mode: "edit",
                                  data: sector,
                                })
                              }
                              className="p-1.5 text-stone-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(sector.id, sector.name)
                              }
                              className="p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= Modal: إضافة/تعديل قطاع ================= */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-800 text-lg">
                    {modal.mode === "create"
                      ? "تسجيل قطاع جديد"
                      : "تعديل بيانات القطاع"}
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                    إدارة البيانات الأساسية والروابط الجغرافية للقطاع
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModal({ ...modal, isOpen: false })}
                className="p-2 hover:bg-stone-200 rounded-lg text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              id="sectorForm"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(modal.data);
              }}
              className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar"
            >
              <section>
                <h4 className="text-[12px] font-bold text-stone-800 mb-4 flex items-center gap-2 border-b border-stone-100 pb-2">
                  <FileText className="w-4 h-4 text-blue-500" /> البيانات
                  الأساسية
                </h4>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] font-bold text-stone-700 mb-2">
                      اسم القطاع <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={modal.data.name}
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          data: { ...modal.data, name: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                      placeholder="مثال: وسط، شمال، غرب..."
                    />
                  </div>
                  {modal.mode === "edit" && (
                    <div>
                      <label className="block text-[12px] font-bold text-stone-700 mb-2">
                        كود القطاع الداخلي
                      </label>
                      <input
                        type="text"
                        readOnly
                        dir="ltr"
                        value={modal.data.code || "يتم توليده تلقائياً"}
                        className="w-full px-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm font-mono text-left text-stone-500 outline-none cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h4 className="text-[12px] font-bold text-stone-800 mb-4 flex items-center gap-2 border-b border-stone-100 pb-2">
                  <Globe className="w-4 h-4 text-emerald-500" /> الروابط
                  والخرائط
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-bold text-stone-700 mb-2">
                      رابط الخريطة الرسمية (URL)
                    </label>
                    <div className="relative">
                      <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="url"
                        dir="ltr"
                        value={modal.data.officialLink || ""}
                        onChange={(e) =>
                          setModal({
                            ...modal,
                            data: {
                              ...modal.data,
                              officialLink: e.target.value,
                            },
                          })
                        }
                        className="w-full pr-9 pl-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-left outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                        placeholder="https://maps.example.com/..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[12px] font-bold text-stone-700 mb-2">
                        رابط صورة المخطط
                      </label>
                      <div className="relative">
                        <Map className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                          type="url"
                          dir="ltr"
                          value={modal.data.mapImage || ""}
                          onChange={(e) =>
                            setModal({
                              ...modal,
                              data: { ...modal.data, mapImage: e.target.value },
                            })
                          }
                          className="w-full pr-9 pl-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-[12px] font-mono text-left outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-stone-700 mb-2">
                        رابط صورة القمر الصناعي
                      </label>
                      <div className="relative">
                        <Satellite className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                          type="url"
                          dir="ltr"
                          value={modal.data.satelliteImage || ""}
                          onChange={(e) =>
                            setModal({
                              ...modal,
                              data: {
                                ...modal.data,
                                satelliteImage: e.target.value,
                              },
                            })
                          }
                          className="w-full pr-9 pl-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-[12px] font-mono text-left outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </form>
            <div className="p-4 border-t border-stone-100 bg-stone-50 flex gap-3 shrink-0">
              {/* 👈 زر حذف صريح داخل المودال إذا كان وضع التعديل */}
              {modal.mode === "edit" && (
                <button
                  type="button"
                  onClick={() => handleDelete(modal.data.id, modal.data.name)}
                  className="px-4 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> حذف
                </button>
              )}
              <div className="flex-1"></div>
              <button
                type="button"
                onClick={() => setModal({ ...modal, isOpen: false })}
                className="px-6 py-2.5 bg-white border border-stone-200 text-stone-700 font-bold rounded-xl hover:bg-stone-50 transition-colors w-32"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="sectorForm"
                disabled={saveMutation.isPending}
                className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CircleCheck className="w-5 h-5" />{" "}
                    {modal.mode === "create" ? "حفظ وإنشاء" : "تحديث البيانات"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Screen40_Sectors;
