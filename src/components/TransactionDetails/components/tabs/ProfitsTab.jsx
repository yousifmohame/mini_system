import React from "react";
import { Check, TriangleAlert, Briefcase, Crown } from "lucide-react";

export const ProfitsTab = ({
  isSettlementComplete,
  setActiveTab,
  officeShareLabel,
  officeShareAmount,
  safeText,
  tx,
  sourcePercent,
  sourceShare,
  partnersDistribution,
}) => {
  return (
    <div className="p-4 space-y-4 animate-in fade-in">
      {!isSettlementComplete && (
        <div
          className="flex items-center gap-2 p-2.5 rounded-lg border"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.06)",
            borderColor: "rgba(239, 68, 68, 0.2)",
          }}
        >
          <TriangleAlert className="w-5 h-5 shrink-0 text-red-500" />
          <div className="flex-1">
            <span
              className="text-red-600 block"
              style={{ fontSize: "12px", fontWeight: 700 }}
            >
              التسوية غير مكتملة
            </span>
            <span className="text-gray-500 block" style={{ fontSize: "11px" }}>
              لا يمكن توزيع الأرباح فعلياً قبل إتمام تسوية جميع التكاليف
              التشغيلية. (الأرقام أدناه استرشادية).
            </span>
          </div>
          <button
            onClick={() => setActiveTab("settlement")}
            className="px-3 py-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            style={{ fontSize: "11px", fontWeight: 700 }}
          >
            الذهاب للتسوية
          </button>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-gray-800 text-[14px]">
            توزيع الأرباح النهائي والتصفيات
          </span>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> النظام الآلي مُفعل
          </span>
        </div>
        <table className="w-full text-[12px] text-right border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="p-3 font-bold text-gray-700">البند / الشريك</th>
              <th className="p-3 font-bold text-gray-700">النسبة / القاعدة</th>
              <th className="p-3 font-bold text-gray-700">المستحق (ر.س)</th>
            </tr>
          </thead>
          <tbody>
            {/* 💡 صف حصة المكتب الديناميكية */}
            <tr className="border-b bg-blue-50/40">
              <td className="p-3 font-bold text-blue-800 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> حصة المكتب (اقتطاع آلي)
              </td>
              <td className="p-3 font-mono font-bold text-blue-600">
                {officeShareLabel}{" "}
                {/* 👈 سيطبع هنا 10% أو 15% أو مبلغ ثابت حسب الشريحة */}
              </td>
              <td className="p-3 font-mono font-bold text-blue-800">
                {officeShareAmount.toLocaleString()}
              </td>
            </tr>

            <tr className="border-b bg-purple-50/30">
              <td className="p-3 font-bold text-purple-700 flex items-center gap-2">
                <Crown className="w-4 h-4" /> المصدر:{" "}
                {safeText(tx.sourceName || tx.source)}
              </td>
              <td className="p-3 font-mono font-bold text-purple-600">
                {sourcePercent}%{" "}
                <span className="text-[9px] text-gray-400 font-sans">
                  (من المتبقي)
                </span>
              </td>
              <td className="p-3 font-mono font-bold text-purple-800">
                {sourceShare.toLocaleString()}
              </td>
            </tr>

            {/* 💡 صفوف الشركاء */}
            {partnersDistribution.map((p, idx) => (
              <tr
                key={p.id}
                className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <td className="p-3 font-bold text-gray-800">{p.name}</td>
                <td className="p-3 font-mono font-bold text-green-600">
                  {p.percent}%
                </td>
                <td className="p-3 font-mono font-bold text-gray-800">
                  {p.finalAmount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
