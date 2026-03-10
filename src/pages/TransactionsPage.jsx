import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../api/axios"; // تأكد من مسار الـ api الخاص بك
import { useAppStore } from "../stores/useAppStore";

import {
  Search, SlidersHorizontal, Plus, Download, X, ChevronLeft, ChevronRight, ArrowUpDown,
  ArrowUp, ArrowDown, Filter, FileSpreadsheet, FileText, Printer, Loader2, ChevronDown,
  Calendar, Tag, Settings2, Pin, Eye, EyeOff, Save, RefreshCw, Archive, Edit3, CheckSquare,
  Square, Minus, Circle, AlertTriangle, TrendingUp, Users, Crown, Handshake, User, Briefcase,
  UserCircle, BarChart3, Trophy, Clock, Copy, Check, Clipboard, CreditCard, FolderOpen,
  Keyboard, Bell, BellRing, CalendarDays, History, ArchiveRestore, Zap, ExternalLink,
  DollarSign, Banknote, ClipboardPaste, Paperclip, Monitor, Scale, PieChart, Trash2, Link2, CircleCheck,
  ChartColumn, ArrowRight, ArrowLeft, ArrowLeftRight, Calculator, Wallet, TriangleAlert, Info, CodeXml
} from "lucide-react";

// ============================================================================
// 1. Constants & UI Labels
// ============================================================================
const TX_UI = {
  SECTOR_ALL: "الكل", SECTOR_ALL_ALT: "كل القطاعات", SECTOR_CENTER: "قطاع وسط",
  TYPE_SELL: "بيع", TYPE_BUY: "شراء",
  COL_TX_NO: "رقم المعاملة", COL_OWNER_NAME: "اسم المالك", COL_DISTRICT: "الحي", COL_SECTOR: "القطاع",
  COL_TX_TYPE: "النوع", COL_TOTAL_FEES: "إجمالي الأتعاب", COL_COLLECTED: "المدفوع", COL_REMAINING: "المتبقي", 
  COL_TX_STATUS: "الحالة", COL_COLLECTION_STATUS: "التحصيل",
};

