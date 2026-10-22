export interface MaterialCategory {
  id: string;
  categoryName: string;
}

export interface MaterialProfile {
  id: string;
  categoryId: string;
  profileCode: string;
  name: string;
  width: number; // outer width mm (e.g., 44.5 mm for 1.75 inch or 76.2 mm for 3 inch)
  height: number; // outer depth mm (e.g., 76.2 mm for 3 inch shopfront)
  wallThickness: number; // in mm, e.g. 1.2 mm or 1.5 mm
  outerPerimeter: number; // mm perimeter of cross-section
  unitPrice: number; // local price per meter (or mm)
  color: string;
}

export interface StockInventory {
  profileId: string;
  lengthAvailable: number; // in mm (e.g. 2500 scrap, 6000 standard)
  quantityInWarehouse: number;
}

export interface AssembledComponent {
  id: string;
  profileId: string;
  label: string;
  customLength: number; // mm
  positionX: number; // mm
  positionY: number; // mm
  positionZ: number; // mm
  rotationX: number; // degrees
  rotationY: number; // degrees
  rotationZ: number; // degrees
}

export interface ScrewPoint {
  id: string;
  positionX: number; // mm
  positionY: number; // mm
  positionZ: number; // mm
  type: string; // e.g. "Sekrup 3 Inch", "Rivet 4.0mm", "Self-Drilling Screw"
}

export interface ProjectItem {
  id: string;
  projectName: string;
  timestamp: number;
  components: AssembledComponent[];
  screws: ScrewPoint[];
  totalCost: number;
}

export interface CuttingRequest {
  componentId: string;
  profileId: string;
  label: string;
  requestedLength: number;
}

export interface CutSegment {
  componentId: string;
  label: string;
  length: number;
  kerf: number;
}

export interface PlankAllocation {
  plankId: string;
  originalLength: number;
  remainingLength: number;
  cuts: CutSegment[];
  isScrap: boolean;
}

export interface ValidationResult {
  isSuccess: boolean;
  statusMessage: string;
  allocationLog: string[];
  allocations: PlankAllocation[];
  unallocatedRequests: CuttingRequest[];
  totalScrapSavedMm: number;
  totalNewPlanksUsed: number;
}
