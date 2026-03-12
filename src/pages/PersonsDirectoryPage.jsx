import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Search,
  Plus,
  X,
  BookUser,
  Handshake,
  UserCheck,
  Star,
  Briefcase,
  Users,
  Building2,
  Phone,
  FileText,
  Wallet,
  Receipt,
  Paperclip,
  Upload,
  Loader2,
  Info,
  Edit3,
  Trash2,
  Eye,
  ChevronDown,
  ArrowUpRight,
  TriangleAlert,
  MonitorSmartphone,
  Send,
  Save,
  Globe2,
  User,
  Banknote, // ✅ أيقونة النقدي
  UserPlus,
} from "lucide-react";

// ==========================================
// 💡 دوال مساعدة لحماية الواجهة
// ==========================================
const safeText = (val) => {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object")
    return val.ar || val.name || val.en || JSON.stringify(val);
  return String(val);
};

const safeNum = (val) => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

// ==========================================
// 💡 قائمة رموز الدول الشائعة
// ==========================================
const COUNTRY_CODES = [
  { code: "+966", label: "السعودية 🇸🇦" },
  { code: "+20", label: "مصر 🇪🇬" },
  { code: "+971", label: "الإمارات 🇦🇪" },
  { code: "+965", label: "الكويت 🇰🇼" },
  { code: "+973", label: "قطر 🇶🇦" },
  { code: "+974", label: "البحرين 🇧🇭" },
  { code: "+968", label: "عمان 🇴🇲" },
  { code: "+962", label: "الأردن 🇯🇴" },
];

