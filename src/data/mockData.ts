import { MaterialCategory, MaterialProfile, StockInventory, ProjectItem } from '../types';

export const INITIAL_CATEGORIES: MaterialCategory[] = [
  { id: 'cat-1', categoryName: 'Profil Aluminium' },
  { id: 'cat-2', categoryName: 'Aksesoris & Fasteners' },
  { id: 'cat-3', categoryName: 'Karet & Sealant' },
];

export const INITIAL_PROFILES: MaterialProfile[] = [
  {
    id: 'prof-0504',
    categoryId: 'cat-1',
    profileCode: '0504 Shopfront 3 Inch',
    name: 'Open Back Jamb / Tiang Buka 3"',
    width: 44.5,
    height: 76.2,
    wallThickness: 1.2,
    outerPerimeter: 241.4, // 2*(44.5+76.2)
    unitPrice: 38.5, // IDR per mm (~38,500 IDR/meter)
    color: '#94a3b8',
  },
  {
    id: 'prof-0505',
    categoryId: 'cat-1',
    profileCode: '0505 Head Transom 3 Inch',
    name: 'Ambang Atas / Transom 3"',
    width: 44.5,
    height: 76.2,
    wallThickness: 1.2,
    outerPerimeter: 241.4,
    unitPrice: 38.5,
    color: '#cbd5e1',
  },
  {
    id: 'prof-0508',
    categoryId: 'cat-1',
    profileCode: '0508 Close Back 3 Inch',
    name: 'Tiang Mati / Close Back 3"',
    width: 44.5,
    height: 76.2,
    wallThickness: 1.25,
    outerPerimeter: 241.4,
    unitPrice: 39.0,
    color: '#64748b',
  },
  {
    id: 'prof-hollow-40',
    categoryId: 'cat-1',
    profileCode: 'Hollow 40x40 Square',
    name: 'Hollow Aluminium 40x40',
    width: 40.0,
    height: 40.0,
    wallThickness: 1.3,
    outerPerimeter: 160.0,
    unitPrice: 28.0,
    color: '#a1a1aa',
  },
];

export const INITIAL_STOCK: StockInventory[] = [
  // 0504 Shopfront: 2 short scrap pieces + several 6000mm standard planks
  { profileId: 'prof-0504', lengthAvailable: 2350, quantityInWarehouse: 2 },
  { profileId: 'prof-0504', lengthAvailable: 6000, quantityInWarehouse: 4 },
  // 0505 Transom: 1 short scrap piece + 6000mm planks
  { profileId: 'prof-0505', lengthAvailable: 1100, quantityInWarehouse: 1 },
  { profileId: 'prof-0505', lengthAvailable: 6000, quantityInWarehouse: 3 },
  // Hollow 40x40:
  { profileId: 'prof-hollow-40', lengthAvailable: 2800, quantityInWarehouse: 1 },
  { profileId: 'prof-hollow-40', lengthAvailable: 6000, quantityInWarehouse: 2 },
];

export const INITIAL_PROJECT: ProjectItem = {
  id: 'proj-001',
  projectName: 'Kusen Pintu Shopfront 3" (900x2100mm)',
  timestamp: Date.now(),
  components: [
    // Left Vertical Jamb: 2100mm tall, located at X = 0
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
      rotationZ: 0, // runs along Y-axis
    },
    // Right Vertical Jamb: 2100mm tall, located at X = 900 - 44.5 = 855.5mm
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
    // Horizontal Head Transom: sits atop the two jambs, length = 900mm
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
      rotationZ: -90, // rotated 90 deg so it runs horizontally along X-axis
    },
  ],
  screws: [
    // Corner join left top
    {
      id: 'scr-1',
      positionX: 22.25,
      positionY: 2138.1,
      positionZ: 15,
      type: 'Sekrup 3 Inch Countersunk',
    },
    {
      id: 'scr-2',
      positionX: 22.25,
      positionY: 2138.1,
      positionZ: 60,
      type: 'Sekrup 3 Inch Countersunk',
    },
    // Corner join right top
    {
      id: 'scr-3',
      positionX: 877.75,
      positionY: 2138.1,
      positionZ: 15,
      type: 'Sekrup 3 Inch Countersunk',
    },
    {
      id: 'scr-4',
      positionX: 877.75,
      positionY: 2138.1,
      positionZ: 60,
      type: 'Sekrup 3 Inch Countersunk',
    },
    // Gusset / bracket rivet points
    {
      id: 'scr-5',
      positionX: 44.5,
      positionY: 2060,
      positionZ: 38.1,
      type: 'Rivet 4.0mm Blind Rivet',
    },
    {
      id: 'scr-6',
      positionX: 855.5,
      positionY: 2060,
      positionZ: 38.1,
      type: 'Rivet 4.0mm Blind Rivet',
    },
  ],
  totalCost: 0,
};
