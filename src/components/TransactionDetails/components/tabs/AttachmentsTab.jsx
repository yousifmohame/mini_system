import React from "react";
import {
  FileText,
  Loader2,
  User,
  Upload,
  Trash2,
  ImageIcon,
  FileBox,
  Paperclip,
} from "lucide-react";

export const AttachmentsTab = ({
  uploadData,
  setUploadData,
  uploadAttachmentMutation,
  safeAttachments,
  handlePreviewAttachmentSafe,
  deleteAttachmentMutation,
  backendUrl,
  formatDateTime,
}) => {
  return (
    <div className="p-5 space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <span className="text-[16px] font-black text-gray-800 flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-blue-600" /> إدارة مرفقات ووثائق
          المعاملة
        </span>
      </div>
      <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1 w-full space-y-3">
          <label className="block text-xs font-bold text-blue-800">
            وصف المرفق (إلزامي لسهولة البحث)
          </label>
          <input
            type="text"
            value={uploadData.description}
            onChange={(e) =>
              setUploadData({
                ...uploadData,
                description: e.target.value,
              })
            }
            className="w-full border border-blue-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-600"
            placeholder="مثال: صورة الصك الجديد، عقد المكتب..."
          />
        </div>
        <div className="w-full md:w-auto flex-1 relative">
          {/* 💡 Drag and Drop Zone */}
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0])
                setUploadData({
                  ...uploadData,
                  file: e.dataTransfer.files[0],
                });
            }}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-white border-2 border-dashed border-blue-400 text-blue-600 rounded-xl cursor-pointer hover:bg-blue-50 transition-all font-bold text-sm h-[42px] w-full"
          >
            <Upload className="w-4 h-4" />{" "}
            <span>
              {uploadData.file
                ? uploadData.file.name
                : "اختر ملف أو اسحبه هنا..."}
            </span>
            <input
              type="file"
              className="hidden"
              onChange={(e) =>
                setUploadData({
                  ...uploadData,
                  file: e.target.files[0],
                })
              }
            />
          </label>
        </div>
        <button
          onClick={() => uploadAttachmentMutation.mutate()}
          disabled={
            !uploadData.file ||
            !uploadData.description ||
            uploadAttachmentMutation.isPending
          }
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm h-[42px] shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploadAttachmentMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "حفظ ورفع"
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-6">
        {safeAttachments.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
            <FileBox className="w-12 h-12 text-gray-300 mx-auto mb-3" /> لا توجد
            مرفقات مسجلة. قم برفع المستندات أعلاه.
          </div>
        ) : (
          safeAttachments.map((file, idx) => {
            let safeName = file.name || file.description || `مرفق ${idx + 1}`;
            try {
              safeName = decodeURIComponent(safeName);
            } catch (e) {}
            const safeUrl = file.url?.startsWith("http")
              ? file.url
              : `${backendUrl}${file.url}`;

            return (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col items-center text-center group hover:border-blue-400 hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="w-full bg-gray-50 p-2 text-[9px] text-gray-400 font-mono absolute top-0 left-0 right-0 border-b border-gray-100 flex justify-between">
                  <span>{formatDateTime(file.createdAt || file.date)}</span>
                </div>
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mt-6 mb-3 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {safeUrl.toLowerCase().endsWith(".pdf") ? (
                    <FileText className="w-6 h-6" />
                  ) : (
                    <ImageIcon className="w-6 h-6" />
                  )}
                </div>
                <span
                  className="text-[13px] font-bold text-gray-800 truncate w-full mb-1"
                  title={safeName}
                >
                  {safeName}
                </span>
                <span className="text-[10px] text-gray-500 font-bold mb-4 bg-gray-100 px-2 py-0.5 rounded-full">
                  <User className="w-3 h-3 inline mr-1" />{" "}
                  {file.uploadedBy || "النظام"}
                </span>
                <div className="flex items-center gap-2 w-full mt-auto">
                  <button
                    onClick={() =>
                      handlePreviewAttachmentSafe(safeUrl, safeName)
                    }
                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    معاينة
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("حذف المرفق نهائياً؟"))
                        deleteAttachmentMutation.mutate(file.url);
                    }}
                    className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
