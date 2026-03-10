import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Plus,
  Eye,
  FileText,
  Camera,
  Search,
  Building2,
  CodeXml,
  Info,
  X,
  Loader2,
  Save,
  Printer,
} from "lucide-react";
// افترض وجود زر لقطة الشاشة في مشروعك، إذا لم يكن موجوداً سيعمل زر الطباعة كبديل ممتاز
import { ScreenshotButton } from "../components/ScreenshotButton";

const CoopOfficesFeesPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // States للنوافذ المنبثقة
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);

  // Form State
  const initialForm = {
    internalName: "",
    officeId: "",
    isSurveyOnly: false,
    isPrepToo: false,
    officeFees: "",
    paidAmount: "",
    dueDate: "",
    notes: "",
  };
  const [formData, setFormData] = useState(initialForm);

  // 1. جلب المكاتب (للقائمة المنسدلة)
  const { data: offices = [] } = useQuery({
    queryKey: ["coop-offices"],
    queryFn: async () => {
      const res = await api.get("/coop-offices");
      return res.data?.data || [];
    },
  });

  // 2. جلب الأتعاب من الباك إند
  const { data: feesData = [], isLoading } = useQuery({
    queryKey: ["coop-office-fees"],
    queryFn: async () => {
      const res = await api.get("/coop-office-fees"); // 👈 مسار الباك إند الجديد
      return res.data?.data || [];
    },
  });

  // فلترة البيانات بناءً على البحث
  const filteredData = useMemo(() => {
    if (!searchQuery) return feesData;
    const q = searchQuery.toLowerCase();
    return feesData.filter(
      (item) =>
        item.officeName.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.internalName.toLowerCase().includes(q),
    );
  }, [feesData, searchQuery]);

  // حساب الإحصائيات العلوية ديناميكياً
  const stats = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    return filteredData.reduce(
      (acc, curr) => {
        acc.totalFees += curr.officeFees;
        acc.totalPaid += curr.paidAmount;
        acc.totalRemaining += curr.officeFees - curr.paidAmount;
        // حساب معاملات الشهر الحالي من الـ ID (الذي يحوي السنة والشهر)
        if (curr.id.includes(currentMonth)) acc.thisMonth += 1;
        return acc;
      },
      { totalFees: 0, totalPaid: 0, totalRemaining: 0, thisMonth: 0 },
    );
  }, [filteredData]);

  // 3. دالة الإرسال (Mutation)
  const createMutation = useMutation({
    mutationFn: async (data) => api.post("/coop-office-fees", data),
    onSuccess: () => {
      toast.success("تم تسجيل أتعاب المكتب بنجاح");
      queryClient.invalidateQueries(["coop-office-fees"]);
      setIsAddModalOpen(false);
      setFormData(initialForm);
    },
    onError: (err) => toast.error(err.response?.data?.message || "حدث خطأ"),
  });

  const handleSubmit = () => {
    if (!formData.internalName || !formData.officeId || !formData.officeFees) {
      return toast.error(
        "الرجاء إكمال الحقول الإلزامية (الاسم، المكتب، الأتعاب)",
      );
    }
    createMutation.mutate(formData);
  };

  // دالة لتحديد ألوان حالة الدفع
  const getStatusStyle = (status) => {
    switch (status) {
      case "مدفوع بالكامل":
        return { bg: "rgba(22, 163, 74, 0.08)", text: "rgb(22, 163, 74)" };
      case "مدفوع جزئيا":
        return { bg: "rgba(234, 179, 8, 0.08)", text: "rgb(217, 119, 6)" };
      case "غير مدفوع":
        return { bg: "rgba(220, 38, 38, 0.08)", text: "rgb(220, 38, 38)" };
      default:
        return { bg: "var(--wms-surface-2)", text: "var(--wms-text-muted)" };
    }
  };

  // دالة الطباعة السريعة للجدول
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="p-3 flex flex-col h-full overflow-hidden bg-[var(--wms-bg-0)] font-sans"
      dir="rtl"
    >
      <div
        className="space-y-3 flex-1 flex flex-col min-h-0"
        id="fees-report-container"
      >
        {/* 1. تنبيه علوي */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-md shrink-0"
          style={{
            backgroundColor: "rgba(245, 158, 11, 0.06)",
            border: "1px solid rgba(245, 158, 11, 0.15)",
            fontSize: "10px",
            color: "rgb(146, 64, 14)",
          }}
        >
          <span style={{ fontWeight: 700 }}>تنبيه:</span>
          <span>
            هذه الأرقام تشغيلية داخلية لمتابعة أتعاب المكاتب — وليست قيودا
            محاسبية رسمية.
          </span>
        </div>

        {/* 2. شريط الإحصائيات */}
        <div className="flex items-center gap-5 px-4 py-2 bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg shrink-0">
          <div className="flex items-center gap-2">
            <div>
              <div
                className="text-[var(--wms-text-muted)]"
                style={{ fontSize: "10px" }}
              >
                إجمالي أتعاب المكاتب
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "rgb(37, 99, 235)",
                }}
              >
                {stats.totalFees.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-px h-6 bg-[var(--wms-border)]"></div>
            <div>
              <div
                className="text-[var(--wms-text-muted)]"
                style={{ fontSize: "10px" }}
              >
                المدفوع
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "rgb(22, 163, 74)",
                }}
              >
                {stats.totalPaid.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-px h-6 bg-[var(--wms-border)]"></div>
            <div>
              <div
                className="text-[var(--wms-text-muted)]"
                style={{ fontSize: "10px" }}
              >
                المتبقي
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "rgb(220, 38, 38)",
                }}
              >
                {stats.totalRemaining.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-px h-6 bg-[var(--wms-border)]"></div>
            <div>
              <div
                className="text-[var(--wms-text-muted)]"
                style={{ fontSize: "10px" }}
              >
                عدد المعاملات
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "rgb(124, 58, 237)",
                }}
              >
                {filteredData.length}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-px h-6 bg-[var(--wms-border)]"></div>
            <div>
              <div
                className="text-[var(--wms-text-muted)]"
                style={{ fontSize: "10px" }}
              >
                هذا الشهر
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "rgb(8, 145, 178)",
                }}
              >
                {stats.thisMonth}
              </div>
            </div>
          </div>
        </div>

        {/* 3. شريط الأدوات والبحث */}
        <div className="flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90"
              style={{ fontSize: "12px" }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تسجيل أتعاب مكتب</span>
            </button>
            <button
              onClick={() => {
                if (filteredData.length) setViewRecord(filteredData[0]);
                else toast.info("لا توجد بيانات للمعاينة");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--wms-border)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-[var(--wms-surface-2)]"
              style={{ fontSize: "12px" }}
            >
              <Eye
                className="w-3.5 h-3.5"
                style={{ color: "rgb(37, 99, 235)" }}
              />
              <span>معاينة</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--wms-border)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-[var(--wms-surface-2)]"
              style={{ fontSize: "12px" }}
            >
              <FileText
                className="w-3.5 h-3.5"
                style={{ color: "rgb(124, 58, 237)" }}
              />
              <span>إصدار تقرير</span>
            </button>

            {/* في حال عدم وجود المكون ScreenshotButton استخدم هذا الزر للطباعة */}
            {ScreenshotButton ? (
              <ScreenshotButton
                targetId="fees-report-container"
                filePrefix="coop-fees"
              />
            ) : (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 rounded-md border border-[var(--wms-border)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-[var(--wms-surface-2)] transition-colors"
                title="لقطة شاشة"
                style={{ fontSize: "10px", padding: "4px 8px" }}
              >
                <Camera
                  className="w-3 h-3"
                  style={{ color: "rgb(124, 58, 237)" }}
                />
                <span>لقطة شاشة</span>
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--wms-text-muted)]" />
            <input
              placeholder="ابحث بالاسم أو الرقم..."
              className="pr-8 pl-3 py-1.5 rounded-md border border-[var(--wms-border)] text-[var(--wms-text)] focus:outline-none focus:border-[var(--wms-accent-blue)]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                fontSize: "12px",
                width: "220px",
                backgroundColor: "var(--wms-surface-1)",
              }}
            />
          </div>
        </div>

        {/* 4. الجدول الرئيسي */}
        <div
          className="rounded-lg border border-[var(--wms-border)] overflow-auto flex-1 custom-scrollbar-slim"
          style={{ backgroundColor: "var(--wms-surface-1)" }}
        >
          <table className="w-full text-right" style={{ fontSize: "12px" }}>
            <thead className="sticky top-0 z-10">
              <tr style={{ backgroundColor: "var(--wms-surface-2)" }}>
                <th
                  className="px-3 py-2 text-[var(--wms-text-sec)]"
                  style={{ fontWeight: 600, fontSize: "11px" }}
                >
                  رقم المعاملة
                </th>
                <th
                  className="px-3 py-2 text-[var(--wms-text-sec)]"
                  style={{ fontWeight: 600, fontSize: "11px" }}
                >
                  الاسم الداخلي
                </th>
                <th
                  className="px-3 py-2 text-[var(--wms-text-sec)]"
                  style={{ fontWeight: 600, fontSize: "11px" }}
                >
                  اسم المكتب
                </th>
                <th
                  className="px-3 py-2 text-[var(--wms-text-sec)] text-center"
                  style={{ fontWeight: 600, fontSize: "11px" }}
                >
                  رفع فقط؟
                </th>
                <th
                  className="px-3 py-2 text-[var(--wms-text-sec)] text-center"
                  style={{ fontWeight: 600, fontSize: "11px" }}
                >
                  تجهيز أيضا؟
                </th>
                <th
                  className="px-3 py-2 text-[var(--wms-text-sec)]"
                  style={{ fontWeight: 600, fontSize: "11px" }}
                >
                  أتعاب المكتب
                </th>
                <th
                  className="px-3 py-2 text-[var(--wms-text-sec)]"
                  style={{ fontWeight: 600, fontSize: "11px" }}
                >
                  تاريخ الاستحقاق
                </th>
                <th
                  className="px-3 py-2 text-[var(--wms-text-sec)]"
                  style={{ fontWeight: 600, fontSize: "11px" }}
                >
                  المدفوع
                </th>
                <th
                  className="px-3 py-2 text-[var(--wms-text-sec)]"
                  style={{ fontWeight: 600, fontSize: "11px" }}
                >
                  المتبقي
                </th>
                <th
                  className="px-3 py-2 text-[var(--wms-text-sec)]"
                  style={{ fontWeight: 600, fontSize: "11px" }}
                >
                  الحالة
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((row) => {
                  const remaining = row.officeFees - row.paidAmount;
                  const statusStyle = getStatusStyle(row.status);
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setViewRecord(row)}
                      className="border-t border-[var(--wms-border)] hover:bg-[var(--wms-surface-2)]/50 cursor-pointer transition-colors"
                    >
                      <td
                        className="px-3 py-2 text-[var(--wms-accent-blue)]"
                        style={{ fontWeight: 600 }}
                      >
                        {row.id}
                      </td>
                      <td className="px-3 py-2 text-[var(--wms-text-sec)]">
                        {row.internalName}
                      </td>
                      <td className="px-3 py-2 text-[var(--wms-text)]">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-[var(--wms-text-muted)]" />
                          <span>{row.officeName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-[var(--wms-text-sec)]">
                        {row.isSurveyOnly}
                      </td>
                      <td className="px-3 py-2 text-center text-[var(--wms-text-sec)]">
                        {row.isPrepToo}
                      </td>
                      <td
                        className="px-3 py-2 text-[var(--wms-text)] font-mono"
                        style={{ fontWeight: 600 }}
                      >
                        {row.officeFees.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-[var(--wms-text-sec)] font-mono">
                        {row.dueDate}
                      </td>
                      <td
                        className="px-3 py-2 font-mono"
                        style={{
                          color:
                            row.paidAmount > 0
                              ? "rgb(22, 163, 74)"
                              : "var(--wms-text-muted)",
                        }}
                      >
                        {row.paidAmount.toLocaleString()}
                      </td>
                      <td
                        className="px-3 py-2 font-mono"
                        style={{
                          color:
                            remaining > 0
                              ? "rgb(220, 38, 38)"
                              : "rgb(22, 163, 74)",
                          fontWeight: 600,
                        }}
                      >
                        {remaining.toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="10"
                    className="text-center py-8 text-[var(--wms-text-muted)]"
                  >
                    لا توجد بيانات مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. Modal: إضافة أتعاب جديدة */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-[15px] font-bold text-gray-800">
                  تسجيل أتعاب مكتب متعاون (مستحقات)
                </h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الاسم الداخلي للمعاملة *
                </label>
                <input
                  type="text"
                  value={formData.internalName}
                  onChange={(e) =>
                    setFormData({ ...formData, internalName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  placeholder="مثال: عمارة الملقا"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  اسم المكتب المتعاون *
                </label>
                <select
                  value={formData.officeId}
                  onChange={(e) =>
                    setFormData({ ...formData, officeId: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                >
                  <option value="">اختر المكتب...</option>
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  أتعاب المكتب (المبلغ المستحق) *
                </label>
                <input
                  type="number"
                  value={formData.officeFees}
                  onChange={(e) =>
                    setFormData({ ...formData, officeFees: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  المبلغ المدفوع (مُقدم إن وجد)
                </label>
                <input
                  type="number"
                  value={formData.paidAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, paidAmount: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  تاريخ الاستحقاق
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-4 mt-6">
                <label className="flex items-center gap-1.5 cursor-pointer text-sm font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.isSurveyOnly}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isSurveyOnly: e.target.checked,
                      })
                    }
                    className="accent-blue-600 w-4 h-4"
                  />
                  رفع مساحي فقط
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.isPrepToo}
                    onChange={(e) =>
                      setFormData({ ...formData, isPrepToo: e.target.checked })
                    }
                    className="accent-blue-600 w-4 h-4"
                  />
                  شامل التجهيز
                </label>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none h-16 resize-none"
                  placeholder="ملاحظات..."
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                تسجيل وحفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: معاينة التفاصيل */}
      {viewRecord && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
          onClick={() => setViewRecord(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-blue-700 flex items-center gap-2">
                <Building2 className="w-5 h-5" /> تفاصيل مطالبة أتعاب
              </h3>
              <X
                className="w-5 h-5 cursor-pointer text-gray-400 hover:text-red-500"
                onClick={() => setViewRecord(null)}
              />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">رقم المعاملة:</span>
                <span className="font-mono font-bold">{viewRecord.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">اسم المكتب:</span>
                <span className="font-bold">{viewRecord.officeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">الاسم الداخلي:</span>
                <span>{viewRecord.internalName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">إجمالي الأتعاب:</span>
                <span className="font-mono text-blue-600 font-bold">
                  {viewRecord.officeFees?.toLocaleString()} ر.س
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">المدفوع:</span>
                <span className="font-mono text-green-600 font-bold">
                  {viewRecord.paidAmount?.toLocaleString()} ر.س
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">المتبقي:</span>
                <span className="font-mono text-red-600 font-bold">
                  {(
                    viewRecord.officeFees - viewRecord.paidAmount
                  )?.toLocaleString()}{" "}
                  ر.س
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">الحالة:</span>
                <span className="font-bold">{viewRecord.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">تاريخ الاستحقاق:</span>
                <span className="font-mono">{viewRecord.dueDate}</span>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t flex gap-2">
              <button
                onClick={() => {
                  toast.success("تم طباعة التقرير");
                  setViewRecord(null);
                }}
                className="flex-1 bg-gray-100 py-2 rounded-lg font-bold text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> طباعة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoopOfficesFeesPage;
