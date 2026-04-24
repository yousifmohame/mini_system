import React from "react";
import {
  User,
  ShieldCheck,
  Eye,
  FileText,
  DollarSign,
  FileCheck,
  Award,
  Receipt,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

const SummaryTab = ({
  client,
  clientName,
  englishName,
  isPhotoBlurred,
  setIsPhotoBlurred,
  isIdMasked,
  setIsIdMasked,
  maskId,
  formatDate,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h3 className="text-lg font-bold text-slate-800">ملخص العميل</h3>

      {/* بطاقة الملخص السريع */}
      <div className="flex flex-col md:flex-row gap-5 p-5 bg-slate-50 border border-slate-200 rounded-xl items-center">
        <div className="relative">
          <div
            className={`w-20 h-24 rounded-xl overflow-hidden border-2 border-blue-500/20 bg-indigo-50 flex items-center justify-center transition-all ${isPhotoBlurred ? "blur-md" : ""}`}
          >
            <User className="w-9 h-9 text-indigo-400" />
          </div>
          <button
            onClick={() => setIsPhotoBlurred(!isPhotoBlurred)}
            className="absolute -top-1 -left-1 p-1 bg-slate-400 text-white rounded-md border-2 border-white flex items-center gap-1 hover:bg-slate-500"
          >
            <ShieldCheck className="w-3 h-3" />
          </button>
        </div>
        <div className="flex-1 text-center md:text-right">
          <div className="text-xl font-bold text-slate-800 mb-1">
            {clientName}
          </div>
          <div className="text-sm text-slate-500 dir-ltr text-left md:text-right mb-2">
            {englishName || "—"}
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <div className="text-xs text-slate-500">
              رقم الهوية:{" "}
              <strong className="text-blue-800 font-mono">
                {isIdMasked
                  ? maskId(client.identification?.idNumber)
                  : client.identification?.idNumber || "—"}
              </strong>
              <button
                onClick={() => setIsIdMasked(!isIdMasked)}
                className="ml-2 text-blue-500 hover:text-blue-700 inline-block"
              >
                <Eye className="w-3 h-3 inline" />
              </button>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                {client.type || "غير محدد"}
              </span>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                {client.nationality || "سعودي"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold text-blue-800">المعاملات</span>
          </div>
          <div className="text-3xl font-black text-blue-800">
            {client._count?.transactions || 0}
          </div>
          <div className="text-xs text-blue-400 mt-1">إجمالي المعاملات</div>
        </div>
        <div className="p-5 bg-green-50 border border-green-100 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm font-bold text-green-800">التحصيل</span>
          </div>
          <div className="text-3xl font-black text-green-700">
            {(client.totalFees || 0).toLocaleString()}
          </div>
          <div className="text-xs text-green-500 mt-1">ريال سعودي</div>
        </div>
        <div className="p-5 bg-amber-50 border border-amber-100 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileCheck className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-bold text-amber-800">الوثائق</span>
          </div>
          <div className="text-3xl font-black text-amber-700">
            {client._count?.attachments || 0}
          </div>
          <div className="text-xs text-amber-500 mt-1">مستند مرفوع</div>
        </div>
        <div className="p-5 bg-pink-50 border border-pink-100 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="w-5 h-5 text-pink-600" />
            <span className="text-sm font-bold text-pink-800">التقييم</span>
          </div>
          <div className="text-3xl font-black text-pink-700">
            {client.grade || "-"}
          </div>
          <div className="text-xs text-pink-500 mt-1">مستوى العميل</div>
        </div>
        <div className="p-5 bg-cyan-50 border border-cyan-100 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Receipt className="w-5 h-5 text-cyan-600" />
            <span className="text-sm font-bold text-cyan-800">العروض</span>
          </div>
          <div className="text-3xl font-black text-cyan-700">
            {client._count?.quotations || 0}
          </div>
          <div className="text-xs text-cyan-500 mt-1">عروض أسعار</div>
        </div>
      </div>

      {/* معلومات إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl">
          <h4 className="font-bold text-slate-700 mb-3">معلومات الاتصال</h4>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />{" "}
              <span dir="ltr">{client.contact?.mobile || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />{" "}
              {client.contact?.email || "—"}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />{" "}
              {client.address?.city || ""}{" "}
              {client.address?.district ? `- ${client.address.district}` : ""}
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl">
          <h4 className="font-bold text-slate-700 mb-3">الحالة والنشاط</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">الحالة:</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${client.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {client.isActive ? "نشط" : "غير نشط"}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">تاريخ الإضافة:</span>
              <span className="font-bold text-slate-800">
                {formatDate(client.createdAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">تم الإضافة بواسطة:</span>
              <span className="font-bold text-slate-800">النظام</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryTab;
