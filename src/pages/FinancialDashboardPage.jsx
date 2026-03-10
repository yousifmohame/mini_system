import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  DollarSign,
  Receipt,
  FileText,
  Download,
  Vault,
  Landmark,
  Camera,
  TriangleAlert,
  ArrowUpRight,
  Info,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// 💡 دالة ذكية لحل مشكلة الـ Objects وحماية الصفحة من الانهيار (Crash)
const safeText = (val) => {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object") {
    // إذا كان الكائن يحتوي على مفتاح ar نعرضه، وإلا نعرض name، وإلا نعرضه كنص
    return val.ar || val.name || val.en || JSON.stringify(val);
  }
  return val;
};

// 💡 دالة مساعدة للأرقام لتفادي أي أخطاء في الـ toLocaleString
const safeNum = (val) => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const FinancialDashboardPage = () => {
  // 1. جلب البيانات من الـ API
  const { data, isLoading, isError } = useQuery({
    queryKey: ["financial-dashboard-full"],
    queryFn: async () => {
      const res = await api.get("/financial-dashboard");
      return res.data?.data;
    },
    // تحديث كل دقيقتين لضمان بقاء البيانات حية
    refetchInterval: 120000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[var(--wms-bg-0)]">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--wms-accent-blue)] mb-4" />
        <p className="text-[var(--wms-text-sec)] font-bold text-sm">
          جاري تجميع الإحصائيات المالية...
        </p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 bg-[var(--wms-bg-0)]">
        <TriangleAlert className="w-10 h-10 mb-4" />
        <p className="font-bold">
          حدث خطأ أثناء جلب بيانات لوحة التحكم المالية
        </p>
      </div>
    );
  }

  // فك تفكيك البيانات المستلمة من الباك إند
  const {
    kpis,
    upcomingObligations = [],
    expectedCollections = [],
    profitabilityAnalysis = [],
    undistributedProfits = [],
    chartData = [],
    riskAlerts = [],
  } = data;

  return (
    <div
      className="p-3 space-y-3 overflow-y-auto custom-scrollbar-slim h-full bg-[var(--wms-bg-0)] animate-in fade-in duration-500"
      dir="rtl"
    >
      {/* ========================================== */}
      {/* 1. KPIs Top Grid */}
      {/* ========================================== */}
      <div className="flex gap-3">
        <div className="flex-1 grid grid-cols-9 gap-1.5">
          <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-md px-2 py-2 shadow-sm hover:shadow transition-shadow">
            <div className="text-[var(--wms-text-muted)] text-[9px] leading-[1.3]">
              المعاملات النشطة
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-[14px] font-bold text-[var(--wms-accent-blue)] leading-[1.2]">
                {safeNum(kpis?.activeTxs)}
              </span>
            </div>
          </div>
          <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-md px-2 py-2 shadow-sm hover:shadow transition-shadow">
            <div className="text-[var(--wms-text-muted)] text-[9px] leading-[1.3]">
              الإيرادات المتوقعة
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-[14px] font-bold text-[var(--wms-text)] leading-[1.2]">
                {safeNum(kpis?.expectedRevenue).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-md px-2 py-2 shadow-sm hover:shadow transition-shadow">
            <div className="text-[var(--wms-text-muted)] text-[9px] leading-[1.3]">
              الإيرادات المحصّلة
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-[14px] font-bold text-[var(--wms-success)] leading-[1.2]">
                {safeNum(kpis?.collectedRevenue).toLocaleString()}
              </span>
              <TrendingUp className="w-3 h-3 text-[var(--wms-success)]" />
            </div>
          </div>
          <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-md px-2 py-2 shadow-sm hover:shadow transition-shadow">
            <div className="text-[var(--wms-text-muted)] text-[9px] leading-[1.3]">
              الإيرادات المعلّقة
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-[14px] font-bold text-[var(--wms-warning)] leading-[1.2]">
                {safeNum(kpis?.pendingRevenue).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-md px-2 py-2 shadow-sm hover:shadow transition-shadow">
            <div className="text-[var(--wms-text-muted)] text-[9px] leading-[1.3]">
              إجمالي التكاليف
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-[14px] font-bold text-[var(--wms-danger)] leading-[1.2]">
                {safeNum(kpis?.totalCosts).toLocaleString()}
              </span>
              <TrendingDown className="w-3 h-3 text-[var(--wms-danger)]" />
            </div>
          </div>
          <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-md px-2 py-2 shadow-sm hover:shadow transition-shadow">
            <div className="text-[var(--wms-text-muted)] text-[9px] leading-[1.3]">
              ربح تقديري
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-[14px] font-bold text-[var(--wms-success)] leading-[1.2]">
                {safeNum(kpis?.estimatedProfit).toLocaleString()}
              </span>
              <TrendingUp className="w-3 h-3 text-[var(--wms-success)]" />
            </div>
          </div>
          <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-md px-2 py-2 shadow-sm hover:shadow transition-shadow">
            <div className="text-[var(--wms-text-muted)] text-[9px] leading-[1.3]">
              رصيد الاحتياطي
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-[14px] font-bold text-[var(--wms-accent-blue)] leading-[1.2]">
                {safeNum(kpis?.reserveBalance).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-md px-2 py-2 shadow-sm hover:shadow transition-shadow">
            <div className="text-[var(--wms-text-muted)] text-[9px] leading-[1.3]">
              رصيد الخزنة
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-[14px] font-bold text-[var(--chart-4)] leading-[1.2]">
                {safeNum(kpis?.treasuryBalance).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-md px-2 py-2 shadow-sm hover:shadow transition-shadow">
            <div className="text-[var(--wms-text-muted)] text-[9px] leading-[1.3]">
              رصيد البنوك
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-[14px] font-bold text-[var(--wms-success)] leading-[1.2]">
                {safeNum(kpis?.bankBalance).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. Toolbar Actions */}
      {/* ========================================== */}
      <div className="flex items-center gap-1.5">
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] hover:bg-[var(--wms-surface-2)]/50 cursor-pointer transition-colors text-[11px] shadow-sm">
          <Plus className="w-3.5 h-3.5 text-[var(--wms-accent-blue)]" />
          <span className="text-[var(--wms-text-sec)] font-semibold">
            معاملة جديدة
          </span>
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] hover:bg-[var(--wms-surface-2)]/50 cursor-pointer transition-colors text-[11px] shadow-sm">
          <DollarSign className="w-3.5 h-3.5 text-[var(--wms-success)]" />
          <span className="text-[var(--wms-text-sec)] font-semibold">
            تسجيل دفعة
          </span>
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] hover:bg-[var(--wms-surface-2)]/50 cursor-pointer transition-colors text-[11px] shadow-sm">
          <Receipt className="w-3.5 h-3.5 text-[var(--wms-success)]" />
          <span className="text-[var(--wms-text-sec)] font-semibold">
            تسجيل تحصيل
          </span>
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] hover:bg-[var(--wms-surface-2)]/50 cursor-pointer transition-colors text-[11px] shadow-sm">
          <FileText className="w-3.5 h-3.5 text-[var(--chart-4)]" />
          <span className="text-[var(--wms-text-sec)] font-semibold">
            إنشاء تسوية
          </span>
        </button>
        <div className="flex-1"></div>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] hover:bg-[var(--wms-surface-2)]/50 cursor-pointer transition-colors text-[11px] shadow-sm">
          <Download className="w-3.5 h-3.5 text-[var(--wms-text-sec)]" />
          <span className="text-[var(--wms-text-sec)] font-semibold">
            تصدير تقرير
          </span>
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] hover:bg-[var(--wms-surface-2)]/50 cursor-pointer transition-colors text-[11px] shadow-sm">
          <Vault className="w-3.5 h-3.5 text-[var(--wms-warning)]" />
          <span className="text-[var(--wms-text-sec)] font-semibold">
            الخزنة
          </span>
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--wms-surface-1)] border border-[var(--wms-border)] hover:bg-[var(--wms-surface-2)]/50 cursor-pointer transition-colors text-[11px] shadow-sm">
          <Landmark className="w-3.5 h-3.5 text-[var(--wms-accent-blue)]" />
          <span className="text-[var(--wms-text-sec)] font-semibold">
            الحسابات البنكية
          </span>
        </button>
      </div>

      {/* ========================================== */}
      {/* 3. Middle Tables Grid (Obligations & Collections) */}
      {/* ========================================== */}
      <div className="grid grid-cols-2 gap-3">
        {/* Obligations Table */}
        <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden shadow-sm">
          <div className="px-3 py-1.5 border-b border-[var(--wms-border)] flex items-center justify-between bg-gray-50/50">
            <span className="text-[var(--wms-text)] text-[12px] font-bold">
              الالتزامات المالية القادمة (أوامر صرف وتسويات)
            </span>
            <span className="text-[var(--wms-text-muted)] font-mono text-[10px]">
              {upcomingObligations.length} التزام
            </span>
          </div>
          <div className="overflow-x-auto min-h-[140px]">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-[var(--wms-surface-2)] h-[30px]">
                  <th className="text-right px-2 text-[var(--wms-text-sec)] whitespace-nowrap font-bold text-[10px]">
                    التاريخ
                  </th>
                  <th className="text-right px-2 text-[var(--wms-text-sec)] whitespace-nowrap font-bold text-[10px]">
                    المرجع/المعاملة
                  </th>
                  <th className="text-right px-2 text-[var(--wms-text-sec)] whitespace-nowrap font-bold text-[10px]">
                    المستفيد/المالك
                  </th>
                  <th className="text-right px-2 text-[var(--wms-text-sec)] whitespace-nowrap font-bold text-[10px]">
                    الإجمالي
                  </th>
                  <th className="text-right px-2 text-[var(--wms-text-sec)] whitespace-nowrap font-bold text-[10px]">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody>
                {upcomingObligations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-gray-400">
                      لا توجد التزامات متأخرة أو قادمة
                    </td>
                  </tr>
                ) : (
                  upcomingObligations.map((item, i) => (
                    <tr
                      key={i}
                      className="border-b border-[var(--wms-border)]/20 hover:bg-[var(--wms-surface-2)]/30 cursor-pointer h-[32px]"
                    >
                      <td className="px-2 text-[var(--wms-text-muted)] font-mono text-[10px]">
                        {safeText(item.date)}
                      </td>
                      <td className="px-2 text-[var(--wms-blue)] font-mono text-[10px] font-bold">
                        {safeText(item.ref)}
                      </td>
                      <td className="px-2 text-[var(--wms-text)] font-semibold">
                        {safeText(item.owner)}
                      </td>
                      <td className="px-2 font-mono font-bold text-[var(--wms-danger)]">
                        {safeNum(item.total).toLocaleString()}
                      </td>
                      <td className="px-2">
                        <span
                          className="inline-block px-1.5 py-0.5 rounded font-bold text-[9px]"
                          style={{
                            backgroundColor:
                              item.status === "متأخر"
                                ? "rgba(239,68,68,0.15)"
                                : "rgba(245,158,11,0.15)",
                            color:
                              item.status === "متأخر"
                                ? "var(--wms-danger)"
                                : "var(--wms-warning)",
                          }}
                        >
                          {safeText(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Collections Table */}
        <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden shadow-sm">
          <div className="px-3 py-1.5 border-b border-[var(--wms-border)] flex items-center justify-between bg-gray-50/50">
            <span className="text-[var(--wms-text)] text-[12px] font-bold">
              التحصيلات المتوقعة (ديون العملاء)
            </span>
            <span className="text-[var(--wms-text-muted)] font-mono text-[10px]">
              {expectedCollections.length} تحصيل
            </span>
          </div>
          <div className="overflow-x-auto min-h-[140px]">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-[var(--wms-surface-2)] h-[30px]">
                  <th className="text-right px-2 text-[var(--wms-text-sec)] whitespace-nowrap font-bold text-[10px]">
                    التاريخ
                  </th>
                  <th className="text-right px-2 text-[var(--wms-text-sec)] whitespace-nowrap font-bold text-[10px]">
                    المعاملة
                  </th>
                  <th className="text-right px-2 text-[var(--wms-text-sec)] whitespace-nowrap font-bold text-[10px]">
                    العميل
                  </th>
                  <th className="text-right px-2 text-[var(--wms-text-sec)] whitespace-nowrap font-bold text-[10px]">
                    المتوقع
                  </th>
                  <th className="text-right px-2 text-[var(--wms-text-sec)] whitespace-nowrap font-bold text-[10px]">
                    المتبقي
                  </th>
                  <th className="text-right px-2 text-[var(--wms-text-sec)] whitespace-nowrap font-bold text-[10px]">
                    الوسيط
                  </th>
                  <th className="text-right px-2 text-[var(--wms-text-sec)] whitespace-nowrap font-bold text-[10px]">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody>
                {expectedCollections.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-6 text-gray-400">
                      لا توجد ديون أو تحصيلات معلقة
                    </td>
                  </tr>
                ) : (
                  expectedCollections.map((item, i) => (
                    <tr
                      key={i}
                      className="border-b border-[var(--wms-border)]/20 hover:bg-[var(--wms-surface-2)]/30 cursor-pointer h-[32px]"
                    >
                      <td className="px-2 text-[var(--wms-text-muted)] font-mono text-[10px]">
                        {safeText(item.date)}
                      </td>
                      <td className="px-2 text-[var(--wms-blue)] font-mono text-[10px] font-bold">
                        {safeText(item.ref)}
                      </td>
                      <td className="px-2 text-[var(--wms-text)] font-semibold">
                        {safeText(item.owner)}
                      </td>
                      <td className="px-2 font-mono text-[var(--wms-text)]">
                        {safeNum(item.expected).toLocaleString()}
                      </td>
                      <td className="px-2 font-mono font-bold text-[var(--wms-danger)]">
                        {safeNum(item.remaining).toLocaleString()}
                      </td>
                      <td className="px-2 text-[var(--wms-text-sec)] text-[10px]">
                        {safeText(item.broker)}
                      </td>
                      <td className="px-2">
                        <span className="inline-block px-1.5 py-0.5 rounded font-bold text-[9px] bg-amber-100 text-amber-700">
                          {safeText(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 4. Bottom 12-Col Grid (Profitability, Risk, Reserve) */}
      {/* ========================================== */}
      <div className="grid grid-cols-12 gap-3">
        {/* Profitability (Col 5) */}
        <div className="col-span-5 bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden shadow-sm">
          <div className="px-3 py-1.5 border-b border-[var(--wms-border)] bg-gray-50/50">
            <span className="text-[var(--wms-text)] text-[12px] font-bold">
              تحليل الربحية (للمعاملات)
            </span>
          </div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-[var(--wms-surface-2)] h-[30px]">
                <th className="text-right px-2 text-[var(--wms-text-sec)] font-bold text-[10px]">
                  المعاملة
                </th>
                <th className="text-right px-2 text-[var(--wms-text-sec)] font-bold text-[10px]">
                  المالك
                </th>
                <th className="text-right px-2 text-[var(--wms-text-sec)] font-bold text-[10px]">
                  الإيراد
                </th>
                <th className="text-right px-2 text-[var(--wms-text-sec)] font-bold text-[10px]">
                  التكاليف
                </th>
                <th className="text-right px-2 text-[var(--wms-text-sec)] font-bold text-[10px]">
                  الربح
                </th>
                <th className="text-right px-2 text-[var(--wms-text-sec)] font-bold text-[10px]">
                  الهامش%
                </th>
              </tr>
            </thead>
            <tbody>
              {profitabilityAnalysis.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-400">
                    لا توجد بيانات ربحية كافية
                  </td>
                </tr>
              ) : (
                profitabilityAnalysis.map((item, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--wms-border)]/20 hover:bg-[var(--wms-surface-2)]/30 cursor-pointer h-[30px]"
                  >
                    <td className="px-2 text-[var(--wms-blue)] font-mono text-[10px] font-bold">
                      {safeText(item.ref)}
                    </td>
                    <td className="px-2 text-[var(--wms-text)] font-semibold">
                      {safeText(item.owner)}
                    </td>
                    <td className="px-2 font-mono text-[var(--wms-text)]">
                      {safeNum(item.revenue).toLocaleString()}
                    </td>
                    <td className="px-2 font-mono text-[var(--wms-danger)]">
                      {safeNum(item.costs).toLocaleString()}
                    </td>
                    <td
                      className="px-2 font-mono font-bold"
                      style={{
                        color:
                          safeNum(item.profit) < 0
                            ? "var(--wms-danger)"
                            : "var(--wms-success)",
                      }}
                    >
                      {safeNum(item.profit).toLocaleString()}
                    </td>
                    <td className="px-2">
                      <span
                        className="inline-block px-1.5 py-0.5 rounded font-mono font-bold text-[10px]"
                        style={{
                          backgroundColor:
                            safeNum(item.profit) < 0
                              ? "rgba(239,68,68,0.1)"
                              : "rgba(34,197,94,0.1)",
                          color:
                            safeNum(item.profit) < 0
                              ? "var(--wms-danger)"
                              : "var(--wms-success)",
                        }}
                      >
                        {safeText(item.margin)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Risk Monitoring (Col 4) */}
        <div className="col-span-4 bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden shadow-sm">
          <div className="px-3 py-1.5 border-b border-[var(--wms-border)] flex items-center gap-2 bg-gray-50/50">
            <TriangleAlert className="w-3.5 h-3.5 text-[var(--wms-warning)]" />
            <span className="text-[var(--wms-text)] text-[12px] font-bold">
              مراقبة المخاطر الآلية
            </span>
          </div>
          <div className="p-1.5 space-y-1">
            {riskAlerts.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs font-semibold">
                مؤشرات الخطر ممتازة ولا توجد تنبيهات
              </div>
            ) : (
              riskAlerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.05)",
                    borderRight: `3px solid var(--wms-danger)`,
                  }}
                >
                  <TriangleAlert className="w-3 h-3 shrink-0 text-[var(--wms-danger)]" />
                  <span className="text-[var(--wms-text-sec)] text-[11px] leading-[1.4] font-semibold flex-1">
                    {safeText(alert)}
                  </span>
                  <ArrowUpRight className="w-3 h-3 shrink-0 text-[var(--wms-text-muted)]" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reserve Monitoring (Col 3) */}
        <div className="col-span-3 bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden shadow-sm">
          <div className="px-3 py-1.5 border-b border-[var(--wms-border)] bg-gray-50/50">
            <span className="text-[var(--wms-text)] text-[12px] font-bold">
              مراقبة الاحتياطي
            </span>
          </div>
          <div className="p-3 space-y-3">
            <div className="text-center">
              <div className="text-[var(--wms-text-muted)] text-[10px]">
                الرصيد المخصص الحالي
              </div>
              <div className="font-mono text-[22px] font-bold text-[var(--wms-accent-blue)]">
                {safeNum(kpis?.reserveBalance).toLocaleString()}
              </div>
              <div className="text-[var(--wms-text-muted)] text-[10px]">
                ر.س
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-[var(--wms-surface-2)]/50 rounded-md p-2 text-center border border-blue-50">
                <div className="text-[var(--wms-text-muted)] text-[9px]">
                  الرصيد النقدي الفعلي
                </div>
                <div className="font-mono text-[var(--wms-text)] text-[13px] font-bold">
                  {safeNum(kpis?.treasuryBalance).toLocaleString()}
                </div>
              </div>
              <div className="bg-[var(--wms-surface-2)]/50 rounded-md p-2 text-center border border-green-50">
                <div className="text-[var(--wms-text-muted)] text-[9px]">
                  رصيد البنوك
                </div>
                <div className="font-mono text-[var(--wms-success)] text-[13px] font-bold">
                  {safeNum(kpis?.bankBalance).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 5. Bottom Most Section (Chart & Profits) */}
      {/* ========================================== */}
      <div className="grid grid-cols-2 gap-3">
        {/* Cash Flow Chart */}
        <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden shadow-sm">
          <div className="px-3 py-1.5 border-b border-[var(--wms-border)] flex items-center gap-2 bg-gray-50/50">
            <span className="text-[var(--wms-text)] text-[12px] font-bold">
              التدفق المالي الفعلي (آخر 6 أشهر)
            </span>
            <div className="flex-1"></div>
          </div>
          <div className="p-2 h-[200px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(100,116,139,0.1)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--wms-text-muted)" }}
                  axisLine={{ stroke: "var(--wms-border)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--wms-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--wms-surface-2)",
                    border: "1px solid var(--wms-border)",
                    borderRadius: "6px",
                    fontSize: "11px",
                    direction: "rtl",
                    fontWeight: "bold",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }}
                />
                <Line
                  type="monotone"
                  dataKey="الإيرادات"
                  stroke="var(--wms-success)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="التكاليف"
                  stroke="var(--wms-danger)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Undistributed Profits */}
        <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden shadow-sm">
          <div className="px-3 py-1.5 border-b border-[var(--wms-border)] bg-gray-50/50">
            <span className="text-[var(--wms-text)] text-[12px] font-bold">
              الأرباح غير الموزّعة للشركاء
            </span>
          </div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-[var(--wms-surface-2)] h-[30px]">
                <th className="text-right px-2 text-[var(--wms-text-sec)] font-bold text-[10px]">
                  المصدر/المعاملة
                </th>
                <th className="text-right px-2 text-[var(--wms-text-sec)] font-bold text-[10px]">
                  الشريك
                </th>
                <th className="text-right px-2 text-[var(--wms-text-sec)] font-bold text-[10px]">
                  الربح المخصص
                </th>
                <th className="text-right px-2 text-[var(--wms-text-sec)] font-bold text-[10px]">
                  مخصوم الاحتياطي
                </th>
                <th className="text-right px-2 text-[var(--wms-text-sec)] font-bold text-[10px]">
                  الصافي المستحق
                </th>
                <th className="text-right px-2 text-[var(--wms-text-sec)] font-bold text-[10px]">
                  الحالة
                </th>
              </tr>
            </thead>
            <tbody>
              {undistributedProfits.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-8 text-gray-400 font-semibold"
                  >
                    لا توجد أرباح غير موزعة مسجلة
                  </td>
                </tr>
              ) : (
                undistributedProfits.map((item, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--wms-border)]/20 hover:bg-[var(--wms-surface-2)]/30 cursor-pointer h-[32px]"
                  >
                    <td className="px-2 text-[var(--wms-blue)] font-mono text-[10px] font-bold">
                      {safeText(item.ref)}
                    </td>
                    <td className="px-2 text-[var(--wms-text)] font-semibold">
                      {safeText(item.owner)}
                    </td>
                    <td className="px-2 font-mono text-[var(--wms-success)] font-bold">
                      {safeNum(item.profit).toLocaleString()}
                    </td>
                    <td className="px-2 font-mono text-[var(--wms-text-sec)] font-bold">
                      {safeNum(item.reserve).toLocaleString()}
                    </td>
                    <td className="px-2 font-mono font-bold text-[var(--wms-success)]">
                      {safeNum(item.remaining).toLocaleString()}
                    </td>
                    <td className="px-2">
                      <span className="inline-block px-1.5 py-0.5 rounded font-bold text-[9px] bg-amber-100 text-amber-700">
                        {safeText(item.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-start gap-1.5 px-1 pb-2 pt-1">
        <Info className="w-3 h-3 mt-0.5 shrink-0 text-[var(--wms-text-muted)] opacity-60" />
        <span className="text-[var(--wms-text-muted)] text-[10px] font-semibold opacity-70">
          هذا النظام يقرأ بياناته من المعاملات والتسويات والخزنة بشكل حي
          (Real-time). الأرقام تعكس الوضع التشغيلي اللحظي للنظام.
        </span>
      </div>
    </div>
  );
};

export default FinancialDashboardPage;
