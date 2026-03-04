import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios"; // تأكد من مسار إعدادات axios الخاصة بك
import { toast } from "sonner";
import {
  FileText,
  BookOpen,
  Plus,
  Download,
  Sparkles,
  Search,
  Filter,
  Eye,
  Check,
  Copy,
  ExternalLink,
  X,
  SquarePen,
  History,
  Printer,
  User,
  Shield,
  Receipt,
  Landmark,
  Hash,
  Building,
  SkipForward,
  TriangleAlert,
  CircleCheckBig,
  Save,
  Ellipsis,
  ArrowUpDown,
  Loader2,
  Trash2,
  Star,
  ChevronRight,
  Zap,
  Brain,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Info,
  QrCode,
  Clock,
  UserCircle,
} from "lucide-react";

// دالة ذكية لتحويل كائن الاسم إلى نص مقروء لتجنب أخطاء React
const formatClientName = (nameData) => {
  if (!nameData) return "غير محدد";
  let parsed = nameData;
  if (typeof nameData === "string") {
    try {
      parsed = JSON.parse(nameData);
    } catch (e) {
      return nameData;
    }
  }
  if (parsed.firstName || parsed.familyName) {
    return `${parsed.firstName || ""} ${parsed.fatherName || ""} ${parsed.familyName || ""}`
      .trim()
      .replace(/\s+/g, " ");
  }
  if (parsed.ar) {
    if (typeof parsed.ar === "string") return parsed.ar;
    if (
      typeof parsed.ar === "object" &&
      (parsed.ar.firstName || parsed.ar.familyName)
    ) {
      return `${parsed.ar.firstName || ""} ${parsed.ar.fatherName || ""} ${parsed.ar.familyName || ""}`
        .trim()
        .replace(/\s+/g, " ");
    }
  }
  return "اسم غير معروف";
};

// دالة لتوحيد وتصنيف أنواع العملاء والقوالب مهما كان المسمى في قاعدة البيانات
const normalizeClientType = (typeString) => {
  if (!typeString) return "فرد"; // قيمة افتراضية

  const lowerType = String(typeString).toLowerCase();

  // 1. تصنيف الأفراد
  if (
    lowerType.includes("فرد") ||
    lowerType.includes("individual") ||
    lowerType.includes("شخص") ||
    lowerType.includes("مواطن")
  ) {
    return "فرد";
  }
  // 2. تصنيف الشركات والمؤسسات
  if (
    lowerType.includes("شرك") ||
    lowerType.includes("مؤسس") ||
    lowerType.includes("company") ||
    lowerType.includes("corporate")
  ) {
    return "شركة";
  }
  // 3. تصنيف الجهات الحكومية
  if (
    lowerType.includes("حكوم") ||
    lowerType.includes("أمان") ||
    lowerType.includes("وزار") ||
    lowerType.includes("gov") ||
    lowerType.includes("هيئة")
  ) {
    return "جهة حكومية";
  }

  return "فرد"; // إذا لم يتطابق مع شيء نعتبره فرداً كاحتياط
};

