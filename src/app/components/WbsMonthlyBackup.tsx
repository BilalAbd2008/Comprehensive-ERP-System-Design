/// <reference types="vite/client" />

import { useEffect, useState } from 'react';

type BackupItem = {
  id: number;
  period: string;
  createdAt: string;
  updatedAt: string;
  snapshot: {
    savedAt?: string;
    wbsSummary?: {
      wbsa?: {
        totalAset?: number;
        totalAsetLancar?: number;
        totalAsetTidakLancar?: number;
      };
      wbsl?: {
        totalLiabilitas?: number;
        totalEkuitas?: number;
        totalLiabilitasEkuitas?: number;
        isBalanced?: boolean;
      };
      wpl?: {
        labaBersih?: number;
      };
    };
    biologicalAssets?: unknown[];
    journalEntries?: unknown[];
  } | null;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function WbsMonthlyBackup() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
  };

  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/backups/monthly`);
      if (!response.ok) {
        throw new Error('Gagal memuat backup bulanan');
      }
      const data = await response.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error(error);
      alert('Gagal memuat backup bulanan');
    } finally {
      setLoading(false);
    }
  };

  const createBackupNow = async () => {
    setCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/backups/monthly`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: true }),
      });

      if (!response.ok) {
        throw new Error('Gagal membuat backup bulanan');
      }

      await loadBackups();
      alert('Backup bulanan berhasil disimpan');
    } catch (error) {
      console.error(error);
      alert('Gagal membuat backup bulanan');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    void loadBackups();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl mb-1" style={{ color: '#1B4332' }}>
            Backup Bulanan WBS
          </h1>
          <p className="text-sm" style={{ color: '#6C757D' }}>
            Snapshot bulanan untuk WBSA, WBSL, dan WPL
          </p>
        </div>
        <button
          onClick={createBackupNow}
          disabled={creating}
          className="px-4 py-2 rounded text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: creating ? '#6C757D' : '#1B4332' }}
        >
          {creating ? 'Menyimpan...' : 'Backup Bulan Ini'}
        </button>
      </div>

      <div className="bg-white rounded-lg border" style={{ borderColor: '#DEE2E6' }}>
        {loading ? (
          <div className="p-6 text-sm" style={{ color: '#6C757D' }}>Memuat data backup...</div>
        ) : backups.length === 0 ? (
          <div className="p-6 text-sm" style={{ color: '#6C757D' }}>Belum ada backup bulanan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#1B4332', color: 'white' }}>
                  <th className="px-4 py-3 text-left text-sm">Periode</th>
                  <th className="px-4 py-3 text-right text-sm">WBSA - Total Aset</th>
                  <th className="px-4 py-3 text-right text-sm">WBSL - Liab + Ekuitas</th>
                  <th className="px-4 py-3 text-right text-sm">WPL - Laba Bersih</th>
                  <th className="px-4 py-3 text-center text-sm">Status</th>
                  <th className="px-4 py-3 text-left text-sm">Disimpan</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => {
                  const wbsa = backup.snapshot?.wbsSummary?.wbsa;
                  const wbsl = backup.snapshot?.wbsSummary?.wbsl;
                  const wpl = backup.snapshot?.wbsSummary?.wpl;
                  const isBalanced = wbsl?.isBalanced;

                  return (
                    <tr key={backup.id} className="border-b" style={{ borderColor: '#DEE2E6' }}>
                      <td className="px-4 py-3 text-sm" style={{ color: '#212529' }}>
                        {formatPeriod(backup.period)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: '#1B4332' }}>
                        {formatCurrency(Number(wbsa?.totalAset || 0))}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: '#856404' }}>
                        {formatCurrency(Number(wbsl?.totalLiabilitasEkuitas || 0))}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: Number(wpl?.labaBersih || 0) >= 0 ? '#1B4332' : '#DC3545' }}>
                        {formatCurrency(Number(wpl?.labaBersih || 0))}
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        <span
                          className="px-2 py-1 rounded"
                          style={{
                            backgroundColor: isBalanced ? '#E7F5E9' : '#FEE',
                            color: isBalanced ? '#1B4332' : '#DC3545',
                          }}
                        >
                          {isBalanced ? 'Balance' : 'Tidak Balance'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6C757D' }}>
                        {new Date(backup.snapshot?.savedAt || backup.updatedAt).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs" style={{ color: '#6C757D' }}>
        Backup otomatis disimpan sekali setiap bulan saat ada aktivitas data. Tombol di atas bisa dipakai untuk memperbarui backup bulan berjalan.
      </div>
    </div>
  );
}
