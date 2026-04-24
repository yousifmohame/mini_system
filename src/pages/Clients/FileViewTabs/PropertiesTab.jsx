import React from "react";
import { Landmark } from "lucide-react";

const PropertiesTab = ({ client }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <Landmark className="w-5 h-5 text-violet-500" /> ملكيات العميل (الصكوك)
      </h3>

      <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm mt-4">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b-2 border-slate-200 text-slate-600">
            <tr>
              <th className="p-3">كود الملكية</th>
              <th className="p-3">رقم الصك</th>
              <th className="p-3">المدينة/الحي</th>
              <th className="p-3">المساحة (م²)</th>
              <th className="p-3 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {client.ownershipFiles?.length > 0 ? (
              client.ownershipFiles.map((prop, idx) => (
                <tr key={prop.id || idx} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-purple-700">{prop.code || `PRO-${idx + 1}`}</td>
                  <td className="p-3 font-mono text-slate-600">{prop.deedNumber || "—"}</td>
                  <td className="p-3">{prop.city || "—"} {prop.district ? `/ ${prop.district}` : ""}</td>
                  <td className="p-3 font-mono font-bold">{prop.area || "—"}</td>
                  <td className="p-3 text-center">
                    <button className="text-purple-600 bg-purple-50 px-3 py-1 rounded text-xs font-bold hover:bg-purple-100">
                      عرض التفاصيل
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">لا توجد ملكيات أو صكوك مسجلة لهذا العميل.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PropertiesTab;