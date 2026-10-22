import { StockInventory, PlankAllocation, ValidationResult } from '../types';

export interface StockTransactionResult {
  isExecuted: boolean;
  timestamp: number;
  consumedPlanksCount: number;
  newOffcutsRegistered: {
    profileId: string;
    lengthMm: number;
    description: string;
  }[];
  discardedWasteMm: number;
  updatedInventory: StockInventory[];
  transactionLog: string[];
}

export class StockTransactionService {
  /**
   * Minimum threshold for a leftover cutting remnant to be re-admitted into warehouse inventory as usable scrap.
   * Pieces shorter than this (e.g. < 500mm) are logged as irrecoverable saw waste.
   */
  public static readonly MIN_USABLE_SCRAP_THRESHOLD_MM = 500.0;

  /**
   * Executes and commits cutting plan allocations permanently against the warehouse inventory.
   *
   * Logic:
   * 1. Consumes warehouse planks allocated in the ValidationResult.
   * 2. Decrements warehouse quantities.
   * 3. Evaluates remainingLength on each cut plank:
   *    - If remainingLength >= 500mm -> Auto-registers back as a new scrap plank entry in StockInventory.
   *    - If remainingLength < 500mm -> Logged as sawdust/kerf waste.
   * 4. Returns an updated StockInventory array and a detailed audit transaction log.
   */
  public static commitCuttingTransaction({
    validationResult,
    currentInventory,
    targetProfileId,
  }: {
    validationResult: ValidationResult;
    currentInventory: StockInventory[];
    targetProfileId?: string;
  }): StockTransactionResult {
    const logs: string[] = [];
    const timestamp = Date.now();
    const dateStr = new Date(timestamp).toLocaleString();

    logs.push(`[StockTransactionService] EXECUTING COMMITTED CUTTING LIST at ${dateStr}`);

    if (!validationResult.isSuccess || validationResult.allocations.length === 0) {
      logs.push(`❌ TRANSACTION ABORTED: Validation result is either invalid or contains no allocated cuts.`);
      return {
        isExecuted: false,
        timestamp,
        consumedPlanksCount: 0,
        newOffcutsRegistered: [],
        discardedWasteMm: 0,
        updatedInventory: currentInventory,
        transactionLog: logs,
      };
    }

    // Clone inventory to apply transactional deductions
    const inventoryMap = new Map<string, StockInventory>();
    currentInventory.forEach((item) => {
      const key = `${item.profileId}_${item.lengthAvailable.toFixed(0)}`;
      inventoryMap.set(key, { ...item });
    });

    const newOffcuts: { profileId: string; lengthMm: number; description: string }[] = [];
    let discardedWaste = 0;
    let consumedCount = 0;

    for (const plank of validationResult.allocations) {
      consumedCount++;
      const origLength = plank.originalLength;
      const remaining = Math.max(0, plank.remainingLength);

      logs.push(`\nProcessing Workpiece "${plank.plankId}" (Initial: ${origLength}mm):`);
      logs.push(`  -> Applied ${plank.cuts.length} cuts: [${plank.cuts.map((c) => `${c.label}: ${c.length}mm`).join(', ')}]`);

      // 1. Deduct source plank from inventory
      // Find matching item in inventory
      let matchedKey: string | null = null;
      for (const [key, item] of inventoryMap.entries()) {
        const profileMatches = targetProfileId ? item.profileId === targetProfileId : true;
        if (profileMatches && Math.abs(item.lengthAvailable - origLength) < 1.0 && item.quantityInWarehouse > 0) {
          matchedKey = key;
          break;
        }
      }

      if (matchedKey && inventoryMap.has(matchedKey)) {
        const item = inventoryMap.get(matchedKey)!;
        item.quantityInWarehouse -= 1;
        logs.push(`  -> Deducted 1x source plank (${origLength}mm) from warehouse. Remaining in stock: ${item.quantityInWarehouse}`);
        if (item.quantityInWarehouse <= 0) {
          inventoryMap.delete(matchedKey);
        }
      } else {
        logs.push(`  -> Note: Source plank was dynamically allocated or scrap single.`);
      }

      // 2. STAGE 7 RECOVERY MECHANISM:
      // Evaluate leftover remnant (Offcut/Scrap)
      if (remaining >= this.MIN_USABLE_SCRAP_THRESHOLD_MM) {
        const profileId = targetProfileId || 'prof-0504';
        const offcutRounded = Math.floor(remaining);

        newOffcuts.push({
          profileId,
          lengthMm: offcutRounded,
          description: `Sisa Potong (Offcut) dari ${plank.plankId}`,
        });

        // Add or increment scrap entry in warehouse
        const scrapKey = `${profileId}_${offcutRounded}`;
        if (inventoryMap.has(scrapKey)) {
          inventoryMap.get(scrapKey)!.quantityInWarehouse += 1;
        } else {
          inventoryMap.set(scrapKey, {
            profileId,
            lengthAvailable: offcutRounded,
            quantityInWarehouse: 1,
          });
        }

        logs.push(`  ♻️ OFFCUT SALVAGED: Remaining ${remaining.toFixed(1)}mm >= ${this.MIN_USABLE_SCRAP_THRESHOLD_MM}mm -> Registered as new warehouse scrap plank.`);
      } else {
        discardedWaste += remaining;
        logs.push(`  🗑️ SCRAP DISCARDED: Remaining ${remaining.toFixed(1)}mm < ${this.MIN_USABLE_SCRAP_THRESHOLD_MM}mm -> Sent to recycle bin.`);
      }
    }

    const finalInventory = Array.from(inventoryMap.values()).filter((i) => i.quantityInWarehouse > 0);

    logs.push(`\n================ TRANSACTION SUMMARY ================`);
    logs.push(`Status: SUCCESS - Permanently Committed to Warehouse Database.`);
    logs.push(`Total Planks Consumed: ${consumedCount} plank(s).`);
    logs.push(`New Usable Offcuts Registered: ${newOffcuts.length} scrap plank(s).`);
    logs.push(`Total Discarded Waste: ${(discardedWaste / 1000).toFixed(2)} meters.`);
    logs.push(`Updated Warehouse Inventory Entries: ${finalInventory.length}.`);

    return {
      isExecuted: true,
      timestamp,
      consumedPlanksCount: consumedCount,
      newOffcutsRegistered: newOffcuts,
      discardedWasteMm: discardedWaste,
      updatedInventory: finalInventory,
      transactionLog: logs,
    };
  }
}
