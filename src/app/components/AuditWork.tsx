import { useData } from '../context/DataContext';

export default function AuditWork() {
  const { journalEntries } = useData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const calculateBalances = () => {
    const balances: Record<string, { debit: number; credit: number; adjustment: number }> = {};

    journalEntries.forEach(entry => {
      if (!balances[entry.debitAccount]) {
        balances[entry.debitAccount] = { debit: 0, credit: 0, adjustment: 0 };
      }
      if (!balances[entry.creditAccount]) {
        balances[entry.creditAccount] = { debit: 0, credit: 0, adjustment: 0 };
      }

      balances[entry.debitAccount].debit += entry.debitAmount;
      balances[entry.creditAccount].credit += entry.creditAmount;
    });

    return balances;
  };

  const balances = calculateBalances();

  const wbsAccounts = Object.entries(balances).filter(([account]) =>
    account.includes('Kas') ||
    account.includes('Bank') ||
    account.includes('Persediaan') ||
    account.includes('Aset') ||
    account.includes('Hutang') ||
    account.includes('Modal')
  );

  const wplAccounts = Object.entries(balances).filter(([account]) =>
    account.includes('Pendapatan') ||
    account.includes('Beban') ||
    account.includes('HPP') ||
    account.includes('Keuntungan') ||
    account.includes('Kerugian')
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl mb-1" style={{ color: '#1B4332' }}>
          Modul Kerja Audit
        </h1>
        <p className="text-sm" style={{ color: '#6C757D' }}>
          Working Balance Sheet (WBS) & Working Profit Loss (WPL)
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#DEE2E6' }}>
          <div className="px-6 py-4" style={{ backgroundColor: '#1B4332', color: 'white' }}>
            <h2 className="text-base">Working Balance Sheet (WBS)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#F8F9FA' }}>
                  <th className="px-4 py-3 text-left text-sm" style={{ color: '#495057' }}>Kode Akun</th>
                  <th className="px-4 py-3 text-left text-sm" style={{ color: '#495057' }}>Nama Akun</th>
                  <th className="px-4 py-3 text-right text-sm" style={{ color: '#495057' }}>Saldo Awal (Debit)</th>
                  <th className="px-4 py-3 text-right text-sm" style={{ color: '#495057' }}>Saldo Awal (Kredit)</th>
                  <th className="px-4 py-3 text-right text-sm" style={{ color: '#495057' }}>Penyesuaian (Debit)</th>
                  <th className="px-4 py-3 text-right text-sm" style={{ color: '#495057' }}>Penyesuaian (Kredit)</th>
                  <th className="px-4 py-3 text-right text-sm" style={{ color: '#495057' }}>Saldo Akhir</th>
                </tr>
              </thead>
              <tbody>
                {wbsAccounts.map(([account, balance]) => {
                  const netBalance = balance.debit - balance.credit;
                  return (
                    <tr
                      key={account}
                      className="border-b transition-colors hover:bg-gray-50"
                      style={{ borderColor: '#DEE2E6' }}
                    >
                      <td className="px-4 py-3 text-sm" style={{ color: '#1B4332' }}>
                        {account.split(' ')[0]}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#212529' }}>
                        {account.split(' ').slice(1).join(' ')}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: '#495057' }}>
                        {balance.debit > 0 ? formatCurrency(balance.debit) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: '#495057' }}>
                        {balance.credit > 0 ? formatCurrency(balance.credit) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: '#6C757D' }}>
                        {formatCurrency(balance.adjustment)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: '#6C757D' }}>
                        {formatCurrency(0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: '#1B4332' }}>
                        {formatCurrency(Math.abs(netBalance))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#DEE2E6' }}>
          <div className="px-6 py-4" style={{ backgroundColor: '#FFB703', color: '#212529' }}>
            <h2 className="text-base">Working Profit Loss (WPL)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#F8F9FA' }}>
                  <th className="px-4 py-3 text-left text-sm" style={{ color: '#495057' }}>Kode Akun</th>
                  <th className="px-4 py-3 text-left text-sm" style={{ color: '#495057' }}>Nama Akun</th>
                  <th className="px-4 py-3 text-right text-sm" style={{ color: '#495057' }}>Saldo Awal (Debit)</th>
                  <th className="px-4 py-3 text-right text-sm" style={{ color: '#495057' }}>Saldo Awal (Kredit)</th>
                  <th className="px-4 py-3 text-right text-sm" style={{ color: '#495057' }}>Penyesuaian (Debit)</th>
                  <th className="px-4 py-3 text-right text-sm" style={{ color: '#495057' }}>Penyesuaian (Kredit)</th>
                  <th className="px-4 py-3 text-right text-sm" style={{ color: '#495057' }}>Saldo Akhir</th>
                </tr>
              </thead>
              <tbody>
                {wplAccounts.map(([account, balance]) => {
                  const netBalance = balance.credit - balance.debit;
                  return (
                    <tr
                      key={account}
                      className="border-b transition-colors hover:bg-gray-50"
                      style={{ borderColor: '#DEE2E6' }}
                    >
                      <td className="px-4 py-3 text-sm" style={{ color: '#1B4332' }}>
                        {account.split(' ')[0]}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#212529' }}>
                        {account.split(' ').slice(1).join(' ')}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: '#495057' }}>
                        {balance.debit > 0 ? formatCurrency(balance.debit) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: '#495057' }}>
                        {balance.credit > 0 ? formatCurrency(balance.credit) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: '#6C757D' }}>
                        {formatCurrency(0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: '#6C757D' }}>
                        {formatCurrency(balance.adjustment)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: '#1B4332' }}>
                        {formatCurrency(Math.abs(netBalance))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#E7F5E9' }}>
        <h3 className="text-sm mb-2" style={{ color: '#1B4332' }}>Catatan Audit</h3>
        <p className="text-xs" style={{ color: '#495057' }}>
          WBS digunakan untuk memetakan saldo akun Neraca (Aset, Liabilitas, Ekuitas) sebelum klasifikasi final.
          WPL digunakan untuk memetakan Pendapatan dan Beban, termasuk penyesuaian pakan yang dikapitalisasi.
        </p>
      </div>
    </div>
  );
}
