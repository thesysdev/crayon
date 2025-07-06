import { Billboard, Box, Line, OrbitControls, Text } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, useState } from "react";
import * as THREE from "three";

interface Value {
  Year: number;
  Count: number;
}

interface DataItem {
  Country: string;
  Values: Value[];
}

export interface BarChart3DProps {
  data: DataItem[];
  width?: number | string;
  height?: number | string;
}

// A new palette with more distinct colors
const allColors = [
  "#ff6384",
  "#36a2eb",
  "#ffce56",
  "#4bc0c0",
  "#9966ff",
  "#ff9f40",
  "#8e5ea2",
  "#3cba9f",
  "#e8c3b9",
  "#c45850",
  "#ff69b4",
  "#1e90ff",
  "#ffd700",
  "#32cd32",
  "#ba55d3",
  "#ffa07a",
  "#00ced1",
  "#f08080",
];

const ScreenSpaceText = ({
  children,
  position,
  size,
  ...props
}: {
  children: React.ReactNode;
  position: [number, number, number];
  size: number;
  [key: string]: any;
}) => {
  const { camera, size: canvasSize } = useThree();
  const orthoCamera = camera as THREE.OrthographicCamera;

  if (!orthoCamera.isOrthographicCamera) {
    return null;
  }

  const fontSize =
    (size * (orthoCamera.top - orthoCamera.bottom)) / (canvasSize.height * orthoCamera.zoom);

  return (
    <Billboard position={position}>
      <Text fontSize={fontSize} {...props}>
        {children}
      </Text>
    </Billboard>
  );
};

const AnimatedGlowMaterial = ({ 
  color, 
  baseOpacity, 
  glowOpacityRef,
  ...props 
}: { 
  color: string; 
  baseOpacity: number; 
  glowOpacityRef: React.MutableRefObject<number>;
  [key: string]: any;
}) => {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.opacity = baseOpacity * glowOpacityRef.current;
    }
  });
  
  return (
    <meshBasicMaterial 
      ref={materialRef}
      color={color} 
      transparent 
      opacity={0}
      {...props}
    />
  );
};

const AnimatedAmbientLight = ({ targetIntensity }: { targetIntensity: number }) => {
  const lightRef = useRef<THREE.AmbientLight>(null);
  const currentIntensity = useRef(targetIntensity);
  
  useFrame((_, delta) => {
    if (lightRef.current) {
      currentIntensity.current += (targetIntensity - currentIntensity.current) * delta * 3;
      lightRef.current.intensity = currentIntensity.current;
    }
  });
  
  return <ambientLight ref={lightRef} intensity={targetIntensity} />;
};

const AnimatedDirectionalLight = ({ targetIntensity, ...props }: { targetIntensity: number; [key: string]: any }) => {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const currentIntensity = useRef(targetIntensity);
  
  useFrame((_, delta) => {
    if (lightRef.current) {
      currentIntensity.current += (targetIntensity - currentIntensity.current) * delta * 3;
      lightRef.current.intensity = currentIntensity.current;
    }
  });
  
  return <directionalLight ref={lightRef} intensity={targetIntensity} {...props} />;
};

const GlowBar = ({
  size,
  color,
  position,
  isHovered,
  onHover,
}: {
  size: [number, number, number];
  color: string;
  position: [number, number, number];
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
}) => {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowOpacityRef = useRef(0);
  const glowGroupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    // Smooth transition for glow opacity
    const targetOpacity = isHovered ? 1 : 0;
    glowOpacityRef.current += (targetOpacity - glowOpacityRef.current) * delta * 5;
    
    // Update material emissive intensity
    if (materialRef.current) {
      if (isHovered) {
        // Pulsing effect when hovered
        materialRef.current.emissiveIntensity = (1.5 + Math.sin(state.clock.elapsedTime * 3) * 0.5) * glowOpacityRef.current;
      } else {
        // Fade out smoothly
        materialRef.current.emissiveIntensity = 2 * glowOpacityRef.current;
      }
    }
    
    // Update glow group opacity
    if (glowGroupRef.current) {
      glowGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshBasicMaterial;
          if (material.opacity !== undefined) {
            material.needsUpdate = true;
          }
        }
      });
    }
  });

  const handlePointerOver = () => {
    onHover(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    onHover(false);
    document.body.style.cursor = "default";
  };

  return (
    <group position={position}>
      {/* Outer glow mesh - larger and transparent */}
      <group ref={glowGroupRef}>
        {/* Multiple glow layers for depth */}
        <Box args={[size[0] * 1.3, size[1] * 1.1, size[2] * 1.3]}>
          <AnimatedGlowMaterial 
            color={color} 
            baseOpacity={0.2} 
            glowOpacityRef={glowOpacityRef} 
            side={THREE.BackSide} 
            depthWrite={false}
          />
        </Box>
        <Box args={[size[0] * 1.6, size[1] * 1.05, size[2] * 1.6]}>
          <AnimatedGlowMaterial 
            color={color} 
            baseOpacity={0.1} 
            glowOpacityRef={glowOpacityRef} 
            side={THREE.BackSide}
            depthWrite={false}
          />
        </Box>
        <Box args={[size[0] * 2, size[1] * 1.02, size[2] * 2]}>
          <AnimatedGlowMaterial 
            color={color} 
            baseOpacity={0.05} 
            glowOpacityRef={glowOpacityRef} 
            side={THREE.BackSide}
            depthWrite={false}
          />
        </Box>
      </group>

      {/* The actual bar */}
      <Box args={size} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} castShadow>
        <meshStandardMaterial
          color={color}
          emissive={isHovered ? color : undefined}
          emissiveIntensity={isHovered ? 2 : 0}
          toneMapped={false}
          ref={materialRef}
        />
      </Box>
    </group>
  );
};

