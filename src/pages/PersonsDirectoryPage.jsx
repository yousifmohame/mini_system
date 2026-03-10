import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";
import {
  Search,
  Plus,
  X,
  BookUser,
  Handshake,
  UserCheck,
  Star,
  Briefcase,
  Users,
  Building2,
  Phone,
  FileText,
  Wallet,
  Receipt,
  Paperclip,
  Upload,
  Loader2,
  Link2,
  Info,
  Edit3,
  Trash2,
  Eye,
  ChevronDown,
} from "lucide-react";

const PersonsDirectoryPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [activeTab, setActiveTab] = useState("data");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");

  const [previewData, setPreviewData] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // ==========================================
  // Functions
  // ==========================================

  const handleViewAttachment = async (e, attachmentUrl) => {
    e.stopPropagation();
    if (!attachmentUrl) return;
    setIsPreviewLoading(true);
    try {
      const response = await api.get(attachmentUrl, { responseType: "blob" });
      const blob = response.data;
      const localBlobUrl = URL.createObjectURL(blob);
      setPreviewData({
        url: localBlobUrl,
        isPdf:
          response.headers["content-type"]?.includes("pdf") ||
          attachmentUrl.toLowerCase().endsWith(".pdf"),
      });
    } catch (error) {
      toast.error("فشل في تحميل المرفق.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewData) URL.revokeObjectURL(previewData.url);
    setPreviewData(null);
  };

  const initialForm = {
    id: null,
    name: "",
    role: "وسيط",
    phone: "",
    agreementType: "نسبة",
    notes: "",
    files: [],
  };
  const [formData, setFormData] = useState(initialForm);

  // ==========================================
  // Queries
  // ==========================================
  const { data: persons = [], isLoading } = useQuery({
    queryKey: ["persons-directory"],
    queryFn: async () => {
      const res = await api.get("/persons");
      return res.data?.data || [];
    },
  });

  // ==========================================
  // Mutations
  // ==========================================

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const fd = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === "files")
          Array.from(payload.files).forEach((f) => fd.append("files", f));
        else fd.append(key, payload[key]);
      });
      return (
        await api.post("/persons", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;
    },
    onSuccess: () => {
      toast.success("تمت إضافة الشخص بنجاح");
      queryClient.invalidateQueries(["persons-directory"]);
      setIsAddOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const fd = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === "files")
          Array.from(payload.files).forEach((f) => fd.append("files", f));
        else if (key !== "id") fd.append(key, payload[key]);
      });
      return (
        await api.put(`/persons/${payload.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;
    },
    onSuccess: (res) => {
      toast.success("تم تعديل البيانات بنجاح");
      queryClient.invalidateQueries(["persons-directory"]);
      setIsAddOpen(false);
      if (selectedPerson && selectedPerson.id === res.data.id) {
        setSelectedPerson((prev) => ({ ...prev, ...res.data }));
      }
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async ({ id, files }) => {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      return (
        await api.put(`/persons/${id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;
    },
    onSuccess: (res) => {
      toast.success("تم رفع المرفقات");
      queryClient.invalidateQueries(["persons-directory"]);
      if (selectedPerson) {
        setSelectedPerson((prev) => ({
          ...prev,
          attachments: res.data.attachments,
        }));
      }
    },
  });

  const removeAttachmentMutation = useMutation({
    mutationFn: async ({ id, fileUrl }) => {
      return (await api.put(`/persons/${id}/attachments/remove`, { fileUrl }))
        .data;
    },
    onSuccess: (res) => {
      toast.success("تم حذف المرفق");
      queryClient.invalidateQueries(["persons-directory"]);
      if (selectedPerson) {
        setSelectedPerson((prev) => ({
          ...prev,
          attachments: res.data.attachments,
        }));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/persons/${id}`),
    onSuccess: () => {
      toast.success("تم الحذف بنجاح");
      queryClient.invalidateQueries(["persons-directory"]);
      setSelectedPerson(null);
    },
  });

  // ==========================================
  // Handlers
  // ==========================================
  const handleOpenAdd = () => {
    setModalMode("add");
    setFormData(initialForm);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (e, row) => {
    e.stopPropagation();
    setModalMode("edit");
    setFormData({
      id: row.id,
      name: row.name,
      role: row.role,
      phone: row.phone || "",
      agreementType: row.agreementType || "نسبة",
      notes: row.notes || "",
      files: [],
    });
    setIsAddOpen(true);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("هل أنت متأكد من الحذف؟")) deleteMutation.mutate(id);
  };

  const filteredData = useMemo(() => {
    return persons.filter(
      (p) =>
        (p.name.includes(searchQuery) ||
          (p.phone && p.phone.includes(searchQuery))) &&
        (filterRole === "all" || p.role === filterRole),
    );
  }, [persons, searchQuery, filterRole]);

  const getRoleStyle = (role) => {
    const styles = {
      وسيط: {
        bg: "var(--wms-accent-blue)20",
        text: "var(--wms-accent-blue)",
        icon: Handshake,
      },
      معقب: {
        bg: "var(--wms-warning)20",
        text: "var(--wms-warning)",
        icon: UserCheck,
      },
      موظف: {
        bg: "var(--wms-success)20",
        text: "var(--wms-success)",
        icon: Briefcase,
      },
      شريك: {
        bg: "var(--wms-success)20",
        text: "var(--wms-success)",
        icon: Users,
      },
    };
    return (
      styles[role] || {
        bg: "var(--wms-surface-2)",
        text: "var(--wms-text-muted)",
        icon: BookUser,
      }
    );
  };

  return (
    <div
      className="p-3 flex flex-col h-full overflow-hidden bg-[var(--wms-bg-0)] font-sans"
      dir="rtl"
    >
      {/* 1. Header Toolbar */}
      <div className="flex items-center gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <BookUser className="w-8 h-8 text-blue-600 bg-blue-50 p-1.5 rounded-md" />
          <div>
            <div className="text-[var(--wms-text)] text-[15px] font-bold">
              سجل الأشخاص
            </div>
            <div className="text-[var(--wms-text-muted)] text-[10px]">
              {persons.length} شخص
            </div>
          </div>
        </div>
        <div className="flex-1"></div>
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--wms-text-muted)]" />
          <input
            type="text"
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[var(--wms-surface-2)] border border-[var(--wms-border)] rounded-md pr-8 pl-3 text-[var(--wms-text)] outline-none w-[220px] h-[32px] text-[12px]"
          />
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 rounded-md bg-[var(--wms-accent-blue)] text-white h-[32px] text-[12px] font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          إضافة
        </button>
      </div>

      {/* 2. Table */}
      <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-auto custom-scrollbar-slim flex-1">
          <table className="w-full text-right whitespace-nowrap text-[12px]">
            <thead className="sticky top-0 z-10 bg-[var(--wms-surface-2)]">
              <tr className="h-[36px]">
                <th className="px-3">الاسم</th>
                <th className="px-3">الدور</th>
                <th className="px-3">الجوال</th>
                <th className="px-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--wms-border)]/30 hover:bg-[var(--wms-surface-2)]/40 transition-colors h-[40px]"
                  >
                    <td className="px-3 font-bold">{row.name}</td>
                    <td className="px-3">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                        style={{
                          backgroundColor: getRoleStyle(row.role).bg,
                          color: getRoleStyle(row.role).text,
                        }}
                      >
                        {row.role}
                      </span>
                    </td>
                    <td className="px-3 font-mono">{row.phone || "—"}</td>
                    <td className="px-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPerson(row);
                            setActiveTab("data");
                          }}
                          className="text-blue-500"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleOpenEdit(e, row)}
                          className="text-amber-500"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, row.id)}
                          className="text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {selectedPerson && (
        <div
          className="fixed inset-0 bg-black/50 z-[50] flex items-center justify-center p-4"
          dir="rtl"
          onClick={() => setSelectedPerson(null)}
        >
          <div
            className="bg-white border border-[var(--wms-border)] rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[800px] h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                  {selectedPerson.name?.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-lg">{selectedPerson.name}</div>
                  <div className="text-xs text-gray-400">
                    {selectedPerson.role} | {selectedPerson.personCode}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedPerson(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex border-b bg-gray-50 shrink-0">
              {[
                "data",
                "transactions",
                "settlements",
                "collections",
                "disbursements",
                "attachments",
              ].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-3 text-[12px] border-b-2 transition-colors ${activeTab === t ? "border-blue-600 text-blue-600 font-bold bg-white" : "border-transparent text-gray-500"}`}
                >
                  {t === "data"
                    ? "البيانات"
                    : t === "transactions"
                      ? "المعاملات"
                      : t === "settlements"
                        ? "التسويات"
                        : t === "collections"
                          ? "التحصيلات"
                          : t === "disbursements"
                            ? "المصروفات"
                            : "المرفقات"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
              {activeTab === "data" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border">
                      <strong>الجوال:</strong>{" "}
                      <span className="font-mono">
                        {selectedPerson.phone || "—"}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <strong>الاتفاق:</strong>{" "}
                      {selectedPerson.agreementType || "—"}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <strong>ملاحظات:</strong>
                    <p className="text-sm mt-1">
                      {selectedPerson.notes || "لا توجد"}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "attachments" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">المرفقات المرفوعة</span>
                    <label className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-bold hover:bg-blue-700">
                      {uploadAttachmentMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Plus className="w-3 h-3 inline mr-1" />
                      )}{" "}
                      إضافة مرفق
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length)
                            uploadAttachmentMutation.mutate({
                              id: selectedPerson.id,
                              files: e.target.files,
                            });
                          e.target.value = null;
                        }}
                      />
                    </label>
                  </div>
                  {!selectedPerson.attachments ||
                  selectedPerson.attachments.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 border-2 border-dashed rounded-lg">
                      لا توجد ملفات
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedPerson.attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-bold truncate w-32">
                              {file.name}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => handleViewAttachment(e, file.url)}
                              className="text-blue-600 text-[10px] font-bold hover:underline"
                            >
                              معاينة
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm("حذف؟"))
                                  removeAttachmentMutation.mutate({
                                    id: selectedPerson.id,
                                    fileUrl: file.url,
                                  });
                              }}
                              className="text-red-500 text-[10px] font-bold hover:underline"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {[
                "transactions",
                "settlements",
                "collections",
                "disbursements",
              ].includes(activeTab) && (
                <div className="space-y-2">
                  <div className="text-sm font-bold text-gray-700 mb-3">
                    السجلات المرتبطة:
                  </div>
                  {(
                    selectedPerson[
                      activeTab === "transactions"
                        ? "transactionsList"
                        : activeTab === "settlements"
                          ? "settlementsTarget"
                          : activeTab === "collections"
                            ? "paymentsCollected"
                            : "disbursements"
                    ] || []
                  ).map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between p-3 bg-white border rounded-md shadow-sm"
                    >
                      <span className="font-mono text-xs font-bold">
                        {item.ref || item.code || item.requestNumber}
                      </span>
                      <span className="font-bold text-xs text-green-600">
                        {item.amount?.toLocaleString()} ر.س
                      </span>
                    </div>
                  ))}
                  {!selectedPerson[
                    activeTab === "transactions"
                      ? "transactionsList"
                      : activeTab === "settlements"
                        ? "settlementsTarget"
                        : activeTab === "collections"
                          ? "paymentsCollected"
                          : "disbursements"
                  ]?.length && (
                    <div className="text-center py-10 text-gray-400">
                      لا توجد بيانات مرتبطة
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-white border rounded-xl shadow-2xl w-full max-w-[500px]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <span className="font-bold">
                {modalMode === "add" ? "إضافة شخص" : "تعديل بيانات"}
              </span>
              <button onClick={() => setIsAddOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border p-2 rounded-md outline-none focus:border-blue-500 font-bold text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    الدور *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full border p-2 rounded-md outline-none text-sm"
                  >
                    <option>وسيط</option>
                    <option>معقب</option>
                    <option>موظف</option>
                    <option>شريك</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    الجوال
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full border p-2 rounded-md font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full border p-2 rounded-md h-20 resize-none text-sm"
                ></textarea>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-xl">
              <button
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-1.5 rounded-md border bg-white text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={() =>
                  modalMode === "add"
                    ? createMutation.mutate(formData)
                    : updateMutation.mutate(formData)
                }
                className="px-4 py-1.5 bg-blue-600 text-white rounded-md font-bold text-sm"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "حفظ البيانات"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewData && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
          dir="rtl"
          onClick={closePreview}
        >
          <div
            className="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <span className="font-bold flex items-center gap-2 text-sm">
                <Paperclip className="w-4 h-4 text-blue-600" /> معاينة المرفق
              </span>
              <button
                onClick={closePreview}
                className="p-1 hover:bg-red-50 rounded text-red-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 bg-gray-200 flex items-center justify-center overflow-auto p-4">
              {previewData.isPdf ? (
                <iframe
                  src={previewData.url}
                  className="w-full h-full rounded shadow-lg bg-white"
                  title="PDF"
                />
              ) : (
                <img
                  src={previewData.url}
                  className="max-w-full max-h-full object-contain shadow-2xl rounded"
                  alt="Preview"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonsDirectoryPage;
