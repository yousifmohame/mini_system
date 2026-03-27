import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../../stores/useAppStore"; // ✅ ربط مع الستور
import { toast } from "react-hot-toast";

// API Calls
import {
  getAllClients,
  createClient,
  updateClient,
  deleteClient,
} from "../../api/clientApi";

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Progress } from "../../components/ui/progress";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import { ScrollArea } from "../../components/ui/scroll-area";

// Icons
import {
  Users,
  Phone,
  MapPin,
  FileText,
  User,
  Briefcase,
  Star,
  History,
  PieChart,
  FileBarChart,
  UserPlus,
  IdCard,
  Wallet,
  Info,
  Loader2,
  Save,
  Trash2,
  Search,
  FileSpreadsheet,
  CheckCircle,
} from "lucide-react";

// Custom Inputs (Assuming these exist in your project)
import {
  InputWithCopy,
  TextAreaWithCopy,
  SelectWithCopy,
} from "../../components/InputWithCopy";

// ============================================================================
// 1. دوال مساعدة (Helpers)
// ============================================================================
const getFullName = (name) => {
  if (!name) return "";
  return `${name.firstName || ""} ${name.fatherName || ""} ${name.grandFatherName || ""} ${name.familyName || ""}`.trim();
};

const getGradeColor = (grade) => {
  switch (grade) {
    case "أ":
      return "#10b981"; // أخضر
    case "ب":
      return "#f59e0b"; // برتقالي
    case "ج":
      return "#ef4444"; // أحمر
    default:
      return "#6b7280"; // رمادي
  }
};

// ============================================================================
// 2. تعريف القائمة الجانبية (Sidebar Config)
// ============================================================================
const SIDEBAR_ITEMS = [
  {
    id: "300-LST",
    title: "قائمة العملاء",
    icon: Users,
    type: "list",
    closable: false,
  },
  {
    id: "300-02",
    title: "البيانات الأساسية",
    icon: User,
    type: "form",
    closable: true,
  },
  {
    id: "300-03",
    title: "بيانات الاتصال",
    icon: Phone,
    type: "form",
    closable: true,
  },
  {
    id: "300-04",
    title: "العنوان",
    icon: MapPin,
    type: "form",
    closable: true,
  },
  {
    id: "300-05",
    title: "بيانات الهوية",
    icon: IdCard,
    type: "form",
    closable: true,
  },
  {
    id: "300-06",
    title: "المعاملات",
    icon: Briefcase,
    type: "list",
    closable: true,
  },
  {
    id: "300-07",
    title: "المالية",
    icon: Wallet,
    type: "dashboard",
    closable: true,
  },
  {
    id: "300-08",
    title: "التقييم والملاحظات",
    icon: Star,
    type: "form",
    closable: true,
  },
  {
    id: "300-09",
    title: "الإحصائيات",
    icon: PieChart,
    type: "dashboard",
    closable: true,
  },
  {
    id: "300-10",
    title: "التقارير",
    icon: FileBarChart,
    type: "list",
    closable: true,
  },
  {
    id: "300-11",
    title: "السجل الزمني",
    icon: History,
    type: "list",
    closable: true,
  },
  {
    id: "300-12",
    title: "الإعدادات",
    icon: Info,
    type: "form",
    closable: true,
  },
];

// ============================================================================
// 3. المكونات الفرعية للتبويبات (Sub-Components) - [كودك الأصلي]
// ============================================================================

