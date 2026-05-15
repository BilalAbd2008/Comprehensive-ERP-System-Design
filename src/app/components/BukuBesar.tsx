import { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import type { ChartOfAccount, JournalDocument } from "../context/DataContext";
import { ChevronDown, Download } from "lucide-react";

function categoryToKelompok(cat?: ChartOfAccount["category"]): string {
  if (!cat) return "—";
  const map: Record<ChartOfAccount["category"], string> = {
    asset: "Aset",
    liability: "Liabilitas",
    equity: "Ekuitas",
    revenue: "Pendapatan",
    expense: "Beban",
  };
  return map[cat];
}

function resolveCoaMeta(
  code: string,
  parsedNameFromJournal: string,
  coaByCode: Map<string, ChartOfAccount>,
): { namaAkun: string; kelompok: string; keteranganSubAkun: string } {
  const coa = coaByCode.get(code);
  const namaAkun =
    (coa?.name && coa.name.trim()) ||
    parsedNameFromJournal.trim() ||
    code;
  const kelompok = categoryToKelompok(coa?.category);
  let keteranganSubAkun = "";
  if (coa?.parentCode) {
    const parent = coaByCode.get(coa.parentCode);
    const parentLabel = parent
      ? `${parent.name} (${coa.parentCode})`
      : coa.parentCode;
    keteranganSubAkun = `Sub-akun dari ${parentLabel}`;
  }
  return { namaAkun, kelompok, keteranganSubAkun };
}

function parseAccount(account: string) {
  const [code = "", ...nameParts] = account.split(" ");
  return {
    code,
    name: nameParts.join(" ").trim() || code,
  };
}

/** Angka untuk ekspor (format Indonesia, 2 desimal) */
function formatAmountExport(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function sideLabel(side?: JournalDocument["documentSide"]) {
  if (side === "debit") return "Debit";
  if (side === "credit") return "Kredit";
  return "Umum";
}

function documentLabel(doc: JournalDocument) {
  return `${sideLabel(doc.documentSide)}: ${doc.fileName}`;
}

function accountGroupLabel(account?: ChartOfAccount) {
  const name = account?.name.toLowerCase() || "";
  if (account?.category === "asset" && (name.includes("kas") || name.includes("bank"))) {
    return "Cash/Bank";
  }

  const map: Record<ChartOfAccount["category"], string> = {
    asset: "Asset",
    liability: "Liability",
    equity: "Equity",
    revenue: "Revenue",
    expense: "Expense",
  };

  return account ? map[account.category] : "—";
}

function downloadDocument(doc: JournalDocument) {
  const link = document.createElement("a");
  link.href = doc.fileData;
  link.download = doc.fileName;
  link.click();
}

export default function BukuBesar() {
  const { journalEntries, chartOfAccounts, getJournalDocuments } = useData();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedChildAccount, setSelectedChildAccount] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<'csv' | 'excel'>('csv');
  const [previewDocument, setPreviewDocument] = useState<JournalDocument | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const coaByCode = useMemo(() => {
    const m = new Map<string, ChartOfAccount>();
    chartOfAccounts.forEach((a) => m.set(a.code, a));
    return m;
  }, [chartOfAccounts]);

  const isSelfOrDescendant = (candidateCode: string, parentCode: string): boolean => {
    if (candidateCode === parentCode) return true;
    let current = coaByCode.get(candidateCode);
    while (current?.parentCode) {
      if (current.parentCode === parentCode) return true;
      current = coaByCode.get(current.parentCode);
    }
    return false;
  };

  const getAncestorCodes = (code: string) => {
    const codes = [code];
    let current = coaByCode.get(code);
    while (current?.parentCode) {
      codes.push(current.parentCode);
      current = coaByCode.get(current.parentCode);
    }
    return codes;
  };

  const accountLabel = (code: string, fallbackName?: string) => {
    const coa = coaByCode.get(code);
    return `${code} ${coa?.name || fallbackName || code}`;
  };

  // Extract unique accounts and calculate running balance
  const accountsData = useMemo(() => {
    const accounts: Record<
      string,
      {
        code: string;
        name: string;
        namaAkun: string;
        kelompok: string;
        keteranganSubAkun: string;
        transactions: Array<{
          date: string;
          description: string;
          entryId: string;
          chartOfAccount: string;
          accountGroup: string;
          documents: JournalDocument[];
          debit: number;
          credit: number;
          balance: number;
        }>;
        totalDebit: number;
        totalCredit: number;
      }
    > = {};

    // First pass: collect accounts and their parent accounts.
    journalEntries.forEach((entry) => {
      const debit = parseAccount(entry.debitAccount);
      const credit = parseAccount(entry.creditAccount);
      const relatedCodes = Array.from(
        new Set([
          ...getAncestorCodes(debit.code),
          ...getAncestorCodes(credit.code),
        ]),
      );

      relatedCodes.forEach((code) => {
        if (accounts[code]) return;
        accounts[code] = {
          code,
          name: coaByCode.get(code)?.name || (code === debit.code ? debit.name : credit.name),
          namaAkun: "",
          kelompok: "",
          keteranganSubAkun: "",
          transactions: [],
          totalDebit: 0,
          totalCredit: 0,
        };
      });
    });

    // Second pass: add transactions with running balance
    Object.keys(accounts).forEach((accountCode) => {
      const account = accounts[accountCode];
      let balance = 0;
      const transactions: Array<any> = [];

      const relevantEntries = journalEntries
        .filter((entry) => {
          const debitCode = parseAccount(entry.debitAccount).code;
          const creditCode = parseAccount(entry.creditAccount).code;
          return (
            isSelfOrDescendant(debitCode, account.code) ||
            isSelfOrDescendant(creditCode, account.code)
          );
        })
        .sort((a, b) => a.date.localeCompare(b.date));

      relevantEntries.forEach((entry) => {
        const debitAccount = parseAccount(entry.debitAccount);
        const creditAccount = parseAccount(entry.creditAccount);
        const debitBelongs = isSelfOrDescendant(debitAccount.code, account.code);
        const creditBelongs = isSelfOrDescendant(creditAccount.code, account.code);
        const debit = debitBelongs ? entry.debitAmount : 0;
        const credit = creditBelongs ? entry.creditAmount : 0;
        const sourceAccounts = [
          debitBelongs ? debitAccount : undefined,
          creditBelongs ? creditAccount : undefined,
        ].filter(Boolean);
        const chartOfAccount = sourceAccounts
          .map((source) => accountLabel(source!.code, source!.name))
          .join(" / ");
        const accountGroup = Array.from(
          new Set(
            sourceAccounts.map((source) =>
              accountGroupLabel(coaByCode.get(source!.code)),
            ),
          ),
        ).join(" / ");

        // Determine balance direction based on account type (1xxx/5xxx = debit balance, 2/3/4xxx = credit balance)
        const isAssetOrExpense =
          account.code.charAt(0) === "1" || account.code.charAt(0) === "5";
        if (isAssetOrExpense) {
          balance += debit - credit;
        } else {
          balance -= debit - credit;
        }

        transactions.push({
          date: entry.date,
          description: entry.description,
          entryId: entry.id,
          chartOfAccount,
          accountGroup,
          documents: getJournalDocuments(entry.id),
          debit,
          credit,
          balance,
        });

        account.totalDebit += debit;
        account.totalCredit += credit;
      });

      account.transactions = transactions;
    });

    Object.keys(accounts).forEach((key) => {
      const acc = accounts[key];
      const meta = resolveCoaMeta(acc.code, acc.name, coaByCode);
      acc.namaAkun = meta.namaAkun;
      acc.kelompok = meta.kelompok;
      acc.keteranganSubAkun = meta.keteranganSubAkun;
    });

    return accounts;
  }, [journalEntries, coaByCode]);

  const accountList = Object.entries(accountsData).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const visibleParentAccountList = accountList.filter(([code]) => {
    const account = coaByCode.get(code);
    return !account?.parentCode;
  });

  const childAccountList = (parentCode: string) =>
    accountList.filter(([code]) => coaByCode.get(code)?.parentCode === parentCode);

  const cell = (v: string | number) =>
    `"${String(v).replace(/"/g, '""')}"`;

  const exportCSV = () => {
    let csv = "\uFEFF";
    csv += "Buku Besar (General Ledger)\n";
    csv += `Diekspor: ${new Date().toLocaleString("id-ID")}\n`;
    csv +=
      "Setiap baris transaksi memuat nama akun resmi dari Daftar Akun; kolom sub-akun terisi jika akun punya induk di COA.\n";

    const headers = [
      "No. COA",
      "Keterangan (sub-akun / induk)",
      "Nama akun",
      "Kelompok",
      "Tanggal",
      "No. Referensi",
      "Sumber",
      "Chart of Account",
      "Account",
      "Deskripsi",
      "Dokumen Pendukung",
      "Debit",
      "Kredit",
      "Saldo berjalan",
    ];

    accountList.forEach(([, account]) => {
      const finalBalance =
        account.transactions.length > 0
          ? account.transactions[account.transactions.length - 1].balance
          : 0;

      csv += `\n\n`;
      csv += `${cell(`AKUN: ${account.code} — ${account.namaAkun}`)}\n`;
      if (account.keteranganSubAkun) {
        csv += `${cell(account.keteranganSubAkun)}\n`;
      }
      csv += `${headers.map((h) => cell(h)).join(",")}\n`;

      account.transactions.forEach((trans) => {
        csv += [
          cell(account.code),
          cell(account.keteranganSubAkun || "—"),
          cell(account.namaAkun),
          cell(account.kelompok),
          cell(trans.date),
          cell(`JU/${trans.entryId}`),
          cell("Jurnal Umum"),
          cell(trans.chartOfAccount || "—"),
          cell(trans.accountGroup || "—"),
          cell(trans.description),
          cell(trans.documents.map(documentLabel).join("; ") || "—"),
          cell(formatAmountExport(trans.debit)),
          cell(formatAmountExport(trans.credit)),
          cell(formatAmountExport(trans.balance)),
        ].join(",") + "\n";
      });

      csv += [
        cell(account.code),
        cell(""),
        cell(account.namaAkun),
        cell(account.kelompok),
        cell(""),
        cell(""),
        cell(""),
        cell(""),
        cell(""),
        cell("JUMLAH PER AKUN"),
        cell(formatAmountExport(account.totalDebit)),
        cell(formatAmountExport(account.totalCredit)),
        cell(formatAmountExport(finalBalance)),
      ].join(",") + "\n";
    });

    csv += `\n\nRINGKASAN AKUN\n`;
    csv += [
      cell("Kode"),
      cell("Keterangan sub-akun"),
      cell("Nama akun"),
      cell("Kelompok"),
      cell("Total Debit"),
      cell("Total Kredit"),
      cell("Saldo akhir"),
    ].join(",") + "\n";

    accountList.forEach(([, account]) => {
      const finalBalance =
        account.transactions.length > 0
          ? account.transactions[account.transactions.length - 1].balance
          : 0;
      csv += [
        cell(account.code),
        cell(account.keteranganSubAkun || "—"),
        cell(account.namaAkun),
        cell(account.kelompok),
        cell(formatAmountExport(account.totalDebit)),
        cell(formatAmountExport(account.totalCredit)),
        cell(formatAmountExport(finalBalance)),
      ].join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `buku-besar-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const exportExcelSimple = () => {
    const sep = "\t";
    let tsv = "\uFEFF";
    tsv += "Buku Besar (General Ledger)\n";
    tsv += `Diekspor\t${new Date().toLocaleString("id-ID")}\n`;

    const headers = [
      "No. COA",
      "Keterangan (sub-akun / induk)",
      "Nama akun",
      "Kelompok",
      "Tanggal",
      "No. Referensi",
      "Sumber",
      "Chart of Account",
      "Account",
      "Deskripsi",
      "Dokumen Pendukung",
      "Debit",
      "Kredit",
      "Saldo berjalan",
    ];

    accountList.forEach(([, account]) => {
      const finalBalance =
        account.transactions.length > 0
          ? account.transactions[account.transactions.length - 1].balance
          : 0;

      tsv += `\n\nAKUN: ${account.code} — ${account.namaAkun}\n`;
      if (account.keteranganSubAkun) {
        tsv += `${account.keteranganSubAkun}\n`;
      }
      tsv += `${headers.join(sep)}\n`;

      account.transactions.forEach((trans) => {
        tsv += [
          account.code,
          account.keteranganSubAkun || "—",
          account.namaAkun,
          account.kelompok,
          trans.date,
          `JU/${trans.entryId}`,
          "Jurnal Umum",
          trans.chartOfAccount || "—",
          trans.accountGroup || "—",
          trans.description.replace(/\t/g, " "),
          trans.documents.map(documentLabel).join("; ") || "—",
          formatAmountExport(trans.debit),
          formatAmountExport(trans.credit),
          formatAmountExport(trans.balance),
        ].join(sep) + "\n";
      });

      tsv += [
        account.code,
        "",
        account.namaAkun,
        account.kelompok,
        "",
        "",
        "",
        "",
        "",
        "JUMLAH PER AKUN",
        formatAmountExport(account.totalDebit),
        formatAmountExport(account.totalCredit),
        formatAmountExport(finalBalance),
      ].join(sep) + "\n";
    });

    tsv += `\n\nRINGKASAN AKUN\n`;
    tsv += [
      "Kode",
      "Keterangan sub-akun",
      "Nama akun",
      "Kelompok",
      "Total Debit",
      "Total Kredit",
      "Saldo akhir",
    ].join(sep) + "\n";

    accountList.forEach(([, account]) => {
      const finalBalance =
        account.transactions.length > 0
          ? account.transactions[account.transactions.length - 1].balance
          : 0;
      tsv += [
        account.code,
        account.keteranganSubAkun || "—",
        account.namaAkun,
        account.kelompok,
        formatAmountExport(account.totalDebit),
        formatAmountExport(account.totalCredit),
        formatAmountExport(finalBalance),
      ].join(sep) + "\n";
    });

    const blob = new Blob([tsv], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `buku-besar-${new Date().toISOString().split("T")[0]}.xls`;
    link.click();
  };

  const handleExport = () => {
    if (downloadFormat === 'csv') {
      exportCSV();
    } else {
      exportExcelSimple();
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl mb-1" style={{ color: "#1B4332" }}>
            Buku Besar (General Ledger)
          </h1>
          <p className="text-sm" style={{ color: "#6C757D" }}>
            Rincian transaksi per akun dengan running balance
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={downloadFormat}
            onChange={(e) => setDownloadFormat(e.target.value as 'csv' | 'excel')}
            className="px-3 py-2 border rounded text-sm"
            style={{ borderColor: '#DEE2E6' }}
          >
            <option value="csv">CSV Format</option>
            <option value="excel">Excel Format</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#28A745' }}
          >
            <Download size={18} />
            Download {downloadFormat.toUpperCase()}
          </button>
        </div>
      </div>

      {visibleParentAccountList.length === 0 && (
        <div className="bg-white p-8 rounded-lg border text-center" style={{ borderColor: '#DEE2E6' }}>
          <p style={{ color: '#6C757D' }}>Belum ada data transaksi untuk ditampilkan</p>
        </div>
      )}

      <div className="space-y-4">
        {visibleParentAccountList.map(([accountCode, account], idx) => {
          const isOpen = selectedAccount === accountCode;
          const totalDebit = account.totalDebit;
          const totalCredit = account.totalCredit;
          const children = childAccountList(accountCode);
          const finalBalance =
            account.transactions.length > 0
              ? account.transactions[account.transactions.length - 1].balance
              : 0;

          return (
            <div
              key={idx}
              className="bg-white rounded-lg border"
              style={{ borderColor: "#DEE2E6" }}
            >
              {/* Account Header */}
              <button
                onClick={() => setSelectedAccount(isOpen ? null : accountCode)}
                className="w-full px-6 py-4 flex items-center justify-between transition-colors hover:bg-gray-50"
              >
                <div className="flex-1 text-left">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "#1B4332" }}
                  >
                    [{account.code}] {account.namaAkun}
                  </div>
                  {account.keteranganSubAkun ? (
                    <div className="text-xs mt-1" style={{ color: "#6C757D" }}>
                      {account.keteranganSubAkun}
                    </div>
                  ) : null}
                  <div className="text-xs mt-0.5" style={{ color: "#6C757D" }}>
                    Kelompok: {account.kelompok}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <div style={{ color: "#6C757D", fontSize: '0.75rem' }}>Debit</div>
                    <div style={{ color: "#495057", fontWeight: 'bold' }}>
                      {formatCurrency(totalDebit)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ color: "#6C757D", fontSize: '0.75rem' }}>Kredit</div>
                    <div style={{ color: "#495057", fontWeight: 'bold' }}>
                      {formatCurrency(totalCredit)}
                    </div>
                  </div>
                  <div className="text-right min-w-40">
                    <div style={{ color: "#6C757D", fontSize: '0.75rem' }}>Saldo</div>
                    <div style={{
                      color: finalBalance >= 0 ? "#28A745" : "#DC3545",
                      fontWeight: 'bold'
                    }}>
                      {formatCurrency(finalBalance)}
                    </div>
                  </div>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      color: "#1B4332",
                    }}
                  />
                </div>
              </button>

              {/* Account Transactions */}
              {isOpen && (
                <div className="border-t" style={{ borderColor: "#DEE2E6" }}>
                  {children.length > 0 && (
                    <div className="p-4 space-y-3" style={{ backgroundColor: "#F8F9FA" }}>
                      <div className="text-xs font-semibold" style={{ color: "#1B4332" }}>
                        Sub-akun {account.namaAkun}
                      </div>
                      {children.map(([childCode, child]) => {
                        const childOpen = selectedChildAccount === childCode;
                        const childFinalBalance =
                          child.transactions.length > 0
                            ? child.transactions[child.transactions.length - 1].balance
                            : 0;

                        return (
                          <div
                            key={childCode}
                            className="bg-white rounded border"
                            style={{ borderColor: "#DEE2E6" }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedChildAccount(childOpen ? null : childCode)
                              }
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                            >
                              <div className="text-left">
                                <div className="text-sm font-medium" style={{ color: "#1B4332" }}>
                                  [{child.code}] {child.namaAkun}
                                </div>
                                <div className="text-xs mt-0.5" style={{ color: "#6C757D" }}>
                                  Sub-akun dari {account.namaAkun} ({account.code})
                                </div>
                              </div>
                              <div className="flex items-center gap-5 text-sm">
                                <div className="text-right">
                                  <div style={{ color: "#6C757D", fontSize: "0.75rem" }}>Debit</div>
                                  <div style={{ color: "#495057", fontWeight: "bold" }}>
                                    {formatCurrency(child.totalDebit)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div style={{ color: "#6C757D", fontSize: "0.75rem" }}>Kredit</div>
                                  <div style={{ color: "#495057", fontWeight: "bold" }}>
                                    {formatCurrency(child.totalCredit)}
                                  </div>
                                </div>
                                <div className="text-right min-w-36">
                                  <div style={{ color: "#6C757D", fontSize: "0.75rem" }}>Saldo</div>
                                  <div
                                    style={{
                                      color: childFinalBalance >= 0 ? "#28A745" : "#DC3545",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {formatCurrency(childFinalBalance)}
                                  </div>
                                </div>
                                <ChevronDown
                                  size={18}
                                  style={{
                                    transform: childOpen ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s",
                                    color: "#1B4332",
                                  }}
                                />
                              </div>
                            </button>

                            {childOpen && (
                              <div className="border-t overflow-x-auto" style={{ borderColor: "#DEE2E6" }}>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr style={{ backgroundColor: "#F8F9FA" }}>
                                      <th className="px-4 py-2 text-left text-xs" style={{ color: "#495057" }}>Tanggal</th>
                                      <th className="px-4 py-2 text-left text-xs" style={{ color: "#495057" }}>Transaksi</th>
                                      <th className="px-4 py-2 text-right text-xs" style={{ color: "#495057" }}>Debit</th>
                                      <th className="px-4 py-2 text-right text-xs" style={{ color: "#495057" }}>Kredit</th>
                                      <th className="px-4 py-2 text-right text-xs" style={{ color: "#495057" }}>Saldo</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {child.transactions.map((trans, tIdx) => (
                                      <tr key={tIdx} className="border-b" style={{ borderColor: "#DEE2E6" }}>
                                        <td className="px-4 py-2 whitespace-nowrap">{new Date(trans.date).toLocaleDateString("id-ID")}</td>
                                        <td className="px-4 py-2" style={{ color: "#495057" }}>{trans.description}</td>
                                        <td className="px-4 py-2 text-right">{trans.debit > 0 ? formatCurrency(trans.debit) : "-"}</td>
                                        <td className="px-4 py-2 text-right">{trans.credit > 0 ? formatCurrency(trans.credit) : "-"}</td>
                                        <td className="px-4 py-2 text-right font-semibold" style={{ color: trans.balance >= 0 ? "#28A745" : "#DC3545" }}>
                                          {formatCurrency(trans.balance)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "#F8F9FA" }}>
                        <th
                          className="px-6 py-3 text-left text-xs font-semibold"
                          style={{ color: "#495057" }}
                        >
                          Tanggal
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-semibold"
                          style={{ color: "#495057" }}
                        >
                          Transaksi
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-semibold"
                          style={{ color: "#495057" }}
                        >
                          Chart of Account
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-semibold"
                          style={{ color: "#495057" }}
                        >
                          Account
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-semibold"
                          style={{ color: "#495057" }}
                        >
                          Dokumen
                        </th>
                        <th
                          className="px-6 py-3 text-right text-xs font-semibold"
                          style={{ color: "#495057" }}
                        >
                          Debit
                        </th>
                        <th
                          className="px-6 py-3 text-right text-xs font-semibold"
                          style={{ color: "#495057" }}
                        >
                          Kredit
                        </th>
                        <th
                          className="px-6 py-3 text-right text-xs font-semibold"
                          style={{ color: "#495057" }}
                        >
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {account.transactions.map((trans, tIdx) => (
                        <tr
                          key={tIdx}
                          className="border-b transition-colors hover:bg-gray-50"
                          style={{ borderColor: "#DEE2E6" }}
                        >
                          <td
                            className="px-6 py-3 text-sm whitespace-nowrap"
                            style={{ color: "#212529" }}
                          >
                            {new Date(trans.date).toLocaleDateString("id-ID")}
                          </td>
                          <td
                            className="px-6 py-3 text-sm"
                            style={{ color: "#495057" }}
                          >
                            {trans.description}
                          </td>
                          <td
                            className="px-6 py-3 text-xs"
                            style={{ color: "#495057" }}
                          >
                            {trans.chartOfAccount || "-"}
                          </td>
                          <td
                            className="px-6 py-3 text-xs"
                            style={{ color: "#495057" }}
                          >
                            {trans.accountGroup || "-"}
                          </td>
                          <td
                            className="px-6 py-3 text-xs"
                            style={{ color: "#495057" }}
                          >
                            {trans.documents.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {trans.documents.map((doc) => (
                                  <button
                                    key={doc.id}
                                    type="button"
                                    onClick={() => setPreviewDocument(doc)}
                                    className="px-2 py-1 rounded"
                                    style={{ backgroundColor: "#E7F5E9", color: "#1B4332" }}
                                    title={doc.fileName}
                                  >
                                    {sideLabel(doc.documentSide)}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td
                            className="px-6 py-3 text-sm text-right"
                            style={{ color: trans.debit > 0 ? "#212529" : "#6C757D" }}
                          >
                            {trans.debit > 0
                              ? formatCurrency(trans.debit)
                              : "-"}
                          </td>
                          <td
                            className="px-6 py-3 text-sm text-right"
                            style={{ color: trans.credit > 0 ? "#212529" : "#6C757D" }}
                          >
                            {trans.credit > 0
                              ? formatCurrency(trans.credit)
                              : "-"}
                          </td>
                          <td
                            className="px-6 py-3 text-sm text-right font-semibold"
                            style={{ 
                              color: trans.balance >= 0 ? "#28A745" : "#DC3545"
                            }}
                          >
                            {formatCurrency(trans.balance)}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: "#F8F9FA" }}>
                        <td
                          colSpan={5}
                          className="px-6 py-3 text-sm font-semibold"
                          style={{ color: "#1B4332" }}
                        >
                          TOTAL
                        </td>
                        <td
                          className="px-6 py-3 text-sm text-right font-semibold"
                          style={{ color: "#1B4332" }}
                        >
                          {formatCurrency(totalDebit)}
                        </td>
                        <td
                          className="px-6 py-3 text-sm text-right font-semibold"
                          style={{ color: "#1B4332" }}
                        >
                          {formatCurrency(totalCredit)}
                        </td>
                        <td
                          className="px-6 py-3 text-sm text-right font-semibold"
                          style={{ color: "#1B4332" }}
                        >
                          {formatCurrency(finalBalance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Section */}
      {visibleParentAccountList.length > 0 && (
        <div className="mt-8 bg-white p-6 rounded-lg border" style={{ borderColor: "#DEE2E6" }}>
          <h2 className="text-base mb-4 font-semibold" style={{ color: "#1B4332" }}>
            Ringkasan Akun
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#1B4332", color: "white" }}>
                  <th className="px-4 py-2 text-left">Kode</th>
                  <th className="px-4 py-2 text-left">Sub-akun</th>
                  <th className="px-4 py-2 text-left">Nama Akun</th>
                  <th className="px-4 py-2 text-left">Kelompok</th>
                  <th className="px-4 py-2 text-right">Total Debit</th>
                  <th className="px-4 py-2 text-right">Total Kredit</th>
                  <th className="px-4 py-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {visibleParentAccountList.map(([accountCode, account]) => {
                  const finalBalance = account.transactions.length > 0
                    ? account.transactions[account.transactions.length - 1].balance
                    : 0;
                  return (
                    <tr key={accountCode} className="border-b" style={{ borderColor: "#DEE2E6" }}>
                      <td className="px-4 py-2" style={{ color: "#495057" }}>
                        {account.code}
                      </td>
                      <td className="px-4 py-2 text-xs" style={{ color: "#6C757D" }}>
                        {account.keteranganSubAkun || "—"}
                      </td>
                      <td className="px-4 py-2" style={{ color: "#212529" }}>
                        {account.namaAkun}
                      </td>
                      <td className="px-4 py-2 text-xs" style={{ color: "#495057" }}>
                        {account.kelompok}
                      </td>
                      <td className="px-4 py-2 text-right" style={{ color: "#212529" }}>
                        {formatCurrency(account.totalDebit)}
                      </td>
                      <td className="px-4 py-2 text-right" style={{ color: "#212529" }}>
                        {formatCurrency(account.totalCredit)}
                      </td>
                      <td
                        className="px-4 py-2 text-right font-semibold"
                        style={{ color: finalBalance >= 0 ? "#28A745" : "#DC3545" }}
                      >
                        {formatCurrency(finalBalance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="bg-white rounded-lg border w-full max-w-4xl max-h-[90vh] overflow-hidden" style={{ borderColor: "#DEE2E6" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#DEE2E6" }}>
              <div>
                <h2 className="text-base" style={{ color: "#1B4332" }}>{previewDocument.fileName}</h2>
                <p className="text-xs" style={{ color: "#6C757D" }}>
                  Dokumen {sideLabel(previewDocument.documentSide)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => downloadDocument(previewDocument)}
                  className="px-3 py-2 rounded text-white text-sm"
                  style={{ backgroundColor: "#1B4332" }}
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDocument(null)}
                  className="px-3 py-2 rounded text-sm"
                  style={{ backgroundColor: "#E9ECEF", color: "#495057" }}
                >
                  Tutup
                </button>
              </div>
            </div>
            <div className="p-5 overflow-auto" style={{ maxHeight: "72vh" }}>
              {previewDocument.fileType.startsWith("image/") ? (
                <img
                  src={previewDocument.fileData}
                  alt={previewDocument.fileName}
                  className="max-w-full mx-auto"
                />
              ) : (
                <iframe
                  src={previewDocument.fileData}
                  title={previewDocument.fileName}
                  className="w-full h-[65vh] border rounded"
                  style={{ borderColor: "#DEE2E6" }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
