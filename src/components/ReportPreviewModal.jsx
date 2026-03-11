import React from "react";
import {
  X,
  Download,
  Printer,
  FileText,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export function ReportPreviewModal({
  type,
  title,
  onClose,
  personName,
  period,
}) {
  const today = new Date().toISOString().split("T")[0];

  // ============================================================================
  // 💡 جلب البيانات الحقيقية من الباك إند (إذا كان التقرير يخص الحسابات الخاصة)
  // ============================================================================
  const {
    data: containerData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["report-special-account-data", personName],
    queryFn: async () => {
      const res = await api.get(
        `/private-settlements/special-account/${personName}`,
      );
      return (
        res.data?.data || { transactions: [], settlements: [], payments: [] }
      );
    },
    // تفعيل الجلب فقط إذا كان التقرير مخصصاً لشخص/حاوية
    enabled: type === "special-account" && !!personName,
  });

  // ============================================================================
  // 💡 المعالجة الحسابية الديناميكية لبناء التقرير
  // ============================================================================

  let config = { summaryItems: [], columns: [], rows: [], closingSummary: [] };

  if (type === "special-account" && containerData) {
    const {
      transactions = [],
      settlements = [],
      payments = [],
    } = containerData;

    const totalEntitlement = settlements.reduce((sum, s) => sum + s.amount, 0);
    const totalDelivered = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalRemaining = totalEntitlement - totalDelivered;

    // تجميع الحركات في جدول واحد زمني (التسويات + المدفوعات)
    const combinedRows = [
      ...settlements.map((s) => ({
        "رقم السجل": s.ref,
        النوع: s.type,
        المبلغ: `+ ${s.amount.toLocaleString()}`,
        التاريخ: s.date,
        الحالة: "مستحق له (دائن)",
        ملاحظات: s.notes || "—",
        _rawDate: new Date(s.date).getTime(),
      })),
      ...payments.map((p) => ({
        "رقم السجل": p.ref,
        النوع: "صرف / تسليم",
        المبلغ: `- ${p.amount.toLocaleString()}`,
        التاريخ: p.date,
        الحالة: "مسدد (مدين)",
        ملاحظات: `طريقة: ${p.method} | بواسطة: ${p.deliveredBy}`,
        _rawDate: new Date(p.date).getTime(),
      })),
    ].sort((a, b) => b._rawDate - a._rawDate); // ترتيب من الأحدث للأقدم

    config = {
      summaryItems: [
        {
          label: "إجمالي المستحقات المضافة",
          value: `${totalEntitlement.toLocaleString()} ر.س`,
          color: "#2563eb",
        },
        {
          label: "إجمالي المنصرف والمسلّم",
          value: `${totalDelivered.toLocaleString()} ر.س`,
          color: "#16a34a",
        },
        {
          label: "المعاملات المرتبطة",
          value: `${transactions.length} معاملة`,
          color: "#7c3aed",
        },
        {
          label: "الرصيد النهائي المتبقي",
          value: `${totalRemaining.toLocaleString()} ر.س`,
          color: totalRemaining > 0 ? "#dc2626" : "#d97706",
        },
      ],
      columns: ["رقم السجل", "التاريخ", "النوع", "المبلغ", "الحالة", "ملاحظات"],
      rows: combinedRows,
      closingSummary: [
        {
          label: "إجمالي الحركات (سجل مالي)",
          value: String(combinedRows.length),
        },
        {
          label: "إجمالي المبالغ المنصرفة",
          value: `${totalDelivered.toLocaleString()} ر.س`,
          bold: true,
        },
        {
          label: "صافي الرصيد المتبقي",
          value: `${totalRemaining.toLocaleString()} ر.س`,
          bold: true,
        },
      ],
    };
  }

  // ============================================================================
  // 💡 أوامر الطباعة والتصدير
  // ============================================================================
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    toast.success("جاري تحويل التقرير إلى PDF...");
    // هنا يتم ربط مكتبة مثل html2pdf أو jsPDF لاحقاً
    setTimeout(
      () => toast.info("سيتم تفعيل تصدير الـ PDF قريباً من الباك إند!"),
      1500,
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 print:bg-white print:static print:inset-auto print:z-auto"
      dir="rtl"
    >
      {/* 🔴 الحاوية الأساسية للـ Modal (لا تظهر عند الطباعة الورقية) */}
      <div className="bg-gray-100 border border-gray-300 rounded-xl shadow-2xl flex flex-col w-[80vw] h-[90vh] print:w-full print:h-auto print:shadow-none print:border-none">
        {/* شريط الأزرار والتحكم (يختفي عند الطباعة) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-300 shrink-0 bg-white print:hidden rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-gray-800 text-[16px] font-black">
                معاينة التقرير المالي والتشغيلي
              </div>
              <div className="text-gray-500 text-[11px] font-bold mt-0.5">
                تأكد من صحة الأرقام قبل التصدير.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 text-white cursor-pointer hover:bg-blue-700 text-xs font-bold shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" /> <span>تصدير ملف PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gray-800 text-white hover:bg-black cursor-pointer text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" /> <span>طباعة ورقية</span>
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white border border-gray-300 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* مساحة المعاينة الحية للورقة (A4) */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center print:p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center pt-20">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <span className="text-gray-600 font-bold text-lg">
                جاري بناء التقرير وسحب البيانات...
              </span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center pt-20 text-red-600">
              <AlertTriangle className="w-12 h-12 mb-4" />
              <span className="font-bold text-lg">
                حدث خطأ أثناء جلب بيانات التقرير
              </span>
            </div>
          ) : (
            <div className="bg-white border border-gray-300 shadow-lg print:shadow-none print:border-none p-10 w-full max-w-[900px] min-h-[1050px] relative">
              {/* 📝 ترويسة التقرير الرسمي */}
              <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-800">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 leading-tight">
                    {title}
                  </h1>
                  {personName && (
                    <h2 className="text-[16px] text-gray-700 font-bold mt-1">
                      حساب: {personName}
                    </h2>
                  )}
                </div>
                <div className="text-left">
                  <div className="text-xl font-black text-gray-800 tracking-wider">
                    النظام الهندسي ERP
                  </div>
                  <div className="text-xs text-gray-500 font-bold mt-1">
                    مكتب ديتيلز للاستشارات الهندسية
                  </div>
                  <div className="text-xs text-gray-400 font-mono mt-1">
                    {today}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-8 px-4 py-2 bg-gray-100 rounded-md border border-gray-300">
                <span className="text-sm font-bold text-gray-700">
                  نطاق التقرير:{" "}
                  <span className="text-blue-700">{period || "الشامل"}</span>
                </span>
                <span className="text-xs font-mono text-gray-500">
                  تم التوليد آلياً بواسطة النظام
                </span>
              </div>

              {/* 📊 شريط الملخص المالي */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {config.summaryItems.map((item) => (
                  <div
                    key={item.label}
                    className="p-4 rounded-xl border-2"
                    style={{
                      backgroundColor: `${item.color}05`,
                      borderColor: `${item.color}20`,
                    }}
                  >
                    <div className="text-gray-600 text-[11px] font-bold mb-1">
                      {item.label}
                    </div>
                    <div
                      className="font-mono text-lg font-black"
                      style={{ color: item.color }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* 📋 الجدول الرئيسي للتقرير */}
              <div className="mb-10">
                <h3 className="text-sm font-black text-gray-800 mb-3">
                  السجل المالي والتفصيلي للحركات
                </h3>
                <table className="w-full text-right text-[12px] border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      {config.columns.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 font-bold border border-gray-700"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {config.rows.map((row, i) => (
                      <tr
                        key={i}
                        className={i % 2 === 1 ? "bg-gray-50" : "bg-white"}
                      >
                        {config.columns.map((col) => {
                          const isAmount = col.includes("المبلغ");
                          const val = row[col] || "—";
                          const isPositive = isAmount && val.includes("+");
                          const isNegative = isAmount && val.includes("-");

                          return (
                            <td
                              key={col}
                              className={`px-4 py-3 border border-gray-200 ${isAmount ? "font-mono font-black" : "font-semibold text-gray-700"}`}
                              style={{
                                color: isPositive
                                  ? "#16a34a"
                                  : isNegative
                                    ? "#dc2626"
                                    : undefined,
                              }}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {config.rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={config.columns.length}
                          className="text-center py-8 text-gray-400 font-bold border border-gray-200"
                        >
                          لا توجد حركات مسجلة في هذه الفترة.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 📉 الخلاصة النهائية */}
              <div className="flex justify-end">
                <div className="w-80 rounded-xl p-5 bg-gray-50 border-2 border-gray-200">
                  <div className="text-gray-800 text-[14px] font-black border-b border-gray-300 pb-2 mb-3">
                    الخلاصة والإعتماد
                  </div>
                  <div className="space-y-3">
                    {config.closingSummary.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-600 text-[12px] font-bold">
                          {item.label}
                        </span>
                        <span
                          className={`font-mono text-[14px] ${item.bold ? "font-black text-gray-900 bg-yellow-100 px-2 py-0.5 rounded" : "font-bold text-gray-700"}`}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* تذييل الورقة (Footer) */}
              <div className="absolute bottom-10 left-10 right-10 flex justify-between items-center text-[10px] font-bold text-gray-400 border-t border-gray-200 pt-3">
                <span>النظام الهندسي المتكامل ERP - نسخة التصدير</span>
                <span className="font-mono">Page 1 of 1</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
