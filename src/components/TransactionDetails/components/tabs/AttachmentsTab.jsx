import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../api/axios";
import { toast } from "sonner";
import {
  FolderOpen,
  FileText,
  UploadCloud,
  FolderPlus,
  Trash2,
  Check,
  Loader2,
  FileBox,
  Image as ImageIcon,
  Clock,
  ChevronLeft,
  ArrowRight,
  ExternalLink,
  Download,
  Printer,
  Paperclip,
  X,
} from "lucide-react";

// 💡 دالة معالجة الروابط لتعمل مع الباك إند
export const getFullUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  let fixedUrl = url;
  if (url.startsWith("/uploads/")) fixedUrl = `/api${url}`;
  const baseUrl = "https://details-worksystem1.com";
  return `${baseUrl}${fixedUrl}`;
};

export const AttachmentsTab = ({
  tx,
  currentUser,
  backendUrl, // لم يعد ضرورياً ولكن يمكن إبقاؤه لعدم كسر الـ Props
}) => {
  const queryClient = useQueryClient();
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolderName, setCurrentFolderName] = useState("");

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // 🚀 State جديد للتحكم في نافذة المعاينة
  const [previewFileUrl, setPreviewFileUrl] = useState(null);
  const [previewFileName, setPreviewFileName] = useState("");

  // 1. 🚀 جلب المجلدات والملفات
  const { data: folderData = { folders: [], files: [] }, isLoading } = useQuery(
    {
      queryKey: ["transaction-folders", tx.id, currentFolderId],
      queryFn: async () => {
        const params = new URLSearchParams({ transactionId: tx.id });
        if (currentFolderId) {
          params.append("folderId", currentFolderId);
        }
        const res = await api.get(`/files/contents?${params.toString()}`);
        return res.data || { folders: [], files: [] };
      },
      enabled: !!tx.id,
    },
  );

  // 2. 🚀 إنشاء مجلد جديد
  const createFolderMutation = useMutation({
    mutationFn: async (folderName) => {
      return api.post("/files/folder", {
        name: folderName,
        transactionId: tx.id,
        parentId: currentFolderId || null,
        createdBy: currentUser,
      });
    },
    onSuccess: () => {
      toast.success("تم إنشاء المجلد بنجاح");
      setNewFolderName("");
      setIsCreatingFolder(false);
      queryClient.invalidateQueries([
        "transaction-folders",
        tx.id,
        currentFolderId,
      ]);
    },
    onError: (err) => toast.error("حدث خطأ أثناء إنشاء المجلد"),
  });

  // 3. 🚀 رفع ملف جديد
  const uploadFileMutation = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append("files", file);
      fd.append("transactionId", tx.id);
      if (currentFolderId) fd.append("folderId", currentFolderId);
      fd.append("uploadedBy", currentUser);

      return api.post("/files/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("تم رفع الملف بنجاح");
      queryClient.invalidateQueries([
        "transaction-folders",
        tx.id,
        currentFolderId,
      ]);
    },
    onError: (err) => toast.error("حدث خطأ أثناء رفع الملف"),
  });

  // 4. 🚀 حذف مجلد أو ملف
  const deleteItemMutation = useMutation({
    mutationFn: async ({ id, type }) => {
      const payload = { deletedBy: currentUser, transactionId: tx.id };
      if (type === "folder") payload.folderIds = [id];
      if (type === "file") payload.fileIds = [id];

      return api.post("/files/delete", payload);
    },
    onSuccess: () => {
      toast.success("تم النقل لسلة المحذوفات");
      queryClient.invalidateQueries([
        "transaction-folders",
        tx.id,
        currentFolderId,
      ]);
    },
  });

  const getFileIcon = (filename) => {
    if (!filename) return <FileBox className="w-8 h-8 text-slate-500" />;
    const ext = filename.split(".").pop().toLowerCase();
    if (["pdf"].includes(ext))
      return <FileText className="w-8 h-8 text-red-500" />;
    if (["jpg", "jpeg", "png", "webp"].includes(ext))
      return <ImageIcon className="w-8 h-8 text-blue-500" />;
    return <FileBox className="w-8 h-8 text-slate-500" />;
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // دعم السحب والإفلات للرفع
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFileMutation.mutate(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className="flex flex-col h-full min-h-[500px] animate-in fade-in"
      dir="rtl"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* ── شريط الأدوات والتنقل (Toolbar) ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-t-xl border border-slate-200 shadow-sm shrink-0">
        {/* Navigation / Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm font-black text-slate-700">
          <button
            onClick={() => {
              setCurrentFolderId(null);
              setCurrentFolderName("");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${!currentFolderId ? "bg-blue-50 text-blue-700" : "hover:bg-slate-100 text-slate-500"}`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>الملفات الأساسية</span>
          </button>

          {currentFolderId && (
            <>
              <ChevronLeft className="w-4 h-4 text-slate-300" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg shadow-sm border border-blue-100">
                <span className="truncate max-w-[150px]">
                  {currentFolderName}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Actions (Upload & Create Folder) */}
        <div className="flex items-center gap-2">
          {/* Create Folder Input Toggle */}
          {isCreatingFolder ? (
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 animate-in slide-in-from-left-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="اسم المجلد..."
                className="w-32 px-2 py-1 text-xs font-bold bg-white border border-slate-200 rounded outline-none focus:border-blue-400"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newFolderName.trim())
                    createFolderMutation.mutate(newFolderName);
                }}
              />
              <button
                onClick={() =>
                  newFolderName.trim() &&
                  createFolderMutation.mutate(newFolderName)
                }
                disabled={
                  createFolderMutation.isPending || !newFolderName.trim()
                }
                className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded transition-colors disabled:opacity-50"
              >
                {createFolderMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName("");
                }}
                className="p-1.5 text-slate-400 hover:bg-slate-200 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors shadow-sm border border-slate-200"
            >
              <FolderPlus className="w-4 h-4 text-slate-500" /> مجلد جديد
            </button>
          )}

          {/* Upload Button */}
          <label className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md cursor-pointer disabled:opacity-50">
            {uploadFileMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            {uploadFileMutation.isPending ? "جاري الرفع..." : "رفع ملف هنا"}
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files[0])
                  uploadFileMutation.mutate(e.target.files[0]);
              }}
              disabled={uploadFileMutation.isPending}
            />
          </label>
        </div>
      </div>

      {/* ── منطقة عرض المجلدات والملفات (Grid) ── */}
      <div className="flex-1 bg-slate-50 border-x border-b border-slate-200 rounded-b-xl p-4 overflow-y-auto custom-scrollbar-slim relative">
        {currentFolderId && (
          <button
            onClick={() => {
              setCurrentFolderId(null);
              setCurrentFolderName("");
            }}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold mb-4 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm w-fit transition-colors"
          >
            <ArrowRight className="w-4 h-4" /> العودة للملفات الأساسية
          </button>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
            <p className="text-xs font-bold">جاري جلب الملفات والمجلدات...</p>
          </div>
        ) : folderData.folders.length === 0 && folderData.files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300 mx-auto max-w-lg mt-4 shadow-sm p-6 text-center">
            <UploadCloud className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-black text-slate-600 mb-1">
              المجلد فارغ تماماً
            </p>
            <p className="text-xs font-bold leading-relaxed">
              يمكنك النقر على زر{" "}
              <span className="text-blue-500">"رفع ملف هنا"</span> في الأعلى{" "}
              <br />
              أو سحب وإفلات الملفات مباشرة داخل هذه الشاشة لرفعها.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* 1. عرض المجلدات */}
            {folderData.folders.map((folder) => (
              <div
                key={folder.id}
                onDoubleClick={() => {
                  setCurrentFolderId(folder.id);
                  setCurrentFolderName(folder.name);
                }}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center relative"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        `هل أنت متأكد من حذف مجلد "${folder.name}" وما يحتويه؟`,
                      )
                    )
                      deleteItemMutation.mutate({
                        id: folder.id,
                        type: "folder",
                      });
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <FolderOpen
                  className="w-14 h-14 text-amber-400 mb-3 group-hover:scale-110 transition-transform duration-300 fill-amber-100"
                  strokeWidth={1.5}
                />
                <h4
                  className="text-xs font-black text-slate-800 w-full truncate px-2 mb-1"
                  title={folder.name}
                >
                  {folder.name}
                </h4>
              </div>
            ))}

            {/* 2. عرض الملفات */}
            {folderData.files.map((file) => {
              const displayName =
                file.originalName || file.name || "ملف غير معروف";
              const fileUrl = file.path || file.url;
              const fullUrl = getFullUrl(fileUrl); // 🚀 استخدام الدالة المخصصة

              return (
                <div
                  key={file.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all group flex flex-col relative"
                >
                  <div className="absolute top-2 right-2 left-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={() => {
                        setPreviewFileUrl(fullUrl);
                        setPreviewFileName(displayName);
                      }} // 🚀 فتح المعاينة الداخلية
                      className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                      title="عرض الملف"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("حذف هذا الملف؟"))
                          deleteItemMutation.mutate({
                            id: file.id,
                            type: "file",
                          });
                      }}
                      className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-700 shadow-sm"
                      title="حذف الملف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center py-4 relative">
                    {fileUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-sm group-hover:scale-110 transition-transform bg-slate-100">
                        <img
                          src={fullUrl}
                          alt={displayName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="group-hover:scale-110 transition-transform duration-300 bg-slate-50 p-3 rounded-2xl">
                        {getFileIcon(displayName)}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto border-t border-slate-100 pt-2 text-center">
                    <h4
                      className="text-[11px] font-black text-slate-800 w-full truncate mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                      title={displayName}
                      onClick={() => {
                        setPreviewFileUrl(fullUrl);
                        setPreviewFileName(displayName);
                      }}
                    >
                      {displayName}
                    </h4>
                    <div className="flex justify-center items-center text-[9px] font-bold text-slate-400 gap-2">
                      <span dir="ltr">{formatSize(file.size)}</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />{" "}
                        {new Date(file.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 🚀 عارض المرفقات الداخلي (Modal) ── */}
      {previewFileUrl && (
        <div
          className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-10 animate-in fade-in"
          onClick={() => setPreviewFileUrl(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3 overflow-hidden pr-4">
                <Paperclip className="w-5 h-5 text-emerald-400 shrink-0" />
                <h3
                  className="font-bold text-sm truncate"
                  title={previewFileName}
                >
                  {previewFileName}
                </h3>
              </div>
              <div className="flex gap-2 items-center shrink-0">
                <a
                  href={previewFileUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold bg-slate-800 px-3 py-2 rounded-lg transition-colors border border-slate-700"
                >
                  <Download className="w-4 h-4" />{" "}
                  <span className="hidden sm:inline">تحميل</span>
                </a>
                <button
                  onClick={() => {
                    const printWindow = window.open(previewFileUrl);
                    printWindow.print();
                  }}
                  className="text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold bg-slate-800 px-3 py-2 rounded-lg transition-colors border border-slate-700"
                >
                  <Printer className="w-4 h-4" />{" "}
                  <span className="hidden sm:inline">طباعة</span>
                </button>
                <div className="w-px h-6 bg-slate-700 mx-1"></div>
                <button
                  onClick={() => setPreviewFileUrl(null)}
                  className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors shadow-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 p-2 overflow-hidden flex items-center justify-center relative">
              {previewFileUrl.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewFileUrl}
                  className="w-full h-full rounded-xl bg-white shadow-inner border-0"
                  title="PDF Preview"
                />
              ) : previewFileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
                  <img
                    src={previewFileUrl}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain rounded-xl shadow-lg border-4 border-white"
                  />
                </div>
              ) : (
                <div className="text-center text-slate-500">
                  <ExternalLink className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="font-bold mb-4">
                    هذا النوع من الملفات لا يمكن معاينته داخل التطبيق مباشرة
                  </p>
                  <a
                    href={previewFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> تحميل أو فتح في علامة تبويب
                    جديدة
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
