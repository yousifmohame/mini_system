import React, { useState, useMemo } from "react";
import {
  Eye,
  Info,
  HandCoins,
  Send,
  FileText,
  Plus,
  Search,
  TrendingUp,
  AlertTriangle,
  UserPlus,
  Loader2,
  Layers,
  Users,
  CheckCircle2,
  User
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

// استيراد المكونات الإضافية (تأكد من مساراتها في مشروعك)
import {
  DevInstructionsPanel,
  SETTLEMENT_INSTRUCTIONS,
} from "../components/DevInstructionsPanel";
import { ReportPreviewModal } from "../components/ReportPreviewModal";
import { RecordSettlementModal } from "../components/RecordSettlementModal";
import { SettlementDeliveryModal } from "../components/SettlementDeliveryModal";
import { SettlementExportModal } from "../components/SettlementExportModal";
import { AddPersonModal } from "../components/AddPersonModal";
import { usePrivacy } from "../context/PrivacyContext";

export function ScreenSpecialAccount({ accountName }) {
  const [activeTab, setActiveTab] = useState("main");
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [showRecordSettlement, setShowRecordSettlement] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(null);
  const [search, setSearch] = useState("");

  const { maskName, maskAmount } = usePrivacy?.() || {
    maskName: (v) => v,
    maskAmount: (v) => String(v),
  };

  // ============================================================================
  // 💡 Data Fetching (جلب البيانات المجمعة للحاوية والأشخاص المرتبطين)
  // ============================================================================

  // 1. جلب البيانات المالية والمعاملات للحاوية
  const { data: containerData, isLoading: isDataLoading } = useQuery({
    queryKey: ["special-account-data", accountName],
    queryFn: async () => {
      const res = await api.get(
        `/private-settlements/special-account/${accountName}`,
      );
      return (
        res.data?.data || { transactions: [], settlements: [], payments: [] }
      );
    },
    enabled: !!accountName,
  });

  const {
    transactions = [],
    settlements = [],
    payments = [],
  } = containerData || {};

  // 2. لمعرفة من هم الأشخاص المرتبطين، نجلب إعدادات النظام ثم دليل الأشخاص
  const { data: settings } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => (await api.get("/settings")).data.data,
  });

  const { data: allPersons = [] } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => (await api.get("/persons")).data.data,
  });

  // استخراج الأشخاص المرتبطين بهذه الحاوية تحديداً
  const linkedPersonsDetails = useMemo(() => {
    if (!settings?.specialAccounts) return [];
    const accountsArray =
      typeof settings.specialAccounts === "string"
        ? JSON.parse(settings.specialAccounts)
        : settings.specialAccounts;
    const targetContainer = accountsArray.find(
      (a) => a.reportName === accountName || a.systemName === accountName,
    );
    if (!targetContainer || !targetContainer.linkedPersons) return [];

    return allPersons.filter((p) =>
      targetContainer.linkedPersons.includes(p.id),
    );
  }, [settings, allPersons, accountName]);

  // ============================================================================
  // 💡 Calculations & Derived Data
  // ============================================================================

  const filteredTxs = useMemo(() => {
    return transactions.filter(
      (t) =>
        t.client?.includes(search) ||
        t.ref?.includes(search) ||
        t.district?.includes(search) ||
        t.type?.includes(search),
    );
  }, [transactions, search]);

  const summaryCards = useMemo(() => {
    const totalEntitlement = settlements.reduce((sum, s) => sum + s.amount, 0);
    const totalDelivered = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalRemaining = totalEntitlement - totalDelivered;

    return [
      {
        label: "إجمالي المستحقات للحاوية",
        value: totalEntitlement,
        color: "#2563eb",
        bg: "rgba(37,99,235,0.08)",
      },
      {
        label: "إجمالي ما تم صرفه للجهات",
        value: totalDelivered,
        color: "#16a34a",
        bg: "rgba(22,163,74,0.08)",
      },
      {
        label: "الرصيد المعلق (المديونية)",
        value: totalRemaining,
        color: totalRemaining > 0 ? "#dc2626" : "#64748b",
        bg:
          totalRemaining > 0
            ? "rgba(220,38,38,0.08)"
            : "rgba(100,116,139,0.08)",
      },
      {
        label: "الأطراف المرتبطة",
        value: linkedPersonsDetails.length,
        color: "#d97706",
        bg: "rgba(217,119,6,0.08)",
        isNumber: true,
      },
      {
        label: "إجمالي المعاملات المربوطة",
        value: transactions.length,
        color: "#7c3aed",
        bg: "rgba(124,58,237,0.08)",
        isNumber: true,
      },
    ];
  }, [transactions, settlements, payments, linkedPersonsDetails]);

  return (
    <div className="space-y-4 font-sans" dir="rtl">
      {/* Header Badge */}
      <div className="flex items-center gap-3 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
        <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
          <Layers className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <div className="text-gray-800 text-[18px] font-black">
            {accountName}
          </div>
          <div className="text-[12px] text-gray-500 font-bold flex items-center gap-1.5 mt-0.5">
            <Users className="w-3.5 h-3.5" /> حاوية مالية وتشغيلية مجمعة (تشمل
            بيانات عدة أطراف)
          </div>
        </div>
      </div>

      {/* Enterprise Summary Strip */}
      <div className="grid grid-cols-5 gap-3">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            className="p-3 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col justify-center"
          >
            <div className="text-gray-500 font-bold text-[10px] mb-1">
              {c.label}
            </div>
            <div
              className="font-mono text-[18px] font-black"
              style={{ color: c.color }}
            >
              {c.isNumber ? c.value : maskAmount(c.value.toLocaleString())}
              {!c.isNumber && (
                <span className="text-[10px] font-bold ml-1 text-gray-400">
                  ر.س
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Actions (التصميم الاحترافي الشامل) */}
      <div className="flex items-center gap-2 flex-wrap bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
        <button
          onClick={() => setActiveTab("main")}
          className={`px-4 py-2 rounded-lg cursor-pointer transition-colors text-xs font-bold ${activeTab === "main" ? "bg-gray-800 text-white shadow-md" : "bg-transparent text-gray-600 hover:bg-gray-100"}`}
        >
          المعاملات المجمعة
        </button>
        <button
          onClick={() => setActiveTab("linked_persons")}
          className={`px-4 py-2 rounded-lg cursor-pointer transition-colors text-xs font-bold flex items-center gap-1.5 ${activeTab === "linked_persons" ? "bg-gray-800 text-white shadow-md" : "bg-transparent text-gray-600 hover:bg-gray-100"}`}
        >
          <Users className="w-3.5 h-3.5" /> الأطراف المرتبطة
        </button>
        <button
          onClick={() => setActiveTab("settlements")}
          className={`px-4 py-2 rounded-lg cursor-pointer transition-colors text-xs font-bold ${activeTab === "settlements" ? "bg-gray-800 text-white shadow-md" : "bg-transparent text-gray-600 hover:bg-gray-100"}`}
        >
          التسويات (المستحقات)
        </button>
        <button
          onClick={() => setActiveTab("collections")}
          className={`px-4 py-2 rounded-lg cursor-pointer transition-colors text-xs font-bold ${activeTab === "collections" ? "bg-gray-800 text-white shadow-md" : "bg-transparent text-gray-600 hover:bg-gray-100"}`}
        >
          الصرف والمدفوعات
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 rounded-lg cursor-pointer transition-colors text-xs font-bold ${activeTab === "analytics" ? "bg-gray-800 text-white shadow-md" : "bg-transparent text-gray-600 hover:bg-gray-100"}`}
        >
          مؤشرات الأداء
        </button>

        <div className="flex-1"></div>

        {/* Action Buttons */}
        <button
          onClick={() => setShowRecordSettlement(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors text-xs font-bold"
        >
          <HandCoins className="w-4 h-4" /> <span>تسجيل استحقاق</span>
        </button>
        <button
          onClick={() => setShowDeliveryModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors text-xs font-bold"
        >
          <Send className="w-4 h-4" /> <span>صرف مبلغ</span>
        </button>
        <button
          onClick={() => setShowReportPreview(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors text-xs font-bold"
        >
          <Eye className="w-4 h-4 text-blue-500" /> <span>معاينة</span>
        </button>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors text-xs font-bold"
        >
          <FileText className="w-4 h-4 text-purple-500" />{" "}
          <span>إصدار تقرير</span>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Add Person Shortcuts */}
        <button
          onClick={() => setShowAddPerson("معقب")}
          className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-colors text-[11px] font-bold"
        >
          <UserPlus className="w-3.5 h-3.5" /> معقب
        </button>
        <button
          onClick={() => setShowAddPerson("وسيط")}
          className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-green-600 transition-colors text-[11px] font-bold"
        >
          <UserPlus className="w-3.5 h-3.5" /> وسيط
        </button>
        <button
          onClick={() => setShowAddPerson("صاحب مصلحة")}
          className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-amber-600 transition-colors text-[11px] font-bold"
        >
          <UserPlus className="w-3.5 h-3.5" /> مصلحة
        </button>
      </div>

      {/* ================================================== */}
      {/* 💡 محتوى التابات (Tab Contents) */}
      {/* ================================================== */}

      {isDataLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <span className="text-gray-500 font-bold text-sm">
            جاري جلب وتجميع بيانات الحاوية...
          </span>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in duration-300">
          {/* 1. Main Tab: Transactions */}
          {activeTab === "main" && (
            <div>
              <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="relative w-72">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث برقم المعاملة، اسم المالك، الحي..."
                    className="w-full pr-9 pl-3 py-2 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-xs font-bold"
                  />
                </div>
                <span className="text-xs font-bold text-gray-500">
                  إجمالي: {filteredTxs.length} معاملة مرتبطة بالحاوية
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gray-100 border-b-2 border-gray-200">
                    <tr className="h-[40px]">
                      {[
                        "رقم المعاملة",
                        "اسم المالك",
                        "الحي",
                        "نوع المعاملة",
                        "إجمالي أتعاب المكتب",
                        "المتبقي للتحصيل",
                        "حالة الملف",
                        "تاريخ التسجيل",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 font-bold text-gray-700 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxs.map((tx, i) => (
                      <tr
                        key={tx.ref}
                        className={`border-b border-gray-100 hover:bg-blue-50/50 cursor-pointer transition-colors h-[48px] ${i % 2 === 1 ? "bg-gray-50/30" : "bg-white"}`}
                      >
                        <td className="px-4 font-mono font-bold text-blue-700 text-[13px]">
                          {tx.ref}
                        </td>
                        <td className="px-4 font-bold text-gray-900">
                          {maskName(tx.client)}
                        </td>
                        <td className="px-4 text-gray-600 font-semibold">
                          {tx.district}
                        </td>
                        <td className="px-4 text-gray-700 font-bold">
                          {tx.type}
                        </td>
                        <td className="px-4 font-mono font-bold text-gray-800 text-[13px]">
                          {tx.totalFees.toLocaleString()}
                        </td>
                        <td className="px-4 font-mono font-bold text-red-600 text-[13px]">
                          {tx.remainingAmount.toLocaleString()}
                        </td>
                        <td className="px-4">
                          <span className="bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-md text-[10px] font-bold">
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-4 text-gray-500 font-mono text-[11px]">
                          {tx.date}
                        </td>
                      </tr>
                    ))}
                    {filteredTxs.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-12 text-gray-400 font-bold text-sm"
                        >
                          لا توجد معاملات مطابقة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. NEW TAB: Linked Persons (الأطراف المرتبطة) */}
          {activeTab === "linked_persons" && (
            <div>
              <div className="p-4 border-b border-gray-200 bg-blue-50/30 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-blue-800">
                  هؤلاء هم الأشخاص المجمّعة أرقامهم وحساباتهم داخل هذه الحاوية
                  (يتم إدارتهم من صفحة الإعدادات).
                </span>
              </div>
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr className="h-[40px]">
                    <th className="px-5 font-bold text-gray-700">اسم الطرف</th>
                    <th className="px-5 font-bold text-gray-700">
                      الدور الوظيفي / الصلاحية
                    </th>
                    <th className="px-5 font-bold text-gray-700">
                      رقم التواصل
                    </th>
                    <th className="px-5 font-bold text-gray-700">
                      الهوية الوطنية
                    </th>
                    <th className="px-5 font-bold text-gray-700">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {linkedPersonsDetails.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`border-b border-gray-100 h-[48px] ${i % 2 === 1 ? "bg-gray-50/30" : "bg-white"}`}
                    >
                      <td className="px-5 font-bold text-gray-900 text-[13px] flex items-center gap-2 h-[48px]">
                        <User className="w-4 h-4 text-gray-400" /> {p.name}
                      </td>
                      <td className="px-5">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md font-bold text-[11px]">
                          {p.role}
                        </span>
                      </td>
                      <td className="px-5 font-mono text-gray-600 text-[13px] tracking-wider">
                        {p.phone || "—"}
                      </td>
                      <td className="px-5 font-mono text-gray-500 text-[12px]">
                        {p.idNumber || "—"}
                      </td>
                      <td className="px-5">
                        <span className="flex items-center gap-1.5 text-green-600 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                          {p.status || "نشط"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {linkedPersonsDetails.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-12 text-gray-400 font-bold text-sm"
                      >
                        لا يوجد أشخاص مرتبطين بهذه الحاوية حالياً. (يمكنك ربطهم
                        من الإعدادات)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Settlements Tab */}
          {activeTab === "settlements" && (
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr className="h-[40px]">
                  {[
                    "الرقم المرجعي",
                    "التاريخ",
                    "النوع",
                    "المبلغ المستحق (له)",
                    "ملاحظات وتفاصيل",
                  ].map((h) => (
                    <th key={h} className="px-5 font-bold text-gray-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {settlements.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors h-[44px] ${i % 2 === 1 ? "bg-gray-50/30" : "bg-white"}`}
                  >
                    <td className="px-5 font-mono text-blue-700 font-bold">
                      {s.ref}
                    </td>
                    <td className="px-5 font-mono text-gray-500 text-[11px]">
                      {s.date}
                    </td>
                    <td className="px-5 font-bold text-gray-700">
                      <span className="bg-gray-200 text-gray-700 px-2.5 py-1 rounded-md text-[10px]">
                        {s.type}
                      </span>
                    </td>
                    <td className="px-5 font-mono text-green-700 font-black text-[14px]">
                      {s.amount.toLocaleString()}
                    </td>
                    <td className="px-5 text-gray-600">{s.notes}</td>
                  </tr>
                ))}
                {settlements.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-12 text-gray-400 font-bold text-sm"
                    >
                      لا توجد تسويات مستحقة مسجلة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* 4. Payments Tab */}
          {activeTab === "collections" && (
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr className="h-[40px]">
                  {[
                    "الرقم المرجعي",
                    "التاريخ",
                    "طريقة الدفع",
                    "المبلغ المُسلّم",
                    "الموظف المسلِّم",
                  ].map((h) => (
                    <th key={h} className="px-5 font-bold text-gray-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors h-[44px] ${i % 2 === 1 ? "bg-gray-50/30" : "bg-white"}`}
                  >
                    <td className="px-5 font-mono text-blue-700 font-bold">
                      {p.ref}
                    </td>
                    <td className="px-5 font-mono text-gray-500 text-[11px]">
                      {p.date}
                    </td>
                    <td className="px-5 font-bold text-gray-700">{p.method}</td>
                    <td className="px-5 font-mono font-black text-red-600 text-[14px]">
                      {p.amount.toLocaleString()}
                    </td>
                    <td className="px-5 text-gray-700 font-bold">
                      {p.deliveredBy}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-12 text-gray-400 font-bold text-sm"
                    >
                      لا توجد مبالغ مسلمة / مصروفة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* 5. Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="p-6 grid grid-cols-2 gap-6 bg-gray-50">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 text-gray-800 text-[15px] font-black border-b border-gray-100 pb-3">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span>التدفق النقدي للحاوية</span>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      label: "إجمالي المستحقات المضافة (دائن)",
                      value: summaryCards[0].value,
                      color: "#2563eb",
                      bg: "rgba(37,99,235,0.05)",
                    },
                    {
                      label: "إجمالي ما تم تسليمه فعلياً (مدين)",
                      value: summaryCards[1].value,
                      color: "#16a34a",
                      bg: "rgba(22,163,74,0.05)",
                    },
                    {
                      label: "الرصيد المتبقي (المطلوب سداده)",
                      value: summaryCards[2].value,
                      color: "#dc2626",
                      bg: "rgba(220,38,38,0.05)",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200"
                      style={{ backgroundColor: item.bg }}
                    >
                      <span className="text-gray-700 font-bold text-xs">
                        {item.label}
                      </span>
                      <span
                        className="font-mono font-black text-[16px]"
                        style={{ color: item.color }}
                      >
                        {item.value.toLocaleString()}{" "}
                        <span className="text-[10px]">ر.س</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 text-gray-800 text-[15px] font-black border-b border-gray-100 pb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>تنبيهات ومتابعات عاجلة</span>
                </div>
                <div className="space-y-3 overflow-y-auto max-h-[250px] custom-scrollbar-slim pr-2">
                  {transactions
                    .filter((t) => t.paidAmount < t.totalFees)
                    .map((tx) => (
                      <div
                        key={tx.ref}
                        className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="text-gray-800 text-[12px] font-bold">
                            {tx.client}
                          </div>
                          <div className="text-amber-700/80 font-bold text-[10px] mt-1">
                            المتبقي من العميل للشركة:{" "}
                            <span className="font-mono text-amber-600">
                              {(tx.totalFees - tx.paidAmount).toLocaleString()}{" "}
                              ر.س
                            </span>
                          </div>
                        </div>
                        <button
                          className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md font-bold hover:bg-blue-100 transition-colors text-[10px]"
                          onClick={() => toast.info(`فتح ${tx.ref}`)}
                        >
                          عرض
                        </button>
                      </div>
                    ))}
                  {transactions.filter((t) => t.paidAmount < t.totalFees)
                    .length === 0 && (
                    <div className="text-center text-gray-400 font-bold py-10 border-2 border-dashed border-gray-100 rounded-xl text-[12px]">
                      جميع معاملات الحاوية محصلة بالكامل.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals & Subcomponents */}
      {DevInstructionsPanel && (
        <DevInstructionsPanel
          screenName={`حساب مجمع: ${accountName}`}
          sections={SETTLEMENT_INSTRUCTIONS}
        />
      )}
      {showReportPreview && ReportPreviewModal && (
        <ReportPreviewModal
          type="special-account"
          title={`تقرير حساب: ${accountName}`}
          onClose={() => setShowReportPreview(false)}
          personName={accountName}
          period="شامل جميع الأطراف المربوطة"
        />
      )}
      {showRecordSettlement && RecordSettlementModal && (
        <RecordSettlementModal onClose={() => setShowRecordSettlement(false)} />
      )}
      {showDeliveryModal && SettlementDeliveryModal && (
        <SettlementDeliveryModal onClose={() => setShowDeliveryModal(false)} />
      )}
      {showExportModal && SettlementExportModal && (
        <SettlementExportModal
          title={`تقرير حساب: ${accountName}`}
          onClose={() => setShowExportModal(false)}
        />
      )}
      {showAddPerson && AddPersonModal && (
        <AddPersonModal
          type={showAddPerson}
          onClose={() => setShowAddPerson(null)}
        />
      )}
    </div>
  );
}
