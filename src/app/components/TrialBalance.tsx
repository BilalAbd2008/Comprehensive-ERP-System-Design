import { useState } from "react";
import { useData } from "../context/DataContext";
import { Download, Eye, Printer, Copy } from "lucide-react";
import {
  accountCode,
  accountNameFromJournal,
  calculateBalancesByCode,
  buildCoaMaps,
} from "../utils/financialCalculations";
import {
  downloadPDF,
  previewPDF,
  printReport,
  copyToClipboard,
} from "../utils/reportPrinter";

export default function TrialBalance() {
  const { journalEntries, chartOfAccounts } = useData();
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const calculateTrialBalance = () => {
    const balances = calculateBalancesByCode(journalEntries);
    const { byCode } = buildCoaMaps(chartOfAccounts);
    const fallbackNames = new Map<string, string>();

    journalEntries.forEach((entry) => {
      fallbackNames.set(
        accountCode(entry.debitAccount),
        accountNameFromJournal(entry.debitAccount),
      );
      fallbackNames.set(
        accountCode(entry.creditAccount),
        accountNameFromJournal(entry.creditAccount),
      );
    });

    return Object.entries(balances)
      .map(([code, balance]) => ({
        code,
        name: byCode.get(code)?.name || fallbackNames.get(code) || code,
        debit: balance >= 0 ? balance : 0,
        credit: balance < 0 ? Math.abs(balance) : 0,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  };

  const trialBalance = calculateTrialBalance();
  const totalDebit = trialBalance.reduce((sum, acc) => sum + acc.debit, 0);
  const totalCredit = trialBalance.reduce((sum, acc) => sum + acc.credit, 0);
  const isBalanced = totalDebit === totalCredit;

  const handleDownloadPDF = async () => {
    setIsLoadingPDF(true);
    await downloadPDF("tb-report", "neraca-saldo");
    setIsLoadingPDF(false);
  };

  const handlePreviewPDF = async () => {
    setIsLoadingPDF(true);
    await previewPDF("tb-report");
    setIsLoadingPDF(false);
  };

  const handlePrint = () => {
    printReport("tb-report", "Neraca Saldo - HERS FARM");
  };

  const handleCopy = () => {
    copyToClipboard("tb-report");
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl mb-1" style={{ color: "#1B4332" }}>
            Neraca Saldo (Trial Balance)
          </h1>
          <p className="text-sm" style={{ color: "#6C757D" }}>
            Ringkasan dari WBS & WPL - Per{" "}
            {new Date().toLocaleDateString("id-ID")}
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

      <div id="tb-report">
        <div
          className="bg-white rounded-lg border overflow-hidden"
          style={{ borderColor: "#DEE2E6" }}
        >
          <div
            className="px-6 py-4 border-b"
            style={{
              backgroundColor: "#1B4332",
              color: "white",
              borderColor: "#DEE2E6",
            }}
          >
            <h2 className="text-lg text-center">HERS FARM</h2>
            <p className="text-sm text-center opacity-90">Neraca Saldo</p>
            <p className="text-xs text-center opacity-75">
              Per 31 Desember 2025
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#F8F9FA" }}>
                  <th
                    className="px-6 py-4 text-left text-sm"
                    style={{ color: "#495057" }}
                  >
                    Kode Akun
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm"
                    style={{ color: "#495057" }}
                  >
                    Nama Akun
                  </th>
                  <th
                    className="px-6 py-4 text-right text-sm"
                    style={{ color: "#495057" }}
                  >
                    Debit
                  </th>
                  <th
                    className="px-6 py-4 text-right text-sm"
                    style={{ color: "#495057" }}
                  >
                    Kredit
                  </th>
                </tr>
              </thead>
              <tbody>
                {trialBalance.map((account, idx) => (
                  <tr
                    key={idx}
                    className="border-b transition-colors hover:bg-gray-50"
                    style={{ borderColor: "#DEE2E6" }}
                  >
                    <td
                      className="px-6 py-3 text-sm"
                      style={{ color: "#1B4332" }}
                    >
                      {account.code}
                    </td>
                    <td
                      className="px-6 py-3 text-sm"
                      style={{ color: "#212529" }}
                    >
                      {account.name}
                    </td>
                    <td
                      className="px-6 py-3 text-sm text-right"
                      style={{ color: "#495057" }}
                    >
                      {account.debit > 0 ? formatCurrency(account.debit) : "-"}
                    </td>
                    <td
                      className="px-6 py-3 text-sm text-right"
                      style={{ color: "#495057" }}
                    >
                      {account.credit > 0
                        ? formatCurrency(account.credit)
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "#1B4332", color: "white" }}>
                  <td colSpan={2} className="px-6 py-4 text-sm">
                    Total
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {formatCurrency(totalDebit)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {formatCurrency(totalCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div
            className="px-6 py-4"
            style={{
              backgroundColor: isBalanced ? "#E7F5E9" : "#FEE",
              color: isBalanced ? "#1B4332" : "#DC3545",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {isBalanced
                  ? "✓ Neraca Seimbang (Balanced)"
                  : "✗ Neraca Tidak Seimbang"}
              </span>
              <span className="text-sm">
                Selisih: {formatCurrency(Math.abs(totalDebit - totalCredit))}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: "#E7F5E9" }}
          >
            <h3 className="text-sm mb-2" style={{ color: "#1B4332" }}>
              Total Debit
            </h3>
            <p className="text-2xl" style={{ color: "#1B4332" }}>
              {formatCurrency(totalDebit)}
            </p>
          </div>
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: "#FFF3CD" }}
          >
            <h3 className="text-sm mb-2" style={{ color: "#856404" }}>
              Total Kredit
            </h3>
            <p className="text-2xl" style={{ color: "#856404" }}>
              {formatCurrency(totalCredit)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
