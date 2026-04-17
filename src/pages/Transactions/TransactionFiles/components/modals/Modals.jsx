import React, { useState } from "react";
import { Settings, X, Plus, Folder, Trash2, Edit2, Save, Loader2, FolderOpen, Clock, User, Link2 } from "lucide-react";
import { PREDEFINED_ICONS } from "../../utils";
import { toast } from "sonner";


export function LinkedTransactionsModal({ transaction, onClose }) {
  const linkedTxs = [{ id: "1", code: "PTX-2025-0099", type: "إصدار رخصة", date: "15 يناير 2025", status: "مكتملة" }];
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[400] p-4" onClick={onClose} dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 bg-indigo-50 border-b border-indigo-100 shrink-0">
          <div className="flex items-center gap-3 text-indigo-900"><div className="p-2 bg-indigo-100 rounded-lg"><Link2 size={20} /></div><div><h3 className="font-bold">المعاملات المرتبطة بالمالك</h3><p className="text-[10px] text-indigo-600 mt-0.5">{transaction.ownerFirstName} {transaction.ownerLastName}</p></div></div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-indigo-200 text-indigo-500"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh] bg-gray-50">
          <table className="w-full text-right text-xs bg-white border rounded-xl overflow-hidden shadow-sm">
            <thead className="bg-gray-50 border-b text-gray-500 font-bold">
              <tr><th className="p-3">رقم المعاملة</th><th className="p-3">النوع</th><th className="p-3">الحالة</th><th className="p-3 text-center">فتح</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
              {linkedTxs.map((tx) => (
                <tr key={tx.id} className="hover:bg-blue-50">
                  <td className="p-3 text-blue-600 font-mono font-bold">{tx.code}</td><td className="p-3">{tx.type}</td><td className="p-3"><span className="px-2 py-1 rounded text-[10px] bg-green-100 text-green-700">{tx.status}</span></td><td className="p-3 text-center"><button className="text-blue-600 underline text-[10px]">عرض</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}