const BarGroup = ({
  item,
  index,
  labelPosition,
  barAnchor,
  onHover,
  isHovered,
}: {
  item: DataItem;
  index: number;
  labelPosition: THREE.Vector3;
  barAnchor: THREE.Vector3;
  onHover: (index: number | null) => void;
  isHovered: boolean;
}) => {
  const i = index;
  const zPos = -10 + i * 1.5;
  const popuCount = item.Values[57]?.Count ?? 0;
  const popuCountFormatted = (popuCount / 1000000).toFixed(2) + "M";
  const color = allColors[i % allColors.length] ?? "white";
  const barHeight = Math.max(0.1, Math.pow(popuCount / 150000, 0.3));

  const countryLabelPosition = labelPosition;
  const populationLabelPosition = new THREE.Vector3(
    -labelPosition.x,
    labelPosition.y,
    labelPosition.z,
  );

  const countryBarAnchor = barAnchor;
  const populationBarAnchor = new THREE.Vector3(-barAnchor.x, barAnchor.y, barAnchor.z);

  const countryLinePoints: [THREE.Vector3, THREE.Vector3] = [
    countryBarAnchor,
    countryLabelPosition,
  ];
  const populationLinePoints: [THREE.Vector3, THREE.Vector3] = [
    populationBarAnchor,
    populationLabelPosition,
  ];

  return (
    <group>
      <GlowBar
        size={[1, barHeight, 0.5]}
        color={color}
        position={[0, barHeight / 2, zPos]}
        isHovered={isHovered}
        onHover={(hovered) => onHover(hovered ? index : null)}
      />
      <ScreenSpaceText
        position={countryLabelPosition.toArray() as [number, number, number]}
        size={10}
        color="white"
        anchorX="left"
        anchorY="middle"
      >
        {item.Country.toUpperCase()}
      </ScreenSpaceText>
      <ScreenSpaceText
        position={populationLabelPosition.toArray() as [number, number, number]}
        size={14}
        color="white"
        anchorX="right"
        anchorY="middle"
      >
        {popuCountFormatted}
      </ScreenSpaceText>
      <Line
        points={countryLinePoints}
        color="white"
        lineWidth={1}
        dashed
        dashSize={0.2}
        gapSize={0.1}
      />
      <Line
        points={populationLinePoints}
        color="white"
        lineWidth={1}
        dashed
        dashSize={0.2}
        gapSize={0.1}
      />
    </group>
  );
};

const AxesHelper = ({ size }: { size: number }) => {
  return (
    <group>
      <axesHelper args={[size]} />
      <Text
        position={[size + 0.4, 0, 0]}
        fontSize={0.5}
        color="red"
        anchorX="center"
        anchorY="middle"
      >
        X
      </Text>
      <Text
        position={[0, size + 0.4, 0]}
        fontSize={0.5}
        color="green"
        anchorX="center"
        anchorY="middle"
      >
        Y
      </Text>
      <Text
        position={[0, 0, size + 0.4]}
        fontSize={0.5}
        color="blue"
        anchorX="center"
        anchorY="middle"
      >
        Z
      </Text>
    </group>
  );
};

const ChartContents = ({ data }: { data: DataItem[] }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { labelPositions, barAnchors } = useMemo(() => {
    const calculatedLabelPositions: THREE.Vector3[] = [];
    const calculatedBarAnchors: THREE.Vector3[] = [];
    const xPos = 8; // All labels at this x position.
    const yPos = 0.5; // All labels at this y position.

    data.forEach((item, i) => {
      const zPos = -10 + i * 1.5;
      calculatedLabelPositions.push(new THREE.Vector3(xPos, yPos, zPos));
      calculatedBarAnchors.push(new THREE.Vector3(0.5, 0.1, zPos));
    });

    return {
      labelPositions: calculatedLabelPositions,
      barAnchors: calculatedBarAnchors,
    };
  }, [data]);

  return (
    <>
      <group position={[-15, 0.1, 15]}>
        <AxesHelper size={2} />
      </group>

      <AnimatedAmbientLight targetIntensity={hoveredIndex !== null ? 0.15 : 3} />
      <AnimatedDirectionalLight 
        targetIntensity={hoveredIndex !== null ? 0.3 : 4}
        castShadow
        position={[10, 20, 5]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Shadow Catcher Plane */}
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.02, 0]}>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial opacity={0.3} />
      </mesh>

      {data.map((item, i) => (
        <BarGroup
          key={item.Country}
          item={item}
          index={i}
          labelPosition={labelPositions[i]!}
          barAnchor={barAnchors[i]!}
          onHover={setHoveredIndex}
          isHovered={hoveredIndex === i}
        />
      ))}

      <OrbitControls
        target={[0.0, 5.0, 0.0]}
        // Re-enable controls but disable pan and rotate
        // enablePan={false}
        //   enableRotate={false}
        maxPolarAngle={Math.PI / 2}
        minZoom={0.5}
        maxZoom={100}
      />
    </>
  );
};

export const BarChart3D: React.FC<BarChart3DProps> = ({
  data,
  width = "100%",
  height = "100%",
}) => {
  return (
    <div style={{ width, height }}>
      <Canvas
        shadows
        orthographic
        camera={{
          position: [14.73, 10.26, 16.67],
          zoom: 0.5,
          top: 10,
          bottom: -10,
          left: -10,
          right: 10,
        }}
        gl={{ alpha: true, antialias: true }}
        scene={{ fog: new THREE.Fog(0x000000, 10, 50) }}
      >
        <ChartContents data={data} />
      </Canvas>
    </div>
  );
};
