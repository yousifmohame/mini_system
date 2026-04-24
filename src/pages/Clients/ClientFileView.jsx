import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClientById } from "../../api/clientApi";
import {
  User,
  FileText,
  Receipt,
  FileCheck,
  Landmark,
  BarChart3,
  Star,
  History,
  Upload,
  X,
  Download,
  Copy,
  ArrowLeft,
  Loader2,
  Save,
  MapPin,
  MessageCircle,
  PhoneCall,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import api from "../../api/axios";

// استيراد التابات المنفصلة
import SummaryTab from "./FileViewTabs/SummaryTab";
import BasicInfoTab from "./FileViewTabs/BasicInfoTab";
import ContactTab from "./FileViewTabs/ContactTab";
import DocsTab from "./FileViewTabs/DocsTab";
import TransactionsTab from "./FileViewTabs/TransactionsTab";
import PropertiesTab from "./FileViewTabs/PropertiesTab";

// الدوال المساعدة
const getFullName = (nameObj) => {
  if (!nameObj) return "غير محدد";
  if (typeof nameObj === "string") return nameObj;
  if (nameObj.ar) return nameObj.ar;
  const parts = [
    nameObj.firstAr || nameObj.firstName,
    nameObj.fatherAr || nameObj.fatherName,
    nameObj.grandAr || nameObj.grandFatherName,
    nameObj.familyAr || nameObj.familyName,
  ].filter((p) => p && typeof p === "string" && p.trim() !== "");
  if (parts.length > 1 && parts.every((p) => p === parts[0])) return parts[0];
  return (
    parts.join(" ").trim() || nameObj.en || nameObj.englishName || "غير محدد"
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const maskId = (id) => {
  if (!id || id.length < 6) return id || "—";
  return id.slice(0, 3) + "****" + id.slice(-3);
};

const getRemainingTime = (expiryDateString) => {
  if (!expiryDateString) return null;
  const expiryDate = new Date(expiryDateString);
  if (isNaN(expiryDate)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0)
    return {
      expired: true,
      text: "منتهية الصلاحية",
      color: "bg-red-50 border-red-200 text-red-700",
    };
  if (diffDays === 0)
    return {
      expired: false,
      text: "تنتهي اليوم!",
      color: "bg-orange-50 border-orange-200 text-orange-700",
    };
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  const days = (diffDays % 365) % 30;
  let textParts = [];
  if (years > 0) textParts.push(`${years} سنة`);
  if (months > 0) textParts.push(`${months} شهر`);
  if (days > 0) textParts.push(`${days} يوم`);
  const color =
    diffDays < 30
      ? "bg-orange-50 border-orange-200 text-orange-700"
      : "bg-emerald-50 border-emerald-200 text-emerald-700";
  return { expired: false, text: textParts.join(" و "), color };
};

const toEnglishNumbers = (str) => {
  if (str === null || str === undefined) return "";
  return String(str).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
};

const getFullUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  let fixedUrl = url;
  if (url.startsWith("/uploads/")) {
    fixedUrl = `/api${url}`;
  }
  const baseUrl = "https://details-worksystem1.com";
  return `${baseUrl}${fixedUrl}`;
};

const ClientFileView = ({ clientId, onBack }) => {
  const queryClient = useQueryClient();

  // حالات عامة
  const [activeTab, setActiveTab] = useState("summary");
  const [isPhotoBlurred, setIsPhotoBlurred] = useState(false);
  const [isIdMasked, setIsIdMasked] = useState(true);

  // حالات التعديل للبيانات الأساسية
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const repIdRef = useRef(null);
  const repAuthRef = useRef(null);
  const [isAnalyzingRepId, setIsAnalyzingRepId] = useState(false);
  const [isAnalyzingRepAuth, setIsAnalyzingRepAuth] = useState(false);

  // حالات الوثائق
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    name: "",
    notes: "",
  });
  const [previewDoc, setPreviewDoc] = useState(null);

  const {
    data: client,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => getClientById(clientId),
    enabled: !!clientId,
  });

  const handleStartEdit = () => {
    const nameDetails = client.name?.details || client.name || {};
    let firstAr = nameDetails.firstAr || nameDetails.firstName || "";
    let fatherAr = nameDetails.fatherAr || nameDetails.fatherName || "";
    let grandAr = nameDetails.grandAr || nameDetails.grandFatherName || "";
    let familyAr = nameDetails.familyAr || nameDetails.familyName || "";

    if (firstAr && firstAr === familyAr && firstAr.includes(" ")) {
      const splitName = firstAr.split(" ").filter(Boolean);
      firstAr = splitName[0] || "";
      fatherAr = splitName[1] || "";
      grandAr = splitName.length > 3 ? splitName[2] : "";
      familyAr = splitName.length > 2 ? splitName[splitName.length - 1] : "";
    }

    setEditFormData({
      type: client.type || "فرد سعودي",
      idNumber: client.idNumber || client.identification?.idNumber || "",
      mobile: client.mobile || client.contact?.mobile || "",
      email: client.email || client.contact?.email || "",
      firstAr,
      firstEn: nameDetails.firstEn || nameDetails.englishName || "",
      fatherAr,
      fatherEn: nameDetails.fatherEn || "",
      grandAr,
      grandEn: nameDetails.grandEn || "",
      familyAr,
      familyEn: nameDetails.familyEn || "",
      defaultTitle: client.clientTitle || "تلقائي",
      handlingMethod: client.representative?.hasRepresentative
        ? client.representative.type
        : "عن نفسه",
      isInvestor: !!client.company || !!client.taxNumber,
      company: client.company || "",
      taxNumber: client.taxNumber || "",
      occupation: client.occupation || "",
      nationality: client.nationality || "سعودي",
      repName: client.representative?.name || "",
      repIdNumber: client.representative?.idNumber || "",
      repIdExpiry: client.representative?.idExpiry || "",
      repMobile: client.representative?.mobile || "",
      repAuthNumber: client.representative?.authNumber || "",
      repAuthExpiry: client.representative?.authExpiry || "",
      repPowersScope: client.representative?.powersScope || "",
    });
    setIsEditingBasicInfo(true);
  };

  const handleEditChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateClientMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.put(`/clients/${clientId}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("تم تحديث البيانات الأساسية بنجاح!");
      setIsEditingBasicInfo(false);
      queryClient.invalidateQueries(["client", clientId]);
      queryClient.invalidateQueries(["clients"]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "فشل تحديث البيانات");
    },
  });

  const handleSaveBasicInfo = () => {
    const partsAr = [
      editFormData.firstAr,
      editFormData.fatherAr,
      editFormData.grandAr,
      editFormData.familyAr,
    ].filter((p) => p && p.trim() !== "");
    const officialNameAr = partsAr.join(" ");
    const partsEn = [
      editFormData.firstEn,
      editFormData.fatherEn,
      editFormData.grandEn,
      editFormData.familyEn,
    ].filter((p) => p && p.trim() !== "");
    const officialNameEn = partsEn.join(" ");
    const finalAr =
      officialNameAr ||
      (typeof client.name === "string" ? client.name : client.name?.ar) ||
      "غير محدد";

    let updatedRep = { ...client.representative };
    if (editFormData.handlingMethod === "عن نفسه") {
      updatedRep.hasRepresentative = false;
    } else {
      updatedRep.hasRepresentative = true;
      updatedRep.type = editFormData.handlingMethod;
      updatedRep.name = editFormData.repName;
      updatedRep.idNumber = editFormData.repIdNumber;
      updatedRep.idExpiry = editFormData.repIdExpiry;
      updatedRep.mobile = editFormData.repMobile;
      updatedRep.authNumber = editFormData.repAuthNumber;
      updatedRep.authExpiry = editFormData.repAuthExpiry;
      updatedRep.powersScope = editFormData.repPowersScope;
    }

    const payload = {
      type: editFormData.type,
      idNumber: editFormData.idNumber,
      mobile: editFormData.mobile,
      email: editFormData.email,
      name: {
        ar: finalAr,
        en: officialNameEn || client.name?.en || "",
        details: {
          firstAr: editFormData.firstAr,
          firstEn: editFormData.firstEn,
          fatherAr: editFormData.fatherAr,
          fatherEn: editFormData.fatherEn,
          grandAr: editFormData.grandAr,
          grandEn: editFormData.grandEn,
          familyAr: editFormData.familyAr,
          familyEn: editFormData.familyEn,
        },
      },
      contact: {
        ...client.contact,
        mobile: editFormData.mobile,
        email: editFormData.email,
      },
      identification: {
        ...client.identification,
        idNumber: editFormData.idNumber,
      },
      clientTitle: editFormData.defaultTitle,
      representative: updatedRep,
      company: editFormData.isInvestor ? editFormData.company : null,
      taxNumber: editFormData.isInvestor ? editFormData.taxNumber : null,
      occupation: editFormData.isInvestor ? editFormData.occupation : null,
      nationality: editFormData.isInvestor
        ? editFormData.nationality
        : client.nationality,
    };
    updateClientMutation.mutate(payload);
  };

  const handleRepDocUpload = (e, type, isAuthDoc) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    if (isAuthDoc) setIsAnalyzingRepAuth(true);
    else setIsAnalyzingRepId(true);
    reader.onload = async () => {
      const base64Data = reader.result;
      const docFormData = new FormData();
      docFormData.append("file", file);
      docFormData.append("name", type);
      uploadDocMutation.mutate(docFormData);
      try {
        const response = await api.post("/clients/analyze-representative", {
          imageBase64: base64Data,
          docType: isAuthDoc ? "وكالة" : "هوية",
        });
        if (response.data?.success) {
          const data = response.data.data;
          if (isAuthDoc) {
            if (data.authNumber)
              handleEditChange("repAuthNumber", data.authNumber);
            if (data.authExpiry)
              handleEditChange("repAuthExpiry", data.authExpiry);
            if (data.powersScope)
              handleEditChange("repPowersScope", data.powersScope);
          } else {
            if (data.agentName) handleEditChange("repName", data.agentName);
            if (data.agentIdNumber)
              handleEditChange("repIdNumber", data.agentIdNumber);
            if (data.idExpiry) handleEditChange("repIdExpiry", data.idExpiry);
          }
          toast.success(`تم استخراج بيانات ${type} بنجاح!`);
        }
      } catch (error) {
        toast.error(`فشل في استخراج البيانات من ${type}`);
      } finally {
        if (isAuthDoc) setIsAnalyzingRepAuth(false);
        else setIsAnalyzingRepId(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // دوال المستندات
  const uploadDocMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await api.post(`/clients/${clientId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("تم رفع الوثيقة بنجاح");
        queryClient.invalidateQueries({ queryKey: ["client", clientId] });
        closeUploadModal();
      } else {
        toast.error(data.message || "حدث خطأ غير متوقع");
      }
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "تعذر رفع الوثيقة"),
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (docId) =>
      (await api.delete(`/attachments/${docId}`)).data,
    onSuccess: () => {
      toast.success("تم حذف الوثيقة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
    },
    onError: (error) =>
      toast.error(
        error.response?.data?.message || "حدث خطأ أثناء حذف الوثيقة.",
      ),
  });

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadForm({ file: null, name: "", notes: "" });
  };
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setUploadForm({
        ...uploadForm,
        file: selectedFile,
        name: uploadForm.name || selectedFile.name.split(".")[0],
      });
    }
  };
  const handleUploadSubmit = () => {
    if (!uploadForm.file) return toast.error("يرجى اختيار ملف أولاً");
    if (!uploadForm.name) return toast.error("يرجى كتابة اسم/نوع الوثيقة");
    const formData = new FormData();
    formData.append("file", uploadForm.file);
    formData.append("name", uploadForm.name);
    formData.append("notes", uploadForm.notes);
    uploadDocMutation.mutate(formData);
  };
  const handleDeleteDocument = (docId) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الوثيقة نهائياً؟")) {
      deleteDocMutation.mutate(docId);
    }
  };
  const handleViewDocument = (doc) => {
    const fileUrl = getFullUrl(doc.filePath);
    if (!fileUrl) return toast.error("مسار الملف غير متوفر");
    setPreviewDoc({
      url: fileUrl,
      name: doc.fileName || doc.name,
      type: doc.fileType || "application/pdf",
    });
  };
  const handleDownloadDocument = async (filePath, fileName) => {
    const fileUrl = getFullUrl(filePath);
    if (!fileUrl) return toast.error("مسار الملف غير متوفر");
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const ext = filePath.split(".").pop();
      link.setAttribute("download", `${fileName}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      toast.error("فشل تحميل الملف");
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ بنجاح");
  };

  const openWhatsApp = (phone) => {
    if (!phone) return toast.error("لا يوجد رقم جوال مسجل");
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("05"))
      cleanPhone = "966" + cleanPhone.substring(1);
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <h2 className="text-lg font-bold text-slate-700">
          جاري تحميل ملف العميل...
        </h2>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          حدث خطأ أو لم يتم العثور على بيانات العميل
        </h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-200 rounded-lg font-bold hover:bg-slate-300"
        >
          العودة للسجل
        </button>
      </div>
    );
  }

  const clientName = getFullName(client.name);
  const englishName =
    client.name?.en || client.name?.englishName || client.name?.firstEn || "";

  const TABS = [
    { id: "summary", label: "ملخص العميل", icon: User },
    { id: "basic", label: "البيانات الأساسية", icon: FileText },
    { id: "contact", label: "العنوان والتواصل", icon: MapPin },
    {
      id: "docs",
      label: "وثائق ومستندات",
      icon: FileCheck,
      badge: client?._count?.attachments || "0",
      badgeColor: "bg-slate-500",
    },
    { id: "tax", label: "الزكاة والضريبة", icon: Receipt },
    {
      id: "transactions",
      label: "المعاملات",
      icon: FileText,
      badge: client?._count?.transactions || "0",
      badgeColor: "bg-blue-600",
    },
    {
      id: "financial",
      label: "السجل المالي",
      icon: BarChart3,
      badge: "1",
      badgeColor: "bg-cyan-600",
    },
    { id: "rating", label: "التقييم والملاحظات", icon: Star },
    { id: "audit", label: "سجل التدقيق", icon: History },
    { id: "reports", label: "التقارير", icon: BarChart3 },
    {
      id: "properties",
      label: "الملكيات والصكوك",
      icon: Landmark,
      badge: client?.ownershipFiles?.length || "0",
      badgeColor: "bg-violet-600",
    },
    {
      id: "obligations",
      label: "التزامات الأمانة",
      icon: Receipt,
      badge: "0",
      badgeColor: "bg-red-500",
    },
  ];

  const renderUploadModal = () => {
    if (!isUploadModalOpen) return null;
    return (
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        dir="rtl"
      >
        <div className="bg-white rounded-2xl p-6 w-full max-w-[480px] shadow-2xl">
          <div className="flex justify-between items-center mb-5">
            <div className="text-base font-bold text-violet-700 flex items-center gap-2">
              <Upload className="w-5 h-5" /> رفع وثيقة للعميل
            </div>
            <button
              onClick={closeUploadModal}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${uploadForm.file ? "border-violet-500 bg-violet-50" : "border-slate-300 hover:bg-slate-50 bg-white"}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              {uploadForm.file ? (
                <>
                  <FileCheck className="w-8 h-8 text-violet-600 mx-auto mb-2" />
                  <div className="text-sm font-bold text-violet-800">
                    {uploadForm.file.name}
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-slate-600">
                    اضغط هنا لاختيار ملف
                  </div>
                </>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم/نوع الوثيقة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={uploadForm.name}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, name: e.target.value })
                }
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ملاحظات (اختياري)
              </label>
              <textarea
                rows="3"
                value={uploadForm.notes}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, notes: e.target.value })
                }
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-violet-500 resize-none"
              ></textarea>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleUploadSubmit}
              disabled={uploadDocMutation.isPending}
              className="flex-1 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-violet-700 flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {uploadDocMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}{" "}
              حفظ ورفع
            </button>
            <button
              onClick={closeUploadModal}
              className="px-6 py-2.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-sm hover:bg-slate-200 font-bold"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPreviewModal = () => {
    if (!previewDoc) return null;
    const isPdf =
      previewDoc.type.includes("pdf") ||
      previewDoc.url.toLowerCase().endsWith(".pdf");
    return (
      <div
        className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        dir="rtl"
      >
        <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
          <div className="px-6 py-4 bg-slate-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-slate-700 rounded-lg">
                {isPdf ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-base line-clamp-1">
                  {previewDoc.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Preview
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleDownloadDocument(previewDoc.url, previewDoc.name)
                }
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> تنزيل
              </button>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 bg-slate-700 hover:bg-red-500 text-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 bg-slate-100 relative overflow-hidden flex justify-center items-center p-8">
            {isPdf ? (
              <iframe
                src={previewDoc.url}
                className="w-full h-full rounded-2xl shadow-sm bg-white"
                title={previewDoc.name}
              />
            ) : (
              <img
                src={previewDoc.url}
                alt={previewDoc.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                draggable="false"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="flex flex-col h-full bg-slate-100 p-4 md:p-6 overflow-hidden"
      dir="rtl"
    >
      {/* 💡 Top Header Area (Fixed at top) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-4 shrink-0 p-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> العودة
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

            <div className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-mono font-bold text-sm flex items-center gap-2 shadow-sm">
              {client.clientCode}
              <button
                onClick={() => handleCopy(client.clientCode)}
                className="text-blue-200 hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
              {client.type || "عميل"}
            </span>

            <div className="hidden md:flex items-center gap-3 border-r border-slate-200 pr-4 ml-2">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                <User className="w-5 h-5" />
              </div>
              <div className="font-black text-slate-800 text-base max-w-[250px] truncate">
                {clientName}
              </div>
            </div>
          </div>

          {/* Quick Actions (WhatsApp, Phone) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => openWhatsApp(client.contact?.mobile)}
              className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">مراسلة</span>
            </button>
            <a
              href={`tel:${client.contact?.mobile}`}
              className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
            >
              <PhoneCall className="w-4 h-4" />
              <span className="hidden sm:inline">اتصال</span>
            </a>
          </div>
        </div>
      </div>

      {/* 💡 Main Body Layout: Sidebar + Content */}
      <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden">
        {/* 👈 Sidebar (Vertical Tabs) */}
        <div className="w-full md:w-[260px] bg-white border border-slate-200 rounded-xl shadow-sm p-3 flex flex-col gap-1 overflow-y-auto custom-scrollbar-slim shrink-0 h-full">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm font-bold transition-all text-right w-full relative ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-blue-600 rounded-l-full"></div>
                )}

                <tab.icon
                  className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`}
                />
                <span className="truncate">{tab.label}</span>

                {tab.badge && (
                  <span
                    className={`mr-auto px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm ${
                      isActive
                        ? "bg-blue-200 text-blue-800"
                        : tab.badgeColor + " text-white"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 👈 Content Area */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-6 overflow-y-auto custom-scrollbar h-full">
          {activeTab === "summary" && (
            <SummaryTab
              client={client}
              clientName={clientName}
              englishName={englishName}
              isPhotoBlurred={isPhotoBlurred}
              setIsPhotoBlurred={setIsPhotoBlurred}
              isIdMasked={isIdMasked}
              setIsIdMasked={setIsIdMasked}
              maskId={maskId}
              formatDate={formatDate}
            />
          )}
          {activeTab === "basic" && (
            <BasicInfoTab
              client={client}
              isEditingBasicInfo={isEditingBasicInfo}
              setIsEditingBasicInfo={setIsEditingBasicInfo}
              editFormData={editFormData}
              handleEditChange={handleEditChange}
              handleSaveBasicInfo={handleSaveBasicInfo}
              updateClientMutation={updateClientMutation}
              handleStartEdit={handleStartEdit}
              repAuthRef={repAuthRef}
              handleRepDocUpload={handleRepDocUpload}
              isAnalyzingRepAuth={isAnalyzingRepAuth}
              isAnalyzingRepId={isAnalyzingRepId}
              toEnglishNumbers={toEnglishNumbers}
              formatDate={formatDate}
              getRemainingTime={getRemainingTime}
            />
          )}
          {activeTab === "contact" && (
            <ContactTab client={client} openWhatsApp={openWhatsApp} />
          )}
          {activeTab === "docs" && (
            <DocsTab
              client={client}
              setIsUploadModalOpen={setIsUploadModalOpen}
              handleViewDocument={handleViewDocument}
              handleDownloadDocument={handleDownloadDocument}
              handleDeleteDocument={handleDeleteDocument}
              deleteDocMutation={deleteDocMutation}
              formatDate={formatDate}
            />
          )}
          {activeTab === "transactions" && (
            <TransactionsTab client={client} formatDate={formatDate} />
          )}
          {activeTab === "properties" && <PropertiesTab client={client} />}

          {/* Placeholder for missing tabs */}
          {[
            "financial",
            "tax",
            "rating",
            "audit",
            "reports",
            "obligations",
          ].includes(activeTab) && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400 py-20 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-slate-600 mb-2">
                جاري استكمال التبويب
              </h3>
              <p className="text-sm font-semibold">
                سيتم عرض البيانات الخاصة بهذا التبويب هنا قريباً.
              </p>
            </div>
          )}
        </div>
      </div>

      {renderUploadModal()}
      {renderPreviewModal()}
    </div>
  );
};

export default ClientFileView;
