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
} from "lucide-react";

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
      opt.label.toLowerCase().includes(search.toLowerCase()),
    );
  }, [options, search]);

  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full border rounded-lg px-3 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors ${disabled ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border-gray-300 focus-within:border-blue-500"}`}
      >
        <span
          className={
            selectedLabel ? "text-gray-800 font-bold" : "text-gray-400"
          }
        >
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
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-2 pr-7 py-1.5 text-xs border border-gray-300 rounded outline-none focus:border-blue-500"
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
                  className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-gray-50 last:border-0 font-semibold"
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
// 💡 دالة تنسيق الأرقام بفواصل الآلاف
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
          label: `${dist.name} (قطاع ${sector.name})`,
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
  // 💡 State المعاملة الشامل
  // =======================================================
  const initialForm = {
    internalName: "",
    isInternalNameHidden: false,

    isNewClient: false,
    clientId: "",
    ownerName: "",

    // 👈 تحديث بيانات العميل الجديد لتدعم الأنواع
    newClient: {
      type: "فرد سعودي",
      first: "",
      last: "",
      companyName: "",
      idNumber: "",
    },

    districtId: "",
    sector: "غير محدد",
    office: "مكتب الرياض",

    transactionType: "بيع",
    surveyType: "برفع",
    plots: [""],
    plan: "",
    oldDeed: "",
    serviceNo: "",
    requestNo: "",
    licenseNo: "",

    entities: [],
    externalSource: "مكتب ديتيلز",

    feeType: "نهائي",
    isFeeDelayed: false, // 👈 خيار تحديد الأتعاب لاحقاً
    totalFees: "",
    taxType: "بدون احتساب ضريبة", // 👈 نوع الضريبة
    firstPayment: "",

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
  };

  const [formData, setFormData] = useState(initialForm);

  // 👈 دالة حساب الضريبة بناءً على نوع الاختيار
  const calculateTax = () => {
    const total = parseNumber(formData.totalFees) || 0;
    if (total === 0) return { net: 0, tax: 0 };

    if (formData.taxType === "شامل الضريبة") {
      // المبلغ الإجمالي يحتوي على الضريبة، نستخرج الصافي والضريبة
      const net = total / 1.15;
      const tax = total - net;
      return { net, tax };
    } else if (formData.taxType === "غير شامل الضريبة") {
      // المبلغ هو الصافي، والضريبة تضاف عليه
      const tax = total * 0.15;
      return { net: total, tax };
    } else {
      // بدون ضريبة (الصافي هو نفس المبلغ ولا يوجد ضريبة)
      return { net: total, tax: 0 };
    }
  };

  const { net: netAmount, tax: taxAmount } = calculateTax();

  const handleClose = () => {
    setFormData(initialForm);
    onClose();
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

  const createMutation = useMutation({
    mutationFn: async (payload) => api.post("/private-transactions", payload),
    onSuccess: () => {
      toast.success("تم إنشاء المعاملة بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      queryClient.invalidateQueries(["private-dashboard-stats"]);
      if (refetchTable) refetchTable();
      handleClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "حدث خطأ أثناء الإنشاء");
    },
  });

  const handleSubmit = () => {
    let finalOwnerName = formData.ownerName;
    let finalOwnerIdNumber = "";

    // التحقق من العميل الجديد
    if (formData.isNewClient) {
      const { type, first, last, companyName, idNumber } = formData.newClient;
      if (
        type.includes("شركة") ||
        type.includes("مؤسسة") ||
        type.includes("جهة")
      ) {
        finalOwnerName = companyName.trim();
        if (!finalOwnerName) return toast.error("يرجى إدخال اسم الشركة/الجهة");
      } else {
        finalOwnerName = `${first} ${last}`.trim();
        if (!first) return toast.error("يرجى إدخال الاسم الأول للمالك");
      }
      finalOwnerIdNumber = idNumber;
    } else {
      if (!formData.clientId)
        return toast.error("الرجاء اختيار العميل أو إنشاء عميل جديد");
    }

    if (!formData.districtId) return toast.error("الرجاء تحديد الحي (الموقع)");

    // التحقق من الأتعاب فقط إذا لم تكن مؤجلة
    if (!formData.isFeeDelayed && !formData.totalFees) {
      return toast.error(
        "الرجاء تحديد الأتعاب الإجمالية أو اختيار تحديدها لاحقاً",
      );
    }

    const validPlots = formData.plots.filter((p) => p.trim() !== "");
    const validAttachments = [
      ...formData.receivedAttachments,
      ...formData.customAttachments.filter((a) => a.trim() !== ""),
    ];

    // تحديد المبالغ النهائية التي سترسل للباك إند
    const finalTotalFees = formData.isFeeDelayed
      ? 0
      : parseNumber(formData.totalFees);
    const finalFirstPayment = formData.isFeeDelayed
      ? 0
      : parseNumber(formData.firstPayment);

    // 💡 تضمين نوع الضريبة والمبلغ الصافي والضريبة داخل الملاحظات كمرجع مالي
    const enhancedNotes = {
      taxData: {
        taxType: formData.taxType,
        netAmount: netAmount,
        taxAmount: taxAmount,
      },
    };

    const payload = {
      ...formData,
      ownerName: finalOwnerName,
      ownerIdNumber: finalOwnerIdNumber, // إرسال الهوية
      clientType: formData.isNewClient ? formData.newClient.type : undefined, // إرسال نوع العميل للباك إند
      plots: validPlots,
      receivedAttachmentsList: validAttachments,
      source: formData.externalSource,
      totalFees: finalTotalFees,
      firstPayment: finalFirstPayment,
      mediatorFees: parseNumber(formData.mediatorFees),
      agentFees: parseNumber(formData.agentFees),
      sourcePercent: parseNumber(formData.sourcePercent),
      extraNotes: enhancedNotes, // دمج الملاحظات الإضافية
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

          {/* 2. بيانات المالك */}
          <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-black text-blue-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <User className="w-4 h-4" /> بيانات المالك / العميل
            </h3>

            <div className="flex gap-4 mb-4">
              <label
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${!formData.isNewClient ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
              >
                <input
                  type="radio"
                  name="clientMode"
                  className="accent-blue-600"
                  checked={!formData.isNewClient}
                  onChange={() =>
                    setFormData({ ...formData, isNewClient: false })
                  }
                />
                <span className="text-xs font-bold text-gray-800">
                  اختيار عميل مسجل مسبقاً
                </span>
              </label>
              <label
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${formData.isNewClient ? "border-green-600 bg-green-50" : "border-gray-200 hover:bg-gray-50"}`}
              >
                <input
                  type="radio"
                  name="clientMode"
                  className="accent-green-600"
                  checked={formData.isNewClient}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      isNewClient: true,
                      clientId: "",
                      ownerName: "",
                    })
                  }
                />
                <span className="text-xs font-bold text-gray-800">
                  إنشاء عميل جديد (سريع)
                </span>
              </label>
            </div>

            {!formData.isNewClient ? (
              <div className="w-full md:w-1/2">
                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                  ابحث عن العميل *
                </label>
                <SearchableSelect
                  options={clientsOptions}
                  value={formData.clientId}
                  placeholder="ابحث بالاسم..."
                  onChange={(val, opt) =>
                    setFormData({
                      ...formData,
                      clientId: val,
                      ownerName: opt.label,
                    })
                  }
                />
              </div>
            ) : (
              <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 space-y-4">
                {/* 👈 نوع العميل الجديد */}
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
                          setFormData({
                            ...formData,
                            newClient: { ...formData.newClient, type: type },
                          })
                        }
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${formData.newClient.type === type ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 👈 حقول متغيرة بناءً على نوع العميل */}
                <div className="grid grid-cols-4 gap-3">
                  {formData.newClient.type.includes("شركة") ||
                  formData.newClient.type.includes("جهة") ? (
                    <>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                          اسم الشركة / الجهة بالكامل *
                        </label>
                        <input
                          type="text"
                          value={formData.newClient.companyName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              newClient: {
                                ...formData.newClient,
                                companyName: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold focus:border-green-500 outline-none"
                          placeholder="مثال: شركة التطوير العمراني المحدودة"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                          رقم السجل التجاري / الرقم الموحد
                        </label>
                        <input
                          type="text"
                          value={formData.newClient.idNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              newClient: {
                                ...formData.newClient,
                                idNumber: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:border-green-500 outline-none"
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
                          value={formData.newClient.first}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              newClient: {
                                ...formData.newClient,
                                first: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold focus:border-green-500 outline-none"
                          placeholder="الأول"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                          الاسم الأخير (العائلة)
                        </label>
                        <input
                          type="text"
                          value={formData.newClient.last}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              newClient: {
                                ...formData.newClient,
                                last: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold focus:border-green-500 outline-none"
                          placeholder="العائلة"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                          رقم الهوية / الإقامة
                        </label>
                        <input
                          type="text"
                          value={formData.newClient.idNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              newClient: {
                                ...formData.newClient,
                                idNumber: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:border-green-500 outline-none"
                          placeholder={
                            formData.newClient.type === "فرد سعودي"
                              ? "10XXXXXXXX"
                              : "20XXXXXXXX"
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* 3. الموقع والعقار */}
          <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-black text-purple-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <MapPin className="w-4 h-4" /> الموقع، المخطط، وتفاصيل الطلب
            </h3>

            <div className="grid grid-cols-4 gap-5 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  نوع المعاملة *
                </label>
                <select
                  value={formData.transactionType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transactionType: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-bold focus:border-purple-500 outline-none bg-gray-50 focus:bg-white"
                >
                  <option>اصدار</option>
                  <option>تجديد</option>
                  <option>تعديل</option>
                  <option>تصحيح وضع مبني قائم</option>
                </select>
              </div>

              <div>
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

              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    الحي (للبحث السريع) *
                  </label>
                  <SearchableSelect
                    options={districtsOptions}
                    value={formData.districtId}
                    placeholder="ابحث عن الحي..."
                    onChange={(val, opt) =>
                      setFormData({
                        ...formData,
                        districtId: val,
                        sector: `قطاع ${opt.sectorName}`,
                      })
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
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-600 outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5">
              {/* القطع */}
              <div className="col-span-1 border border-gray-200 rounded-xl p-3 bg-gray-50">
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
                        onChange={(e) => updatePlot(idx, e.target.value)}
                        placeholder={`رقم القطعة ${idx + 1}`}
                        className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs font-mono focus:border-blue-500 outline-none"
                      />
                      {formData.plots.length > 1 && (
                        <button
                          onClick={() => removePlotRow(idx)}
                          className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    رقم المخطط (إدخال أو اختيار)
                  </label>
                  <input
                    type="text"
                    list="plans-list"
                    value={formData.plan}
                    onChange={(e) =>
                      setFormData({ ...formData, plan: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-purple-500 outline-none"
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
                      setFormData({ ...formData, oldDeed: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-purple-500 outline-none"
                    placeholder="أدخل الصك"
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
                      setFormData({ ...formData, serviceNo: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    رقم الطلب / الرخصة
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.requestNo}
                      onChange={(e) =>
                        setFormData({ ...formData, requestNo: e.target.value })
                      }
                      className="w-1/2 border border-gray-300 rounded-lg px-2 py-2 text-xs font-mono focus:border-purple-500 outline-none"
                      placeholder="الطلب"
                    />
                    <input
                      type="text"
                      value={formData.licenseNo}
                      onChange={(e) =>
                        setFormData({ ...formData, licenseNo: e.target.value })
                      }
                      className="w-1/2 border border-gray-300 rounded-lg px-2 py-2 text-xs font-mono focus:border-purple-500 outline-none"
                      placeholder="الرخصة"
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
                        className="flex items-center gap-1.5 cursor-pointer"
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
                <label className="block mb-1.5 text-gray-700 text-xs font-bold">
                  مصدر المعاملة الخارجي
                </label>
                <select
                  value={formData.externalSource}
                  onChange={(e) =>
                    setFormData({ ...formData, externalSource: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none"
                >
                  <option value="مكتب ديتيلز">مكتب ديتيلز (داخلي)</option>
                  {offices.map((office) => (
                    <option key={office.id} value={office.name}>
                      {office.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 4. الماليات والأطراف */}
          <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-green-700 flex items-center gap-2">
                <Calculator className="w-4 h-4" /> الماليات والأطراف
              </h3>
              {/* 👈 زر تحديد الأتعاب لاحقاً */}
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
              {/* 👈 المربع الخاص بالأتعاب والضريبة (يختفي إذا تم تحديد الدفع لاحقاً) */}
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
                        setFormData({ ...formData, totalFees: e.target.value })
                      }
                      className="w-full border border-green-400 rounded-lg px-3 py-2.5 text-lg font-black font-mono text-green-700 focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none transition-all disabled:bg-gray-100"
                      placeholder="0"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-bold">
                      ر.س
                    </span>
                  </div>

                  {/* 👈 نظام الضريبة الجديد */}
                  <select
                    value={formData.taxType}
                    onChange={(e) =>
                      setFormData({ ...formData, taxType: e.target.value })
                    }
                    disabled={formData.isFeeDelayed}
                    className="w-full border border-green-200 bg-white rounded-md px-2 py-1.5 text-[11px] font-bold text-gray-700 outline-none mb-2"
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

                  {/* 👈 عرض الحسبة الضريبية مباشرة */}
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
                      setFormData({ ...formData, firstPayment: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono font-bold focus:border-green-500 outline-none disabled:bg-gray-100"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    الوسيط / المسوق
                  </label>
                  <select
                    value={formData.brokerId}
                    onChange={(e) =>
                      setFormData({ ...formData, brokerId: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:border-blue-500 outline-none mb-2"
                  >
                    <option value="">بدون وسيط</option>
                    {brokers.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">
                    أتعاب الوسيط
                  </label>
                  <input
                    type="text"
                    value={formatNumberWithCommas(formData.mediatorFees)}
                    onChange={(e) =>
                      setFormData({ ...formData, mediatorFees: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-mono font-bold text-red-600 focus:border-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:border-blue-500 outline-none mb-2"
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
                      setFormData({ ...formData, agentFees: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-mono font-bold text-red-600 focus:border-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:border-blue-500 outline-none"
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
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    المستلم (موظف الاستلام)
                  </label>
                  <select
                    value={formData.receiverId}
                    onChange={(e) =>
                      setFormData({ ...formData, receiverId: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:border-blue-500 outline-none"
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
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:border-blue-500 outline-none"
                  >
                    <option value="">-- اختياري --</option>
                    {engBrokers.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 grid grid-cols-3 gap-3 bg-amber-50/50 p-3 rounded-lg border border-amber-100 mt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 mb-1">
                      نوع المصدر (للأرباح)
                    </label>
                    <select
                      value={formData.sourceType}
                      onChange={(e) =>
                        setFormData({ ...formData, sourceType: e.target.value })
                      }
                      className="w-full border border-amber-200 rounded px-2 py-1.5 text-xs focus:border-amber-500 outline-none bg-white"
                    >
                      <option value="شريك بالمكتب">شريك بالمكتب</option>
                      <option value="مكتب وسيط">مكتب وسيط</option>
                      <option value="موظف">موظف</option>
                      <option value="عميل مباشر">عميل مباشر (بدون نسبة)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 mb-1">
                      اسم المصدر
                    </label>
                    <select
                      value={formData.sourceName}
                      onChange={(e) =>
                        setFormData({ ...formData, sourceName: e.target.value })
                      }
                      className="w-full border border-amber-200 rounded px-2 py-1.5 text-xs focus:border-amber-500 outline-none bg-white"
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
                    <label className="block text-[11px] font-bold text-amber-800 mb-1">
                      نسبة المصدر %
                    </label>
                    <input
                      type="text"
                      value={formData.sourcePercent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sourcePercent: e.target.value,
                        })
                      }
                      className="w-full border border-amber-200 rounded px-2 py-1.5 text-xs font-mono font-bold focus:border-amber-500 outline-none bg-white"
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

            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
              <label className="block mb-3 text-slate-600 text-xs font-bold">
                المرفقات الأساسية
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
                    className="flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded border border-blue-100 hover:border-blue-300 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.receivedAttachments.includes(doc)}
                      onChange={() =>
                        toggleArrayItem("receivedAttachments", doc)
                      }
                      className="accent-blue-600 w-3.5 h-3.5"
                    />
                    <span className="text-slate-700 text-xs font-bold">
                      {doc}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-5 border-t border-blue-200/60 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-slate-600 text-xs font-bold">
                    مرفقات أخرى (نص حر)
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
                        placeholder={`اسم المرفق ${idx + 1}...`}
                        className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => removeCustomAttachment(idx)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.customAttachments.length === 0 && (
                    <div className="text-xs text-gray-400 font-semibold italic">
                      لا توجد مرفقات إضافية. اضغط لإضافة مرفق مخصص.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <div className="text-xs text-gray-500 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> سيتم توليد رقم
            مرجعي تلقائياً.
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
              )}
              اعتماد وإنشاء المعاملة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
