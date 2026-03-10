import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import { toast } from "sonner";
import {
  MapPin,
  Search,
  LayoutGrid,
  List,
  Plus,
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
  Route,
  Layers,
  Eye,
  ChevronDown,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const Screen41_Districts = () => {
  const queryClient = useQueryClient();

  // ==========================================
  // 1. الحالات (States)
  // ==========================================
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");

  // مودال الحي (إضافة/تعديل)
  const [modal, setModal] = useState({
    isOpen: false,
    mode: "create",
    data: {
      id: null,
      name: "",
      sectorId: "",
      officialLink: "",
      mapImage: "",
      satelliteImage: "",
    },
  });

  // مودال عرض قائمة الشوارع لحي معين
  const [streetsModal, setStreetsModal] = useState({
    isOpen: false,
    district: null,
  });

  // مودال تعديل الشارع (يُفتح من داخل مودال الشوارع)
  const [editStreetModal, setEditStreetModal] = useState({
    isOpen: false,
    data: {
      id: null,
      name: "",
      width: "",
      length: "",
      lanes: "2",
      type: "normal",
      lighting: true,
      sidewalks: true,
    },
  });

  // ==========================================
  // 2. جلب البيانات (Queries)
  // ==========================================
  // 👈 تم التحديث لجلب تفاصيل الشوارع داخل الحي لعرضها في المودال
  const { data: districts = [], isLoading: loadingDistricts } = useQuery({
    queryKey: ["districts-list"],
    queryFn: async () => {
      // نستخدم مسار شجرة التقسيم لأنه يجلب الأحياء مع شوارعها بالتفصيل (يمكن استخدام مسار مخصص لو أردت)
      const response = await api.get("/riyadh-streets/tree");
      // تبسيط البيانات لتناسب هذه الشاشة
      let allDistricts = [];
      response.data.forEach((sector) => {
        if (sector.neighborhoods) {
          const mappedNbh = sector.neighborhoods.map((n) => ({
            ...n,
            sector: { id: sector.id, name: sector.name },
            sectorId: sector.id,
            _count: { streets: n.streets?.length || 0, plans: 0 }, // plans وهمي حالياً
          }));
          allDistricts = [...allDistricts, ...mappedNbh];
        }
      });
      return allDistricts;
    },
  });

  const { data: sectors = [], isLoading: loadingSectors } = useQuery({
    queryKey: ["sectors-list"],
    queryFn: async () => {
      const response = await api.get("/riyadh-streets/sectors");
      return response.data;
    },
  });

  // ==========================================
  // 3. العمليات (Mutations)
  // ==========================================
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (modal.mode === "create")
        return await api.post("/riyadh-streets/districts", payload);
      return await api.put(`/riyadh-streets/districts/${payload.id}`, payload);
    },
    onSuccess: () => {
      toast.success(
        modal.mode === "create"
          ? "تم تسجيل الحي بنجاح"
          : "تم تحديث بيانات الحي",
      );
      queryClient.invalidateQueries(["districts-list"]);
      queryClient.invalidateQueries(["riyadh-tree"]);
      setModal({ ...modal, isOpen: false });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ في الحفظ"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) =>
      await api.delete(`/riyadh-streets/districts/${id}`),
    onSuccess: () => {
      toast.success("تم حذف الحي بنجاح");
      queryClient.invalidateQueries(["districts-list"]);
      queryClient.invalidateQueries(["riyadh-tree"]);
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message || "فشل الحذف، الحي مرتبط ببيانات أخرى.",
      ),
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف (حي ${name})؟`)) {
      deleteMutation.mutate(id);
    }
  };

  // ----- عمليات الشوارع -----
  const streetUpdateMutation = useMutation({
    mutationFn: async (payload) =>
      await api.put(`/riyadh-streets/${payload.id}`, payload),
    onSuccess: () => {
      toast.success("تم تحديث الشارع بنجاح");
      queryClient.invalidateQueries(["districts-list"]);
      queryClient.invalidateQueries(["riyadh-tree"]);
      setEditStreetModal({ ...editStreetModal, isOpen: false });
      // إغلاق مودال الشوارع لإنعاشه لاحقاً أو يمكنك تركه ليقوم بـ Refetch
      setStreetsModal({ isOpen: false, district: null });
    },
    onError: (err) => toast.error("حدث خطأ في تحديث الشارع"),
  });

  const streetDeleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/riyadh-streets/${id}`),
    onSuccess: () => {
      toast.success("تم حذف الشارع بنجاح");
      queryClient.invalidateQueries(["districts-list"]);
      queryClient.invalidateQueries(["riyadh-tree"]);
      setStreetsModal({ isOpen: false, district: null });
    },
    onError: (err) => toast.error("فشل حذف الشارع"),
  });

  const handleDeleteStreet = (id, name) => {
    if (window.confirm(`هل أنت متأكد من حذف الشارع (${name}) نهائياً؟`)) {
      streetDeleteMutation.mutate(id);
    }
  };

  // ==========================================
  // 4. معالجة البيانات
  // ==========================================
  const filteredDistricts = useMemo(() => {
    return districts.filter((d) => {
      const matchesSearch =
        d.name.includes(searchQuery) ||
        d.code?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector =
        sectorFilter === "all" || d.sectorId === sectorFilter;
      return matchesSearch && matchesSector;
    });
  }, [districts, searchQuery, sectorFilter]);

  const kpis = useMemo(() => {
    const totalStreets = filteredDistricts.reduce(
      (acc, curr) => acc + (curr._count?.streets || 0),
      0,
    );
    const linkedMaps = filteredDistricts.filter((d) => d.officialLink).length;

    return {
      totalDistricts: filteredDistricts.length,
      totalStreets,
      coverage:
        filteredDistricts.length > 0
          ? Math.round((linkedMaps / filteredDistricts.length) * 100)
          : 0,
    };
  }, [filteredDistricts]);

  const getSectorBadge = (sectorName) => {
    if (!sectorName) return { bg: "bg-stone-100", text: "text-stone-600" };
    if (sectorName.includes("وسط"))
      return {
        bg: "bg-red-50",
        text: "text-red-600",
        border: "border-red-100",
      };
    if (sectorName.includes("شمال"))
      return {
        bg: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-100",
      };
    if (sectorName.includes("جنوب"))
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
      };
    if (sectorName.includes("شرق"))
      return {
        bg: "bg-orange-50",
        text: "text-orange-600",
        border: "border-orange-100",
      };
    if (sectorName.includes("غرب"))
      return {
        bg: "bg-purple-50",
        text: "text-purple-600",
        border: "border-purple-100",
      };
    return {
      bg: "bg-stone-100",
      text: "text-stone-600",
      border: "border-stone-200",
    };
  };

  if (loadingDistricts || loadingSectors)
    return (
      <div className="h-full flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div
      className="h-full flex flex-col bg-[#F6F7F9] font-sans text-right"
      dir="rtl"
    >
      <div className="print:hidden h-full flex flex-col">
        {/* --- Header --- */}
        <div className="bg-white border-b border-stone-200 px-6 py-4 shrink-0 z-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-stone-900">
                  إدارة الأحياء السكنية
                </h1>
                <p className="text-xs text-stone-500 font-medium mt-1">
                  سجل الأحياء المعتمدة، الخرائط، والتوزيع الجغرافي
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                title="تصدير CSV"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.print()}
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
                      sectorId: "",
                      officialLink: "",
                      mapImage: "",
                      satelliteImage: "",
                    },
                  })
                }
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
              >
                <Plus className="w-4 h-4" /> تسجيل حي جديد
              </button>
            </div>
          </div>
        </div>

        {/* --- Main Content --- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-stone-500 text-xs font-bold">
                  الأحياء (حسب الفلتر)
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
                  الشوارع المشمولة
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
              <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-stone-500 text-xs font-bold">
                  تغطية الروابط الجغرافية
                </span>
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-stone-900">
                {kpis.coverage}%
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-full max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="بحث باسم الحي أو الكود..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="py-2 px-3 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 text-stone-700 font-bold min-w-[180px]"
              >
                <option value="all">جميع القطاعات</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    قطاع {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center bg-stone-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow text-emerald-600" : "text-stone-500 hover:text-stone-700"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-white shadow text-emerald-600" : "text-stone-500 hover:text-stone-700"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Data Display */}
          {filteredDistricts.length === 0 ? (
            <div className="bg-white border border-stone-200 border-dashed rounded-2xl flex flex-col items-center justify-center py-16">
              <MapPin className="w-12 h-12 text-stone-300 mb-4" />
              <h3 className="text-stone-500 font-bold text-lg">
                لا توجد أحياء مطابقة
              </h3>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {filteredDistricts.map((dist) => {
                const sectorBadge = getSectorBadge(dist.sector?.name);

                return (
                  <div
                    key={dist.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col"
                  >
                    <div className="p-4 border-b border-stone-100 flex justify-between items-start relative">
                      <div>
                        <h3 className="text-lg font-black text-stone-900 leading-tight mb-2">
                          {dist.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2 py-0.5 bg-stone-100 border border-stone-200 rounded text-[10px] font-mono text-stone-600 font-bold">
                            {dist.code || "N/A"}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border ${sectorBadge.bg} ${sectorBadge.text} ${sectorBadge.border}`}
                          >
                            <Building2 className="w-2.5 h-2.5" /> قطاع{" "}
                            {dist.sector?.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            setModal({ isOpen: true, mode: "edit", data: dist })
                          }
                          className="p-2 bg-stone-50 rounded-lg text-stone-400 hover:text-emerald-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(dist.id, dist.name)}
                          className="p-2 bg-stone-50 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col gap-4">
                      <div className="flex gap-3">
                        <div
                          className="flex-1 bg-stone-50 rounded-xl p-3 border border-stone-100 flex items-center justify-between group/st hover:bg-orange-50 transition-colors cursor-pointer"
                          onClick={() =>
                            setStreetsModal({ isOpen: true, district: dist })
                          }
                        >
                          <div className="text-[11px] font-bold text-stone-500 group-hover/st:text-orange-600 flex items-center gap-1.5">
                            <Route className="w-4 h-4 text-orange-400" /> عرض
                            الشوارع
                          </div>
                          <div className="text-lg font-black text-stone-800">
                            {dist._count?.streets || 0}
                          </div>
                        </div>
                      </div>

                      <div className="h-28 bg-stone-100 rounded-xl border border-stone-200 overflow-hidden relative">
                        {dist.mapImage ? (
                          <img
                            src={dist.mapImage}
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
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
                    <tr>
                      <th className="px-6 py-4">اسم الحي</th>
                      <th className="px-6 py-4">القطاع التابع له</th>
                      <th className="px-6 py-4 text-center">عدد الشوارع</th>
                      <th className="px-6 py-4 text-center">
                        الارتباط الجغرافي
                      </th>
                      <th className="px-6 py-4 text-center w-32">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredDistricts.map((dist) => {
                      const sectorBadge = getSectorBadge(dist.sector?.name);
                      return (
                        <tr
                          key={dist.id}
                          className="hover:bg-stone-50/80 transition-colors"
                        >
                          <td className="px-6 py-4 font-bold text-stone-900">
                            {dist.name}{" "}
                            <span className="mr-2 font-mono text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">
                              {dist.code}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${sectorBadge.bg} ${sectorBadge.text} ${sectorBadge.border}`}
                            >
                              {dist.sector?.name || "غير محدد"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-stone-700">
                            <button
                              onClick={() =>
                                setStreetsModal({
                                  isOpen: true,
                                  district: dist,
                                })
                              }
                              className="hover:text-blue-600 hover:underline"
                            >
                              {dist._count?.streets || 0} شارع
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {dist.officialLink ? (
                                <Link2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Link2 className="w-4 h-4 text-stone-300" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() =>
                                  setStreetsModal({
                                    isOpen: true,
                                    district: dist,
                                  })
                                }
                                className="p-1.5 text-stone-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                                title="عرض الشوارع"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setModal({
                                    isOpen: true,
                                    mode: "edit",
                                    data: dist,
                                  })
                                }
                                className="p-1.5 text-stone-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(dist.id, dist.name)}
                                className="p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
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
          )}
        </div>
      </div>

      {/* ================= Modal: إضافة/تعديل حي ================= */}
      {/* ... [نفس كود المودال السابق الخاص بالحي تماماً] ... */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-800 text-lg">
                    {modal.mode === "create"
                      ? "تسجيل حي جديد"
                      : "تعديل بيانات الحي"}
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                    تسجيل وربط الحي بالقطاع المناسب
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
              id="districtForm"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(modal.data);
              }}
              className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar"
            >
              <section>
                <h4 className="text-[12px] font-bold text-stone-800 mb-4 flex items-center gap-2 border-b border-stone-100 pb-2">
                  <FileText className="w-4 h-4 text-emerald-500" /> البيانات
                  الأساسية
                </h4>
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-[12px] font-bold text-stone-700 mb-2">
                      القطاع التابع له <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={modal.data.sectorId}
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          data: { ...modal.data, sectorId: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-stone-700 cursor-pointer"
                    >
                      <option value="" disabled>
                        -- اختر القطاع --
                      </option>
                      {sectors.map((s) => (
                        <option key={s.id} value={s.id}>
                          قطاع {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-stone-700 mb-2">
                      اسم الحي <span className="text-red-500">*</span>
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
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white"
                      placeholder="مثال: العليا..."
                    />
                  </div>
                  {modal.mode === "edit" && (
                    <div>
                      <label className="block text-[12px] font-bold text-stone-700 mb-2">
                        كود الحي الداخلي
                      </label>
                      <input
                        type="text"
                        readOnly
                        dir="ltr"
                        value={modal.data.code || "تلقائي"}
                        className="w-full px-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm font-mono text-left text-stone-500 outline-none cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>
              </section>
            </form>
            <div className="p-4 border-t border-stone-100 bg-stone-50 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setModal({ ...modal, isOpen: false })}
                className="px-6 py-2.5 bg-white border border-stone-200 text-stone-700 font-bold rounded-xl hover:bg-stone-50 transition-colors w-32"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="districtForm"
                disabled={saveMutation.isPending}
                className="flex-1 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CircleCheck className="w-5 h-5" /> حفظ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= Modal: قائمة شوارع الحي (Drill-down) ================= */}
      {streetsModal.isOpen && streetsModal.district && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Route className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-800 text-lg">
                    شوارع حي {streetsModal.district.name}
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                    إدارة وتعديل الشوارع والمحاور التابعة للحي
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setStreetsModal({ isOpen: false, district: null })
                }
                className="p-2 hover:bg-stone-200 rounded-lg text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFA]">
              {!streetsModal.district.streets ||
              streetsModal.district.streets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-stone-400">
                  <Route className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-bold">
                    لا توجد شوارع مسجلة في هذا الحي حتى الآن.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
                      <tr>
                        <th className="px-4 py-3">اسم الشارع</th>
                        <th className="px-4 py-3 text-center">النوع</th>
                        <th className="px-4 py-3 text-center">العرض</th>
                        <th className="px-4 py-3 text-center">كود الشارع</th>
                        <th className="px-4 py-3 text-center w-24">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {streetsModal.district.streets.map((st) => (
                        <tr
                          key={st.id}
                          className="hover:bg-orange-50/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-bold text-stone-800">
                            {st.name}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {st.type === "main" ? (
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] rounded font-bold border border-amber-200">
                                طريق محوري
                              </span>
                            ) : (
                              <span className="text-stone-500 text-xs">
                                شارع داخلي
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-stone-600">
                            {st.width}
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-[10px] text-stone-400">
                            {st.code}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() =>
                                  setEditStreetModal({
                                    isOpen: true,
                                    data: {
                                      id: st.id,
                                      name: st.name,
                                      width: st.width.replace("م", ""),
                                      type: st.type,
                                    },
                                  })
                                }
                                className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteStreet(st.id, st.name)
                                }
                                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= Modal: تعديل شارع (من داخل الحي) ================= */}
      {editStreetModal.isOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
              <h3 className="font-bold text-stone-800 flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600" /> تعديل بيانات الشارع
              </h3>
              <button
                onClick={() =>
                  setEditStreetModal({ ...editStreetModal, isOpen: false })
                }
                className="p-1 hover:bg-stone-200 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                streetUpdateMutation.mutate(editStreetModal.data);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1.5">
                  اسم الشارع
                </label>
                <input
                  type="text"
                  required
                  value={editStreetModal.data.name}
                  onChange={(e) =>
                    setEditStreetModal({
                      ...editStreetModal,
                      data: { ...editStreetModal.data, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1.5">
                    العرض (متر)
                  </label>
                  <input
                    type="number"
                    required
                    value={editStreetModal.data.width}
                    onChange={(e) =>
                      setEditStreetModal({
                        ...editStreetModal,
                        data: {
                          ...editStreetModal.data,
                          width: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1.5">
                    النوع
                  </label>
                  <select
                    value={editStreetModal.data.type}
                    onChange={(e) =>
                      setEditStreetModal({
                        ...editStreetModal,
                        data: { ...editStreetModal.data, type: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">داخلي</option>
                    <option value="main">طريق محوري</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setEditStreetModal({ ...editStreetModal, isOpen: false })
                  }
                  className="px-4 py-2 bg-stone-100 text-stone-700 font-bold rounded-lg flex-1"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={streetUpdateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg flex-1"
                >
                  {streetUpdateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "حفظ التعديلات"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Screen41_Districts;
