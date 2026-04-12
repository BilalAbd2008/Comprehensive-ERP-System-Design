import { useData } from '../context/DataContext';

export default function TrialBalance() {
  const { journalEntries } = useData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const calculateTrialBalance = () => {
    const balances: Record<string, { debit: number; credit: number }> = {};

    journalEntries.forEach(entry => {
      if (!balances[entry.debitAccount]) {
        balances[entry.debitAccount] = { debit: 0, credit: 0 };
      }
      if (!balances[entry.creditAccount]) {
        balances[entry.creditAccount] = { debit: 0, credit: 0 };
      }

      balances[entry.debitAccount].debit += entry.debitAmount;
      balances[entry.creditAccount].credit += entry.creditAmount;
    });

    return Object.entries(balances)
      .map(([account, balance]) => ({
        code: account.split(' ')[0],
        name: account.split(' ').slice(1).join(' '),
        debit: balance.debit,
        credit: balance.credit,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  };

  const trialBalance = calculateTrialBalance();
  const totalDebit = trialBalance.reduce((sum, acc) => sum + acc.debit, 0);
  const totalCredit = trialBalance.reduce((sum, acc) => sum + acc.credit, 0);
  const isBalanced = totalDebit === totalCredit;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl mb-1" style={{ color: '#1B4332' }}>
          Neraca Saldo (Trial Balance)
        </h1>
        <p className="text-sm" style={{ color: '#6C757D' }}>
          Ringkasan dari WBS & WPL - Per {new Date().toLocaleDateString('id-ID')}
        </p>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#DEE2E6' }}>
        <div className="px-6 py-4 border-b" style={{ backgroundColor: '#1B4332', color: 'white', borderColor: '#DEE2E6' }}>
          <h2 className="text-lg text-center">HERS FARM</h2>
          <p className="text-sm text-center opacity-90">Neraca Saldo</p>
          <p className="text-xs text-center opacity-75">Per 31 Desember 2025</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#F8F9FA' }}>
                <th className="px-6 py-4 text-left text-sm" style={{ color: '#495057' }}>Kode Akun</th>
                <th className="px-6 py-4 text-left text-sm" style={{ color: '#495057' }}>Nama Akun</th>
                <th className="px-6 py-4 text-right text-sm" style={{ color: '#495057' }}>Debit</th>
                <th className="px-6 py-4 text-right text-sm" style={{ color: '#495057' }}>Kredit</th>
              </tr>
            </thead>
            <tbody>
              {trialBalance.map((account, idx) => (
                <tr
                  key={idx}
                  className="border-b transition-colors hover:bg-gray-50"
                  style={{ borderColor: '#DEE2E6' }}
                >
                  <td className="px-6 py-3 text-sm" style={{ color: '#1B4332' }}>
                    {account.code}
                  </td>
                  <td className="px-6 py-3 text-sm" style={{ color: '#212529' }}>
                    {account.name}
                  </td>
                  <td className="px-6 py-3 text-sm text-right" style={{ color: '#495057' }}>
                    {account.debit > 0 ? formatCurrency(account.debit) : '-'}
                  </td>
                  <td className="px-6 py-3 text-sm text-right" style={{ color: '#495057' }}>
                    {account.credit > 0 ? formatCurrency(account.credit) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#1B4332', color: 'white' }}>
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
            backgroundColor: isBalanced ? '#E7F5E9' : '#FEE',
            color: isBalanced ? '#1B4332' : '#DC3545',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {isBalanced ? '✓ Neraca Seimbang (Balanced)' : '✗ Neraca Tidak Seimbang'}
            </span>
            <span className="text-sm">
              Selisih: {formatCurrency(Math.abs(totalDebit - totalCredit))}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#E7F5E9' }}>
          <h3 className="text-sm mb-2" style={{ color: '#1B4332' }}>Total Debit</h3>
          <p className="text-2xl" style={{ color: '#1B4332' }}>{formatCurrency(totalDebit)}</p>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF3CD' }}>
          <h3 className="text-sm mb-2" style={{ color: '#856404' }}>Total Kredit</h3>
          <p className="text-2xl" style={{ color: '#856404' }}>{formatCurrency(totalCredit)}</p>
        </div>
      </div>
    </div>
  );
}
