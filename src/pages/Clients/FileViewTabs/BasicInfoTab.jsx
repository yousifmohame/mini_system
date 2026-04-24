import React from "react";
import {
  Loader2,
  Save,
  SquarePen,
  Shield,
  User,
  FileText,
  Phone,
  Mail,
  Award,
  UsersRound,
  ShieldCheck,
  ScanSearch,
  Clock,
  TriangleAlert,
  TrendingUp,
  Building,
  MapPin,
} from "lucide-react";

const BasicInfoTab = ({
  client,
  isEditingBasicInfo,
  setIsEditingBasicInfo,
  editFormData,
  handleEditChange,
  handleSaveBasicInfo,
  updateClientMutation,
  handleStartEdit,
  repAuthRef,
  handleRepDocUpload,
  isAnalyzingRepAuth,
  isAnalyzingRepId,
  toEnglishNumbers,
  formatDate,
  getRemainingTime,
}) => {
  const rep = client.representative;
  const hasRep = rep && rep.hasRepresentative;
  const isInvestorActive = isEditingBasicInfo
    ? editFormData.isInvestor
    : !!client.company || !!client.taxNumber;

  const inputClass =
    "w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-bold text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400";
  const labelClass =
    "text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1.5";
  const cardClass =
    "bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-300";

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* هيدر التاب مع زر التعديل/الحفظ */}
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800">البيانات الأساسية</h3>
        {isEditingBasicInfo ? (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditingBasicInfo(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveBasicInfo}
              disabled={updateClientMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50"
            >
              {updateClientMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              حفظ التعديلات
            </button>
          </div>
        ) : (
          <button
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
          >
            <SquarePen className="w-4 h-4" /> تعديل البيانات
          </button>
        )}
      </div>

      <div>
        {/* شبكة البيانات الأساسية 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            className={`p-4 rounded-xl border shadow-sm ${isEditingBasicInfo ? "bg-slate-100 border-slate-200 opacity-60" : "bg-slate-50 border-slate-100"}`}
          >
            <div className="text-xs text-slate-500 font-bold mb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-400" /> كود العميل
            </div>
            <p className="text-sm text-slate-800 font-black font-mono">
              {client.clientCode}
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border shadow-sm ${isEditingBasicInfo ? "bg-white border-blue-200 ring-2 ring-blue-50" : "bg-slate-50 border-slate-100"}`}
          >
            <div className="text-xs text-slate-500 font-bold mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-400" /> نوع العميل
            </div>
            {isEditingBasicInfo ? (
              <select
                value={editFormData.type}
                onChange={(e) => handleEditChange("type", e.target.value)}
                className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent"
              >
                <option value="فرد سعودي">فرد سعودي</option>
                <option value="فرد غير سعودي">فرد غير سعودي</option>
                <option value="شركة">شركة / مؤسسة</option>
                <option value="جهة حكومية">جهة حكومية</option>
                <option value="ورثة">ورثة</option>
              </select>
            ) : (
              <p className="text-sm text-slate-800 font-bold">
                {client.type || "—"}
              </p>
            )}
          </div>

          <div
            className={`p-4 rounded-xl border shadow-sm ${isEditingBasicInfo ? "bg-white border-blue-200 ring-2 ring-blue-50" : "bg-slate-50 border-slate-100"}`}
          >
            <div className="text-xs text-slate-500 font-bold mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" /> رقم الهوية/السجل
            </div>
            {isEditingBasicInfo ? (
              <input
                type="text"
                value={editFormData.idNumber}
                onChange={(e) => handleEditChange("idNumber", e.target.value)}
                className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent font-mono dir-ltr text-right"
                placeholder="رقم الهوية"
              />
            ) : (
              <p className="text-sm text-slate-800 font-bold font-mono">
                {client.idNumber || client.identification?.idNumber || "—"}
              </p>
            )}
          </div>

          <div
            className={`p-4 rounded-xl border shadow-sm ${isEditingBasicInfo ? "bg-white border-blue-200 ring-2 ring-blue-50" : "bg-slate-50 border-slate-100"}`}
          >
            <div className="text-xs text-slate-500 font-bold mb-2 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-green-400" /> رقم الجوال
            </div>
            {isEditingBasicInfo ? (
              <input
                type="tel"
                value={editFormData.mobile}
                onChange={(e) => handleEditChange("mobile", e.target.value)}
                className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent font-mono dir-ltr text-right"
                placeholder="05XXXXXXXX"
              />
            ) : (
              <p className="text-sm text-slate-800 font-bold font-mono dir-ltr text-left">
                {client.mobile || client.contact?.mobile || "—"}
              </p>
            )}
          </div>

          <div
            className={`p-4 rounded-xl border shadow-sm ${isEditingBasicInfo ? "bg-white border-blue-200 ring-2 ring-blue-50" : "bg-slate-50 border-slate-100"}`}
          >
            <div className="text-xs text-slate-500 font-bold mb-2 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-red-400" /> البريد الإلكتروني
            </div>
            {isEditingBasicInfo ? (
              <input
                type="email"
                value={editFormData.email}
                onChange={(e) => handleEditChange("email", e.target.value)}
                className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent dir-ltr text-right"
                placeholder="email@example.com"
              />
            ) : (
              <p className="text-sm text-slate-800 font-bold font-mono dir-ltr text-left">
                {client.email || client.contact?.email || "—"}
              </p>
            )}
          </div>
        </div>

        {/* تفاصيل الاسم */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div
            className={`p-4 rounded-xl border ${isEditingBasicInfo ? "bg-white border-blue-200 ring-1 ring-blue-50" : "bg-slate-50 border-slate-100"}`}
          >
            <div className="text-[11px] text-slate-400 font-bold mb-1">
              الاسم الأول (عربي)
            </div>
            {isEditingBasicInfo ? (
              <input
                type="text"
                value={editFormData.firstAr}
                onChange={(e) => handleEditChange("firstAr", e.target.value)}
                className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent"
              />
            ) : (
              <p className="text-sm text-slate-800 font-bold">
                {client.name?.details?.firstAr ||
                  client.name?.firstAr ||
                  client.name?.firstName ||
                  "—"}
              </p>
            )}
          </div>
          <div
            className={`p-4 rounded-xl border ${isEditingBasicInfo ? "bg-white border-blue-200 ring-1 ring-blue-50" : "bg-slate-50 border-slate-100"}`}
          >
            <div className="text-[11px] text-slate-400 font-bold mb-1">
              الاسم الأول (English)
            </div>
            {isEditingBasicInfo ? (
              <input
                type="text"
                value={editFormData.firstEn}
                onChange={(e) => handleEditChange("firstEn", e.target.value)}
                className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent dir-ltr text-left"
              />
            ) : (
              <p className="text-sm text-slate-800 font-bold dir-ltr text-left">
                {client.name?.details?.firstEn ||
                  client.name?.firstEn ||
                  client.name?.englishName ||
                  "—"}
              </p>
            )}
          </div>
          <div
            className={`p-4 rounded-xl border ${isEditingBasicInfo ? "bg-white border-blue-200 ring-1 ring-blue-50" : "bg-slate-50 border-slate-100"}`}
          >
            <div className="text-[11px] text-slate-400 font-bold mb-1">
              اسم العائلة (عربي)
            </div>
            {isEditingBasicInfo ? (
              <input
                type="text"
                value={editFormData.familyAr}
                onChange={(e) => handleEditChange("familyAr", e.target.value)}
                className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent"
              />
            ) : (
              <p className="text-sm text-slate-800 font-bold">
                {client.name?.details?.familyAr ||
                  client.name?.familyAr ||
                  client.name?.familyName ||
                  "—"}
              </p>
            )}
          </div>
          <div
            className={`p-4 rounded-xl border ${isEditingBasicInfo ? "bg-white border-blue-200 ring-1 ring-blue-50" : "bg-slate-50 border-slate-100"}`}
          >
            <div className="text-[11px] text-slate-400 font-bold mb-1">
              اسم العائلة (English)
            </div>
            {isEditingBasicInfo ? (
              <input
                type="text"
                value={editFormData.familyEn}
                onChange={(e) => handleEditChange("familyEn", e.target.value)}
                className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent dir-ltr text-left"
              />
            ) : (
              <p className="text-sm text-slate-800 font-bold dir-ltr text-left">
                {client.name?.details?.familyEn || client.name?.familyEn || "—"}
              </p>
            )}
          </div>
        </div>

        {/* لقب العميل وأسلوب التعامل */}
        <div
          className={`mt-4 p-5 rounded-2xl border transition-colors ${isEditingBasicInfo ? "bg-blue-50 border-blue-300 ring-2 ring-blue-100" : "bg-blue-50/50 border-blue-100"}`}
        >
          <div className={cardClass}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-amber-500" /> لقب العميل في
                  العروض
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "تلقائي",
                    "المواطن",
                    "المواطنة",
                    "السادة",
                    "صاحب السمو",
                    "مخصص",
                  ].map((title) => {
                    const isSelected = isEditingBasicInfo
                      ? editFormData.defaultTitle === title
                      : client.clientTitle === title ||
                        (client.clientTitle == null && title === "تلقائي");
                    return (
                      <span
                        key={title}
                        onClick={() =>
                          isEditingBasicInfo &&
                          handleEditChange("defaultTitle", title)
                        }
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isSelected ? "bg-amber-100 text-amber-800 border-2 border-amber-300 shadow-sm" : "bg-white text-slate-500 border border-slate-200"} ${isEditingBasicInfo ? "cursor-pointer hover:border-amber-400" : "opacity-90"}`}
                      >
                        {title}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                  <UsersRound className="w-4 h-4 text-blue-500" /> أسلوب التعامل
                </label>
                <div className="flex flex-wrap gap-2">
                  {["عن نفسه", "مفوض", "وكيل"].map((method) => {
                    const isSelected = isEditingBasicInfo
                      ? editFormData.handlingMethod === method
                      : method === "عن نفسه"
                        ? !hasRep
                        : hasRep && rep?.type === method;
                    return (
                      <span
                        key={method}
                        onClick={() =>
                          isEditingBasicInfo &&
                          handleEditChange("handlingMethod", method)
                        }
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isSelected ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white text-slate-600 border border-slate-200"} ${isEditingBasicInfo ? "cursor-pointer hover:border-blue-400" : "opacity-90"}`}
                      >
                        {method === "عن نفسه"
                          ? "يتعامل عن نفسه"
                          : `عبر ${method}`}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {hasRep && !isEditingBasicInfo && (
              <div className="mt-6 p-5 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-2xl border border-blue-100 animate-in fade-in">
                <div className="flex items-center gap-2 mb-4 text-blue-800">
                  <ShieldCheck className="w-5 h-5" />
                  <h4 className="font-bold text-sm">
                    البيانات المسجلة لـ ({rep.type})
                  </h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <span className="block text-[10px] text-slate-400 font-bold mb-1">
                      الاسم الكامل
                    </span>
                    <strong className="text-xs text-slate-800">
                      {rep.name || "—"}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <span className="block text-[10px] text-slate-400 font-bold mb-1">
                      رقم الهوية
                    </span>
                    <strong className="text-xs text-slate-800 font-mono">
                      {rep.idNumber || "—"}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <span className="block text-[10px] text-slate-400 font-bold mb-1">
                      رقم الجوال
                    </span>
                    <strong className="text-xs text-slate-800 font-mono dir-ltr">
                      {rep.mobile || "—"}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <span className="block text-[10px] text-slate-400 font-bold mb-1">
                      رقم التوثيق/الوكالة
                    </span>
                    <strong className="text-xs text-blue-700 font-mono">
                      {rep.authNumber || "—"}
                    </strong>
                  </div>
                  {rep.authExpiry && (
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm col-span-2 md:col-span-4 flex justify-between items-center">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold mb-1">
                          صلاحية التوثيق
                        </span>
                        <strong className="text-xs text-slate-800 font-mono">
                          {formatDate(rep.authExpiry)}
                        </strong>
                      </div>
                      {getRemainingTime(rep.authExpiry) && (
                        <span
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 ${getRemainingTime(rep.authExpiry).color}`}
                        >
                          {getRemainingTime(rep.authExpiry).expired ? (
                            <TriangleAlert className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {getRemainingTime(rep.authExpiry).text}
                        </span>
                      )}
                    </div>
                  )}
                  {rep.powersScope && (
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm col-span-2 md:col-span-4">
                      <span className="block text-[10px] text-slate-400 font-bold mb-2">
                        نطاق الصلاحيات الممنوحة
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg">
                        {rep.powersScope}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isEditingBasicInfo &&
              editFormData.handlingMethod !== "عن نفسه" && (
                <div className="mt-8 border-t border-slate-200 pt-8 animate-in slide-in-from-top-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">
                          بيانات {editFormData.handlingMethod}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                          قم بإدخال بيانات الوكيل أو استخراجها من المستند
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={repAuthRef}
                        className="hidden"
                        accept=".pdf,image/*"
                        onChange={(e) =>
                          handleRepDocUpload(
                            e,
                            `مستند ${editFormData.handlingMethod}`,
                            true,
                          )
                        }
                      />
                      <button
                        onClick={() => repAuthRef.current?.click()}
                        disabled={isAnalyzingRepAuth}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                      >
                        {isAnalyzingRepAuth ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ScanSearch className="w-4 h-4" />
                        )}{" "}
                        قراءة الوكالة بالـ AI
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>
                            رقم التوثيق / الوكالة *
                          </label>
                          <input
                            type="text"
                            value={editFormData.repAuthNumber}
                            onChange={(e) =>
                              handleEditChange(
                                "repAuthNumber",
                                toEnglishNumbers(e.target.value),
                              )
                            }
                            className={`${inputClass} font-mono dir-ltr text-right`}
                            placeholder="أدخل الرقم..."
                          />
                        </div>
                        <div>
                          <label className={labelClass}>تاريخ الانتهاء *</label>
                          <input
                            type="date"
                            value={editFormData.repAuthExpiry}
                            onChange={(e) =>
                              handleEditChange("repAuthExpiry", e.target.value)
                            }
                            className={`${inputClass} dir-ltr`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>الاسم الكامل *</label>
                        <input
                          type="text"
                          value={editFormData.repName}
                          onChange={(e) =>
                            handleEditChange("repName", e.target.value)
                          }
                          className={inputClass}
                          placeholder={`اسم ${editFormData.handlingMethod}...`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>رقم الهوية *</label>
                          <input
                            type="text"
                            value={editFormData.repIdNumber}
                            onChange={(e) =>
                              handleEditChange(
                                "repIdNumber",
                                toEnglishNumbers(e.target.value),
                              )
                            }
                            className={`${inputClass} font-mono dir-ltr text-right`}
                            placeholder="10XXXXXX"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>رقم الجوال</label>
                          <input
                            type="tel"
                            value={editFormData.repMobile}
                            onChange={(e) =>
                              handleEditChange(
                                "repMobile",
                                toEnglishNumbers(e.target.value),
                              )
                            }
                            className={`${inputClass} font-mono dir-ltr text-right`}
                            placeholder="05XXXXXX"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col h-full">
                      <label className={labelClass}>
                        نطاق الصلاحيات والبنود
                      </label>
                      <textarea
                        value={editFormData.repPowersScope}
                        onChange={(e) =>
                          handleEditChange("repPowersScope", e.target.value)
                        }
                        className={`${inputClass} flex-1 resize-none h-full min-h-[150px] leading-relaxed`}
                        placeholder="أدخل البنود المستخرجة أو اكتبها يدوياً لتوضيح صلاحيات الوكيل..."
                      />
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* صفة المستثمر / الشركات */}
        <div className="mt-6">
          <div
            className={`flex items-center gap-3 mb-4 p-4 rounded-xl border transition-colors ${isInvestorActive ? "bg-emerald-50 border-emerald-400" : "bg-slate-50 border-slate-200"}`}
          >
            <TrendingUp
              className={`w-6 h-6 ${isInvestorActive ? "text-emerald-600" : "text-slate-400"}`}
            />
            <div className="flex-1">
              <div
                className={`text-sm font-bold ${isInvestorActive ? "text-emerald-700" : "text-slate-500"}`}
              >
                الشركات والجهات / صفة مستثمر
              </div>
              <div className="text-[11px] text-slate-500">
                بيانات السجل التجاري، الرقم الضريبي، والجهات الحكومية
              </div>
            </div>
            {isEditingBasicInfo && (
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-slate-500 font-bold">
                  تفعيل البيانات
                </span>
                <input
                  type="checkbox"
                  checked={editFormData.isInvestor}
                  onChange={(e) =>
                    handleEditChange("isInvestor", e.target.checked)
                  }
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </label>
            )}
          </div>

          {isInvestorActive && (
            <div
              className={`p-5 rounded-xl border shadow-sm transition-colors ${isEditingBasicInfo ? "bg-emerald-50/30 border-emerald-200 ring-2 ring-emerald-50" : "bg-white border-slate-200"}`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-indigo-500" /> اسم
                    الجهة / الشركة
                  </div>
                  {isEditingBasicInfo ? (
                    <input
                      type="text"
                      value={editFormData.company}
                      onChange={(e) =>
                        handleEditChange("company", e.target.value)
                      }
                      className="w-full text-sm font-bold text-slate-800 outline-none border-b border-slate-300 focus:border-indigo-500 pb-1"
                      placeholder="اسم الشركة"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-800">
                      {client.company || "—"}
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold mb-1.5 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-500" /> الرقم
                    الضريبي
                  </div>
                  {isEditingBasicInfo ? (
                    <input
                      type="text"
                      value={editFormData.taxNumber}
                      onChange={(e) =>
                        handleEditChange("taxNumber", e.target.value)
                      }
                      className="w-full text-sm font-bold text-slate-800 outline-none border-b border-slate-300 focus:border-indigo-500 font-mono pb-1"
                      placeholder="300XXXXXXX"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-800 font-mono">
                      {client.taxNumber || "—"}
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" /> المهنة
                    / النشاط
                  </div>
                  {isEditingBasicInfo ? (
                    <input
                      type="text"
                      value={editFormData.occupation}
                      onChange={(e) =>
                        handleEditChange("occupation", e.target.value)
                      }
                      className="w-full text-sm font-bold text-slate-800 outline-none border-b border-slate-300 focus:border-emerald-500 pb-1"
                      placeholder="نشاط الشركة"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-800">
                      {client.occupation || "—"}
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" /> الجنسية
                    (للمؤسسين)
                  </div>
                  {isEditingBasicInfo ? (
                    <input
                      type="text"
                      value={editFormData.nationality}
                      onChange={(e) =>
                        handleEditChange("nationality", e.target.value)
                      }
                      className="w-full text-sm font-bold text-slate-800 outline-none border-b border-slate-300 focus:border-amber-500 pb-1"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-800">
                      {client.nationality || "—"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicInfoTab;
