import React from "react";
import { Banknote, Plus, Trash2, User } from "lucide-react";

export const PaymentsTab = ({
  setIsAddPaymentOpen,
  totalFees,
  totalPaid,
  remaining,
  collectionPercent,
  safePayments,
  formatDateTime,
  safeNum,
  deletePaymentMutation,
}) => {
  return (
    <div className="p-4 space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <span className="text-[16px] font-black text-gray-800 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-green-600" /> سجل التحصيلات المالية
          من العميل
        </span>
        <button
          onClick={() => setIsAddPaymentOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-xs font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> إضافة دفعة تحصيل جديدة
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm text-center">
          <div className="text-gray-500 text-xs font-bold mb-1">
            إجمالي الأتعاب
          </div>
          <div className="font-mono text-2xl font-black text-gray-800">
            {totalFees.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-green-200 bg-green-50 shadow-sm text-center">
          <div className="text-green-700 text-xs font-bold mb-1">تم تحصيله</div>
          <div className="font-mono text-2xl font-black text-green-700">
            {totalPaid.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 shadow-sm text-center">
          <div className="text-red-700 text-xs font-bold mb-1">المتبقي</div>
          <div className="font-mono text-2xl font-black text-red-700">
            {remaining.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 shadow-sm text-center">
          <div className="text-blue-700 text-xs font-bold mb-1">
            نسبة التحصيل
          </div>
          <div className="font-mono text-2xl font-black text-blue-700">
            {collectionPercent}%
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-xs text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-bold text-gray-600">التاريخ</th>
              <th className="px-4 py-3 font-bold text-gray-600">المبلغ</th>
              <th className="px-4 py-3 font-bold text-gray-600">
                طريقة الدفع/المرجع
              </th>
              <th className="px-4 py-3 font-bold text-gray-600">المُحصّل</th>
              <th className="px-4 py-3 font-bold text-gray-600 text-center">
                إجراء
              </th>
            </tr>
          </thead>
          <tbody>
            {safePayments.length > 0 ? (
              safePayments.map((p, i) => (
                <tr
                  key={p.id || i}
                  className="border-b border-gray-100 hover:bg-green-50/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-gray-600">
                    {formatDateTime(p.date || p.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-green-600 text-sm">
                    {safeNum(p.amount).toLocaleString()} ر.س
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-bold">
                    {p.method}{" "}
                    <span className="text-gray-400 font-normal mr-2">
                      ({p.periodRef || p.ref || "بدون مرجع"})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-bold text-[11px]">
                    <User className="w-3 h-3 inline mr-1" />
                    {p.collectedBy || "موظف النظام"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        if (window.confirm("حذف الدفعة؟"))
                          deletePaymentMutation.mutate(p.id);
                      }}
                      className="text-red-400 hover:text-red-600 p-1.5 bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-10 text-gray-400 font-bold"
                >
                  لا توجد دفعات محصلة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
