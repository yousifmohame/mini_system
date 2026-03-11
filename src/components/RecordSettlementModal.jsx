import React, { useState } from "react";
import { X, HandCoins, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios"; // 👈 مسار axios

export function RecordSettlementModal({ onClose }) {
  const queryClient = useQueryClient();
  const [settlementType, setSettlementType] = useState("وسيط");
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  // جلب الأشخاص المرتبطين بالنوع المختار
  const { data: persons = [] } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => (await api.get("/persons")).data.data,
  });

  const filteredPersons = persons.filter(p => p.role === settlementType);

  // 💡 ربط الإضافة بالباك إند
  const settlementMutation = useMutation({
    mutationFn: async (data) => await api.post("/private-settlements", data),
    onSuccess: () => {
      toast.success("تم تسجيل التسوية (المستحق) بنجاح");
      queryClient.invalidateQueries(["broker-settlements"]);
      queryClient.invalidateQueries(["private-settlements"]);
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "حدث خطأ أثناء تسجيل التسوية");
    }
  });

  const handleSubmit = () => {
    if (!targetId || !amount) return toast.error("يرجى تعبئة الحقول المطلوبة (الاسم والمبلغ)");
    
    settlementMutation.mutate({
      type: settlementType,
      targetId: targetId,
      amount: parseFloat(amount),
      source: source,
      notes: notes
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" dir="rtl">
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-blue-600" />
            <span className="text-gray-800 text-[15px] font-bold">تسجيل تسوية (إضافة مستحق)</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-1 rounded-md transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block mb-2 text-gray-700 text-xs font-bold">نوع التسوية</label>
            <div className="flex gap-2">
              {["شريك", "وسيط", "معقب", "صاحب مصلحة", "موظف"].map((t) => (
                <button
                  key={t}
                  onClick={() => { setSettlementType(t); setTargetId(""); }}
                  className={`px-4 py-1.5 rounded-lg transition-colors text-xs font-bold ${settlementType === t ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >{t}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-gray-700 text-xs font-bold">الاسم (مستحق الدفع له) *</label>
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 text-gray-800 h-[38px] text-xs outline-none focus:border-blue-500 font-bold">
               <option value="">اختر {settlementType}...</option>
               {filteredPersons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block mb-1.5 text-gray-700 text-xs font-bold">المبلغ (ر.س) *</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 text-blue-700 font-mono font-bold h-[38px] text-sm outline-none focus:border-blue-500" placeholder="0" />
          </div>

          <div>
            <label className="block mb-1.5 text-gray-700 text-xs font-bold">المصدر (اختياري)</label>
            <input type="text" value={source} onChange={(e) => setSource(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 text-gray-800 h-[38px] text-xs outline-none focus:border-blue-500" placeholder="مصدر التسوية (رقم معاملة، مشروع...)" />
          </div>

          <div>
            <label className="block mb-1.5 text-gray-700 text-xs font-bold">ملاحظات</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 resize-none h-[60px] text-xs outline-none focus:border-blue-500" placeholder="ملاحظات إضافية..." />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="px-5 py-2 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-colors">إلغاء</button>
          <button onClick={handleSubmit} disabled={settlementMutation.isPending} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50">
            {settlementMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} حفظ التسوية
          </button>
        </div>
      </div>
    </div>
  );
}