// --- تاب 300-02: البيانات الأساسية ---
const TabBasicData = ({ client, classifications, onClientUpdate }) => {
  const [localClient, setLocalClient] = useState(client);
  useEffect(() => setLocalClient(client), [client]);

  const handleSave = async () => {
    try {
      const updated = await updateClient(localClient.id, {
        name: localClient.name,
        type: localClient.type,
        category: localClient.category,
        nationality: localClient.nationality,
        occupation: localClient.occupation,
        company: localClient.company,
        commercialRegister: localClient.commercialRegister,
      });
      onClientUpdate(updated);
      toast.success("تم حفظ البيانات الأساسية");
    } catch (err) {
      toast.error("فشل الحفظ");
    }
  };

  if (!localClient) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>البيانات الأساسية</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {["firstName", "fatherName", "grandFatherName", "familyName"].map(
            (field, idx) => (
              <InputWithCopy
                key={field}
                label={["الاسم الأول", "اسم الأب", "اسم الجد", "العائلة"][idx]}
                value={localClient.name?.[field] || ""}
                onChange={(e) =>
                  setLocalClient({
                    ...localClient,
                    name: { ...localClient.name, [field]: e.target.value },
                  })
                }
              />
            ),
          )}
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-3">
          <SelectWithCopy
            label="نوع العميل"
            value={localClient.type || ""}
            onChange={(e) =>
              setLocalClient({ ...localClient, type: e.target.value })
            }
            options={[
              { value: "فرد", label: "فرد" },
              { value: "شركة", label: "شركة" },
              { value: "جهة حكومية", label: "جهة حكومية" },
            ]}
          />
          <SelectWithCopy
            label="التصنيف"
            value={localClient.category || ""}
            onChange={(e) =>
              setLocalClient({ ...localClient, category: e.target.value })
            }
            options={classifications.map((c) => ({
              value: c.name,
              label: c.name,
            }))}
          />
          <InputWithCopy
            label="الجنسية"
            value={localClient.nationality || ""}
            onChange={(e) =>
              setLocalClient({ ...localClient, nationality: e.target.value })
            }
          />
          <InputWithCopy
            label="المهنة"
            value={localClient.occupation || ""}
            onChange={(e) =>
              setLocalClient({ ...localClient, occupation: e.target.value })
            }
          />
        </div>
        {localClient.type === "شركة" && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <InputWithCopy
              label="اسم الشركة"
              value={localClient.company || ""}
              onChange={(e) =>
                setLocalClient({ ...localClient, company: e.target.value })
              }
            />
            <InputWithCopy
              label="السجل التجاري"
              value={localClient.commercialRegister || ""}
              onChange={(e) =>
                setLocalClient({
                  ...localClient,
                  commercialRegister: e.target.value,
                })
              }
            />
          </div>
        )}
        <Button
          onClick={handleSave}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="h-4 w-4 ml-2" /> حفظ التغييرات
        </Button>
      </CardContent>
    </Card>
  );
};

// --- تاب 300-03: بيانات الاتصال ---
const TabContactData = ({ client, onClientUpdate }) => {
  const [localClient, setLocalClient] = useState(client);
  useEffect(() => setLocalClient(client), [client]);

  const handleSave = async () => {
    try {
      const updated = await updateClient(localClient.id, {
        contact: localClient.contact,
      });
      onClientUpdate(updated);
      toast.success("تم حفظ بيانات الاتصال");
    } catch (err) {
      toast.error("فشل الحفظ");
    }
  };

  if (!localClient) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>معلومات الاتصال</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InputWithCopy
            label="رقم الجوال *"
            value={localClient.contact?.mobile || ""}
            onChange={(e) =>
              setLocalClient({
                ...localClient,
                contact: { ...localClient.contact, mobile: e.target.value },
              })
            }
          />
          <InputWithCopy
            label="البريد الإلكتروني"
            value={localClient.contact?.email || ""}
            onChange={(e) =>
              setLocalClient({
                ...localClient,
                contact: { ...localClient.contact, email: e.target.value },
              })
            }
          />
          <InputWithCopy
            label="هاتف ثابت"
            value={localClient.contact?.phone || ""}
            onChange={(e) =>
              setLocalClient({
                ...localClient,
                contact: { ...localClient.contact, phone: e.target.value },
              })
            }
          />
          <InputWithCopy
            label="واتساب"
            value={localClient.contact?.whatsapp || ""}
            onChange={(e) =>
              setLocalClient({
                ...localClient,
                contact: { ...localClient.contact, whatsapp: e.target.value },
              })
            }
          />
        </div>
        <Button onClick={handleSave} className="w-full bg-blue-600 text-white">
          <Save className="ml-2 h-4 w-4" /> حفظ التغييرات
        </Button>
      </CardContent>
    </Card>
  );
};

