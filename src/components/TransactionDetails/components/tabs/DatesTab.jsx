import React from "react";
import {
  Save,
  Loader2,
  TriangleAlert,
  CalendarDays,
  Timer,
  Archive,
  User,
  Info,
  History,
} from "lucide-react";

export const DatesTab = ({
  remaining,
  safeCollectionDates,
  safeNum,
  dateForm,
  setDateForm,
  addDateMutation,
  calculateDays,
  getDayNameAndDate,
  formatDateTime,
  deleteDateMutation,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <span className="text-gray-500 text-[11px] font-bold mb-1">
            المتبقي الكلي للتحصيل
          </span>
          <span className="font-mono text-xl font-black text-gray-800">
            {remaining.toLocaleString()}{" "}
            <span className="text-[10px]">ر.س</span>
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm flex flex-col justify-center">
          <span className="text-purple-600 text-[11px] font-bold mb-1">
            إجمالي المبالغ المجدولة (في الخطة)
          </span>
          <span className="font-mono text-xl font-black text-purple-700">
            {safeCollectionDates
              .reduce((acc, curr) => acc + safeNum(curr.amount), 0)
              .toLocaleString()}{" "}
            <span className="text-[10px]">ر.س</span>
          </span>
        </div>
        <div
          className={`p-4 rounded-xl border shadow-sm flex flex-col justify-center ${Math.max(0, remaining - safeCollectionDates.reduce((acc, curr) => acc + safeNum(curr.amount), 0)) > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}
        >
          <span
            className={`${Math.max(0, remaining - safeCollectionDates.reduce((acc, curr) => acc + safeNum(curr.amount), 0)) > 0 ? "text-red-700" : "text-green-700"} text-[11px] font-bold mb-1`}
          >
            مبالغ غير مجدولة (تحتاج لجدولة)
          </span>
          <span
            className={`font-mono text-xl font-black ${Math.max(0, remaining - safeCollectionDates.reduce((acc, curr) => acc + safeNum(curr.amount), 0)) > 0 ? "text-red-600" : "text-green-600"}`}
          >
            {Math.max(
              0,
              remaining -
                safeCollectionDates.reduce(
                  (acc, curr) => acc + safeNum(curr.amount),
                  0,
                ),
            ).toLocaleString()}{" "}
            <span className="text-[10px]">ر.س</span>
          </span>
        </div>
      </div>

      {/* نموذج إضافة موعد جديد */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-5 border-b border-gray-100 pb-3">
          <CalendarDays className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-black text-gray-800">
            إدراج موعد تحصيل جديد في الخطة
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-3">
              طريقة تحديد تاريخ الاستحقاق{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-300 shadow-sm">
              <button
                onClick={() =>
                  setDateForm({ ...dateForm, type: "specific_date" })
                }
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${dateForm.type === "specific_date" ? "bg-purple-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}
              >
                تاريخ تقويمي محدد
              </button>
              <button
                onClick={() =>
                  setDateForm({ ...dateForm, type: "upon_approval" })
                }
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${dateForm.type === "upon_approval" ? "bg-purple-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}
              >
                يُستحق فور الاعتماد
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-semibold flex items-start gap-1">
              <Info className="w-3 h-3 shrink-0 mt-0.5" />
              {dateForm.type === "specific_date"
                ? "سيتم تنبيهك عند اقتراب التاريخ المحدد أو تأخره."
                : "سيظل الموعد معلقاً، ويبدأ عداد التأخير تلقائياً بمجرد تحويل حالة المعاملة إلى (تم الاعتماد)."}
            </p>
          </div>
          <div className="p-4 flex flex-col justify-center">
            {dateForm.type === "specific_date" ? (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  التاريخ المتوقع للسداد <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dateForm.date}
                  onChange={(e) =>
                    setDateForm({ ...dateForm, date: e.target.value })
                  }
                  className="w-full border border-gray-300 p-3 rounded-xl text-sm font-bold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all bg-white shadow-sm"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                <Timer className="w-8 h-8 opacity-50" />
                <div>
                  <p className="text-xs font-bold mb-1">العداد متوقف حالياً</p>
                  <p className="text-[10px] font-semibold opacity-80">
                    سيتم ربط هذا الموعد برقم وتاريخ قرار الاعتماد فور صدوره من
                    الجهات المعنية.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-700 mb-2">
              المبلغ المستهدف <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={dateForm.amountType}
                onChange={(e) => {
                  const val = e.target.value;
                  setDateForm({
                    ...dateForm,
                    amountType: val,
                    amount:
                      val === "full"
                        ? Math.max(
                            0,
                            remaining -
                              safeCollectionDates.reduce(
                                (a, c) => a + safeNum(c.amount),
                                0,
                              ),
                          )
                        : "",
                  });
                }}
                className="border border-gray-300 rounded-xl p-3 text-xs font-bold bg-slate-50 w-24 outline-none focus:border-purple-500"
              >
                <option value="full">الباقي</option>
                <option value="partial">مخصص</option>
              </select>
              <div className="relative flex-1">
                <input
                  type="number"
                  disabled={dateForm.amountType === "full"}
                  value={
                    dateForm.amountType === "full"
                      ? Math.max(
                          0,
                          remaining -
                            safeCollectionDates.reduce(
                              (a, c) => a + safeNum(c.amount),
                              0,
                            ),
                        )
                      : dateForm.amount
                  }
                  onChange={(e) =>
                    setDateForm({ ...dateForm, amount: e.target.value })
                  }
                  className="w-full border border-gray-300 p-3 rounded-xl text-lg font-mono font-black outline-none focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all shadow-sm"
                  placeholder="0"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                  SAR
                </span>
              </div>
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-2">
              البيان / توجيهات المتابعة (اختياري)
            </label>
            <input
              type="text"
              value={dateForm.notes}
              onChange={(e) =>
                setDateForm({ ...dateForm, notes: e.target.value })
              }
              className="w-full border border-gray-300 p-3 rounded-xl text-sm font-semibold outline-none focus:border-purple-500 transition-all shadow-sm"
              placeholder="مثال: الدفعة الثانية بعد الرفع المساحي، التواصل مع وكيل المالك..."
            />
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              if (dateForm.type === "specific_date" && !dateForm.date)
                return toast.error("يرجى تحديد التاريخ");
              if (
                dateForm.amountType === "partial" &&
                (!dateForm.amount || dateForm.amount <= 0)
              )
                return toast.error("يرجى إدخال مبلغ صحيح");
              addDateMutation.mutate(dateForm);
            }}
            disabled={addDateMutation.isPending || remaining <= 0}
            className="px-8 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
          >
            {addDateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}{" "}
            اعتماد الموعد في الخطة
          </button>
        </div>
      </div>

      {/* 💡 3. عرض خطة التحصيل (مُحدثة للخطوط والأيام) */}
      <div className="mt-8">
        <h4 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-gray-500" /> السجل الزمني لخطة
          التحصيل
        </h4>
        <div className="space-y-3">
          {safeCollectionDates.length > 0 ? (
            safeCollectionDates.map((d, i) => {
              const days = calculateDays(d.date, d.type === "upon_approval");
              let statusConfig = {
                bg: "bg-white",
                border: "border-gray-200",
                badgeBg: "bg-gray-100",
                badgeText: "text-gray-600",
                icon: Clock,
                label: "بانتظار الإجراء",
              };
              if (d.type === "specific_date") {
                if (days < 0)
                  statusConfig = {
                    bg: "bg-red-50/50",
                    border: "border-red-200",
                    badgeBg: "bg-red-100",
                    badgeText: "text-red-700",
                    icon: TriangleAlert,
                    label: `متأخر ${Math.abs(days)} يوم`,
                  };
                else if (days === 0)
                  statusConfig = {
                    bg: "bg-orange-50/50",
                    border: "border-orange-300",
                    badgeBg: "bg-orange-100",
                    badgeText: "text-orange-700",
                    icon: Timer,
                    label: "يستحق اليوم!",
                  };
                else
                  statusConfig = {
                    bg: "bg-white",
                    border: "border-blue-200",
                    badgeBg: "bg-blue-50",
                    badgeText: "text-blue-700",
                    icon: CalendarDays,
                    label: `متبقي ${days} يوم`,
                  };
              } else if (d.type === "upon_approval") {
                if (days !== null)
                  statusConfig = {
                    bg: "bg-red-50/50",
                    border: "border-red-300",
                    badgeBg: "bg-red-100",
                    badgeText: "text-red-700",
                    icon: TriangleAlert,
                    label: `متأخر! مر ${days} يوم على الاعتماد`,
                  };
                else
                  statusConfig = {
                    bg: "bg-slate-50",
                    border: "border-slate-200 border-dashed",
                    badgeBg: "bg-slate-200",
                    badgeText: "text-slate-600",
                    icon: Archive,
                    label: "معلق بانتظار الاعتماد",
                  };
              }

              return (
                <div
                  key={i}
                  className={`p-0 rounded-2xl border flex flex-col md:flex-row overflow-hidden shadow-sm transition-all hover:shadow-md ${statusConfig.bg} ${statusConfig.border}`}
                >
                  <div
                    className={`w-1.5 hidden md:block ${statusConfig.badgeBg.replace("bg-", "bg-").replace("100", "500").replace("50", "400")}`}
                  ></div>
                  <div className="flex-1 p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 w-max ${statusConfig.badgeBg} ${statusConfig.badgeText}`}
                      >
                        <statusConfig.icon className="w-3 h-3" />{" "}
                        {statusConfig.label}
                      </span>
                      <span className="text-[12px] text-gray-500 font-mono font-bold bg-white px-2 py-1 rounded border border-gray-100 shadow-sm">
                        {d.type === "upon_approval"
                          ? "الاستحقاق: شرطي (عند الاعتماد)"
                          : getDayNameAndDate(d.date)}
                      </span>
                    </div>
                    <div className="font-bold text-gray-800 text-[14px]">
                      {d.notes || "متابعة تحصيل دفعة من العميل"}
                    </div>
                    <div className="text-[10px] text-gray-400 font-semibold mt-2 flex items-center gap-1">
                      <User className="w-3 h-3" /> أُضيف بواسطة:{" "}
                      <span className="text-gray-600">
                        {d.addedBy || "النظام"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 border-t md:border-t-0 md:border-r border-gray-200/60 bg-white/50 flex flex-col items-end justify-center min-w-[180px]">
                    <span className="text-[11px] text-gray-500 font-bold mb-1">
                      المبلغ المطلوب
                    </span>
                    <div className="font-mono font-black text-3xl text-purple-700 tracking-tight">
                      {safeNum(d.amount).toLocaleString()}{" "}
                      <span className="text-[12px] font-normal text-purple-500">
                        ر.س
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("حذف الموعد نهائياً؟")) {
                          deleteDateMutation.mutate(d.id);
                        }
                      }}
                      disabled={deleteDateMutation.isPending}
                      className="mt-3 text-[11px] text-red-500 font-bold hover:bg-red-50 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                    >
                      حذف الموعد
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center">
              <CalendarDays className="w-12 h-12 text-gray-300 mb-3" />
              <span className="text-gray-500 font-bold text-sm">
                لا توجد خطط أو مواعيد تحصيل مسجلة.
              </span>
              <span className="text-gray-400 text-xs mt-1">
                قم بإضافة المواعيد بالأعلى لتفعيل العدادات الآلية.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
