import React, { useState, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  UserCheck,
  Building2,
  DollarSign,
  CalendarCheck,
  FolderOpen,
  Archive,
  Plus,
  CheckCircle2,
  XCircle,
  BarChart3,
  Upload,
  Zap,
  Users,
  History,
  Settings,
  ListChecks,
  Layers,
  Banknote,
  Paperclip,
  Ban,
  ShieldCheck,
  Star,
  Shield,
  Lock,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";

// 💡 🚀 استيراد مكون مدير الملفات
import TransactionFilesManager from "./TransactionFiles/index";
import TransactionsPage from "./TransactionContinu/TransactionsPage";
import {CreateTransactionModal} from "../../components/CreateTransactionModal";

// ==========================================
// 💡 تعريف المسارات (Paths Configuration)
// ==========================================
const PATHS = [
  {
    id: "055-PATH-00",
    title: "ملفات المعاملات",
    description: "نظام إدارة مستندات وملفات المعاملات",
    icon: FolderOpen,
    color: "#ea580c",
  },
  {
    id: "055-PATH-01",
    title: "متابعة المعاملات",
    description: "تحت الإجراء حالياً",
    icon: Activity,
    color: "#7c3aed",
    filterFn: (t) => ["نشطة", "معلقة"].includes(t.status),
  },
  {
    id: "055-PATH-02",
    title: "سجل المعاملات",
    description: "جميع المعاملات",
    icon: Archive,
    color: "#0891b2",
  },
  {
    id: "055-PATH-03",
    title: "إنشاء معاملة جديدة",
    description: "معالج الإنشاء",
    icon: Plus,
    color: "#16a34a",
  },
  {
    id: "055-PATH-04",
    title: "معاملات معتمدة",
    description: "جاهزة للتنفيذ",
    icon: CheckCircle2,
    color: "#15803d",
    filterFn: (t) => t.status === "مكتملة",
  },
  {
    id: "055-PATH-05",
    title: "ملغاة / مرفوضة",
    description: "معاملات ملغاة أو مرفوضة",
    icon: XCircle,
    color: "#dc2626",
    filterFn: (t) => t.status === "ملغاة",
  },
  {
    id: "055-PATH-06",
    title: "أتعاب المعاملات",
    description: "إدارة الأتعاب المالية",
    icon: DollarSign,
    color: "#d97706",
  },
  {
    id: "055-PATH-07",
    title: "تقارير المعاملات",
    description: "تقارير ومؤشرات",
    icon: BarChart3,
    color: "#db2777",
  },
  {
    id: "055-PATH-08",
    title: "جاهز للرفع",
    description: "تجهيز الرفع للجهات",
    icon: Upload,
    color: "#2563eb",
  },
  {
    id: "055-PATH-09",
    title: "لوحة اليوم",
    description: "أعلى تأخيراً + جاهز للرفع/الإغلاق + متعثرة",
    icon: Zap,
    color: "#ea580c",
  },
  {
    id: "055-PATH-10",
    title: "الأطراف والأدوار",
    description: "أطراف المعاملات",
    icon: Users,
    color: "#0d9488",
    isPlaceholder: true,
  },
  {
    id: "055-PATH-11",
    title: "سجل التدقيق",
    description: "Audit Log",
    icon: History,
    color: "#be185d",
    isPlaceholder: true,
  },
  {
    id: "055-PATH-12",
    title: "الإعدادات",
    description: "إعدادات المعاملات",
    icon: Settings,
    color: "#57534e",
    isPlaceholder: true,
  },
  {
    id: "055-PATH-13",
    title: "المراحل والحالات",
    description: "إدارة مراحل العمل",
    icon: ListChecks,
    color: "#0284c7",
    isPlaceholder: true,
  },
  {
    id: "055-PATH-14",
    title: "المستندات المولّدة",
    description: "قوالب ووثائق",
    icon: Layers,
    color: "#7e22ce",
    isPlaceholder: true,
  },
  {
    id: "055-PATH-15",
    title: "التسويات المالية",
    description: "تسوية الحسابات",
    icon: Banknote,
    color: "#4f46e5",
    isPlaceholder: true,
  },
  {
    id: "055-PATH-16",
    title: "الأرشيف",
    description: "معاملات مؤرشفة",
    icon: FolderOpen,
    color: "#78716c",
    isPlaceholder: true,
  },
  {
    id: "055-PATH-S01",
    title: "معاملاتي الآن",
    description: "المسندة لي وغير مغلقة",
    icon: Zap,
    color: "#8b5cf6",
    filterFn: (t) => t.status === "نشطة",
  },
  {
    id: "055-PATH-S02",
    title: "متأخرة SLA",
    description: "تجاوزت تاريخ الاستحقاق",
    icon: AlertTriangle,
    color: "#dc2626",
  },
  {
    id: "055-PATH-S03",
    title: "بانتظار مستندات",
    description: "نقص في الوثائق المطلوبة",
    icon: Paperclip,
    color: "#d97706",
  },
  {
    id: "055-PATH-S04",
    title: "بانتظار سداد",
    description: "لم تُسدد بالكامل",
    icon: DollarSign,
    color: "#ea580c",
    filterFn: (t) => t.paymentStatus === "غير مدفوع",
  },
  {
    id: "055-PATH-S05",
    title: "مرتجعة من الجهة",
    description: "أُعيدت بملاحظات",
    icon: RefreshCw,
    color: "#be185d",
  },
  {
    id: "055-PATH-S06",
    title: "تصحيح — ناقص رخصة قديمة",
    description: "نوع تصحيح ولا يوجد oldPermitNo",
    icon: FileText,
    color: "#9333ea",
  },
  {
    id: "055-PATH-S07",
    title: "تعديل — سنة رخصة < 1427",
    description: "رخصة ورقية لا يمكن تعديلها",
    icon: ShieldCheck,
    color: "#e11d48",
  },
  {
    id: "055-PATH-S08",
    title: "إصدار — أرض قائم بدون هدم",
    description: "إصدار رخصة بأرض قائم بدون رخصة هدم",
    icon: Ban,
    color: "#991b1b",
  },
  {
    id: "055-PATH-F01",
    title: "VIP — متابعة فورية",
    description: "معاملات VIP نشطة",
    icon: Star,
    color: "#9333ea",
  },
  {
    id: "055-PATH-F02",
    title: "مخاطر عالية — تدقيق",
    description: "درجة مخاطر ≥ 50",
    icon: Shield,
    color: "#dc2626",
  },
  {
    id: "055-PATH-F03",
    title: "مُصعَّد — تدخل المشرف",
    description: "معاملات مُصعَّدة",
    icon: AlertTriangle,
    color: "#7c3aed",
  },
  {
    id: "055-PATH-F04",
    title: "مؤمَّن — مراجعة مالية",
    description: "معاملات مؤمَّنة مالياً",
    icon: Lock,
    color: "#64748b",
  },
];

export default function TransactionsDashboard({ onOpenPath }) {
  const [hoveredPath, setHoveredPath] = useState(null);
  const [showFilesManager, setShowFilesManager] = useState(false);
  const [showTransactionsPage, setShowTransactionsPage] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: transactions = [], refetch } = useQuery({
    queryKey: ["transactions-dashboard"],
    queryFn: async () => {
      const res = await api.get("/private-transactions");
      return res.data?.data || [];
    },
  });

  const handlePathClick = (pathId) => {
    if (pathId === "055-PATH-00") {
      setShowFilesManager(true);
      return;
    }
    if (pathId === "055-PATH-01") {
      // 👈 إضافة هذا الشرط الجديد
      setShowTransactionsPage(true);
      return;
    }
    if (pathId === "055-PATH-03") {
      // 💡 تفعيل المودال هنا
      setIsCreateModalOpen(true);
      return;
    }
    if (onOpenPath) {
      onOpenPath(pathId);
    }
  };

  const kpis = useMemo(() => {
    return {
      underAction: transactions.filter((t) => t.status === "نشطة").length,
      delayed: 0,
      waitingOwner: transactions.filter((t) => t.status === "معلقة").length,
      waitingGov: 0,
      waitingPayment: transactions.filter(
        (t) => t.paymentStatus === "غير مدفوع",
      ).length,
      completedThisMonth: transactions.filter((t) => t.status === "مكتملة")
        .length,
    };
  }, [transactions]);

  const pathsWithBadges = useMemo(() => {
    return PATHS.map((p) => ({
      ...p,
      badge: p.filterFn ? transactions.filter(p.filterFn).length : undefined,
    }));
  }, [transactions]);

  const css = {
    kpiCard: (bg, color) => ({
      flex: "1 1 0",
      minWidth: "130px",
      padding: "14px 16px",
      backgroundColor: bg,
      borderRadius: "12px",
      border: `1px solid ${color}25`,
      boxShadow: `0 2px 8px ${color}12, 0 1px 2px rgba(0,0,0,0.04)`,
      textAlign: "center",
      transition: "all 0.2s ease",
      backgroundImage: `linear-gradient(135deg, ${bg}, white)`,
    }),
    kpiValue: (color) => ({
      fontSize: "26px",
      fontWeight: "bold",
      color,
      lineHeight: 1,
    }),
    kpiLabel: {
      fontSize: "11px",
      color: "#64748b",
      marginTop: "4px",
      fontWeight: "bold",
    },
    pathCard: (color, isHover) => ({
      padding: "16px",
      backgroundColor: "white",
      borderRadius: "14px",
      border: `1.5px solid ${isHover ? color : "#e2e8f0"}`,
      boxShadow: isHover
        ? `0 4px 16px ${color}18`
        : "0 1px 3px rgba(0,0,0,0.04)",
      cursor: "pointer",
      transition: "all 0.25s ease",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
      textAlign: "center",
      position: "relative",
    }),
  };

  return (
    <div
      style={{ flex: 1, overflow: "auto", backgroundColor: "#f8fafc" }}
      dir="rtl"
    >
      <div style={{ padding: "20px", maxWidth: "1100px", margin: "0 auto" }}>
        {/* ═══ KPI Row ═══ */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <div style={css.kpiCard("#eff6ff", "#3b82f6")}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "6px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#3b82f615",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Activity className="w-4 h-4" style={{ color: "#3b82f6" }} />
              </div>
            </div>
            <div style={css.kpiValue("#1e40af")}>{kpis.underAction}</div>
            <div style={css.kpiLabel}>تحت الإجراء</div>
          </div>
          <div style={css.kpiCard("#fef2f2", "#ef4444")}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "6px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#ef444415",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle
                  className="w-4 h-4"
                  style={{ color: "#ef4444" }}
                />
              </div>
            </div>
            <div style={css.kpiValue("#dc2626")}>{kpis.delayed}</div>
            <div style={css.kpiLabel}>متأخرة</div>
          </div>
          <div style={css.kpiCard("#fefce8", "#eab308")}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "6px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#eab30815",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserCheck className="w-4 h-4" style={{ color: "#d97706" }} />
              </div>
            </div>
            <div style={css.kpiValue("#a16207")}>{kpis.waitingOwner}</div>
            <div style={css.kpiLabel}>بانتظار المالك</div>
          </div>
          <div style={css.kpiCard("#f5f3ff", "#8b5cf6")}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "6px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#8b5cf615",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Building2 className="w-4 h-4" style={{ color: "#7c3aed" }} />
              </div>
            </div>
            <div style={css.kpiValue("#6d28d9")}>{kpis.waitingGov}</div>
            <div style={css.kpiLabel}>بانتظار الجهات</div>
          </div>
          <div style={css.kpiCard("#fff7ed", "#f97316")}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "6px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#f9731615",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DollarSign className="w-4 h-4" style={{ color: "#ea580c" }} />
              </div>
            </div>
            <div style={css.kpiValue("#c2410c")}>{kpis.waitingPayment}</div>
            <div style={css.kpiLabel}>بانتظار سداد</div>
          </div>
          <div style={css.kpiCard("#f0fdf4", "#22c55e")}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "6px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#22c55e15",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CalendarCheck
                  className="w-4 h-4"
                  style={{ color: "#16a34a" }}
                />
              </div>
            </div>
            <div style={css.kpiValue("#15803d")}>{kpis.completedThisMonth}</div>
            <div style={css.kpiLabel}>مكتملة هذا الشهر</div>
          </div>
        </div>

        {/* ═══ 4×4 Paths Grid ═══ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
          }}
        >
          <div
            style={{
              ...css.pathCard("#0ea5e9", hoveredPath === "_reports"),
              backgroundColor: undefined,
              background: "linear-gradient(135deg, #0ea5e910, #7c3aed08)",
              border: "1.5px dashed #0ea5e950",
            }}
            onMouseEnter={() => setHoveredPath("_reports")}
            onMouseLeave={() => setHoveredPath(null)}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #0ea5e918, #7c3aed10)",
                border: "1px solid #0ea5e920",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BarChart3
                style={{ width: "24px", height: "24px", color: "#0ea5e9" }}
              />
            </div>
            <div
              style={{ fontSize: "13px", fontWeight: "bold", color: "#1e293b" }}
            >
              لوحة الأداء
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              تقارير سريعة وملخصات
            </div>
          </div>

          {pathsWithBadges.map((path) => {
            const Icon = path.icon;
            const isHovered = hoveredPath === path.id;
            return (
              <div
                key={path.id}
                style={css.pathCard(path.color, isHovered)}
                onClick={() => handlePathClick(path.id)} // 👈 استدعاء فتح النافذة
                onMouseEnter={() => setHoveredPath(path.id)}
                onMouseLeave={() => setHoveredPath(null)}
              >
                {path.badge !== undefined && path.badge > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      minWidth: "22px",
                      height: "22px",
                      borderRadius: "11px",
                      backgroundColor: path.color,
                      color: "white",
                      fontSize: "11px",
                      fontWeight: "bold",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 6px",
                    }}
                  >
                    {path.badge}
                  </span>
                )}

                {path.isPlaceholder && (
                  <span
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      fontSize: "9px",
                      color: "#94a3b8",
                      fontWeight: "bold",
                      backgroundColor: "#f1f5f9",
                      padding: "1px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    قريباً
                  </span>
                )}

                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: `linear-gradient(135deg, ${path.color}18, ${path.color}08)`,
                    border: `1px solid ${path.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.25s ease",
                    transform: isHovered ? "scale(1.12)" : "scale(1)",
                    boxShadow: isHovered
                      ? `0 4px 12px ${path.color}20`
                      : "none",
                  }}
                >
                  <Icon
                    style={{ width: "24px", height: "24px", color: path.color }}
                  />
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: "#1e293b",
                  }}
                >
                  {path.title}
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                  {path.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* مودال إنشاء معاملة */}
      {isCreateModalOpen && (
        <CreateTransactionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          refetchTable={refetch} // 💡 سيقوم بتحديث أرقام الداشبورد فور الإضافة
        />
      )}

      {/* 💡 🚀 الحل السحري: وضع المودال في fixed-container ليظهر كشاشة مستقلة فوق الداشبورد */}
      {showFilesManager && (
        <div className="fixed inset-0 z-[999] bg-white flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          <TransactionFilesManager onClose={() => setShowFilesManager(false)} />
        </div>
      )}
      {/* 💡 🚀 عرض شاشة متابعة المعاملات (الجزء الجديد) */}
      {showTransactionsPage && (
        <div className="fixed inset-0 z-[999] bg-white flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          <TransactionsPage onClose={() => setShowTransactionsPage(false)} />
        </div>
      )}
    </div>
  );
}
