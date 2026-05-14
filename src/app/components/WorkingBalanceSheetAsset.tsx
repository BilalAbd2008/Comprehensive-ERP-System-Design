import { useData } from '../context/DataContext';

export default function WorkingBalanceSheetAsset() {
  const { journalEntries, biologicalAssets, chartOfAccounts } = useData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const accountCode = (account: string) => account.split(' ')[0] || account;

  // Calculate balances from GL
  const balances: Record<string, number> = {};
  journalEntries.forEach(entry => {
    const debitCode = accountCode(entry.debitAccount);
    const creditCode = accountCode(entry.creditAccount);
    if (!balances[debitCode]) balances[debitCode] = 0;
    if (!balances[creditCode]) balances[creditCode] = 0;
    balances[debitCode] += entry.debitAmount;
    balances[creditCode] -= entry.creditAmount;
  });

  const childAccounts = (parentCode: string) =>
    chartOfAccounts
      .filter(account => account.parentCode === parentCode)
      .sort((a, b) => a.code.localeCompare(b.code));

  const balanceByCode = (code: string) => balances[code] || 0;
  const balanceIncludingChildren = (code: string): number =>
    balanceByCode(code) + childAccounts(code).reduce((sum, child) => sum + balanceIncludingChildren(child.code), 0);

  // ASET LANCAR
  const kas = balanceIncludingChildren('1-1100');
  const bank = balanceIncludingChildren('1-1200');
  const persediaanPakan = balanceIncludingChildren('1-2100');
  const totalAsetLancar = kas + bank + persediaanPakan;

  // ASET TIDAK LANCAR
  const asetBiologis = balanceIncludingChildren('1-3000');
  const asetTetap = balanceIncludingChildren('1-4100');
  const akumulasiPenyusutan = Math.abs(balanceIncludingChildren('1-4200'));
  const asetTetapNeto = asetTetap - akumulasiPenyusutan;
  const totalAsetTidakLancar = asetBiologis + asetTetapNeto;

  const totalAset = totalAsetLancar + totalAsetTidakLancar;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl mb-1" style={{ color: '#1B4332' }}>
          Working Balance Sheet - Aset (WBSA)
        </h1>
        <p className="text-sm" style={{ color: '#6C757D' }}>
          Kertas Kerja Neraca - Sisi Aset (Data dari General Ledger)
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
          {/* ASET LANCAR */}
          <div className="mb-6">
            <div className="py-2 px-3 mb-2" style={{ backgroundColor: '#E7F5E9' }}>
              <span className="text-sm" style={{ color: '#1B4332' }}>ASET LANCAR</span>
            </div>

            <div className="space-y-1 pl-6">
              <div className="grid grid-cols-2 py-2">
                <span className="text-sm" style={{ color: '#495057' }}>Kas</span>
                <span className="text-sm text-right" style={{ color: '#212529' }}>
                  {kas > 0 ? formatCurrency(kas) : '-'}
                </span>
              </div>

              <div className="grid grid-cols-2 py-2">
                <span className="text-sm" style={{ color: '#495057' }}>Bank</span>
                <span className="text-sm text-right" style={{ color: '#212529' }}>
                  {bank > 0 ? formatCurrency(bank) : '-'}
                </span>
              </div>
              {childAccounts('1-1200').map(account => {
                const amount = balanceIncludingChildren(account.code);
                return (
                  <div key={account.code} className="grid grid-cols-2 pl-4 py-1">
                    <span className="text-xs" style={{ color: '#6C757D' }}>
                      {account.code} - {account.name}
                    </span>
                    <span className="text-xs text-right" style={{ color: '#212529' }}>
                      {amount > 0 ? formatCurrency(amount) : '-'}
                    </span>
                  </div>
                );
              })}

              <div className="py-2">
                <div className="grid grid-cols-2">
                  <span className="text-sm" style={{ color: '#495057' }}>Persediaan</span>
                  <span></span>
                </div>
                <div className="grid grid-cols-2 pl-4 py-1">
                  <span className="text-sm" style={{ color: '#6C757D' }}>Persediaan Pakan</span>
                  <span className="text-sm text-right" style={{ color: '#212529' }}>
                    {persediaanPakan > 0 ? formatCurrency(persediaanPakan) : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 py-3 px-3 mt-2" style={{ backgroundColor: '#FFB703' }}>
              <span className="text-sm" style={{ color: '#212529' }}>Jumlah Aset Lancar</span>
              <span className="text-sm text-right" style={{ color: '#212529' }}>
                {formatCurrency(totalAsetLancar)}
              </span>
            </div>
          </div>

          {/* ASET TIDAK LANCAR */}
          <div className="mb-6">
            <div className="py-2 px-3 mb-2" style={{ backgroundColor: '#E7F5E9' }}>
              <span className="text-sm" style={{ color: '#1B4332' }}>ASET TIDAK LANCAR</span>
            </div>

            <div className="space-y-1 pl-6">
              <div className="py-2">
                <div className="grid grid-cols-2 mb-2">
                  <span className="text-sm" style={{ color: '#495057' }}>Aset Biologis (PSAK 241)</span>
                  <span></span>
                </div>
                {biologicalAssets.map((asset, idx) => (
                  <div key={idx} className="grid grid-cols-2 pl-4 py-1">
                    <span className="text-xs" style={{ color: '#6C757D' }}>
                      {asset.tagId} - {asset.type} ({asset.weight}kg)
                    </span>
                    <span className="text-xs text-right" style={{ color: '#212529' }}>
                      {formatCurrency(asset.fairValue)}
                    </span>
                  </div>
                ))}
                <div className="grid grid-cols-2 pl-4 py-2 border-t mt-1" style={{ borderColor: '#DEE2E6' }}>
                  <span className="text-sm" style={{ color: '#1B4332' }}>Subtotal Aset Biologis</span>
                  <span className="text-sm text-right" style={{ color: '#1B4332' }}>
                    {formatCurrency(asetBiologis)}
                  </span>
                </div>
              </div>

              <div className="py-2">
                <div className="grid grid-cols-2">
                  <span className="text-sm" style={{ color: '#495057' }}>Aset Tetap</span>
                  <span></span>
                </div>
                <div className="grid grid-cols-2 pl-4 py-1">
                  <span className="text-sm" style={{ color: '#6C757D' }}>Kandang dan Bangunan</span>
                  <span className="text-sm text-right" style={{ color: '#212529' }}>
                    {asetTetap > 0 ? formatCurrency(asetTetap) : '-'}
                  </span>
                </div>
                <div className="grid grid-cols-2 pl-4 py-1">
                  <span className="text-sm" style={{ color: '#6C757D' }}>Akumulasi Penyusutan</span>
                  <span className="text-sm text-right" style={{ color: '#DC3545' }}>
                    {akumulasiPenyusutan > 0 ? `(${formatCurrency(akumulasiPenyusutan)})` : '-'}
                  </span>
                </div>
                <div className="grid grid-cols-2 pl-4 py-2 border-t mt-1" style={{ borderColor: '#DEE2E6' }}>
                  <span className="text-sm" style={{ color: '#1B4332' }}>Subtotal Aset Tetap (Neto)</span>
                  <span className="text-sm text-right" style={{ color: '#1B4332' }}>
                    {formatCurrency(asetTetapNeto)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 py-3 px-3 mt-2" style={{ backgroundColor: '#FFB703' }}>
              <span className="text-sm" style={{ color: '#212529' }}>Jumlah Aset Tidak Lancar</span>
              <span className="text-sm text-right" style={{ color: '#212529' }}>
                {formatCurrency(totalAsetTidakLancar)}
              </span>
            </div>
          </div>

          {/* TOTAL ASET */}
          <div className="grid grid-cols-2 py-4 px-4 border-2 rounded" style={{ backgroundColor: '#1B4332', borderColor: '#1B4332' }}>
            <span className="text-base" style={{ color: 'white' }}>JUMLAH ASET</span>
            <span className="text-base text-right" style={{ color: 'white' }}>
              {formatCurrency(totalAset)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#E7F5E9' }}>
        <h3 className="text-sm mb-2" style={{ color: '#1B4332' }}>Sumber Data</h3>
        <p className="text-xs" style={{ color: '#495057' }}>
          Semua angka di WBSA diambil dari General Ledger (GL).
          Aset Biologis dipecah per ekor untuk transparansi tracking sesuai PSAK 241.
        </p>
      </div>
    </div>
  );
}
