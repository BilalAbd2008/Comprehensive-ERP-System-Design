import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, BookOpen } from 'lucide-react';

const chartOfAccounts = [
  { code: '1-1100', name: 'Kas' },
  { code: '1-1200', name: 'Bank' },
  { code: '1-2100', name: 'Persediaan Pakan' },
  { code: '1-3000', name: 'Aset Biologis' },
  { code: '1-4100', name: 'Aset Tetap - Kandang' },
  { code: '1-4200', name: 'Akumulasi Penyusutan' },
  { code: '2-1000', name: 'Hutang Usaha' },
  { code: '3-1000', name: 'Modal Disetor' },
  { code: '3-2000', name: 'Laba Ditahan' },
  { code: '4-1000', name: 'Pendapatan Penjualan' },
  { code: '4-2000', name: 'Keuntungan Nilai Wajar' },
  { code: '4-3000', name: 'Pendapatan Lain-lain' },
  { code: '5-1000', name: 'Beban Gaji' },
  { code: '5-2000', name: 'Beban Pakan' },
  { code: '5-3000', name: 'Harga Pokok Penjualan' },
  { code: '5-4000', name: 'Kerugian Nilai Wajar' },
  { code: '5-5000', name: 'Beban Lain-lain' },
  { code: '5-6000', name: 'Beban Penyusutan' },
];

export default function GeneralLedger() {
  const { journalEntries, addJournalEntry, biologicalAssets } = useData();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    debitAccount: '',
    debitAssetId: '',
    debitAmount: '',
    creditAccount: '',
    creditAssetId: '',
    creditAmount: '',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addJournalEntry({
      date: formData.date,
      description: formData.description,
      debitAccount: formData.debitAccount,
      debitAssetId: formData.debitAssetId || undefined,
      debitAmount: Number(formData.debitAmount),
      creditAccount: formData.creditAccount,
      creditAssetId: formData.creditAssetId || undefined,
      creditAmount: Number(formData.creditAmount),
    });
    setShowForm(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      debitAccount: '',
      debitAssetId: '',
      debitAmount: '',
      creditAccount: '',
      creditAssetId: '',
      creditAmount: '',
    });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl mb-1" style={{ color: '#1B4332' }}>
            Jurnal Umum / General Ledger
          </h1>
          <p className="text-sm" style={{ color: '#6C757D' }}>
            Double Entry System
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1B4332' }}
        >
          <Plus size={18} />
          Tambah Jurnal
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg border mb-6" style={{ borderColor: '#DEE2E6' }}>
          <h2 className="text-base mb-4" style={{ color: '#1B4332' }}>
            Form Input Jurnal
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: '#495057' }}>Tanggal</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: '#DEE2E6' }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#495057' }}>Deskripsi</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: '#DEE2E6' }}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#E7F5E9' }}>
                <h3 className="text-sm mb-3" style={{ color: '#1B4332' }}>Sisi Debit</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#495057' }}>Akun</label>
                    <select
                      value={formData.debitAccount}
                      onChange={(e) => setFormData({ ...formData, debitAccount: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm"
                      style={{ borderColor: '#DEE2E6' }}
                      required
                    >
                      <option value="">Pilih Akun</option>
                      {chartOfAccounts.map((acc) => (
                        <option key={acc.code} value={`${acc.code} ${acc.name}`}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.debitAccount.includes('Aset Biologis') && (
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#495057' }}>ID Tag Domba/Kambing</label>
                      <select
                        value={formData.debitAssetId}
                        onChange={(e) => setFormData({ ...formData, debitAssetId: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm"
                        style={{ borderColor: '#DEE2E6' }}
                      >
                        <option value="">Tidak Spesifik</option>
                        {biologicalAssets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.tagId} - {asset.type}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#495057' }}>Jumlah</label>
                    <input
                      type="number"
                      value={formData.debitAmount}
                      onChange={(e) => setFormData({ ...formData, debitAmount: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm"
                      style={{ borderColor: '#DEE2E6' }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF3CD' }}>
                <h3 className="text-sm mb-3" style={{ color: '#856404' }}>Sisi Kredit</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#495057' }}>Akun</label>
                    <select
                      value={formData.creditAccount}
                      onChange={(e) => setFormData({ ...formData, creditAccount: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm"
                      style={{ borderColor: '#DEE2E6' }}
                      required
                    >
                      <option value="">Pilih Akun</option>
                      {chartOfAccounts.map((acc) => (
                        <option key={acc.code} value={`${acc.code} ${acc.name}`}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.creditAccount.includes('Aset Biologis') && (
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#495057' }}>ID Tag Domba/Kambing</label>
                      <select
                        value={formData.creditAssetId}
                        onChange={(e) => setFormData({ ...formData, creditAssetId: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm"
                        style={{ borderColor: '#DEE2E6' }}
                      >
                        <option value="">Tidak Spesifik</option>
                        {biologicalAssets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.tagId} - {asset.type}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#495057' }}>Jumlah</label>
                    <input
                      type="number"
                      value={formData.creditAmount}
                      onChange={(e) => setFormData({ ...formData, creditAmount: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm"
                      style={{ borderColor: '#DEE2E6' }}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#1B4332' }}
              >
                Simpan Jurnal
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded transition-colors"
                style={{ backgroundColor: '#E9ECEF', color: '#495057' }}
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#DEE2E6' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#1B4332', color: 'white' }}>
                <th className="px-4 py-3 text-left text-sm">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm">Deskripsi</th>
                <th className="px-4 py-3 text-left text-sm">Akun Debit</th>
                <th className="px-4 py-3 text-right text-sm">Debit</th>
                <th className="px-4 py-3 text-left text-sm">Akun Kredit</th>
                <th className="px-4 py-3 text-right text-sm">Kredit</th>
              </tr>
            </thead>
            <tbody>
              {journalEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b transition-colors hover:bg-gray-50"
                  style={{ borderColor: '#DEE2E6' }}
                >
                  <td className="px-4 py-3 text-sm" style={{ color: '#495057' }}>{entry.date}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#212529' }}>{entry.description}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#1B4332' }}>{entry.debitAccount}</td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: '#212529' }}>
                    {formatCurrency(entry.debitAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#856404' }}>{entry.creditAccount}</td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: '#212529' }}>
                    {formatCurrency(entry.creditAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
