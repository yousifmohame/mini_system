import React from "react";
import { User, Plus, Check, Circle, Trash2, Monitor } from "lucide-react";

// 3. تبويب موظفي العمل عن بعد
export const RemoteTab = ({
  tx,
  safeNum,
  formatDateTime,
  exchangeRates,
  setIsAddRemoteTaskOpen,
  deleteRemoteTaskMutation,
  setPayTaskData,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-emerald-600" /> سجل العمل عن بعد
        </h3>
        <button
          onClick={() => setIsAddRemoteTaskOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> تعيين مهمة جديدة
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-right text-[12px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-bold text-gray-600">
                المهمة والموظف
              </th>
              <th className="px-4 py-3 font-bold text-gray-600">
                المبلغ بالعملات
              </th>
              <th className="px-4 py-3 font-bold text-gray-600">
                المُنشئ والتاريخ
              </th>
              <th className="px-4 py-3 font-bold text-gray-600">الحالة</th>
              <th className="px-4 py-3 font-bold text-gray-600 text-center">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {tx.remoteTasks?.length > 0 ? (
              tx.remoteTasks.map((rt, i) => {
                const taskCost = safeNum(rt.cost);
                const taskPaid = rt.isPaid ? taskCost : safeNum(rt.paidAmount);
                const taskRemaining = Math.max(0, taskCost - taskPaid);
                const isFullyPaid = taskPaid >= taskCost && taskCost > 0;

                const usdRate =
                  exchangeRates.find((r) => r.currency === "USD")?.rate ||
                  0.266;
                const egpRate =
                  exchangeRates.find((r) => r.currency === "EGP")?.rate || 13.2;

                return (
                  <tr
                    key={rt.id || i}
                    className="border-b border-gray-100 hover:bg-emerald-50/30 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="font-bold text-gray-900">
                        {rt.taskName}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-1">
                        <User className="w-3 h-3 inline mr-1" />
                        {rt.workerName}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        {/* SAR - العملة الأساسية */}
                        <div className="font-mono font-bold text-lg text-gray-900">
                          {taskCost.toLocaleString()}
                          <span className="text-xs ml-1 text-gray-500">
                            SAR
                          </span>
                        </div>

                        {/* USD */}
                        <div className="font-mono text-sm text-blue-600">
                          {(taskCost * usdRate).toFixed(2)}
                          <span className="text-[11px] ml-1 text-blue-500">
                            USD
                          </span>
                        </div>

                        {/* EGP */}
                        <div className="font-mono text-sm text-green-600">
                          {(taskCost * egpRate).toFixed(2)}
                          <span className="text-[11px] ml-1 text-green-500">
                            EGP
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-[11px] font-bold text-gray-700">
                        {rt.assignedBy || "موظف النظام"}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 mt-1">
                        {formatDateTime(rt.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {isFullyPaid ? (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-green-100 text-green-700 inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> مُسوى
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 inline-flex items-center gap-1">
                          <Circle className="w-3 h-3" /> بانتظار التسوية
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {taskRemaining > 0 && (
                          <button
                            onClick={() => {
                              setPayTaskData({
                                taskId: rt.id,
                                workerName: rt.workerName,
                                taskName: rt.taskName,
                                totalCost: taskRemaining,
                                paymentType: "full",
                                amountSar: taskRemaining,
                                paymentDate: new Date()
                                  .toISOString()
                                  .split("T")[0],
                              });
                            }}
                            className="bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            تسوية
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm("حذف المهمة؟"))
                              deleteRemoteTaskMutation.mutate(rt.id);
                          }}
                          className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg transition-colors"
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
                  colSpan="5"
                  className="text-center py-10 text-gray-400 font-bold"
                >
                  لا توجد مهام مسجلة حتى الآن
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
