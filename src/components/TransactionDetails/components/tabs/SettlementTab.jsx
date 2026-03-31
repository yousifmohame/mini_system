import React from "react";
import {
  Check,
  ChevronUp,
  ChevronDown,
  Loader2,
  User,
  Handshake,
  Monitor,
} from "lucide-react";

export const SettlementTab = ({
  totalFees,
  totalCosts,
  estimatedProfit,
  distributableProfit,
  tx,
  openSections,
  toggleSection,
  finalizeSettlementMutation,
  safeNum,
  setActiveTab,
}) => {
  return (
    <div
      className="flex-1 overflow-y-auto custom-scrollbar-slim p-3 animate-in fade-in"
      style={{ minHeight: "0px" }}
    >
      <div className="space-y-2.5">
        {/* 1. Header Stats */}
        <div className="grid grid-cols-4 gap-1.5">
          <div
            className="p-2 rounded-md"
            style={{ backgroundColor: "var(--wms-surface-2)" }}
          >
            <div className="text-gray-500" style={{ fontSize: "9px" }}>
              السعر المتفق الإجمالي
            </div>
            <div
              className="font-mono mt-0.5 text-gray-800"
              style={{ fontSize: "14px", fontWeight: 700 }}
            >
              {totalFees.toLocaleString()}{" "}
              <span style={{ fontSize: "9px", fontWeight: 400 }}>ر.س</span>
            </div>
          </div>
          <div
            className="p-2 rounded-md"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.06)" }}
          >
            <div className="text-gray-500" style={{ fontSize: "9px" }}>
              إجمالي التكاليف
            </div>
            <div
              className="font-mono mt-0.5 text-red-600"
              style={{ fontSize: "14px", fontWeight: 700 }}
            >
              {totalCosts.toLocaleString()}{" "}
              <span style={{ fontSize: "9px", fontWeight: 400 }}>ر.س</span>
            </div>
          </div>
          <div
            className="p-2 rounded-md"
            style={{ backgroundColor: "rgba(34, 197, 94, 0.06)" }}
          >
            <div className="text-gray-500" style={{ fontSize: "9px" }}>
              ربح تقديري
            </div>
            <div
              className="font-mono mt-0.5 text-green-600"
              style={{ fontSize: "14px", fontWeight: 700 }}
            >
              {estimatedProfit.toLocaleString()}{" "}
              <span style={{ fontSize: "9px", fontWeight: 400 }}>ر.س</span>
            </div>
          </div>
          <div
            className="p-2 rounded-md"
            style={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}
          >
            <div className="text-gray-500" style={{ fontSize: "9px" }}>
              صافي قابل للتسوية
            </div>
            <div
              className="font-mono mt-0.5 text-green-600"
              style={{ fontSize: "16px", fontWeight: 700 }}
            >
              {distributableProfit.toLocaleString()}{" "}
              <span style={{ fontSize: "9px", fontWeight: 400 }}>ر.س</span>
            </div>
          </div>
        </div>

        {/* 2. Progress Bar */}
        <div
          className="flex items-center gap-2 px-1"
          style={{ fontSize: "10px" }}
        >
          <span className="text-gray-500 font-bold">تقدم التسوية:</span>
          <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all bg-amber-500"
              style={{
                width: `${totalCosts > 0 ? ((totalCosts - (tx.settlements?.filter((s) => s.status === "DELIVERED").reduce((a, b) => a + b.amount, 0) || 0)) / totalCosts) * 100 : 0}%`,
              }}
            ></div>
          </div>
          <span
            className="font-mono text-amber-600"
            style={{ fontSize: "10px", fontWeight: 600 }}
          >
            {(
              tx.settlements
                ?.filter((s) => s.status === "DELIVERED")
                .reduce((a, b) => a + b.amount, 0) || 0
            ).toLocaleString()}{" "}
            / {totalCosts.toLocaleString()}
          </span>
        </div>

        {/* 3. تسوية الوسطاء */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: "rgba(8, 145, 178, 0.15)" }}
        >
          <div
            className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer select-none"
            style={{
              backgroundColor: "rgba(8, 145, 178, 0.04)",
              borderBottom: openSections.brokers
                ? "1px solid rgba(8, 145, 178, 0.15)"
                : "none",
            }}
            onClick={() => toggleSection("brokers")}
          >
            <div className="flex items-center gap-1.5">
              <Handshake className="w-3 h-3 text-cyan-600" />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "rgb(8, 145, 178)",
                }}
              >
                تسوية الوسطاء
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              {openSections.brokers ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </div>
          </div>
          {openSections.brokers && (
            <div className="p-2.5">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table
                  className="w-full text-right"
                  style={{ fontSize: "11px" }}
                >
                  <thead>
                    <tr className="bg-gray-50 h-[28px]">
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      >
                        الوسيط
                      </th>
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      >
                        المبلغ
                      </th>
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      >
                        المدفوع
                      </th>
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      >
                        المتبقي
                      </th>
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      >
                        الحالة
                      </th>
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      ></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.brokers?.length > 0 ? (
                      tx.brokers.map((b, i) => {
                        const cost = safeNum(b.fees);
                        const paid =
                          tx.settlements
                            ?.filter(
                              (s) =>
                                s.targetId === b.personId &&
                                s.status === "DELIVERED",
                            )
                            .reduce((sum, s) => sum + s.amount, 0) || 0;
                        const remaining = Math.max(0, cost - paid);
                        const isFullyPaid = paid >= cost && cost > 0;
                        return (
                          <tr
                            key={i}
                            className={`border-b border-gray-100 hover:bg-gray-50/50 ${i % 2 === 1 ? "bg-gray-50/30" : "bg-white"}`}
                            style={{ height: "28px" }}
                          >
                            <td
                              className="px-2 text-gray-700"
                              style={{
                                fontSize: "10px",
                                fontWeight: "bold",
                              }}
                            >
                              {b.name}
                            </td>
                            <td className="px-2 font-mono font-bold text-gray-800">
                              {cost.toLocaleString()}
                            </td>
                            <td className="px-2 font-mono font-bold text-gray-800">
                              {paid.toLocaleString()}
                            </td>
                            <td
                              className={`px-2 font-mono font-bold ${remaining > 0 ? "text-red-500" : "text-green-500"}`}
                            >
                              {remaining.toLocaleString()}
                            </td>
                            <td className="px-2">
                              <span
                                style={{
                                  height: "18px",
                                  fontSize: "10px",
                                  borderRadius: "9px",
                                  padding: "0 5px",
                                  lineHeight: "18px",
                                  fontWeight: 600,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  backgroundColor: isFullyPaid
                                    ? "rgba(34, 197, 94, 0.15)"
                                    : "rgba(245, 158, 11, 0.15)",
                                  color: isFullyPaid
                                    ? "var(--wms-success)"
                                    : "var(--wms-warning)",
                                }}
                              >
                                {isFullyPaid ? "مُسوّى" : "قيد الانتظار"}
                              </span>
                            </td>
                            <td className="px-2">
                              <button
                                className="text-blue-500 hover:underline"
                                style={{ fontSize: "9px" }}
                              >
                                تفاصيل
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center py-3 text-gray-400 font-bold"
                          style={{ fontSize: "10px" }}
                        >
                          لا يوجد وسطاء
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-1.5">
                    <button
                      className="px-2 py-0.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold transition-colors"
                      style={{ fontSize: "9px" }}
                    >
                      تسوية كاملة
                    </button>
                    <button
                      className="px-2 py-0.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold transition-colors"
                      style={{ fontSize: "9px" }}
                    >
                      سجل الدفعات
                    </button>
                  </div>
                  <span
                    className="text-gray-500 font-bold"
                    style={{ fontSize: "10px" }}
                  >
                    المدفوع:{" "}
                    <span
                      className="font-mono text-green-600"
                      style={{ fontWeight: 700 }}
                    >
                      {(
                        tx.settlements
                          ?.filter(
                            (s) =>
                              s.targetType === "وسيط" &&
                              s.status === "DELIVERED",
                          )
                          .reduce((a, b) => a + b.amount, 0) || 0
                      ).toLocaleString()}
                    </span>
                    <span className="mx-1">|</span>
                    المتبقي:{" "}
                    <span
                      className="font-mono text-red-500"
                      style={{ fontWeight: 700 }}
                    >
                      {Math.max(
                        0,
                        safeNum(tx.mediatorFees) -
                          (tx.settlements
                            ?.filter(
                              (s) =>
                                s.targetType === "وسيط" &&
                                s.status === "DELIVERED",
                            )
                            .reduce((a, b) => a + b.amount, 0) || 0),
                      ).toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. تسوية المعقبين */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: "rgba(124, 58, 237, 0.15)" }}
        >
          <div
            className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer select-none"
            style={{
              backgroundColor: "rgba(124, 58, 237, 0.04)",
              borderBottom: openSections.agents
                ? "1px solid rgba(124, 58, 237, 0.15)"
                : "none",
            }}
            onClick={() => toggleSection("agents")}
          >
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-purple-600" />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "rgb(124, 58, 237)",
                }}
              >
                تسوية المعقبين
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              {openSections.agents ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </div>
          </div>
          {openSections.agents && (
            <div className="p-2.5">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table
                  className="w-full text-right"
                  style={{ fontSize: "11px" }}
                >
                  <thead>
                    <tr className="bg-gray-50 h-[28px]">
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      >
                        المعقب
                      </th>
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      >
                        المبلغ
                      </th>
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      >
                        المدفوع
                      </th>
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      >
                        المتبقي
                      </th>
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      >
                        الحالة
                      </th>
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      ></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.agents?.length > 0 ? (
                      tx.agents.map((ag, i) => {
                        const cost = safeNum(ag.fees);
                        const paid =
                          tx.settlements
                            ?.filter(
                              (s) =>
                                s.targetId === ag.id &&
                                s.status === "DELIVERED",
                            )
                            .reduce((sum, s) => sum + s.amount, 0) || 0;
                        const remaining = Math.max(0, cost - paid);
                        const isFullyPaid = paid >= cost && cost > 0;
                        return (
                          <tr
                            key={i}
                            className={`border-b border-gray-100 hover:bg-gray-50/50 ${i % 2 === 1 ? "bg-gray-50/30" : "bg-white"}`}
                            style={{ height: "28px" }}
                          >
                            <td
                              className="px-2 text-gray-700"
                              style={{
                                fontSize: "10px",
                                fontWeight: "bold",
                              }}
                            >
                              {ag.name}
                            </td>
                            <td className="px-2 font-mono font-bold text-gray-800">
                              {cost.toLocaleString()}
                            </td>
                            <td className="px-2 font-mono font-bold text-gray-800">
                              {paid.toLocaleString()}
                            </td>
                            <td
                              className={`px-2 font-mono font-bold ${remaining > 0 ? "text-red-500" : "text-green-500"}`}
                            >
                              {remaining.toLocaleString()}
                            </td>
                            <td className="px-2">
                              <span
                                style={{
                                  height: "18px",
                                  fontSize: "10px",
                                  borderRadius: "9px",
                                  padding: "0 5px",
                                  lineHeight: "18px",
                                  fontWeight: 600,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  backgroundColor: isFullyPaid
                                    ? "rgba(34, 197, 94, 0.15)"
                                    : "rgba(245, 158, 11, 0.15)",
                                  color: isFullyPaid
                                    ? "var(--wms-success)"
                                    : "var(--wms-warning)",
                                }}
                              >
                                {isFullyPaid ? "مُسوّى" : "قيد الانتظار"}
                              </span>
                            </td>
                            <td className="px-2">
                              <button
                                className="text-blue-500 hover:underline"
                                style={{ fontSize: "9px" }}
                              >
                                تفاصيل
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center py-3 text-gray-400 font-bold"
                          style={{ fontSize: "10px" }}
                        >
                          لا يوجد معقبين
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-1.5">
                    <button
                      className="px-2 py-0.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold transition-colors"
                      style={{ fontSize: "9px" }}
                    >
                      تسوية كاملة
                    </button>
                    <button
                      className="px-2 py-0.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold transition-colors"
                      style={{ fontSize: "9px" }}
                    >
                      إضافة ملاحظة
                    </button>
                  </div>
                  <span
                    className="text-gray-500 font-bold"
                    style={{ fontSize: "10px" }}
                  >
                    المدفوع:{" "}
                    <span
                      className="font-mono text-green-600"
                      style={{ fontWeight: 700 }}
                    >
                      {(
                        tx.settlements
                          ?.filter(
                            (s) =>
                              s.targetType === "معقب" &&
                              s.status === "DELIVERED",
                          )
                          .reduce((a, b) => a + b.amount, 0) || 0
                      ).toLocaleString()}
                    </span>
                    <span className="mx-1">|</span>
                    المتبقي:{" "}
                    <span
                      className="font-mono text-red-500"
                      style={{ fontWeight: 700 }}
                    >
                      {Math.max(
                        0,
                        safeNum(tx.agentCost) -
                          (tx.settlements
                            ?.filter(
                              (s) =>
                                s.targetType === "معقب" &&
                                s.status === "DELIVERED",
                            )
                            .reduce((a, b) => a + b.amount, 0) || 0),
                      ).toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. تسوية العمل عن بعد */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: "rgba(5, 150, 105, 0.15)" }}
        >
          <div
            className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer select-none"
            style={{
              backgroundColor: "rgba(5, 150, 105, 0.04)",
              borderBottom: openSections.remote
                ? "1px solid rgba(5, 150, 105, 0.15)"
                : "none",
            }}
            onClick={() => toggleSection("remote")}
          >
            <div className="flex items-center gap-1.5">
              <Monitor className="w-3 h-3 text-emerald-600" />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "rgb(5, 150, 105)",
                }}
              >
                تسوية العمل عن بعد
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              {openSections.remote ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </div>
          </div>
          {openSections.remote && (
            <div className="p-2.5">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table
                  className="w-full text-right"
                  style={{ fontSize: "11px" }}
                >
                  <thead>
                    <tr className="bg-gray-50 h-[28px]">
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      >
                        الموظف
                      </th>
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      >
                        المبلغ
                      </th>
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      >
                        المدفوع
                      </th>
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      >
                        المتبقي
                      </th>
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      >
                        الحالة
                      </th>
                      <th
                        className="px-2 text-gray-500"
                        style={{ fontWeight: 600, fontSize: "10px" }}
                      ></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.remoteTasks?.length > 0 ? (
                      tx.remoteTasks.map((rt, i) => {
                        const cost = safeNum(rt.cost);
                        const paid = rt.isPaid ? cost : safeNum(rt.paidAmount);
                        const remaining = Math.max(0, cost - paid);
                        const isFullyPaid = paid >= cost && cost > 0;
                        return (
                          <tr
                            key={i}
                            className={`border-b border-gray-100 hover:bg-gray-50/50 ${i % 2 === 1 ? "bg-gray-50/30" : "bg-white"}`}
                            style={{ height: "28px" }}
                          >
                            <td
                              className="px-2 text-gray-700"
                              style={{
                                fontSize: "10px",
                                fontWeight: "bold",
                              }}
                            >
                              {rt.workerName}
                            </td>
                            <td className="px-2 font-mono font-bold text-gray-800">
                              {cost.toLocaleString()}
                            </td>
                            <td className="px-2 font-mono font-bold text-gray-800">
                              {paid.toLocaleString()}
                            </td>
                            <td
                              className={`px-2 font-mono font-bold ${remaining > 0 ? "text-red-500" : "text-green-500"}`}
                            >
                              {remaining.toLocaleString()}
                            </td>
                            <td className="px-2">
                              <span
                                style={{
                                  height: "18px",
                                  fontSize: "10px",
                                  borderRadius: "9px",
                                  padding: "0 5px",
                                  lineHeight: "18px",
                                  fontWeight: 600,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  backgroundColor: isFullyPaid
                                    ? "rgba(34, 197, 94, 0.15)"
                                    : "rgba(127, 147, 186, 0.15)",
                                  color: isFullyPaid
                                    ? "var(--wms-success)"
                                    : "var(--wms-text-muted)",
                                }}
                              >
                                {isFullyPaid ? "مُسوّى" : "قيد الانتظار"}
                              </span>
                            </td>
                            <td className="px-2">
                              <button
                                className="text-blue-500 hover:underline"
                                style={{ fontSize: "9px" }}
                              >
                                تفاصيل
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center py-3 text-gray-400 font-bold"
                          style={{ fontSize: "10px" }}
                        >
                          لا توجد مهام مسجلة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-1.5">
                    <button
                      className="px-2 py-0.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold transition-colors"
                      style={{ fontSize: "9px" }}
                    >
                      تعديل التكلفة
                    </button>
                    <button
                      className="px-2 py-0.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold transition-colors"
                      style={{ fontSize: "9px" }}
                    >
                      إضافة ملاحظة
                    </button>
                  </div>
                  <span
                    className="text-gray-500 font-bold"
                    style={{ fontSize: "10px" }}
                  >
                    المدفوع:{" "}
                    <span
                      className="font-mono text-green-600"
                      style={{ fontWeight: 700 }}
                    >
                      {(
                        tx.remoteTasks
                          ?.filter((t) => t.isPaid)
                          .reduce((a, b) => a + b.cost, 0) || 0
                      ).toLocaleString()}
                    </span>
                    <span className="mx-1">|</span>
                    المتبقي:{" "}
                    <span
                      className="font-mono text-red-500"
                      style={{ fontWeight: 700 }}
                    >
                      {Math.max(
                        0,
                        safeNum(tx.remoteCost) -
                          (tx.remoteTasks
                            ?.filter((t) => t.isPaid)
                            .reduce((a, b) => a + b.cost, 0) || 0),
                      ).toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 6. Footer Button */}
        <div
          className="p-3 rounded-lg border flex items-center justify-between mt-4 shadow-sm"
          style={{
            backgroundColor: "rgba(34, 197, 94, 0.08)",
            borderColor: "rgba(34, 197, 94, 0.25)",
          }}
        >
          <div>
            <div
              className="text-gray-500 font-bold"
              style={{ fontSize: "10px" }}
            >
              صافي قابل للتسوية
            </div>
            <div
              className="font-mono text-green-600"
              style={{ fontSize: "20px", fontWeight: 700 }}
            >
              {distributableProfit.toLocaleString()}{" "}
              <span style={{ fontSize: "11px", fontWeight: 400 }}>ر.س</span>
            </div>
            <div
              className="text-gray-500 font-bold"
              style={{ fontSize: "9px" }}
            >
              المتبقي من التسويات:{" "}
              <span
                className="font-mono text-red-500"
                style={{ fontWeight: 600 }}
              >
                {Math.max(
                  0,
                  totalCosts -
                    (tx.settlements
                      ?.filter((s) => s.status === "DELIVERED")
                      .reduce((a, b) => a + b.amount, 0) || 0),
                ).toLocaleString()}{" "}
                ر.س
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              if (
                window.confirm(
                  "هل أنت متأكد من اعتماد التسوية الشاملة؟ سيتم إغلاق التعديلات المالية لهذه المعاملة.",
                )
              ) {
                finalizeSettlementMutation.mutate();
              }
            }}
            disabled={finalizeSettlementMutation.isPending}
            className="px-4 py-2.5 rounded-lg bg-green-600 text-white cursor-pointer hover:bg-green-700 flex items-center gap-1.5 shadow-md transition-colors disabled:opacity-50"
            style={{ fontSize: "12px", fontWeight: 600 }}
          >
            {finalizeSettlementMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>تنفيذ التسوية الشاملة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
