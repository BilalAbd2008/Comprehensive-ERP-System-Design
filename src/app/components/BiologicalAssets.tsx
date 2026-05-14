import { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { Edit2, Check, X, QrCode, Scan, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import QRCodeDisplay from './QRCodeDisplay';

export default function BiologicalAssets() {
  const {
    biologicalAssets,
    updateAssetWeight,
    updateBiologicalAsset,
    addBiologicalAsset,
    deleteBiologicalAsset,
    fairValuePerKg,
    setFairValuePerKg,
    addJournalEntry,
  } = useData();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    weight: 0,
    purchasePrice: 0,
    profit: 0,
    loss: 0,
    lastUpdated: '',
    manualDate: false,
  });
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [pricePerKgInput, setPricePerKgInput] = useState<string>(String(fairValuePerKg));
  
  const [newAsset, setNewAsset] = useState({
    tagId: '',
    type: 'Domba' as 'Domba' | 'Kambing',
    age: 0,
    weight: 0,
    purchasePrice: 0,
  });

  useEffect(() => {
    setPricePerKgInput(String(fairValuePerKg));
  }, [fairValuePerKg]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleEdit = (id: string, asset: any) => {
    setEditingId(id);
    setEditData({
      weight: asset.weight,
      purchasePrice: asset.purchasePrice || 0,
      profit: asset.profit || 0,
      loss: asset.loss || 0,
      lastUpdated: asset.lastUpdated,
      manualDate: false,
    });
  };

  const handleSave = async (id: string) => {
    const asset = biologicalAssets.find(a => a.id === id);
    if (!asset) return;

    const oldFairValue = asset.fairValue;
    const newFairValue = editData.weight * fairValuePerKg;
    const difference = newFairValue - oldFairValue;

    // Update asset
    await updateBiologicalAsset(id, {
      weight: editData.weight,
      fairValue: newFairValue,
      purchasePrice: editData.purchasePrice,
      profit: editData.profit || 0,
      loss: editData.loss || 0,
      lastUpdated: editData.manualDate ? editData.lastUpdated : new Date().toISOString().split('T')[0],
    });

    // Auto-create journal entries if there are profit/loss changes
    if (difference !== 0 || editData.profit > 0 || editData.loss > 0) {
      if (difference !== 0) {
        // Fair value adjustment
        await addJournalEntry({
          date: editData.manualDate ? editData.lastUpdated : new Date().toISOString().split('T')[0],
          description: `Penyesuaian Nilai Wajar ${asset.tagId} (${asset.weight}kg → ${editData.weight}kg)`,
          debitAccount: difference > 0 ? "1-3000 Aset Biologis" : "5-4000 Kerugian Nilai Wajar",
          debitAssetId: id,
          debitAmount: Math.abs(difference),
          creditAccount: difference > 0 ? "4-2000 Keuntungan Nilai Wajar" : "1-3000 Aset Biologis",
          creditAssetId: difference < 0 ? id : undefined,
          creditAmount: Math.abs(difference),
        });
      }

      // Profit journal entry
      if (editData.profit > 0) {
        await addJournalEntry({
          date: editData.manualDate ? editData.lastUpdated : new Date().toISOString().split('T')[0],
          description: `Keuntungan ${asset.tagId} - ${asset.type}`,
          debitAccount: "1-1100 Kas",
          debitAmount: editData.profit,
          creditAccount: "4-1000 Pendapatan Penjualan",
          creditAmount: editData.profit,
        });
      }

      // Loss journal entry
      if (editData.loss > 0) {
        await addJournalEntry({
          date: editData.manualDate ? editData.lastUpdated : new Date().toISOString().split('T')[0],
          description: `Kerugian ${asset.tagId} - ${asset.type}`,
          debitAccount: "5-5000 Beban Lain-lain",
          debitAmount: editData.loss,
          creditAccount: "1-1100 Kas",
          creditAmount: editData.loss,
        });
      }
    }

    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleScanSubmit = () => {
    const asset = biologicalAssets.find(a => a.tagId === scanInput);
    if (asset) {
      handleEdit(asset.id, asset);
      setScanMode(false);
      setScanInput('');
    } else {
      alert('QR Code tidak ditemukan!');
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const fairValue = newAsset.weight * fairValuePerKg;
    await addBiologicalAsset({
      ...newAsset,
      fairValue,
      purchasePrice: newAsset.purchasePrice || fairValue,
    });
    setNewAsset({ tagId: '', type: 'Domba', age: 0, weight: 0, purchasePrice: 0 });
    setShowAddForm(false);
  };

  const handleDeleteAsset = async (id: string, tagId: string) => {
    if (window.confirm(`Hapus ${tagId} dari listing? Jurnal HPP akan otomatis dibuat.`)) {
      await deleteBiologicalAsset(id);
    }
  };

  const handleApplyFairValuePerKg = async () => {
    const parsed = Number(pricePerKgInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      alert('Harga per kg harus lebih dari 0');
      return;
    }
    await setFairValuePerKg(parsed);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl mb-1" style={{ color: '#1B4332' }}>
            Modul Aset Biologis
          </h1>
          <p className="text-sm" style={{ color: '#6C757D' }}>
            Integrated Tracking - PSAK 241 dengan Nilai Beli, Untung & Rugi
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 rounded text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1B4332' }}
          >
            <Plus size={18} />
            {showAddForm ? 'Batal' : 'Tambah Aset'}
          </button>
          <button
            onClick={() => setScanMode(!scanMode)}
            className="flex items-center gap-2 px-4 py-2 rounded transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#FFB703', color: '#212529' }}
          >
            <Scan size={18} />
            {scanMode ? 'Tutup Scanner' : 'Scan QR Code'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg border mb-6" style={{ borderColor: '#1B4332' }}>
          <h2 className="text-base mb-4" style={{ color: '#1B4332' }}>
            Tambah Aset Biologis Baru
          </h2>
          <div className="mb-4 p-4 rounded" style={{ backgroundColor: '#F8F9FA' }}>
            <label className="block text-sm mb-2" style={{ color: '#495057' }}>
              Harga per Kg (Nilai Wajar)
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={pricePerKgInput}
                onChange={(e) => setPricePerKgInput(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: '#DEE2E6' }}
                min={1}
              />
              <button
                type="button"
                onClick={handleApplyFairValuePerKg}
                className="px-4 py-2 rounded text-white"
                style={{ backgroundColor: '#1B4332' }}
              >
                Simpan Harga/Kg
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: '#6C757D' }}>
              Harga saat ini: Rp {Number(fairValuePerKg).toLocaleString('id-ID')}/kg
            </p>
          </div>
          <form onSubmit={handleAddAsset} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: '#495057' }}>ID Tag</label>
                <input
                  type="text"
                  value={newAsset.tagId}
                  onChange={(e) => setNewAsset({ ...newAsset, tagId: e.target.value })}
                  placeholder="DOM-006 atau KMB-004"
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: '#DEE2E6' }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#495057' }}>Jenis</label>
                <select
                  value={newAsset.type}
                  onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value as 'Domba' | 'Kambing' })}
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: '#DEE2E6' }}
                >
                  <option value="Domba">Domba</option>
                  <option value="Kambing">Kambing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#495057' }}>Umur (bulan)</label>
                <input
                  type="number"
                  value={newAsset.age}
                  onChange={(e) => setNewAsset({ ...newAsset, age: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: '#DEE2E6' }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#495057' }}>Berat (kg)</label>
                <input
                  type="number"
                  value={newAsset.weight}
                  onChange={(e) => setNewAsset({ ...newAsset, weight: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: '#DEE2E6' }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#495057' }}>Harga Beli</label>
                <input
                  type="number"
                  value={newAsset.purchasePrice}
                  onChange={(e) => setNewAsset({ ...newAsset, purchasePrice: Number(e.target.value) })}
                  placeholder="Atau biarkan kosong"
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: '#DEE2E6' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded" style={{ backgroundColor: '#E7F5E9' }}>
                <div className="text-xs mb-1" style={{ color: '#495057' }}>Nilai Wajar Otomatis:</div>
                <div className="text-base" style={{ color: '#1B4332' }}>
                  {formatCurrency(newAsset.weight * fairValuePerKg)}
                </div>
              </div>
              <div className="p-3 rounded" style={{ backgroundColor: '#FFF3CD' }}>
                <div className="text-xs mb-1" style={{ color: '#495057' }}>Harga Beli:</div>
                <div className="text-base" style={{ color: '#856404' }}>
                  {formatCurrency(newAsset.purchasePrice || newAsset.weight * fairValuePerKg)}
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1B4332' }}
            >
              Simpan & Buat Jurnal Otomatis
            </button>
          </form>
        </div>
      )}

      {scanMode && (
        <div className="bg-white p-6 rounded-lg border mb-6" style={{ borderColor: '#FFB703' }}>
          <h2 className="text-base mb-4" style={{ color: '#1B4332' }}>
            Scan QR Code untuk Edit Real-time
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Masukkan atau scan QR Code (contoh: DOM-001)"
              className="flex-1 px-4 py-2 border rounded"
              style={{ borderColor: '#DEE2E6' }}
              autoFocus
            />
            <button
              onClick={handleScanSubmit}
              className="px-6 py-2 rounded text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1B4332' }}
            >
              Cari
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#DEE2E6' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#1B4332', color: 'white' }}>
                <th className="px-4 py-3 text-left text-sm">QR</th>
                <th className="px-4 py-3 text-left text-sm">ID Tag</th>
                <th className="px-4 py-3 text-left text-sm">Jenis</th>
                <th className="px-4 py-3 text-left text-sm">Umur</th>
                <th className="px-4 py-3 text-left text-sm">Berat (kg)</th>
                <th className="px-4 py-3 text-left text-sm">Harga Beli</th>
                <th className="px-4 py-3 text-left text-sm">Nilai Wajar</th>
                <th className="px-4 py-3 text-left text-sm">Untung</th>
                <th className="px-4 py-3 text-left text-sm">Rugi</th>
                <th className="px-4 py-3 text-left text-sm">Update</th>
                <th className="px-4 py-3 text-left text-sm">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {biologicalAssets.map((asset) => (
                <tr
                  key={asset.id}
                  className="border-b transition-colors hover:bg-gray-50"
                  style={{ borderColor: '#DEE2E6' }}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setShowQRCode(showQRCode === asset.id ? null : asset.id)}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <QrCode size={18} style={{ color: '#1B4332' }} />
                    </button>
                    {showQRCode === asset.id && (
                      <div className="absolute z-10 mt-2 p-4 bg-white rounded-lg shadow-xl border" style={{ borderColor: '#1B4332' }}>
                        <QRCodeDisplay value={asset.tagId} size={120} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{asset.tagId}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: asset.type === 'Domba' ? '#E7F5E9' : '#FFF3CD',
                        color: asset.type === 'Domba' ? '#1B4332' : '#856404',
                      }}
                    >
                      {asset.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{asset.age}</td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === asset.id ? (
                      <input
                        type="number"
                        value={editData.weight}
                        onChange={(e) => setEditData({ ...editData, weight: Number(e.target.value) })}
                        className="w-20 px-2 py-1 border rounded text-sm"
                        style={{ borderColor: '#FFB703' }}
                        autoFocus
                      />
                    ) : (
                      asset.weight
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === asset.id ? (
                      <input
                        type="number"
                        value={editData.purchasePrice}
                        onChange={(e) => setEditData({ ...editData, purchasePrice: Number(e.target.value) })}
                        className="w-24 px-2 py-1 border rounded text-sm"
                        style={{ borderColor: '#FFB703' }}
                      />
                    ) : (
                      formatCurrency(asset.purchasePrice || 0)
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">
                    {formatCurrency(editingId === asset.id ? editData.weight * fairValuePerKg : asset.fairValue)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === asset.id ? (
                      <input
                        type="number"
                        value={editData.profit}
                        onChange={(e) => setEditData({ ...editData, profit: Number(e.target.value) })}
                        placeholder="0"
                        className="w-24 px-2 py-1 border rounded text-sm"
                        style={{ borderColor: '#28A745' }}
                      />
                    ) : (
                      <span style={{ color: asset.profit ? '#28A745' : '#6C757D' }}>
                        {formatCurrency(asset.profit || 0)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === asset.id ? (
                      <input
                        type="number"
                        value={editData.loss}
                        onChange={(e) => setEditData({ ...editData, loss: Number(e.target.value) })}
                        placeholder="0"
                        className="w-24 px-2 py-1 border rounded text-sm"
                        style={{ borderColor: '#DC3545' }}
                      />
                    ) : (
                      <span style={{ color: asset.loss ? '#DC3545' : '#6C757D' }}>
                        {formatCurrency(asset.loss || 0)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {editingId === asset.id ? (
                      <div className="space-y-1">
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={editData.manualDate}
                            onChange={(e) => setEditData({ ...editData, manualDate: e.target.checked })}
                          />
                          Manual
                        </label>
                        {editData.manualDate && (
                          <input
                            type="date"
                            value={editData.lastUpdated}
                            onChange={(e) => setEditData({ ...editData, lastUpdated: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-xs"
                            style={{ borderColor: '#DEE2E6' }}
                          />
                        )}
                      </div>
                    ) : (
                      asset.lastUpdated
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === asset.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(asset.id)}
                          className="p-1.5 rounded transition-colors"
                          style={{ backgroundColor: '#1B4332', color: 'white' }}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1.5 rounded transition-colors"
                          style={{ backgroundColor: '#DC3545', color: 'white' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(asset.id, asset)}
                          className="p-1.5 rounded transition-colors"
                          style={{ backgroundColor: '#FFB703', color: '#212529' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(asset.id, asset.tagId)}
                          className="p-1.5 rounded transition-colors"
                          style={{ backgroundColor: '#DC3545', color: 'white' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#F8F9FA' }}>
                <td colSpan={3} className="px-4 py-3 text-sm font-semibold" style={{ color: '#1B4332' }}>
                  Total: {biologicalAssets.length} Ekor
                </td>
                <td colSpan={3}></td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#1B4332' }}>
                  {formatCurrency(biologicalAssets.reduce((sum, a) => sum + a.fairValue, 0))}
                </td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#28A745' }}>
                  {formatCurrency(biologicalAssets.reduce((sum, a) => sum + (a.profit || 0), 0))}
                </td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#DC3545' }}>
                  {formatCurrency(biologicalAssets.reduce((sum, a) => sum + (a.loss || 0), 0))}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#E7F5E9' }}>
          <h3 className="text-sm mb-2" style={{ color: '#1B4332' }}>✨ Fitur Baru: Nilai Beli, Untung & Rugi</h3>
          <div className="text-xs space-y-2" style={{ color: '#495057' }}>
            <p><strong>Kolom Harga Beli:</strong> Input harga saat membeli aset (opsional, default = nilai wajar)</p>
            <p><strong>Kolom Untung:</strong> Input keuntungan jika aset dijual dengan laba</p>
            <p><strong>Kolom Rugi:</strong> Input kerugian jika aset dijual dengan rugi</p>
            <p className="p-2 rounded" style={{ backgroundColor: '#fff' }}>
              🔄 <strong>Otomatis Jurnal:</strong> Setiap kali Anda edit dan simpan, sistem akan otomatis membuat jurnal untuk:
              <br />• Penyesuaian nilai wajar
              <br />• Pencatatan keuntungan ke Pendapatan Penjualan
              <br />• Pencatatan kerugian ke Beban Lain-lain
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF3CD' }}>
          <h3 className="text-sm mb-2" style={{ color: '#856404' }}>📅 Fitur Tanggal Manual</h3>
          <p className="text-xs" style={{ color: '#856404' }}>
            Saat edit, centang "Manual" untuk mengubah tanggal update. Tanggal otomatis (hari ini) akan digunakan jika tidak diubah.
          </p>
        </div>
      </div>
    </div>
  );
}
