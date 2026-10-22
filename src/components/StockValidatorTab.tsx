import React, { useState } from 'react';
import { AssembledComponent, StockInventory, MaterialProfile } from '../types';
import { StockValidatorService } from '../services/stockOptimizer';
import { Scissors, CheckCircle2, AlertTriangle, Package, Plus, Trash2, ShieldCheck, ArrowDownUp } from 'lucide-react';

interface StockValidatorTabProps {
  components: AssembledComponent[];
  profiles: MaterialProfile[];
  stockInventory: StockInventory[];
  onUpdateStock: (newStock: StockInventory[]) => void;
}

export const StockValidatorTab: React.FC<StockValidatorTabProps> = ({
  components,
  profiles,
  stockInventory,
  onUpdateStock,
}) => {
  const [kerfThickness, setKerfThickness] = useState<number>(3.0);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('all');
  const [newStockLength, setNewStockLength] = useState<number>(2500);
  const [newStockQty, setNewStockQty] = useState<number>(2);
  const [newStockProfileId, setNewStockProfileId] = useState<string>(profiles[0]?.id || 'prof-0504');

  // Prepare cutting requests from active components
  const cuttingRequests = components.map((c) => ({
    componentId: c.id,
    profileId: c.profileId,
    label: c.label,
    requestedLength: c.customLength,
  }));

  // Run stock validation with pure Dart-equivalent service
  const validationResult = StockValidatorService.validateAndAllocate({
    requests: cuttingRequests,
    stockInventory,
    kerfThickness,
    targetProfileId: selectedProfileId === 'all' ? undefined : selectedProfileId,
  });

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStockLength <= 0 || newStockQty <= 0) return;

    const existingIndex = stockInventory.findIndex(
      (s) => s.profileId === newStockProfileId && Math.abs(s.lengthAvailable - newStockLength) < 1
    );

    if (existingIndex >= 0) {
      const updated = [...stockInventory];
      updated[existingIndex].quantityInWarehouse += newStockQty;
      onUpdateStock(updated);
    } else {
      onUpdateStock([
        ...stockInventory,
        {
          profileId: newStockProfileId,
          lengthAvailable: newStockLength,
          quantityInWarehouse: newStockQty,
        },
      ]);
    }
  };

  const handleDeleteStock = (index: number) => {
    const updated = stockInventory.filter((_, i) => i !== index);
    onUpdateStock(updated);
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase tracking-wider">
              Stage 3 Implementation
            </span>
            <span className="text-xs text-slate-400 font-mono">StockValidatorService</span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Scissors className="w-5 h-5 text-amber-400" />
            <span>Real-Time Inventory Validator &amp; Kerf Allocation Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Greedy demand sorting (longest to shortest), scrap-first priority (consuming short planks like 2500mm before 6000mm standard), and blade kerf tolerance deduction.
          </p>
        </div>

        {/* Validation Status Badge */}
        <div
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-sm font-semibold shadow-lg ${
            validationResult.isSuccess
              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/60 text-rose-300'
          }`}
        >
          {validationResult.isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
          <div>
            <div className="text-xs uppercase tracking-wider font-bold">
              {validationResult.isSuccess ? 'Stock Validated (OK)' : 'Stock Deficit Alert'}
            </div>
            <div className="text-[11px] font-normal opacity-90">{validationResult.statusMessage}</div>
          </div>
        </div>
      </div>

      {/* Control Strip: Kerf Slider & Profile Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Kerf Blade Thickness */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span>Blade Kerf Tolerance</span>
              <span className="text-[10px] text-slate-500">(Kerf Deduction)</span>
            </label>
            <span className="text-sm font-bold font-mono text-amber-400">{kerfThickness.toFixed(1)} mm</span>
          </div>
          <input
            type="range"
            min={1.0}
            max={6.0}
            step={0.5}
            value={kerfThickness}
            onChange={(e) => setKerfThickness(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>1.0 mm (Thin Saw)</span>
            <span>3.0 mm (Std TCT Blade)</span>
            <span>6.0 mm (Heavy Kerf)</span>
          </div>
        </div>

        {/* Profile Filter */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Target Aluminum Profile Filter
          </label>
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Aluminum Profiles ({cuttingRequests.length} Cuts Total)</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.profileCode}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-500 mt-2">
            Filtered demand: {cuttingRequests.filter((r) => selectedProfileId === 'all' || r.profileId === selectedProfileId).length} cuts required
          </div>
        </div>

        {/* Summary Metric Stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sustainability &amp; Scrap Savings</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {(validationResult.totalScrapSavedMm / 1000).toFixed(2)} m
            </span>
            <span className="text-xs text-slate-400">scrap salvaged</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Standard 6m planks opened: <strong className="text-white font-mono">{validationResult.totalNewPlanksUsed}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Plank Allocation & Warehouse Stock Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Visual Plank Cutting Diagram (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowDownUp className="w-4 h-4 text-sky-400" />
                <span>Visual Cutting &amp; Kerf Allocation Plan</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">
                {validationResult.allocations.length} Plank(s) Utilized
              </span>
            </div>

            {validationResult.allocations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active cuts allocated. Check components or inventory.
              </div>
            ) : (
              <div className="space-y-4">
                {validationResult.allocations.map((plank) => {
                  const usedLength = plank.cuts.reduce((sum, c) => sum + c.length + c.kerf, 0);
                  const wasteLength = Math.max(0, plank.remainingLength);
                  const utilizationPercent = ((usedLength / plank.originalLength) * 100).toFixed(1);

                  return (
                    <div
                      key={plank.plankId}
                      className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5"
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-2 font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              plank.isScrap
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {plank.isScrap ? 'SCRAP PLANK' : 'STANDARD 6000mm'}
                          </span>
                          <span className="font-semibold text-slate-200">{plank.plankId}</span>
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">
                          Efficiency: <strong className="text-emerald-400">{utilizationPercent}%</strong> • Remainder: <strong className="text-slate-200">{wasteLength.toFixed(0)} mm</strong>
                        </div>
                      </div>

                      {/* Visual Cutting Bar */}
                      <div className="w-full h-8 bg-slate-800 rounded flex overflow-hidden border border-slate-700 shadow-inner relative">
                        {plank.cuts.map((cut, idx) => {
                          const cutWidthPercent = (cut.length / plank.originalLength) * 100;
                          const kerfWidthPercent = (cut.kerf / plank.originalLength) * 100;

                          return (
                            <React.Fragment key={idx}>
                              {/* Cut piece */}
                              <div
                                style={{ width: `${cutWidthPercent}%` }}
                                className="h-full bg-sky-600 hover:bg-sky-500 flex items-center justify-center text-[10px] font-mono font-bold text-white px-1 overflow-hidden transition-colors border-r border-sky-700"
                                title={`${cut.label}: ${cut.length}mm`}
                              >
                                {cut.length}mm
                              </div>
                              {/* Kerf blade cut gap */}
                              <div
                                style={{ width: `${Math.max(0.6, kerfWidthPercent)}%` }}
                                className="h-full bg-rose-600"
                                title={`Saw Blade Kerf: ${cut.kerf}mm`}
                              />
                            </React.Fragment>
                          );
                        })}

                        {/* Remaining scrap end */}
                        {wasteLength > 0 && (
                          <div
                            style={{ width: `${(wasteLength / plank.originalLength) * 100}%` }}
                            className="h-full bg-slate-800/80 pattern-diagonal flex items-center justify-center text-[10px] font-mono text-slate-500"
                            title={`Remaining scrap: ${wasteLength.toFixed(0)}mm`}
                          >
                            {wasteLength > 150 ? `${wasteLength.toFixed(0)}mm scrap` : ''}
                          </div>
                        )}
                      </div>

                      {/* Cut detail tags */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {plank.cuts.map((c, i) => (
                          <span
                            key={i}
                            className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60"
                          >
                            Cut #{i + 1}: <strong className="text-sky-400">{c.label}</strong> ({c.length} mm) + kerf ({c.kerf} mm)
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Allocation Log Terminal */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
              Pure Dart Execution Log (StockValidatorService)
            </h3>
            <div className="bg-black/60 rounded p-3 font-mono text-[11px] text-emerald-400/90 max-h-48 overflow-y-auto space-y-1">
              {validationResult.allocationLog.map((log, i) => (
                <div key={i} className={log.includes('❌') ? 'text-rose-400 font-bold' : ''}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Warehouse Inventory Management */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>Warehouse Stock</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                {stockInventory.reduce((acc, curr) => acc + curr.quantityInWarehouse, 0)} Planks Available
              </span>
            </div>

            {/* Warehouse Stock List */}
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-1">
              {stockInventory.map((item, idx) => {
                const profile = profiles.find((p) => p.id === item.profileId);
                const isScrap = item.lengthAvailable < 5800;

                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                            isScrap
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {isScrap ? 'SCRAP' : 'STANDARD'}
                        </span>
                        <span className="font-semibold text-slate-200">
                          {item.lengthAvailable} mm
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {profile?.profileCode || item.profileId} • Qty: <strong className="text-white">{item.quantityInWarehouse}x</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteStock(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Remove stock entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add Stock Form */}
            <form onSubmit={handleAddStock} className="pt-3 border-t border-slate-800 space-y-2.5 text-xs">
              <div className="font-semibold text-slate-300 text-xs">Add Inventory Plank</div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Aluminum Profile</label>
                <select
                  value={newStockProfileId}
                  onChange={(e) => setNewStockProfileId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.profileCode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Length (mm)</label>
                  <input
                    type="number"
                    value={newStockLength}
                    onChange={(e) => setNewStockLength(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 2500"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={newStockQty}
                    onChange={(e) => setNewStockQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1 shadow-sm mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Warehouse</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
