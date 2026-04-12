import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Edit2, Check, X, QrCode, Scan, Plus, Trash2 } from 'lucide-react';
import QRCodeDisplay from './QRCodeDisplay';

export default function BiologicalAssets() {
  const { biologicalAssets, updateAssetWeight, addBiologicalAsset, deleteBiologicalAsset } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState<number>(0);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAsset, setNewAsset] = useState({
    tagId: '',
    type: 'Domba' as 'Domba' | 'Kambing',
    age: 0,
    weight: 0,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleEdit = (id: string, currentWeight: number) => {
    setEditingId(id);
    setEditWeight(currentWeight);
  };

  const handleSave = (id: string) => {
    updateAssetWeight(id, editWeight);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleScanSubmit = () => {
    const asset = biologicalAssets.find(a => a.tagId === scanInput);
    if (asset) {
      setEditingId(asset.id);
      setEditWeight(asset.weight);
      setScanMode(false);
      setScanInput('');
    } else {
      alert('QR Code tidak ditemukan!');
    }
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const fairValue = newAsset.weight * 100000;
    addBiologicalAsset({
      ...newAsset,
      fairValue,
    });
    setNewAsset({ tagId: '', type: 'Domba', age: 0, weight: 0 });
    setShowAddForm(false);
  };

  const handleDeleteAsset = (id: string, tagId: string) => {
    if (window.confirm(`Hapus ${tagId} dari listing? Jurnal HPP akan otomatis dibuat.`)) {
      deleteBiologicalAsset(id);
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
            Integrated Tracking - PSAK 241
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
          <form onSubmit={handleAddAsset} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="p-3 rounded" style={{ backgroundColor: '#E7F5E9' }}>
              <div className="text-xs mb-1" style={{ color: '#495057' }}>Nilai Wajar Otomatis:</div>
              <div className="text-base" style={{ color: '#1B4332' }}>
                {formatCurrency(newAsset.weight * 100000)}
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
            Scan QR Code untuk Update Real-time
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
          <p className="text-xs mt-2" style={{ color: '#6C757D' }}>
            Simulasi: Ketik ID Tag (DOM-001, KMB-001, dll) untuk mensimulasikan scan QR code
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#DEE2E6' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#1B4332', color: 'white' }}>
                <th className="px-4 py-3 text-left text-sm">QR Code</th>
                <th className="px-4 py-3 text-left text-sm">ID Tag</th>
                <th className="px-4 py-3 text-left text-sm">Jenis</th>
                <th className="px-4 py-3 text-left text-sm">Umur (bulan)</th>
                <th className="px-4 py-3 text-left text-sm">Berat (kg)</th>
                <th className="px-4 py-3 text-left text-sm">Nilai Wajar</th>
                <th className="px-4 py-3 text-left text-sm">Terakhir Update</th>
                <th className="px-4 py-3 text-left text-sm">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {biologicalAssets.map((asset, idx) => (
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
                      <QrCode size={20} style={{ color: '#1B4332' }} />
                    </button>
                    {showQRCode === asset.id && (
                      <div className="absolute z-10 mt-2 p-4 bg-white rounded-lg shadow-xl border" style={{ borderColor: '#1B4332' }}>
                        <QRCodeDisplay value={asset.tagId} size={150} />
                        <p className="text-xs text-center mt-2" style={{ color: '#495057' }}>{asset.tagId}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm" style={{ color: '#212529' }}>{asset.tagId}</span>
                  </td>
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
                  <td className="px-4 py-3 text-sm" style={{ color: '#495057' }}>{asset.age}</td>
                  <td className="px-4 py-3">
                    {editingId === asset.id ? (
                      <input
                        type="number"
                        value={editWeight}
                        onChange={(e) => setEditWeight(Number(e.target.value))}
                        className="w-20 px-2 py-1 border rounded text-sm"
                        style={{ borderColor: '#FFB703' }}
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm" style={{ color: '#212529' }}>{asset.weight}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#1B4332' }}>
                    {formatCurrency(editingId === asset.id ? editWeight * 100000 : asset.fairValue)}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#6C757D' }}>{asset.lastUpdated}</td>
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
                          onClick={() => handleEdit(asset.id, asset.weight)}
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
                <td colSpan={4} className="px-4 py-3 text-sm" style={{ color: '#1B4332' }}>
                  Total Populasi: {biologicalAssets.length} Ekor
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: '#1B4332' }}>
                  {formatCurrency(biologicalAssets.reduce((sum, a) => sum + a.fairValue, 0))}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#E7F5E9' }}>
            <h3 className="text-sm mb-2" style={{ color: '#1B4332' }}>⚡ Logic Integrated - Otomatis Jurnal</h3>
            <p className="text-xs mb-2" style={{ color: '#495057' }}>
              Setiap perubahan berat akan <strong>OTOMATIS</strong>:
            </p>
            <div className="text-xs space-y-1" style={{ color: '#495057' }}>
              <div>1️⃣ Hitung Nilai Wajar baru (Berat × Rp 100.000/kg)</div>
              <div>2️⃣ Hitung selisih dengan Nilai Wajar lama</div>
              <div>3️⃣ Buat jurnal entry OTOMATIS ke GL:</div>
              <div className="pl-4 mt-1 p-2 rounded" style={{ backgroundColor: 'white' }}>
                <strong>Debit:</strong> 1-3000 Aset Biologis<br />
                <strong>Kredit:</strong> 4-2000 Keuntungan Nilai Wajar
              </div>
              <div>4️⃣ Update ke WPL, WBSA, dan Laporan Keuangan</div>
            </div>
            <p className="text-xs mt-2 p-2 rounded" style={{ backgroundColor: '#FFB703', color: '#212529' }}>
              ✅ <strong>Single Input</strong> - Tidak perlu input dua kali!
            </p>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF3CD' }}>
            <h3 className="text-sm mb-2" style={{ color: '#856404' }}>📱 Fitur QR Code Real-time</h3>
            <p className="text-xs" style={{ color: '#856404' }}>
              • Klik ikon QR untuk melihat kode<br />
              • Gunakan tombol "Scan QR Code" untuk update real-time<br />
              • Setiap aset memiliki QR unik untuk tracking<br />
              • Scan → Update Berat → Otomatis Jurnal!
            </p>
          </div>
        </div>

        <div className="p-6 rounded-lg border-2" style={{ backgroundColor: 'white', borderColor: '#1B4332' }}>
          <h3 className="text-base mb-3" style={{ color: '#1B4332' }}>📚 PSAK 241: Akuntansi Pertanian & Aset Biologis</h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm mb-2" style={{ color: '#495057' }}>🎯 Definisi Aset Biologis</h4>
              <p className="text-xs" style={{ color: '#6C757D' }}>
                Aset biologis adalah hewan atau tanaman hidup yang dikelola entitas dalam kegiatan pertanian.
                Contoh: kambing dan domba peternakan Hers Farm.
              </p>
            </div>

            <div>
              <h4 className="text-sm mb-2" style={{ color: '#495057' }}>💰 Pengukuran Nilai Wajar (Fair Value Model)</h4>
              <p className="text-xs mb-2" style={{ color: '#6C757D' }}>
                PSAK 241 mengharuskan aset biologis diukur pada <strong>nilai wajar dikurangi biaya untuk menjual</strong>:
              </p>
              <div className="text-xs space-y-1 pl-4" style={{ color: '#6C757D' }}>
                • <strong>Pengakuan Awal:</strong> Nilai wajar saat pembelian/lahir<br />
                • <strong>Pengukuran Selanjutnya:</strong> Nilai wajar setiap periode pelaporan<br />
                • <strong>Perubahan Nilai Wajar:</strong> Diakui di Laba Rugi periode berjalan
              </div>
            </div>

            <div className="p-3 rounded" style={{ backgroundColor: '#E7F5E9' }}>
              <h4 className="text-sm mb-2" style={{ color: '#1B4332' }}>📊 Cara Kerja di Hers Farm</h4>
              <div className="text-xs space-y-2" style={{ color: '#495057' }}>
                <div>
                  <strong>Contoh Kasus:</strong><br />
                  Domba DOM-001 berat 35kg (Nilai Wajar: Rp 3.500.000)
                </div>
                <div className="pl-4">
                  ⬇️ Setelah 3 bulan, berat naik 38kg
                </div>
                <div className="pl-4">
                  📝 <strong>Sistem Otomatis:</strong><br />
                  1. Nilai Wajar Baru = 38kg × Rp 100.000 = Rp 3.800.000<br />
                  2. Selisih = Rp 3.800.000 - Rp 3.500.000 = Rp 300.000<br />
                  3. Jurnal Otomatis:<br />
                  <span className="pl-4">Dr. Aset Biologis: Rp 300.000</span><br />
                  <span className="pl-4">Cr. Keuntungan Nilai Wajar: Rp 300.000</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm mb-2" style={{ color: '#495057' }}>🔄 Transformasi Biologis</h4>
              <p className="text-xs" style={{ color: '#6C757D' }}>
                Perubahan kualitatif (pertumbuhan, degenerasi) dan kuantitatif (produksi) dari aset biologis
                yang menyebabkan perubahan nilai. Contoh: pertambahan berat domba seiring waktu.
              </p>
            </div>

            <div>
              <h4 className="text-sm mb-2" style={{ color: '#495057' }}>📋 PSAK 69: Agrikultur</h4>
              <p className="text-xs" style={{ color: '#6C757D' }}>
                PSAK 69 adalah standar internasional (adopsi IAS 41) yang mengatur:
              </p>
              <div className="text-xs pl-4 mt-1" style={{ color: '#6C757D' }}>
                • Pengakuan dan pengukuran aset biologis<br />
                • Produk pertanian pada saat panen (diukur nilai wajar)<br />
                • Pengungkapan terkait aktivitas pertanian<br />
                • Perbedaan bearer plants (diatur PSAK 16) vs consumable plants
              </div>
            </div>

            <div className="p-3 rounded" style={{ backgroundColor: '#FFF3CD' }}>
              <h4 className="text-sm mb-2" style={{ color: '#856404' }}>⚠️ Catatan Penting</h4>
              <p className="text-xs" style={{ color: '#856404' }}>
                • Keuntungan/kerugian nilai wajar adalah <strong>unrealized gain/loss</strong> (belum terealisasi)<br />
                • Baru terealisasi saat hewan dijual (recognized di HPP)<br />
                • Pakan yang dikonsumsi untuk pertumbuhan <strong>dikapitalisasi</strong> ke Aset Biologis, bukan beban<br />
                • Sistem otomatis memastikan compliance PSAK 241/69
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
