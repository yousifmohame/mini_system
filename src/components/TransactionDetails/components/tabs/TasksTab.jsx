import React, { useState, useEffect } from "react";
import {
  Clock,
  Plus,
  Save,
  User,
  Check,
  CalendarDays,
  Loader2,
  X,
  Trash2,
  Edit3
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../../context/AuthContext";

// 💡 مكون العداد التنازلي
const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!targetDate) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft("وقت التسليم انتهى!");
        setIsUrgent(true);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`متبقي: ${days}ي ${hours}س ${minutes}د`);
      setIsUrgent(days < 1); // أحمر إذا تبقى أقل من 24 ساعة
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <span
      className={`font-mono font-bold text-xs px-2 py-1 rounded flex items-center gap-1 ${
        isUrgent ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
      }`}
    >
      <Clock className="w-3 h-3" /> {timeLeft}
    </span>
  );
};

export const TasksTab = ({
  tx,
  isSuperAdmin,
  persons,
  addTaskMutation,
  submitTaskMutation,
  deleteRemoteTaskMutation, // 👈 تمرير دالة الحذف من الملف الرئيسي
  backendUrl,
}) => {
  const { user } = useAuth(); // لمعرفة من هو المستخدم الحالي

  const [taskForm, setTaskForm] = useState({
    taskId: null, // 👈 يستخدم عند التعديل
    assigneeId: "",
    description: "",
    deadline: "",
    isUrgent: false,
  });
  
  const [isAdding, setIsAdding] = useState(false);
  const [submitFile, setSubmitFile] = useState(null);
  const [submitComment, setSubmitComment] = useState("");
  const [submittingTaskId, setSubmittingTaskId] = useState(null);

  const employees = persons.filter((p) => p.role !== "عميل");

  // جلب المهام من الجدول
  const txTasks = tx.remoteTasks || tx.tasks || [];

  // دالة لفتح الفورم في وضع "التعديل"
  const handleEditTask = (t) => {
    setTaskForm({
      taskId: t.id,
      assigneeId: t.workerId || "",
      description: t.description || t.taskName || "",
      deadline: t.deadline ? new Date(t.deadline).toISOString().slice(0, 16) : "",
      isUrgent: t.isUrgent || false,
    });
    setIsAdding(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-indigo-600" /> مهام المعاملة
        </h3>
        
        {/* 💡 زر إضافة مهمة يظهر للمشرف فقط */}
        {isSuperAdmin && (
          <button
            onClick={() => {
              if (isAdding) {
                setTaskForm({ taskId: null, assigneeId: "", description: "", deadline: "", isUrgent: false });
              }
              setIsAdding(!isAdding);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? "إلغاء الأمر" : "إسناد مهمة جديدة"}
          </button>
        )}
      </div>

      {/* 💡 فورم إضافة/تعديل مهمة (يظهر للمشرف فقط) */}
      {isAdding && isSuperAdmin && (
        <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 space-y-4 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-indigo-800 mb-1 block">
                اختر الموظف المستهدف
              </label>
              <select
                value={taskForm.assigneeId}
                onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                className="w-full border p-2.5 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 bg-white"
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
              <label className="text-xs font-bold text-indigo-800 mb-1 block">
                تاريخ ووقت التسليم (الموعد النهائي)
              </label>
              <input
                type="datetime-local"
                value={taskForm.deadline}
                onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                className="w-full border p-2.5 rounded-lg text-sm font-mono outline-none focus:border-indigo-500 bg-white"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-indigo-800 mb-1 block">
                وصف المهمة بدقة (Free text)
              </label>
              <textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="w-full border p-3 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white min-h-[80px]"
                placeholder="اكتب التوجيهات والمطلوب من الموظف إنجازه..."
              />
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors">
              <input
                type="checkbox"
                checked={taskForm.isUrgent}
                onChange={(e) => setTaskForm({ ...taskForm, isUrgent: e.target.checked })}
                className="accent-red-600 w-4 h-4 cursor-pointer"
              />
              تحديد كمهمة عاجلة 🔥
            </label>
            <button
              onClick={() => {
                if (!taskForm.assigneeId || !taskForm.description || !taskForm.deadline)
                  return toast.error("يرجى إكمال جميع بيانات المهمة");
                
                // في حالة التعديل، يمكنك مناداة editMutation إذا أنشأتها مستقبلاً،
                // أو نرسل taskId للباك إند ليعرف أنها تعديل.
                addTaskMutation.mutate(taskForm);
              }}
              disabled={addTaskMutation.isPending}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {addTaskMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {taskForm.taskId ? "حفظ التعديلات" : "حفظ وإرسال المهمة"}
            </button>
          </div>
        </div>
      )}

      {/* 💡 قائمة المهام */}
      <div className="grid grid-cols-1 gap-4">
        {txTasks.length > 0 ? (
          txTasks.map((t, idx) => {
            const workerName = persons.find((p) => p.id === t.workerId)?.name || t.workerName || "مجهول";

            // هل هذه المهمة تخص المستخدم الحالي؟
            const isMyTask = workerName === user?.name;
            
            // اعرض المهمة للمشرف (يرى الجميع) أو للموظف (يرى مهامه فقط)
            const showTask = isSuperAdmin || isMyTask;
            if (!showTask) return null;

            return (
              <div
                key={t.id || idx}
                className={`p-5 rounded-2xl border shadow-sm transition-all ${
                  t.isCompleted
                    ? "bg-gray-50 border-gray-200"
                    : t.isUrgent
                      ? "bg-red-50/40 border-red-200"
                      : "bg-white border-indigo-100 hover:border-indigo-300"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${t.isCompleted ? "bg-gray-200 text-gray-500" : "bg-indigo-100 text-indigo-600"}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        المُنفذ: {workerName}
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 mt-1">
                        أُسندت بواسطة: {t.assignedBy || t.createdBy || "الإدارة"} | {new Date(t.createdAt).toLocaleDateString("ar-SA")}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* 💡 أزرار التعديل والحذف للمشرف */}
                    {isSuperAdmin && !t.isCompleted && (
                      <div className="flex items-center gap-1 mr-4 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        <button
                          onClick={() => handleEditTask(t)}
                          className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-md transition-colors"
                          title="تعديل المهمة"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("هل أنت متأكد من حذف هذه المهمة نهائياً؟")) {
                              if (deleteRemoteTaskMutation) deleteRemoteTaskMutation.mutate(t.id);
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors"
                          title="حذف المهمة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {!t.isCompleted ? (
                      <CountdownTimer targetDate={t.deadline} />
                    ) : (
                      <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> تم التسليم
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-sm font-bold text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed bg-white/50 p-3 rounded-lg border border-gray-100">
                  {t.description}
                </div>

                {/* 💡 خيار التسليم (يظهر للموظف صاحب المهمة وللمشرف لغرض التجربة) */}
                {!t.isCompleted && (isMyTask || isSuperAdmin) && (
                  <div className="mt-5 pt-5 border-t border-dashed border-gray-200">
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                      <h4 className="text-xs font-black text-indigo-800 mb-3 flex items-center gap-2">
                        <Check className="w-4 h-4" /> تسليم المخرجات للإدارة
                      </h4>
                      <div className="flex flex-col gap-3">
                        <input
                          type="text"
                          value={submitComment}
                          onChange={(e) => setSubmitComment(e.target.value)}
                          placeholder="اكتب تعليقاً يوضح ما تم إنجازه (إلزامي)..."
                          className="w-full border border-indigo-200 p-2.5 text-sm rounded-lg outline-none focus:border-indigo-500 bg-white"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="file"
                            onChange={(e) => setSubmitFile(e.target.files[0])}
                            className="text-xs file:cursor-pointer file:mr-2 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                          />
                          <button
                            onClick={() => {
                              if (!submitComment) return toast.error("يرجى كتابة تعليق يوضح المخرجات أولاً");
                              setSubmittingTaskId(t.id);
                              submitTaskMutation.mutate({
                                taskId: t.id,
                                comment: submitComment,
                                file: submitFile,
                              });
                            }}
                            disabled={submitTaskMutation.isPending && submittingTaskId === t.id}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            {submitTaskMutation.isPending && submittingTaskId === t.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "تأكيد التسليم"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 💡 عرض المرفق والتعليق بعد التسليم (يظهر للجميع) */}
                {t.isCompleted && (t.submitComment || t.submitFileUrl) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 bg-green-50/50 p-4 rounded-xl border border-green-100">
                    <div className="text-xs font-black text-green-800 mb-2">
                      إفادة الموظف عند التسليم:
                    </div>
                    <div className="text-sm font-bold text-gray-700 mb-3 bg-white p-2.5 rounded-lg border border-green-100">
                      {t.submitComment || "لا يوجد تعليق نصي"}
                    </div>
                    {t.submitFileUrl && (
                      <a
                        href={`${backendUrl}${t.submitFileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm"
                      >
                        <FileText className="w-4 h-4" /> عرض المرفق المُسلّم
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-gray-200">
            <CalendarDays className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            لا توجد مهام مسندة حالياً
          </div>
        )}
      </div>
    </div>
  );
};