import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import { toast } from "sonner";
import {
  Landmark,
  ChevronLeft,
  Search,
  Clock,
  Shield,
  EyeOff,
  Rows4,
  Rows3,
  Copy,
  ChevronDown,
  Camera,
  BarChart3,
  MapPin,
  Building2,
  Layers,
  TrendingUp,
  PanelLeftClose,
  Route,
  GripVertical,
  ChevronRight,
  ExternalLink,
  Download,
  Printer,
  GitCompare,
  PenLine,
  Upload,
  Link2,
  QrCode,
  CircleCheck,
  CircleAlert,
  X,
  FileText,
  Users,
  Plus,
  Loader2,
  Edit,
  Map,
  Satellite,
  Globe,
  Image as ImageIcon,
  ShieldCheck,
  Lightbulb,
  ArrowUpDown,
  Paperclip,
  Eye,
  RefreshCw,
  ArrowUpRight,
  TrendingDown,
  TriangleAlert,
  PieChart,
  Home,
  History,
  FolderOpen,
  FileEdit,
  ClipboardList, // 👈 أيقونات التابات الـ 10
  LockOpen,
  Archive,
  Pin,
  Ruler,
  Navigation,
  CircleParking,
  HardDrive,
  Grid3X3,
  ArrowDownRight,
  User,
  Columns2,
  List,
  Trash2,
} from "lucide-react";

import { QRCodeSVG } from "qrcode.react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ==========================================

// 1. مصفوفة التابات العشرة (10 Tabs)

// ==========================================

const DETAIL_TABS = [
  { id: "overview", label: "نظرة عامة", icon: BarChart3 },

  { id: "stats", label: "الإحصائيات", icon: PieChart },

  { id: "transactions", label: "المعاملات", icon: FileText },

  { id: "properties", label: "الملكيات", icon: Home },

  { id: "clients", label: "العملاء", icon: Users },

  { id: "audit", label: "السجل والتدقيق", icon: History },

  { id: "streets", label: "الشوارع", icon: Route },

  { id: "media", label: "ملفات ووسائط", icon: FolderOpen },

  { id: "notes", label: "نبذة وملاحظات", icon: FileEdit },

  { id: "regulations", label: "الاشتراطات", icon: ClipboardList },
];

// ==========================================

// 📊 مكون فرعي: تاب "الإحصائيات" (Stats Tab)

// ==========================================

