import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Plus,
  FileText,
  Search,
  Building2,
  Phone,
  Settings,
  Eye,
  Users,
  Info,
  X,
  Loader2,
  Save,
  Trash2,
  ChevronDown,
} from "lucide-react";

const CoopOfficesProfiles = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOfficeId, setSelectedOfficeId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");

  const initialForm = {
    name: "",
    contactName: "",
    phone: "",
    agreementType: "حسب عدد المعاملات",
    monthlyAmount: "",
    responsibleId: "",
    isLinkedToSystem: "غير مفعل",
    notes: "",
  };
  const [formData, setFormData] = useState(initialForm);

  // ==========================================
  // Queries
  // ==========================================
  const { data: offices = [], isLoading } = useQuery({
    queryKey: ["coop-offices"],
    queryFn: async () => {
      const res = await api.get("/coop-offices");
      return res.data?.data || [];
    },
  });

  // 💡 جلب سجل الأشخاص لاختيار المسؤول
  const { data: persons = [] } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => {
      const res = await api.get("/persons");
      return res.data?.data || [];
    },
  });
  // فلترة الموظفين والشركاء فقط ليكونوا مسؤولين
  const staffOnly = persons.filter(
    (p) => p.role === "موظف" || p.role === "شريك",
  );

  useEffect(() => {
    if (offices.length > 0 && !selectedOfficeId)
      setSelectedOfficeId(offices[0].id);
  }, [offices, selectedOfficeId]);

  const filteredOffices = offices.filter(
    (office) =>
      office.name.includes(searchQuery) ||
      office.contactName.includes(searchQuery),
  );

  const selectedOffice = offices.find((o) => o.id === selectedOfficeId);

  // ==========================================
  // Mutations
  // ==========================================
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (modalMode === "add") return await api.post("/coop-offices", data);
      else return await api.put(`/coop-offices/${selectedOfficeId}`, data);
    },
    onSuccess: () => {
      toast.success(
        modalMode === "add"
          ? "تم إضافة المكتب بنجاح"
          : "تم تعديل بيانات المكتب",
      );
      queryClient.invalidateQueries(["coop-offices"]);
      setIsModalOpen(false);
      setFormData(initialForm);
    },
    onError: (err) => toast.error(err.response?.data?.message || "حدث خطأ ما"),
  });

  // 💡 دالة الحذف الجديدة
  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/coop-offices/${id}`),
    onSuccess: () => {
      toast.success("تم حذف المكتب بنجاح");
      queryClient.invalidateQueries(["coop-offices"]);
      setSelectedOfficeId(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "حدث خطأ أثناء الحذف"),
  });

  // ==========================================
  // Handlers
  // ==========================================
  const handleOpenAddModal = () => {
    setModalMode("add");
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedOffice) return;
    setModalMode("edit");
    setFormData({
      name: selectedOffice.name,
      contactName:
        selectedOffice.contactName === "غير محدد"
          ? ""
          : selectedOffice.contactName,
      phone: selectedOffice.phone === "—" ? "" : selectedOffice.phone,
      agreementType: selectedOffice.agreementType,
      monthlyAmount: selectedOffice.monthlyAmount.replace(/[^\d.]/g, ""),
      responsibleId: selectedOffice.responsibleId || "", // استخدام الـ ID
      isLinkedToSystem: selectedOffice.isLinkedToSystem,
      notes:
        selectedOffice.notes === "لا توجد ملاحظات" ? "" : selectedOffice.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (window.confirm("هل أنت متأكد من حذف هذا المكتب بشكل نهائي؟")) {
      deleteMutation.mutate(selectedOfficeId);
    }
  };

  const handleSubmit = () => {
    if (!formData.name) return toast.error("اسم المكتب مطلوب");
    saveMutation.mutate(formData);
  };

  const getAgreementColor = (type) =>
    type === "شهري ثابت" ? "rgb(37, 99, 235)" : "rgb(124, 58, 237)";

  return (
    <div
      className="p-3 flex flex-col h-full overflow-hidden bg-[var(--wms-bg-0)] font-sans"
      dir="rtl"
    >
      {/* 1. التنبيه العلوي */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-md shrink-0 mb-3"
        style={{
          backgroundColor: "rgba(245, 158, 11, 0.06)",
          border: "1px solid rgba(245, 158, 11, 0.15)",
          fontSize: "10px",
          color: "rgb(146, 64, 14)",
        }}
      >
        <span style={{ fontWeight: 700 }}>تنبيه:</span>
        <span>هذه الأرقام تشغيلية داخلية — وليست قيودا محاسبية رسمية.</span>
      </div>

      {/* 2. شريط الأدوات */}
      <div className="flex items-center justify-between gap-3 shrink-0 mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90 transition-opacity"
            style={{ fontSize: "12px" }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة مكتب متعاون</span>
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--wms-border)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-[var(--wms-surface-2)] transition-colors"
            style={{ fontSize: "12px" }}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>تقرير نهاية شهر</span>
          </button>
        </div>
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--wms-text-muted)]" />
          <input
            type="text"
            placeholder="ابحث باسم المكتب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-8 pl-3 py-1.5 rounded-md border border-[var(--wms-border)] text-[var(--wms-text)] focus:outline-none focus:border-[var(--wms-accent-blue)]"
            style={{
              fontSize: "12px",
              width: "220px",
              backgroundColor: "var(--wms-surface-1)",
            }}
          />
        </div>
      </div>

      {/* 3. منطقة المحتوى */}
      <div className="flex gap-3 flex-1 min-h-0 overflow-hidden">
        {/* القائمة الجانبية (المكاتب) */}
        <div
          className="space-y-2 overflow-y-auto custom-scrollbar-slim pb-2 pr-1"
          style={{ width: "320px", flexShrink: 0 }}
        >
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : filteredOffices.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">
              لا توجد مكاتب مسجلة
            </div>
          ) : (
            filteredOffices.map((office) => {
              const isActive = selectedOfficeId === office.id;
              return (
                <div
                  key={office.id}
                  onClick={() => setSelectedOfficeId(office.id)}
                  className={`rounded-lg border p-3 cursor-pointer transition-colors ${isActive ? "border-[var(--wms-accent-blue)] bg-[var(--wms-surface-2)] shadow-sm" : "border-[var(--wms-border)] hover:bg-[var(--wms-surface-2)]/50 bg-[var(--wms-surface-1)]"}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Building2
                      className={`w-4 h-4 ${isActive ? "text-[var(--wms-accent-blue)]" : "text-slate-400"}`}
                    />
                    <span
                      className="text-[var(--wms-text)]"
                      style={{ fontSize: "13px", fontWeight: 700 }}
                    >
                      {office.name}
                    </span>
                  </div>
                  <div
                    className="grid grid-cols-2 gap-1"
                    style={{ fontSize: "11px" }}
                  >
                    <div className="text-[var(--wms-text-muted)] truncate">
                      <span className="text-[var(--wms-text-sec)]">
                        {office.contactName}
                      </span>
                    </div>
                    <div className="text-[var(--wms-text-muted)] flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{office.phone}</span>
                    </div>
                    <div>
                      <span
                        className="px-1.5 py-0.5 rounded text-white"
                        style={{
                          fontSize: "9px",
                          backgroundColor: getAgreementColor(
                            office.agreementType,
                          ),
                        }}
                      >
                        {office.agreementType}
                      </span>
                    </div>
                    <div className="text-[var(--wms-text-muted)]">
                      {office.txCount} معاملة
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* تفاصيل المكتب المحدد */}
        <div className="flex-1 rounded-lg border border-[var(--wms-border)] p-4 overflow-y-auto custom-scrollbar-slim bg-[var(--wms-surface-1)]">
          {selectedOffice ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* رأس التفاصيل */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <span
                    className="text-[var(--wms-text)]"
                    style={{ fontSize: "18px", fontWeight: 700 }}
                  >
                    {selectedOffice.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* زر التعديل */}
                  <button
                    onClick={handleOpenEditModal}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-[var(--wms-border)] text-[var(--wms-text-sec)] cursor-pointer hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    style={{ fontSize: "11px", fontWeight: 600 }}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                  {/* زر الحذف */}
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-[var(--wms-border)] text-[var(--wms-text-sec)] cursor-pointer hover:text-red-600 hover:bg-red-50 transition-colors"
                    style={{ fontSize: "11px", fontWeight: 600 }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                  <button
                    onClick={() => toast.info("سيتم فتح تقرير المكتب قريباً")}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-[var(--wms-border)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-[var(--wms-surface-2)] transition-colors"
                    style={{ fontSize: "11px", fontWeight: 600 }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة التقرير</span>
                  </button>
                </div>
              </div>

              {/* شبكة المعلومات */}
              <div
                className="grid grid-cols-3 gap-4"
                style={{ fontSize: "12px" }}
              >
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div
                    className="text-[var(--wms-text-muted)] mb-1"
                    style={{ fontSize: "10px" }}
                  >
                    شخص التواصل
                  </div>
                  <div className="text-[var(--wms-text)] font-bold">
                    {selectedOffice.contactName}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div
                    className="text-[var(--wms-text-muted)] mb-1"
                    style={{ fontSize: "10px" }}
                  >
                    الجوال
                  </div>
                  <div className="text-[var(--wms-text)] font-mono font-bold">
                    {selectedOffice.phone}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div
                    className="text-[var(--wms-text-muted)] mb-1"
                    style={{ fontSize: "10px" }}
                  >
                    المسؤول من طرفنا
                  </div>
                  <div className="text-[var(--wms-text)] font-bold">
                    {selectedOffice.responsible}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div
                    className="text-[var(--wms-text-muted)] mb-1"
                    style={{ fontSize: "10px" }}
                  >
                    نوع الاتفاق
                  </div>
                  <div
                    className="text-[var(--wms-text)] font-bold"
                    style={{
                      color: getAgreementColor(selectedOffice.agreementType),
                    }}
                  >
                    {selectedOffice.agreementType}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div
                    className="text-[var(--wms-text-muted)] mb-1"
                    style={{ fontSize: "10px" }}
                  >
                    المبلغ الشهري
                  </div>
                  <div className="text-[var(--wms-text)] font-mono font-bold">
                    {selectedOffice.monthlyAmount}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div
                    className="text-[var(--wms-text-muted)] mb-1"
                    style={{ fontSize: "10px" }}
                  >
                    ربط النظام الرئيسي
                  </div>
                  <div className="text-[var(--wms-text)] font-bold">
                    {selectedOffice.isLinkedToSystem}
                  </div>
                </div>
              </div>

              {/* الملاحظات */}
              <div
                className="rounded-md border border-[var(--wms-border)] px-4 py-3 bg-[var(--wms-surface-2)]"
                style={{ fontSize: "12px" }}
              >
                <div
                  className="text-[var(--wms-text-muted)] font-bold mb-1"
                  style={{ fontSize: "11px" }}
                >
                  ملاحظات وشروط:
                </div>
                <div className="text-[var(--wms-text)] leading-relaxed">
                  {selectedOffice.notes}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Building2 className="w-12 h-12 mb-3 opacity-20" />
              <p>الرجاء اختيار مكتب من القائمة لعرض تفاصيله</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Modal (إضافة / تعديل) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-[15px] font-bold text-gray-800">
                  {modalMode === "add"
                    ? "إضافة مكتب متعاون جديد"
                    : "تعديل بيانات المكتب"}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="p-6 grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar-slim"
              style={{ maxHeight: "70vh" }}
            >
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  اسم المكتب *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  placeholder="مثال: مكتب ديتيلز للاستشارات الهندسية"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  شخص التواصل
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  placeholder="اسم المندوب أو المدير"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  رقم الجوال
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-right focus:border-blue-500 outline-none"
                  placeholder="05xxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  نوع الاتفاق المالي
                </label>
                <select
                  value={formData.agreementType}
                  onChange={(e) =>
                    setFormData({ ...formData, agreementType: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                >
                  <option value="حسب عدد المعاملات">
                    حسب عدد المعاملات (نسبة/مقطوع)
                  </option>
                  <option value="شهري ثابت">مبلغ شهري ثابت</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  المبلغ (في حال كان شهري ثابت)
                </label>
                <input
                  type="number"
                  disabled={formData.agreementType !== "شهري ثابت"}
                  value={formData.monthlyAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyAmount: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 outline-none"
                  placeholder="0"
                />
              </div>

              {/* 💡 تغيير حقل المسؤول ليصبح Select قائمة منسدلة */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  المسؤول من طرفنا
                </label>
                <div className="relative">
                  <select
                    value={formData.responsibleId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        responsibleId: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">-- اختر موظف --</option>
                    {staffOnly.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ربط المعاملات تلقائياً (API)
                </label>
                <select
                  value={formData.isLinkedToSystem}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isLinkedToSystem: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                >
                  <option value="غير مفعل">غير مفعل (يدوي)</option>
                  <option value="مفعل">مفعل (يتم سحب المعاملات برمجياً)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ملاحظات وشروط الاتفاق
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none h-24 resize-none"
                  placeholder="اكتب أي ملاحظات أو تفاصيل عن العقد..."
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {modalMode === "add" ? "حفظ وإضافة المكتب" : "حفظ التعديلات"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoopOfficesProfiles;
