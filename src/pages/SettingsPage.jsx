import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Save,
  X,
  Eye,
  AlertTriangle,
  Info,
  MapPin,
  Clock,
  Edit3,
  Plus,
  Calculator,
  HardDrive,
  Activity,
  Users,
  Trash2,
  RefreshCw,
  Link2,
  FileText,
  Banknote,
  UserCircle,
  PieChart,
  Crown,
  Handshake,
  User,
  Loader2,
  TrendingUp
} from "lucide-react";

const MAIN_TABS = [
  { id: "general", label: "عام" },
  { id: "districts", label: "الأحياء والقطاعات" },
  { id: "persons", label: "الأشخاص المرجعيين" },
  { id: "office-share", label: "حصة المكتب" },
  { id: "special-accounts", label: "الحسابات الخاصة" },
  { id: "delay", label: "التأخير" },
  { id: "tax", label: "التقدير الضريبي" },
];

export default function SettingsPage({ initialTab = "general" }) {
  const [mainTab, setMainTab] = useState(initialTab);

  return (
    <div
      className="p-4 space-y-4 font-sans bg-[var(--wms-bg-0)] min-h-screen"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            إعدادات النظام الشاملة
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            إدارة مالية، جغرافية، صلاحيات، وموارد.
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-2 pt-2 rounded-t-xl overflow-x-auto custom-scrollbar-slim">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMainTab(tab.id)}
            className={`px-4 py-3 whitespace-nowrap cursor-pointer transition-all border-b-2 ${
              mainTab === tab.id
                ? "text-blue-600 border-blue-600 font-bold bg-blue-50/50"
                : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
            }`}
            style={{ fontSize: 13 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white p-5 rounded-b-xl border border-gray-200 shadow-sm min-h-[60vh]">
        {mainTab === "general" && <GeneralTabContent />}
        {mainTab === "districts" && <DistrictsTabContent />}
        {mainTab === "persons" && <PersonsTabContent />}
        {mainTab === "office-share" && <OfficeShareTabContent />}
        {mainTab === "special-accounts" && <SpecialAccountsTabContent />}
        {mainTab === "delay" && <DelayTabContent />}
        {mainTab === "tax" && <TaxTabContent />}
        {mainTab === "backup" && <BackupTabContent />}
      </div>
    </div>
  );
}

// ============================================================================
// TABS COMPONENTS (CONNECTED TO BACKEND)
// ============================================================================

function GeneralTabContent() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => (await api.get("/settings")).data.data,
  });

  const [form, setForm] = useState({});
  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data) => await api.put("/settings", data),
    onSuccess: () => {
      toast.success("تم حفظ الإعدادات العامة");
      queryClient.invalidateQueries(["system-settings"]);
    },
  });

  if (isLoading)
    return (
      <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 my-10" />
    );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            اسم الشركة
          </label>
          <input
            type="text"
            value={form.companyName || ""}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            الرقم الضريبي
          </label>
          <input
            type="text"
            value={form.taxNumber || ""}
            onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
            className="w-full px-3 py-2 border rounded-md font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            العملة الافتراضية
          </label>
          <input
            type="text"
            value={form.currency || ""}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            المنطقة الزمنية
          </label>
          <input
            type="text"
            value={form.timezone || ""}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => updateMutation.mutate(form)}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold"
        >
          <Save className="w-4 h-4" /> حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}

function DelayTabContent() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => (await api.get("/settings")).data.data,
  });
  const [form, setForm] = useState({ warningDays: 5, overdueDays: 10 });
  useEffect(() => {
    if (settings)
      setForm({
        warningDays: settings.warningDays,
        overdueDays: settings.overdueDays,
      });
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data) => await api.put("/settings", data),
    onSuccess: () => {
      toast.success("تم حفظ مؤشرات التأخير");
      queryClient.invalidateQueries(["system-settings"]);
      queryClient.invalidateQueries(["system-settings-sidebar"]);
    },
  });

  if (isLoading)
    return (
      <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 my-10" />
    );

  return (
    <div className="space-y-6 animate-in fade-in max-w-3xl">
      <div className="grid grid-cols-2 gap-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
        <div>
          <label className="block text-gray-700 text-xs font-bold mb-2">
            فترة التنبيه (أيام)
          </label>
          <input
            type="number"
            value={form.warningDays}
            onChange={(e) => setForm({ ...form, warningDays: e.target.value })}
            className="bg-white border rounded-lg px-4 h-[40px] font-mono font-bold w-full"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-xs font-bold mb-2">
            الحد الأقصى للتأخير (أيام)
          </label>
          <input
            type="number"
            value={form.overdueDays}
            onChange={(e) => setForm({ ...form, overdueDays: e.target.value })}
            className="bg-white border rounded-lg px-4 h-[40px] font-mono font-bold w-full"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => updateMutation.mutate(form)}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold"
        >
          <Save className="w-4 h-4" /> حفظ
        </button>
      </div>
    </div>
  );
}

