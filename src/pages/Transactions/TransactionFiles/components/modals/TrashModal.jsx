import React, { useMemo } from "react";
import {
  FolderOpen,
  User,
  Clock,
  Trash2,
  X,
  AlertOctagon,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../../../../../api/axios"; // 💡 تأكد من المسار
import { getFileIcon, getFileColor, formatFileSize } from "../../utils"; // 💡 تأكد من المسار
import { useAuth } from "../../../../../context/AuthContext";

export default function TrashModal({ onClose }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUser =
    user?.name ||
    (user?.firstName ? `${user.firstName} ${user.lastName}` : "مدير النظام");

  // 1. جلب عناصر سلة المحذوفات من الباك إند
  const { data: trashData, isLoading } = useQuery({
    queryKey: ["trash-items"],
    queryFn: async () => {
      const res = await api.get("/files/trash");
      return res.data;
    },
  });

  // 2. دمج الملفات والمجلدات وترتيبها
  const deletedItems = useMemo(() => {
    if (!trashData) return [];
    const folders = (trashData.folders || []).map((f) => ({
      ...f,
      _type: "folder",
    }));
    const files = (trashData.files || []).map((f) => ({ ...f, _type: "file" }));

    // دمج وترتيب حسب تاريخ الحذف (الأحدث أولاً)
    return [...folders, ...files].sort(
      (a, b) => new Date(b.deletedAt) - new Date(a.deletedAt),
    );
  }, [trashData]);

  // 3. دالة الاستعادة (Restore)
  const restoreMutation = useMutation({
    mutationFn: async ({ id, type }) => {
      const payload = {
        folderIds: type === "folder" ? [id] : [],
        fileIds: type === "file" ? [id] : [],
        restoredBy: currentUser,
      };
      return await api.post("/files/restore", payload);
    },
    onSuccess: () => {
      toast.success("تم استعادة العنصر بنجاح");
      queryClient.invalidateQueries(["trash-items"]);
      // تحديث شاشة الملفات الرئيسية إن كانت مفتوحة
      queryClient.invalidateQueries(["folder-contents"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "فشل في الاستعادة"),
  });

  // 4. دالة الحذف النهائي (Permanent Delete)
  const permanentDeleteMutation = useMutation({
    mutationFn: async ({ id, type }) => {
      const payload = {
        folderIds: type === "folder" ? [id] : [],
        fileIds: type === "file" ? [id] : [],
        deletedBy: currentUser,
      };
      return await api.post("/files/permanent-delete", payload);
    },
    onSuccess: () => {
      toast.success("تم الحذف النهائي بنجاح");
      queryClient.invalidateQueries(["trash-items"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "فشل في الحذف النهائي"),
  });

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[500] backdrop-blur-sm p-4"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 bg-red-50/80 shrink-0">
          <div className="flex items-center gap-3 text-red-900">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold">سلة المحذوفات</h3>
              <p className="text-xs text-red-500 font-semibold mt-0.5">
                الملفات والمجلدات المحذوفة مؤقتاً
              </p>
            </div>
            <span className="mr-4 text-sm text-red-700 bg-white border border-red-200 px-3 py-1 rounded-full font-mono font-bold shadow-sm">
              {deletedItems.length} عناصر
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar-slim">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-blue-500 gap-3">
              <Loader2 size={40} className="animate-spin" />
              <p className="text-sm font-bold">جاري جلب المحذوفات...</p>
            </div>
          ) : deletedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-80 gap-3">
              <div className="p-6 bg-slate-100 rounded-full mb-2">
                <Trash2
                  size={64}
                  strokeWidth={1.5}
                  className="text-slate-300"
                />
              </div>
              <p className="text-xl font-bold text-slate-600">
                سلة المحذوفات فارغة
              </p>
              <p className="text-sm text-slate-400">
                لا توجد ملفات أو مجلدات محذوفة حالياً.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {deletedItems.map((item) => {
                const isFolder = item._type === "folder";
                const IconComponent = isFolder
                  ? FolderOpen
                  : getFileIcon(item.extension);
                const iconColor = isFolder
                  ? "#B45309"
                  : getFileColor(item.extension);
                const isDeleting =
                  permanentDeleteMutation.isPending &&
                  permanentDeleteMutation.variables?.id === item.id;
                const isRestoring =
                  restoreMutation.isPending &&
                  restoreMutation.variables?.id === item.id;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all group"
                  >
                    {/* Icon */}
                    <div
                      className={`p-3 rounded-lg shrink-0 ${isFolder ? "bg-amber-50" : "bg-slate-50 border border-slate-100"}`}
                    >
                      <IconComponent
                        size={28}
                        color={iconColor}
                        className={isFolder ? "fill-amber-200" : ""}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="font-bold text-slate-800 text-sm truncate"
                          dir="ltr"
                        >
                          {item.originalName || item.name}
                        </div>
                        {!isFolder && (
                          <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-mono">
                            {formatFileSize(item.size)}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-3">
                        <span className="flex items-center gap-1 bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                          <User size={12} /> {item.deletedBy}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                          <Clock size={12} />{" "}
                          {new Date(item.deletedAt).toLocaleString("ar-EG")}
                        </span>
                        {item.transaction && (
                          <span className="flex items-center gap-1 font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            المعاملة: {item.transaction.transactionCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() =>
                          restoreMutation.mutate({
                            id: item.id,
                            type: item._type,
                          })
                        }
                        disabled={isRestoring || isDeleting}
                        className="px-4 py-2 text-xs font-bold bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 hover:shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        {isRestoring ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RotateCcw size={14} />
                        )}
                        استعادة
                      </button>

                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "تحذير: سيتم حذف هذا العنصر نهائياً ولن تتمكن من استعادته. هل أنت متأكد؟",
                            )
                          ) {
                            permanentDeleteMutation.mutate({
                              id: item.id,
                              type: item._type,
                            });
                          }
                        }}
                        disabled={isRestoring || isDeleting}
                        className="px-4 py-2 text-xs font-bold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 hover:shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        حذف نهائي
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <AlertOctagon size={14} className="text-amber-500" />
            <span>العناصر المحذوفة نهائياً لا يمكن استعادتها أبداً.</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
