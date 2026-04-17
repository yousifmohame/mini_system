import React, { useState } from "react";
import {
  Folder,
  Trash2,
  X,
  Image as ImageIcon,
  Settings,
  Loader2,
  Save,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";
import { PREDEFINED_ICONS } from "../../utils";

export default function FolderCategoriesModal({
  categories,
  onSave,
  isSaving,
  onClose,
}) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [icon, setIcon] = useState("📁");
  const [color, setColor] = useState("#3b82f6");
  const [subFolders, setSubFolders] = useState([]);
  const [newSub, setNewSub] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCode("");
    setIcon("📁");
    setColor("#3b82f6");
    setSubFolders([]);
    setNewSub("");
  };

  const handleEditClick = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
    setCode(cat.code || "");
    setIcon(cat.icon);
    setColor(cat.color);
    setSubFolders(cat.subFolders || []);
    setNewSub("");
  };

  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 3); // أرقام فقط، حد أقصى 3
    setCode(val);
  };

  const handleAddSub = () => {
    if (newSub.trim() && !subFolders.includes(newSub.trim())) {
      setSubFolders([...subFolders, newSub.trim()]);
      setNewSub("");
    }
  };

  const handleRemoveSub = (sub) => {
    setSubFolders(subFolders.filter((s) => s !== sub));
  };

  const handleSaveCategory = () => {
    if (!name.trim()) return toast.error("يرجى إدخال اسم التصنيف");
    if (!code.trim() || code.length !== 3)
      return toast.error("كود التصنيف يجب أن يكون 3 أرقام");

    if (editingId) {
      setLocalCategories(
        localCategories.map((c) =>
          c.id === editingId
            ? { ...c, name, code, icon, color, subFolders }
            : c,
        ),
      );
      toast.success("تم تحديث التصنيف محلياً");
    } else {
      const newCategory = {
        id: `cat-${Date.now()}`,
        name,
        code,
        icon,
        color,
        subFolders,
        order: localCategories.length + 1,
      };
      setLocalCategories([...localCategories, newCategory]);
      toast.success("تم إضافة التصنيف محلياً");
    }
    resetForm();
  };

  const handleDeleteCategory = (id) => {
    setLocalCategories(localCategories.filter((c) => c.id !== id));
    toast.success("تم إزالة التصنيف محلياً");
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300]"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl shrink-0">
          <div className="flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">إعدادات تصنيفات المجلدات</h3>
              <p className="text-[11px] text-gray-500">
                إدارة الألوان، الرموز، التكويد، والمجلدات الفرعية التلقائية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* ── Form Section (Right) ── */}
          <div className="w-full md:w-1/2 p-6 border-l border-gray-200 overflow-y-auto bg-white">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-blue-900">
                {editingId ? "تعديل التصنيف" : "إضافة تصنيف جديد"}
              </h4>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="text-xs text-red-500 hover:underline"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  اسم التصنيف *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: المخططات المعتمدة"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    كود التصنيف (3 أرقام) *
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={handleCodeChange}
                    placeholder="001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-center outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    لون التصنيف
                  </label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-[38px] border border-gray-300 rounded-lg cursor-pointer bg-white p-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  الرمز (Icon)
                </label>
                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  {PREDEFINED_ICONS.map((ic) => (
                    <button
                      key={ic}
                      onClick={() => setIcon(ic)}
                      className={`w-8 h-8 rounded text-lg flex items-center justify-center transition-all ${icon === ic ? "bg-white shadow-md border border-blue-400 scale-110" : "hover:bg-gray-200 border border-transparent"}`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  مجلدات فرعية تلقائية (Sub-folders)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSub}
                    onChange={(e) => setNewSub(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSub()}
                    placeholder="اسم المجلد الفرعي..."
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                  />
                  <button
                    onClick={handleAddSub}
                    className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-gray-900 transition-colors"
                  >
                    إضافة
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subFolders.map((sub) => (
                    <span
                      key={sub}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-bold"
                    >
                      <Folder size={12} /> {sub}
                      <button
                        onClick={() => handleRemoveSub(sub)}
                        className="text-blue-400 hover:text-red-500 mr-1"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {subFolders.length === 0 && (
                    <span className="text-[10px] text-gray-400 font-semibold italic">
                      لا يوجد مجلدات فرعية مضافة
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleSaveCategory}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors mt-2"
              >
                {editingId ? "حفظ التعديلات" : "إضافة التصنيف"}
              </button>
            </div>
          </div>

          {/* ── List Section (Left) ── */}
          <div className="w-full md:w-1/2 p-6 bg-gray-50 overflow-y-auto">
            <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center justify-between">
              التصنيفات الحالية ({localCategories.length})
            </h4>
            <div className="space-y-3">
              {localCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-colors group"
                >
                  <div
                    className="w-10 h-10 rounded-lg border flex items-center justify-center text-xl shrink-0"
                    style={{
                      backgroundColor: `${category.color}15`,
                      borderColor: `${category.color}30`,
                    }}
                  >
                    {category.icon}
                  </div>

                  <div className="flex-1 min-w-0 mr-3">
                    <div className="font-bold text-gray-900 text-sm truncate">
                      {category.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-600 px-1.5 rounded border border-gray-200">
                        {category.code || "---"}
                      </span>
                      {category.subFolders?.length > 0 && (
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded">
                          {category.subFolders.length} مجلدات فرعية
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                    <button
                      onClick={() => handleEditClick(category)}
                      className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white rounded-b-xl shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={() => onSave(localCategories)}
            disabled={isSaving}
            className="px-6 py-2.5 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}{" "}
            اعتماد وحفظ الإعدادات بالخادم
          </button>
        </div>
      </div>
    </div>
  );
}
