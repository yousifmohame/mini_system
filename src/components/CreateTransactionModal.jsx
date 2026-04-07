import React, { useState, useMemo, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../api/axios";
import {
  X,
  Plus,
  FileText,
  User,
  Calculator,
  Briefcase,
  MapPin,
  Trash2,
  Paperclip,
  CheckCircle2,
  EyeOff,
  Search,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Copy,
  MessageCircle
} from "lucide-react";

// ============================================================================
// 💡 Helpers
// ============================================================================
const formatNumberWithCommas = (val) => {
  if (!val) return "";
  const numStr = val.toString().replace(/,/g, "");
  if (isNaN(numStr)) return val;
  return Number(numStr).toLocaleString("en-US");
};

const parseNumber = (val) => {
  if (!val) return 0;
  return Number(val.toString().replace(/,/g, ""));
};

// 💡 دالة تحويل الأرقام العربية (الهندية) إلى إنجليزية تلقائياً
const toEnglishNumbers = (str) => {
  if (str === null || str === undefined) return "";
  return String(str).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
};

const initialOwnerState = {
  isNewClient: false,
  clientId: "",
  ownerName: "",
  newClient: {
    type: "فرد سعودي",
    first: "",
    last: "",
    companyName: "",
    idNumber: "",
  },
};

// ============================================================================
// 💡 مكون مساعد: حقل ذكي يقبل الكتابة اليدوية مع الربط والبحث (Smart Linked Field)
// ============================================================================
const SmartLinkedField = ({
  label,
  value,
  onChange,
  options,
  matchFn,
  onQuickAdd,
  isAdding,
  placeholder,
  listId,
}) => {
  const isLinked = useMemo(() => {
    if (!value || value.trim() === "") return false;
    return options.some((opt) => matchFn(opt, value));
  }, [value, options, matchFn]);

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
          {label}
        </label>
        {value &&
          value.trim() !== "" &&
          (isLinked ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold shadow-sm">
              <CheckCircle2 size={12} /> مسجل بالنظام
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-bold flex items-center gap-1 shadow-sm">
                <AlertTriangle size={12} /> نص حر (غير مسجل)
              </span>
              {onQuickAdd && (
                <button
                  onClick={onQuickAdd}
                  disabled={isAdding}
                  className="text-[10px] bg-blue-600 text-white hover:bg-blue-700 px-2 py-0.5 rounded font-bold flex items-center gap-1 transition-all shadow-sm disabled:opacity-50"
                  title="إضافة سريعة للنظام"
                >
                  {isAdding ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Plus size={10} />
                  )}{" "}
                  إضافة للقاعدة
                </button>
              )}
            </div>
          ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={value}
          // 💡 إجبار التحويل إلى أرقام إنجليزية أثناء الكتابة
          onChange={(e) => onChange(toEnglishNumbers(e.target.value))}
          className={`w-full border rounded-lg px-3 py-2.5 text-sm font-bold outline-none transition-colors ${
            value && isLinked
              ? "border-emerald-300 focus:ring-1 focus:ring-emerald-500 bg-white"
              : "border-gray-300 focus:ring-1 focus:ring-purple-500 bg-gray-50 focus:bg-white"
          }`}
          placeholder={placeholder}
          list={listId}
        />
        <datalist id={listId}>
          {options.map((opt, idx) => (
            <option key={idx} value={opt.label || opt.name} />
          ))}
        </datalist>
      </div>
    </div>
  );
};

// ============================================================================
// 💡 مكون مساعد: قائمة منسدلة قابلة للبحث (Searchable Select)
// ============================================================================
const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(toEnglishNumbers(search).toLowerCase()),
    );
  }, [options, search]);

  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full border rounded-lg px-3 py-2.5 text-sm font-bold flex items-center justify-between cursor-pointer transition-colors ${disabled ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-50 border-gray-300 focus-within:border-blue-500 focus-within:bg-white"}`}
      >
        <span className={selectedLabel ? "text-gray-800" : "text-gray-400"}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0">
            <div className="relative">
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="اكتب للبحث..."
                value={search}
                onChange={(e) => setSearch(toEnglishNumbers(e.target.value))}
                className="w-full pl-2 pr-7 py-1.5 text-xs font-bold border border-gray-300 rounded outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="overflow-y-auto custom-scrollbar-slim">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value, opt);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-gray-50 last:border-0 font-bold"
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-gray-400">
                لا توجد نتائج مطابقة
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 💡 مكون محول العملات الثلاثي (Triple Currency Input)
// ============================================================================
const TripleCurrencyInput = ({ valueSar, onChangeSar, rates }) => {
  const usdRate = rates.find((r) => r.currency === "USD")?.rate || 0.266;
  const egpRate = rates.find((r) => r.currency === "EGP")?.rate || 13.2;
  const handleFocus = (e) => e.target.select();

  return (
    <div className="flex gap-2 w-full">
      <div className="flex-1 relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
          SAR
        </span>
        <input
          type="text"
          value={valueSar || ""}
          // 💡 إجبار التحويل للأرقام الإنجليزية
          onChange={(e) => onChangeSar(toEnglishNumbers(e.target.value))}
          onFocus={handleFocus}
          className="w-full bg-white border border-gray-300 rounded-md py-1.5 pl-8 pr-2 text-xs font-mono font-bold focus:border-blue-500 outline-none"
        />
      </div>
      <div className="flex-1 relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
          EGP
        </span>
        <input
          type="text"
          value={valueSar ? (valueSar * egpRate).toFixed(2) : ""}
          onChange={(e) =>
            onChangeSar(
              e.target.value
                ? (toEnglishNumbers(e.target.value) / egpRate).toFixed(2)
                : "",
            )
          }
          onFocus={handleFocus}
          className="w-full bg-slate-50 border border-gray-200 rounded-md py-1.5 pl-8 pr-2 text-xs font-mono focus:border-blue-500 outline-none"
        />
      </div>
      <div className="flex-1 relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
          USD
        </span>
        <input
          type="text"
          value={valueSar ? (valueSar * usdRate).toFixed(2) : ""}
          onChange={(e) =>
            onChangeSar(
              e.target.value
                ? (toEnglishNumbers(e.target.value) / usdRate).toFixed(2)
                : "",
            )
          }
          onFocus={handleFocus}
          className="w-full bg-slate-50 border border-gray-200 rounded-md py-1.5 pl-8 pr-2 text-xs font-mono focus:border-blue-500 outline-none"
        />
      </div>
    </div>
  );
};

// ============================================================================
// 💡 المكون الرئيسي: CreateTransactionModal
// ============================================================================
export const CreateTransactionModal = ({ isOpen, onClose, refetchTable }) => {
  const queryClient = useQueryClient();

  // جلب كافة البيانات المطلوبة لإنشاء المعاملة
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-simple-modal"],
    queryFn: async () => {
      const res = await api.get("/clients/simple");
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
    enabled: isOpen,
  });

  const { data: riyadhZones = [] } = useQuery({
    queryKey: ["riyadhZones-modal"],
    queryFn: async () => (await api.get("/riyadh-zones")).data?.data || [],
    enabled: isOpen,
  });

  const { data: persons = [] } = useQuery({
    queryKey: ["persons-directory-modal"],
    queryFn: async () => (await api.get("/persons")).data?.data || [],
    enabled: isOpen,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["riyadh-plans-modal"],
    queryFn: async () => (await api.get("/riyadh-streets/plans")).data || [],
    enabled: isOpen,
  });

  const { data: offices = [] } = useQuery({
    queryKey: ["coop-offices-modal"],
    queryFn: async () => (await api.get("/coop-offices")).data?.data || [],
    enabled: isOpen,
  });

  // تجهيز البيانات للقوائم
  const clientsOptions = useMemo(
    () => clients.map((c) => ({ label: c.name?.ar || c.name, value: c.id })),
    [clients],
  );
  const districtsOptions = useMemo(() => {
    let opts = [];
    riyadhZones.forEach((sector) => {
      sector.districts?.forEach((dist) => {
        opts.push({
          label: dist.name,
          value: dist.id,
          sectorName: sector.name,
        });
      });
    });
    return opts;
  }, [riyadhZones]);

  // تصفية الموظفين حسب الأدوار
  const brokers = useMemo(
    () => persons.filter((e) => e.role === "وسيط"),
    [persons],
  );
  const agents = useMemo(
    () => persons.filter((e) => e.role === "معقب"),
    [persons],
  );
  const stakeholders = useMemo(
    () => persons.filter((e) => e.role === "صاحب مصلحة"),
    [persons],
  );
  const receivers = useMemo(
    () =>
      persons.filter(
        (e) =>
          e.role === "موظف" || e.role === "مدير" || e.role === "موظف عن بعد",
      ),
    [persons],
  );
  const engBrokers = useMemo(
    () => persons.filter((e) => e.role === "وسيط المكتب الهندسي"),
    [persons],
  );

  // =======================================================
  // 💡 Mutations للإضافة السريعة (Quick Adds)
  // =======================================================
  const quickAddDistrict = useMutation({
    mutationFn: async (name) =>
      await api.post("/riyadh-streets/districts", {
        name,
        sectorId: riyadhZones[0]?.id,
      }),
    onSuccess: () => {
      toast.success("تمت إضافة الحي!");
      queryClient.invalidateQueries(["riyadhZones-modal"]);
    },
  });

  // 💡 تم إصلاح مسار إضافة المكتب المتعاون ليطابق الباك إند
  const quickAddOffice = useMutation({
    mutationFn: async (name) =>
      await api.post("/coop-offices", {
        name: name,
        isLinkedToSystem: "غير مفعل",
        monthlyAmount: 0,
      }),
    onSuccess: () => {
      toast.success("تمت إضافة المكتب بنجاح!");
      queryClient.invalidateQueries(["coop-offices-modal"]);
    },
    onError: (err) => {
      toast.error("حدث خطأ أثناء إضافة المكتب!");
    },
  });

  const quickAddBroker = useMutation({
    mutationFn: async (name) =>
      await api.post("/persons", { name, role: "وسيط", phone: "0500000000" }),
    onSuccess: () => {
      toast.success("تمت إضافة الوسيط!");
      queryClient.invalidateQueries(["persons-directory-modal"]);
    },
  });

  // =======================================================
  // 💡 State المعاملة الشامل
  // =======================================================
  const initialForm = {
    internalName: "",
    isInternalNameHidden: false,

    owners: [{ ...initialOwnerState }], // 👈 دعم تعدد الملاك

    districtName: "",
    districtId: "",
    sector: "غير محدد",

    transactionType: "بيع",
    surveyType: "برفع",
    plots: [""],
    plan: "",
    landArea: "", // 👈 حقل المساحة الجديد
    oldDeed: "",
    serviceNo: "",
    requestNo: "",
    licenseNo: "",

    entities: [],
    externalSource: "مكتب ديتيلز",

    feeType: "نهائي",
    isFeeDelayed: false,
    totalFees: "",
    taxType: "بدون احتساب ضريبة",
    firstPayment: "",

    brokerName: "",
    brokerId: "",
    mediatorFees: "",
    followUpAgentId: "",
    agentFees: "",
    stakeholderId: "",
    receiverId: "",
    engOfficeBrokerId: "",

    sourceType: "شريك بالمكتب",
    sourceName: "",
    sourcePercent: "",

    receivedAttachments: [],
    customAttachments: [],
    comments: [""], // 👈 2. مصفوفة التعليقات المبدئية
  };

  const [formData, setFormData] = useState(initialForm);

  // دوال الحسبة الضريبية
  const calculateTax = () => {
    const total = parseNumber(formData.totalFees) || 0;
    if (total === 0) return { net: 0, tax: 0 };
    if (formData.taxType === "شامل الضريبة") {
      const net = total / 1.15;
      return { net, tax: total - net };
    } else if (formData.taxType === "غير شامل الضريبة") {
      return { net: total, tax: total * 0.15 };
    }
    return { net: total, tax: 0 };
  };

  const { net: netAmount, tax: taxAmount } = calculateTax();

  const handleClose = () => {
    setFormData(initialForm);
    onClose();
  };

  // دوال التعامل مع المصفوفات (الملاك، القطع، المرفقات)
  const addOwner = () =>
    setFormData((p) => ({
      ...p,
      owners: [...p.owners, { ...initialOwnerState }],
    }));
  const removeOwner = (idx) =>
    setFormData((p) => ({
      ...p,
      owners: p.owners.filter((_, i) => i !== idx),
    }));
  const updateOwner = (idx, field, val) => {
    const newOwners = [...formData.owners];
    newOwners[idx][field] = val;
    setFormData((p) => ({ ...p, owners: newOwners }));
  };
  const updateNewClientObj = (idx, field, val) => {
    const newOwners = [...formData.owners];
    newOwners[idx].newClient[field] = val;
    setFormData((p) => ({ ...p, owners: newOwners }));
  };

  const addPlotRow = () =>
    setFormData((p) => ({ ...p, plots: [...p.plots, ""] }));
  const removePlotRow = (idx) =>
    setFormData((p) => ({ ...p, plots: p.plots.filter((_, i) => i !== idx) }));
  const updatePlot = (idx, val) => {
    const newPlots = [...formData.plots];
    newPlots[idx] = val;
    setFormData((p) => ({ ...p, plots: newPlots }));
  };

  const toggleArrayItem = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const addCustomAttachment = () =>
    setFormData((p) => ({
      ...p,
      customAttachments: [...p.customAttachments, ""],
    }));
  const removeCustomAttachment = (idx) =>
    setFormData((p) => ({
      ...p,
      customAttachments: p.customAttachments.filter((_, i) => i !== idx),
    }));
  const updateCustomAttachment = (idx, val) => {
    const newAtt = [...formData.customAttachments];
    newAtt[idx] = val;
    setFormData((p) => ({ ...p, customAttachments: newAtt }));
  };

  // 👈 3. دوال التعامل مع التعليقات
  const addCommentRow = () => setFormData((p) => ({ ...p, comments: [...p.comments, ""] }));
  const removeCommentRow = (idx) => setFormData((p) => ({ ...p, comments: p.comments.filter((_, i) => i !== idx) }));
  const updateComment = (idx, val) => {
    const newComments = [...formData.comments];
    newComments[idx] = val;
    setFormData((p) => ({ ...p, comments: newComments }));
  };

  const createMutation = useMutation({
    mutationFn: async (payload) => api.post("/private-transactions", payload),
    onSuccess: () => {
      toast.success("تم إنشاء المعاملة بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      queryClient.invalidateQueries(["private-dashboard-stats"]);
      if (refetchTable) refetchTable();
      handleClose();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ أثناء الإنشاء"),
  });

  const handleSubmit = () => {
    let finalNames = [];
    let finalIds = [];
    let primaryClientId = formData.owners[0].clientId;
    let primaryClientType = formData.owners[0].isNewClient
      ? formData.owners[0].newClient.type
      : undefined;

    // 💡 تجميع أسماء الملاك وهوياتهم
    for (let i = 0; i < formData.owners.length; i++) {
      let o = formData.owners[i];
      if (o.isNewClient) {
        let name =
          o.newClient.type.includes("شركة") || o.newClient.type.includes("جهة")
            ? o.newClient.companyName
            : `${o.newClient.first} ${o.newClient.last}`;
        if (!name.trim())
          return toast.error(`يرجى إكمال اسم المالك رقم ${i + 1}`);
        finalNames.push(name.trim());
        if (o.newClient.idNumber) finalIds.push(o.newClient.idNumber);
      } else {
        if (!o.clientId && !o.ownerName)
          return toast.error(
            `الرجاء اختيار المالك رقم ${i + 1} أو إنشاء مالك جديد`,
          );
        finalNames.push(o.ownerName);
      }
    }

    const finalOwnerName = finalNames.join(" و ");
    const finalOwnerIdNumber = finalIds.join(" - ");

    if (!formData.districtName)
      return toast.error("الرجاء تحديد الحي (الموقع)");
    if (!formData.isFeeDelayed && !formData.totalFees)
      return toast.error("الرجاء تحديد الأتعاب الإجمالية أو تأجيلها");

    const validPlots = formData.plots.filter((p) => p.trim() !== "");
    const validAttachments = [
      ...formData.receivedAttachments,
      ...formData.customAttachments.filter((a) => a.trim() !== ""),
    ];

    // 👈 4. تصفية التعليقات الصالحة وتنسيقها لتُرسل كـ Notes
    const validComments = formData.comments.filter(c => c.trim() !== "").map(text => ({
       id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
       text: text,
       user: currentUser || "المنشئ",
       date: new Date().toISOString()
    }));

    const payload = {
      ...formData,
      ownerName: finalOwnerName,
      ownerIdNumber: finalOwnerIdNumber,
      clientId: primaryClientId,
      clientType: primaryClientType,
      plots: validPlots,
      receivedAttachmentsList: validAttachments,
      source: formData.externalSource,
      district: formData.districtName, // إرسال الاسم النصي للحي
      brokerId: formData.brokerId || undefined,
      totalFees: formData.isFeeDelayed ? 0 : parseNumber(formData.totalFees),
      firstPayment: formData.isFeeDelayed
        ? 0
        : parseNumber(formData.firstPayment),
      mediatorFees: parseNumber(formData.mediatorFees),
      agentFees: parseNumber(formData.agentFees),
      sourcePercent: parseNumber(formData.sourcePercent),
      extraNotes: {
        taxData: {
          taxType: formData.taxType,
          netAmount: netAmount,
          taxAmount: taxAmount,
        },
        transactionComments: validComments
      },
    };

    createMutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-gray-50 rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-sm">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-800 tracking-tight">
                فتح وتسجيل معاملة جديدة
              </h2>
              <p className="text-xs font-bold text-gray-500 mt-0.5">
                قم بتعبئة البيانات الأساسية، الأطراف المرتبطة، والمستندات
                المستلمة.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 bg-white rounded-lg transition-colors shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar-slim">
          {/* 1. الاسم المتداول */}
          <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-blue-500"></div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-black text-gray-800 flex items-center gap-2">
                الاسم المتداول للمعامله (داخلي للمكتب)
              </label>
              <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                <input
                  type="checkbox"
                  className="accent-blue-600 w-4 h-4"
                  checked={formData.isInternalNameHidden}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isInternalNameHidden: e.target.checked,
                    })
                  }
                />
                <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                  <EyeOff className="w-3.5 h-3.5" /> إخفاء عن العميل/التقارير
                </span>
              </label>
            </div>
            <input
              type="text"
              value={formData.internalName}
              onChange={(e) =>
                setFormData({ ...formData, internalName: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="مثال: فيلا الياسمين - مشروع أبو محمد..."
            />
          </section>

          {/* 👈 6. قسم التعليقات المبدئية (جديد) */}
          <section className="bg-orange-50/50 p-5 rounded-xl border border-orange-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-orange-100 pb-3">
              <h3 className="text-sm font-black text-orange-800 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> تعليقات وتوجيهات على المعاملة (فري تكست)
              </h3>
              <button
                onClick={addCommentRow}
                className="bg-white text-orange-600 border border-orange-200 hover:bg-orange-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Plus size={14} /> إضافة تعليق آخر
              </button>
            </div>

            <div className="space-y-3">
              {formData.comments.map((comment, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <textarea
                    value={comment}
                    onChange={(e) => updateComment(idx, e.target.value)}
                    placeholder={`اكتب التعليق أو التوجيه رقم ${idx + 1} هنا...`}
                    className="flex-1 border border-orange-200 rounded-lg px-3 py-2.5 text-sm font-bold focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none bg-white min-h-[60px] resize-none"
                  />
                  {formData.comments.length > 1 && (
                    <button
                      onClick={() => removeCommentRow(idx)}
                      className="text-red-400 hover:text-red-600 p-2.5 bg-white border border-red-100 rounded-lg shadow-sm"
                      title="حذف التعليق"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-orange-600 font-bold mt-2">ملاحظة: ستظهر هذه التعليقات في تبويب "التعليقات" داخل ملف المعاملة.</p>
          </section>

          {/* 2. بيانات المُلّاك (متعدد) */}
          <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-blue-800 flex items-center gap-2">
                <User className="w-4 h-4" /> بيانات المُلاّك / العملاء
              </h3>
              <button
                onClick={addOwner}
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Plus size={14} /> إضافة مالك آخر
              </button>
            </div>

            <div className="space-y-4">
              {formData.owners.map((owner, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-xl relative"
                >
                  {index > 0 && (
                    <button
                      onClick={() => removeOwner(index)}
                      className="absolute top-3 left-3 text-red-400 hover:text-red-600 bg-white border border-red-100 p-1.5 rounded-lg shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  <div className="flex gap-4 mb-4">
                    <label
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${!owner.isNewClient ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                    >
                      <input
                        type="radio"
                        name={`clientMode-${index}`}
                        className="accent-blue-600"
                        checked={!owner.isNewClient}
                        onChange={() =>
                          updateOwner(index, "isNewClient", false)
                        }
                      />
                      <span className="text-xs font-bold text-gray-800">
                        اختيار مالك مسجل مسبقاً
                      </span>
                    </label>
                    <label
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${owner.isNewClient ? "border-green-600 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                    >
                      <input
                        type="radio"
                        name={`clientMode-${index}`}
                        className="accent-green-600"
                        checked={owner.isNewClient}
                        onChange={() => {
                          updateOwner(index, "isNewClient", true);
                          updateOwner(index, "clientId", "");
                          updateOwner(index, "ownerName", "");
                        }}
                      />
                      <span className="text-xs font-bold text-gray-800">
                        إنشاء مالك جديد (سريع)
                      </span>
                    </label>
                  </div>

                  {!owner.isNewClient ? (
                    <div className="w-full md:w-1/2">
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">
                        ابحث عن المالك {index + 1} *
                      </label>
                      <SearchableSelect
                        options={clientsOptions}
                        value={owner.clientId}
                        placeholder="ابحث بالاسم..."
                        onChange={(val, opt) => {
                          updateOwner(index, "clientId", val);
                          updateOwner(index, "ownerName", opt.label);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          نوع العميل *
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            "فرد سعودي",
                            "فرد غير سعودي",
                            "شركة / مؤسسة",
                            "جهة حكومية",
                            "ورثة",
                          ].map((type) => (
                            <button
                              key={type}
                              onClick={() =>
                                updateNewClientObj(index, "type", type)
                              }
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${owner.newClient.type === type ? "bg-green-600 text-white border-green-600" : "bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100"}`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        {owner.newClient.type.includes("شركة") ||
                        owner.newClient.type.includes("جهة") ? (
                          <>
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                                اسم الشركة / الجهة *
                              </label>
                              <input
                                type="text"
                                value={owner.newClient.companyName}
                                onChange={(e) =>
                                  updateNewClientObj(
                                    index,
                                    "companyName",
                                    e.target.value,
                                  )
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold focus:border-green-500 outline-none bg-gray-50 focus:bg-white"
                                placeholder="اسم الشركة..."
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                                رقم السجل / الموحد
                              </label>
                              <input
                                type="text"
                                value={owner.newClient.idNumber}
                                onChange={(e) =>
                                  updateNewClientObj(
                                    index,
                                    "idNumber",
                                    toEnglishNumbers(e.target.value),
                                  )
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:border-green-500 outline-none bg-gray-50 focus:bg-white"
                                placeholder="1010XXXXXX"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                                الاسم الأول *
                              </label>
                              <input
                                type="text"
                                value={owner.newClient.first}
                                onChange={(e) =>
                                  updateNewClientObj(
                                    index,
                                    "first",
                                    e.target.value,
                                  )
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold focus:border-green-500 outline-none bg-gray-50 focus:bg-white"
                                placeholder="الأول"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                                الاسم الأخير
                              </label>
                              <input
                                type="text"
                                value={owner.newClient.last}
                                onChange={(e) =>
                                  updateNewClientObj(
                                    index,
                                    "last",
                                    e.target.value,
                                  )
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold focus:border-green-500 outline-none bg-gray-50 focus:bg-white"
                                placeholder="العائلة"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                                رقم الهوية / الإقامة
                              </label>
                              <input
                                type="text"
                                value={owner.newClient.idNumber}
                                onChange={(e) =>
                                  updateNewClientObj(
                                    index,
                                    "idNumber",
                                    toEnglishNumbers(e.target.value),
                                  )
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:border-green-500 outline-none bg-gray-50 focus:bg-white"
                                placeholder="10XXXXXXXX"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 3. الموقع والعقار */}
          <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-black text-purple-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <MapPin className="w-4 h-4" /> الموقع، المخطط، وتفاصيل الطلب
            </h3>

            <div className="grid grid-cols-4 gap-5 mb-5">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  نوع المعاملة *
                </label>
                <input
                  type="text"
                  list="transaction-types-options"
                  value={formData.transactionType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transactionType: e.target.value,
                    })
                  }
                  placeholder="اختر أو اكتب..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-bold focus:border-purple-500 outline-none bg-gray-50 focus:bg-white transition-colors"
                />
                <datalist id="transaction-types-options">
                  <option value="اصدار" />
                  <option value="تجديد" />
                  <option value="تعديل" />
                  <option value="تجديد وتعديل" />
                  <option value="نقل ملكية" />
                  <option value="تصحيح وضع مبني قائم" />
                </datalist>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block mb-1.5 text-gray-700 text-xs font-bold">
                  نوع الرفع
                </label>
                <div className="flex gap-2">
                  {["برفع", "بدون رفع"].map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        setFormData({ ...formData, surveyType: type })
                      }
                      className={`flex-1 py-2.5 rounded-lg transition-colors text-xs font-bold border ${formData.surveyType === type ? "bg-purple-600 border-purple-600 text-white" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-4 md:col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <SmartLinkedField
                    label="الحي (الموقع) *"
                    value={formData.districtName}
                    onChange={(val) => {
                      const found = districtsOptions.find(
                        (o) => o.label === val || o.label.includes(val),
                      );
                      setFormData({
                        ...formData,
                        districtName: val,
                        districtId: found ? found.value : "",
                        sector: found ? `قطاع ${found.sectorName}` : "غير محدد",
                      });
                    }}
                    options={districtsOptions}
                    listId="district-smart-list"
                    placeholder="ابحث أو اكتب الحي..."
                    matchFn={(opt, val) =>
                      opt.label === val || opt.label.includes(val)
                    }
                    isAdding={quickAddDistrict.isPending}
                    onQuickAdd={() =>
                      quickAddDistrict.mutate(formData.districtName)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    الجهة / القطاع (تلقائي)
                  </label>
                  <input
                    type="text"
                    value={formData.sector}
                    readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-bold text-gray-600 outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5">
              {/* القطع */}
              <div className="col-span-3 md:col-span-1 border border-gray-200 rounded-xl p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-800">
                    أرقام القطع
                  </label>
                  <button
                    onClick={addPlotRow}
                    className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded hover:bg-blue-200"
                  >
                    <Plus className="w-3 h-3 inline" /> إضافة قطعة
                  </button>
                </div>
                <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar-slim pr-1">
                  {formData.plots.map((plot, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={plot}
                        onChange={(e) =>
                          updatePlot(idx, toEnglishNumbers(e.target.value))
                        }
                        placeholder={`رقم القطعة ${idx + 1}`}
                        className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono focus:border-purple-500 outline-none bg-white"
                      />
                      {formData.plots.length > 1 && (
                        <button
                          onClick={() => removePlotRow(idx)}
                          className="text-red-400 hover:text-red-600 p-1.5 bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-3 md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    رقم المخطط (إدخال أو اختيار)
                  </label>
                  <input
                    type="text"
                    list="plans-list"
                    value={formData.plan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plan: toEnglishNumbers(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:border-purple-500 outline-none bg-gray-50 focus:bg-white"
                    placeholder="أدخل أو اختر المخطط"
                  />
                  <datalist id="plans-list">
                    {plans.map((p) => (
                      <option key={p.id} value={p.planNumber} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    رقم الصك القديم
                  </label>
                  <input
                    type="text"
                    value={formData.oldDeed}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        oldDeed: toEnglishNumbers(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:border-purple-500 outline-none bg-gray-50 focus:bg-white"
                    placeholder="أدخل الصك"
                  />
                </div>
                {/* 👈 حقل المساحة الجديد */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    مساحة الأرض (م²)
                  </label>
                  <input
                    type="text" // غيرناه إلى text ليقبل التحويل اللحظي
                    value={formData.landArea}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        landArea: toEnglishNumbers(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:border-purple-500 outline-none bg-gray-50 focus:bg-white"
                    placeholder="المساحة"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    رقم الخدمة (بلدي/إحكام)
                  </label>
                  <input
                    type="text"
                    value={formData.serviceNo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        serviceNo: toEnglishNumbers(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:border-purple-500 outline-none bg-gray-50 focus:bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    رقم الطلب / الرخصة
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.requestNo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requestNo: toEnglishNumbers(e.target.value),
                        })
                      }
                      className="w-1/2 border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:border-purple-500 outline-none bg-gray-50 focus:bg-white"
                      placeholder="رقم الطلب"
                    />
                    <input
                      type="text"
                      value={formData.licenseNo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          licenseNo: toEnglishNumbers(e.target.value),
                        })
                      }
                      className="w-1/2 border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:border-purple-500 outline-none bg-gray-50 focus:bg-white"
                      placeholder="رقم الرخصة"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4 grid grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-gray-700 text-xs font-bold">
                  الجهات المرتبطة بالمعاملة
                </label>
                <div className="flex flex-wrap gap-4">
                  {["الأمانة", "الهيئة الملكية لمدينة الرياض", "القطاع"].map(
                    (entity) => (
                      <label
                        key={entity}
                        className="flex items-center gap-1.5 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={formData.entities.includes(entity)}
                          onChange={() => toggleArrayItem("entities", entity)}
                          className="accent-purple-600 w-4 h-4"
                        />
                        <span className="text-gray-700 text-xs font-bold">
                          {entity}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>
              <div>
                <SmartLinkedField
                  label="مصدر المعاملة الخارجي"
                  value={formData.externalSource}
                  onChange={(val) =>
                    setFormData({ ...formData, externalSource: val })
                  }
                  options={offices.map((o) => ({ label: o.name, value: o.id }))}
                  listId="external-sources-list"
                  placeholder="اكتب اسم المكتب أو الجهة المحيلة..."
                  matchFn={(opt, val) =>
                    opt.label === val || val === "مكتب ديتيلز"
                  }
                  isAdding={quickAddOffice.isPending}
                  onQuickAdd={() =>
                    quickAddOffice.mutate(formData.externalSource)
                  }
                />
              </div>
            </div>
          </section>

          {/* 4. الماليات والأطراف */}
          <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-green-700 flex items-center gap-2">
                <Calculator className="w-4 h-4" /> الماليات والأطراف
              </h3>
              <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors">
                <input
                  type="checkbox"
                  className="accent-amber-600 w-4 h-4"
                  checked={formData.isFeeDelayed}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isFeeDelayed: e.target.checked,
                      totalFees: "",
                      firstPayment: "",
                    })
                  }
                />
                <span className="text-xs font-bold text-amber-800">
                  تحديد الأتعاب الإجمالية لاحقاً
                </span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div
                className={`space-y-4 rounded-xl border p-4 transition-all ${formData.isFeeDelayed ? "bg-gray-50 border-gray-200 opacity-60 pointer-events-none" : "bg-green-50/50 border-green-200"}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-gray-800">
                      الأتعاب الإجمالية للمكتب *
                    </label>
                    <div className="flex bg-white rounded border border-gray-200 overflow-hidden">
                      <button
                        onClick={() =>
                          setFormData({ ...formData, feeType: "مبدئي" })
                        }
                        className={`px-2 py-1 text-[10px] font-bold ${formData.feeType === "مبدئي" ? "bg-amber-100 text-amber-800" : "text-gray-500"}`}
                      >
                        مبدئي
                      </button>
                      <button
                        onClick={() =>
                          setFormData({ ...formData, feeType: "نهائي" })
                        }
                        className={`px-2 py-1 text-[10px] font-bold border-r border-gray-200 ${formData.feeType === "نهائي" ? "bg-green-100 text-green-800" : "text-gray-500"}`}
                      >
                        نهائي
                      </button>
                    </div>
                  </div>

                  <div className="relative mb-2">
                    <input
                      type="text"
                      disabled={formData.isFeeDelayed}
                      value={formatNumberWithCommas(formData.totalFees)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalFees: toEnglishNumbers(e.target.value),
                        })
                      }
                      className="w-full border border-green-400 rounded-lg px-3 py-2.5 text-lg font-black font-mono text-green-700 focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none transition-all disabled:bg-gray-100"
                      placeholder="0"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-bold">
                      ر.س
                    </span>
                  </div>

                  <select
                    value={formData.taxType}
                    onChange={(e) =>
                      setFormData({ ...formData, taxType: e.target.value })
                    }
                    disabled={formData.isFeeDelayed}
                    className="w-full border border-green-200 bg-white rounded-lg px-2 py-2 text-[11px] font-bold text-gray-700 outline-none mb-2 focus:border-green-500 cursor-pointer"
                  >
                    <option value="بدون احتساب ضريبة">
                      بدون احتساب ضريبة (صافي)
                    </option>
                    <option value="شامل الضريبة">
                      شامل الضريبة (15% مدمجة)
                    </option>
                    <option value="غير شامل الضريبة">
                      غير شامل الضريبة (تضاف 15%)
                    </option>
                  </select>

                  {!formData.isFeeDelayed &&
                    parseNumber(formData.totalFees) > 0 &&
                    formData.taxType !== "بدون احتساب ضريبة" && (
                      <div className="bg-white border border-green-100 p-2 rounded-md text-[10px] font-mono leading-relaxed shadow-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>المبلغ الصافي:</span>
                          <span className="font-bold text-gray-800">
                            {netAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            ر.س
                          </span>
                        </div>
                        <div className="flex justify-between text-red-600 mt-1">
                          <span>قيمة الضريبة (15%):</span>
                          <span className="font-bold">
                            {taxAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            ر.س
                          </span>
                        </div>
                      </div>
                    )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    الدفعة الأولى (مُحصّل الآن)
                  </label>
                  <input
                    type="text"
                    disabled={formData.isFeeDelayed}
                    value={formatNumberWithCommas(formData.firstPayment)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        firstPayment: toEnglishNumbers(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono font-bold focus:border-green-500 outline-none disabled:bg-gray-100"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <SmartLinkedField
                    label="الوسيط / المسوق"
                    value={formData.brokerName}
                    onChange={(val) => {
                      const found = brokers.find((b) => b.name === val);
                      setFormData({
                        ...formData,
                        brokerName: val,
                        brokerId: found ? found.id : "",
                      });
                    }}
                    options={brokers.map((b) => ({
                      label: b.name,
                      value: b.id,
                    }))}
                    listId="brokers-smart-list"
                    placeholder="اختر أو اكتب اسم الوسيط..."
                    matchFn={(opt, val) => opt.label === val}
                    isAdding={quickAddBroker.isPending}
                    onQuickAdd={() =>
                      quickAddBroker.mutate(formData.brokerName)
                    }
                  />
                  <div className="mt-3">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">
                      أتعاب الوسيط
                    </label>
                    <input
                      type="text"
                      value={formatNumberWithCommas(formData.mediatorFees)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mediatorFees: toEnglishNumbers(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-red-600 focus:border-blue-500 outline-none bg-white"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5">
                    المعقب / المراجع
                  </label>
                  <select
                    value={formData.followUpAgentId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        followUpAgentId: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none mb-3 bg-white"
                  >
                    <option value="">بدون معقب</option>
                    {agents.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">
                    أتعاب المعقب
                  </label>
                  <input
                    type="text"
                    value={formatNumberWithCommas(formData.agentFees)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        agentFees: toEnglishNumbers(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-red-600 focus:border-blue-500 outline-none bg-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5">
                    صاحب المصلحة
                  </label>
                  <select
                    value={formData.stakeholderId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stakeholderId: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-xs focus:border-blue-500 outline-none"
                  >
                    <option value="">-- اختياري --</option>
                    {stakeholders.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5">
                    المستلم (موظف الاستلام)
                  </label>
                  <select
                    value={formData.receiverId}
                    onChange={(e) =>
                      setFormData({ ...formData, receiverId: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-xs focus:border-blue-500 outline-none"
                  >
                    <option value="">-- اختياري --</option>
                    {receivers.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5">
                    وسيط المكتب الهندسي
                  </label>
                  <select
                    value={formData.engOfficeBrokerId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        engOfficeBrokerId: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-xs focus:border-blue-500 outline-none"
                  >
                    <option value="">-- اختياري --</option>
                    {engBrokers.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 grid grid-cols-3 gap-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100 mt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 mb-1.5">
                      نوع المصدر (للأرباح)
                    </label>
                    <select
                      value={formData.sourceType}
                      onChange={(e) =>
                        setFormData({ ...formData, sourceType: e.target.value })
                      }
                      className="w-full border border-amber-200 rounded-lg px-3 py-2.5 text-xs focus:border-amber-500 outline-none bg-white"
                    >
                      <option value="شريك بالمكتب">شريك بالمكتب</option>
                      <option value="مكتب وسيط">مكتب وسيط</option>
                      <option value="موظف">موظف</option>
                      <option value="عميل مباشر">عميل مباشر (بدون نسبة)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 mb-1.5">
                      اسم المصدر
                    </label>
                    <select
                      value={formData.sourceName}
                      onChange={(e) =>
                        setFormData({ ...formData, sourceName: e.target.value })
                      }
                      className="w-full border border-amber-200 rounded-lg px-3 py-2.5 text-xs focus:border-amber-500 outline-none bg-white"
                      disabled={formData.sourceType === "عميل مباشر"}
                    >
                      <option value="">اختر...</option>
                      {persons.map((emp) => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 mb-1.5">
                      نسبة المصدر %
                    </label>
                    <input
                      type="text"
                      value={formData.sourcePercent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sourcePercent: toEnglishNumbers(e.target.value),
                        })
                      }
                      className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm font-mono font-bold focus:border-amber-500 outline-none bg-white"
                      placeholder="0"
                      disabled={formData.sourceType === "عميل مباشر"}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. المرفقات المستلمة */}
          <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Paperclip className="w-4 h-4 text-blue-500" /> المرفقات
              والمستندات المستلمة من العميل
            </h3>

            <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/50">
              <label className="block mb-3 text-slate-600 text-xs font-bold">
                المرفقات الأساسية المتوقعة
              </label>
              <div className="flex flex-wrap gap-4">
                {[
                  "عرض سعر",
                  "فاتورة",
                  "عقد",
                  "رخصة البناء",
                  "صورة الطلب",
                  "صورة الصك",
                  "صورة الهوية",
                  "الكروكي المساحي",
                  "أخري",
                ].map((doc) => (
                  <label
                    key={doc}
                    className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={formData.receivedAttachments.includes(doc)}
                      onChange={() =>
                        toggleArrayItem("receivedAttachments", doc)
                      }
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span className="text-slate-700 text-xs font-bold">
                      {doc}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-6 border-t border-blue-200/60 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-slate-600 text-xs font-bold">
                    مرفقات أخرى مخصصة (نص حر)
                  </label>
                  <button
                    onClick={addCustomAttachment}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> إضافة مرفق آخر
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.customAttachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={att}
                        onChange={(e) =>
                          updateCustomAttachment(idx, e.target.value)
                        }
                        placeholder={`اسم المرفق المخصص ${idx + 1}...`}
                        className="flex-1 px-3 py-2.5 text-xs font-bold border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white"
                      />
                      <button
                        onClick={() => removeCustomAttachment(idx)}
                        className="text-red-500 hover:bg-red-50 p-2.5 border border-red-100 bg-white rounded-lg transition-colors shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.customAttachments.length === 0 && (
                    <div className="text-xs text-gray-400 font-semibold italic bg-white border border-dashed border-gray-200 p-3 rounded-lg text-center">
                      لا توجد مرفقات مخصصة مضافة.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <div className="text-[11px] text-gray-500 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> سيتم توليد
            وتكويد رقم مرجعي تلقائياً للحفاظ على التسلسل.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 transition-colors shadow-sm"
            >
              إلغاء التغييرات
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="px-8 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}{" "}
              اعتماد وإنشاء المعاملة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
