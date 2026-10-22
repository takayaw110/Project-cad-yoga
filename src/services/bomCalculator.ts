import { MaterialProfile, AssembledComponent, ScrewPoint } from '../types';

export interface ComponentBomItem {
  componentId: string;
  label: string;
  profileCode: string;
  lengthMm: number;
  outerPerimeterMm: number;
  wallThicknessMm: number;
  volumeMm3: number;
  weightKg: number;
  unitPricePerMm: number;
  materialCost: number;
}

export interface FastenerBomItem {
  type: string;
  count: number;
  estimatedUnitPrice: number;
  totalCost: number;
}

export interface BomCalculationResult {
  components: ComponentBomItem[];
  fasteners: FastenerBomItem[];
  totalLengthMm: number;
  totalVolumeMm3: number;
  totalWeightKg: number;
  totalProfileCost: number;
  totalFastenerCost: number;
  grandTotalCost: number;
}

export class BomCalculatorEngine {
  /**
   * Aluminum Alloy 6063-T5 standard architectural density:
   * 2.70 g/cm³ = 0.00000270 kg/mm³ (2.70e-6 kg/mm³)
   */
  public static readonly ALUMINUM_DENSITY_KG_MM3 = 0.0000027;

  // Estimated standard local hardware cost per fastener unit
  public static readonly FASTENER_PRICES: Record<string, number> = {
    'Sekrup 3 Inch': 850,
    'Sekrup 3 Inch Countersunk': 850,
    'Rivet 4.0mm': 300,
    'Rivet 4.0mm Blind Rivet': 300,
    'Self-Drilling Screw': 950,
  };

  /**
   * STAGE 4: BOM CALCULATOR ENGINE
   * Formula:
   * Volume = Perimeter * Thickness * Length
   * Weight = Volume * Density
   * Cost = (Length * unitPrice) or (Weight * pricePerKg)
   */
  public static calculateBom(
    components: AssembledComponent[],
    profiles: MaterialProfile[],
    screws: ScrewPoint[]
  ): BomCalculationResult {
    const profileMap = new Map<string, MaterialProfile>(profiles.map((p) => [p.id, p]));

    const componentItems: ComponentBomItem[] = [];
    let totalLengthMm = 0;
    let totalVolumeMm3 = 0;
    let totalWeightKg = 0;
    let totalProfileCost = 0;

    for (const comp of components) {
      const profile = profileMap.get(comp.profileId) || {
        id: comp.profileId,
        categoryId: 'cat-1',
        profileCode: 'Unknown Profile',
        name: 'Custom Profile',
        width: 44.5,
        height: 76.2,
        wallThickness: 1.2,
        outerPerimeter: 241.4,
        unitPrice: 38.5,
        color: '#94a3b8',
      };

      const length = comp.customLength;
      const perimeter = profile.outerPerimeter;
      const thickness = profile.wallThickness;

      // STAGE 4 FORMULA:
      // Volume = Perimeter (mm) * Thickness (mm) * Length (mm)
      const volumeMm3 = perimeter * thickness * length;

      // Weight (kg) = Volume (mm³) * Density (kg/mm³)
      const weightKg = volumeMm3 * this.ALUMINUM_DENSITY_KG_MM3;

      // Material Cost = length * unitPrice (where unitPrice is per mm)
      const materialCost = length * profile.unitPrice;

      totalLengthMm += length;
      totalVolumeMm3 += volumeMm3;
      totalWeightKg += weightKg;
      totalProfileCost += materialCost;

      componentItems.push({
        componentId: comp.id,
        label: comp.label,
        profileCode: profile.profileCode,
        lengthMm: length,
        outerPerimeterMm: perimeter,
        wallThicknessMm: thickness,
        volumeMm3,
        weightKg,
        unitPricePerMm: profile.unitPrice,
        materialCost,
      });
    }

    // Fasteners breakdown
    const fastenerCounts: Record<string, number> = {};
    for (const screw of screws) {
      const type = screw.type || 'Standard Fastener';
      fastenerCounts[type] = (fastenerCounts[type] || 0) + 1;
    }

    const fastenerItems: FastenerBomItem[] = Object.entries(fastenerCounts).map(([type, count]) => {
      const price = this.FASTENER_PRICES[type] || 750;
      return {
        type,
        count,
        estimatedUnitPrice: price,
        totalCost: count * price,
      };
    });

    const totalFastenerCost = fastenerItems.reduce((acc, curr) => acc + curr.totalCost, 0);
    const grandTotalCost = totalProfileCost + totalFastenerCost;

    return {
      components: componentItems,
      fasteners: fastenerItems,
      totalLengthMm,
      totalVolumeMm3,
      totalWeightKg,
      totalProfileCost,
      totalFastenerCost,
      grandTotalCost,
    };
  }
}
