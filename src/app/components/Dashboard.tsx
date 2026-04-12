import { useMemo } from "react";
import { useData } from "../context/DataContext";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import FinancialReconciliation from "./FinancialReconciliation";
import AccountingFlowDiagram from "./AccountingFlowDiagram";

export default function Dashboard() {
  const { biologicalAssets, journalEntries } = useData();

  const totalPopulation = biologicalAssets.length;
  const totalAssetValue = biologicalAssets.reduce(
    (sum, asset) => sum + asset.fairValue,
    0,
  );
  const monthlyData = useMemo(() => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Ags",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const map = new Map<
      string,
      {
        month: string;
        transaksi: number;
        kasMasuk: number;
        kasKeluar: number;
        debit: number;
        credit: number;
      }
    >();

    journalEntries
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((entry) => {
        const monthIndex = Number(entry.date.slice(5, 7)) - 1;
        const monthKey = entry.date.slice(0, 7);
        if (!map.has(monthKey)) {
          map.set(monthKey, {
            month: monthNames[monthIndex] || monthKey,
            transaksi: 0,
            kasMasuk: 0,
            kasKeluar: 0,
            debit: 0,
            credit: 0,
          });
        }

        const bucket = map.get(monthKey)!;
        bucket.transaksi += 1;
        bucket.debit += entry.debitAmount;
        bucket.credit += entry.creditAmount;

        if (entry.debitAccount.includes("Kas"))
          bucket.kasMasuk += entry.debitAmount;
        if (entry.creditAccount.includes("Kas"))
          bucket.kasKeluar += entry.creditAmount;
      });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => ({
        ...value,
        kasNet: value.kasMasuk - value.kasKeluar,
      }));
  }, [journalEntries]);

  const kasEntries = journalEntries.filter(
    (e) => e.debitAccount.includes("Kas") || e.creditAccount.includes("Kas"),
  );
  const totalKas = kasEntries.reduce((sum, entry) => {
    if (entry.debitAccount.includes("Kas")) return sum + entry.debitAmount;
    if (entry.creditAccount.includes("Kas")) return sum - entry.creditAmount;
    return sum;
  }, 0);

  const recentTransactions = useMemo(() => {
    return journalEntries
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [journalEntries]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const metrics = [
    {
      label: "Total Populasi",
      value: `${totalPopulation} Ekor`,
      subtitle: `${biologicalAssets.filter((a) => a.type === "Domba").length} Domba, ${biologicalAssets.filter((a) => a.type === "Kambing").length} Kambing`,
      icon: Activity,
      color: "#1B4332",
    },
    {
      label: "Nilai Aset Biologis",
      value: formatCurrency(totalAssetValue),
      subtitle: "PSAK 241 - Nilai Wajar",
      icon: TrendingUp,
      color: "#FFB703",
      trend: "+18%",
    },
    {
      label: "Kas & Bank",
      value: formatCurrency(totalKas),
      subtitle: "Posisi Likuiditas",
      icon: DollarSign,
      color: "#495057",
      trend: "-65%",
      trendNegative: true,
    },
    {
      label: "Burn Rate Harian",
      value: formatCurrency(566667),
      subtitle: "Pakan + Gaji (3 Karyawan)",
      icon: TrendingDown,
      color: "#DC3545",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl mb-1" style={{ color: "#1B4332" }}>
          Dashboard Investor
        </h1>
        <p className="text-sm" style={{ color: "#6C757D" }}>
          Simulasi Realitas Buku 2025
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-lg border"
              style={{ borderColor: "#DEE2E6" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="p-2 rounded"
                  style={{ backgroundColor: metric.color + "15" }}
                >
                  <Icon size={20} style={{ color: metric.color }} />
                </div>
                {metric.trend && (
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: metric.trendNegative
                        ? "#FEE"
                        : "#E7F5E9",
                      color: metric.trendNegative ? "#DC3545" : "#1B4332",
                    }}
                  >
                    {metric.trend}
                  </span>
                )}
              </div>
              <div className="text-xs mb-1" style={{ color: "#6C757D" }}>
                {metric.label}
              </div>
              <div className="text-xl mb-1" style={{ color: "#212529" }}>
                {metric.value}
              </div>
              <div className="text-xs" style={{ color: "#ADB5BD" }}>
                {metric.subtitle}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div
          className="bg-white p-6 rounded-lg border"
          style={{ borderColor: "#DEE2E6" }}
        >
          <h2 className="text-base mb-4" style={{ color: "#1B4332" }}>
            Tren Transaksi Bulanan
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
              <XAxis
                dataKey="month"
                stroke="#6C757D"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#6C757D" style={{ fontSize: "12px" }} />
              <Tooltip
                formatter={(value: number, name) =>
                  name === "transaksi" ? value : formatCurrency(value)
                }
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #DEE2E6",
                  borderRadius: "6px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="transaksi"
                stroke="#1B4332"
                strokeWidth={2}
                name="Jumlah Transaksi"
                dot={{ fill: "#1B4332" }}
              />
              <Line
                type="monotone"
                dataKey="kasNet"
                stroke="#DC3545"
                strokeWidth={2}
                name="Kas Neto"
                dot={{ fill: "#DC3545" }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            <p
              className="text-xs p-3 rounded"
              style={{ backgroundColor: "#FFF3CD", color: "#856404" }}
            >
              ⚠️ Grafik ini diambil langsung dari jurnal yang tersimpan di
              database.
            </p>
            <p
              className="text-xs p-3 rounded"
              style={{ backgroundColor: "#E7F5E9", color: "#1B4332" }}
            >
              ✓ Data aset, jurnal, dan dashboard saling terhubung ke MySQL.
            </p>
          </div>
        </div>

        <div
          className="bg-white p-6 rounded-lg border"
          style={{ borderColor: "#DEE2E6" }}
        >
          <h2 className="text-base mb-4" style={{ color: "#1B4332" }}>
            Aktivitas Terbaru
          </h2>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((entry, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border-l-4"
                  style={{
                    backgroundColor: "#F8F9FA",
                    borderLeftColor: "#FFB703",
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div
                        className="text-sm mb-1"
                        style={{ color: "#1B4332" }}
                      >
                        {entry.description}
                      </div>
                      <div className="text-xs" style={{ color: "#6C757D" }}>
                        {entry.date}
                      </div>
                    </div>
                    <div
                      className="text-right text-xs"
                      style={{ color: "#1B4332" }}
                    >
                      <div>
                        {formatCurrency(
                          Math.max(entry.debitAmount, entry.creditAmount),
                        )}
                      </div>
                      <div style={{ color: "#6C757D" }}>
                        {entry.debitAccount} / {entry.creditAccount}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm" style={{ color: "#6C757D" }}>
                Belum ada transaksi di database.
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "#E7F5E9" }}
            >
              <div className="text-xs mb-2" style={{ color: "#1B4332" }}>
                Status Konsolidasi
              </div>
              <div className="text-sm" style={{ color: "#1B4332" }}>
                ✓ Data dari database sudah dipakai untuk dashboard, jurnal, dan
                laporan
              </div>
            </div>

            <div
              className="p-4 rounded-lg border-l-4"
              style={{ backgroundColor: "#F8F9FA", borderLeftColor: "#1B4332" }}
            >
              <div className="text-xs mb-3" style={{ color: "#1B4332" }}>
                Verifikasi Laporan Keuangan
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div style={{ color: "#6C757D" }}>Total Jurnal Entries:</div>
                  <div style={{ color: "#212529" }}>
                    {journalEntries.length} transaksi
                  </div>
                </div>
                <div>
                  <div style={{ color: "#6C757D" }}>Total Aset Biologis:</div>
                  <div style={{ color: "#212529" }}>
                    {biologicalAssets.length} ekor
                  </div>
                </div>
              </div>
              <div
                className="mt-3 pt-3 border-t"
                style={{ borderColor: "#DEE2E6" }}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span style={{ color: "#1B4332" }}>✓</span>
                  <span style={{ color: "#495057" }}>
                    Neraca dihitung dari data jurnal yang nyata
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span style={{ color: "#1B4332" }}>✓</span>
                  <span style={{ color: "#495057" }}>
                    P&L dan rekonsiliasi mengambil sumber yang sama
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <AccountingFlowDiagram />
        <FinancialReconciliation />
      </div>
    </div>
  );
}
