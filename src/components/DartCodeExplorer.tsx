import React, { useState } from 'react';
import { Copy, Check, FileCode, FolderTree, Code2 } from 'lucide-react';

interface StageFile {
  title: string;
  stage: string;
  filename: string;
  description: string;
  code: string;
}

export const DART_STAGES: StageFile[] = [
  {
    title: 'Stage 1: Hive Offline Data Architecture',
    stage: 'STAGE 1',
    filename: 'lib/features/cad/data/models/hive_models.dart',
    description: 'Complete offline Hive database schema with TypeId, HiveField annotations, and relationship references for offline APK operation.',
    code: `// ============================================================================
// PROJECT YOGA - STAGE 1: HIVE OFFLINE DATA ARCHITECTURE
// File: lib/features/cad/data/models/hive_models.dart
// ============================================================================

import 'package:hive/hive.dart';

part 'hive_models.g.dart';

/// 1. MaterialCategory: Groups aluminum extrusions, accessories, fasteners
@HiveType(typeId: 0)
class MaterialCategory extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String categoryName; // e.g. "Profil Aluminium", "Aksesoris & Fasteners"

  MaterialCategory({
    required this.id,
    required this.categoryName,
  });
}

/// 2. MaterialProfile: Master catalog for aluminum extrusion profiles
@HiveType(typeId: 1)
class MaterialProfile extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String categoryId;

  @HiveField(2)
  final String profileCode; // e.g. "0504 Shopfront 3 Inch", "0505 Head Transom"

  @HiveField(3)
  final double wallThickness; // in mm, e.g. 1.2 or 1.5 mm

  @HiveField(4)
  final double unitPrice; // local price per mm or meter

  @HiveField(5)
  final double outerPerimeter; // cross-section outer perimeter in mm

  @HiveField(6)
  final double width; // outer width in mm (e.g. 44.5 mm)

  @HiveField(7)
  final double depth; // outer depth in mm (e.g. 76.2 mm)

  MaterialProfile({
    required this.id,
    required this.categoryId,
    required this.profileCode,
    required this.wallThickness,
    required this.unitPrice,
    required this.outerPerimeter,
    required this.width,
    required this.depth,
  });
}

/// 3. StockInventory: Physical stock tracking per profile in warehouse
@HiveType(typeId: 2)
class StockInventory extends HiveObject {
  @HiveField(0)
  final String profileId;

  @HiveField(1)
  double lengthAvailable; // in mm (e.g. 2500.0 scrap or 6000.0 standard)

  @HiveField(2)
  int quantityInWarehouse; // count of planks with this specific length

  StockInventory({
    required this.profileId,
    required this.lengthAvailable,
    required this.quantityInWarehouse,
  });

  bool get isScrap => lengthAvailable < 5800.0;
}

/// 4. AssembledComponent: Placed member in 3D CAD space with transform coordinates
@HiveType(typeId: 3)
class AssembledComponent extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String profileId;

  @HiveField(2)
  double customLength; // in mm (e.g. 2100.0)

  @HiveField(3)
  double positionX; // mm in 3D world coordinates

  @HiveField(4)
  double positionY; // mm in 3D world coordinates

  @HiveField(5)
  double positionZ; // mm in 3D world coordinates

  @HiveField(6)
  double rotationX; // in degrees (Euler)

  @HiveField(7)
  double rotationY; // in degrees (Euler)

  @HiveField(8)
  double rotationZ; // in degrees (Euler)

  @HiveField(9)
  String label; // e.g. "Kusen Kiri", "Ambang Atas"

  AssembledComponent({
    required this.id,
    required this.profileId,
    required this.customLength,
    required this.positionX,
    required this.positionY,
    required this.positionZ,
    this.rotationX = 0.0,
    this.rotationY = 0.0,
    this.rotationZ = 0.0,
    this.label = 'Member',
  });
}

/// 5. ScrewPoint: Fastener vectors placed on joints
@HiveType(typeId: 4)
class ScrewPoint extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  double positionX; // mm in 3D world coordinates

  @HiveField(2)
  double positionY; // mm in 3D world coordinates

  @HiveField(3)
  double positionZ; // mm in 3D world coordinates

  @HiveField(4)
  String type; // e.g. "Sekrup 3 Inch Countersunk", "Rivet 4.0mm"

  ScrewPoint({
    required this.id,
    required this.positionX,
    required this.positionY,
    required this.positionZ,
    required this.type,
  });
}

/// 6. ProjectItem: Complete CAD assembly document
@HiveType(typeId: 5)
class ProjectItem extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  String projectName;

  @HiveField(2)
  DateTime timestamp;

  @HiveField(3)
  List<AssembledComponent> components;

  @HiveField(4)
  List<ScrewPoint> screws;

  @HiveField(5)
  double totalCost;

  ProjectItem({
    required this.id,
    required this.projectName,
    required this.timestamp,
    required this.components,
    required this.screws,
    this.totalCost = 0.0,
  });
}
`,
  },
  {
    title: 'Stage 2: 3D Assembly & Joining Engine',
    stage: 'STAGE 2',
    filename: 'lib/features/cad/domain/services/assembly_engine.dart',
    description: 'CustomPainter and Matrix4 transformation engine that projects 3D extruded aluminum meshes and joint screw points to screen with orthographic/perspective projection.',
    code: `// ============================================================================
// PROJECT YOGA - STAGE 2: 3D COMPONENT ASSEMBLY & JOINING ENGINE
// File: lib/features/cad/domain/services/assembly_engine.dart
// ============================================================================

import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:vector_math/vector_math_64.dart' as vmath;
import '../../data/models/hive_models.dart';

/// Core 3D logic service: joins individual components into unified scene matrix
class AssemblyEngine {
  /// Converts degrees to radians
  static double _degToRad(double deg) => deg * (math.pi / 180.0);

  /// Generates the Local-to-World Transform Matrix4 for an AssembledComponent
  static vmath.Matrix4 computeComponentTransform(AssembledComponent component) {
    final matrix = vmath.Matrix4.identity();

    // 1. Translation in 3D world coordinates (X, Y, Z in mm)
    matrix.translate(
      component.positionX,
      component.positionY,
      component.positionZ,
    );

    // 2. Intrinsic Euler Rotations
    if (component.rotationZ != 0.0) {
      matrix.rotateZ(_degToRad(component.rotationZ));
    }
    if (component.rotationY != 0.0) {
      matrix.rotateY(_degToRad(component.rotationY));
    }
    if (component.rotationX != 0.0) {
      matrix.rotateX(_degToRad(component.rotationX));
    }

    return matrix;
  }

  /// Calculates the 8 bounding box corner vertices of an extruded aluminum bar
  /// in its local space, then projects them to World Space via the transform matrix.
  static List<vmath.Vector3> computeExtrudedBoxWorldVertices(
    AssembledComponent component,
    MaterialProfile profile,
  ) {
    final transform = computeComponentTransform(component);
    final w = profile.width;
    final d = profile.depth;
    final h = component.customLength;

    // 8 Local vertices for rectangular extrusion box (along Y axis upright)
    final localVertices = <vmath.Vector3>[
      vmath.Vector3(0, 0, 0),
      vmath.Vector3(w, 0, 0),
      vmath.Vector3(w, 0, d),
      vmath.Vector3(0, 0, d),
      vmath.Vector3(0, h, 0),
      vmath.Vector3(w, h, 0),
      vmath.Vector3(w, h, d),
      vmath.Vector3(0, h, d),
    ];

    // Multiply every local point by the world matrix
    return localVertices.map((v) => transform.transformed3(v)).toList();
  }
}

/// Lightweight Offline 3D CAD CustomPainter
class CadAssemblyPainter extends CustomPainter {
  final List<AssembledComponent> components;
  final List<ScrewPoint> screws;
  final Map<String, MaterialProfile> profileCatalog;
  final double cameraRotationYaw; // radians
  final double cameraRotationPitch; // radians
  final double zoomScale;
  final Offset panOffset;

  CadAssemblyPainter({
    required this.components,
    required this.screws,
    required this.profileCatalog,
    this.cameraRotationYaw = 0.6,
    this.cameraRotationPitch = 0.4,
    this.zoomScale = 0.14,
    this.panOffset = Offset.zero,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2) + panOffset;

    // 1. Paint CAD Drafting Grid Floor
    _paintGrid(canvas, size, center);

    // 2. Camera View Matrix (Isometric / Orbit Projection)
    final viewMatrix = vmath.Matrix4.identity()
      ..translate(center.dx, center.dy, 0.0)
      ..scale(zoomScale, -zoomScale, zoomScale) // Invert Y for standard screen coordinates
      ..rotateX(cameraRotationPitch)
      ..rotateY(cameraRotationYaw);

    // 3. Render 3D Extruded Aluminum Profiles
    for (final comp in components) {
      final profile = profileCatalog[comp.profileId] ??
          MaterialProfile(
            id: comp.profileId,
            categoryId: 'cat-1',
            profileCode: '0504 Shopfront',
            wallThickness: 1.2,
            unitPrice: 38.5,
            outerPerimeter: 241.4,
            width: 44.5,
            depth: 76.2,
          );

      final worldVertices = AssemblyEngine.computeExtrudedBoxWorldVertices(comp, profile);
      final screenPoints = worldVertices.map((v) {
        final projected = viewMatrix.transformed3(v);
        return Offset(projected.x, projected.y);
      }).toList();

      _drawProfileMesh(canvas, screenPoints, comp.label);
    }

    // 4. Render Screw and Rivet Points at joint coordinates
    for (final screw in screws) {
      final screwPos = vmath.Vector3(screw.positionX, screw.positionY, screw.positionZ);
      final projected = viewMatrix.transformed3(screwPos);
      final screenOffset = Offset(projected.x, projected.y);

      _drawScrewMarker(canvas, screenOffset, screw.type);
    }
  }

  void _paintGrid(Canvas canvas, Size size, Offset center) {
    final gridPaint = Paint()
      ..color = const Color(0xFF1E293B)
      ..strokeWidth = 1.0;

    for (double i = -1000; i <= 1000; i += 100) {
      canvas.drawLine(
        Offset(center.dx + i * zoomScale, 0),
        Offset(center.dx + i * zoomScale, size.height),
        gridPaint,
      );
      canvas.drawLine(
        Offset(0, center.dy + i * zoomScale),
        Offset(size.width, center.dy + i * zoomScale),
        gridPaint,
      );
    }
  }

  void _drawProfileMesh(Canvas canvas, List<Offset> pts, String label) {
    if (pts.length < 8) return;

    final fillPaint = Paint()
      ..color = const Color(0xFF64748B).withOpacity(0.85)
      ..style = PaintingStyle.fill;

    final edgePaint = Paint()
      ..color = const Color(0xFF38BDF8)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    // Define 6 faces of the 3D cuboid
    final faces = [
      [0, 1, 2, 3], // Bottom
      [4, 5, 6, 7], // Top
      [0, 1, 5, 4], // Front
      [2, 3, 7, 6], // Back
      [0, 3, 7, 4], // Left
      [1, 2, 6, 5], // Right
    ];

    for (final face in faces) {
      final path = Path()
        ..moveTo(pts[face[0]].dx, pts[face[0]].dy)
        ..lineTo(pts[face[1]].dx, pts[face[1]].dy)
        ..lineTo(pts[face[2]].dx, pts[face[2]].dy)
        ..lineTo(pts[face[3]].dx, pts[face[3]].dy)
        ..close();

      canvas.drawPath(path, fillPaint);
      canvas.drawPath(path, edgePaint);
    }
  }

  void _drawScrewMarker(Canvas canvas, Offset pos, String type) {
    final isRivet = type.toLowerCase().contains('rivet');

    // Outer Target Ring
    final ringPaint = Paint()
      ..color = isRivet ? const Color(0xFF06B6D4) : const Color(0xFFF59E0B)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawCircle(pos, 6.0, ringPaint);

    // Fastener Cap Fill
    final capPaint = Paint()
      ..color = isRivet ? Colors.white70 : const Color(0xFFFBBF24)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(pos, 3.5, capPaint);

    // Cross-hair mark for screw drive
    final crossPaint = Paint()
      ..color = Colors.black
      ..strokeWidth = 1.0;
    canvas.drawLine(Offset(pos.dx - 2.5, pos.dy), Offset(pos.dx + 2.5, pos.dy), crossPaint);
    canvas.drawLine(Offset(pos.dx, pos.dy - 2.5), Offset(pos.dx, pos.dy + 2.5), crossPaint);
  }

  @override
  bool shouldRepaint(covariant CadAssemblyPainter oldDelegate) => true;
}
`,
  },
  {
    title: 'Stage 3: StockValidatorService with Kerf & Multi-Size Allocation',
    stage: 'STAGE 3',
    filename: 'lib/features/inventory/domain/services/stock_validator_service.dart',
    description: 'Pure Dart StockValidatorService implementing Greedy demands sorting, scrap-first allocation (2500mm scrap prioritized over standard 6000mm), and kerf deduction.',
    code: `// ============================================================================
// PROJECT YOGA - STAGE 3: STOCKVALIDATORSERVICE WITH KERF LOGIC
// File: lib/features/inventory/domain/services/stock_validator_service.dart
// ============================================================================

/// Model representing a single cut requirement requested from CAD components
class CuttingRequest {
  final String componentId;
  final String profileId;
  final String label;
  final double requestedLength; // mm

  CuttingRequest({
    required this.componentId,
    required this.profileId,
    required this.label,
    required this.requestedLength,
  });
}

/// Model representing an available stock plank in the warehouse
class AvailableStock {
  final String plankId;
  final String profileId;
  final double lengthAvailable; // mm
  final int currentQuantity;

  AvailableStock({
    required this.plankId,
    required this.profileId,
    required this.lengthAvailable,
    required this.currentQuantity,
  });

  bool get isScrap => lengthAvailable < 5800.0;
}

/// Tracks single allocated cut on a plank
class CutAllocation {
  final String componentId;
  final String label;
  final double cutLength;
  final double kerfThickness;

  CutAllocation({
    required this.componentId,
    required this.label,
    required this.cutLength,
    required this.kerfThickness,
  });
}

/// Mutable plank tracker during simulation
class PlankWorkpiece {
  final String plankId;
  final String profileId;
  final double initialLength;
  double remainingLength;
  final bool isScrap;
  final List<CutAllocation> cuts = [];

  PlankWorkpiece({
    required this.plankId,
    required this.profileId,
    required this.initialLength,
    required this.isScrap,
  }) : remainingLength = initialLength;
}

/// Result object returned by the StockValidatorService
class ValidationResult {
  final bool isSuccess;
  final String statusMessage;
  final List<String> allocationLog;
  final List<PlankWorkpiece> allocatedPlanks;
  final List<CuttingRequest> unallocatedRequests;
  final double totalScrapSavedMm;
  final int totalNewPlanksUsed;

  ValidationResult({
    required this.isSuccess,
    required this.statusMessage,
    required this.allocationLog,
    required this.allocatedPlanks,
    required this.unallocatedRequests,
    required this.totalScrapSavedMm,
    required this.totalNewPlanksUsed,
  });
}

/// Pure Dart isolated service for cut plan validation
class StockValidatorService {
  /// Evaluates and allocates cutting demands onto warehouse inventory.
  ///
  /// Requirements:
  /// 1. Sort demands from longest to shortest (Greedy Approach).
  /// 2. Consume shorter scrap planks (e.g. 2500mm) before cutting standard 6000mm planks.
  /// 3. For every cut, subtract (requestedLength + kerfThickness).
  /// 4. Output ValidationResult with isSuccess, statusMessage, and allocationLog.
  static ValidationResult validateAndAllocate({
    required List<CuttingRequest> requests,
    required List<AvailableStock> availableStock,
    double kerfThickness = 3.0,
  }) {
    final logs = <String>[];
    logs.add('[StockValidator] Initialized cut plan with blade kerf = \${kerfThickness.toStringAsFixed(1)}mm');

    if (requests.isEmpty) {
      return ValidationResult(
        isSuccess: true,
        statusMessage: 'No cutting demands required.',
        allocationLog: ['Empty demand list.'],
        allocatedPlanks: [],
        unallocatedRequests: [],
        totalScrapSavedMm: 0.0,
        totalNewPlanksUsed: 0,
      );
    }

    // Expand warehouse inventory into discrete workpieces
    final workpieces = <PlankWorkpiece>[];
    int plankIdCounter = 1;

    for (final stock in availableStock) {
      for (int i = 0; i < stock.currentQuantity; i++) {
        workpieces.add(PlankWorkpiece(
          plankId: '\${stock.isScrap ? "SCRAP" : "STD"}-\$plankIdCounter (\${stock.lengthAvailable.toStringAsFixed(0)}mm)',
          profileId: stock.profileId,
          initialLength: stock.lengthAvailable,
          isScrap: stock.isScrap,
        ));
        plankIdCounter++;
      }
    }

    logs.add('Total available warehouse planks: \${workpieces.length}');

    // STAGE 3 LOGIC 1: Sort demands from longest to shortest (Greedy Approach)
    final sortedRequests = List<CuttingRequest>.from(requests)
      ..sort((a, b) => b.requestedLength.compareTo(a.requestedLength));

    logs.add('Sorted \${sortedRequests.length} demands descending: '
        '\${sortedRequests.map((r) => "\${r.label}: \${r.requestedLength.toStringAsFixed(0)}mm").join(", ")}');

    final unallocated = <CuttingRequest>[];
    double scrapSavedMm = 0.0;

    for (final demand in sortedRequests) {
      final requiredWithKerf = demand.requestedLength + kerfThickness;
      logs.add('\\nProcessing "\${demand.label}" (Length: \${demand.requestedLength}mm + Kerf: \${kerfThickness}mm = \${requiredWithKerf}mm)...');

      // STAGE 3 LOGIC 2: Prioritize shorter scrap planks before brand new 6000mm standard planks.
      // Filter planks matching profileId and having sufficient remaining length.
      // Sort priority:
      // a. Scrap first (isScrap == true)
      // b. Shortest remaining length first (Best Fit to prevent wasting large segments)
      final candidates = workpieces.where((p) {
        return p.profileId == demand.profileId && p.remainingLength >= demand.requestedLength;
      }).toList()
        ..sort((a, b) {
          if (a.isScrap && !b.isScrap) return -1;
          if (!a.isScrap && b.isScrap) return 1;
          return a.remainingLength.compareTo(b.remainingLength);
        });

      if (candidates.isEmpty) {
        logs.add('❌ STOCK DEFICIT: Cannot allocate "\${demand.label}". No warehouse plank fits \${demand.requestedLength}mm.');
        unallocated.add(demand);
        continue;
      }

      // STAGE 3 LOGIC 3: Subtract (requestedLength + kerfThickness) from selected plank
      final selectedPlank = candidates.first;
      final beforeCutLength = selectedPlank.remainingLength;
      final effectiveDeduction = mathMin(requiredWithKerf, beforeCutLength);

      selectedPlank.remainingLength -= effectiveDeduction;
      selectedPlank.cuts.add(CutAllocation(
        componentId: demand.componentId,
        label: demand.label,
        cutLength: demand.requestedLength,
        kerfThickness: kerfThickness,
      ));

      if (selectedPlank.isScrap) {
        scrapSavedMm += demand.requestedLength;
      }

      logs.add('  ✓ Allocated to \${selectedPlank.plankId}. '
          'Remaining: \${beforeCutLength.toStringAsFixed(1)}mm -> \${selectedPlank.remainingLength.toStringAsFixed(1)}mm.');
    }

    final usedPlanks = workpieces.where((p) => p.cuts.isNotEmpty).toList();
    final newPlanksUsed = usedPlanks.where((p) => !p.isScrap).length;
    final isSuccess = unallocated.isEmpty;

    final summaryMessage = isSuccess
        ? 'SUCCESS: All \${requests.length} cuts allocated across \${usedPlanks.length} warehouse planks.'
        : 'INVENTORY DEFICIT: \${unallocated.length} cuts could not be fulfilled. Need restock.';

    logs.add('\\n=== ALLOCATION SUMMARY ===');
    logs.add(summaryMessage);
    logs.add('Scrap Reused: \${(scrapSavedMm / 1000).toStringAsFixed(2)} meters of waste saved.');
    logs.add('New 6000mm Planks Cut: \$newPlanksUsed');

    return ValidationResult(
      isSuccess: isSuccess,
      statusMessage: summaryMessage,
      allocationLog: logs,
      allocatedPlanks: usedPlanks,
      unallocatedRequests: unallocated,
      totalScrapSavedMm: scrapSavedMm,
      totalNewPlanksUsed: newPlanksUsed,
    );
  }

  static double mathMin(double a, double b) => a < b ? a : b;
}
`,
  },
  {
    title: 'Stage 4: BOM Calculator Engine',
    stage: 'STAGE 4',
    filename: 'lib/features/bom/domain/services/bom_calculator_engine.dart',
    description: 'Calculates physical volume and weight of extruded profiles (Volume = Perimeter * Thickness * Length) using 6063 aluminum alloy density (2.70 g/cm³) and raw material costs.',
    code: `// ============================================================================
// PROJECT YOGA - STAGE 4: BOM CALCULATOR ENGINE
// File: lib/features/bom/domain/services/bom_calculator_engine.dart
// ============================================================================

import '../../cad/data/models/hive_models.dart';

class ComponentBomDetail {
  final String componentId;
  final String label;
  final String profileCode;
  final double lengthMm;
  final double outerPerimeterMm;
  final double wallThicknessMm;
  final double volumeMm3;
  final double weightKg;
  final double unitPrice;
  final double materialCost;

  ComponentBomDetail({
    required this.componentId,
    required this.label,
    required this.profileCode,
    required this.lengthMm,
    required this.outerPerimeterMm,
    required this.wallThicknessMm,
    required this.volumeMm3,
    required this.weightKg,
    required this.unitPrice,
    required this.materialCost,
  });
}

class FastenerBomDetail {
  final String type;
  final int count;
  final double unitPrice;
  final double subtotal;

  FastenerBomDetail({
    required this.type,
    required this.count,
    required this.unitPrice,
    required this.subtotal,
  });
}

class BomSummary {
  final List<ComponentBomDetail> componentDetails;
  final List<FastenerBomDetail> fastenerDetails;
  final double totalLengthMm;
  final double totalVolumeMm3;
  final double totalWeightKg;
  final double totalProfileCost;
  final double totalFastenerCost;
  final double grandTotalCost;

  BomSummary({
    required this.componentDetails,
    required this.fastenerDetails,
    required this.totalLengthMm,
    required this.totalVolumeMm3,
    required this.totalWeightKg,
    required this.totalProfileCost,
    required this.totalFastenerCost,
    required this.grandTotalCost,
  });
}

class BomCalculatorEngine {
  /// Architectural Aluminum Alloy 6063-T5 Density:
  /// 2.70 g/cm³ = 0.00000270 kg/mm³ (2.70e-6 kg/mm³)
  static const double aluminumDensityKgMm3 = 0.00000270;

  /// Default Fastener standard local prices (IDR per piece)
  static const Map<String, double> fastenerUnitPriceMap = {
    'Sekrup 3 Inch Countersunk': 850.0,
    'Sekrup 3 Inch': 850.0,
    'Rivet 4.0mm Blind Rivet': 300.0,
    'Rivet 4.0mm': 300.0,
    'Self-Drilling Screw': 950.0,
  };

  /// STAGE 4: Core mathematical calculation
  /// Formula:
  /// Volume = Perimeter * Thickness * Length
  /// Weight = Volume * Density
  /// Cost = Length * unitPrice (where unitPrice is per mm)
  static BomSummary calculate({
    required List<AssembledComponent> components,
    required Map<String, MaterialProfile> profileCatalog,
    required List<ScrewPoint> screws,
  }) {
    final componentDetails = <ComponentBomDetail>[];
    double totalLength = 0.0;
    double totalVolume = 0.0;
    double totalWeight = 0.0;
    double totalProfileCost = 0.0;

    for (final comp in components) {
      final profile = profileCatalog[comp.profileId] ??
          MaterialProfile(
            id: comp.profileId,
            categoryId: 'cat-1',
            profileCode: '0504 Shopfront 3 Inch',
            wallThickness: 1.2,
            unitPrice: 38.5,
            outerPerimeter: 241.4,
            width: 44.5,
            depth: 76.2,
          );

      final length = comp.customLength;
      final perimeter = profile.outerPerimeter;
      final thickness = profile.wallThickness;

      // STAGE 4 MATHEMATICAL FORMULA:
      // Volume = Perimeter * Thickness * Length (all in mm -> output in mm³)
      final volumeMm3 = perimeter * thickness * length;

      // Weight (kg) = Volume (mm³) * Density (kg/mm³)
      final weightKg = volumeMm3 * aluminumDensityKgMm3;

      // Raw Material Cost
      final cost = length * profile.unitPrice;

      totalLength += length;
      totalVolume += volumeMm3;
      totalWeight += weightKg;
      totalProfileCost += cost;

      componentDetails.add(ComponentBomDetail(
        componentId: comp.id,
        label: comp.label,
        profileCode: profile.profileCode,
        lengthMm: length,
        outerPerimeterMm: perimeter,
        wallThicknessMm: thickness,
        volumeMm3: volumeMm3,
        weightKg: weightKg,
        unitPrice: profile.unitPrice,
        materialCost: cost,
      ));
    }

    // Fasteners breakdown
    final fastenerCounts = <String, int>{};
    for (final screw in screws) {
      fastenerCounts[screw.type] = (fastenerCounts[screw.type] ?? 0) + 1;
    }

    final fastenerDetails = <FastenerBomDetail>[];
    double totalFastenerCost = 0.0;

    fastenerCounts.forEach((type, count) {
      final price = fastenerUnitPriceMap[type] ?? 750.0;
      final subtotal = count * price;
      totalFastenerCost += subtotal;

      fastenerDetails.add(FastenerBomDetail(
        type: type,
        count: count,
        unitPrice: price,
        subtotal: subtotal,
      ));
    });

    final grandTotalCost = totalProfileCost + totalFastenerCost;

    return BomSummary(
      componentDetails: componentDetails,
      fastenerDetails: fastenerDetails,
      totalLengthMm: totalLength,
      totalVolumeMm3: totalVolume,
      totalWeightKg: totalWeight,
      totalProfileCost: totalProfileCost,
      totalFastenerCost: totalFastenerCost,
      grandTotalCost: grandTotalCost,
    );
  }
}
`,
  },
  {
    title: 'Stage 5: Directory Layout for a Solo Developer',
    stage: 'STAGE 5',
    filename: 'project_yoga/lib/directory_layout.dart',
    description: 'Clean, simple, highly manageable Feature-First folder structure tailored for a solo developer to maintain completely offline without confusion.',
    code: `// ============================================================================
// PROJECT YOGA - STAGE 5: DIRECTORY LAYOUT FOR A SOLO DEVELOPER
// File: project_yoga/lib/ (Feature-First Architecture)
// ============================================================================

/*
project_yoga/
├── android/
│   └── app/build.gradle               // Offline APK build settings
├── pubspec.yaml                       // hive, hive_flutter, vector_math
└── lib/
    ├── main.dart                      // Hive.initFlutter(), register adapters, runApp
    │
    ├── core/                          // Shared foundational utilities
    │   ├── constants/
    │   │   ├── app_colors.dart        // Dark CAD theme palettes
    │   │   └── material_defaults.dart // 6063 Aluminum density, standard 6000mm length
    │   ├── database/
    │   │   └── hive_registrar.dart    // Register all TypeAdapters in one clean file
    │   └── utils/
    │       └── unit_formatter.dart    // mm to meter, IDR currency formatter
    │
    ├── features/                      // Self-contained features for solo maintenance
    │   │
    │   ├── cad/                       // 2D-to-3D Extrusion & Structural Assembly
    │   │   ├── data/
    │   │   │   └── models/
    │   │   │       ├── hive_models.dart        // Hive entities (Components, Screws, Project)
    │   │   │       └── hive_models.g.dart      // Generated Hive TypeAdapters
    │   │   ├── domain/
    │   │   │   └── services/
    │   │   │       └── assembly_engine.dart    // Matrix4 transform & CustomPainter
    │   │   └── presentation/
    │   │       ├── controllers/
    │   │       │   └── cad_canvas_controller.dart // StateNotifier or ValueNotifier
    │   │       └── widgets/
    │   │           ├── cad_canvas_widget.dart     // Interactive touch orbit/pan gesture canvas
    │   │           └── component_inspector.dart   // Sliders for length, position, rotation
    │   │
    │   ├── inventory/                 // Stock Validator & Kerf Blade Allocation
    │   │   ├── domain/
    │   │   │   └── services/
    │   │   │       └── stock_validator_service.dart // Pure Dart greedy scrap-first cutter
    │   │   └── presentation/
    │   │       ├── pages/
    │   │       │   └── stock_validator_page.dart    // Kerf slider & visual cut bars
    │   │       └── widgets/
    │   │           └── plank_cut_diagram.dart       // Colored bar showing cuts & scrap
    │   │
    │   └── bom/                       // Bill of Materials & Manufacturing Costing
    │       ├── domain/
    │       │   └── services/
    │       │       └── bom_calculator_engine.dart   // Volume, weight, and pricing math
    │       └── presentation/
    │           └── pages/
    │               └── bom_report_page.dart         // Cost table & CSV exporter
    │
    └── app_shell.dart                 // BottomNavigationBar switching CAD, Stock, & BOM
*/

// --- Sample main.dart Initialization ---
/*
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'features/cad/data/models/hive_models.dart';
import 'app_shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Hive for offline Android device storage
  await Hive.initFlutter();
  
  // Register Stage 1 Adapters
  Hive.registerAdapter(MaterialCategoryAdapter());
  Hive.registerAdapter(MaterialProfileAdapter());
  Hive.registerAdapter(StockInventoryAdapter());
  Hive.registerAdapter(AssembledComponentAdapter());
  Hive.registerAdapter(ScrewPointAdapter());
  Hive.registerAdapter(ProjectItemAdapter());
  
  // Open core offline boxes
  await Hive.openBox<MaterialProfile>('profiles_box');
  await Hive.openBox<StockInventory>('inventory_box');
  await Hive.openBox<ProjectItem>('projects_box');
  
  runApp(const ProjectYogaApp());
}
*/
`,
  },
  {
    title: 'UI Widget 1: YogaBreadcrumbs Navigation',
    stage: 'UI BREADCRUMBS',
    filename: 'lib/features/cad/presentation/widgets/yoga_breadcrumbs.dart',
    description: 'Linear workflow navigation widget using pure Flutter Row and AnimatedContainer. Steps: 1. Pilih Kategori -> 2. Spesifikasi Profil -> 3. Input Stok Gudang -> 4. Summary Produksi.',
    code: `// ============================================================================
// PROJECT YOGA - UI WIDGET 1: YOGABREADCRUMBS
// File: lib/features/cad/presentation/widgets/yoga_breadcrumbs.dart
// ============================================================================

import 'package:flutter/material.dart';

class YogaBreadcrumbs extends StatelessWidget {
  final int currentStep; // 1 to 4
  final ValueChanged<int>? onStepTapped;

  const YogaBreadcrumbs({
    super.key,
    required this.currentStep,
    this.onStepTapped,
  });

  static const List<String> steps = [
    'Pilih Kategori',
    'Spesifikasi Profil',
    'Input Stok Gudang',
    'Summary Produksi',
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        border: Border(
          bottom: BorderSide(color: Colors.white.withOpacity(0.08), width: 1.0),
        ),
      ),
      child: Row(
        children: List.generate(steps.length * 2 - 1, (index) {
          if (index.isOdd) {
            // Divider Chevron Arrow
            final stepIndex = (index ~/ 2) + 1;
            final isPassed = stepIndex < currentStep;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4.0),
              child: Icon(
                Icons.chevron_right,
                size: 18.0,
                color: isPassed ? const Color(0xFF0284C7) : const Color(0xFF475569),
              ),
            );
          }

          final stepNum = (index ~/ 2) + 1;
          final isCurrent = stepNum == currentStep;
          final isCompleted = stepNum < currentStep;
          final stepTitle = steps[stepNum - 1];

          return Expanded(
            child: InkWell(
              onTap: onStepTapped != null ? () => onStepTapped!(stepNum) : null,
              borderRadius: BorderRadius.circular(8.0),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 6.0, horizontal: 8.0),
                decoration: BoxDecoration(
                  color: isCurrent
                      ? const Color(0xFF0284C7).withOpacity(0.18)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(8.0),
                  border: Border.all(
                    color: isCurrent
                        ? const Color(0xFF0284C7)
                        : (isCompleted ? const Color(0xFF10B981) : Colors.transparent),
                    width: isCurrent ? 1.5 : 1.0,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 22.0,
                      height: 22.0,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isCurrent
                            ? const Color(0xFF0284C7)
                            : (isCompleted ? const Color(0xFF10B981) : const Color(0xFF334155)),
                      ),
                      alignment: Alignment.center,
                      child: isCompleted
                          ? const Icon(Icons.check, size: 14.0, color: Colors.white)
                          : Text(
                              '$stepNum',
                              style: const TextStyle(
                                fontSize: 11.0,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                    ),
                    const SizedBox(width: 6.0),
                    Flexible(
                      child: Text(
                        stepTitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
                          color: isCurrent
                              ? const Color(0xFF38BDF8)
                              : (isCompleted ? const Color(0xFFA7F3D0) : const Color(0xFF94A3B8)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}
`,
  },
  {
    title: 'UI Page 2: MaterialProfileInputPage',
    stage: 'UI PROFILE FORM',
    filename: 'lib/features/cad/presentation/pages/material_profile_input_page.dart',
    description: 'Complete form for cross-section detail input: Category dropdown, profile code, wall thickness, width, height, and unit price with local Hive persistence.',
    code: `// ============================================================================
// PROJECT YOGA - UI PAGE 2: MATERIALPROFILEINPUTPAGE
// File: lib/features/cad/presentation/pages/material_profile_input_page.dart
// ============================================================================

import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import '../../data/models/hive_models.dart';
import '../widgets/yoga_breadcrumbs.dart';

class MaterialProfileInputPage extends StatefulWidget {
  const MaterialProfileInputPage({super.key});

  @override
  State<MaterialProfileInputPage> createState() => _MaterialProfileInputPageState();
}

class _MaterialProfileInputPageState extends State<MaterialProfileInputPage> {
  final _formKey = GlobalKey<FormState>();

  final _codeController = TextEditingController();
  final _thicknessController = TextEditingController();
  final _widthController = TextEditingController();
  final _heightController = TextEditingController();
  final _priceController = TextEditingController();

  String? _selectedCategoryId;
  bool _priceIsPerMeter = true;

  late Box<MaterialCategory> _categoryBox;
  late Box<MaterialProfile> _profileBox;

  @override
  void initState() {
    super.initState();
    _categoryBox = Hive.box<MaterialCategory>('categories_box');
    _profileBox = Hive.box<MaterialProfile>('profiles_box');

    // Default selection if categories exist
    if (_categoryBox.isNotEmpty) {
      _selectedCategoryId = _categoryBox.values.first.id;
    }
  }

  @override
  void dispose() {
    _codeController.dispose();
    _thicknessController.dispose();
    _widthController.dispose();
    _heightController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  void _saveToLocalDatabase() {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih kategori material terlebih dahulu!')),
      );
      return;
    }

    final thickness = double.parse(_thicknessController.text.trim());
    final width = double.parse(_widthController.text.trim());
    final height = double.parse(_heightController.text.trim());
    final rawPrice = double.parse(_priceController.text.trim());

    // Normalize unit price to IDR per millimeter
    final unitPrice = _priceIsPerMeter ? (rawPrice / 1000.0) : rawPrice;
    final outerPerimeter = 2.0 * (width + height);

    final newProfile = MaterialProfile(
      id: 'prof_\${DateTime.now().millisecondsSinceEpoch}',
      categoryId: _selectedCategoryId!,
      profileCode: _codeController.text.trim(),
      wallThickness: thickness,
      unitPrice: unitPrice,
      outerPerimeter: outerPerimeter,
      outerWidth: width,
      outerDepth: height,
    );

    // Save to local offline Hive box
    _profileBox.put(newProfile.id, newProfile);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF10B981),
        content: Text('Berhasil simpan profil "\${newProfile.profileCode}" ke database lokal!'),
      ),
    );

    // Reset fields
    _codeController.clear();
    _thicknessController.clear();
    _widthController.clear();
    _heightController.clear();
    _priceController.clear();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final categories = _categoryBox.values.toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('Input Spesifikasi Profil Aluminium'),
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
      ),
      body: Column(
        children: [
          // 1. Linear Navigation Breadcrumbs
          const YogaBreadcrumbs(currentStep: 2),

          // 2. Form Body
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Card(
                      color: const Color(0xFF1E293B),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12.0),
                        side: BorderSide(color: Colors.white.withOpacity(0.08)),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Data Relasi & Identitas Profil',
                              style: TextStyle(
                                fontSize: 14.0,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF38BDF8),
                              ),
                            ),
                            const SizedBox(height: 16.0),

                            // Dropdown Kategori
                            DropdownButtonFormField<String>(
                              value: _selectedCategoryId,
                              dropdownColor: const Color(0xFF1E293B),
                              decoration: const InputDecoration(
                                labelText: 'Pilih Kategori Material',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.category),
                              ),
                              items: categories.map((cat) {
                                return DropdownMenuItem<String>(
                                  value: cat.id,
                                  child: Text(cat.categoryName),
                                );
                              }).toList(),
                              onChanged: (val) => setState(() => _selectedCategoryId = val),
                              validator: (val) => val == null ? 'Kategori wajib dipilih' : null,
                            ),
                            const SizedBox(height: 16.0),

                            // Kolom Teks Kode Profil
                            TextFormField(
                              controller: _codeController,
                              style: const TextStyle(color: Colors.white),
                              decoration: const InputDecoration(
                                labelText: 'Kode Profil Aluminium',
                                hintText: 'Contoh: 0504 Kusen Open Back 3 Inch',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.qr_code),
                              ),
                              validator: (val) =>
                                  (val == null || val.trim().isEmpty) ? 'Kode profil tidak boleh kosong' : null,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16.0),

                    // Card Dimensi Cross-Section (mm)
                    Card(
                      color: const Color(0xFF1E293B),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12.0),
                        side: BorderSide(color: Colors.white.withOpacity(0.08)),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Dimensi Fisik Cross-Section (Milimeter)',
                              style: TextStyle(
                                fontSize: 14.0,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF38BDF8),
                              ),
                            ),
                            const SizedBox(height: 16.0),

                            // Ketebalan Dinding
                            TextFormField(
                              controller: _thicknessController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: const InputDecoration(
                                labelText: 'Ketebalan Dinding Profil (mm)',
                                hintText: 'Contoh: 1.20',
                                border: OutlineInputBorder(),
                                suffixText: 'mm',
                                prefixIcon: Icon(Icons.line_weight),
                              ),
                              validator: (val) {
                                if (val == null || double.tryParse(val.trim()) == null) {
                                  return 'Masukkan angka desimal yang valid';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 14.0),

                            Row(
                              children: [
                                // Lebar (mm)
                                Expanded(
                                  child: TextFormField(
                                    controller: _widthController,
                                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                    decoration: const InputDecoration(
                                      labelText: 'Lebar Luar (Width)',
                                      hintText: '44.5',
                                      border: OutlineInputBorder(),
                                      suffixText: 'mm',
                                    ),
                                    validator: (val) =>
                                        (val == null || double.tryParse(val.trim()) == null) ? 'Harus angka' : null,
                                  ),
                                ),
                                const SizedBox(width: 12.0),
                                // Tinggi/Kedalaman (mm)
                                Expanded(
                                  child: TextFormField(
                                    controller: _heightController,
                                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                    decoration: const InputDecoration(
                                      labelText: 'Tinggi (Height)',
                                      hintText: '76.2',
                                      border: OutlineInputBorder(),
                                      suffixText: 'mm',
                                    ),
                                    validator: (val) =>
                                        (val == null || double.tryParse(val.trim()) == null) ? 'Harus angka' : null,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16.0),

                    // Card Harga Satuan
                    Card(
                      color: const Color(0xFF1E293B),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12.0),
                        side: BorderSide(color: Colors.white.withOpacity(0.08)),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.between,
                              children: [
                                const Text(
                                  'Harga Satuan Bahan Baku',
                                  style: TextStyle(
                                    fontSize: 14.0,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF38BDF8),
                                  ),
                                ),
                                Row(
                                  children: [
                                    ChoiceChip(
                                      label: const Text('Per Meter (m)'),
                                      selected: _priceIsPerMeter,
                                      onSelected: (val) => setState(() => _priceIsPerMeter = true),
                                    ),
                                    const SizedBox(width: 6.0),
                                    ChoiceChip(
                                      label: const Text('Per mm'),
                                      selected: !_priceIsPerMeter,
                                      onSelected: (val) => setState(() => _priceIsPerMeter = false),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 14.0),

                            TextFormField(
                              controller: _priceController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: InputDecoration(
                                labelText: _priceIsPerMeter ? 'Harga per Meter (IDR)' : 'Harga per mm (IDR)',
                                hintText: _priceIsPerMeter ? '38500' : '38.5',
                                border: const OutlineInputBorder(),
                                prefixText: 'IDR ',
                                prefixIcon: const Icon(Icons.attach_money),
                              ),
                              validator: (val) =>
                                  (val == null || double.tryParse(val.trim()) == null) ? 'Masukkan harga valid' : null,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24.0),

                    // Tombol Simpan ke Database Lokal
                    SizedBox(
                      height: 52.0,
                      child: ElevatedButton.icon(
                        onPressed: _saveToLocalDatabase,
                        icon: const Icon(Icons.save),
                        label: const Text(
                          'Simpan ke Database Lokal',
                          style: TextStyle(fontSize: 15.0, fontWeight: FontWeight.bold),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0284C7),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10.0),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
`,
  },
  {
    title: 'UI Page 3: PreCuttingSummaryDashboard',
    stage: 'UI PRE-CUTTING DASHBOARD',
    filename: 'lib/features/inventory/presentation/pages/pre_cutting_summary_dashboard.dart',
    description: 'Pre-cutting production review dashboard: lists assembled project components with dimensions, exact BOM cost calculation (no POS/cashier features), and stock validation box with green/red status indicators.',
    code: `// ============================================================================
// PROJECT YOGA - UI PAGE 3: PRECUTTINGSUMMARYDASHBOARD
// File: lib/features/inventory/presentation/pages/pre_cutting_summary_dashboard.dart
// ============================================================================

import 'package:flutter/material.dart';
import '../../../cad/data/models/hive_models.dart';
import '../../../bom/domain/services/bom_calculator_engine.dart';
import '../../domain/services/stock_validator_service.dart';
import '../../../cad/presentation/widgets/yoga_breadcrumbs.dart';

class PreCuttingSummaryDashboard extends StatelessWidget {
  final ProjectItem project;
  final Map<String, MaterialProfile> profileCatalog;
  final List<AvailableStock> warehouseStock;
  final double kerfThickness;

  const PreCuttingSummaryDashboard({
    super.key,
    required this.project,
    required this.profileCatalog,
    required this.warehouseStock,
    this.kerfThickness = 3.0,
  });

  @override
  Widget build(BuildContext context) {
    // 1. Calculate real manufacturing BOM
    final bom = BomCalculatorEngine.calculate(
      components: project.components,
      profileCatalog: profileCatalog,
      screws: project.screws,
    );

    // 2. Prepare cutting demands for stock validator
    final cuttingRequests = project.components.map((c) {
      return CuttingRequest(
        componentId: c.id,
        profileId: c.profileId,
        label: c.label,
        requestedLength: c.customLength,
      );
    }).toList();

    // 3. Execute StockValidatorService
    final validation = StockValidatorService.validateAndAllocate(
      requests: cuttingRequests,
      availableStock: warehouseStock,
      kerfThickness: kerfThickness,
    );

    // Group components by profile and length to show "Nx items"
    final groupedComponents = <String, _ComponentDemandGroup>{};
    for (final comp in project.components) {
      final key = '\${comp.profileId}_\${comp.customLength}_\${comp.label}';
      if (groupedComponents.containsKey(key)) {
        groupedComponents[key]!.count += 1;
      } else {
        groupedComponents[key] = _ComponentDemandGroup(
          label: comp.label,
          profileCode: profileCatalog[comp.profileId]?.profileCode ?? 'Aluminium',
          lengthMm: comp.customLength,
          count: 1,
        );
      }
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('Review Produksi: \${project.projectName}'),
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Breadcrumbs
          const YogaBreadcrumbs(currentStep: 4),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                // SECTION 1: Status Banner Kesiapan Mesin Potong
                _buildStatusBanner(validation),
                const SizedBox(height: 16.0),

                // SECTION 2: Daftar AssembledComponent yang Dipakai
                _buildComponentsCard(groupedComponents.values.toList(), project.components.length),
                const SizedBox(height: 16.0),

                // SECTION 3: Rincian Totalan Harga Bahan Terpakai (BOMCalculator)
                _buildBomCostCard(bom),
                const SizedBox(height: 16.0),

                // SECTION 4: Kotak Log Validasi Stok (StockValidatorService)
                _buildStockValidationCard(validation),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBanner(ValidationResult validation) {
    final isSuccess = validation.isSuccess;
    final color = isSuccess ? const Color(0xFF10B981) : const Color(0xFFEF4444);

    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12.0),
        border: Border.all(color: color, width: 1.5),
      ),
      child: Row(
        children: [
          Icon(
            isSuccess ? Icons.check_circle : Icons.error,
            color: color,
            size: 32.0,
          ),
          const SizedBox(width: 14.0),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isSuccess ? 'STOK GUDANG AMAN UNTUK DIPOTONG' : 'DEFISIT STOK GUDANG!',
                  style: TextStyle(
                    fontSize: 14.0,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                const SizedBox(height: 4.0),
                Text(
                  validation.statusMessage,
                  style: const TextStyle(fontSize: 12.0, color: Color(0xFFCBD5E1)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComponentsCard(List<_ComponentDemandGroup> groups, int totalPieces) {
    return Card(
      color: const Color(0xFF1E293B),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12.0),
        side: BorderSide(color: Colors.white.withOpacity(0.08)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                const Text(
                  '1. Komponen Assembled Digunakan',
                  style: TextStyle(fontSize: 14.0, fontWeight: FontWeight.bold, color: Color(0xFF38BDF8)),
                ),
                Text(
                  'Total: \$totalPieces Item',
                  style: const TextStyle(fontSize: 12.0, color: Color(0xFF94A3B8), fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(color: Color(0xFF334155), height: 24.0),

            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: groups.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8.0),
              itemBuilder: (context, index) {
                final item = groups[index];
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 10.0),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(8.0),
                    border: Border.all(color: Colors.white.withOpacity(0.05)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0284C7).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(6.0),
                        ),
                        child: Text(
                          '\${item.count}x',
                          style: const TextStyle(
                            color: Color(0xFF38BDF8),
                            fontWeight: FontWeight.bold,
                            fontSize: 12.0,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12.0),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.label,
                              style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white),
                            ),
                            Text(
                              item.profileCode,
                              style: const TextStyle(fontSize: 11.0, color: Color(0xFF94A3B8)),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '\${item.lengthMm.toStringAsFixed(0)} mm',
                        style: const TextStyle(
                          fontSize: 13.0,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF38BDF8),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBomCostCard(BomSummary bom) {
    return Card(
      color: const Color(0xFF1E293B),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12.0),
        side: BorderSide(color: Colors.white.withOpacity(0.08)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '2. Rincian Biaya Riil Bahan (BOM Calculator)',
              style: TextStyle(fontSize: 14.0, fontWeight: FontWeight.bold, color: Color(0xFF38BDF8)),
            ),
            const Divider(color: Color(0xFF334155), height: 24.0),

            _buildCostRow('Total Panjang Bahan Terpakai', '\${(bom.totalLengthMm / 1000).toStringAsFixed(2)} meter'),
            _buildCostRow('Total Berat Bersih Aluminium', '\${bom.totalWeightKg.toStringAsFixed(2)} kg'),
            _buildCostRow('Biaya Raw Profil Aluminium', 'IDR \${bom.totalProfileCost.toStringAsFixed(0)}'),
            _buildCostRow('Biaya Fastener & Aksesoris', 'IDR \${bom.totalFastenerCost.toStringAsFixed(0)}'),
            const SizedBox(height: 8.0),
            Container(
              padding: const EdgeInsets.all(12.0),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(8.0),
                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  const Text(
                    'Grand Total Biaya Material:',
                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  Text(
                    'IDR \${bom.grandTotalCost.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontSize: 16.0,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF10B981),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCostRow(String title, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.between,
        children: [
          Text(title, style: const TextStyle(fontSize: 12.5, color: Color(0xFF94A3B8))),
          Text(value, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: Colors.white)),
        ],
      ),
    );
  }

  Widget _buildStockValidationCard(ValidationResult validation) {
    return Card(
      color: const Color(0xFF1E293B),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12.0),
        side: BorderSide(
          color: validation.isSuccess ? Colors.white.withOpacity(0.08) : const Color(0xFFEF4444).withOpacity(0.5),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                const Text(
                  '3. Log Validasi Balok Gudang (StockValidator)',
                  style: TextStyle(fontSize: 14.0, fontWeight: FontWeight.bold, color: Color(0xFF38BDF8)),
                ),
                Text(
                  'Kerf: \${kerfThickness.toStringAsFixed(1)}mm',
                  style: const TextStyle(fontSize: 11.5, color: Color(0xFFF59E0B), fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(color: Color(0xFF334155), height: 24.0),

            const Text(
              'Daftar Balok Terpotong di Gudang:',
              style: TextStyle(fontSize: 12.0, fontWeight: FontWeight.w600, color: Color(0xFFCBD5E1)),
            ),
            const SizedBox(height: 8.0),

            if (validation.allocatedPlanks.isEmpty)
              const Text('Tidak ada balok yang teralokasikan.', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12.0))
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: validation.allocatedPlanks.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8.0),
                itemBuilder: (context, index) {
                  final plank = validation.allocatedPlanks[index];
                  final isOk = plank.remainingLength >= 0;
                  final statusColor = isOk ? const Color(0xFF10B981) : const Color(0xFFEF4444);

                  return Container(
                    padding: const EdgeInsets.all(10.0),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(8.0),
                      border: Border.all(color: statusColor.withOpacity(0.4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 8.0,
                                  height: 8.0,
                                  decoration: BoxDecoration(shape: BoxShape.circle, color: statusColor),
                                ),
                                const SizedBox(width: 8.0),
                                Text(
                                  plank.plankId,
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 12.5),
                                ),
                              ],
                            ),
                            Text(
                              plank.isScrap ? 'SCRAP' : 'STD 6000mm',
                              style: TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.bold,
                                color: plank.isScrap ? const Color(0xFFF59E0B) : const Color(0xFF38BDF8),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6.0),
                        ...plank.cuts.map((c) => Padding(
                              padding: const EdgeInsets.only(left: 16.0, top: 2.0),
                              child: Text(
                                '• \${c.label}: \${c.cutLength.toStringAsFixed(0)}mm (+ \${c.kerfThickness}mm kerf)',
                                style: const TextStyle(fontSize: 11.5, color: Color(0xFF94A3B8)),
                              ),
                            )),
                        const SizedBox(height: 4.0),
                        Padding(
                          padding: const EdgeInsets.only(left: 16.0),
                          child: Text(
                            'Sisa balok: \${plank.remainingLength.toStringAsFixed(1)} mm',
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.bold,
                              color: statusColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),

            // Defisit alert jika ada
            if (validation.unallocatedRequests.isNotEmpty) ...[
              const SizedBox(height: 12.0),
              Container(
                padding: const EdgeInsets.all(10.0),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8.0),
                  border: Border.all(color: const Color(0xFFEF4444)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '❌ Potongan yang Belum Memiliki Stok:',
                      style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 12.0),
                    ),
                    ...validation.unallocatedRequests.map((u) => Text(
                          '• \${u.label} (\${u.requestedLength.toStringAsFixed(0)} mm)',
                          style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 11.5),
                        )),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ComponentDemandGroup {
  final String label;
  final String profileCode;
  final double lengthMm;
  int count;

  _ComponentDemandGroup({
    required this.label,
    required this.profileCode,
    required this.lengthMm,
    required this.count,
  });
}
`,
  },
  {
    title: 'Stage 5: 2D Sketch & 3D Extrusion Engine',
    stage: 'STAGE 5 (3D CAD ENGINE)',
    filename: 'lib/features/cad_engine/cad_extrusion_engine.dart',
    description: 'Isolated Flutter CAD engine: ProfileGeometry (2D contour & perimeter/area math), Yoga3DExtruder (3D mesh generator & exact volume calculation), Matrix transformations, and Yoga3DViewport (interactive touch CustomPainter with shaded faces and screw markers).',
    code: `// ============================================================================
// PROJECT YOGA - STAGE 5: 2D SKETCH & 3D EXTRUSION ENGINE
// File: lib/features/cad_engine/cad_extrusion_engine.dart
// 100% Pure Flutter/Dart - Built-in Widgets & CustomPainter Only
// ============================================================================

import 'dart:math' as math;
import 'package:flutter/material.dart';

// ============================================================================
// 1. CLASS 'ProfileGeometry' (2D Contour Vector)
// ============================================================================

/// Represents a 2D cross-section contour vector of an extruded aluminum profile.
class ProfileGeometry {
  /// Outer boundary polygon vertices in counter-clockwise order (in millimeters)
  final List<Offset> outerContour;

  /// Optional inner cutout hole vertices in clockwise order (for hollow/semi-hollow profiles)
  final List<Offset>? innerContour;

  const ProfileGeometry({
    required this.outerContour,
    this.innerContour,
  });

  /// Factory: Generates exact cross-section for standard Open-Back Shopfront (e.g. 0504 3-Inch)
  /// Open-back profile is a C-channel with returns/flanges and uniform wall thickness.
  factory ProfileGeometry.openBackShopfront({
    double width = 44.5, // 1.75 inch outer flange width (mm)
    double depth = 76.2, // 3.00 inch outer depth (mm)
    double wallThickness = 1.2, // Uniform extrusion wall thickness (mm)
    double returnFlange = 12.0, // Open-back return lip (mm)
  }) {
    final t = wallThickness;
    final r = returnFlange;

    // Continuous closed 2D polygon tracing outer and inner faces of the open channel
    final contour = <Offset>[
      const Offset(0, 0), // 0: Bottom-left outer
      Offset(width, 0), // 1: Bottom-right outer
      Offset(width, r), // 2: Bottom return lip outer
      Offset(width - t, r), // 3: Bottom return lip inner
      Offset(width - t, t), // 4: Bottom inner wall
      Offset(t, t), // 5: Web inner-left
      Offset(t, depth - t), // 6: Top inner-left
      Offset(width - t, depth - t), // 7: Top inner wall
      Offset(width - t, depth - r), // 8: Top return lip inner
      Offset(width, depth - r), // 9: Top return lip outer
      Offset(width, depth), // 10: Top-right outer
      Offset(0, depth), // 11: Top-left outer
    ];

    return ProfileGeometry(outerContour: contour);
  }

  /// Factory: Generates standard rectangular hollow tube profile (e.g. Hollow 40x40 mm)
  factory ProfileGeometry.hollowRectangular({
    double width = 40.0,
    double depth = 40.0,
    double wallThickness = 1.3,
  }) {
    final t = wallThickness;

    final outer = <Offset>[
      const Offset(0, 0),
      Offset(width, 0),
      Offset(width, depth),
      Offset(0, depth),
    ];

    final inner = <Offset>[
      Offset(t, t),
      Offset(width - t, t),
      Offset(width - t, depth - t),
      Offset(t, depth - t),
    ];

    return ProfileGeometry(outerContour: outer, innerContour: inner);
  }

  /// Factory: Generates solid rectangular bar profile
  factory ProfileGeometry.solidRectangular({
    required double width,
    required double depth,
  }) {
    return ProfileGeometry(outerContour: [
      const Offset(0, 0),
      Offset(width, 0),
      Offset(width, depth),
      Offset(0, depth),
    ]);
  }

  /// Computes the total perimeter in millimeters (sum of all outer and inner edges).
  /// This value is fed directly into the BOM Calculator engine.
  double calculatePerimeter() {
    double total = _polygonPerimeter(outerContour);
    if (innerContour != null && innerContour!.isNotEmpty) {
      total += _polygonPerimeter(innerContour!);
    }
    return total;
  }

  /// Calculates the exact net cross-sectional surface area in mm² using the Shoelace formula.
  double calculateCrossSectionArea() {
    double area = _shoelaceArea(outerContour);
    if (innerContour != null && innerContour!.isNotEmpty) {
      area -= _shoelaceArea(innerContour!);
    }
    return area.abs();
  }

  static double _polygonPerimeter(List<Offset> points) {
    if (points.length < 2) return 0.0;
    double sum = 0.0;
    for (int i = 0; i < points.length; i++) {
      final p1 = points[i];
      final p2 = points[(i + 1) % points.length];
      sum += (p2 - p1).distance;
    }
    return sum;
  }

  static double _shoelaceArea(List<Offset> pts) {
    if (pts.length < 3) return 0.0;
    double area = 0.0;
    for (int i = 0; i < pts.length; i++) {
      final j = (i + 1) % pts.length;
      area += (pts[i].dx * pts[j].dy);
      area -= (pts[j].dx * pts[i].dy);
    }
    return (area / 2.0).abs();
  }
}

// ============================================================================
// 2. CLASS 'Yoga3DExtruder' (3D Mesh Geometry Generation)
// ============================================================================

/// Represents a 3D vertex position in millimeters
class Vector3D {
  final double x;
  final double y;
  final double z;

  const Vector3D(this.x, this.y, this.z);

  Vector3D translate(double dx, double dy, double dz) {
    return Vector3D(x + dx, y + dy, z + dz);
  }

  Vector3D add(Vector3D other) {
    return Vector3D(x + other.x, y + other.y, z + other.z);
  }

  Vector3D subtract(Vector3D other) {
    return Vector3D(x - other.x, y - other.y, z - other.z);
  }

  Vector3D cross(Vector3D other) {
    return Vector3D(
      y * other.z - z * other.y,
      z * other.x - x * other.z,
      x * other.y - y * other.x,
    );
  }

  double dot(Vector3D other) {
    return x * other.x + y * other.y + z * other.z;
  }

  double length() {
    return math.sqrt(x * x + y * y + z * z);
  }

  Vector3D normalized() {
    final len = length();
    if (len == 0) return const Vector3D(0, 0, 1);
    return Vector3D(x / len, y / len, z / len);
  }
}

/// Represents a triangular surface facet with calculated face normal
class MeshTriangle3D {
  final int i0;
  final int i1;
  final int i2;
  final Vector3D normal;

  const MeshTriangle3D(this.i0, this.i1, this.i2, this.normal);
}

/// Complete structural 3D extruded mesh
class ExtrudedMesh3D {
  final List<Vector3D> vertices;
  final List<MeshTriangle3D> triangles;
  final List<List<int>> wireframeEdges; // Pairs of indices [i0, i1]
  final double physicalVolumeMm3; // Exact physical volume (mm³)
  final double weightKg; // Calculated physical weight in kg
  final double perimeterMm; // Cross section perimeter (mm)
  final double lengthMm; // Extrusion bar length (mm)

  const ExtrudedMesh3D({
    required this.vertices,
    required this.triangles,
    required this.wireframeEdges,
    required this.physicalVolumeMm3,
    required this.weightKg,
    required this.perimeterMm,
    required this.lengthMm,
  });
}

/// 3D Mesh extrusion engine: turns 2D ProfileGeometry into structural 3D solid bars
class Yoga3DExtruder {
  /// Architectural Aluminum Alloy 6063-T5 standard density:
  /// 2.70 g/cm³ = 0.00000270 kg/mm³ (2.70e-6 kg/mm³)
  static const double aluminumDensityKgMm3 = 0.00000270;

  /// Extrudes a 2D profile contour along the local Z axis for customLength (in mm).
  /// Generates front cap, back cap, side tubular walls, and exact volume/weight.
  static ExtrudedMesh3D extrude({
    required ProfileGeometry profile,
    required double customLength,
  }) {
    final vertices = <Vector3D>[];
    final triangles = <MeshTriangle3D>[];
    final edges = <List<int>>[];

    final outer = profile.outerContour;
    final n = outer.length;

    // 1. Generate 3D Vertices
    // Front face vertices (Z = 0)
    for (final pt in outer) {
      vertices.add(Vector3D(pt.dx, pt.dy, 0.0));
    }
    // Back face vertices (Z = customLength)
    for (final pt in outer) {
      vertices.add(Vector3D(pt.dx, pt.dy, customLength));
    }

    // 2. Generate Side Longitudinal Wall Triangles & Wireframe Edges
    for (int i = 0; i < n; i++) {
      final next = (i + 1) % n;

      final f0 = i; // Front bottom-left
      final f1 = next; // Front bottom-right
      final b0 = i + n; // Back top-left
      final b1 = next + n; // Back top-right

      // Edge lines for CAD wireframe view
      edges.add([f0, f1]); // Front loop edge
      edges.add([b0, b1]); // Back loop edge
      edges.add([f0, b0]); // Longitudinal extrusion rib

      // Side face normal calculation
      final vF0 = vertices[f0];
      final vF1 = vertices[f1];
      final vB0 = vertices[b0];
      final sideNormal = (vF1.subtract(vF0)).cross(vB0.subtract(vF0)).normalized();

      // Two triangles forming side rectangular quad
      triangles.add(MeshTriangle3D(f0, f1, b1, sideNormal));
      triangles.add(MeshTriangle3D(f0, b1, b0, sideNormal));
    }

    // 3. Generate End Caps (Front: Z=0, Back: Z=customLength) via fan triangulation
    final frontNormal = const Vector3D(0, 0, -1);
    final backNormal = const Vector3D(0, 0, 1);

    for (int i = 1; i < n - 1; i++) {
      // Front cap (clockwise winding for camera pointing from -Z)
      triangles.add(MeshTriangle3D(0, i + 1, i, frontNormal));
      // Back cap (counter-clockwise winding for camera pointing from +Z)
      triangles.add(MeshTriangle3D(n, n + i, n + i + 1, backNormal));
    }

    // 4. Mathematical Physical Volume & Weight
    // Volume = Cross-Section Area (mm²) * Extrusion Length (mm)
    final crossSectionArea = profile.calculateCrossSectionArea();
    final volumeMm3 = crossSectionArea * customLength;
    final weightKg = volumeMm3 * aluminumDensityKgMm3;
    final perimeter = profile.calculatePerimeter();

    return ExtrudedMesh3D(
      vertices: vertices,
      triangles: triangles,
      wireframeEdges: edges,
      physicalVolumeMm3: volumeMm3,
      weightKg: weightKg,
      perimeterMm: perimeter,
      lengthMm: customLength,
    );
  }
}

// ============================================================================
// 3. LOGIC FOR MATRIX TRANSFORMATIONS & STRUCTURAL ASSEMBLY
// ============================================================================

/// Assembly transform mathematics: Pitch (X), Yaw (Y), Roll (Z) and translation (X,Y,Z).
class AssemblyMatrix {
  static double _degToRad(double deg) => deg * (math.pi / 180.0);

  /// Rotates a 3D point around X (Pitch), Y (Yaw), and Z (Roll) axes in Euler degrees
  static Vector3D rotatePoint(
    Vector3D p, {
    double pitchDeg = 0.0,
    double yawDeg = 0.0,
    double rollDeg = 0.0,
  }) {
    double x = p.x;
    double y = p.y;
    double z = p.z;

    // Rotate around X (Pitch)
    if (pitchDeg != 0.0) {
      final rad = _degToRad(pitchDeg);
      final cosA = math.cos(rad);
      final sinA = math.sin(rad);
      final yNew = y * cosA - z * sinA;
      final zNew = y * sinA + z * cosA;
      y = yNew;
      z = zNew;
    }

    // Rotate around Y (Yaw)
    if (yawDeg != 0.0) {
      final rad = _degToRad(yawDeg);
      final cosA = math.cos(rad);
      final sinA = math.sin(rad);
      final xNew = x * cosA + z * sinA;
      final zNew = -x * sinA + z * cosA;
      x = xNew;
      z = zNew;
    }

    // Rotate around Z (Roll)
    if (rollDeg != 0.0) {
      final rad = _degToRad(rollDeg);
      final cosA = math.cos(rad);
      final sinA = math.sin(rad);
      final xNew = x * cosA - y * sinA;
      final yNew = x * sinA + y * cosA;
      x = xNew;
      y = yNew;
    }

    return Vector3D(x, y, z);
  }

  /// Transforms an entire ExtrudedMesh3D into 3D world space coordinates
  static ExtrudedMesh3D transformMesh(
    ExtrudedMesh3D mesh, {
    double posX = 0.0,
    double posY = 0.0,
    double posZ = 0.0,
    double pitchDeg = 0.0,
    double yawDeg = 0.0,
    double rollDeg = 0.0,
  }) {
    // Transform all vertices
    final transformedVertices = mesh.vertices.map((v) {
      final rotated = rotatePoint(v, pitchDeg: pitchDeg, yawDeg: yawDeg, rollDeg: rollDeg);
      return rotated.translate(posX, posY, posZ);
    }).toList();

    // Transform triangle surface normals
    final transformedTriangles = mesh.triangles.map((tri) {
      final rotatedNormal = rotatePoint(tri.normal, pitchDeg: pitchDeg, yawDeg: yawDeg, rollDeg: rollDeg).normalized();
      return MeshTriangle3D(tri.i0, tri.i1, tri.i2, rotatedNormal);
    }).toList();

    return ExtrudedMesh3D(
      vertices: transformedVertices,
      triangles: transformedTriangles,
      wireframeEdges: mesh.wireframeEdges,
      physicalVolumeMm3: mesh.physicalVolumeMm3,
      weightKg: mesh.weightKg,
      perimeterMm: mesh.perimeterMm,
      lengthMm: mesh.lengthMm,
    );
  }
}

/// Represents an assembled bar instance placed inside the CAD world space
class AssembledBarInstance {
  final String label;
  final ExtrudedMesh3D mesh;
  final Color baseColor;

  const AssembledBarInstance({
    required this.label,
    required this.mesh,
    this.baseColor = const Color(0xFF64748B), // Slate aluminum
  });
}

/// Fastener coordinate point model
class CadScrewPoint {
  final String id;
  final Vector3D position;
  final String type; // e.g. "Sekrup 3 Inch", "Rivet 4.0mm"

  const CadScrewPoint({
    required this.id,
    required this.position,
    required this.type,
  });
}

// ============================================================================
// 4. WIDGET 'Yoga3DViewport' (The CAD Render Canvas)
// ============================================================================

/// Interactive 3D CAD Canvas for offline structural assembly visualization.
/// Supports touch orbit drag (yaw/pitch), zoom, wireframe toggle, and fastener dots.
class Yoga3DViewport extends StatefulWidget {
  final List<AssembledBarInstance> bars;
  final List<CadScrewPoint> screwPoints;
  final bool showWireframe;
  final bool showScrews;

  const Yoga3DViewport({
    super.key,
    required this.bars,
    this.screwPoints = const [],
    this.showWireframe = true,
    this.showScrews = true,
  });

  @override
  State<Yoga3DViewport> createState() => _Yoga3DViewportState();
}

class _Yoga3DViewportState extends State<Yoga3DViewport> {
  // Camera Orbit State
  double _cameraYaw = 0.75; // Radians (horizontal orbit)
  double _cameraPitch = 0.45; // Radians (vertical elevation)
  double _zoomScale = 0.18; // Screen pixels per mm
  Offset _panOffset = Offset.zero;

  Offset? _lastFocalPoint;

  void _resetCamera() {
    setState(() {
      _cameraYaw = 0.75;
      _cameraPitch = 0.45;
      _zoomScale = 0.18;
      _panOffset = Offset.zero;
    });
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Stack(
          children: [
            // Gesture Detector for 3D Camera Orbit, Pan, and Zoom
            GestureDetector(
              onScaleStart: (details) {
                _lastFocalPoint = details.focalPoint;
              },
              onScaleUpdate: (details) {
                setState(() {
                  // Zooming
                  if (details.scale != 1.0) {
                    _zoomScale = (_zoomScale * details.scale).clamp(0.02, 1.5);
                  }

                  // Rotating (1 pointer) or Panning (2+ pointers)
                  if (_lastFocalPoint != null) {
                    final delta = details.focalPoint - _lastFocalPoint!;
                    if (details.pointerCount == 1) {
                      _cameraYaw -= delta.dx * 0.008;
                      _cameraPitch = (_cameraPitch + delta.dy * 0.008).clamp(0.05, math.pi / 2 - 0.05);
                    } else {
                      _panOffset += delta;
                    }
                  }
                  _lastFocalPoint = details.focalPoint;
                });
              },
              child: CustomPaint(
                size: Size(constraints.maxWidth, constraints.maxHeight),
                painter: _CadMeshPainter(
                  bars: widget.bars,
                  screws: widget.screwPoints,
                  cameraYaw: _cameraYaw,
                  cameraPitch: _cameraPitch,
                  zoomScale: _zoomScale,
                  panOffset: _panOffset,
                  showWireframe: widget.showWireframe,
                  showScrews: widget.showScrews,
                ),
              ),
            ),

            // Top-left HUD Info Badge
            Positioned(
              top: 12.0,
              left: 12.0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10.0, vertical: 6.0),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A).withOpacity(0.85),
                  borderRadius: BorderRadius.circular(8.0),
                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.view_in_ar, size: 14.0, color: Color(0xFF38BDF8)),
                    const SizedBox(width: 6.0),
                    Text(
                      'CAD 3D Extrusion Engine (\${widget.bars.length} Bars)',
                      style: const TextStyle(
                        fontSize: 11.0,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Bottom-right Floating Control Buttons
            Positioned(
              bottom: 12.0,
              right: 12.0,
              child: Row(
                children: [
                  FloatingActionButton.small(
                    heroTag: 'cad_zoom_in',
                    backgroundColor: const Color(0xFF1E293B),
                    foregroundColor: Colors.white,
                    onPressed: () => setState(() => _zoomScale = (_zoomScale * 1.25).clamp(0.02, 1.5)),
                    child: const Icon(Icons.zoom_in, size: 18.0),
                  ),
                  const SizedBox(width: 8.0),
                  FloatingActionButton.small(
                    heroTag: 'cad_zoom_out',
                    backgroundColor: const Color(0xFF1E293B),
                    foregroundColor: Colors.white,
                    onPressed: () => setState(() => _zoomScale = (_zoomScale / 1.25).clamp(0.02, 1.5)),
                    child: const Icon(Icons.zoom_out, size: 18.0),
                  ),
                  const SizedBox(width: 8.0),
                  FloatingActionButton.small(
                    heroTag: 'cad_reset',
                    backgroundColor: const Color(0xFF0284C7),
                    foregroundColor: Colors.white,
                    onPressed: _resetCamera,
                    child: const Icon(Icons.restart_alt, size: 18.0),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

/// CustomPainter projecting 3D mesh vertices to 2D viewport coordinates
class _CadMeshPainter extends CustomPainter {
  final List<AssembledBarInstance> bars;
  final List<CadScrewPoint> screws;
  final double cameraYaw;
  final double cameraPitch;
  final double zoomScale;
  final Offset panOffset;
  final bool showWireframe;
  final bool showScrews;

  const _CadMeshPainter({
    required this.bars,
    required this.screws,
    required this.cameraYaw,
    required this.cameraPitch,
    required this.zoomScale,
    required this.panOffset,
    required this.showWireframe,
    required this.showScrews,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // 1. Viewport Center
    final center = Offset(size.width / 2, size.height / 2) + panOffset;

    // 2. Draw Floor CAD Reference Grid
    _drawCadGrid(canvas, size, center);

    // 3. Directional Light Vector for metallic aluminum shading
    final lightDir = const Vector3D(0.4, 0.8, -0.6).normalized();

    // 4. Render All Bars with Depth Sorting (Painter's Algorithm)
    final drawableFaces = <_DrawableTriangle>[];

    for (final bar in bars) {
      final mesh = bar.mesh;
      final verts = mesh.vertices;

      // Project vertices to camera space
      final cameraSpaceVerts = <Vector3D>[];
      final screenPts = <Offset>[];

      for (final v in verts) {
        final camV = _projectToCamera(v);
        cameraSpaceVerts.add(camV);
        screenPts.add(Offset(
          center.dx + camV.x * zoomScale,
          center.dy - camV.y * zoomScale, // Flip Y for screen coords
        ));
      }

      // Collect Triangles with Camera Z depth for sorting
      for (final tri in mesh.triangles) {
        final v0 = cameraSpaceVerts[tri.i0];
        final v1 = cameraSpaceVerts[tri.i1];
        final v2 = cameraSpaceVerts[tri.i2];

        // Back-face culling using 2D cross product of screen projection
        final p0 = screenPts[tri.i0];
        final p1 = screenPts[tri.i1];
        final p2 = screenPts[tri.i2];

        final cross2D = (p1.dx - p0.dx) * (p2.dy - p0.dy) - (p1.dy - p0.dy) * (p2.dx - p0.dx);
        if (cross2D <= 0) continue; // Face pointing away from camera

        final avgZ = (v0.z + v1.z + v2.z) / 3.0;

        // Flat metallic shading intensity
        final transformedNormal = _rotateNormal(tri.normal);
        final lightIntensity = math.max(0.25, transformedNormal.dot(lightDir));

        final shadedColor = Color.fromARGB(
          245,
          (bar.baseColor.red * lightIntensity).toInt().clamp(0, 255),
          (bar.baseColor.green * lightIntensity).toInt().clamp(0, 255),
          (bar.baseColor.blue * lightIntensity).toInt().clamp(0, 255),
        );

        drawableFaces.add(_DrawableTriangle(
          p0: p0,
          p1: p1,
          p2: p2,
          depthZ: avgZ,
          color: shadedColor,
        ));
      }

      // Render Wireframe Outlines
      if (showWireframe) {
        final wirePaint = Paint()
          ..color = const Color(0xFF38BDF8).withOpacity(0.65)
          ..strokeWidth = 1.0
          ..style = PaintingStyle.stroke;

        for (final edge in mesh.wireframeEdges) {
          final ptA = screenPts[edge[0]];
          final ptB = screenPts[edge[1]];
          canvas.drawLine(ptA, ptB, wirePaint);
        }
      }
    }

    // Sort faces from furthest to nearest
    drawableFaces.sort((a, b) => b.depthZ.compareTo(a.depthZ));

    // Paint Sorted Faces
    final facePaint = Paint()..style = PaintingStyle.fill;
    final path = Path();

    for (final face in drawableFaces) {
      path.reset();
      path.moveTo(face.p0.dx, face.p0.dy);
      path.lineTo(face.p1.dx, face.p1.dy);
      path.lineTo(face.p2.dx, face.p2.dy);
      path.close();

      facePaint.color = face.color;
      canvas.drawPath(path, facePaint);
    }

    // 5. Draw Fastener Joint Screw Points
    if (showScrews) {
      for (final screw in screws) {
        final camScrew = _projectToCamera(screw.position);
        final screenPos = Offset(
          center.dx + camScrew.x * zoomScale,
          center.dy - camScrew.y * zoomScale,
        );

        _drawScrewDot(canvas, screenPos, screw.type);
      }
    }
  }

  void _drawCadGrid(Canvas canvas, Size size, Offset center) {
    final gridPaint = Paint()
      ..color = const Color(0xFF1E293B)
      ..strokeWidth = 1.0;

    const step = 200.0;
    for (double i = -2000; i <= 2000; i += step) {
      final camStart = _projectToCamera(Vector3D(i, 0, -2000));
      final camEnd = _projectToCamera(Vector3D(i, 0, 2000));
      canvas.drawLine(
        Offset(center.dx + camStart.x * zoomScale, center.dy - camStart.y * zoomScale),
        Offset(center.dx + camEnd.x * zoomScale, center.dy - camEnd.y * zoomScale),
        gridPaint,
      );
    }
  }

  Vector3D _projectToCamera(Vector3D p) {
    // 1. Orbit Yaw around Y axis
    final cosY = math.cos(cameraYaw);
    final sinY = math.sin(cameraYaw);
    final x1 = p.x * cosY + p.z * sinY;
    final y1 = p.y;
    final z1 = -p.x * sinY + p.z * cosY;

    // 2. Pitch elevation around X axis
    final cosP = math.cos(cameraPitch);
    final sinP = math.sin(cameraPitch);
    final x2 = x1;
    final y2 = y1 * cosP - z1 * sinP;
    final z2 = y1 * sinP + z1 * cosP;

    return Vector3D(x2, y2, z2);
  }

  Vector3D _rotateNormal(Vector3D n) {
    return _projectToCamera(n).normalized();
  }

  void _drawScrewDot(Canvas canvas, Offset pos, String type) {
    final isRivet = type.toLowerCase().contains('rivet');

    // Outer Target Bore Ring
    final ringPaint = Paint()
      ..color = isRivet ? const Color(0xFF06B6D4) : const Color(0xFFF59E0B)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawCircle(pos, 5.5, ringPaint);

    // Fastener Metallic Cap
    final capPaint = Paint()
      ..color = isRivet ? const Color(0xFFE2E8F0) : const Color(0xFFFBBF24)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(pos, 3.2, capPaint);

    // Screw Driver Slot Mark
    final slotPaint = Paint()
      ..color = Colors.black
      ..strokeWidth = 1.0;
    canvas.drawLine(Offset(pos.dx - 2.0, pos.dy), Offset(pos.dx + 2.0, pos.dy), slotPaint);
    canvas.drawLine(Offset(pos.dx, pos.dy - 2.0), Offset(pos.dx, pos.dy + 2.0), slotPaint);
  }

  @override
  bool shouldRepaint(covariant _CadMeshPainter oldDelegate) => true;
}

class _DrawableTriangle {
  final Offset p0;
  final Offset p1;
  final Offset p2;
  final double depthZ;
  final Color color;

  const _DrawableTriangle({
    required this.p0,
    required this.p1,
    required this.p2,
    required this.depthZ,
    required this.color,
  });
}
`,
  },
  {
    title: 'Stage 6 & 7: Data Safety, Backup & CSV Exporter',
    stage: 'BACKUP & CSV EXPORT',
    filename: 'lib/core/services/backup_service.dart',
    description: 'Data safety and portability engine: YogaBackupService for JSON export/import of Hive boxes (categories, profiles, stock inventory) with schema validation, plus professional CSV cutting lists and warehouse stock report generator.',
    code: `// ============================================================================
// PROJECT YOGA - BACKUP DATA SAFETY & CSV EXPORT SERVICE
// File: lib/core/services/backup_service.dart
// Production-Ready Offline Data Portability Engine
// ============================================================================

import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';
import 'package:path_provider/path_provider.dart';
import '../../features/cad/data/models/hive_models.dart';
import '../../features/inventory/domain/services/stock_validator_service.dart';

class BackupExportResult {
  final bool isSuccess;
  final String filePath;
  final int totalRecords;
  final String message;

  const BackupExportResult({
    required this.isSuccess,
    required this.filePath,
    required this.totalRecords,
    required this.message,
  });
}

class BackupImportResult {
  final bool isSuccess;
  final int categoriesRestored;
  final int profilesRestored;
  final int inventoryRestored;
  final String message;

  const BackupImportResult({
    required this.isSuccess,
    required this.categoriesRestored,
    required this.profilesRestored,
    required this.inventoryRestored,
    required this.message,
  });
}

class YogaBackupService {
  static const String currentSchemaVersion = '1.0.0';

  // ==========================================================================
  // 1. BACKUP EXPORT TO JSON
  // ==========================================================================

  /// Exports all MaterialCategory, MaterialProfile, and StockInventory records
  /// into a structured, human-readable JSON backup file saved in device storage.
  static Future<BackupExportResult> exportBackup() async {
    try {
      final categoryBox = Hive.box<MaterialCategory>('categories_box');
      final profileBox = Hive.box<MaterialProfile>('profiles_box');
      final inventoryBox = Hive.box<StockInventory>('inventory_box');

      // 1. Serialize Categories
      final categoryList = categoryBox.values.map((c) => {
        'id': c.id,
        'categoryName': c.categoryName,
      }).toList();

      // 2. Serialize Profiles
      final profileList = profileBox.values.map((p) => {
        'id': p.id,
        'categoryId': p.categoryId,
        'profileCode': p.profileCode,
        'wallThickness': p.wallThickness,
        'unitPrice': p.unitPrice,
        'outerPerimeter': p.outerPerimeter,
        'outerWidth': p.outerWidth,
        'outerDepth': p.outerDepth,
      }).toList();

      // 3. Serialize Stock Inventory
      final inventoryList = inventoryBox.values.map((s) => {
        'profileId': s.profileId,
        'lengthAvailable': s.lengthAvailable,
        'quantityInWarehouse': s.quantityInWarehouse,
      }).toList();

      // Construct master backup envelope
      final backupPayload = {
        'app': 'Project YOGA CAD',
        'schemaVersion': currentSchemaVersion,
        'exportTimestamp': DateTime.now().toIso8601String(),
        'counts': {
          'categories': categoryList.length,
          'profiles': profileList.length,
          'inventory': inventoryList.length,
        },
        'data': {
          'categories': categoryList,
          'profiles': profileList,
          'inventory': inventoryList,
        },
      };

      final jsonString = const JsonEncoder.withIndent('  ').convert(backupPayload);

      // Locate safe device directory using path_provider
      final directory = await _getSafeStorageDirectory();
      final dateStamp = DateTime.now().toIso8601String().replaceAll(':', '-').split('.').first;
      final fileName = 'YOGA_BACKUP_\${dateStamp}.json';
      final file = File('\${directory.path}/\$fileName');

      await file.writeAsString(jsonString, flush: true);

      final totalRecords = categoryList.length + profileList.length + inventoryList.length;

      return BackupExportResult(
        isSuccess: true,
        filePath: file.path,
        totalRecords: totalRecords,
        message: 'Backup tersimpan di: \${file.path}',
      );
    } catch (e) {
      return BackupExportResult(
        isSuccess: false,
        filePath: '',
        totalRecords: 0,
        message: 'Gagal membuat backup: \$e',
      );
    }
  }

  // ==========================================================================
  // 2. BACKUP IMPORT & SAFE RESTORE
  // ==========================================================================

  /// Safely imports, validates, and restores data from a JSON backup file.
  /// If clearExisting is true, current boxes are cleared before importing.
  static Future<BackupImportResult> importBackup({
    required File backupFile,
    bool clearExisting = true,
  }) async {
    try {
      if (!await backupFile.exists()) {
        return const BackupImportResult(
          isSuccess: false,
          categoriesRestored: 0,
          profilesRestored: 0,
          inventoryRestored: 0,
          message: 'File backup tidak ditemukan.',
        );
      }

      final jsonContent = await backupFile.readAsString();
      final dynamic parsed = jsonDecode(jsonContent);

      if (parsed is! Map<String, dynamic> || !parsed.containsKey('data')) {
        return const BackupImportResult(
          isSuccess: false,
          categoriesRestored: 0,
          profilesRestored: 0,
          inventoryRestored: 0,
          message: 'Format file backup tidak valid atau rusak.',
        );
      }

      final dataMap = parsed['data'] as Map<String, dynamic>;

      final categoryBox = Hive.box<MaterialCategory>('categories_box');
      final profileBox = Hive.box<MaterialProfile>('profiles_box');
      final inventoryBox = Hive.box<StockInventory>('inventory_box');

      if (clearExisting) {
        await categoryBox.clear();
        await profileBox.clear();
        await inventoryBox.clear();
      }

      int catCount = 0;
      int profCount = 0;
      int invCount = 0;

      // Restore Categories
      if (dataMap.containsKey('categories') && dataMap['categories'] is List) {
        for (final item in dataMap['categories']) {
          final cat = MaterialCategory(
            id: item['id'] as String,
            categoryName: item['categoryName'] as String,
          );
          await categoryBox.put(cat.id, cat);
          catCount++;
        }
      }

      // Restore Profiles
      if (dataMap.containsKey('profiles') && dataMap['profiles'] is List) {
        for (final item in dataMap['profiles']) {
          final prof = MaterialProfile(
            id: item['id'] as String,
            categoryId: item['categoryId'] as String,
            profileCode: item['profileCode'] as String,
            wallThickness: (item['wallThickness'] as num).toDouble(),
            unitPrice: (item['unitPrice'] as num).toDouble(),
            outerPerimeter: (item['outerPerimeter'] as num).toDouble(),
            outerWidth: (item['outerWidth'] as num).toDouble(),
            outerDepth: (item['outerDepth'] as num).toDouble(),
          );
          await profileBox.put(prof.id, prof);
          profCount++;
        }
      }

      // Restore Inventory
      if (dataMap.containsKey('inventory') && dataMap['inventory'] is List) {
        for (final item in dataMap['inventory']) {
          final inv = StockInventory(
            profileId: item['profileId'] as String,
            lengthAvailable: (item['lengthAvailable'] as num).toDouble(),
            quantityInWarehouse: (item['quantityInWarehouse'] as num).toInt(),
          );
          final key = 'inv_\${inv.profileId}_\${inv.lengthAvailable.toStringAsFixed(0)}';
          await inventoryBox.put(key, inv);
          invCount++;
        }
      }

      return BackupImportResult(
        isSuccess: true,
        categoriesRestored: catCount,
        profilesRestored: profCount,
        inventoryRestored: invCount,
        message: 'Restore Berhasil: \$catCount Kategori, \$profCount Profil, \$invCount Stok Gudang.',
      );
    } catch (e) {
      return BackupImportResult(
        isSuccess: false,
        categoriesRestored: 0,
        profilesRestored: 0,
        inventoryRestored: 0,
        message: 'Gagal merestore data: \$e',
      );
    }
  }

  // ==========================================================================
  // 3. CSV EXPORTERS (Cutting List & Inventory Report)
  // ==========================================================================

  /// Exports the active project's cutting list demands into a formatted CSV spreadsheet.
  static Future<File> exportCuttingListCsv({
    required String projectName,
    required List<CuttingRequest> requests,
    required Map<String, MaterialProfile> profileCatalog,
    double kerfThickness = 3.0,
  }) async {
    final buffer = StringBuffer();
    final dateStr = DateTime.now().toIso8601String();

    buffer.writeln('# PROJECT YOGA - DAFTAR POTONG PROYEK (CUTTING LIST)');
    buffer.writeln('# Proyek: \$projectName');
    buffer.writeln('# Tanggal Cetak: \$dateStr');
    buffer.writeln('# Blade Kerf Tolerance: \${kerfThickness}mm');
    buffer.writeln('');
    buffer.writeln('No,Nama Komponen,Kode Profil,Panjang Potong (mm),Toleransi Kerf (mm),Total Kebutuhan (mm)');

    for (int i = 0; i < requests.length; i++) {
      final req = requests[i];
      final profile = profileCatalog[req.profileId];
      final profileCode = profile?.profileCode ?? req.profileId;
      final totalCutNeed = req.requestedLength + kerfThickness;

      buffer.writeln(
        '\${i + 1},"\${req.label}","\$profileCode",\${req.requestedLength.toStringAsFixed(1)},\${kerfThickness.toStringAsFixed(1)},\${totalCutNeed.toStringAsFixed(1)}',
      );
    }

    final directory = await _getSafeStorageDirectory();
    final cleanProjName = projectName.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');
    final file = File('\${directory.path}/CUTTING_LIST_\${cleanProjName}.csv');

    return file.writeAsString(buffer.toString(), flush: true);
  }

  /// Exports warehouse inventory status (both standard and scrap planks) to CSV.
  static Future<File> exportInventoryReportCsv({
    required List<StockInventory> inventoryList,
    required Map<String, MaterialProfile> profileCatalog,
  }) async {
    final buffer = StringBuffer();
    final dateStr = DateTime.now().toIso8601String();

    buffer.writeln('# PROJECT YOGA - LAPORAN STOK GUDANG ALUMINIUM');
    buffer.writeln('# Tanggal Export: \$dateStr');
    buffer.writeln('');
    buffer.writeln('No,Kode Profil,Tipe Balok,Panjang (mm),Jumlah Gudang (Batang),Total Panjang (m)');

    for (int i = 0; i < inventoryList.length; i++) {
      final item = inventoryList[i];
      final profile = profileCatalog[item.profileId];
      final profileCode = profile?.profileCode ?? item.profileId;
      final type = item.isScrap ? 'SCRAP / SISA' : 'STANDAR FACTORY';
      final totalMeters = (item.lengthAvailable * item.quantityInWarehouse) / 1000.0;

      buffer.writeln(
        '\${i + 1},"\$profileCode",\$type,\${item.lengthAvailable.toStringAsFixed(0)},\${item.quantityInWarehouse},\${totalMeters.toStringAsFixed(2)}',
      );
    }

    final directory = await _getSafeStorageDirectory();
    final file = File('\${directory.path}/LAPORAN_STOK_GUDANG.csv');

    return file.writeAsString(buffer.toString(), flush: true);
  }

  /// Resolves the appropriate folder for offline storage on Android
  static Future<Directory> _getSafeStorageDirectory() async {
    if (kIsWeb) {
      return Directory.current;
    }
    try {
      final extDir = await getExternalStorageDirectory();
      if (extDir != null) return extDir;
    } catch (_) {}

    return await getApplicationDocumentsDirectory();
  }
}
`,
  },
  {
    title: 'Stage 9: Production Release APK & Android Gradle Setup',
    stage: 'STAGE 9 (APK RELEASE)',
    filename: 'android/build_and_release_config.dart',
    description: 'Production Android Gradle, ProGuard rules (preserving Hive TypeAdapters against R8 stripping), AndroidManifest, pubspec.yaml, and split-per-abi deployment guide.',
    code: `// ============================================================================
// PROJECT YOGA - STAGE 9: PRODUCTION RELEASE APK & GRADLE CONFIGURATION
// Target: 100% Offline Android APK (Zero cloud dependencies, sub-20MB per ABI)
// ============================================================================

/*
------------------------------------------------------------------------------
SECTION 1: pubspec.yaml (Complete Production Dependencies)
------------------------------------------------------------------------------
name: project_yoga
description: "Project YOGA - 100% Offline 2D/3D CAD & Stock Optimization for Android"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  vector_math: ^2.1.4
  path_provider: ^2.1.2
  intl: ^0.19.0
  share_plus: ^7.2.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  build_runner: ^2.4.8
  hive_generator: ^2.0.1

flutter:
  uses-material-design: true
*/

/*
------------------------------------------------------------------------------
SECTION 2: android/app/proguard-rules.pro
CRITICAL: Prevents R8 release optimizer from stripping Hive TypeAdapters
and Vector Math classes during 'flutter build apk --release'
------------------------------------------------------------------------------
# Flutter Engine & Plugins
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Project YOGA Hive Models & TypeAdapters Preservation
-keep class com.projectyoga.models.** { *; }
-keep @hive.HiveType class * { *; }
-keepclassmembers class * {
    @hive.HiveField *;
}
-keep class * extends hive.TypeAdapter { *; }
-keepclassmembers class * extends hive.TypeAdapter {
    public <methods>;
}

# 3D Math Engine (vector_math_64)
-keep class vector_math.** { *; }
-keep class vector_math_64.** { *; }

# File Backup & Path Provider
-keep class io.flutter.plugins.pathprovider.** { *; }
*/

/*
------------------------------------------------------------------------------
SECTION 3: android/app/build.gradle
------------------------------------------------------------------------------
plugins {
    id "com.android.application"
    id "kotlin-android"
    id "dev.flutter.flutter-gradle-plugin"
}

def localProperties = new Properties()
def localPropertiesFile = rootProject.file('local.properties')
if (localPropertiesFile.exists()) {
    localPropertiesFile.withReader('UTF-8') { reader ->
        localProperties.load(reader)
    }
}

def flutterVersionCode = localProperties.getProperty('flutter.versionCode') ?: '1'
def flutterVersionName = localProperties.getProperty('flutter.versionName') ?: '1.0.0'

android {
    namespace "com.projectyoga.cad"
    compileSdk 34
    ndkVersion flutter.ndkVersion

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = '17'
    }

    defaultConfig {
        applicationId "com.projectyoga.cad"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode flutterVersionCode.toInteger()
        versionName flutterVersionName
        
        ndk {
            abiFilters 'armeabi-v7a', 'arm64-v8a', 'x86_64'
        }
    }

    signingConfigs {
        release {
            // For single fighter offline testing without custom keystore:
            signingConfig signingConfigs.debug
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

flutter {
    source '../..'
}
*/

/*
------------------------------------------------------------------------------
SECTION 4: android/app/src/main/AndroidManifest.xml
------------------------------------------------------------------------------
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.projectyoga.cad">

    <!-- 100% Offline App: Storage permissions for Local Hive JSON Backup -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />

    <application
        android:label="Project YOGA"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher"
        android:requestLegacyExternalStorage="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:taskAffinity=""
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            <meta-data
              android:name="io.flutter.embedding.android.NormalTheme"
              android:resource="@style/NormalTheme" />
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
        
        <meta-data
            android:name="flutterEmbedding"
            android:value="2" />
    </application>
</manifest>
*/

// ============================================================================
// SECTION 5: PRODUCTION MAIN ENTRY POINT (Hive Registration & Launch)
// File: lib/main.dart
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive_flutter/hive_flutter.dart';

// Hive Model Imports
import 'features/cad/data/models/hive_models.dart';
import 'features/cad/presentation/pages/pre_cutting_summary_dashboard_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF0F172A),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  // Initialize Hive in Android Application Documents Directory (Offline Local)
  await Hive.initFlutter();

  // Register all 6 Hive Type Adapters (TypeId 0 to 5)
  Hive.registerAdapter(MaterialCategoryAdapter());    // TypeId: 0
  Hive.registerAdapter(MaterialProfileAdapter());     // TypeId: 1
  Hive.registerAdapter(StockInventoryAdapter());     // TypeId: 2
  Hive.registerAdapter(AssembledComponentAdapter()); // TypeId: 3
  Hive.registerAdapter(ScrewPointAdapter());         // TypeId: 4
  Hive.registerAdapter(ProjectItemAdapter());         // TypeId: 5

  // Open Required Persistent Hive Boxes
  await Hive.openBox<MaterialCategory>('material_categories');
  await Hive.openBox<MaterialProfile>('material_profiles');
  await Hive.openBox<StockInventory>('stock_inventory');
  await Hive.openBox<ProjectItem>('project_items');

  runApp(const ProjectYogaApp());
}

class ProjectYogaApp extends StatelessWidget {
  const ProjectYogaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Project YOGA CAD',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF020617),
        primaryColor: const Color(0xFF0EA5E9),
        cardColor: const Color(0xFF0F172A),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF0EA5E9),
          secondary: Color(0xFF38BDF8),
          surface: Color(0xFF0F172A),
          error: Color(0xFFEF4444),
        ),
        fontFamily: 'Roboto',
      ),
      home: const PreCuttingSummaryDashboardPage(),
    );
  }
}
`,
  },
];

