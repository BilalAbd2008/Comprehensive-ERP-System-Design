import { useData } from '../context/DataContext';

export default function BalanceSheet() {
  const { journalEntries } = useData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const calculateBalanceSheet = () => {
    const balances: Record<string, number> = {};

    journalEntries.forEach(entry => {
      if (!balances[entry.debitAccount]) balances[entry.debitAccount] = 0;
      if (!balances[entry.creditAccount]) balances[entry.creditAccount] = 0;

      balances[entry.debitAccount] += entry.debitAmount;
      balances[entry.creditAccount] -= entry.creditAmount;
    });

    const kas = balances['1-1100 Kas'] || 0;
    const bank = balances['1-1200 Bank'] || 0;
    const persediaanPakan = balances['1-2100 Persediaan Pakan'] || 0;
    const asetBiologis = balances['1-3000 Aset Biologis'] || 0;
    const asetTetap = balances['1-4100 Aset Tetap - Kandang'] || 0;
    const akumulasiPenyusutan = Math.abs(balances['1-4200 Akumulasi Penyusutan'] || 0);
    const hutangUsaha = Math.abs(balances['2-1000 Hutang Usaha'] || 0);
    const modalDisetor = Math.abs(balances['3-1000 Modal Disetor'] || 0);

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
    const labaDitahan = labaTahunBerjalan;

    const totalAsetLancar = kas + bank + persediaanPakan;
    const totalAsetTidakLancar = asetBiologis + asetTetap - akumulasiPenyusutan;
    const totalAset = totalAsetLancar + totalAsetTidakLancar;

    const totalLiabilitas = hutangUsaha;
    const totalEkuitas = modalDisetor + labaDitahan;
    const totalLiabilitasDanEkuitas = totalLiabilitas + totalEkuitas;

    return {
      kas,
      bank,
      persediaanPakan,
      asetBiologis,
      asetTetap,
      akumulasiPenyusutan,
      hutangUsaha,
      modalDisetor,
      labaDitahan,
      labaTahunBerjalan,
      totalAsetLancar,
      totalAsetTidakLancar,
      totalAset,
      totalLiabilitas,
      totalEkuitas,
      totalLiabilitasDanEkuitas,
    };
  };

  const bs = calculateBalanceSheet();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl mb-1" style={{ color: '#1B4332' }}>
          Laporan Posisi Keuangan (Neraca)
        </h1>
        <p className="text-sm" style={{ color: '#6C757D' }}>
          Formal Auditor - PSAK 241
        </p>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#DEE2E6' }}>
        <div className="px-8 py-6 border-b" style={{ backgroundColor: '#1B4332', color: 'white', borderColor: '#DEE2E6' }}>
          <h2 className="text-xl text-center">HERS FARM</h2>
          <p className="text-base text-center mt-1">Laporan Posisi Keuangan</p>
          <p className="text-sm text-center mt-1 opacity-90">Per 31 Desember 2025</p>
          <p className="text-xs text-center mt-1 opacity-75">(Dinyatakan dalam Rupiah, kecuali dinyatakan lain)</p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <div className="mb-6">
                <h3 className="text-base mb-4 pb-2 border-b-2" style={{ color: '#1B4332', borderColor: '#1B4332' }}>
                  ASET
                </h3>

                <div className="mb-4">
                  <p className="text-sm mb-2" style={{ color: '#495057' }}>Aset Lancar:</p>
                  <div className="space-y-1 pl-4">
                    <div className="flex justify-between py-1">
                      <span className="text-sm" style={{ color: '#212529' }}>Kas</span>
                      <span className="text-sm" style={{ color: '#212529' }}>{formatCurrency(bs.kas)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-sm" style={{ color: '#212529' }}>Bank</span>
                      <span className="text-sm" style={{ color: '#212529' }}>{formatCurrency(bs.bank)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b" style={{ borderColor: '#DEE2E6' }}>
                      <span className="text-sm" style={{ color: '#212529' }}>Persediaan Pakan</span>
                      <span className="text-sm" style={{ color: '#212529' }}>{formatCurrency(bs.persediaanPakan)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm" style={{ color: '#1B4332' }}>Total Aset Lancar</span>
                      <span className="text-sm" style={{ color: '#1B4332' }}>{formatCurrency(bs.totalAsetLancar)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm mb-2" style={{ color: '#495057' }}>Aset Tidak Lancar:</p>
                  <div className="space-y-1 pl-4">
                    <div
                      className="flex justify-between py-2 px-2 rounded"
                      style={{ backgroundColor: '#FFF3CD' }}
                    >
                      <span className="text-sm" style={{ color: '#856404' }}>Aset Biologis (PSAK 241)</span>
                      <span className="text-sm" style={{ color: '#856404' }}>{formatCurrency(bs.asetBiologis)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-sm" style={{ color: '#212529' }}>Aset Tetap - Kandang</span>
                      <span className="text-sm" style={{ color: '#212529' }}>{formatCurrency(bs.asetTetap)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b" style={{ borderColor: '#DEE2E6' }}>
                      <span className="text-sm" style={{ color: '#212529' }}>Akumulasi Penyusutan</span>
                      <span className="text-sm" style={{ color: '#212529' }}>({formatCurrency(bs.akumulasiPenyusutan)})</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm" style={{ color: '#1B4332' }}>Total Aset Tidak Lancar</span>
                      <span className="text-sm" style={{ color: '#1B4332' }}>{formatCurrency(bs.totalAsetTidakLancar)}</span>
                    </div>
                  </div>
                </div>

                <div
                  className="flex justify-between py-3 px-3 rounded border-2 mt-6"
                  style={{ borderColor: '#1B4332', backgroundColor: '#E7F5E9' }}
                >
                  <span className="text-base" style={{ color: '#1B4332' }}>TOTAL ASET</span>
                  <span className="text-base" style={{ color: '#1B4332' }}>{formatCurrency(bs.totalAset)}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-6">
                <h3 className="text-base mb-4 pb-2 border-b-2" style={{ color: '#1B4332', borderColor: '#1B4332' }}>
                  LIABILITAS & EKUITAS
                </h3>

                <div className="mb-4">
                  <p className="text-sm mb-2" style={{ color: '#495057' }}>Liabilitas Jangka Pendek:</p>
                  <div className="space-y-1 pl-4">
                    <div className="flex justify-between py-1 border-b" style={{ borderColor: '#DEE2E6' }}>
                      <span className="text-sm" style={{ color: '#212529' }}>Hutang Usaha</span>
                      <span className="text-sm" style={{ color: '#212529' }}>{formatCurrency(bs.hutangUsaha)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm" style={{ color: '#1B4332' }}>Total Liabilitas</span>
                      <span className="text-sm" style={{ color: '#1B4332' }}>{formatCurrency(bs.totalLiabilitas)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm mb-2" style={{ color: '#495057' }}>Ekuitas:</p>
                  <div className="space-y-1 pl-4">
                    <div className="flex justify-between py-1">
                      <span className="text-sm" style={{ color: '#212529' }}>Modal Disetor</span>
                      <span className="text-sm" style={{ color: '#212529' }}>{formatCurrency(bs.modalDisetor)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b" style={{ borderColor: '#DEE2E6' }}>
                      <span className="text-sm" style={{ color: '#212529' }}>
                        {bs.labaDitahan >= 0 ? 'Laba Ditahan' : 'Rugi Ditahan'}
                      </span>
                      <span className="text-sm" style={{ color: '#212529' }}>{formatCurrency(bs.labaDitahan)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm" style={{ color: '#1B4332' }}>Total Ekuitas</span>
                      <span className="text-sm" style={{ color: '#1B4332' }}>{formatCurrency(bs.totalEkuitas)}</span>
                    </div>
                  </div>
                </div>

                <div
                  className="flex justify-between py-3 px-3 rounded border-2 mt-6"
                  style={{ borderColor: '#1B4332', backgroundColor: '#E7F5E9' }}
                >
                  <span className="text-base" style={{ color: '#1B4332' }}>TOTAL LIABILITAS & EKUITAS</span>
                  <span className="text-base" style={{ color: '#1B4332' }}>{formatCurrency(bs.totalLiabilitasDanEkuitas)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t" style={{ borderColor: '#DEE2E6' }}>
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="border-t pt-2 mt-16" style={{ borderColor: '#212529' }}>
                  <p className="text-sm" style={{ color: '#212529' }}>Direktur</p>
                  <p className="text-xs mt-1" style={{ color: '#6C757D' }}>Hers Farm</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t pt-2 mt-16" style={{ borderColor: '#212529' }}>
                  <p className="text-sm" style={{ color: '#212529' }}>Akuntan</p>
                  <p className="text-xs mt-1" style={{ color: '#6C757D' }}>Kantor Akuntan Publik</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: bs.totalAset === bs.totalLiabilitasDanEkuitas ? '#E7F5E9' : '#FEE',
            borderLeft: `4px solid ${bs.totalAset === bs.totalLiabilitasDanEkuitas ? '#1B4332' : '#DC3545'}`,
          }}
        >
          <h3 className="text-sm mb-2" style={{ color: bs.totalAset === bs.totalLiabilitasDanEkuitas ? '#1B4332' : '#DC3545' }}>
            Status Verifikasi
          </h3>
          <p className="text-xs" style={{ color: '#495057' }}>
            {bs.totalAset === bs.totalLiabilitasDanEkuitas ? '✓ Neraca Seimbang' : '✗ Neraca Tidak Seimbang'}
          </p>
          <p className="text-xs mt-1" style={{ color: '#6C757D' }}>
            Selisih: {formatCurrency(Math.abs(bs.totalAset - bs.totalLiabilitasDanEkuitas))}
          </p>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF3CD', borderLeft: '4px solid #FFB703' }}>
          <h3 className="text-sm mb-2" style={{ color: '#856404' }}>Total Aset</h3>
          <p className="text-base" style={{ color: '#212529' }}>{formatCurrency(bs.totalAset)}</p>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: '#E7F5E9', borderLeft: '4px solid #1B4332' }}>
          <h3 className="text-sm mb-2" style={{ color: '#1B4332' }}>Total Liabilitas & Ekuitas</h3>
          <p className="text-base" style={{ color: '#212529' }}>{formatCurrency(bs.totalLiabilitasDanEkuitas)}</p>
        </div>
      </div>
    </div>
  );
}
