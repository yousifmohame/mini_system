import React, { useState, useEffect } from "react";
import {
  Calculator,
  Banknote,
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
  Scale,
  TrendingUp,
} from "lucide-react";

import { safeNum, safeText } from "../../utils/transactionUtils";

// =========================================================================
// 💡 مكون فرعي: حقل إدخال ذكي + محول عملات (SAR -> USD -> EGP)
// =========================================================================
const FormattedCurrencyInput = ({
  value,
  onChange,
  placeholder = "0",
  rates,
}) => {
  const displayValue = value ? Number(value).toLocaleString("en-US") : "";

  const handleChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    onChange(rawValue ? parseFloat(rawValue) : 0);
  };

  const inputWidth = Math.max(displayValue.length, 1) + 1 + "ch";

  // استخراج أسعار الصرف (مع توفير قيم افتراضية في حال عدم وجودها)
  const usdRate = rates?.find((r) => r.currency === "USD")?.rate || 0.266;
  const egpRate = rates?.find((r) => r.currency === "EGP")?.rate || 13.2;

  const usdValue = safeNum(value) * usdRate;
  const egpValue = safeNum(value) * egpRate;

  return (
    <div className="flex flex-col gap-1.5 items-end">
      {/* حقل إدخال الريال السعودي */}
      <div className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-lg px-3 py-1.5 transition-all shadow-sm">
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          style={{ width: inputWidth, minWidth: "40px", maxWidth: "150px" }}
          className="bg-transparent outline-none font-mono font-black text-lg text-gray-800 text-center transition-all"
          dir="ltr"
        />
        <span className="text-[11px] font-bold text-gray-400 select-none">
          ر.س
        </span>
      </div>

      {/* عرض العملات الأخرى */}
      <div className="flex gap-2">
        {usdValue > 0 && (
          <div className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-bold">
            <span className="text-[9px] opacity-70">USD</span>
            <span className="text-[10px] font-mono">
              $
              {usdValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
          </div>
        )}
        {egpValue > 0 && (
          <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold">
            <span className="text-[9px] opacity-70">EGP</span>
            <span className="text-[10px] font-mono">
              £
              {egpValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// 💡 المكون الرئيسي: التبويب المالي
// =========================================================================
export const FinancialTab = ({
  tx,
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
  // حالة ذكية لتتبع التغييرات وإظهار زر الحفظ
  const [isDirty, setIsDirty] = useState(false);

  // دالة لتحديث البيانات وتفعيل زر الحفظ
  const handleFinancialChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleTaxTypeChange = (e) => {
    setEditFormData((prev) => ({ ...prev, taxType: e.target.value }));
    setIsDirty(true);
  };

  // دالة الحفظ
  const handleSave = () => {
    updateTxMutation.mutate(editFormData, {
      onSuccess: () => {
        setIsDirty(false); // إخفاء الزر بعد نجاح الحفظ
      },
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-24 relative">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-gray-800 text-lg">المحرك المالي</h3>
          <p className="text-[11px] text-gray-500 font-bold">
            اضغط على أي رقم لتعديله مباشرة، سيتم حساب الصافي والأرباح تلقائياً
          </p>
        </div>
      </div>

      {/* 🟢 قسم الإيرادات (Revenue) */}
      <div className="bg-gradient-to-br from-emerald-50/50 to-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-emerald-800 text-sm">
                الإيرادات (قيمة التعاقد)
              </h4>
              <p className="text-[10px] text-emerald-600/70 font-bold">
                إجمالي المبلغ المتفق عليه مع العميل
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-start md:items-center gap-4">
            <select
              value={editFormData.taxType || "بدون احتساب ضريبة"}
              onChange={handleTaxTypeChange}
              className="bg-white border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer shadow-sm mt-1"
            >
              <option value="بدون احتساب ضريبة">بدون ضريبة (صافي)</option>
              <option value="شامل الضريبة">شامل الضريبة (15%)</option>
              <option value="غير شامل الضريبة">غير شامل (تضاف 15%)</option>
            </select>

            {/* החقل الذكي المتمدد مع العملات */}
            <FormattedCurrencyInput
              value={editFormData.totalFees}
              onChange={(val) => handleFinancialChange("totalFees", val)}
              rates={exchangeRates}
            />
          </div>
        </div>

        {/* تفاصيل الضريبة تظهر فقط إذا كان هناك ضريبة */}
        {editFormData.taxType !== "بدون احتساب ضريبة" && (
          <div className="bg-white/80 px-5 py-3 flex justify-between items-center text-xs font-mono border-t border-emerald-100">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-bold">المبلغ الصافي:</span>
              <span className="font-black text-emerald-700 text-sm bg-emerald-50 px-2 py-0.5 rounded">
                {editNetAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-bold">الضريبة المضافة:</span>
              <span className="font-black text-red-600 text-sm bg-red-50 px-2 py-0.5 rounded">
                {editTaxAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 🔴 قسم التكاليف (الوسطاء، المعقبين، العمل عن بعد، مصاريف أخرى) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* أتعاب الوسطاء */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group hover:border-indigo-200 transition-colors">
          <div
            className="flex items-center justify-between p-4 cursor-pointer select-none bg-slate-50/50 group-hover:bg-indigo-50/30 transition-colors"
            onClick={() => toggleSection("brokers")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Handshake className="w-4 h-4" />
              </div>
              <span className="font-black text-slate-800 text-sm">
                أتعاب الوسطاء
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div onClick={(e) => e.stopPropagation()}>
                <FormattedCurrencyInput
                  value={editFormData.mediatorFees || 0}
                  onChange={(val) => handleFinancialChange("mediatorFees", val)}
                  rates={exchangeRates}
                />
              </div>
              {openSections.brokers ? (
                <ChevronUp className="w-5 h-5 text-slate-400 mt-2" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 mt-2" />
              )}
            </div>
          </div>

          {openSections.brokers && (
            <div className="p-4 border-t border-gray-100">
              {tx.brokers?.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {tx.brokers.map((b, i) => {
                    const cost = safeNum(b.fees);
                    const paid =
                      tx.settlements
                        ?.filter(
                          (s) =>
                            s.targetId === b.personId &&
                            s.status === "DELIVERED",
                        )
                        .reduce((sum, s) => sum + s.amount, 0) || 0;
                    const remaining = Math.max(0, cost - paid);

                    return (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-gray-100 bg-white shadow-sm gap-2"
                      >
                        <span className="font-black text-gray-700 text-xs">
                          {b.name}
                        </span>
                        <div className="flex items-center gap-4 text-[10px] font-mono font-bold">
                          <span className="text-gray-500">
                            تكلفة:{" "}
                            <span className="text-gray-800">
                              {cost.toLocaleString()}
                            </span>
                          </span>
                          <span className="text-gray-500">
                            مدفوع:{" "}
                            <span className="text-emerald-600">
                              {paid.toLocaleString()}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {remaining > 0 ? (
                            <button
                              onClick={() => {
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
                              className="px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white rounded-md text-[10px] font-bold transition-colors"
                            >
                              سداد ({remaining.toLocaleString()})
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> مسدد
                            </span>
                          )}
                          <button
                            onClick={() => deleteBrokerMutation.mutate(b.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-gray-400 font-bold">
                  لا يوجد وسطاء
                </div>
              )}
              <button
                onClick={() => setIsAddBrokerModalOpen(true)}
                className="w-full py-2.5 border border-dashed border-indigo-300 text-indigo-600 rounded-xl hover:bg-indigo-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> ربط وسيط جديد
              </button>
            </div>
          )}
        </div>

        {/* أتعاب المعقبين */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group hover:border-cyan-200 transition-colors">
          <div
            className="flex items-center justify-between p-4 cursor-pointer select-none bg-slate-50/50 group-hover:bg-cyan-50/30 transition-colors"
            onClick={() => toggleSection("agents")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 text-cyan-700 rounded-lg">
                <User className="w-4 h-4" />
              </div>
              <span className="font-black text-slate-800 text-sm">
                أتعاب المعقبين
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div onClick={(e) => e.stopPropagation()}>
                <FormattedCurrencyInput
                  value={editFormData.agentCost || 0}
                  onChange={(val) => handleFinancialChange("agentCost", val)}
                  rates={exchangeRates}
                />
              </div>
              {openSections.agents ? (
                <ChevronUp className="w-5 h-5 text-slate-400 mt-2" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 mt-2" />
              )}
            </div>
          </div>

          {openSections.agents && (
            <div className="p-4 border-t border-gray-100">
              {tx.agents?.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {tx.agents.map((ag, i) => {
                    const cost = safeNum(ag.fees);
                    const paid =
                      tx.settlements
                        ?.filter(
                          (s) =>
                            s.targetId === ag.id && s.status === "DELIVERED",
                        )
                        .reduce((sum, s) => sum + s.amount, 0) || 0;
                    const remaining = Math.max(0, cost - paid);

                    return (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-gray-100 bg-white shadow-sm gap-2"
                      >
                        <div className="flex flex-col">
                          <span className="font-black text-gray-700 text-xs">
                            {ag.name}
                          </span>
                          <span className="text-[9px] text-gray-400 font-bold">
                            {ag.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono font-bold">
                          <span className="text-gray-500">
                            تكلفة:{" "}
                            <span className="text-gray-800">
                              {cost.toLocaleString()}
                            </span>
                          </span>
                          <span className="text-gray-500">
                            مدفوع:{" "}
                            <span className="text-emerald-600">
                              {paid.toLocaleString()}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {remaining > 0 ? (
                            <button
                              onClick={() => {
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
                              className="px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white rounded-md text-[10px] font-bold transition-colors"
                            >
                              سداد ({remaining.toLocaleString()})
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> مسدد
                            </span>
                          )}
                          <button
                            onClick={() => deleteAgentMutation.mutate(ag.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-gray-400 font-bold">
                  لا يوجد معقبين
                </div>
              )}
              <button
                onClick={() => setIsAddAgentOpen(true)}
                className="w-full py-2.5 border border-dashed border-cyan-300 text-cyan-700 rounded-xl hover:bg-cyan-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> ربط معقب جديد
              </button>
            </div>
          )}
        </div>

        {/* مهام العمل عن بعد */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group hover:border-purple-200 transition-colors">
          <div
            className="flex items-center justify-between p-4 cursor-pointer select-none bg-slate-50/50 group-hover:bg-purple-50/30 transition-colors"
            onClick={() => toggleSection("remote")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Monitor className="w-4 h-4" />
              </div>
              <span className="font-black text-slate-800 text-sm">
                مهام العمل عن بعد
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1.5 items-end">
                <div className="font-mono font-black text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                  {safeNum(tx.remoteCost).toLocaleString()}{" "}
                  <span className="text-[11px] text-gray-400">ر.س</span>
                </div>
              </div>
              {openSections.remote ? (
                <ChevronUp className="w-5 h-5 text-slate-400 mt-2" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 mt-2" />
              )}
            </div>
          </div>

          {openSections.remote && (
            <div className="p-4 border-t border-gray-100">
              {tx.remoteTasks?.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {tx.remoteTasks.map((rt, i) => {
                    const taskCost = safeNum(rt.cost);
                    const taskPaid = rt.isPaid
                      ? taskCost
                      : safeNum(rt.paidAmount);
                    const taskRemaining = Math.max(0, taskCost - taskPaid);

                    return (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-gray-100 bg-white shadow-sm gap-2"
                      >
                        <div className="flex flex-col">
                          <span className="font-black text-gray-700 text-xs truncate max-w-[150px]">
                            {rt.taskName}
                          </span>
                          <span className="text-[9px] text-purple-600 font-bold">
                            {rt.workerName}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono font-bold">
                          <span className="text-gray-500">
                            تكلفة:{" "}
                            <span className="text-gray-800">
                              {taskCost.toLocaleString()}
                            </span>
                          </span>
                          <span className="text-gray-500">
                            متبقي:{" "}
                            <span className="text-red-600">
                              {taskRemaining.toLocaleString()}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {taskRemaining > 0 ? (
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
                              className="px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white rounded-md text-[10px] font-bold transition-colors"
                            >
                              تسوية
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> مسدد
                            </span>
                          )}
                          <button
                            onClick={() =>
                              deleteRemoteTaskMutation.mutate(rt.id)
                            }
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-gray-400 font-bold">
                  لا يوجد مهام عمل عن بعد
                </div>
              )}
              <button
                onClick={() => setIsAddRemoteTaskOpen(true)}
                className="w-full py-2.5 border border-dashed border-purple-300 text-purple-600 rounded-xl hover:bg-purple-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> إسناد مهمة جديدة
              </button>
            </div>
          )}
        </div>

        {/* مصاريف وتشغيل */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group hover:border-rose-200 transition-colors">
          <div
            className="flex items-center justify-between p-4 cursor-pointer select-none bg-slate-50/50 group-hover:bg-rose-50/30 transition-colors"
            onClick={() => toggleSection("expenses")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="font-black text-slate-800 text-sm">
                مصاريف وتشغيل
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="font-mono font-black text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                {actualExpenses.toLocaleString()}{" "}
                <span className="text-[11px] text-gray-400">ر.س</span>
              </div>
              {openSections.expenses ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>

          {openSections.expenses && (
            <div className="p-4 border-t border-gray-100">
              <div className="mb-4 p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex flex-col gap-2">
                <div className="flex gap-2">
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
                    className="flex-1 border border-gray-200 p-2 rounded-lg text-xs font-bold outline-none focus:border-rose-400"
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
                    placeholder="المبلغ"
                    className="w-24 border border-gray-200 p-2 rounded-lg text-xs font-mono font-bold outline-none focus:border-rose-400 text-center"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, date: e.target.value })
                    }
                    className="border border-gray-200 p-1.5 rounded-lg text-xs outline-none text-gray-500 bg-white"
                  />
                  <button
                    onClick={() => {
                      addExpenseMutation.mutate(expenseForm);
                      setIsDirty(true);
                    }}
                    disabled={
                      addExpenseMutation.isPending ||
                      !expenseForm.amount ||
                      !expenseForm.description
                    }
                    className="bg-rose-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors disabled:opacity-50"
                  >
                    إضافة
                  </button>
                </div>
              </div>

              {tx.expenses?.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar-slim pr-1">
                  {tx.expenses.map((exp, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-2.5 rounded-lg border border-gray-100 bg-white shadow-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 text-xs">
                          {exp.description || exp.notes || exp.item}
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono">
                          {new Date(
                            exp.date || exp.createdAt,
                          ).toLocaleDateString("en-GB")}
                        </span>
                      </div>
                      <span className="font-mono font-black text-rose-600 text-sm bg-rose-50 px-2 py-0.5 rounded">
                        {safeNum(exp.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-gray-400 font-bold">
                  لا توجد مصاريف
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 📊 ملخص النتائج والأرباح (Dashboard Style) */}
      <div className="bg-slate-900 rounded-3xl p-6 mt-8 shadow-xl relative overflow-hidden">
        {/* تأثيرات بصرية للخلفية */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] opacity-20 translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white mb-6">
            <PieChart className="w-5 h-5 text-blue-400" />
            <h3 className="font-black text-lg">
              الخلاصة المالية وتوزيع الأرباح
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 rounded-2xl">
              <div className="text-slate-400 text-[10px] font-bold mb-1">
                إجمالي التكاليف
              </div>
              <div className="font-mono text-xl font-black text-rose-400">
                {totalCosts.toLocaleString()}{" "}
                <span className="text-[10px] text-slate-500">ر.س</span>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 rounded-2xl">
              <div className="text-slate-400 text-[10px] font-bold mb-1">
                الربح التقديري
              </div>
              <div className="font-mono text-xl font-black text-emerald-400">
                {estimatedProfit.toLocaleString()}{" "}
                <span className="text-[10px] text-slate-500">ر.س</span>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 rounded-2xl">
              <div className="text-slate-400 text-[10px] font-bold mb-1">
                خصم الاحتياطي (10%)
              </div>
              <div className="font-mono text-xl font-black text-blue-400">
                {reserveDeduction.toLocaleString()}{" "}
                <span className="text-[10px] text-slate-500">ر.س</span>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 rounded-2xl">
              <div className="text-slate-400 text-[10px] font-bold mb-1">
                حصة المُصدر ({sourcePercent}%)
              </div>
              <div className="font-mono text-xl font-black text-purple-400">
                {sourceShare.toLocaleString()}{" "}
                <span className="text-[10px] text-slate-500">ر.س</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-l from-emerald-900/40 to-slate-800/50 border border-emerald-500/30 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-emerald-400 text-[11px] font-bold mb-1">
                  الصافي القابل للتسوية
                </div>
                <div className="font-mono text-3xl font-black text-white">
                  {distributableProfit.toLocaleString()}{" "}
                  <span className="text-[12px] text-slate-400">ر.س</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("settlement")}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-sm rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"
              >
                <Scale className="w-4 h-4" /> إجراء تسوية
              </button>
            </div>

            <div className="bg-gradient-to-l from-amber-900/40 to-slate-800/50 border border-amber-500/30 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-amber-400 text-[11px] font-bold mb-1">
                  أرباح الشركاء (للتوزيع)
                </div>
                <div className="font-mono text-3xl font-black text-white">
                  {availableForPartners.toLocaleString()}{" "}
                  <span className="text-[12px] text-slate-400">ر.س</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("profits")}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-sm rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2"
              >
                <PieChart className="w-4 h-4" /> عرض التوزيع
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 الزر العائم يظهر فقط عند وجود تغييرات (isDirty === true) */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
          <button
            onClick={handleSave}
            disabled={updateTxMutation.isPending}
            className="px-8 py-3.5 bg-blue-600 text-white rounded-full text-base font-black shadow-[0_8px_30px_rgb(37,99,235,0.4)] hover:bg-blue-700 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center gap-3"
          >
            {updateTxMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            حفظ التعديلات المالية
          </button>
        </div>
      )}
    </div>
  );
};
