import React, { useState, useRef, useMemo } from "react";
import {
  Folder,
  FolderOpen,
  FolderPlus,
  Upload,
  Trash2,
  X,
  Check,
  Image as ImageIcon,
  List,
  Settings,
  CheckSquare,
  Download,
  Eye,
  Home,
  Copy,
  LayoutGrid,
  Loader2,
  ArrowRight,
  ChevronLeft,
  Edit2,
  ShieldCheck, // 💡 للحماية والبصمة
  History, // 💡 لسجل الإصدارات
  Activity, // 💡 لسجل الحركات
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../api/axios"; // 💡 تأكد من مسارك الخاص

import {
  getFileIcon,
  getFileColor,
  formatFileSize,
  getFullUrl,
  copyToClipboard,
} from "../utils";

import FileViewerModal from "./modals/FileViewerModal";
import CreateFolderModal from "./modals/CreateFolderModal";
import { useAuth } from "../../../../context/AuthContext";

export default function FolderViewerWindow({
  transaction,
  categories,
  onClose,
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  // 💡 Refs & States الخاصة بالميزات المؤسسية (Enterprise Features)
  const updateFileInputRef = useRef(null);
  const [fileToUpdate, setFileToUpdate] = useState(null);
  const [logsModal, setLogsModal] = useState({ show: false, file: null });
  const [versionsModal, setVersionsModal] = useState({
    show: false,
    file: null,
  });

  const { user } = useAuth();
  const currentUser =
    user?.name ||
    (user?.firstName ? `${user.firstName} ${user.lastName}` : "مدير النظام");

  const [pathStack, setPathStack] = useState([
    { id: null, name: "الرئيسية", type: "root" },
  ]);
  const currentFolderId = pathStack[pathStack.length - 1].id;

  const [selectedItems, setSelectedItems] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null); // 💡 السحر الخاص بـ Shift+Click

  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    item: null,
    type: null,
  });

  const [renameModal, setRenameModal] = useState({
    show: false,
    item: null,
    type: "",
    newName: "",
  });

  const [activeUploads, setActiveUploads] = useState({});
  const [showUploadManager, setShowUploadManager] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);

  // 1. جلب المحتويات
  const { data: contents = { folders: [], files: [] }, isLoading } = useQuery({
    queryKey: ["folder-contents", transaction.transactionId, currentFolderId],
    queryFn: async () => {
      const res = await api.get(
        `/files/contents?transactionId=${transaction.transactionId}&folderId=${currentFolderId || ""}`,
      );
      return res.data;
    },
  });

  // 💡 2. دمج الملفات والمجلدات في مصفوفة واحدة لدعم التحديد بالـ Shift بدقة
  const allDisplayedItems = useMemo(() => {
    const folders = (contents.folders || []).map((f) => ({
      ...f,
      _itemType: "folder",
    }));
    const files = (contents.files || []).map((f) => ({
      ...f,
      _itemType: "file",
    }));
    return [...folders, ...files];
  }, [contents]);

  // 💡 3. منطق التحديد الاحترافي (Windows Explorer Style)
  const handleItemClick = (itemId, index, e) => {
    if (e) e.stopPropagation();

    setSelectedItems((prev) => {
      const newSet = new Set(prev);

      if (e.shiftKey && lastSelectedIndex !== null) {
        // 🔹 Shift + Click: تحديد نطاق كامل
        newSet.clear(); // تفريغ التحديدات السابقة (كما في الويندوز)
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        for (let i = start; i <= end; i++) {
          newSet.add(allDisplayedItems[i].id);
        }
      } else if (e.ctrlKey || e.metaKey) {
        // 🔹 Ctrl + Click: إضافة أو إزالة فردية
        if (newSet.has(itemId)) newSet.delete(itemId);
        else newSet.add(itemId);
        setLastSelectedIndex(index);
      } else {
        // 🔹 Click عادي: تحديد عنصر واحد فقط
        newSet.clear();
        newSet.add(itemId);
        setLastSelectedIndex(index);
      }

      return newSet;
    });
  };

  // بقية دوال الرفع والحذف وإنشاء المجلدات (نفسها تماماً)
  const createFolderMutation = useMutation({
    mutationFn: async (foldersToCreateArray) => {
      for (const folderData of foldersToCreateArray) {
        const res = await api.post("/files/folder", {
          name: folderData.name,
          transactionId: transaction.transactionId,
          parentId: currentFolderId,
          createdBy: currentUser,
        });
        const newFolderId = res.data?.folder?.id;
        if (
          newFolderId &&
          folderData.subFolders &&
          folderData.subFolders.length > 0
        ) {
          for (const subName of folderData.subFolders) {
            await api.post("/files/folder", {
              name: subName,
              transactionId: transaction.transactionId,
              parentId: newFolderId,
              createdBy: currentUser,
            });
          }
        }
      }
      return true;
    },
    onSuccess: () => {
      toast.success("تم إنشاء المجلدات بنجاح");
      queryClient.invalidateQueries([
        "folder-contents",
        transaction.transactionId,
        currentFolderId,
      ]);
      setShowCreateFolderModal(false);
    },
  });

  const handleFilesSelection = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setShowUploadManager(true);
    const uploadId = Date.now().toString();
    const startTime = Date.now();

    setActiveUploads((prev) => ({
      ...prev,
      [uploadId]: {
        filesCount: files.length,
        progress: 0,
        speed: "0 KB/s",
        timeRemaining: "جاري الاتصال...",
        status: "uploading",
      },
    }));

    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    fd.append("transactionId", transaction.transactionId);
    if (currentFolderId) fd.append("folderId", currentFolderId);
    fd.append("uploadedBy", currentUser);

    try {
      await api.post("/files/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          const timeElapsed = (Date.now() - startTime) / 1000;
          let uploadSpeed = progressEvent.loaded / timeElapsed;
          let speedText =
            uploadSpeed > 1048576
              ? `${(uploadSpeed / 1048576).toFixed(2)} MB/s`
              : `${(uploadSpeed / 1024).toFixed(2)} KB/s`;
          const secondsRemaining =
            uploadSpeed > 0
              ? Math.round(
                  (progressEvent.total - progressEvent.loaded) / uploadSpeed,
                )
              : 0;
          let timeText =
            secondsRemaining > 60
              ? `${Math.floor(secondsRemaining / 60)} دقيقة`
              : `${secondsRemaining} ثانية`;

          setActiveUploads((prev) => ({
            ...prev,
            [uploadId]: {
              ...prev[uploadId],
              progress: percentCompleted,
              speed: speedText,
              timeRemaining: timeText,
            },
          }));
        },
      });

      setActiveUploads((prev) => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          status: "success",
          progress: 100,
          timeRemaining: "اكتمل",
          speed: "0 KB/s",
        },
      }));
      toast.success("تم رفع الملفات بنجاح!");
      queryClient.invalidateQueries([
        "folder-contents",
        transaction.transactionId,
        currentFolderId,
      ]);

      setTimeout(() => {
        setActiveUploads((prev) => {
          const next = { ...prev };
          delete next[uploadId];
          return next;
        });
        if (Object.keys(activeUploads).length <= 1) setShowUploadManager(false);
      }, 3000);
    } catch (error) {
      setActiveUploads((prev) => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          status: "error",
          timeRemaining: "فشل الرفع",
        },
      }));
      toast.error(error.response?.data?.message || "حدث خطأ أثناء الرفع");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 💡 دالة رفع إصدار جديد لملف محدد
  const handleUpdateVersionSelection = async (e) => {
    const file = e.target.files[0];
    if (!file || !fileToUpdate) return;

    const toastId = toast.loading("جاري رفع الإصدار الجديد...");
    const fd = new FormData();
    fd.append("files", file); // نستخدم نفس اسم الحقل للباك إند
    fd.append("transactionId", transaction.transactionId);
    fd.append("folderId", currentFolderId);
    fd.append("uploadedBy", currentUser);
    fd.append("replaceFileId", fileToUpdate.id); // 💡 نرسل الـ ID للملف المراد تحديثه

    try {
      // نفترض أنك ستضيف مسار جديد في الباك إند أو تعدل مسار الرفع ليدعم replaceFileId
      await api.post("/files/upload-version", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("تم تحديث إصدار الملف بنجاح!", { id: toastId });
      queryClient.invalidateQueries([
        "folder-contents",
        transaction.transactionId,
        currentFolderId,
      ]);
    } catch (error) {
      toast.error(error.response?.data?.message || "حدث خطأ أثناء الرفع", {
        id: toastId,
      });
    }

    if (updateFileInputRef.current) updateFileInputRef.current.value = "";
    setFileToUpdate(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (payload) =>
      await api.post("/files/delete", { ...payload, deletedBy: currentUser }),
    onSuccess: () => {
      toast.success("تم النقل لسلة المحذوفات");
      queryClient.invalidateQueries([
        "folder-contents",
        transaction.transactionId,
        currentFolderId,
      ]);
      setSelectedItems(new Set());
    },
  });

  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) return;
    if (
      !window.confirm(
        `هل أنت متأكد من نقل ${selectedItems.size} عنصر لسلة المحذوفات؟`,
      )
    )
      return;

    const folderIds = [];
    const fileIds = [];
    selectedItems.forEach((id) => {
      if (contents.folders.find((f) => f.id === id)) folderIds.push(id);
      else fileIds.push(id);
    });

    deleteMutation.mutate({
      folderIds,
      fileIds,
      transactionId: transaction.transactionId,
    });
  };

  const renameMutation = useMutation({
    mutationFn: async (payload) =>
      await api.put("/files/rename", { ...payload, modifiedBy: currentUser }),
    onSuccess: () => {
      toast.success("تم تغيير الاسم بنجاح");
      queryClient.invalidateQueries([
        "folder-contents",
        transaction.transactionId,
        currentFolderId,
      ]);
      setRenameModal({ show: false, item: null, type: "", newName: "" });
    },
  });

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (!renameModal.newName.trim()) return toast.error("يرجى إدخال اسم صحيح");
    renameMutation.mutate({
      id: renameModal.item.id,
      type: renameModal.type,
      newName: renameModal.newName,
    });
  };

  const handleItemDoubleClick = (item, type) => {
    if (type === "folder") {
      setPathStack([...pathStack, { id: item.id, name: item.name }]);
      setSelectedItems(new Set());
      setLastSelectedIndex(null);
    } else {
      const ext = item.extension?.toLowerCase();
      if (["pdf", "png", "jpg", "jpeg", "webp", "gif"].includes(ext))
        setViewerFile(item);
      else window.open(getFullUrl(item.url), "_blank");
    }
  };

  const handleNavigateBack = () => {
    if (pathStack.length > 1) {
      setPathStack(pathStack.slice(0, -1));
      setSelectedItems(new Set());
      setLastSelectedIndex(null);
    }
  };

  const handleNavigateToPath = (index) => {
    setPathStack(pathStack.slice(0, index + 1));
    setSelectedItems(new Set());
    setLastSelectedIndex(null);
  };

  const handleContextMenu = (e, item, type) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, item, type });
    if (!selectedItems.has(item.id)) setSelectedItems(new Set([item.id]));
  };

  const closeContextMenu = () =>
    setContextMenu({ show: false, x: 0, y: 0, item: null, type: null });

  const handleBgClick = () => {
    setSelectedItems(new Set());
    setLastSelectedIndex(null);
    closeContextMenu();
  };

  const handleSelectAll = () => {
    const allIds = allDisplayedItems.map((item) => item.id);
    setSelectedItems(new Set(allIds));
    toast.success(`تم تحديد ${allIds.length} عنصر`);
  };

  // ============================================================================
  // 💡 RENDERERS
  // ============================================================================

  const renderGridItem = (item, index) => {
    const isSelected = selectedItems.has(item.id);

    if (item._itemType === "folder") {
      return (
        <div
          key={item.id}
          onClick={(e) => handleItemClick(item.id, index, e)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleItemDoubleClick(item, "folder");
          }}
          onContextMenu={(e) => handleContextMenu(e, item, "folder")}
          className={`group relative flex flex-col items-center justify-start p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 h-36 select-none ${isSelected ? "border-blue-500 bg-blue-50 shadow-md ring-4 ring-blue-500/10" : "border-transparent bg-white shadow-sm hover:border-blue-300 hover:shadow-lg hover:-translate-y-1"}`}
        >
          <div
            className={`absolute top-3 right-3 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white opacity-0 group-hover:opacity-100"}`}
          >
            {isSelected && (
              <Check size={12} className="text-white" strokeWidth={3} />
            )}
          </div>
          <Folder
            size={64}
            fill="#FDB022"
            color="#B45309"
            strokeWidth={1}
            className={`mb-3 transition-transform duration-200 ${isSelected ? "scale-105" : "group-hover:scale-105"}`}
          />
          <span
            className="text-xs font-bold text-gray-800 text-center w-full line-clamp-2 leading-tight"
            title={item.name}
          >
            {item.name}
          </span>
        </div>
      );
    } else {
      const Icon = getFileIcon(item.extension);
      const color = getFileColor(item.extension);
      const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(
        item.extension?.toLowerCase(),
      );

      return (
        <div
          key={item.id}
          onClick={(e) => handleItemClick(item.id, index, e)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleItemDoubleClick(item, "file");
          }}
          onContextMenu={(e) => handleContextMenu(e, item, "file")}
          className={`group relative flex flex-col items-center justify-start p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 h-36 overflow-hidden select-none ${isSelected ? "border-blue-500 bg-blue-50 shadow-md ring-4 ring-blue-500/10" : "border-transparent bg-white shadow-sm hover:border-blue-300 hover:shadow-lg hover:-translate-y-1"}`}
        >
          <div
            className={`absolute top-3 right-3 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all z-10 ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white opacity-0 group-hover:opacity-100"}`}
          >
            {isSelected && (
              <Check size={12} className="text-white" strokeWidth={3} />
            )}
          </div>

          {/* 💡 Version Badge */}
          {item.version > 1 && (
            <div className="absolute top-2 left-2 bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm z-10">
              v{item.version}
            </div>
          )}

          {isImage ? (
            <div className="w-16 h-16 mb-3 rounded-lg overflow-hidden border border-gray-200 shadow-sm shrink-0">
              <img
                src={getFullUrl(item.url)}
                alt="thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <Icon
              size={60}
              color={color}
              strokeWidth={1}
              className={`mb-3 transition-transform duration-200 ${isSelected ? "scale-105" : "group-hover:scale-105"}`}
            />
          )}

          <div className="w-full flex items-center justify-center gap-1">
            {/* 💡 File Hash Badge (Shield) */}
            {item.fileHash && (
              <ShieldCheck
                size={12}
                className="text-green-500 shrink-0"
                title="ملف موثق ومحمي (Hash Checked)"
              />
            )}
            <span
              className="text-[11px] font-bold text-gray-800 text-center truncate leading-tight"
              dir="ltr"
              title={item.originalName || item.name}
            >
              {item.originalName || item.name}
            </span>
          </div>
        </div>
      );
    }
  };

  const renderListItem = (item, index) => {
    const isSelected = selectedItems.has(item.id);

    if (item._itemType === "folder") {
      return (
        <tr
          key={item.id}
          onClick={(e) => handleItemClick(item.id, index, e)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleItemDoubleClick(item, "folder");
          }}
          onContextMenu={(e) => handleContextMenu(e, item, "folder")}
          className={`cursor-pointer transition-colors select-none ${isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"}`}
        >
          <td className="p-4 text-center">
            <div
              className={`w-4 h-4 mx-auto rounded border-2 flex items-center justify-center transition-all ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"}`}
            >
              {isSelected && (
                <Check size={10} className="text-white" strokeWidth={3} />
              )}
            </div>
          </td>
          <td className="p-4 flex items-center gap-3 font-bold text-gray-900">
            <Folder
              size={28}
              fill="#FDB022"
              color="#B45309"
              className="shrink-0"
            />{" "}
            {item.name}
          </td>
          <td className="p-4 text-gray-500 font-mono">
            {new Date(item.createdAt).toLocaleDateString("en-GB")}
          </td>
          <td className="p-4 text-gray-500">مجلد ملفات</td>
          <td className="p-4 text-gray-400 font-mono">—</td>
          <td className="p-4 text-gray-500">{item.createdBy || "النظام"}</td>
        </tr>
      );
    } else {
      const Icon = getFileIcon(item.extension);
      const color = getFileColor(item.extension);
      const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(
        item.extension?.toLowerCase(),
      );

      return (
        <tr
          key={item.id}
          onClick={(e) => handleItemClick(item.id, index, e)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleItemDoubleClick(item, "file");
          }}
          onContextMenu={(e) => handleContextMenu(e, item, "file")}
          className={`cursor-pointer transition-colors select-none ${isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"}`}
        >
          <td className="p-4 text-center">
            <div
              className={`w-4 h-4 mx-auto rounded border-2 flex items-center justify-center transition-all ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"}`}
            >
              {isSelected && (
                <Check size={10} className="text-white" strokeWidth={3} />
              )}
            </div>
          </td>
          <td className="p-4 flex items-center gap-3 font-bold text-gray-900">
            {isImage ? (
              <div className="w-8 h-8 rounded overflow-hidden border border-gray-200 shadow-sm shrink-0">
                <img
                  src={getFullUrl(item.url)}
                  alt="thumb"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <Icon size={28} color={color} className="shrink-0" />
            )}

            <div className="flex flex-col">
              <span dir="ltr" className="truncate max-w-[200px]">
                {item.originalName || item.name}
              </span>
              {/* 💡 Badges in List View */}
              <div className="flex items-center gap-1 mt-0.5">
                {item.version > 1 && (
                  <span className="bg-purple-100 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
                    إصدار {item.version}
                  </span>
                )}
                {item.fileHash && (
                  <span className="flex items-center gap-0.5 text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1 rounded">
                    <ShieldCheck size={10} /> موثق
                  </span>
                )}
              </div>
            </div>
          </td>
          <td className="p-4 text-gray-500 font-mono">
            {new Date(item.createdAt).toLocaleDateString("en-GB")}
          </td>
          <td className="p-4 text-gray-500 uppercase">{item.extension} File</td>
          <td className="p-4 text-gray-500 font-mono">
            {formatFileSize(item.size)}
          </td>
          <td className="p-4 text-gray-500">{item.uploadedBy}</td>
        </tr>
      );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[250] p-4"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
              <FolderOpen size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight tracking-wide flex items-center gap-2">
                ملفات المعاملة:{" "}
                <span className="font-mono text-blue-300">
                  {transaction.transactionCode}
                </span>
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] text-slate-400 font-semibold">
                  المالك: {transaction.ownerFirstName}{" "}
                  {transaction.ownerLastName}
                </p>
                {transaction.clientPhone && (
                  <p className="text-[10px] font-mono bg-slate-800 text-green-400 px-1.5 py-0.5 rounded">
                    📞 {transaction.clientPhone}
                  </p>
                )}
                {transaction.officeName && (
                  <p className="text-[10px] bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded">
                    🏢 {transaction.officeName}
                  </p>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-red-500 hover:text-white p-2 rounded-lg transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-gray-200 shrink-0 shadow-sm z-10">
          <button
            onClick={handleNavigateBack}
            disabled={pathStack.length <= 1}
            className={`p-2 rounded-lg border transition-all ${pathStack.length > 1 ? "bg-white border-gray-300 hover:bg-gray-100 text-gray-800 shadow-sm" : "bg-gray-100 border-transparent text-gray-400 cursor-not-allowed"}`}
            title="رجوع"
          >
            <ArrowRight size={18} />
          </button>

          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 overflow-x-auto custom-scrollbar-slim shadow-inner">
            <Home size={14} className="text-blue-600 shrink-0" />
            {pathStack.map((step, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <ChevronLeft
                    size={14}
                    className="text-gray-400 mx-0.5 shrink-0"
                  />
                )}
                <button
                  onClick={() => handleNavigateToPath(idx)}
                  className={`text-xs whitespace-nowrap transition-colors rounded px-1.5 py-0.5 ${idx === pathStack.length - 1 ? "font-black text-slate-800 bg-slate-100" : "font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50"}`}
                >
                  {step.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateFolderModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 text-xs font-bold transition-all shadow-sm"
            >
              <FolderPlus size={16} />{" "}
              <span className="hidden sm:inline">إنشاء مجلد</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-bold transition-all shadow-md"
            >
              <Upload size={16} />{" "}
              <span className="hidden sm:inline">رفع ملفات</span>
            </button>
            {selectedItems.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 text-xs font-bold transition-all shadow-sm"
              >
                {deleteMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                <span className="hidden sm:inline">
                  حذف ({selectedItems.size})
                </span>
              </button>
            )}
          </div>

          <div className="h-8 w-px bg-gray-200 mx-1" />

          <div className="flex bg-gray-200 p-1 rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-800 hover:bg-gray-300"}`}
              title="عرض شبكة"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-800 hover:bg-gray-300"}`}
              title="عرض قائمة"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* ── Explorer Area ── */}
        <div
          className="flex-1 overflow-auto bg-[#fafbfc] p-6 relative"
          onClick={handleBgClick}
          onContextMenu={(e) => {
            e.preventDefault();
            handleBgClick();
          }}
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
          ) : allDisplayedItems.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
              <FolderOpen
                size={80}
                strokeWidth={1}
                className="mb-4 opacity-40 text-blue-300"
              />
              <p className="text-xl font-black text-slate-700">
                المجلد فارغ تماماً
              </p>
              <p className="text-sm mt-2 font-bold text-slate-400">
                انقر على "رفع ملفات" أو قم بسحب المستندات وإفلاتها هنا
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-5 content-start">
              {allDisplayedItems.map((item, index) =>
                renderGridItem(item, index),
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-gray-200 z-10">
                  <tr>
                    <th className="p-4 w-10 text-center">
                      <button onClick={handleSelectAll}>
                        <CheckSquare
                          size={16}
                          className="text-gray-400 hover:text-blue-600 mx-auto"
                        />
                      </button>
                    </th>
                    <th className="p-4">الاسم</th>
                    <th className="p-4">تاريخ التعديل</th>
                    <th className="p-4">النوع</th>
                    <th className="p-4">الحجم</th>
                    <th className="p-4">بواسطة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                  {allDisplayedItems.map((item, index) =>
                    renderListItem(item, index),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Context Menu (Updated with Enterprise Features) ── */}
        {contextMenu.show && contextMenu.item && (
          <>
            <div
              className="fixed inset-0 z-[300]"
              onClick={closeContextMenu}
              onContextMenu={(e) => {
                e.preventDefault();
                closeContextMenu();
              }}
            />
            <div
              className="fixed z-[310] bg-white rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.2)] border border-gray-200 py-1.5 min-w-[220px] font-bold animate-in fade-in zoom-in-95 duration-100"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <div className="px-4 py-2 border-b border-gray-100 mb-1 bg-slate-50">
                <p
                  className="text-xs text-slate-800 truncate"
                  title={contextMenu.item.originalName || contextMenu.item.name}
                >
                  {contextMenu.item.originalName || contextMenu.item.name}
                </p>
                <p className="text-[10px] font-mono text-gray-400 mt-1">
                  {contextMenu.type === "folder"
                    ? "مجلد نظام"
                    : formatFileSize(contextMenu.item.size)}
                </p>
              </div>

              {contextMenu.type === "file" && (
                <>
                  <button
                    onClick={() => {
                      handleItemDoubleClick(contextMenu.item, "file");
                      closeContextMenu();
                    }}
                    className="w-full text-right px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 text-blue-600 text-xs transition-colors"
                  >
                    <Eye size={16} /> عرض وفتح
                  </button>
                  <button
                    onClick={() => {
                      window.open(getFullUrl(contextMenu.item.url), "_blank");
                      closeContextMenu();
                    }}
                    className="w-full text-right px-4 py-2.5 hover:bg-green-50 flex items-center gap-3 text-green-600 text-xs transition-colors"
                  >
                    <Download size={16} /> تحميل الملف
                  </button>

                  {/* 💡 Enterprise Features */}
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => {
                      setFileToUpdate(contextMenu.item);
                      updateFileInputRef.current.click();
                      closeContextMenu();
                    }}
                    className="w-full text-right px-4 py-2.5 hover:bg-purple-50 flex items-center gap-3 text-purple-600 text-xs transition-colors"
                  >
                    <Upload size={16} /> تحديث إصدار الملف
                  </button>
                  <button
                    onClick={() => {
                      setVersionsModal({ show: true, file: contextMenu.item });
                      closeContextMenu();
                    }}
                    className="w-full text-right px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-gray-700 text-xs transition-colors"
                  >
                    <History size={16} /> سجل الإصدارات السابقة
                  </button>
                  <button
                    onClick={() => {
                      setLogsModal({ show: true, file: contextMenu.item });
                      closeContextMenu();
                    }}
                    className="w-full text-right px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-gray-700 text-xs transition-colors"
                  >
                    <Activity size={16} /> سجل حركات الملف (Audit)
                  </button>
                </>
              )}

              {contextMenu.type === "folder" && (
                <>
                  <button
                    onClick={() => {
                      handleItemDoubleClick(contextMenu.item, "folder");
                      closeContextMenu();
                    }}
                    className="w-full text-right px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 text-blue-600 text-xs transition-colors"
                  >
                    <FolderOpen size={16} /> فتح المجلد
                  </button>
                </>
              )}

              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  setRenameModal({
                    show: true,
                    item: contextMenu.item,
                    type: contextMenu.type,
                    newName:
                      contextMenu.item.originalName || contextMenu.item.name,
                  });
                  closeContextMenu();
                }}
                className="w-full text-right px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 text-blue-600 text-xs transition-colors"
              >
                <Edit2 size={16} /> تغيير الاسم
              </button>
              <button
                onClick={() => {
                  copyToClipboard(
                    contextMenu.item.originalName || contextMenu.item.name,
                    "الاسم",
                  );
                  closeContextMenu();
                }}
                className="w-full text-right px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-gray-700 text-xs transition-colors"
              >
                <Copy size={16} className="text-gray-500" /> نسخ الاسم
              </button>

              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  handleDeleteSelected();
                  closeContextMenu();
                }}
                className="w-full text-right px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-red-600 text-xs transition-colors"
              >
                <Trash2 size={16} /> نقل لسلة المحذوفات
              </button>
            </div>
          </>
        )}

        {/* ── Upload Manager Widget ── */}
        {showUploadManager && Object.keys(activeUploads).length > 0 && (
          <div className="absolute bottom-6 left-6 w-80 bg-white rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.2)] border border-gray-200 overflow-hidden z-[200] animate-in slide-in-from-bottom-6">
            {/* Same Upload Widget logic */}
            <div className="bg-slate-900 px-4 py-3 flex justify-between items-center text-white">
              <span className="text-xs font-bold flex items-center gap-2">
                <Upload size={16} className="text-blue-400" /> جاري الرفع...
              </span>
              <button
                onClick={() => setShowUploadManager(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-5 max-h-72 overflow-y-auto">
              {Object.entries(activeUploads).map(([id, upload]) => (
                <div key={id} className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-gray-700">
                    <span>{upload.filesCount} ملفات</span>
                    <span
                      className={
                        upload.status === "success"
                          ? "text-green-600"
                          : "text-blue-600"
                      }
                    >
                      {upload.progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border">
                    <div
                      className={`h-full transition-all ${upload.status === "error" ? "bg-red-500" : upload.status === "success" ? "bg-green-500" : "bg-blue-600"}`}
                      style={{ width: `${upload.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Bar */}
        <div className="px-6 py-3 bg-white border-t border-gray-200 text-xs font-bold text-gray-500 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <span className="bg-slate-100 px-3 py-1.5 rounded-lg border text-slate-700">
              {allDisplayedItems.length} عناصر
            </span>
            {selectedItems.size > 0 && (
              <span className="text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                {selectedItems.size} عناصر محددة
              </span>
            )}
          </div>
        </div>

        {/* Hidden Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFilesSelection}
        />

        {/* Modals */}
        {showCreateFolderModal && (
          <CreateFolderModal
            categories={categories}
            isPending={createFolderMutation.isPending}
            onConfirm={(foldersArray) =>
              createFolderMutation.mutate(foldersArray)
            }
            onClose={() => setShowCreateFolderModal(false)}
          />
        )}

        {renameModal.show && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[500]"
            onClick={() => setRenameModal({ ...renameModal, show: false })}
            dir="rtl"
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-gray-200 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">تغيير الاسم</h3>
                <button
                  onClick={() =>
                    setRenameModal({ ...renameModal, show: false })
                  }
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleRenameSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    الاسم الجديد
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={renameModal.newName}
                    onChange={(e) =>
                      setRenameModal({
                        ...renameModal,
                        newName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    dir="auto"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setRenameModal({ ...renameModal, show: false })
                    }
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={renameMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-2"
                  >
                    {renameMutation.isPending && (
                      <Loader2 size={12} className="animate-spin" />
                    )}{" "}
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {viewerFile && (
          <FileViewerModal
            file={viewerFile}
            onClose={() => setViewerFile(null)}
          />
        )}
      </div>

      {/* 💡 Input مخفي مخصص لرفع إصدارات جديدة */}
      <input
        ref={updateFileInputRef}
        type="file"
        className="hidden"
        onChange={handleUpdateVersionSelection}
      />

      {/* 💡 1. نافذة سجل حركات الملف (Audit Trail Modal) */}
      {logsModal.show && logsModal.file && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[600] p-4"
          onClick={() => setLogsModal({ show: false, file: null })}
          dir="rtl"
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity size={20} className="text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    سجل حركات الملف (Audit Trail)
                  </h3>
                  <p
                    className="text-[10px] text-slate-300 mt-0.5 truncate max-w-sm"
                    dir="ltr"
                  >
                    {logsModal.file.originalName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLogsModal({ show: false, file: null })}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 bg-slate-50 max-h-[60vh] overflow-y-auto">
              {/* هنا نستخدم useQuery لجلب الحركات من الباك إند */}
              <FileLogsFetcher fileId={logsModal.file.id} />
            </div>
          </div>
        </div>
      )}

      {/* 💡 2. نافذة الإصدارات السابقة (Previous Versions Modal) */}
      {versionsModal.show && versionsModal.file && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[600] p-4"
          onClick={() => setVersionsModal({ show: false, file: null })}
          dir="rtl"
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History size={20} className="text-purple-400" />
                <div>
                  <h3 className="font-bold text-sm">الإصدارات السابقة للملف</h3>
                  <p
                    className="text-[10px] text-slate-300 mt-0.5 truncate max-w-sm"
                    dir="ltr"
                  >
                    {versionsModal.file.originalName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVersionsModal({ show: false, file: null })}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-0 max-h-[60vh] overflow-y-auto">
              <FileVersionsFetcher fileId={versionsModal.file.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 💡 FETCHERS FOR MODALS (مكونات مساعدة لجلب وعرض السجلات)
// ============================================================================

function FileLogsFetcher({ fileId }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["file-logs", fileId],
    queryFn: async () => {
      const res = await api.get(`/files/logs/${fileId}`);
      return res.data?.logs || [];
    }
  });

  if (isLoading) return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (logs.length === 0) return <div className="py-10 text-center text-slate-400 font-bold">لا يوجد سجل حركات لهذا الملف</div>;

  return (
    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
      {logs.map((log) => (
        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
            <Activity size={16} />
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between space-x-2 mb-1">
              <div className="font-bold text-slate-800 text-xs">{log.action}</div>
              <time className="text-[10px] font-mono text-slate-500">{new Date(log.createdAt).toLocaleString("ar-EG")}</time>
            </div>
            <div className="text-[11px] text-slate-600 mt-2">
              بواسطة: <span className="font-bold text-blue-600">{log.performedBy}</span>
            </div>
            {log.ipAddress && <div className="text-[9px] text-slate-400 font-mono mt-1">IP: {log.ipAddress}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function FileVersionsFetcher({ fileId }) {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["file-versions", fileId],
    queryFn: async () => {
      const res = await api.get(`/files/versions/${fileId}`);
      return res.data?.versions || [];
    }
  });

  if (isLoading) return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-purple-500" /></div>;
  if (versions.length === 0) return <div className="py-10 text-center text-slate-400 font-bold">لا يوجد إصدارات سابقة لهذا الملف</div>;

  return (
    <table className="w-full text-right text-xs">
      <thead className="bg-slate-50 border-b border-gray-200 text-slate-500 font-bold">
        <tr>
          <th className="p-4">الإصدار</th>
          <th className="p-4">تاريخ الرفع</th>
          <th className="p-4">الحجم</th>
          <th className="p-4">بواسطة</th>
          <th className="p-4 text-center">تحميل</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {versions.map((v) => (
          <tr key={v.id} className="hover:bg-slate-50 transition-colors">
            <td className="p-4 font-black text-purple-600">v{v.versionNumber}</td>
            <td className="p-4 font-mono text-slate-500">{new Date(v.createdAt).toLocaleString("en-GB")}</td>
            <td className="p-4 font-mono text-slate-500">{formatFileSize(v.size)}</td>
            <td className="p-4 font-bold text-slate-700">{v.uploadedBy}</td>
            <td className="p-4 text-center">
              <button onClick={() => window.open(getFullUrl(v.url), "_blank")} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors inline-block">
                <Download size={14} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}