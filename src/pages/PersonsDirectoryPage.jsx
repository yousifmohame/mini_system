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
  Banknote,
  CheckSquare,
  Square,
  FileBox,
  Download,
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
// 💡 مودل إضافة/تعديل شخص
// ==========================================
function AddPersonModal({ mode, personData, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    role: "وسيط",
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
    transferMethods: [],
    transferDetails: {},
    agreementType: "نسبة",
    idNumber: "",
    notes: "",
    files: [],
  });

  const typeConfig = {
    معقب: { title: "إضافة معقب جديد", color: "#2563eb", bg: "bg-blue-600" },
    وسيط: { title: "إضافة وسيط جديد", color: "#16a34a", bg: "bg-green-600" },
    "صاحب مصلحة": {
      title: "إضافة صاحب مصلحة",
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
      title: "إضافة وسيط مكتب",
      color: "#0891b2",
      bg: "bg-cyan-600",
    },
    خارجي: { title: "إضافة أوتسورس", color: "#475569", bg: "bg-slate-600" },
  };

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

      let methodsArr = [];
      if (personData.transferMethod) {
        try {
          methodsArr = JSON.parse(personData.transferMethod);
          if (!Array.isArray(methodsArr))
            methodsArr = [personData.transferMethod];
        } catch (e) {
          methodsArr = [personData.transferMethod];
        }
      }

      setFormData({
        ...formData,
        ...personData,
        role: personData.role || "وسيط",
        transferMethods: methodsArr,
        phoneCode: pCode,
        phoneWithoutCode: pNum,
        whatsappCode: wCode,
        whatsappWithoutCode: wNum,
        files: [],
      });
    }
  }, [mode, personData]);

  const currentRole = formData.role;
  const config = typeConfig[currentRole] || typeConfig["وسيط"];

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
      transferMethod: JSON.stringify(formData.transferMethods),
    };

    onSubmit(finalPayload);
  };

  const toggleTransferMethod = (method) => {
    setFormData((prev) => {
      const isSelected = prev.transferMethods.includes(method);
      const newMethods = isSelected
        ? prev.transferMethods.filter((m) => m !== method)
        : [...prev.transferMethods, method];
      return { ...prev, transferMethods: newMethods };
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bg} text-white shadow-md`}>
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-gray-800 text-[16px] font-black">
              {mode === "add" ? config.title : "تعديل بيانات الملف"}
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
          {/* ✅ التصنيف (التصميم القديم بالأزرار) - متاح دائماً للتعديل */}
          <div>
            <label className="block mb-2 text-[13px] font-bold text-gray-800">
              تحديد التصنيف الوظيفي / دور الطرف *
            </label>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(typeConfig).map((role) => (
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
                        "الاسم الأول",
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

          {/* التواصل */}
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
            <h3 className="text-[14px] font-black text-gray-800 border-b border-gray-100 pb-2 mb-4">
              <Phone className="w-4 h-4 inline-block text-blue-500 ml-1" />{" "}
              معلومات التواصل
            </h3>
            <div className="grid grid-cols-3 gap-5">
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
                    className="flex-1 bg-white border border-gray-300 rounded-r-lg px-3 py-2 text-xs font-mono font-bold outline-none focus:border-blue-500"
                    placeholder="5XXXXXXXX"
                  />
                </div>
              </div>
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
                    className="flex-1 bg-white border border-green-300 rounded-r-lg px-3 py-2 text-xs font-mono font-bold outline-none focus:border-green-500"
                    placeholder="5XXXXXXXX"
                  />
                </div>
              </div>
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
                    className="w-full bg-white border border-blue-300 rounded-lg pl-8 pr-3 py-2 text-xs font-mono font-bold outline-none focus:border-blue-500"
                    placeholder="username"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* تفاصيل التحويل */}
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <label className="text-[14px] font-black text-gray-800">
                <Wallet className="w-4 h-4 inline-block text-blue-500 ml-1" />{" "}
                طرق استلام المستحقات المتاحة
              </label>
              <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded">
                يمكنك اختيار أكثر من طريقة
              </span>
            </div>

            <div className="flex gap-3 mb-4 flex-wrap">
              {[
                "حساب بنكي محلي/دولي",
                "ويسترن يونيون",
                "InstaPay",
                "محفظة رقمية USDT",
                "نقدي",
              ].map((method) => {
                const isSelected = formData.transferMethods.includes(method);
                return (
                  <button
                    key={method}
                    onClick={() => toggleTransferMethod(method)}
                    className={`flex items-center gap-2 px-4 py-2 border-2 rounded-xl cursor-pointer transition-colors ${isSelected ? "border-blue-600 bg-blue-50 shadow-sm" : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      {method === "نقدي" && (
                        <Banknote
                          className={`w-3 h-3 ${isSelected ? "text-blue-600" : "text-gray-400"}`}
                        />
                      )}
                      {method}
                    </span>
                  </button>
                );
              })}
            </div>

            {formData.transferMethods.length > 0 && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                {formData.transferMethods.includes("نقدي") && (
                  <div className="space-y-2 pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                    <h4 className="text-xs font-black text-green-700 flex items-center gap-1">
                      <Banknote className="w-4 h-4" /> الدفع النقدي (كاش)
                    </h4>
                    <input
                      type="text"
                      placeholder="ملاحظات للاستلام النقدي..."
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
                )}
                {formData.transferMethods.includes("حساب بنكي محلي/دولي") && (
                  <div className="space-y-2 pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                    <h4 className="text-xs font-black text-blue-800 flex items-center gap-1">
                      <Landmark className="w-4 h-4" /> تفاصيل الحساب البنكي
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
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
                      <input
                        type="text"
                        placeholder="IBAN / رقم الحساب"
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
                  </div>
                )}
                {formData.transferMethods.includes("InstaPay") && (
                  <div className="space-y-2 pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                    <h4 className="text-xs font-black text-purple-700 flex items-center gap-1">
                      InstaPay
                    </h4>
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
                      className="w-full border border-gray-300 p-2 rounded-lg text-xs font-mono focus:border-purple-500 outline-none"
                    />
                  </div>
                )}
                {formData.transferMethods.includes("ويسترن يونيون") && (
                  <div className="space-y-2 pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                    <h4 className="text-xs font-black text-amber-600 flex items-center gap-1">
                      ويسترن يونيون
                    </h4>
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
                      className="w-full border border-gray-300 p-2 rounded-lg text-xs font-mono focus:border-amber-500 outline-none"
                      dir="ltr"
                    />
                  </div>
                )}
                {formData.transferMethods.includes("محفظة رقمية USDT") && (
                  <div className="space-y-2 pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                    <h4 className="text-xs font-black text-slate-700 flex items-center gap-1">
                      محفظة رقمية (USDT)
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
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
                        className="w-full border border-gray-300 p-2 rounded-lg text-xs focus:border-slate-500 outline-none"
                      >
                        <option value="">اختر الشبكة...</option>
                        <option>TRC20</option>
                        <option>ERC20</option>
                        <option>BEP20</option>
                      </select>
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
                        className="w-full border border-gray-300 p-2 rounded-lg text-xs font-mono focus:border-slate-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
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
                placeholder="أي ملاحظات إضافية..."
              />
            </div>
            <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
              <label className="block mb-2 text-[13px] font-black text-gray-800">
                <Paperclip className="w-4 h-4 inline text-gray-500" /> المستندات
                والمرفقات
              </label>
              <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-blue-50 hover:border-blue-400 rounded-xl text-gray-500 cursor-pointer transition-all h-[110px]">
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-[11px] font-bold text-gray-600">
                  {formData.files.length > 0
                    ? `تم تحديد ${formData.files.length} ملف للرفع`
                    : "اضغط للرفع (هوية، جواز...)"}
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors duration-300">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gray-100 border border-gray-300 text-gray-700 text-[12px] font-bold hover:bg-gray-200 transition-colors shadow-sm"
          >
            إلغاء الأمر
          </button>
          <button
            onClick={handleSubmit}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-white text-[13px] font-bold shadow-md transition-all hover:opacity-90 ${config.bg}`}
          >
            <Save className="w-4 h-4" />
            {mode === "add"
              ? "حفظ البيانات وإضافة الشخص"
              : "تحديث بيانات الملف"}
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

  // ==========================================
  // Queries & Mutations
  // ==========================================
  const { data: persons = [], isLoading } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => {
      const res = await api.get("/persons");
      return res.data?.data || [];
    },
  });

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
      toast.success("تم حفظ البيانات بنجاح");
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
      if (selectedPerson)
        setSelectedPerson((prev) => ({
          ...prev,
          attachments: res.data?.attachments || prev.attachments,
        }));
    },
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
      if (selectedPerson)
        setSelectedPerson((prev) => ({
          ...prev,
          attachments: res.data?.attachments || prev.attachments,
        }));
    },
  });

  const closePreview = () => {
    if (previewData) URL.revokeObjectURL(previewData.url);
    setPreviewData(null);
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
      خارجي: 0,
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
      case "خارجي":
        return {
          bg: "rgba(71, 85, 105, 0.15)",
          text: "rgb(71, 85, 105)",
          icon: BookUser,
        };
      default:
        return {
          bg: "var(--wms-surface-2)",
          text: "var(--wms-text-muted)",
          icon: BookUser,
        };
    }
  };

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

  return (
    <>
      <div
        className="p-3 flex flex-col h-full overflow-hidden bg-[var(--wms-bg-0)] font-sans"
        dir="rtl"
      >
        {/* Header Toolbar */}
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-blue-50 border border-blue-100">
              <BookUser className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-[var(--wms-text)] text-[15px] font-bold">
                سجل الأشخاص والجهات
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
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md pr-8 pl-3 text-[var(--wms-text)] outline-none w-[220px] h-[32px] text-[12px]"
            />
          </div>
          <button
            onClick={() => {
              setModalMode("add");
              setEditingPerson(null);
              setIsAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-accent-blue)] text-white hover:opacity-90 h-[32px] text-[12px] font-semibold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة سجل جديد</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3 shrink-0">
          <button
            onClick={() => setFilterRole("all")}
            className={`px-2.5 py-1 rounded-md transition-colors text-[11px] font-bold ${filterRole === "all" ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
          >
            الكل ({persons.length})
          </button>
          {Object.entries(roleCounts).map(([role, count]) => {
            const { icon: Icon } = getRoleStyle(role);
            return (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors text-[11px] font-bold ${filterRole === role ? "bg-[var(--wms-accent-blue)] text-white" : "bg-[var(--wms-surface-2)] text-[var(--wms-text-sec)]"}`}
              >
                <Icon className="w-3 h-3" />
                <span>
                  {role} ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Table */}
        <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden flex flex-col flex-1 min-h-0 shadow-sm">
          <div className="overflow-auto custom-scrollbar-slim flex-1">
            <table className="w-full text-right whitespace-nowrap text-[12px]">
              <thead className="sticky top-0 z-10 bg-[var(--wms-surface-2)]">
                <tr className="h-[36px]">
                  <th className="px-3 text-[var(--wms-text-sec)] font-bold text-[11px]">
                    الاسم
                  </th>
                  <th className="px-3 text-[var(--wms-text-sec)] font-bold text-[11px]">
                    التصنيف (الدور)
                  </th>
                  <th className="px-3 text-[var(--wms-text-sec)] font-bold text-[11px]">
                    الجوال
                  </th>
                  <th className="px-3 text-[var(--wms-text-sec)] font-bold text-[11px]">
                    نوع الاتفاق
                  </th>
                  <th className="px-3 text-[var(--wms-text-sec)] font-bold text-[11px]">
                    طرق الدفع
                  </th>
                  <th className="px-3 text-center text-[var(--wms-text-sec)] font-bold text-[11px]">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-8 text-gray-500 font-semibold"
                    >
                      لا توجد سجلات
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => {
                    const style = getRoleStyle(row.role);
                    const Icon = style.icon;
                    let methodsLabel = "—";
                    if (row.transferMethod) {
                      try {
                        const parsed = JSON.parse(row.transferMethod);
                        if (Array.isArray(parsed) && parsed.length > 0)
                          methodsLabel = parsed.join(" + ");
                      } catch (e) {
                        methodsLabel = row.transferMethod;
                      }
                    }
                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-[var(--wms-border)]/30 hover:bg-[var(--wms-surface-2)]/40 transition-colors h-[40px] ${idx % 2 === 1 ? "bg-[var(--wms-row-alt)]" : "bg-transparent"}`}
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
                        <td
                          className="px-3 text-[var(--wms-text-sec)] font-mono text-[11px] font-bold"
                          dir="ltr"
                        >
                          {safeText(row.phone)}
                        </td>
                        <td className="px-3 text-[var(--wms-text-muted)] text-[10px] font-semibold">
                          {safeText(row.agreementType)}
                        </td>
                        <td
                          className="px-3 text-blue-600 text-[10px] font-bold truncate max-w-[150px]"
                          title={methodsLabel}
                        >
                          {methodsLabel}
                        </td>
                        <td className="px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedPerson(row);
                                setActiveTab("data");
                              }}
                              className="text-blue-500 hover:bg-blue-50 p-1.5 rounded transition-colors"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalMode("edit");
                                setEditingPerson(row);
                                setIsAddOpen(true);
                              }}
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
      </div>

      {isAddOpen && (
        <AddPersonModal
          mode={modalMode}
          personData={editingPerson}
          onClose={() => setIsAddOpen(false)}
          onSubmit={(payload) => {
            if (modalMode === "add") createMutation.mutate(payload);
            else updateMutation.mutate({ ...payload, id: editingPerson.id });
          }}
        />
      )}

      {/* ========================================== */}
      {/* 🌟 2. Details Modal (بكافة التابات الأصلية) */}
      {/* ========================================== */}
      {selectedPerson && (
        <div
          className="fixed inset-0 bg-black/60 z-[50] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
          onClick={() => setSelectedPerson(null)}
        >
          <div
            className="bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-5xl h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0 bg-gray-50/80">
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
                  <div className="text-gray-800 text-[18px] font-black">
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
              <button
                onClick={() => setSelectedPerson(null)}
                className="text-gray-400 hover:text-red-500 bg-white p-2 rounded-md border shadow-sm transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-gray-200 overflow-x-auto custom-scrollbar-slim bg-white shrink-0">
              {[
                { id: "data", label: "البيانات الأساسية", icon: BookUser },
                { id: "transactions", label: "المعاملات", icon: FileText },
                { id: "settlements", label: "التسويات", icon: Handshake },
                { id: "collections", label: "التحصيلات", icon: Wallet },
                { id: "disbursements", label: "المنصرفات", icon: Receipt },
                { id: "attachments", label: "المرفقات", icon: Paperclip },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3.5 whitespace-nowrap cursor-pointer transition-all text-xs font-bold border-b-2 ${
                    activeTab === tab.id
                      ? "text-blue-600 border-blue-600 bg-blue-50/30"
                      : "text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tabs Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 relative">
              {/* TAB 1: Data */}
              {activeTab === "data" && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-gray-400 text-[10px] font-bold mb-1 uppercase">
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
                      <div className="text-gray-400 text-[10px] font-bold mb-1 uppercase">
                        نوع الاتفاق
                      </div>
                      <div className="text-[14px] font-bold text-gray-800">
                        {safeText(selectedPerson.agreementType)}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-gray-400 text-[10px] font-bold mb-1 uppercase">
                        الدولة
                      </div>
                      <div className="text-[14px] font-bold text-gray-800">
                        {safeText(selectedPerson.country) || "غير محدد"}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-gray-400 text-[10px] font-bold mb-1 uppercase">
                        رقم الهوية
                      </div>
                      <div className="text-[14px] font-mono font-bold text-gray-800">
                        {safeText(selectedPerson.idNumber) || "غير محدد"}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-gray-400 text-[10px] font-bold mb-2 uppercase">
                      طرق الدفع والاستلام المفضلة
                    </div>
                    <div className="text-[13px] font-bold text-blue-600">
                      {selectedPerson.transferMethod
                        ? selectedPerson.transferMethod
                            .replace(/[\[\]"]/g, "")
                            .replace(/,/g, " + ")
                        : "غير محدد"}
                    </div>
                    {selectedPerson.transferDetails &&
                      Object.keys(selectedPerson.transferDetails).length >
                        0 && (
                        <pre
                          className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-700 font-mono"
                          dir="ltr"
                        >
                          {JSON.stringify(
                            selectedPerson.transferDetails,
                            null,
                            2,
                          )}
                        </pre>
                      )}
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-gray-400 text-[10px] font-bold mb-2 uppercase">
                      ملاحظات مسجلة
                    </div>
                    <div className="text-[13px] whitespace-pre-wrap text-gray-700 leading-relaxed font-semibold">
                      {selectedPerson.notes || "لا توجد ملاحظات."}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Transactions */}
              {activeTab === "transactions" && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 font-bold text-gray-600">
                          المرجع
                        </th>
                        <th className="px-4 py-3 font-bold text-gray-600">
                          النوع
                        </th>
                        <th className="px-4 py-3 font-bold text-gray-600">
                          الدور
                        </th>
                        <th className="px-4 py-3 font-bold text-gray-600">
                          التاريخ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedPerson.agentTransactions &&
                      !selectedPerson.assignedBrokers ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="text-center py-8 text-gray-400 font-bold"
                          >
                            لا توجد معاملات مرتبطة
                          </td>
                        </tr>
                      ) : (
                        <>
                          {selectedPerson.agentTransactions?.map((tx) => (
                            <tr
                              key={tx.id}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="px-4 py-3 font-mono text-blue-600 font-bold">
                                {tx.transactionCode}
                              </td>
                              <td className="px-4 py-3 text-gray-700 font-bold">
                                {tx.category}
                              </td>
                              <td className="px-4 py-3 text-gray-500 font-bold">
                                معقب
                              </td>
                              <td className="px-4 py-3 text-gray-500 font-mono">
                                {new Date(tx.createdAt).toLocaleDateString(
                                  "ar-SA",
                                )}
                              </td>
                            </tr>
                          ))}
                          {selectedPerson.assignedBrokers?.map((b) => (
                            <tr
                              key={b.id}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="px-4 py-3 font-mono text-blue-600 font-bold">
                                وساطة
                              </td>
                              <td className="px-4 py-3 text-gray-700 font-bold">
                                أتعاب: {b.fees}
                              </td>
                              <td className="px-4 py-3 text-gray-500 font-bold">
                                وسيط
                              </td>
                              <td className="px-4 py-3 text-gray-500 font-mono">
                                {new Date(b.createdAt).toLocaleDateString(
                                  "ar-SA",
                                )}
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: Settlements */}
              {activeTab === "settlements" && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 font-bold text-gray-600">
                          التاريخ
                        </th>
                        <th className="px-4 py-3 font-bold text-gray-600">
                          المبلغ
                        </th>
                        <th className="px-4 py-3 font-bold text-gray-600">
                          المصدر
                        </th>
                        <th className="px-4 py-3 font-bold text-gray-600">
                          الحالة
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedPerson.settlementsTarget ||
                      selectedPerson.settlementsTarget.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="text-center py-8 text-gray-400 font-bold"
                          >
                            لا توجد تسويات مالية
                          </td>
                        </tr>
                      ) : (
                        selectedPerson.settlementsTarget.map((s) => (
                          <tr
                            key={s.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 font-mono text-gray-500">
                              {new Date(s.createdAt).toLocaleDateString(
                                "ar-SA",
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-green-600">
                              {s.amount.toLocaleString()} ر.س
                            </td>
                            <td className="px-4 py-3 text-gray-700 font-bold">
                              {s.source}
                            </td>
                            <td className="px-4 py-3">
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: Collections */}
              {activeTab === "collections" && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 font-bold text-gray-600">
                          التاريخ
                        </th>
                        <th className="px-4 py-3 font-bold text-gray-600">
                          المبلغ
                        </th>
                        <th className="px-4 py-3 font-bold text-gray-600">
                          المرجع
                        </th>
                        <th className="px-4 py-3 font-bold text-gray-600">
                          الطريقة
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedPerson.paymentsCollected ||
                      selectedPerson.paymentsCollected.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="text-center py-8 text-gray-400 font-bold"
                          >
                            لا توجد تحصيلات مسجلة
                          </td>
                        </tr>
                      ) : (
                        selectedPerson.paymentsCollected.map((p) => (
                          <tr
                            key={p.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 font-mono text-gray-500">
                              {new Date(p.date).toLocaleDateString("ar-SA")}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-blue-600">
                              {p.amount.toLocaleString()} ر.س
                            </td>
                            <td className="px-4 py-3 text-gray-700 font-bold">
                              {p.periodRef || "—"}
                            </td>
                            <td className="px-4 py-3 text-gray-500 font-bold">
                              {p.method}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 5: Disbursements */}
              {activeTab === "disbursements" && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 font-bold text-gray-600">
                          التاريخ
                        </th>
                        <th className="px-4 py-3 font-bold text-gray-600">
                          المبلغ
                        </th>
                        <th className="px-4 py-3 font-bold text-gray-600">
                          السبب/النوع
                        </th>
                        <th className="px-4 py-3 font-bold text-gray-600">
                          ملاحظات
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedPerson.disbursements ||
                      selectedPerson.disbursements.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="text-center py-8 text-gray-400 font-bold"
                          >
                            لا توجد منصرفات أو سلف
                          </td>
                        </tr>
                      ) : (
                        selectedPerson.disbursements.map((d) => (
                          <tr
                            key={d.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 font-mono text-gray-500">
                              {new Date(d.date).toLocaleDateString("ar-SA")}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-red-600">
                              {d.amount.toLocaleString()} ر.س
                            </td>
                            <td className="px-4 py-3 text-gray-700 font-bold">
                              {d.type}
                            </td>
                            <td className="px-4 py-3 text-gray-500 font-semibold">
                              {d.notes}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 6: Attachments */}
              {activeTab === "attachments" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <h3 className="text-gray-800 font-black text-sm">
                        مرفقات ووثائق الشخص
                      </h3>
                      <p className="text-gray-500 text-xs font-semibold mt-1">
                        يمكنك رفع الهوية، العقود، أو أي مستندات خاصة.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-600 hover:text-white transition-colors font-bold text-xs shadow-sm">
                      <Upload className="w-4 h-4" /> رفع ملف جديد
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            uploadAttachmentMutation.mutate({
                              id: selectedPerson.id,
                              file: e.target.files[0],
                            });
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {!selectedPerson.attachments ||
                    selectedPerson.attachments.length === 0 ? (
                      <div className="col-span-full text-center py-10 bg-white border border-dashed border-gray-300 rounded-xl">
                        <FileBox className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <span className="text-gray-400 font-bold text-sm">
                          لا توجد مرفقات محفوظة
                        </span>
                      </div>
                    ) : (
                      selectedPerson.attachments.map((file, i) => (
                        <div
                          key={i}
                          className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col items-center text-center group hover:border-blue-300 transition-colors"
                        >
                          <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-3 text-blue-500">
                            <FileText className="w-6 h-6" />
                          </div>
                          <span
                            className="text-xs font-bold text-gray-700 truncate w-full mb-3"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                          <div className="flex items-center gap-2 w-full">
                            <button
                              onClick={(e) => handleViewAttachment(e, file.url)}
                              className="flex-1 bg-blue-50 text-blue-600 py-1.5 rounded-md text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-colors"
                            >
                              معاينة
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm("هل تريد حذف المرفق؟"))
                                  removeAttachmentMutation.mutate({
                                    id: selectedPerson.id,
                                    fileUrl: file.url,
                                  });
                              }}
                              className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Preview File */}
      {previewData && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 animate-in fade-in"
          dir="rtl"
          onClick={closePreview}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-5xl h-[90vh]"
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
              <div className="flex gap-2">
                <a
                  href={previewData.url}
                  download
                  className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-colors"
                  title="تحميل"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={closePreview}
                  className="text-gray-500 hover:text-red-500 bg-white border border-gray-200 shadow-sm p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-200 p-6 flex items-center justify-center overflow-hidden">
              {previewData.isPdf ? (
                <iframe
                  src={previewData.url}
                  className="w-full h-full rounded-xl border border-gray-300 shadow-lg bg-white"
                  title="PDF Preview"
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
