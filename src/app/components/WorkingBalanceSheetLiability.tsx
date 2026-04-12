import { useData } from '../context/DataContext';

export default function WorkingBalanceSheetLiability() {
  const { journalEntries } = useData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calculate balances from GL
  const balances: Record<string, number> = {};
  journalEntries.forEach(entry => {
    if (!balances[entry.debitAccount]) balances[entry.debitAccount] = 0;
    if (!balances[entry.creditAccount]) balances[entry.creditAccount] = 0;
    balances[entry.debitAccount] += entry.debitAmount;
    balances[entry.creditAccount] -= entry.creditAmount;
  });

  // Calculate P&L for Laba Ditahan
  let pendapatan = 0;
  let keuntunganNilaiWajar = 0;
  let pendapatanLain = 0;
  let hpp = 0;
  let bebanGaji = 0;
  let bebanPakan = 0;
  let bebanPenyusutan = 0;
  let bebanLain = 0;

  journalEntries.forEach(entry => {
    if (entry.creditAccount.includes('Pendapatan Penjualan')) pendapatan += entry.creditAmount;
    if (entry.creditAccount.includes('Keuntungan Nilai Wajar')) keuntunganNilaiWajar += entry.creditAmount;
    if (entry.creditAccount.includes('Pendapatan Lain-lain')) pendapatanLain += entry.creditAmount;
    if (entry.debitAccount.includes('HPP')) hpp += entry.debitAmount;
    if (entry.debitAccount.includes('Beban Gaji')) bebanGaji += entry.debitAmount;
    if (entry.debitAccount.includes('Beban Pakan')) bebanPakan += entry.debitAmount;
    if (entry.debitAccount.includes('Beban Penyusutan')) bebanPenyusutan += entry.debitAmount;
    if (entry.debitAccount.includes('Beban Lain-lain')) bebanLain += entry.debitAmount;
  });

  const labaTahunBerjalan = pendapatan + keuntunganNilaiWajar + pendapatanLain - hpp - bebanGaji - bebanPakan - bebanPenyusutan - bebanLain;

  // LIABILITAS
  const hutangUsaha = Math.abs(balances['2-1000 Hutang Usaha'] || 0);
  const totalLiabilitas = hutangUsaha;

  // EKUITAS
  const modalDisetor = Math.abs(balances['3-1000 Modal Disetor'] || 0);
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
                  <div className="grid grid-cols-2 py-1">
                    <span className="text-sm" style={{ color: '#6C757D' }}>Hutang Usaha</span>
                    <span className="text-sm text-right" style={{ color: '#212529' }}>
                      {hutangUsaha > 0 ? formatCurrency(hutangUsaha) : '-'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 pl-4 py-2 border-t mt-2" style={{ borderColor: '#DEE2E6' }}>
                  <span className="text-sm" style={{ color: '#1B4332' }}>Subtotal Liabilitas Jangka Pendek</span>
                  <span className="text-sm text-right" style={{ color: '#1B4332' }}>
                    {formatCurrency(hutangUsaha)}
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
                  <span className="text-sm" style={{ color: '#495057' }}>Modal Saham</span>
                  <span></span>
                </div>

                <div className="pl-4">
                  <div className="grid grid-cols-2 py-1">
                    <span className="text-sm" style={{ color: '#6C757D' }}>Modal Disetor</span>
                    <span className="text-sm text-right" style={{ color: '#212529' }}>
                      {formatCurrency(modalDisetor)}
                    </span>
                  </div>
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
