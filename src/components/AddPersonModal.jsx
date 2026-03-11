import React, { useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios"; // 👈 تأكد من المسار

export function AddPersonModal({ type, onClose }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [notes, setNotes] = useState("");

  const typeConfig = {
    معقب: { title: "إضافة معقب جديد", color: "#2563eb", bg: "bg-blue-600" },
    وسيط: { title: "إضافة وسيط جديد", color: "#16a34a", bg: "bg-green-600" },
    "صاحب مصلحة": {
      title: "إضافة صاحب مصلحة جديد",
      color: "#d97706",
      bg: "bg-amber-600",
    },
  };

  const config = typeConfig[type] || typeConfig["وسيط"];

  // 💡 ربط الإضافة بالباك إند
  const addMutation = useMutation({
    mutationFn: async (newPerson) => await api.post("/persons", newPerson),
    onSuccess: () => {
      toast.success(`تم تسجيل ${type} "${name}" بنجاح وإضافته لقاعدة البيانات`);
      queryClient.invalidateQueries(["persons-directory"]); // تحديث القوائم
      queryClient.invalidateQueries(["persons-list"]);
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "حدث خطأ أثناء إضافة الشخص");
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) return toast.error("يرجى إدخال الاسم الرباعي");

    addMutation.mutate({
      name,
      phone,
      idNumber,
      notes,
      role: type, // تحديد نوع الشخص (وسيط، معقب، صاحب مصلحة)
      status: "نشط",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      dir="rtl"
    >
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" style={{ color: config.color }} />
            <span className="text-gray-800 text-[15px] font-bold">
              {config.title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3 rounded-lg mb-2">
            <span className="text-xs font-bold text-gray-600">
              التصنيف الوظيفي بالسيستم
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: config.color }}
            >
              {type}
            </span>
          </div>

          <div>
            <label className="block mb-1.5 text-gray-700 text-xs font-bold">
              الاسم الكامل *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 text-gray-800 h-[40px] text-xs font-bold outline-none focus:border-blue-500"
              placeholder={`اسم ${type} الرباعي`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-gray-700 text-xs font-bold">
                رقم الجوال
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 text-gray-800 font-mono h-[40px] text-xs outline-none focus:border-blue-500"
                placeholder="05xxxxxxxx"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-gray-700 text-xs font-bold">
                رقم الهوية
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 text-gray-800 font-mono h-[40px] text-xs outline-none focus:border-blue-500"
                placeholder="الهوية الوطنية"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-gray-700 text-xs font-bold">
              ملاحظات ومهام مخصصة
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 resize-none h-[60px] text-xs outline-none focus:border-blue-500"
              placeholder="أي ملاحظات تخص التعامل المالي أو الإداري معه..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={addMutation.isPending}
            className={`px-6 py-2 rounded-lg text-white hover:opacity-90 text-xs font-bold shadow-sm transition-opacity flex items-center gap-2 disabled:opacity-50 ${config.bg}`}
          >
            {addMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            حفظ وإضافة
          </button>
        </div>
      </div>
    </div>
  );
}
