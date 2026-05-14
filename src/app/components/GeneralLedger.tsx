import { useEffect, useMemo, useState } from 'react';
import { useData, ChartOfAccount } from '../context/DataContext';
import { Plus, Pencil, Check, X, Trash2, ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';

export default function GeneralLedger() {
  const {
    journalEntries,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    biologicalAssets,
    chartOfAccounts,
    addChartOfAccount,
    updateChartOfAccount,
    deleteChartOfAccount,
    getAccountsByParent,
    addJournalDocument,
    getJournalDocuments,
    deleteJournalDocument,
    exportGeneralLedgerCSV,
  } = useData();

  const [showForm, setShowForm] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCOAManager, setShowCOAManager] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'journal' | 'coa'>('journal');
  const [expandedParents, setExpandedParents] = useState<string[]>([]);

  // New Account Form
  const [newAccount, setNewAccount] = useState({
    code: '',
    name: '',
    parentCode: '',
    category: 'asset' as const,
  });

  // Journal Form
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    debitAccount: '',
    debitAssetId: '',
    debitAmount: '',
    creditAccount: '',
    creditAssetId: '',
    creditAmount: '',
    documentFile: null as File | null,
  });

  // Edit Form
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

  const [documentsPreview, setDocumentsPreview] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    // Load documents for all journal entries
    const preview: { [key: string]: string[] } = {};
    journalEntries.forEach(entry => {
      const docs = getJournalDocuments(entry.id);
      if (docs.length > 0) {
        preview[entry.id] = docs.map(d => d.fileName);
      }
    });
    setDocumentsPreview(preview);
  }, [journalEntries, getJournalDocuments]);

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

  // COA Management Functions
  const handleAddAccount = async () => {
    const code = newAccount.code.trim();
    const name = newAccount.name.trim();

    if (!code || !name) {
      alert('Kode akun dan nama akun wajib diisi');
      return;
    }

    const exists = chartOfAccounts.some((account) => account.code === code);
    if (exists) {
      alert('Kode akun sudah ada');
      return;
    }

    await addChartOfAccount({
      code,
      name,
      parentCode: newAccount.parentCode || undefined,
      category: newAccount.category,
      isActive: true,
    });

    setNewAccount({ code: '', name: '', parentCode: '', category: 'asset' });
  };

  const handleDeleteAccount = async (code: string) => {
    if (window.confirm(`Hapus akun ${code}?`)) {
      await deleteChartOfAccount(code);
    }
  };

  const toggleParentExpand = (parentCode: string) => {
    setExpandedParents(prev =>
      prev.includes(parentCode)
        ? prev.filter(p => p !== parentCode)
        : [...prev, parentCode]
    );
  };

  // Journal Functions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const entry = {
      date: formData.date,
      description: formData.description,
      debitAccount: formData.debitAccount,
      debitAssetId: formData.debitAssetId || undefined,
      debitAmount: Number(formData.debitAmount),
      creditAccount: formData.creditAccount,
      creditAssetId: formData.creditAssetId || undefined,
      creditAmount: Number(formData.creditAmount),
    };

    const journalId = await addJournalEntry(entry);

    // Handle document upload
    if (formData.documentFile) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target?.result as string;
        await addJournalDocument({
          journalEntryId: journalId || String(Date.now()),
          fileName: formData.documentFile!.name,
          fileData: fileData,
          fileType: formData.documentFile!.type,
          uploadedAt: new Date().toISOString(),
        });
      };
      reader.readAsDataURL(formData.documentFile);
    }

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
      documentFile: null,
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

  const handleExportCSV = () => {
    const csv = exportGeneralLedgerCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buku-besar-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderCOAHierarchy = (parentCode?: string, level = 0) => {
    const childAccounts = getAccountsByParent(parentCode);
    if (childAccounts.length === 0 && parentCode) return null;

    return childAccounts.map(account => {
      const hasChildren = getAccountsByParent(account.code).length > 0;
      const isExpanded = expandedParents.includes(account.code);

      return (
        <div key={account.code}>
          <div
            className="p-2 hover:bg-gray-100 flex items-center gap-2"
            style={{
              paddingLeft: `${16 + level * 20}px`,
              backgroundColor: level === 0 ? '#F8F9FA' : 'white',
            }}
          >
            {hasChildren && (
              <button
                onClick={() => toggleParentExpand(account.code)}
                className="p-0.5"
              >
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            <span className="text-sm font-mono font-semibold">{account.code}</span>
            <span className="text-sm flex-1">{account.name}</span>
            <button
              onClick={() => handleDeleteAccount(account.code)}
              className="p-1 rounded opacity-0 hover:opacity-100"
              style={{ backgroundColor: '#FFE5E5' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
          {isExpanded && hasChildren && renderCOAHierarchy(account.code, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl mb-1" style={{ color: '#1B4332' }}>
            Jurnal Umum & Chart of Accounts
          </h1>
          <p className="text-sm" style={{ color: '#6C757D' }}>
            Double Entry System dengan Parent-Child Akun & Dokumen Pendukung
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#6C757D' }}
          >
            <Download size={18} />
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1B4332' }}
          >
            <Plus size={18} />
            Tambah Jurnal
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b" style={{ borderColor: '#DEE2E6' }}>
        <button
          onClick={() => setSelectedTab('journal')}
          className="px-4 py-2 text-sm font-medium"
          style={{
            color: selectedTab === 'journal' ? '#1B4332' : '#6C757D',
            borderBottom: selectedTab === 'journal' ? '2px solid #1B4332' : 'none',
          }}
        >
          Jurnal Umum
        </button>
        <button
          onClick={() => setSelectedTab('coa')}
          className="px-4 py-2 text-sm font-medium"
          style={{
            color: selectedTab === 'coa' ? '#1B4332' : '#6C757D',
            borderBottom: selectedTab === 'coa' ? '2px solid #1B4332' : 'none',
          }}
        >
          Chart of Accounts
        </button>
      </div>

      {selectedTab === 'journal' && (
        <>
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
                          {chartOfAccounts.filter(a => !a.parentCode).map((acc) => (
                            <optgroup key={acc.code} label={`${acc.code} ${acc.name}`}>
                              <option value={`${acc.code} ${acc.name}`}>
                                {acc.code} {acc.name}
                              </option>
                              {getAccountsByParent(acc.code).map(child => (
                                <option key={child.code} value={`${child.code} ${child.name}`}>
                                  └─ {child.code} {child.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
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
                          {chartOfAccounts.filter(a => !a.parentCode).map((acc) => (
                            <optgroup key={acc.code} label={`${acc.code} ${acc.name}`}>
                              <option value={`${acc.code} ${acc.name}`}>
                                {acc.code} {acc.name}
                              </option>
                              {getAccountsByParent(acc.code).map(child => (
                                <option key={child.code} value={`${child.code} ${child.name}`}>
                                  └─ {child.code} {child.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
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

                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F0F8FF' }}>
                  <label className="block text-sm mb-2" style={{ color: '#495057' }}>
                    📎 Dokumen Pendukung (Opsional)
                  </label>
                  <p className="text-xs mb-2" style={{ color: '#6C757D' }}>
                    Upload bukti pembayaran, bukti gaji, invoice, atau dokumen pendukung lainnya
                  </p>
                  <input
                    type="file"
                    onChange={(e) => setFormData({ ...formData, documentFile: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border rounded text-sm"
                    style={{ borderColor: '#DEE2E6' }}
                  />
                  {formData.documentFile && (
                    <div className="text-xs mt-1" style={{ color: '#28A745' }}>
                      ✓ {formData.documentFile.name}
                    </div>
                  )}
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
                placeholder="Search jurnal..."
                className="w-full px-3 py-2 border rounded text-sm"
                style={{ borderColor: '#DEE2E6' }}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#1B4332', color: 'white' }}>
                    <th className="px-3 py-2 text-left">Tanggal</th>
                    <th className="px-3 py-2 text-left">Deskripsi</th>
                    <th className="px-3 py-2 text-left">Akun Debit</th>
                    <th className="px-3 py-2 text-right">Debit</th>
                    <th className="px-3 py-2 text-left">Akun Kredit</th>
                    <th className="px-3 py-2 text-right">Kredit</th>
                    <th className="px-3 py-2 text-center">Doc</th>
                    <th className="px-3 py-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJournalEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50" style={{ borderColor: '#DEE2E6' }}>
                      {editingJournalId === entry.id ? (
                        <>
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              value={editFormData.date}
                              onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                              className="w-20 px-2 py-1 border rounded text-xs"
                              style={{ borderColor: '#DEE2E6' }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={editFormData.description}
                              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                              className="w-40 px-2 py-1 border rounded text-xs"
                              style={{ borderColor: '#DEE2E6' }}
                            />
                          </td>
                          <td colSpan={5} className="px-3 py-2 text-xs" style={{ color: '#6C757D' }}>
                            Edit mode simplified - debit/kredit akan ditampilkan setelah simpan
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1 justify-center">
                              <button onClick={saveEditJournal} className="p-1 rounded" style={{ backgroundColor: '#1B4332', color: 'white' }}>
                                <Check size={12} />
                              </button>
                              <button onClick={() => setEditingJournalId(null)} className="p-1 rounded" style={{ backgroundColor: '#DC3545', color: 'white' }}>
                                <X size={12} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2">{entry.date}</td>
                          <td className="px-3 py-2">{entry.description}</td>
                          <td className="px-3 py-2 text-xs">{entry.debitAccount}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(entry.debitAmount)}</td>
                          <td className="px-3 py-2 text-xs">{entry.creditAccount}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(entry.creditAmount)}</td>
                          <td className="px-3 py-2 text-center">
                            {documentsPreview[entry.id] && (
                              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#E7F5E9', color: '#1B4332' }}>
                                {documentsPreview[entry.id]?.length || 0}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => startEditJournal(entry.id)}
                              className="p-1 rounded"
                              style={{ backgroundColor: '#FFB703', color: '#212529' }}
                            >
                              <Pencil size={12} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedTab === 'coa' && (
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#DEE2E6' }}>
          <h2 className="text-base mb-4" style={{ color: '#1B4332' }}>
            Kelola Chart of Accounts (COA)
          </h2>

          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#F8F9FA' }}>
            <h3 className="text-sm mb-3" style={{ color: '#1B4332' }}>Tambah Akun Baru</h3>
            <div className="grid grid-cols-5 gap-3">
              <input
                type="text"
                placeholder="Kode (1-1200)"
                value={newAccount.code}
                onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                className="px-3 py-2 border rounded text-sm"
                style={{ borderColor: '#DEE2E6' }}
              />
              <input
                type="text"
                placeholder="Nama akun"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                className="px-3 py-2 border rounded text-sm"
                style={{ borderColor: '#DEE2E6' }}
              />
              <select
                value={newAccount.parentCode}
                onChange={(e) => setNewAccount({ ...newAccount, parentCode: e.target.value })}
                className="px-3 py-2 border rounded text-sm"
                style={{ borderColor: '#DEE2E6' }}
              >
                <option value="">Tidak ada parent</option>
                {chartOfAccounts.filter(a => !a.parentCode).map(a => (
                  <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                ))}
              </select>
              <select
                value={newAccount.category}
                onChange={(e) => setNewAccount({ ...newAccount, category: e.target.value as any })}
                className="px-3 py-2 border rounded text-sm"
                style={{ borderColor: '#DEE2E6' }}
              >
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </select>
              <button
                onClick={handleAddAccount}
                className="px-4 py-2 rounded text-white text-sm"
                style={{ backgroundColor: '#1B4332' }}
              >
                Tambah
              </button>
            </div>
          </div>

          <h3 className="text-sm mb-3" style={{ color: '#1B4332' }}>Daftar Akun Hierarki</h3>
          <div className="border rounded" style={{ borderColor: '#DEE2E6' }}>
            {renderCOAHierarchy()}
          </div>
        </div>
      )}
    </div>
  );
}
