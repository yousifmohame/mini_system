import React, { useState } from "react";
import {
  X,
  UserPlus,
  Loader2,
  Phone,
  User,
  Paperclip,
  Upload,
  Globe2,
  Save,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios"; // 👈 تأكد من المسار

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

export function AddPersonModal({ type, onClose }) {
  const queryClient = useQueryClient();

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
  };

  const config = typeConfig[type] || typeConfig["وسيط"];
  const isRemoteWorker = type === "موظف عن بعد";

  // 💡 ربط الإضافة بالباك إند عبر FormData لدعم الملفات
  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const fd = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === "files") {
          Array.from(payload.files).forEach((f) => fd.append("files", f));
        } else if (key === "transferDetails") {
          fd.append("transferDetails", JSON.stringify(payload[key]));
        } else {
          fd.append(key, payload[key]);
        }
      });
      return await api.post("/persons", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success(`تم تسجيل ${type} بنجاح وإضافته لقاعدة البيانات`);
      queryClient.invalidateQueries(["persons-directory"]); // تحديث القوائم
      queryClient.invalidateQueries(["persons-list"]);
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "حدث خطأ أثناء إضافة الشخص");
    },
  });

  const handleSubmit = () => {
    let finalData = { ...formData };

    // تجميع الاسم الرباعي
    finalData.name =
      `${finalData.firstNameAr || ""} ${finalData.secondNameAr || ""} ${finalData.thirdNameAr || ""} ${finalData.fourthNameAr || ""}`.trim();

    if (!finalData.name) return toast.error("يرجى إدخال الاسم الأول على الأقل");

    // دمج رمز الدولة مع الرقم النهائي
    finalData.phone = finalData.phoneWithoutCode
      ? `${finalData.phoneCode}${finalData.phoneWithoutCode}`
      : "";
    finalData.whatsapp = finalData.whatsappWithoutCode
      ? `${finalData.whatsappCode}${finalData.whatsappWithoutCode}`
      : "";

    finalData.role = type;
    finalData.status = "نشط";

    addMutation.mutate(finalData);
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
              {config.title}
            </span>
            <span
              className="mr-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: config.color }}
            >
              {type}
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
          {/* الأسماء 4 رباعية */}
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
            <label className="block mb-3 text-[14px] font-black text-gray-800 border-b border-gray-100 pb-2">
              <User className="w-4 h-4 inline-block text-blue-500 ml-1" /> الاسم
              الرباعي والبيانات الديموغرافية
            </label>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                  الاسم الأول *
                </label>
                <input
                  type="text"
                  placeholder="الاسم الأول (Ar)"
                  value={formData.firstNameAr}
                  onChange={(e) =>
                    setFormData({ ...formData, firstNameAr: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold focus:border-blue-500 focus:bg-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                  الاسم الثاني
                </label>
                <input
                  type="text"
                  placeholder="الاسم الثاني"
                  value={formData.secondNameAr}
                  onChange={(e) =>
                    setFormData({ ...formData, secondNameAr: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:bg-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                  الاسم الثالث
                </label>
                <input
                  type="text"
                  placeholder="الاسم الثالث"
                  value={formData.thirdNameAr}
                  onChange={(e) =>
                    setFormData({ ...formData, thirdNameAr: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:bg-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                  الاسم الرابع (العائلة)
                </label>
                <input
                  type="text"
                  placeholder="الاسم الرابع"
                  value={formData.fourthNameAr}
                  onChange={(e) =>
                    setFormData({ ...formData, fourthNameAr: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold focus:border-blue-500 focus:bg-white outline-none transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block text-right">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.firstNameEn}
                  onChange={(e) =>
                    setFormData({ ...formData, firstNameEn: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-500 focus:bg-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block text-right">
                  Second Name
                </label>
                <input
                  type="text"
                  placeholder="Second Name"
                  value={formData.secondNameEn}
                  onChange={(e) =>
                    setFormData({ ...formData, secondNameEn: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-500 focus:bg-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block text-right">
                  Third Name
                </label>
                <input
                  type="text"
                  placeholder="Third Name"
                  value={formData.thirdNameEn}
                  onChange={(e) =>
                    setFormData({ ...formData, thirdNameEn: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-500 focus:bg-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block text-right">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.fourthNameEn}
                  onChange={(e) =>
                    setFormData({ ...formData, fourthNameEn: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-500 focus:bg-white outline-none transition-colors"
                />
              </div>
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

          {/* تفاصيل التحويل (دائماً متاحة ولكن اختيارية) */}
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
              ].map((method) => (
                <label
                  key={method}
                  className={`flex items-center gap-2 px-4 py-2 border-2 rounded-xl cursor-pointer transition-colors ${formData.transferMethod === method ? "border-blue-600 bg-blue-50 shadow-sm" : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}
                >
                  <input
                    type="radio"
                    checked={formData.transferMethod === method}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        transferMethod: method,
                        transferDetails: {},
                      })
                    }
                    className="accent-blue-600 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-gray-700">
                    {method}
                  </span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              {!formData.transferMethod && (
                <div className="col-span-2 text-center text-xs text-gray-400 font-bold">
                  يرجى اختيار طريقة التحويل لعرض الحقول المناسبة (أو تجاهلها)
                </div>
              )}
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

          {/* الملاحظات والمرفقات المشتركة */}
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
            disabled={addMutation.isPending}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-white text-[13px] font-bold shadow-md transition-opacity hover:opacity-90 disabled:opacity-50 ${config.bg}`}
          >
            {addMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            حفظ وإضافة {type}
          </button>
        </div>
      </div>
    </div>
  );
}
