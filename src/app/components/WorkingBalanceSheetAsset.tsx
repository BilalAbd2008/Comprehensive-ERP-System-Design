import { useData } from '../context/DataContext';
import { createBalanceReader } from '../utils/financialCalculations';

export default function WorkingBalanceSheetAsset() {
  const { journalEntries, biologicalAssets, chartOfAccounts } = useData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };
  const formatBalance = (value: number) => {
    if (value > 0) return formatCurrency(value);
    if (value < 0) return `(${formatCurrency(Math.abs(value))})`;
    return '-';
  };

  const { childrenOf: childAccounts, balanceIncludingChildren, accountLabel, topAccountsByCategory } =
    createBalanceReader(journalEntries, chartOfAccounts);

  // ASET LANCAR
  const currentAssetAccounts = topAccountsByCategory('asset').filter(
    (account) =>
      (account.code.startsWith('1-1') || account.code.startsWith('1-2')) &&
      !account.code.startsWith('1-3000'),
  );
  const totalAsetLancar = currentAssetAccounts.reduce(
    (sum, account) => sum + balanceIncludingChildren(account.code),
    0,
  );

  // ASET TIDAK LANCAR
  const asetBiologis = biologicalAssets.reduce(
    (sum, asset) => sum + Number(asset.fairValue || 0),
    0,
  );
  const isAccumulatedDepreciation = (account: { code: string; name: string }) =>
    account.code.startsWith('1-42') ||
    account.name.toLowerCase().includes('akumulasi') ||
    account.name.toLowerCase().includes('penyusutan');
  const fixedAssetAccounts = topAccountsByCategory('asset').filter(
    (account) => account.code.startsWith('1-4') && !isAccumulatedDepreciation(account),
  );
  const accumulatedDepreciationAccounts = topAccountsByCategory('asset').filter(
    (account) => account.code.startsWith('1-4') && isAccumulatedDepreciation(account),
  );
  const asetTetap = fixedAssetAccounts.reduce(
    (sum, account) => sum + balanceIncludingChildren(account.code),
    0,
  );
  const akumulasiPenyusutan = accumulatedDepreciationAccounts.reduce(
    (sum, account) => sum + Math.abs(balanceIncludingChildren(account.code)),
    0,
  );
  const asetTetapNeto = asetTetap - akumulasiPenyusutan;
  const totalAsetTidakLancar = asetBiologis + asetTetapNeto;

  const totalAset = totalAsetLancar + totalAsetTidakLancar;
  const renderAccountWithChildren = (account: { code: string; name: string }) => {
    const amount = balanceIncludingChildren(account.code);
    const children = childAccounts(account.code);

    return (
      <div key={account.code} className="py-2">
        <div className="grid grid-cols-2">
          <span className="text-sm" style={{ color: '#495057' }}>{account.name}</span>
          <span className="text-sm text-right" style={{ color: '#212529' }}>
            {formatBalance(amount)}
          </span>
        </div>
        {children.map(child => {
          const childAmount = balanceIncludingChildren(child.code);
          return (
            <div key={child.code} className="grid grid-cols-2 pl-4 py-1">
              <span className="text-xs" style={{ color: '#6C757D' }}>
                {child.code} - {child.name}
              </span>
              <span className="text-xs text-right" style={{ color: '#212529' }}>
                {formatBalance(childAmount)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };
  const renderContraAccountWithChildren = (account: { code: string; name: string }) => {
    const amount = Math.abs(balanceIncludingChildren(account.code));
    const children = childAccounts(account.code);

    return (
      <div key={account.code} className="py-1">
        <div className="grid grid-cols-2 pl-4">
          <span className="text-sm" style={{ color: '#6C757D' }}>{account.name}</span>
          <span className="text-sm text-right" style={{ color: '#DC3545' }}>
            {amount > 0 ? `(${formatCurrency(amount)})` : '-'}
          </span>
        </div>
        {children.map(child => {
          const childAmount = Math.abs(balanceIncludingChildren(child.code));
          return (
            <div key={child.code} className="grid grid-cols-2 pl-8 py-1">
              <span className="text-xs" style={{ color: '#6C757D' }}>
                {child.code} - {child.name}
              </span>
              <span className="text-xs text-right" style={{ color: '#DC3545' }}>
                {childAmount > 0 ? `(${formatCurrency(childAmount)})` : '-'}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

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
              {currentAssetAccounts.map(renderAccountWithChildren)}
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
                  <span className="text-sm" style={{ color: '#495057' }}>{accountLabel('1-3000', 'Aset Biologis')} (PSAK 241)</span>
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
                {fixedAssetAccounts.map(renderAccountWithChildren)}
                {accumulatedDepreciationAccounts.map(renderContraAccountWithChildren)}
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
