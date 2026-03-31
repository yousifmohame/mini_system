import React from "react";
import { User, Activity } from "lucide-react";

export const LogsTab = ({
  systemLogs,
  safeAuthorityHistory,
  formatDateTime,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in pb-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-4">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shadow-inner">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-800">
            سجل أحداث النظام
          </h3>
          <p className="text-xs font-bold text-slate-500">
            تتبع زمني دقيق لكل حركة تمت على هذه المعاملة منذ إنشائها.
          </p>
        </div>
      </div>

      <div className="relative border-r-2 border-slate-200 pr-6 ml-3 space-y-8">
        {systemLogs.length > 0 ? (
          systemLogs.map((log, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -right-[31px] top-1.5 w-4 h-4 bg-white border-4 border-slate-400 rounded-full shadow-sm"></div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                      {log.type || "حركة نظام"}
                    </span>
                    <span className="text-sm font-black text-slate-800">
                      {log.action || "تحديث بيانات"}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-gray-100">
                    {formatDateTime(log.date)}
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-semibold mb-3 leading-relaxed">
                  {log.details}
                </p>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {log.user || "مدير النظام"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : // 💡 Fallback if no logs exist yet (using authority history as dummy data just to show something)
        safeAuthorityHistory.length > 0 ? (
          safeAuthorityHistory.map((note, idx) => (
            <div key={`dummy-${idx}`} className="relative">
              <div className="absolute -right-[31px] top-1.5 w-4 h-4 bg-white border-4 border-blue-400 rounded-full shadow-sm"></div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 text-[10px] font-bold">
                      ملاحظة جهة
                    </span>
                    <span className="text-sm font-black text-slate-800">
                      إضافة توجيه من منصة
                    </span>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-gray-100">
                    {formatDateTime(note.date)}
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-semibold mb-3 leading-relaxed">
                  {note.text}
                </p>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {note.addedBy || "موظف النظام"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center text-slate-400 font-bold text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            لا توجد حركات مسجلة في السجل حتى الآن.
          </div>
        )}
      </div>
    </div>
  );
};
