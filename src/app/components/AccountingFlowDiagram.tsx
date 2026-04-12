import { ArrowRight } from 'lucide-react';

export default function AccountingFlowDiagram() {
  return (
    <div className="bg-white p-6 rounded-lg border" style={{ borderColor: '#DEE2E6' }}>
      <h2 className="text-base mb-4" style={{ color: '#1B4332' }}>
        Flow Proses Akuntansi Hers Farm
      </h2>

      <div className="flex items-center justify-between gap-4">
        {/* Step 1: Input */}
        <div className="flex-1">
          <div className="p-4 rounded-lg border-2" style={{ borderColor: '#1B4332', backgroundColor: '#E7F5E9' }}>
            <div className="text-sm mb-2" style={{ color: '#1B4332' }}>📝 Input Data</div>
            <div className="text-xs space-y-1" style={{ color: '#495057' }}>
              <div>• Transaksi Manual di GL</div>
              <div>• Update Berat Aset Biologis</div>
              <div className="p-2 mt-2 rounded" style={{ backgroundColor: '#FFB703', color: '#212529' }}>
                ⚡ <strong>Otomatis Jurnal!</strong>
              </div>
            </div>
          </div>
        </div>

        <ArrowRight size={24} style={{ color: '#1B4332' }} />

        {/* Step 2: General Ledger */}
        <div className="flex-1">
          <div className="p-4 rounded-lg border-2" style={{ borderColor: '#FFB703', backgroundColor: '#FFF3CD' }}>
            <div className="text-sm mb-2" style={{ color: '#856404' }}>📚 General Ledger</div>
            <div className="text-xs space-y-1" style={{ color: '#856404' }}>
              <div>• Semua jurnal tersimpan</div>
              <div>• Sumber data utama</div>
              <div>• Debit = Kredit</div>
            </div>
          </div>
        </div>

        <ArrowRight size={24} style={{ color: '#FFB703' }} />

        {/* Step 3: Working Papers */}
        <div className="flex-1">
          <div className="p-4 rounded-lg border-2" style={{ borderColor: '#495057', backgroundColor: '#F8F9FA' }}>
            <div className="text-sm mb-2" style={{ color: '#495057' }}>📋 Kertas Kerja</div>
            <div className="text-xs space-y-1" style={{ color: '#6C757D' }}>
              <div>• WBSA (Aset)</div>
              <div>• WBSL (Liab & Ekuitas)</div>
              <div>• WPL (Laba Rugi)</div>
            </div>
          </div>
        </div>

        <ArrowRight size={24} style={{ color: '#495057' }} />

        {/* Step 4: Financial Statements */}
        <div className="flex-1">
          <div className="p-4 rounded-lg border-2" style={{ borderColor: '#1B4332', backgroundColor: '#E7F5E9' }}>
            <div className="text-sm mb-2" style={{ color: '#1B4332' }}>📊 Laporan Keuangan</div>
            <div className="text-xs space-y-1" style={{ color: '#495057' }}>
              <div>• Trial Balance</div>
              <div>• Laba Rugi (P&L)</div>
              <div>• Neraca (Balance Sheet)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#E7F5E9' }}>
        <h3 className="text-sm mb-2" style={{ color: '#1B4332' }}>✅ Keunggulan Sistem</h3>
        <div className="grid grid-cols-3 gap-4 text-xs" style={{ color: '#495057' }}>
          <div>
            <strong>Single Source of Truth:</strong><br />
            Semua data berasal dari General Ledger
          </div>
          <div>
            <strong>Otomatis Terintegrasi:</strong><br />
            WBSA/WBSL/WPL update otomatis dari GL
          </div>
          <div>
            <strong>Audit-Ready:</strong><br />
            Trail jelas dari transaksi hingga laporan
          </div>
        </div>
      </div>
    </div>
  );
}
