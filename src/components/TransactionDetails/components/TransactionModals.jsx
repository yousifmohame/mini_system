import React from "react";
import {
  X,
  Save,
  Loader2,
  Banknote,
  User,
  Building2,
  Monitor,
  Upload,
  TriangleAlert,
  Handshake,
  Info,
} from "lucide-react";
import { TripleCurrencyInput } from "./TransactionSharedUI";
import { toast } from "sonner"; // لا تنسى استدعاء toast للـ handlers الداخلية

// 1. نافذة معاينة المرفقات
export const PreviewModal = ({ previewFile, setPreviewFile }) => {
  if (!previewFile) return null;
  return (
    <div
      className="fixed inset-0 bg-black/90 z-[200] flex flex-col items-center justify-center p-4 animate-in zoom-in-95"
      onClick={(e) => {
        e.stopPropagation();
        setPreviewFile(null);
      }}
    >
      <div className="w-full max-w-5xl flex justify-between items-center mb-4">
        <span className="text-white font-bold text-lg">{previewFile.name}</span>
        <div className="flex gap-2">
          <button
            onClick={() => window.open(previewFile.url, "_blank")}
            className="text-white hover:text-blue-400 bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
          >
            فتح في نافذة جديدة
          </button>
          <button
            onClick={() => setPreviewFile(null)}
            className="text-white hover:text-red-500 bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div
        className="w-full max-w-5xl h-[85vh] bg-white rounded-xl overflow-hidden shadow-2xl flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {previewFile.url?.toLowerCase().endsWith(".pdf") ? (
          <iframe
            src={previewFile.url}
            className="w-full h-full border-0"
            title="PDF Preview"
          />
        ) : (
          <img
            src={previewFile.url}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        )}
        <div className="hidden flex-col items-center justify-center text-gray-500">
          <TriangleAlert className="w-12 h-12 text-red-400 mb-2" />
          <span className="font-bold mb-3">تعذر عرض الملف داخل النظام</span>
          <button
            onClick={() => window.open(previewFile.url, "_blank")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold"
          >
            حاول فتحه في المتصفح
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. نافذة إضافة دفعة تحصيل
export const AddPaymentModal = ({
  isAddPaymentOpen,
  setIsAddPaymentOpen,
  paymentForm,
  setPaymentForm,
  bankAccounts,
  addPaymentMutation,
}) => {
  if (!isAddPaymentOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
          <span className="font-bold flex items-center gap-2">
            <Banknote className="w-4 h-4 text-green-400" /> إضافة دفعة تحصيل
          </span>
          <button onClick={() => setIsAddPaymentOpen(false)}>
            <X className="w-4 h-4 hover:text-red-400" />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar-slim">
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">
              المبلغ المحصل *
            </label>
            <input
              type="number"
              value={paymentForm.amount}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, amount: e.target.value })
              }
              className="w-full border p-2.5 rounded-lg text-lg font-mono font-bold text-green-700 focus:border-green-500 outline-none"
              placeholder="0"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">
                التاريخ
              </label>
              <input
                type="date"
                value={paymentForm.date}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, date: e.target.value })
                }
                className="w-full border p-2 rounded-lg text-sm outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">
                طريقة الدفع
              </label>
              <select
                value={paymentForm.method}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, method: e.target.value })
                }
                className="w-full border p-2 rounded-lg text-sm font-bold outline-none focus:border-green-500"
              >
                <option>تحويل بنكي</option>
                <option>نقدي</option>
                <option>شيك</option>
              </select>
            </div>
          </div>

          {/* 💡 خيارات ذكية بناءً على طريقة الدفع */}
          {paymentForm.method === "تحويل بنكي" && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-3 animate-in fade-in">
              <div>
                <label className="text-[10px] font-bold text-blue-800 mb-1 block">
                  الحساب المحول إليه (سيتم تغذية الرصيد تلقائياً)
                </label>
                <select
                  value={paymentForm.bankAccountId}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      bankAccountId: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">-- اختر الحساب البنكي --</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - {b.accountName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-blue-800 mb-1 block">
                  إيصال التحويل (اختياري)
                </label>
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files[0])
                      setPaymentForm({
                        ...paymentForm,
                        receiptFile: e.dataTransfer.files[0],
                      });
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-blue-300 bg-white text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors text-xs font-bold"
                >
                  <Upload className="w-3.5 h-3.5" />{" "}
                  <span className="truncate">
                    {paymentForm.receiptFile
                      ? paymentForm.receiptFile.name
                      : "اختر أو اسحب الإيصال هنا..."}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        receiptFile: e.target.files[0],
                      })
                    }
                  />
                </label>
              </div>
            </div>
          )}
          {paymentForm.method === "نقدي" && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-3 animate-in fade-in">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-amber-900">
                <input
                  type="checkbox"
                  checked={paymentForm.isDepositedToSafe}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      isDepositedToSafe: e.target.checked,
                    })
                  }
                  className="accent-amber-600 w-4 h-4"
                />
                تم إيداع المبلغ بالخزنة الرئيسية
              </label>
              {!paymentForm.isDepositedToSafe && (
                <div className="text-[10px] text-amber-700 bg-amber-100/50 p-2 rounded flex items-start gap-1">
                  <Info className="w-3 h-3 shrink-0 mt-0.5" /> سيُسجل هذا المبلغ
                  كـ "تحصيل غير مورد للخزينة" وسيبقى عهدة مع المحصل لحين توريده.
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">
              المرجع / رقم الحوالة
            </label>
            <input
              value={paymentForm.ref}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, ref: e.target.value })
              }
              className="w-full border p-2 rounded-lg text-sm outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">
              ملاحظات
            </label>
            <input
              value={paymentForm.notes}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, notes: e.target.value })
              }
              className="w-full border p-2 rounded-lg text-sm outline-none focus:border-green-500"
            />
          </div>
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <button
            onClick={() => setIsAddPaymentOpen(false)}
            className="px-4 py-1.5 border border-gray-300 rounded-lg bg-white text-sm font-bold hover:bg-gray-100"
          >
            إلغاء
          </button>
          <button
            onClick={() => addPaymentMutation.mutate(paymentForm)}
            disabled={addPaymentMutation.isPending || !paymentForm.amount}
            className="px-6 py-1.5 bg-green-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-green-700 shadow-sm flex items-center gap-2"
          >
            {addPaymentMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}{" "}
            حفظ الدفعة
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. نافذة إضافة معقب
export const AddAgentModal = ({
  isAddAgentOpen,
  setIsAddAgentOpen,
  agentForm,
  setAgentForm,
  agentsList,
  addAgentMutation,
}) => {
  if (!isAddAgentOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
          <span className="font-bold flex items-center gap-2">
            <User className="w-4 h-4 text-purple-400" /> تعيين معقب
          </span>
          <button onClick={() => setIsAddAgentOpen(false)}>
            <X className="w-4 h-4 hover:text-red-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">
              اسم المعقب *
            </label>
            <select
              value={agentForm.agentId}
              onChange={(e) =>
                setAgentForm({ ...agentForm, agentId: e.target.value })
              }
              className="w-full border p-2.5 rounded-lg text-sm font-bold outline-none focus:border-purple-500"
            >
              <option value="">-- اختر معقب --</option>
              {agentsList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">
                الدور/المهمة
              </label>
              <input
                value={agentForm.role}
                onChange={(e) =>
                  setAgentForm({ ...agentForm, role: e.target.value })
                }
                className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">
                الأتعاب (ر.س) *
              </label>
              <input
                type="number"
                value={agentForm.fees}
                onChange={(e) =>
                  setAgentForm({ ...agentForm, fees: e.target.value })
                }
                className="w-full border p-2.5 rounded-lg font-mono text-lg font-bold outline-none focus:border-purple-500 text-purple-700"
                placeholder="0"
              />
            </div>
          </div>
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <button
            onClick={() => setIsAddAgentOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-bold hover:bg-gray-100"
          >
            إلغاء
          </button>
          <button
            onClick={() => addAgentMutation.mutate(agentForm)}
            disabled={addAgentMutation.isPending || !agentForm.agentId}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-purple-700 shadow-sm flex items-center gap-2"
          >
            {addAgentMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}{" "}
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. نافذة إضافة وسيط
export const AddBrokerModal = ({
  isAddBrokerModalOpen,
  setIsAddBrokerModalOpen,
  brokerForm,
  setBrokerForm,
  brokersList,
  addBrokerMutation,
}) => {
  if (!isAddBrokerModalOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
          <span className="font-bold flex items-center gap-2">
            <Handshake className="w-4 h-4 text-blue-400" /> تعيين وسيط
          </span>
          <button onClick={() => setIsAddBrokerModalOpen(false)}>
            <X className="w-4 h-4 hover:text-red-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">
              اختر الوسيط *
            </label>
            <select
              value={brokerForm.brokerId}
              onChange={(e) =>
                setBrokerForm({ ...brokerForm, brokerId: e.target.value })
              }
              className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold focus:border-blue-500 outline-none"
            >
              <option value="">-- اختر الوسيط --</option>
              {brokersList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">
              أتعاب الوسيط (ر.س) *
            </label>
            <input
              type="number"
              value={brokerForm.fees}
              onChange={(e) =>
                setBrokerForm({ ...brokerForm, fees: e.target.value })
              }
              className="w-full border border-gray-300 p-2.5 rounded-lg font-mono text-lg font-bold text-blue-700 focus:border-blue-500 outline-none"
              placeholder="0"
            />
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
          <button
            onClick={() => setIsAddBrokerModalOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-bold text-gray-700"
          >
            إلغاء
          </button>
          <button
            onClick={() => addBrokerMutation.mutate(brokerForm)}
            disabled={addBrokerMutation.isPending || !brokerForm.brokerId}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-blue-700 flex items-center gap-2 shadow-sm"
          >
            {addBrokerMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}{" "}
            حفظ الوسيط
          </button>
        </div>
      </div>
    </div>
  );
};

// 5. نافذة تعيين مهمة عمل عن بعد
export const AddRemoteTaskModal = ({
  isAddRemoteTaskOpen,
  setIsAddRemoteTaskOpen,
  remoteTaskForm,
  setRemoteTaskForm,
  remoteWorkersList,
  exchangeRates,
  addRemoteTaskMutation,
  tx,
}) => {
  if (!isAddRemoteTaskOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-800 p-5 flex justify-between items-center text-white">
          <span className="font-bold flex items-center gap-2">
            <Monitor className="w-5 h-5 text-emerald-400" /> تعيين مهمة ودفع
            لموظف عن بعد
          </span>
          <button onClick={() => setIsAddRemoteTaskOpen(false)}>
            <X className="w-5 h-5 hover:text-red-400" />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar-slim">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-2">
              الموظف المستهدف *
            </label>
            <select
              value={remoteTaskForm.workerId}
              onChange={(e) =>
                setRemoteTaskForm({
                  ...remoteTaskForm,
                  workerId: e.target.value,
                })
              }
              className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold bg-gray-50 outline-none focus:border-emerald-500"
            >
              <option value="">-- اختر موظف عن بعد --</option>
              {remoteWorkersList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-2">
              وصف المهمة
            </label>
            <input
              type="text"
              value={remoteTaskForm.taskName}
              onChange={(e) =>
                setRemoteTaskForm({
                  ...remoteTaskForm,
                  taskName: e.target.value,
                })
              }
              className="w-full border border-gray-300 p-3 rounded-xl text-sm outline-none focus:border-emerald-500"
              placeholder="مثال: رسم معماري"
            />
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <label className="text-xs font-black text-emerald-800 block mb-3">
              تكلفة المهمة (إدخال متعدد العملات)
            </label>
            <TripleCurrencyInput
              valueSar={remoteTaskForm.costSar}
              onChangeSar={(v) =>
                setRemoteTaskForm({ ...remoteTaskForm, costSar: v })
              }
              rates={exchangeRates}
            />
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <label className="flex items-center gap-2 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={remoteTaskForm.isPaid}
                onChange={(e) =>
                  setRemoteTaskForm({
                    ...remoteTaskForm,
                    isPaid: e.target.checked,
                  })
                }
                className="accent-emerald-600 w-4 h-4"
              />
              <span className="font-bold text-sm text-gray-800">
                تم دفع جزء أو كل المبلغ للموظف الآن
              </span>
            </label>
            {remoteTaskForm.isPaid && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">
                    المبلغ المدفوع الفعلي
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={remoteTaskForm.paymentAmount}
                      onChange={(e) =>
                        setRemoteTaskForm({
                          ...remoteTaskForm,
                          paymentAmount: e.target.value,
                        })
                      }
                      className="w-full border p-2 rounded-lg text-sm font-mono outline-none focus:border-emerald-500"
                    />
                    <select
                      value={remoteTaskForm.paymentCurrency}
                      onChange={(e) =>
                        setRemoteTaskForm({
                          ...remoteTaskForm,
                          paymentCurrency: e.target.value,
                        })
                      }
                      className="border p-2 rounded-lg text-xs font-bold bg-white"
                    >
                      <option>SAR</option>
                      <option>EGP</option>
                      <option>USD</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">
                    تاريخ الدفع
                  </label>
                  <input
                    type="date"
                    value={remoteTaskForm.paymentDate}
                    onChange={(e) =>
                      setRemoteTaskForm({
                        ...remoteTaskForm,
                        paymentDate: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded-lg text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button
            onClick={() => setIsAddRemoteTaskOpen(false)}
            className="px-6 py-2.5 border border-gray-300 rounded-xl bg-white text-sm font-bold text-gray-700 hover:bg-gray-100"
          >
            إلغاء
          </button>
          <button
            onClick={() => {
              if (!remoteTaskForm.workerId || !remoteTaskForm.costSar) {
                return toast.error(
                  "يرجى تحديد الموظف وإدخال تكلفة المهمة (SAR)",
                );
              }
              const payload = {
                transactionId: tx?.id,
                workerId: remoteTaskForm.workerId,
                isPaid: remoteTaskForm.isPaid,
                paymentAmount: remoteTaskForm.paymentAmount,
                paymentCurrency: remoteTaskForm.paymentCurrency,
                paymentDate: remoteTaskForm.paymentDate,
                tasks: [
                  {
                    name: remoteTaskForm.taskName || "مهمة هندسية / رسم",
                    cost: remoteTaskForm.costSar,
                  },
                ],
              };
              addRemoteTaskMutation.mutate(payload);
            }}
            disabled={
              addRemoteTaskMutation.isPending || !remoteTaskForm.workerId
            }
            className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {addRemoteTaskMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}{" "}
            حفظ المهمة
          </button>
        </div>
      </div>
    </div>
  );
};

// 6. نافذة إضافة/تعديل مطالبة مكتب متعاون
export const CoopFeeModal = ({
  isCoopFeeModalOpen,
  setIsCoopFeeModalOpen,
  coopFeeMode,
  coopFeeForm,
  setCoopFeeForm,
  offices,
  saveCoopFeeMutation,
  tx,
}) => {
  if (!isCoopFeeModalOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 animate-in fade-in"
      dir="rtl"
      onClick={() => setIsCoopFeeModalOpen(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-cyan-800 p-4 flex justify-between items-center text-white shrink-0">
          <span className="font-bold flex items-center gap-2 text-[15px]">
            <Building2 className="w-5 h-5 text-cyan-200" />{" "}
            {coopFeeMode === "add"
              ? "إضافة تكلفة مكتب متعاون"
              : "تعديل تكلفة المكتب"}
          </span>
          <button
            onClick={() => setIsCoopFeeModalOpen(false)}
            className="p-1 rounded-md hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar-slim space-y-5">
          <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100 flex items-center gap-3 mb-2">
            <Info className="w-5 h-5 text-cyan-600 shrink-0" />
            <span className="text-xs font-bold text-cyan-800">
              سيتم ربط هذه التكلفة تلقائياً بالمعاملة الحالية (
              {tx.internalName || tx.client}).
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-2">
                اسم المكتب المتعاون *
              </label>
              <select
                value={coopFeeForm.officeId}
                onChange={(e) =>
                  setCoopFeeForm({
                    ...coopFeeForm,
                    officeId: e.target.value,
                  })
                }
                className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold focus:border-cyan-500 outline-none bg-white"
              >
                <option value="">-- اختر المكتب --</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                نوع الطلب
              </label>
              <select
                value={coopFeeForm.requestType}
                onChange={(e) =>
                  setCoopFeeForm({
                    ...coopFeeForm,
                    requestType: e.target.value,
                  })
                }
                className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold focus:border-cyan-500 outline-none bg-white"
              >
                <option value="اصدار">إصدار</option>
                <option value="تجديد وتعديل">تجديد وتعديل</option>
                <option value="تصحيح وضع مبني قائم">تصحيح وضع مبنى قائم</option>
                <option value="اخرى">أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                الأتعاب المستحقة للمكتب *
              </label>
              <input
                type="number"
                value={coopFeeForm.officeFees}
                onChange={(e) =>
                  setCoopFeeForm({
                    ...coopFeeForm,
                    officeFees: e.target.value,
                  })
                }
                className="w-full border border-gray-300 p-2.5 rounded-lg text-lg font-mono font-bold text-blue-700 focus:border-cyan-500 outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                المدفوع مقدماً
              </label>
              <input
                type="number"
                value={coopFeeForm.paidAmount}
                onChange={(e) =>
                  setCoopFeeForm({
                    ...coopFeeForm,
                    paidAmount: e.target.value,
                  })
                }
                className="w-full border border-gray-300 p-2.5 rounded-lg text-lg font-mono font-bold text-green-600 focus:border-cyan-500 outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                تاريخ الاستحقاق
              </label>
              <input
                type="date"
                value={coopFeeForm.dueDate}
                onChange={(e) =>
                  setCoopFeeForm({
                    ...coopFeeForm,
                    dueDate: e.target.value,
                  })
                }
                className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:border-cyan-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-2">
                الخدمات المقدمة (فري تكست)
              </label>
              <input
                type="text"
                value={coopFeeForm.providedServices}
                onChange={(e) =>
                  setCoopFeeForm({
                    ...coopFeeForm,
                    providedServices: e.target.value,
                  })
                }
                className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:border-cyan-500 outline-none bg-white"
                placeholder="مثال: تصميم معماري، انشائي، تنسيق حدائق..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                حالة الرفع على النظام
              </label>
              <select
                value={coopFeeForm.uploadStatus}
                onChange={(e) =>
                  setCoopFeeForm({
                    ...coopFeeForm,
                    uploadStatus: e.target.value,
                  })
                }
                className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold focus:border-cyan-500 outline-none bg-white"
              >
                <option value="مع الرفع على النظام">مع الرفع على النظام</option>
                <option value="بدون رفع على النظام">بدون رفع على النظام</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 p-4 border border-orange-100 bg-orange-50/30 rounded-xl">
            <div className="col-span-3 pb-2 border-b border-orange-100 mb-2">
              <span className="text-xs font-bold text-orange-800">
                بيانات الرخصة والمنصات التابعة للمكتب
              </span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-1">
                رقم الرخصة
              </label>
              <input
                type="text"
                value={coopFeeForm.licenseNumber}
                onChange={(e) =>
                  setCoopFeeForm({
                    ...coopFeeForm,
                    licenseNumber: e.target.value,
                  })
                }
                className="w-full border p-2 rounded text-sm outline-none focus:border-orange-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-1">
                سنة الرخصة (هجرية)
              </label>
              <input
                type="text"
                value={coopFeeForm.licenseYear}
                onChange={(e) =>
                  setCoopFeeForm({
                    ...coopFeeForm,
                    licenseYear: e.target.value,
                  })
                }
                className="w-full border p-2 rounded text-sm outline-none focus:border-orange-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-1">
                رقم الخدمة
              </label>
              <input
                type="text"
                value={coopFeeForm.serviceNumber}
                onChange={(e) =>
                  setCoopFeeForm({
                    ...coopFeeForm,
                    serviceNumber: e.target.value,
                  })
                }
                className="w-full border p-2 rounded text-sm outline-none focus:border-orange-400 bg-white"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-[10px] font-bold text-gray-600 mb-1">
                اسم الجهة (الأمانة / القطاع)
              </label>
              <input
                type="text"
                value={coopFeeForm.entityName}
                onChange={(e) =>
                  setCoopFeeForm({
                    ...coopFeeForm,
                    entityName: e.target.value,
                  })
                }
                placeholder="مثال: أمانة منطقة الرياض"
                className="w-full border p-2 rounded text-sm outline-none focus:border-orange-400 bg-white"
              />
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button
            onClick={() => setIsCoopFeeModalOpen(false)}
            className="px-6 py-2.5 border border-gray-300 rounded-xl bg-white text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={() => {
              if (coopFeeForm.officeId === "")
                return toast.error("يرجى اختيار المكتب");
              saveCoopFeeMutation.mutate(coopFeeForm);
            }}
            disabled={saveCoopFeeMutation.isPending}
            className="px-8 py-2.5 bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-md hover:bg-cyan-800 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {saveCoopFeeMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}{" "}
            {coopFeeMode === "add" ? "حفظ التكلفة" : "تعديل التكلفة"}
          </button>
        </div>
      </div>
    </div>
  );
};

// 7. نافذة تسديد أتعاب (للمعقب أو الوسيط)
export const PayPersonModal = ({
  payPersonData,
  setPayPersonData,
  payPersonMutation,
  payRemoteTaskMutation,
  tx,
  remoteWorkersList,
  exchangeRates,
}) => {
  if (!payPersonData) return null;
  return (
    <div
      className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 animate-in fade-in"
      dir="rtl"
      onClick={(e) => {
        e.stopPropagation();
        setPayPersonData(null);
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-emerald-700 p-5 flex justify-between items-center text-white">
          <div>
            <span className="font-bold flex items-center gap-2 text-[15px]">
              <Banknote className="w-5 h-5 text-emerald-200" /> تسديد مستحقات (
              {payPersonData.targetType})
            </span>
            <span className="text-[11px] text-emerald-200 mt-1 block">
              الاسم: {payPersonData.workerName} | التفاصيل:{" "}
              {payPersonData.taskName}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPayPersonData(null);
            }}
            className="p-1 rounded-md hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-3">
              مقدار الدفعة
            </label>
            <div className="flex gap-2 p-1 bg-gray-50 border border-gray-200 rounded-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPayPersonData({
                    ...payPersonData,
                    paymentType: "full",
                    amountSar: payPersonData.totalCost,
                  });
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${payPersonData.paymentType === "full" ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-200"}`}
              >
                كامل المتبقي ({payPersonData.totalCost} ر.س)
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPayPersonData({
                    ...payPersonData,
                    paymentType: "partial",
                    amountSar: "",
                  });
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${payPersonData.paymentType === "partial" ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-200"}`}
              >
                جزء من المبلغ
              </button>
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <label className="text-xs font-black text-emerald-800 block mb-3">
              المبلغ الفعلي المدفوع (اكتب بأي عملة)
            </label>
            <TripleCurrencyInput
              valueSar={payPersonData.amountSar}
              onChangeSar={(v) =>
                setPayPersonData({ ...payPersonData, amountSar: v })
              }
              rates={exchangeRates}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-2">
              تاريخ الدفع
            </label>
            <input
              type="date"
              value={payPersonData.paymentDate}
              onChange={(e) =>
                setPayPersonData({
                  ...payPersonData,
                  paymentDate: e.target.value,
                })
              }
              className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold outline-none focus:border-emerald-500 bg-white"
            />
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPayPersonData(null);
            }}
            className="px-6 py-2.5 border border-gray-300 rounded-xl bg-white text-sm font-bold text-gray-700 hover:bg-gray-100"
          >
            إلغاء
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!payPersonData.amountSar)
                return toast.error("الرجاء إدخال المبلغ");

              const payload = {
                targetType: payPersonData.targetType,
                targetId:
                  payPersonData.targetId ||
                  remoteWorkersList.find(
                    (w) => w.name === payPersonData.workerName,
                  )?.id,
                transactionId: tx.id,
                amount: parseFloat(payPersonData.amountSar),
                status: "DELIVERED",
                source: "سداد مباشر من المعاملة",
                notes: `تاريخ الدفع: ${payPersonData.paymentDate} | نوع السداد: ${payPersonData.paymentType === "full" ? "سداد كلي للمتبقي" : "سداد جزئي"}`,
              };

              payPersonMutation.mutate(payload);

              if (
                payPersonData.targetType === "موظف عن بعد" &&
                payPersonData.taskId
              ) {
                payRemoteTaskMutation.mutate({
                  taskId: payPersonData.taskId,
                  workerId: payload.targetId,
                  transactionId: tx.id,
                  amountSar: payload.amount,
                  paymentDate: payPersonData.paymentDate,
                  isFullPayment: payPersonData.paymentType === "full",
                });
              }
            }}
            disabled={
              payPersonMutation.isPending || payRemoteTaskMutation.isPending
            }
            className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {payPersonMutation.isPending || payRemoteTaskMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Banknote className="w-4 h-4" />
            )}
            تأكيد الدفع
          </button>
        </div>
      </div>
    </div>
  );
};

// 8. نافذة تسديد أتعاب (مهمة عمل عن بعد)
export const PayTaskModal = ({
  payTaskData,
  setPayTaskData,
  remoteWorkersList,
  tx,
  exchangeRates,
  payRemoteTaskMutation,
}) => {
  if (!payTaskData) return null;
  return (
    <div
      className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 animate-in fade-in"
      dir="rtl"
      onClick={(e) => {
        e.stopPropagation();
        setPayTaskData(null);
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-emerald-700 p-5 flex justify-between items-center text-white">
          <div>
            <span className="font-bold flex items-center gap-2 text-[15px]">
              <Banknote className="w-5 h-5 text-emerald-200" /> تسديد أتعاب موظف
            </span>
            <span className="text-[11px] text-emerald-200 mt-1 block">
              الموظف: {payTaskData.workerName} | المهمة: {payTaskData.taskName}
            </span>
          </div>
          <button
            onClick={() => setPayTaskData(null)}
            className="p-1 rounded-md hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* خيارات الدفع */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-3">
              مقدار الدفعة
            </label>
            <div className="flex gap-2 p-1 bg-gray-50 border border-gray-200 rounded-lg">
              <button
                onClick={() =>
                  setPayTaskData({
                    ...payTaskData,
                    paymentType: "full",
                    amountSar: payTaskData.totalCost,
                  })
                }
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${payTaskData.paymentType === "full" ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-200"}`}
              >
                كامل المبلغ ({payTaskData.totalCost} ر.س)
              </button>
              <button
                onClick={() =>
                  setPayTaskData({
                    ...payTaskData,
                    paymentType: "partial",
                    amountSar: "",
                  })
                }
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${payTaskData.paymentType === "partial" ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-200"}`}
              >
                جزء من المبلغ
              </button>
            </div>
          </div>

          {/* محول العملات الثلاثي */}
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <label className="text-xs font-black text-emerald-800 block mb-3">
              المبلغ الفعلي المدفوع (اكتب بأي عملة)
            </label>
            <TripleCurrencyInput
              valueSar={payTaskData.amountSar}
              onChangeSar={(v) =>
                setPayTaskData({ ...payTaskData, amountSar: v })
              }
              rates={exchangeRates}
            />
          </div>

          {/* التاريخ */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-2">
              تاريخ الدفع
            </label>
            <input
              type="date"
              value={payTaskData.paymentDate}
              onChange={(e) =>
                setPayTaskData({
                  ...payTaskData,
                  paymentDate: e.target.value,
                })
              }
              className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold outline-none focus:border-emerald-500 bg-white"
            />
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={() => setPayTaskData(null)}
            className="px-6 py-2.5 border border-gray-300 rounded-xl bg-white text-sm font-bold text-gray-700 hover:bg-gray-100"
          >
            إلغاء
          </button>
          <button
            onClick={() => {
              if (!payTaskData.amountSar)
                return toast.error("الرجاء إدخال المبلغ");

              // تجميع الـ Payload لإرساله للباك إند
              const payload = {
                taskId: payTaskData.taskId,
                workerId: remoteWorkersList.find(
                  (w) => w.name === payTaskData.workerName,
                )?.id, // استخراج ID الموظف
                transactionId: tx.id,
                amountSar: parseFloat(payTaskData.amountSar),
                paymentDate: payTaskData.paymentDate,
                isFullPayment: payTaskData.paymentType === "full",
              };

              payRemoteTaskMutation.mutate(payload);
            }}
            disabled={payRemoteTaskMutation.isPending}
            className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {payRemoteTaskMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Banknote className="w-4 h-4" />
            )}
            تأكيد الدفع
          </button>
        </div>
      </div>
    </div>
  );
};
