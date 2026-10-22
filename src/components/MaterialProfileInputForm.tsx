import React, { useState } from 'react';
import { MaterialCategory, MaterialProfile } from '../types';
import { Save, PlusCircle, CheckCircle2, Ruler, DollarSign, Layers, Info } from 'lucide-react';

interface MaterialProfileInputFormProps {
  categories: MaterialCategory[];
  onSaveProfile: (profile: MaterialProfile) => void;
  onNavigateNext?: () => void;
}

export const MaterialProfileInputForm: React.FC<MaterialProfileInputFormProps> = ({
  categories,
  onSaveProfile,
  onNavigateNext,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || 'cat-1');
  const [profileCode, setProfileCode] = useState<string>('0504 Kusen Open Back 3"');
  const [profileName, setProfileName] = useState<string>('Tiang Buka Kusen Shopfront 3 Inch');
  const [wallThickness, setWallThickness] = useState<number>(1.2);
  const [width, setWidth] = useState<number>(44.5);
  const [height, setHeight] = useState<number>(76.2);
  const [unitPriceMode, setUnitPriceMode] = useState<'perMeter' | 'perMm'>('perMeter');
  const [priceInput, setPriceInput] = useState<number>(38500); // 38,500 IDR per meter
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Auto-calculated outer perimeter for rectangular box: 2 * (width + height)
  const outerPerimeter = 2 * (width + height);

  // Effective unit price in IDR per mm
  const effectiveUnitPricePerMm = unitPriceMode === 'perMeter' ? priceInput / 1000.0 : priceInput;

  // Theoretical weight per linear meter (g/m and kg/m):
  // Volume per 1000mm = perimeter * thickness * 1000 mm³
  // Weight = volume * 2.70e-6 kg/mm³
  const linearVolumeMm3PerMeter = outerPerimeter * wallThickness * 1000.0;
  const theoreticalWeightKgPerMeter = linearVolumeMm3PerMeter * 0.0000027;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileCode.trim()) return;

    const newProfile: MaterialProfile = {
      id: `prof-${Date.now()}`,
      categoryId: selectedCategoryId,
      profileCode: profileCode.trim(),
      name: profileName.trim() || profileCode.trim(),
      width: Number(width) || 44.5,
      height: Number(height) || 76.2,
      wallThickness: Number(wallThickness) || 1.2,
      outerPerimeter: Number(outerPerimeter) || 241.4,
      unitPrice: Number(effectiveUnitPricePerMm) || 38.5,
      color: '#38bdf8',
    };

    onSaveProfile(newProfile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded uppercase font-mono">
              Tahap 2 Form
            </span>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-sky-400" />
              <span>MaterialProfileInputPage (Form Spesifikasi Profil)</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Input parameter cross-section 2D sebelum digenerate menjadi objek 3D &amp; tersimpan ke Box Hive lokal.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/60 rounded-lg text-xs font-semibold text-emerald-300 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Tersimpan di Database Lokal!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dropdown Kategori */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            1. Kategori Material (Relasi ke MaterialCategory)
          </label>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.categoryName} ({c.id})
              </option>
            ))}
          </select>
        </div>

        {/* Kolom Teks Kode Profil */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              2. Kode Profil (Contoh: "0504 Kusen Open Back")
            </label>
            <input
              type="text"
              required
              value={profileCode}
              onChange={(e) => setProfileCode(e.target.value)}
              placeholder='Contoh: "0504 Kusen Open Back"'
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Nama Deskriptif / Alias
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Tiang Buka Kusen 3 Inch"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Input Angka Dimensi Cross Section (mm) */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
            <Ruler className="w-4 h-4 text-sky-400" />
            <span>3. Dimensi Fisik Cross-Section Profil (Milimeter)</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Ketebalan Dinding (t)</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="10"
                  required
                  value={wallThickness}
                  onChange={(e) => setWallThickness(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-sky-500"
                />
                <span className="text-xs text-slate-400 font-mono">mm</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Lebar Luar (Width)</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  min="5"
                  max="500"
                  required
                  value={width}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-sky-500"
                />
                <span className="text-xs text-slate-400 font-mono">mm</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Tinggi / Kedalaman</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  min="5"
                  max="500"
                  required
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-sky-500"
                />
                <span className="text-xs text-slate-400 font-mono">mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Harga per mm / meter */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>4. Harga Satuan Bahan Baku</span>
            </label>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setUnitPriceMode('perMeter')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  unitPriceMode === 'perMeter'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                Per Meter (m)
              </button>
              <button
                type="button"
                onClick={() => setUnitPriceMode('perMm')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  unitPriceMode === 'perMm'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                Per Milimeter (mm)
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
            <span className="text-xs font-bold text-emerald-400 font-mono">IDR</span>
            <input
              type="number"
              step="1"
              min="1"
              required
              value={priceInput}
              onChange={(e) => setPriceInput(parseFloat(e.target.value) || 0)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-slate-400 font-mono">
              / {unitPriceMode === 'perMeter' ? 'meter' : 'mm'} (≈ IDR {effectiveUnitPricePerMm.toFixed(2)} / mm)
            </span>
          </div>
        </div>

        {/* Real-Time Mathematical Cross-Section Preview (Perimeter & Linear Weight) */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-400" />
            <span>Kalkulasi Perimeter Otomatis:</span>
            <strong className="text-sky-300">{outerPerimeter.toFixed(1)} mm</strong>
          </div>
          <div>
            <span>Est. Berat Batang: </span>
            <strong className="text-emerald-400">{theoreticalWeightKgPerMeter.toFixed(3)} kg/meter</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="submit"
            className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan ke Database Lokal (Hive Box)</span>
          </button>

          {onNavigateNext && (
            <button
              type="button"
              onClick={onNavigateNext}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors border border-slate-700 cursor-pointer"
            >
              Lanjut ke Stok Gudang &rarr;
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
