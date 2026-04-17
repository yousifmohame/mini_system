import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../../../api/axios";
import { toast } from "sonner";
import {
  Building,
  User,
  Inbox,
  Mail,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Bot,
  ClipboardList,
  PenLine,
  Map,
  FileSignature,
  Copy,
  Check,
  X,
  Save,
  Link2,
  PanelBottom,
  PanelTop,
} from "lucide-react";

export const RequestDataTab = ({
  tx,
  requestDataForm,
  setRequestDataForm,
  saveRequestDataEdits,
  updateTxMutation,
  isApprovalRequest,
  offices,
  persons,
}) => {
  const [editingField, setEditingField] = useState(null);

  const handleChange = (field, value) => {
    setRequestDataForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSingleField = async (e) => {
    e?.preventDefault();
    if (updateTxMutation.isPending) return;
    saveRequestDataEdits();
    setEditingField(null);
  };

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label} بنجاح`);
  };

  const { data: relatedEmails = [], isLoading: emailsLoading } = useQuery({
    queryKey: [
      "related-emails",
      requestDataForm.serviceNumber,
      requestDataForm.requestNumber,
    ],
    queryFn: async () => {
      if (!requestDataForm.serviceNumber && !requestDataForm.requestNumber)
        return [];
      const res = await api.get(`/email/messages/search`, {
        params: {
          serviceNumber: requestDataForm.serviceNumber,
          reqNumber: requestDataForm.requestNumber,
        },
      });
      return res.data?.data || [];
    },
    enabled: !!(requestDataForm.serviceNumber || requestDataForm.requestNumber),
  });

  // ── Ultrasense: EditableField Component ──
  const EditableField = ({
    label,
    field,
    value,
    type = "text",
    options = [],
    isSelect = false,
  }) => {
    const isEditingThis = editingField === field;
    const hasValue = value && value.toString().trim() !== "";

    return (
      <div className="flex flex-col gap-1.5 group">
        <label className="text-[10px] font-black text-slate-500 group-focus-within:text-cyan-600 transition-colors">
          {label}
        </label>
        {isEditingThis ? (
          <div className="flex flex-col gap-2 bg-gradient-to-br from-cyan-50/80 to-blue-50/80 p-2.5 rounded-xl border border-cyan-200/60 shadow-sm shadow-cyan-100/50 backdrop-blur-sm">
            {isSelect ? (
              <select
                value={value || ""}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full border border-cyan-300 rounded-lg p-2 text-xs font-bold outline-none bg-white/90 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all"
              >
                <option value="">-- يرجى الاختيار --</option>
                {options.map((o) => (
                  <option key={o.id || o.name} value={o.id || o.name}>
                    {o.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={type}
                value={value || ""}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full border border-cyan-300 rounded-lg p-2 text-xs font-mono outline-none bg-white/90 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveSingleField();
                  if (e.key === "Escape") setEditingField(null);
                }}
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSaveSingleField}
                disabled={updateTxMutation.isPending}
                className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg text-[10px] font-bold hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
              >
                {updateTxMutation.isPending && editingField === field ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                تأكيد
              </button>
              <button
                onClick={() => setEditingField(null)}
                className="px-3 py-2 bg-white/80 border border-red-200/60 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-50/80 transition-all flex items-center justify-center gap-1.5 backdrop-blur-sm"
              >
                <X className="w-3.5 h-3.5" /> إلغاء
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 bg-slate-50/60 border border-slate-200/60 rounded-xl p-2.5 min-h-[48px] hover:border-cyan-300/60 hover:bg-cyan-50/30 transition-all group-hover:shadow-sm">
            <div className="text-xs font-black text-slate-800 break-all px-1 min-h-[20px] flex items-center">
              {isSelect
                ? options.find((o) => (o.id || o.name) === value)?.name || "—"
                : value || "—"}
            </div>
            <div className="flex items-center gap-1.5 border-t border-slate-200/60 pt-2 mt-auto">
              <button
                onClick={() => setEditingField(field)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white/80 border border-slate-200/60 text-slate-600 rounded-lg text-[9px] font-bold hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300 transition-all backdrop-blur-sm"
              >
                <PenLine className="w-3.5 h-3.5" /> تعديل
              </button>
              <button
                onClick={() => hasValue && handleCopy(value, label)}
                disabled={!hasValue}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-bold transition-all ${
                  hasValue
                    ? "bg-white/80 border border-slate-200/60 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 backdrop-blur-sm"
                    : "bg-slate-100/60 border border-slate-200/40 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Copy className="w-3.5 h-3.5" /> نسخ
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Ultrasense: CombinedNumberYearGroup ──
  const CombinedNumberYearGroup = ({
    label,
    numField,
    yearField,
    numValue,
    yearValue,
  }) => {
    const isEditingNum = editingField === numField;
    const isEditingYear = editingField === yearField;
    const combinedValue =
      numValue && yearValue
        ? `${numValue} / ${yearValue}`
        : numValue || yearValue || "";
    const hasValue = combinedValue.trim() !== "";

    return (
      <div className="p-3.5 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white/90 to-slate-50/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all h-full flex flex-col">
        <label className="text-[11px] font-black text-slate-700 block mb-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
          {label}
        </label>

        {/* رقم الخدمة/الطلب */}
        <div className="flex flex-col gap-1.5 mb-2">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            الرقم
          </label>
          {isEditingNum ? (
            <div className="flex gap-1.5">
              <input
                type="text"
                value={numValue || ""}
                onChange={(e) => handleChange(numField, e.target.value)}
                className="flex-1 border border-cyan-300 rounded-lg p-2 text-xs font-mono outline-none focus:ring-2 focus:ring-cyan-400/50 bg-white/90 transition-all"
                autoFocus
              />
              <button
                onClick={handleSaveSingleField}
                className="px-3 bg-cyan-600 text-white rounded-lg font-bold text-[9px] hover:bg-cyan-700 transition-colors"
              >
                حفظ
              </button>
              <button
                onClick={() => setEditingField(null)}
                className="px-3 bg-red-50 text-red-600 border border-red-200 rounded-lg font-bold text-[9px] hover:bg-red-100 transition-colors"
              >
                X
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingField(numField)}
              className="flex items-center justify-between w-full bg-white/80 border border-slate-200/60 rounded-lg p-2 text-left hover:border-cyan-400/60 hover:bg-cyan-50/40 transition-all group/btn"
            >
              <span className="font-mono text-xs font-black text-slate-800">
                {numValue || "—"}
              </span>
              <span className="text-[9px] font-bold text-cyan-600 bg-cyan-50/60 px-2 py-0.5 rounded-lg border border-cyan-200/60 flex items-center gap-1 group-hover/btn:bg-cyan-100/60 transition-colors">
                <PenLine className="w-3 h-3" /> تعديل
              </span>
            </button>
          )}
        </div>

        {/* سنة الخدمة/الطلب */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            السنة
          </label>
          {isEditingYear ? (
            <div className="flex gap-1.5">
              <input
                type="text"
                value={yearValue || ""}
                onChange={(e) => handleChange(yearField, e.target.value)}
                className="flex-1 border border-cyan-300 rounded-lg p-2 text-xs font-mono outline-none focus:ring-2 focus:ring-cyan-400/50 bg-white/90 transition-all"
                autoFocus
              />
              <button
                onClick={handleSaveSingleField}
                className="px-3 bg-cyan-600 text-white rounded-lg font-bold text-[9px] hover:bg-cyan-700 transition-colors"
              >
                حفظ
              </button>
              <button
                onClick={() => setEditingField(null)}
                className="px-3 bg-red-50 text-red-600 border border-red-200 rounded-lg font-bold text-[9px] hover:bg-red-100 transition-colors"
              >
                X
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingField(yearField)}
              className="flex items-center justify-between w-full bg-white/80 border border-slate-200/60 rounded-lg p-2 text-left hover:border-cyan-400/60 hover:bg-cyan-50/40 transition-all group/btn"
            >
              <span className="font-mono text-xs font-black text-slate-800">
                {yearValue || "—"}
              </span>
              <span className="text-[9px] font-bold text-cyan-600 bg-cyan-50/60 px-2 py-0.5 rounded-lg border border-cyan-200/60 flex items-center gap-1 group-hover/btn:bg-cyan-100/60 transition-colors">
                <PenLine className="w-3 h-3" /> تعديل
              </span>
            </button>
          )}
        </div>

        {/* زر النسخ المجمع */}
        <div className="mt-auto pt-3 border-t border-slate-200/40">
          <button
            onClick={() => hasValue && handleCopy(combinedValue, label)}
            disabled={!hasValue}
            className={`w-full py-2.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 border transition-all ${
              hasValue
                ? "bg-white/80 border-slate-200/60 text-slate-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-cyan-50 hover:text-emerald-700 hover:border-emerald-300/60 shadow-sm hover:shadow-md backdrop-blur-sm"
                : "bg-slate-100/40 border-slate-200/40 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Copy className="w-4 h-4" />
            نسخ{" "}
            {label.includes("خدمة")
              ? "الخدمة"
              : label.includes("طلب")
                ? "الطلب"
                : "الرخصة"}
          </button>
        </div>
      </div>
    );
  };

  const hasAgreementValue =
    requestDataForm.hasAgreement !== undefined
      ? requestDataForm.hasAgreement
      : tx?.hasAgreement || false;

  return (
    <div
      className="h-full flex flex-col gap-3 animate-in fade-in pb-4"
      dir="rtl"
    >
      {/* ── Header ── */}
      <div className="flex justify-between items-center bg-gradient-to-r from-white/90 to-slate-50/60 p-3.5 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-sm shrink-0">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 bg-cyan-100/60 rounded-lg border border-cyan-200/60">
            <ClipboardList className="w-4.5 h-4.5 text-cyan-600" />
          </div>
          بيانات الطلب الإجرائية
        </h3>
        {updateTxMutation.isPending && (
          <span className="flex items-center gap-2 text-xs font-bold text-cyan-700 bg-cyan-50/80 px-3.5 py-2 rounded-xl border border-cyan-200/60 shadow-sm backdrop-blur-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...
          </span>
        )}
      </div>

      {/* ── Main Layout: Form Top, Emails Bottom ── */}
      <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
        {/* ── القسم العلوي: نموذج البيانات ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-slim pr-1 pb-2">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* العمود الأيمن: البيانات الفنية */}
            <div className="xl:col-span-8 flex flex-col gap-4">
              {/* الهيكلة الإدارية */}
              <section className="bg-white/80 p-4 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-sm">
                <div className="text-xs font-black text-slate-700 border-b border-slate-100 pb-2.5 mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4 text-cyan-500" /> الهيكلة
                  الإدارية
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <EditableField
                    label="المكتب المصمم"
                    field="designerOffice"
                    value={requestDataForm.designerOffice}
                    isSelect
                    options={offices}
                  />
                  <EditableField
                    label="المكتب المشرف"
                    field="supervisorOffice"
                    value={requestDataForm.supervisorOffice}
                    isSelect
                    options={offices}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-500">
                      مسؤول الرفع
                    </label>
                    <div className="flex flex-col gap-2 bg-slate-50/60 border border-slate-200/60 rounded-xl p-2.5 opacity-70">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="truncate">
                          {requestDataForm.responsibleEmployee || "غير محدد"}
                        </span>
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 text-center mt-auto border-t border-slate-200/40 pt-2">
                        للقراءة فقط
                      </div>
                    </div>
                  </div>
                </div>

                {/* خيار الاتفاقية */}
                <div className="flex items-center gap-3 mt-3.5 p-3 rounded-xl bg-gradient-to-r from-indigo-50/60 to-purple-50/40 border border-indigo-200/50">
                  <label className="flex flex-1 items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-indigo-600 w-5 h-5 rounded cursor-pointer"
                      checked={hasAgreementValue}
                      onChange={(e) => {
                        handleChange("hasAgreement", e.target.checked);
                        setEditingField("hasAgreement");
                      }}
                    />
                    <span className="text-xs font-black text-indigo-900/90 leading-tight">
                      المعاملة بموجب اتفاقية مسبقة
                    </span>
                  </label>
                  {editingField === "hasAgreement" && (
                    <button
                      onClick={handleSaveSingleField}
                      disabled={updateTxMutation.isPending}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      {updateTxMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      حفظ
                    </button>
                  )}
                </div>
              </section>

              {/* بيانات الخدمة والطلب والرخصة */}
              <section className="bg-gradient-to-br from-cyan-50/40 to-blue-50/30 p-4 rounded-2xl border border-cyan-200/50 shadow-sm">
                <h4 className="text-xs font-black text-cyan-900/90 flex items-center gap-2 border-b border-cyan-200/50 pb-2.5 mb-4">
                  <Building className="w-4.5 h-4.5 text-cyan-600" /> بيانات
                  المعاملة
                </h4>

                {/* الخدمة */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-dashed border-cyan-200/40">
                  <div className="sm:col-span-2">
                    <CombinedNumberYearGroup
                      label="بيانات الخدمة"
                      numField="serviceNumber"
                      yearField="serviceYear"
                      numValue={requestDataForm.serviceNumber}
                      yearValue={requestDataForm.serviceYear}
                    />
                  </div>
                  <EditableField
                    label="تاريخ الخدمة"
                    field="serviceDate"
                    value={requestDataForm.serviceDate}
                    type="date"
                  />
                </div>

                {/* الطلب */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-dashed border-cyan-200/40">
                  <div className="sm:col-span-2">
                    <CombinedNumberYearGroup
                      label="بيانات الطلب"
                      numField="requestNumber"
                      yearField="requestYear"
                      numValue={requestDataForm.requestNumber}
                      yearValue={requestDataForm.requestYear}
                    />
                  </div>
                  <EditableField
                    label="تاريخ الطلب"
                    field="requestDate"
                    value={requestDataForm.requestDate}
                    type="date"
                  />
                </div>

                {/* الرخصة */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <CombinedNumberYearGroup
                      label="الرخصة الإلكترونية"
                      numField="electronicLicenseNumber"
                      yearField="electronicLicenseHijriYear"
                      numValue={requestDataForm.electronicLicenseNumber}
                      yearValue={requestDataForm.electronicLicenseHijriYear}
                    />
                  </div>
                  <EditableField
                    label="تاريخ الرخصة"
                    field="electronicLicenseDate"
                    value={requestDataForm.electronicLicenseDate}
                    type="date"
                  />
                </div>

                {/* تصحيح الوضع */}
                {isApprovalRequest && (
                  <div className="mt-4 pt-4 border-t border-amber-200/50 bg-amber-50/40 -mx-4 -mb-4 p-4 rounded-b-2xl">
                    <div className="text-xs font-black text-amber-800 flex items-center gap-2 mb-3 bg-amber-100/50 px-3 py-2 rounded-lg w-max border border-amber-200/50">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />{" "}
                      بيانات الرخصة القديمة
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <EditableField
                        label="رقم الرخصة القديمة"
                        field="oldLicenseNumber"
                        value={requestDataForm.oldLicenseNumber}
                      />
                      <EditableField
                        label="سنة الرخصة القديمة"
                        field="oldLicenseHijriYear"
                        value={requestDataForm.oldLicenseHijriYear}
                      />
                      <EditableField
                        label="تاريخ الإصدار"
                        field="oldLicenseDate"
                        value={requestDataForm.oldLicenseDate}
                        type="date"
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* التقرير المساحي */}
              <section className="bg-gradient-to-br from-amber-50/40 to-orange-50/30 p-4 rounded-2xl border border-amber-200/50 shadow-sm">
                <h4 className="text-xs font-black text-amber-900/90 flex items-center gap-2 border-b border-amber-200/50 pb-2.5 mb-4">
                  <Map className="w-4.5 h-4.5 text-amber-600" /> التقرير المساحي
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <CombinedNumberYearGroup
                    label="طلب المساحة"
                    numField="surveyRequestNumber"
                    yearField="surveyRequestYear"
                    numValue={requestDataForm.surveyRequestNumber}
                    yearValue={requestDataForm.surveyRequestYear}
                  />
                  <CombinedNumberYearGroup
                    label="خدمة المساحة"
                    numField="surveyServiceNumber"
                    yearField="surveyServiceYear"
                    numValue={requestDataForm.surveyServiceNumber}
                    yearValue={requestDataForm.surveyServiceYear}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <EditableField
                    label="رقم التقرير"
                    field="surveyReportNumber"
                    value={requestDataForm.surveyReportNumber}
                  />
                  <EditableField
                    label="تاريخ التقرير"
                    field="surveyReportDate"
                    value={requestDataForm.surveyReportDate}
                    type="date"
                  />
                </div>
              </section>

              {/* التعاقد */}
              <section className="bg-gradient-to-br from-indigo-50/40 to-purple-50/30 p-4 rounded-2xl border border-indigo-200/50 shadow-sm mb-2">
                <h4 className="text-xs font-black text-indigo-900/90 flex items-center gap-2 border-b border-indigo-200/50 pb-2.5 mb-4">
                  <FileSignature className="w-4.5 h-4.5 text-indigo-600" />{" "}
                  التعاقد الإلكتروني
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <EditableField
                    label="رقم العقد"
                    field="contractNumber"
                    value={requestDataForm.contractNumber}
                  />
                  <EditableField
                    label="تاريخ الاعتماد"
                    field="contractApprovalDate"
                    value={requestDataForm.contractApprovalDate}
                    type="date"
                  />
                  <EditableField
                    label="المعتمد"
                    field="contractApprovedBy"
                    value={requestDataForm.contractApprovedBy}
                    isSelect
                    options={persons}
                  />
                </div>
              </section>
            </div>

            {/* العمود الأيسر: معلومات إضافية (اختياري) */}
            <div className="xl:col-span-4 flex flex-col gap-4">
              {/* بطاقة ملخص سريع */}
              <div className="bg-white/80 p-4 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-sm sticky top-0">
                <h4 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-cyan-500" /> ملخص سريع
                </h4>
                <div className="space-y-2.5 text-[11px]">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">حالة الاتفاقية</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full ${hasAgreementValue ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {hasAgreementValue ? "نعم ✓" : "لا"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">رقم الخدمة</span>
                    <span className="font-mono font-bold text-slate-700">
                      {requestDataForm.serviceNumber || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">رقم الطلب</span>
                    <span className="font-mono font-bold text-slate-700">
                      {requestDataForm.requestNumber || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">الرخصة</span>
                    <span className="font-mono font-bold text-slate-700">
                      {requestDataForm.electronicLicenseNumber || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── القسم السفلي الثابت: سجل إفادات المنصة ── */}
        <section className="shrink-0 border-t border-slate-200/60 pt-3">
          <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/90 rounded-2xl p-4 shadow-xl border border-slate-700/60 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500/30 to-cyan-500/20 rounded-xl border border-purple-400/40 shadow-inner">
                  <Bot className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white leading-tight mb-0.5">
                    سجل إفادات المنصة
                  </h4>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      سحب آلي
                    </span>
                    <span className="text-slate-600">•</span>
                    {requestDataForm.serviceNumber && (
                      <span className="bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60 font-mono text-cyan-300">
                        خ: {requestDataForm.serviceNumber}
                      </span>
                    )}
                    {requestDataForm.requestNumber && (
                      <span className="bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60 font-mono text-purple-300">
                        ط: {requestDataForm.requestNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                disabled={emailsLoading}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-300 bg-slate-800/60 hover:bg-slate-700/60 px-3 py-1.5 rounded-xl border border-slate-700/60 transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${emailsLoading ? "animate-spin text-purple-400" : "text-slate-400"}`}
                />
                {emailsLoading ? "جاري..." : "تحديث"}
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto custom-scrollbar-slim pr-1 space-y-3">
              {!requestDataForm.serviceNumber &&
              !requestDataForm.requestNumber ? (
                <div className="flex flex-col items-center justify-center py-8 text-center opacity-60">
                  <div className="p-3 bg-slate-800/40 rounded-2xl mb-3 border border-slate-700/40">
                    <Inbox className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-sm font-black text-slate-300 mb-1">
                    أدخل أرقام المعاملة
                  </p>
                  <p className="text-[11px] font-bold text-slate-500 max-w-[220px]">
                    سيتم سحب الإفادات تلقائياً عند إدخال رقم الخدمة أو الطلب
                  </p>
                </div>
              ) : relatedEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center opacity-60">
                  <div className="p-3 bg-slate-800/40 rounded-2xl mb-3 border border-slate-700/40">
                    <Mail className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-sm font-black text-slate-300 mb-1">
                    لا توجد إفادات
                  </p>
                  <p className="text-[11px] font-bold text-slate-500 max-w-[220px]">
                    لم تصل رسائل من المنصة لهذه الأرقام بعد
                  </p>
                </div>
              ) : (
                relatedEmails.map((email) => (
                  <div
                    key={email.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 hover:border-purple-500/40 hover:bg-slate-800/70 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2.5 pb-2.5 border-b border-slate-700/40 gap-2">
                      <span className="text-xs font-black text-slate-200 leading-snug line-clamp-2 flex-1">
                        {email.subject}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-700/40 shrink-0">
                        {new Date(email.date).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/30 text-[11px] font-bold text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                      {email.replyText || email.body || "محتوى غير متاح"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
