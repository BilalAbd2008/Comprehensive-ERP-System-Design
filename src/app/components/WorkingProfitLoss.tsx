import { useData } from '../context/DataContext';

export default function WorkingProfitLoss() {
  const { journalEntries } = useData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calculate from GL
  let pendapatanPenjualan = 0;
  let keuntunganNilaiWajar = 0;
  let pendapatanLain = 0;
  let hpp = 0;
  let bebanGaji = 0;
  let bebanPakan = 0;
  let bebanPenyusutan = 0;
  let bebanLain = 0;

  journalEntries.forEach(entry => {
    if (entry.creditAccount.includes('Pendapatan Penjualan')) pendapatanPenjualan += entry.creditAmount;
    if (entry.creditAccount.includes('Keuntungan Nilai Wajar')) keuntunganNilaiWajar += entry.creditAmount;
    if (entry.creditAccount.includes('Pendapatan Lain-lain')) pendapatanLain += entry.creditAmount;
    if (entry.debitAccount.includes('Harga Pokok Penjualan')) hpp += entry.debitAmount;
    if (entry.debitAccount.includes('Beban Gaji')) bebanGaji += entry.debitAmount;
    if (entry.debitAccount.includes('Beban Pakan')) bebanPakan += entry.debitAmount;
    if (entry.debitAccount.includes('Beban Penyusutan')) bebanPenyusutan += entry.debitAmount;
    if (entry.debitAccount.includes('Beban Lain-lain')) bebanLain += entry.debitAmount;
  });

  const jumlahPendapatanUsaha = pendapatanPenjualan + keuntunganNilaiWajar + pendapatanLain;
  const jumlahBebanPokokPendapatan = hpp;
  const labaKotor = pendapatanPenjualan - hpp;
  const jumlahBebanUsaha = bebanGaji + bebanPakan + bebanPenyusutan;
  const labaUsaha = labaKotor - jumlahBebanUsaha;
  const jumlahPendapatanBebanLainLain = keuntunganNilaiWajar + pendapatanLain - bebanLain;
  const labaBersih = labaUsaha + jumlahPendapatanBebanLainLain;

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
                <div className="grid grid-cols-2 pl-4 py-1">
                  <span className="text-sm" style={{ color: '#6C757D' }}>Penjualan Ternak (Kurban & Aqiqah)</span>
                  <span className="text-sm text-right" style={{ color: '#212529' }}>
                    {formatCurrency(pendapatanPenjualan)}
                  </span>
                </div>
              </div>

              <div className="py-2">
                <div className="grid grid-cols-2 pl-4 py-1 rounded" style={{ backgroundColor: '#FFF3CD' }}>
                  <span className="text-sm" style={{ color: '#856404' }}>Keuntungan Perubahan Nilai Wajar (PSAK 241)</span>
                  <span className="text-sm text-right" style={{ color: '#856404' }}>
                    {formatCurrency(keuntunganNilaiWajar)}
                  </span>
                </div>
              </div>

              <div className="py-2">
                <div className="grid grid-cols-2 mb-1">
                  <span className="text-sm" style={{ color: '#495057' }}>Pendapatan Lain-lain</span>
                  <span></span>
                </div>
                <div className="grid grid-cols-2 pl-4 py-1">
                  <span className="text-sm" style={{ color: '#6C757D' }}>Penjualan Kotoran, Sewa Kandang, dll</span>
                  <span className="text-sm text-right" style={{ color: '#212529' }}>
                    {formatCurrency(pendapatanLain)}
                  </span>
                </div>
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
              <div className="grid grid-cols-2 py-1">
                <span className="text-sm" style={{ color: '#6C757D' }}>Harga Pokok Penjualan</span>
                <span className="text-sm text-right" style={{ color: '#212529' }}>
                  {formatCurrency(jumlahBebanPokokPendapatan)}
                </span>
              </div>
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
              <div className="grid grid-cols-2 py-1">
                <span className="text-sm" style={{ color: '#6C757D' }}>Gaji Karyawan (3 orang)</span>
                <span className="text-sm text-right" style={{ color: '#212529' }}>
                  {formatCurrency(bebanGaji)}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span className="text-sm" style={{ color: '#6C757D' }}>Beban Pakan (yang tidak dikapitalisasi)</span>
                <span className="text-sm text-right" style={{ color: '#212529' }}>
                  {formatCurrency(bebanPakan)}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span className="text-sm" style={{ color: '#6C757D' }}>Beban Penyusutan</span>
                <span className="text-sm text-right" style={{ color: '#212529' }}>
                  {formatCurrency(bebanPenyusutan)}
                </span>
              </div>
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
              <div className="grid grid-cols-2 py-1 px-2 rounded" style={{ backgroundColor: '#FFF3CD' }}>
                <span className="text-sm" style={{ color: '#856404' }}>Keuntungan Perubahan Nilai Wajar (PSAK 241)</span>
                <span className="text-sm text-right" style={{ color: '#856404' }}>
                  {formatCurrency(keuntunganNilaiWajar)}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span className="text-sm" style={{ color: '#6C757D' }}>Pendapatan Lain (Kotoran, Sewa)</span>
                <span className="text-sm text-right" style={{ color: '#212529' }}>
                  {formatCurrency(pendapatanLain)}
                </span>
              </div>
              <div className="grid grid-cols-2 py-1">
                <span className="text-sm" style={{ color: '#6C757D' }}>Beban Lain (Pemeliharaan, Pengobatan)</span>
                <span className="text-sm text-right" style={{ color: '#DC3545' }}>
                  {bebanLain > 0 ? `(${formatCurrency(bebanLain)})` : '-'}
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
