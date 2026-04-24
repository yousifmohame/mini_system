import React from "react";
import { FileCheck, Upload, FileText, Eye, Download, Trash2, FileStack } from "lucide-react";

const DocsTab = ({ 
  client, 
  setIsUploadModalOpen, 
  handleViewDocument, 
  handleDownloadDocument, 
  handleDeleteDocument, 
  deleteDocMutation, 
  formatDate 
}) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">مستودع الوثائق</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">الهويات، السجلات، والملفات المرفقة للعميل</p>
          </div>
        </div>
        <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 shadow-md shadow-violet-500/20 transition-all active:scale-95">
          <Upload className="w-4 h-4" /> رفع وثيقة جديدة
        </button>
      </div>

      {client.attachments?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {client.attachments.map((doc, idx) => (
            <div key={doc.id || idx} className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-violet-300 transition-all group flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3.5 bg-violet-50/80 rounded-xl text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-bold text-sm text-slate-800 truncate mb-1" title={doc.fileName || doc.name}>
                    {doc.fileName || doc.name || "مستند بدون اسم"}
                  </div>
                  <div className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 w-max px-2 py-0.5 rounded">
                    {formatDate(doc.createdAt)}
                  </div>
                </div>
              </div>

              {doc.notes && (
                <div className="text-[11px] text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex-1">
                  {doc.notes}
                </div>
              )}

              <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                <button onClick={() => handleViewDocument(doc)} className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl text-xs font-bold transition-colors">
                  <Eye className="w-3.5 h-3.5" /> عرض
                </button>
                <button onClick={() => handleDownloadDocument(doc.filePath, doc.fileName || "document")} className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl text-xs font-bold transition-colors">
                  <Download className="w-3.5 h-3.5" /> تحميل
                </button>
                <button onClick={() => handleDeleteDocument(doc.id)} disabled={deleteDocMutation.isPending} className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" /> حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl">
          <FileStack className="w-16 h-16 text-slate-300 mb-4" />
          <h4 className="text-lg font-bold text-slate-700 mb-1">لا توجد وثائق مرفوعة</h4>
          <p className="text-sm text-slate-400 mb-6 max-w-sm text-center">قم برفع الهوية، السجل التجاري، أو أي مستندات هامة لتكوين أرشيف متكامل للعميل.</p>
          <button onClick={() => setIsUploadModalOpen(true)} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-colors">
            بدء الرفع
          </button>
        </div>
      )}
    </div>
  );
};

export default DocsTab;