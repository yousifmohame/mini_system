import React from "react";
import {
  FileText,
  Edit3,
  X,
  Save,
  Loader2,
  User,
  EyeOff,
  MapPinned,
} from "lucide-react";
import { SearchableSelect } from "../TransactionSharedUI";

export const BasicTab = ({
  tx,
  isEditingBasic,
  setIsEditingBasic,
  editFormData,
  setEditFormData,
  saveBasicEdits,
  updateTxMutation,
  clientsOptions,
  districtsOptions,
  offices,
  persons,
  formatDateTime,
  safeText,
}) => (
  <div className="space-y-6 animate-in fade-in">
    <div className="flex justify-between items-center mb-2">
      <h3 className="font-bold text-gray-800 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" /> البيانات الرئيسية
      </h3>
      <button
        onClick={() => setIsEditingBasic(!isEditingBasic)}
        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
      >
        {isEditingBasic ? (
          <X className="w-3.5 h-3.5" />
        ) : (
          <Edit3 className="w-3.5 h-3.5" />
        )}
        {isEditingBasic ? "إلغاء التعديل" : "تعديل البيانات"}
      </button>
    </div>

    <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-center gap-3">
      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
        <User className="w-5 h-5" />
      </div>
      <div>
        <div className="text-[10px] font-bold text-blue-600 mb-0.5">
          مُنشئ المعاملة
        </div>
        <div className="text-sm font-black text-gray-800">
          {tx.createdBy || tx.notes?.createdBy || "مدير النظام"}
        </div>
        <div className="text-[11px] font-mono text-gray-500 mt-0.5">
          {formatDateTime(tx.createdAt)}
        </div>
      </div>
    </div>

    {/* الاسم المتداول */}
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1 h-full bg-blue-500"></div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-[11px] font-bold text-gray-500 flex items-center gap-2">
          الاسم المتداول للمعامله (داخلي للمكتب)
        </label>
        {isEditingBasic && (
          <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
            <input
              type="checkbox"
              className="accent-blue-600 w-3.5 h-3.5"
              checked={editFormData.isInternalNameHidden}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  isInternalNameHidden: e.target.checked,
                })
              }
            />
            <span className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
              <EyeOff className="w-3 h-3" /> إخفاء عن العميل/التقارير
            </span>
          </label>
        )}
      </div>
      {isEditingBasic ? (
        <input
          type="text"
          value={editFormData.internalName}
          onChange={(e) =>
            setEditFormData({
              ...editFormData,
              internalName: e.target.value,
            })
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          placeholder="مثال: فيلا الياسمين - مشروع أبو محمد..."
        />
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-lg font-black text-gray-800">
            {tx.internalName || tx.notes?.internalName || "—"}
          </span>
          {tx.notes?.isInternalNameHidden && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded-md flex items-center gap-1">
              <EyeOff className="w-3 h-3" /> مخفي عن التقارير
            </span>
          )}
        </div>
      )}
    </div>

    {/* 💡 بيانات الأرض / المخطط / القطعة */}
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <div className="text-sm font-black text-gray-800 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
        <MapPinned className="w-4 h-4 text-emerald-600" /> تفاصيل الموقع
        والمساحة
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-gray-500 text-[10px] font-bold mb-1.5 block">
            رقم المخطط
          </label>
          {isEditingBasic ? (
            <input
              type="text"
              value={editFormData.plan}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  plan: e.target.value,
                })
              }
              className="w-full border border-gray-300 rounded p-2 text-sm font-mono outline-none focus:border-blue-500"
              placeholder="مثال: 3020/أ"
            />
          ) : (
            <div className="font-bold text-gray-800 font-mono">
              {tx.notes?.refs?.plan || "—"}
            </div>
          )}
        </div>
        <div>
          <label className="text-gray-500 text-[10px] font-bold mb-1.5 block">
            أرقام القطع
          </label>
          {isEditingBasic ? (
            <input
              type="text"
              value={editFormData.plots}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  plots: e.target.value,
                })
              }
              className="w-full border border-gray-300 rounded p-2 text-sm font-mono outline-none focus:border-blue-500"
              placeholder="مثال: 12, 13, 14"
            />
          ) : (
            <div className="font-bold text-gray-800 font-mono">
              {Array.isArray(tx.notes?.refs?.plots)
                ? tx.notes.refs.plots.join(" ، ")
                : tx.notes?.refs?.plots || "—"}
            </div>
          )}
        </div>
        <div>
          <label className="text-gray-500 text-[10px] font-bold mb-1.5 block">
            المساحة الإجمالية
          </label>
          {isEditingBasic ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={editFormData.area}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    area: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded p-2 text-sm font-mono outline-none focus:border-blue-500"
                placeholder="0"
              />
              <span className="bg-gray-100 px-3 py-2 rounded text-xs font-bold text-gray-500">
                م²
              </span>
            </div>
          ) : (
            <div className="font-bold text-gray-800 font-mono">
              {/* 💡 التعديل هنا: قراءة المساحة من المكان الصحيح (الحديث ثم القديم) */}
              {tx.landArea || tx.notes?.refs?.landArea || tx.notes?.refs?.area
                ? `${tx.landArea || tx.notes?.refs?.landArea || tx.notes?.refs?.area} م²`
                : "—"}
            </div>
          )}
        </div>
        <div className="col-span-3 mt-2">
          <label className="text-gray-500 text-[10px] font-bold mb-1.5 block">
            رابط الخرائط الرسمية (Google Maps)
          </label>
          {isEditingBasic ? (
            <input
              type="text"
              dir="ltr"
              value={editFormData.mapsLink}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  mapsLink: e.target.value,
                })
              }
              className="w-full border border-gray-300 rounded p-2 text-sm font-mono outline-none focus:border-blue-500"
              placeholder="https://maps.google.com/..."
            />
          ) : tx.notes?.refs?.mapsLink ? (
            <button
              onClick={() => window.open(tx.notes.refs.mapsLink, "_blank")}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-colors w-max border border-emerald-200"
            >
              <MapPinned className="w-4 h-4" /> عرض موقع الأرض على الخريطة
            </button>
          ) : (
            <div className="text-xs text-gray-400 font-bold">
              لم يتم إدراج رابط للموقع
            </div>
          )}
        </div>
      </div>
    </div>

    {/* باقي الحقول (رقم المعاملة، المالك، النوع) */}
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="text-gray-500 text-[11px] font-bold mb-2">
          رقم المعاملة (التسكين)
        </div>
        {isEditingBasic ? (
          <div className="flex gap-2">
            <select
              value={editFormData.year}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  year: e.target.value,
                })
              }
              className="border p-1.5 rounded text-xs w-1/2 outline-none focus:border-blue-500"
            >
              {[2023, 2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={editFormData.month}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  month: e.target.value,
                })
              }
              className="border p-1.5 rounded text-xs w-1/2 outline-none focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={String(m).padStart(2, "0")}>
                  {String(m).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="font-mono text-xl font-black text-blue-700">
            {tx.ref || tx.id.slice(-6)}
          </div>
        )}
      </div>
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm col-span-2">
        <div className="text-gray-500 text-[11px] font-bold mb-2">
          اسم المالك
        </div>
        {isEditingBasic ? (
          <SearchableSelect
            options={clientsOptions}
            value={editFormData.clientId}
            placeholder={editFormData.clientName || "ابحث بالاسم..."}
            onChange={(val, opt) =>
              setEditFormData({
                ...editFormData,
                clientId: val,
                clientName: opt.label,
                client: opt.label,
              })
            }
          />
        ) : (
          <div className="text-lg font-black text-gray-800">
            {safeText(tx.client || tx.owner)}
          </div>
        )}
      </div>
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="text-gray-500 text-[11px] font-bold mb-2">
          نوع المعاملة
        </div>
        {isEditingBasic ? (
          <select
            value={editFormData.type}
            onChange={(e) =>
              setEditFormData({
                ...editFormData,
                type: e.target.value,
              })
            }
            className="w-full border p-1.5 rounded text-sm font-bold outline-none focus:border-blue-500"
          >
            <option>اصدار</option>
            <option>تجديد وتعديل</option>
            <option>تصحيح وضع مبني قائم</option>
          </select>
        ) : (
          <div className="text-lg font-black text-gray-800">
            {safeText(tx.type)}
          </div>
        )}
      </div>
    </div>

    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="text-gray-500 text-[11px] font-bold mb-2">
          الحي والقطاع
        </div>
        {isEditingBasic ? (
          <SearchableSelect
            options={districtsOptions}
            value={editFormData.districtId}
            placeholder={editFormData.district || "تعديل الحي..."}
            onChange={(val, opt) =>
              setEditFormData({
                ...editFormData,
                districtId: val,
                district: opt.label.split(" (")[0],
                sector: opt.sectorName,
              })
            }
          />
        ) : (
          <div className="text-md font-bold text-gray-800">
            {safeText(tx.district)} - {safeText(tx.sector)}
          </div>
        )}
      </div>
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="text-gray-500 text-[11px] font-bold mb-2">
          المكتب المنفذ (الخارجي)
        </div>
        {isEditingBasic ? (
          <select
            value={editFormData.office}
            onChange={(e) =>
              setEditFormData({
                ...editFormData,
                office: e.target.value,
              })
            }
            className="w-full border p-1.5 rounded text-sm font-bold outline-none focus:border-blue-500"
          >
            <option value="مكتب ديتيلز">مكتب ديتيلز (داخلي)</option>
            {offices.map((o) => (
              <option key={o.id} value={o.name}>
                {o.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-md font-bold text-gray-700">
            {safeText(tx.office || "مكتب ديتيلز")}
          </div>
        )}
      </div>
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="text-gray-500 text-[11px] font-bold mb-2">
          مصدر المعاملة (الداخلي)
        </div>
        {isEditingBasic ? (
          <select
            value={editFormData.sourceName}
            onChange={(e) =>
              setEditFormData({
                ...editFormData,
                sourceName: e.target.value,
              })
            }
            className="w-full border p-1.5 rounded text-sm font-bold outline-none focus:border-blue-500"
          >
            <option value="مباشر">مباشر (بدون مصدر)</option>
            {persons.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-md font-black text-purple-700">
            {safeText(tx.sourceName || tx.source || "مباشر")}
          </div>
        )}
      </div>
    </div>

    {isEditingBasic && (
      <div className="flex justify-end mt-4">
        <button
          onClick={saveBasicEdits}
          disabled={updateTxMutation.isPending}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {updateTxMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          ) : (
            <Save className="w-4 h-4 inline mr-2" />
          )}{" "}
          حفظ التعديلات
        </button>
      </div>
    )}
  </div>
);
