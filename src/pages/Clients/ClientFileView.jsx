import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClientById } from "../../api/clientApi"; // 👈 تأكد من صحة المسار
import {
  Copy,
  User,
  Eye,
  Award,
  FileText,
  Receipt,
  FileCheck,
  DollarSign,
  Landmark,
  TrendingUp,
  MessageCircle,
  PhoneCall,
  Mail,
  Plus,
  Upload,
  Printer,
  RefreshCw,
  Shield,
  MapPin,
  BarChart3,
  Star,
  History,
  Phone,
  ShieldCheck,
  ChevronDown,
  Building,
  Home,
  Clock,
  TriangleAlert,
  X,
  Search,
  FileStack,
  ArrowUpRight,
  Link2,
  Download,
  CircleDot,
  Ban,
  Paperclip,
  Archive,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Save,
  UsersRound,
  Calendar,
  ExternalLink,
  SquarePen,
  ScanSearch,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import api from "../../api/axios";
// دالة مساعدة لاسم العميل
const getFullName = (nameObj) => {
  if (!nameObj) return "غير محدد";
  if (typeof nameObj === "string") return nameObj;
  if (nameObj.ar) return nameObj.ar;
  const parts = [
    nameObj.firstAr || nameObj.firstName,
    nameObj.fatherAr || nameObj.fatherName,
    nameObj.grandAr || nameObj.grandFatherName,
    nameObj.familyAr || nameObj.familyName,
  ];
  return (
    parts.filter(Boolean).join(" ").trim() ||
    nameObj.en ||
    nameObj.englishName ||
    "غير محدد"
  );
};

// دالة مساعدة لتنسيق التاريخ
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// دالة مساعدة لإخفاء رقم الهوية جزئياً
const maskId = (id) => {
  if (!id || id.length < 6) return id || "—";
  return id.slice(0, 3) + "****" + id.slice(-3);
};

// دالة مساعدة لحساب الوقت المتبقي للوكالة
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

const ClientFileView = ({ clientId, onBack }) => {
  // ==========================================
  // حالات التعديل لتاب البيانات الأساسية
  // ==========================================
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // 💡 متغيرات وحالات الذكاء الاصطناعي للوكيل في التعديل
  const repIdRef = useRef(null);
  const repAuthRef = useRef(null);
  const [isAnalyzingRepId, setIsAnalyzingRepId] = useState(false);
  const [isAnalyzingRepAuth, setIsAnalyzingRepAuth] = useState(false);

  // تفعيل التعديل وتعبئة البيانات من الداتابيز
  const handleStartEdit = () => {
    const nameDetails = client.name?.details || client.name || {};

    setEditFormData({
      type: client.type || "فرد سعودي",
      idNumber: client.idNumber || client.identification?.idNumber || "",
      mobile: client.mobile || client.contact?.mobile || "",
      email: client.email || client.contact?.email || "",

      firstAr: nameDetails.firstAr || nameDetails.firstName || "",
      firstEn: nameDetails.firstEn || nameDetails.englishName || "",
      fatherAr: nameDetails.fatherAr || nameDetails.fatherName || "",
      fatherEn: nameDetails.fatherEn || "",
      grandAr: nameDetails.grandAr || nameDetails.grandFatherName || "",
      grandEn: nameDetails.grandEn || "",
      familyAr: nameDetails.familyAr || nameDetails.familyName || "",
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

      // 💡 بيانات الوكيل المضافة للتعديل
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

  // ==========================================
  // دالة الحفظ للبيانات الأساسية (Mutation)
  // ==========================================
  const updateClientMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.put(`/clients/${clientId}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("تم تحديث البيانات الأساسية بنجاح!");
      setIsEditingBasicInfo(false);
      queryClient.invalidateQueries(["client", clientId]);
      queryClient.invalidateQueries(["clients"]); // لتحديث الجدول الخارجي
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "فشل تحديث البيانات");
    },
  });

  const handleSaveBasicInfo = () => {
    // 👈 تجميع الاسم بشكل آمن
    const officialNameAr =
      `${editFormData.firstAr} ${editFormData.fatherAr} ${editFormData.grandAr || ""} ${editFormData.familyAr}`
        .replace(/\s+/g, " ")
        .trim();
    const officialNameEn =
      `${editFormData.firstEn} ${editFormData.fatherEn} ${editFormData.grandEn || ""} ${editFormData.familyEn}`
        .replace(/\s+/g, " ")
        .trim();

    // حماية إضافية: إذا كان الاسم ممسوحاً، نستخدم الاسم القديم
    const finalAr =
      officialNameAr ||
      (typeof client.name === "string" ? client.name : client.name?.ar) ||
      "غير محدد";

    // تحديث أسلوب التعامل
    // 💡 تحديث بيانات الوكيل بشكل كامل بناءً على التعديلات
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
        // 👈 إعادة حفظ التفاصيل داخل كائن details لتطابق طريقة الإنشاء
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

  const queryClient = useQueryClient();
  // ==========================================
  // States
  // ==========================================
  const [activeTab, setActiveTab] = useState("summary");
  const [isPhotoBlurred, setIsPhotoBlurred] = useState(false);
  const [isIdMasked, setIsIdMasked] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    name: "",
    notes: "",
  });

  // ==========================================
  // Fetch Client Data
  // ==========================================
  const {
    data: client,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => getClientById(clientId),
    enabled: !!clientId,
  });

  // ==========================================
  // دوال الرفع والمعاينة والتحميل (تم التصحيح)
  // ==========================================
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

        // 👈 التعديل هنا: استخدام الكائن { queryKey: ... } ليتوافق مع React Query v5
        queryClient.invalidateQueries({ queryKey: ["client", clientId] });

        // الآن ستعمل دالة الإغلاق بنجاح
        closeUploadModal();
      } else {
        toast.error(data.message || "حدث خطأ غير متوقع");
      }
    },
    onError: (error) => {
      console.error("Upload Error:", error); // مفيد لاكتشاف الأخطاء في الكونسول
      toast.error(
        error.response?.data?.message ||
          "تعذر رفع الوثيقة. تأكد من إعدادات الباك إند.",
      );
    },
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
    // إذا حذفت حقل notes من الكنترولر، يمكنك عدم إرساله، أو إرساله ولا بأس
    formData.append("notes", uploadForm.notes);

    uploadDocMutation.mutate(formData);
  };

  // 👈 دالة فتح/معاينة الملف
  const handleViewDocument = (filePath) => {
    if (!filePath) return toast.error("مسار الملف غير متوفر");
    // بناء الرابط الكامل للملف (يجب أن يكون الباك إند يوفر مجلد uploads كـ static)
    const fileUrl = `${api.defaults.baseURL.replace("/api", "")}${filePath}`;
    window.open(fileUrl, "_blank");
  };

  // 👈 دالة تحميل الملف
  const handleDownloadDocument = async (filePath, fileName) => {
    if (!filePath) return toast.error("مسار الملف غير متوفر");

    const fileUrl = `${api.defaults.baseURL.replace("/api", "")}${filePath}`;
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // استخراج امتداد الملف من المسار الأصلي لإضافته للاسم
      const ext = filePath.split(".").pop();
      link.setAttribute("download", `${fileName}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      toast.error("فشل تحميل الملف");
    }
  };

  // 💡 دالة رفع وثائق الممثل واستخراجها بالذكاء الاصطناعي أثناء التعديل
  const handleRepDocUpload = (e, type, isAuthDoc) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    if (isAuthDoc) setIsAnalyzingRepAuth(true);
    else setIsAnalyzingRepId(true);

    reader.onload = async () => {
      const base64Data = reader.result;

      // 1. رفع المرفق فوراً لملف العميل في الخلفية
      const docFormData = new FormData();
      docFormData.append("file", file);
      docFormData.append("name", type);
      uploadDocMutation.mutate(docFormData);

      // 2. تحليل المرفق
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

  // ==========================================
  // Tabs Config
  // ==========================================
  const TABS = [
    { id: "summary", label: "ملخص", icon: User },
    { id: "basic", label: "البيانات الأساسية", icon: FileText },
    { id: "contact", label: "العنوان والتواصل", icon: MapPin },
    {
      id: "docs",
      label: "وثائق العميل",
      icon: FileCheck,
      badge: client?._count?.attachments || "0",
      badgeColor: "bg-slate-500",
    },
    { id: "tax", label: "الزكاة/الضريبة", icon: Receipt },
    {
      id: "transactions",
      label: "معاملات العميل",
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
    { id: "audit", label: "التدقيق/الزمن", icon: History },
    { id: "reports", label: "التقارير", icon: BarChart3 },
    {
      id: "properties",
      label: "ملكيات العميل",
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

  // Helper
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

  // شاشات التحميل والخطأ
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

  // ==========================================
  // 👈 نافذة رفع الوثيقة (Upload Modal)
  // ==========================================
  const renderUploadModal = () => {
    if (!isUploadModalOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        dir="rtl"
      >
        <div className="bg-white rounded-2xl p-6 w-full max-w-[480px] shadow-2xl animate-in zoom-in-95">
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
                  <div className="text-[10px] text-violet-500 mt-1">
                    {(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-slate-600">
                    اضغط هنا لاختيار ملف
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    PDF, JPG, PNG (بحد أقصى 5MB)
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
                placeholder="مثال: صورة الهوية، السجل التجاري..."
                value={uploadForm.name}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, name: e.target.value })
                }
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ملاحظات (اختياري)
              </label>
              <textarea
                rows="3"
                placeholder="أي ملاحظات حول هذه الوثيقة..."
                value={uploadForm.notes}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, notes: e.target.value })
                }
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200 resize-none"
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
              حفظ ورفع الوثيقة
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

  // ==========================================
  // Render Tab Contents
  // ==========================================

  const renderSummaryTab = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h3 className="text-lg font-bold text-slate-800">ملخص العميل</h3>

      {/* بطاقة الملخص السريع */}
      <div className="flex flex-col md:flex-row gap-5 p-5 bg-slate-50 border border-slate-200 rounded-xl items-center">
        <div className="relative">
          <div
            className={`w-20 h-24 rounded-xl overflow-hidden border-2 border-blue-500/20 bg-indigo-50 flex items-center justify-center transition-all ${isPhotoBlurred ? "blur-md" : ""}`}
          >
            <User className="w-9 h-9 text-indigo-400" />
          </div>
          <button
            onClick={() => setIsPhotoBlurred(!isPhotoBlurred)}
            className="absolute -top-1 -left-1 p-1 bg-slate-400 text-white rounded-md border-2 border-white flex items-center gap-1 hover:bg-slate-500"
          >
            <ShieldCheck className="w-3 h-3" />
          </button>
        </div>
        <div className="flex-1 text-center md:text-right">
          <div className="text-xl font-bold text-slate-800 mb-1">
            {clientName}
          </div>
          <div className="text-sm text-slate-500 dir-ltr text-left md:text-right mb-2">
            {englishName || "—"}
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <div className="text-xs text-slate-500">
              رقم الهوية:{" "}
              <strong className="text-blue-800 font-mono">
                {isIdMasked
                  ? maskId(client.identification?.idNumber)
                  : client.identification?.idNumber || "—"}
              </strong>
              <button
                onClick={() => setIsIdMasked(!isIdMasked)}
                className="ml-2 text-blue-500 hover:text-blue-700 inline-block"
              >
                <Eye className="w-3 h-3 inline" />
              </button>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                {client.type || "غير محدد"}
              </span>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                {client.nationality || "سعودي"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold text-blue-800">المعاملات</span>
          </div>
          <div className="text-3xl font-black text-blue-800">
            {client._count?.transactions || 0}
          </div>
          <div className="text-xs text-blue-400 mt-1">إجمالي المعاملات</div>
        </div>
        <div className="p-5 bg-green-50 border border-green-100 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm font-bold text-green-800">التحصيل</span>
          </div>
          <div className="text-3xl font-black text-green-700">
            {(client.totalFees || 0).toLocaleString()}
          </div>
          <div className="text-xs text-green-500 mt-1">ريال سعودي</div>
        </div>
        <div className="p-5 bg-amber-50 border border-amber-100 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileCheck className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-bold text-amber-800">الوثائق</span>
          </div>
          <div className="text-3xl font-black text-amber-700">
            {client._count?.attachments || 0}
          </div>
          <div className="text-xs text-amber-500 mt-1">مستند مرفوع</div>
        </div>
        <div className="p-5 bg-pink-50 border border-pink-100 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="w-5 h-5 text-pink-600" />
            <span className="text-sm font-bold text-pink-800">التقييم</span>
          </div>
          <div className="text-3xl font-black text-pink-700">
            {client.grade || "-"}
          </div>
          <div className="text-xs text-pink-500 mt-1">مستوى العميل</div>
        </div>
        <div className="p-5 bg-cyan-50 border border-cyan-100 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Receipt className="w-5 h-5 text-cyan-600" />
            <span className="text-sm font-bold text-cyan-800">العروض</span>
          </div>
          <div className="text-3xl font-black text-cyan-700">
            {client._count?.quotations || 0}
          </div>
          <div className="text-xs text-cyan-500 mt-1">عروض أسعار</div>
        </div>
      </div>

      {/* معلومات إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl">
          <h4 className="font-bold text-slate-700 mb-3">معلومات الاتصال</h4>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />{" "}
              <span dir="ltr">{client.contact?.mobile || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />{" "}
              {client.contact?.email || "—"}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />{" "}
              {client.address?.city || ""}{" "}
              {client.address?.district ? `- ${client.address.district}` : ""}
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl">
          <h4 className="font-bold text-slate-700 mb-3">الحالة والنشاط</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">الحالة:</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${client.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {client.isActive ? "نشط" : "غير نشط"}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">تاريخ الإضافة:</span>
              <span className="font-bold text-slate-800">
                {formatDate(client.createdAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">تم الإضافة بواسطة:</span>
              <span className="font-bold text-slate-800">النظام</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // تاب البيانات الأساسية (تفاعلي وحقيقي)
  // ==========================================
  const renderBasicInfoTab = () => {
    const rep = client.representative;
    const hasRep = rep && rep.hasRepresentative;
    const isInvestorActive = isEditingBasicInfo
      ? editFormData.isInvestor
      : !!client.company || !!client.taxNumber;

    return (
      <div className="animate-in fade-in duration-300 space-y-6">
        {/* هيدر التاب مع زر التعديل/الحفظ */}
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">
            البيانات الأساسية
          </h3>
          {isEditingBasicInfo ? (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditingBasicInfo(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveBasicInfo}
                disabled={updateClientMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50"
              >
                {updateClientMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                حفظ التعديلات
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
            >
              <SquarePen className="w-4 h-4" /> تعديل البيانات
            </button>
          )}
        </div>

        <div>
          {/* شبكة البيانات الأساسية 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              className={`p-4 rounded-xl border shadow-sm ${isEditingBasicInfo ? "bg-slate-100 border-slate-200 opacity-60" : "bg-slate-50 border-slate-100"}`}
            >
              <div className="text-xs text-slate-500 font-bold mb-2 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-400" /> كود العميل
              </div>
              <p className="text-sm text-slate-800 font-black font-mono">
                {client.clientCode}
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border shadow-sm ${isEditingBasicInfo ? "bg-white border-blue-200 ring-2 ring-blue-50" : "bg-slate-50 border-slate-100"}`}
            >
              <div className="text-xs text-slate-500 font-bold mb-2 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-400" /> نوع العميل
              </div>
              {isEditingBasicInfo ? (
                <select
                  value={editFormData.type}
                  onChange={(e) => handleEditChange("type", e.target.value)}
                  className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent"
                >
                  <option value="فرد سعودي">فرد سعودي</option>
                  <option value="فرد غير سعودي">فرد غير سعودي</option>
                  <option value="شركة">شركة / مؤسسة</option>
                  <option value="جهة حكومية">جهة حكومية</option>
                  <option value="ورثة">ورثة</option>
                </select>
              ) : (
                <p className="text-sm text-slate-800 font-bold">
                  {client.type || "—"}
                </p>
              )}
            </div>

            <div
              className={`p-4 rounded-xl border shadow-sm ${isEditingBasicInfo ? "bg-white border-blue-200 ring-2 ring-blue-50" : "bg-slate-50 border-slate-100"}`}
            >
              <div className="text-xs text-slate-500 font-bold mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400" /> رقم الهوية/السجل
              </div>
              {isEditingBasicInfo ? (
                <input
                  type="text"
                  value={editFormData.idNumber}
                  onChange={(e) => handleEditChange("idNumber", e.target.value)}
                  className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent font-mono dir-ltr text-right"
                  placeholder="رقم الهوية"
                />
              ) : (
                <p className="text-sm text-slate-800 font-bold font-mono">
                  {client.idNumber || client.identification?.idNumber || "—"}
                </p>
              )}
            </div>

            <div
              className={`p-4 rounded-xl border shadow-sm ${isEditingBasicInfo ? "bg-white border-blue-200 ring-2 ring-blue-50" : "bg-slate-50 border-slate-100"}`}
            >
              <div className="text-xs text-slate-500 font-bold mb-2 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-green-400" /> رقم الجوال
              </div>
              {isEditingBasicInfo ? (
                <input
                  type="tel"
                  value={editFormData.mobile}
                  onChange={(e) => handleEditChange("mobile", e.target.value)}
                  className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent font-mono dir-ltr text-right"
                  placeholder="05XXXXXXXX"
                />
              ) : (
                <p className="text-sm text-slate-800 font-bold font-mono dir-ltr text-left">
                  {client.mobile || client.contact?.mobile || "—"}
                </p>
              )}
            </div>

            <div
              className={`p-4 rounded-xl border shadow-sm ${isEditingBasicInfo ? "bg-white border-blue-200 ring-2 ring-blue-50" : "bg-slate-50 border-slate-100"}`}
            >
              <div className="text-xs text-slate-500 font-bold mb-2 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-red-400" /> البريد الإلكتروني
              </div>
              {isEditingBasicInfo ? (
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => handleEditChange("email", e.target.value)}
                  className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent dir-ltr text-right"
                  placeholder="email@example.com"
                />
              ) : (
                <p className="text-sm text-slate-800 font-bold font-mono dir-ltr text-left">
                  {client.email || client.contact?.email || "—"}
                </p>
              )}
            </div>
          </div>

          {/* تفاصيل الاسم (عربي / انجليزي) */}
          {/* تفاصيل الاسم (عربي / انجليزي) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div
              className={`p-4 rounded-xl border ${isEditingBasicInfo ? "bg-white border-blue-200 ring-1 ring-blue-50" : "bg-slate-50 border-slate-100"}`}
            >
              <div className="text-[11px] text-slate-400 font-bold mb-1">
                الاسم الأول (عربي)
              </div>
              {isEditingBasicInfo ? (
                <input
                  type="text"
                  value={editFormData.firstAr}
                  onChange={(e) => handleEditChange("firstAr", e.target.value)}
                  className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent"
                />
              ) : (
                <p className="text-sm text-slate-800 font-bold">
                  {client.name?.details?.firstAr ||
                    client.name?.firstAr ||
                    client.name?.firstName ||
                    "—"}
                </p>
              )}
            </div>
            <div
              className={`p-4 rounded-xl border ${isEditingBasicInfo ? "bg-white border-blue-200 ring-1 ring-blue-50" : "bg-slate-50 border-slate-100"}`}
            >
              <div className="text-[11px] text-slate-400 font-bold mb-1">
                الاسم الأول (English)
              </div>
              {isEditingBasicInfo ? (
                <input
                  type="text"
                  value={editFormData.firstEn}
                  onChange={(e) => handleEditChange("firstEn", e.target.value)}
                  className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent dir-ltr text-left"
                />
              ) : (
                <p className="text-sm text-slate-800 font-bold dir-ltr text-left">
                  {client.name?.details?.firstEn ||
                    client.name?.firstEn ||
                    client.name?.englishName ||
                    "—"}
                </p>
              )}
            </div>
            <div
              className={`p-4 rounded-xl border ${isEditingBasicInfo ? "bg-white border-blue-200 ring-1 ring-blue-50" : "bg-slate-50 border-slate-100"}`}
            >
              <div className="text-[11px] text-slate-400 font-bold mb-1">
                اسم العائلة (عربي)
              </div>
              {isEditingBasicInfo ? (
                <input
                  type="text"
                  value={editFormData.familyAr}
                  onChange={(e) => handleEditChange("familyAr", e.target.value)}
                  className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent"
                />
              ) : (
                <p className="text-sm text-slate-800 font-bold">
                  {client.name?.details?.familyAr ||
                    client.name?.familyAr ||
                    client.name?.familyName ||
                    "—"}
                </p>
              )}
            </div>
            <div
              className={`p-4 rounded-xl border ${isEditingBasicInfo ? "bg-white border-blue-200 ring-1 ring-blue-50" : "bg-slate-50 border-slate-100"}`}
            >
              <div className="text-[11px] text-slate-400 font-bold mb-1">
                اسم العائلة (English)
              </div>
              {isEditingBasicInfo ? (
                <input
                  type="text"
                  value={editFormData.familyEn}
                  onChange={(e) => handleEditChange("familyEn", e.target.value)}
                  className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent dir-ltr text-left"
                />
              ) : (
                <p className="text-sm text-slate-800 font-bold dir-ltr text-left">
                  {client.name?.details?.familyEn ||
                    client.name?.familyEn ||
                    "—"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 👈 لقب العميل وأسلوب التعامل */}
        <div
          className={`p-5 rounded-2xl border transition-colors ${isEditingBasicInfo ? "bg-blue-50 border-blue-300 ring-2 ring-blue-100" : "bg-blue-50/50 border-blue-100"}`}
        >
          <div className="flex items-center gap-2 mb-4 text-blue-800 font-bold">
            <Shield className="w-5 h-5" /> لقب العميل وأسلوب التعامل
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-bold text-slate-600 mb-2">
                اللقب الافتراضي في عروض الأسعار:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "تلقائي",
                  "المواطن",
                  "المواطنة",
                  "السادة",
                  "صاحب السمو الأمير",
                  "مخصص",
                ].map((title, i) => {
                  const isSelected = isEditingBasicInfo
                    ? editFormData.defaultTitle === title
                    : client.clientTitle === title ||
                      (client.clientTitle == null && title === "تلقائي");
                  return (
                    <span
                      key={i}
                      onClick={() =>
                        isEditingBasicInfo &&
                        handleEditChange("defaultTitle", title)
                      }
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors ${isSelected ? "bg-blue-600 text-white border border-blue-600 shadow-sm" : "bg-white text-slate-600 border border-slate-200"} ${isEditingBasicInfo ? "cursor-pointer hover:bg-blue-50" : "opacity-80"}`}
                    >
                      {title}
                    </span>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-600 mb-2">
                أسلوب التعامل مع المكتب:
              </div>
              <div className="flex gap-2">
                {["عن نفسه", "مفوض", "وكيل"].map((method) => {
                  const isSelected = isEditingBasicInfo
                    ? editFormData.handlingMethod === method
                    : method === "عن نفسه"
                      ? !hasRep
                      : hasRep && rep?.type === method;
                  return (
                    <span
                      key={method}
                      onClick={() =>
                        isEditingBasicInfo &&
                        handleEditChange("handlingMethod", method)
                      }
                      className={`px-4 py-2 text-[11px] font-bold rounded-xl transition-colors ${isSelected ? "bg-amber-600 text-white border border-amber-600 shadow-sm" : "bg-white text-slate-600 border border-slate-200"} ${isEditingBasicInfo ? "cursor-pointer hover:bg-amber-50" : "opacity-80"}`}
                    >
                      {method === "عن نفسه" ? "عن نفسه" : `عن طريق ${method}`}
                    </span>
                  );
                })}
              </div>

              {/* 💡 بيانات المفوض/الوكيل في حالة العرض */}
              {hasRep && !isEditingBasicInfo && (
                <div className="mt-3 p-3 bg-purple-50/50 rounded-xl border border-purple-200 animate-in fade-in">
                  <div className="font-bold text-purple-700 mb-2 text-xs flex items-center gap-1.5">
                    <UsersRound className="w-4 h-4" /> بيانات {rep.type}{" "}
                    الافتراضي
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px]">
                    <div>
                      <span className="text-slate-500">الاسم:</span>{" "}
                      <strong className="text-slate-800">
                        {rep.name || "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">الهوية:</span>{" "}
                      <strong className="text-slate-800 font-mono">
                        {rep.idNumber || "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">الجوال:</span>{" "}
                      <strong className="text-slate-800 font-mono dir-ltr">
                        {rep.mobile || "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">رقم المستند:</span>{" "}
                      <strong className="text-purple-700 font-mono">
                        {rep.authNumber || "—"}
                      </strong>
                    </div>
                    {rep.authExpiry && (
                      <div className="col-span-2 mt-1">
                        <span className="text-slate-500">صلاحية التوثيق:</span>{" "}
                        <strong className="font-mono">
                          {formatDate(rep.authExpiry)}
                        </strong>
                      </div>
                    )}
                    {rep.powersScope && (
                      <div className="col-span-2 mt-1">
                        <span className="text-slate-500">نطاق الصلاحيات:</span>{" "}
                        <p className="text-slate-700 mt-1 p-2 bg-white rounded border border-purple-100">
                          {rep.powersScope}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 💡 بيانات المفوض/الوكيل في حالة التعديل (تصميم تفاعلي مطابق لإنشاء العميل) */}
              {isEditingBasicInfo &&
                editFormData.handlingMethod !== "عن نفسه" && (
                  <div className="mt-4 bg-white rounded-xl border-2 border-blue-200 shadow-sm overflow-hidden animate-in slide-in-from-top-2">
                    <div className="w-full flex items-center justify-between p-3.5 bg-gradient-to-l from-blue-50 to-indigo-50 border-b border-blue-200">
                      <div className="flex items-center gap-2.5">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <div className="text-sm font-bold text-blue-900">
                          تعديل بيانات {editFormData.handlingMethod}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-6">
                      {/* قسم مستند التفويض/الوكالة واستخراج الـ AI */}
                      <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                          <div className="flex items-center gap-2 text-sm font-bold text-indigo-900">
                            <FileCheck className="w-4 h-4" /> وثيقة{" "}
                            {editFormData.handlingMethod === "وكيل"
                              ? "الوكالة"
                              : "التفويض"}
                          </div>
                          <button
                            onClick={() => repAuthRef.current?.click()}
                            disabled={isAnalyzingRepAuth}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-70"
                          >
                            {isAnalyzingRepAuth ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ScanSearch className="w-3.5 h-3.5" />
                            )}
                            استخراج بالـ AI
                          </button>
                          <input
                            type="file"
                            ref={repAuthRef}
                            className="hidden"
                            accept=".pdf,image/*"
                            onChange={(e) =>
                              handleRepDocUpload(
                                e,
                                `مستند ${editFormData.handlingMethod}`,
                                true,
                              )
                            }
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">
                              رقم المستند *
                            </label>
                            <input
                              type="text"
                              value={editFormData.repAuthNumber}
                              onChange={(e) =>
                                handleEditChange(
                                  "repAuthNumber",
                                  e.target.value,
                                )
                              }
                              className="w-full h-10 px-3 text-sm border-2 border-slate-200 rounded-lg outline-none font-mono focus:border-indigo-500 bg-white"
                              dir="ltr"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">
                              تاريخ الانتهاء (ميلادي) *
                            </label>
                            <div className="flex gap-2 h-10">
                              <input
                                type="date"
                                value={editFormData.repAuthExpiry}
                                onChange={(e) =>
                                  handleEditChange(
                                    "repAuthExpiry",
                                    e.target.value,
                                  )
                                }
                                className="flex-1 px-3 text-sm border-2 border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white"
                                dir="ltr"
                              />
                              {getRemainingTime(editFormData.repAuthExpiry) && (
                                <div
                                  className={`px-3 flex items-center justify-center gap-1.5 rounded-lg border-2 text-[10px] font-bold whitespace-nowrap ${getRemainingTime(editFormData.repAuthExpiry).color}`}
                                >
                                  {getRemainingTime(editFormData.repAuthExpiry)
                                    .expired ? (
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5" />
                                  )}
                                  {
                                    getRemainingTime(editFormData.repAuthExpiry)
                                      .text
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">
                              نطاق الصلاحيات والبنود
                            </label>
                            <textarea
                              value={editFormData.repPowersScope}
                              onChange={(e) =>
                                handleEditChange(
                                  "repPowersScope",
                                  e.target.value,
                                )
                              }
                              className="w-full h-20 px-3 py-2 text-xs border-2 border-slate-200 rounded-lg outline-none resize-none focus:border-indigo-500 leading-relaxed bg-white"
                              placeholder="أدخل ملخص الصلاحيات..."
                            ></textarea>
                          </div>
                        </div>
                      </div>

                      {/* قسم بيانات الشخص وهوية AI */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                            <User className="w-4 h-4 text-slate-500" /> البيانات
                            الشخصية للـ{editFormData.handlingMethod}
                          </div>
                          <button
                            onClick={() => repIdRef.current?.click()}
                            disabled={isAnalyzingRepId}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all disabled:opacity-70 shadow-sm"
                          >
                            {isAnalyzingRepId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ScanSearch className="w-3.5 h-3.5" />
                            )}
                            قراءة الهوية (AI)
                          </button>
                          <input
                            type="file"
                            ref={repIdRef}
                            className="hidden"
                            accept=".pdf,image/*"
                            onChange={(e) =>
                              handleRepDocUpload(
                                e,
                                `هوية ${editFormData.handlingMethod}`,
                                false,
                              )
                            }
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 md:col-span-1">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">
                              الاسم الكامل *
                            </label>
                            <input
                              type="text"
                              value={editFormData.repName}
                              onChange={(e) =>
                                handleEditChange("repName", e.target.value)
                              }
                              className="w-full h-10 px-3 text-sm border-2 border-slate-200 rounded-lg focus:border-blue-500 outline-none bg-white"
                            />
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">
                              رقم الهوية *
                            </label>
                            <input
                              type="text"
                              value={editFormData.repIdNumber}
                              onChange={(e) =>
                                handleEditChange("repIdNumber", e.target.value)
                              }
                              className="w-full h-10 px-3 text-sm border-2 border-slate-200 rounded-lg focus:border-blue-500 outline-none font-mono bg-white"
                              dir="ltr"
                            />
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">
                              انتهاء الهوية
                            </label>
                            <input
                              type="date"
                              value={editFormData.repIdExpiry}
                              onChange={(e) =>
                                handleEditChange("repIdExpiry", e.target.value)
                              }
                              className="w-full h-10 px-3 text-sm border-2 border-slate-200 rounded-lg focus:border-blue-500 outline-none bg-white"
                              dir="ltr"
                            />
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">
                              رقم الجوال
                            </label>
                            <input
                              type="tel"
                              value={editFormData.repMobile}
                              onChange={(e) =>
                                handleEditChange("repMobile", e.target.value)
                              }
                              className="w-full h-10 px-3 text-sm border-2 border-slate-200 rounded-lg focus:border-blue-500 outline-none font-mono bg-white"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* 👈 صفة المستثمر / الشركات */}
        <div className="mt-6">
          <div
            className={`flex items-center gap-3 mb-4 p-4 rounded-xl border transition-colors ${isInvestorActive ? "bg-emerald-50 border-emerald-400" : "bg-slate-50 border-slate-200"}`}
          >
            <TrendingUp
              className={`w-6 h-6 ${isInvestorActive ? "text-emerald-600" : "text-slate-400"}`}
            />
            <div className="flex-1">
              <div
                className={`text-sm font-bold ${isInvestorActive ? "text-emerald-700" : "text-slate-500"}`}
              >
                الشركات والجهات / صفة مستثمر
              </div>
              <div className="text-[11px] text-slate-500">
                بيانات السجل التجاري، الرقم الضريبي، والجهات الحكومية
              </div>
            </div>
            {isEditingBasicInfo && (
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-slate-500 font-bold">
                  تفعيل البيانات
                </span>
                <input
                  type="checkbox"
                  checked={editFormData.isInvestor}
                  onChange={(e) =>
                    handleEditChange("isInvestor", e.target.checked)
                  }
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </label>
            )}
          </div>

          {isInvestorActive && (
            <div
              className={`p-5 rounded-xl border shadow-sm transition-colors ${isEditingBasicInfo ? "bg-emerald-50/30 border-emerald-200 ring-2 ring-emerald-50" : "bg-white border-slate-200"}`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-indigo-500" /> اسم
                    الجهة / الشركة
                  </div>
                  {isEditingBasicInfo ? (
                    <input
                      type="text"
                      value={editFormData.company}
                      onChange={(e) =>
                        handleEditChange("company", e.target.value)
                      }
                      className="w-full text-sm font-bold text-slate-800 outline-none border-b border-slate-300 focus:border-indigo-500 pb-1"
                      placeholder="اسم الشركة"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-800">
                      {client.company || "—"}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold mb-1.5 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-500" /> الرقم
                    الضريبي
                  </div>
                  {isEditingBasicInfo ? (
                    <input
                      type="text"
                      value={editFormData.taxNumber}
                      onChange={(e) =>
                        handleEditChange("taxNumber", e.target.value)
                      }
                      className="w-full text-sm font-bold text-slate-800 outline-none border-b border-slate-300 focus:border-indigo-500 font-mono pb-1"
                      placeholder="300XXXXXXX"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-800 font-mono">
                      {client.taxNumber || "—"}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" /> المهنة
                    / النشاط
                  </div>
                  {isEditingBasicInfo ? (
                    <input
                      type="text"
                      value={editFormData.occupation}
                      onChange={(e) =>
                        handleEditChange("occupation", e.target.value)
                      }
                      className="w-full text-sm font-bold text-slate-800 outline-none border-b border-slate-300 focus:border-emerald-500 pb-1"
                      placeholder="نشاط الشركة"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-800">
                      {client.occupation || "—"}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-bold mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" /> الجنسية
                    (للمؤسسين)
                  </div>
                  {isEditingBasicInfo ? (
                    <input
                      type="text"
                      value={editFormData.nationality}
                      onChange={(e) =>
                        handleEditChange("nationality", e.target.value)
                      }
                      className="w-full text-sm font-bold text-slate-800 outline-none border-b border-slate-300 focus:border-amber-500 pb-1"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-800">
                      {client.nationality || "—"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContactTab = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* بطاقة التواصل الأساسية */}
        <div className="flex-1 p-5 bg-slate-50 border-2 border-emerald-500 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <h3 className="font-bold">بطاقة التواصل الأساسية</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                <Phone className="w-3 h-3 text-blue-500" /> الجوال الرئيسي
              </span>
              <span className="font-bold dir-ltr text-left">
                {client.contact?.mobile || "—"}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 text-green-500" /> واتساب
                </span>
                <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  {client.contact?.whatsapp ? "مسجل" : "غير مسجل"}
                </span>
              </div>
              <span className="font-bold dir-ltr text-left">
                {client.contact?.whatsapp || "—"}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                <Mail className="w-3 h-3 text-amber-500" /> البريد الإلكتروني
              </span>
              <span className="font-bold text-sm">
                {client.contact?.email || "—"}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                <PhoneCall className="w-3 h-3 text-slate-400" /> رقم إضافي
              </span>
              <span className="font-bold text-sm dir-ltr text-left">
                {client.contact?.additionalPhone || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* أزرار سريعة */}
        <div className="w-full lg:w-48 flex flex-col gap-2">
          <button
            onClick={() => openWhatsApp(client.contact?.mobile)}
            className="flex-1 bg-green-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" /> مراسلة واتساب
          </button>
          <a
            href={`tel:${client.contact?.mobile}`}
            className="flex-1 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 shadow-sm"
          >
            <PhoneCall className="w-4 h-4" /> اتصال مباشر
          </a>
          <a
            href={`mailto:${client.contact?.email}`}
            className="flex-1 bg-amber-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-700 shadow-sm"
          >
            <Mail className="w-4 h-4" /> إرسال بريد
          </a>
        </div>
      </div>

      {/* العنوان الوطني */}
      <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
        <h4 className="flex items-center gap-2 text-blue-800 font-bold mb-4">
          <MapPin className="w-5 h-5" /> العنوان الوطني
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "المدينة", v: client.address?.city || "—", i: Building },
            { l: "الحي", v: client.address?.district || "—", i: Home },
            { l: "الشارع", v: client.address?.street || "—", i: MapPin },
            {
              l: "رقم المبنى",
              v: client.address?.buildingNo || "—",
              i: Building,
            },
            { l: "رقم الوحدة", v: client.address?.unitNo || "—", i: Home },
            {
              l: "الرمز البريدي",
              v: client.address?.zipCode || "—",
              i: MapPin,
            },
            {
              l: "الرقم الإضافي",
              v: client.address?.additionalNo || "—",
              i: Building,
            },
            {
              l: "الرمز المختصر",
              v: client.address?.shortCodeEn || "—",
              i: Home,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-3 rounded-lg border border-slate-200"
            >
              <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mb-1">
                <item.i className="w-3 h-3 text-blue-400" /> {item.l}
              </div>
              <div className="font-bold text-sm text-slate-800">{item.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTransactionsTab = () => (
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
                  <td className="p-3 font-mono font-bold text-blue-800">
                    {tr.code || tr.id.substring(0, 8)}
                  </td>
                  <td className="p-3">{tr.serviceType || "—"}</td>
                  <td className="p-3">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                      {tr.status || "—"}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold">
                    {(tr.totalAmount || 0).toLocaleString()}
                  </td>
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
                <td colSpan="7" className="p-8 text-center text-slate-500">
                  لا توجد معاملات مسجلة لهذا العميل.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ==========================================
  // 👈 تاب الوثائق (تم التحديث ليقرأ من الداتابيز ويرفع)
  // ==========================================
  const renderDocsTab = () => (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-violet-500" /> وثائق العميل
        </h3>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1 hover:from-violet-700 hover:to-purple-700 transition-all"
        >
          <Upload className="w-3 h-3" /> رفع وثيقة
        </button>
      </div>

      {client.attachments?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {client.attachments.map((doc, idx) => (
            <div
              key={doc.id || idx}
              className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-violet-300 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div
                    className="font-bold text-sm text-slate-700 truncate max-w-[150px]"
                    title={doc.fileName || doc.name}
                  >
                    {doc.fileName || doc.name || "مستند"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {formatDate(doc.createdAt)}
                  </div>
                  {doc.notes && (
                    <div
                      className="text-[9px] text-slate-500 mt-1 truncate max-w-[150px]"
                      title={doc.notes}
                    >
                      ملاحظة: {doc.notes}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {/* 👈 زر المعاينة */}
                <button
                  onClick={() => handleViewDocument(doc.filePath)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="عرض"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {/* 👈 زر التنزيل */}
                <button
                  onClick={() =>
                    handleDownloadDocument(
                      doc.filePath,
                      doc.fileName || "document",
                    )
                  }
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="تحميل"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 text-center py-12 bg-white border border-slate-200 rounded-xl shadow-sm">
          <FileStack className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <div className="font-bold text-slate-600 text-lg">
            لا توجد وثائق مرفوعة
          </div>
          <div className="text-sm text-slate-400 mt-1">
            قم برفع الهوية، السجل التجاري، أو أي مستندات أخرى للعميل
          </div>
        </div>
      )}
    </div>
  );

  const renderPropertiesTab = () => (
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
                  <td className="p-3 font-mono font-bold text-purple-700">
                    {prop.code || `PRO-${idx + 1}`}
                  </td>
                  <td className="p-3 font-mono text-slate-600">
                    {prop.deedNumber || "—"}
                  </td>
                  <td className="p-3">
                    {prop.city || "—"}{" "}
                    {prop.district ? `/ ${prop.district}` : ""}
                  </td>
                  <td className="p-3 font-mono font-bold">
                    {prop.area || "—"}
                  </td>
                  <td className="p-3 text-center">
                    <button className="text-purple-600 bg-purple-50 px-3 py-1 rounded text-xs font-bold hover:bg-purple-100">
                      عرض التفاصيل
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">
                  لا توجد ملكيات أو صكوك مسجلة لهذا العميل.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ==========================================
  // Main Layout Render
  // ==========================================
  return (
    <div
      className="flex flex-col h-full bg-slate-100 p-4 md:p-6 custom-scrollbar overflow-y-auto"
      dir="rtl"
    >
      {/* Header (Sticky) */}
      <div className="sticky top-0 z-50 bg-white border border-slate-200 rounded-xl shadow-sm mb-4">
        {/* Top Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {/* زر العودة */}
            <button
              onClick={onBack}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> العودة
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <div className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-mono font-bold text-sm tracking-wider flex items-center gap-2">
              {client.clientCode}
              <button
                onClick={() => handleCopy(client.clientCode)}
                className="text-blue-200 hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold whitespace-nowrap">
              {client.type || "عميل"}
            </span>

            <div className="hidden md:flex items-center gap-3 border-r border-slate-200 pr-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 text-indigo-600">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div
                  className="font-bold text-slate-800 text-sm max-w-[200px] truncate"
                  title={clientName}
                >
                  {clientName}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <button
                onClick={() => openWhatsApp(client.contact?.mobile)}
                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                title="واتساب"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <a
                href={`tel:${client.contact?.mobile}`}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="اتصال"
              >
                <PhoneCall className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 px-2 overflow-x-auto custom-scrollbar bg-slate-50/50 rounded-b-xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] text-white ${tab.badgeColor}`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-y-auto custom-scrollbar min-h-[500px]">
        {activeTab === "summary" && renderSummaryTab()}
        {activeTab === "basic" && renderBasicInfoTab()}
        {activeTab === "contact" && renderContactTab()}
        {activeTab === "docs" && renderDocsTab()}
        {activeTab === "transactions" && renderTransactionsTab()}
        {activeTab === "properties" && renderPropertiesTab()}

        {/* Placeholder for missing tabs */}
        {[
          "financial",
          "tax",
          "rating",
          "audit",
          "reports",
          "obligations",
        ].includes(activeTab) && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
            <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">
              جاري استكمال التبويب
            </h3>
            <p>سيتم عرض البيانات الخاصة بهذا التبويب هنا قريباً.</p>
          </div>
        )}
      </div>
      {renderUploadModal()}
    </div>
  );
};

export default ClientFileView;
