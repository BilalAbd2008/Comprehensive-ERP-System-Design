import { useData } from '../context/DataContext';
import {
  calculateProfitLossSummary,
  createBalanceReader,
} from '../utils/financialCalculations';

export default function WorkingBalanceSheetLiability() {
  const { journalEntries, chartOfAccounts, biologicalAssets } = useData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const {
    childrenOf,
    topAccountsByCategory,
    creditBalance,
  } = createBalanceReader(journalEntries, chartOfAccounts);
  const { labaBersih: labaTahunBerjalan } = calculateProfitLossSummary(
    journalEntries,
    chartOfAccounts,
    biologicalAssets,
  );

  const liabilityAccounts = topAccountsByCategory('liability');
  const equityCapitalAccounts = topAccountsByCategory('equity').filter(
    (account) => account.code !== '3-2000',
  );

  // LIABILITAS
  const totalLiabilitas = liabilityAccounts.reduce(
    (sum, account) => sum + creditBalance(account.code),
    0,
  );

  // EKUITAS
  const modalDisetor = equityCapitalAccounts.reduce(
    (sum, account) => sum + creditBalance(account.code),
    0,
  );
  const labaDitahan = labaTahunBerjalan;
  const totalEkuitas = modalDisetor + labaDitahan;

  const totalLiabilitasEkuitas = totalLiabilitas + totalEkuitas;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl mb-1" style={{ color: '#1B4332' }}>
          Working Balance Sheet - Liabilitas & Ekuitas (WBSL)
        </h1>
        <p className="text-sm" style={{ color: '#6C757D' }}>
          Kertas Kerja Neraca - Sisi Liabilitas & Ekuitas (Data dari General Ledger)
        </p>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#DEE2E6' }}>
        <div className="px-6 py-4" style={{ backgroundColor: '#1B4332', color: 'white' }}>
          <div className="grid grid-cols-2">
            <div className="text-base">Keterangan</div>
            <div className="text-base text-right">Daily 2025</div>
          </div>
        </div>

        <div className="p-6">
          {/* LIABILITAS */}
          <div className="mb-6">
            <div className="py-2 px-3 mb-2" style={{ backgroundColor: '#E7F5E9' }}>
              <span className="text-sm" style={{ color: '#1B4332' }}>LIABILITAS</span>
            </div>

            <div className="space-y-1 pl-6">
              <div className="py-2">
                <div className="grid grid-cols-2 mb-2">
                  <span className="text-sm" style={{ color: '#495057' }}>Liabilitas Jangka Pendek</span>
                  <span></span>
                </div>

                <div className="pl-4">
                  {liabilityAccounts.length > 0 ? (
                    liabilityAccounts.map((account) => {
                      const parentAmount = creditBalance(account.code);
                      const children = childrenOf(account.code);
                      return (
                        <div key={account.code} className="mb-2">
                          <div className="grid grid-cols-2 py-1">
                            <span className="text-sm" style={{ color: '#6C757D' }}>
                              {account.name}
                            </span>
                            <span className="text-sm text-right" style={{ color: '#212529' }}>
                              {parentAmount > 0 ? formatCurrency(parentAmount) : '-'}
                            </span>
                          </div>
                          {children.map((child) => {
                            const amount = creditBalance(child.code);
                            return (
                              <div key={child.code} className="grid grid-cols-2 pl-4 py-1">
                                <span className="text-xs" style={{ color: '#6C757D' }}>
                                  {child.code} - {child.name}
                                </span>
                                <span className="text-xs text-right" style={{ color: '#212529' }}>
                                  {amount > 0 ? formatCurrency(amount) : '-'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  ) : (
                    <div className="grid grid-cols-2 py-1">
                      <span className="text-sm" style={{ color: '#6C757D' }}>Belum ada akun liabilitas</span>
                      <span className="text-sm text-right" style={{ color: '#212529' }}>-</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 pl-4 py-2 border-t mt-2" style={{ borderColor: '#DEE2E6' }}>
                  <span className="text-sm" style={{ color: '#1B4332' }}>Subtotal Liabilitas Jangka Pendek</span>
                  <span className="text-sm text-right" style={{ color: '#1B4332' }}>
                    {formatCurrency(totalLiabilitas)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 py-3 px-3 mt-2" style={{ backgroundColor: '#FFB703' }}>
              <span className="text-sm" style={{ color: '#212529' }}>Jumlah Liabilitas</span>
              <span className="text-sm text-right" style={{ color: '#212529' }}>
                {formatCurrency(totalLiabilitas)}
              </span>
            </div>
          </div>

          {/* EKUITAS */}
          <div className="mb-6">
            <div className="py-2 px-3 mb-2" style={{ backgroundColor: '#E7F5E9' }}>
              <span className="text-sm" style={{ color: '#1B4332' }}>EKUITAS</span>
            </div>

            <div className="space-y-1 pl-6">
              <div className="py-2">
                <div className="grid grid-cols-2 mb-2">
                  <span className="text-sm" style={{ color: '#495057' }}>Modal & Setoran Pemilik</span>
                  <span></span>
                </div>

                <div className="pl-4">
                  {equityCapitalAccounts.length > 0 ? (
                    equityCapitalAccounts.map((account) => {
                      const parentAmount = creditBalance(account.code);
                      const children = childrenOf(account.code);
                      return (
                        <div key={account.code} className="mb-2">
                          <div className="grid grid-cols-2 py-1">
                            <span className="text-sm" style={{ color: '#6C757D' }}>
                              {account.name}
                            </span>
                            <span className="text-sm text-right" style={{ color: '#212529' }}>
                              {formatCurrency(parentAmount)}
                            </span>
                          </div>
                          {children.map((child) => {
                            const amount = creditBalance(child.code);
                            return (
                              <div key={child.code} className="grid grid-cols-2 pl-4 py-1">
                                <span className="text-xs" style={{ color: '#6C757D' }}>
                                  {child.code} - {child.name}
                                </span>
                                <span className="text-xs text-right" style={{ color: '#212529' }}>
                                  {formatCurrency(amount)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  ) : (
                    <div className="grid grid-cols-2 py-1">
                      <span className="text-sm" style={{ color: '#6C757D' }}>Belum ada akun ekuitas</span>
                      <span className="text-sm text-right" style={{ color: '#212529' }}>-</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="py-2">
                <div className="grid grid-cols-2 mb-2">
                  <span className="text-sm" style={{ color: '#495057' }}>Saldo Laba</span>
                  <span></span>
                </div>

                <div className="pl-4 space-y-1">
                  <div className="grid grid-cols-2 py-1">
                    <span className="text-sm" style={{ color: '#6C757D' }}>
                      {labaDitahan >= 0 ? 'Laba Ditahan' : 'Rugi Ditahan'}
                    </span>
                    <span className="text-sm text-right" style={{ color: labaDitahan >= 0 ? '#1B4332' : '#DC3545' }}>
                      {labaDitahan >= 0 ? formatCurrency(labaDitahan) : `(${formatCurrency(Math.abs(labaDitahan))})`}
                    </span>
                  </div>
                  <div className="pl-4 py-1 rounded text-xs" style={{ backgroundColor: '#FFF3CD' }}>
                    <div className="flex justify-between">
                      <span style={{ color: '#856404' }}>↳ Dari Laba Bersih WPL:</span>
                      <span style={{ color: '#856404' }}>{formatCurrency(labaTahunBerjalan)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 pl-4 py-2 border-t mt-2" style={{ borderColor: '#DEE2E6' }}>
                  <span className="text-sm" style={{ color: '#1B4332' }}>Total Saldo Laba</span>
                  <span className="text-sm text-right" style={{ color: '#1B4332' }}>
                    {formatCurrency(labaDitahan)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 py-3 px-3 mt-2" style={{ backgroundColor: '#FFB703' }}>
              <span className="text-sm" style={{ color: '#212529' }}>Jumlah Ekuitas</span>
              <span className="text-sm text-right" style={{ color: '#212529' }}>
                {formatCurrency(totalEkuitas)}
              </span>
            </div>
          </div>

          {/* TOTAL LIABILITAS & EKUITAS */}
          <div className="grid grid-cols-2 py-4 px-4 border-2 rounded" style={{ backgroundColor: '#1B4332', borderColor: '#1B4332' }}>
            <span className="text-base" style={{ color: 'white' }}>JUMLAH LIABILITAS & EKUITAS</span>
            <span className="text-base text-right" style={{ color: 'white' }}>
              {formatCurrency(totalLiabilitasEkuitas)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#FFF3CD' }}>
        <h3 className="text-sm mb-2" style={{ color: '#856404' }}>Link WPL → WBSL</h3>
        <p className="text-xs" style={{ color: '#856404' }}>
          Laba Ditahan di WBSL berasal dari Laba Bersih di WPL (Working Profit Loss).
          Ini memastikan integrasi antara Laporan Laba Rugi dan Neraca sesuai prinsip akuntansi.
        </p>
      </div>
    </div>
  );
}
