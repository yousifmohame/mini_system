import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../api/axios";
import { toast } from "sonner";
import {
  FileText,
  Edit3,
  X,
  Save,
  Loader2,
  User,
  EyeOff,
  MapPinned,
  CreditCard,
  CalendarDays,
  Clock,
  AlertTriangle,
  MessageSquareText,
  Building2,
  Image as ImageIcon,
  QrCode,
  Globe,
  Upload,
  Building,
  Plus,
  Paperclip,
  Trash2,
  Users,
  Layers,
  CheckCircle,
} from "lucide-react";
import { SearchableSelect } from "../TransactionSharedUI";
import AccessControl from "../../../../components/AccessControl";

// Helper: لتحويل الأرقام العربية إلى إنجليزية
const toEnglishNumbers = (str) => {
  if (str === null || str === undefined) return "";
  return String(str).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
};

export const BasicTab = ({
  tx,
  isEditingBasic,
  setIsEditingBasic,
  editFormData,
  setEditFormData,
  saveBasicEdits,
  updateTxMutation,
  clientsOptions,
  districtsOptions,
  offices,
  persons,
  formatDateTime,
  safeText,
  backendUrl,
  currentUser,
}) => {
  const queryClient = useQueryClient();

  // 🚀 1. جلب قائمة المخططات من الباك إند
  const { data: plansData = [] } = useQuery({
    queryKey: ["riyadh-plans"],
    queryFn: async () => (await api.get("/riyadh-streets/plans")).data,
  });

  const plansOptions = plansData.map((p) => ({
    value: p.planNumber,
    label: p.planNumber,
    id: p.id,
  }));

  // 🚀 2. حالة المودال الصغير للإضافة السريعة للمخطط
  const [isQuickAddPlanOpen, setIsQuickAddPlanOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");

  const quickAddPlanMutation = useMutation({
    mutationFn: async (planNumber) => {
      return await api.post("/riyadh-streets/plans", {
        planNumber,
        status: "معتمد",
        isWithout: false,
      });
    },
    onSuccess: (res) => {
      toast.success("تم تسجيل المخطط الجديد بنجاح");
      queryClient.invalidateQueries(["riyadh-plans"]);
      setEditFormData((prev) => ({ ...prev, plan: res.data.planNumber }));
      setNewPlanName("");
      setIsQuickAddPlanOpen(false);
    },
    onError: () => toast.error("فشل إضافة المخطط، قد يكون مكرراً"),
  });

  const createdDate = new Date(tx.createdAt);
  const updatedDate = new Date(tx.updatedAt || tx.createdAt);
  const today = new Date();

  const daysSinceCreation = Math.floor(
    (today - createdDate) / (1000 * 60 * 60 * 24),
  );
  const daysSinceUpdate = Math.floor(
    (today - updatedDate) / (1000 * 60 * 60 * 24),
  );

  const delayStatus =
    daysSinceUpdate > 7
      ? "متأخرة"
      : daysSinceUpdate > 3
        ? "تحتاج متابعة"
        : "منتظمة";
  const delayColor =
    delayStatus === "متأخرة"
      ? "text-red-600 bg-red-50 border-red-200"
      : delayStatus === "تحتاج متابعة"
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-emerald-600 bg-emerald-50 border-emerald-200";

  const [siteImagePreview, setSiteImagePreview] = useState(
    tx.notes?.refs?.siteImage
      ? `${backendUrl || ""}${tx.notes.refs.siteImage}`
      : null,
  );
  const [isSiteImageModalOpen, setIsSiteImageModalOpen] = useState(false);

  const handleEditChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: toEnglishNumbers(value) }));
  };

  const handleTextChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSiteImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFormData((prev) => ({ ...prev, newSiteImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => setSiteImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const addOwnerRow = () => {
    setEditFormData((prev) => {
      const currentOwners = prev.additionalOwners || [];
      return {
        ...prev,
        additionalOwners: [...currentOwners, { clientId: "", ownerName: "" }],
      };
    });
  };

  const removeOwnerRow = (index) => {
    setEditFormData((prev) => {
      const newOwners = [...prev.additionalOwners];
      newOwners.splice(index, 1);
      return { ...prev, additionalOwners: newOwners };
    });
  };

  const updateAdditionalOwner = (index, val, opt) => {
    setEditFormData((prev) => {
      const newOwners = [...prev.additionalOwners];
      newOwners[index] = { clientId: val, ownerName: opt.label };
      return { ...prev, additionalOwners: newOwners };
    });
  };

  let plotsArray = [];
  const sourcePlots = isEditingBasic
    ? editFormData.plots
    : tx.plots?.length > 0
      ? tx.plots
      : tx.notes?.refs?.plots;

  if (Array.isArray(sourcePlots)) {
    plotsArray = sourcePlots;
  } else if (typeof sourcePlots === "string") {
    plotsArray = sourcePlots
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const displayOwners = tx.ownerNames
    ? tx.ownerNames.split(" و ")
    : [tx.client || tx.owner];

  return (
    <div className="space-y-6 animate-in fade-in pb-20 relative min-h-screen">
      {/* 💡 رأس التبويب وأزرار التحكم */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" /> البيانات الرئيسية
        </h3>
        <AccessControl
          code="EDIT_TRANSACTION_42"
          name="تعديل البيانات الأساسية للمعاملة"
          moduleName="تفاصيل المعاملة"
          tabName="البيانات الأساسية"
        >
          <button
            onClick={() => {
              if (!isEditingBasic) {
                const existingNames = tx.ownerNames
                  ? tx.ownerNames.split(" و ")
                  : [];
                if (existingNames.length > 1) {
                  const additional = existingNames.slice(1).map((name) => ({
                    clientId: "",
                    ownerName: name.trim(),
                  }));
                  setEditFormData((prev) => ({
                    ...prev,
                    additionalOwners: additional,
                  }));
                } else {
                  setEditFormData((prev) => ({
                    ...prev,
                    additionalOwners: [],
                  }));
                }
              }
              setIsEditingBasic(!isEditingBasic);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 border rounded-lg text-xs font-bold shadow-sm transition-colors ${
              isEditingBasic
                ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {isEditingBasic ? (
              <X className="w-3.5 h-3.5" />
            ) : (
              <Edit3 className="w-3.5 h-3.5" />
            )}
            {isEditingBasic ? "إلغاء التعديل" : "تعديل البيانات"}
          </button>
        </AccessControl>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 bg-gradient-to-l from-blue-50/80 to-white border border-blue-100 p-4 rounded-2xl flex flex-wrap items-center gap-6 shadow-sm">
          <div className="flex items-center gap-3 pr-6 border-l border-blue-100">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-blue-600 mb-0.5">
                مُنشئ المعاملة
              </div>
              <div className="text-sm font-black text-gray-800">
                {tx.createdBy || tx.notes?.createdBy || "مدير النظام"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pr-6 border-l border-blue-100">
            <CalendarDays className="w-8 h-8 text-blue-400 opacity-50" />
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-0.5">
                تاريخ الإنشاء
              </div>
              <div
                className="text-sm font-black text-blue-900 font-mono"
                dir="ltr"
              >
                {createdDate.getDate().toString().padStart(2, "0")}{" "}
                <span className="text-lg text-blue-700">
                  {createdDate.toLocaleString("ar-SA", { month: "short" })}
                </span>{" "}
                {createdDate.getFullYear()}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> أيام منذ الإنشاء
              </div>
              <div className="text-lg font-black font-mono text-slate-700">
                {daysSinceCreation}{" "}
                <span className="text-xs font-bold text-slate-400">يوم</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1">
                <Edit3 className="w-3 h-3 text-slate-400" /> منذ آخر تعديل
              </div>
              <div className="text-lg font-black font-mono text-slate-700">
                {daysSinceUpdate}{" "}
                <span className="text-xs font-bold text-slate-400">يوم</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`shrink-0 w-full lg:w-48 p-4 rounded-2xl border flex flex-col items-center justify-center text-center shadow-sm ${delayColor}`}
        >
          <AlertTriangle
            className={`w-6 h-6 mb-2 ${delayStatus === "متأخرة" ? "animate-pulse" : ""}`}
          />
          <div className="text-[10px] font-bold opacity-70 mb-0.5">
            حالة مسار المعاملة
          </div>
          <div className="text-sm font-black">{delayStatus}</div>
        </div>
      </div>

      {/* 💡 معلومات العميل الأساسية */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm col-span-1 md:col-span-2 flex flex-col">
          <div className="text-blue-800 text-[12px] font-black mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" /> المُلّاك / أصحاب المعاملة
            </span>
            {!isEditingBasic && tx.clientObj && (
              <span
                className={`px-2 py-0.5 text-[9px] rounded font-bold ${tx.clientObj.type?.includes("شرك") ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}`}
              >
                {tx.clientObj.type || "فرد"}
              </span>
            )}
          </div>

          {isEditingBasic ? (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl relative">
                <span className="absolute -top-2.5 right-3 bg-blue-100 text-blue-800 text-[9px] font-black px-2 py-0.5 rounded border border-blue-200">
                  المالك الرئيسي *
                </span>
                <SearchableSelect
                  options={clientsOptions}
                  value={editFormData.clientId}
                  placeholder={
                    editFormData.clientName ||
                    displayOwners[0] ||
                    "ابحث بالاسم..."
                  }
                  onChange={(val, opt) =>
                    setEditFormData({
                      ...editFormData,
                      clientId: val,
                      clientName: opt.label,
                      client: opt.label,
                    })
                  }
                />
              </div>

              {(editFormData.additionalOwners || []).map((owner, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 p-3 rounded-xl relative animate-in slide-in-from-top-2 flex gap-2 items-center"
                >
                  <span className="absolute -top-2.5 right-3 bg-slate-200 text-slate-700 text-[9px] font-black px-2 py-0.5 rounded border border-slate-300">
                    شريك إضافي
                  </span>
                  <div className="flex-1">
                    <SearchableSelect
                      options={clientsOptions}
                      value={owner.clientId}
                      placeholder={owner.ownerName || "ابحث عن الشريك..."}
                      onChange={(val, opt) =>
                        updateAdditionalOwner(idx, val, opt)
                      }
                    />
                  </div>
                  <button
                    onClick={() => removeOwnerRow(idx)}
                    className="p-2.5 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-red-100 mt-1"
                    title="إزالة الشريك"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                onClick={addOwnerRow}
                className="w-full py-2 bg-white border border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> إضافة شريك / مالك آخر
              </button>
            </div>
          ) : (
            <div className="space-y-2 mb-3">
              {displayOwners.map((ownerName, idx) => (
                <div
                  key={idx}
                  className="text-base font-black text-gray-800 flex items-center gap-2"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-blue-500" : "bg-slate-300"}`}
                  ></span>
                  {safeText(ownerName)}
                  {idx === 0 && displayOwners.length > 1 && (
                    <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 rounded">
                      رئيسي
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isEditingBasic && tx.clientObj && (
            <div className="mt-auto grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
              <div>
                <div className="text-[9px] text-gray-400 font-bold mb-1 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> الهوية
                </div>
                <div className="text-[11px] font-mono font-bold text-slate-700 truncate">
                  {tx.clientObj.idNumber ||
                    tx.clientObj.identification?.idNumber ||
                    "—"}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-gray-400 font-bold mb-1">
                  فئة التصنيف
                </div>
                <div className="text-xs font-black text-amber-600">
                  {tx.clientObj.grade
                    ? `الفئة ${tx.clientObj.grade}`
                    : "غير مصنف"}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-gray-400 font-bold mb-1">
                  معاملات العميل
                </div>
                <div className="text-xs font-mono font-black text-blue-600">
                  {tx.clientObj._count?.transactions || 1}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <div className="text-gray-500 text-[11px] font-bold mb-2">
            رقم المعاملة (النظام)
          </div>
          {isEditingBasic ? (
            <div className="flex gap-2">
              <select
                value={editFormData.year}
                onChange={(e) => handleTextChange("year", e.target.value)}
                className="border p-2 rounded-lg text-sm w-1/2 outline-none focus:border-blue-500 font-mono font-bold"
              >
                {[2023, 2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={editFormData.month}
                onChange={(e) => handleTextChange("month", e.target.value)}
                className="border p-2 rounded-lg text-sm w-1/2 outline-none focus:border-blue-500 font-mono font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={String(m).padStart(2, "0")}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="font-mono text-2xl font-black text-blue-700 tracking-wider">
              {tx.ref || tx.id.slice(-6)}
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <div className="text-gray-500 text-[11px] font-bold mb-2">
            نوع المعاملة
          </div>
          {isEditingBasic ? (
            <select
              value={editFormData.type}
              onChange={(e) => handleTextChange("type", e.target.value)}
              className="w-full border p-2.5 rounded-lg text-sm font-bold outline-none focus:border-blue-500 bg-gray-50"
            >
              <option>اصدار</option>
              <option>تجديد وتعديل</option>
              <option>تصحيح وضع مبني قائم</option>
            </select>
          ) : (
            <div className="text-lg font-black text-gray-800">
              {safeText(tx.type || tx.category)}
            </div>
          )}
        </div>
      </div>

      {/* 💡 الاسم المتداول والملاحظات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[11px] font-bold text-gray-500 flex items-center gap-2">
              الاسم المتداول للمعامله (مرجع داخلي)
            </label>
            {isEditingBasic && (
              <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                <input
                  type="checkbox"
                  className="accent-blue-600 w-3.5 h-3.5"
                  checked={editFormData.isInternalNameHidden}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      isInternalNameHidden: e.target.checked,
                    })
                  }
                />
                <span className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
                  <EyeOff className="w-3 h-3" /> إخفاء من التقارير
                </span>
              </label>
            )}
          </div>
          {isEditingBasic ? (
            <input
              type="text"
              value={editFormData.internalName}
              onChange={(e) => handleTextChange("internalName", e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50"
              placeholder="مثال: فيلا الياسمين..."
            />
          ) : (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xl font-black text-gray-800 leading-tight">
                {tx.internalName || tx.notes?.internalName || "—"}
              </span>
              {tx.notes?.isInternalNameHidden && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[9px] font-bold rounded-md flex items-center gap-1 border border-gray-200">
                  <EyeOff className="w-3 h-3" /> سري / داخلي
                </span>
              )}
            </div>
          )}
        </div>

        <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <label className="text-[11px] font-bold text-amber-800 flex items-center gap-2">
              <MessageSquareText className="w-4 h-4" /> ملاحظات عامة وإرشادات
            </label>
            {tx.notes?.generalNotes && !isEditingBasic && (
              <div
                className="text-[9px] font-bold text-amber-600/70 text-left"
                dir="ltr"
              >
                آخر تعديل: {tx.notes?.generalNotesUpdatedBy || "موظف"} |{" "}
                {tx.notes?.generalNotesUpdatedAt
                  ? new Date(tx.notes.generalNotesUpdatedAt).toLocaleDateString(
                      "en-GB",
                    )
                  : ""}
              </div>
            )}
          </div>
          {isEditingBasic ? (
            <div className="flex flex-col gap-2 h-full">
              <textarea
                // 👇 التصحيح هنا: نتحقق إذا كان الحقل موجوداً في الـ State حتى لو كان فارغاً
                value={
                  editFormData.generalNotes !== undefined
                    ? editFormData.generalNotes
                    : tx.notes?.generalNotes || ""
                }
                onChange={(e) =>
                  handleTextChange("generalNotes", e.target.value)
                }
                placeholder="اكتب أي ملاحظات أو توجيهات هامة تخص هذه المعاملة لتظهر لجميع الموظفين..."
                className="w-full flex-1 min-h-[80px] border border-amber-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 bg-white resize-none"
              />
              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-amber-200">
                <label className="flex items-center gap-2 text-[10px] font-bold text-amber-700 cursor-pointer hover:text-amber-900 transition-colors px-2">
                  <Paperclip className="w-4 h-4" /> إرفاق مستند للتوضيح
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        generalNotesFile: e.target.files[0],
                      }))
                    }
                  />
                </label>
                {editFormData.generalNotesFile && (
                  <span className="text-[10px] font-mono truncate max-w-[150px]">
                    {editFormData.generalNotesFile.name}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white border border-amber-100 rounded-xl p-4 text-sm font-bold text-gray-700 whitespace-pre-wrap leading-relaxed">
              {tx.notes?.generalNotes || (
                <span className="text-gray-400 italic font-normal text-xs">
                  لا توجد ملاحظات عامة مسجلة.
                </span>
              )}
              {tx.notes?.generalNotesFileUrl && (
                <div className="mt-4 pt-3 border-t border-amber-100">
                  <button
                    onClick={() =>
                      window.open(
                        `${backendUrl || ""}${tx.notes.generalNotesFileUrl}`,
                        "_blank",
                      )
                    }
                    className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors w-max"
                  >
                    <Paperclip className="w-3.5 h-3.5" /> عرض المرفق التوضيحي
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 💡 بيانات الموقع / الأرض والمساحة */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-50/50 px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <MapPinned className="w-5 h-5 text-emerald-600" />
          <h4 className="text-sm font-black text-gray-800">
            تفاصيل الموقع والمساحة والتخطيط
          </h4>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="col-span-1 lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-gray-500 text-[10px] font-bold block">
                  رقم المخطط
                </label>
                {isEditingBasic ? (
                  <div className="flex gap-1.5">
                    <div className="flex-1">
                      <SearchableSelect
                        options={plansOptions}
                        value={editFormData.plan}
                        placeholder={editFormData.plan || "اختر المخطط..."}
                        onChange={(val) =>
                          setEditFormData((p) => ({ ...p, plan: val }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsQuickAddPlanOpen(true)}
                      className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="font-bold text-gray-800 font-mono text-base bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-center gap-2">
                    <Layers size={14} className="text-blue-500" />
                    {tx.plan || tx.planNumber || tx.notes?.refs?.plan || "—"}
                  </div>
                )}
              </div>

              {/* 💡 التعديل الجوهري للحي هنا 👈 */}
              <div className="space-y-1.5">
                <label className="text-gray-500 text-[10px] font-bold block">
                  الحي والقطاع
                </label>
                {isEditingBasic ? (
                  <SearchableSelect
                    options={districtsOptions}
                    value={editFormData.districtId}
                    placeholder={
                      editFormData.district ||
                      tx.districtNode?.name ||
                      tx.districtName ||
                      "تعديل الحي..."
                    }
                    onChange={(val, opt) =>
                      setEditFormData({
                        ...editFormData,
                        districtId: val,
                        district: opt.label.split(" (")[0],
                        districtName: opt.label.split(" (")[0], // إرسال صريح للباك إند
                        sector: opt.sectorName,
                      })
                    }
                  />
                ) : (
                  <div className="font-bold text-gray-800 text-sm bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    {safeText(
                      tx.districtNode?.name || // الأولوية للحي المربوط بالـ ID
                        tx.districtName ||
                        tx.district ||
                        tx.notes?.refs?.districtName,
                    )}{" "}
                    <span className="text-gray-400 font-normal">|</span>{" "}
                    {safeText(
                      tx.districtNode?.sector?.name ||
                        tx.sector ||
                        tx.notes?.refs?.sector,
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-500 text-[10px] font-bold block">
                  موقع استراتيجي (على المحاور؟)
                </label>
                {isEditingBasic ? (
                  <select
                    value={
                      editFormData.isOnAxis !== undefined
                        ? editFormData.isOnAxis
                        : tx.isOnAxis || tx.notes?.refs?.isOnAxis || "لا"
                    }
                    onChange={(e) =>
                      handleTextChange("isOnAxis", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold outline-none focus:border-emerald-500 bg-gray-50"
                  >
                    <option value="لا">لا يقع على المحاور</option>
                    <option value="نعم">نعم (يقع على المحاور)</option>
                  </select>
                ) : (
                  <div
                    className={`font-bold text-sm p-2.5 rounded-lg border ${(tx.isOnAxis || tx.notes?.refs?.isOnAxis) === "نعم" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-50 text-gray-700 border-gray-100"}`}
                  >
                    {(tx.isOnAxis || tx.notes?.refs?.isOnAxis) === "نعم"
                      ? "يقع على المحاور التجارية"
                      : "طبيعي (داخل الحي)"}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-gray-500 text-[10px] font-bold block">
                  المساحة الإجمالية
                </label>
                {isEditingBasic ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editFormData.area}
                      onChange={(e) => handleEditChange("area", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-lg font-mono font-black outline-none focus:border-emerald-500 text-blue-700"
                      placeholder="0"
                    />
                    <span className="bg-gray-100 px-4 py-2.5 rounded-lg text-sm font-bold text-gray-500 border border-gray-200">
                      م²
                    </span>
                  </div>
                ) : (
                  <div className="font-black text-blue-700 font-mono text-xl bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                    {tx.landArea ||
                    tx.notes?.refs?.landArea ||
                    tx.notes?.refs?.area
                      ? `${parseFloat(tx.landArea || tx.notes?.refs?.landArea || tx.notes?.refs?.area).toLocaleString()} م²`
                      : "—"}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-500 text-[10px] font-bold block">
                  اسم الشارع المطل عليه وعرضه
                </label>
                {isEditingBasic ? (
                  <input
                    type="text"
                    value={editFormData.streetName}
                    onChange={(e) =>
                      handleTextChange("streetName", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold outline-none focus:border-emerald-500 bg-gray-50"
                    placeholder="مثال: شارع العليا (عرض 36م)"
                  />
                ) : (
                  <div className="font-bold text-gray-800 text-sm bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />{" "}
                    {tx.streetName || tx.notes?.refs?.streetName || "غير مسجل"}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 mt-2">
              <label className="text-gray-500 text-[10px] font-bold mb-3 block">
                خرائط وروابط الموقع
              </label>
              {isEditingBasic ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    dir="ltr"
                    value={editFormData.mapsLink}
                    onChange={(e) =>
                      handleTextChange("mapsLink", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono outline-none focus:border-blue-500 bg-gray-50"
                    placeholder="رابط Google Maps"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={editFormData.officialMapLink}
                    onChange={(e) =>
                      handleTextChange("officialMapLink", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono outline-none focus:border-emerald-500 bg-gray-50"
                    placeholder="رابط الخريطة الرسمية / الأمانة"
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {tx.notes?.refs?.mapsLink ? (
                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm w-max">
                      <button
                        onClick={() =>
                          window.open(tx.notes.refs.mapsLink, "_blank")
                        }
                        className="flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                        title="فتح جوجل ماب"
                      >
                        <MapPinned className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="text-[10px] font-bold text-gray-400">
                          خرائط جوجل
                        </div>
                        <div className="text-xs font-bold text-slate-700">
                          Google Maps
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gray-100 ml-2 rounded p-1 flex items-center justify-center border border-gray-200">
                        <QrCode className="w-full h-full text-gray-500 opacity-50" />{" "}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 font-bold bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                      لم يتم إدراج رابط Google Maps
                    </div>
                  )}

                  {(tx.officialMapLink || tx.notes?.refs?.officialMapLink) && (
                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm w-max">
                      <button
                        onClick={() =>
                          window.open(
                            tx.officialMapLink || tx.notes.refs.officialMapLink,
                            "_blank",
                          )
                        }
                        className="flex items-center justify-center w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"
                        title="فتح الخريطة الرسمية"
                      >
                        <Globe className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="text-[10px] font-bold text-gray-400">
                          مستكشف الرياض / الأمانة
                        </div>
                        <div className="text-xs font-bold text-slate-700">
                          الخريطة الرسمية
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gray-100 ml-2 rounded p-1 flex items-center justify-center border border-gray-200">
                        <QrCode className="w-full h-full text-gray-500 opacity-50" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 lg:col-span-4 flex flex-col gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-1">
              <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                <label className="text-gray-600 text-[11px] font-black">
                  أرقام القطع
                </label>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                  العدد: {plotsArray.length}
                </span>
              </div>
              {isEditingBasic ? (
                <div className="space-y-2">
                  <textarea
                    value={
                      Array.isArray(editFormData.plots)
                        ? editFormData.plots.join(", ")
                        : editFormData.plots || ""
                    }
                    onChange={(e) => handleEditChange("plots", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm font-mono outline-none focus:border-blue-500 bg-white min-h-[100px] resize-none"
                    placeholder="أدخل أرقام القطع مفصولة بفاصلة (12, 13, 14)..."
                  />
                  <p className="text-[9px] text-gray-400 font-bold">
                    افصل بين كل رقم بفاصلة (,)
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar-slim pr-1">
                  {plotsArray.length > 0 ? (
                    plotsArray.map((plot, i) => (
                      <div
                        key={i}
                        className="bg-white border border-gray-100 px-3 py-1.5 rounded-lg text-sm font-mono font-bold text-center text-slate-700 shadow-sm"
                      >
                        {plot}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-4">
                      لا توجد قطع
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center group relative overflow-hidden min-h-[140px]">
              {siteImagePreview ? (
                <>
                  <img
                    src={siteImagePreview}
                    alt="الموقع"
                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity"
                  />
                  <div className="relative z-10 flex flex-col gap-2">
                    <button
                      onClick={() =>
                        !isEditingBasic && setIsSiteImageModalOpen(true)
                      }
                      className="bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full transition-colors mx-auto"
                    >
                      <ImageIcon className="w-6 h-6" />
                    </button>
                    <span className="text-white text-[10px] font-bold drop-shadow-md">
                      الصورة الجوية للموقع
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-60">
                  <ImageIcon className="w-8 h-8 text-white" />
                  <span className="text-white text-[10px] font-bold">
                    لا توجد صورة جوية
                  </span>
                </div>
              )}
              {isEditingBasic && (
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity z-20">
                  <Upload className="w-6 h-6 text-white mb-1" />
                  <span className="text-white text-xs font-bold">
                    تغيير الصورة
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleSiteImageChange}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 💡 المكاتب المشاركة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
          <div className="text-gray-800 text-sm font-black mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Building2 className="w-4 h-4 text-purple-600" /> المكتب المشرف
          </div>
          {isEditingBasic ? (
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <select
                value={
                  editFormData.supervisingOfficeId ||
                  tx.supervisorOfficeId ||
                  tx.requestData?.supervisorOffice ||
                  ""
                }
                onChange={(e) =>
                  handleTextChange("supervisingOfficeId", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg p-3 text-sm font-bold outline-none focus:border-purple-500 bg-gray-50"
              >
                <option value="">-- اختر المكتب المشرف من القائمة --</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              {tx.supervisorOfficeId || tx.requestData?.supervisorOffice ? (
                <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4">
                  <div className="text-lg font-black text-purple-900 mb-1">
                    {offices.find(
                      (o) =>
                        o.id ===
                          (tx.supervisorOfficeId ||
                            tx.requestData?.supervisorOffice) ||
                        o.name ===
                          (tx.supervisorOfficeId ||
                            tx.requestData?.supervisorOffice),
                    )?.name ||
                      tx.supervisorOfficeId ||
                      tx.requestData?.supervisorOffice}
                  </div>
                  <div className="text-xs text-purple-600 font-bold">
                    جهة إشرافية معتمدة
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 font-bold text-xs py-6">
                  لم يتم تحديد مكتب مشرف لهذه المعاملة
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
          <div className="text-gray-800 text-sm font-black mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Building className="w-4 h-4 text-cyan-600" /> المكتب المصمم
          </div>
          {isEditingBasic ? (
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <select
                value={
                  editFormData.designingOfficeId ||
                  tx.designerOfficeId ||
                  tx.requestData?.designerOffice ||
                  ""
                }
                onChange={(e) =>
                  handleTextChange("designingOfficeId", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg p-3 text-sm font-bold outline-none focus:border-cyan-500 bg-gray-50"
              >
                <option value="">-- اختر المكتب المصمم من القائمة --</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              {tx.designerOfficeId || tx.requestData?.designerOffice ? (
                <div className="bg-cyan-50/50 border border-cyan-100 rounded-xl p-4">
                  <div className="text-lg font-black text-cyan-900 mb-1">
                    {offices.find(
                      (o) =>
                        o.id ===
                          (tx.designerOfficeId ||
                            tx.requestData?.designerOffice) ||
                        o.name ===
                          (tx.designerOfficeId ||
                            tx.requestData?.designerOffice),
                    )?.name ||
                      tx.designerOfficeId ||
                      tx.requestData?.designerOffice}
                  </div>
                  <div className="text-xs text-cyan-600 font-bold">
                    الجهة المسؤولة عن التصميم
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 font-bold text-xs py-6">
                  هذه المعاملة بتصميم داخلي (مكتب ديتيلز)
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isQuickAddPlanOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[210] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-black text-slate-800 flex items-center gap-2">
                <Layers className="text-blue-600" size={20} /> إضافة مخطط جديد
              </h4>
              <button
                onClick={() => setIsQuickAddPlanOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-black text-slate-500 mb-1.5 block">
                  رقم المخطط الجديد
                </label>
                <input
                  type="text"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm font-black focus:border-blue-500 outline-none"
                  placeholder="مثال: 1234 / أ / 2"
                  autoFocus
                />
              </div>
              <button
                onClick={() => quickAddPlanMutation.mutate(newPlanName)}
                disabled={!newPlanName || quickAddPlanMutation.isPending}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {quickAddPlanMutation.isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <CheckCircle size={18} />
                )}{" "}
                تأكيد الإضافة للسجل
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditingBasic && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
          <button
            onClick={() => {
              let finalNames = [editFormData.clientName];
              let detailedOwners = [
                {
                  clientId: editFormData.clientId,
                  ownerName: editFormData.clientName,
                  isPrimary: true,
                },
              ];

              if (
                editFormData.additionalOwners &&
                editFormData.additionalOwners.length > 0
              ) {
                const additionalValid = editFormData.additionalOwners.filter(
                  (o) => o.ownerName && o.ownerName.trim() !== "",
                );
                finalNames = [
                  ...finalNames,
                  ...additionalValid.map((o) => o.ownerName),
                ];
                additionalValid.forEach((o) => {
                  detailedOwners.push({
                    clientId: o.clientId,
                    ownerName: o.ownerName,
                    isPrimary: false,
                  });
                });
              }
              const finalOwnerNamesString = finalNames.join(" و ");

              const updatedData = {
                ...editFormData,
                ownerNames: finalOwnerNamesString,
                notes: {
                  ...editFormData.notes,
                  detailedOwnersList: detailedOwners,
                },
                updatedBy: currentUser?.name || "مدير النظام",
              };

              setEditFormData(updatedData);
              saveBasicEdits(updatedData);
            }}
            disabled={updateTxMutation.isPending}
            className="px-8 py-3.5 bg-blue-600 text-white rounded-full text-base font-black shadow-[0_8px_30px_rgb(37,99,235,0.4)] hover:bg-blue-700 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center gap-3"
          >
            {updateTxMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            حفظ وتطبيق التعديلات الشاملة
          </button>
        </div>
      )}

      {isSiteImageModalOpen && siteImagePreview && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsSiteImageModalOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsSiteImageModalOpen(false)}
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/30 p-2 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={siteImagePreview}
              alt="الصورة الجوية"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};
