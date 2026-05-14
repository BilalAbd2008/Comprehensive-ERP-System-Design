import { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import { ChevronDown, Download } from "lucide-react";

export default function BukuBesar() {
  const { journalEntries, exportGeneralLedgerCSV, chartOfAccounts } = useData();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<'csv' | 'excel'>('csv');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Extract unique accounts and calculate running balance
  const accountsData = useMemo(() => {
    const accounts: Record<
      string,
      {
        code: string;
        name: string;
        transactions: Array<{
          date: string;
          description: string;
          debit: number;
          credit: number;
          balance: number;
        }>;
        totalDebit: number;
        totalCredit: number;
      }
    > = {};

    // First pass: collect all accounts
    journalEntries.forEach((entry) => {
      const debitCode = entry.debitAccount.split(" ")[0];
      const debitName = entry.debitAccount.slice(
        entry.debitAccount.indexOf(" ") + 1,
      );
      const creditCode = entry.creditAccount.split(" ")[0];
      const creditName = entry.creditAccount.slice(
        entry.creditAccount.indexOf(" ") + 1,
      );

      if (!accounts[entry.debitAccount]) {
        accounts[entry.debitAccount] = {
          code: debitCode,
          name: debitName,
          transactions: [],
          totalDebit: 0,
          totalCredit: 0,
        };
      }
      if (!accounts[entry.creditAccount]) {
        accounts[entry.creditAccount] = {
          code: creditCode,
          name: creditName,
          transactions: [],
          totalDebit: 0,
          totalCredit: 0,
        };
      }
    });

    // Second pass: add transactions with running balance
    Object.keys(accounts).forEach((account) => {
      let balance = 0;
      const transactions: Array<any> = [];

      const relevantEntries = journalEntries
        .filter(
          (e) => e.debitAccount === account || e.creditAccount === account,
        )
        .sort((a, b) => a.date.localeCompare(b.date));

      relevantEntries.forEach((entry) => {
        const debit = entry.debitAccount === account ? entry.debitAmount : 0;
        const credit = entry.creditAccount === account ? entry.creditAmount : 0;

        // Determine balance direction based on account type (1xxx/5xxx = debit balance, 2/3/4xxx = credit balance)
        const isAssetOrExpense =
          account.charAt(0) === "1" || account.charAt(0) === "5";
        if (isAssetOrExpense) {
          balance += debit - credit;
        } else {
          balance -= debit - credit;
        }

        transactions.push({
          date: entry.date,
          description: entry.description,
          debit,
          credit,
          balance,
        });

        accounts[account].totalDebit += debit;
        accounts[account].totalCredit += credit;
      });

      accounts[account].transactions = transactions;
    });

    return accounts;
  }, [journalEntries]);

  const accountList = Object.entries(accountsData).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  const exportCSV = () => {
    let csv = "Buku Besar Laporan\n";
    csv += `Tanggal Export: ${new Date().toLocaleDateString('id-ID')}\n\n`;

    accountList.forEach(([accountCode, account]) => {
      csv += `\n"${account.code} - ${account.name}"\n`;
      csv += `"Tanggal","Deskripsi","Debit","Kredit","Saldo"\n`;

      account.transactions.forEach(trans => {
        csv += `"${trans.date}","${trans.description}","${trans.debit}","${trans.credit}","${trans.balance}"\n`;
      });

      csv += `"TOTAL","${account.name}","${account.totalDebit}","${account.totalCredit}",""\n`;
    });

    // Add summary
    csv += `\n\nRINGKASAN AKUN\n`;
    csv += `"Kode","Nama Akun","Total Debit","Total Kredit","Saldo"\n`;
    accountList.forEach(([accountCode, account]) => {
      const finalBalance = account.transactions.length > 0
        ? account.transactions[account.transactions.length - 1].balance
        : 0;
      csv += `"${account.code}","${account.name}","${account.totalDebit}","${account.totalCredit}","${finalBalance}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `buku-besar-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportExcelSimple = () => {
    // Simple Excel-like CSV format (TSV for better compatibility)
    let tsv = "Buku Besar Laporan\n";
    tsv += `Tanggal Export\t${new Date().toLocaleDateString('id-ID')}\n\n`;

    accountList.forEach(([accountCode, account]) => {
      tsv += `\n${account.code} - ${account.name}\n`;
      tsv += `Tanggal\tDeskripsi\tDebit\tKredit\tSaldo\n`;

      account.transactions.forEach(trans => {
        tsv += `${trans.date}\t${trans.description}\t${trans.debit}\t${trans.credit}\t${trans.balance}\n`;
      });

      tsv += `TOTAL\t${account.name}\t${account.totalDebit}\t${account.totalCredit}\t\n`;
    });

    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `buku-besar-${new Date().toISOString().split('T')[0]}.xls`;
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

      {accountList.length === 0 && (
        <div className="bg-white p-8 rounded-lg border text-center" style={{ borderColor: '#DEE2E6' }}>
          <p style={{ color: '#6C757D' }}>Belum ada data transaksi untuk ditampilkan</p>
        </div>
      )}

      <div className="space-y-4">
        {accountList.map(([accountCode, account], idx) => {
          const isOpen = selectedAccount === accountCode;
          const totalDebit = account.totalDebit;
          const totalCredit = account.totalCredit;
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
                    [{account.code}] {account.name}
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
                          colSpan={2}
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
      {accountList.length > 0 && (
        <div className="mt-8 bg-white p-6 rounded-lg border" style={{ borderColor: "#DEE2E6" }}>
          <h2 className="text-base mb-4 font-semibold" style={{ color: "#1B4332" }}>
            Ringkasan Akun
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#1B4332", color: "white" }}>
                  <th className="px-4 py-2 text-left">Kode</th>
                  <th className="px-4 py-2 text-left">Nama Akun</th>
                  <th className="px-4 py-2 text-right">Total Debit</th>
                  <th className="px-4 py-2 text-right">Total Kredit</th>
                  <th className="px-4 py-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {accountList.map(([accountCode, account]) => {
                  const finalBalance = account.transactions.length > 0
                    ? account.transactions[account.transactions.length - 1].balance
                    : 0;
                  return (
                    <tr key={accountCode} className="border-b" style={{ borderColor: "#DEE2E6" }}>
                      <td className="px-4 py-2" style={{ color: "#495057" }}>
                        {account.code}
                      </td>
                      <td className="px-4 py-2" style={{ color: "#212529" }}>
                        {account.name}
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
    </div>
  );
}