const ContractsScreen = () => {
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState(null);
  const [detailTab, setDetailTab] = useState("overview");

  // 👈 حالات المحرر (Editor States)
  const [editingClauses, setEditingClauses] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  const [aiReviewMode, setAiReviewMode] = useState("deep"); // "quick" | "deep"
  const [isAiReviewing, setIsAiReviewing] = useState(false);
  const [aiResults, setAiResults] = useState(null);

  // ==========================================
  // 1. جلب العقود الحقيقية للجدول الرئيسي
  // ==========================================
  const { data: contracts = [], isLoading: isLoadingContracts } = useQuery({
    queryKey: ["contracts-list"],
    queryFn: async () => (await api.get("/contracts")).data,
  });

  // 👈 دالة حفظ التعديلات المصححة للتعامل مع Axios بشكل سليم
  const updateContractMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.put(`/contracts/${payload.id}`, payload);
      // استخراج البيانات الحقيقية من Axios
      return response.data?.data || response.data;
    },
    onSuccess: (updatedContract) => {
      toast.success("تم حفظ التعديلات بنجاح!");
      queryClient.invalidateQueries(["contracts-list"]);
      setHasChanges(false);

      // تحديث العقد المحدد ليعكس التغييرات فوراً دون أن يختفي
      setSelectedContract((prev) => ({
        ...prev,
        clauses: updatedContract.clauses,
      }));
    },
    onError: () => toast.error("حدث خطأ أثناء حفظ التعديلات"),
  });

  // 👈 دالة تهيئة المحرر المحمية من الأخطاء
  React.useEffect(() => {
    if (selectedContract) {
      let parsedClauses = [];
      if (selectedContract.clauses) {
        try {
          parsedClauses =
            typeof selectedContract.clauses === "string"
              ? JSON.parse(selectedContract.clauses)
              : selectedContract.clauses;
        } catch (e) {
          console.error("Error parsing clauses", e);
          parsedClauses = [];
        }
      }

      // إذا لم يكن للعقد أقسام محفوظة، نضع الأقسام الافتراضية
      if (!Array.isArray(parsedClauses) || parsedClauses.length === 0) {
        parsedClauses = defaultContractSections;
      }

      setEditingClauses(parsedClauses);

      // تأمين أن القسم النشط موجود دائماً في القائمة وإلا نختار الأول
      const firstId = parsedClauses[0]?.id || "intro";
      setActiveEditorSection((prev) =>
        parsedClauses.some((c) => c.id === prev) ? prev : firstId,
      );
      setHasChanges(false);
    }
  }, [selectedContract]);

  // دوال التعامل مع المحرر
  const handleClauseChange = (id, field, value) => {
    setEditingClauses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
    setHasChanges(true);
  };

  const handleAddClauseToContract = () => {
    setEditingClauses([
      ...editingClauses,
      { id: Date.now().toString(), title: "بند جديد", content: "" },
    ]);
    setHasChanges(true);
  };

  const handleRemoveClauseFromContract = (id) => {
    if (window.confirm("حذف هذا البند؟")) {
      setEditingClauses((prev) => prev.filter((c) => c.id !== id));
      setHasChanges(true);
    }
  };

  const analyzeAiMutation = useMutation({
    mutationFn: async (payload) =>
      await api.post(`/contracts/analyze-ai`, payload),
    onSuccess: (res) => {
      setAiResults(res.data.data); // حفظ الـ JSON القادم من GPT
      setIsAiReviewing(false);
      toast.success("اكتملت المراجعة الذكية!");
    },
    onError: () => {
      toast.error("فشل في التواصل مع محرك الذكاء الاصطناعي");
      setIsAiReviewing(false);
    },
  });

  const handleStartAiReview = () => {
    setIsAiReviewing(true);
    setAiResults(null);
    // إرسال البنود المكتوبة حالياً في المحرر + بيانات العقد
    analyzeAiMutation.mutate({
      clauses: editingClauses,
      clientId: selectedContract.clientId, // نحتاج ID العميل الحقيقي من قاعدة البيانات إن وجد
      propertyId: selectedContract.propertyId, // إن وجد
      type: selectedContract.type,
    });
  };

  const handleApplyAiSuggestion = (clauseId, suggestionText) => {
    // التعديل مباشرة في المحرر على البند الذي اختاره الذكاء الاصطناعي
    setEditingClauses((prev) =>
      prev.map((c) =>
        c.id === clauseId ? { ...c, content: suggestionText } : c,
      ),
    );
    setHasChanges(true);
    toast.success("تم تطبيق اقتراح الذكاء الاصطناعي في المحرر!");
  };

  // ==========================================
  // 2. عمليات العقود (حذف وإنشاء)
  // ==========================================
  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/contracts/${id}`),
    onSuccess: () => {
      toast.success("تم حذف العقد بنجاح");
      queryClient.invalidateQueries(["contracts-list"]);
      setSelectedContract(null);
    },
    onError: () => toast.error("حدث خطأ أثناء محاولة الحذف"),
  });

  const handleDeleteContract = (id) => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف هذا العقد نهائياً؟")) {
      deleteMutation.mutate(id);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (payload) => await api.post("/contracts", payload),
    onSuccess: () => {
      toast.success("تم إنشاء العقد بنجاح");
      queryClient.invalidateQueries(["contracts-list"]);
      closeWizard();
    },
    onError: () => toast.error("حدث خطأ أثناء إنشاء العقد"),
  });

  // ==========================================
  // 3. حالات معالج الإضافة (Wizard) وجلب بياناته
  // ==========================================
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [clauseViewMode, setClauseViewMode] = useState("short"); // "short" or "full"
  const [activeEditorSection, setActiveEditorSection] = useState("intro");

  // 👈 حالات تاب الإخراج (Export Tab)
  const [exportStyle, setExportStyle] = useState("professional"); // "professional" | "intensive" | "friendly"
  const [exportVersion, setExportVersion] = useState("full"); // "full" | "short"
  const [hideIdNumber, setHideIdNumber] = useState(true);

  const defaultContractSections = [
    {
      id: "intro",
      title: "المقدمة",
      content: "بناءً على الاتفاق المبرم بين الطرفين...",
    },
    { id: "scope", title: "نطاق العمل", content: "" },
    { id: "pricing", title: "البنود والتسعير", content: "" },
    { id: "payments", title: "خطة الدفعات", content: "" },
    { id: "terms", title: "الشروط والأحكام", content: "" },
    { id: "signatures", title: "التوقيع والاعتماد", content: "" },
  ];

  // تجميع بيانات العقد الجديد
  const [newContractData, setNewContractData] = useState({
    clientType: "فرد",
    scenario: "direct",
    templateId: "",
    title: "",
    clientId: "",
    propertyId: "",
    quotationId: "",
    value: "0",
  });

  // جلب القوالب، العملاء، الملكيات، وعروض الأسعار للـ Wizard
  // 1. جلب القوالب
  const { data: templatesList = [] } = useQuery({
    queryKey: ["contract-templates"],
    queryFn: async () => (await api.get("/contracts/templates")).data,
  });

  // 2. جلب العملاء الحقيقيين (إصلاح مشكلة الـ Pagination وشكل البيانات)
  const { data: clientsList = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      // نطلب limit كبير لنجلب كل العملاء، ونستخرج مصفوفة 'data' من الرد
      const response = await api.get("/clients?limit=1000");
      return response.data.data || response.data; // توافق مع كلا الحالتين
    },
    enabled: isWizardOpen && wizardStep === 2,
  });

  // 3. جلب الملكيات الحقيقية للعميل المختار
  const { data: propertiesList = [], isLoading: isLoadingProperties } =
    useQuery({
      // نضع clientId في الـ queryKey لكي يعيد جلب البيانات إذا تغير العميل
      queryKey: ["properties-list", newContractData.clientId],
      queryFn: async () => {
        // نستخدم الميزة الرائعة في الباك إند الخاص بك لجلب ملكيات هذا العميل فقط
        const response = await api.get(
          `/properties?limit=1000&clientId=${newContractData.clientId}`,
        );
        // الباك إند يرجع { success: true, data: deeds } لذلك نستخرج data
        return response.data.data || [];
      },
      // لا نرسل الطلب إلا إذا كنا في الخطوة 3 وتم اختيار عميل بالفعل
      enabled: isWizardOpen && wizardStep === 3 && !!newContractData.clientId,
    });

  // 4. جلب عروض الأسعار الحقيقية
  const { data: quotationsList = [], isLoading: isLoadingQuotations } =
    useQuery({
      queryKey: ["quotations-list"],
      queryFn: async () => {
        const response = await api.get("/quotations?limit=1000");
        // الباك إند يرجع { success: true, data: quotations }
        return response.data.data || [];
      },
      enabled: isWizardOpen && wizardStep === 4,
    });

  // دوال التنقل في المعالج
  const nextStep = () => {
    if (wizardStep === 1 && !newContractData.templateId)
      return toast.error("الرجاء اختيار قالب العقد");
    if (wizardStep === 2 && !newContractData.clientId)
      return toast.error("الرجاء اختيار العميل");
    setWizardStep((prev) => Math.min(prev + 1, 6));
  };
  const prevStep = () => setWizardStep((prev) => Math.max(prev - 1, 1));

  const closeWizard = () => {
    setIsWizardOpen(false);
    setWizardStep(1);
    setNewContractData({
      clientType: "فرد",
      scenario: "direct",
      templateId: "",
      title: "",
      clientId: "",
      propertyId: "",
      quotationId: "",
      value: "0",
    });
  };

  const handleFinalSave = (status) => {
    // 1. جلب البنود من القالب الذي تم اختياره لحفظها كنسخة ثابتة داخل العقد
    const selectedTpl = templatesList.find(
      (t) => t.id === newContractData.templateId,
    );
    const contractClauses = selectedTpl?.clauses || [];

    // 2. إرسال كل البيانات للباك إند
    createMutation.mutate({
      title: newContractData.title,
      clientId: newContractData.clientId,
      quotationId: newContractData.quotationId || null,
      propertyId: newContractData.propertyId || null, // 👈 إرسال الملكية
      templateId: newContractData.templateId || null, // 👈 إرسال القالب
      clauses: contractClauses, // 👈 إرسال البنود
      status: status,
      totalValue: parseFloat(newContractData.value) || 0,
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "مسودة":
        return "bg-slate-50 text-slate-500 border-slate-200";
      case "معتمد":
        return "bg-green-50 text-green-600 border-green-200";
      case "جاهز":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "ملغي":
        return "bg-red-50 text-red-600 border-red-200";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  // ==========================================
  // 📚 مكون قوالب العقود (Templates Modal) - مع البنود
  // ==========================================
  const ContractTemplatesModal = () => {
    const queryClient = useQueryClient();
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // 👈 إضافة مصفوفة clauses كقيمة افتراضية
    const defaultFormState = {
      id: null,
      title: "",
      description: "",
      clientType: "فرد",
      serviceType: "رخصة بناء",
      hasRep: false,
      isProxy: false,
      isDefault: false,
      sections: 12,
      clauses: [],
    };
    const [templateForm, setTemplateForm] = useState(defaultFormState);

    const { data: templatesList = [], isLoading: isLoadingTemplates } =
      useQuery({
        queryKey: ["contract-templates"],
        queryFn: async () => (await api.get("/contracts/templates")).data,
      });

    const createTemplateMutation = useMutation({
      mutationFn: async (payload) =>
        await api.post("/contracts/templates", payload),
      onSuccess: () => {
        toast.success("تم إضافة القالب بنجاح!");
        queryClient.invalidateQueries(["contract-templates"]);
        setIsAddingNew(false);
        setTemplateForm(defaultFormState);
      },
      onError: () => toast.error("حدث خطأ أثناء حفظ القالب"),
    });

    const updateTemplateMutation = useMutation({
      mutationFn: async (payload) =>
        await api.put(`/contracts/templates/${payload.id}`, payload),
      onSuccess: (data) => {
        toast.success("تم تعديل القالب بنجاح!");
        queryClient.invalidateQueries(["contract-templates"]);
        setIsAddingNew(false);
        setTemplateForm(defaultFormState);
        setSelectedTemplate(data);
      },
      onError: () => toast.error("حدث خطأ أثناء تعديل القالب"),
    });

    const deleteTemplateMutation = useMutation({
      mutationFn: async (id) => await api.delete(`/contracts/templates/${id}`),
      onSuccess: () => {
        toast.success("تم حذف القالب");
        queryClient.invalidateQueries(["contract-templates"]);
        setSelectedTemplate(null);
      },
    });

    const handleSaveTemplate = (e) => {
      e.preventDefault();
      if (!templateForm.title) return toast.error("اسم القالب مطلوب!");
      // تنظيف البنود الفارغة قبل الإرسال
      const cleanData = {
        ...templateForm,
        clauses: templateForm.clauses.filter((c) => c.title || c.content),
      };
      if (templateForm.id) updateTemplateMutation.mutate(cleanData);
      else createTemplateMutation.mutate(cleanData);
    };

    const handleEditClick = (tpl) => {
      setTemplateForm({
        ...tpl,
        clauses: Array.isArray(tpl.clauses) ? tpl.clauses : [],
      }); // تأمين البنود
      setIsAddingNew(true);
    };

    // 👈 دوال إدارة البنود الديناميكية
    const addClause = () => {
      setTemplateForm({
        ...templateForm,
        clauses: [
          ...templateForm.clauses,
          { id: Date.now().toString(), title: "", content: "" },
        ],
      });
    };
    const updateClause = (id, field, value) => {
      setTemplateForm({
        ...templateForm,
        clauses: templateForm.clauses.map((c) =>
          c.id === id ? { ...c, [field]: value } : c,
        ),
      });
    };
    const removeClause = (id) => {
      setTemplateForm({
        ...templateForm,
        clauses: templateForm.clauses.filter((c) => c.id !== id),
      });
    };

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-[17px] font-extrabold text-slate-900 m-0">
                  قوالب العقود
                </h2>
                <span className="text-[11px] text-slate-500 font-bold">
                  {templatesList.length} قالب متاح
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTemplateForm(defaultFormState);
                  setIsAddingNew(!isAddingNew);
                }}
                className={`px-4 py-2 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all ${isAddingNew ? "bg-slate-200 text-slate-700" : "bg-gradient-to-br from-purple-600 to-indigo-700 text-white hover:shadow-lg"}`}
              >
                {isAddingNew ? (
                  <X className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {isAddingNew ? "إلغاء" : "قالب جديد"}
              </button>
              <button
                onClick={() => setIsTemplatesOpen(false)}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {isAddingNew && (
            <form
              onSubmit={handleSaveTemplate}
              className="flex flex-col max-h-[50vh] border-b border-purple-200 shrink-0 bg-purple-50/30"
            >
              <div className="p-5 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      اسم القالب *
                    </label>
                    <input
                      type="text"
                      value={templateForm.title}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          title: e.target.value,
                        })
                      }
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-purple-500 bg-white"
                      placeholder="مثال: عقد خدمات هندسية - رخصة بناء"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      نوع العميل
                    </label>
                    <select
                      value={templateForm.clientType}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          clientType: e.target.value,
                        })
                      }
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-purple-500 bg-white"
                    >
                      <option value="فرد">فرد</option>
                      <option value="شركة">شركة</option>
                      <option value="جهة حكومية">جهة حكومية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      نوع الخدمة
                    </label>
                    <input
                      type="text"
                      value={templateForm.serviceType}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          serviceType: e.target.value,
                        })
                      }
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-purple-500 bg-white"
                      placeholder="رخصة بناء..."
                    />
                  </div>
                  <div className="col-span-2 md:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      وصف القالب (اختياري)
                    </label>
                    <input
                      type="text"
                      value={templateForm.description || ""}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-purple-500 bg-white"
                      placeholder="يستخدم هذا القالب في حالة..."
                    />
                  </div>
                </div>

                {/* 👈 قسم إدارة البنود (الجديد) */}
                <div className="mt-6 border-t border-purple-200 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="text-[12px] font-extrabold text-slate-800">
                        بنود وشروط القالب
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        أضف البنود القانونية والتفصيلية الخاصة بهذا العقد.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addClause}
                      className="text-[11px] bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-blue-50 transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> إضافة بند
                    </button>
                  </div>

                  <div className="space-y-3">
                    {templateForm.clauses?.map((clause, index) => (
                      <div
                        key={clause.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl relative group shadow-sm flex flex-col gap-2 transition-colors hover:border-purple-300"
                      >
                        <button
                          type="button"
                          onClick={() => removeClause(clause.id)}
                          className="absolute left-3 top-3 p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="حذف البند"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 pr-2 border-r-4 border-purple-500">
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            value={clause.title}
                            onChange={(e) =>
                              updateClause(clause.id, "title", e.target.value)
                            }
                            placeholder="عنوان البند (مثال: التزامات الطرف الأول)"
                            className="w-full text-xs font-bold text-slate-800 border-none outline-none placeholder-slate-300"
                          />
                        </div>
                        <textarea
                          value={clause.content}
                          onChange={(e) =>
                            updateClause(clause.id, "content", e.target.value)
                          }
                          placeholder="اكتب نص وتفاصيل البند هنا..."
                          className="w-full text-[11px] text-slate-600 border border-slate-100 rounded-lg bg-slate-50 p-2.5 outline-none focus:border-purple-300 focus:bg-white transition-colors resize-none h-20 leading-relaxed"
                        />
                      </div>
                    ))}
                    {templateForm.clauses?.length === 0 && (
                      <div className="text-center text-slate-400 text-xs py-6 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                        لا توجد بنود مضافة بعد. اضغط على الزر أعلاه لإضافة بند
                        جديد.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* أزرار الحفظ (أسفل الفورم) */}
              <div className="flex items-center gap-6 p-4 border-t border-purple-200 bg-white shrink-0">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateForm.isDefault}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        isDefault: e.target.checked,
                      })
                    }
                    className="rounded text-purple-600 w-4 h-4"
                  />
                  <span className="text-[11px] font-bold text-slate-700">
                    تعيين كقالب افتراضي
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateForm.hasRep}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        hasRep: e.target.checked,
                      })
                    }
                    className="rounded text-purple-600 w-4 h-4"
                  />
                  <span className="text-[11px] font-bold text-slate-700">
                    يدعم ممثل/وكيل
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateForm.isProxy}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        isProxy: e.target.checked,
                      })
                    }
                    className="rounded text-purple-600 w-4 h-4"
                  />
                  <span className="text-[11px] font-bold text-slate-700">
                    يدعم العمل بالنيابة
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={
                    createTemplateMutation.isPending ||
                    updateTemplateMutation.isPending
                  }
                  className="mr-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  {createTemplateMutation.isPending ||
                  updateTemplateMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {templateForm.id ? "حفظ التعديلات" : "حفظ القالب النهائي"}
                </button>
              </div>
            </form>
          )}

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50 custom-scrollbar">
              {isLoadingTemplates ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
              ) : templatesList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-bold text-sm">لا توجد قوالب مسجلة بعد</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {templatesList.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer group flex flex-col ${selectedTemplate?.id === tpl.id ? "border-purple-500 bg-purple-50/10 shadow-md" : "border-slate-200 bg-white hover:border-purple-300 hover:shadow-sm"}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-[13px] font-black text-slate-900 leading-tight">
                          {tpl.title}
                        </h3>
                        {tpl.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-[10px] font-bold border border-green-100">
                            <Star className="w-2.5 h-2.5 fill-current" />{" "}
                            افتراضي
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3 leading-relaxed flex-1">
                        {tpl.description || "لا يوجد وصف مسجل لهذا القالب."}
                      </p>
                      <div className="flex gap-1.5 flex-wrap mb-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                          {normalizeClientType(tpl.clientType) === "شركة" ? (
                            <Building className="w-2.5 h-2.5" />
                          ) : normalizeClientType(tpl.clientType) ===
                            "جهة حكومية" ? (
                            <Landmark className="w-2.5 h-2.5" />
                          ) : (
                            <User className="w-2.5 h-2.5" />
                          )}{" "}
                          {tpl.clientType}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 text-purple-600 text-[10px] font-bold border border-purple-100">
                          {tpl.serviceType}
                        </span>
                        {tpl.hasRep && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-fuchsia-50 text-fuchsia-600 text-[10px] font-bold border border-fuchsia-100">
                            <Shield className="w-2.5 h-2.5" /> ممثل
                          </span>
                        )}
                        {tpl.isProxy && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100">
                            نيابة
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-auto">
                        {/* 👈 عرض عدد البنود هنا */}
                        <div className="text-[10px] text-slate-400 font-bold">
                          {tpl.clauses?.length || 0} بنود مخصصة •{" "}
                          {tpl.usesCount} استخدام
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(tpl);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                            title="تعديل"
                          >
                            <SquarePen className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm("حذف القالب؟"))
                                deleteTemplateMutation.mutate(tpl.id);
                            }}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* لوحة تفاصيل القالب الجانبية */}
            {selectedTemplate && (
              <div className="w-[360px] border-r-2 border-slate-200 bg-slate-50 flex flex-col shrink-0 animate-in slide-in-from-left-8 duration-300">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
                  <h3 className="text-[14px] font-extrabold text-slate-900 m-0">
                    تفاصيل القالب
                  </h3>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <h4 className="text-[13px] font-extrabold text-slate-900 mb-1.5">
                    {selectedTemplate.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                    {selectedTemplate.description || "لا يوجد وصف مسجل."}
                  </p>

                  {/* 👈 عرض البنود المضافة في اللوحة الجانبية */}
                  {selectedTemplate.clauses &&
                  selectedTemplate.clauses.length > 0 ? (
                    <>
                      <div className="text-[11px] font-bold text-slate-600 mb-2 flex items-center justify-between">
                        بنود وشروط العقد{" "}
                        <span className="bg-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                          {selectedTemplate.clauses.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {selectedTemplate.clauses.map((clause, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-1 h-full bg-purple-500"></div>
                            <div className="text-[11px] font-bold text-slate-800 mb-1">
                              {idx + 1}. {clause.title}
                            </div>
                            <div className="text-[10px] text-slate-500 leading-relaxed whitespace-pre-wrap">
                              {clause.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-400 font-bold">
                      لا توجد بنود مخصصة في هذا القالب
                    </div>
                  )}

                  <div className="flex gap-2 mt-5">
                    <button className="flex-1 py-2.5 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all">
                      استخدام هذا القالب
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // محتوى معالج الإنشاء (Wizard) الحقيقي
  // ==========================================
  const renderWizardContent = () => {
    switch (wizardStep) {
      case 1:
        // فلترة القوالب باستخدام دالة التوحيد
        const filteredTemplates = Array.isArray(templatesList)
          ? templatesList.filter(
              (t) =>
                normalizeClientType(t.clientType) ===
                newContractData.clientType,
            )
          : [];
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">
                نوع العميل المستهدف
              </div>
              <div className="flex gap-2">
                {["فرد", "شركة", "جهة حكومية"].map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      setNewContractData({
                        ...newContractData,
                        clientType: type,
                        templateId: "",
                        title: "",
                      })
                    }
                    className={`flex-1 p-3 rounded-lg border-2 text-[13px] font-bold transition-colors ${newContractData.clientType === type ? "bg-blue-50/50 border-blue-600 text-blue-600" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">
                سيناريو تقديم الخدمة
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setNewContractData({
                      ...newContractData,
                      scenario: "direct",
                    })
                  }
                  className={`flex-1 p-3 rounded-lg text-right border-2 transition-colors ${newContractData.scenario === "direct" ? "bg-purple-50/50 border-purple-600" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}
                >
                  <div
                    className={`text-[13px] font-bold ${newContractData.scenario === "direct" ? "text-purple-600" : "text-slate-700"}`}
                  >
                    عميل مباشر
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    العقد مباشر مع العميل
                  </div>
                </button>
                <button
                  onClick={() =>
                    setNewContractData({
                      ...newContractData,
                      scenario: "indirect",
                    })
                  }
                  className={`flex-1 p-3 rounded-lg text-right border-2 transition-colors ${newContractData.scenario === "indirect" ? "bg-purple-50/50 border-purple-600" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}
                >
                  <div
                    className={`text-[13px] font-bold ${newContractData.scenario === "indirect" ? "text-purple-600" : "text-slate-700"}`}
                  >
                    نيابة عن مكتب آخر
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    يضيف حقول المكتب الآخر
                  </div>
                </button>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">
                اختر قالب العقد المناسب
              </div>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() =>
                        setNewContractData({
                          ...newContractData,
                          templateId: tpl.id,
                          title: tpl.title,
                        })
                      }
                      className={`p-2.5 rounded-lg text-right border text-xs font-bold flex items-center gap-2 transition-colors ${newContractData.templateId === tpl.id ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                    >
                      <BookOpen
                        className={`w-4 h-4 ${newContractData.templateId === tpl.id ? "text-blue-500" : "text-slate-400"}`}
                      />{" "}
                      {tpl.title}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    لا توجد قوالب مخصصة لهذا النوع من العملاء
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 2:
        // فلترة العملاء باستخدام دالة التوحيد
        const filteredClients = Array.isArray(clientsList)
          ? clientsList.filter(
              (c) => normalizeClientType(c.type) === newContractData.clientType,
            )
          : [];
        return (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative mb-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالاسم أو رقم الهوية..."
                className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 transition-colors bg-white shadow-sm"
              />
            </div>
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {isLoadingClients ? (
                <div className="p-10 flex justify-center">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => {
                  let cName = formatClientName(client.name);
                  return (
                    <button
                      key={client.id}
                      onClick={() =>
                        setNewContractData({
                          ...newContractData,
                          clientId: client.id,
                        })
                      }
                      className={`w-full p-3 rounded-lg text-right border transition-colors flex items-center gap-3 ${newContractData.clientId === client.id ? "bg-blue-50 border-blue-300 shadow-sm" : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`}
                    >
                      <User
                        className={`w-5 h-5 ${newContractData.clientId === client.id ? "text-blue-500" : "text-slate-400"}`}
                      />
                      <div className="flex-1">
                        <div
                          className={`text-xs font-bold ${newContractData.clientId === client.id ? "text-blue-800" : "text-slate-800"}`}
                        >
                          {cName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {client.clientCode || client.idNumber}
                        </div>
                      </div>
                      {newContractData.clientId === client.id && (
                        <CircleCheckBig className="w-5 h-5 text-blue-600" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-10 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold">
                    لا يوجد عملاء من نوع ({newContractData.clientType})
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        const clientProperties = Array.isArray(propertiesList)
          ? propertiesList.filter(
              (p) => p.clientId === newContractData.clientId,
            )
          : [];
        return (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right-4 duration-300 max-h-[300px] overflow-y-auto custom-scrollbar">
            {isLoadingProperties ? (
              <div className="p-10 flex justify-center">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : clientProperties.length > 0 ? (
              clientProperties.map((prop) => (
                <button
                  key={prop.id}
                  onClick={() =>
                    setNewContractData({
                      ...newContractData,
                      propertyId: prop.id,
                    })
                  }
                  className={`w-full p-3 rounded-lg text-right border transition-colors flex items-center justify-between ${newContractData.propertyId === prop.id ? "bg-emerald-50 border-emerald-300 shadow-sm" : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50"}`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-slate-400" />{" "}
                      {prop.city} - {prop.district}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      صك: {prop.deedNumber || "بدون"} | قطعة:{" "}
                      {prop.plotNumber || "—"}
                    </div>
                  </div>
                  {newContractData.propertyId === prop.id && (
                    <CircleCheckBig className="w-5 h-5 text-emerald-600" />
                  )}
                </button>
              ))
            ) : (
              <div className="p-10 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                <Landmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold">
                  لا توجد ملكيات مسجلة لهذا العميل
                </p>
                <p className="text-[10px] mt-1">يمكنك تخطي هذه الخطوة</p>
              </div>
            )}
          </div>
        );
      case 4:
        // تم تعديل الحالة لتطابق Prisma Enum (CANCELLED, REJECTED)
        const clientQuotations = Array.isArray(quotationsList)
          ? quotationsList.filter(
              (q) =>
                q.clientId === newContractData.clientId &&
                q.status !== "CANCELLED" &&
                q.status !== "REJECTED",
            )
          : [];
        return (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right-4 duration-300 max-h-[300px] overflow-y-auto custom-scrollbar">
            {isLoadingQuotations ? (
              <div className="p-10 flex justify-center">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : clientQuotations.length > 0 ? (
              clientQuotations.map((quote) => (
                <button
                  key={quote.id}
                  onClick={() =>
                    setNewContractData({
                      ...newContractData,
                      quotationId: quote.id,
                      value: quote.total,
                    })
                  }
                  className={`w-full p-3 rounded-lg text-right border transition-colors flex justify-between items-center ${newContractData.quotationId === quote.id ? "bg-orange-50 border-orange-300 shadow-sm" : "bg-white border-slate-200 hover:border-orange-300 hover:bg-orange-50"}`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-slate-400" /> عرض رقم{" "}
                      {quote.number}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      تاريخ:{" "}
                      {new Date(quote.issueDate).toLocaleDateString("ar-SA")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-sm font-black ${newContractData.quotationId === quote.id ? "text-orange-600" : "text-slate-600"}`}
                    >
                      {quote.total?.toLocaleString("ar-SA")} ر.س
                    </div>
                    {newContractData.quotationId === quote.id && (
                      <CircleCheckBig className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-10 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold">
                  لا توجد عروض أسعار لهذا العميل
                </p>
                <p className="text-[10px] mt-1">
                  يمكنك تخطي هذه الخطوة أو إنشاء عرض سعر أولاً
                </p>
              </div>
            )}
          </div>
        );
      case 5:
        // 1. جلب بيانات القالب الذي اختاره المستخدم في الخطوة الأولى
        const selectedTpl = templatesList.find(
          (t) => t.id === newContractData.templateId,
        );
        // استخراج البنود من القالب (إن وجدت)
        const clauses = selectedTpl?.clauses || [];

        // 2. جلب بيانات عرض السعر الذي اختاره المستخدم في الخطوة الرابعة (إن وجد)
        const selectedQuote = quotationsList.find(
          (q) => q.id === newContractData.quotationId,
        );

        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-700 mb-3">
                بنود العقد (من القالب{" "}
                {selectedQuote ? `+ عرض السعر رقم ${selectedQuote.number}` : ""}
                )
              </div>

              {/* منطقة عرض البنود */}
              <div className="text-[11px] text-slate-500 leading-loose max-h-[220px] overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {clauses.length > 0 ? (
                  clauses.map((clause, idx) => (
                    <div
                      key={clause.id || idx}
                      className="border-b border-slate-200/60 pb-2 last:border-0"
                    >
                      <span className="font-bold text-slate-800">
                        {idx + 1}. {clause.title}:{" "}
                      </span>

                      {clauseViewMode === "short" ? (
                        <span>
                          {clause.content?.length > 60
                            ? `${clause.content.substring(0, 60)}...`
                            : clause.content}
                        </span>
                      ) : (
                        <span className="block mt-1 whitespace-pre-wrap leading-relaxed">
                          {clause.content}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 italic text-center py-4">
                    لا توجد بنود مخصصة مسجلة داخل هذا القالب.
                  </div>
                )}

                {/* ملاحظة إذا كان هناك عرض سعر مربوط */}
                {selectedQuote && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <span className="font-bold text-orange-600">
                      ملاحظة النظام:{" "}
                    </span>
                    سيتم إدراج جدول البنود والتسعير تلقائياً من عرض السعر بقيمة
                    ({selectedQuote.total?.toLocaleString("ar-SA")} ر.س).
                  </div>
                )}
              </div>

              {/* أزرار التحكم في العرض (مطابقة لتصميمك) */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setClauseViewMode("short")}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${clauseViewMode === "short" ? "bg-blue-50 border border-blue-200 text-blue-600 shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                >
                  نسخة مختصرة
                </button>
                <button
                  onClick={() => setClauseViewMode("full")}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${clauseViewMode === "full" ? "bg-green-50 border border-green-200 text-green-600 shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                >
                  نسخة كاملة
                </button>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-xs font-bold text-slate-700 mb-1">
              Checklist قبل الاعتماد
            </div>
            <div
              className={`flex items-center gap-2 p-2 rounded-md ${newContractData.clientId ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}
            >
              {newContractData.clientId ? (
                <CircleCheckBig className="w-4 h-4 text-green-600" />
              ) : (
                <TriangleAlert className="w-4 h-4 text-amber-500" />
              )}
              <span
                className={`text-[11px] font-bold ${newContractData.clientId ? "text-green-700" : "text-amber-700"}`}
              >
                بيانات العميل{" "}
                {newContractData.clientId
                  ? "مكتملة ومربوطة بنجاح"
                  : "غير مكتملة"}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 p-2 rounded-md ${newContractData.templateId ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}
            >
              {newContractData.templateId ? (
                <CircleCheckBig className="w-4 h-4 text-green-600" />
              ) : (
                <TriangleAlert className="w-4 h-4 text-amber-500" />
              )}
              <span
                className={`text-[11px] font-bold ${newContractData.templateId ? "text-green-700" : "text-amber-700"}`}
              >
                قالب العقد{" "}
                {newContractData.templateId
                  ? `محدد (${newContractData.title})`
                  : "غير محدد"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 flex items-center gap-2 mt-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="text-[10px] font-bold text-purple-700 leading-tight">
                مراجعة AI ستصبح متاحة بمجرد حفظك للعقد كمسودة.
              </span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    const titles = [
      "نوع العقد والقالب",
      "ربط العميل/المالك",
      "ربط الملكية/الموقع",
      "عرض سعر/معاملة/فاتورة",
      "بنود العقد والشروط",
      "مراجعة AI + Checklist",
    ];
    return titles[wizardStep - 1];
  };

  return (
    <div
      className="h-full flex flex-col bg-slate-50 font-sans text-right"
      dir="rtl"
    >
      {/* --- Top Search & Module Header --- */}
      <div className="px-5 py-3.5 bg-white border-b-2 border-slate-200 shadow-sm shrink-0">
        <div className="mb-4">
          <div className="relative w-full max-w-2xl">
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/5 border-[1.5px] border-purple-500/20 rounded-2xl p-1">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-md cursor-text">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="البحث في التعاقدات (رقم العقد، الجهة)..."
                  className="flex-1 bg-transparent border-none outline-none text-[13px] text-slate-700"
                />
                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-bold">
                  التعاقدات
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-tight">
                عقود مع العملاء
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                إدارة عقود الخدمات الهندسية — {contracts.length} عقد
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setIsTemplatesOpen(true)}
              className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition-colors"
              title="قوالب العقود"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" /> إضافة عقد
            </button>
          </div>
        </div>
      </div>

      {/* --- Main Content (Split View) --- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left/Right Table Area */}
        <div className="flex-1 overflow-auto bg-white custom-scrollbar">
          {isLoadingContracts ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-xs text-right whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b-2 border-slate-200 shadow-sm text-slate-600 font-bold">
                <tr>
                  <th className="px-3 py-3 w-32 border-l border-slate-200 sticky right-0 bg-slate-50 shadow-[-2px_0_4px_rgba(0,0,0,0.02)] z-20">
                    رقم العقد
                  </th>
                  <th className="px-3 py-3 w-40">النوع/القالب</th>
                  <th className="px-3 py-3 w-48">العميل</th>
                  <th className="px-3 py-3 w-20">الحالة</th>
                  <th className="px-3 py-3 w-28">الإنشاء / الصلاحية</th>
                  <th className="px-3 py-3 w-20">القيمة</th>
                  <th className="px-3 py-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.length > 0 ? (
                  contracts.map((contract) => (
                    <tr
                      key={contract.id}
                      onClick={() => setSelectedContract(contract)}
                      className={`cursor-pointer transition-colors ${selectedContract?.id === contract.id ? "bg-purple-50/50 border-l-4 border-l-purple-500" : "hover:bg-slate-50 bg-white"}`}
                    >
                      <td
                        className={`px-3 py-3 sticky right-0 z-10 font-mono font-bold text-slate-800 ${selectedContract?.id === contract.id ? "bg-purple-50" : "bg-white"}`}
                        style={{ boxShadow: "-2px 0 4px rgba(0,0,0,0.02)" }}
                      >
                        {contract.id}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-700 truncate max-w-[150px]">
                          {contract.type}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {contract.clientType}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-800 truncate max-w-[180px]">
                          {formatClientName(contract.clientName)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {contract.clientId}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold ${getStatusBadge(contract.status)}`}
                        >
                          {contract.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[10px] text-slate-500 font-mono">
                        <div className="font-bold text-slate-600">
                          {contract.date}
                        </div>
                        <div className="text-slate-400 mt-0.5">
                          ← {contract.expiry}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-800 text-xs font-mono">
                        {contract.value}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                          <Ellipsis className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-10 font-bold text-slate-400"
                    >
                      لا توجد عقود مسجلة في النظام
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* --- Side Details Panel (Drawer - يمين الشاشة بطول كامل) --- */}
        {/* --- Side Details Panel (الآن تظهر في المنتصف كـ Modal) --- */}
        {selectedContract && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* 1. خلفية شفافة داكنة (Backdrop) */}
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setSelectedContract(null)}
            ></div>

            {/* 2. اللوحة المركزية (Modal) واسعة ومريحة */}
            <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-2xl flex flex-col animate-in zoom-in-95 duration-300 shadow-2xl overflow-hidden border border-slate-200">
              <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 mb-1">
                      عقد مع عميل
                    </div>
                    <div className="text-lg font-black font-mono tracking-wider">
                      {selectedContract.id}
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                        {selectedContract.status}
                      </span>
                      <span className="px-2.5 py-0.5 bg-white/10 text-white rounded-md text-[10px] font-bold">
                        {selectedContract.clientType}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        handleDeleteContract(selectedContract.realId)
                      }
                      disabled={deleteMutation.isPending}
                      className="p-1.5 bg-red-500/20 text-red-200 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                      title="حذف العقد"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedContract(null)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto custom-scrollbar-slim">
                {[
                  { id: "overview", label: "نظرة عامة", icon: Eye },
                  { id: "editor", label: "المحرر", icon: SquarePen },
                  { id: "ai", label: "AI مراجعة", icon: Sparkles },
                  { id: "audit", label: "التدقيق", icon: History },
                  { id: "export", label: "الإخراج", icon: Printer },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id)}
                    className={`flex-1 py-2.5 px-3 text-[10px] font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors border-b-[3px] ${detailTab === tab.id ? "border-purple-600 text-purple-700 bg-white" : "border-transparent text-slate-500 hover:bg-slate-100"}`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAFAFA] custom-scrollbar">
                {detailTab === "overview" && (
                  <>
                    <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
                      <div className="text-[11px] font-bold text-slate-600 mb-3 border-b border-slate-100 pb-2">
                        بيانات العميل
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <div className="text-[9px] text-slate-400 font-bold mb-1">
                            العميل
                          </div>
                          <div className="text-[11px] font-black text-slate-800">
                            {formatClientName(selectedContract.clientName)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-400 font-bold mb-1">
                            الكود
                          </div>
                          <div className="text-[11px] font-bold font-mono text-slate-800">
                            {selectedContract.clientId}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-400 font-bold mb-1">
                            النوع
                          </div>
                          <div className="text-[11px] font-bold text-slate-800">
                            {selectedContract.clientType}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Links Block (الارتباطات الحقيقية) */}
                    <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
                      <div className="text-[11px] font-bold text-slate-600 mb-3 border-b border-slate-100 pb-2">
                        الارتباطات بالنظام
                      </div>
                      <div className="space-y-2">
                        {/* 1. ارتباط عرض السعر */}
                        <div
                          className={`flex items-center justify-between p-2 rounded-lg border ${selectedContract.quotationNumber ? "bg-orange-50 border-orange-100" : "bg-slate-50 border-slate-200"}`}
                        >
                          <div
                            className={`flex items-center gap-2 ${selectedContract.quotationNumber ? "text-orange-600" : "text-slate-400"}`}
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-mono font-bold">
                              {selectedContract.quotationNumber
                                ? `عرض سعر: ${selectedContract.quotationNumber}`
                                : "عرض سعر: غير مربوط"}
                            </span>
                          </div>
                          {/* السهم يظهر فقط إذا كان هناك عرض سعر */}
                          {selectedContract.quotationId && (
                            <ExternalLink
                              onClick={() =>
                                window.open(
                                  `/quotations/${selectedContract.quotationId}`,
                                  "_blank",
                                )
                              }
                              className="w-3 h-3 text-orange-400 cursor-pointer hover:text-orange-600 transition-colors"
                              title="فتح صفحة عرض السعر"
                            />
                          )}
                        </div>

                        {/* 2. ارتباط الملكية (الصك) */}
                        <div
                          className={`flex items-center justify-between p-2 rounded-lg border ${selectedContract.propertyCode ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-200"}`}
                        >
                          <div
                            className={`flex items-center gap-2 ${selectedContract.propertyCode ? "text-emerald-600" : "text-slate-400"}`}
                          >
                            <Landmark className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-mono font-bold">
                              {selectedContract.propertyCode
                                ? `ملكية: ${selectedContract.propertyCode}`
                                : "ملكية: غير مربوط"}
                            </span>
                          </div>
                          {/* السهم يظهر فقط إذا كان هناك ملكية */}
                          {selectedContract.propertyId && (
                            <ExternalLink
                              onClick={() =>
                                window.open(
                                  `/properties/${selectedContract.propertyId}`,
                                  "_blank",
                                )
                              }
                              className="w-3 h-3 text-emerald-400 cursor-pointer hover:text-emerald-600 transition-colors"
                              title="فتح صفحة الملكية"
                            />
                          )}
                        </div>

                        {/* 3. ارتباط المعاملة (فاتورة/معاملة كعنصر توضيحي إضافي) */}
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-400">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">
                            معاملة: غير مربوط
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm text-center">
                        <div className="text-[9px] font-bold text-slate-400 mb-1">
                          قيمة العقد
                        </div>
                        <div className="text-sm font-black text-slate-800">
                          {selectedContract.value} ر.س
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm text-center">
                        <div className="text-[9px] font-bold text-slate-400 mb-1">
                          الصلاحية
                        </div>
                        <div className="text-sm font-black text-slate-800">
                          {selectedContract.expiry}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {/* 👈 تاب المحرر (مطابق للتصميم الجديد) */}
                {detailTab === "editor" && (
                  <div className="flex flex-col gap-0 pb-24 relative min-h-full bg-slate-50">
                    {/* 1. قائمة أقسام العقد */}
                    <div className="p-4 flex flex-col gap-1.5">
                      <div className="text-[11px] font-bold text-slate-500 mb-2">
                        أقسام العقد
                      </div>
                      {editingClauses.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => setActiveEditorSection(section.id)}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] w-full text-right font-sans transition-all duration-200 ${
                            activeEditorSection === section.id
                              ? "bg-blue-50 border border-blue-200 text-blue-600 font-bold"
                              : "bg-transparent border border-transparent text-slate-500 font-medium hover:bg-slate-200/50"
                          }`}
                        >
                          <ChevronRight className="w-3 h-3" /> {section.title}
                        </button>
                      ))}
                    </div>

                    {/* 2. مساحة التعديل (تتغير حسب القسم المختار) */}
                    <div className="p-4 border-t border-slate-200 bg-white flex-1">
                      {editingClauses.map((section) => {
                        if (section.id !== activeEditorSection) return null; // إظهار القسم النشط فقط

                        return (
                          <div
                            key={section.id}
                            className="animate-in fade-in duration-300"
                          >
                            <div className="text-[14px] font-bold text-slate-800 mb-3">
                              {section.title}
                            </div>
                            <textarea
                              value={section.content}
                              onChange={(e) =>
                                handleClauseChange(
                                  section.id,
                                  "content",
                                  e.target.value,
                                )
                              }
                              placeholder={`قم بكتابة وتعديل ${section.title} هنا...`}
                              className="w-full p-3 rounded-lg bg-white border border-slate-200 text-[12px] text-slate-700 leading-[1.8] min-h-[250px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none custom-scrollbar"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* 3. الزر الطافي (Floating Save Button) يظهر فقط إذا كان هناك تعديل */}
                    {hasChanges && (
                      <div className="absolute bottom-4 left-4 right-4 animate-in slide-in-from-bottom-6 fade-in duration-300">
                        <div className="p-3 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1.5">
                            <TriangleAlert className="w-3.5 h-3.5" /> لديك
                            تعديلات غير محفوظة
                          </span>
                          <button
                            // 👈 التصحيح هنا: نستخدم selectedContract.realId أو selectedContract.id كاحتياط
                            onClick={() => {
                              const contractIdToUpdate =
                                selectedContract.realId || selectedContract.id;
                              if (!contractIdToUpdate)
                                return toast.error("معرف العقد غير موجود!");

                              updateContractMutation.mutate({
                                id: contractIdToUpdate,
                                clauses: editingClauses,
                              });
                            }}
                            disabled={updateContractMutation.isPending}
                            className="px-5 py-2 bg-gradient-to-l from-purple-600 to-indigo-600 text-white text-[11px] font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {updateContractMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            حفظ التعديلات
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* 👈 تاب AI مراجعة (مطابق للتصميم وتفاعلي) */}
                {detailTab === "ai" && (
                  <div className="p-4 flex flex-col gap-0 min-h-full bg-[#FAFAFA] relative">
                    {/* أزرار اختيار نوع المراجعة */}
                    <div className="flex gap-1 mb-3.5 bg-slate-100 rounded-lg p-1 shadow-inner">
                      <button
                        onClick={() => setAiReviewMode("quick")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                          aiReviewMode === "quick"
                            ? "bg-white text-purple-600 shadow-sm border border-slate-200"
                            : "text-slate-500 hover:bg-slate-200/50"
                        }`}
                      >
                        <Zap className="w-3 h-3" /> مراجعة سريعة
                      </button>
                      <button
                        onClick={() => setAiReviewMode("deep")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                          aiReviewMode === "deep"
                            ? "bg-white text-purple-600 shadow-sm border border-slate-200"
                            : "text-slate-500 hover:bg-slate-200/50"
                        }`}
                      >
                        <Brain className="w-3 h-3" /> مراجعة عميقة
                      </button>
                    </div>

                    {/* زر بدء المراجعة */}
                    <button
                      onClick={handleStartAiReview}
                      disabled={isAiReviewing}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mb-4 disabled:opacity-70"
                    >
                      {isAiReviewing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {isAiReviewing
                        ? "جاري تحليل العقد والمطابقة..."
                        : "بدء المراجعة العميقة"}
                    </button>

                    {/* منطقة نتائج الـ AI الحقيقية */}
                    {aiResults && (
                      <div className="flex flex-col gap-2.5 animate-in slide-in-from-bottom-4 fade-in duration-500 pb-10 mt-2">
                        {/* كارت 1: اتساق بيانات العميل */}
                        <div
                          className={`p-3 rounded-xl bg-white border shadow-sm ${aiResults.clientConsistency.status === "success" ? "border-blue-200/60" : "border-amber-200/60"}`}
                        >
                          <div className="flex items-start gap-2 mb-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${aiResults.clientConsistency.status === "success" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}
                            >
                              {aiResults.clientConsistency.status ===
                              "success" ? (
                                <CircleCheckBig className="w-4 h-4" />
                              ) : (
                                <TriangleAlert className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-[12px] font-extrabold text-slate-800">
                                {aiResults.clientConsistency.title}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                {aiResults.clientConsistency.message}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* كارت 2: حالة الملكية */}
                        <div
                          className={`p-3 rounded-xl bg-white border shadow-sm ${aiResults.propertyStatus.status === "success" ? "border-emerald-200/60" : "border-amber-200/60"}`}
                        >
                          <div className="flex items-start gap-2 mb-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${aiResults.propertyStatus.status === "success" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                            >
                              {aiResults.propertyStatus.status === "success" ? (
                                <CircleCheckBig className="w-4 h-4" />
                              ) : (
                                <TriangleAlert className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-[12px] font-extrabold text-slate-800">
                                {aiResults.propertyStatus.title}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                {aiResults.propertyStatus.message}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* كارت 3: اقتراح AI حقيقي للتحرير */}
                        <div className="p-3 rounded-xl bg-white border border-purple-200/60 shadow-sm">
                          <div className="flex items-start gap-2 mb-2.5">
                            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                              <Sparkles className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-[12px] font-extrabold text-slate-800">
                                {aiResults.improvementSuggestion.title}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                {aiResults.improvementSuggestion.reason}
                              </div>
                            </div>
                          </div>

                          {/* صندوق الاقتراح */}
                          <div className="p-2.5 rounded-lg bg-purple-50/50 border border-purple-100 text-[11px] text-purple-900 leading-loose mb-2.5 whitespace-pre-wrap">
                            <strong>اقتراح:</strong>{" "}
                            {aiResults.improvementSuggestion.suggestedText}
                          </div>

                          <div className="flex gap-1.5">
                            {/* 👈 زر التطبيق الفعلي يرسل الـ ID الخاص بالبند والنص */}
                            <button
                              onClick={() =>
                                handleApplyAiSuggestion(
                                  aiResults.improvementSuggestion.clauseId,
                                  aiResults.improvementSuggestion.suggestedText,
                                )
                              }
                              className="px-2.5 py-1 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold flex items-center gap-1 hover:shadow-md transition-all shadow-sm"
                            >
                              <Check className="w-3 h-3" /> تطبيق في المحرر
                            </button>
                            <button
                              onClick={() => setDetailTab("editor")}
                              className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-1 hover:bg-slate-200 transition-colors"
                            >
                              <Pencil className="w-3 h-3" /> عرض المحرر
                            </button>
                          </div>
                        </div>

                        {/* كارت 4: ملخص العقد الذكي */}
                        <div className="p-3 rounded-xl bg-white border border-blue-200/60 shadow-sm">
                          <div className="flex items-start gap-2 mb-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-[12px] font-extrabold text-slate-800">
                                ملخص الشروط والأحكام
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 leading-relaxed whitespace-pre-line">
                                {aiResults.summary}
                              </div>
                            </div>
                          </div>

                          <div className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-100 text-[9px] text-amber-700 font-bold flex items-center gap-1 mb-2.5">
                            <Info className="w-3 h-3" /> الملخص تم توليده آلياً
                            للتيسير — المرجع هو النص الكامل
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================== */}
                {/* 👈 تاب التدقيق والسجلات (Audit Tab) */}
                {/* ========================================== */}
                {detailTab === "audit" && (
                  <div className="p-4 bg-[#FAFAFA] min-h-full">
                    <div className="text-[12px] font-extrabold text-slate-800 mb-4">
                      سجل النشاطات والتدقيق
                    </div>

                    {/* شجرة الأحداث (Timeline) */}
                    <div className="relative border-r-2 border-slate-200 pr-4 space-y-6 ml-2">
                      <div className="relative">
                        <div className="absolute -right-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                        <div className="text-[11px] font-bold text-slate-800">
                          إنشاء المسودة الأولى
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {selectedContract.date}
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute -right-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
                        <div className="text-[11px] font-bold text-slate-800">
                          تحديد القالب ونطاق العمل
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> تم اختيار قالب:{" "}
                          {selectedContract.type}
                        </div>
                      </div>

                      {selectedContract.propertyCode && (
                        <div className="relative">
                          <div className="absolute -right-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
                          <div className="text-[11px] font-bold text-slate-800">
                            ربط بيانات الملكية
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                            <Landmark className="w-3 h-3" /> صك رقم:{" "}
                            {selectedContract.propertyCode}
                          </div>
                        </div>
                      )}

                      {selectedContract.quotationNumber && (
                        <div className="relative">
                          <div className="absolute -right-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
                          <div className="text-[11px] font-bold text-slate-800">
                            إدراج البنود المالية
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                            <Receipt className="w-3 h-3" /> بناءً على عرض السعر:{" "}
                            {selectedContract.quotationNumber}
                          </div>
                        </div>
                      )}

                      <div className="relative">
                        <div className="absolute -right-[21px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white shadow-sm"></div>
                        <div className="text-[11px] font-bold text-slate-500">
                          في انتظار مراجعة الذكاء الاصطناعي
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================== */}
                {/* 👈 تاب الإخراج والطباعة (Export Tab) */}
                {/* ========================================== */}
                {detailTab === "export" && (
                  <div className="p-4 flex flex-col gap-4 bg-[#FAFAFA] min-h-full">
                    {/* إعدادات الإخراج */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 mb-2">
                        نمط الإخراج
                      </div>
                      <div className="flex gap-1.5 mb-2">
                        <button
                          onClick={() => setExportStyle("professional")}
                          className={`flex-1 py-2 rounded-md text-[11px] font-bold transition-all border-[1.5px] ${exportStyle === "professional" ? "bg-blue-50 border-blue-600 text-blue-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                        >
                          احترافي
                        </button>
                        <button
                          onClick={() => setExportStyle("intensive")}
                          className={`flex-1 py-2 rounded-md text-[11px] font-bold transition-all border-[1.5px] ${exportStyle === "intensive" ? "bg-blue-50 border-blue-600 text-blue-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                        >
                          مكثف
                        </button>
                        <button
                          onClick={() => setExportStyle("friendly")}
                          className={`flex-1 py-2 rounded-md text-[11px] font-bold transition-all border-[1.5px] ${exportStyle === "friendly" ? "bg-blue-50 border-blue-600 text-blue-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                        >
                          ودي للعميل
                        </button>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setExportVersion("full")}
                          className={`flex-1 py-2 rounded-md text-[11px] font-bold transition-all border-[1.5px] ${exportVersion === "full" ? "bg-emerald-50 border-emerald-600 text-emerald-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                        >
                          نسخة كاملة
                        </button>
                        <button
                          onClick={() => setExportVersion("short")}
                          className={`flex-1 py-2 rounded-md text-[11px] font-bold transition-all border-[1.5px] ${exportVersion === "short" ? "bg-emerald-50 border-emerald-600 text-emerald-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                        >
                          نسخة مختصرة
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-[11px] font-bold text-slate-700">
                        إظهار رقم الهوية في الطباعة
                      </div>
                      <button
                        onClick={() => setHideIdNumber(!hideIdNumber)}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-colors ${hideIdNumber ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-700"}`}
                      >
                        {hideIdNumber ? "مخفي" : "ظاهر"}
                      </button>
                    </div>

                    {/* كارت المعاينة (Preview Card) */}
                    <div className="rounded-xl border-2 border-slate-200 overflow-hidden bg-white shadow-[0_4px_12px_rgba(0,0,0,0.04)] mt-2">
                      <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 border-b-2 border-slate-200 text-center">
                        <div className="text-[9px] font-bold text-slate-400 mb-2">
                          معاينة الغلاف
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-slate-800 mx-auto mb-2 flex items-center justify-center shadow-md">
                          <Building className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-[14px] font-extrabold text-slate-800">
                          عقد خدمات هندسية
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 mt-1">
                          {selectedContract.id} — {selectedContract.type}
                        </div>

                        <div className="flex justify-center items-center gap-2 mt-3 text-[10px] font-bold text-slate-600">
                          <span>
                            العميل:{" "}
                            {formatClientName(selectedContract.clientName)}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>{selectedContract.date}</span>
                        </div>

                        <div className="flex justify-center gap-3 mt-4">
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center">
                              <QrCode className="w-6 h-6 text-slate-300" />
                            </div>
                            <div className="text-[8px] font-bold text-slate-400 mt-1">
                              QR داخلي
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center">
                              <QrCode className="w-6 h-6 text-slate-300" />
                            </div>
                            <div className="text-[8px] font-bold text-slate-400 mt-1">
                              QR خارجي
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 text-center text-[9px] font-bold text-slate-400 bg-white">
                        صفحة 1 / 6 — إخراج{" "}
                        {exportStyle === "professional"
                          ? "احترافي"
                          : exportStyle === "intensive"
                            ? "مكثف"
                            : "ودي"}
                      </div>
                    </div>

                    {/* أزرار الأكشن النهائية */}
                    <div className="flex gap-2 mt-auto pt-2">
                      <button className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white border-none text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all">
                        <Download className="w-4 h-4" /> تصدير PDF
                      </button>
                      <button className="flex-1 py-2.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-all">
                        <Printer className="w-4 h-4" /> طباعة
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 🪄 Wizard Modal (معالج إنشاء العقد) 🪄 */}
      {/* ========================================== */}
      {isWizardOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white relative shrink-0">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-black tracking-tight">
                    إنشاء عقد جديد مع عميل
                  </h2>
                  <p className="text-[11px] text-slate-300 font-medium mt-1 tracking-wide opacity-80">
                    الخطوة {wizardStep} من 6 — {getStepTitle()}
                  </p>
                </div>
                <button
                  onClick={closeWizard}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-1.5 w-full">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= wizardStep ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" : "bg-white/10"}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex-1 p-6 bg-[#FAFAFA] overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="flex items-center gap-3 mb-6 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                  {wizardStep === 1 && <BookOpen className="w-5 h-5" />}
                  {wizardStep === 2 && <User className="w-5 h-5" />}
                  {wizardStep === 3 && <Landmark className="w-5 h-5" />}
                  {wizardStep === 4 && <Receipt className="w-5 h-5" />}
                  {wizardStep === 5 && <FileText className="w-5 h-5" />}
                  {wizardStep === 6 && <Sparkles className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-[14px]">
                    {getStepTitle()}
                  </h3>
                </div>
                {[3, 4].includes(wizardStep) && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-md">
                    اختياري
                  </span>
                )}
              </div>
              {renderWizardContent()}
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0 rounded-b-2xl">
              <button
                onClick={prevStep}
                disabled={wizardStep === 1 || createMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors disabled:opacity-30"
              >
                السابق
              </button>
              <div className="flex gap-2">
                {[3, 4].includes(wizardStep) && (
                  <button
                    onClick={nextStep}
                    className="px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200 hover:bg-amber-100 flex items-center gap-1.5 transition-colors"
                  >
                    <SkipForward className="w-3.5 h-3.5" /> تخطي
                  </button>
                )}
                {wizardStep < 6 ? (
                  <button
                    onClick={nextStep}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-colors"
                  >
                    التالي
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFinalSave("Draft")}
                      disabled={createMutation.isPending}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center gap-1.5 border border-slate-200 hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" /> حفظ كمسودة
                    </button>
                    <button
                      onClick={() => handleFinalSave("Active")}
                      disabled={createMutation.isPending}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {createMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}{" "}
                      حفظ — جاهز للمراجعة
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 📚 Templates Modal (قوالب العقود) 📚 */}
      {/* ========================================== */}
      {isTemplatesOpen && <ContractTemplatesModal />}
    </div>
  );
};

export default ContractsScreen;
