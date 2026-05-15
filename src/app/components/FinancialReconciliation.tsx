import { useData } from '../context/DataContext';
import {
  calculateProfitLossSummary,
  createBalanceReader,
} from '../utils/financialCalculations';

export default function FinancialReconciliation() {
  const { journalEntries, biologicalAssets, chartOfAccounts } = useData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const {
    pendapatanPenjualan,
    keuntunganNilaiWajar,
    pendapatanLain,
    hpp,
    bebanGaji,
    bebanPakan,
    bebanPenyusutan,
    bebanLain,
    labaBersih,
  } = calculateProfitLossSummary(journalEntries, chartOfAccounts, biologicalAssets);
  const { balanceIncludingChildren, creditBalance, topAccountsByCategory } = createBalanceReader(
    journalEntries,
    chartOfAccounts,
  );

  const totalAsetBiologis = biologicalAssets.reduce(
    (sum, asset) => sum + Number(asset.fairValue || 0),
    0,
  );
  const totalKas = balanceIncludingChildren('1-1100');
  const modalDisetor = creditBalance('3-1000');
  const totalAsetLancar = topAccountsByCategory('asset')
    .filter(
      (account) =>
        (account.code.startsWith('1-1') || account.code.startsWith('1-2')) &&
        !account.code.startsWith('1-3000'),
    )
    .reduce((sum, account) => sum + balanceIncludingChildren(account.code), 0);
  const isAccumulatedDepreciation = (account: { code: string; name: string }) =>
    account.code.startsWith('1-42') ||
    account.name.toLowerCase().includes('akumulasi') ||
    account.name.toLowerCase().includes('penyusutan');
  const totalAsetTetap = topAccountsByCategory('asset')
    .filter(
      (account) =>
        account.code.startsWith('1-4') && !isAccumulatedDepreciation(account),
    )
    .reduce((sum, account) => sum + balanceIncludingChildren(account.code), 0);
  const totalAkumulasiPenyusutan = topAccountsByCategory('asset')
    .filter(
      (account) =>
        account.code.startsWith('1-4') && isAccumulatedDepreciation(account),
    )
    .reduce((sum, account) => sum + Math.abs(balanceIncludingChildren(account.code)), 0);

  const totalAset =
    totalAsetLancar +
    totalAsetBiologis +
    totalAsetTetap -
    totalAkumulasiPenyusutan;

  const totalLiabilitas = creditBalance('2-1000');

  const totalEkuitas = modalDisetor + labaBersih;
  const totalLiabilitasEkuitas = totalLiabilitas + totalEkuitas;

  const isBalanced = Math.abs(totalAset - totalLiabilitasEkuitas) < 1;

  return (
    <div className="bg-white p-6 rounded-lg border" style={{ borderColor: '#DEE2E6' }}>
      <h2 className="text-base mb-4" style={{ color: '#1B4332' }}>
        Rekonsiliasi Laporan Keuangan
      </h2>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#E7F5E9' }}>
            <h3 className="text-sm mb-3" style={{ color: '#1B4332' }}>Laporan Laba Rugi</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span style={{ color: '#495057' }}>Pendapatan Penjualan</span>
                <span style={{ color: '#212529' }}>{formatCurrency(pendapatanPenjualan)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#495057' }}>HPP</span>
                <span style={{ color: '#495057' }}>({formatCurrency(hpp)})</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#495057' }}>Beban Operasional</span>
                <span style={{ color: '#495057' }}>({formatCurrency(bebanGaji + bebanPakan + bebanPenyusutan)})</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#495057' }}>OIOE</span>
                <span style={{ color: '#212529' }}>{formatCurrency(keuntunganNilaiWajar + pendapatanLain - bebanLain)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t" style={{ borderColor: '#1B4332' }}>
                <span style={{ color: '#1B4332' }}>Laba Bersih</span>
                <span style={{ color: '#1B4332' }}>{formatCurrency(labaBersih)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF3CD' }}>
            <h3 className="text-sm mb-3" style={{ color: '#856404' }}>Neraca (Balance Sheet)</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span style={{ color: '#495057' }}>Total Aset</span>
                <span style={{ color: '#212529' }}>{formatCurrency(totalAset)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#495057' }}>Total Liabilitas</span>
                <span style={{ color: '#495057' }}>{formatCurrency(totalLiabilitas)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#495057' }}>Modal Disetor</span>
                <span style={{ color: '#495057' }}>{formatCurrency(modalDisetor)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#495057' }}>Laba Ditahan</span>
                <span style={{ color: '#212529' }}>{formatCurrency(labaBersih)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t" style={{ borderColor: '#856404' }}>
                <span style={{ color: '#856404' }}>Total Liab. + Ekuitas</span>
                <span style={{ color: '#856404' }}>{formatCurrency(totalLiabilitasEkuitas)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="mt-6 p-4 rounded-lg border-2"
        style={{
          borderColor: isBalanced ? '#1B4332' : '#DC3545',
          backgroundColor: isBalanced ? '#E7F5E9' : '#FEE',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm mb-1" style={{ color: isBalanced ? '#1B4332' : '#DC3545' }}>
              {isBalanced ? '✓ Laporan Keuangan Balance' : '✗ Laporan Keuangan Tidak Balance'}
            </h3>
            <p className="text-xs" style={{ color: '#495057' }}>
              Laba Bersih dari P&L ({formatCurrency(labaBersih)}) telah terintegrasi ke Neraca sebagai Laba Ditahan
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs" style={{ color: '#6C757D' }}>Selisih</div>
            <div className="text-sm" style={{ color: isBalanced ? '#1B4332' : '#DC3545' }}>
              {formatCurrency(Math.abs(totalAset - totalLiabilitasEkuitas))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="p-3 rounded" style={{ backgroundColor: '#F8F9FA' }}>
          <div className="text-xs mb-1" style={{ color: '#6C757D' }}>Total Transaksi</div>
          <div className="text-base" style={{ color: '#212529' }}>{journalEntries.length}</div>
        </div>
        <div className="p-3 rounded" style={{ backgroundColor: '#F8F9FA' }}>
          <div className="text-xs mb-1" style={{ color: '#6C757D' }}>Aset Biologis</div>
          <div className="text-base" style={{ color: '#212529' }}>{biologicalAssets.length} ekor</div>
        </div>
        <div className="p-3 rounded" style={{ backgroundColor: '#F8F9FA' }}>
          <div className="text-xs mb-1" style={{ color: '#6C757D' }}>Nilai Aset Biologis</div>
          <div className="text-base" style={{ color: '#212529' }}>{formatCurrency(totalAsetBiologis)}</div>
        </div>
      </div>
    </div>
  );
}
