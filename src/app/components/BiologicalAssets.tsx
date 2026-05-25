import { useEffect, useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { Edit2, Check, X, QrCode, Scan, Plus, Trash2 } from 'lucide-react';
import QRCodeDisplay from './QRCodeDisplay';

export default function BiologicalAssets() {
  const {
    biologicalAssets,
    updateAssetWeight,
    updateBiologicalAsset,
    addBiologicalAsset,
    deleteBiologicalAsset,
    fairValuePerKg,
    fairValuePerKgByType,
    animalTypes,
    setFairValuePerKgForType,
    addAnimalType,
    admins,
  } = useData();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [columnSearch, setColumnSearch] = useState({
    tagId: '',
    type: '',
    age: '',
    weight: '',
    purchasePrice: '',
    fairValue: '',
    profit: '',
    loss: '',
    admin: '',
    updated: '',
  });
  const [editData, setEditData] = useState({
    tagId: '',
    type: '',
    age: 0,
    weight: 0,
    purchasePrice: 0,
    lastUpdated: '',
    manualDate: false,
  });
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [pricePerKgInput, setPricePerKgInput] = useState<string>('');
  const [purchasePriceInput, setPurchasePriceInput] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypePrice, setNewTypePrice] = useState('');
  
  const [newAsset, setNewAsset] = useState({
    tagId: '',
    type: 'Domba',
    age: 0,
    weight: 0,
  });

  useEffect(() => {
    setPricePerKgInput(String(fairValuePerKgByType[newAsset.type] || fairValuePerKg));
  }, [fairValuePerKgByType, fairValuePerKg, newAsset.type]);

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
      tagId: asset.tagId,
      type: asset.type,
      age: asset.age,
      weight: asset.weight,
      purchasePrice: asset.purchasePrice || 0,
      lastUpdated: asset.lastUpdated,
      manualDate: false,
    });
  };

  const getPricePerKgForType = (type: string) =>
    fairValuePerKgByType[type] || fairValuePerKg;

  const adminLabel = (username?: string) => {
    if (!username) return '-';
    const admin = admins.find((item) => item.username === username);
    return admin ? `${admin.fullName} (@${admin.username})` : `@${username}`;
  };

  const filteredAssets = useMemo(() => {
    const filters = Object.fromEntries(
      Object.entries(columnSearch).map(([key, value]) => [key, value.trim().toLowerCase()]),
    );

    return biologicalAssets.filter((asset) => {
      const values = {
        tagId: asset.tagId,
        type: asset.type,
        age: String(asset.age),
        weight: String(asset.weight),
        purchasePrice: String(asset.purchasePrice || 0),
        fairValue: String(asset.fairValue || 0),
        profit: String(asset.profit || 0),
        loss: String(asset.loss || 0),
        admin: adminLabel(asset.createdBy || asset.updatedBy),
        updated: asset.lastUpdated,
      };

      return Object.entries(filters).every(([key, filter]) =>
        !filter || String(values[key as keyof typeof values]).toLowerCase().includes(filter),
      );
    });
  }, [biologicalAssets, columnSearch, admins]);

  const updateColumnSearch = (key: keyof typeof columnSearch, value: string) => {
    setColumnSearch((current) => ({ ...current, [key]: value }));
  };

  const renderColumnSearch = (
    key: keyof typeof columnSearch,
    placeholder: string,
    width = 'w-24',
  ) => (
    <input
      type="text"
      value={columnSearch[key]}
      onChange={(e) => updateColumnSearch(key, e.target.value)}
      placeholder={placeholder}
      className={`${width} px-2 py-1 border rounded text-xs text-gray-900`}
      style={{ borderColor: '#DEE2E6' }}
    />
  );

  const handleSave = async (id: string) => {
    const asset = biologicalAssets.find(a => a.id === id);
    if (!asset) return;

    const nextTagId = editData.tagId.trim();
    if (!nextTagId) {
      alert('ID Tag wajib diisi');
      return;
    }

    const duplicateTag = biologicalAssets.some(
      (item) => item.id !== id && item.tagId.trim().toLowerCase() === nextTagId.toLowerCase(),
    );
    if (duplicateTag) {
      alert('ID Tag sudah digunakan aset lain');
      return;
    }

    if (!editData.type) {
      alert('Jenis hewan wajib dipilih');
      return;
    }

    if (!Number.isFinite(editData.age) || editData.age < 0) {
      alert('Umur harus 0 atau lebih');
      return;
    }

    const updateDate = editData.manualDate ? editData.lastUpdated : new Date().toISOString().split('T')[0];
    const newFairValue = editData.weight * getPricePerKgForType(editData.type);

    await updateBiologicalAsset(id, {
      tagId: nextTagId,
      type: editData.type,
      age: editData.age,
      weight: editData.weight,
      fairValue: newFairValue,
      purchasePrice: editData.purchasePrice,
      ageUpdatedAt: editData.age !== asset.age ? updateDate : asset.ageUpdatedAt,
      lastUpdated: updateDate,
    });

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
    const fairValue = newAsset.weight * getPricePerKgForType(newAsset.type);
    const purchasePrice = Number(purchasePriceInput || 0);
    await addBiologicalAsset({
      ...newAsset,
      fairValue,
      purchasePrice,
      profit: Math.max(fairValue - purchasePrice, 0),
      loss: Math.max(purchasePrice - fairValue, 0),
    });
    setNewAsset({ tagId: '', type: animalTypes[0] || 'Domba', age: 0, weight: 0 });
    setPurchasePriceInput('');
    setShowAddForm(false);
  };

  const selectedPricePerKg = getPricePerKgForType(newAsset.type);
  const newAssetFairValue = newAsset.weight * selectedPricePerKg;
  const newAssetPurchasePrice = Number(purchasePriceInput || 0);
  const newAssetProfit = Math.max(newAssetFairValue - newAssetPurchasePrice, 0);
  const newAssetLoss = Math.max(newAssetPurchasePrice - newAssetFairValue, 0);

  const handleDeleteAsset = async (id: string, tagId: string) => {
    if (window.confirm(`Hapus ${tagId} dari listing? Jurnal HPP berdasarkan nilai wajar akan otomatis dibuat.`)) {
      await deleteBiologicalAsset(id);
    }
  };

  const handleApplyFairValuePerKg = async () => {
    const parsed = Number(pricePerKgInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      alert('Harga per kg harus lebih dari 0');
      return;
    }
    await setFairValuePerKgForType(newAsset.type, parsed);
  };

  const handleAddAnimalType = async () => {
    const parsed = Number(newTypePrice);
    await addAnimalType(newTypeName, parsed);
    if (newTypeName.trim() && Number.isFinite(parsed) && parsed > 0) {
      setNewAsset({ ...newAsset, type: newTypeName.trim() });
      setNewTypeName('');
      setNewTypePrice('');
    }
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
              Harga per Kg (Nilai Wajar) untuk {newAsset.type}
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
              Harga {newAsset.type} saat ini: Rp {Number(selectedPricePerKg).toLocaleString('id-ID')}/kg. Mengubah harga ini akan memperbarui semua aset {newAsset.type}.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Tambah jenis hewan"
                className="px-3 py-2 border rounded"
                style={{ borderColor: '#DEE2E6' }}
              />
              <input
                type="number"
                value={newTypePrice}
                onChange={(e) => setNewTypePrice(e.target.value)}
                placeholder="Harga/kg awal"
                className="px-3 py-2 border rounded"
                style={{ borderColor: '#DEE2E6' }}
                min={1}
              />
              <button
                type="button"
                onClick={handleAddAnimalType}
                className="px-4 py-2 rounded"
                style={{ backgroundColor: '#FFB703', color: '#212529' }}
              >
                Tambah Jenis
              </button>
            </div>
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
                  onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: '#DEE2E6' }}
                >
                  {animalTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
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
                  value={purchasePriceInput}
                  onChange={(e) => setPurchasePriceInput(e.target.value)}
                  placeholder="Isi manual"
                  className="w-full px-3 py-2 border rounded"
                  style={{
                    borderColor: purchasePriceInput ? '#FFB703' : '#DEE2E6',
                    backgroundColor: purchasePriceInput ? '#FFF3CD' : 'white',
                  }}
                />
              </div>
            </div>
            <div className={`grid gap-4 ${purchasePriceInput ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div className="p-3 rounded" style={{ backgroundColor: '#E7F5E9' }}>
                <div className="text-xs mb-1" style={{ color: '#495057' }}>Nilai Wajar Otomatis:</div>
                <div className="text-base" style={{ color: '#1B4332' }}>
                  {formatCurrency(newAssetFairValue)}
                </div>
              </div>
              {purchasePriceInput && (
                <div className="p-3 rounded" style={{ backgroundColor: '#FFF3CD' }}>
                  <div className="text-xs mb-1" style={{ color: '#495057' }}>Harga Beli Manual:</div>
                  <div className="text-base" style={{ color: '#856404' }}>
                    {formatCurrency(newAssetPurchasePrice)}
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded" style={{ backgroundColor: '#E7F5E9' }}>
                <div className="text-xs mb-1" style={{ color: '#495057' }}>Untung otomatis:</div>
                <div className="text-base" style={{ color: '#1B4332' }}>
                  {formatCurrency(newAssetProfit)}
                </div>
              </div>
              <div className="p-3 rounded" style={{ backgroundColor: '#F8D7DA' }}>
                <div className="text-xs mb-1" style={{ color: '#495057' }}>Rugi otomatis:</div>
                <div className="text-base" style={{ color: '#721C24' }}>
                  {formatCurrency(newAssetLoss)}
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
                <th className="px-4 py-3 text-left text-sm">Dibuat Oleh</th>
                <th className="px-4 py-3 text-left text-sm">Update</th>
                <th className="px-4 py-3 text-left text-sm">Aksi</th>
              </tr>
              <tr style={{ backgroundColor: '#F8F9FA' }}>
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2">{renderColumnSearch('tagId', 'Cari tag', 'w-44')}</th>
                <th className="px-4 py-2">{renderColumnSearch('type', 'Jenis')}</th>
                <th className="px-4 py-2">{renderColumnSearch('age', 'Umur', 'w-20')}</th>
                <th className="px-4 py-2">{renderColumnSearch('weight', 'Berat', 'w-20')}</th>
                <th className="px-4 py-2">{renderColumnSearch('purchasePrice', 'Beli')}</th>
                <th className="px-4 py-2">{renderColumnSearch('fairValue', 'Wajar')}</th>
                <th className="px-4 py-2">{renderColumnSearch('profit', 'Untung')}</th>
                <th className="px-4 py-2">{renderColumnSearch('loss', 'Rugi')}</th>
                <th className="px-4 py-2">{renderColumnSearch('admin', 'Admin', 'w-32')}</th>
                <th className="px-4 py-2">{renderColumnSearch('updated', 'Tanggal', 'w-28')}</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
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
                  <td className="px-4 py-3 text-sm">
                    {editingId === asset.id ? (
                      <input
                        type="text"
                        value={editData.tagId}
                        onChange={(e) => setEditData({ ...editData, tagId: e.target.value })}
                        className="w-52 px-2 py-1 border rounded text-sm"
                        style={{ borderColor: '#FFB703' }}
                      />
                    ) : (
                      asset.tagId
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === asset.id ? (
                      <select
                        value={editData.type}
                        onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                        className="w-28 px-2 py-1 border rounded text-sm"
                        style={{ borderColor: '#FFB703' }}
                      >
                        {animalTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: asset.type === 'Domba' ? '#E7F5E9' : '#FFF3CD',
                          color: asset.type === 'Domba' ? '#1B4332' : '#856404',
                        }}
                      >
                        {asset.type}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === asset.id ? (
                      <input
                        type="number"
                        value={editData.age}
                        onChange={(e) => setEditData({ ...editData, age: Number(e.target.value) })}
                        className="w-20 px-2 py-1 border rounded text-sm"
                        style={{ borderColor: '#FFB703' }}
                        min={0}
                      />
                    ) : (
                      asset.age
                    )}
                  </td>
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
                    {formatCurrency(editingId === asset.id ? editData.weight * getPricePerKgForType(editData.type) : asset.fairValue)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === asset.id ? (
                      <span style={{ color: '#28A745' }}>
                        {formatCurrency(Math.max(
                          editData.weight * getPricePerKgForType(editData.type) - editData.purchasePrice,
                          0,
                        ))}
                      </span>
                    ) : (
                      <span style={{ color: asset.profit ? '#28A745' : '#6C757D' }}>
                        {formatCurrency(asset.profit || 0)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === asset.id ? (
                      <span style={{ color: '#DC3545' }}>
                        {formatCurrency(Math.max(
                          editData.purchasePrice - editData.weight * getPricePerKgForType(editData.type),
                          0,
                        ))}
                      </span>
                    ) : (
                      <span style={{ color: asset.loss ? '#DC3545' : '#6C757D' }}>
                        {formatCurrency(asset.loss || 0)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#495057' }}>
                    {adminLabel(asset.createdBy || asset.updatedBy)}
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
                  Total: {filteredAssets.length} Ekor
                </td>
                <td colSpan={3}></td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#1B4332' }}>
                  {formatCurrency(filteredAssets.reduce((sum, a) => sum + a.fairValue, 0))}
                </td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#28A745' }}>
                  {formatCurrency(filteredAssets.reduce((sum, a) => sum + (a.profit || 0), 0))}
                </td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#DC3545' }}>
                  {formatCurrency(filteredAssets.reduce((sum, a) => sum + (a.loss || 0), 0))}
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
