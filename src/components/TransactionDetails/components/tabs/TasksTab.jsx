import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Edit3,
  MessageSquare,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../../api/axios";
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
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`متبقي: ${days}ي ${hours}س ${minutes}د`);
      setIsUrgent(days < 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <span
      className={`font-mono font-bold text-xs px-2 py-1 rounded flex items-center gap-1 ${isUrgent ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}
    >
      <Clock className="w-3 h-3" /> {timeLeft}
    </span>
  );
};

// 💡 دالة آمنة لاستخراج الموظفين
const getSafeEmployees = (empData) => {
  if (!empData) return [];
  if (Array.isArray(empData)) return empData;
  if (typeof empData === "string") {
    try {
      const parsed = JSON.parse(empData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

export const TasksTab = ({
  tx,
  isSuperAdmin,
  persons,
  addTaskMutation,
  submitTaskMutation,
  deleteRemoteTaskMutation,
  backendUrl,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);

  // 🚀 جلب المهام المرتبطة بهذه المعاملة تحديداً
  const { data: rawTasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ["transaction-office-tasks", tx.id],
    queryFn: async () => {
      const res = await api.get("/office-tasks");
      const allTasks = res.data?.data || [];
      return allTasks.filter((t) => t.transactionId === tx.id);
    },
    enabled: !!tx.id,
  });

  // 🚀 🚀 🚀 التعديل الجوهري: فلترة المهام لتتوافق مع الصلاحيات ولإخفاء المحذوف
  const visibleTasks = useMemo(() => {
    return rawTasks.filter((t) => {
      // 1. استبعاد المهام المحذوفة (إذا كان نظامك يستخدم Soft Delete)
      if (t.isDeleted || t.status === "deleted") return false;

      // 2. التحقق من صلاحيات العرض
      const safeEmps = getSafeEmployees(t.assignedEmployees);
      const isMyTask = safeEmps.some((e) => (e.name || e) === user?.name);

      // إظهار المهمة إذا كان المستخدم مشرفاً أو إذا كانت المهمة مسندة إليه
      return isSuperAdmin || isMyTask;
    });
  }, [rawTasks, isSuperAdmin, user?.name]);

  const [taskForm, setTaskForm] = useState({
    title: `مهمة جديدة - ${tx.transactionCode || "معاملة"}`,
    description: "",
    dueDate: "",
    priority: "medium",
    assignedEmployees: [],
  });

  // حفظ المهمة
  const saveTaskMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("title", taskForm.title);
      fd.append("description", taskForm.description);
      fd.append("dueDate", taskForm.dueDate);
      fd.append("priority", taskForm.priority);
      fd.append("transactionId", tx.id);
      fd.append(
        "assignedEmployees",
        JSON.stringify(taskForm.assignedEmployees),
      );
      fd.append("creatorName", user?.name || "مدير النظام");

      return api.post("/office-tasks", fd);
    },
    onSuccess: () => {
      toast.success("تم إسناد المهمة بنجاح");
      queryClient.invalidateQueries(["transaction-office-tasks", tx.id]);
      queryClient.invalidateQueries(["office-tasks"]);
      setIsAdding(false);
      setTaskForm({
        title: `مهمة جديدة - ${tx.transactionCode || "معاملة"}`,
        description: "",
        dueDate: "",
        priority: "medium",
        assignedEmployees: [],
      });
    },
    onError: () => toast.error("حدث خطأ أثناء حفظ المهمة"),
  });

  // حذف مهمة
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId) => api.delete(`/office-tasks/${taskId}`),
    onSuccess: () => {
      toast.success("تم حذف المهمة");
      queryClient.invalidateQueries(["transaction-office-tasks", tx.id]);
      queryClient.invalidateQueries(["office-tasks"]);
    },
  });

  // تغيير حالة المهمة (إتمام)
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId) =>
      api.put(`/office-tasks/${taskId}/status`, { status: "completed" }),
    onSuccess: () => {
      toast.success("تم إتمام المهمة");
      queryClient.invalidateQueries(["transaction-office-tasks", tx.id]);
    },
  });

  const employees = persons.filter((p) => p.role !== "عميل");

  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          {/* 👈 استخدام العدد المفلتر بدلاً من الكلي */}
          <CalendarDays className="w-5 h-5 text-indigo-600" /> مهام المعاملة (
          {visibleTasks.length})
        </h3>

        {isSuperAdmin && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors"
          >
            {isAdding ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isAdding ? "إلغاء الأمر" : "إسناد مهمة جديدة"}
          </button>
        )}
      </div>

      {/* 💡 فورم إضافة مهمة جديدة */}
      {isAdding && isSuperAdmin && (
        <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 space-y-4 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-indigo-800 mb-1 block">
                عنوان المهمة
              </label>
              <input
                type="text"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
                className="w-full border p-2.5 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-indigo-800 mb-1 block">
                اختر الموظف المستهدف
              </label>
              <select
                value={
                  taskForm.assignedEmployees.length > 0
                    ? taskForm.assignedEmployees[0].name
                    : ""
                }
                onChange={(e) => {
                  const empName = e.target.value;
                  const emp = employees.find((p) => p.name === empName);
                  setTaskForm({
                    ...taskForm,
                    assignedEmployees: emp
                      ? [{ id: emp.id || "auto", name: emp.name }]
                      : [],
                  });
                }}
                className="w-full border p-2.5 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 bg-white"
              >
                <option value="">-- اختر موظف --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-indigo-800 mb-1 block">
                تاريخ التسليم النهائي
              </label>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, dueDate: e.target.value })
                }
                className="w-full border p-2.5 rounded-lg text-sm font-mono outline-none focus:border-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-indigo-800 mb-1 block">
                الأولوية
              </label>
              <select
                value={taskForm.priority}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, priority: e.target.value })
                }
                className="w-full border p-2.5 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 bg-white"
              >
                <option value="low">عادية</option>
                <option value="medium">متوسطة</option>
                <option value="high">عاجلة جداً 🔥</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-indigo-800 mb-1 block">
                وصف المهمة بدقة
              </label>
              <textarea
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, description: e.target.value })
                }
                className="w-full border p-3 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 bg-white min-h-[80px]"
                placeholder="اكتب التوجيهات والمطلوب من الموظف إنجازه..."
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                if (
                  !taskForm.title ||
                  taskForm.assignedEmployees.length === 0 ||
                  !taskForm.description
                ) {
                  return toast.error(
                    "يرجى إكمال عنوان ووصف المهمة واختيار الموظف",
                  );
                }
                saveTaskMutation.mutate();
              }}
              disabled={saveTaskMutation.isPending}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-md"
            >
              {saveTaskMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              حفظ وإرسال المهمة
            </button>
          </div>
        </div>
      )}

      {/* 💡 قائمة المهام المرتبطة بالمعاملة */}
      {isTasksLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visibleTasks.length > 0 ? (
            visibleTasks.map((t) => {
              const safeEmps = getSafeEmployees(t.assignedEmployees);
              const empNames = safeEmps.map((e) => e.name || e).join("، ");
              const isMyTask = safeEmps.some(
                (e) => (e.name || e) === user?.name,
              );

              const isCompleted = t.status === "completed";
              const isFrozen = t.status === "frozen";
              const isCancelled = t.status === "cancelled";

              return (
                <div
                  key={t.id}
                  className={`p-5 rounded-2xl border shadow-sm transition-all ${isCompleted ? "bg-slate-50 border-slate-200" : isFrozen || isCancelled ? "bg-slate-100 border-slate-200 opacity-60" : "bg-white border-indigo-100 hover:border-indigo-300"}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2.5 rounded-lg shrink-0 mt-1 ${isCompleted ? "bg-slate-200 text-slate-500" : t.priority === "high" ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"}`}
                      >
                        {t.priority === "high" ? (
                          <Flag className="w-5 h-5" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div
                          className={`font-black text-sm ${isCompleted ? "text-slate-500 line-through" : "text-slate-900"}`}
                        >
                          {t.title || "مهمة"}
                        </div>
                        <div className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit">
                          المُنفذ: {empNames || "غير محدد"}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400">
                          بواسطة: {t.creatorName || "النظام"} |{" "}
                          {new Date(t.createdAt).toLocaleDateString("ar-SA")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isSuperAdmin && (
                        <div className="flex items-center gap-1 mr-4 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                          <button
                            onClick={() => {
                              if (window.confirm("حذف المهمة نهائياً؟"))
                                deleteTaskMutation.mutate(t.id);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors"
                            title="حذف المهمة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {!isCompleted && !isFrozen && !isCancelled ? (
                        <div className="flex flex-col items-end gap-2">
                          <CountdownTimer targetDate={t.dueDate} />
                          {(isMyTask || isSuperAdmin) && (
                            <button
                              onClick={() => {
                                if (window.confirm("تأكيد إتمام المهمة؟"))
                                  completeTaskMutation.mutate(t.id);
                              }}
                              className="text-[10px] font-black bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <Check className="w-3 h-3" /> اعتماد الإنجاز
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-200">
                          {isCompleted
                            ? "مكتملة ✅"
                            : isFrozen
                              ? "مجمدة ❄️"
                              : "ملغاة ❌"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm font-bold text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    {t.description}
                  </div>

                  {/* عرض الملاحظات إن وجدت (Comments) */}
                  {t.comments && t.comments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <h5 className="text-[10px] font-black text-slate-500 mb-2 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> الملاحظات
                        والتعليقات
                      </h5>
                      <div className="space-y-2">
                        {t.comments.map((c) => (
                          <div
                            key={c.id}
                            className="bg-white p-2 rounded-lg border border-slate-100 text-[11px] font-bold text-slate-700"
                          >
                            <span className="text-blue-600">
                              {c.authorName}:
                            </span>{" "}
                            {c.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              لا توجد مهام مسندة لهذه المعاملة حالياً
            </div>
          )}
        </div>
      )}
    </div>
  );
};
