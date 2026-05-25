import { useData } from '../context/DataContext';
import {
  calculateProfitLossSummary,
  createBalanceReader,
} from '../utils/financialCalculations';

export default function WorkingProfitLoss() {
  const { journalEntries, chartOfAccounts, biologicalAssets } = useData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const {
    pendapatanLainDenganNilaiWajar,
    bebanLainDenganNilaiWajar,
    operatingRevenueRows,
    costOfRevenueRows,
    operatingExpenseRows,
    otherRevenueRows,
    otherExpenseRows,
    jumlahPendapatanUsaha,
    jumlahBebanPokokPendapatan,
    labaKotor,
    jumlahBebanUsaha,
    labaUsaha,
    jumlahPendapatanBebanLainLain,
    labaBersih,
  } = calculateProfitLossSummary(journalEntries, chartOfAccounts, biologicalAssets);
  const { accountLabel } = createBalanceReader(journalEntries, chartOfAccounts);
  const formatExpense = (value: number) =>
    value > 0 ? `(${formatCurrency(value)})` : '-';

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl mb-1" style={{ color: '#1B4332' }}>
          Working Profit Loss (WPL)
        </h1>
        <p className="text-sm" style={{ color: '#6C757D' }}>
          Kertas Kerja Laba Rugi (Data dari General Ledger)
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
          {/* PENDAPATAN USAHA */}
          <div className="mb-6">
            <div className="py-2 px-3 mb-2" style={{ backgroundColor: '#E7F5E9' }}>
              <span className="text-sm" style={{ color: '#1B4332' }}>PENDAPATAN USAHA</span>
            </div>

            <div className="space-y-1 pl-6">
              <div className="py-2">
                <div className="grid grid-cols-2 mb-1">
                  <span className="text-sm" style={{ color: '#495057' }}>Penjualan</span>
                  <span></span>
                </div>
                {operatingRevenueRows.map((row) => (
                  <div key={row.code} className="grid grid-cols-2 pl-4 py-1">
                    <span className="text-sm" style={{ color: '#6C757D' }}>{row.code} - {row.name}</span>
                    <span className="text-sm text-right" style={{ color: '#212529' }}>
                      {formatCurrency(row.amount)}
                    </span>
                  </div>
                ))}
              </div>

            </div>

            <div className="grid grid-cols-2 py-3 px-3 mt-2" style={{ backgroundColor: '#FFB703' }}>
              <span className="text-sm" style={{ color: '#212529' }}>Jumlah Pendapatan Usaha</span>
              <span className="text-sm text-right" style={{ color: '#212529' }}>
                {formatCurrency(jumlahPendapatanUsaha)}
              </span>
            </div>
          </div>

          {/* BEBAN POKOK PENDAPATAN */}
          <div className="mb-6">
            <div className="py-2 px-3 mb-2" style={{ backgroundColor: '#E7F5E9' }}>
              <span className="text-sm" style={{ color: '#1B4332' }}>BEBAN POKOK PENDAPATAN</span>
            </div>

            <div className="space-y-1 pl-6">
              {costOfRevenueRows.map((row) => (
                <div key={row.code} className="grid grid-cols-2 py-1">
                  <span className="text-sm" style={{ color: '#6C757D' }}>{row.code} - {row.name}</span>
                  <span className="text-sm text-right" style={{ color: '#212529' }}>
                    {formatCurrency(row.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 py-3 px-3 mt-2" style={{ backgroundColor: '#FFB703' }}>
              <span className="text-sm" style={{ color: '#212529' }}>Jumlah Beban Pokok Pendapatan</span>
              <span className="text-sm text-right" style={{ color: '#212529' }}>
                {formatCurrency(jumlahBebanPokokPendapatan)}
              </span>
            </div>
          </div>

          {/* LABA KOTOR */}
          <div className="grid grid-cols-2 py-4 px-4 mb-6 border-2 rounded" style={{ backgroundColor: '#E7F5E9', borderColor: '#1B4332' }}>
            <span className="text-base" style={{ color: '#1B4332' }}>LABA KOTOR</span>
            <span className="text-base text-right" style={{ color: '#1B4332' }}>
              {formatCurrency(labaKotor)}
            </span>
          </div>

          {/* BEBAN USAHA */}
          <div className="mb-6">
            <div className="py-2 px-3 mb-2" style={{ backgroundColor: '#E7F5E9' }}>
              <span className="text-sm" style={{ color: '#1B4332' }}>BEBAN USAHA</span>
            </div>

            <div className="space-y-1 pl-6">
              {operatingExpenseRows.map((row) => (
                <div key={row.code} className="grid grid-cols-2 py-1">
                  <span className="text-sm" style={{ color: '#6C757D' }}>{row.code} - {row.name}</span>
                  <span className="text-sm text-right" style={{ color: '#212529' }}>
                    {formatCurrency(row.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 py-3 px-3 mt-2" style={{ backgroundColor: '#FFB703' }}>
              <span className="text-sm" style={{ color: '#212529' }}>Jumlah Beban Usaha</span>
              <span className="text-sm text-right" style={{ color: '#212529' }}>
                {formatCurrency(jumlahBebanUsaha)}
              </span>
            </div>
          </div>

          {/* LABA USAHA */}
          <div className="grid grid-cols-2 py-4 px-4 mb-6 border-2 rounded" style={{ backgroundColor: '#E7F5E9', borderColor: '#1B4332' }}>
            <span className="text-base" style={{ color: '#1B4332' }}>LABA USAHA</span>
            <span className="text-base text-right" style={{ color: '#1B4332' }}>
              {formatCurrency(labaUsaha)}
            </span>
          </div>

          {/* PENDAPATAN (BEBAN) LAIN-LAIN */}
          <div className="mb-6">
            <div className="py-2 px-3 mb-2" style={{ backgroundColor: '#E7F5E9' }}>
              <span className="text-sm" style={{ color: '#1B4332' }}>PENDAPATAN (BEBAN) LAIN-LAIN</span>
            </div>

            <div className="space-y-1 pl-6">
              {otherRevenueRows.length > 0 && (
                <div className="grid grid-cols-2 py-1">
                <span className="text-sm" style={{ color: '#495057' }}>{accountLabel('4-3000', 'Pendapatan Lain-lain')}</span>
                <span></span>
                </div>
              )}
              {otherRevenueRows.map((row) => (
                <div
                  key={row.code}
                  className="grid grid-cols-2 py-1 pl-4 rounded"
                  style={row.code === '4-2000' ? { backgroundColor: '#FFF3CD' } : undefined}
                >
                  <span className="text-sm" style={{ color: row.code === '4-2000' ? '#856404' : '#6C757D' }}>
                    {row.code} - {row.name}{row.code === '4-2000' ? ' (PSAK 241)' : ''}
                  </span>
                  <span className="text-sm text-right" style={{ color: row.code === '4-2000' ? '#856404' : '#212529' }}>
                    {formatCurrency(row.amount)}
                  </span>
                </div>
              ))}
              {otherExpenseRows.length > 0 && (
                <div className="grid grid-cols-2 py-1">
                <span className="text-sm" style={{ color: '#495057' }}>{accountLabel('5-5000', 'Beban Lain-lain')}</span>
                <span></span>
                </div>
              )}
              {otherExpenseRows.map((row) => (
                <div key={row.code} className="grid grid-cols-2 py-1 pl-4">
                  <span className="text-sm" style={{ color: '#6C757D' }}>{row.code} - {row.name}</span>
                  <span className="text-sm text-right" style={{ color: '#DC3545' }}>
                    {formatExpense(row.amount)}
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-2 py-1 border-t" style={{ borderColor: '#DEE2E6' }}>
                <span className="text-sm" style={{ color: '#6C757D' }}>Subtotal Pendapatan Lain-lain</span>
                <span className="text-sm text-right" style={{ color: '#212529' }}>
                  {formatCurrency(pendapatanLainDenganNilaiWajar)}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span className="text-sm" style={{ color: '#6C757D' }}>Subtotal Beban Lain-lain</span>
                <span className="text-sm text-right" style={{ color: '#DC3545' }}>
                  {bebanLainDenganNilaiWajar > 0 ? `(${formatCurrency(bebanLainDenganNilaiWajar)})` : '-'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 py-3 px-3 mt-2" style={{ backgroundColor: '#FFB703' }}>
              <span className="text-sm" style={{ color: '#212529' }}>Jumlah Pendapatan (Beban) Lain-lain</span>
              <span className="text-sm text-right" style={{ color: '#212529' }}>
                {formatCurrency(jumlahPendapatanBebanLainLain)}
              </span>
            </div>
          </div>

          {/* LABA BERSIH */}
          <div className="grid grid-cols-2 py-4 px-4 border-2 rounded" style={{ backgroundColor: '#1B4332', borderColor: '#1B4332' }}>
            <span className="text-base" style={{ color: 'white' }}>LABA BERSIH / LABA TAHUN BERJALAN</span>
            <span className="text-base text-right" style={{ color: 'white' }}>
              {formatCurrency(labaBersih)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#E7F5E9' }}>
          <h3 className="text-sm mb-2" style={{ color: '#1B4332' }}>Sumber Data</h3>
          <p className="text-xs" style={{ color: '#495057' }}>
            Semua angka di WPL diambil dari General Ledger (GL).
            Setiap transaksi di GL otomatis teragregasi ke WPL ini.
          </p>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF3CD' }}>
          <h3 className="text-sm mb-2" style={{ color: '#856404' }}>Link WPL → Neraca</h3>
          <p className="text-xs" style={{ color: '#856404' }}>
            Laba Bersih dari WPL ({formatCurrency(labaBersih)}) akan menjadi Laba Ditahan di Neraca (WBSL).
            Ini adalah penghubung antara P&L dan Balance Sheet.
          </p>
        </div>
      </div>
    </div>
  );
}