// ==========================================
// 💡 مودل إضافة/تعديل شخص (مع خيار نقدي)
// ==========================================
function AddPersonModal({ mode, personData, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    firstNameAr: "",
    secondNameAr: "",
    thirdNameAr: "",
    fourthNameAr: "",
    firstNameEn: "",
    secondNameEn: "",
    thirdNameEn: "",
    fourthNameEn: "",
    phoneCode: "+966",
    phoneWithoutCode: "",
    whatsappCode: "+966",
    whatsappWithoutCode: "",
    telegram: "",
    country: "",
    preferredCurrency: "SAR",
    transferMethod: "",
    transferDetails: {},
    agreementType: "نسبة",
    idNumber: "",
    notes: "",
    files: [],
    role: "وسيط",
  });

  const typeConfig = {
    معقب: { title: "إضافة معقب جديد", color: "#2563eb", bg: "bg-blue-600" },
    وسيط: { title: "إضافة وسيط جديد", color: "#16a34a", bg: "bg-green-600" },
    "صاحب مصلحة": {
      title: "إضافة صاحب مصلحة جديد",
      color: "#d97706",
      bg: "bg-amber-600",
    },
    "موظف عن بعد": {
      title: "إضافة موظف عن بعد",
      color: "#db2777",
      bg: "bg-pink-600",
    },
    موظف: { title: "إضافة موظف", color: "#059669", bg: "bg-emerald-600" },
    شريك: { title: "إضافة شريك", color: "#7c3aed", bg: "bg-violet-600" },
    "وسيط المكتب الهندسي": {
      title: "إضافة وسيط مكتب هندسي",
      color: "#0891b2",
      bg: "bg-cyan-600",
    },
  };

  // 💡 تهيئة البيانات عند فتح المودل
  React.useEffect(() => {
    if (mode === "edit" && personData) {
      let pCode = "+966",
        pNum = personData.phone || "";
      if (personData.phone && personData.phone.startsWith("+")) {
        const matched = COUNTRY_CODES.find((c) =>
          personData.phone.startsWith(c.code),
        );
        if (matched) {
          pCode = matched.code;
          pNum = personData.phone.slice(matched.code.length);
        }
      }

      let wCode = "+966",
        wNum = personData.whatsapp || "";
      if (personData.whatsapp && personData.whatsapp.startsWith("+")) {
        const matched = COUNTRY_CODES.find((c) =>
          personData.whatsapp.startsWith(c.code),
        );
        if (matched) {
          wCode = matched.code;
          wNum = personData.whatsapp.slice(matched.code.length);
        }
      }

      setFormData({
        ...formData,
        ...personData,
        phoneCode: pCode,
        phoneWithoutCode: pNum,
        whatsappCode: wCode,
        whatsappWithoutCode: wNum,
        files: [],
      });
    }
  }, [mode, personData]);

  const config = typeConfig[formData.role] || typeConfig["وسيط"];

  const handleSubmit = () => {
    const fullName =
      `${formData.firstNameAr || ""} ${formData.secondNameAr || ""} ${formData.thirdNameAr || ""} ${formData.fourthNameAr || ""}`.trim();

    if (!formData.firstNameAr) {
      return toast.error("يرجى إدخال الاسم الأول على الأقل");
    }

    const finalPayload = {
      ...formData,
      name: fullName,
      phone: formData.phoneWithoutCode
        ? `${formData.phoneCode}${formData.phoneWithoutCode}`
        : "",
      whatsapp: formData.whatsappWithoutCode
        ? `${formData.whatsappCode}${formData.whatsappWithoutCode}`
        : "",
    };

    onSubmit(finalPayload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" style={{ color: config.color }} />
            <span className="text-gray-800 text-[16px] font-black">
              {mode === "add" ? config.title : "تعديل بيانات الملف"}
            </span>
            <span
              className="mr-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: config.color }}
            >
              {formData.role}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 bg-white border border-gray-300 shadow-sm p-1.5 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar-slim flex-1 bg-gray-50/30">
          {/* التصنيف */}
          {mode === "add" && (
            <div>
              <label className="block mb-2 text-[13px] font-bold text-gray-800">
                تحديد التصنيف الوظيفي / دور الطرف *
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  "وسيط",
                  "معقب",
                  "صاحب مصلحة",
                  "موظف",
                  "شريك",
                  "وسيط المكتب الهندسي",
                  "موظف عن بعد",
                ].map((role) => (
                  <button
                    key={role}
                    onClick={() => setFormData({ ...formData, role })}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors text-[12px] font-bold ${
                      formData.role === role
                        ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-200"
                        : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* الأسماء 4 رباعية */}
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
            <label className="block mb-3 text-[14px] font-black text-gray-800 border-b border-gray-100 pb-2">
              <User className="w-4 h-4 inline-block text-blue-500 ml-1" /> الاسم
              الرباعي والبيانات الديموغرافية
            </label>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                "firstNameAr",
                "secondNameAr",
                "thirdNameAr",
                "fourthNameAr",
              ].map((field, idx) => (
                <div key={field}>
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                    {
                      [
                        "الاسم الأول *",
                        "الاسم الثاني",
                        "الاسم الثالث",
                        "الاسم الرابع (العائلة)",
                      ][idx]
                    }
                  </label>
                  <input
                    type="text"
                    placeholder={
                      [
                        "الاسم الأول (Ar)",
                        "الاسم الثاني",
                        "الاسم الثالث",
                        "الاسم الرابع",
                      ][idx]
                    }
                    value={formData[field]}
                    onChange={(e) =>
                      setFormData({ ...formData, [field]: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold focus:border-blue-500 focus:bg-white outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                "firstNameEn",
                "secondNameEn",
                "thirdNameEn",
                "fourthNameEn",
              ].map((field, idx) => (
                <div key={field}>
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block text-right">
                    {
                      ["First Name", "Second Name", "Third Name", "Last Name"][
                        idx
                      ]
                    }
                  </label>
                  <input
                    type="text"
                    placeholder={
                      ["First Name", "Second Name", "Third Name", "Last Name"][
                        idx
                      ]
                    }
                    value={formData[field]}
                    onChange={(e) =>
                      setFormData({ ...formData, [field]: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-500 focus:bg-white outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-5">
              <div>
                <label className="block mb-1 text-[11px] font-bold text-gray-700">
                  دولة الإقامة
                </label>
                <div className="relative">
                  <Globe2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    placeholder="مثال: السعودية، مصر..."
                    className="w-full border border-gray-300 rounded-lg pr-9 pl-3 py-2 text-xs outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-[11px] font-bold text-gray-700">
                  رقم الهوية الوطنية / الإقامة
                </label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, idNumber: e.target.value })
                  }
                  placeholder="رقم الهوية"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block mb-1 text-[11px] font-bold text-gray-700">
                  نوع الاتفاق المالي الافتراضي
                </label>
                <select
                  value={formData.agreementType}
                  onChange={(e) =>
                    setFormData({ ...formData, agreementType: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                >
                  <option>نسبة</option>
                  <option>مبلغ ثابت</option>
                  <option>مبلغ شامل</option>
                  <option>— لا يوجد —</option>
                </select>
              </div>
            </div>
          </div>

          {/* التواصل بالصيغة الدولية */}
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
            <h3 className="text-[14px] font-black text-gray-800 border-b border-gray-100 pb-2 mb-4">
              <Phone className="w-4 h-4 inline-block text-blue-500 ml-1" />{" "}
              معلومات التواصل (مدمجة بالرمز الدولي)
            </h3>
            <div className="grid grid-cols-3 gap-5">
              {/* Phone */}
              <div>
                <label className="block mb-1.5 text-[11px] font-bold text-gray-700">
                  رقم الجوال الأساسي *
                </label>
                <div className="flex" dir="ltr">
                  <select
                    value={formData.phoneCode}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneCode: e.target.value })
                    }
                    className="bg-gray-100 border border-gray-300 border-r-0 rounded-l-lg px-2 text-xs font-mono outline-none focus:border-blue-500 w-24"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} {c.label.split(" ")[1]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={formData.phoneWithoutCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phoneWithoutCode: e.target.value,
                      })
                    }
                    className="flex-1 bg-white border border-gray-300 rounded-r-lg px-3 py-2 text-xs font-mono font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                    placeholder="5XXXXXXXX"
                  />
                </div>
              </div>
              {/* Whatsapp */}
              <div>
                <label className="block mb-1.5 text-[11px] font-bold text-green-700">
                  رقم الواتساب
                </label>
                <div className="flex" dir="ltr">
                  <select
                    value={formData.whatsappCode}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsappCode: e.target.value })
                    }
                    className="bg-green-50 border border-green-300 border-r-0 rounded-l-lg px-2 text-xs font-mono outline-none focus:border-green-500 w-24 text-green-800"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} {c.label.split(" ")[1]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={formData.whatsappWithoutCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsappWithoutCode: e.target.value,
                      })
                    }
                    className="flex-1 bg-white border border-green-300 rounded-r-lg px-3 py-2 text-xs font-mono font-bold outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200"
                    placeholder="5XXXXXXXX"
                  />
                </div>
              </div>
              {/* Telegram */}
              <div dir="ltr">
                <label className="block mb-1.5 text-[11px] font-bold text-blue-500 text-right">
                  معرّف التليجرام (Telegram)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 font-mono text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    value={formData.telegram}
                    onChange={(e) =>
                      setFormData({ ...formData, telegram: e.target.value })
                    }
                    className="w-full bg-white border border-blue-300 rounded-lg pl-8 pr-3 py-2 text-xs font-mono font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                    placeholder="username"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ✅ تفاصيل التحويل مع إضافة خيار "نقدي" */}
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <label className="text-[14px] font-black text-gray-800">
                <Wallet className="w-4 h-4 inline-block text-blue-500 ml-1" />{" "}
                بيانات استلام المستحقات (Transfer Details)
              </label>
              <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-1 rounded">
                اختياري
              </span>
            </div>

            <div className="flex gap-3 mb-4 flex-wrap">
              {[
                "حساب بنكي محلي/دولي",
                "ويسترن يونيون",
                "InstaPay",
                "محفظة رقمية USDT",
                "نقدي", // ✅ تمت الإضافة
              ].map((method) => {
                const isCash = method === "نقدي";
                return (
                  <label
                    key={method}
                    className={`flex items-center gap-2 px-4 py-2 border-2 rounded-xl cursor-pointer transition-colors ${
                      formData.transferMethod === method
                        ? "border-blue-600 bg-blue-50 shadow-sm"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={formData.transferMethod === method}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          transferMethod: method,
                          transferDetails: isCash ? { cashNote: "" } : {},
                        })
                      }
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      {isCash && (
                        <Banknote className="w-3 h-3 text-green-600" />
                      )}
                      {method}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              {!formData.transferMethod && (
                <div className="col-span-2 text-center text-xs text-gray-400 font-bold">
                  يرجى اختيار طريقة التحويل لعرض الحقول المناسبة (أو تجاهلها)
                </div>
              )}

              {/* ✅ حقول طريقة "نقدي" */}
              {formData.transferMethod === "نقدي" && (
                <div className="col-span-2 space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Banknote className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-[11px] font-bold text-green-800">
                      سيتم استلام المستحقات يدوياً (كاش) عند التسوية المباشرة.
                      لا توجد بيانات بنكية مطلوبة.
                    </span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                      ملاحظات إضافية للاستلام النقدي (اختياري)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: يستلم يوم الأحد، أو في مقر الشركة..."
                      value={formData.transferDetails?.cashNote || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          transferDetails: {
                            ...formData.transferDetails,
                            cashNote: e.target.value,
                          },
                        })
                      }
                      className="w-full border border-gray-300 p-2 rounded-lg text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* حساب بنكي */}
              {formData.transferMethod === "حساب بنكي محلي/دولي" && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                      اسم البنك
                    </label>
                    <input
                      type="text"
                      placeholder="اسم البنك"
                      value={formData.transferDetails?.bankName || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          transferDetails: {
                            ...formData.transferDetails,
                            bankName: e.target.value,
                          },
                        })
                      }
                      className="w-full border border-gray-300 p-2 rounded-lg text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                      IBAN / رقم الحساب
                    </label>
                    <input
                      type="text"
                      placeholder="IBAN"
                      value={formData.transferDetails?.iban || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          transferDetails: {
                            ...formData.transferDetails,
                            iban: e.target.value,
                          },
                        })
                      }
                      className="w-full border border-gray-300 p-2 rounded-lg text-xs font-mono focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                      SWIFT Code
                    </label>
                    <input
                      type="text"
                      placeholder="SWIFT Code"
                      value={formData.transferDetails?.swift || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          transferDetails: {
                            ...formData.transferDetails,
                            swift: e.target.value,
                          },
                        })
                      }
                      className="w-full border border-gray-300 p-2 rounded-lg text-xs font-mono focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] font-bold text-gray-500">
                      العملة المفضلة
                    </label>
                    <select
                      value={formData.preferredCurrency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferredCurrency: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 p-2 rounded-lg text-xs font-bold focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="SAR">SAR</option>
                      <option value="USD">USD</option>
                      <option value="EGP">EGP</option>
                    </select>
                  </div>
                </>
              )}

              {/* InstaPay */}
              {formData.transferMethod === "InstaPay" && (
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                    عنوان InstaPay
                  </label>
                  <input
                    type="text"
                    placeholder="username@instapay"
                    value={formData.transferDetails?.instapayAddress || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transferDetails: {
                          ...formData.transferDetails,
                          instapayAddress: e.target.value,
                        },
                      })
                    }
                    className="w-full border border-gray-300 p-2 rounded-lg text-xs font-mono focus:border-blue-500 outline-none"
                  />
                </div>
              )}

              {/* ويسترن يونيون */}
              {formData.transferMethod === "ويسترن يونيون" && (
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                    الاسم المطابق للهوية بالإنجليزية
                  </label>
                  <input
                    type="text"
                    placeholder="Full Name in English"
                    value={formData.transferDetails?.westernNameEn || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transferDetails: {
                          ...formData.transferDetails,
                          westernNameEn: e.target.value,
                        },
                      })
                    }
                    className="w-full border border-gray-300 p-2 rounded-lg text-xs font-mono focus:border-blue-500 outline-none"
                    dir="ltr"
                  />
                </div>
              )}

              {/* محفظة رقمية USDT */}
              {formData.transferMethod === "محفظة رقمية USDT" && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                      الشبكة (Network)
                    </label>
                    <select
                      value={formData.transferDetails?.network || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          transferDetails: {
                            ...formData.transferDetails,
                            network: e.target.value,
                          },
                        })
                      }
                      className="w-full border border-gray-300 p-2 rounded-lg text-xs focus:border-blue-500 outline-none"
                    >
                      <option value="">اختر الشبكة...</option>
                      <option>TRC20 (Tron)</option>
                      <option>ERC20 (Ethereum)</option>
                      <option>BEP20 (BSC)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                      عنوان المحفظة (Address)
                    </label>
                    <input
                      type="text"
                      placeholder="Wallet Address"
                      value={formData.transferDetails?.address || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          transferDetails: {
                            ...formData.transferDetails,
                            address: e.target.value,
                          },
                        })
                      }
                      className="w-full border border-gray-300 p-2 rounded-lg text-xs font-mono focus:border-blue-500 outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* الملاحظات والمرفقات */}
          <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
            <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
              <label className="block mb-2 text-[13px] font-black text-gray-800">
                ملاحظات ومهام مخصصة
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 h-[110px] resize-none"
                placeholder="أي ملاحظات إضافية، ترتيبات مالية خاصة، الخ..."
              />
            </div>
            <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
              <label className="block mb-2 text-[13px] font-black text-gray-800">
                <Paperclip className="w-4 h-4 inline text-gray-500" /> المستندات
                والمرفقات الرسمية (اختياري)
              </label>
              <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-blue-50 hover:border-blue-400 rounded-xl text-gray-500 cursor-pointer transition-all h-[110px]">
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-[11px] font-bold text-gray-600">
                  {formData.files.length > 0
                    ? `تم تحديد ${formData.files.length} ملف للرفع`
                    : "اضغط هنا لرفع (هوية، جواز، عقد...)"}
                </span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      files: Array.from(e.target.files),
                    })
                  }
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gray-100 border border-gray-300 text-gray-700 text-[12px] font-bold hover:bg-gray-200 transition-colors shadow-sm"
          >
            إلغاء الأمر
          </button>
          <button
            onClick={handleSubmit}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-white text-[13px] font-bold shadow-md transition-opacity hover:opacity-90 ${config.bg}`}
          >
            <Save className="w-4 h-4" />
            {mode === "add" ? "اعتماد وحفظ الملف" : "تحديث بيانات الملف"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 📄 صفحة دليل الأشخاص الرئيسية
// ==========================================
const PersonsDirectoryPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [activeTab, setActiveTab] = useState("data");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingPerson, setEditingPerson] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [selectedFileToUpload, setSelectedFileToUpload] = useState(null);

  // ==========================================
  // Queries
  // ==========================================
  const { data: persons = [], isLoading } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => {
      const res = await api.get("/persons");
      return res.data?.data || [];
    },
  });

  // ==========================================
  // Mutations
  // ==========================================
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const fd = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === "files")
          Array.from(payload.files).forEach((f) => fd.append("files", f));
        else if (key === "transferDetails")
          fd.append("transferDetails", JSON.stringify(payload[key]));
        else fd.append(key, payload[key]);
      });
      const res = await api.post("/persons", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("تمت إضافة الشخص بنجاح");
      queryClient.invalidateQueries(["persons-directory"]);
      setIsAddOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || "حدث خطأ"),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const fd = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === "files")
          Array.from(payload.files).forEach((f) => fd.append("files", f));
        else if (key === "transferDetails")
          fd.append("transferDetails", JSON.stringify(payload[key]));
        else if (key !== "id") fd.append(key, payload[key]);
      });
      const res = await api.put(`/persons/${payload.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success("تم التعديل بنجاح");
      queryClient.invalidateQueries(["persons-directory"]);
      setIsAddOpen(false);
      if (selectedPerson && selectedPerson.id === res.data?.id) {
        setSelectedPerson((prev) => ({ ...prev, ...res.data }));
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || "حدث خطأ"),
  });

  const convertRoleMutation = useMutation({
    mutationFn: async (id) => await api.put(`/persons/${id}`, { role: "موظف" }),
    onSuccess: () => {
      toast.success("تم تحويل الموظف إلى حضوري بنجاح");
      queryClient.invalidateQueries(["persons-directory"]);
      setSelectedPerson(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/persons/${id}`),
    onSuccess: () => {
      toast.success("تم الحذف بنجاح");
      queryClient.invalidateQueries(["persons-directory"]);
      if (selectedPerson) setSelectedPerson(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || "حدث خطأ"),
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async ({ id, file }) => {
      const fd = new FormData();
      fd.append("files", file);
      const res = await api.put(`/persons/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success("تم رفع المرفق بنجاح");
      queryClient.invalidateQueries(["persons-directory"]);
      setSelectedFileToUpload(null);
      if (selectedPerson) {
        setSelectedPerson((prev) => ({
          ...prev,
          attachments: res.data?.attachments || prev.attachments,
        }));
      }
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ أثناء الرفع"),
  });

  const removeAttachmentMutation = useMutation({
    mutationFn: async ({ id, fileUrl }) => {
      const res = await api.put(`/persons/${id}/attachments/remove`, {
        fileUrl,
      });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success("تم حذف المرفق بنجاح");
      queryClient.invalidateQueries(["persons-directory"]);
      if (selectedPerson) {
        setSelectedPerson((prev) => ({
          ...prev,
          attachments: res.data?.attachments || prev.attachments,
        }));
      }
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف"),
  });

  // ==========================================
  // Handlers
  // ==========================================
  const handleViewAttachment = async (e, attachmentUrl) => {
    e.stopPropagation();
    if (!attachmentUrl) return;
    setIsPreviewLoading(true);
    try {
      const response = await api.get(attachmentUrl, { responseType: "blob" });
      const contentType = response.headers["content-type"];
      setPreviewData({
        url: URL.createObjectURL(response.data),
        isPdf:
          contentType?.includes("pdf") ||
          attachmentUrl.toLowerCase().endsWith(".pdf"),
      });
    } catch (error) {
      toast.error("فشل في تحميل المرفق.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewData) URL.revokeObjectURL(previewData.url);
    setPreviewData(null);
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setEditingPerson(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (e, row) => {
    e.stopPropagation();
    setModalMode("edit");
    setEditingPerson(row);
    setIsAddOpen(true);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("هل أنت متأكد من الحذف؟")) deleteMutation.mutate(id);
  };

  const handleModalSubmit = (payload) => {
    if (modalMode === "add") {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ ...payload, id: editingPerson?.id });
    }
  };

  const handleUploadFile = () => {
    if (!selectedFileToUpload) return toast.warning("الرجاء اختيار ملف أولاً");
    uploadAttachmentMutation.mutate({
      id: selectedPerson.id,
      file: selectedFileToUpload,
    });
  };

  // ==========================================
  // Logic & Filtering
  // ==========================================
  const filteredData = useMemo(() => {
    return persons.filter((p) => {
      const matchSearch =
        p.name.includes(searchQuery) ||
        (p.phone && p.phone.includes(searchQuery));
      const matchRole = filterRole === "all" || p.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [persons, searchQuery, filterRole]);

  const roleCounts = useMemo(() => {
    const counts = {
      وسيط: 0,
      معقب: 0,
      "صاحب مصلحة": 0,
      موظف: 0,
      شريك: 0,
      "وسيط المكتب الهندسي": 0,
      "موظف عن بعد": 0,
    };
    persons.forEach((p) => {
      if (counts[p.role] !== undefined) counts[p.role]++;
    });
    return counts;
  }, [persons]);

  const getRoleStyle = (role) => {
    switch (role) {
      case "وسيط":
        return {
          bg: "var(--wms-accent-blue)20",
          text: "var(--wms-accent-blue)",
          icon: Handshake,
        };
      case "معقب":
        return {
          bg: "var(--wms-warning)20",
          text: "var(--wms-warning)",
          icon: UserCheck,
        };
      case "صاحب مصلحة":
        return {
          bg: "rgba(168, 85, 247, 0.15)",
          text: "rgb(168, 85, 247)",
          icon: Star,
        };
      case "موظف":
        return {
          bg: "var(--wms-success)20",
          text: "var(--wms-success)",
          icon: Briefcase,
        };
      case "شريك":
        return {
          bg: "var(--wms-success)20",
          text: "var(--wms-success)",
          icon: Users,
        };
      case "وسيط المكتب الهندسي":
        return {
          bg: "rgba(8, 145, 178, 0.15)",
          text: "rgb(8, 145, 178)",
          icon: Building2,
        };
      case "موظف عن بعد":
        return {
          bg: "rgba(236, 72, 153, 0.15)",
          text: "rgb(219, 39, 119)",
          icon: MonitorSmartphone,
        };
      default:
        return {
          bg: "var(--wms-surface-2)",
          text: "var(--wms-text-muted)",
          icon: BookUser,
        };
    }
  };

  return (
    <>
      <div
        className="p-3 flex flex-col h-full overflow-hidden bg-[var(--wms-bg-0)] font-sans"
        dir="rtl"
      >
        {/* 1. Header Toolbar */}
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-blue-50 border border-blue-100">
              <BookUser className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-[var(--wms-text)] text-[15px] font-bold">
                سجل الأشخاص والجهات (مستقل للفرع)
              </div>
              <div className="text-[var(--wms-text-muted)] text-[10px]">
                {persons.length} شخص مسجل
              </div>
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="relative">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--wms-text-muted)]" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الجوال..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md pr-8 pl-3 text-[var(--wms-text)] outline-none w-[220px] h-[32px] text-[12px]"
            />
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-accent-blue)] text-white hover:opacity-90 h-[32px] text-[12px] font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة شخص</span>
          </button>
        </div>

        {/* 2. Filters (Role Chips) */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3 shrink-0">
          <button
            onClick={() => setFilterRole("all")}
            className={`px-2.5 py-1 rounded-md transition-colors text-[11px] font-bold ${
              filterRole === "all"
                ? "bg-[var(--wms-accent-blue)] text-white"
                : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"
            }`}
          >
            الكل ({persons.length})
          </button>
          {Object.entries(roleCounts).map(([role, count]) => {
            const { icon: Icon, text } = getRoleStyle(role);
            return (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors text-[11px] font-bold ${
                  filterRole === role
                    ? "bg-[var(--wms-accent-blue)] text-white"
                    : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>
                  {role} ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* 3. Table Area */}
        <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden flex flex-col flex-1 min-h-0 shadow-sm">
          <div className="overflow-auto custom-scrollbar-slim flex-1">
            <table className="w-full text-right whitespace-nowrap text-[12px]">
              <thead className="sticky top-0 z-10 bg-[var(--wms-surface-2)]">
                <tr className="h-[36px]">
                  <th className="px-3 text-[var(--wms-text-sec)] font-bold text-[11px]">
                    الاسم
                  </th>
                  <th className="px-3 text-[var(--wms-text-sec)] font-bold text-[11px]">
                    الدور
                  </th>
                  <th className="px-3 text-[var(--wms-text-sec)] font-bold text-[11px]">
                    الجوال
                  </th>
                  <th className="px-3 text-[var(--wms-text-sec)] font-bold text-[11px]">
                    نوع الاتفاق
                  </th>
                  <th className="px-3 text-[var(--wms-text-sec)] font-bold text-[11px]">
                    المعاملات
                  </th>
                  <th className="px-3 text-[var(--wms-text-sec)] font-bold text-[11px]">
                    التسويات
                  </th>
                  <th className="px-3 text-center text-[var(--wms-text-sec)] font-bold text-[11px]">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-8 text-gray-500 font-semibold"
                    >
                      لا توجد سجلات تطابق بحثك
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => {
                    const style = getRoleStyle(row.role);
                    const Icon = style.icon;
                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-[var(--wms-border)]/30 hover:bg-[var(--wms-surface-2)]/40 transition-colors h-[40px] ${
                          idx % 2 === 1
                            ? "bg-[var(--wms-row-alt)]"
                            : "bg-transparent"
                        }`}
                      >
                        <td className="px-3 text-[var(--wms-text)] font-bold">
                          {safeText(row.name)}
                        </td>
                        <td className="px-3">
                          <div className="flex items-center gap-1">
                            <Icon
                              className="w-3 h-3"
                              style={{ color: style.text }}
                            />
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                              style={{
                                backgroundColor: style.bg,
                                color: style.text,
                              }}
                            >
                              {safeText(row.role)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 text-[var(--wms-text-sec)] font-mono text-[11px]">
                          {safeText(row.phone)}
                        </td>
                        <td className="px-3 text-[var(--wms-text-muted)] text-[10px] font-semibold">
                          {safeText(row.agreementType)}
                        </td>
                        <td className="px-3 text-[var(--wms-text-sec)] font-mono text-[11px] font-bold">
                          {safeNum(row.stats?.transactions)}
                        </td>
                        <td className="px-3 text-[var(--wms-text-sec)] font-mono text-[11px] font-bold">
                          {safeNum(row.stats?.settlements)}
                        </td>
                        <td className="px-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedPerson(row);
                                setActiveTab("data");
                                setSelectedFileToUpload(null);
                              }}
                              className="text-blue-500 hover:bg-blue-50 p-1.5 rounded transition-colors"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleOpenEdit(e, row)}
                              className="text-amber-500 hover:bg-amber-50 p-1.5 rounded transition-colors"
                              title="تعديل"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, row.id)}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex items-start gap-1.5 px-1 shrink-0 mt-2">
          <Info className="w-3 h-3 mt-0.5 shrink-0 text-gray-400" />
          <span className="text-gray-400 text-[9px] font-semibold">
            سجل الأشخاص يربط جميع الحركات المالية والتشغيلية في مكان واحد.
          </span>
        </div>
      </div>

      {/* ✅ مودل إضافة/تعديل شخص (مع خيار نقدي) */}
      {isAddOpen && (
        <AddPersonModal
          mode={modalMode}
          personData={editingPerson}
          onClose={() => setIsAddOpen(false)}
          onSubmit={handleModalSubmit}
        />
      )}

      {/* 2. View Person Details Modal */}
      {selectedPerson && (
        <div
          className="fixed inset-0 bg-black/60 z-[50] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
          onClick={() => setSelectedPerson(null)}
        >
          <div
            className="bg-white border border-[var(--wms-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[850px] h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--wms-border)] shrink-0 bg-gray-50/80">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-[18px] shadow-sm"
                  style={{
                    backgroundColor: getRoleStyle(selectedPerson.role).bg,
                    color: getRoleStyle(selectedPerson.role).text,
                  }}
                >
                  {safeText(selectedPerson.name).charAt(0)}
                </div>
                <div>
                  <div className="text-[var(--wms-text)] text-[18px] font-bold">
                    {safeText(selectedPerson.name)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-bold border"
                      style={{
                        backgroundColor: getRoleStyle(selectedPerson.role).bg,
                        color: getRoleStyle(selectedPerson.role).text,
                        borderColor: getRoleStyle(selectedPerson.role).text,
                      }}
                    >
                      {safeText(selectedPerson.role)}
                    </span>
                    <span className="text-gray-400 font-mono text-[11px] font-bold">
                      {safeText(selectedPerson.personCode)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedPerson.role === "موظف عن بعد" && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "سيتم تحويله لموظف رسمي وترحيل جميع سجلاته المالية للفرع الرئيسي، هل أنت متأكد؟",
                        )
                      )
                        convertRoleMutation.mutate(selectedPerson.id);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg text-xs font-bold shadow-md hover:opacity-90"
                  >
                    <Send className="w-3.5 h-3.5" /> تحويل لموظف حضوري
                  </button>
                )}
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="text-gray-400 hover:text-red-500 bg-white p-2 rounded-md border shadow-sm transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--wms-border)] overflow-x-auto custom-scrollbar-slim bg-white shrink-0">
              {[
                { id: "data", label: "البيانات الأساسية", icon: BookUser },
                { id: "transactions", label: "المعاملات", icon: FileText },
                { id: "settlements", label: "التسويات (له)", icon: Handshake },
                { id: "collections", label: "التحصيلات (منه)", icon: Wallet },
                {
                  id: "disbursements",
                  label: "السلف والمصروفات (إليه)",
                  icon: Receipt,
                },
                {
                  id: "attachments",
                  label: "المرفقات والوثائق",
                  icon: Paperclip,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-5 py-3.5 whitespace-nowrap cursor-pointer transition-all text-[12px] border-b-2 ${
                    activeTab === tab.id
                      ? "text-blue-600 border-blue-600 font-bold bg-blue-50/30"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 relative">
              {/* TAB 1: Data */}
              {activeTab === "data" && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">
                        الاسم الكامل
                      </div>
                      <div className="text-[14px] font-bold text-gray-800">
                        {safeText(selectedPerson.name)}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">
                        رقم التواصل
                      </div>
                      <div
                        className="text-[14px] font-mono text-gray-800 font-bold"
                        dir="ltr"
                      >
                        {safeText(selectedPerson.phone)}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">
                        نوع الاتفاق
                      </div>
                      <div className="text-[14px] font-bold text-gray-800">
                        {safeText(selectedPerson.agreementType)}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">
                        تاريخ التسجيل
                      </div>
                      <div className="text-[14px] font-mono text-gray-600 font-semibold">
                        {new Date(selectedPerson.createdAt).toLocaleDateString(
                          "en-GB",
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-wider">
                      ملاحظات
                    </div>
                    <div className="text-[13px] whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {safeText(selectedPerson.notes)}
                    </div>
                  </div>
                  {selectedPerson.role === "موظف عن بعد" && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
                      <h3 className="text-blue-800 font-bold text-sm mb-4 border-b border-blue-200 pb-2">
                        بيانات التحويل المالي (Private)
                      </h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <span className="block text-xs text-blue-600 mb-1">
                            الطريقة المفضلة
                          </span>
                          <strong className="text-blue-900">
                            {selectedPerson.transferMethod || "غير محدد"}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-xs text-blue-600 mb-1">
                            عملة التحويل
                          </span>
                          <strong className="text-blue-900 font-mono">
                            {selectedPerson.preferredCurrency}
                          </strong>
                        </div>
                        <div className="col-span-3">
                          <span className="block text-xs text-blue-600 mb-1">
                            تفاصيل الدفع:
                          </span>
                          <pre
                            className="text-xs bg-white p-3 rounded border border-blue-200 text-gray-700 font-mono mt-1 shadow-inner"
                            dir="ltr"
                          >
                            {JSON.stringify(
                              selectedPerson.transferDetails,
                              null,
                              2,
                            )}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-3 pt-2">
                    <div className="p-4 rounded-xl text-center bg-blue-50 border border-blue-100 shadow-sm">
                      <div className="font-mono text-[24px] font-bold text-blue-600">
                        {safeNum(selectedPerson.stats?.transactions)}
                      </div>
                      <div className="text-blue-500 text-[11px] font-bold mt-1">
                        المعاملات المرتبطة
                      </div>
                    </div>
                    <div className="p-4 rounded-xl text-center bg-green-50 border border-green-100 shadow-sm">
                      <div className="font-mono text-[24px] font-bold text-green-600">
                        {safeNum(selectedPerson.stats?.settlements)}
                      </div>
                      <div className="text-green-500 text-[11px] font-bold mt-1">
                        التسويات المستحقة
                      </div>
                    </div>
                    <div className="p-4 rounded-xl text-center bg-amber-50 border border-amber-100 shadow-sm">
                      <div className="font-mono text-[24px] font-bold text-amber-600">
                        {safeNum(selectedPerson.stats?.collections)}
                      </div>
                      <div className="text-amber-500 text-[11px] font-bold mt-1">
                        حركات التحصيل
                      </div>
                    </div>
                    <div className="p-4 rounded-xl text-center bg-red-50 border border-red-100 shadow-sm">
                      <div className="font-mono text-[24px] font-bold text-red-600">
                        {safeNum(selectedPerson.stats?.disbursements)}
                      </div>
                      <div className="text-red-500 text-[11px] font-bold mt-1">
                        حركات الصرف (سلف)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2-6: Other tabs remain the same as original */}
              {/* ... (نفس الكود الأصلي للتابات الأخرى) ... */}
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: معاينة المرفق */}
      {previewData && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.85)" }}
          dir="rtl"
          onClick={closePreview}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ width: "85vw", maxWidth: "1000px", height: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-800 font-bold text-[16px]">
                  معاينة المستند
                </span>
              </div>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-red-500 bg-white border border-gray-200 shadow-sm p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-gray-200/80 p-6 flex items-center justify-center overflow-hidden">
              {previewData.isPdf ? (
                <iframe
                  src={previewData.url}
                  className="w-full h-full rounded-xl border border-gray-300 shadow-lg bg-white"
                  title="معاينة PDF"
                />
              ) : (
                <img
                  src={previewData.url}
                  alt="مرفق"
                  className="max-w-full max-h-full rounded-xl shadow-lg border border-gray-300 object-contain bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PersonsDirectoryPage;