function TaxTabContent() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => (await api.get("/settings")).data.data,
  });
  const [form, setForm] = useState({
    taxEstimateEnabled: true,
    taxPercentage: 15,
    taxApplyTo: "",
    taxExclude: [],
    taxNotes: "",
  });

  useEffect(() => {
    if (settings)
      setForm({
        taxEstimateEnabled: settings.taxEstimateEnabled ?? true,
        taxPercentage: settings.taxPercentage ?? 15,
        taxApplyTo: settings.taxApplyTo ?? "",
        taxExclude: settings.taxExclude ?? [],
        taxNotes: settings.taxNotes ?? "",
      });
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data) => await api.put("/settings", data),
    onSuccess: () => {
      toast.success("تم حفظ إعدادات الضرائب");
      queryClient.invalidateQueries(["system-settings"]);
    },
  });

  if (isLoading)
    return (
      <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 my-10" />
    );

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl">
      <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <input
          type="checkbox"
          checked={form.taxEstimateEnabled}
          onChange={(e) =>
            setForm({ ...form, taxEstimateEnabled: e.target.checked })
          }
          className="w-5 h-5 accent-blue-600"
        />
        <span className="font-bold text-sm">تفعيل التقدير الضريبي الآلي</span>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-700 text-xs font-bold mb-2">
            نسبة الضريبة (%)
          </label>
          <input
            type="number"
            value={form.taxPercentage}
            onChange={(e) =>
              setForm({ ...form, taxPercentage: e.target.value })
            }
            className="bg-white border rounded-lg px-4 h-[40px] font-mono font-bold w-full"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-xs font-bold mb-2">
            تطبق على
          </label>
          <select
            value={form.taxApplyTo}
            onChange={(e) => setForm({ ...form, taxApplyTo: e.target.value })}
            className="bg-white border rounded-lg px-4 h-[40px] font-bold w-full"
          >
            <option>كل المبالغ البنكية</option>
            <option>التحصيلات البنكية فقط</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => updateMutation.mutate(form)}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold"
        >
          <Save className="w-4 h-4" /> حفظ الضرائب
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 💡 مكون حصة المكتب (تصميم ERP احترافي للمؤسسات)
// ============================================================================
function OfficeShareTabContent() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => (await api.get("/settings")).data.data,
  });

  const [form, setForm] = useState({
    officeShareType: "percentage",
    officeShareValue: 10,
    officeShareCategories: [], // شرائح الأرباح
    officeShareManual: false,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        officeShareType: settings.officeShareType || "percentage",
        officeShareValue: settings.officeShareValue || 10,
        officeShareCategories:
          Array.isArray(settings.officeShareCategories) &&
          settings.officeShareCategories.length > 0
            ? settings.officeShareCategories
            : [
                {
                  id: Date.now() + 1,
                  minAmount: 0,
                  maxAmount: 10000,
                  value: 10,
                  type: "percentage",
                },
                {
                  id: Date.now() + 2,
                  minAmount: 10001,
                  maxAmount: 50000,
                  value: 15,
                  type: "percentage",
                },
              ],
        officeShareManual: settings.officeShareManual || false,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data) => await api.put("/settings", data),
    onSuccess: () => {
      toast.success("تم حفظ استراتيجية حصة المكتب بنجاح");
      queryClient.invalidateQueries(["system-settings"]);
    },
    onError: () => toast.error("حدث خطأ أثناء الحفظ"),
  });

  const addCategory = () => {
    setForm({
      ...form,
      officeShareCategories: [
        ...form.officeShareCategories,
        {
          id: Date.now(),
          minAmount: 0,
          maxAmount: 0,
          value: 0,
          type: "percentage",
        },
      ],
    });
  };

  const removeCategory = (id) => {
    setForm({
      ...form,
      officeShareCategories: form.officeShareCategories.filter(
        (c) => c.id !== id,
      ),
    });
  };

  const updateCategory = (id, field, val) => {
    setForm({
      ...form,
      officeShareCategories: form.officeShareCategories.map((c) =>
        c.id === id ? { ...c, [field]: Number(val) || val } : c,
      ),
    });
  };

  if (isLoading)
    return (
      <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 my-10" />
    );

  return (
    <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto">
      {/* القسم الأول: الاستراتيجية العامة */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-[15px]">
              الاستراتيجية العامة لاستقطاع حصة المكتب
            </h3>
            <p className="text-gray-500 text-[11px] mt-0.5">
              تطبق هذه النسبة/المبلغ بشكل افتراضي على جميع المعاملات إذا لم يتم
              تفعيل الشرائح.
            </p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-8">
          <div>
            <label className="block text-gray-700 text-xs font-bold mb-3">
              طريقة الاقتطاع الأساسية
            </label>
            <div className="flex gap-4">
              <label
                className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${form.officeShareType === "percentage" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-200"}`}
              >
                <input
                  type="radio"
                  checked={form.officeShareType === "percentage"}
                  onChange={() =>
                    setForm({ ...form, officeShareType: "percentage" })
                  }
                  className="hidden"
                />
                <span
                  className={`text-xl font-black ${form.officeShareType === "percentage" ? "text-blue-700" : "text-gray-400"}`}
                >
                  %
                </span>
                <span
                  className={`text-xs font-bold ${form.officeShareType === "percentage" ? "text-blue-700" : "text-gray-600"}`}
                >
                  نسبة مئوية من الصافي
                </span>
              </label>
              <label
                className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${form.officeShareType === "fixed" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-200"}`}
              >
                <input
                  type="radio"
                  checked={form.officeShareType === "fixed"}
                  onChange={() =>
                    setForm({ ...form, officeShareType: "fixed" })
                  }
                  className="hidden"
                />
                <span
                  className={`text-xl font-black ${form.officeShareType === "fixed" ? "text-blue-700" : "text-gray-400"}`}
                >
                  ر.س
                </span>
                <span
                  className={`text-xs font-bold ${form.officeShareType === "fixed" ? "text-blue-700" : "text-gray-600"}`}
                >
                  مبلغ ثابت مقطوع
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <label className="block text-gray-700 text-xs font-bold mb-3">
              القيمة الافتراضية
            </label>
            <div className="relative">
              <input
                type="number"
                value={form.officeShareValue}
                onChange={(e) =>
                  setForm({ ...form, officeShareValue: Number(e.target.value) })
                }
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-12 pr-4 h-[64px] font-mono font-black text-2xl text-blue-700 focus:border-blue-500 outline-none transition-colors"
                dir="ltr"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                {form.officeShareType === "percentage" ? "%" : "SAR"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* القسم الثاني: نظام الشرائح الديناميكي (ERP Style) */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-[15px]">
                نظام الشرائح الديناميكي (متقدم)
              </h3>
              <p className="text-gray-500 text-[11px] mt-0.5">
                تجاوز القيمة الافتراضية وتطبيق نسب مختلفة بناءً على حجم صافي
                الربح للمعاملة.
              </p>
            </div>
          </div>
          <button
            onClick={addCategory}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> إضافة شريحة
          </button>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-bold text-gray-600">من (ر.س)</th>
                <th className="px-4 py-3 font-bold text-gray-600">إلى (ر.س)</th>
                <th className="px-4 py-3 font-bold text-gray-600">
                  نوع الاقتطاع
                </th>
                <th className="px-4 py-3 font-bold text-gray-600">القيمة</th>
                <th className="px-4 py-3 font-bold text-gray-600 text-center">
                  إجراء
                </th>
              </tr>
            </thead>
            <tbody>
              {form.officeShareCategories.map((cat, i) => (
                <tr
                  key={cat.id}
                  className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={cat.minAmount}
                      onChange={(e) =>
                        updateCategory(cat.id, "minAmount", e.target.value)
                      }
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono font-bold outline-none focus:border-purple-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={cat.maxAmount}
                      onChange={(e) =>
                        updateCategory(cat.id, "maxAmount", e.target.value)
                      }
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono font-bold outline-none focus:border-purple-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={cat.type}
                      onChange={(e) =>
                        updateCategory(cat.id, "type", e.target.value)
                      }
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 font-bold outline-none focus:border-purple-500"
                    >
                      <option value="percentage">نسبة مئوية (%)</option>
                      <option value="fixed">مبلغ ثابت (ر.س)</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <input
                        type="number"
                        value={cat.value}
                        onChange={(e) =>
                          updateCategory(cat.id, "value", e.target.value)
                        }
                        className="w-full bg-white border border-gray-300 rounded-lg pr-8 pl-3 py-2 font-mono font-black text-purple-700 outline-none focus:border-purple-500"
                        dir="ltr"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-[10px]">
                        {cat.type === "percentage" ? "%" : "SAR"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => removeCategory(cat.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {form.officeShareCategories.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-10 text-gray-400 font-bold bg-gray-50/50"
                  >
                    لا توجد شرائح ديناميكية، سيتم الاعتماد على النسبة الافتراضية
                    فقط.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* خيار التعديل اليدوي والتذييل */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.officeShareManual}
            onChange={(e) =>
              setForm({ ...form, officeShareManual: e.target.checked })
            }
            className="w-5 h-5 accent-blue-600 rounded border-gray-300"
          />
          <div>
            <span className="font-bold text-gray-800 text-sm block">
              السماح للمحاسب بتعديل الحصة يدوياً داخل المعاملة
            </span>
            <span className="text-gray-500 text-[10px]">
              إذا تم التفعيل، يمكن للمحاسب تجاوز كل القواعد أعلاه وكتابة مبلغ
              مخصص.
            </span>
          </div>
        </label>

        <button
          onClick={() => updateMutation.mutate(form)}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-blue-500/30 transition-all disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          حفظ استراتيجية المكتب
        </button>
      </div>
    </div>
  );
}

function SpecialAccountsTabContent() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => (await api.get("/settings")).data.data,
  });
  const { data: persons = [] } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => (await api.get("/persons")).data.data,
  });

  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (settings?.specialAccounts) setAccounts(settings.specialAccounts);
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async () =>
      await api.put("/settings", { specialAccounts: accounts }),
    onSuccess: () => {
      toast.success("تم تحديث الحسابات الخاصة وربط الأشخاص بنجاح");
      queryClient.invalidateQueries(["system-settings"]);
      queryClient.invalidateQueries(["system-settings-sidebar"]);
    },
  });

  const updateAcc = (id, field, val) =>
    setAccounts(
      accounts.map((a) => (a.id === id ? { ...a, [field]: val } : a)),
    );
  const addNewAccount = () =>
    setAccounts([
      ...accounts,
      {
        id: Date.now(),
        systemName: "حساب جديد",
        reportName: "اسم التقرير",
        linkedPersons: [],
      },
    ]);
  const removeAccount = (id) =>
    setAccounts(accounts.filter((a) => a.id !== id));

  const togglePersonLink = (accId, personId) => {
    setAccounts(
      accounts.map((acc) => {
        if (acc.id !== accId) return acc;
        const linked = acc.linkedPersons || [];
        return {
          ...acc,
          linkedPersons: linked.includes(personId)
            ? linked.filter((id) => id !== personId)
            : [...linked, personId],
        };
      }),
    );
  };

  if (isLoading)
    return (
      <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 my-10" />
    );

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl">
      <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-blue-800">
            إدارة الحاويات (الحسابات الخاصة)
          </h3>
          <p className="text-xs text-blue-600/80 mt-1">
            تجميع عدة أشخاص (وسطاء، معقبين، موظفين) تحت حساب واحد لعرضهم في شاشة
            وتقارير موحدة.
          </p>
        </div>
        <button
          onClick={addNewAccount}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> إضافة حاوية جديدة
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-right text-xs">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr className="h-[40px]">
              <th className="px-4 font-bold text-gray-600 w-[20%]">
                الاسم البرمجي
              </th>
              <th className="px-4 font-bold text-gray-600 w-[20%]">
                اسم العرض
              </th>
              <th className="px-4 font-bold text-gray-600 w-[50%]">
                الأشخاص المربوطين بالحاوية
              </th>
              <th className="px-4 font-bold text-gray-600 text-center w-[10%]">
                حذف
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, i) => (
              <tr
                key={acc.id}
                className={`border-b border-gray-100 ${i % 2 === 1 ? "bg-gray-50/30" : "bg-white"}`}
              >
                <td className="px-4 py-3">
                  <input
                    value={acc.systemName}
                    onChange={(e) =>
                      updateAcc(acc.id, "systemName", e.target.value)
                    }
                    className="w-full bg-white border border-gray-300 rounded-lg px-2 h-[34px] outline-none focus:border-blue-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    value={acc.reportName}
                    onChange={(e) =>
                      updateAcc(acc.id, "reportName", e.target.value)
                    }
                    className="w-full bg-blue-50/50 border border-blue-200 rounded-lg px-2 h-[34px] font-bold text-blue-700 outline-none focus:border-blue-500"
                  />
                </td>
                <td className="px-4 py-3">
                  {/* حاوية لاختيار الأشخاص */}
                  <div className="h-24 overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg p-2 custom-scrollbar-slim grid grid-cols-2 gap-2">
                    {persons.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-200 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          className="accent-blue-600"
                          checked={(acc.linkedPersons || []).includes(p.id)}
                          onChange={() => togglePersonLink(acc.id, p.id)}
                        />
                        <span className="text-[11px] font-bold text-gray-700 truncate">
                          {p.name}{" "}
                          <span className="text-[9px] text-gray-400">
                            ({p.role})
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </td>
                <td className="px-4 text-center">
                  <button
                    onClick={() => removeAccount(acc.id)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={() => updateMutation.mutate()}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 hover:bg-black text-white rounded-lg font-bold shadow-sm transition-colors"
        >
          <Save className="w-4 h-4" /> حفظ الحاويات
        </button>
      </div>
    </div>
  );
}

function PersonsTabContent() {
  const queryClient = useQueryClient();
  const [role, setRole] = useState("وسيط");
  const { data: persons = [], isLoading } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => (await api.get("/persons")).data.data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/persons/${id}`),
    onSuccess: () => {
      toast.success("تم الحذف");
      queryClient.invalidateQueries(["persons-directory"]);
    },
  });

  const filtered = persons.filter((p) => p.role === role);

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex gap-2 border-b mb-4">
        {["وسيط", "معقب", "صاحب مصلحة"].map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`p-2 font-bold text-sm border-b-2 ${role === r ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
          >
            {r}
          </button>
        ))}
      </div>
      {isLoading ? (
        <Loader2 className="animate-spin mx-auto text-blue-500" />
      ) : (
        <table className="w-full text-right text-xs bg-white border rounded-xl overflow-hidden shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">الاسم</th>
              <th className="p-3">الجوال</th>
              <th className="p-3 text-center">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-3 font-bold">{p.name}</td>
                <td className="p-3 font-mono">{p.phone || "—"}</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => {
                      if (window.confirm("حذف؟")) deleteMutation.mutate(p.id);
                    }}
                    className="text-red-500 p-1 bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="3" className="p-6 text-center text-gray-400">
                  لا يوجد بيانات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DistrictsTabContent() {
  const queryClient = useQueryClient();
  const { data: zones = [], isLoading } = useQuery({
    queryKey: ["riyadhZones"],
    queryFn: async () => (await api.get("/riyadh-zones")).data.data,
  });

  const [newDistrict, setNewDistrict] = useState("");
  const [selectedSector, setSelectedSector] = useState("");

  const addMutation = useMutation({
    mutationFn: async () =>
      api.post("/riyadh-zones/districts", {
        name: newDistrict,
        sectorId: selectedSector,
      }),
    onSuccess: () => {
      toast.success("تم إضافة الحي");
      setNewDistrict("");
      queryClient.invalidateQueries(["riyadhZones"]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/riyadh-zones/districts/${id}`),
    onSuccess: () => {
      toast.success("تم الحذف");
      queryClient.invalidateQueries(["riyadhZones"]);
    },
  });

  if (isLoading)
    return <Loader2 className="animate-spin mx-auto text-blue-500" />;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border">
        <input
          type="text"
          placeholder="اسم الحي الجديد"
          value={newDistrict}
          onChange={(e) => setNewDistrict(e.target.value)}
          className="border p-2 rounded text-sm flex-1"
        />
        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="border p-2 rounded text-sm w-48"
        >
          <option value="">اختر القطاع</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => addMutation.mutate()}
          disabled={!newDistrict || !selectedSector || addMutation.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold disabled:opacity-50"
        >
          <Plus className="w-4 h-4 inline" />
        </button>
      </div>
      <table className="w-full text-right text-xs bg-white border rounded-xl overflow-hidden shadow-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">القطاع</th>
            <th className="p-3">الأحياء</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((z) => (
            <tr key={z.id} className="border-b align-top">
              <td className="p-4 font-bold text-gray-800 w-32 border-l bg-gray-50/50">
                قطاع {z.name}
              </td>
              <td className="p-4 flex flex-wrap gap-2">
                {z.districts.map((d) => (
                  <div
                    key={d.id}
                    className="bg-blue-50 border border-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    <span className="font-bold">{d.name}</span>
                    <button
                      onClick={() => {
                        if (window.confirm("حذف الحي؟"))
                          deleteMutation.mutate(d.id);
                      }}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {z.districts.length === 0 && (
                  <span className="text-gray-400 text-xs">
                    لا يوجد أحياء مسجلة
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BackupTabContent() {
  return (
    <div className="p-10 text-center border-2 border-dashed rounded-xl bg-gray-50">
      <HardDrive className="w-10 h-10 mx-auto text-gray-400 mb-2" /> سيتم ربط
      هذا القسم لاحقاً مع سكربت أخذ النسخ الاحتياطية.
    </div>
  );
}
