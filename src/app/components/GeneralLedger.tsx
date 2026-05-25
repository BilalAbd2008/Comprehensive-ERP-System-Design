import { useEffect, useMemo, useState } from 'react';
import { useData, JournalDocument } from '../context/DataContext';
import { Plus, Pencil, Check, X, Trash2, ChevronDown, ChevronUp, Download, Eye } from 'lucide-react';

export default function GeneralLedger() {
  const {
    journalEntries,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    chartOfAccounts,
    addChartOfAccount,
    updateChartOfAccount,
    deleteChartOfAccount,
    getAccountsByParent,
    addJournalDocument,
    getJournalDocuments,
    exportGeneralLedgerCSV,
    admins,
  } = useData();

  const [showForm, setShowForm] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'journal' | 'coa'>('journal');
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  const [editingAccountCode, setEditingAccountCode] = useState<string | null>(null);

  // New Account Form
  const [newAccount, setNewAccount] = useState({
    code: '',
    name: '',
    parentCode: '',
    category: 'asset' as const,
  });
  const [editAccount, setEditAccount] = useState({
    code: '',
    name: '',
    parentCode: '',
    category: 'asset' as const,
    isActive: true,
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
    debitDocumentFile: null as File | null,
    creditDocumentFile: null as File | null,
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

  const [documentsPreview, setDocumentsPreview] = useState<{ [key: string]: JournalDocument[] }>({});
  const [previewDocument, setPreviewDocument] = useState<JournalDocument | null>(null);

  useEffect(() => {
    // Load documents for all journal entries
    const preview: { [key: string]: string[] } = {};
    journalEntries.forEach(entry => {
      const docs = getJournalDocuments(entry.id);
      if (docs.length > 0) {
        preview[entry.id] = docs;
      }
    });
    setDocumentsPreview(preview);
  }, [journalEntries, getJournalDocuments]);

  const sideLabel = (side?: JournalDocument['documentSide']) => {
    if (side === 'debit') return 'Debit';
    if (side === 'credit') return 'Kredit';
    return 'Umum';
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(String(event.target?.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const downloadDocument = (doc: JournalDocument) => {
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.fileName;
    link.click();
  };

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
        entry.createdBy,
        entry.updatedBy,
        String(entry.debitAmount),
        String(entry.creditAmount),
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [journalEntries, searchQuery]);

  const adminLabel = (username?: string) => {
    if (!username) return '-';
    const admin = admins.find((item) => item.username === username);
    return admin ? `${admin.fullName} (@${admin.username})` : `@${username}`;
  };

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

  const isDescendantAccount = (candidateCode: string, parentCode: string): boolean => {
    let current = chartOfAccounts.find((account) => account.code === candidateCode);
    while (current?.parentCode) {
      if (current.parentCode === parentCode) return true;
      current = chartOfAccounts.find((account) => account.code === current?.parentCode);
    }
    return false;
  };

  const descendantAccountsFor = (accountCode: string) =>
    chartOfAccounts.filter((account) => isDescendantAccount(account.code, accountCode));

  const accountIsUsed = (code: string) =>
    journalEntries.some(
      (journal) =>
        journal.debitAccount.includes(code) ||
        journal.creditAccount.includes(code),
    );

  const handleDeleteAccount = async (code: string) => {
    const descendants = descendantAccountsFor(code);
    const accountsToDelete = [...descendants, ...chartOfAccounts.filter((account) => account.code === code)]
      .sort((a, b) => b.code.length - a.code.length);
    const usedAccount = accountsToDelete.find((account) => accountIsUsed(account.code));

    if (usedAccount) {
      alert(`Tidak bisa hapus akun ${usedAccount.code} karena sudah digunakan dalam jurnal`);
      return;
    }

    const message =
      descendants.length > 0
        ? `Hapus akun ${code} beserta ${descendants.length} child akun?`
        : `Hapus akun ${code}?`;

    if (!window.confirm(message)) return;

    for (const account of accountsToDelete) {
      await deleteChartOfAccount(account.code);
    }
  };

  const parentOptionsFor = (accountCode?: string) =>
    chartOfAccounts.filter((account) => {
      if (!accountCode) return !account.parentCode;
      if (account.code === accountCode) return false;
      return !isDescendantAccount(account.code, accountCode);
    });

  const startEditAccount = (accountCode: string) => {
    const account = chartOfAccounts.find((item) => item.code === accountCode);
    if (!account) return;
    setEditingAccountCode(accountCode);
    setEditAccount({
      code: account.code,
      name: account.name,
      parentCode: account.parentCode || '',
      category: account.category,
      isActive: account.isActive,
    });
  };

  const saveEditAccount = async () => {
    if (!editingAccountCode) return;
    const nextCode = editAccount.code.trim();
    const nextName = editAccount.name.trim();
    if (!nextCode || !nextName) {
      alert('Kode akun dan nama akun wajib diisi');
      return;
    }
    const duplicate = chartOfAccounts.some(
      (account) => account.code === nextCode && account.code !== editingAccountCode,
    );
    if (duplicate) {
      alert('Kode akun sudah digunakan akun lain');
      return;
    }
    if (editAccount.parentCode === editingAccountCode || editAccount.parentCode === nextCode) {
      alert('Akun tidak bisa menjadi parent untuk dirinya sendiri');
      return;
    }
    await updateChartOfAccount(editingAccountCode, {
      code: nextCode,
      name: nextName,
      parentCode: editAccount.parentCode || null,
      category: editAccount.category,
      isActive: editAccount.isActive,
    });
    setEditingAccountCode(null);
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

    const uploads = [
      { file: formData.debitDocumentFile, documentSide: 'debit' as const },
      { file: formData.creditDocumentFile, documentSide: 'credit' as const },
    ];

    for (const upload of uploads) {
      if (!upload.file) continue;
      const fileData = await readFileAsDataUrl(upload.file);
      await addJournalDocument({
        journalEntryId: journalId,
        documentSide: upload.documentSide,
        fileName: upload.file.name,
        fileData,
        fileType: upload.file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
      });
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
      debitDocumentFile: null,
      creditDocumentFile: null,
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
    const debitAmount = Number(editFormData.debitAmount);
    const creditAmount = Number(editFormData.creditAmount);

    if (!editFormData.date || !editFormData.description.trim()) {
      alert('Tanggal dan deskripsi wajib diisi');
      return;
    }

    if (!editFormData.debitAccount || !editFormData.creditAccount) {
      alert('Akun debit dan kredit wajib dipilih');
      return;
    }

    if (!Number.isFinite(debitAmount) || !Number.isFinite(creditAmount) || debitAmount <= 0 || creditAmount <= 0) {
      alert('Nominal debit dan kredit harus lebih dari 0');
      return;
    }

    if (debitAmount !== creditAmount) {
      alert('Nominal debit dan kredit harus sama');
      return;
    }

    await updateJournalEntry(editingJournalId, {
      date: editFormData.date,
      description: editFormData.description.trim(),
      debitAccount: editFormData.debitAccount,
      debitAssetId: editFormData.debitAssetId || undefined,
      debitAmount,
      creditAccount: editFormData.creditAccount,
      creditAssetId: editFormData.creditAssetId || undefined,
      creditAmount,
    });
    setEditingJournalId(null);
  };

  const handleDeleteJournal = async (entryId: string, description: string) => {
    const label = description.trim() || 'jurnal ini';
    if (!window.confirm(`Hapus transaksi "${label}" dari jurnal umum?`)) return;
    await deleteJournalEntry(entryId);
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

  const renderDocumentButtons = (journalEntryId: string) => {
    const docs = documentsPreview[journalEntryId] || [];
    if (docs.length === 0) return null;
    return (
      <div className="flex flex-wrap justify-center gap-1">
        {docs.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => setPreviewDocument(doc)}
            className="text-xs px-2 py-1 rounded flex items-center gap-1"
            style={{ backgroundColor: '#E7F5E9', color: '#1B4332' }}
            title={`${sideLabel(doc.documentSide)} - ${doc.fileName}`}
          >
            <Eye size={11} />
            {sideLabel(doc.documentSide)}
          </button>
        ))}
      </div>
    );
  };

  const renderAccountOptions = () =>
    chartOfAccounts.filter(a => !a.parentCode).map((acc) => (
      <optgroup key={acc.code} label={`${acc.code} ${acc.name}`}>
        <option value={`${acc.code} ${acc.name}`}>
          {acc.code} {acc.name}
        </option>
        {getAccountsByParent(acc.code).map(child => (
          <option key={child.code} value={`${child.code} ${child.name}`}>
            {child.code} {child.name}
          </option>
        ))}
      </optgroup>
    ));

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
            {editingAccountCode === account.code ? (
              <>
                <input
                  type="text"
                  value={editAccount.code}
                  onChange={(e) => setEditAccount({ ...editAccount, code: e.target.value })}
                  className="w-28 px-2 py-1 border rounded text-sm font-mono"
                  style={{ borderColor: '#DEE2E6' }}
                />
                <input
                  type="text"
                  value={editAccount.name}
                  onChange={(e) => setEditAccount({ ...editAccount, name: e.target.value })}
                  className="px-2 py-1 border rounded text-sm flex-1"
                  style={{ borderColor: '#DEE2E6' }}
                />
                <select
                  value={editAccount.parentCode}
                  onChange={(e) => setEditAccount({ ...editAccount, parentCode: e.target.value })}
                  className="px-2 py-1 border rounded text-sm"
                  style={{ borderColor: '#DEE2E6' }}
                >
                  <option value="">Tidak ada parent</option>
                  {parentOptionsFor(account.code).map(parent => (
                    <option key={parent.code} value={parent.code}>
                      {parent.code} - {parent.name}
                    </option>
                  ))}
                </select>
                <select
                  value={editAccount.category}
                  onChange={(e) => setEditAccount({ ...editAccount, category: e.target.value as any })}
                  className="px-2 py-1 border rounded text-sm"
                  style={{ borderColor: '#DEE2E6' }}
                >
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="equity">Equity</option>
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                </select>
                <button
                  onClick={saveEditAccount}
                  className="p-1.5 rounded"
                  style={{ backgroundColor: '#1B4332', color: 'white' }}
                >
                  <Check size={13} />
                </button>
                <button
                  onClick={() => setEditingAccountCode(null)}
                  className="p-1.5 rounded"
                  style={{ backgroundColor: '#DC3545', color: 'white' }}
                >
                  <X size={13} />
                </button>
              </>
            ) : (
              <>
                <span className="text-sm font-mono font-semibold">{account.code}</span>
                <span className="text-sm flex-1">{account.name}</span>
                <span className="text-xs" style={{ color: '#6C757D' }}>
                  Dibuat oleh {adminLabel(account.createdBy)}
                </span>
                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#E9ECEF', color: '#495057' }}>
                  {account.parentCode ? `Child dari ${account.parentCode}` : 'Parent'}
                </span>
                <button
                  onClick={() => startEditAccount(account.code)}
                  className="p-1 rounded"
                  style={{ backgroundColor: '#FFF3CD', color: '#856404' }}
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => handleDeleteAccount(account.code)}
                  className="p-1 rounded"
                  style={{ backgroundColor: '#FFE5E5', color: '#DC3545' }}
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
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

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#F0F8FF' }}>
                    <label className="block text-sm mb-2" style={{ color: '#495057' }}>
                      Dokumen Pendukung Debit
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setFormData({ ...formData, debitDocumentFile: e.target.files?.[0] || null })}
                      className="w-full px-3 py-2 border rounded text-sm"
                      style={{ borderColor: '#DEE2E6' }}
                    />
                    {formData.debitDocumentFile && (
                      <div className="text-xs mt-1" style={{ color: '#28A745' }}>
                        {formData.debitDocumentFile.name}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#F0F8FF' }}>
                    <label className="block text-sm mb-2" style={{ color: '#495057' }}>
                      Dokumen Pendukung Kredit
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setFormData({ ...formData, creditDocumentFile: e.target.files?.[0] || null })}
                      className="w-full px-3 py-2 border rounded text-sm"
                      style={{ borderColor: '#DEE2E6' }}
                    />
                    {formData.creditDocumentFile && (
                      <div className="text-xs mt-1" style={{ color: '#28A745' }}>
                        {formData.creditDocumentFile.name}
                      </div>
                    )}
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
                    <th className="px-3 py-2 text-left">Dibuat Oleh</th>
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
                              className="w-32 px-2 py-1 border rounded text-xs"
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
                          <td className="px-3 py-2">
                            <select
                              value={editFormData.debitAccount}
                              onChange={(e) => setEditFormData({ ...editFormData, debitAccount: e.target.value })}
                              className="w-52 px-2 py-1 border rounded text-xs"
                              style={{ borderColor: '#DEE2E6' }}
                            >
                              <option value="">Pilih Akun Debit</option>
                              {renderAccountOptions()}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={editFormData.debitAmount}
                              onChange={(e) => setEditFormData({ ...editFormData, debitAmount: e.target.value })}
                              className="w-28 px-2 py-1 border rounded text-xs text-right"
                              style={{ borderColor: '#DEE2E6' }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={editFormData.creditAccount}
                              onChange={(e) => setEditFormData({ ...editFormData, creditAccount: e.target.value })}
                              className="w-52 px-2 py-1 border rounded text-xs"
                              style={{ borderColor: '#DEE2E6' }}
                            >
                              <option value="">Pilih Akun Kredit</option>
                              {renderAccountOptions()}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={editFormData.creditAmount}
                              onChange={(e) => setEditFormData({ ...editFormData, creditAmount: e.target.value })}
                              className="w-28 px-2 py-1 border rounded text-xs text-right"
                              style={{ borderColor: '#DEE2E6' }}
                            />
                          </td>
                          <td className="px-3 py-2 text-xs" style={{ color: '#495057' }}>
                            {adminLabel(entry.createdBy || entry.updatedBy)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {renderDocumentButtons(entry.id)}
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
                          <td className="px-3 py-2 text-xs" style={{ color: '#495057' }}>
                            {adminLabel(entry.createdBy || entry.updatedBy)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {renderDocumentButtons(entry.id)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex gap-1 justify-center">
                              <button
                                type="button"
                                onClick={() => startEditJournal(entry.id)}
                                className="p-1 rounded"
                                style={{ backgroundColor: '#FFB703', color: '#212529' }}
                                title="Edit jurnal"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteJournal(entry.id, entry.description)}
                                className="p-1 rounded"
                                style={{ backgroundColor: '#FFE5E5', color: '#DC3545' }}
                                title="Hapus jurnal"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
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

      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="bg-white rounded-lg border w-full max-w-4xl max-h-[90vh] overflow-hidden" style={{ borderColor: '#DEE2E6' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#DEE2E6' }}>
              <div>
                <h2 className="text-base" style={{ color: '#1B4332' }}>{previewDocument.fileName}</h2>
                <p className="text-xs" style={{ color: '#6C757D' }}>
                  Dokumen {sideLabel(previewDocument.documentSide)}
                  {' '} - Diunggah oleh {adminLabel(previewDocument.uploadedBy)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => downloadDocument(previewDocument)}
                  className="px-3 py-2 rounded text-white text-sm"
                  style={{ backgroundColor: '#1B4332' }}
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDocument(null)}
                  className="px-3 py-2 rounded text-sm"
                  style={{ backgroundColor: '#E9ECEF', color: '#495057' }}
                >
                  Tutup
                </button>
              </div>
            </div>
            <div className="p-5 overflow-auto" style={{ maxHeight: '72vh' }}>
              {previewDocument.fileType.startsWith('image/') ? (
                <img
                  src={previewDocument.fileData}
                  alt={previewDocument.fileName}
                  className="max-w-full mx-auto"
                />
              ) : (
                <iframe
                  src={previewDocument.fileData}
                  title={previewDocument.fileName}
                  className="w-full h-[65vh] border rounded"
                  style={{ borderColor: '#DEE2E6' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
