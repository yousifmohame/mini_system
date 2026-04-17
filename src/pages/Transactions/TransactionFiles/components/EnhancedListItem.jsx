import React from "react";
import {
  FolderOpen,
  Check,
  Star,
  ShieldAlert,
  Link2,
  Lock,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { CopyableCell, CommunicationBlock } from "./SharedComponents";
import { formatFileSize, formatDateWithTime, GRID_COLUMNS } from "../utils";

export default function EnhancedListItem({
  transaction,
  isSelected,
  gridColumns,
  onClick,
  onDoubleClick,
  onContextMenu,
  onStatusChange, // 💡 لم تعد مستخدمة هنا ولكن تركناها إن احتجتها لاحقاً
  onUrgentToggle,
  onOpenLinks,
}) {
  const isLocked = transaction.locked;
  const renderHidden = (val) => (isLocked ? "••••••••" : val);
  const modified = formatDateWithTime(transaction.modifiedAt);
  const created = formatDateWithTime(transaction.createdAt);

  return (
    <div
      onClick={isLocked ? undefined : onClick}
      onDoubleClick={isLocked ? undefined : onDoubleClick}
      onContextMenu={(e) => onContextMenu(e, transaction)}
      className={`grid gap-2 items-center px-3 py-2.5 cursor-pointer transition-all border-b border-gray-200 relative ${isSelected && !isLocked ? "bg-blue-50/80 border-l-4 border-l-blue-600 shadow-sm z-10" : "hover:bg-gray-50 border-l-4 border-l-transparent bg-white"} ${isLocked ? "bg-slate-50 opacity-80" : ""} ${transaction.isUrgent ? "bg-red-50/30" : ""}`}
      style={{ gridTemplateColumns: gridColumns }}
      dir="rtl"
    >
      {/* 1. التحديد */}
      <div className="flex justify-center">
        <div
          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"}`}
        >
          {isSelected && (
            <Check size={12} className="text-white" strokeWidth={3} />
          )}
        </div>
      </div>

      {/* 2. الأهمية (نجمة) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onUrgentToggle(transaction.id, !transaction.isUrgent);
        }}
        className="flex justify-center transition-colors hover:text-red-500"
      >
        <Star
          size={17}
          className={
            transaction.isUrgent ? "fill-red-500 text-red-500" : "text-gray-300"
          }
        />
      </button>

      {/* 3. المجلد والمالك */}
      <div className="flex flex-col min-w-0 py-0.5">
        <div className="flex items-center gap-1.5 mb-1">
          <FolderOpen
            size={15}
            className={isLocked ? "text-gray-400" : "text-amber-500 shrink-0"}
          />
          <CopyableCell
            text={`${transaction.ownerFirstName} ${transaction.ownerLastName}${transaction.commonName ? ` || ${transaction.commonName} || ${transaction.district}` : ""}`}
            className="text-[12px] font-black text-gray-900"
            label="اسم المجلد"
          />
          {isLocked && (
            <ShieldAlert size={13} className="text-red-500 shrink-0 mr-1" />
          )}
        </div>
        {!isLocked && (
          <div className="flex items-center gap-1 flex-wrap">
            {transaction.brokerName && (
              <span className="border border-[#7f1d1d] text-[#7f1d1d] bg-white px-1.5 py-0.5 rounded text-[9px] font-bold">
                الوسيط: {transaction.brokerName}
              </span>
            )}
            {transaction.agentName && (
              <span className="border border-[#7f1d1d] text-[#7f1d1d] bg-white px-1.5 py-0.5 rounded text-[9px] font-bold">
                المعقب: {transaction.agentName}
              </span>
            )}
          </div>
        )}
        {!isLocked && transaction.hasLinked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenLinks(transaction);
            }}
            className="mt-1 flex items-center gap-1 w-max text-[9px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded-full"
          >
            <Link2 size={9} /> مرتبط
          </button>
        )}
      </div>

      {/* 4. الرقم والنوع */}
      <div className="flex flex-col gap-1">
        <CopyableCell
          text={transaction.transactionCode}
          className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 w-max"
          label="الرقم"
          isHidden={isLocked}
        />
        <span className="text-[9px] font-bold text-gray-500 px-0.5 truncate">
          {renderHidden(transaction.transactionType)}
        </span>
      </div>

      {/* 5. القطاع والحي */}
      <div className="flex flex-col gap-1">
        <CopyableCell
          text={transaction.sector}
          className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded w-max"
          label="القطاع"
          isHidden={isLocked}
        />
        <span className="text-[10px] font-bold text-gray-600">
          {renderHidden(transaction.district)}
        </span>
      </div>

      {/* 6. المكتب المصمم */}
      <div
        className="truncate text-blue-700 text-[10px] font-bold px-1"
        title={transaction.officeName}
      >
        {renderHidden(transaction.officeName)}
      </div>

      {/* 7. المكتب المشرف */}
      <div
        className="truncate text-indigo-700 text-[10px] font-bold px-1"
        title={transaction.supervisingOffice}
      >
        {renderHidden(transaction.supervisingOffice)}
      </div>

      {/* 8. الحجم */}
      <div className="text-[10px] font-mono font-bold text-gray-500">
        {renderHidden(formatFileSize(transaction.totalSize))}
      </div>

      {/* 9. آخر تعديل */}
      <div className="flex flex-col gap-0.5">
        {!isLocked ? (
          <>
            <div className="text-[10px] font-mono font-bold text-slate-600">
              {modified.date}{" "}
              <span className="text-[8px] text-slate-400">{modified.time}</span>
            </div>
            <div className="text-[8px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-1 py-0.5 rounded w-max truncate">
              {transaction.modifiedBy}
            </div>
          </>
        ) : (
          <span className="text-gray-400">••••</span>
        )}
      </div>

      {/* 10. تاريخ الإنشاء */}
      <div className="flex flex-col gap-0.5">
        {!isLocked ? (
          <>
            <div className="text-[10px] font-mono font-bold text-slate-600">
              {created.date}
            </div>
            <div className="text-[8px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1 py-0.5 rounded w-max truncate">
              {transaction.createdBy}
            </div>
          </>
        ) : (
          <span className="text-gray-400">••••</span>
        )}
      </div>

      {/* 11. تواصل */}
      <div className="flex flex-col items-center">
        {!isLocked ? (
          <>
            <CopyableCell
              text={
                transaction.clientPhone?.includes("غير متوفر")
                  ? "—"
                  : transaction.clientPhone || "—"
              }
              className="text-[10px] font-mono font-bold text-gray-700 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded w-max"
              label="الجوال"
            />
            <CommunicationBlock
              phone={
                transaction.clientPhone?.includes("غير متوفر")
                  ? ""
                  : transaction.clientPhone
              }
              email={transaction.clientEmail}
            />
          </>
        ) : (
          <span className="text-gray-400 text-[10px]">••••</span>
        )}
      </div>

      {/* 12. الحالة المالية */}
      <div className="text-center px-1">
        {!isLocked ? (
          <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded text-[9px] font-bold whitespace-nowrap">
            {transaction.financialStatus}
          </span>
        ) : (
          <span className="text-gray-400 text-[10px]">••••</span>
        )}
      </div>

      {/* 13. الحالة الفنية */}
      <div className="text-center px-1">
        {!isLocked ? (
          <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[9px] font-bold whitespace-nowrap">
            {transaction.technicalStatus}
          </span>
        ) : (
          <span className="text-gray-400 text-[10px]">••••</span>
        )}
      </div>

      {/* 14. الحالة الإجرائية (تم حذف القائمة المنسدلة من هنا) */}
      <div className="text-center px-1">
        {!isLocked ? (
          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold whitespace-nowrap">
            {transaction.proceduralStatus}
          </span>
        ) : (
          <span className="text-gray-400 text-[10px]">••••</span>
        )}
      </div>

      {/* 15. القفل (Locked) */}
      <div className="flex justify-center">
        <div
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isLocked ? "bg-red-600 border-red-600 shadow-sm" : "bg-gray-50 border-gray-200"}`}
        >
          {isLocked ? (
            <Lock size={11} className="text-white" />
          ) : (
            <Check size={11} className="text-transparent" />
          )}
        </div>
      </div>

      {/* 16. إجراء الفتح */}
      <div className="flex justify-center">
        <button
          onClick={isLocked ? undefined : onDoubleClick}
          disabled={isLocked}
          className={`p-1.5 rounded-lg transition-colors shadow-sm ${isLocked ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-slate-800 text-white hover:bg-slate-700"}`}
        >
          <ArrowLeft size={13} />
        </button>
      </div>
    </div>
  );
}
