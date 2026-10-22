import { useState } from 'react';
import {
  INITIAL_CATEGORIES,
  INITIAL_PROFILES,
  INITIAL_STOCK,
  INITIAL_PROJECT,
} from './data/mockData';
import { AssembledComponent, ScrewPoint, StockInventory, MaterialProfile, MaterialCategory } from './types';
import { YogaBreadcrumbs } from './components/YogaBreadcrumbs';
import { MaterialProfileInputForm } from './components/MaterialProfileInputForm';
import { PreCuttingSummaryDashboard } from './components/PreCuttingSummaryDashboard';
import { CadViewer3D } from './components/CadViewer3D';
import { AssemblyEditor } from './components/AssemblyEditor';
import { StockValidatorTab } from './components/StockValidatorTab';
import { BomReportTab } from './components/BomReportTab';
import { DartCodeExplorer } from './components/DartCodeExplorer';
import {
  Box,
  Scissors,
  Calculator,
  Code2,
  Layers,
  ClipboardCheck,
  PlusCircle,
  FolderTree,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'workflow' | 'cad' | 'stock' | 'bom' | 'code'>('workflow');
  const [workflowStep, setWorkflowStep] = useState<number>(4); // default to step 4 summary dashboard or allow step navigation

  // Core Data States
  const [categories] = useState<MaterialCategory[]>(INITIAL_CATEGORIES);
  const [profiles, setProfiles] = useState<MaterialProfile[]>(INITIAL_PROFILES);
  const [components, setComponents] = useState<AssembledComponent[]>(INITIAL_PROJECT.components);
  const [screws, setScrews] = useState<ScrewPoint[]>(INITIAL_PROJECT.screws);
  const [stockInventory, setStockInventory] = useState<StockInventory[]>(INITIAL_STOCK);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(components[0]?.id || null);

  // 3D Viewport Controls
  const [showScrews, setShowScrews] = useState(true);
  const [showWireframe, setShowWireframe] = useState(false);
  const [explosionFactor, setExplosionFactor] = useState(0);

  // Handlers
  const handleSaveProfile = (newProfile: MaterialProfile) => {
    setProfiles((prev) => [newProfile, ...prev]);
  };

  const handleUpdateComponent = (updated: AssembledComponent) => {
    setComponents((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleAddComponent = () => {
    const newId = `comp-${Date.now()}`;
    const newComp: AssembledComponent = {
      id: newId,
      profileId: profiles[0].id,
      label: `Aluminium Member ${components.length + 1}`,
      customLength: 1200,
      positionX: 450,
      positionY: 1050,
      positionZ: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
    };
    setComponents((prev) => [...prev, newComp]);
    setSelectedComponentId(newId);
  };

  const handleDeleteComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    if (selectedComponentId === id) {
      setSelectedComponentId(components[0]?.id || null);
    }
  };

  const handleAddScrew = (newScrew: ScrewPoint) => {
    setScrews((prev) => [...prev, newScrew]);
  };

  const handleDeleteScrew = (id: string) => {
    setScrews((prev) => prev.filter((s) => s.id !== id));
  };

  const handleApplyPreset = (presetName: string) => {
    if (presetName === 'door-900') {
      setComponents([
        {
          id: 'comp-jamb-left',
          profileId: 'prof-0504',
          label: 'Kusen Kiri (Left Jamb)',
          customLength: 2100,
          positionX: 0,
          positionY: 0,
          positionZ: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
        },
        {
          id: 'comp-jamb-right',
          profileId: 'prof-0504',
          label: 'Kusen Kanan (Right Jamb)',
          customLength: 2100,
          positionX: 855.5,
          positionY: 0,
          positionZ: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
        },
        {
          id: 'comp-head-transom',
          profileId: 'prof-0505',
          label: 'Ambang Atas (Head Transom)',
          customLength: 900,
          positionX: 0,
          positionY: 2100,
          positionZ: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: -90,
        },
      ]);
      setScrews([
        { id: 's1', positionX: 22.25, positionY: 2138.1, positionZ: 15, type: 'Sekrup 3 Inch Countersunk' },
        { id: 's2', positionX: 22.25, positionY: 2138.1, positionZ: 60, type: 'Sekrup 3 Inch Countersunk' },
        { id: 's3', positionX: 877.75, positionY: 2138.1, positionZ: 15, type: 'Sekrup 3 Inch Countersunk' },
        { id: 's4', positionX: 877.75, positionY: 2138.1, positionZ: 60, type: 'Sekrup 3 Inch Countersunk' },
      ]);
      setSelectedComponentId('comp-jamb-left');
    } else if (presetName === 'window-1200') {
      setComponents([
        {
          id: 'comp-win-left',
          profileId: 'prof-0504',
          label: 'Kusen Kiri (Left Jamb)',
          customLength: 1200,
          positionX: 0,
          positionY: 0,
          positionZ: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
        },
        {
          id: 'comp-win-right',
          profileId: 'prof-0504',
          label: 'Kusen Kanan (Right Jamb)',
          customLength: 1200,
          positionX: 1155.5,
          positionY: 0,
          positionZ: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
        },
        {
          id: 'comp-win-top',
          profileId: 'prof-0505',
          label: 'Ambang Atas (Head Transom)',
          customLength: 1200,
          positionX: 0,
          positionY: 1200,
          positionZ: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: -90,
        },
        {
          id: 'comp-win-sill',
          profileId: 'prof-0505',
          label: 'Ambang Bawah (Sill)',
          customLength: 1200,
          positionX: 0,
          positionY: 0,
          positionZ: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: -90,
        },
      ]);
      setScrews([
        { id: 'ws1', positionX: 22, positionY: 1238, positionZ: 20, type: 'Sekrup 3 Inch Countersunk' },
        { id: 'ws2', positionX: 1178, positionY: 1238, positionZ: 20, type: 'Sekrup 3 Inch Countersunk' },
        { id: 'ws3', positionX: 22, positionY: -38, positionZ: 20, type: 'Sekrup 3 Inch Countersunk' },
        { id: 'ws4', positionX: 1178, positionY: -38, positionZ: 20, type: 'Sekrup 3 Inch Countersunk' },
      ]);
      setSelectedComponentId('comp-win-left');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-black text-sm">
            Y
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">Project YOGA</span>
              <span className="px-1.5 py-0.2 text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                OFFLINE CAD &amp; UI
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              YOGA Aluminum Extrusion Customizer &amp; Manufacturing Management
            </div>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === 'workflow'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>UI Workflow &amp; Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('cad')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === 'cad'
                ? 'bg-sky-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>3D CAD Assembly</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === 'stock'
                ? 'bg-amber-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Stock &amp; Kerf Validator</span>
          </button>

          <button
            onClick={() => setActiveTab('bom')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === 'bom'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>BOM Report</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === 'code'
                ? 'bg-purple-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Dart Code Hub</span>
          </button>
        </div>

        {/* Quick Indicators */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
          <div className="text-slate-400">
            Komponen: <strong className="text-sky-400">{components.length}</strong>
          </div>
          <div className="text-slate-400">
            Fasteners: <strong className="text-amber-400">{screws.length}</strong>
          </div>
          <div className="text-slate-400">
            Balok Gudang: <strong className="text-emerald-400">{stockInventory.reduce((s, i) => s + i.quantityInWarehouse, 0)}</strong>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Workflow Tab with YogaBreadcrumbs */}
        {activeTab === 'workflow' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Widget 1: YogaBreadcrumbs */}
            <YogaBreadcrumbs
              currentStep={workflowStep}
              onStepClick={(step) => setWorkflowStep(step)}
            />

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
              {workflowStep === 1 && (
                <div className="max-w-3xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
                  <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-sky-400" />
                    <span>Langkah 1: Pilih Kategori Material</span>
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">
                    Kategori material yang terdaftar di Hive box (MaterialCategory):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    {categories.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-sky-500/60 transition-colors"
                      >
                        <span className="text-[10px] font-mono text-sky-400 block mb-1">{c.id}</span>
                        <div className="font-bold text-white text-sm">{c.categoryName}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setWorkflowStep(2)}
                    className="py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs transition-colors"
                  >
                    Lanjut ke [2. Spesifikasi Profil] &rarr;
                  </button>
                </div>
              )}

              {workflowStep === 2 && (
                <MaterialProfileInputForm
                  categories={categories}
                  onSaveProfile={handleSaveProfile}
                  onNavigateNext={() => setWorkflowStep(3)}
                />
              )}

              {workflowStep === 3 && (
                <div className="max-w-4xl mx-auto space-y-4">
                  <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <div>
                      <h2 className="text-sm font-bold text-white">Langkah 3: Input Stok Gudang (Multi-Size Planks)</h2>
                      <p className="text-xs text-slate-400">
                        Kelola balok scrap (misal: 2500mm) dan balok standar 6000mm di gudang offline.
                      </p>
                    </div>
                    <button
                      onClick={() => setWorkflowStep(4)}
                      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      Lanjut ke [4. Summary Produksi] &rarr;
                    </button>
                  </div>

                  <StockValidatorTab
                    components={components}
                    profiles={profiles}
                    stockInventory={stockInventory}
                    onUpdateStock={setStockInventory}
                  />
                </div>
              )}

              {workflowStep === 4 && (
                <PreCuttingSummaryDashboard
                  components={components}
                  profiles={profiles}
                  screws={screws}
                  stockInventory={stockInventory}
                  projectName="Kusen Pintu Shopfront 3 Inch (900x2100mm)"
                  onCommitTransaction={(updatedInventory) => setStockInventory(updatedInventory)}
                  onNavigateToCad={() => setActiveTab('cad')}
                />
              )}
            </div>
          </div>
        )}

        {/* 3D CAD Tab */}
        {activeTab === 'cad' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            <div className="flex-1 h-full relative">
              <CadViewer3D
                components={components}
                profiles={profiles}
                screws={screws}
                selectedComponentId={selectedComponentId}
                onSelectComponent={setSelectedComponentId}
                showScrews={showScrews}
                showWireframe={showWireframe}
                explosionFactor={explosionFactor}
                onAddScrewPoint={(newScrew) => setScrews((prev) => [...prev, newScrew])}
              />

              <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-2 rounded-lg text-xs shadow-xl">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={showScrews}
                    onChange={(e) => setShowScrews(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>Screws/Rivets</span>
                </label>

                <div className="w-[1px] h-4 bg-slate-700 mx-1" />

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={showWireframe}
                    onChange={(e) => setShowWireframe(e.target.checked)}
                    className="accent-sky-500 rounded"
                  />
                  <span>Wireframe</span>
                </label>

                <div className="w-[1px] h-4 bg-slate-700 mx-1" />

                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="text-[11px] text-slate-400">Explode:</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={explosionFactor}
                    onChange={(e) => setExplosionFactor(parseFloat(e.target.value))}
                    className="w-16 accent-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="w-full md:w-96 h-1/2 md:h-full shrink-0">
              <AssemblyEditor
                components={components}
                profiles={profiles}
                screws={screws}
                selectedComponentId={selectedComponentId}
                onSelectComponent={setSelectedComponentId}
                onUpdateComponent={handleUpdateComponent}
                onAddComponent={handleAddComponent}
                onDeleteComponent={handleDeleteComponent}
                onAddScrew={handleAddScrew}
                onDeleteScrew={handleDeleteScrew}
                onApplyPreset={handleApplyPreset}
              />
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <StockValidatorTab
            components={components}
            profiles={profiles}
            stockInventory={stockInventory}
            onUpdateStock={setStockInventory}
          />
        )}

        {activeTab === 'bom' && (
          <BomReportTab
            components={components}
            profiles={profiles}
            screws={screws}
            projectName="Kusen Aluminium Shopfront 3 Inch"
          />
        )}

        {activeTab === 'code' && <DartCodeExplorer />}
      </div>
    </div>
  );
}
