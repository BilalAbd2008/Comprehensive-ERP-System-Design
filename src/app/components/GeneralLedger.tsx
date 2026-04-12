import { useEffect, useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Pencil, Check, X, Trash2 } from 'lucide-react';

const defaultChartOfAccounts = [
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

const CHART_OF_ACCOUNTS_STORAGE_KEY = 'hers-farm-chart-of-accounts';

type AccountOption = {
  code: string;
  name: string;
};

const accountToValue = (account: AccountOption) => `${account.code} ${account.name}`;

export default function GeneralLedger() {
  const { journalEntries, addJournalEntry, updateJournalEntry, biologicalAssets } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chartOfAccounts, setChartOfAccounts] = useState<AccountOption[]>(() => {
    const saved = localStorage.getItem(CHART_OF_ACCOUNTS_STORAGE_KEY);
    if (!saved) return defaultChartOfAccounts;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return defaultChartOfAccounts;
    } catch {
      return defaultChartOfAccounts;
    }
  });

  const [newAccount, setNewAccount] = useState({ code: '', name: '' });
  const [selectedAccountCode, setSelectedAccountCode] = useState('');
  const [editAccount, setEditAccount] = useState({ code: '', name: '' });

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

  const [editFormData, setEditFormData] = useState({
    date: '',
    description: '',
    debitAccount: '',
    debitAssetId: '',
    debitAmount: '',
    creditAccount: '',
    creditAssetId: '',
    creditAmount: '',
  });

  useEffect(() => {
    localStorage.setItem(CHART_OF_ACCOUNTS_STORAGE_KEY, JSON.stringify(chartOfAccounts));
  }, [chartOfAccounts]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const filteredJournalEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return journalEntries;

    return journalEntries.filter((entry) => {
      const searchable = [
        entry.date,
        entry.description,
        entry.debitAccount,
        entry.creditAccount,
        String(entry.debitAmount),
        String(entry.creditAmount),
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [journalEntries, searchQuery]);

  const handleAddAccount = () => {
    const code = newAccount.code.trim();
    const name = newAccount.name.trim();

    if (!code || !name) {
      alert('Kode akun dan nama akun wajib diisi');
      return;
    }

    const exists = chartOfAccounts.some((account) => account.code === code);
    if (exists) {
      alert('Kode akun sudah ada, gunakan kode lain');
      return;
    }

    const next = [...chartOfAccounts, { code, name }].sort((a, b) => a.code.localeCompare(b.code));
    setChartOfAccounts(next);
    setNewAccount({ code: '', name: '' });
  };

  const loadAccountForEdit = (code: string) => {
    setSelectedAccountCode(code);
    const account = chartOfAccounts.find((item) => item.code === code);
    if (!account) {
      setEditAccount({ code: '', name: '' });
      return;
    }
    setEditAccount({ code: account.code, name: account.name });
  };

  const handleEditAccount = () => {
    if (!selectedAccountCode) {
      alert('Pilih akun yang ingin diedit');
      return;
    }

    const nextCode = editAccount.code.trim();
    const nextName = editAccount.name.trim();

    if (!nextCode || !nextName) {
      alert('Kode akun dan nama akun wajib diisi');
      return;
    }

    const duplicate = chartOfAccounts.some(
      (account) => account.code === nextCode && account.code !== selectedAccountCode,
    );

    if (duplicate) {
      alert('Kode akun sudah dipakai akun lain');
      return;
    }

    const updated = chartOfAccounts
      .map((account) =>
        account.code === selectedAccountCode ? { code: nextCode, name: nextName } : account,
      )
      .sort((a, b) => a.code.localeCompare(b.code));

    setChartOfAccounts(updated);
    setSelectedAccountCode(nextCode);
  };

  const handleDeleteAccount = () => {
    if (!selectedAccountCode) {
      alert('Pilih akun yang ingin dihapus');
      return;
    }

    if (!window.confirm(`Hapus akun ${selectedAccountCode}?`)) {
      return;
    }

    const next = chartOfAccounts.filter((account) => account.code !== selectedAccountCode);
    setChartOfAccounts(next);
    setSelectedAccountCode('');
    setEditAccount({ code: '', name: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addJournalEntry({
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

  const startEditJournal = (id: string) => {
    const entry = journalEntries.find(journal => journal.id === id);
    if (!entry) return;
    setEditingJournalId(id);
    setEditFormData({
      date: entry.date,
      description: entry.description,
      debitAccount: entry.debitAccount,
      debitAssetId: entry.debitAssetId || '',
      debitAmount: String(entry.debitAmount),
      creditAccount: entry.creditAccount,
      creditAssetId: entry.creditAssetId || '',
      creditAmount: String(entry.creditAmount),
    });
  };

  const cancelEditJournal = () => {
    setEditingJournalId(null);
  };

  const saveEditJournal = async () => {
    if (!editingJournalId) return;
    await updateJournalEntry(editingJournalId, {
      date: editFormData.date,
      description: editFormData.description,
      debitAccount: editFormData.debitAccount,
      debitAssetId: editFormData.debitAssetId || undefined,
      debitAmount: Number(editFormData.debitAmount),
      creditAccount: editFormData.creditAccount,
      creditAssetId: editFormData.creditAssetId || undefined,
      creditAmount: Number(editFormData.creditAmount),
    });
    setEditingJournalId(null);
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
          <div className="mb-5 p-4 rounded-lg" style={{ backgroundColor: '#F8F9FA' }}>
            <h3 className="text-sm mb-3" style={{ color: '#1B4332' }}>Kelola Chart of Account (COA)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs" style={{ color: '#495057' }}>Tambah Akun Baru</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Kode (contoh 1-1300)"
                    value={newAccount.code}
                    onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-sm"
                    style={{ borderColor: '#DEE2E6' }}
                  />
                  <input
                    type="text"
                    placeholder="Nama akun"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-sm"
                    style={{ borderColor: '#DEE2E6' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAccount}
                  className="px-3 py-2 rounded text-white text-sm"
                  style={{ backgroundColor: '#1B4332' }}
                >
                  Tambah Akun
                </button>
              </div>

              <div className="space-y-2">
                <div className="text-xs" style={{ color: '#495057' }}>Edit / Hapus Akun</div>
                <select
                  value={selectedAccountCode}
                  onChange={(e) => loadAccountForEdit(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                  style={{ borderColor: '#DEE2E6' }}
                >
                  <option value="">Pilih akun</option>
                  {chartOfAccounts.map((account) => (
                    <option key={account.code} value={account.code}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Kode akun"
                    value={editAccount.code}
                    onChange={(e) => setEditAccount({ ...editAccount, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-sm"
                    style={{ borderColor: '#DEE2E6' }}
                  />
                  <input
                    type="text"
                    placeholder="Nama akun"
                    value={editAccount.name}
                    onChange={(e) => setEditAccount({ ...editAccount, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-sm"
                    style={{ borderColor: '#DEE2E6' }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleEditAccount}
                    className="px-3 py-2 rounded text-white text-sm"
                    style={{ backgroundColor: '#1B4332' }}
                  >
                    Simpan Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="px-3 py-2 rounded text-white text-sm"
                    style={{ backgroundColor: '#DC3545' }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>

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
                        <option key={acc.code} value={accountToValue(acc)}>
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
                        <option key={acc.code} value={accountToValue(acc)}>
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
        <div className="p-4 border-b" style={{ borderColor: '#DEE2E6' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jurnal (tanggal, deskripsi, akun, nominal...)"
            className="w-full px-3 py-2 border rounded text-sm"
            style={{ borderColor: '#DEE2E6' }}
          />
        </div>
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
                <th className="px-4 py-3 text-center text-sm">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredJournalEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b transition-colors hover:bg-gray-50"
                  style={{ borderColor: '#DEE2E6' }}
                >
                  {editingJournalId === entry.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={editFormData.date}
                          onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                          style={{ borderColor: '#DEE2E6' }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                          style={{ borderColor: '#DEE2E6' }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={editFormData.debitAccount}
                          onChange={(e) => setEditFormData({ ...editFormData, debitAccount: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                          style={{ borderColor: '#DEE2E6' }}
                        >
                          {chartOfAccounts.map((acc) => (
                            <option key={acc.code} value={accountToValue(acc)}>
                              {acc.code} - {acc.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={editFormData.debitAmount}
                          onChange={(e) => setEditFormData({ ...editFormData, debitAmount: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm text-right"
                          style={{ borderColor: '#DEE2E6' }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={editFormData.creditAccount}
                          onChange={(e) => setEditFormData({ ...editFormData, creditAccount: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                          style={{ borderColor: '#DEE2E6' }}
                        >
                          {chartOfAccounts.map((acc) => (
                            <option key={acc.code} value={accountToValue(acc)}>
                              {acc.code} - {acc.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={editFormData.creditAmount}
                          onChange={(e) => setEditFormData({ ...editFormData, creditAmount: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm text-right"
                          style={{ borderColor: '#DEE2E6' }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={saveEditJournal} className="p-1.5 rounded" style={{ backgroundColor: '#1B4332', color: 'white' }}>
                            <Check size={14} />
                          </button>
                          <button onClick={cancelEditJournal} className="p-1.5 rounded" style={{ backgroundColor: '#DC3545', color: 'white' }}>
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
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
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => startEditJournal(entry.id)}
                          className="p-1.5 rounded"
                          style={{ backgroundColor: '#FFB703', color: '#212529' }}
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filteredJournalEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm" style={{ color: '#6C757D' }}>
                    Tidak ada data yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