// --- تاب 300-04: العنوان ---
const TabAddress = ({ client, onClientUpdate }) => {
  const [localClient, setLocalClient] = useState(client);
  useEffect(() => setLocalClient(client), [client]);

  const handleSave = async () => {
    try {
      const updated = await updateClient(localClient.id, {
        address: localClient.address,
      });
      onClientUpdate(updated);
      toast.success("تم حفظ العنوان");
    } catch (err) {
      toast.error("فشل الحفظ");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>العنوان الوطني</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InputWithCopy
            label="الدولة"
            value={localClient.address?.country || ""}
            onChange={(e) =>
              setLocalClient({
                ...localClient,
                address: { ...localClient.address, country: e.target.value },
              })
            }
          />
          <InputWithCopy
            label="المدينة"
            value={localClient.address?.city || ""}
            onChange={(e) =>
              setLocalClient({
                ...localClient,
                address: { ...localClient.address, city: e.target.value },
              })
            }
          />
          <InputWithCopy
            label="الشارع"
            value={localClient.address?.street || ""}
            onChange={(e) =>
              setLocalClient({
                ...localClient,
                address: { ...localClient.address, street: e.target.value },
              })
            }
          />
          <InputWithCopy
            label="الحي"
            value={localClient.address?.district || ""}
            onChange={(e) =>
              setLocalClient({
                ...localClient,
                address: { ...localClient.address, district: e.target.value },
              })
            }
          />
          <InputWithCopy
            label="الرمز البريدي"
            value={localClient.address?.postalCode || ""}
            onChange={(e) =>
              setLocalClient({
                ...localClient,
                address: { ...localClient.address, postalCode: e.target.value },
              })
            }
          />
          <InputWithCopy
            label="رقم المبنى"
            value={localClient.address?.buildingNumber || ""}
            onChange={(e) =>
              setLocalClient({
                ...localClient,
                address: {
                  ...localClient.address,
                  buildingNumber: e.target.value,
                },
              })
            }
          />
        </div>
        <TextAreaWithCopy
          label="العنوان الكامل (نصي)"
          value={localClient.address?.fullAddress || ""}
          onChange={(e) =>
            setLocalClient({
              ...localClient,
              address: { ...localClient.address, fullAddress: e.target.value },
            })
          }
        />
        <Button onClick={handleSave} className="w-full bg-blue-600 text-white">
          حفظ العنوان
        </Button>
      </CardContent>
    </Card>
  );
};

// --- تاب 300-05: الهوية ---
const TabIdentification = ({ client, onClientUpdate }) => {
  const [localClient, setLocalClient] = useState(client);
  useEffect(() => setLocalClient(client), [client]);

  const handleSave = async () => {
    try {
      const updated = await updateClient(localClient.id, {
        identification: localClient.identification,
      });
      onClientUpdate(updated);
      toast.success("تم حفظ الهوية");
    } catch (err) {
      toast.error("فشل الحفظ");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>بيانات الهوية الرسمية</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <SelectWithCopy
            label="نوع الهوية"
            value={localClient.identification?.idType || ""}
            onChange={(e) =>
              setLocalClient({
                ...localClient,
                identification: {
                  ...localClient.identification,
                  idType: e.target.value,
                },
              })
            }
            options={[
              { value: "هوية وطنية", label: "هوية وطنية" },
              { value: "إقامة", label: "إقامة" },
              { value: "جواز سفر", label: "جواز سفر" },
              { value: "سجل تجاري", label: "سجل تجاري" },
            ]}
          />
          <InputWithCopy
            label="رقم الهوية/السجل"
            value={localClient.identification?.idNumber || ""}
            onChange={(e) =>
              setLocalClient({
                ...localClient,
                identification: {
                  ...localClient.identification,
                  idNumber: e.target.value,
                },
              })
            }
          />
          <InputWithCopy
            label="تاريخ الإصدار"
            type="date"
            value={
              localClient.identification?.issueDate
                ? new Date(localClient.identification.issueDate)
                    .toISOString()
                    .split("T")[0]
                : ""
            }
            onChange={(e) =>
              setLocalClient({
                ...localClient,
                identification: {
                  ...localClient.identification,
                  issueDate: e.target.value,
                },
              })
            }
          />
          <InputWithCopy
            label="تاريخ الانتهاء"
            type="date"
            value={
              localClient.identification?.expiryDate
                ? new Date(localClient.identification.expiryDate)
                    .toISOString()
                    .split("T")[0]
                : ""
            }
            onChange={(e) =>
              setLocalClient({
                ...localClient,
                identification: {
                  ...localClient.identification,
                  expiryDate: e.target.value,
                },
              })
            }
          />
          <InputWithCopy
            label="مصدر الهوية"
            value={localClient.identification?.issuePlace || ""}
            onChange={(e) =>
              setLocalClient({
                ...localClient,
                identification: {
                  ...localClient.identification,
                  issuePlace: e.target.value,
                },
              })
            }
          />
        </div>
        <Button onClick={handleSave} className="w-full bg-blue-600 text-white">
          حفظ الهوية
        </Button>
      </CardContent>
    </Card>
  );
};

// --- تاب 300-06: المعاملات ---
const TabTransactions = ({ client }) => {
  const transactions = client.transactions || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل المعاملات ({transactions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم المعاملة</TableHead>
                <TableHead className="text-right">العنوان</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجمالي</TableHead>
                <TableHead className="text-right">المدفوع</TableHead>
                <TableHead className="text-right">المتبقي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-xs">
                    {tx.transactionCode}
                  </TableCell>
                  <TableCell>{tx.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tx.status}</Badge>
                  </TableCell>
                  <TableCell className="font-bold">
                    {tx.totalFees?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-green-600">
                    {tx.paidAmount?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-red-600">
                    {tx.remainingAmount?.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-500 py-8">
            لا توجد معاملات مسجلة.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// --- تاب 300-07: المالية ---
const TabFeesPayments = ({ client }) => {
  const allPayments = (client.transactions || []).reduce((acc, tx) => {
    return [
      ...acc,
      ...(tx.payments || []).map((p) => ({ ...p, txCode: tx.transactionCode })),
    ];
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600">إجمالي الأتعاب</p>
            <p className="text-2xl font-bold text-green-700">
              {(client.totalFees || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600">المدفوع</p>
            <p className="text-2xl font-bold text-blue-700">
              {(client.totalPaid || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600">المتبقي</p>
            <p className="text-2xl font-bold text-red-700">
              {(client.totalRemaining || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>سجل المدفوعات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الطريقة</TableHead>
                <TableHead className="text-right">رقم المعاملة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPayments.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="font-bold text-green-600">
                    {p.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {new Date(p.date).toLocaleDateString("ar-SA")}
                  </TableCell>
                  <TableCell>{p.method}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {p.txCode}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// --- تاب 300-08: التقييم والملاحظات ---
const TabRatingNotes = ({ client, onClientUpdate }) => {
  const [localClient, setLocalClient] = useState(client);

  const handleSave = async () => {
    try {
      const updated = await updateClient(localClient.id, {
        rating: localClient.rating,
        secretRating: localClient.secretRating,
        notes: localClient.notes,
      });
      onClientUpdate(updated);
      toast.success("تم حفظ التقييم");
    } catch (err) {
      toast.error("فشل الحفظ");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>التقييم والملاحظات</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            التقييم العام
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-8 w-8 cursor-pointer ${star <= (localClient.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                onClick={() => setLocalClient({ ...localClient, rating: star })}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            التقييم السري (0-100)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              value={localClient.secretRating || 50}
              onChange={(e) =>
                setLocalClient({
                  ...localClient,
                  secretRating: parseInt(e.target.value),
                })
              }
            />
            <span className="font-bold text-blue-600 w-12 text-center">
              {localClient.secretRating || 50}
            </span>
          </div>
        </div>

        <TextAreaWithCopy
          label="ملاحظات إدارية"
          value={localClient.notes || ""}
          onChange={(e) =>
            setLocalClient({ ...localClient, notes: e.target.value })
          }
          rows={5}
        />

        <Button onClick={handleSave} className="w-full bg-blue-600 text-white">
          حفظ التقييم
        </Button>
      </CardContent>
    </Card>
  );
};

// --- تاب 300-09: الإحصائيات ---
const TabStatistics = ({ client }) => (
  <div className="grid grid-cols-2 gap-4">
    <Card>
      <CardHeader>
        <CardTitle>معدل الإنجاز</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <div className="relative h-32 w-32">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">
              {client.completionPercentage?.toFixed(0)}%
            </span>
          </div>
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke="#3b82f6"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={377}
              strokeDashoffset={
                377 - (377 * (client.completionPercentage || 0)) / 100
              }
            />
          </svg>
        </div>
        <p className="mt-4 text-sm text-gray-500">استكمال بيانات العميل</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>نقاط العميل</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span>الدرجة الحالية</span>
          <Badge
            className={`text-lg px-3 ${client.grade === "أ" ? "bg-green-500" : "bg-yellow-500"}`}
          >
            {client.grade || "-"}
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>مجموع النقاط</span>
            <span>{client.gradeScore || 0}/100</span>
          </div>
          <Progress value={client.gradeScore || 0} className="h-2" />
        </div>
      </CardContent>
    </Card>
  </div>
);

// --- تاب 300-10: التقارير ---
const TabReports = () => (
  <Card>
    <CardHeader>
      <CardTitle>التقارير المتاحة</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="p-4 border rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-500" />
          <div>
            <p className="font-bold">تقرير شامل للعميل</p>
            <p className="text-sm text-gray-500">
              يتضمن البيانات الشخصية والمعاملات
            </p>
          </div>
        </div>
        <Button variant="outline">
          <FileText className="ml-2 h-4 w-4" /> طباعة
        </Button>
      </div>
      <div className="p-4 border rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-green-500" />
          <div>
            <p className="font-bold">كشف حساب مالي</p>
            <p className="text-sm text-gray-500">جميع المدفوعات والمستحقات</p>
          </div>
        </div>
        <Button variant="outline">
          <FileSpreadsheet className="ml-2 h-4 w-4" /> تصدير Excel
        </Button>
      </div>
    </CardContent>
  </Card>
);

// --- تاب 300-11: السجل الزمني ---
const TabActivityLog = ({ client }) => (
  <Card>
    <CardHeader>
      <CardTitle>سجل النشاطات</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {(client.activityLogs || []).map((log, i) => (
          <div key={i} className="flex gap-4 border-b pb-3 last:border-0">
            <div className="mt-1">
              <History className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold">{log.action}</p>
              <p className="text-xs text-gray-500">
                {new Date(log.date).toLocaleString("ar-SA")}
              </p>
              <p className="text-sm mt-1">{log.description}</p>
              <Badge variant="outline" className="mt-1 text-[10px]">
                {log.category}
              </Badge>
            </div>
          </div>
        ))}
        {(!client.activityLogs || client.activityLogs.length === 0) && (
          <p className="text-gray-500">لا يوجد نشاط مسجل.</p>
        )}
      </div>
    </CardContent>
  </Card>
);

// --- تاب 300-12: الإعدادات ---
const TabSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle>إعدادات تصنيف العملاء</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-500 mb-4">
        هذه الإعدادات عامة وتؤثر على كيفية حساب درجات جميع العملاء.
      </p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between p-2 bg-gray-50 rounded">
          <span>وزن الأتعاب المالية</span>
          <span className="font-bold">30%</span>
        </div>
        <div className="flex justify-between p-2 bg-gray-50 rounded">
          <span>وزن عدد المعاملات</span>
          <span className="font-bold">20%</span>
        </div>
        <div className="flex justify-between p-2 bg-gray-50 rounded">
          <span>وزن الالتزام بالسداد</span>
          <span className="font-bold">25%</span>
        </div>
        <div className="flex justify-between p-2 bg-gray-50 rounded">
          <span>التقييم السري</span>
          <span className="font-bold">25%</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// 4. المكون الرئيسي للشاشة (ClientManagement) - مع تحديث التنقل والويزارد
// ============================================================================
const ClientManagement = () => {
  // ✅ الاتصال بالستور العام للتحكم في التبويبات العلوية
  const { activeTabPerScreen, addTab, setActiveTab } = useAppStore();
  const activeTabId = activeTabPerScreen["300"];

  // الحالات المحلية
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // حالات الإضافة الجديدة (Wizard)
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [newClientData, setNewClientData] = useState({});

  const clientClassifications = [
    { name: "VIP", color: "#f59e0b" },
    { name: "مؤسسة", color: "#10b981" },
    { name: "عادي", color: "#3b82f6" },
  ];

  const { isLoading, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const data = await getAllClients();
      setClients(data);
      return data;
    },
  });

  // ✅ دالة التعامل مع القائمة الجانبية (لفتح التبويبات العلوية)
  const handleSidebarClick = (item) => {
    if (item.id !== "300-LST" && !selectedClient) {
      toast.error("يرجى اختيار عميل من القائمة أولاً");
      setActiveTab("300", "300-LST");
      return;
    }
    // إضافة التبويب للشريط العلوي
    addTab("300", {
      id: item.id,
      title: item.title,
      type: item.type,
      closable: item.closable,
    });
    setActiveTab("300", item.id);
  };

  // ✅ دالة اختيار العميل من الجدول
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    addTab("300", {
      id: "300-02",
      title: "البيانات الأساسية",
      type: "form",
      closable: true,
    });
    setActiveTab("300", "300-02");
  };

  // --- مكون القائمة الجانبية الاحترافي (Internal Sidebar) ---
  const SidebarMenu = () => (
    <div className="w-56 bg-white border-l h-full flex flex-col shadow-sm">
      <div className="p-4 border-b bg-gray-50/50">
        <h3 className="font-bold text-gray-700">تصفح الملف</h3>
        <p className="text-xs text-gray-400 mt-1">
          {selectedClient
            ? getFullName(selectedClient.name) || "عميل محدد"
            : "لم يتم تحديد عميل"}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTabId === item.id;
          const isDisabled = !selectedClient && item.id !== "300-LST";

          return (
            <button
              key={item.id}
              onClick={() => handleSidebarClick(item)}
              disabled={isDisabled}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200
                ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-bold border-r-4 border-blue-600"
                    : isDisabled
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <Icon
                size={18}
                className={
                  isActive
                    ? "text-blue-600"
                    : isDisabled
                      ? "text-gray-300"
                      : "text-gray-500"
                }
              />
              <span>{item.title}</span>
              {isActive && (
                <div className="mr-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // --- دوال الويزارد (Wizard Functions) ---
  const handleCreateClient = async () => {
    try {
      const payload = {
        ...newClientData,
        mobile: newClientData.contact?.mobile,
        idNumber: newClientData.identification?.idNumber,
        email: newClientData.contact?.email,
        name: newClientData.name,
        contact: newClientData.contact,
        address: newClientData.address,
        identification: newClientData.identification,
        isActive: true,
      };

      const created = await createClient(payload);
      setClients([created, ...clients]);
      setShowAddDialog(false);
      setNewClientData({});
      setAddStep(1);
      toast.success("تم إضافة العميل بنجاح");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "فشل إضافة العميل");
    }
  };

  const handleDeleteClient = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا العميل؟")) {
      try {
        await deleteClient(id);
        setClients(clients.filter((c) => c.id !== id));
        if (selectedClient?.id === id) setSelectedClient(null);
        toast.success("تم الحذف");
      } catch (err) {
        toast.error("فشل الحذف");
      }
    }
  };

  // --- نافذة الإضافة (Wizard Render) ---
  const renderAddDialog = () => (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent className="max-w-4xl" style={{ direction: "rtl" }}>
        <DialogHeader>
          <DialogTitle>إضافة عميل جديد - خطوة {addStep} من 6</DialogTitle>
          <Progress value={(addStep / 6) * 100} className="h-2" />
        </DialogHeader>

        <div className="py-4 h-[400px] overflow-y-auto">
          {addStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold border-b pb-2">البيانات الأساسية</h3>
              <div className="grid grid-cols-2 gap-4">
                <InputWithCopy
                  label="الاسم الأول *"
                  value={newClientData.name?.firstName || ""}
                  onChange={(e) =>
                    setNewClientData({
                      ...newClientData,
                      name: {
                        ...newClientData.name,
                        firstName: e.target.value,
                      },
                    })
                  }
                />
                <InputWithCopy
                  label="اسم الأب"
                  value={newClientData.name?.fatherName || ""}
                  onChange={(e) =>
                    setNewClientData({
                      ...newClientData,
                      name: {
                        ...newClientData.name,
                        fatherName: e.target.value,
                      },
                    })
                  }
                />
                <InputWithCopy
                  label="اسم الجد"
                  value={newClientData.name?.grandFatherName || ""}
                  onChange={(e) =>
                    setNewClientData({
                      ...newClientData,
                      name: {
                        ...newClientData.name,
                        grandFatherName: e.target.value,
                      },
                    })
                  }
                />
                <InputWithCopy
                  label="العائلة"
                  value={newClientData.name?.familyName || ""}
                  onChange={(e) =>
                    setNewClientData({
                      ...newClientData,
                      name: {
                        ...newClientData.name,
                        familyName: e.target.value,
                      },
                    })
                  }
                />
                <SelectWithCopy
                  label="النوع"
                  value={newClientData.type || ""}
                  onChange={(e) =>
                    setNewClientData({ ...newClientData, type: e.target.value })
                  }
                  options={[
                    { value: "فرد", label: "فرد" },
                    { value: "شركة", label: "شركة" },
                  ]}
                />
              </div>
            </div>
          )}
          {addStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold border-b pb-2">بيانات الاتصال</h3>
              <div className="grid grid-cols-2 gap-4">
                <InputWithCopy
                  label="الجوال *"
                  value={newClientData.contact?.mobile || ""}
                  onChange={(e) =>
                    setNewClientData({
                      ...newClientData,
                      contact: {
                        ...newClientData.contact,
                        mobile: e.target.value,
                      },
                    })
                  }
                />
                <InputWithCopy
                  label="البريد الإلكتروني"
                  value={newClientData.contact?.email || ""}
                  onChange={(e) =>
                    setNewClientData({
                      ...newClientData,
                      contact: {
                        ...newClientData.contact,
                        email: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}
          {addStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold border-b pb-2">العنوان</h3>
              <div className="grid grid-cols-2 gap-4">
                <InputWithCopy
                  label="المدينة"
                  value={newClientData.address?.city || ""}
                  onChange={(e) =>
                    setNewClientData({
                      ...newClientData,
                      address: {
                        ...newClientData.address,
                        city: e.target.value,
                      },
                    })
                  }
                />
                <InputWithCopy
                  label="الحي"
                  value={newClientData.address?.district || ""}
                  onChange={(e) =>
                    setNewClientData({
                      ...newClientData,
                      address: {
                        ...newClientData.address,
                        district: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}
          {addStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-bold border-b pb-2">الهوية</h3>
              <div className="grid grid-cols-2 gap-4">
                <InputWithCopy
                  label="رقم الهوية *"
                  value={newClientData.identification?.idNumber || ""}
                  onChange={(e) =>
                    setNewClientData({
                      ...newClientData,
                      identification: {
                        ...newClientData.identification,
                        idNumber: e.target.value,
                      },
                    })
                  }
                />
                <SelectWithCopy
                  label="نوع الهوية"
                  value={newClientData.identification?.idType || "هوية وطنية"}
                  onChange={(e) =>
                    setNewClientData({
                      ...newClientData,
                      identification: {
                        ...newClientData.identification,
                        idType: e.target.value,
                      },
                    })
                  }
                  options={[
                    { value: "هوية وطنية", label: "هوية وطنية" },
                    { value: "إقامة", label: "إقامة" },
                  ]}
                />
              </div>
            </div>
          )}
          {addStep >= 5 && (
            <div className="text-center py-10">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold">جاهز للحفظ</h3>
              <p className="text-gray-500">تم إدخال جميع البيانات المطلوبة.</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={() =>
              addStep > 1 ? setAddStep(addStep - 1) : setShowAddDialog(false)
            }
          >
            {addStep > 1 ? "السابق" : "إلغاء"}
          </Button>
          {addStep < 6 ? (
            <Button
              onClick={() => setAddStep(addStep + 1)}
              className="bg-blue-600 text-white"
            >
              التالي
            </Button>
          ) : (
            <Button
              onClick={handleCreateClient}
              className="bg-green-600 text-white"
            >
              حفظ العميل
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // --- مكون القائمة (التبويب الأول) ---
  const renderClientsList = () => {
    const filtered = clients.filter((c) => {
      const matchSearch =
        !searchTerm ||
        getFullName(c.name).includes(searchTerm) ||
        c.contact?.mobile?.includes(searchTerm);
      const matchType = filterType === "all" || c.type === filterType;
      return matchSearch && matchType;
    });

    return (
      <div className="space-y-4 p-6">
        {/* شريط الإحصائيات السريع */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-100 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">إجمالي العملاء</p>
              <p className="text-2xl font-bold text-blue-700">
                {clients.length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-100 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">العملاء النشطين</p>
              <p className="text-2xl font-bold text-green-700">
                {clients.filter((c) => c.isActive).length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-100 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">عملاء شركات</p>
              <p className="text-2xl font-bold text-purple-700">
                {clients.filter((c) => c.type === "شركة").length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-100 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">عملاء VIP</p>
              <p className="text-2xl font-bold text-yellow-700">
                {clients.filter((c) => c.category === "VIP").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* البحث والإجراءات */}
        <div className="flex gap-2 bg-white p-2 rounded-lg border">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="بحث بالاسم، الجوال، أو رقم الهوية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="p-2 border rounded-lg bg-white outline-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">كل الأنواع</option>
            <option value="فرد">أفراد</option>
            <option value="شركة">شركات</option>
          </select>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 text-white gap-2"
          >
            <UserPlus size={18} /> إضافة عميل
          </Button>
        </div>

        {/* جدول العملاء */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">الجوال</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">التصنيف</TableHead>
                    <TableHead className="text-right">الدرجة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((client) => (
                    <TableRow
                      key={client.id}
                      className={`cursor-pointer hover:bg-blue-50 transition-colors ${selectedClient?.id === client.id ? "bg-blue-50 border-r-4 border-blue-600" : ""}`}
                      onClick={() => handleSelectClient(client)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{getFullName(client.name)}</span>
                          <span className="text-[10px] text-gray-400">
                            {client.clientCode}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {client.contact?.mobile}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{client.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{client.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: getGradeColor(client.grade),
                          }}
                        >
                          {client.grade || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClient(client.id);
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // --- عرض المحتوى الديناميكي ---
  const renderContent = () => {
    // 1. إذا كنا في تبويب القائمة
    if (activeTabId === "300-LST") {
      return renderClientsList();
    }

    // 2. إذا كنا في أي تبويب آخر (يجب أن يكون هناك عميل محدد)
    if (!selectedClient) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
          <User className="w-16 h-16 mb-4 opacity-20" />
          <p>تم إغلاق العميل المحدد. يرجى اختيار عميل من القائمة.</p>
          <Button variant="link" onClick={() => setActiveTab("300", "300-LST")}>
            العودة للقائمة
          </Button>
        </div>
      );
    }

    // 3. عرض المكون المناسب
    switch (activeTabId) {
      case "300-02":
        return (
          <div className="p-6">
            <TabBasicData
              client={selectedClient}
              classifications={clientClassifications}
              onClientUpdate={setSelectedClient}
            />
          </div>
        );
      case "300-03":
        return (
          <div className="p-6">
            <TabContactData
              client={selectedClient}
              onClientUpdate={setSelectedClient}
            />
          </div>
        );
      case "300-04":
        return (
          <div className="p-6">
            <TabAddress
              client={selectedClient}
              onClientUpdate={setSelectedClient}
            />
          </div>
        );
      case "300-05":
        return (
          <div className="p-6">
            <TabIdentification
              client={selectedClient}
              onClientUpdate={setSelectedClient}
            />
          </div>
        );
      case "300-06":
        return (
          <div className="p-6">
            <TabTransactions client={selectedClient} />
          </div>
        );
      case "300-07":
        return (
          <div className="p-6">
            <TabFeesPayments client={selectedClient} />
          </div>
        );
      case "300-08":
        return (
          <div className="p-6">
            <TabRatingNotes
              client={selectedClient}
              onClientUpdate={setSelectedClient}
            />
          </div>
        );
      case "300-09":
        return (
          <div className="p-6">
            <TabStatistics client={selectedClient} />
          </div>
        );
      case "300-10":
        return (
          <div className="p-6">
            <TabReports />
          </div>
        );
      case "300-11":
        return (
          <div className="p-6">
            <TabActivityLog client={selectedClient} />
          </div>
        );
      case "300-12":
        return (
          <div className="p-6">
            <TabSettings />
          </div>
        );
      default:
        return (
          <div className="p-6 text-center text-gray-500">
            الشاشة قيد التطوير: {activeTabId}
          </div>
        );
    }
  };

  return (
    <div className="flex h-full bg-gray-50 direction-rtl">
      {/* 1. القائمة الجانبية الداخلية (Navigation) */}
      <SidebarMenu />

      {/* 2. منطقة العمل الرئيسية */}
      <div className="flex-1 overflow-y-auto bg-white/50 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" />
          </div>
        )}
        {renderContent()}
      </div>

      {/* 3. نافذة الإضافة (Wizard) */}
      {renderAddDialog()}
    </div>
  );
};

export default ClientManagement;