// ============================================================================
// 2. مكون المودال الضخم (تفاصيل المعاملة والتابات)
// ============================================================================
const TransactionDetailsModal = ({ isOpen, onClose, tx, refetchTable }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");

  // دالة الحذف
  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/private-transactions/${id}`),
    onSuccess: () => {
      toast.success("تم حذف المعاملة نهائياً");
      queryClient.invalidateQueries(["private-transactions-full"]);
      queryClient.invalidateQueries(["private-dashboard-stats"]);
      onClose();
    },
    onError: () => toast.error("لا يمكن حذف هذه المعاملة لوجود ارتباطات مالية.")
  });

  // دالة التجميد / التنشيط
  const freezeMutation = useMutation({
    mutationFn: async (id) => await api.patch(`/private-transactions/${id}/toggle-freeze`),
    onSuccess: () => {
      toast.success("تم تغيير حالة المعاملة بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      if (refetchTable) refetchTable();
      onClose();
    }
  });

  if (!isOpen || !tx) return null;

  const handleDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف المعاملة ${tx.ref} نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      deleteMutation.mutate(tx.id); // نستخدم tx.id الحقيقي الخاص بقاعدة البيانات
    }
  };

  const handleToggleFreeze = () => {
    freezeMutation.mutate(tx.id);
  };

  const isFrozen = tx.status === "مجمّدة";

  const TabButton = ({ id, label, icon: Icon, activeColor = "var(--wms-accent-blue)" }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-1 px-2.5 py-1.5 whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
          isActive ? `border-b-2 font-bold` : "text-[var(--wms-text-muted)] hover:text-[var(--wms-text-sec)] font-medium border-b-2 border-transparent"
        }`}
        style={{ fontSize: "11px", color: isActive ? activeColor : undefined, borderColor: isActive ? activeColor : "transparent" }}
      >
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-[var(--wms-surface-1)] border border-[var(--wms-border)] rounded-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={{ width: "75vw", height: "88vh", boxShadow: "var(--shadow-strong)" }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--wms-border)] shrink-0" style={{ minHeight: "40px" }}>
          <div className="flex items-center gap-2">
            <span className="text-[var(--wms-accent-blue)] font-mono" style={{ fontSize: "14px", fontWeight: 700 }}>{tx.ref}</span>
            <span className="w-px h-4 bg-[var(--wms-border)]"></span>
            <span className="text-[var(--wms-text)]" style={{ fontSize: "13px", fontWeight: 600 }}>تفاصيل المعاملة: {tx.client}</span>
            <span style={{ height: "18px", fontSize: "10px", borderRadius: "9px", paddingLeft: "5px", paddingRight: "5px", lineHeight: "18px", fontWeight: 600, display: "inline-flex", alignItems: "center", backgroundColor: "rgba(245, 158, 11, 0.15)", color: "var(--wms-warning)" }}>تغييرات غير محفوظة</span>
            {isFrozen && (
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-1">
                <Archive className="w-3 h-3" /> المعاملة مجمّدة مؤقتاً
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleToggleFreeze} disabled={freezeMutation.isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer hover:bg-slate-200" style={{ fontSize: "11px", fontWeight: 600 }}>
              {isFrozen ? <RefreshCw className="w-3 h-3 text-green-600" /> : <Archive className="w-3 h-3 text-amber-600" />}
              <span>{isFrozen ? "تنشيط المعاملة" : "تجميد"}</span>
            </button>
            <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 border border-red-200 text-red-600 cursor-pointer hover:bg-red-100" style={{ fontSize: "11px", fontWeight: 600 }}>
              <Trash2 className="w-3 h-3" /><span>حذف نهائي</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--wms-surface-2)] border border-[var(--wms-border)] text-[var(--wms-text-sec)] cursor-pointer hover:bg-[var(--wms-surface-2)]/80" style={{ fontSize: "11px", fontWeight: 600 }}>
              <Printer className="w-3 h-3" /><span>طباعة</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--wms-accent-blue)] text-white cursor-pointer hover:opacity-90" style={{ fontSize: "11px", fontWeight: 600 }}>
              <Save className="w-3 h-3" /><span>حفظ</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md text-[var(--wms-text-muted)] hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pipeline */}
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[var(--wms-border)]/50 shrink-0" style={{ backgroundColor: "var(--wms-surface-2)", minHeight: "30px" }}>
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer hover:bg-[var(--wms-surface-1)] transition-colors" style={{ fontSize: "10px" }}><Check className="w-3 h-3 text-[var(--wms-success)]" /><span style={{ fontWeight: 600, color: "var(--wms-success)" }}>التحصيل</span></button>
            <ArrowLeftRight className="w-2.5 h-2.5 text-[var(--wms-text-muted)]" style={{ opacity: 0.3 }} />
          </div>
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer hover:bg-[var(--wms-surface-1)] transition-colors" style={{ fontSize: "10px" }}><Circle className="w-3 h-3 text-[var(--wms-warning)]" /><span style={{ fontWeight: 600, color: "var(--wms-warning)" }}>التكاليف التشغيلية</span></button>
            <ArrowLeftRight className="w-2.5 h-2.5 text-[var(--wms-text-muted)]" style={{ opacity: 0.3 }} />
          </div>
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer hover:bg-[var(--wms-surface-1)] transition-colors" style={{ fontSize: "10px" }}><Circle className="w-3 h-3 text-[var(--wms-text-muted)]" /><span style={{ fontWeight: 400, color: "var(--wms-text-muted)" }}>التسوية</span></button>
            <ArrowLeftRight className="w-2.5 h-2.5 text-[var(--wms-text-muted)]" style={{ opacity: 0.3 }} />
          </div>
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer hover:bg-[var(--wms-surface-1)] transition-colors" style={{ fontSize: "10px" }}><Circle className="w-3 h-3 text-[var(--wms-text-muted)]" /><span style={{ fontWeight: 400, color: "var(--wms-text-muted)" }}>توزيع الأرباح</span></button>
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center gap-2 mr-2">
            <span className="text-[var(--wms-text-muted)] flex items-center gap-0.5" style={{ fontSize: "9px" }}><Keyboard className="w-3 h-3" /> Ctrl+⏎ حفظ</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--wms-border)] shrink-0 overflow-x-auto custom-scrollbar-slim bg-[var(--wms-surface-1)]">
          <TabButton id="basic" label="البيانات الأساسية" icon={FileText} />
          <TabButton id="financial" label="المحرك المالي" icon={Calculator} />
          <TabButton id="brokers" label="الوسطاء" icon={Handshake} activeColor="rgb(8, 145, 178)" />
          <TabButton id="agents" label="المعقبون" icon={User} activeColor="rgb(124, 58, 237)" />
          <TabButton id="remote" label="العمل عن بعد" icon={Monitor} activeColor="rgb(5, 150, 105)" />
          <TabButton id="payments" label="الدفعات" icon={Banknote} activeColor="rgb(34, 197, 94)" />
          <TabButton id="expenses" label="مصروفات أخرى" icon={Wallet} activeColor="rgb(217, 119, 6)" />
          <TabButton id="settlement" label="التسوية" icon={Scale} activeColor="rgb(37, 99, 235)" />
          <TabButton id="profits" label="توزيع الأرباح" icon={PieChart} activeColor="rgb(168, 85, 247)" />
          <TabButton id="attachments" label="المرفقات" icon={Paperclip} />
          <TabButton id="logs" label="سجل الأحداث" icon={Clock} />
          <TabButton id="dates" label="مواعيد التحصيل" icon={TriangleAlert} />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-slim p-4 bg-slate-50/50">
          
          {/* تاب: البيانات الأساسية */}
          {activeTab === "basic" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="rounded-lg border bg-white overflow-hidden shadow-sm border-blue-200">
                <div className="px-3 py-2 flex items-center gap-1.5 bg-blue-50 border-b border-blue-100">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-600 text-xs font-bold">البيانات الأساسية</span>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <div className="px-2 py-1.5 rounded border border-gray-200 bg-gray-50"><div className="text-gray-500 text-[10px]">رقم المعاملة</div><div className="font-mono text-sm font-bold text-gray-800">{tx.ref}</div></div>
                    <div className="px-2 py-1.5 rounded border border-gray-200 bg-gray-50"><div className="text-gray-500 text-[10px]">نوع المعاملة</div><div className="text-sm font-bold text-gray-800">{tx.type}</div></div>
                    <div className="px-2 py-1.5 rounded border border-gray-200 bg-gray-50"><div className="text-gray-500 text-[10px]">تاريخ الإنشاء</div><div className="font-mono text-sm font-bold text-gray-800">{tx.date}</div></div>
                    <div className="px-2 py-1.5 rounded border border-gray-200 bg-gray-50"><div className="text-gray-500 text-[10px]">المصدر</div><div className="text-sm font-bold text-gray-800">{tx.sourceName || "مباشر"}</div></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="px-2 py-1.5 rounded border border-gray-200 bg-gray-50"><div className="text-gray-500 text-[10px]">اسم المالك</div><div className="text-sm font-bold text-gray-800">{tx.client}</div></div>
                    <div className="px-2 py-1.5 rounded border border-gray-200 bg-gray-50"><div className="text-gray-500 text-[10px]">الحي</div><div className="text-sm font-bold text-gray-800">{tx.district}</div></div>
                    <div className="px-2 py-1.5 rounded border border-gray-200 bg-gray-50"><div className="text-gray-500 text-[10px]">القطاع</div><div className="text-sm font-bold text-gray-800">{tx.sector}</div></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="px-2 py-1.5 rounded border border-gray-200 bg-gray-50"><div className="text-gray-500 text-[10px]">رقم القطعة</div><div className="font-mono text-sm font-bold text-gray-800">{tx.plot || "—"}</div></div>
                    <div className="px-2 py-1.5 rounded border border-gray-200 bg-gray-50"><div className="text-gray-500 text-[10px]">رقم المخطط</div><div className="font-mono text-sm font-bold text-gray-800">{tx.plan || "—"}</div></div>
                    <div className="px-2 py-1.5 rounded border border-gray-200 bg-gray-50"><div className="text-gray-500 text-[10px]">المكتب المنفذ</div><div className="text-sm font-bold text-gray-800">{tx.office || "مكتب ديتيلز"}</div></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* تاب: المحرك المالي */}
          {activeTab === "financial" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 rounded-lg border border-gray-200 bg-white"><div className="text-gray-500 text-[10px]">إجمالي الأتعاب</div><div className="font-mono mt-1 text-lg font-bold text-gray-800">{tx.totalFees?.toLocaleString()}</div></div>
                <div className="p-3 rounded-lg border border-green-200 bg-green-50"><div className="text-green-700 text-[10px]">تم تحصيله</div><div className="font-mono mt-1 text-lg font-bold text-green-700">{tx.paidAmount?.toLocaleString()}</div></div>
                <div className="p-3 rounded-lg border border-red-200 bg-red-50"><div className="text-red-700 text-[10px]">المتبقي على العميل</div><div className="font-mono mt-1 text-lg font-bold text-red-700">{tx.remainingAmount?.toLocaleString()}</div></div>
                <div className="p-3 rounded-lg border border-blue-200 bg-blue-50"><div className="text-blue-700 text-[10px]">نسبة التحصيل</div><div className="font-mono mt-1 text-lg font-bold text-blue-700">{Math.round((tx.paidAmount / (tx.totalFees || 1)) * 100) || 0}%</div></div>
              </div>
              <div className="rounded-lg border bg-white overflow-hidden shadow-sm border-green-200">
                <div className="flex items-center justify-between px-3 py-2 bg-green-50 border-b border-green-200">
                  <div className="flex items-center gap-1.5 text-green-700"><Banknote className="w-4 h-4" /><span className="text-xs font-bold">الإيرادات — السعر المتفق</span></div>
                </div>
                <div className="p-4 font-mono text-xl font-bold text-green-700">{tx.totalFees?.toLocaleString()} ر.س</div>
              </div>
            </div>
          )}

          {/* تاب: الوسطاء */}
          {activeTab === "brokers" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-sm font-bold text-gray-800">الوسطاء المرتبطون</span><span className="font-mono px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-600">{(tx.agentCost || 0).toLocaleString()} ر.س</span></div>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-bold"><Plus className="w-3 h-3"/> إضافة وسيط</button>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr><th className="p-2 text-gray-600">الوسيط</th><th className="p-2 text-gray-600">الأتعاب</th><th className="p-2 text-gray-600">المدفوع</th><th className="p-2 text-gray-600">المتبقي</th><th className="p-2 text-gray-600">الحالة</th><th className="p-2 text-gray-600"></th></tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="p-2 font-bold text-gray-800">{tx.mediator || "لا يوجد وسيط"}</td>
                      <td className="p-2 font-mono font-bold">{(tx.agentCost || 0).toLocaleString()}</td>
                      <td className="p-2 font-mono text-green-600 font-bold">0</td>
                      <td className="p-2 font-mono text-red-600 font-bold">{(tx.agentCost || 0).toLocaleString()}</td>
                      <td className="p-2"><span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold">غير مدفوع</span></td>
                      <td className="p-2"><Trash2 className="w-4 h-4 text-red-500 cursor-pointer" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* تاب: المرفقات */}
          {activeTab === "attachments" && (
             <div className="space-y-4 animate-in fade-in duration-300">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm font-bold text-gray-800">مرفقات المعاملة</span>
                 <button className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-bold"><Plus className="w-3 h-3"/> إضافة مرفق</button>
               </div>
               <div className="flex gap-2">
                 <button className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 text-gray-600 text-xs hover:bg-gray-50"><Paperclip className="w-3 h-3"/> صورة الرخصة</button>
                 <button className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 text-gray-600 text-xs hover:bg-gray-50"><Paperclip className="w-3 h-3"/> العقد</button>
                 <button className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 text-gray-600 text-xs hover:bg-gray-50"><Paperclip className="w-3 h-3"/> الفاتورة</button>
               </div>
               <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 bg-white hover:bg-gray-50 cursor-pointer">
                 <div className="text-center">
                   <Paperclip className="w-6 h-6 mx-auto mb-2 opacity-50" />
                   <span className="font-semibold text-xs">اسحب الملفات هنا أو اضغط لاختيار الملفات</span>
                 </div>
               </div>
             </div>
          )}

          {/* Fallback لباقي التابات */}
          {["agents", "remote", "payments", "expenses", "settlement", "profits", "logs", "dates"].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-in fade-in">
              <CodeXml className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-bold text-gray-500">تم تجهيز التبويب: {activeTab}</p>
              <p className="text-xs mt-2">التصميم متوافق مع باقي أجزاء النظام ويمكن ربطه لاحقاً.</p>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <div className="flex items-start gap-1.5 px-4 py-3 border-t border-[var(--wms-border)]/50 bg-[var(--wms-surface-2)] shrink-0">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
          <span className="text-slate-500 text-[10px] leading-relaxed">
            هذا النظام مخصص للتسويات والمتابعة الداخلية المبسطة، والأرقام المعروضة في الشاشات المالية تعتبر أرقاماً تشغيلية لتوزيع الأرباح والأتعاب، وليست معالجة محاسبية أو ضريبية نهائية للشركة.
          </span>
        </div>

      </div>
    </div>
  );
};

