import React, { useState } from 'react';
import { AssembledComponent, MaterialProfile, ScrewPoint, StockInventory } from '../types';
import { BomCalculatorEngine } from '../services/bomCalculator';
import { StockValidatorService } from '../services/stockOptimizer';
import { StockTransactionService, StockTransactionResult } from '../services/stockTransactionService';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertOctagon,
  Layers,
  Scissors,
  Calculator,
  Scale,
  Package,
  Lock,
  RotateCcw,
  Receipt,
  Check,
} from 'lucide-react';

interface PreCuttingSummaryDashboardProps {
  components: AssembledComponent[];
  profiles: MaterialProfile[];
  screws: ScrewPoint[];
  stockInventory: StockInventory[];
  projectName: string;
  onCommitTransaction?: (updatedInventory: StockInventory[]) => void;
  onNavigateToCad?: () => void;
}

export const PreCuttingSummaryDashboard: React.FC<PreCuttingSummaryDashboardProps> = ({
  components,
  profiles,
  screws,
  stockInventory,
  projectName,
  onCommitTransaction,
  onNavigateToCad,
}) => {
  const [kerfTolerance, setKerfTolerance] = useState<number>(3.0);
  const [transactionReceipt, setTransactionReceipt] = useState<StockTransactionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // 1. Calculate real manufacturing BOM
  const bom = BomCalculatorEngine.calculateBom(components, profiles, screws);

  // 2. Prepare grouped component demands
  const groupedDemands: {
    key: string;
    label: string;
    profileCode: string;
    lengthMm: number;
    count: number;
    totalSubLength: number;
    subCost: number;
    subWeight: number;
  }[] = [];

  components.forEach((comp) => {
    const profile = profiles.find((p) => p.id === comp.profileId);
    const key = `${comp.profileId}_${comp.customLength}_${comp.label}`;
    const existing = groupedDemands.find((g) => g.key === key);

    if (existing) {
      existing.count += 1;
      existing.totalSubLength += comp.customLength;
      existing.subCost += comp.customLength * (profile?.unitPrice || 38.5);
      existing.subWeight +=
        (profile?.outerPerimeter || 241.4) *
        (profile?.wallThickness || 1.2) *
        comp.customLength *
        0.0000027;
    } else {
      groupedDemands.push({
        key,
        label: comp.label,
        profileCode: profile?.profileCode || 'Unknown Profile',
        lengthMm: comp.customLength,
        count: 1,
        totalSubLength: comp.customLength,
        subCost: comp.customLength * (profile?.unitPrice || 38.5),
        subWeight:
          (profile?.outerPerimeter || 241.4) *
          (profile?.wallThickness || 1.2) *
          comp.customLength *
          0.0000027,
      });
    }
  });

  // 3. Run StockValidatorService
  const cuttingRequests = components.map((c) => ({
    componentId: c.id,
    profileId: c.profileId,
    label: c.label,
    requestedLength: c.customLength,
  }));

  const validationResult = StockValidatorService.validateAndAllocate({
    requests: cuttingRequests,
    stockInventory,
    kerfThickness: kerfTolerance,
  });

  // 4. Commit Stock Transaction Handler
  const handleExecuteTransaction = () => {
    if (!validationResult.isSuccess) return;
    setIsExecuting(true);

    setTimeout(() => {
      const result = StockTransactionService.commitCuttingTransaction({
        validationResult,
        currentInventory: stockInventory,
      });

      setTransactionReceipt(result);
      setIsExecuting(false);

      if (result.isExecuted && onCommitTransaction) {
        onCommitTransaction(result.updatedInventory);
      }
    }, 600);
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded uppercase font-mono">
              Stage 6 &amp; 7 Lock
            </span>
            <span className="text-xs text-slate-400 font-mono">StockTransactionService</span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-400" />
            <span>Pre-Cutting Summary &amp; Stock Transaction Lock</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Review final komponen rakitan, kurangi stok gudang secara permanen, dan kembalikan sisa potongan (offcuts ≥ 500mm) sebagai scrap baru.
          </p>
        </div>

        {/* Global Stock Readiness Status Indicator */}
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-semibold shadow-xl ${
            validationResult.isSuccess
              ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/80 text-rose-200'
          }`}
        >
          {validationResult.isSuccess ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          ) : (
            <AlertOctagon className="w-6 h-6 text-rose-400 shrink-0" />
          )}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">
              {validationResult.isSuccess ? 'STATUS GUDANG: SIAP DIPOTONG' : 'STATUS GUDANG: DEFISIT / KURANG'}
            </div>
            <div className="text-[11px] opacity-90 mt-0.5">{validationResult.statusMessage}</div>
          </div>
        </div>
      </div>

      {/* Transaction Committed Receipt Modal / Banner */}
      {transactionReceipt && (
        <div className="mb-6 bg-slate-900 border-2 border-emerald-500 rounded-xl p-5 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-300">
                  Transaksi Pemotongan Berhasil Dikunci (Stock Deducted)
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Waktu Eksekusi: {new Date(transactionReceipt.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
            <button
              onClick={() => setTransactionReceipt(null)}
              className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
            >
              Tutup Bukti
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-3">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono">
              <span className="text-slate-400 block text-[11px]">Balok Gudang Terpotong:</span>
              <strong className="text-white text-sm">{transactionReceipt.consumedPlanksCount} Batang</strong>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-emerald-800/60 font-mono">
              <span className="text-emerald-400 block text-[11px]">♻️ Sisa Potong Layak (Offcuts ≥ 500mm):</span>
              <strong className="text-emerald-300 text-sm">
                +{transactionReceipt.newOffcutsRegistered.length} Scrap Baru Terdaftar
              </strong>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono">
              <span className="text-slate-400 block text-[11px]">Sisa Scrap Dibuang (&lt;500mm):</span>
              <strong className="text-slate-400 text-sm">
                {(transactionReceipt.discardedWasteMm / 1000).toFixed(2)} meter
              </strong>
            </div>
          </div>

          {transactionReceipt.newOffcutsRegistered.length > 0 && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-300">
              <span className="font-bold block mb-1">Daftar Sisa Potongan yang Dikembalikan ke Stok Gudang:</span>
              <div className="flex flex-wrap gap-2">
                {transactionReceipt.newOffcutsRegistered.map((o, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700 text-[11px]"
                  >
                    #{idx + 1}: <strong>{o.lengthMm} mm</strong> ({o.description})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Metric Cards: BOM Real Costs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Batang Profil Terpakai</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {components.length} <span className="text-xs font-normal text-slate-400">item</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Total Panjang: {(bom.totalLengthMm / 1000).toFixed(2)} meter
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Berat Aluminium (6063)</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {bom.totalWeightKg.toFixed(2)} <span className="text-xs font-normal text-slate-400">kg</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Volume: {(bom.totalVolumeMm3 / 1000).toFixed(0)} cm³
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Sekrup &amp; Rivet Joint</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {screws.length} <span className="text-xs font-normal text-slate-400">titik</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Biaya Fastener: IDR {bom.totalFastenerCost.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 bg-gradient-to-br from-slate-900 to-emerald-950/40">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Grand Total Biaya Bahan Riil</span>
            <Calculator className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            IDR {bom.grandTotalCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Profil: IDR {bom.totalProfileCost.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Assembled Components List & Demands */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Daftar AssembledComponent yang Digunakan */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>1. Komponen Assembled Yang Digunakan ({components.length} Item)</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {groupedDemands.length} Jenis Potongan
              </span>
            </div>

            <div className="space-y-2.5">
              {groupedDemands.map((group, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-sky-500/20 text-sky-400 font-mono font-bold flex items-center justify-center text-xs">
                      {group.count}x
                    </span>
                    <div>
                      <div className="font-semibold text-white">{group.label}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {group.profileCode} • Panjang @{' '}
                        <strong className="text-sky-300">{group.lengthMm} mm</strong>
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-white font-bold">
                      IDR {group.subCost.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-emerald-400">
                      {group.subWeight.toFixed(2)} kg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Rincian Totalan Harga Bahan Terpakai */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>2. Rincian Biaya Terpakai (BOM Calculator Service)</span>
            </h2>

            <div className="divide-y divide-slate-800 text-xs">
              <div className="py-2.5 flex justify-between items-center text-slate-300">
                <span>Total Batang Aluminium Terpotong ({components.length} pcs)</span>
                <span className="font-mono font-bold text-white">
                  IDR {bom.totalProfileCost.toLocaleString()}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center text-slate-300">
                <span>Fasteners &amp; Sekrup Joint ({screws.length} pcs)</span>
                <span className="font-mono font-bold text-amber-300">
                  IDR {bom.totalFastenerCost.toLocaleString()}
                </span>
              </div>
              <div className="py-3 flex justify-between items-center font-bold text-sm bg-slate-950/60 px-3 rounded-lg border border-slate-800 mt-2">
                <span className="text-slate-100">Grand Total Raw Material:</span>
                <span className="font-mono text-emerald-300 text-base">
                  IDR {bom.grandTotalCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Kotak Log Validasi Stok & Tombol Kunci Transaksi */}
        <div className="lg:col-span-5 space-y-6">
          <div
            className={`rounded-xl border p-4 shadow-xl ${
              validationResult.isSuccess
                ? 'bg-slate-900 border-slate-800'
                : 'bg-rose-950/30 border-rose-800/60'
            }`}
          >
            {/* Header Kotak Log Validasi Stok */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-400" />
                <span>3. Kotak Log Validasi Stok Gudang</span>
              </h2>
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <span>Kerf:</span>
                <strong className="text-amber-400">{kerfTolerance}mm</strong>
              </div>
            </div>

            {/* List Balok Gudang Yang Terpotong & Indikator Warna */}
            <div className="mb-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Daftar Balok Gudang Terpotong:
              </span>

              {validationResult.allocations.length === 0 ? (
                <div className="p-4 bg-slate-950 rounded-lg text-center text-slate-500 text-xs">
                  Tidak ada balok gudang yang dialokasikan.
                </div>
              ) : (
                <div className="space-y-2">
                  {validationResult.allocations.map((plank, idx) => {
                    const isSuccess = plank.remainingLength >= 0;
                    const willBeSavedAsOffcut = plank.remainingLength >= 500;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs ${
                          isSuccess
                            ? 'bg-emerald-950/40 border-emerald-500/40'
                            : 'bg-rose-950/60 border-rose-500/60'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                isSuccess ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'
                              }`}
                            />
                            <span className="font-bold text-white">{plank.plankId}</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              plank.isScrap
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-sky-500/20 text-sky-300'
                            }`}
                          >
                            {plank.isScrap ? 'SCRAP' : 'STD 6000mm'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
                          {plank.cuts.map((c, cIdx) => (
                            <div key={cIdx} className="flex justify-between">
                              <span>
                                Potongan #{cIdx + 1}: <strong>{c.label}</strong>
                              </span>
                              <span className="text-sky-300 font-bold">
                                {c.length} mm (+{c.kerf}mm kerf)
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex justify-between items-center text-[11px] font-mono">
                          <span className="text-slate-400">Sisa Potong:</span>
                          <span className="flex items-center gap-1.5">
                            <strong className={willBeSavedAsOffcut ? 'text-emerald-400' : 'text-slate-400'}>
                              {plank.remainingLength.toFixed(1)} mm
                            </strong>
                            {willBeSavedAsOffcut && (
                              <span className="px-1 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[9px]">
                                ♻️ Disimpan Jadi Scrap Baru
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* STAGE 7: TOMBOL KUNCI TRANSAKSI & PENGURANGAN STOK */}
            <div className="pt-2">
              <button
                disabled={!validationResult.isSuccess || isExecuting}
                onClick={handleExecuteTransaction}
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  validationResult.isSuccess
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>
                  {isExecuting
                    ? 'Sedang Memproses Pemotongan...'
                    : 'Setuju & Eksekusi Cutting List (Kunci Transaksi Gudang)'}
                </span>
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-1.5 leading-tight">
                Mengurangi kuantitas balok di database gudang secara permanen &amp; mendaftarkan sisa potongan (offcuts ≥ 500mm) kembali ke stok.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
