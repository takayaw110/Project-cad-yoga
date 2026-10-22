import React from 'react';
import { AssembledComponent, MaterialProfile, ScrewPoint } from '../types';
import { BomCalculatorEngine } from '../services/bomCalculator';
import { Calculator, Download, DollarSign, Scale, Layers, CheckCircle2 } from 'lucide-react';

interface BomReportTabProps {
  components: AssembledComponent[];
  profiles: MaterialProfile[];
  screws: ScrewPoint[];
  projectName: string;
}

export const BomReportTab: React.FC<BomReportTabProps> = ({
  components,
  profiles,
  screws,
  projectName,
}) => {
  const bom = BomCalculatorEngine.calculateBom(components, profiles, screws);

  const exportCsv = () => {
    let csv = `BOM REPORT - ${projectName}\n`;
    csv += `Stage 4 BOM Calculator Engine\n`;
    csv += `Generated at: ${new Date().toLocaleString()}\n\n`;
    csv += `Component,Profile Code,Length (mm),Perimeter (mm),Wall Thickness (mm),Volume (cm3),Weight (kg),Unit Price (IDR/mm),Total Cost (IDR)\n`;

    bom.components.forEach((c) => {
      csv += `"${c.label}","${c.profileCode}",${c.lengthMm},${c.outerPerimeterMm},${c.wallThicknessMm},${(c.volumeMm3 / 1000).toFixed(2)},${c.weightKg.toFixed(3)},${c.unitPricePerMm},${c.materialCost.toFixed(0)}\n`;
    });

    csv += `\nFASTENERS & ACCESSORIES\nType,Quantity,Unit Cost (IDR),Subtotal (IDR)\n`;
    bom.fasteners.forEach((f) => {
      csv += `"${f.type}",${f.count},${f.estimatedUnitPrice},${f.totalCost}\n`;
    });

    csv += `\nSUMMARY\n`;
    csv += `Total Extrusion Length (m),${(bom.totalLengthMm / 1000).toFixed(2)}\n`;
    csv += `Total Extrusion Weight (kg),${bom.totalWeightKg.toFixed(3)}\n`;
    csv += `Raw Material Profile Cost (IDR),${bom.totalProfileCost.toFixed(0)}\n`;
    csv += `Fastener Cost (IDR),${bom.totalFastenerCost.toFixed(0)}\n`;
    csv += `Grand Total Cost (IDR),${bom.grandTotalCost.toFixed(0)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BOM_${projectName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded uppercase tracking-wider">
              Stage 4 Implementation
            </span>
            <span className="text-xs text-slate-400 font-mono">BomCalculatorEngine</span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-sky-400" />
            <span>Bill of Materials (BOM) &amp; Manufacturing Cost Calculator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Physics calculation: Volume = Perimeter × Thickness × Length. Weight derived with 6063 Aluminum density (2.70 g/cm³).
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors shadow-sm self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Profile Length</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {(bom.totalLengthMm / 1000).toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400">meters</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{bom.components.length} Extrusion Bars</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Net Aluminum Weight</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {bom.totalWeightKg.toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400">kg</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Volume: {(bom.totalVolumeMm3 / 1000).toFixed(0)} cm³
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Fasteners &amp; Screws</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {screws.length}{' '}
            <span className="text-xs font-normal text-slate-400">points</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Cost: IDR {bom.totalFastenerCost.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 bg-gradient-to-br from-slate-900 to-sky-950/40">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Grand Total Raw Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            IDR {bom.grandTotalCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Profiles: IDR {bom.totalProfileCost.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Extruded Profile Components Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6 overflow-hidden">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span>1. Extruded Aluminum Cut List &amp; Physical Properties</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider font-mono text-[11px]">
              <tr>
                <th className="p-3">Component Member</th>
                <th className="p-3">Profile Spec</th>
                <th className="p-3 text-right">Length (mm)</th>
                <th className="p-3 text-right">Perimeter</th>
                <th className="p-3 text-right">Wall (t)</th>
                <th className="p-3 text-right">Volume (cm³)</th>
                <th className="p-3 text-right">Est. Weight (kg)</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Material Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
              {bom.components.map((item) => (
                <tr key={item.componentId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-sans font-semibold text-white">{item.label}</td>
                  <td className="p-3 text-sky-400 font-sans">{item.profileCode}</td>
                  <td className="p-3 text-right font-bold">{item.lengthMm.toFixed(0)}</td>
                  <td className="p-3 text-right text-slate-400">{item.outerPerimeterMm.toFixed(1)} mm</td>
                  <td className="p-3 text-right text-slate-400">{item.wallThicknessMm.toFixed(2)} mm</td>
                  <td className="p-3 text-right text-slate-300">{(item.volumeMm3 / 1000).toFixed(1)}</td>
                  <td className="p-3 text-right text-emerald-400 font-bold">{item.weightKg.toFixed(3)}</td>
                  <td className="p-3 text-right text-slate-400">IDR {item.unitPricePerMm.toFixed(1)}/mm</td>
                  <td className="p-3 text-right text-white font-bold">
                    IDR {item.materialCost.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-700 bg-slate-800/50 font-bold font-mono text-xs">
              <tr>
                <td colSpan={2} className="p-3 font-sans">
                  Total Profiles
                </td>
                <td className="p-3 text-right font-bold text-sky-400">{bom.totalLengthMm.toFixed(0)} mm</td>
                <td colSpan={3} className="p-3 text-right text-slate-400">Total Weight:</td>
                <td className="p-3 text-right text-emerald-400">{bom.totalWeightKg.toFixed(3)} kg</td>
                <td className="p-3 text-right">Subtotal:</td>
                <td className="p-3 text-right text-emerald-300">
                  IDR {bom.totalProfileCost.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Fasteners & Hardware Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span>2. Fasteners, Screws &amp; Rivets</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider font-mono text-[11px]">
              <tr>
                <th className="p-3">Fastener Specification</th>
                <th className="p-3 text-right">Joint Count</th>
                <th className="p-3 text-right">Unit Price (IDR)</th>
                <th className="p-3 text-right">Subtotal (IDR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
              {bom.fasteners.map((f, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-sans font-semibold text-amber-300">{f.type}</td>
                  <td className="p-3 text-right font-bold">{f.count} pcs</td>
                  <td className="p-3 text-right text-slate-400">IDR {f.estimatedUnitPrice.toLocaleString()}</td>
                  <td className="p-3 text-right text-white font-bold">IDR {f.totalCost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-700 bg-slate-800/50 font-bold font-mono text-xs">
              <tr>
                <td colSpan={3} className="p-3 text-right">
                  Fasteners Subtotal:
                </td>
                <td className="p-3 text-right text-amber-300">
                  IDR {bom.totalFastenerCost.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