const StatsTab = () => {
  const [filters, setFilters] = useState({
    period: "30",

    sectorId: "all",

    transactionType: "all",
  });

  // جلب البيانات الحقيقية من الـ API

  const {
    data: statsData,

    isLoading,

    refetch,

    isRefetching,
  } = useQuery({
    queryKey: ["riyadh-stats", filters],

    queryFn: async () => {
      const response = await api.get("/riyadh-streets/dashboard-stats", {
        params: filters,
      });

      return response.data;
    },
  });

  const getHeatColor = (value) => {
    if (value > 80) return "bg-blue-600 text-white";

    if (value > 60) return "bg-blue-500 text-white";

    if (value > 40) return "bg-blue-400 text-white";

    if (value > 20) return "bg-blue-300 text-white";

    return "bg-blue-100 text-blue-900";
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-stone-50 m-2 rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />

        <p className="text-stone-500 font-bold text-sm">
          جاري تحليل البيانات...
        </p>
      </div>
    );
  }

  const { kpi, areaData, pieData, heatMapData } = statsData || {};

  return (
    <div
      className="flex-1 flex flex-col h-full bg-stone-50 overflow-hidden rounded-xl border border-stone-200 m-2 relative"
      dir="rtl"
    >
      {/* مؤشر تحديث خفي */}

      {isRefetching && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100 z-50">
          <div className="h-full bg-blue-600 animate-[progress_1s_ease-in-out_infinite]"></div>
        </div>
      )}

      {/* Header & Filters */}

      <div className="bg-white border-b border-stone-200 p-4 shrink-0 shadow-sm z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" /> مركز الإحصائيات
              والتحليلات
            </h2>

            <p className="text-stone-500 text-sm mt-1">
              نظرة شاملة على أداء تقسيمات الرياض والمعاملات البلدية
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-stone-500 bg-stone-100 px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" /> <span>محدث الآن</span>
            </div>

            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`}
              />{" "}
              تحديث
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" /> تصدير التقرير
            </button>
          </div>
        </div>

        {/* Global Filters */}

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-stone-100">
          <select
            value={filters.period}
            onChange={(e) =>
              setFilters((f) => ({ ...f, period: e.target.value }))
            }
            className="bg-stone-50 border border-stone-200 text-sm text-stone-700 rounded-lg px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">آخر 7 أيام</option>

            <option value="30">آخر 30 يوم</option>

            <option value="90">آخر 3 أشهر</option>

            <option value="365">السنة الحالية</option>
          </select>

          <select
            value={filters.sectorId}
            onChange={(e) =>
              setFilters((f) => ({ ...f, sectorId: e.target.value }))
            }
            className="bg-stone-50 border border-stone-200 text-sm text-stone-700 rounded-lg px-3 py-2 outline-none cursor-pointer min-w-[150px] focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">كل القطاعات</option>

            {/* يمكنك جلب أسماء القطاعات هنا ديناميكياً إذا أردت، أو تركها كمثال */}

            <option value="1">قطاع وسط الرياض</option>

            <option value="2">قطاع شمال الرياض</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar print:p-0">
        {/* Top KPI Cards (Real Data) */}

        {kpi && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="text-stone-500 text-sm font-medium">
                  إجمالي المعاملات
                </span>

                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
              </div>

              <div className="text-2xl font-bold text-stone-900">
                {kpi.totalTransactions.toLocaleString()}
              </div>

              <div className="flex items-center gap-1 text-xs mt-2 text-green-600">
                <ArrowUpRight className="w-3 h-3" />{" "}
                <span className="font-bold">{kpi.transactionsGrowth}%</span>{" "}
                <span className="text-stone-400">عن الشهر الماضي</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="text-stone-500 text-sm font-medium">
                  العملاء المسجلين
                </span>

                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="text-2xl font-bold text-stone-900">
                {kpi.totalClients.toLocaleString()}
              </div>

              <div className="flex items-center gap-1 text-xs mt-2 text-green-600">
                <ArrowUpRight className="w-3 h-3" />{" "}
                <span className="font-bold">{kpi.clientsGrowth}%</span>{" "}
                <span className="text-stone-400">عن الشهر الماضي</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="text-stone-500 text-sm font-medium">
                  الملكيات العقارية
                </span>

                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              <div className="text-2xl font-bold text-stone-900">
                {kpi.totalProperties.toLocaleString()}
              </div>

              <div className="flex items-center gap-1 text-xs mt-2 text-green-600">
                <ArrowUpRight className="w-3 h-3" />{" "}
                <span className="font-bold">{kpi.propertiesGrowth}%</span>{" "}
                <span className="text-stone-400">عن الشهر الماضي</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="text-stone-500 text-sm font-medium">
                  متوسط الإنجاز
                </span>

                <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="text-2xl font-bold text-stone-900">
                {kpi.avgCompletionTime}{" "}
                <span className="text-sm text-stone-500 font-normal">ساعة</span>
              </div>

              <div className="flex items-center gap-1 text-xs mt-2 text-green-600">
                <TrendingDown className="w-3 h-3" />{" "}
                <span className="font-bold">
                  {Math.abs(kpi.completionGrowth)}%
                </span>{" "}
                <span className="text-stone-400">أسرع من الماضي</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="text-stone-500 text-sm font-medium">
                  نسبة التعثر
                </span>

                <div className="p-2 rounded-lg bg-red-50 text-red-600">
                  <TriangleAlert className="w-5 h-5" />
                </div>
              </div>

              <div className="text-2xl font-bold text-stone-900">
                {kpi.rejectionRate}%
              </div>

              <div className="flex items-center gap-1 text-xs mt-2 text-red-600">
                <ArrowUpRight className="w-3 h-3" />{" "}
                <span className="font-bold">{kpi.rejectionGrowth}%</span>{" "}
                <span className="text-stone-400">ارتفاع طفيف</span>
              </div>
            </div>
          </div>
        )}

        {/* Charts Row */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-stone-800">تحليل حركة المعاملات</h3>

              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 text-xs text-stone-600">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div> جديدة
                </span>

                <span className="flex items-center gap-1.5 text-xs text-stone-600">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>{" "}
                  مكتملة
                </span>
              </div>
            </div>

            <div className="h-[300px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={areaData}
                  margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />

                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>

                    <linearGradient
                      id="colorCompleted"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />

                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    dy={10}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    dx={-10}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",

                      border: "none",

                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="new"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorNew)"
                    name="جديدة"
                  />

                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                    name="مكتملة"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col">
            <h3 className="font-bold text-stone-800 mb-4">
              توزيع أنواع العملاء
            </h3>

            <div className="flex-1 min-h-[250px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="none"
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",

                      border: "none",

                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />

                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Real Heatmap Table */}

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-stone-800">
              الكثافة التشغيلية (الخريطة الحرارية الحقيقية)
            </h3>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-right">
              <thead>
                <tr>
                  <th className="p-3 text-stone-500 font-bold border-b border-stone-100">
                    الحي
                  </th>

                  <th className="text-center p-3 text-stone-500 font-bold border-b border-stone-100">
                    تقييم
                  </th>

                  <th className="text-center p-3 text-stone-500 font-bold border-b border-stone-100">
                    فرز
                  </th>

                  <th className="text-center p-3 text-stone-500 font-bold border-b border-stone-100">
                    دمج
                  </th>

                  <th className="text-center p-3 text-stone-500 font-bold border-b border-stone-100">
                    إفراغ
                  </th>

                  <th className="text-center p-3 text-stone-500 font-bold border-b border-stone-100">
                    رخص
                  </th>

                  <th className="text-center p-3 text-stone-900 font-black border-b border-stone-100">
                    المجموع
                  </th>
                </tr>
              </thead>

              <tbody>
                {heatMapData?.map((row, i) => (
                  <tr key={i} className="hover:bg-stone-50 transition-colors">
                    <td className="p-3 font-bold text-stone-800 border-b border-stone-100 truncate max-w-[120px]">
                      {row.nbh}
                    </td>

                    <td className="p-2 border-b border-stone-100 text-center">
                      <div
                        className={`rounded py-1.5 px-2 text-xs font-bold ${getHeatColor(row.eval)}`}
                      >
                        {row.eval}
                      </div>
                    </td>

                    <td className="p-2 border-b border-stone-100 text-center">
                      <div
                        className={`rounded py-1.5 px-2 text-xs font-bold ${getHeatColor(row.split)}`}
                      >
                        {row.split}
                      </div>
                    </td>

                    <td className="p-2 border-b border-stone-100 text-center">
                      <div
                        className={`rounded py-1.5 px-2 text-xs font-bold ${getHeatColor(row.merge)}`}
                      >
                        {row.merge}
                      </div>
                    </td>

                    <td className="p-2 border-b border-stone-100 text-center">
                      <div
                        className={`rounded py-1.5 px-2 text-xs font-bold ${getHeatColor(row.transfer)}`}
                      >
                        {row.transfer}
                      </div>
                    </td>

                    <td className="p-2 border-b border-stone-100 text-center">
                      <div
                        className={`rounded py-1.5 px-2 text-xs font-bold ${getHeatColor(row.license)}`}
                      >
                        {row.license}
                      </div>
                    </td>

                    <td className="p-3 text-center font-black text-stone-900 border-b border-stone-100 bg-stone-50/50">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================

// 🗺️ تاب "المخططات" (Plans Tab)

// ==========================================

const PlansTab = () => {
  const queryClient = useQueryClient();

  const { data: plansData = [], isLoading } = useQuery({
    queryKey: ["riyadh-plans"],

    queryFn: async () => {
      const response = await api.get("/riyadh-streets/plans");

      return response.data;
    },
  });

  const [planModal, setPlanModal] = useState({
    isOpen: false,

    mode: "create",

    data: {
      id: null,

      planNumber: "",

      oldNumber: "",

      status: "معتمد",

      isWithout: false,

      properties: 0,

      plots: 0,
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/riyadh-streets/plans/${id}`),

    onSuccess: () => {
      toast.success("تم حذف المخطط");

      queryClient.invalidateQueries(["riyadh-plans"]);
    },
  });

  const handleDelete = (e, id) => {
    e.stopPropagation();

    if (window.confirm("حذف المخطط؟")) deleteMutation.mutate(id);
  };

  const planMutation = useMutation({
    mutationFn: async (payload) =>
      planModal.mode === "create"
        ? await api.post("/riyadh-streets/plans", payload)
        : await api.put(`/riyadh-streets/plans/${payload.id}`, payload),

    onSuccess: () => {
      toast.success("تم حفظ المخطط");

      queryClient.invalidateQueries(["riyadh-plans"]);

      setPlanModal({ ...planModal, isOpen: false });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    planMutation.mutate(planModal.data);
  };

  return (
    <div
      className="flex-1 overflow-hidden m-2 rounded-xl bg-white border border-black/5 shadow-sm flex flex-col"
      dir="rtl"
    >
      <div className="p-3 border-b border-stone-200 bg-white shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />

          <h2 className="text-[16px] text-stone-900 font-extrabold">
            مخططات الرياض
          </h2>

          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">
            {plansData.length} مخطط
          </span>
        </div>

        <button
          onClick={() =>
            setPlanModal({
              isOpen: true,

              mode: "create",

              data: {
                id: null,

                planNumber: "",

                oldNumber: "",

                status: "معتمد",

                isWithout: false,

                properties: 0,

                plots: 0,
              },
            })
          }
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700"
        >
          <Plus className="w-3.5 h-3.5" /> إضافة مخطط
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-[11px] text-right border border-stone-200">
            <thead className="bg-stone-800 text-white">
              <tr>
                <th className="py-2 px-3">رقم المخطط</th>

                <th className="py-2 px-3">الحالة</th>

                <th className="py-2 px-3">الملكيات</th>

                <th className="py-2 px-3">القطع</th>

                <th className="py-2 px-3">إجراءات</th>
              </tr>
            </thead>

            <tbody>
              {plansData.map((plan, idx) => (
                <tr
                  key={plan.id}
                  className="border-b border-stone-100 hover:bg-stone-50"
                >
                  <td className="py-2 px-3 font-bold">{plan.planNumber}</td>

                  <td className="py-2 px-3">{plan.status}</td>

                  <td className="py-2 px-3 text-blue-600 font-bold">
                    {plan.properties}
                  </td>

                  <td className="py-2 px-3 text-stone-600">{plan.plots}</td>

                  <td className="py-2 px-3 flex gap-1">
                    <button
                      onClick={() =>
                        setPlanModal({ isOpen: true, mode: "edit", data: plan })
                      }
                      className="p-1 text-stone-400 hover:text-blue-600"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(e, plan.id)}
                      className="p-1 text-stone-400 hover:text-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {planModal.isOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-stone-800 text-lg">المخطط</h3>

              <button
                onClick={() => setPlanModal({ ...planModal, isOpen: false })}
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <form
              id="planForm"
              onSubmit={handleSubmit}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1.5">
                  رقم المخطط المعتمد
                </label>

                <input
                  type="text"
                  required
                  value={planModal.data.planNumber}
                  onChange={(e) =>
                    setPlanModal({
                      ...planModal,

                      data: { ...planModal.data, planNumber: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1.5">
                  الحالة
                </label>

                <select
                  value={planModal.data.status}
                  onChange={(e) =>
                    setPlanModal({
                      ...planModal,

                      data: { ...planModal.data, status: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                >
                  <option value="معتمد">معتمد</option>

                  <option value="قيد المراجعة">قيد المراجعة</option>

                  <option value="مُعدَّل">مُعدَّل</option>

                  <option value="ملغى">ملغى</option>
                </select>
              </div>
            </form>

            <div className="p-4 border-t border-stone-100 flex gap-2">
              <button
                onClick={() => setPlanModal({ ...planModal, isOpen: false })}
                className="px-4 py-2 bg-stone-100 rounded-lg"
              >
                إلغاء
              </button>

              <button
                type="submit"
                form="planForm"
                disabled={planMutation.isPending}
                className="flex-1 bg-blue-600 text-white rounded-lg font-bold"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================

// 📊 تاب الإحصائيات السريعة للقطاع/الحي

// ==========================================

const NodeStatsTab = ({ selectedType, selectedNode }) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["node-details", selectedType, selectedNode?.id, "stats"],

    queryFn: async () =>
      (
        await api.get(
          `/riyadh-streets/details/${selectedType}/${selectedNode.id}/stats`,
        )
      ).data,

    enabled: !!selectedNode,
  });

  if (isLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  if (!stats) return null;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="grid gap-3 grid-cols-2">
        <div className="bg-white rounded-xl border border-stone-200/80 p-4 text-center shadow-sm">
          <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />

          <div className="text-[18px] font-black text-stone-800">
            {stats.avgTime} يوم
          </div>

          <div className="text-[11px] text-stone-500 font-bold mt-1">
            متوسط زمن الإنجاز
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/80 p-4 text-center shadow-sm">
          <Users className="w-6 h-6 text-purple-500 mx-auto mb-2" />

          <div className="text-[18px] font-black text-stone-800">
            {stats.clientReturnRate}%
          </div>

          <div className="text-[11px] text-stone-500 font-bold mt-1">
            معدل تكرار العملاء
          </div>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
        <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm">
          <h4 className="text-[13px] text-stone-700 mb-4 flex items-center gap-2 font-bold">
            <BarChart3 className="w-4 h-4 text-blue-500" /> توزيع المعاملات حسب
            الحالة
          </h4>

          <div className="space-y-3">
            {stats.statusDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-[11px] w-20 truncate text-stone-600 font-bold">
                  {item.status}
                </span>

                <div className="flex-1 h-5 bg-stone-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full transition-all duration-1000"
                    style={{
                      width: `${item.percent}%`,

                      backgroundColor: item.color,
                    }}
                  ></div>

                  <span className="absolute inset-0 flex items-center justify-center text-[10px] text-stone-800 mix-blend-multiply font-bold">
                    {item.percent}%
                  </span>
                </div>

                <span className="text-[11px] font-mono text-stone-500 w-8 text-left">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm">
          <h4 className="text-[13px] text-stone-700 mb-4 flex items-center gap-2 font-bold">
            <TrendingUp className="w-4 h-4 text-green-500" /> أكثر الأحياء
            تفاعلاً
          </h4>

          <div className="space-y-3">
            {stats.topDistricts.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-5 text-[10px] text-stone-400 text-center font-bold">
                  {idx + 1}
                </span>

                <span className="text-[11px] text-stone-600 w-24 truncate font-bold">
                  {item.name}
                </span>

                <div className="flex-1 h-3.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${item.percent}%`,

                      backgroundColor: "rgb(22, 163, 74)",
                    }}
                  ></div>
                </div>

                <span className="text-[11px] font-mono text-stone-500 w-8 text-left">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================

// 📄 تاب المعاملات (Transactions)

// ==========================================

const NodeTransactionsTab = ({ selectedType, selectedNode }) => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["node-details", selectedType, selectedNode?.id, "transactions"],

    queryFn: async () =>
      (
        await api.get(
          `/riyadh-streets/details/${selectedType}/${selectedNode.id}/transactions`,
        )
      ).data,

    enabled: !!selectedNode,
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case "مكتملة":
        return "bg-green-50 text-green-700";

      case "قيد المعالجة":
        return "bg-yellow-50 text-yellow-700";

      case "ملغاة":
        return "bg-red-50 text-red-700";

      case "جديدة":
        return "bg-blue-50 text-blue-700";

      default:
        return "bg-stone-50 text-stone-600";
    }
  };

  if (isLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] text-stone-700 font-bold flex items-center gap-1.5">
          <Columns2 className="w-4 h-4 text-stone-500" /> جدول المعاملات
        </h4>

        <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-1 rounded-md font-bold">
          {transactions?.length || 0} معاملة
        </span>
      </div>

      <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto custom-scrollbar-slim max-h-[450px]">
          <table className="w-full text-[11px] whitespace-nowrap text-right">
            <thead className="sticky top-0 z-20 bg-stone-800 text-white shadow-sm">
              <tr>
                <th className="py-2.5 px-3">#</th>

                <th className="py-2.5 px-3">التاريخ</th>

                <th className="py-2.5 px-3">رقم المعاملة</th>

                <th className="py-2.5 px-3">العميل</th>

                <th className="py-2.5 px-3">الخدمة</th>

                <th className="py-2.5 px-3">الحي</th>

                <th className="py-2.5 px-3">الشارع</th>

                <th className="py-2.5 px-3 text-center">الحالة</th>

                <th className="py-2.5 px-3">القيمة (ر.س)</th>

                <th className="py-2.5 px-3">المسؤول</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {transactions?.map((trx, idx) => (
                <tr
                  key={trx.id}
                  className="hover:bg-blue-50/50 transition-colors"
                >
                  <td className="py-2.5 px-3 text-stone-400 font-mono">
                    {idx + 1}
                  </td>

                  <td className="py-2.5 px-3 font-mono">{trx.date}</td>

                  <td className="py-2.5 px-3 font-mono text-blue-600 font-bold">
                    {trx.ref}
                  </td>

                  <td className="py-2.5 px-3 font-bold text-stone-800">
                    {trx.client}
                  </td>

                  <td className="py-2.5 px-3 text-stone-600">{trx.service}</td>

                  <td className="py-2.5 px-3 text-stone-600">{trx.district}</td>

                  <td className="py-2.5 px-3 text-stone-600">{trx.street}</td>

                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-bold ${getStatusStyle(trx.status)}`}
                    >
                      {trx.status}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 font-mono text-green-700 font-bold">
                    {trx.value}
                  </td>

                  <td className="py-2.5 px-3 text-stone-700">{trx.assignee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================

// 🏠 تاب الملكيات (Properties)

// ==========================================

const NodePropertiesTab = ({ selectedType, selectedNode }) => {
  const { data: properties, isLoading } = useQuery({
    queryKey: ["node-details", selectedType, selectedNode?.id, "properties"],

    queryFn: async () =>
      (
        await api.get(
          `/riyadh-streets/details/${selectedType}/${selectedNode.id}/properties`,
        )
      ).data,

    enabled: !!selectedNode,
  });

  if (isLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] text-stone-700 font-bold flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-emerald-500" /> سجل الملكيات
        </h4>

        <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-1 rounded-md font-bold">
          {properties?.length || 0} ملكية
        </span>
      </div>

      <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto custom-scrollbar-slim max-h-[450px]">
          <table className="w-full text-[11px] whitespace-nowrap text-right">
            <thead className="sticky top-0 z-20 bg-stone-800 text-white shadow-sm">
              <tr>
                <th className="py-2.5 px-3">#</th>

                <th className="py-2.5 px-3">رقم الصك</th>

                <th className="py-2.5 px-3">المالك</th>

                <th className="py-2.5 px-3">النوع</th>

                <th className="py-2.5 px-3">الحي</th>

                <th className="py-2.5 px-3">الشارع</th>

                <th className="py-2.5 px-3">المساحة (م²)</th>

                <th className="py-2.5 px-3 text-center">الحالة</th>

                <th className="py-2.5 px-3">آخر تحديث</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {properties?.map((prop, idx) => (
                <tr
                  key={prop.id}
                  className="hover:bg-emerald-50/50 transition-colors"
                >
                  <td className="py-2.5 px-3 text-stone-400 font-mono">
                    {idx + 1}
                  </td>

                  <td className="py-2.5 px-3 font-mono text-blue-600 font-bold">
                    {prop.deedNumber}
                  </td>

                  <td className="py-2.5 px-3 font-bold text-stone-800">
                    {prop.owner}
                  </td>

                  <td className="py-2.5 px-3 text-stone-600">{prop.type}</td>

                  <td className="py-2.5 px-3 text-stone-600">
                    {prop.district}
                  </td>

                  <td className="py-2.5 px-3 text-stone-600">{prop.street}</td>

                  <td className="py-2.5 px-3 font-mono font-bold text-stone-700">
                    {prop.area}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                      {prop.status}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 font-mono text-stone-500">
                    {prop.lastUpdate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================

// 👥 تاب العملاء (Clients)

// ==========================================

const NodeClientsTab = ({ selectedType, selectedNode }) => {
  const { data: clients, isLoading } = useQuery({
    queryKey: ["node-details", selectedType, selectedNode?.id, "clients"],

    queryFn: async () =>
      (
        await api.get(
          `/riyadh-streets/details/${selectedType}/${selectedNode.id}/clients`,
        )
      ).data,

    enabled: !!selectedNode,
  });

  if (isLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] text-stone-700 font-bold flex items-center gap-1.5">
          <Users className="w-4 h-4 text-purple-500" /> قاعدة العملاء
        </h4>

        <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-1 rounded-md font-bold">
          {clients?.length || 0} عميل
        </span>
      </div>

      <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto custom-scrollbar-slim max-h-[450px]">
          <table className="w-full text-[11px] whitespace-nowrap text-right">
            <thead className="sticky top-0 z-20 bg-stone-800 text-white shadow-sm">
              <tr>
                <th className="py-2.5 px-3">#</th>

                <th className="py-2.5 px-3">الاسم</th>

                <th className="py-2.5 px-3">كود العميل</th>

                <th className="py-2.5 px-3">الحي</th>

                <th className="py-2.5 px-3 text-center">المعاملات</th>

                <th className="py-2.5 px-3">آخر معاملة</th>

                <th className="py-2.5 px-3 text-center">المصدر</th>

                <th className="py-2.5 px-3">الهاتف</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {clients?.map((client, idx) => (
                <tr
                  key={client.id}
                  className="hover:bg-purple-50/50 transition-colors"
                >
                  <td className="py-2.5 px-3 text-stone-400 font-mono">
                    {idx + 1}
                  </td>

                  <td className="py-2.5 px-3 font-bold text-stone-800">
                    {client.name}
                  </td>

                  <td className="py-2.5 px-3 font-mono text-blue-600 font-bold">
                    {client.code}
                  </td>

                  <td className="py-2.5 px-3 text-stone-600">
                    {client.district}
                  </td>

                  <td className="py-2.5 px-3 text-center font-bold text-blue-600">
                    {client.txCount}
                  </td>

                  <td className="py-2.5 px-3 font-mono text-stone-600">
                    {client.lastTxDate}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[9px] font-bold">
                      {client.source}
                    </span>
                  </td>

                  <td
                    className="py-2.5 px-3 font-mono text-stone-500"
                    dir="ltr"
                  >
                    {client.phone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🛣️ تاب الشوارع (Streets)
// ==========================================
// 💡 أضفنا setStreetModal كـ prop لنتمكن من فتح نافذة الإضافة/التعديل من هنا
const NodeStreetsTab = ({ selectedType, selectedNode, setStreetModal }) => {
  const queryClient = useQueryClient();

  // 1. جلب الشوارع
  const { data: streets, isLoading } = useQuery({
    queryKey: ["node-details", selectedType, selectedNode?.id, "streets"],
    queryFn: async () =>
      (
        await api.get(
          `/riyadh-streets/details/${selectedType}/${selectedNode.id}/streets`,
        )
      ).data,
    enabled: !!selectedNode,
  });

  // 2. دالة حذف الشارع (حقيقية)
  const deleteMutation = useMutation({
    // تأكد أن المسار يطابق مسار الحذف في الباك إند لديك
    mutationFn: async (id) => await api.delete(`/riyadh-streets/${id}`),
    onSuccess: () => {
      toast.success("تم حذف الشارع بنجاح");
      // تحديث الجدول والشجرة فوراً بعد الحذف
      queryClient.invalidateQueries([
        "node-details",
        selectedType,
        selectedNode?.id,
        "streets",
      ]);
      queryClient.invalidateQueries(["riyadh-tree"]);
    },
    onError: () => toast.error("حدث خطأ أثناء محاولة حذف الشارع"),
  });

  const handleDeleteStreet = (id, name) => {
    if (
      window.confirm(`هل أنت متأكد من رغبتك في حذف الشارع (${name}) نهائياً؟`)
    ) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {/* الهيدر مع زر الإضافة */}
      <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
        <div className="flex items-center gap-3">
          <h4 className="text-[13px] text-stone-700 font-bold flex items-center gap-1.5">
            <Route className="w-4 h-4 text-orange-500" /> قائمة الشوارع الموثقة
          </h4>
          <span className="text-[10px] text-stone-400 bg-white px-2 py-1 rounded-md font-bold border border-stone-200">
            {streets?.length || 0} شارع
          </span>
        </div>

        {/* 👈 زر إضافة شارع جديد */}
        <button
          onClick={() => {
            // نحدد هل نحن نضيف الشارع للقطاع أم لحي مباشر
            const sectorId =
              selectedType === "sector"
                ? selectedNode.id
                : selectedNode.sectorId;
            const districtId =
              selectedType === "neighborhood" ? selectedNode.id : null;

            setStreetModal({
              isOpen: true,
              mode: "create", // وضع الإنشاء
              sectorId,
              districtId,
              data: {
                name: "",
                width: "",
                length: "",
                lanes: "2",
                type: "normal",
                lighting: true,
                sidewalks: true,
              },
            });
          }}
          className="px-3 py-1.5 text-[11px] bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1.5 font-bold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> إضافة شارع
        </button>
      </div>

      {/* جدول الشوارع */}
      <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto custom-scrollbar-slim max-h-[450px]">
          <table className="w-full text-[11px] whitespace-nowrap text-right">
            <thead className="sticky top-0 z-20 bg-stone-800 text-white shadow-sm">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">اسم الشارع</th>
                <th className="py-2.5 px-3 text-center">النوع</th>
                <th className="py-2.5 px-3 text-center">العرض</th>
                <th className="py-2.5 px-3 text-center">الطول</th>
                <th className="py-2.5 px-3 text-center">
                  حالة الإنارة/الأرصفة
                </th>
                <th className="py-2.5 px-3 text-center w-24">إجراءات</th>{" "}
                {/* 👈 عمود الإجراءات */}
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {streets?.length > 0 ? (
                streets.map((st, idx) => (
                  <tr
                    key={st.id}
                    className="hover:bg-orange-50/50 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-stone-400 font-mono text-center">
                      {idx + 1}
                    </td>

                    <td className="py-2.5 px-3 font-bold text-stone-800">
                      <div className="flex items-center gap-1.5">
                        <Route className="w-3.5 h-3.5 text-stone-400" />{" "}
                        {st.name}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {st.type === "main" ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] rounded font-bold border border-amber-200">
                          طريق محوري
                        </span>
                      ) : (
                        <span className="text-stone-500 text-[10px] bg-stone-100 px-2 py-1 rounded border border-stone-200">
                          شارع داخلي
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-600">
                      {st.width} م
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono text-stone-600">
                      {st.length || "--"} م
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {st.lighting ? (
                          <Lightbulb
                            className="w-3.5 h-3.5 text-yellow-500"
                            title="يوجد إنارة"
                          />
                        ) : (
                          <Lightbulb className="w-3.5 h-3.5 text-stone-300" />
                        )}

                        {st.sidewalks ? (
                          <Layers
                            className="w-3.5 h-3.5 text-emerald-500"
                            title="يوجد أرصفة"
                          />
                        ) : (
                          <Layers className="w-3.5 h-3.5 text-stone-300" />
                        )}
                      </div>
                    </td>

                    {/* 👈 أزرار التعديل والحذف */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setStreetModal({
                              isOpen: true,
                              mode: "edit", // وضع التعديل
                              sectorId: st.sectorId,
                              districtId: st.districtId,
                              data: {
                                id: st.id,
                                name: st.name,
                                width: st.width,
                                length: st.length || "",
                                lanes: st.lanes || "2",
                                type: st.type,
                                lighting: st.lighting,
                                sidewalks: st.sidewalks,
                              },
                            });
                          }}
                          className="p-1.5 rounded-md text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="تعديل الشارع"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStreet(st.id, st.name)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="حذف الشارع"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-8 text-stone-400 font-bold bg-stone-50/50"
                  >
                    لا توجد شوارع مرتبطة بهذا النطاق
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================

// 📂 تاب ملفات ووسائط (Media) - حقيقي

// ==========================================

const NodeMediaTab = ({ selectedType, selectedNode }) => {
  const queryClient = useQueryClient();

  const fileInputRef = useRef(null);

  const { data: mediaFiles, isLoading } = useQuery({
    queryKey: ["node-details", selectedType, selectedNode?.id, "media"],

    queryFn: async () =>
      (
        await api.get(
          `/riyadh-streets/details/${selectedType}/${selectedNode.id}/media`,
        )
      ).data,

    enabled: !!selectedNode,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();

      formData.append("files", file);

      if (selectedType === "sector")
        formData.append("sectorId", selectedNode.id);

      if (selectedType === "neighborhood")
        formData.append("districtId", selectedNode.id);

      return await api.post("/riyadh-streets/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }); // تأكد من أن مسار الرفع لديك يدعم المرفقات العامة
    },

    onSuccess: () => {
      toast.success("تم رفع الملف بنجاح");

      queryClient.invalidateQueries([
        "node-details",

        selectedType,

        selectedNode?.id,

        "media",
      ]);
    },

    onError: () => toast.error("فشل رفع الملف"),
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (file) uploadMutation.mutate(file);
  };

  if (isLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-200 shadow-sm">
        <h4 className="text-[13px] font-bold text-stone-800 flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-blue-500" /> ملفات ووسائط النطاق
        </h4>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="px-4 py-2 text-[11px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 font-bold shadow-sm"
        >
          {uploadMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          رفع ملف جديد
        </button>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaFiles?.map((file, idx) => (
          <div
            key={file.id}
            className="p-3 bg-white border border-stone-200 rounded-xl flex items-center gap-3 hover:border-blue-300 transition-colors"
          >
            <div
              className={`p-3 rounded-lg ${file.type === "PDF" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}
            >
              {file.type === "PDF" ? (
                <FileText className="w-6 h-6" />
              ) : (
                <ImageIcon className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h5 className="text-[11px] font-bold text-stone-800 truncate mb-1">
                {file.name}
              </h5>

              <div className="text-[9px] text-stone-500 font-mono">
                {file.size} MB • {file.date}
              </div>
            </div>

            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-stone-50 text-stone-500 rounded-lg hover:bg-stone-200"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        ))}

        {(!mediaFiles || mediaFiles.length === 0) && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-stone-200 rounded-xl bg-stone-50">
            <FolderOpen className="w-10 h-10 text-stone-300 mx-auto mb-2" />

            <p className="text-sm font-bold text-stone-500">
              لا توجد ملفات مرفوعة
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================

// 📝 تاب نبذة وملاحظات (Notes) - حقيقي

// ==========================================

const NodeNotesTab = ({ selectedType, selectedNode }) => {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newNote, setNewNote] = useState({
    title: "",

    content: "",

    status: "نشطة",
  });

  const { data: notes, isLoading } = useQuery({
    queryKey: ["node-details", selectedType, selectedNode?.id, "notes"],

    queryFn: async () =>
      (
        await api.get(
          `/riyadh-streets/details/${selectedType}/${selectedNode.id}/notes`,
        )
      ).data,

    enabled: !!selectedNode,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (payload) =>
      await api.post(
        `/riyadh-streets/details/${selectedType}/${selectedNode.id}/notes`,

        payload,
      ),

    onSuccess: () => {
      toast.success("تمت إضافة الملاحظة");

      queryClient.invalidateQueries([
        "node-details",

        selectedType,

        selectedNode?.id,

        "notes",
      ]);

      setIsModalOpen(false);

      setNewNote({ title: "", content: "", status: "نشطة" });
    },
  });

  if (isLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
        <h4 className="text-[13px] font-bold text-stone-800 flex items-center gap-2">
          <FileEdit className="w-4 h-4 text-amber-500" /> سجل الملاحظات والنبذات
        </h4>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-[11px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 font-bold shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> إضافة ملاحظة
        </button>
      </div>

      <div className="space-y-3">
        {notes?.map((note) => (
          <div
            key={note.id}
            className="rounded-xl border border-stone-200 bg-white p-4 transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-2">
              <h5 className="text-[13px] font-bold text-stone-800">
                {note.title}
              </h5>

              <span
                className={`px-2 py-0.5 rounded text-[9px] font-bold ${note.status === "نشطة" ? "bg-green-100 text-green-700" : "bg-stone-200 text-stone-600"}`}
              >
                {note.status}
              </span>
            </div>

            <p className="text-[11px] text-stone-600 mb-3 whitespace-pre-line leading-relaxed">
              {note.content}
            </p>

            <div className="text-[9px] text-stone-400 font-mono border-t border-stone-100 pt-2">
              {new Date(note.createdAt).toLocaleString("ar-SA")}
            </div>
          </div>
        ))}

        {(!notes || notes.length === 0) && (
          <div className="p-12 text-center bg-white rounded-xl border border-stone-200 border-dashed">
            <FileEdit className="w-10 h-10 text-stone-300 mx-auto mb-2" />

            <p className="text-sm font-bold text-stone-500">
              لا توجد ملاحظات مسجلة
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5">
            <h3 className="font-bold text-stone-800 mb-4">
              إضافة ملاحظة جديدة
            </h3>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="عنوان الملاحظة"
                value={newNote.title}
                onChange={(e) =>
                  setNewNote({ ...newNote, title: e.target.value })
                }
                className="w-full p-2 border border-stone-300 rounded-lg text-sm outline-none focus:border-blue-500"
              />

              <textarea
                placeholder="التفاصيل..."
                value={newNote.content}
                onChange={(e) =>
                  setNewNote({ ...newNote, content: e.target.value })
                }
                className="w-full h-24 p-2 border border-stone-300 rounded-lg text-sm outline-none focus:border-blue-500 resize-none"
              ></textarea>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-stone-100 rounded-lg text-xs font-bold text-stone-700 flex-1"
              >
                إلغاء
              </button>

              <button
                onClick={() => addNoteMutation.mutate(newNote)}
                disabled={!newNote.title || addNoteMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex-1 disabled:opacity-50"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================

// 📋 تاب الاشتراطات (Regulations) - حقيقي

// ==========================================

const NodeRegulationsTab = ({ selectedType, selectedNode }) => {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newReg, setNewReg] = useState({
    type: "ارتفاعات",

    text: "",

    appliesTo: "حي",

    status: "فعال",

    reference: "",
  });

  const { data: regulations, isLoading } = useQuery({
    queryKey: ["node-details", selectedType, selectedNode?.id, "regulations"],

    queryFn: async () =>
      (
        await api.get(
          `/riyadh-streets/details/${selectedType}/${selectedNode.id}/regulations`,
        )
      ).data,

    enabled: !!selectedNode,
  });

  const addRegMutation = useMutation({
    mutationFn: async (payload) =>
      await api.post(
        `/riyadh-streets/details/${selectedType}/${selectedNode.id}/regulations`,

        payload,
      ),

    onSuccess: () => {
      toast.success("تم إضافة الاشتراط");

      queryClient.invalidateQueries([
        "node-details",

        selectedType,

        selectedNode?.id,

        "regulations",
      ]);

      setIsModalOpen(false);

      setNewReg({
        type: "ارتفاعات",

        text: "",

        appliesTo: "حي",

        status: "فعال",

        reference: "",
      });
    },
  });

  if (isLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="flex justify-between items-center p-3 border-b border-stone-200 bg-stone-50">
          <h4 className="font-bold text-stone-800 text-[13px] flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-red-500" /> سجل الاشتراطات
            الفعالة
          </h4>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 text-[11px] bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 flex items-center gap-1.5 font-bold"
          >
            <Plus className="w-3 h-3" /> إضافة اشتراط
          </button>
        </div>

        <div className="overflow-x-auto max-h-[450px] custom-scrollbar-slim">
          <table className="w-full text-[11px] text-right whitespace-nowrap">
            <thead className="sticky top-0 bg-stone-800 text-white z-10">
              <tr>
                <th className="py-2.5 px-3">نوع الاشتراط</th>

                <th className="py-2.5 px-3">النص</th>

                <th className="py-2.5 px-3 text-center">المرجع</th>

                <th className="py-2.5 px-3 text-center">الحالة</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {regulations?.map((reg) => (
                <tr
                  key={reg.id}
                  className="hover:bg-red-50/30 transition-colors"
                >
                  <td className="py-2.5 px-3 font-bold text-red-700">
                    {reg.type}
                  </td>

                  <td className="py-2.5 px-3 font-bold text-stone-800 max-w-xs truncate">
                    {reg.text}
                  </td>

                  <td className="py-2.5 px-3 text-center font-mono text-stone-500">
                    {reg.reference}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${reg.status === "فعال" ? "bg-green-100 text-green-700" : "bg-stone-200 text-stone-600"}`}
                    >
                      {reg.status}
                    </span>
                  </td>
                </tr>
              ))}

              {(!regulations || regulations.length === 0) && (
                <tr>
                  <td
                    colSpan="4"
                    className="py-8 text-center text-stone-400 font-bold"
                  >
                    لا توجد اشتراطات تنظيمية مسجلة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 border-t-4 border-t-red-500">
            <h3 className="font-bold text-stone-800 mb-4">
              إضافة اشتراط تنظيمي
            </h3>

            <div className="space-y-3">
              <select
                value={newReg.type}
                onChange={(e) => setNewReg({ ...newReg, type: e.target.value })}
                className="w-full p-2 border border-stone-300 rounded-lg text-sm outline-none"
              >
                <option>ارتفاعات</option>

                <option>ارتدادات</option>

                <option>مواقف</option>

                <option>استخدام أرض</option>
              </select>

              <textarea
                placeholder="نص الاشتراط (مثال: الحد الأقصى للارتفاع 12م)"
                value={newReg.text}
                onChange={(e) => setNewReg({ ...newReg, text: e.target.value })}
                className="w-full h-20 p-2 border border-stone-300 rounded-lg text-sm outline-none resize-none"
              ></textarea>

              <input
                type="text"
                placeholder="رقم المرجع / التعميم"
                value={newReg.reference}
                onChange={(e) =>
                  setNewReg({ ...newReg, reference: e.target.value })
                }
                className="w-full p-2 border border-stone-300 rounded-lg text-sm outline-none"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-stone-100 rounded-lg text-xs font-bold text-stone-700 flex-1"
              >
                إلغاء
              </button>

              <button
                onClick={() => addRegMutation.mutate(newReg)}
                disabled={!newReg.text || addRegMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold flex-1 disabled:opacity-50"
              >
                اعتماد الاشتراط
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================

// 🛡️ تاب السجل والتدقيق (Audit) - حقيقي

// ==========================================

const NodeAuditTab = ({ selectedType, selectedNode }) => {
  const { data: audits, isLoading } = useQuery({
    queryKey: ["node-details", selectedType, selectedNode?.id, "audit"],

    queryFn: async () =>
      (
        await api.get(
          `/riyadh-streets/details/${selectedType}/${selectedNode.id}/audit`,
        )
      ).data,

    enabled: !!selectedNode,
  });

  if (isLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="space-y-4 animate-in fade-in duration-300 max-w-4xl mx-auto">
      <h4 className="text-[14px] text-stone-800 font-black flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-amber-500" /> سجل العمليات (Audit
        Trail)
      </h4>

      <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
        {audits?.map((log) => (
          <div
            key={log.id}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <History className="w-4 h-4" />
            </div>

            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="font-bold text-slate-800 text-[12px]">
                  {log.user}
                </div>

                <div className="font-mono text-slate-400 text-[9px]">
                  {log.date}
                </div>
              </div>

              <div className="text-[11px] text-slate-600 mt-1">
                <span className="font-bold text-blue-600">{log.action}</span>:{" "}
                {log.newValue}
              </div>
            </div>
          </div>
        ))}

        {(!audits || audits.length === 0) && (
          <div className="text-center py-10 text-stone-400 font-bold z-10 relative bg-[#FAFAFA]">
            لا يوجد سجل تاريخي حتى الآن
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================

// 🚀 الشاشة الرئيسية

// ==========================================

const RiyadhDivisionScreen = () => {
  const queryClient = useQueryClient();

  const { data: treeData = [], isLoading } = useQuery({
    queryKey: ["riyadh-tree"],

    queryFn: async () => {
      const response = await api.get("/riyadh-streets/tree");

      return response.data;
    },
  });

  const [activeMainTab, setActiveMainTab] = useState("division"); // 'division' | 'plans' | 'stats'

  // 👈 حالة التاب الفعال في لوحة التفاصيل (اليسار)

  const [activeDetailTab, setActiveDetailTab] = useState("overview");

  const [viewMode, setViewMode] = useState("compact");

  const [expandedSectors, setExpandedSectors] = useState([]);

  const [expandedNeighborhoods, setExpandedNeighborhoods] = useState([]);

  const [selectedType, setSelectedType] = useState(null); // 'sector' | 'neighborhood'

  const [selectedNode, setSelectedNode] = useState(null);

  const [selectedSector, setSelectedSector] = useState(null);

  const [sidebarWidth, setSidebarWidth] = useState(380);

  const [editingField, setEditingField] = useState(null); // 'link' | 'map' | 'satellite' | null

  const [tempValue, setTempValue] = useState("");

  const [isEditingLink, setIsEditingLink] = useState(false);

  const [tempLink, setTempLink] = useState("");

  const [sectorModal, setSectorModal] = useState({
    isOpen: false,

    mode: "create",

    data: {
      id: null,

      name: "",

      code: "",

      officialLink: "",

      mapImage: "",

      satelliteImage: "",
    },
  });

  const [districtModal, setDistrictModal] = useState({
    isOpen: false,

    mode: "create",

    sectorId: null,

    data: {
      id: null,

      name: "",

      code: "",

      officialLink: "",

      mapImage: "",

      satelliteImage: "",
    },
  });

  const [streetModal, setStreetModal] = useState({
    isOpen: false,

    sectorId: null,

    districtId: null,

    data: {
      name: "",

      width: "",

      length: "",

      lanes: "2",

      type: "normal",

      lighting: true,

      sidewalks: true,
    },
  });

  useEffect(() => {
    if (treeData.length > 0 && !selectedSector) {
      setExpandedSectors([treeData[0].id]);

      setSelectedSector(treeData[0]);

      setSelectedNode(treeData[0]);

      setSelectedType("sector");
    }
  }, [treeData, selectedSector]);

  useEffect(() => {
    if (selectedNode) {
      setTempLink(selectedNode.officialLink || "");

      setIsEditingLink(false);
    }
  }, [selectedNode]);

  const toggleSector = (e, sector) => {
    e.stopPropagation();

    setExpandedSectors((prev) =>
      prev.includes(sector.id)
        ? prev.filter((id) => id !== sector.id)
        : [...prev, sector.id],
    );
  };

  const selectSector = (sector) => {
    setSelectedSector(sector);

    setSelectedNode(sector);

    setSelectedType("sector");

    setActiveDetailTab("overview"); // تصفير التاب عند تغيير العنصر
  };

  const toggleNeighborhood = (e, nbhId) => {
    e.stopPropagation();

    setExpandedNeighborhoods((prev) =>
      prev.includes(nbhId)
        ? prev.filter((id) => id !== nbhId)
        : [...prev, nbhId],
    );
  };

  const selectNeighborhood = (sector, nbh) => {
    setSelectedSector(sector);

    setSelectedNode(nbh);

    setSelectedType("neighborhood");

    setActiveDetailTab("overview"); // تصفير التاب عند تغيير العنصر
  };

  const copyToClipboard = (text) => {
    if (!text) return;

    navigator.clipboard.writeText(text);

    toast.success(`تم نسخ: ${text}`);
  };

  // 👈 رفع الصور (محلياً للعرض وتحديثها للباك إند)

  const handleModalImageUpload = (e, modalType, fieldName) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      if (modalType === "sector") {
        setSectorModal((prev) => ({
          ...prev,

          data: { ...prev.data, [fieldName]: reader.result },
        }));
      } else {
        setDistrictModal((prev) => ({
          ...prev,

          data: { ...prev.data, [fieldName]: reader.result },
        }));
      }
    };

    reader.readAsDataURL(file);
  };

  const quickUpdateMutation = useMutation({
    mutationFn: async ({ id, type, data }) => {
      const endpoint =
        type === "sector"
          ? `/riyadh-streets/sectors/${id}`
          : `/riyadh-streets/districts/${id}`;

      return await api.put(endpoint, data);
    },

    onSuccess: (updatedData, variables) => {
      toast.success("تم الحفظ بنجاح");

      queryClient.invalidateQueries(["riyadh-tree"]);

      setEditingField(null);

      setSelectedNode((prev) => ({ ...prev, ...variables.data }));
    },
  });

  const handleSaveInline = (field) => {
    if (!selectedNode) return;

    quickUpdateMutation.mutate({
      id: selectedNode.id,

      type: selectedType,

      data: { [field]: tempValue },
    });
  };

  const openInlineEditor = (field, currentValue) => {
    setTempValue(currentValue || "");

    setEditingField(field);
  };

  const sectorMutation = useMutation({
    mutationFn: async (payload) =>
      sectorModal.mode === "create"
        ? await api.post("/riyadh-streets/sectors", payload)
        : await api.put(`/riyadh-streets/sectors/${payload.id}`, payload),

    onSuccess: () => {
      toast.success("تم حفظ القطاع");

      queryClient.invalidateQueries(["riyadh-tree"]);

      setSectorModal({ ...sectorModal, isOpen: false });
    },
  });

  const districtMutation = useMutation({
    mutationFn: async (payload) =>
      districtModal.mode === "create"
        ? await api.post("/riyadh-streets/districts", {
            ...payload,

            sectorId: districtModal.sectorId,
          })
        : await api.put(`/riyadh-streets/districts/${payload.id}`, payload),

    onSuccess: () => {
      toast.success("تم حفظ الحي");

      queryClient.invalidateQueries(["riyadh-tree"]);

      setDistrictModal({ ...districtModal, isOpen: false });
    },
  });

  const streetMutation = useMutation({
    mutationFn: async (payload) =>
      await api.post("/riyadh-streets/quick-street", {
        ...payload,

        sectorId: streetModal.sectorId,

        districtId: streetModal.districtId,
      }),

    onSuccess: () => {
      toast.success("تم إضافة الشارع");

      queryClient.invalidateQueries(["riyadh-tree"]);

      setStreetModal({ ...streetModal, isOpen: false });
    },
  });

  const handleSaveLink = () => {
    if (selectedType === "sector")
      sectorMutation.mutate({ id: selectedNode.id, officialLink: tempLink });
    else
      districtMutation.mutate({ id: selectedNode.id, officialLink: tempLink });

    setIsEditingLink(false);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg");

    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);

    const canvas = document.createElement("canvas");

    const ctx = canvas.getContext("2d");

    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 40;

      canvas.height = img.height + 40;

      ctx.fillStyle = "white";

      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 20, 20);

      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");

      downloadLink.download = `QR_${selectedNode.name}.png`;

      downloadLink.href = `${pngFile}`;

      downloadLink.click();

      toast.success("تم تحميل رمز الاستجابة السريعة بنجاح");
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#F6F7F9]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />

        <p className="text-stone-500 font-bold">
          جاري تحميل خريطة تقسيم الرياض...
        </p>
      </div>
    );
  }

  // تصميم عرض كروت الصور في وضع التعديل السريع (Inline Editing)

  const renderImageCard = (title, icon, dbField, placeholderText) => {
    const Icon = icon;

    const isEditing = editingField === dbField;

    const hasImage = !!selectedNode[dbField];

    return (
      <div className="bg-white rounded-xl border border-stone-200/80 p-3 flex-1 min-w-[250px] shadow-sm flex flex-col transition-all hover:border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-blue-700">
            <Icon className="w-4 h-4" />{" "}
            <span className="text-[12px] font-bold">{title}</span>
          </div>

          {!isEditing && (
            <button
              onClick={() => openInlineEditor(dbField, selectedNode[dbField])}
              className="text-[10px] font-bold text-stone-500 hover:text-blue-600 flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-md transition-colors"
            >
              <PenLine className="w-3 h-3" />{" "}
              {hasImage ? "تغيير الصورة" : "إضافة صورة"}
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-2 flex-1 justify-center bg-blue-50/50 p-2 rounded-lg border border-blue-100">
            <input
              type="url"
              dir="ltr"
              placeholder="أدخل رابط الصورة (URL) هنا..."
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full px-3 py-2 text-[11px] font-mono text-left border border-blue-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex gap-2">
              <button
                onClick={() => handleSaveInline(dbField)}
                disabled={quickUpdateMutation.isPending}
                className="flex-1 bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1 hover:bg-blue-700"
              >
                {quickUpdateMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <CircleCheck className="w-3 h-3" /> حفظ
                  </>
                )}
              </button>

              <button
                onClick={() => setEditingField(null)}
                className="flex-1 bg-white border border-stone-300 text-stone-600 text-[10px] font-bold py-1.5 rounded hover:bg-stone-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <div className="h-32 bg-stone-50 rounded-lg border border-dashed border-stone-300 flex items-center justify-center relative overflow-hidden group">
            {hasImage ? (
              <>
                <img
                  src={selectedNode[dbField]}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";

                    e.target.nextSibling.style.display = "flex";
                  }}
                />

                <div className="hidden absolute inset-0 bg-red-50 flex-col items-center justify-center gap-2 text-red-400">
                  <CircleAlert className="w-6 h-6" />

                  <span className="text-[9px] font-bold">الرابط معطوب</span>
                </div>

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a
                    href={selectedNode[dbField]}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white rounded-lg text-blue-600 hover:bg-blue-50"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-stone-50 to-stone-100 flex flex-col items-center justify-center gap-2 text-stone-400">
                <ImageIcon className="w-6 h-6 opacity-30" />

                <span className="text-[10px] font-bold text-stone-500">
                  {placeholderText}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="h-full flex flex-col overflow-hidden bg-[#F6F7F9] font-sans text-right"
      dir="rtl"
    >
      {/* ================= الواجهة الرئيسية (تختفي عند الطباعة) ================= */}

      <div className="print:hidden h-full flex flex-col">
        {/* Header Area */}

        <div className="shrink-0 bg-white/90 backdrop-blur-md border-b border-black/5 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-sm">
                <Map className="w-4 h-4 text-white" />
              </div>

              <div>
                <h1 className="text-[14px] font-black text-stone-900 leading-tight">
                  المنظومة الجغرافية والتقسيم البلدي
                </h1>

                <p className="text-[10px] text-stone-500 font-medium">
                  إدارة قطاعات وأحياء وشوارع مدينة الرياض
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 🎯 شريط التابات العلوية الرئيسي 🎯 */}

        <div className="shrink-0 flex items-center gap-3 px-2 py-1.5 border-b border-black/5">
          <div className="flex-1 max-w-[340px]">
            <div className="relative w-full bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-[1.5px] border-rose-500/20 rounded-xl p-[3px]">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm cursor-text">
                <div className="w-7 h-7 rounded-md bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>

                <input
                  type="text"
                  placeholder="البحث السريع..."
                  className="flex-1 bg-transparent border-none outline-none text-[13px] text-stone-700 font-medium placeholder:text-stone-400"
                />
              </div>
            </div>
          </div>

          <div className="w-1 h-1 rounded-full bg-stone-300 shrink-0" />

          <div className="flex items-center bg-stone-100/60 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setActiveMainTab("division")}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-md transition-all font-bold ${activeMainTab === "division" ? "bg-white text-blue-700 shadow-sm" : "text-stone-500 hover:bg-white/50 hover:text-stone-700"}`}
            >
              <Building2 className="w-3.5 h-3.5" /> التقسيم البلدي
              {activeMainTab === "division" && (
                <span className="absolute bottom-0 inset-x-2 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveMainTab("plans")}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-md transition-all font-bold ${activeMainTab === "plans" ? "bg-white text-blue-700 shadow-sm" : "text-stone-500 hover:bg-white/50 hover:text-stone-700"}`}
            >
              <Layers className="w-3.5 h-3.5" /> مخططات الرياض
              {activeMainTab === "plans" && (
                <span className="absolute bottom-0 inset-x-2 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveMainTab("stats")}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-md transition-all font-bold ${activeMainTab === "stats" ? "bg-white text-blue-700 shadow-sm" : "text-stone-500 hover:bg-white/50 hover:text-stone-700"}`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> الإحصائيات الشاملة
              {activeMainTab === "stats" && (
                <span className="absolute bottom-0 inset-x-2 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* ================= التحكم في العرض بناءً على التاب ================= */}

        {activeMainTab === "division" && (
          <div className="flex-1 flex overflow-hidden px-3 pb-3 gap-3 mt-3">
            {/* === Right Sidebar (Tree View) === */}

            <div
              className="flex shrink-0 relative"
              style={{ width: sidebarWidth }}
            >
              <div className="bg-white flex flex-col overflow-hidden h-full flex-1 border border-stone-200/80 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between p-4 border-b border-stone-100 bg-stone-50/50 shrink-0">
                  <span className="text-[12px] text-stone-800 font-extrabold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" /> الهيكل الجغرافي
                  </span>

                  <button
                    onClick={() =>
                      setSectorModal({
                        isOpen: true,

                        mode: "create",

                        data: {
                          id: null,

                          name: "",

                          code: "",

                          officialLink: "",

                          mapImage: "",

                          satelliteImage: "",
                        },
                      })
                    }
                    className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-[10px] font-bold hover:bg-stone-800 shadow-sm"
                  >
                    <Plus className="w-3 h-3" /> قطاع
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                  <div className="space-y-3">
                    {treeData.map((sector) => {
                      const isSectorExpanded = expandedSectors.includes(
                        sector.id,
                      );

                      const isSectorSelected =
                        selectedType === "sector" &&
                        selectedNode?.id === sector.id;

                      return (
                        <div key={sector.id} className="relative">
                          <div
                            className="absolute top-0 bottom-0 right-0 w-[3px] rounded-r-lg opacity-50"
                            style={{ backgroundColor: sector.color || "#ccc" }}
                          />

                          <div
                            className={`flex items-start gap-2 p-2 rounded-xl transition-all cursor-pointer border ${isSectorSelected ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-stone-100 hover:border-stone-300 hover:bg-stone-50"}`}
                            onClick={() => selectSector(sector)}
                          >
                            <button
                              onClick={(e) => toggleSector(e, sector)}
                              className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors shrink-0 mt-1 ${isSectorSelected ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-stone-500"}`}
                            >
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${isSectorExpanded ? "rotate-0" : "-rotate-90"}`}
                              />
                            </button>

                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-center justify-between">
                                <div className="text-[13px] font-black text-stone-800 leading-tight">
                                  قطاع{" "}
                                  <span style={{ color: sector.color }}>
                                    {sector.name}
                                  </span>
                                </div>

                                <span className="text-[9px] font-mono font-bold text-stone-400">
                                  {sector.code}
                                </span>
                              </div>

                              {isSectorSelected && (
                                <div className="mt-3 pt-2 border-t border-blue-200/50 flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();

                                      setDistrictModal({
                                        isOpen: true,

                                        mode: "create",

                                        sectorId: sector.id,

                                        data: {
                                          id: null,

                                          name: "",

                                          code: "",

                                          officialLink: "",

                                          mapImage: "",

                                          satelliteImage: "",
                                        },
                                      });
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-50 transition-colors"
                                  >
                                    <Plus className="w-3 h-3" /> تسجيل حي
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {isSectorExpanded && (
                            <div className="mt-2 mr-3 pr-4 border-r-2 border-stone-100 space-y-2 pb-2 relative">
                              {sector.neighborhoods &&
                              sector.neighborhoods.length > 0 ? (
                                sector.neighborhoods.map((nbh) => {
                                  const isSelected =
                                    selectedType === "neighborhood" &&
                                    selectedNode?.id === nbh.id;

                                  const isNbhExpanded =
                                    expandedNeighborhoods.includes(nbh.id);

                                  return (
                                    <div
                                      key={nbh.id}
                                      className="relative group"
                                    >
                                      <div className="absolute top-4 -right-4 w-4 h-0.5 bg-stone-100"></div>

                                      <div
                                        className={`flex items-start gap-2 p-2 rounded-xl transition-all cursor-pointer border ${isSelected ? "bg-white border-stone-800 shadow-md ring-1 ring-stone-800" : "bg-white border-stone-100 hover:border-stone-300"}`}
                                        onClick={() =>
                                          selectNeighborhood(sector, nbh)
                                        }
                                      >
                                        <button
                                          onClick={(e) =>
                                            toggleNeighborhood(e, nbh.id)
                                          }
                                          className={`w-5 h-5 flex items-center justify-center rounded transition-colors shrink-0 mt-0.5 ${isSelected ? "text-stone-800" : "text-stone-400"}`}
                                        >
                                          {nbh.streets &&
                                            nbh.streets.length > 0 && (
                                              <ChevronDown
                                                className={`w-3.5 h-3.5 transition-transform duration-200 ${isNbhExpanded ? "rotate-0" : "-rotate-90"}`}
                                              />
                                            )}
                                        </button>

                                        <div className="flex-1 min-w-0 pt-0.5">
                                          <div className="flex items-center justify-between">
                                            <div
                                              className={`text-[12px] font-bold truncate ${isSelected ? "text-stone-900" : "text-stone-700"}`}
                                            >
                                              {nbh.name}
                                            </div>

                                            <span className="text-[9px] font-mono text-stone-400">
                                              {nbh.code}
                                            </span>
                                          </div>

                                          {isSelected && (
                                            <div className="mt-3 pt-2 border-t border-stone-100 flex gap-2">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();

                                                  setStreetModal({
                                                    isOpen: true,

                                                    sectorId: sector.id,

                                                    districtId: nbh.id,

                                                    data: {
                                                      name: "",

                                                      width: "",

                                                      length: "",

                                                      lanes: "2",

                                                      type: "normal",

                                                      lighting: true,

                                                      sidewalks: true,
                                                    },
                                                  });
                                                }}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-stone-900 text-white rounded-lg text-[10px] font-bold hover:bg-stone-800 transition-colors"
                                              >
                                                <Plus className="w-3 h-3" />{" "}
                                                إضافة شارع
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {isNbhExpanded &&
                                        nbh.streets &&
                                        nbh.streets.length > 0 && (
                                          <div className="mt-2 mr-6 pr-3 border-r-2 border-orange-100/50 space-y-1 pb-1">
                                            {nbh.streets.map((street) => (
                                              <div
                                                key={street.id}
                                                className="flex items-center justify-between py-1.5 px-2 bg-stone-50 rounded-lg group hover:bg-orange-50"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <Route className="w-3 h-3 text-orange-400" />

                                                  <span className="text-[11px] font-medium text-stone-700">
                                                    {street.name}
                                                  </span>
                                                </div>

                                                <span className="px-1.5 py-0.5 bg-white text-stone-500 text-[8px] font-mono font-bold rounded shadow-sm border border-stone-200">
                                                  {street.width}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-[10px] text-stone-400 font-bold py-2">
                                  لا يوجد أحياء مسجلة.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="group relative flex items-center justify-center shrink-0 cursor-col-resize select-none z-10 w-[12px] mx-1">
                <div className="absolute inset-y-0 w-1 rounded-full bg-stone-200 group-hover:bg-blue-400 transition-colors" />
              </div>
            </div>

            {/* === Left Details Panel (Enterprise Display) === */}

            <div className="bg-white flex flex-col overflow-hidden h-full flex-1 rounded-2xl shadow-sm border border-stone-200/80 relative">
              {selectedNode ? (
                <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                  {/* 1. Header (Cover & Breadcrumb) */}

                  <div className="shrink-0 bg-[#FAFAFA] border-b border-stone-200 relative">
                    <div
                      className="absolute top-0 inset-x-0 h-full z-0 opacity-[0.03]"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 2px 2px, black 1px, transparent 0)",

                        backgroundSize: "24px 24px",
                      }}
                    ></div>

                    {/* 🎯 2. شريط التابات العشرة (Tabs Menu) 🎯 */}

                    <div className="relative z-10 px-4 border-t border-stone-200 bg-white">
                      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar-slim pb-1 pt-2">
                        {DETAIL_TABS.map((tab) => {
                          const Icon = tab.icon;

                          const isActive = activeDetailTab === tab.id;

                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveDetailTab(tab.id)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg border-b-2 transition-all whitespace-nowrap text-[12px] font-bold ${
                                isActive
                                  ? "border-blue-600 text-blue-700 bg-blue-50/50"
                                  : "border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                              }`}
                            >
                              <Icon
                                className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-stone-400"}`}
                              />{" "}
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="relative z-10 px-6 py-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-500 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm w-fit">
                          <Landmark className="w-3 h-3 text-stone-400" /> أمانة
                          الرياض
                          <ChevronRight className="w-3 h-3 text-stone-300 scale-x-[-1]" />
                          <span className="text-stone-700">
                            قطاع {selectedSector.name}
                          </span>
                          {selectedType === "neighborhood" && (
                            <>
                              <ChevronRight className="w-3 h-3 text-stone-300 scale-x-[-1]" />

                              <span className="text-blue-600">
                                {selectedNode.name}
                              </span>
                            </>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (selectedType === "sector")
                              setSectorModal({
                                isOpen: true,

                                mode: "edit",

                                data: {
                                  id: selectedNode.id,

                                  name: selectedNode.name,

                                  code: selectedNode.code,

                                  officialLink: selectedNode.officialLink || "",

                                  mapImage: selectedNode.mapImage || "",

                                  satelliteImage:
                                    selectedNode.satelliteImage || "",
                                },
                              });
                            else
                              setDistrictModal({
                                isOpen: true,

                                mode: "edit",

                                sectorId: selectedSector.id,

                                data: {
                                  id: selectedNode.id,

                                  name: selectedNode.name,

                                  code: selectedNode.code,

                                  officialLink: selectedNode.officialLink || "",

                                  mapImage: selectedNode.mapImage || "",

                                  satelliteImage:
                                    selectedNode.satelliteImage || "",
                                },
                              });
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-xl hover:bg-blue-100 transition-colors border border-blue-100"
                        >
                          <Edit className="w-3.5 h-3.5" /> تحديث البيانات
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white border-2 border-stone-200 flex items-center justify-center text-2xl shadow-sm">
                          {selectedType === "sector"
                            ? selectedSector.icon
                            : "🏘️"}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <h2 className="text-2xl font-black text-stone-900">
                              {selectedType === "sector"
                                ? `قطاع ${selectedNode.name}`
                                : selectedNode.name}
                            </h2>

                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${selectedType === "sector" ? "bg-stone-100 text-stone-600 border border-stone-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}
                            >
                              {selectedType === "sector"
                                ? "قطاع إداري"
                                : "حي سكني"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                              {selectedNode.code}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Tab Content Area */}

                  <div className="flex-1 overflow-y-auto bg-[#FAFAFA] p-6 relative">
                    {/* ====== تاب نظرة عامة (Overview) ====== */}

                    {activeDetailTab === "overview" && (
                      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
                        {/* KPIs */}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {selectedType === "sector" ? (
                            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden group">
                              <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500"></div>

                              <span className="text-[11px] font-bold text-stone-500 block mb-1">
                                الأحياء التابعة
                              </span>

                              <span className="text-2xl font-black text-stone-800">
                                {selectedNode.stats?.neighborhoods ||
                                  selectedNode.neighborhoods?.length ||
                                  0}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden group">
                              <div className="absolute right-0 top-0 bottom-0 w-1 bg-orange-500"></div>

                              <span className="text-[11px] font-bold text-stone-500 block mb-1">
                                الشوارع الموثقة
                              </span>

                              <span className="text-2xl font-black text-stone-800">
                                {selectedNode.streets?.length || 0}
                              </span>
                            </div>
                          )}

                          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500"></div>

                            <span className="text-[11px] font-bold text-stone-500 block mb-1">
                              المعاملات النشطة
                            </span>

                            <span className="text-2xl font-black text-stone-800">
                              {selectedNode.stats?.transactions?.toLocaleString() ||
                                0}
                            </span>
                          </div>

                          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500"></div>

                            <span className="text-[11px] font-bold text-stone-500 block mb-1">
                              الملكيات والعقارات
                            </span>

                            <span className="text-2xl font-black text-stone-800">
                              {selectedNode.stats?.properties?.toLocaleString() ||
                                0}
                            </span>
                          </div>

                          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-violet-500"></div>

                            <span className="text-[11px] font-bold text-stone-500 block mb-1">
                              العملاء المرتبطين
                            </span>

                            <span className="text-2xl font-black text-stone-800">
                              {selectedNode.stats?.clients?.toLocaleString() ||
                                0}
                            </span>
                          </div>
                        </div>

                        {/* Maps Cards */}

                        <div>
                          <h3 className="text-[13px] font-extrabold text-stone-800 mb-3 flex items-center gap-2">
                            <Map className="w-4 h-4 text-emerald-500" /> الخرائط
                            والبيانات المكانية
                          </h3>

                          <div className="flex gap-4 flex-col lg:flex-row">
                            {renderImageCard(
                              "صورة من البوابة المكانية",

                              Map,

                              "mapImage",

                              "لم يتم رفع صورة البوابة المكانية",
                            )}

                            {renderImageCard(
                              "صورة من القمر الصناعي",

                              Satellite,

                              "satelliteImage",

                              "لم يتم رفع صورة القمر الصناعي",
                            )}
                          </div>
                        </div>

                        {/* Link & QR */}

                        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-stone-800 font-bold text-[13px]">
                              <Link2 className="w-4 h-4 text-blue-600" /> رابط
                              الخريطة التفاعلية (Google Maps / Balady)
                            </div>

                            {!isEditingLink && (
                              <button
                                onClick={() =>
                                  openInlineEditor(
                                    "link",

                                    selectedNode.officialLink,
                                  )
                                }
                                className="text-[10px] font-bold bg-stone-50 text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-100 flex items-center gap-1 transition-colors"
                              >
                                <PenLine className="w-3 h-3" />{" "}
                                {selectedNode.officialLink
                                  ? "تغيير الرابط"
                                  : "إضافة رابط"}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="flex-1">
                              {editingField === "link" ? (
                                <div className="flex gap-2 bg-blue-50/50 p-2 rounded-xl border border-blue-100">
                                  <input
                                    type="url"
                                    dir="ltr"
                                    placeholder="https://..."
                                    autoFocus
                                    value={tempValue}
                                    onChange={(e) =>
                                      setTempValue(e.target.value)
                                    }
                                    className="flex-1 px-3 py-2 text-[12px] font-mono text-left border border-blue-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                  />

                                  <button
                                    onClick={() =>
                                      handleSaveInline("officialLink")
                                    }
                                    disabled={quickUpdateMutation.isPending}
                                    className="bg-blue-600 text-white text-[11px] px-4 font-bold rounded-lg flex items-center gap-1 hover:bg-blue-700"
                                  >
                                    {quickUpdateMutation.isPending ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <CircleCheck className="w-4 h-4" /> حفظ
                                      </>
                                    )}
                                  </button>

                                  <button
                                    onClick={() => setEditingField(null)}
                                    className="bg-white border border-stone-300 text-stone-600 text-[11px] px-4 font-bold rounded-lg hover:bg-stone-50"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    readOnly
                                    value={
                                      selectedNode.officialLink ||
                                      "لا يوجد رابط مسجل"
                                    }
                                    className={`flex-1 px-4 py-3 text-[12px] font-mono text-left bg-stone-50 border border-stone-200 rounded-xl outline-none ${selectedNode.officialLink ? "text-blue-600" : "text-stone-400"}`}
                                    dir="ltr"
                                  />

                                  {selectedNode.officialLink && (
                                    <>
                                      <button
                                        onClick={() =>
                                          copyToClipboard(
                                            selectedNode.officialLink,
                                          )
                                        }
                                        className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 border border-stone-200 transition-colors"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </button>

                                      <a
                                        href={selectedNode.officialLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 border border-blue-200 transition-colors"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="w-[90px] h-[90px] bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm p-1.5 relative overflow-hidden group">
                              {selectedNode.officialLink ? (
                                <>
                                  <QRCodeSVG
                                    id="qr-code-svg"
                                    value={selectedNode.officialLink}
                                    size={70}
                                    level="H"
                                  />

                                  <div
                                    onClick={handleDownloadQR}
                                    className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-sm"
                                  >
                                    <Download className="w-5 h-5 mb-1" />

                                    <span className="text-[8px] font-bold">
                                      تحميل QR
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <QrCode className="w-6 h-6 text-stone-300 mb-1" />

                                  <span className="text-[7px] text-stone-400 font-bold text-center leading-tight">
                                    لا يوجد
                                    <br />
                                    رابط
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ====== 2. التابات الديناميكية الجديدة ====== */}

                    {activeDetailTab === "stats" && (
                      <NodeStatsTab
                        selectedType={selectedType}
                        selectedNode={selectedNode}
                      />
                    )}

                    {activeDetailTab === "transactions" && (
                      <NodeTransactionsTab
                        selectedType={selectedType}
                        selectedNode={selectedNode}
                      />
                    )}

                    {activeDetailTab === "properties" && (
                      <NodePropertiesTab
                        selectedType={selectedType}
                        selectedNode={selectedNode}
                      />
                    )}

                    {activeDetailTab === "clients" && (
                      <NodeClientsTab
                        selectedType={selectedType}
                        selectedNode={selectedNode}
                      />
                    )}

                    {/* ====== 3. التابات الجديدة المضافة ====== */}

                    {activeDetailTab === "streets" && (
                      <NodeStreetsTab
                        selectedType={selectedType}
                        selectedNode={selectedNode}
                        setStreetModal={setStreetModal}
                      />
                    )}

                    {activeDetailTab === "media" && (
                      <NodeMediaTab
                        selectedType={selectedType}
                        selectedNode={selectedNode}
                      />
                    )}

                    {activeDetailTab === "notes" && (
                      <NodeNotesTab
                        selectedType={selectedType}
                        selectedNode={selectedNode}
                      />
                    )}

                    {activeDetailTab === "regulations" && (
                      <NodeRegulationsTab
                        selectedType={selectedType}
                        selectedNode={selectedNode}
                      />
                    )}

                    {activeDetailTab === "audit" && (
                      <NodeAuditTab
                        selectedType={selectedType}
                        selectedNode={selectedNode}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-stone-50 text-stone-400 flex-col gap-3">
                  <Layers className="w-16 h-16 opacity-10" />

                  <p className="font-extrabold text-[14px]">
                    حدد قطاعاً أو حياً من الشجرة لاستعراض البيانات
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeMainTab === "plans" && <PlansTab />}

        {activeMainTab === "stats" && <StatsTab />}
      </div>

      {/* ========================================== */}

      {/* 🖨️ قالب الطباعة الاحترافي 🖨️ */}

      {/* ========================================== */}

      {selectedNode && (
        <div
          className="hidden print:block bg-white text-black p-8 font-sans"
          dir="rtl"
        >
          <div className="flex items-center justify-between border-b-2 border-stone-800 pb-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-stone-100 border-2 border-stone-800 rounded-xl flex items-center justify-center">
                <Landmark className="w-8 h-8 text-stone-800" />
              </div>

              <div>
                <h1 className="text-3xl font-black text-stone-900">
                  تقرير المنظومة الجغرافية
                </h1>

                <p className="text-lg text-stone-600 font-bold mt-1">
                  أمانة منطقة الرياض
                </p>
              </div>
            </div>

            <div className="text-left">
              <p className="text-sm font-bold text-stone-500">تاريخ الإصدار</p>

              <p className="text-lg font-bold font-mono">
                {new Date().toLocaleDateString("ar-SA")}
              </p>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-stone-500 mb-1">
                {selectedType === "sector"
                  ? "بيانات القطاع البلدي"
                  : `حي تابع لـ: قطاع ${selectedSector.name}`}
              </p>

              <h2 className="text-4xl font-black text-stone-900">
                {selectedType === "sector"
                  ? `قطاع ${selectedNode.name}`
                  : selectedNode.name}
              </h2>

              <span className="inline-block mt-3 px-3 py-1 bg-stone-200 text-stone-800 font-mono font-bold rounded-lg border border-stone-300">
                كود المرجع: {selectedNode.code}
              </span>
            </div>

            {selectedNode.officialLink && (
              <div className="text-center">
                <div className="p-2 bg-white border-2 border-stone-800 rounded-xl inline-block">
                  <QRCodeSVG
                    value={selectedNode.officialLink}
                    size={100}
                    level="H"
                  />
                </div>

                <p className="text-[10px] font-bold mt-2">امسح للوصول للموقع</p>
              </div>
            )}
          </div>

          <h3 className="text-2xl font-bold text-stone-800 border-b border-stone-200 pb-2 mb-4">
            الإحصائيات المعتمدة
          </h3>

          <div className="grid grid-cols-4 gap-4 mb-8">
            {selectedType === "sector" ? (
              <div className="border-2 border-stone-200 rounded-xl p-4 text-center bg-white">
                <p className="text-sm font-bold text-stone-500 mb-2">الأحياء</p>

                <p className="text-3xl font-black">
                  {selectedNode.stats?.neighborhoods ||
                    selectedNode.neighborhoods?.length ||
                    0}
                </p>
              </div>
            ) : (
              <div className="border-2 border-stone-200 rounded-xl p-4 text-center bg-white">
                <p className="text-sm font-bold text-stone-500 mb-2">الشوارع</p>

                <p className="text-3xl font-black">
                  {selectedNode.streets?.length || 0}
                </p>
              </div>
            )}

            <div className="border-2 border-stone-200 rounded-xl p-4 text-center bg-white">
              <p className="text-sm font-bold text-stone-500 mb-2">المعاملات</p>

              <p className="text-3xl font-black">
                {selectedNode.stats?.transactions?.toLocaleString() || 0}
              </p>
            </div>

            <div className="border-2 border-stone-200 rounded-xl p-4 text-center bg-white">
              <p className="text-sm font-bold text-stone-500 mb-2">الملكيات</p>

              <p className="text-3xl font-black">
                {selectedNode.stats?.properties?.toLocaleString() || 0}
              </p>
            </div>

            <div className="border-2 border-stone-200 rounded-xl p-4 text-center bg-white">
              <p className="text-sm font-bold text-stone-500 mb-2">العملاء</p>

              <p className="text-3xl font-black">
                {selectedNode.stats?.clients?.toLocaleString() || 0}
              </p>
            </div>
          </div>

          {selectedType === "neighborhood" &&
            selectedNode.streets &&
            selectedNode.streets.length > 0 && (
              <div className="mt-8">
                <h3 className="text-2xl font-bold text-stone-800 border-b border-stone-200 pb-2 mb-4">
                  قائمة الشوارع الموثقة
                </h3>

                <table className="w-full border-collapse border border-stone-300 text-sm">
                  <thead>
                    <tr className="bg-stone-100">
                      <th className="border border-stone-300 p-3 text-right font-bold">
                        اسم الشارع
                      </th>

                      <th className="border border-stone-300 p-3 text-center font-bold">
                        النوع
                      </th>

                      <th className="border border-stone-300 p-3 text-center font-bold">
                        العرض
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedNode.streets.map((st, i) => (
                      <tr key={i}>
                        <td className="border border-stone-300 p-3 font-bold text-stone-800">
                          {st.name}
                        </td>

                        <td className="border border-stone-300 p-3 text-center">
                          {st.type === "main" ? "طريق محوري" : "شارع داخلي"}
                        </td>

                        <td className="border border-stone-300 p-3 text-center font-mono">
                          {st.width}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}

      {/* ================= Nودلز (Modals) ================= */}

      {/* 1. Modal القطاع (Sector) */}

      {sectorModal.isOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="font-extrabold text-stone-800 text-lg">
                    {sectorModal.mode === "create"
                      ? "تسجيل قطاع جديد"
                      : "تعديل بيانات القطاع"}
                  </h3>
                </div>
              </div>

              <button
                onClick={() =>
                  setSectorModal({ ...sectorModal, isOpen: false })
                }
                className="p-2 hover:bg-stone-200 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              id="sectorForm"
              onSubmit={(e) => {
                e.preventDefault();

                sectorMutation.mutate(sectorModal.data);
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
                      value={sectorModal.data.name}
                      onChange={(e) =>
                        setSectorModal({
                          ...sectorModal,

                          data: { ...sectorModal.data, name: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="مثال: وسط، شمال، غرب..."
                    />
                  </div>

                  {sectorModal.mode === "edit" && (
                    <div>
                      <label className="block text-[12px] font-bold text-stone-700 mb-2">
                        كود القطاع الداخلي
                      </label>

                      <input
                        type="text"
                        readOnly
                        dir="ltr"
                        value={sectorModal.data.code || "يتم توليده تلقائياً"}
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

                <div className="space-y-5">
                  <div>
                    <label className="block text-[12px] font-bold text-stone-700 mb-2">
                      رابط الخريطة الرسمية المتفاعلة (Google Maps URL)
                    </label>

                    <div className="relative">
                      <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />

                      <input
                        type="url"
                        dir="ltr"
                        value={sectorModal.data.officialLink || ""}
                        onChange={(e) =>
                          setSectorModal({
                            ...sectorModal,

                            data: {
                              ...sectorModal.data,

                              officialLink: e.target.value,
                            },
                          })
                        }
                        className="w-full pr-9 pl-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-left outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        placeholder="https://maps.google.com/..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[12px] font-bold text-stone-700 mb-2">
                        صورة من البوابة المكانية
                      </label>

                      <div className="relative w-full h-32 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50 flex items-center justify-center overflow-hidden hover:bg-blue-100 transition-colors group cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleModalImageUpload(e, "sector", "mapImage")
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />

                        {sectorModal.data.mapImage ? (
                          <img
                            src={sectorModal.data.mapImage}
                            alt="Map Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-blue-500 opacity-70 group-hover:opacity-100">
                            <Map className="w-8 h-8" />

                            <span className="text-[10px] font-bold">
                              اضغط أو اسحب الصورة هنا
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-stone-700 mb-2">
                        صورة من القمر الصناعي
                      </label>

                      <div className="relative w-full h-32 border-2 border-dashed border-emerald-200 rounded-xl bg-emerald-50 flex items-center justify-center overflow-hidden hover:bg-emerald-100 transition-colors group cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleModalImageUpload(
                              e,

                              "sector",

                              "satelliteImage",
                            )
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />

                        {sectorModal.data.satelliteImage ? (
                          <img
                            src={sectorModal.data.satelliteImage}
                            alt="Satellite Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-emerald-500 opacity-70 group-hover:opacity-100">
                            <Satellite className="w-8 h-8" />

                            <span className="text-[10px] font-bold">
                              اضغط أو اسحب الصورة هنا
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </form>

            <div className="p-4 border-t border-stone-100 bg-stone-50 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setSectorModal({ ...sectorModal, isOpen: false })
                }
                className="px-6 py-2.5 bg-white border border-stone-200 text-stone-700 font-bold rounded-xl hover:bg-stone-50 transition-colors w-32"
              >
                إلغاء
              </button>

              <button
                type="submit"
                form="sectorForm"
                disabled={sectorMutation.isPending}
                className="flex-1 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
              >
                {sectorMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CircleCheck className="w-5 h-5" />{" "}
                    {sectorModal.mode === "create"
                      ? "حفظ وإنشاء القطاع"
                      : "حفظ التعديلات"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal الحي (District) */}

      {districtModal.isOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="font-extrabold text-stone-800 text-lg">
                    {districtModal.mode === "create"
                      ? "تسجيل حي جديد"
                      : "تعديل بيانات الحي"}
                  </h3>
                </div>
              </div>

              <button
                onClick={() =>
                  setDistrictModal({ ...districtModal, isOpen: false })
                }
                className="p-2 hover:bg-stone-200 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              id="districtForm"
              className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar"
              onSubmit={(e) => {
                e.preventDefault();

                districtMutation.mutate(districtModal.data);
              }}
            >
              <section>
                <h4 className="text-[12px] font-bold text-stone-800 mb-4 flex items-center gap-2 border-b border-stone-100 pb-2">
                  <FileText className="w-4 h-4 text-emerald-500" /> البيانات
                  الأساسية
                </h4>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] font-bold text-stone-700 mb-2">
                      اسم الحي <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      required
                      value={districtModal.data.name}
                      onChange={(e) =>
                        setDistrictModal({
                          ...districtModal,

                          data: { ...districtModal.data, name: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="مثال: العليا، النرجس..."
                    />
                  </div>

                  {districtModal.mode === "edit" && (
                    <div>
                      <label className="block text-[12px] font-bold text-stone-700 mb-2">
                        كود الحي (تلقائي)
                      </label>

                      <input
                        type="text"
                        readOnly
                        dir="ltr"
                        value={districtModal.data.code || "تلقائي"}
                        className="w-full px-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm font-mono text-left text-stone-500 outline-none cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h4 className="text-[12px] font-bold text-stone-800 mb-4 flex items-center gap-2 border-b border-stone-100 pb-2">
                  <Globe className="w-4 h-4 text-blue-500" /> الروابط والخرائط
                </h4>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[12px] font-bold text-stone-700 mb-2">
                      رابط الخريطة الرسمية (URL)
                    </label>

                    <div className="relative">
                      <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />

                      <input
                        type="url"
                        dir="ltr"
                        value={districtModal.data.officialLink || ""}
                        onChange={(e) =>
                          setDistrictModal({
                            ...districtModal,

                            data: {
                              ...districtModal.data,

                              officialLink: e.target.value,
                            },
                          })
                        }
                        className="w-full pr-9 pl-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-left outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[12px] font-bold text-stone-700 mb-2">
                        صورة من البوابة المكانية
                      </label>

                      <div className="relative w-full h-32 border-2 border-dashed border-emerald-200 rounded-xl bg-emerald-50 flex items-center justify-center overflow-hidden hover:bg-emerald-100 transition-colors group cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleModalImageUpload(e, "district", "mapImage")
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />

                        {districtModal.data.mapImage ? (
                          <img
                            src={districtModal.data.mapImage}
                            alt="Map Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-emerald-500 opacity-70 group-hover:opacity-100">
                            <Map className="w-8 h-8" />

                            <span className="text-[10px] font-bold">
                              اضغط أو اسحب الصورة هنا
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-stone-700 mb-2">
                        صورة من القمر الصناعي
                      </label>

                      <div className="relative w-full h-32 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50 flex items-center justify-center overflow-hidden hover:bg-blue-100 transition-colors group cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleModalImageUpload(
                              e,

                              "district",

                              "satelliteImage",
                            )
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />

                        {districtModal.data.satelliteImage ? (
                          <img
                            src={districtModal.data.satelliteImage}
                            alt="Satellite Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-blue-500 opacity-70 group-hover:opacity-100">
                            <Satellite className="w-8 h-8" />

                            <span className="text-[10px] font-bold">
                              اضغط أو اسحب الصورة هنا
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </form>

            <div className="p-4 border-t border-stone-100 bg-stone-50 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setDistrictModal({ ...districtModal, isOpen: false })
                }
                className="px-6 py-2.5 bg-white border border-stone-200 text-stone-700 font-bold rounded-xl hover:bg-stone-50 transition-colors w-32"
              >
                إلغاء
              </button>

              <button
                type="submit"
                form="districtForm"
                disabled={districtMutation.isPending}
                className="flex-1 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
              >
                {districtMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CircleCheck className="w-5 h-5" /> حفظ بيانات الحي
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal الشارع (Street) */}

      {streetModal.isOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Route className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="font-extrabold text-stone-800 text-lg">
                    تسجيل شارع جديد
                  </h3>

                  <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                    إضافة شارع وتحديد مواصفاته الهندسية
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setStreetModal({ ...streetModal, isOpen: false })
                }
                className="p-2 hover:bg-stone-200 rounded-lg text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <section>
                <h4 className="text-[12px] font-bold text-stone-800 mb-4 flex items-center gap-2 border-b border-stone-100 pb-2">
                  <Route className="w-4 h-4 text-orange-500" /> التصنيف
                  والقياسات
                </h4>

                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-[12px] font-bold text-stone-700 mb-2">
                      اسم الشارع <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      required
                      value={streetModal.data.name}
                      onChange={(e) =>
                        setStreetModal({
                          ...streetModal,

                          data: { ...streetModal.data, name: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      placeholder="مثال: طريق الملك فهد"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-stone-700 mb-2">
                      نوع الشارع
                    </label>

                    <div className="relative">
                      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />

                      <select
                        value={streetModal.data.type}
                        onChange={(e) =>
                          setStreetModal({
                            ...streetModal,

                            data: { ...streetModal.data, type: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      >
                        <option value="normal">شارع داخلي (فرعي)</option>

                        <option value="main">طريق محوري (رئيسي)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-stone-700 mb-2">
                      عرض الشارع (متر) <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="number"
                      required
                      value={streetModal.data.width}
                      onChange={(e) =>
                        setStreetModal({
                          ...streetModal,

                          data: { ...streetModal.data, width: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      placeholder="30"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-stone-700 mb-2">
                      طول الشارع التقريبي (متر)
                    </label>

                    <input
                      type="number"
                      value={streetModal.data.length}
                      onChange={(e) =>
                        setStreetModal({
                          ...streetModal,

                          data: { ...streetModal.data, length: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      placeholder="1500"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-stone-700 mb-2">
                      عدد المسارات (Lanes)
                    </label>

                    <input
                      type="number"
                      value={streetModal.data.lanes}
                      onChange={(e) =>
                        setStreetModal({
                          ...streetModal,

                          data: { ...streetModal.data, lanes: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      placeholder="2"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-[12px] font-bold text-stone-800 mb-4 flex items-center gap-2 border-b border-stone-100 pb-2">
                  <ShieldCheck className="w-4 h-4 text-purple-500" /> البنية
                  التحتية
                </h4>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={streetModal.data.lighting}
                        onChange={(e) =>
                          setStreetModal({
                            ...streetModal,

                            data: {
                              ...streetModal.data,

                              lighting: e.target.checked,
                            },
                          })
                        }
                      />

                      <div
                        className={`w-10 h-6 rounded-full transition-colors ${streetModal.data.lighting ? "bg-orange-500" : "bg-stone-300"}`}
                      ></div>

                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${streetModal.data.lighting ? "left-1 translate-x-4" : "left-1"}`}
                      ></div>
                    </div>

                    <span className="text-[13px] font-bold text-stone-700 group-hover:text-orange-600 transition-colors flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4" /> تتوفر إنارة
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={streetModal.data.sidewalks}
                        onChange={(e) =>
                          setStreetModal({
                            ...streetModal,

                            data: {
                              ...streetModal.data,

                              sidewalks: e.target.checked,
                            },
                          })
                        }
                      />

                      <div
                        className={`w-10 h-6 rounded-full transition-colors ${streetModal.data.sidewalks ? "bg-orange-500" : "bg-stone-300"}`}
                      ></div>

                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${streetModal.data.sidewalks ? "left-1 translate-x-4" : "left-1"}`}
                      ></div>
                    </div>

                    <span className="text-[13px] font-bold text-stone-700 group-hover:text-orange-600 transition-colors flex items-center gap-1.5">
                      <Layers className="w-4 h-4" /> تتوفر أرصفة مشاة
                    </span>
                  </label>
                </div>
              </section>
            </form>

            <div className="p-4 border-t border-stone-100 bg-stone-50 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setStreetModal({ ...streetModal, isOpen: false })
                }
                className="px-6 py-2.5 bg-white border border-stone-200 text-stone-700 font-bold rounded-xl hover:bg-stone-50 transition-colors w-32"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={() => streetMutation.mutate(streetModal.data)}
                disabled={streetMutation.isPending}
                className="flex-1 px-6 py-2.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-orange-500/20"
              >
                {streetMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CircleCheck className="w-5 h-5" /> إضافة الشارع للمنظومة
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

export default RiyadhDivisionScreen;
