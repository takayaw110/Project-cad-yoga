import React from 'react';
import { ChevronRight, Check } from 'lucide-react';

export interface BreadcrumbStep {
  index: number;
  label: string;
  sublabel: string;
}

export const YOGA_STEPS: BreadcrumbStep[] = [
  { index: 1, label: 'Pilih Kategori', sublabel: 'Aluminium / Aksesoris' },
  { index: 2, label: 'Spesifikasi Profil', sublabel: 'Dimensi & Harga' },
  { index: 3, label: 'Input Stok Gudang', sublabel: 'Batangan & Scrap' },
  { index: 4, label: 'Summary Produksi', sublabel: 'Validasi & Estimasi BOM' },
];

interface YogaBreadcrumbsProps {
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export const YogaBreadcrumbs: React.FC<YogaBreadcrumbsProps> = ({
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 px-4 py-3 select-none">
      <div className="max-w-5xl mx-auto flex items-center justify-between overflow-x-auto">
        {YOGA_STEPS.map((step, idx) => {
          const isCurrent = step.index === currentStep;
          const isCompleted = step.index < currentStep;

          return (
            <React.Fragment key={step.index}>
              <button
                type="button"
                onClick={() => onStepClick && onStepClick(step.index)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-left group ${
                  isCurrent
                    ? 'bg-sky-500/15 border border-sky-500/40 shadow-sm'
                    : isCompleted
                    ? 'hover:bg-slate-800/60'
                    : 'opacity-50 hover:opacity-80'
                }`}
              >
                {/* Step badge number or checkmark */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                    isCurrent
                      ? 'bg-sky-500 text-white ring-4 ring-sky-500/20'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.index}
                </div>

                {/* Step labels */}
                <div className="flex flex-col">
                  <span
                    className={`text-xs font-bold leading-tight ${
                      isCurrent
                        ? 'text-sky-300'
                        : isCompleted
                        ? 'text-emerald-300'
                        : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                    {step.sublabel}
                  </span>
                </div>
              </button>

              {idx < YOGA_STEPS.length - 1 && (
                <div className="flex items-center px-1 text-slate-600">
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
