import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../api/axios";
import { useAppStore } from "../../../stores/useAppStore";
import {
  Save,
  X,
  Loader2,
  User,
  Phone,
  CreditCard,
  Building,
} from "lucide-react";

const CreateClientForm = () => {
  const queryClient = useQueryClient();
  const { removeTab, setActiveTab } = useAppStore();

  const [formData, setFormData] = useState({
    firstName: "",
    fatherName: "",
    grandFatherName: "",
    familyName: "",
    mobile: "",
    email: "",
    idNumber: "",
    type: "INDIVIDUAL", // فرد، شركة...
    category: "عام",
    notes: "",
  });

  const [error, setError] = useState("");

  // إعداد Mutation للإرسال للسيرفر
  const createMutation = useMutation({
    mutationFn: async (newClientData) => {
      // نرسل البيانات للهيكل الذي يتوقعه الباك إند الجديد
      const payload = {
        ...newClientData,
        // تجميع الاسم في كائن JSON
        name: {
          firstName: newClientData.firstName,
          fatherName: newClientData.fatherName,
          grandFatherName: newClientData.grandFatherName,
          familyName: newClientData.familyName,
          ar: `${newClientData.firstName} ${newClientData.fatherName} ${newClientData.familyName}`, // للتسهيل
        },
      };
      const res = await api.post("/clients", payload);
      return res.data;
    },
    onSuccess: () => {
      // 1. تحديث الجدول في الخلفية
      queryClient.invalidateQueries(["clients"]);
      // 2. إغلاق تبويب الإضافة
      removeTab("300", "300-NEW");
      // 3. العودة لتبويب القائمة
      setActiveTab("300", "300-LST");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "حدث خطأ أثناء حفظ العميل");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    createMutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100 my-6">
      <div className="flex items-center justify-between mb-8 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            تسجيل عميل جديد
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            يتم توليد كود العميل وحساب التصنيف تلقائياً بواسطة النظام
          </p>
        </div>
        <button
          onClick={() => removeTab("300", "300-NEW")}
          className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center">
          <X className="w-4 h-4 ml-2" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* قسم 1: البيانات الشخصية */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-4 mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 p-2 rounded w-fit">
            <span>1</span> المعلومات الشخصية (الاسم الرباعي)
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              الاسم الأول <span className="text-red-500">*</span>
            </label>
            <input
              required
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="مثال: محمد"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              اسم الأب
            </label>
            <input
              name="fatherName"
              value={formData.fatherName}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="مثال: عبدالله"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              اسم الجد
            </label>
            <input
              name="grandFatherName"
              value={formData.grandFatherName}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="مثال: عبدالرحمن"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              العائلة <span className="text-red-500">*</span>
            </label>
            <input
              required
              name="familyName"
              value={formData.familyName}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="مثال: القحطاني"
            />
          </div>
        </div>

        {/* قسم 2: الهوية والاتصال */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-dashed">
          <div className="md:col-span-3 mb-1 flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 p-2 rounded w-fit">
            <span>2</span> بيانات الهوية والاتصال
          </div>

          <div className="space-y-1 relative">
            <label className="text-xs font-medium text-gray-700">
              رقم الهوية / السجل <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                required
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                className="w-full p-2 pl-10 border rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-left direction-ltr"
                placeholder="10xxxxxxxxx"
              />
            </div>
          </div>

          <div className="space-y-1 relative">
            <label className="text-xs font-medium text-gray-700">
              رقم الجوال <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                required
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className="w-full p-2 pl-10 border rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-left direction-ltr"
                placeholder="05xxxxxxxx"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-left direction-ltr"
              placeholder="client@mail.com"
            />
          </div>
        </div>

        {/* قسم 3: التصنيف */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-dashed">
          <div className="md:col-span-3 mb-1 flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 p-2 rounded w-fit">
            <span>3</span> بيانات الملف
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              نوع العميل <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-2 pl-10 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="INDIVIDUAL">فرد (مواطن/مقيم)</option>
                <option value="COMPANY">شركة / مؤسسة</option>
                <option value="GOV">جهة حكومية</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              فئة التعامل
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="عام">عميل عام</option>
              <option value="VIP">عميل مميز (VIP)</option>
              <option value="مستثمر">مستثمر عقاري</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              ملاحظات أولية
            </label>
            <input
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="أي تفاصيل إضافية..."
            />
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => removeTab("300", "300-NEW")}
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            إلغاء
          </button>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-8 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                حفظ العميل
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateClientForm;
