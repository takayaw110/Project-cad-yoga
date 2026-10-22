import { CuttingRequest, StockInventory, ValidationResult, PlankAllocation } from '../types';

export class StockValidatorService {
  /**
   * Optimizes and allocates cutting requests onto available warehouse inventory planks.
   *
   * Logic:
   * 1. Sort demands from longest to shortest (Greedy Approach).
   * 2. For each request, prioritize shortest scrap plank that can accommodate the cut
   *    (Smallest Sufficient Scrap First), thereby preserving long 6000mm stock planks.
   * 3. For every cut, deduct (requestedLength + kerfThickness) from remaining length.
   * 4. Logs detailed step-by-step allocations and returns failure if insufficient stock.
   */
  static validateAndAllocate({
    requests,
    stockInventory,
    kerfThickness = 3.0,
    targetProfileId,
  }: {
    requests: CuttingRequest[];
    stockInventory: StockInventory[];
    kerfThickness?: number;
    targetProfileId?: string;
  }): ValidationResult {
    const logs: string[] = [];
    logs.push(`[StockValidatorService] Initializing cut plan with Kerf = ${kerfThickness.toFixed(1)}mm.`);

    // Filter requests for target profile if specified
    const activeRequests = targetProfileId
      ? requests.filter((r) => r.profileId === targetProfileId)
      : [...requests];

    if (activeRequests.length === 0) {
      return {
        isSuccess: true,
        statusMessage: 'No cutting requests required for this profile.',
        allocationLog: ['No parts to cut.'],
        allocations: [],
        unallocatedRequests: [],
        totalScrapSavedMm: 0,
        totalNewPlanksUsed: 0,
      };
    }

    // Expand warehouse inventory into individual concrete planks
    const relevantStock = targetProfileId
      ? stockInventory.filter((s) => s.profileId === targetProfileId)
      : stockInventory;

    const availablePlanks: PlankAllocation[] = [];
    let plankCounter = 1;

    for (const item of relevantStock) {
      for (let q = 0; q < item.quantityInWarehouse; q++) {
        const isScrap = item.lengthAvailable < 5800; // Anything less than standard 6m is considered scrap/short
        availablePlanks.push({
          plankId: `PLANK-${isScrap ? 'SCRAP' : 'STD'}-${plankCounter++} (${item.lengthAvailable}mm)`,
          originalLength: item.lengthAvailable,
          remainingLength: item.lengthAvailable,
          cuts: [],
          isScrap,
        });
      }
    }

    logs.push(`Available inventory for cutting: ${availablePlanks.length} individual planks.`);

    // STAGE 3 RULE 1: Sort demands from longest to shortest (Greedy Approach)
    const sortedRequests = [...activeRequests].sort((a, b) => b.requestedLength - a.requestedLength);
    logs.push(
      `Sorted ${sortedRequests.length} cutting demand(s) in descending order: [${sortedRequests
        .map((r) => `${r.label}: ${r.requestedLength}mm`)
        .join(', ')}]`
    );

    const unallocated: CuttingRequest[] = [];
    let scrapSavedMm = 0;

    for (const req of sortedRequests) {
      const requiredWithKerf = req.requestedLength + kerfThickness;
      logs.push(`\nEvaluating demand "${req.label}" [${req.requestedLength}mm + ${kerfThickness}mm kerf = ${requiredWithKerf}mm]...`);

      // STAGE 3 RULE 2: Consume shorter scrap planks before cutting standard 6000mm planks.
      // We look for planks that can fit the cut, sorting by:
      // 1. isScrap first (true before false)
      // 2. remainingLength ascending (Best fit / smallest plank that fits to minimize leftover unusable scrap)
      const eligiblePlanks = availablePlanks
        .filter((p) => p.remainingLength >= req.requestedLength) // Note: last cut doesn't strictly need trailing kerf if exact, but reserving kerf is safe
        .sort((a, b) => {
          if (a.isScrap && !b.isScrap) return -1;
          if (!a.isScrap && b.isScrap) return 1;
          return a.remainingLength - b.remainingLength;
        });

      if (eligiblePlanks.length === 0) {
        logs.push(`❌ INVENTORY DEFICIT: Cannot allocate "${req.label}" (${req.requestedLength}mm). No stock plank has sufficient remaining length.`);
        unallocated.push(req);
        continue;
      }

      // Select optimal plank
      const selectedPlank = eligiblePlanks[0];
      const previousRemaining = selectedPlank.remainingLength;
      
      // STAGE 3 RULE 3: For every cut, subtract requestedLength + kerfThickness
      const effectiveCutDeduction = Math.min(requiredWithKerf, previousRemaining);
      selectedPlank.remainingLength -= effectiveCutDeduction;

      selectedPlank.cuts.push({
        componentId: req.componentId,
        label: req.label,
        length: req.requestedLength,
        kerf: kerfThickness,
      });

      if (selectedPlank.isScrap) {
        scrapSavedMm += req.requestedLength;
      }

      logs.push(
        `  -> Allocated to ${selectedPlank.plankId}. Before: ${previousRemaining}mm -> Cut: ${req.requestedLength}mm (kerf ${kerfThickness}mm) -> Remaining: ${selectedPlank.remainingLength.toFixed(1)}mm.`
      );
    }

    const usedPlanks = availablePlanks.filter((p) => p.cuts.length > 0);
    const newPlanksUsed = usedPlanks.filter((p) => !p.isScrap).length;
    const isSuccess = unallocated.length === 0;

    const summaryMessage = isSuccess
      ? `SUCCESS: All ${activeRequests.length} aluminum cuts successfully allocated across ${usedPlanks.length} warehouse plank(s).`
      : `FAILURE: Insufficient inventory! ${unallocated.length} cut(s) could not be fulfilled. Restock required.`;

    logs.push(`\n================ FINAL SUMMARY ================`);
    logs.push(summaryMessage);
    logs.push(`Planks Utilized: ${usedPlanks.length} total (${usedPlanks.filter((p) => p.isScrap).length} scrap reused, ${newPlanksUsed} full standard 6000mm planks).`);
    logs.push(`Scrap Saved from Waste: ${(scrapSavedMm / 1000).toFixed(2)} meters.`);

    return {
      isSuccess,
      statusMessage: summaryMessage,
      allocationLog: logs,
      allocations: usedPlanks,
      unallocatedRequests: unallocated,
      totalScrapSavedMm: scrapSavedMm,
      totalNewPlanksUsed: newPlanksUsed,
    };
  }
}