export const DartCodeExplorer: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  const [copied, setCopied] = useState(false);

  const currentStage = DART_STAGES[activeStageIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentStage.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    const fullCodeBundle = DART_STAGES.map(

      (s) => `// ${'='.repeat(70)}\n// ${s.title}\n// Path: ${s.filename}\n// ${'='.repeat(70)}\n\n${s.code}\n\n`
    ).join('\n');

    const blob = new Blob([fullCodeBundle], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Project_YOGA_Complete_Dart_Engine.dart`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col h-full overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded uppercase tracking-wider">
              Solo Fighter Flutter Architecture
            </span>
            <span className="text-xs text-slate-400 font-mono">Offline Production-Ready</span>
          </div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-sky-400" />
            <span>Complete Dart Source Code Implementation (Stages 1-5)</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadAll}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FolderTree className="w-3.5 h-3.5 text-sky-400" />
            <span>Download All (.dart)</span>
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Active Stage'}</span>
          </button>
        </div>
      </div>

      {/* Stage Selector Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/50 overflow-x-auto text-xs font-mono">
        {DART_STAGES.map((s, idx) => {
          const isActive = idx === activeStageIndex;
          return (
            <button
              key={idx}
              onClick={() => setActiveStageIndex(idx)}
              className={`px-4 py-2.5 flex items-center gap-2 whitespace-nowrap border-b-2 font-medium transition-colors ${
                isActive
                  ? 'border-sky-500 text-sky-300 bg-sky-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
              <span>{s.stage}</span>
            </button>
          );
        })}
      </div>

      {/* Active Stage Metadata Banner */}
      <div className="px-5 py-3 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div>
          <div className="font-semibold text-white">{currentStage.title}</div>
          <div className="text-slate-400 text-[11px] font-mono mt-0.5">{currentStage.filename}</div>
        </div>
        <div className="text-slate-400 text-right text-[11px] max-w-md hidden md:block">
          {currentStage.description}
        </div>
      </div>

      {/* Code Display Area */}
      <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200 selection:bg-sky-500/30">
        <pre className="overflow-x-auto whitespace-pre font-mono p-4 rounded-lg bg-slate-900/90 border border-slate-800">
          <code>{currentStage.code}</code>
        </pre>
      </div>
    </div>
  );
};
