import React from "react";
import { Plus, Check, Circle, Trash2, Banknote } from "lucide-react";

// 1. تبويب الوسطاء
export const BrokersTab = ({
  tx,
  safeNum,
  setIsAddBrokerModalOpen,
  deleteBrokerMutation,
  setPayPersonData,
}) => {
  return (
    <div className="p-5 space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[var(--wms-text)] text-[14px] font-bold">
            الوسطاء المرتبطون
          </span>
          <span className="font-mono px-2 py-0.5 rounded text-[12px] font-bold bg-red-50 text-red-600 border border-red-100">
            {safeNum(tx.mediatorFees).toLocaleString()} ر.س
          </span>
        </div>
        <button
          onClick={() => setIsAddBrokerModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-bold shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> إضافة وسيط
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-[12px] text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-bold text-gray-600">الوسيط</th>
              <th className="px-4 py-3 font-bold text-gray-600">الأتعاب</th>
              <th className="px-4 py-3 font-bold text-gray-600">المدفوع</th>
              <th className="px-4 py-3 font-bold text-gray-600">المتبقي</th>
              <th className="px-4 py-3 font-bold text-gray-600">الحالة</th>
              <th className="px-4 py-3 font-bold text-gray-600 text-center">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {tx.brokers?.length > 0 ? (
              tx.brokers.map((b, i) => {
                const cost = safeNum(b.fees);
                const paid =
                  tx.settlements
                    ?.filter(
                      (s) =>
                        s.targetId === b.personId && s.status === "DELIVERED",
                    )
                    .reduce((sum, s) => sum + s.amount, 0) || 0;
                const remaining = Math.max(0, cost - paid);
                const isFullyPaid = paid >= cost && cost > 0;

                return (
                  <tr
                    key={i}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4 font-bold text-gray-800">
                      {b.name}
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-gray-800">
                      {cost.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-green-600">
                      {paid.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-red-600">
                      {remaining.toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 w-max ${isFullyPaid ? "bg-green-100 text-green-700 border border-green-200" : "bg-amber-100 text-amber-700 border border-amber-200"}`}
                      >
                        {isFullyPaid ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}{" "}
                        {isFullyPaid
                          ? "تم الدفع"
                          : paid > 0
                            ? "دفع جزئي"
                            : "غير مدفوع"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {remaining > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPayPersonData({
                                targetType: "وسيط",
                                targetId: b.personId,
                                workerName: b.name,
                                taskName: "أتعاب وساطة",
                                totalCost: remaining,
                                paymentType: "full",
                                amountSar: remaining,
                                paymentDate: new Date()
                                  .toISOString()
                                  .split("T")[0],
                              });
                            }}
                            className="flex items-center gap-1 bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            <Banknote className="w-3.5 h-3.5" /> سداد
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("هل تريد إزالة هذا الوسيط؟"))
                              deleteBrokerMutation.mutate(b.id);
                          }}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-8 text-gray-400 font-bold"
                >
                  لا يوجد وسطاء مسجلين
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
