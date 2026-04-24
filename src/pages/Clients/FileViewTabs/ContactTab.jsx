import React from "react";
import { CheckCircle, Phone, MessageCircle, Mail, PhoneCall, MapPin, Building, Home } from "lucide-react";

const ContactTab = ({ client, openWhatsApp }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* بطاقة التواصل الأساسية */}
        <div className="flex-1 p-5 bg-slate-50 border-2 border-emerald-500 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <h3 className="font-bold">بطاقة التواصل الأساسية</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Phone className="w-3 h-3 text-blue-500" /> الجوال الرئيسي</span>
              <span className="font-bold dir-ltr text-left">{client.contact?.mobile || "—"}</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><MessageCircle className="w-3 h-3 text-green-500" /> واتساب</span>
                <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{client.contact?.whatsapp ? "مسجل" : "غير مسجل"}</span>
              </div>
              <span className="font-bold dir-ltr text-left">{client.contact?.whatsapp || "—"}</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Mail className="w-3 h-3 text-amber-500" /> البريد الإلكتروني</span>
              <span className="font-bold text-sm">{client.contact?.email || "—"}</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><PhoneCall className="w-3 h-3 text-slate-400" /> رقم إضافي</span>
              <span className="font-bold text-sm dir-ltr text-left">{client.contact?.additionalPhone || "—"}</span>
            </div>
          </div>
        </div>

        {/* أزرار سريعة */}
        <div className="w-full lg:w-48 flex flex-col gap-2">
          <button onClick={() => openWhatsApp(client.contact?.mobile)} className="flex-1 bg-green-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 shadow-sm">
            <MessageCircle className="w-4 h-4" /> مراسلة واتساب
          </button>
          <a href={`tel:${client.contact?.mobile}`} className="flex-1 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 shadow-sm">
            <PhoneCall className="w-4 h-4" /> اتصال مباشر
          </a>
          <a href={`mailto:${client.contact?.email}`} className="flex-1 bg-amber-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-700 shadow-sm">
            <Mail className="w-4 h-4" /> إرسال بريد
          </a>
        </div>
      </div>

      {/* العنوان الوطني */}
      <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
        <h4 className="flex items-center gap-2 text-blue-800 font-bold mb-4">
          <MapPin className="w-5 h-5" /> العنوان الوطني
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "المدينة", v: client.address?.city || "—", i: Building },
            { l: "الحي", v: client.address?.district || "—", i: Home },
            { l: "الشارع", v: client.address?.street || "—", i: MapPin },
            { l: "رقم المبنى", v: client.address?.buildingNo || "—", i: Building },
            { l: "رقم الوحدة", v: client.address?.unitNo || "—", i: Home },
            { l: "الرمز البريدي", v: client.address?.zipCode || "—", i: MapPin },
            { l: "الرقم الإضافي", v: client.address?.additionalNo || "—", i: Building },
            { l: "الرمز المختصر", v: client.address?.shortCodeEn || "—", i: Home },
          ].map((item, i) => (
            <div key={i} className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mb-1">
                <item.i className="w-3 h-3 text-blue-400" /> {item.l}
              </div>
              <div className="font-bold text-sm text-slate-800">{item.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactTab;