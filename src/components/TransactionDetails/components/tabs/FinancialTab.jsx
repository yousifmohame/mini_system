import React from "react";
import {
  Calculator,
  Banknote,
  Edit3,
  X,
  Check,
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Wallet,
  Save,
  Loader2,
  User,
  Handshake,
  Monitor,
  PieChart,
} from "lucide-react";
import { TripleCurrencyInput } from "../TransactionSharedUI";

import { safeNum, safeText } from "../../utils/transactionUtils";
// Financial Tab (المحرك المالي)
export const FinancialTab = ({
  tx,
  isEditingFinancial,
  setIsEditingFinancial,
  editFormData,
  setEditFormData,
  exchangeRates,
  totalFees,
  editNetAmount,
  editTaxAmount,
  openSections,
  toggleSection,
  setIsAddBrokerModalOpen,
  deleteBrokerMutation,
  setIsAddAgentOpen,
  deleteAgentMutation,
  setIsAddRemoteTaskOpen,
  deleteRemoteTaskMutation,
  setPayPersonData,
  setPayTaskData,
  actualExpenses,
  addExpenseMutation,
  expenseForm,
  setExpenseForm,
  estimatedProfit,
  totalCosts,
  reserveDeduction,
  distributableProfit,
  availableForPartners,
  updateTxMutation,
  setActiveTab,
  sourcePercent,
  sourceShare,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" /> المحرك المالي
          والتفاصيل
        </h3>
        <button
          onClick={() => setIsEditingFinancial(!isEditingFinancial)}
          className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${isEditingFinancial ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}
        >
          {isEditingFinancial ? (
            <X className="w-3.5 h-3.5" />
          ) : (
            <Edit3 className="w-3.5 h-3.5" />
          )}{" "}
          {isEditingFinancial ? "إغلاق التعديل" : "إمكانية التعديل"}
        </button>
      </div>

      {/* الإيرادات */}
      <div
        className="rounded-xl border overflow-hidden shadow-sm"
        style={{ borderColor: "rgba(34, 197, 94, 0.3)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: "rgba(34, 197, 94, 0.08)" }}
        >
          <div className="flex items-center gap-2 text-green-700 font-bold text-[13px]">
            <Banknote className="w-4 h-4" /> الإيرادات — السعر المتفق
          </div>
          {isEditingFinancial ? (
            <div className="w-[400px] flex gap-2">
              <select
                value={editFormData.taxType}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    taxType: e.target.value,
                  })
                }
                className="border border-green-200 bg-white rounded-md px-2 py-1.5 text-[11px] font-bold text-gray-700 outline-none w-1/2"
              >
                <option value="بدون احتساب ضريبة">بدون ضريبة (صافي)</option>
                <option value="شامل الضريبة">شامل الضريبة (15%)</option>
                <option value="غير شامل الضريبة">غير شامل (تضاف 15%)</option>
              </select>
              <TripleCurrencyInput
                valueSar={editFormData.totalFees}
                onChangeSar={(v) =>
                  setEditFormData({ ...editFormData, totalFees: v })
                }
                rates={exchangeRates}
              />
            </div>
          ) : (
            <div className="text-right">
              <div className="font-mono text-lg font-black text-green-700">
                {totalFees.toLocaleString()} ر.س
              </div>
              {tx.notes?.taxData?.taxType &&
                tx.notes?.taxData?.taxType !== "بدون احتساب ضريبة" && (
                  <div className="text-[10px] text-gray-500 font-bold mt-1">
                    النوع: {tx.notes.taxData.taxType} | الضريبة:{" "}
                    {safeNum(tx.notes.taxData.taxAmount).toLocaleString()} ر.س
                  </div>
                )}
            </div>
          )}
        </div>
        {isEditingFinancial && editFormData.taxType !== "بدون احتساب ضريبة" && (
          <div className="bg-white p-3 flex justify-between items-center text-xs font-mono font-bold border-t border-green-100">
            <span className="text-gray-600">
              المبلغ الصافي:{" "}
              <span className="text-gray-900 text-sm">
                {editNetAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
            <span className="text-red-600">
              قيمة الضريبة المضافة:{" "}
              <span className="text-red-700 text-sm">
                {editTaxAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* أتعاب الوسطاء */}
      <div
        className="rounded-xl border overflow-hidden shadow-sm transition-all"
        style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.05)",
            borderBottom: openSections.brokers
              ? "1px solid rgba(239, 68, 68, 0.1)"
              : "none",
          }}
          onClick={() => toggleSection("brokers")}
        >
          <div className="flex items-center gap-2 text-red-600 font-bold text-[12px]">
            <Handshake className="w-4 h-4" /> أتعاب الوسطاء —{" "}
            {safeNum(
              editFormData.mediatorFees || tx.mediatorFees,
            ).toLocaleString()}{" "}
            ر.س
          </div>
          <div className="flex items-center gap-3">
            {isEditingFinancial && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddBrokerModalOpen(true);
                }}
                className="flex items-center gap-1 bg-white border border-red-200 text-red-600 px-2.5 py-1 rounded text-[10px] hover:bg-red-50 transition-colors"
              >
                <Plus className="w-3 h-3" /> إضافة وسيط
              </button>
            )}
            {openSections.brokers ? (
              <ChevronUp className="w-4 h-4 text-red-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>
        {openSections.brokers && (
          <div className="p-4 bg-white">
            {tx.brokers?.length > 0 ? (
              <div className="space-y-2">
                {tx.brokers.map((b, i) => {
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
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-red-50/30 transition-colors"
                    >
                      <span className="font-bold text-gray-800 text-[12px] w-1/3">
                        {b.name}
                      </span>
                      <div className="flex w-1/3 justify-between items-center text-center px-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400">
                            التكلفة
                          </span>
                          <span className="font-mono font-bold text-gray-800 text-[12px]">
                            {cost.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400">
                            المدفوع
                          </span>
                          <span className="font-mono font-bold text-green-600 text-[12px]">
                            {paid.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="w-1/3 flex justify-end items-center gap-2">
                        {isFullyPaid ? (
                          <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 flex items-center gap-1">
                            <Check className="w-3 h-3" /> مدفوع
                          </span>
                        ) : (
                          <>
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                              متبقي: {remaining}
                            </span>
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
                              className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white px-2.5 py-1 rounded text-[10px] font-bold transition-colors"
                            >
                              <Banknote className="w-3 h-3" /> سداد
                            </button>
                          </>
                        )}
                        {isEditingFinancial && (
                          <button
                            onClick={() => deleteBrokerMutation.mutate(b.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-[11px] text-gray-400 font-bold">
                لا يوجد وسطاء مسجلين في هذه المعاملة
              </div>
            )}
            {isEditingFinancial && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-500 font-bold">
                  تعديل الإجمالي التقديري للوسطاء
                </span>
                <div className="w-[300px]">
                  <TripleCurrencyInput
                    valueSar={editFormData.mediatorFees}
                    onChangeSar={(v) =>
                      setEditFormData({
                        ...editFormData,
                        mediatorFees: v,
                      })
                    }
                    rates={exchangeRates}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* أتعاب المعقبين */}
      <div
        className="rounded-xl border overflow-hidden shadow-sm transition-all"
        style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.05)",
            borderBottom: openSections.agents
              ? "1px solid rgba(239, 68, 68, 0.1)"
              : "none",
          }}
          onClick={() => toggleSection("agents")}
        >
          <div className="flex items-center gap-2 text-red-600 font-bold text-[12px]">
            <User className="w-4 h-4" /> أتعاب المعقبين —{" "}
            {safeNum(editFormData.agentCost || tx.agentCost).toLocaleString()}{" "}
            ر.س
          </div>
          <div className="flex items-center gap-3">
            {isEditingFinancial && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddAgentOpen(true);
                }}
                className="flex items-center gap-1 bg-white border border-red-200 text-red-600 px-2.5 py-1 rounded text-[10px] hover:bg-red-50 transition-colors"
              >
                <Plus className="w-3 h-3" /> إضافة معقب
              </button>
            )}
            {openSections.agents ? (
              <ChevronUp className="w-4 h-4 text-red-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>
        {openSections.agents && (
          <div className="p-4 bg-white">
            {tx.agents?.length > 0 ? (
              <div className="space-y-2">
                {tx.agents.map((ag, i) => {
                  const cost = safeNum(ag.fees);
                  const paid =
                    tx.settlements
                      ?.filter(
                        (s) => s.targetId === ag.id && s.status === "DELIVERED",
                      )
                      .reduce((sum, s) => sum + s.amount, 0) || 0;
                  const remaining = Math.max(0, cost - paid);
                  const isFullyPaid = paid >= cost && cost > 0;

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-red-50/30 transition-colors"
                    >
                      <div className="flex flex-col w-1/3">
                        <span className="font-bold text-gray-800 text-[12px]">
                          {ag.name}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {ag.role}
                        </span>
                      </div>
                      <div className="flex w-1/3 justify-between items-center text-center px-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400">
                            التكلفة
                          </span>
                          <span className="font-mono font-bold text-gray-800 text-[12px]">
                            {cost.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400">
                            المدفوع
                          </span>
                          <span className="font-mono font-bold text-green-600 text-[12px]">
                            {paid.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="w-1/3 flex justify-end items-center gap-2">
                        {isFullyPaid ? (
                          <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 flex items-center gap-1">
                            <Check className="w-3 h-3" /> مدفوع
                          </span>
                        ) : (
                          <>
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                              متبقي: {remaining}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPayPersonData({
                                  targetType: "معقب",
                                  targetId: ag.id,
                                  workerName: ag.name,
                                  taskName: ag.role || "أتعاب تعقيب",
                                  totalCost: remaining,
                                  paymentType: "full",
                                  amountSar: remaining,
                                  paymentDate: new Date()
                                    .toISOString()
                                    .split("T")[0],
                                });
                              }}
                              className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white px-2.5 py-1 rounded text-[10px] font-bold transition-colors"
                            >
                              <Banknote className="w-3 h-3" /> سداد
                            </button>
                          </>
                        )}
                        {isEditingFinancial && (
                          <button
                            onClick={() => deleteAgentMutation.mutate(ag.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-[11px] text-gray-400 font-bold">
                لا يوجد معقبين مسجلين
              </div>
            )}
            {isEditingFinancial && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-500 font-bold">
                  تعديل الإجمالي التقديري للمعقبين
                </span>
                <div className="w-[300px]">
                  <TripleCurrencyInput
                    valueSar={editFormData.agentCost}
                    onChangeSar={(v) =>
                      setEditFormData({ ...editFormData, agentCost: v })
                    }
                    rates={exchangeRates}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* العمل عن بعد */}
      <div
        className="rounded-xl border overflow-hidden shadow-sm transition-all"
        style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.05)",
            borderBottom: openSections.remote
              ? "1px solid rgba(239, 68, 68, 0.1)"
              : "none",
          }}
          onClick={() => toggleSection("remote")}
        >
          <div className="flex items-center gap-2 text-red-600 font-bold text-[12px]">
            <Monitor className="w-4 h-4" /> العمل عن بعد —{" "}
            {safeNum(tx.remoteCost).toLocaleString()} ر.س
          </div>
          <div className="flex items-center gap-3">
            {isEditingFinancial && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddRemoteTaskOpen(true);
                }}
                className="flex items-center gap-1 bg-white border border-red-200 text-red-600 px-2.5 py-1 rounded text-[10px] hover:bg-red-50 transition-colors"
              >
                <Plus className="w-3 h-3" /> تعيين مهمة
              </button>
            )}
            {openSections.remote ? (
              <ChevronUp className="w-4 h-4 text-red-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>
        {openSections.remote && (
          <div className="p-4 bg-white">
            {tx.remoteTasks?.length > 0 ? (
              <div className="space-y-2">
                {tx.remoteTasks.map((rt, i) => {
                  const taskCost = safeNum(rt.cost);
                  const taskPaid = rt.isPaid
                    ? taskCost
                    : safeNum(rt.paidAmount);
                  const taskRemaining = Math.max(0, taskCost - taskPaid);
                  const isFullyPaid = taskPaid >= taskCost && taskCost > 0;
                  const usdRate =
                    exchangeRates.find((r) => r.currency === "USD")?.rate ||
                    0.266;
                  const egpRate =
                    exchangeRates.find((r) => r.currency === "EGP")?.rate ||
                    13.2;

                  return (
                    <div
                      key={rt.id || i}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/30 transition-colors"
                    >
                      <div className="flex flex-col w-1/4">
                        <span className="font-bold text-gray-900">
                          {rt.taskName}
                        </span>
                        <div className="text-[10px] text-emerald-600 font-bold mt-1">
                          <User className="w-3 h-3 inline mr-1" />
                          {rt.workerName}
                        </div>
                      </div>
                      <div className="flex w-2/4 justify-between items-center text-center px-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400">
                            التكلفة
                          </span>
                          <span className="font-mono font-bold text-gray-800 text-[12px]">
                            {taskCost.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400">
                            المدفوع
                          </span>
                          <span className="font-mono font-bold text-green-600 text-[12px]">
                            {taskPaid.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400">
                            المتبقي
                          </span>
                          <span className="font-mono font-bold text-red-600 text-[12px]">
                            {taskRemaining.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="w-1/4 flex justify-end items-center gap-2">
                        {taskRemaining <= 0 ? (
                          <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 flex items-center gap-1">
                            <Check className="w-3 h-3" /> مدفوع
                          </span>
                        ) : (
                          <>
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                              بانتظار الدفع
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
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
                          </>
                        )}
                        {isEditingFinancial && (
                          <button
                            onClick={() =>
                              deleteRemoteTaskMutation.mutate(rt.id)
                            }
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-[11px] text-gray-400 font-bold">
                لا يوجد مهام عمل عن بعد مسجلة
              </div>
            )}
          </div>
        )}
      </div>

      {/* مصاريف أخرى */}
      <div
        className="rounded-xl border overflow-hidden shadow-sm transition-all"
        style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.05)",
            borderBottom: openSections.expenses
              ? "1px solid rgba(239, 68, 68, 0.1)"
              : "none",
          }}
          onClick={() => toggleSection("expenses")}
        >
          <div className="flex items-center gap-2 text-red-600 font-bold text-[12px]">
            <Wallet className="w-4 h-4" /> مصاريف وتشغيل —{" "}
            {actualExpenses.toLocaleString()} ر.س
          </div>
          <div className="flex items-center gap-3">
            {isEditingFinancial && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  document
                    .getElementById("add-expense-form")
                    .classList.toggle("hidden");
                }}
                className="flex items-center gap-1 bg-white border border-red-200 text-red-600 px-2.5 py-1 rounded text-[10px] hover:bg-red-50 transition-colors"
              >
                <Plus className="w-3 h-3" /> إضافة بند
              </button>
            )}
            {openSections.expenses ? (
              <ChevronUp className="w-4 h-4 text-red-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>
        {openSections.expenses && (
          <div className="p-4 bg-white">
            <div
              id="add-expense-form"
              className="hidden mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl"
            >
              <div className="grid grid-cols-3 gap-3 mb-3">
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      date: e.target.value,
                    })
                  }
                  className="border p-2 rounded text-xs outline-none focus:border-red-500"
                />
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="وصف المصروف..."
                  className="border p-2 rounded text-xs outline-none focus:border-red-500"
                />
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      amount: e.target.value,
                    })
                  }
                  placeholder="المبلغ (ر.س)"
                  className="border p-2 rounded text-xs font-mono font-bold outline-none focus:border-red-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => addExpenseMutation.mutate(expenseForm)}
                  disabled={
                    addExpenseMutation.isPending ||
                    !expenseForm.amount ||
                    !expenseForm.description
                  }
                  className="bg-red-600 text-white px-4 py-1.5 rounded text-xs font-bold shadow-sm hover:bg-red-700 disabled:opacity-50"
                >
                  حفظ المصروف
                </button>
              </div>
            </div>

            {tx.expenses?.length > 0 ? (
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="p-2">التاريخ</th>
                    <th className="p-2">الوصف</th>
                    <th className="p-2">المبلغ</th>
                    <th className="p-2">بواسطة</th>
                  </tr>
                </thead>
                <tbody>
                  {tx.expenses.map((exp, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="p-2 font-mono text-gray-500">
                        {new Date(exp.date || exp.createdAt).toLocaleDateString(
                          "en-GB",
                        )}
                      </td>
                      <td className="p-2 font-bold text-gray-800">
                        {exp.description || exp.notes || exp.item}
                      </td>
                      <td className="p-2 font-mono font-bold text-red-600">
                        {safeNum(exp.amount).toLocaleString()}
                      </td>
                      <td className="p-2 text-[10px] text-gray-400">
                        {exp.addedBy || "النظام"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-4 text-[11px] text-gray-400 font-bold">
                لا توجد مصاريف أخرى مسجلة
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. نتائج الحساب التلقائي */}
      <div
        className="rounded-xl border overflow-hidden shadow-sm mt-6"
        style={{ borderColor: "rgba(59, 130, 246, 0.2)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            backgroundColor: "rgba(59, 130, 246, 0.05)",
            borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
          }}
        >
          <div className="flex items-center gap-1.5 text-blue-600">
            <Calculator className="w-4 h-4" />
            <span className="text-[13px] font-bold">نتائج الحساب التلقائي</span>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div
              className="p-4 rounded-xl border border-red-100"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.03)" }}
            >
              <div className="text-red-700 text-[11px] font-bold mb-1">
                إجمالي التكاليف
              </div>
              <div className="font-mono text-xl font-black text-red-700">
                {totalCosts.toLocaleString()}{" "}
                <span className="text-[11px] font-normal">ر.س</span>
              </div>
            </div>
            <div
              className="p-4 rounded-xl border border-green-100"
              style={{ backgroundColor: "rgba(34, 197, 94, 0.03)" }}
            >
              <div className="text-green-700 text-[11px] font-bold mb-1">
                ربح تقديري
              </div>
              <div className="font-mono text-xl font-black text-green-700">
                {estimatedProfit.toLocaleString()}{" "}
                <span className="text-[11px] font-normal">ر.س</span>
              </div>
            </div>
            <div
              className="p-4 rounded-xl border border-blue-100"
              style={{ backgroundColor: "rgba(59, 130, 246, 0.03)" }}
            >
              <div className="text-blue-700 text-[11px] font-bold mb-1">
                خصم الاحتياطي (10%)
              </div>
              <div className="font-mono text-xl font-black text-blue-700">
                {reserveDeduction.toLocaleString()}{" "}
                <span className="text-[11px] font-normal">ر.س</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div
              className="p-4 rounded-xl flex items-center justify-between border border-green-200 shadow-sm"
              style={{ backgroundColor: "rgba(34, 197, 94, 0.05)" }}
            >
              <div>
                <div className="text-green-800 text-[12px] font-bold mb-1">
                  صافي قابل للتسوية
                </div>
                <div className="font-mono text-2xl font-black text-green-700">
                  {distributableProfit.toLocaleString()}{" "}
                  <span className="text-[12px] font-normal">ر.س</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("settlement")}
                className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-bold text-[12px] flex items-center gap-2 hover:bg-green-700 transition-colors shadow-md"
              >
                <Check className="w-4 h-4" /> تسوية
              </button>
            </div>
            <div
              className="p-4 rounded-xl flex items-center justify-between border border-amber-200 shadow-sm"
              style={{ backgroundColor: "rgba(245, 158, 11, 0.05)" }}
            >
              <div>
                <div className="text-amber-800 text-[12px] font-bold mb-1">
                  ربح قابل للتوزيع
                </div>
                <div className="font-mono text-2xl font-black text-amber-700">
                  {availableForPartners.toLocaleString()}{" "}
                  <span className="text-[12px] font-normal">ر.س</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("profits")}
                className="px-5 py-2.5 rounded-lg bg-amber-500 text-white font-bold text-[12px] flex items-center gap-2 hover:bg-amber-600 transition-colors shadow-md"
              >
                <PieChart className="w-4 h-4" /> توزيع
              </button>
            </div>
          </div>

          <div
            className="p-4 rounded-xl border border-purple-200"
            style={{ backgroundColor: "rgba(168, 85, 247, 0.03)" }}
          >
            <div className="text-[11px] font-bold text-purple-700 mb-1">
              حصة المصدر — {safeText(tx.sourceName || tx.source)} (
              {sourcePercent}%)
            </div>
            <div className="font-mono text-lg font-black text-purple-700">
              {sourceShare.toLocaleString()}{" "}
              <span className="text-[11px] font-normal">ر.س</span>
            </div>
          </div>
        </div>
      </div>

      {isEditingFinancial && (
        <div className="fixed bottom-6 left-6 z-50">
          <button
            onClick={() => updateTxMutation.mutate(editFormData)}
            disabled={updateTxMutation.isPending}
            className="px-8 py-3.5 bg-blue-600 text-white rounded-full text-sm font-black shadow-2xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {updateTxMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}{" "}
            حفظ التعديلات المالية
          </button>
        </div>
      )}
    </div>
  );
};
