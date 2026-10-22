import React from 'react';
import { AssembledComponent, MaterialProfile, ScrewPoint } from '../types';
import { Plus, Trash2, Box, Sparkles, Wrench } from 'lucide-react';

interface AssemblyEditorProps {
  components: AssembledComponent[];
  profiles: MaterialProfile[];
  screws: ScrewPoint[];
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onUpdateComponent: (comp: AssembledComponent) => void;
  onAddComponent: () => void;
  onDeleteComponent: (id: string) => void;
  onAddScrew: (screw: ScrewPoint) => void;
  onDeleteScrew: (id: string) => void;
  onApplyPreset: (presetName: string) => void;
}

export const AssemblyEditor: React.FC<AssemblyEditorProps> = ({
  components,
  profiles,
  screws,
  selectedComponentId,
  onSelectComponent,
  onUpdateComponent,
  onAddComponent,
  onDeleteComponent,
  onAddScrew,
  onDeleteScrew,
  onApplyPreset,
}) => {
  const selectedComp = components.find((c) => c.id === selectedComponentId);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-200 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Box className="w-4 h-4 text-sky-400" />
            <span>Structural Assembly Designer</span>
          </h2>
          <p className="text-xs text-slate-400">Join 2D extruded profiles into unified 3D object matrix</p>
        </div>
      </div>

      {/* Assembly Presets */}
      <div className="p-4 border-b border-slate-800">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Assembly Quick Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onApplyPreset('door-900')}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded transition-colors text-left"
          >
            🚪 Door 900x2100mm
          </button>
          <button
            onClick={() => onApplyPreset('window-1200')}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded transition-colors text-left"
          >
            🪟 Window 1200x1200mm
          </button>
          <button
            onClick={() => onApplyPreset('double-door')}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded transition-colors text-left col-span-2"
          >
            🏛️ Double Door with Mullion 1800x2100mm
          </button>
        </div>
      </div>

      {/* Components List */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Components ({components.length})
          </span>
          <button
            onClick={onAddComponent}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white rounded transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>

        <div className="space-y-2">
          {components.map((comp) => {
            const isSelected = comp.id === selectedComponentId;
            const profile = profiles.find((p) => p.id === comp.profileId);
            return (
              <div
                key={comp.id}
                onClick={() => onSelectComponent(comp.id)}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-sky-950/60 border-sky-500 shadow-md ring-1 ring-sky-500'
                    : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: profile?.color || '#38bdf8' }}
                    />
                    {comp.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sky-400 font-bold">{comp.customLength} mm</span>
                    {components.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteComponent(comp.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete component"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                  <span>{profile?.profileCode || 'Profile'}</span>
                  <span>XYZ: ({comp.positionX.toFixed(0)}, {comp.positionY.toFixed(0)}, {comp.positionZ.toFixed(0)})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Component Parameter Inspector */}
      {selectedComp ? (
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" />
            <span>Inspector: {selectedComp.label}</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Profile Selector */}
            <div>
              <label className="text-slate-400 block mb-1">Profile Section</label>
              <select
                value={selectedComp.profileId}
                onChange={(e) => onUpdateComponent({ ...selectedComp, profileId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.profileCode} ({p.width}x{p.height}mm, t={p.wallThickness}mm)
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Cut Length */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400">Extrusion Length (mm)</label>
                <span className="font-mono text-sky-400 font-bold">{selectedComp.customLength} mm</span>
              </div>
              <input
                type="range"
                min={200}
                max={4000}
                step={10}
                value={selectedComp.customLength}
                onChange={(e) => onUpdateComponent({ ...selectedComp, customLength: parseFloat(e.target.value) })}
                className="w-full accent-sky-500"
              />
            </div>

            {/* Translation (X, Y, Z) */}
            <div>
              <label className="text-slate-400 block mb-1">Position (mm)</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-rose-400 font-bold">X</span>
                  <input
                    type="number"
                    value={selectedComp.positionX}
                    onChange={(e) => onUpdateComponent({ ...selectedComp, positionX: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold">Y</span>
                  <input
                    type="number"
                    value={selectedComp.positionY}
                    onChange={(e) => onUpdateComponent({ ...selectedComp, positionY: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-sky-400 font-bold">Z</span>
                  <input
                    type="number"
                    value={selectedComp.positionZ}
                    onChange={(e) => onUpdateComponent({ ...selectedComp, positionZ: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Rotation Z */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400">Orientation / Rotation Z</label>
                <span className="font-mono text-amber-400">{selectedComp.rotationZ}°</span>
              </div>
              <div className="flex gap-2">
                {[0, -90, 90, 180].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => onUpdateComponent({ ...selectedComp, rotationZ: deg })}
                    className={`flex-1 py-1 text-[11px] font-mono rounded border transition-colors ${
                      selectedComp.rotationZ === deg
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Screw & Fastener Points Management */}
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Screw &amp; Rivet Points ({screws.length})
            </span>
            <span className="text-[11px] text-slate-500">Visual vectors on joint coordinates</span>
          </div>
          <button
            onClick={() => {
              const newScrew: ScrewPoint = {
                id: `scr-${Date.now()}`,
                positionX: 450,
                positionY: 2100,
                positionZ: 38.1,
                type: 'Sekrup 3 Inch Countersunk',
              };
              onAddScrew(newScrew);
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white rounded transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Fastener</span>
          </button>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {screws.map((s, idx) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-2 rounded bg-slate-800/40 border border-slate-700/60 text-xs"
            >
              <div>
                <span className="font-semibold text-amber-300">#{idx + 1} {s.type}</span>
                <div className="text-[11px] text-slate-400 font-mono">
                  XYZ: ({s.positionX.toFixed(1)}, {s.positionY.toFixed(1)}, {s.positionZ.toFixed(1)})
                </div>
              </div>
              <button
                onClick={() => onDeleteScrew(s.id)}
                className="text-slate-500 hover:text-rose-400 p-1"
                title="Remove fastener"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