// ============================================================================
// 3. مكون مودال (إنشاء معاملة جديدة) الشامل المتصل بالباك إند
// ============================================================================
const CreateTransactionModal = ({ isOpen, onClose, refetchTable, clients, employees, riyadhZones }) => {
  const queryClient = useQueryClient();

  // State الخاص ببيانات النموذج
  const [formData, setFormData] = useState({
    clientId: "",
    ownerName: "",
    ownerIdNumber: "",
    ownerMobile: "",
    districtId: "",
    sector: "غير محدد",
    office: "مكتب الرياض",
    transactionType: "بيع",
    plot: "",
    plan: "",
    oldDeed: "",
    serviceNo: "",
    requestNo: "",
    licenseNo: "",
    totalFees: "",
    firstPayment: "",
    mediatorName: "",
    mediatorFees: "",
    agentName: "",
    agentFees: "",
    sourceType: "شريك بالمكتب",
    sourceName: "",
    sourcePercent: ""
  });

  // تحديث القطاع تلقائياً عند تغيير الحي
  const handleDistrictChange = (e) => {
    const selectedDistId = e.target.value;
    let foundSector = null;
    
    // البحث عن الحي داخل مصفوفة القطاعات (riyadhZones)
    if (riyadhZones && riyadhZones.length > 0) {
      for (const sector of riyadhZones) {
        if (sector.districts?.some((d) => d.id === selectedDistId)) {
          foundSector = sector;
          break;
        }
      }
    }

    setFormData({
      ...formData,
      districtId: selectedDistId,
      sector: foundSector?.name ? `قطاع ${foundSector.name}` : formData.sector
    });
  };

  // إرسال البيانات للباك إند
  const createMutation = useMutation({
    mutationFn: async (data) => api.post("/private-transactions", data),
    onSuccess: () => {
      toast.success("تم إنشاء المعاملة بنجاح");
      queryClient.invalidateQueries(["private-transactions-full"]);
      if (refetchTable) refetchTable();
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "حدث خطأ أثناء الإنشاء");
    }
  });

  const handleSubmit = () => {
    if (!formData.clientId && !formData.ownerName) {
      toast.error("الرجاء إدخال اسم المالك أو اختياره من القائمة");
      return;
    }
    createMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg"><Plus className="w-5 h-5 text-white" /></div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">إنشاء معاملة جديدة</h2>
              <p className="text-xs text-gray-500">أدخل بيانات المعاملة، الماليات، والمصادر بدقة.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white custom-scrollbar-slim">
          
          {/* Section 1: Basic Info */}
          <section>
            <h3 className="text-sm font-bold text-blue-700 mb-4 flex items-center gap-2 border-b pb-2"><FileText className="w-4 h-4"/> البيانات الأساسية للمالك والعقار</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">اسم المالك (أو عميل جديد) *</label>
                <div className="flex gap-2">
                  <select 
                    value={formData.clientId} 
                    onChange={(e) => {
                      const client = clients.find(c => c.id === e.target.value);
                      const clientName = client?.name?.ar || client?.name || "";
                      setFormData({ ...formData, clientId: e.target.value, ownerName: clientName });
                    }} 
                    className="w-1/2 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="">اختر عميلاً...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name?.ar || c.name}</option>)}
                  </select>
                  <input 
                    type="text" 
                    value={formData.ownerName} 
                    onChange={(e) => setFormData({...formData, ownerName: e.target.value, clientId: ""})} 
                    className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" 
                    placeholder="أو اكتب اسماً جديداً..." 
                  />
                </div>
              </div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">رقم الهوية / السجل</label><input type="text" value={formData.ownerIdNumber} onChange={(e)=>setFormData({...formData, ownerIdNumber: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-blue-500 outline-none" /></div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">رقم الجوال</label><input type="text" value={formData.ownerMobile} onChange={(e)=>setFormData({...formData, ownerMobile: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-blue-500 outline-none" /></div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الحي *</label>
                <select value={formData.districtId} onChange={handleDistrictChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none">
                  <option value="">اختر الحي...</option>
                  {riyadhZones.map((sector) => (
                    <optgroup key={sector.id} label={`قطاع ${sector.name}`}>
                      {sector.districts?.map((dist) => (
                        <option key={dist.id} value={dist.id}>{dist.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">القطاع (تلقائي)</label>
                <input type="text" value={formData.sector} readOnly className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">المكتب المنفذ *</label>
                <select value={formData.office} onChange={(e)=>setFormData({...formData, office: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none">
                  <option>مكتب الرياض</option><option>مكتب جدة</option><option>مكتب الدمام</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Transaction Details */}
          <section>
            <h3 className="text-sm font-bold text-purple-700 mb-4 flex items-center gap-2 border-b pb-2"><Briefcase className="w-4 h-4"/> تفاصيل المعاملة والأرقام المرجعية</h3>
            <div className="grid grid-cols-4 gap-4">
              <div><label className="block text-xs font-bold text-gray-700 mb-1">نوع المعاملة *</label>
                <select value={formData.transactionType} onChange={(e)=>setFormData({...formData, transactionType: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none">
                  <option>بيع</option><option>شراء</option><option>فرز</option><option>دمج</option><option>تحديث صك</option><option>إصدار رخصة</option>
                </select>
              </div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">رقم القطعة</label><input type="text" value={formData.plot} onChange={(e)=>setFormData({...formData, plot: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-purple-500 outline-none" /></div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">رقم المخطط</label><input type="text" value={formData.plan} onChange={(e)=>setFormData({...formData, plan: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-purple-500 outline-none" /></div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">رقم الصك القديم</label><input type="text" value={formData.oldDeed} onChange={(e)=>setFormData({...formData, oldDeed: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-purple-500 outline-none" /></div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">رقم الخدمة (بلدي/إحكام)</label><input type="text" value={formData.serviceNo} onChange={(e)=>setFormData({...formData, serviceNo: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-purple-500 outline-none" /></div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">رقم الطلب</label><input type="text" value={formData.requestNo} onChange={(e)=>setFormData({...formData, requestNo: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-purple-500 outline-none" /></div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">رقم الرخصة</label><input type="text" value={formData.licenseNo} onChange={(e)=>setFormData({...formData, licenseNo: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-purple-500 outline-none" /></div>
            </div>
          </section>

          {/* Section 3: Financials & Roles */}
          <section className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="text-sm font-bold text-green-700 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2"><Calculator className="w-4 h-4"/> الماليات والأطراف</h3>
            <div className="grid grid-cols-3 gap-6">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">إجمالي الأتعاب (المبلغ المتفق) *</label>
                  <div className="relative">
                    <input type="number" value={formData.totalFees} onChange={(e)=>setFormData({...formData, totalFees: e.target.value})} className="w-full border border-green-300 rounded-lg px-3 py-2 text-lg font-bold font-mono text-green-700 focus:border-green-500 outline-none" placeholder="0" />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-bold">ر.س</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الدفعة الأولى (مُحصّل الآن)</label>
                  <input type="number" value={formData.firstPayment} onChange={(e)=>setFormData({...formData, firstPayment: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-green-500 outline-none" placeholder="0" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الوسيط / المسوق</label>
                  <select value={formData.mediatorName} onChange={(e)=>setFormData({...formData, mediatorName: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none">
                    <option value="">بدون وسيط</option>
                    {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">أتعاب الوسيط</label>
                  <input type="number" value={formData.mediatorFees} onChange={(e)=>setFormData({...formData, mediatorFees: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-red-600 focus:border-blue-500 outline-none" placeholder="0" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">المعقب / المراجع</label>
                  <select value={formData.agentName} onChange={(e)=>setFormData({...formData, agentName: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none">
                    <option value="">بدون معقب</option>
                    {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">أتعاب المعقب</label>
                  <input type="number" value={formData.agentFees} onChange={(e)=>setFormData({...formData, agentFees: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-red-600 focus:border-blue-500 outline-none" placeholder="0" />
                </div>
              </div>

            </div>
          </section>

          {/* Section 4: Source (The core of profit distribution) */}
          <section>
            <h3 className="text-sm font-bold text-amber-600 mb-4 flex items-center gap-2 border-b pb-2"><Crown className="w-4 h-4"/> مصدر المعاملة (لتوزيع الأرباح والنسب)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نوع المصدر</label>
                <select value={formData.sourceType} onChange={(e)=>setFormData({...formData, sourceType: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none">
                  <option value="partner">شريك بالمكتب</option><option value="mediator">مكتب وسيط</option><option value="employee">موظف</option><option value="direct_client">عميل مباشر (بدون نسبة)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">اسم المصدر (صاحب المصلحة)</label>
                <select value={formData.sourceName} onChange={(e)=>setFormData({...formData, sourceName: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none">
                    <option value="">اختر من القائمة...</option>
                    {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نسبة المصدر %</label>
                <div className="relative">
                  <input type="number" value={formData.sourcePercent} onChange={(e)=>setFormData({...formData, sourcePercent: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-amber-500 outline-none pr-8" placeholder="0" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                </div>
              </div>
            </div>
          </section>

        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors">إلغاء</button>
          <button onClick={handleSubmit} disabled={createMutation.isPending} className="px-6 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
            حفظ المعاملة وإنشاء الملف
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 4. مكون الصفحة الرئيسي (الجدول) - TransactionsPage
// =========================================================================
const TransactionsPage = () => {
  const { openScreens, activeScreenId } = useAppStore();
  const activeScreen = openScreens.find((s) => s.id === activeScreenId);
  const activeSector = activeScreen?.props?.sector || "الكل";
  
  const [activeSourceFilter, setActiveSourceFilter] = useState("الكل");
  const [searchQuery, setSearchQuery] = useState("");

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 1. جلب البيانات من الباك إند
  // أ) المعاملات
  const { data: transactionsData = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["private-transactions-full"],
    queryFn: async () => {
      const res = await api.get("/private-transactions");
      return res.data?.data || [];
    },
  });

  // ب) العملاء
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const res = await api.get("/clients/simple"); // التأكد من المسار
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    }
  });

  // ج) الموظفين (للوسطاء والمعقبين والمصادر)
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-list"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data || [];
    }
  });

  // د) الأحياء والقطاعات
  const { data: riyadhZones = [] } = useQuery({
    queryKey: ["riyadhZones"],
    queryFn: async () => {
      const res = await api.get("/riyadh-zones");
      return res.data?.data || [];
    }
  });

  // فلترة البيانات
  const filteredTransactions = useMemo(() => {
    return transactionsData.filter((tx) => {
      const matchesSearch = searchQuery === "" || tx.ref?.toLowerCase().includes(searchQuery.toLowerCase()) || tx.client?.toLowerCase().includes(searchQuery.toLowerCase()) || tx.district?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource = activeSourceFilter === "الكل" || tx.sourceName === activeSourceFilter || tx.sourceType === activeSourceFilter || (tx.source === activeSourceFilter); // البحث في عدة حقول
      const matchesSector = activeSector === "الكل" || tx.sector?.includes(activeSector); 
      return matchesSearch && matchesSource && matchesSector;
    });
  }, [transactionsData, searchQuery, activeSourceFilter, activeSector]);

  // حساب المجاميع
  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        acc.totalFees += parseFloat(tx.totalPrice || tx.totalFees) || 0;
        acc.paidAmount += parseFloat(tx.collectionAmount || tx.paidAmount) || 0;
        acc.remainingAmount += parseFloat(tx.remainingAmount) || 0;
        return acc;
      },
      { totalFees: 0, paidAmount: 0, remainingAmount: 0 },
    );
  }, [filteredTransactions]);

  const getCollectionStatus = (paid, total) => {
    if (paid >= total && total > 0) return { label: "محصل بالكامل", color: "bg-green-100 text-green-700" };
    if (paid > 0 && paid < total) return { label: "محصل جزئي", color: "bg-amber-100 text-amber-700" };
    return { label: "غير محصل", color: "bg-red-100 text-red-700" };
  };

  const handleRowClick = (tx) => {
    setSelectedTx(tx);
    setIsTxModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--wms-bg-0)] font-sans" dir="rtl">
      
      <TransactionDetailsModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} tx={selectedTx} />
      <CreateTransactionModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        refetchTable={refetch}
        clients={clients}
        employees={employees}
        riyadhZones={riyadhZones}
      />

      {activeSector !== "الكل" && (
        <div className="bg-blue-50/50 border-b border-blue-100 px-4 py-1.5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-[12px]">
            <Pin className="w-3.5 h-3.5" />
            <span>عرض المعاملات المخصصة لـ: قطاع {activeSector}</span>
          </div>
          <span className="text-[10px] text-blue-500 font-semibold bg-white px-2 py-0.5 rounded shadow-sm border border-blue-100">
            {filteredTransactions.length} نتيجة
          </span>
        </div>
      )}

      {/* محتوى الصفحة الرئيسي */}
      <div className="p-3 flex flex-col gap-2 flex-1 overflow-hidden">
        {/* شريط الفلاتر والبحث */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="relative flex-1 max-w-[300px]">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث بالرقم، المالك، الحي، الوسيط..." className="w-full bg-white border border-gray-200 rounded-md pr-8 pl-3 text-gray-700 placeholder:text-gray-400 h-[32px] text-[12px] outline-none focus:border-blue-500" />
          </div>

          <button className="flex items-center gap-1.5 px-3 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 h-[32px] text-[11px] font-semibold transition-colors"><SlidersHorizontal className="w-3.5 h-3.5" /><span>فلاتر</span></button>
          <button className="flex items-center gap-1.5 px-3 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 h-[32px] text-[11px] font-semibold transition-colors"><Settings2 className="w-3.5 h-3.5" /><span>الأعمدة</span></button>
          <button className="flex items-center gap-1 px-2.5 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 h-[32px] text-[11px] font-semibold transition-colors"><EyeOff className="w-3 h-3" /><span>إخفاء المُسوّى</span></button>
          <button onClick={() => refetch()} className="flex items-center justify-center w-[32px] rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 h-[32px] transition-colors"><RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-blue-500" : ""}`} /></button>

          <div className="flex-1"></div>

          {/* ملخص المبالغ العلوية */}
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-gray-500">الإجمالي: <span className="text-gray-800 font-mono font-bold">{transactionsData.length}</span></span>
            <span className="text-gray-500">محصّل: <span className="font-mono font-bold text-green-600">{transactionsData.filter((tx) => (tx.collectionAmount || tx.paidAmount) >= (tx.totalPrice || tx.totalFees) && (tx.totalPrice || tx.totalFees) > 0).length}</span></span>
            <span className="text-gray-500">معلّق: <span className="font-mono font-bold text-amber-500">{transactionsData.filter((tx) => (tx.collectionAmount || tx.paidAmount) > 0 && (tx.collectionAmount || tx.paidAmount) < (tx.totalPrice || tx.totalFees)).length}</span></span>
            <span className="text-gray-500">متأخر: <span className="font-mono font-bold text-red-600">{transactionsData.filter((tx) => (tx.collectionAmount || tx.paidAmount) === 0).length}</span></span>
            <span className="text-gray-500">إجمالي الأتعاب: <span className="font-mono font-bold text-green-600">{totals.totalFees.toLocaleString()}</span></span>
          </div>

          <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-1.5 px-3 rounded-md bg-green-600 text-white hover:opacity-90 h-[32px] text-[11px] font-bold transition-opacity shadow-sm"><Plus className="w-3.5 h-3.5" /><span>معاملة جديدة</span></button>
          <button className="flex items-center gap-1.5 px-3 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 h-[32px] text-[11px] font-semibold transition-colors"><Download className="w-3.5 h-3.5" /><span>تصدير</span><ChevronDown className="w-3 h-3" /></button>
        </div>

        {/* شريط ملخص مصادر المعاملات */}
        <div className="shrink-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <ChartColumn className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-gray-600 text-[11px] font-semibold">ملخص مصادر المعاملات</span>
            <span className="w-px bg-gray-200 mx-1 h-[16px]"></span>
            {["شريك بالمكتب", "مكتب وسيط", "موظف", "عميل مباشر"].map((source) => (
              <span key={source} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <span>{source}</span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 px-1">
            <span className="text-gray-400 text-[10px]">فلتر المصدر:</span>
            {["الكل", "مكتب ديتيلز", "مكتب خارجي"].map((filter) => (
              <button key={filter} onClick={() => setActiveSourceFilter(filter)} className={`px-2.5 py-0.5 rounded-md cursor-pointer transition-colors text-[10px] font-semibold ${activeSourceFilter === filter ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-500 hover:text-gray-800"}`}>{filter}</button>
            ))}
          </div>
        </div>

        {/* ========================================== */}
        {/* الجدول الرئيسي (Table Area) */}
        {/* ========================================== */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex-1 flex flex-col focus:outline-none shadow-sm">
          <div className="flex-1 overflow-auto custom-scrollbar-slim relative min-h-0">
            <table className="w-full border-collapse text-[12px] min-w-[1236px]">
              <thead className="sticky top-0 z-30">
                <tr className="h-[36px] bg-gray-50 border-b border-gray-200">
                  <th className="text-center select-none w-[36px] min-w-[36px] border-l border-gray-200"><Square className="w-3.5 h-3.5 inline text-gray-400" /></th>
                  {[
                    { label: "رقم المعاملة", width: "105px" }, { label: "اسم المالك", width: "140px" }, { label: "الحي", width: "75px" },
                    { label: "القطاع", width: "80px" }, { label: "نوع المعاملة", width: "80px" }, { label: "المصدر", width: "120px" },
                    { label: "إجمالي الأتعاب", width: "110px" }, { label: "المدفوع", width: "100px" }, { label: "المتبقي", width: "110px" },
                    { label: "حالة التحصيل", width: "90px" }, { label: "حالة النظام", width: "90px" }, { label: "التاريخ", width: "100px" },
                  ].map((col, index) => (
                    <th key={index} className="text-right px-2 whitespace-nowrap select-none font-bold text-[11px] text-gray-600 border-l border-gray-200" style={{ width: col.width, minWidth: "45px" }}>
                      <div className="flex items-center gap-1"><span>{col.label}</span></div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr><td colSpan="13" className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" /><span className="text-slate-500 font-bold">جاري جلب المعاملات...</span></td></tr>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => {
                    const collectionInfo = getCollectionStatus(tx.collectionAmount || tx.paidAmount, tx.totalPrice || tx.totalFees);
                    return (
                      <tr key={tx.id} onClick={() => handleRowClick(tx)} className="cursor-pointer transition-colors h-[32px] border-b border-gray-100 hover:bg-blue-50 group">
                        <td className="text-center border-l border-gray-100"><Square className="w-3.5 h-3.5 inline text-gray-300" /></td>
                        <td className="px-2 border-l border-gray-100"><span className="font-mono text-[11.5px] font-bold text-blue-600 group-hover:underline">{tx.ref || tx.id}</span></td>
                        <td className="px-2 border-l border-gray-100 font-bold text-gray-700">{tx.client || tx.owner}</td>
                        <td className="px-2 border-l border-gray-100 text-gray-500">{tx.district}</td>
                        <td className="px-2 border-l border-gray-100 text-gray-500">{tx.sector}</td>
                        <td className="px-2 border-l border-gray-100 font-bold text-gray-600">{tx.type}</td>
                        <td className="px-2 border-l border-gray-100"><span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{tx.sourceName || tx.source || "مباشر"}</span></td>
                        <td className="px-2 border-l border-gray-100 font-mono font-bold text-gray-800">{(tx.totalPrice || tx.totalFees || 0).toLocaleString()}</td>
                        <td className="px-2 border-l border-gray-100 font-mono font-bold text-green-600">{(tx.collectionAmount || tx.paidAmount || 0).toLocaleString()}</td>
                        <td className="px-2 border-l border-gray-100 font-mono font-bold text-red-600">{(tx.remainingAmount || 0).toLocaleString()}</td>
                        <td className="px-2 border-l border-gray-100"><span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${collectionInfo.color}`}>{collectionInfo.label}</span></td>
                        <td className="px-2 border-l border-gray-100"><span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-600">{tx.status || tx.transactionStatus || "مسجلة"}</span></td>
                        <td className="px-2 border-l border-gray-100 font-mono text-[10px] text-gray-400">{tx.created || tx.date}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="13" className="text-center py-10 text-gray-400 font-bold">لا توجد معاملات</td></tr>
                )}
              </tbody>

              <tfoot className="sticky bottom-0 z-30">
                <tr className="h-[34px] bg-gray-100 border-t border-gray-200">
                  <td className="border-l border-gray-200"></td>
                  <td className="px-2 font-bold text-[11px] text-gray-700 border-l border-gray-200">المجموع ({filteredTransactions.length})</td>
                  <td className="border-l border-gray-200"></td><td className="border-l border-gray-200"></td><td className="border-l border-gray-200"></td><td className="border-l border-gray-200"></td><td className="border-l border-gray-200"></td>
                  <td className="px-2 font-mono font-bold text-[12px] text-blue-700 border-l border-gray-200">{totals.totalFees.toLocaleString()}</td>
                  <td className="px-2 font-mono font-bold text-[12px] text-green-700 border-l border-gray-200">{totals.paidAmount.toLocaleString()}</td>
                  <td className="px-2 font-mono font-bold text-[12px] text-red-700 border-l border-gray-200">{totals.remainingAmount.toLocaleString()}</td>
                  <td className="border-l border-gray-200"></td><td className="border-l border-gray-200"></td><td className="border-l border-gray-200"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* شريط التحكم السفلي */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-gray-200 shrink-0 text-[11px] bg-gray-50">
            <span className="text-gray-500">عرض {filteredTransactions.length > 0 ? 1 : 0}-{filteredTransactions.length} من {filteredTransactions.length}</span>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded hover:bg-gray-200 text-gray-500"><ArrowRight className="w-4 h-4" /></button>
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-center min-w-[24px]">1</span>
              <button className="p-1 rounded hover:bg-gray-200 text-gray-500"><ArrowLeft className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;