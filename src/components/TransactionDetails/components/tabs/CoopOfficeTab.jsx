import React from "react";
import { Plus, Trash2, Building2, Edit3 } from "lucide-react";

// 4. تبويب المكتب المتعاون
export const CoopOfficeTab = ({
  tx,
  txCoopFees,
  setIsCoopFeeModalOpen,
  setCoopFeeMode,
  setCoopFeeForm,
  initialCoopFeeForm,
  handleOpenCoopFeeEdit,
  deleteCoopFeeMutation,
  safeNum,
}) => {
  return (
    <div className="p-5 space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[var(--wms-text)] text-[14px] font-bold">
            تكاليف المكتب المنفذ (الخارجي)
          </span>
          <span className="font-mono px-2 py-0.5 rounded text-[12px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
            {txCoopFees
              .reduce((a, b) => a + Number(b.officeFees), 0)
              .toLocaleString()}{" "}
            ر.س
          </span>
        </div>
        <button
          onClick={() => {
            setCoopFeeMode("add");
            setCoopFeeForm(initialCoopFeeForm);
            setIsCoopFeeModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-600 text-white hover:bg-cyan-700 text-[11px] font-bold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> إضافة مطالبة أتعاب مكتب
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-[12px] text-right">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-bold text-gray-600">
                المكتب المتعاون
              </th>
              <th className="px-4 py-3 font-bold text-gray-600">نوع الطلب</th>
              <th className="px-4 py-3 font-bold text-gray-600">
                الأتعاب المستحقة
              </th>
              <th className="px-4 py-3 font-bold text-gray-600">المدفوع</th>
              <th className="px-4 py-3 font-bold text-gray-600">المتبقي</th>
              <th className="px-4 py-3 font-bold text-gray-600">حالة الدفع</th>
              <th className="px-4 py-3 font-bold text-gray-600 text-center">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {txCoopFees.length > 0 ? (
              txCoopFees.map((fee, i) => {
                const cost = Number(fee.officeFees) || 0;
                const paid = Number(fee.paidAmount) || 0;
                const remaining = Math.max(0, cost - paid);
                const isFullyPaid = paid >= cost && cost > 0;

                return (
                  <tr
                    key={i}
                    className="border-b border-gray-100 hover:bg-cyan-50/30 transition-colors"
                  >
                    <td className="px-4 py-4 font-bold text-gray-800 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-600" />
                      {fee.officeName}
                    </td>
                    <td className="px-4 py-4 text-gray-600 font-bold">
                      {fee.requestType || "—"}
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-blue-700">
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
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${isFullyPaid ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
                      >
                        {isFullyPaid ? "مدفوع بالكامل" : "غير مدفوع / جزئي"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenCoopFeeEdit(fee)}
                          className="text-cyan-600 hover:bg-cyan-50 p-1.5 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("حذف المطالبة؟"))
                              deleteCoopFeeMutation.mutate(fee.id);
                          }}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
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
                  colSpan="7"
                  className="text-center py-8 text-gray-400 font-bold"
                >
                  لا توجد مطالبات مسجلة للمكاتب في هذه المعاملة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
