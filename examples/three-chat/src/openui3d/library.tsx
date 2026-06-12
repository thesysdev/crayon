"use client";

import {
  Environment,
  Lightformer,
  OrbitControls,
  PerspectiveCamera,
  PointerLockControls,
  Text,
  shaderMaterial,
  useGLTF,
} from "@react-three/drei";
import { Canvas, extend, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { createLibrary, defineComponent, type SubComponentOf } from "@openuidev/react-lang";
import { Bloom, DepthOfField, EffectComposer, N8AO, Noise } from "@react-three/postprocessing";
import { BallCollider, CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { z } from "zod/v4";

type Vec3 = [number, number, number];

type ElementLike<P = Record<string, unknown>> = SubComponentOf<P>;

const vec3Schema = z.tuple([z.number(), z.number(), z.number()]);
const colorSchema = z.string();
const anyElementSchema = z.any();

const PMNDRS_PALETTE = ["#ff4e50", "#fc913a", "#f9d423", "#ede574", "#e1f5c4"];

const PlasmaMaterialImpl = shaderMaterial(
  {
    time: 0,
    colorA: new THREE.Color("#35d0ff"),
    colorB: new THREE.Color("#ff4fd8"),
    intensity: 1,
  },
  `
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float time;
    uniform vec3 colorA;
    uniform vec3 colorB;
    uniform float intensity;
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      float wave = sin((vPosition.x + time) * 4.0) + cos((vPosition.y - time * 0.7) * 5.0);
      float mixValue = smoothstep(-1.4, 1.4, wave);
      vec3 color = mix(colorA, colorB, mixValue) * intensity;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
);

const GridGlowMaterialImpl = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color("#40f0c8"),
    lineWidth: 0.045,
    density: 14,
  },
  `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float time;
    uniform vec3 color;
    uniform float lineWidth;
    uniform float density;
    varying vec2 vUv;

    float gridLine(float coord) {
      float g = abs(fract(coord * density - 0.5) - 0.5) / fwidth(coord * density);
      return 1.0 - min(g, 1.0);
    }

    void main() {
      float grid = max(gridLine(vUv.x + time * 0.02), gridLine(vUv.y - time * 0.02));
      float alpha = smoothstep(1.0 - lineWidth, 1.0, grid);
      vec3 base = color * (0.25 + alpha * 1.8);
      gl_FragColor = vec4(base, 0.9);
    }
  `,
);

const IridescentMaterialImpl = shaderMaterial(
  {
    time: 0,
    colorA: new THREE.Color("#5eead4"),
    colorB: new THREE.Color("#f472b6"),
    intensity: 1,
  },
  `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  `
    uniform float time;
    uniform vec3 colorA;
    uniform vec3 colorB;
    uniform float intensity;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - max(dot(viewDirection, normalize(vNormal)), 0.0), 2.2);
      float shimmer = 0.5 + 0.5 * sin(vWorldPosition.y * 3.0 + time * 1.4);
      vec3 color = mix(colorA, colorB, smoothstep(0.0, 1.0, fresnel + shimmer * 0.22));
      gl_FragColor = vec4(color * (0.45 + fresnel * 1.25) * intensity, 1.0);
    }
  `,
);

const ToonStripeMaterialImpl = shaderMaterial(
  {
    time: 0,
    colorA: new THREE.Color("#111827"),
    colorB: new THREE.Color("#facc15"),
    intensity: 1,
  },
  `
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float time;
    uniform vec3 colorA;
    uniform vec3 colorB;
    uniform float intensity;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      float bands = step(0.5, fract((vPosition.y + vPosition.x * 0.25 + time * 0.08) * 5.0));
      float light = smoothstep(-0.2, 0.85, dot(normalize(vNormal), normalize(vec3(-0.5, 0.8, 0.4))));
      vec3 color = mix(colorA, colorB, bands) * (0.45 + light * 0.75) * intensity;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
);

extend({ PlasmaMaterialImpl, GridGlowMaterialImpl, IridescentMaterialImpl, ToonStripeMaterialImpl });

declare module "@react-three/fiber" {
  interface ThreeElements {
    plasmaMaterialImpl: React.JSX.IntrinsicElements["shaderMaterial"] & {
      colorA?: THREE.Color;
      colorB?: THREE.Color;
      intensity?: number;
    };
    gridGlowMaterialImpl: React.JSX.IntrinsicElements["shaderMaterial"] & {
      color?: THREE.Color;
      lineWidth?: number;
      density?: number;
    };
    iridescentMaterialImpl: React.JSX.IntrinsicElements["shaderMaterial"] & {
      colorA?: THREE.Color;
      colorB?: THREE.Color;
      intensity?: number;
    };
    toonStripeMaterialImpl: React.JSX.IntrinsicElements["shaderMaterial"] & {
      colorA?: THREE.Color;
      colorB?: THREE.Color;
      intensity?: number;
    };
  }
}

function asVec3(value: Vec3 | undefined, fallback: Vec3): Vec3 {
  if (!Array.isArray(value)) return fallback;
  return [0, 1, 2].map((index) => {
    const next = Number(value[index]);
    return Number.isFinite(next) ? next : fallback[index];
  }) as Vec3;
}

function objectKey(value: unknown, fallback: string | number): string {
  if (value && typeof value === "object") {
    const obj = value as { statementId?: string; typeName?: string };
    return `${obj.statementId ?? fallback}:${obj.typeName ?? "unknown"}`;
  }
  return String(fallback);
}

function rigidBodyKey(prefix: string, props: Record<string, unknown>): string {
  const geometry = props.geometry ? elementType(props.geometry) ?? String(props.geometry) : "none";
  const scale = asVec3(props.scale as Vec3 | undefined, [1, 1, 1]).join(",");
  return `${prefix}:${String(props.bodyType ?? "dynamic")}:${String(props.collider ?? "ball")}:${geometry}:${scale}`;
}

function elementType(value: unknown): string | null {
  if (value && typeof value === "object" && "type" in value && "typeName" in value) {
    return String((value as ElementLike).typeName);
  }
  return null;
}

function elementProps<P = Record<string, unknown>>(value: unknown): P {
  if (value && typeof value === "object" && "props" in value) {
    return (value as ElementLike<P>).props;
  }
  return {} as P;
}

function RenderGeometry({ geometry }: { geometry: unknown }) {
  const type = elementType(geometry);
  const props = elementProps(geometry);

  if (type === "BoxGeometry") {
    const width = Number(props.width ?? 1);
    const height = Number(props.height ?? 1);
    const depth = Number(props.depth ?? 1);
    return <boxGeometry args={[width, height, depth]} />;
  }

  if (type === "SphereGeometry") {
    const radius = Number(props.radius ?? 1);
    const widthSegments = Number(props.widthSegments ?? 48);
    const heightSegments = Number(props.heightSegments ?? 24);
    return <sphereGeometry args={[radius, widthSegments, heightSegments]} />;
  }

  if (type === "PlaneGeometry") {
    const width = Number(props.width ?? 1);
    const height = Number(props.height ?? 1);
    return <planeGeometry args={[width, height]} />;
  }

  return <boxGeometry args={[1, 1, 1]} />;
}

function geometryDimensions(geometry: unknown, scale: Vec3): { box: Vec3; ballRadius: number } {
  const type = elementType(geometry);
  const props = elementProps(geometry);

  if (type === "SphereGeometry") {
    const radius = Number(props.radius ?? 1);
    const scaledRadius = radius * Math.max(Math.abs(scale[0]), Math.abs(scale[1]), Math.abs(scale[2]));
    return { box: [scaledRadius, scaledRadius, scaledRadius], ballRadius: scaledRadius };
  }

  const width = type === "BoxGeometry" ? Number(props.width ?? 1) : type === "PlaneGeometry" ? Number(props.width ?? 1) : 1;
  const height = type === "BoxGeometry" ? Number(props.height ?? 1) : type === "PlaneGeometry" ? 0.04 : 1;
  const depth = type === "BoxGeometry" ? Number(props.depth ?? 1) : type === "PlaneGeometry" ? Number(props.height ?? 1) : 1;
  const box: Vec3 = [
    Math.max(0.01, Math.abs(width * scale[0]) / 2),
    Math.max(0.01, Math.abs(height * scale[1]) / 2),
    Math.max(0.01, Math.abs(depth * scale[2]) / 2),
  ];
  return { box, ballRadius: Math.max(box[0], box[1], box[2]) };
}

function PlasmaMaterial({
  colorA,
  colorB,
  intensity,
}: {
  colorA: string;
  colorB: string;
  intensity: number;
}) {
  const ref = React.useRef<THREE.ShaderMaterial & { time: number }>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.time = clock.elapsedTime;
  });
  return (
    <plasmaMaterialImpl
      ref={ref}
      colorA={new THREE.Color(colorA)}
      colorB={new THREE.Color(colorB)}
      intensity={intensity}
    />
  );
}

function GridGlowMaterial({
  color,
  lineWidth,
  density,
}: {
  color: string;
  lineWidth: number;
  density: number;
}) {
  const ref = React.useRef<THREE.ShaderMaterial & { time: number }>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.time = clock.elapsedTime;
  });
  return (
    <gridGlowMaterialImpl
      ref={ref}
      transparent
      color={new THREE.Color(color)}
      lineWidth={lineWidth}
      density={density}
    />
  );
}

function AnimatedShaderMaterial({
  kind,
  colorA,
  colorB,
  intensity,
}: {
  kind: "iridescent" | "toonStripe";
  colorA: string;
  colorB: string;
  intensity: number;
}) {
  const ref = React.useRef<THREE.ShaderMaterial & { time: number }>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.time = clock.elapsedTime;
  });

  if (kind === "toonStripe") {
    return (
      <toonStripeMaterialImpl
        ref={ref}
        colorA={new THREE.Color(colorA)}
        colorB={new THREE.Color(colorB)}
        intensity={intensity}
      />
    );
  }

  return (
    <iridescentMaterialImpl
      ref={ref}
      colorA={new THREE.Color(colorA)}
      colorB={new THREE.Color(colorB)}
      intensity={intensity}
    />
  );
}

function RenderMaterial({ material }: { material: unknown }) {
  const type = elementType(material);
  const props = elementProps(material);

  if (type === "BasicMaterial") {
    return <meshBasicMaterial color={String(props.color ?? "#ffffff")} wireframe={Boolean(props.wireframe)} />;
  }

  if (type === "ShaderPreset") {
    const preset = String(props.preset ?? "plasma");
    const params = (props.params && typeof props.params === "object" ? props.params : {}) as Record<
      string,
      unknown
    >;

    if (preset === "gridGlow") {
      return (
        <GridGlowMaterial
          color={String(params.color ?? "#40f0c8")}
          lineWidth={Number(params.lineWidth ?? 0.045)}
          density={Number(params.density ?? 14)}
        />
      );
    }

    if (preset === "iridescent" || preset === "toonStripe") {
      return (
        <AnimatedShaderMaterial
          kind={preset}
          colorA={String(params.colorA ?? (preset === "toonStripe" ? "#111827" : "#5eead4"))}
          colorB={String(params.colorB ?? (preset === "toonStripe" ? "#facc15" : "#f472b6"))}
          intensity={Number(params.intensity ?? 1)}
        />
      );
    }

    return (
      <PlasmaMaterial
        colorA={String(params.colorA ?? "#35d0ff")}
        colorB={String(params.colorB ?? "#ff4fd8")}
        intensity={Number(params.intensity ?? 1)}
      />
    );
  }

  return (
    <meshStandardMaterial
      color={String(props.color ?? "#d8dee9")}
      metalness={Number(props.metalness ?? 0.1)}
      roughness={Number(props.roughness ?? 0.55)}
      wireframe={Boolean(props.wireframe)}
    />
  );
}

function RenderLight({ light }: { light: unknown }) {
  const type = elementType(light);
  const props = elementProps(light);

  if (type === "AmbientLight") {
    return <ambientLight intensity={Number(props.intensity ?? 0.45)} color={String(props.color ?? "#ffffff")} />;
  }

  if (type === "HemisphereLight") {
    return (
      <hemisphereLight
        args={[String(props.skyColor ?? "#c7ddff"), String(props.groundColor ?? "#24301f"), Number(props.intensity ?? 0.55)]}
      />
    );
  }

  return (
    <directionalLight
      position={asVec3(props.position as Vec3 | undefined, [5, 8, 5])}
      intensity={Number(props.intensity ?? 1)}
      color={String(props.color ?? "#ffffff")}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0002}
    />
  );
}

function DefaultLighting() {
  return (
    <>
      <ambientLight intensity={0.5} color="#ffffff" />
      <hemisphereLight args={["#f8fbff", "#d8cdb8", 0.58]} />
      <directionalLight
        position={[-10, 10, 5]}
        intensity={1.35}
        color="#fff5df"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      >
        <orthographicCamera attach="shadow-camera" args={[-14, 14, 14, -14, 0.5, 40]} />
      </directionalLight>
      <directionalLight position={[8, 5, -8]} intensity={0.52} color="#dbeafe" />
      <Environment resolution={32}>
        <Lightformer position={[10, 10, 10]} scale={10} intensity={4} />
        <Lightformer position={[10, 0, -10]} scale={10} color="#ff6b5d" intensity={5} />
        <Lightformer position={[-10, -10, -10]} scale={10} intensity={3} />
      </Environment>
    </>
  );
}

function RenderEffects({ preset }: { preset: string }) {
  if (preset === "none") return null;

  if (preset === "instanced") {
    return (
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <N8AO aoRadius={0.5} intensity={1} />
        <Bloom luminanceThreshold={1} intensity={0.5} levels={9} mipmapBlur />
      </EffectComposer>
    );
  }

  if (preset === "bruno") {
    return (
      <EffectComposer multisampling={0}>
        <N8AO aoRadius={0.5} intensity={1} />
        <DepthOfField target={[0, 0, -2.5]} focusRange={0.1} bokehScale={10} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <N8AO aoRadius={0.5} intensity={0.9} />
      <Bloom luminanceThreshold={1} intensity={0.28} levels={6} mipmapBlur />
      <Noise opacity={0.006} />
    </EffectComposer>
  );
}

function SceneCamera({ position, target, fov }: { position: Vec3; target: Vec3; fov: number }) {
  const ref = React.useRef<THREE.PerspectiveCamera>(null);
  const initializedRef = React.useRef(false);

  useEffect(() => {
    const camera = ref.current;
    if (!camera || initializedRef.current) return;
    camera.position.set(...position);
    camera.fov = fov;
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
    initializedRef.current = true;
  }, [fov, position, target]);

  return <PerspectiveCamera ref={ref} makeDefault />;
}

function DurableOrbitControls({ controls, target }: { controls: unknown; target: Vec3 }) {
  const props = elementProps(controls);
  const ref = React.useRef<React.ElementRef<typeof OrbitControls>>(null);
  const initializedRef = React.useRef(false);

  useEffect(() => {
    const controlsRef = ref.current;
    if (!controlsRef || initializedRef.current) return;
    controlsRef.target.set(...target);
    controlsRef.update();
    initializedRef.current = true;
  }, [target]);

  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enablePan={Boolean(props.enablePan ?? true)}
      enableZoom={Boolean(props.enableZoom ?? true)}
      enableRotate={Boolean(props.enableRotate ?? true)}
      enableDamping
      dampingFactor={0.08}
      autoRotate={Boolean(props.autoRotate ?? false)}
      autoRotateSpeed={Number(props.autoRotateSpeed ?? 0.1)}
      minDistance={Number(props.minDistance ?? 0.35)}
      maxDistance={Number(props.maxDistance ?? 160)}
      minPolarAngle={props.fixedPolarAngle ? Math.PI / 4 : undefined}
      maxPolarAngle={props.fixedPolarAngle ? Math.PI / 4 : undefined}
    />
  );
}

function KeyboardWalkController({ speed }: { speed: number }) {
  const { camera } = useThree();
  const pressed = React.useRef(new Set<string>());

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => pressed.current.add(event.code);
    const onKeyUp = (event: KeyboardEvent) => pressed.current.delete(event.code);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    right.crossVectors(direction, camera.up).normalize();

    const move = new THREE.Vector3();
    if (pressed.current.has("KeyW")) move.add(direction);
    if (pressed.current.has("KeyS")) move.sub(direction);
    if (pressed.current.has("KeyD")) move.add(right);
    if (pressed.current.has("KeyA")) move.sub(right);
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * delta);
      camera.position.add(move);
    }
  });

  return null;
}

function RenderControls({ controls, target }: { controls: unknown; target: Vec3 }) {
  const type = elementType(controls);
  const props = elementProps(controls);

  if (type === "WalkControls") {
    return (
      <>
        <PointerLockControls />
        <KeyboardWalkController speed={Number(props.speed ?? 4)} />
      </>
    );
  }

  return <DurableOrbitControls controls={controls} target={target} />;
}

function RenderMeshContents({ mesh }: { mesh: unknown }) {
  const props = elementProps(mesh);
  return (
    <mesh castShadow receiveShadow>
      <RenderGeometry geometry={props.geometry} />
      <RenderMaterial material={props.material} />
    </mesh>
  );
}

function RenderMesh({ mesh }: { mesh: unknown }) {
  const props = elementProps(mesh);
  return (
    <group
      position={asVec3(props.position as Vec3 | undefined, [0, 0, 0])}
      rotation={asVec3(props.rotation as Vec3 | undefined, [0, 0, 0])}
      scale={asVec3(props.scale as Vec3 | undefined, [1, 1, 1])}
    >
      <RenderMeshContents mesh={mesh} />
    </group>
  );
}

function RenderRigidMesh({ mesh }: { mesh: unknown }) {
  const props = elementProps(mesh);
  const bodyType = String(props.bodyType ?? "dynamic");
  const collider = String(props.collider ?? "ball");
  const scale = asVec3(props.scale as Vec3 | undefined, [1, 1, 1]);
  const dimensions = geometryDimensions(props.geometry, scale);
  const [spawnPosition] = useState(() => asVec3(props.position as Vec3 | undefined, [0, 0, 0]));
  const [spawnRotation] = useState(() => asVec3(props.rotation as Vec3 | undefined, [0, 0, 0]));
  const position = bodyType === "dynamic" ? spawnPosition : asVec3(props.position as Vec3 | undefined, [0, 0, 0]);
  const rotation = bodyType === "dynamic" ? spawnRotation : asVec3(props.rotation as Vec3 | undefined, [0, 0, 0]);

  if (collider === "trimesh") {
    return (
      <RigidBody
        key={rigidBodyKey(objectKey(mesh, "rigid-mesh"), props)}
        type={bodyType === "fixed" ? "fixed" : bodyType === "kinematic" ? "kinematicPosition" : "dynamic"}
        colliders="trimesh"
        position={position}
        rotation={rotation}
        scale={scale}
        restitution={Number(props.restitution ?? 0.45)}
        friction={Number(props.friction ?? 0.8)}
        mass={Number(props.mass ?? 1)}
      >
        <RenderMeshContents mesh={mesh} />
      </RigidBody>
    );
  }

  return (
    <RigidBody
      key={rigidBodyKey(objectKey(mesh, "rigid-mesh"), props)}
      type={bodyType === "fixed" ? "fixed" : bodyType === "kinematic" ? "kinematicPosition" : "dynamic"}
      colliders={false}
      position={position}
      rotation={rotation}
      restitution={Number(props.restitution ?? 0.45)}
      friction={Number(props.friction ?? 0.8)}
      mass={Number(props.mass ?? 1)}
    >
      {collider === "cuboid" ? (
        <CuboidCollider args={dimensions.box} />
      ) : (
        <BallCollider args={[dimensions.ballRadius]} />
      )}
      <group scale={scale}>
        <RenderMeshContents mesh={mesh} />
      </group>
    </RigidBody>
  );
}

function RenderFloor({ floor }: { floor: unknown }) {
  const props = elementProps(floor);
  const width = Number(props.width ?? 8);
  const depth = Number(props.depth ?? 8);
  const y = Number(props.y ?? 0);
  const thickness = Number(props.thickness ?? 0.3);
  const position = asVec3(props.position as Vec3 | undefined, [0, 0, 0]);
  const centerY = y - thickness / 2;

  return (
    <RigidBody type="fixed" colliders={false} position={[position[0], centerY, position[2]]}>
      <CuboidCollider args={[width / 2, thickness / 2, depth / 2]} restitution={0.2} friction={1} />
    </RigidBody>
  );
}

function RoadChunk({ chunk }: { chunk: unknown }) {
  const props = elementProps(chunk);
  return (
    <RigidBody
      key={rigidBodyKey(objectKey(chunk, "road-chunk"), {
        ...props,
        bodyType: "fixed",
        collider: "cuboid",
        geometry: "road",
        scale: [
          Number(props.width ?? 3),
          Number(props.thickness ?? 0.16),
          Number(props.length ?? 4),
        ],
      })}
      type="fixed"
      colliders="cuboid"
      position={asVec3(props.position as Vec3 | undefined, [0, 0, 0])}
      rotation={asVec3(props.rotation as Vec3 | undefined, [0, 0, 0])}
      restitution={0.2}
      friction={1}
    >
      <mesh receiveShadow>
        <boxGeometry
          args={[
            Number(props.width ?? 3),
            Number(props.thickness ?? 0.16),
            Number(props.length ?? 4),
          ]}
        />
        <RenderMaterial material={props.material} />
      </mesh>
    </RigidBody>
  );
}

function InteractiveDoor({ door }: { door: unknown }) {
  const props = elementProps(door);
  const [open, setOpen] = useState(false);
  const doorColor = String(props.doorColor ?? "#6b4f3b");
  const buttonColor = open ? "#22c55e" : String(props.buttonColor ?? "#ef4444");
  const label = open ? "OPEN" : String(props.label ?? "PUSH");

  return (
    <group
      position={asVec3(props.position as Vec3 | undefined, [0, 1.5, -8])}
      rotation={asVec3(props.rotation as Vec3 | undefined, [0, 0, 0])}
    >
      <RigidBody type="fixed" colliders="cuboid" position={[-1.35, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.25, 3, 0.35]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.7} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[1.35, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.25, 3, 0.35]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.7} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[0, 1.4, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3, 0.25, 0.35]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.7} />
        </mesh>
      </RigidBody>
      {!open && (
        <RigidBody type="fixed" colliders="cuboid" position={[0, -0.18, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.25, 2.65, 0.22]} />
            <meshStandardMaterial color={doorColor} metalness={0.05} roughness={0.55} />
          </mesh>
        </RigidBody>
      )}
      <group position={[1.9, -0.05, 0.15]} onClick={(event) => {
        event.stopPropagation();
        setOpen(true);
      }}>
        <mesh castShadow>
          <boxGeometry args={[0.78, 0.42, 0.18]} />
          <meshStandardMaterial color={buttonColor} emissive={buttonColor} emissiveIntensity={0.25} />
        </mesh>
        <Text position={[0, 0, 0.11]} fontSize={0.13} anchorX="center" anchorY="middle">
          {label}
          <meshBasicMaterial color="#ffffff" />
        </Text>
      </group>
    </group>
  );
}

function RenderRigidText({ textObject }: { textObject: unknown }) {
  const props = elementProps(textObject);
  const text = String(props.text ?? "");
  const size = Number(props.size ?? 1);
  const colliderWidth = Math.max(0.28, text.length * size * 0.34);
  const colliderHeight = Math.max(0.35, size * 0.58);
  const colliderDepth = Math.max(0.12, size * 0.12);
  const [spawnPosition] = useState(() => asVec3(props.position as Vec3 | undefined, [0, 3, 0]));
  const [spawnRotation] = useState(() => asVec3(props.rotation as Vec3 | undefined, [0, 0, 0]));

  return (
    <RigidBody
      key={rigidBodyKey(objectKey(textObject, "rigid-text"), {
        ...props,
        bodyType: "dynamic",
        collider: "cuboid",
        geometry: "text",
      })}
      type="dynamic"
      colliders={false}
      position={spawnPosition}
      rotation={spawnRotation}
      restitution={Number(props.restitution ?? 0.55)}
      friction={Number(props.friction ?? 0.75)}
      mass={Number(props.mass ?? 0.8)}
    >
      <CuboidCollider args={[colliderWidth, colliderHeight, colliderDepth]} />
      <Text
        fontSize={size}
        anchorX="center"
        anchorY="middle"
        castShadow
        receiveShadow
      >
        {text}
        <RenderMaterial material={props.material} />
      </Text>
    </RigidBody>
  );
}

function RenderLabel({ label }: { label: unknown }) {
  const props = elementProps(label);
  const background = String(props.background ?? "");
  const padding = Number(props.padding ?? 0.18);
  const width = Math.max(0.2, Number(props.width ?? 1.6));
  const height = Math.max(0.12, Number(props.height ?? 0.46));

  return (
    <group
      position={asVec3(props.position as Vec3 | undefined, [0, 0.7, 0.55])}
      rotation={asVec3(props.rotation as Vec3 | undefined, [0, 0, 0])}
      scale={asVec3(props.scale as Vec3 | undefined, [1, 1, 1])}
    >
      {background && (
        <mesh position={[0, 0, -0.012]}>
          <planeGeometry args={[width + padding, height + padding]} />
          <meshBasicMaterial color={background} transparent opacity={Number(props.backgroundOpacity ?? 0.82)} />
        </mesh>
      )}
      <Text
        fontSize={Number(props.size ?? 0.28)}
        maxWidth={Number(props.maxWidth ?? width)}
        anchorX="center"
        anchorY="middle"
        textAlign="center"
      >
        {String(props.text ?? "")}
        <meshBasicMaterial color={String(props.color ?? "#111827")} toneMapped={false} />
      </Text>
    </group>
  );
}

function RenderText3D({ textObject }: { textObject: unknown }) {
  const props = elementProps(textObject);
  return (
    <Text
      position={asVec3(props.position as Vec3 | undefined, [0, 1, 0])}
      rotation={asVec3(props.rotation as Vec3 | undefined, [0, 0, 0])}
      scale={asVec3(props.scale as Vec3 | undefined, [1, 1, 1])}
      fontSize={Number(props.size ?? 0.5)}
      maxWidth={Number(props.maxWidth ?? 6)}
      anchorX="center"
      anchorY="middle"
      textAlign="center"
      castShadow
      receiveShadow
    >
      {String(props.text ?? "")}
      <RenderMaterial material={props.material} />
    </Text>
  );
}

function RenderGroup({ group }: { group: unknown }) {
  const props = elementProps(group);
  const children = Array.isArray(props.objects) ? props.objects : [];
  return (
    <group
      position={asVec3(props.position as Vec3 | undefined, [0, 0, 0])}
      rotation={asVec3(props.rotation as Vec3 | undefined, [0, 0, 0])}
      scale={asVec3(props.scale as Vec3 | undefined, [1, 1, 1])}
    >
      {children.map((child, index) => (
        <RenderObject key={objectKey(child, index)} object={child} />
      ))}
    </group>
  );
}

function numericProp(value: unknown, fallback: number, min: number, max: number) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.min(max, Math.max(min, next));
}

function colorPalette(value: unknown): string[] {
  if (!Array.isArray(value)) return PMNDRS_PALETTE;
  const palette = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return palette.length > 0 ? palette : PMNDRS_PALETTE;
}

function RenderInstancedCubes({ cubes }: { cubes: unknown }) {
  const props = elementProps(cubes);
  const count = Math.floor(numericProp(props.count, 1000, 1, 20000));
  const grid = Math.max(1, Math.ceil(numericProp(props.grid, Math.cbrt(count), 1, 80)));
  const size = numericProp(props.size, 0.6, 0.02, 8);
  const spread = numericProp(props.spread, 1, 0.05, 12);
  const palette = useMemo(() => colorPalette(props.palette), [props.palette]);
  const [hovered, setHovered] = useState<number | undefined>();
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const previousHoveredRef = React.useRef<number | undefined>(undefined);
  const tempObjectRef = React.useRef(new THREE.Object3D());
  const tempColorRef = React.useRef(new THREE.Color());
  const colorArray = useMemo(
    () =>
      Float32Array.from(
        Array.from({ length: count }).flatMap((_, index) =>
          new THREE.Color(palette[index % palette.length]).toArray(),
        ),
      ),
    [count, palette],
  );

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const time = clock.getElapsedTime();
    const tempObject = tempObjectRef.current;
    const tempColor = tempColorRef.current;
    mesh.rotation.x = Math.sin(time / 4);
    mesh.rotation.y = Math.sin(time / 2);

    let id = 0;
    const half = grid / 2;
    for (let x = 0; x < grid; x += 1) {
      for (let y = 0; y < grid; y += 1) {
        for (let z = 0; z < grid; z += 1) {
          if (id >= count) break;
          tempObject.position.set((half - x) * spread, (half - y) * spread, (half - z) * spread);
          tempObject.rotation.y =
            Math.sin(x / 4 + time) + Math.sin(y / 4 + time) + Math.sin(z / 4 + time);
          tempObject.rotation.z = tempObject.rotation.y * 2;
          tempObject.updateMatrix();
          mesh.setMatrixAt(id, tempObject.matrix);

          if (hovered !== previousHoveredRef.current) {
            const color = id === hovered ? tempColor.setRGB(10, 10, 10) : tempColor.set(palette[id % palette.length]);
            color.toArray(colorArray, id * 3);
          }
          id += 1;
        }
      }
    }

    if (hovered !== previousHoveredRef.current) {
      const colorAttribute = mesh.geometry.attributes.color;
      if (colorAttribute) colorAttribute.needsUpdate = true;
      previousHoveredRef.current = hovered;
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group
      position={asVec3(props.position as Vec3 | undefined, [0, 0, 0])}
      rotation={asVec3(props.rotation as Vec3 | undefined, [0, 0, 0])}
      scale={asVec3(props.scale as Vec3 | undefined, [1, 1, 1])}
    >
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        castShadow
        receiveShadow
        onPointerMove={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          setHovered(event.instanceId);
        }}
        onPointerOut={() => setHovered(undefined)}
      >
        <boxGeometry args={[size, size, size]}>
          <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
        </boxGeometry>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

type LoadedGltf = {
  scene: THREE.Group;
};

function cloneWithShadows(scene: THREE.Group) {
  const clone = scene.clone(true);
  clone.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return clone;
}

function seededRandom(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function randomSpread(index: number, salt: number, width: number) {
  return (seededRandom(index, salt) - 0.5) * width;
}

function BrunoSceneModel({ position }: { position: Vec3 }) {
  const gltf = useGLTF("/models/bruno-20k.glb") as LoadedGltf;
  const scene = useMemo(() => cloneWithShadows(gltf.scene), [gltf.scene]);

  return (
    <RigidBody type="fixed" colliders="trimesh" position={position}>
      <primitive object={scene} />
    </RigidBody>
  );
}

function BrunoHats({ count }: { count: number }) {
  const gltf = useGLTF("/models/bruno-20k-hat.glb") as LoadedGltf;
  const hats = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        key: index,
        object: cloneWithShadows(gltf.scene),
        position: [randomSpread(index, 1, 2) + 1, 10 + index / 2, randomSpread(index, 2, 2) - 2] as Vec3,
        rotation: [
          seededRandom(index, 3) * Math.PI,
          seededRandom(index, 4) * Math.PI,
          seededRandom(index, 5) * Math.PI,
        ] as Vec3,
      })),
    [count, gltf.scene],
  );

  return (
    <>
      {hats.map((hat) => (
        <RigidBody key={hat.key} colliders="hull" position={hat.position} rotation={hat.rotation}>
          <primitive object={hat.object} />
        </RigidBody>
      ))}
    </>
  );
}

function RenderBrunoChallenge({ challenge }: { challenge: unknown }) {
  const props = elementProps(challenge);
  const count = Math.floor(numericProp(props.hatCount, 80, 1, 240));

  return (
    <group
      position={asVec3(props.position as Vec3 | undefined, [0, 0, 0])}
      rotation={asVec3(props.rotation as Vec3 | undefined, [0, 0, 0])}
      scale={asVec3(props.scale as Vec3 | undefined, [1, 1, 1])}
    >
      <BrunoSceneModel position={[1, 0, -1.5]} />
      <BrunoHats count={count} />
      <RigidBody type="fixed" colliders="cuboid" position={[0, -1, 0]}>
        <mesh visible={false}>
          <boxGeometry args={[1000, 2, 1000]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>
    </group>
  );
}

useGLTF.preload("/models/bruno-20k.glb");
useGLTF.preload("/models/bruno-20k-hat.glb");

type GeoJsonFeature = {
  type: "Feature";
  properties?: Record<string, unknown>;
  geometry?: {
    type: "Polygon" | "MultiPolygon" | "LineString" | "MultiLineString";
    coordinates: unknown;
  };
};

type GeoJsonCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

function coordinatesOfPolygon(feature: GeoJsonFeature): number[][][] {
  const geometry = feature.geometry;
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [(geometry.coordinates as number[][][])[0] ?? []];
  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates as number[][][][]).map((polygon) => polygon[0] ?? []);
  }
  return [];
}

function lineCoordinates(feature: GeoJsonFeature): number[][][] {
  const geometry = feature.geometry;
  if (!geometry) return [];
  if (geometry.type === "LineString") return [geometry.coordinates as number[][]];
  if (geometry.type === "MultiLineString") return geometry.coordinates as number[][][];
  return [];
}

function useGeoJson(url: string) {
  const [data, setData] = useState<GeoJsonCollection | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`GeoJSON request failed: ${response.status}`);
        return response.json();
      })
      .then((json) => {
        if (!cancelled) setData(json as GeoJsonCollection);
      })
      .catch(() => {
        if (!cancelled) setData({ type: "FeatureCollection", features: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  return data;
}

function lonLatToScene([lon, lat]: number[], origin: Vec3, scale: number): [number, number] {
  return [(lon - origin[0]) * scale, -(lat - origin[2]) * scale];
}

function GeoJsonExtrusionLayer({ layer }: { layer: unknown }) {
  const props = elementProps(layer);
  const source = elementProps(props.source);
  const url = String(source.url ?? "/api/geojson/demo-city");
  const data = useGeoJson(url);
  const origin = asVec3(props.origin as Vec3 | undefined, [-122.4194, 0, 37.7749]);
  const scale = Number(props.scale ?? 9000);
  const heightField = String(props.heightField ?? "height");
  const defaultHeight = Number(props.defaultHeight ?? 20);
  const material = props.material;

  const shapes = useMemo(() => {
    if (!data) return [];
    return data.features.flatMap((feature, featureIndex) => {
      const height = Number(feature.properties?.[heightField] ?? defaultHeight);
      return coordinatesOfPolygon(feature).map((outer, polygonIndex) => {
        const shape = new THREE.Shape();
        outer.forEach((coord, index) => {
          const [x, z] = lonLatToScene(coord, origin, scale);
          if (index === 0) shape.moveTo(x, z);
          else shape.lineTo(x, z);
        });
        return { key: `${featureIndex}-${polygonIndex}`, shape, height };
      });
    });
  }, [data, defaultHeight, heightField, origin, scale]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {shapes.map(({ key, shape, height }) => (
        <mesh key={key} castShadow receiveShadow>
          <extrudeGeometry args={[shape, { depth: height, bevelEnabled: false }]} />
          <RenderMaterial material={material} />
        </mesh>
      ))}
    </group>
  );
}

function GeoJsonPolygonLayer({ layer }: { layer: unknown }) {
  const props = elementProps(layer);
  const source = elementProps(props.source);
  const url = String(source.url ?? "/api/geojson/dataset/south-america-lakes");
  const data = useGeoJson(url);
  const origin = asVec3(props.origin as Vec3 | undefined, [-60, 0, -15]);
  const scale = Number(props.scale ?? 0.45);
  const y = Number(props.y ?? 0.12);
  const material = props.material;

  const shapes = useMemo(() => {
    if (!data) return [];
    return data.features.flatMap((feature, featureIndex) =>
      coordinatesOfPolygon(feature).map((outer, polygonIndex) => {
        const shape = new THREE.Shape();
        outer.forEach((coord, index) => {
          const [x, z] = lonLatToScene(coord, origin, scale);
          if (index === 0) shape.moveTo(x, z);
          else shape.lineTo(x, z);
        });
        return { key: `${featureIndex}-${polygonIndex}`, shape };
      }),
    );
  }, [data, origin, scale]);

  return (
    <group position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {shapes.map(({ key, shape }) => (
        <mesh key={key} receiveShadow>
          <shapeGeometry args={[shape]} />
          <RenderMaterial material={material} />
        </mesh>
      ))}
    </group>
  );
}

function LineLayer({ layer }: { layer: unknown }) {
  const props = elementProps(layer);
  const source = elementProps(props.source);
  const url = String(source.url ?? "/api/geojson/demo-city?layer=roads");
  const data = useGeoJson(url);
  const origin = asVec3(props.origin as Vec3 | undefined, [-122.4194, 0, 37.7749]);
  const scale = Number(props.scale ?? 9000);
  const color = String(props.color ?? "#1f2937");
  const y = Number(props.y ?? 0.08);

  const lines = useMemo(() => {
    if (!data) return [];
    return data.features.flatMap((feature, featureIndex) =>
      lineCoordinates(feature).map((line, lineIndex) => {
        const points = line.map((coord) => {
          const [x, z] = lonLatToScene(coord, origin, scale);
          return new THREE.Vector3(x, y, z);
        });
        return { key: `${featureIndex}-${lineIndex}`, points };
      }),
    );
  }, [data, origin, scale, y]);

  return (
    <group>
      {lines.map(({ key, points }) => (
        <line key={key}>
          <bufferGeometry setFromPoints={points} />
          <lineBasicMaterial color={color} linewidth={2} />
        </line>
      ))}
    </group>
  );
}

function TerrainLayer({ layer }: { layer: unknown }) {
  const props = elementProps(layer);
  return (
    <mesh
      position={asVec3(props.position as Vec3 | undefined, [0, -0.04, 0])}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[Number(props.width ?? 42), Number(props.depth ?? 42), 32, 32]} />
      <RenderMaterial material={props.material} />
    </mesh>
  );
}

function RenderObject({ object }: { object: unknown }) {
  const type = elementType(object);

  if (type === "Mesh") return <RenderMesh mesh={object} />;
  if (type === "InstancedCubes") return <RenderInstancedCubes cubes={object} />;
  if (type === "BrunoChallenge") return <RenderBrunoChallenge challenge={object} />;
  if (type === "RigidMesh") return <RenderRigidMesh mesh={object} />;
  if (type === "RigidText") return <RenderRigidText textObject={object} />;
  if (type === "Label") return <RenderLabel label={object} />;
  if (type === "Text3D") return <RenderText3D textObject={object} />;
  if (type === "Floor") return <RenderFloor floor={object} />;
  if (type === "RoadChunk") return <RoadChunk chunk={object} />;
  if (type === "InteractiveDoor") return <InteractiveDoor door={object} />;
  if (type === "Group") return <RenderGroup group={object} />;
  if (type === "GeoJsonExtrusionLayer") return <GeoJsonExtrusionLayer layer={object} />;
  if (type === "GeoJsonPolygonLayer") return <GeoJsonPolygonLayer layer={object} />;
  if (type === "LineLayer") return <LineLayer layer={object} />;
  if (type === "TerrainLayer") return <TerrainLayer layer={object} />;

  return null;
}

const PerspectiveCamera3D = defineComponent({
  name: "PerspectiveCamera",
  description: "Perspective camera: position vec3, target vec3, field of view degrees.",
  props: z.object({
    position: vec3Schema,
    target: vec3Schema,
    fov: z.number().default(45),
  }),
  component: () => null,
});

const OrbitControls3D = defineComponent({
  name: "OrbitControls",
  description:
    "Interactive orbit controls: enable pan, zoom, rotate, optional slow auto-rotate, optional fixed Bruno-style camera angle, and zoom distance limits.",
  props: z.object({
    enablePan: z.boolean().default(true),
    enableZoom: z.boolean().default(true),
    enableRotate: z.boolean().default(true),
    autoRotate: z.boolean().default(false),
    autoRotateSpeed: z.number().default(0.1),
    fixedPolarAngle: z.boolean().default(false),
    minDistance: z.number().default(0.35),
    maxDistance: z.number().default(160),
  }),
  component: () => null,
});

const WalkControls3D = defineComponent({
  name: "WalkControls",
  description:
    "First-person walk controls. Click the canvas to lock pointer, use WASD to walk, mouse to look.",
  props: z.object({
    speed: z.number().default(4),
  }),
  component: () => null,
});

const AmbientLight3D = defineComponent({
  name: "AmbientLight",
  description: "Ambient light with intensity and color.",
  props: z.object({
    intensity: z.number(),
    color: colorSchema.default("#ffffff"),
  }),
  component: () => null,
});

const HemisphereLight3D = defineComponent({
  name: "HemisphereLight",
  description: "Hemisphere light with sky color, ground color, and intensity.",
  props: z.object({
    skyColor: colorSchema,
    groundColor: colorSchema,
    intensity: z.number(),
  }),
  component: () => null,
});

const DirectionalLight3D = defineComponent({
  name: "DirectionalLight",
  description: "Directional light: position vec3, intensity, color.",
  props: z.object({
    position: vec3Schema,
    intensity: z.number(),
    color: colorSchema.default("#ffffff"),
  }),
  component: () => null,
});

const BoxGeometry3D = defineComponent({
  name: "BoxGeometry",
  description: "Box geometry with width, height, and depth.",
  props: z.object({
    width: z.number(),
    height: z.number(),
    depth: z.number(),
  }),
  component: () => null,
});

const SphereGeometry3D = defineComponent({
  name: "SphereGeometry",
  description: "Sphere geometry with radius and segment counts.",
  props: z.object({
    radius: z.number(),
    widthSegments: z.number().default(48),
    heightSegments: z.number().default(24),
  }),
  component: () => null,
});

const PlaneGeometry3D = defineComponent({
  name: "PlaneGeometry",
  description: "Plane geometry with width and height.",
  props: z.object({
    width: z.number(),
    height: z.number(),
  }),
  component: () => null,
});

const StandardMaterial3D = defineComponent({
  name: "StandardMaterial",
  description: "Physically lit material: color, metalness, roughness, optional wireframe.",
  props: z.object({
    color: colorSchema,
    metalness: z.number().default(0.1),
    roughness: z.number().default(0.55),
    wireframe: z.boolean().default(false),
  }),
  component: () => null,
});

const BasicMaterial3D = defineComponent({
  name: "BasicMaterial",
  description: "Unlit material: color and optional wireframe.",
  props: z.object({
    color: colorSchema,
    wireframe: z.boolean().default(false),
  }),
  component: () => null,
});

const ShaderPreset3D = defineComponent({
  name: "ShaderPreset",
  description:
    "Safe shader-like material preset. Presets: plasma, gridGlow, iridescent, toonStripe. Params object controls colors, visual density, and intensity.",
  props: z.object({
    preset: z.enum(["plasma", "gridGlow", "iridescent", "toonStripe"]),
    params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  }),
  component: () => null,
});

const Mesh3D = defineComponent({
  name: "Mesh",
  description: "Renderable mesh: geometry, material, position vec3, rotation vec3 radians, scale vec3.",
  props: z.object({
    geometry: anyElementSchema,
    material: anyElementSchema,
    position: vec3Schema.default([0, 0, 0]),
    rotation: vec3Schema.default([0, 0, 0]),
    scale: vec3Schema.default([1, 1, 1]),
  }),
  component: () => null,
});

const InstancedCubes3D = defineComponent({
  name: "InstancedCubes",
  description:
    "Animated instanced cube field with vertex colors. Use for high-quality PMNDRS-style colorful cube clouds without emitting many Mesh statements.",
  props: z.object({
    count: z.number().default(1000),
    grid: z.number().default(10),
    size: z.number().default(0.6),
    spread: z.number().default(1),
    palette: z.array(colorSchema).default(PMNDRS_PALETTE),
    position: vec3Schema.default([0, 0, 0]),
    rotation: vec3Schema.default([0, 0, 0]),
    scale: vec3Schema.default([1, 1, 1]),
  }),
  component: () => null,
});

const BrunoChallenge3D = defineComponent({
  name: "BrunoChallenge",
  description:
    "PMNDRS Bruno Simon 20k challenge preset using the original GLB base and falling hats. Use for prompts that ask for the Bruno 20k example or a very high-quality physics/showcase scene.",
  props: z.object({
    hatCount: z.number().default(80),
    position: vec3Schema.default([0, 0, 0]),
    rotation: vec3Schema.default([0, 0, 0]),
    scale: vec3Schema.default([1, 1, 1]),
  }),
  component: () => null,
});

const RigidMesh3D = defineComponent({
  name: "RigidMesh",
  description:
    "Physics mesh. Use dynamic for falling/bouncing objects and fixed cuboid boxes for floors/walls.",
  props: z.object({
    geometry: anyElementSchema,
    material: anyElementSchema,
    position: vec3Schema.default([0, 0, 0]),
    rotation: vec3Schema.default([0, 0, 0]),
    scale: vec3Schema.default([1, 1, 1]),
    bodyType: z.enum(["dynamic", "fixed", "kinematic"]).default("dynamic"),
    collider: z.enum(["ball", "cuboid", "trimesh"]).default("ball"),
    restitution: z.number().default(0.45),
    friction: z.number().default(0.8),
    mass: z.number().default(1),
  }),
  component: () => null,
});

const RigidText3D = defineComponent({
  name: "RigidText",
  description:
    "Physics text body. Use one RigidText per letter when streaming falling letters into a scene.",
  props: z.object({
    text: z.string(),
    material: anyElementSchema,
    position: vec3Schema.default([0, 3, 0]),
    rotation: vec3Schema.default([0, 0, 0]),
    size: z.number().default(1),
    restitution: z.number().default(0.55),
    friction: z.number().default(0.75),
    mass: z.number().default(0.8),
  }),
  component: () => null,
});

const Label3D = defineComponent({
  name: "Label",
  description:
    "Flat 3D text label. Place it just in front of or above a shape to write text on cubes, spheres, panels, map features, or imported objects.",
  props: z.object({
    text: z.string(),
    position: vec3Schema.default([0, 0.7, 0.55]),
    rotation: vec3Schema.default([0, 0, 0]),
    scale: vec3Schema.default([1, 1, 1]),
    size: z.number().default(0.28),
    color: colorSchema.default("#111827"),
    maxWidth: z.number().default(1.4),
    background: colorSchema.default(""),
    backgroundOpacity: z.number().default(0.82),
    width: z.number().default(1.6),
    height: z.number().default(0.46),
    padding: z.number().default(0.18),
  }),
  component: () => null,
});

const Text3D = defineComponent({
  name: "Text3D",
  description:
    "Renderable 3D text using a material. Use for non-physics text floating in the scene or labels that should look like scene geometry. Use RigidText instead for falling/colliding letters.",
  props: z.object({
    text: z.string(),
    material: anyElementSchema,
    position: vec3Schema.default([0, 1, 0]),
    rotation: vec3Schema.default([0, 0, 0]),
    scale: vec3Schema.default([1, 1, 1]),
    size: z.number().default(0.5),
    maxWidth: z.number().default(6),
  }),
  component: () => null,
});

const Floor3D = defineComponent({
  name: "Floor",
  description:
    "Reliable fixed physics floor with a top surface at y. Use this for physics trays so falling objects rest on the surface instead of intersecting a scaled box.",
  props: z.object({
    material: anyElementSchema,
    width: z.number().default(8),
    depth: z.number().default(8),
    y: z.number().default(0),
    thickness: z.number().default(0.3),
    position: vec3Schema.default([0, 0, 0]),
  }),
  component: () => null,
});

const RoadChunk3D = defineComponent({
  name: "RoadChunk",
  description:
    "Fixed walkable road/path segment. Stream multiple chunks to create a walkway toward a destination.",
  props: z.object({
    material: anyElementSchema,
    position: vec3Schema.default([0, 0, 0]),
    rotation: vec3Schema.default([0, 0, 0]),
    width: z.number().default(3),
    length: z.number().default(4),
    thickness: z.number().default(0.16),
  }),
  component: () => null,
});

const InteractiveDoor3D = defineComponent({
  name: "InteractiveDoor",
  description:
    "A doorway with a clickable 3D button. Clicking the button opens/removes the door panel.",
  props: z.object({
    position: vec3Schema.default([0, 1.5, -8]),
    rotation: vec3Schema.default([0, 0, 0]),
    doorColor: colorSchema.default("#6b4f3b"),
    buttonColor: colorSchema.default("#ef4444"),
    label: z.string().default("PUSH"),
  }),
  component: () => null,
});

const Group3D = defineComponent({
  name: "Group",
  description: "Group of scene objects with transform.",
  props: z.object({
    objects: z.array(anyElementSchema),
    position: vec3Schema.default([0, 0, 0]),
    rotation: vec3Schema.default([0, 0, 0]),
    scale: vec3Schema.default([1, 1, 1]),
  }),
  component: () => null,
});

const DataSource3D = defineComponent({
  name: "DataSource",
  description:
    "External data source for large 3D layers. Use kind 'geojson' and a URL such as '/api/geojson/demo-city'.",
  props: z.object({
    kind: z.enum(["geojson"]),
    url: z.string(),
  }),
  component: () => null,
});

const GeoJsonExtrusionLayer3D = defineComponent({
  name: "GeoJsonExtrusionLayer",
  description:
    "Extrudes GeoJSON Polygon/MultiPolygon features into buildings. Use for map buildings and city blocks.",
  props: z.object({
    source: DataSource3D.ref,
    material: anyElementSchema,
    heightField: z.string().default("height"),
    defaultHeight: z.number().default(20),
    origin: vec3Schema.default([-122.4194, 0, 37.7749]),
    scale: z.number().default(9000),
  }),
  component: () => null,
});

const GeoJsonPolygonLayer3D = defineComponent({
  name: "GeoJsonPolygonLayer",
  description:
    "Renders GeoJSON Polygon/MultiPolygon features as flat filled shapes. Use for lakes, regions, countries, masks, and filled map overlays.",
  props: z.object({
    source: DataSource3D.ref,
    material: anyElementSchema,
    y: z.number().default(0.12),
    origin: vec3Schema.default([-60, 0, -15]),
    scale: z.number().default(0.45),
  }),
  component: () => null,
});

const LineLayer3D = defineComponent({
  name: "LineLayer",
  description: "Draws GeoJSON LineString/MultiLineString features as map roads or paths.",
  props: z.object({
    source: DataSource3D.ref,
    color: colorSchema.default("#1f2937"),
    y: z.number().default(0.08),
    origin: vec3Schema.default([-122.4194, 0, 37.7749]),
    scale: z.number().default(9000),
  }),
  component: () => null,
});

const TerrainLayer3D = defineComponent({
  name: "TerrainLayer",
  description: "Flat terrain plane placeholder for scalable terrain/map environments.",
  props: z.object({
    material: anyElementSchema,
    width: z.number().default(42),
    depth: z.number().default(42),
    position: vec3Schema.default([0, -0.04, 0]),
  }),
  component: () => null,
});

const Scene3D = defineComponent({
  name: "Scene3D",
  description:
    "Root 3D scene. Provide camera, lights, scene objects/layers, controls, background color, and optional ground color.",
  props: z.object({
    camera: PerspectiveCamera3D.ref,
    lights: z.array(
      z.union([AmbientLight3D.ref, HemisphereLight3D.ref, DirectionalLight3D.ref]),
    ),
    objects: z.array(anyElementSchema),
    controls: z.union([OrbitControls3D.ref, WalkControls3D.ref]).optional(),
    background: colorSchema.default("#f0f0f0"),
    gravity: vec3Schema.default([0, -9.81, 0]),
    effects: z.enum(["standard", "instanced", "bruno", "none"]).default("standard"),
  }),
  component: ({ props }) => {
    const camera = elementProps(props.camera);
    const target = asVec3(camera.target as Vec3 | undefined, [0, 0, 0]);

    return (
      <div className="h-[72vh] min-h-[520px] w-full overflow-hidden rounded-lg border border-zinc-200 bg-[#f0f0f0] shadow-sm">
        <Canvas
          flat
          shadows
          dpr={[1, 2]}
          gl={{ antialias: false, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.1;
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
        >
          <color attach="background" args={[props.background]} />
          <fog attach="fog" args={[props.background, 45, 115]} />
          <SceneCamera
            position={asVec3(camera.position as Vec3 | undefined, [6, 5, 8])}
            target={target}
            fov={Number(camera.fov ?? 45)}
          />
          <RenderControls controls={props.controls} target={target} />
          <Suspense fallback={null}>
            <DefaultLighting />
            {props.lights.map((light, index) => (
              <RenderLight key={index} light={light} />
            ))}
            <Physics gravity={props.gravity}>
              {props.objects.map((object, index) => (
                <RenderObject key={objectKey(object, index)} object={object} />
              ))}
            </Physics>
            <RenderEffects preset={String(props.effects ?? "standard")} />
          </Suspense>
        </Canvas>
      </div>
    );
  },
});

export const openui3dLibrary = createLibrary({
  root: "Scene3D",
  components: [
    Scene3D,
    PerspectiveCamera3D,
    OrbitControls3D,
    WalkControls3D,
    AmbientLight3D,
    HemisphereLight3D,
    DirectionalLight3D,
    BoxGeometry3D,
    SphereGeometry3D,
    PlaneGeometry3D,
    StandardMaterial3D,
    BasicMaterial3D,
    ShaderPreset3D,
    Mesh3D,
    InstancedCubes3D,
    BrunoChallenge3D,
    RigidMesh3D,
    RigidText3D,
    Label3D,
    Text3D,
    Floor3D,
    RoadChunk3D,
    InteractiveDoor3D,
    Group3D,
    DataSource3D,
    GeoJsonExtrusionLayer3D,
    GeoJsonPolygonLayer3D,
    LineLayer3D,
    TerrainLayer3D,
  ],
  componentGroups: [
    {
      name: "Scene",
      components: ["Scene3D", "PerspectiveCamera", "OrbitControls", "WalkControls"],
      notes: ["Always define root = Scene3D(...) first so the canvas appears while details stream."],
    },
    {
      name: "Lighting",
      components: ["AmbientLight", "HemisphereLight", "DirectionalLight"],
    },
    {
      name: "Meshes",
      components: [
        "Mesh",
        "InstancedCubes",
        "BrunoChallenge",
        "RigidMesh",
        "RigidText",
        "Label",
        "Text3D",
        "Floor",
        "RoadChunk",
        "InteractiveDoor",
        "Group",
        "BoxGeometry",
        "SphereGeometry",
        "PlaneGeometry",
      ],
      notes: [
        "For physics demos, use RigidMesh with bodyType dynamic for balls/blocks and bodyType fixed with collider cuboid for floors and walls.",
        "For reliable floors, prefer Floor over a manually scaled RigidMesh.",
        "For streaming text, define one RigidText per character and include the refs in root.objects so letters appear as their statements stream.",
        "To write text on shapes, use a Mesh or RigidMesh plus a nearby Label with matching position and rotation.",
        "Use InstancedCubes for high-quality colorful PMNDRS-style cube fields instead of emitting hundreds of Mesh statements.",
        "Use BrunoChallenge for the Bruno Simon 20k PMNDRS example instead of approximating it with primitive boxes.",
        "For walk-through demos, use WalkControls, RoadChunk segments, and InteractiveDoor at the end of the path.",
      ],
    },
    {
      name: "Materials",
      components: ["StandardMaterial", "BasicMaterial", "ShaderPreset"],
      notes: [
        "Use ShaderPreset(\"plasma\", {...}), ShaderPreset(\"gridGlow\", {...}), ShaderPreset(\"iridescent\", {...}), or ShaderPreset(\"toonStripe\", {...}) for shader-like visuals. Do not emit raw GLSL.",
      ],
    },
    {
      name: "Large Data Layers",
      components: [
        "DataSource",
        "GeoJsonExtrusionLayer",
        "GeoJsonPolygonLayer",
        "LineLayer",
        "TerrainLayer",
      ],
      notes: [
        "For map-scale scenes, keep bulk geometry in DataSource/Layer components instead of defining every building as a Mesh.",
        "The local demo city endpoint is /api/geojson/demo-city and roads are /api/geojson/demo-city?layer=roads.",
        "Large local GeoJSON datasets are available without spending tokens: /api/geojson/dataset/south-america-rivers, /api/geojson/dataset/south-america-lakes, and /api/geojson/dataset/yosemite-waterways.",
      ],
    },
  ],
});
