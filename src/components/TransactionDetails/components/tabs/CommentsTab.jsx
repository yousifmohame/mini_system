import React, { useState } from "react";
import { MessageCircle, Trash2, Plus, Loader2, User, Clock } from "lucide-react";
import { formatDateTime } from "../../utils/transactionUtils"; // تأكد من استيراد هذه الدالة إذا كانت متوفرة

export const CommentsTab = ({ tx, updateTxMutation, currentUser }) => {
  const [newComment, setNewComment] = useState("");

  // استخراج مصفوفة التعليقات بأمان من الـ notes
  const comments = tx.notes?.transactionComments || [];

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const newCommentObj = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text: newComment,
      user: currentUser || "موظف النظام",
      date: new Date().toISOString()
    };

    const updatedNotes = {
      ...(tx.notes || {}),
      transactionComments: [newCommentObj, ...comments] // إضافة الأحدث في الأعلى
    };

    updateTxMutation.mutate({ notes: updatedNotes });
    setNewComment(""); // تفريغ الحقل بعد الإرسال
  };

  const handleDeleteComment = (commentId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التعليق؟")) return;

    const updatedComments = comments.filter(c => c.id !== commentId);
    const updatedNotes = {
      ...(tx.notes || {}),
      transactionComments: updatedComments
    };

    updateTxMutation.mutate({ notes: updatedNotes });
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-10 max-w-4xl mx-auto">
      
      {/* صندوق إضافة تعليق جديد */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" /> إضافة تعليق جديد
        </h3>
        <div className="flex flex-col gap-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="اكتب تعليقك، ملاحظتك، أو التوجيه هنا..."
            className="w-full border border-gray-300 rounded-xl p-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none min-h-[100px] bg-gray-50 focus:bg-white transition-colors"
          />
          <div className="flex justify-end">
            <button
              onClick={handleAddComment}
              disabled={updateTxMutation.isPending || !newComment.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {updateTxMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              حفظ التعليق
            </button>
          </div>
        </div>
      </div>

      {/* قائمة التعليقات السابقة */}
      <div className="space-y-4">
        <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">سجل التعليقات ({comments.length})</h4>
        
        {comments.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center text-gray-400">
             <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
             <p className="font-bold text-sm">لا توجد تعليقات مسجلة لهذه المعاملة بعد.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 group relative overflow-hidden">
               {/* شريط الديكور الجانبي */}
               <div className="absolute top-0 right-0 w-1 h-full bg-blue-400 opacity-50 group-hover:opacity-100 transition-opacity"></div>
               
               <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <User className="w-4 h-4" />
                     </div>
                     <div>
                        <div className="text-xs font-black text-gray-800">{comment.user}</div>
                        <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-0.5 font-mono">
                           <Clock className="w-3 h-3" /> {formatDateTime ? formatDateTime(comment.date) : new Date(comment.date).toLocaleString()}
                        </div>
                     </div>
                  </div>
                  
                  {/* زر الحذف يظهر عند التمرير */}
                  <button 
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-red-100"
                    title="حذف التعليق"
                  >
                     <Trash2 className="w-4 h-4" />
                  </button>
               </div>
               
               <div className="pr-11 text-sm font-bold text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {comment.text}
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};