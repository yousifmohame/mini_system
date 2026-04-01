import React, { useEffect, useState } from "react";
import {
  FileText,
  Edit3,
  X,
  Save,
  Loader2,
  User,
  EyeOff,
  MapPinned,
  Check,
  History,
  PenLine,
  Upload,
  Trash2,
  ImageIcon,
  Activity,
  FileBox,
  Send,
  Paperclip,
  Plus,
  Briefcase,
  CalendarDays
} from "lucide-react";

// بقية التبويبات (StatusTab, AttachmentsTab, LogsTab)...
export const StatusTab = ({
  statusForm,
  setStatusForm,
  updateStatusMutation,
  safeAuthorityHistory,
  deleteAuthorityNoteMutation,
  backendUrl,
  handlePreviewAttachmentSafe,
  formatDateTime,
  safeAttachments,
  deleteAttachmentMutation,
  txType,

  // 💡 Props جديدة ضرورية لإضافة المهمة من داخل StatusTab
  persons,
  isSuperAdmin,
  addTaskMutation,
}) => {
  // 💡 State محلية داخل StatusTab للتحكم بفورم المهام المصغر
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    assigneeId: "",
    description: "",
    deadline: "",
    isUrgent: false,
  });

  const employees = persons?.filter((p) => p.role !== "عميل") || [];

  // 💡 الذكاء الآلي: مراقبة المدخلات وتغيير الحالة تلقائياً
  useEffect(() => {
    if (
      statusForm.currentStatus === "ملاحظات من الجهات" ||
      statusForm.currentStatus === "تم الاعتماد"
    )
      return;

    const hasNewServiceNum = !!statusForm.serviceNumber;
    const hasNewHijriYear = !!statusForm.hijriYear1;
    const hasNewLicense = !!statusForm.licenseNumber;
    const hasOldLicenseOnly =
      !!statusForm.oldLicenseNumber || !!statusForm.hijriYear2;
    const hasNewData = hasNewServiceNum || hasNewHijriYear || hasNewLicense;

    let shouldAutoMoveToStage2 = false;

    if (txType === "تصحيح وضع مبني قائم") {
      if (hasNewData) shouldAutoMoveToStage2 = true;
    } else {
      if (hasNewData || hasOldLicenseOnly) shouldAutoMoveToStage2 = true;
    }

    if (shouldAutoMoveToStage2 && statusForm.currentStatus !== "تم الرفع") {
      setStatusForm((prev) => ({ ...prev, currentStatus: "تم الرفع" }));
    }
  }, [
    statusForm.serviceNumber,
    statusForm.hijriYear1,
    statusForm.licenseNumber,
    statusForm.oldLicenseNumber,
    statusForm.hijriYear2,
    txType,
    setStatusForm,
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-10">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-1/2 left-10 right-10 h-1 bg-gray-100 -z-10 -translate-y-1/2"></div>
        {[
          "عند المهندس للدراسة",
          "تم الرفع",
          "ملاحظات من الجهات",
          "تم الاعتماد",
        ].map((step, idx) => {
          const isActive = statusForm.currentStatus === step;
          const isPassed =
            [
              "عند المهندس للدراسة",
              "تم الرفع",
              "ملاحظات من الجهات",
              "تم الاعتماد",
            ].indexOf(statusForm.currentStatus) > idx;

          return (
            <button
              key={step}
              onClick={() => {
                if (step === "تم الاعتماد" && !statusForm.approvalDate) {
                  setStatusForm({
                    ...statusForm,
                    currentStatus: step,
                    approvalDate: new Date().toISOString(),
                  });
                } else {
                  setStatusForm({ ...statusForm, currentStatus: step });
                }
              }}
              className="flex flex-col items-center gap-2 bg-white px-4 cursor-pointer group"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all shadow-sm ${isActive ? "border-orange-500 bg-orange-50 text-orange-600 scale-110" : isPassed ? "border-green-500 bg-green-500 text-white" : "border-gray-200 bg-white text-gray-400 group-hover:border-orange-200"}`}
              >
                {isPassed ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <span className="font-black text-sm">{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-xs font-black transition-colors ${isActive ? "text-orange-600" : isPassed ? "text-green-600" : "text-gray-400"}`}
              >
                {step}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {statusForm.currentStatus === "عند المهندس للدراسة" && (
          <div className="p-8 flex flex-col items-center justify-center bg-slate-50/50">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
              <Briefcase className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-black text-gray-800 mb-2">
              المعاملة قيد الدراسة الهندسية
            </h3>
            <p className="text-sm font-semibold text-gray-500 max-w-md text-center mb-8">
              لم يتم رفع المعاملة على منصة (بلدي/إحكام) حتى الآن. يُرجى استكمال
              المخططات والدراسات الفنية المطلوبة.
            </p>

            {/* 💡 فورم مصغر لإسناد المهام يظهر للمشرف فقط */}
            {isSuperAdmin && (
              <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-indigo-50/50 px-5 py-3 border-b border-indigo-100 flex justify-between items-center">
                  <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" /> توجيه مهام للموظفين
                    (دراسة / تصميم)
                  </h4>
                  <button
                    onClick={() => setIsAddingTask(!isAddingTask)}
                    className="bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    {isAddingTask ? (
                      <X className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    {isAddingTask ? "إلغاء" : "إضافة مهمة"}
                  </button>
                </div>

                {isAddingTask && (
                  <div className="p-5 space-y-4 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block">
                          اختر الموظف (المهندس)
                        </label>
                        <select
                          value={taskForm.assigneeId}
                          onChange={(e) =>
                            setTaskForm({
                              ...taskForm,
                              assigneeId: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 bg-white"
                        >
                          <option value="">-- اختر موظف --</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block">
                          وقت التسليم المطلوب
                        </label>
                        <input
                          type="datetime-local"
                          value={taskForm.deadline}
                          onChange={(e) =>
                            setTaskForm({
                              ...taskForm,
                              deadline: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 p-2.5 rounded-lg text-sm font-mono outline-none focus:border-indigo-500 bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-700 mb-1 block">
                          وصف المطلوب
                        </label>
                        <textarea
                          value={taskForm.description}
                          onChange={(e) =>
                            setTaskForm({
                              ...taskForm,
                              description: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 p-3 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white min-h-[60px]"
                          placeholder="مثال: مراجعة المخططات الإنشائية وتجهيزها للرفع..."
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-red-600">
                        <input
                          type="checkbox"
                          checked={taskForm.isUrgent}
                          onChange={(e) =>
                            setTaskForm({
                              ...taskForm,
                              isUrgent: e.target.checked,
                            })
                          }
                          className="accent-red-600 w-4 h-4"
                        />
                        مهمة عاجلة 🔥
                      </label>
                      <button
                        onClick={() => {
                          if (
                            !taskForm.assigneeId ||
                            !taskForm.description ||
                            !taskForm.deadline
                          )
                            return toast.error("أكمل بيانات المهمة");

                          addTaskMutation.mutate(taskForm, {
                            onSuccess: () => {
                              setIsAddingTask(false);
                              setTaskForm({
                                assigneeId: "",
                                description: "",
                                deadline: "",
                                isUrgent: false,
                              });
                              // إشعار نجاح إضافي (الـ Mutation الأصلي يعرض إشعاراً أيضاً)
                            },
                          });
                        }}
                        disabled={addTaskMutation.isPending}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {addTaskMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        توجيه المهمة
                      </button>
                    </div>
                  </div>
                )}
                {!isAddingTask && (
                  <div className="p-4 text-center text-xs text-gray-500 font-bold bg-white">
                    يمكنك إسناد مهام (رسم، مساحة، تدقيق) للموظفين من هنا مباشرة.
                    المهام المسندة ستظهر في تبويب "مهام المعاملة".
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {statusForm.currentStatus === "تم الرفع" && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <Send className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-black text-gray-800">
                بيانات الرفع على المنصات (بلدي / إحكام)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  رقم الخدمة / الطلب <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={statusForm.serviceNumber}
                  onChange={(e) =>
                    setStatusForm({
                      ...statusForm,
                      serviceNumber: e.target.value,
                    })
                  }
                  placeholder="مثال: 450000123"
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm font-mono font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  سنة الخدمة (هجري)
                </label>
                <input
                  type="text"
                  value={statusForm.hijriYear1}
                  onChange={(e) =>
                    setStatusForm({
                      ...statusForm,
                      hijriYear1: e.target.value,
                    })
                  }
                  placeholder="مثال: 1445"
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm font-mono font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  رقم الرخصة (إن وجد)
                </label>
                <input
                  type="text"
                  value={statusForm.licenseNumber}
                  onChange={(e) =>
                    setStatusForm({
                      ...statusForm,
                      licenseNumber: e.target.value,
                    })
                  }
                  placeholder="رقم الرخصة الجديد"
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm font-mono font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  سنة الرخصة (هجري)
                </label>
                <input
                  type="text"
                  value={statusForm.hijriYear2}
                  onChange={(e) =>
                    setStatusForm({
                      ...statusForm,
                      hijriYear2: e.target.value,
                    })
                  }
                  placeholder="مثال: 1445"
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm font-mono font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="col-span-1 md:col-span-2 space-y-1.5 pt-2 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-700">
                  رقم الرخصة القديمة (لأغراض التجديد والتعديل)
                </label>
                <input
                  type="text"
                  value={statusForm.oldLicenseNumber}
                  onChange={(e) =>
                    setStatusForm({
                      ...statusForm,
                      oldLicenseNumber: e.target.value,
                    })
                  }
                  placeholder="مثال: 4100000000"
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm font-mono font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}
        {statusForm.currentStatus === "ملاحظات من الجهات" && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <History className="w-5 h-5 text-orange-600" />
              <h3 className="text-sm font-black text-gray-800">
                السجل الزمني للتوجيهات والملاحظات
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 h-[400px] overflow-y-auto custom-scrollbar-slim">
                {safeAuthorityHistory.length > 0 ? (
                  <div className="relative border-r-2 border-orange-200 pr-5 ml-2 space-y-6">
                    {safeAuthorityHistory.map((note, idx) => {
                      const safeUrl = note.attachment?.startsWith("http")
                        ? note.attachment
                        : note.attachment
                          ? `${backendUrl}${note.attachment}`
                          : null;
                      return (
                        <div key={idx} className="relative group">
                          <div className="absolute -right-[27px] top-1 w-4 h-4 bg-orange-100 border-2 border-orange-500 rounded-full"></div>
                          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <div className="bg-orange-100 text-orange-700 p-1.5 rounded-lg">
                                  <User className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[11px] font-black text-gray-800">
                                  {note.addedBy || "موظف النظام"}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400 font-mono font-bold bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                {formatDateTime(note.date)}
                              </span>
                            </div>
                            <p className="text-[13px] text-gray-700 font-bold leading-relaxed mb-3 whitespace-pre-wrap">
                              {note.text}
                            </p>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                              {safeUrl ? (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePreviewAttachmentSafe(
                                      safeUrl,
                                      "مرفق الملاحظة",
                                    );
                                  }}
                                  className="inline-flex items-center gap-1.5 text-[11px] text-blue-600 font-black bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" /> معاينة
                                  المرفق
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-bold">
                                  بدون مرفقات
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (
                                    window.confirm("حذف هذه الملاحظة نهائياً؟")
                                  ) {
                                    const updatedHistory =
                                      safeAuthorityHistory.filter(
                                        (_, i) => i !== idx,
                                      );
                                    deleteAuthorityNoteMutation.mutate(
                                      updatedHistory,
                                    );
                                  }
                                }}
                                disabled={deleteAuthorityNoteMutation.isPending}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                title="حذف الملاحظة"
                              >
                                {deleteAuthorityNoteMutation.isPending ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <History className="w-12 h-12 mb-3 opacity-20" />
                    <span className="text-sm font-bold">
                      لا يوجد سجل ملاحظات سابق
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-orange-50/50 border border-orange-200 rounded-2xl p-5">
                <h4 className="text-xs font-black text-orange-800 mb-4 flex items-center gap-2">
                  <PenLine className="w-4 h-4" /> تدوين توجيه أو ملاحظة جديدة
                </h4>
                <div className="space-y-4">
                  <div>
                    <textarea
                      value={statusForm.newAuthorityNote}
                      onChange={(e) =>
                        setStatusForm({
                          ...statusForm,
                          newAuthorityNote: e.target.value,
                        })
                      }
                      className="w-full border border-orange-200 p-4 rounded-xl text-sm font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 h-[180px] resize-none shadow-sm bg-white"
                      placeholder="اكتب التوجيه الجديد أو الملاحظة الواردة من الجهة (بلدي، إحكام)..."
                    />
                  </div>
                  <div>
                    <label className="flex items-center justify-center gap-2 px-5 py-3 bg-white border-2 border-dashed border-orange-300 text-orange-600 rounded-xl cursor-pointer hover:bg-orange-50 transition-all font-bold text-xs">
                      <Upload className="w-4 h-4" />
                      <span>
                        {statusForm.noteAttachment
                          ? statusForm.noteAttachment.name
                          : "إرفاق صورة من الملاحظة (اختياري)"}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          setStatusForm({
                            ...statusForm,
                            noteAttachment: e.target.files[0],
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {statusForm.currentStatus === "تم الاعتماد" && (
          <div className="p-8 animate-in fade-in">
            <div className="flex flex-col items-center justify-center text-center bg-green-50/50 p-8 rounded-2xl border border-green-100 mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 border-[4px] border-green-200 shadow-inner">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-black text-green-800 mb-2">
                تم اعتماد المعاملة بنجاح!
              </h3>
              <p className="text-sm font-bold text-green-600 max-w-md">
                تم تفعيل عدادات التحصيل الآلية للمبالغ المتبقية على العميل بناءً
                على خطة الدفع المبرمجة.
              </p>
            </div>
            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <h4 className="text-sm font-black text-gray-800 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-blue-600" /> مستندات
                  ومرفقات المعاملة
                </h4>
                <button
                  onClick={() =>
                    setStatusForm({
                      ...statusForm,
                      approvalAttachments: [
                        ...(statusForm.approvalAttachments || []),
                        { file: null, name: "" },
                      ],
                    })
                  }
                  className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> رفع مرفق جديد
                </button>
              </div>
              {safeAttachments.length > 0 && (
                <div className="mb-6">
                  <span className="text-xs font-bold text-gray-500 mb-3 block">
                    المستندات المحفوظة في النظام:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {safeAttachments.map((file, idx) => {
                      let safeName =
                        file.name || file.description || `مرفق ${idx + 1}`;
                      try {
                        safeName = decodeURIComponent(safeName);
                      } catch (e) {}
                      const safeUrl = file.url?.startsWith("http")
                        ? file.url
                        : `${backendUrl}${file.url}`;
                      return (
                        <div
                          key={`saved-${idx}`}
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="bg-white p-1.5 rounded border border-gray-200 shrink-0">
                              <FileText className="w-4 h-4 text-blue-500" />
                            </div>
                            <span
                              className="text-xs font-bold text-gray-700 truncate"
                              title={safeName}
                            >
                              {safeName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handlePreviewAttachmentSafe(safeUrl, safeName);
                              }}
                              className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-200 transition-colors"
                            >
                              معاينة
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (window.confirm("حذف المرفق نهائياً؟")) {
                                  deleteAttachmentMutation.mutate(file.url);
                                }
                              }}
                              className="text-red-400 hover:text-red-600 bg-white border border-gray-200 hover:border-red-200 p-1 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {statusForm.approvalAttachments?.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-dashed border-gray-200">
                  <span className="text-xs font-bold text-blue-600 mb-2 block">
                    مرفقات جديدة (بانتظار الحفظ):
                  </span>
                  {statusForm.approvalAttachments.map((att, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="flex flex-col md:flex-row items-center gap-3 p-3 bg-blue-50/30 border border-blue-100 rounded-xl animate-in slide-in-from-top-2"
                    >
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={att.name}
                          onChange={(e) => {
                            const newAtts = [...statusForm.approvalAttachments];
                            newAtts[idx].name = e.target.value;
                            setStatusForm({
                              ...statusForm,
                              approvalAttachments: newAtts,
                            });
                          }}
                          placeholder="اسم المستند (مثال: رخصة البناء النهائية)"
                          className="w-full border border-gray-300 p-2.5 rounded-lg text-xs font-bold outline-none focus:border-blue-500 bg-white"
                        />
                      </div>
                      <div className="flex-1 w-full flex gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 border border-blue-300 bg-blue-50 text-blue-700 p-2.5 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors text-xs font-bold">
                          <Upload className="w-4 h-4" />
                          <span className="truncate max-w-[120px]">
                            {att.file ? att.file.name : "اختر ملف..."}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const newAtts = [
                                ...statusForm.approvalAttachments,
                              ];
                              newAtts[idx].file = e.target.files[0];
                              if (!newAtts[idx].name)
                                newAtts[idx].name = e.target.files[0].name;
                              setStatusForm({
                                ...statusForm,
                                approvalAttachments: newAtts,
                              });
                            }}
                          />
                        </label>
                        <button
                          onClick={() => {
                            const newAtts =
                              statusForm.approvalAttachments.filter(
                                (_, i) => i !== idx,
                              );
                            setStatusForm({
                              ...statusForm,
                              approvalAttachments: newAtts,
                            });
                          }}
                          className="p-2.5 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {safeAttachments.length === 0 &&
                (!statusForm.approvalAttachments ||
                  statusForm.approvalAttachments.length === 0) && (
                  <div className="text-center py-6 text-gray-400 text-xs font-bold">
                    لم يتم إدراج أي مرفقات للاعتماد. اضغط على "رفع مرفق جديد"
                    للبدء.
                  </div>
                )}
            </div>
          </div>
        )}
        <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={() => updateStatusMutation.mutate(statusForm)}
            disabled={
              updateStatusMutation.isPending ||
              (statusForm.currentStatus === "ملاحظات من الجهات" &&
                !statusForm.newAuthorityNote)
            }
            className="px-8 py-3 bg-slate-800 text-white rounded-xl text-sm font-black shadow-lg hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
          >
            {updateStatusMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}{" "}
            حفظ الحالة وتحديث النظام
          </button>
        </div>
      </div>
    </div>
  );
};
