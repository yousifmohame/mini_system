import React, { useState } from "react";
import { X, Banknote, CreditCard, Upload, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

export function SettlementDeliveryModal({ onClose, preselectedType }) {
  const queryClient = useQueryClient();
  const [partyType, setPartyType] = useState(preselectedType || "وسيط");
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("نقدي");
  const [deliveredById, setDeliveredById] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);

  // جلب الأشخاص
  const { data: persons = [] } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => (await api.get("/persons")).data.data,
  });

  const filteredPersons = persons.filter(p => p.role === partyType);
  const employees = persons.filter(p => p.role === "موظف" || p.role === "مدير");

  // 💡 ربط الإضافة بالباك إند ورفع المرفق
  const deliveryMutation = useMutation({
    mutationFn: async (formData) => {
      return await api.post("/private-settlements/deliver", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    },
    onSuccess: () => {
      toast.success("تم تسجيل تسليم التسوية وصرف المبلغ بنجاح");
      queryClient.invalidateQueries(["broker-payments"]);
      queryClient.invalidateQueries(["private-settlements"]);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || "حدث خطأ")
  });

  const handleSubmit = () => {
    if (!recipientId || !amount) return toast.error("يرجى تعبئة الحقول المطلوبة (المستلم والمبلغ)");

    const formData = new FormData();
    formData.append("type", partyType);
    formData.append("targetId", recipientId);
    formData.append("amount", amount);
    formData.append("method", deliveryMethod);
    if (deliveredById) formData.append("deliveredById", deliveredById);
    if (notes) formData.append("notes", notes);
    if (file) formData.append("file", file); // المرفق

    deliveryMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" dir="rtl">
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-lg overflow-y-auto animate-in zoom-in-95" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-green-600" />
            <span className="text-gray-800 text-[15px] font-bold">تسليم تسوية (صرف مبالغ)</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-1 rounded-md transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block mb-2 text-gray-700 text-xs font-bold">نوع الطرف *</label>
            <div className="flex gap-2 flex-wrap">
              {["شريك", "وسيط", "معقب", "صاحب مصلحة", "موظف"].map((t) => (
                <button
                  key={t}
                  onClick={() => { setPartyType(t); setRecipientId(""); }}
                  className={`px-3 py-1.5 rounded-lg transition-colors text-xs font-bold ${partyType === t ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >{t}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-gray-700 text-xs font-bold">المستلم *</label>
            <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 text-gray-800 h-[38px] text-xs font-bold outline-none focus:border-blue-500">
               <option value="">اختر {partyType}...</option>
               {filteredPersons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block mb-1.5 text-gray-700 text-xs font-bold">المبلغ المسلم (ر.س) *</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 text-green-700 font-mono font-black h-[40px] text-lg outline-none focus:border-green-500" placeholder="0" />
          </div>

          <div>
            <label className="block mb-2 text-gray-700 text-xs font-bold">طريقة التسليم</label>
            <div className="flex gap-2">
              <button onClick={() => setDeliveryMethod("نقدي")} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-colors ${deliveryMethod === "نقدي" ? "bg-green-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                <Banknote className="w-4 h-4" /> نقدي
              </button>
              <button onClick={() => setDeliveryMethod("تحويل بنكي")} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-colors ${deliveryMethod === "تحويل بنكي" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                <CreditCard className="w-4 h-4" /> تحويل بنكي
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-gray-700 text-xs font-bold">تاريخ التسليم</label>
              <input type="date" defaultValue={new Date().toISOString().split("T")[0]} className="w-full bg-white border border-gray-300 rounded-lg px-3 text-gray-800 h-[38px] text-xs outline-none focus:border-blue-500" />
            </div>
            <div>
               <label className="block mb-1.5 text-gray-700 text-xs font-bold">المسلِّم (الموظف)</label>
               <select value={deliveredById} onChange={(e) => setDeliveredById(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 text-gray-800 h-[38px] text-xs outline-none focus:border-blue-500">
                  <option value="">اختر المسلّم...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
               </select>
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-gray-700 text-xs font-bold">مرفق (إيصال أو حوالة)</label>
            <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-colors">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-xs font-bold">{file ? file.name : "اضغط لاختيار ملف الإيصال (صورة أو PDF)"}</span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="px-5 py-2 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-colors">إلغاء</button>
          <button onClick={handleSubmit} disabled={deliveryMutation.isPending} className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-xs font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50">
            {deliveryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-3.5 h-3.5"/>} اعتماد الصرف
          </button>
        </div>
      </div>
    </div>
  );
}