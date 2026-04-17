import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../api/axios";
import { toast } from "sonner";
import {
  MessageSquare,
  Bot,
  User,
  Paperclip,
  Send,
  Loader2,
  CalendarClock,
  ExternalLink,
  RefreshCw,
  X,
  Edit2,
  Trash2,
  UserPlus,
  Download,
  Printer,
  Share2,
  Send as SendIcon,
  ClipboardPaste,
  FileCheck,
  History
} from "lucide-react";

export const AuthorityNotesTab = ({ tx, currentUser, persons }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // States
  const [noteText, setNoteText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [assignedTo, setAssignedTo] = useState("");

  // حالات التعديل والعرض
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  // 💡 دالة معالجة الروابط الاحترافية (تتخلص من ../ وتضمن الرابط الصحيح)
  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;

    // تنظيف الرابط من النقاط الزائدة (مثل ../uploads)
    let fixedUrl = url.replace(/\.\.\//g, "");
    if (!fixedUrl.startsWith("/")) fixedUrl = `/${fixedUrl}`;
    if (fixedUrl.startsWith("/uploads/")) fixedUrl = `/api${fixedUrl}`;

    const baseUrl = "https://details-worksystem1.com";
    return `${baseUrl}${fixedUrl}`;
  };

  // 💡 دعم اللصق المتقدم (Clipboard) للصور وملفات الـ PDF
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        // التحقق مما إذا كان العنصر صورة أو ملف PDF
        if (
          items[i].type.indexOf("image") !== -1 ||
          items[i].type.indexOf("pdf") !== -1
        ) {
          const file = items[i].getAsFile();
          if (file) {
            // التحقق من الحجم أو مجرد التعيين
            setSelectedFile(file);
            toast.success(
              <div className="flex items-center gap-2">
                <ClipboardPaste className="w-4 h-4 text-emerald-600" />
                <span>تم إرفاق الملف من الحافظة بنجاح</span>
              </div>,
            );
            e.preventDefault(); // منع السلوك الافتراضي للصق داخل الـ textarea إذا كان ملفاً
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // جلب الإيميلات المرتبطة (السحب الآلي)
  const { data: relatedEmails = [], isLoading: emailsLoading } = useQuery({
    queryKey: ["related-emails", tx.serviceNumber, tx.requestNumber],
    queryFn: async () => {
      if (!tx.serviceNumber && !tx.requestNumber) return [];
      const res = await api.get(`/email/messages/search`, {
        params: {
          serviceNumber: tx.serviceNumber,
          reqNumber: tx.requestNumber,
        },
      });
      return res.data?.data || [];
    },
    enabled: !!(tx.serviceNumber || tx.requestNumber),
  });

  // حفظ أو تعديل الملاحظة
  const saveNoteMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("note", noteText);
      if (assignedTo) fd.append("assignedTo", assignedTo);
      if (selectedFile) fd.append("file", selectedFile);

      if (editingNoteId) {
        return api.put(
          `/private-transactions/${tx.id}/authority-notes/${editingNoteId}`,
          fd,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
      } else {
        fd.append("addedBy", currentUser);
        return api.post(`/private-transactions/${tx.id}/authority-notes`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
    },
    onSuccess: () => {
      toast.success(
        editingNoteId ? "تم تعديل الإفادة بنجاح" : "تم حفظ الإفادة بنجاح",
      );
      setNoteText("");
      setSelectedFile(null);
      setAssignedTo("");
      setEditingNoteId(null);
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
    onError: () => toast.error("حدث خطأ أثناء الحفظ، يرجى المحاولة لاحقاً"),
  });

  // حذف الملاحظة
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId) =>
      api.delete(`/private-transactions/${tx.id}/authority-notes/${noteId}`),
    onSuccess: () => {
      toast.success("تم حذف الإفادة");
      queryClient.invalidateQueries(["private-transactions-full"]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return toast.error("يرجى كتابة نص الإفادة أولاً");
    saveNoteMutation.mutate();
  };

  const handleEditInit = (noteObj) => {
    setNoteText(noteObj.note);
    setAssignedTo(noteObj.assignedTo || "");
    setEditingNoteId(noteObj.id);
    setSelectedFile(null); // لا نجلب الملف القديم كـ File، سيبقى في السيرفر إن لم نغيره
  };

  // دمج الملاحظات اليدوية والآلية (الإيميلات) وترتيبها
  const combinedNotes = useMemo(() => {
    const manualNotes = (tx.notes?.authorityNotesHistory || []).map((note) => ({
      ...note,
      type: "manual",
      timestamp: new Date(note.date).getTime(),
    }));

    const autoNotes = relatedEmails.map((email) => ({
      id: email.id,
      note: email.replyText || email.body || "لا يوجد نص",
      addedBy: email.from || "رسالة واردة",
      subject: email.subject,
      date: email.date,
      type: "auto",
      timestamp: new Date(email.date).getTime(),
    }));

    return [...manualNotes, ...autoNotes].sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  }, [tx.notes?.authorityNotesHistory, relatedEmails]);

  return (
    <div
      className="h-full flex flex-col gap-4 animate-in fade-in pb-10"
      dir="rtl"
    >
      {/* ── قسم إدخال الملاحظة ── */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm shrink-0 transition-all">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            {editingNoteId
              ? "تعديل الإفادة المحددة"
              : "تدوين إفادة أو توجيه جديد"}
          </h3>
          {editingNoteId && (
            <button
              onClick={() => {
                setEditingNoteId(null);
                setNoteText("");
                setAssignedTo("");
                setSelectedFile(null);
              }}
              className="text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> إلغاء التعديل
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="اكتب تفاصيل التوجيه أو الإفادة هنا..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-h-[80px] resize-y leading-relaxed transition-all"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* زر الإرفاق الواضح */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-black border transition-all ${
                  selectedFile
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300 shadow-sm"
                }`}
              >
                {selectedFile ? (
                  <FileCheck className="w-4 h-4" />
                ) : (
                  <Paperclip className="w-4 h-4 text-blue-500" />
                )}
                {selectedFile ? "تغيير المرفق" : "رفع ملف أو لصقه (Ctrl+V)"}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="hidden"
                accept="image/*,.pdf"
              />

              {/* اسم الملف المرفق مع زر الحذف */}
              {selectedFile && (
                <div className="flex items-center gap-1.5 bg-emerald-100/50 border border-emerald-200 px-3 py-1.5 rounded-lg max-w-[200px]">
                  <span
                    className="text-[10px] font-bold text-emerald-800 truncate"
                    title={selectedFile.name}
                  >
                    {selectedFile.name}
                  </span>
                  <X
                    className="w-3.5 h-3.5 text-emerald-600 cursor-pointer hover:text-red-500 shrink-0"
                    onClick={() => setSelectedFile(null)}
                  />
                </div>
              )}

              <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

              {/* التوجيه لموظف */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 shadow-sm hover:border-slate-300 transition-colors flex-1 sm:flex-none">
                <UserPlus className="w-4 h-4 text-blue-500 shrink-0" />
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="bg-transparent border-none text-[11px] font-bold py-2 px-2 outline-none w-full sm:w-36 cursor-pointer text-slate-700"
                >
                  <option value="">توجيه لموظف...</option>
                  {persons?.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* زر الإرسال */}
            <button
              onClick={handleSubmit}
              disabled={saveNoteMutation.isPending || !noteText.trim()}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg text-[11px] font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-200 disabled:opacity-50 shrink-0"
            >
              {saveNoteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {editingNoteId ? "حفظ التعديل" : "إرسال واعتماد"}
            </button>
          </div>
        </div>
      </div>

      {/* ── الخط الزمني للملاحظات ── */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex justify-between items-center bg-slate-50/80 px-5 py-3.5 border-b border-slate-100 shrink-0">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            سجل الإفادات والملاحظات
          </h3>
          {emailsLoading && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> جاري التحديث
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 bg-slate-50/30">
          {combinedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-10">
              <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
              <p className="text-xs font-black text-slate-500">
                لا توجد إفادات أو ملاحظات مسجلة حتى الآن.
              </p>
              <p className="text-[10px] font-bold text-slate-400 mt-1">
                ابدأ بكتابة إفادة في المربع أعلاه
              </p>
            </div>
          ) : (
            combinedNotes.map((item, idx) => {
              const fullAttachmentUrl = getFullUrl(item.attachment);

              return (
                <div
                  key={item.id || idx}
                  className={`p-4 md:p-5 rounded-2xl border transition-all hover:shadow-md ${
                    item.type === "auto"
                      ? "bg-gradient-to-l from-purple-50/50 to-white border-purple-100"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3 border-b border-slate-100/80 pb-3 gap-4">
                    <div className="flex items-start gap-3">
                      {item.type === "auto" ? (
                        <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl shadow-sm border border-purple-200">
                          <Bot className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl shadow-sm border border-blue-200">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5 mt-0.5">
                        <span
                          className={`text-xs font-black ${item.type === "auto" ? "text-purple-800" : "text-slate-800"}`}
                        >
                          {item.type === "auto"
                            ? "سحب آلي (نظام بلدي)"
                            : item.addedBy}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.assignedTo && (
                            <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                              <UserPlus className="w-3 h-3" /> توجيه لـ:{" "}
                              {item.assignedTo}
                            </span>
                          )}
                          {item.type === "manual" && (
                            <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                              إضافة يدوية
                            </span>
                          )}
                        </div>
                        {item.subject && (
                          <span
                            className="text-[10px] text-slate-500 font-bold max-w-[250px] truncate bg-slate-50 px-2 py-0.5 rounded border border-slate-100"
                            title={item.subject}
                          >
                            الموضوع: {item.subject}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                        <CalendarClock className="w-3.5 h-3.5 text-blue-500" />
                        <span dir="ltr">
                          {new Date(item.date).toLocaleString("en-GB", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      {item.type === "manual" && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleEditInit(item)}
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-md transition-colors"
                          >
                            <Edit2 className="w-3 h-3" /> تعديل
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  "هل أنت متأكد من حذف هذه الإفادة؟",
                                )
                              )
                                deleteNoteMutation.mutate(item.id);
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> حذف
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`text-xs font-bold leading-relaxed whitespace-pre-wrap ${item.type === "auto" ? "text-purple-900" : "text-slate-700"}`}
                  >
                    {item.note}
                  </div>

                  {/* شريط الإجراءات السفلي (للمرفقات والمشاركة) */}
                  {fullAttachmentUrl && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setPreviewFile(fullAttachmentUrl)}
                        className="flex items-center gap-1.5 text-[11px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200 shadow-sm"
                      >
                        <ExternalLink className="w-4 h-4" /> عرض المرفق
                      </button>

                      <div className="w-px h-5 bg-slate-200 hidden sm:block mx-1"></div>

                      <a
                        href={`https://wa.me/?text=مرفق إفادة بلدي: ${fullAttachmentUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg border border-green-200 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" /> واتساب
                      </a>
                      <a
                        href={`https://t.me/share/url?url=${fullAttachmentUrl}&text=مرفق إفادة بلدي`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-[10px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200 transition-colors"
                      >
                        <SendIcon className="w-3.5 h-3.5" /> تليجرام
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── عارض المرفقات الداخلي (Modal) ── */}
      {previewFile && (
        <div
          className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-in fade-in"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 sm:p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-emerald-400" /> معاينة المرفق
              </h3>
              <div className="flex gap-2 items-center">
                <a
                  href={previewFile}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-300 hover:text-white flex items-center gap-1.5 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors border border-slate-700"
                >
                  <Download className="w-4 h-4" />{" "}
                  <span className="hidden sm:inline">تحميل</span>
                </a>
                <button
                  onClick={() => {
                    const printWindow = window.open(previewFile);
                    printWindow.print();
                  }}
                  className="text-slate-300 hover:text-white flex items-center gap-1.5 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors border border-slate-700"
                >
                  <Printer className="w-4 h-4" />{" "}
                  <span className="hidden sm:inline">طباعة</span>
                </button>
                <div className="w-px h-6 bg-slate-700 mx-1"></div>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-hidden flex items-center justify-center relative">
              {previewFile.toLowerCase().includes(".pdf") ? (
                <iframe
                  src={previewFile}
                  className="w-full h-full rounded-xl bg-white shadow-inner border border-slate-200"
                  title="PDF Preview"
                />
              ) : previewFile.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) ? (
                <img
                  src={previewFile}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-slate-200 bg-white p-2"
                />
              ) : (
                <div className="text-center text-slate-500 bg-white p-10 rounded-2xl border border-slate-200 shadow-sm">
                  <ExternalLink className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="font-bold text-sm mb-4">
                    هذا النوع من الملفات لا يمكن معاينته مباشرة داخل المتصفح
                  </p>
                  <a
                    href={previewFile}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 inline-flex items-center gap-2 shadow-md"
                  >
                    <Download className="w-4 h-4" /> انقر هنا لفتحه أو تحميله
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
