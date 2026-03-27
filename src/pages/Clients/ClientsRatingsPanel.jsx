import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllClients, updateClient } from "../../api/clientApi"; // 👈 تأكد من الاستيراد
import { Star, Edit, Loader2, X, Save } from "lucide-react";
import { toast } from "sonner";

const ClientsRatingsPanel = () => {
  const queryClient = useQueryClient();

  // ==========================================
  // States
  // ==========================================
  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState({
    grade: "",
    category: "",
    secretRating: 50,
    riskTier: "LOW",
  });

  // ==========================================
  // Fetch Data
  // ==========================================
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => getAllClients({}),
  });

  // ==========================================
  // Mutations
  // ==========================================
  const updateMutation = useMutation({
    mutationFn: (data) => updateClient(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["clients"]); // تحديث الجدول فوراً
      setEditingClient(null); // إغلاق النافذة المنبثقة
      toast.success("تم تحديث تقييم وتصنيف العميل بنجاح");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "حدث خطأ أثناء التحديث");
    },
  });

  // ==========================================
  // Handlers
  // ==========================================
  const handleEditClick = (client) => {
    setEditingClient(client);
    setEditForm({
      grade: client.grade || "ج",
      category: client.category || "عادي",
      secretRating: client.secretRating || 50,
      riskTier: client.riskTier || "LOW",
    });
  };

  const handleSave = () => {
    if (!editingClient) return;
    updateMutation.mutate({
      id: editingClient.id,
      payload: {
        grade: editForm.grade,
        category: editForm.category,
        secretRating: parseInt(editForm.secretRating, 10),
        riskTier: editForm.riskTier,
      },
    });
  };

  // ==========================================
  // Stats & UI Helpers
  // ==========================================
  const stats = useMemo(() => {
    return {
      gradeA: clients.filter((c) => c.grade === "A" || c.grade === "أ").length,
      gradeB: clients.filter((c) => c.grade === "B" || c.grade === "ب").length,
      gradeC: clients.filter((c) => c.grade === "C" || c.grade === "ج").length,
      gradeD: clients.filter((c) => c.grade === "D" || c.grade === "د").length,
    };
  }, [clients]);

  const getRiskBadge = (riskTier) => {
    switch (riskTier?.toUpperCase()) {
      case "LOW":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-[11px] font-bold border border-green-200">
            منخفض
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[11px] font-bold border border-amber-200">
            متوسط
          </span>
        );
      case "HIGH":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-[11px] font-bold border border-red-200">
            مرتفع
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200">
            غير محدد
          </span>
        );
    }
  };

  const getGradeFullText = (grade) => {
    if (grade === "A" || grade === "أ")
      return (
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-[11px] font-bold">
          A — ممتاز
        </span>
      );
    if (grade === "B" || grade === "ب")
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold">
          B — جيد
        </span>
      );
    if (grade === "C" || grade === "ج")
      return (
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[11px] font-bold">
          C — مقبول
        </span>
      );
    if (grade === "D" || grade === "د")
      return (
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-[11px] font-bold">
          D — متعثر
        </span>
      );
    return <span className="text-slate-500 text-xs">غير مقيّم</span>;
  };

  if (isLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 relative">
      {/* ==========================================
          Header & Stats
      ========================================== */}
      <div className="text-lg font-bold mb-5 text-slate-800 flex items-center gap-2">
        <Star className="w-5 h-5 text-amber-500" /> تقييمات وتصنيفات العملاء
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="text-3xl font-bold text-green-700">
            {stats.gradeA}
          </div>
          <div className="text-xs text-slate-500 mt-1">تقييم A — ممتاز</div>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.gradeB}</div>
          <div className="text-xs text-slate-500 mt-1">تقييم B — جيد</div>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="text-3xl font-bold text-amber-600">
            {stats.gradeC}
          </div>
          <div className="text-xs text-slate-500 mt-1">تقييم C — مقبول</div>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="text-3xl font-bold text-red-600">{stats.gradeD}</div>
          <div className="text-xs text-slate-500 mt-1">تقييم D — متعثر</div>
        </div>
      </div>

      {/* ==========================================
          Data Table
      ========================================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[800px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-xs text-slate-500 font-bold border-b-2 border-slate-200">
                  العميل
                </th>
                <th className="p-4 text-xs text-slate-500 font-bold border-b-2 border-slate-200">
                  التقييم
                </th>
                <th className="p-4 text-xs text-slate-500 font-bold border-b-2 border-slate-200">
                  الأهمية
                </th>
                <th className="p-4 text-xs text-slate-500 font-bold border-b-2 border-slate-200">
                  مؤشر الالتزام (100)
                </th>
                <th className="p-4 text-xs text-slate-500 font-bold border-b-2 border-slate-200">
                  مستوى المخاطرة
                </th>
                <th className="p-4 text-xs text-slate-500 font-bold border-b-2 border-slate-200 text-center">
                  إجراء
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const name =
                  client.name?.ar || client.name?.firstName || "غير محدد";
                return (
                  <tr
                    key={client.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-bold text-sm text-slate-800">
                        {name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {client.clientCode}
                      </div>
                    </td>
                    <td className="p-4">{getGradeFullText(client.grade)}</td>
                    <td className="p-4 text-xs font-bold text-blue-600">
                      {client.category || "عادي"}
                    </td>
                    <td className="p-4 text-xs font-mono font-bold text-slate-600">
                      {client.secretRating || 50}{" "}
                      <span className="text-[10px] font-normal text-slate-400">
                        / 100
                      </span>
                    </td>
                    <td className="p-4">{getRiskBadge(client.riskTier)}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleEditClick(client)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" /> تعديل التصنيف
                      </button>
                    </td>
                  </tr>
                );
              })}
              {clients.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    لا توجد بيانات عملاء لعرضها.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          Edit Modal (النافذة المنبثقة للتعديل)
      ========================================== */}
      {editingClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  تعديل تصنيف العميل
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {editingClient.name?.ar || editingClient.name?.firstName} (
                  {editingClient.clientCode})
                </p>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="p-1.5 bg-white text-slate-400 hover:text-red-500 rounded-lg border border-slate-200 shadow-sm transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* التقييم */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  التقييم (Grade)
                </label>
                <select
                  value={editForm.grade}
                  onChange={(e) =>
                    setEditForm({ ...editForm, grade: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"
                >
                  <option value="أ">A — ممتاز</option>
                  <option value="ب">B — جيد</option>
                  <option value="ج">C — مقبول</option>
                  <option value="د">D — متعثر</option>
                </select>
              </div>

              {/* الأهمية */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  فئة الأهمية (Category)
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"
                >
                  <option value="VIP">VIP - كبار العملاء</option>
                  <option value="مهم">مهم</option>
                  <option value="عادي">عادي</option>
                </select>
              </div>

              {/* مستوى المخاطرة */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مستوى المخاطرة (Risk Tier)
                </label>
                <select
                  value={editForm.riskTier}
                  onChange={(e) =>
                    setEditForm({ ...editForm, riskTier: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"
                >
                  <option value="LOW">منخفض (آمن)</option>
                  <option value="MEDIUM">متوسط</option>
                  <option value="HIGH">مرتفع (يحتاج مراقبة)</option>
                </select>
              </div>

              {/* مؤشر الالتزام السري */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مؤشر الالتزام الداخلي (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.secretRating}
                  onChange={(e) =>
                    setEditForm({ ...editForm, secretRating: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 text-left font-mono"
                  dir="ltr"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  يستخدم هذا المؤشر داخلياً لتقييم مدى التزام العميل بالسداد
                  والتعاون.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                حفظ التعديلات
              </button>
              <button
                onClick={() => setEditingClient(null)}
                className="px-5 bg-white border border-slate-300 text-slate-700 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsRatingsPanel;
