import React from "react";
import { FileText, Plus } from "lucide-react";

const TransactionsTab = ({ client, formatDate }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-500" /> معاملات العميل
        </h3>
        <button className="px-4 py-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> إنشاء معاملة جديدة
        </button>
      </div>

      <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b-2 border-slate-200 text-slate-600">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">كود المعاملة</th>
              <th className="p-3">النوع</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">الإجمالي (ر.س)</th>
              <th className="p-3">تاريخ الإنشاء</th>
              <th className="p-3 text-center">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {client.transactions?.length > 0 ? (
              client.transactions.map((tr, idx) => (
                <tr key={tr.id} className="hover:bg-slate-50">
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3 font-mono font-bold text-blue-800">{tr.code || tr.id.substring(0, 8)}</td>
                  <td className="p-3">{tr.serviceType || "—"}</td>
                  <td className="p-3">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{tr.status || "—"}</span>
                  </td>
                  <td className="p-3 font-mono font-bold">{(tr.totalAmount || 0).toLocaleString()}</td>
                  <td className="p-3">{formatDate(tr.createdAt)}</td>
                  <td className="p-3 text-center">
                    <button className="text-blue-600 bg-blue-50 px-3 py-1 rounded text-xs font-bold hover:bg-blue-100">
                      فتح
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500">لا توجد معاملات مسجلة لهذا العميل.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTab;