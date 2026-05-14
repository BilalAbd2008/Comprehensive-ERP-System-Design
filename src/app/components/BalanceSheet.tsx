import { useState } from "react";
import { useData } from "../context/DataContext";
import { Download, Eye, Printer, Copy } from "lucide-react";
import {
  downloadPDF,
  previewPDF,
  printReport,
  copyToClipboard,
} from "../utils/reportPrinter";

export default function BalanceSheet() {
  const { journalEntries } = useData();
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const calculateBalanceSheet = () => {
    const balances: Record<string, number> = {};

    journalEntries.forEach((entry) => {
      if (!balances[entry.debitAccount]) balances[entry.debitAccount] = 0;
      if (!balances[entry.creditAccount]) balances[entry.creditAccount] = 0;

      balances[entry.debitAccount] += entry.debitAmount;
      balances[entry.creditAccount] -= entry.creditAmount;
    });

    const kas = balances["1-1100 Kas"] || 0;
    const bank = balances["1-1200 Bank"] || 0;
    const persediaanPakan = balances["1-2100 Persediaan Pakan"] || 0;
    const asetBiologis = balances["1-3000 Aset Biologis"] || 0;
    const asetTetap = balances["1-4100 Aset Tetap - Kandang"] || 0;
    const akumulasiPenyusutan = Math.abs(
      balances["1-4200 Akumulasi Penyusutan"] || 0,
    );
    const hutangUsaha = Math.abs(balances["2-1000 Hutang Usaha"] || 0);
    const modalDisetor = Math.abs(balances["3-1000 Modal Disetor"] || 0);

    let pendapatan = 0;
    let keuntunganNilaiWajar = 0;
    let pendapatanLain = 0;
    let hpp = 0;
    let bebanGaji = 0;
    let bebanPakan = 0;
    let bebanPenyusutan = 0;
    let bebanLain = 0;

    journalEntries.forEach((entry) => {
      if (entry.creditAccount.includes("Pendapatan Penjualan"))
        pendapatan += entry.creditAmount;
      if (entry.creditAccount.includes("Keuntungan Nilai Wajar"))
        keuntunganNilaiWajar += entry.creditAmount;
      if (entry.creditAccount.includes("Pendapatan Lain-lain"))
        pendapatanLain += entry.creditAmount;
      if (entry.debitAccount.includes("HPP")) hpp += entry.debitAmount;
      if (entry.debitAccount.includes("Beban Gaji"))
        bebanGaji += entry.debitAmount;
      if (entry.debitAccount.includes("Beban Pakan"))
        bebanPakan += entry.debitAmount;
      if (entry.debitAccount.includes("Beban Penyusutan"))
        bebanPenyusutan += entry.debitAmount;
      if (entry.debitAccount.includes("Beban Lain-lain"))
        bebanLain += entry.debitAmount;
    });

    const labaTahunBerjalan =
      pendapatan +
      keuntunganNilaiWajar +
      pendapatanLain -
      hpp -
      bebanGaji -
      bebanPakan -
      bebanPenyusutan -
      bebanLain;
    const labaDitahan = labaTahunBerjalan;

    const totalAsetLancar = kas + bank + persediaanPakan;
    const totalAsetTidakLancar = asetBiologis + asetTetap - akumulasiPenyusutan;
    const totalAset = totalAsetLancar + totalAsetTidakLancar;

    const totalLiabilitas = hutangUsaha;
    const totalEkuitas = modalDisetor + labaDitahan;
    const totalLiabilitasDanEkuitas = totalLiabilitas + totalEkuitas;

    return {
      kas,
      bank,
      persediaanPakan,
      asetBiologis,
      asetTetap,
      akumulasiPenyusutan,
      hutangUsaha,
      modalDisetor,
      labaDitahan,
      labaTahunBerjalan,
      totalAsetLancar,
      totalAsetTidakLancar,
      totalAset,
      totalLiabilitas,
      totalEkuitas,
      totalLiabilitasDanEkuitas,
    };
  };

  const bs = calculateBalanceSheet();

  const handleDownloadPDF = async () => {
    setIsLoadingPDF(true);
    await downloadPDF("balance-sheet-report", "neraca");
    setIsLoadingPDF(false);
  };

  const handlePreviewPDF = async () => {
    setIsLoadingPDF(true);
    await previewPDF("balance-sheet-report");
    setIsLoadingPDF(false);
  };

  const handlePrint = () => {
    printReport("balance-sheet-report", "Laporan Posisi Keuangan - HERS FARM");
  };

  const handleCopy = () => {
    copyToClipboard("balance-sheet-report");
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl mb-1" style={{ color: "#1B4332" }}>
            Laporan Posisi Keuangan (Neraca)
          </h1>
          <p className="text-sm" style={{ color: "#6C757D" }}>
            Formal Auditor - PSAK 241
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
            title="Preview PDF di tab baru"
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
            title="Download sebagai PDF"
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
            title="Cetak langsung"
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
            title="Salin ke clipboard"
          >
            <Copy size={16} />
          </button>
        </div>
      </div>

      <div id="balance-sheet-report">
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
            <p className="text-base text-center mt-1">
              Laporan Posisi Keuangan
            </p>
            <p className="text-sm text-center mt-1 opacity-90">
              Per 31 Desember 2025
            </p>
            <p className="text-xs text-center mt-1 opacity-75">
              (Dinyatakan dalam Rupiah, kecuali dinyatakan lain)
            </p>
          </div>

          <div className="p-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: "#F8F9FA" }}>
                    <th
                      className="px-6 py-4 text-left text-base"
                      style={{
                        color: "#1B4332",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      ASET
                    </th>
                    <th
                      className="px-6 py-4 text-right text-base"
                      style={{ color: "#1B4332" }}
                    >
                      JUMLAH
                    </th>
                    <th
                      className="px-6 py-4 text-left text-base"
                      style={{
                        color: "#1B4332",
                        borderRight: "2px solid #DEE2E6",
                        borderLeft: "2px solid #DEE2E6",
                      }}
                    >
                      LIABILITAS DAN EKUITAS
                    </th>
                    <th
                      className="px-6 py-4 text-right text-base"
                      style={{ color: "#1B4332" }}
                    >
                      JUMLAH
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Aset Lancar */}
                  <tr style={{ backgroundColor: "#E7F5E9" }}>
                    <td
                      className="px-6 py-3 text-sm"
                      style={{
                        color: "#1B4332",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      <strong>ASET LANCAR</strong>
                    </td>
                    <td style={{ borderRight: "2px solid #DEE2E6" }}></td>
                    <td
                      className="px-6 py-3 text-sm"
                      style={{
                        color: "#1B4332",
                        borderLeft: "2px solid #DEE2E6",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      <strong>LIABILITAS LANCAR</strong>
                    </td>
                    <td></td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: "#DEE2E6" }}>
                    <td
                      className="px-6 py-2 pl-10 text-sm"
                      style={{
                        color: "#495057",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      Kas
                    </td>
                    <td
                      className="px-6 py-2 text-sm text-right"
                      style={{
                        color: "#212529",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      {formatCurrency(bs.kas)}
                    </td>
                    <td
                      className="px-6 py-2 pl-10 text-sm"
                      style={{
                        color: "#495057",
                        borderLeft: "2px solid #DEE2E6",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      Hutang Usaha
                    </td>
                    <td
                      className="px-6 py-2 text-sm text-right"
                      style={{ color: "#212529" }}
                    >
                      {formatCurrency(bs.hutangUsaha)}
                    </td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: "#DEE2E6" }}>
                    <td
                      className="px-6 py-2 pl-10 text-sm"
                      style={{
                        color: "#495057",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      Bank
                    </td>
                    <td
                      className="px-6 py-2 text-sm text-right"
                      style={{
                        color: "#212529",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      {formatCurrency(bs.bank)}
                    </td>
                    <td
                      style={{
                        borderLeft: "2px solid #DEE2E6",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    ></td>
                    <td></td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: "#DEE2E6" }}>
                    <td
                      className="px-6 py-2 pl-10 text-sm"
                      style={{
                        color: "#495057",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      Persediaan Pakan
                    </td>
                    <td
                      className="px-6 py-2 text-sm text-right"
                      style={{
                        color: "#212529",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      {formatCurrency(bs.persediaanPakan)}
                    </td>
                    <td
                      className="px-6 py-3 text-sm"
                      style={{
                        color: "#1B4332",
                        borderLeft: "2px solid #DEE2E6",
                        borderRight: "2px solid #DEE2E6",
                        borderTop: "2px solid #DEE2E6",
                      }}
                    >
                      <strong>Total Liabilitas Lancar</strong>
                    </td>
                    <td
                      className="px-6 py-3 text-sm text-right"
                      style={{
                        color: "#1B4332",
                        borderTop: "2px solid #DEE2E6",
                      }}
                    >
                      <strong>{formatCurrency(bs.totalLiabilitas)}</strong>
                    </td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: "#DEE2E6" }}>
                    <td
                      className="px-6 py-3 text-sm"
                      style={{
                        color: "#1B4332",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      <strong>Total Aset Lancar</strong>
                    </td>
                    <td
                      className="px-6 py-3 text-sm text-right"
                      style={{
                        color: "#1B4332",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      <strong>{formatCurrency(bs.totalAsetLancar)}</strong>
                    </td>
                    <td
                      className="px-6 py-3 text-sm"
                      style={{
                        color: "#1B4332",
                        borderLeft: "2px solid #DEE2E6",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      <strong>EKUITAS</strong>
                    </td>
                    <td></td>
                  </tr>

                  {/* Aset Tidak Lancar */}
                  <tr style={{ backgroundColor: "#E7F5E9" }}>
                    <td
                      className="px-6 py-3 text-sm"
                      style={{
                        color: "#1B4332",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      <strong>ASET TIDAK LANCAR</strong>
                    </td>
                    <td style={{ borderRight: "2px solid #DEE2E6" }}></td>
                    <td
                      className="px-6 py-2 pl-10 text-sm"
                      style={{
                        color: "#495057",
                        borderLeft: "2px solid #DEE2E6",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      Modal Disetor
                    </td>
                    <td
                      className="px-6 py-2 text-sm text-right"
                      style={{ color: "#212529" }}
                    >
                      {formatCurrency(bs.modalDisetor)}
                    </td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: "#DEE2E6" }}>
                    <td
                      className="px-6 py-2 pl-10 text-sm"
                      style={{
                        color: "#495057",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      Aset Biologis
                    </td>
                    <td
                      className="px-6 py-2 text-sm text-right"
                      style={{
                        color: "#212529",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      {formatCurrency(bs.asetBiologis)}
                    </td>
                    <td
                      className="px-6 py-2 pl-10 text-sm"
                      style={{
                        color: "#495057",
                        borderLeft: "2px solid #DEE2E6",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      Laba Ditahan
                    </td>
                    <td
                      className="px-6 py-2 text-sm text-right"
                      style={{ color: "#212529" }}
                    >
                      {formatCurrency(bs.labaDitahan)}
                    </td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: "#DEE2E6" }}>
                    <td
                      className="px-6 py-2 pl-10 text-sm"
                      style={{
                        color: "#495057",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      Aset Tetap - Kandang
                    </td>
                    <td
                      className="px-6 py-2 text-sm text-right"
                      style={{
                        color: "#212529",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      {formatCurrency(bs.asetTetap)}
                    </td>
                    <td
                      style={{
                        borderLeft: "2px solid #DEE2E6",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    ></td>
                    <td></td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: "#DEE2E6" }}>
                    <td
                      className="px-6 py-2 pl-10 text-sm"
                      style={{
                        color: "#495057",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      Akumulasi Penyusutan
                    </td>
                    <td
                      className="px-6 py-2 text-sm text-right"
                      style={{
                        color: "#212529",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      ({formatCurrency(bs.akumulasiPenyusutan)})
                    </td>
                    <td
                      className="px-6 py-3 text-sm"
                      style={{
                        color: "#1B4332",
                        borderLeft: "2px solid #DEE2E6",
                        borderRight: "2px solid #DEE2E6",
                        borderTop: "2px solid #DEE2E6",
                      }}
                    >
                      <strong>Total Ekuitas</strong>
                    </td>
                    <td
                      className="px-6 py-3 text-sm text-right"
                      style={{
                        color: "#1B4332",
                        borderTop: "2px solid #DEE2E6",
                      }}
                    >
                      <strong>{formatCurrency(bs.totalEkuitas)}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="px-6 py-3 text-sm"
                      style={{
                        color: "#1B4332",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      <strong>Total Aset Tidak Lancar</strong>
                    </td>
                    <td
                      className="px-6 py-3 text-sm text-right"
                      style={{
                        color: "#1B4332",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      <strong>{formatCurrency(bs.totalAsetTidakLancar)}</strong>
                    </td>
                    <td
                      className="px-6 py-3 text-sm"
                      style={{
                        color: "#1B4332",
                        borderLeft: "2px solid #DEE2E6",
                        borderRight: "2px solid #DEE2E6",
                        borderTop: "2px solid #DEE2E6",
                      }}
                    >
                      <strong>Total Liab & Ekuitas</strong>
                    </td>
                    <td
                      className="px-6 py-3 text-sm text-right"
                      style={{
                        color: "#1B4332",
                        borderTop: "2px solid #DEE2E6",
                      }}
                    >
                      <strong>
                        {formatCurrency(bs.totalLiabilitasDanEkuitas)}
                      </strong>
                    </td>
                  </tr>
                  <tr
                    style={{
                      backgroundColor: "#E7F5E9",
                      borderTop: "2px solid #1B4332",
                      borderBottom: "2px solid #1B4332",
                    }}
                  >
                    <td
                      className="px-6 py-3 text-base"
                      style={{
                        color: "#1B4332",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      <strong>TOTAL ASET</strong>
                    </td>
                    <td
                      className="px-6 py-3 text-base text-right"
                      style={{
                        color: "#1B4332",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    >
                      <strong>{formatCurrency(bs.totalAset)}</strong>
                    </td>
                    <td
                      style={{
                        borderLeft: "2px solid #DEE2E6",
                        borderRight: "2px solid #DEE2E6",
                      }}
                    ></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t" style={{ borderColor: "#DEE2E6" }}>
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div
                className="border-t pt-2 mt-16"
                style={{ borderColor: "#212529" }}
              >
                <p className="text-sm" style={{ color: "#212529" }}>
                  Direktur
                </p>
                <p className="text-xs mt-1" style={{ color: "#6C757D" }}>
                  Hers Farm
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
                <p className="text-xs mt-1" style={{ color: "#6C757D" }}>
                  Kantor Akuntan Publik
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor:
              bs.totalAset === bs.totalLiabilitasDanEkuitas
                ? "#E7F5E9"
                : "#FEE",
            borderLeft: `4px solid ${bs.totalAset === bs.totalLiabilitasDanEkuitas ? "#1B4332" : "#DC3545"}`,
          }}
        >
          <h3
            className="text-sm mb-2"
            style={{
              color:
                bs.totalAset === bs.totalLiabilitasDanEkuitas
                  ? "#1B4332"
                  : "#DC3545",
            }}
          >
            Status Verifikasi
          </h3>
          <p className="text-xs" style={{ color: "#495057" }}>
            {bs.totalAset === bs.totalLiabilitasDanEkuitas
              ? "✓ Neraca Seimbang"
              : "✗ Neraca Tidak Seimbang"}
          </p>
          <p className="text-xs mt-1" style={{ color: "#6C757D" }}>
            Selisih:{" "}
            {formatCurrency(
              Math.abs(bs.totalAset - bs.totalLiabilitasDanEkuitas),
            )}
          </p>
        </div>

        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: "#FFF3CD",
            borderLeft: "4px solid #FFB703",
          }}
        >
          <h3 className="text-sm mb-2" style={{ color: "#856404" }}>
            Total Aset
          </h3>
          <p className="text-base" style={{ color: "#212529" }}>
            {formatCurrency(bs.totalAset)}
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
            Total Liabilitas & Ekuitas
          </h3>
          <p className="text-base" style={{ color: "#212529" }}>
            {formatCurrency(bs.totalLiabilitasDanEkuitas)}
          </p>
        </div>
      </div>
    </div>
  );
}
