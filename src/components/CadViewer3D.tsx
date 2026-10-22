import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AssembledComponent, MaterialProfile, ScrewPoint } from '../types';
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Layers,
  Ruler,
  Crosshair,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface CadViewer3DProps {
  components: AssembledComponent[];
  profiles: MaterialProfile[];
  screws: ScrewPoint[];
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  showScrews?: boolean;
  showWireframe?: boolean;
  explosionFactor?: number;
  onAddScrewPoint?: (screw: ScrewPoint) => void;
}

export const CadViewer3D: React.FC<CadViewer3DProps> = ({
  components,
  profiles,
  screws,
  selectedComponentId,
  onSelectComponent,
  showScrews = true,
  showWireframe = false,
  explosionFactor = 0,
  onAddScrewPoint,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshesGroupRef = useRef<THREE.Group | null>(null);
  const screwsGroupRef = useRef<THREE.Group | null>(null);
  const dimensionLineGroupRef = useRef<THREE.Group | null>(null);

  // Interaction tracking
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraPolarRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 4, radius: 3500 });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(450, 1050, 0));

  const [hoveredInfo, setHoveredInfo] = useState<string | null>(null);

  // Digital Measurement Tape (Clearance) Mode
  const [measurementMode, setMeasurementMode] = useState<boolean>(false);
  const [measureTargetA, setMeasureTargetA] = useState<string | null>(null);
  const [measureTargetB, setMeasureTargetB] = useState<string | null>(null);
  const [measuredClearanceMm, setMeasuredClearanceMm] = useState<{
    distanceMm: number;
    axis: 'X (Lebar Bersih)' | 'Y (Tinggi Bersih)' | '3D Diagonal';
    pointA: [number, number, number];
    pointB: [number, number, number];
  } | null>(null);

  // Joint Fastener Placement Tool
  const [anchorMode, setAnchorMode] = useState<boolean>(false);
  const [lastAnchorInstruction, setLastAnchorInstruction] = useState<string | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Slate 900
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 50000);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(2000, 4000, 3000);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x93c5fd, 0.6);
    dirLight2.position.set(-2000, -1000, -2000);
    scene.add(dirLight2);

    // 5. Grid & Axes
    const gridHelper = new THREE.GridHelper(4000, 40, 0x334155, 0x1e293b);
    gridHelper.position.set(450, 0, 0);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(300);
    axesHelper.position.set(-200, 0, -200);
    scene.add(axesHelper);

    // Groups
    const meshesGroup = new THREE.Group();
    meshesGroupRef.current = meshesGroup;
    scene.add(meshesGroup);

    const screwsGroup = new THREE.Group();
    screwsGroupRef.current = screwsGroup;
    scene.add(screwsGroup);

    const dimensionLineGroup = new THREE.Group();
    dimensionLineGroupRef.current = dimensionLineGroup;
    scene.add(dimensionLineGroup);

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, []);

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraPolarRef.current;
    const target = cameraTargetRef.current;

    cameraRef.current.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = target.y + radius * Math.cos(phi);
    cameraRef.current.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(target);
  };

  // Re-build 3D Meshes
  useEffect(() => {
    const meshesGroup = meshesGroupRef.current;
    const screwsGroup = screwsGroupRef.current;
    if (!meshesGroup || !screwsGroup || !sceneRef.current) return;

    // Clear existing
    while (meshesGroup.children.length > 0) {
      const obj = meshesGroup.children[0];
      meshesGroup.remove(obj);
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
    }
    while (screwsGroup.children.length > 0) {
      const obj = screwsGroup.children[0];
      screwsGroup.remove(obj);
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
    }

    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const centerPoint = new THREE.Vector3(450, 1050, 0);

    // 1. Build Extruded Aluminum Profiles
    components.forEach((comp) => {
      const profile = profileMap.get(comp.profileId) || {
        id: comp.profileId,
        categoryId: 'cat-1',
        profileCode: '0504 Shopfront 3 Inch',
        name: 'Profile',
        width: 44.5,
        height: 76.2,
        wallThickness: 1.2,
        outerPerimeter: 241.4,
        unitPrice: 38.5,
        color: '#94a3b8',
      };

      const w = profile.width;
      const d = profile.height;
      const t = profile.wallThickness;
      const length = comp.customLength;

      // 2D Hollow Profile Shape
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(w, 0);
      shape.lineTo(w, d);
      shape.lineTo(0, d);
      shape.closePath();

      const holePath = new THREE.Path();
      holePath.moveTo(t, t);
      holePath.lineTo(w - t, t);
      holePath.lineTo(w - t, d - t);
      holePath.lineTo(t, d - t);
      holePath.closePath();
      shape.holes.push(holePath);

      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        steps: 1,
        depth: length,
        bevelEnabled: true,
        bevelThickness: 0.8,
        bevelSize: 0.6,
        bevelSegments: 2,
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

      const isSelected = selectedComponentId === comp.id;
      const isMeasureA = measureTargetA === comp.id;
      const isMeasureB = measureTargetB === comp.id;

      // Material with selection highlighting
      const material = new THREE.MeshStandardMaterial({
        color: isMeasureA
          ? 0x06b6d4 // Cyan for Measure Point A
          : isMeasureB
          ? 0xf59e0b // Amber for Measure Point B
          : isSelected
          ? 0x38bdf8
          : new THREE.Color(profile.color || 0x94a3b8),
        metalness: 0.85,
        roughness: 0.28,
        wireframe: showWireframe,
        emissive: isMeasureA
          ? 0x0891b2
          : isMeasureB
          ? 0xd97706
          : isSelected
          ? 0x0284c7
          : 0x000000,
        emissiveIntensity: isMeasureA || isMeasureB || isSelected ? 0.45 : 0,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { componentId: comp.id, label: comp.label, profileCode: profile.profileCode };

      const componentGroup = new THREE.Group();
      mesh.rotation.x = -Math.PI / 2;
      componentGroup.add(mesh);

      componentGroup.rotation.x = THREE.MathUtils.degToRad(comp.rotationX);
      componentGroup.rotation.y = THREE.MathUtils.degToRad(comp.rotationY);
      componentGroup.rotation.z = THREE.MathUtils.degToRad(comp.rotationZ);

      let finalX = comp.positionX;
      let finalY = comp.positionY;
      let finalZ = comp.positionZ;

      if (explosionFactor > 0) {
        const dirX = finalX - centerPoint.x;
        const dirY = finalY - centerPoint.y;
        finalX += (dirX !== 0 ? Math.sign(dirX) : 0) * 180 * explosionFactor;
        finalY += (dirY !== 0 ? Math.sign(dirY) : 0) * 120 * explosionFactor;
        finalZ += (dirY === 0 ? 1 : 0) * 100 * explosionFactor;
      }

      componentGroup.position.set(finalX, finalY, finalZ);
      meshesGroup.add(componentGroup);
    });

    // 2. Build Screw Points and Fasteners
    if (showScrews) {
      screws.forEach((screw) => {
        const isRivet = screw.type.toLowerCase().includes('rivet');
        const screwGroup = new THREE.Group();

        const headGeo = new THREE.CylinderGeometry(isRivet ? 4.5 : 5.0, isRivet ? 4.0 : 3.5, 2.5, 16);
        const headMat = new THREE.MeshStandardMaterial({
          color: isRivet ? 0xd4d4d8 : 0xf59e0b,
          metalness: 0.9,
          roughness: 0.2,
        });
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.rotation.x = Math.PI / 2;
        screwGroup.add(headMesh);

        const centerPinGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 12);
        const centerPinMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
        const centerPin = new THREE.Mesh(centerPinGeo, centerPinMat);
        centerPin.position.z = 1.3;
        centerPin.rotation.x = Math.PI / 2;
        screwGroup.add(centerPin);

        const ringGeo = new THREE.RingGeometry(6, 7.5, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: isRivet ? 0x06b6d4 : 0xf59e0b,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.z = 0.2;
        screwGroup.add(ringMesh);

        screwGroup.position.set(screw.positionX, screw.positionY, screw.positionZ);
        screwsGroup.add(screwGroup);
      });
    }
  }, [components, profiles, screws, selectedComponentId, measureTargetA, measureTargetB, showScrews, showWireframe, explosionFactor]);

  // STAGE 6: DIGITAL MEASUREMENT TAPE (Internal Clearance) 3D Line Rendering
  useEffect(() => {
    const dimensionGroup = dimensionLineGroupRef.current;
    if (!dimensionGroup) return;

    // Clear previous dimension lines
    while (dimensionGroup.children.length > 0) {
      const obj = dimensionGroup.children[0];
      dimensionGroup.remove(obj);
      if ((obj as THREE.Line).geometry) (obj as THREE.Line).geometry.dispose();
    }

    if (!measureTargetA || !measureTargetB) {
      setMeasuredClearanceMm(null);
      return;
    }

    const compA = components.find((c) => c.id === measureTargetA);
    const compB = components.find((c) => c.id === measureTargetB);
    const profA = profiles.find((p) => p.id === compA?.profileId) || profiles[0];
    const profB = profiles.find((p) => p.id === compB?.profileId) || profiles[0];

    if (!compA || !compB) return;

    // Mathematical Internal Clearance Calculation
    // For vertical jambs separated horizontally (along X):
    const isJambToJamb = Math.abs(compA.positionX - compB.positionX) > 100 && compA.rotationZ === 0 && compB.rotationZ === 0;
    
    let clearanceDistance: number;
    let axisLabel: 'X (Lebar Bersih)' | 'Y (Tinggi Bersih)' | '3D Diagonal';
    let pA: THREE.Vector3;
    let pB: THREE.Vector3;

    if (isJambToJamb) {
      // Internal clearance between inner face of left jamb and inner face of right jamb
      const leftX = Math.min(compA.positionX, compB.positionX);
      const rightX = Math.max(compA.positionX, compB.positionX);
      const leftProfileWidth = compA.positionX < compB.positionX ? profA.width : profB.width;

      const innerLeftX = leftX + leftProfileWidth;
      const innerRightX = rightX;
      clearanceDistance = Math.max(0, innerRightX - innerLeftX);
      axisLabel = 'X (Lebar Bersih)';

      const midY = 1050; // midpoint along height
      pA = new THREE.Vector3(innerLeftX, midY, profA.height / 2);
      pB = new THREE.Vector3(innerRightX, midY, profA.height / 2);
    } else {
      // Generic Euclidean distance or vertical clearance
      pA = new THREE.Vector3(compA.positionX + profA.width / 2, compA.positionY, profA.height / 2);
      pB = new THREE.Vector3(compB.positionX + profB.width / 2, compB.positionY, profB.height / 2);
      clearanceDistance = pA.distanceTo(pB);
      axisLabel = Math.abs(pA.x - pB.x) < 5 ? 'Y (Tinggi Bersih)' : '3D Diagonal';
    }

    setMeasuredClearanceMm({
      distanceMm: clearanceDistance,
      axis: axisLabel,
      pointA: [pA.x, pA.y, pA.z],
      pointB: [pB.x, pB.y, pB.z],
    });

    // Draw 3D Dashed Dimension Line
    const lineGeo = new THREE.BufferGeometry().setFromPoints([pA, pB]);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x06b6d4,
      dashSize: 20,
      gapSize: 10,
      linewidth: 3,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    line.computeLineDistances();
    dimensionGroup.add(line);

    // End Arrow Tick Markers
    const tickMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const tickGeoA = new THREE.SphereGeometry(8, 12, 12);
    const tickMeshA = new THREE.Mesh(tickGeoA, tickMat);
    tickMeshA.position.copy(pA);
    dimensionGroup.add(tickMeshA);

    const tickMeshB = new THREE.Mesh(tickGeoA, tickMat);
    tickMeshB.position.copy(pB);
    dimensionGroup.add(tickMeshB);
  }, [measureTargetA, measureTargetB, components, profiles]);

  // Mouse Controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    cameraPolarRef.current.theta -= deltaX * 0.007;
    cameraPolarRef.current.phi = Math.max(
      0.05,
      Math.min(Math.PI - 0.05, cameraPolarRef.current.phi - deltaY * 0.007)
    );

    updateCameraPosition();
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraPolarRef.current.radius = Math.max(
      800,
      Math.min(12000, cameraPolarRef.current.radius + e.deltaY * 3.5)
    );
    updateCameraPosition();
  };

  // Click handler: Selection, Measurement Tape, or Screw Anchor Placement
  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    if (meshesGroupRef.current) {
      const intersects = raycaster.intersectObjects(meshesGroupRef.current.children, true);
      if (intersects.length > 0) {
        let current: THREE.Object3D | null = intersects[0].object;
        while (current && !current.userData?.componentId && current.parent) {
          current = current.parent;
        }

        const hitCompId = current?.userData?.componentId;
        const hitPoint = intersects[0].point;

        if (hitCompId) {
          // If in Measurement Tape Mode:
          if (measurementMode) {
            if (!measureTargetA) {
              setMeasureTargetA(hitCompId);
            } else if (!measureTargetB) {
              setMeasureTargetB(hitCompId);
            } else {
              setMeasureTargetA(hitCompId);
              setMeasureTargetB(null);
            }
            return;
          }

          // If in Screw Anchor Placement Mode:
          if (anchorMode && onAddScrewPoint) {
            const newScrew: ScrewPoint = {
              id: `scr-anchor-${Date.now()}`,
              positionX: parseFloat(hitPoint.x.toFixed(1)),
              positionY: parseFloat(hitPoint.y.toFixed(1)),
              positionZ: parseFloat(hitPoint.z.toFixed(1)),
              type: 'Sekrup 3 Inch Countersunk',
            };
            onAddScrewPoint(newScrew);
            setLastAnchorInstruction(
              `Titik Sekrup ditempatkan di Joint (${hitPoint.x.toFixed(0)}, ${hitPoint.y.toFixed(0)}, ${hitPoint.z.toFixed(0)} mm) pada "${current?.userData?.label}". Kencangkan dengan sekrup 3" penembus flange.`
            );
            return;
          }

          // Standard Selection Mode
          onSelectComponent(hitCompId);
          setHoveredInfo(`${current?.userData?.label} (${current?.userData?.profileCode})`);
          return;
        }
      }
    }

    if (!measurementMode) {
      onSelectComponent(null);
      setHoveredInfo(null);
    }
  };

  const resetCamera = () => {
    cameraPolarRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 3600 };
    cameraTargetRef.current = new THREE.Vector3(450, 1050, 0);
    updateCameraPosition();
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
      />

      {/* Top Left Tool HUD */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-sm">
        {/* Mode Toggles: Measure Tape & Screw Anchor */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-1.5 rounded-lg shadow-xl text-xs">
          <button
            onClick={() => {
              setMeasurementMode(!measurementMode);
              if (anchorMode) setAnchorMode(false);
              setMeasureTargetA(null);
              setMeasureTargetB(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold transition-all ${
              measurementMode
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Alat Ukur Jangka Dalam</span>
          </button>

          <button
            onClick={() => {
              setAnchorMode(!anchorMode);
              if (measurementMode) setMeasurementMode(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold transition-all ${
              anchorMode
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Penanda Sekrup Joint</span>
          </button>
        </div>

        {/* Digital Measurement Tape Live Result Card */}
        {measurementMode && (
          <div className="bg-slate-900/95 backdrop-blur-md border border-cyan-500/70 p-3.5 rounded-lg text-xs shadow-2xl">
            <div className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1.5">
              <Ruler className="w-4 h-4 text-cyan-400" />
              <span>Digital Internal Clearance Tape</span>
            </div>
            <p className="text-slate-300 text-[11px] mb-2 leading-tight">
              Klik 2 batang aluminium untuk mengukur jarak bersih antar permukaan dalam (Clearance).
            </p>

            <div className="space-y-1 font-mono text-[11px] mb-2">
              <div className="text-slate-400">
                Komponen A:{' '}
                <strong className="text-cyan-300">
                  {components.find((c) => c.id === measureTargetA)?.label || 'Pilih Batang 1...'}
                </strong>
              </div>
              <div className="text-slate-400">
                Komponen B:{' '}
                <strong className="text-amber-300">
                  {components.find((c) => c.id === measureTargetB)?.label || 'Pilih Batang 2...'}
                </strong>
              </div>
            </div>

            {measuredClearanceMm && (
              <div className="pt-2 border-t border-slate-700/80 flex items-baseline justify-between">
                <span className="text-[11px] text-slate-400">{measuredClearanceMm.axis}:</span>
                <span className="text-base font-black font-mono text-cyan-300">
                  {measuredClearanceMm.distanceMm.toFixed(1)} mm
                </span>
              </div>
            )}
          </div>
        )}

        {/* Anchor Mode Active Tooltip */}
        {anchorMode && (
          <div className="bg-slate-900/95 backdrop-blur-md border border-amber-500/70 p-3 rounded-lg text-xs shadow-2xl">
            <div className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
              <Crosshair className="w-4 h-4 text-amber-400" />
              <span>Mode Penempatan Sekrup Joint</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-tight">
              Klik pada area sambungan balok (joint) di kanvas 3D untuk menancapkan titik sekrup/rivet pengikat.
            </p>
            {lastAnchorInstruction && (
              <div className="mt-2 pt-2 border-t border-slate-700/80 text-[11px] text-amber-300 font-mono">
                {lastAnchorInstruction}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Viewport Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg p-1.5 shadow-2xl">
        <button
          onClick={() => {
            cameraPolarRef.current.radius = Math.max(800, cameraPolarRef.current.radius - 400);
            updateCameraPosition();
          }}
          title="Zoom In"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            cameraPolarRef.current.radius = Math.min(12000, cameraPolarRef.current.radius + 400);
            updateCameraPosition();
          }}
          title="Zoom Out"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetCamera}
          title="Reset Camera View"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Assembly World Dimensions Callout */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/85 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded text-[11px] font-mono text-slate-400 flex items-center gap-3">
        <span><strong className="text-rose-400">Lebar Luar:</strong> 900.0 mm</span>
        <span><strong className="text-emerald-400">Tinggi Luar:</strong> 2176.2 mm</span>
        <span><strong className="text-sky-400">Tebal Profil:</strong> 76.2 mm</span>
        <span className="text-amber-400">• Sekrup Joint: {screws.length}</span>
      </div>
    </div>
  );
};
