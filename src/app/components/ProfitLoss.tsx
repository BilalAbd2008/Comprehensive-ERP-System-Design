import { useState } from "react";
import { useData } from "../context/DataContext";
import { Download, Eye, Printer, Copy } from "lucide-react";
import {
  downloadPDF,
  previewPDF,
  printReport,
  copyToClipboard,
} from "../utils/reportPrinter";

export default function ProfitLoss() {
  const { journalEntries } = useData();
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const calculateProfitLoss = () => {
    let pendapatanPenjualan = 0;
    let keuntunganNilaiWajar = 0;
    let pendapatanLain = 0;
    let hpp = 0;
    let bebanGaji = 0;
    let bebanPakan = 0;
    let bebanPenyusutan = 0;
    let kerugianNilaiWajar = 0;
    let bebanLain = 0;

    journalEntries.forEach((entry) => {
      if (entry.creditAccount.includes("Pendapatan Penjualan")) {
        pendapatanPenjualan += entry.creditAmount;
      }
      if (entry.creditAccount.includes("Keuntungan Nilai Wajar")) {
        keuntunganNilaiWajar += entry.creditAmount;
      }
      if (entry.creditAccount.includes("Pendapatan Lain-lain")) {
        pendapatanLain += entry.creditAmount;
      }
      if (entry.debitAccount.includes("Harga Pokok Penjualan")) {
        hpp += entry.debitAmount;
      }
      if (entry.debitAccount.includes("Beban Gaji")) {
        bebanGaji += entry.debitAmount;
      }
      if (entry.debitAccount.includes("Beban Pakan")) {
        bebanPakan += entry.debitAmount;
      }
      if (entry.debitAccount.includes("Beban Penyusutan")) {
        bebanPenyusutan += entry.debitAmount;
      }
      if (entry.debitAccount.includes("Kerugian Nilai Wajar")) {
        kerugianNilaiWajar += entry.debitAmount;
      }
      if (entry.debitAccount.includes("Beban Lain-lain")) {
        bebanLain += entry.debitAmount;
      }
    });

    const labaKotor = pendapatanPenjualan - hpp;
    const totalBebanOperasional = bebanGaji + bebanPakan + bebanPenyusutan;
    const labaOperasional = labaKotor - totalBebanOperasional;
    const totalOIOE =
      keuntunganNilaiWajar + pendapatanLain - kerugianNilaiWajar - bebanLain;
    const labaBersih = labaOperasional + totalOIOE;

    return {
      pendapatanPenjualan,
      hpp,
      labaKotor,
      bebanGaji,
      bebanPakan,
      bebanPenyusutan,
      totalBebanOperasional,
      labaOperasional,
      keuntunganNilaiWajar,
      pendapatanLain,
      kerugianNilaiWajar,
      bebanLain,
      totalOIOE,
      labaBersih,
    };
  };

  const pl = calculateProfitLoss();

  const handleDownloadPDF = async () => {
    setIsLoadingPDF(true);
    await downloadPDF("pl-report", "laporan-laba-rugi");
    setIsLoadingPDF(false);
  };

  const handlePreviewPDF = async () => {
    setIsLoadingPDF(true);
    await previewPDF("pl-report");
    setIsLoadingPDF(false);
  };

  const handlePrint = () => {
    printReport("pl-report", "Laporan Laba Rugi - HERS FARM");
  };

  const handleCopy = () => {
    copyToClipboard("pl-report");
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl mb-1" style={{ color: "#1B4332" }}>
            Laporan Laba Rugi (P&L)
          </h1>
          <p className="text-sm" style={{ color: "#6C757D" }}>
            PSAK 241 - Akuntansi Pertanian
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePreviewPDF}
            disabled={isLoadingPDF}
            className="flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors"
            style={{
              backgroundColor: "#1B4332",
              color: "white",
              opacity: isLoadingPDF ? 0.6 : 1,
              cursor: isLoadingPDF ? "not-allowed" : "pointer",
            }}
          >
            <Eye size={16} />
            Preview
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isLoadingPDF}
            className="flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors"
            style={{
              backgroundColor: "#FFB703",
              color: "#212529",
              opacity: isLoadingPDF ? 0.6 : 1,
              cursor: isLoadingPDF ? "not-allowed" : "pointer",
            }}
          >
            <Download size={16} />
            Download
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors"
            style={{
              backgroundColor: "#E7F5E9",
              color: "#1B4332",
            }}
          >
            <Printer size={16} />
            Cetak
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors hover:bg-gray-200"
            style={{
              backgroundColor: "#F8F9FA",
              color: "#495057",
            }}
          >
            <Copy size={16} />
          </button>
        </div>
      </div>

      <div id="pl-report">
        <div
          className="bg-white rounded-lg border overflow-hidden"
          style={{ borderColor: "#DEE2E6" }}
        >
          <div
            className="px-8 py-6 border-b"
            style={{
              backgroundColor: "#1B4332",
              color: "white",
              borderColor: "#DEE2E6",
            }}
          >
            <h2 className="text-xl text-center">HERS FARM</h2>
            <p className="text-base text-center mt-1">Laporan Laba Rugi</p>
            <p className="text-sm text-center mt-1 opacity-90">
              Untuk Tahun yang Berakhir 31 Desember 2025
            </p>
            <p className="text-xs text-center mt-1 opacity-75">
              (Dinyatakan dalam Rupiah, kecuali dinyatakan lain)
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm" style={{ color: "#1B4332" }}>
                  Pendapatan Penjualan
                </span>
                <span className="text-sm" style={{ color: "#212529" }}>
                  {formatCurrency(pl.pendapatanPenjualan)}
                </span>
              </div>
              <div
                className="flex justify-between items-center py-2 border-b"
                style={{ borderColor: "#DEE2E6" }}
              >
                <span className="text-sm pl-4" style={{ color: "#495057" }}>
                  Harga Pokok Penjualan
                </span>
                <span className="text-sm" style={{ color: "#495057" }}>
                  ({formatCurrency(pl.hpp)})
                </span>
              </div>
              <div
                className="flex justify-between items-center py-2 border-b-2"
                style={{ borderColor: "#1B4332" }}
              >
                <span className="text-sm" style={{ color: "#1B4332" }}>
                  Laba Kotor
                </span>
                <span className="text-sm" style={{ color: "#1B4332" }}>
                  {formatCurrency(pl.labaKotor)}
                </span>
              </div>
            </div>

            <div>
              <div className="mb-2" style={{ color: "#495057" }}>
                <span className="text-sm">Beban Operasional:</span>
              </div>
              <div className="flex justify-between items-center py-2 pl-4">
                <span className="text-sm" style={{ color: "#495057" }}>
                  Beban Gaji
                </span>
                <span className="text-sm" style={{ color: "#495057" }}>
                  ({formatCurrency(pl.bebanGaji)})
                </span>
              </div>
              <div
                className="flex justify-between items-center py-2 pl-4"
                style={{ borderColor: "#DEE2E6" }}
              >
                <span className="text-sm" style={{ color: "#495057" }}>
                  Beban Pakan
                </span>
                <span className="text-sm" style={{ color: "#495057" }}>
                  ({formatCurrency(pl.bebanPakan)})
                </span>
              </div>
              <div
                className="flex justify-between items-center py-2 pl-4 border-b"
                style={{ borderColor: "#DEE2E6" }}
              >
                <span className="text-sm" style={{ color: "#495057" }}>
                  Beban Penyusutan
                </span>
                <span className="text-sm" style={{ color: "#495057" }}>
                  ({formatCurrency(pl.bebanPenyusutan)})
                </span>
              </div>
              <div
                className="flex justify-between items-center py-2 border-b"
                style={{ borderColor: "#DEE2E6" }}
              >
                <span className="text-sm" style={{ color: "#1B4332" }}>
                  Total Beban Operasional
                </span>
                <span className="text-sm" style={{ color: "#1B4332" }}>
                  ({formatCurrency(pl.totalBebanOperasional)})
                </span>
              </div>
              <div
                className="flex justify-between items-center py-3 border-b-2"
                style={{ borderColor: "#1B4332" }}
              >
                <span className="text-sm" style={{ color: "#1B4332" }}>
                  Laba Operasional
                </span>
                <span className="text-sm" style={{ color: "#1B4332" }}>
                  {formatCurrency(pl.labaOperasional)}
                </span>
              </div>
            </div>

            <div>
              <div className="mb-2" style={{ color: "#495057" }}>
                <span className="text-sm">
                  Pendapatan & Beban Lain-lain (OIOE):
                </span>
              </div>
              <div
                className="flex justify-between items-center py-2 px-3 rounded"
                style={{ backgroundColor: "#FFF3CD" }}
              >
                <span className="text-sm pl-2" style={{ color: "#856404" }}>
                  Keuntungan Belum Terealisasi - Selisih Nilai Wajar (PSAK 241)
                </span>
                <span className="text-sm" style={{ color: "#856404" }}>
                  {formatCurrency(pl.keuntunganNilaiWajar)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 pl-4">
                <span className="text-sm" style={{ color: "#495057" }}>
                  Pendapatan Lain-lain
                </span>
                <span className="text-sm" style={{ color: "#495057" }}>
                  {formatCurrency(pl.pendapatanLain)}
                </span>
              </div>
              {pl.kerugianNilaiWajar > 0 && (
                <div className="flex justify-between items-center py-2 pl-4">
                  <span className="text-sm" style={{ color: "#495057" }}>
                    Kerugian Nilai Wajar
                  </span>
                  <span className="text-sm" style={{ color: "#495057" }}>
                    ({formatCurrency(pl.kerugianNilaiWajar)})
                  </span>
                </div>
              )}
              {pl.bebanLain > 0 && (
                <div className="flex justify-between items-center py-2 pl-4">
                  <span className="text-sm" style={{ color: "#495057" }}>
                    Beban Lain-lain
                  </span>
                  <span className="text-sm" style={{ color: "#495057" }}>
                    ({formatCurrency(pl.bebanLain)})
                  </span>
                </div>
              )}
              <div
                className="flex justify-between items-center py-2 border-b border-t mt-2"
                style={{ borderColor: "#DEE2E6" }}
              >
                <span className="text-sm" style={{ color: "#1B4332" }}>
                  Total Pendapatan & Beban Lain-lain
                </span>
                <span className="text-sm" style={{ color: "#1B4332" }}>
                  {formatCurrency(pl.totalOIOE)}
                </span>
              </div>
            </div>

            <div
              className="flex justify-between items-center py-4 px-4 rounded border-2"
              style={{
                borderColor: pl.labaBersih >= 0 ? "#1B4332" : "#DC3545",
                backgroundColor: pl.labaBersih >= 0 ? "#E7F5E9" : "#FEE",
              }}
            >
              <span
                className="text-base"
                style={{ color: pl.labaBersih >= 0 ? "#1B4332" : "#DC3545" }}
              >
                {pl.labaBersih >= 0
                  ? "Laba Bersih Tahun Berjalan"
                  : "Rugi Bersih Tahun Berjalan"}
              </span>
              <span
                className="text-base"
                style={{ color: pl.labaBersih >= 0 ? "#1B4332" : "#DC3545" }}
              >
                {formatCurrency(Math.abs(pl.labaBersih))}
              </span>
            </div>
          </div>

          <div
            className="px-8 py-6 border-t"
            style={{ borderColor: "#DEE2E6" }}
          >
            <div className="grid grid-cols-2 gap-8 mt-12">
              <div className="text-center">
                <div
                  className="border-t pt-2 mt-16"
                  style={{ borderColor: "#212529" }}
                >
                  <p className="text-sm" style={{ color: "#212529" }}>
                    Direktur
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div
                  className="border-t pt-2 mt-16"
                  style={{ borderColor: "#212529" }}
                >
                  <p className="text-sm" style={{ color: "#212529" }}>
                    Akuntan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: "#FFF3CD",
              borderLeft: "4px solid #FFB703",
            }}
          >
            <h3 className="text-sm mb-2" style={{ color: "#856404" }}>
              Catatan PSAK 241
            </h3>
            <p className="text-xs" style={{ color: "#856404" }}>
              Hasil 2025 menunjukkan rugi operasional secara kas (karena beban
              gaji dan pakan), namun tumbuh secara nilai aset biologis melalui
              keuntungan nilai wajar yang belum terealisasi.
            </p>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: "#E7F5E9",
              borderLeft: "4px solid #1B4332",
            }}
          >
            <h3 className="text-sm mb-2" style={{ color: "#1B4332" }}>
              Breakdown Laba Bersih
            </h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span style={{ color: "#495057" }}>Laba Operasional:</span>
                <span style={{ color: "#212529" }}>
                  {formatCurrency(pl.labaOperasional)}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#495057" }}>
                  OIOE (Nilai Wajar + Lain-lain):
                </span>
                <span style={{ color: "#212529" }}>
                  {formatCurrency(pl.totalOIOE)}
                </span>
              </div>
              <div
                className="flex justify-between pt-1 border-t"
                style={{ borderColor: "#DEE2E6" }}
              >
                <span style={{ color: "#1B4332" }}>Laba Bersih:</span>
                <span style={{ color: "#1B4332" }}>
                  {formatCurrency(pl.labaBersih)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
