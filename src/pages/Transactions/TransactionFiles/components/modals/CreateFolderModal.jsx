import React, { useState, useEffect } from "react";
import {
  Folder,
  FolderPlus,
  X,
  CheckSquare,
  Loader2,
  Layers,
  CheckCircle2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { TRANSACTION_PACKAGES } from "../../utils";

export default function CreateFolderModal({
  categories,
  onConfirm,
  onClose,
  isPending,
}) {
  const [tab, setTab] = useState("single"); // 'single' | 'package'

  // Single State
  const [folderName, setFolderName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Package State
  const [selectedTxType, setSelectedTxType] = useState("");

  // Auto-fill folder name based on category
  useEffect(() => {
    if (selectedCategory && tab === "single") {
      const cat = categories.find((c) => c.id === selectedCategory);
      if (
        cat &&
        (!folderName || categories.some((c) => c.name === folderName))
      ) {
        setFolderName(cat.name);
      }
    }
  }, [selectedCategory, categories, tab, folderName]);

  const handleCreate = () => {
    if (tab === "single") {
      if (!selectedCategory)
        return toast.error("يرجى اختيار تصنيف المجلد أولاً");
      if (!folderName.trim()) return toast.error("يرجى إدخال اسم المجلد");

      const cat = categories.find((c) => c.id === selectedCategory);
      const payload = [
        {
          name: folderName.trim(),
          categoryId: selectedCategory,
          subFolders: cat?.subFolders || [],
        },
      ];

      onConfirm(payload);
    } else {
      if (!selectedTxType)
        return toast.error("يرجى اختيار نوع المعاملة لإنشاء الحزمة");

      const catIdsToCreate = TRANSACTION_PACKAGES[selectedTxType] || [];
      if (catIdsToCreate.length === 0)
        return toast.error("لا توجد حزمة مبرمجة لهذا النوع حتى الآن");

      const payload = catIdsToCreate.map((catId) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          name: cat ? cat.name : "مجلد نظام",
          categoryId: catId,
          subFolders: cat?.subFolders || [],
        };
      });

      onConfirm(payload);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[500] backdrop-blur-sm p-4"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3 text-slate-800">
            <div className="bg-blue-100 p-2.5 rounded-xl border border-blue-200">
              <FolderPlus size={22} className="text-blue-700" />
            </div>
            <div>
              <h3 className="text-lg font-black leading-none mb-1">
                إنشاء مجلدات
              </h3>
              <p className="text-xs text-slate-500 font-bold">
                أضف مجلداً واحداً أو حزمة متكاملة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex bg-white shrink-0 p-2 gap-2 border-b border-slate-100">
          <button
            onClick={() => setTab("single")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              tab === "single"
                ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent"
            }`}
          >
            <FolderPlus size={16} /> مجلد مخصص
          </button>
          <button
            onClick={() => setTab("package")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              tab === "package"
                ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent"
            }`}
          >
            <Layers size={16} /> حزمة ذكية (متعدد)
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 bg-slate-50 flex-1 overflow-y-auto custom-scrollbar-slim">
          {tab === "single" ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Category Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-black text-slate-700">
                    اختر تصنيف المجلد <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {categories.length} تصنيفات
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto custom-scrollbar-slim bg-white p-3 border border-slate-200 rounded-xl shadow-inner">
                  {categories.map((category) => {
                    const isSelected = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 group ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-md ring-4 ring-blue-500/10"
                            : "border-slate-100 hover:border-blue-300 bg-white shadow-sm"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-0.5 shadow-sm">
                            <CheckCircle2 size={14} />
                          </div>
                        )}
                        <span
                          className={`text-3xl transition-transform duration-200 ${isSelected ? "scale-110" : "group-hover:scale-110"}`}
                        >
                          {category.icon}
                        </span>
                        <div className="flex flex-col items-center gap-0.5 w-full">
                          <span
                            className={`text-[11px] font-black text-center w-full truncate ${isSelected ? "text-blue-800" : "text-slate-700"}`}
                          >
                            {category.name}
                          </span>
                          {category.subFolders?.length > 0 && (
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 rounded-md">
                              {category.subFolders.length} فرعي
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {categories.length === 0 && (
                    <div className="col-span-3 text-center py-6 text-slate-400 text-xs font-bold">
                      لا توجد تصنيفات مضافة في النظام
                    </div>
                  )}
                </div>
              </div>

              {/* Folder Name */}
              <div
                className={`transition-all duration-300 ${selectedCategory ? "opacity-100" : "opacity-50 pointer-events-none grayscale-[50%]"}`}
              >
                <label className="block text-xs font-black text-slate-700 mb-2">
                  اسم المجلد النهائي <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Folder
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="سيتم التسمية التلقائية هنا..."
                    className="w-full pl-4 pr-10 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white transition-all font-bold text-sm text-slate-800 shadow-sm"
                  />
                </div>
                {selectedCategory && (
                  <p className="text-[10px] text-slate-500 mt-2 font-bold flex items-center gap-1">
                    <Info size={12} className="text-blue-500" /> يمكنك تعديل
                    الاسم المولد تلقائياً ليناسب احتياجك الدقيق.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Package Selection */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">
                  نوع المعاملة المطلوب (الحزمة الذكية){" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedTxType}
                    onChange={(e) => setSelectedTxType(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-white font-bold text-sm text-slate-800 shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="text-slate-400">
                      اختر نوع المعاملة لتوليد الحزمة المناسبة...
                    </option>
                    {Object.keys(TRANSACTION_PACKAGES).map((type) => (
                      <option key={type} value={type} className="font-bold">
                        {type}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    ▼
                  </div>
                </div>
              </div>

              {/* Package Preview */}
              {selectedTxType ? (
                <div className="bg-white border-2 border-indigo-100 rounded-xl p-5 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
                  <h4 className="text-xs font-black text-indigo-800 mb-4 flex items-center gap-2 pb-3 border-b border-indigo-50">
                    <CheckSquare size={16} className="text-indigo-600" />{" "}
                    محتويات الحزمة التلقائية (سيتم إنشاء{" "}
                    {TRANSACTION_PACKAGES[selectedTxType].length} مجلدات
                    رئيسية):
                  </h4>

                  <div className="space-y-3">
                    {TRANSACTION_PACKAGES[selectedTxType].map((catId) => {
                      const cat = categories.find((c) => c.id === catId);
                      if (!cat) return null;
                      return (
                        <div
                          key={cat.id}
                          className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-indigo-200 transition-colors"
                        >
                          <div className="text-2xl shrink-0 bg-white w-10 h-10 flex items-center justify-center rounded-lg shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                            {cat.icon}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <span className="font-black text-sm text-slate-800 block truncate">
                              {cat.name}
                            </span>
                            {cat.subFolders?.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {cat.subFolders.map((sub) => (
                                  <span
                                    key={sub}
                                    className="text-[9px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm"
                                  >
                                    <Folder
                                      size={10}
                                      className="text-amber-500"
                                    />{" "}
                                    {sub}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                                بدون مجلدات فرعية
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-10 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white opacity-60">
                  <Layers size={40} className="text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-500">
                    لا يوجد نوع معاملة محدد
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    اختر نوع المعاملة من القائمة أعلاه لرؤية محتويات الحزمة
                    التلقائية التي سيتم تكوينها لك.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-white shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            إلغاء
          </button>

          <button
            onClick={handleCreate}
            disabled={
              isPending ||
              (tab === "single" && !selectedCategory) ||
              (tab === "package" && !selectedTxType)
            }
            className={`flex items-center gap-2 px-8 py-2.5 text-xs font-black text-white rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed
              ${tab === "single" ? "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5" : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5"}
            `}
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FolderPlus size={16} />
            )}
            {tab === "single"
              ? "اعتماد وإنشاء المجلد"
              : "توليد وإنشاء الحزمة كاملة"}
          </button>
        </div>
      </div>
    </div>
  );
}
