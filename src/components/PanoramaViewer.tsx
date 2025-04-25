import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useState, useRef } from "react";

const SOURCES = [
  "Ashberry_Tyler20-R2_Homesite98_Bath2_360",
  "Ashberry_Tyler20-R2_Homesite98_Bath3_360",
  "Ashberry_Tyler20-R2_Homesite98_Bed2_360",
  "Ashberry_Tyler20-R2_Homesite98_Bed3_360",
  "Ashberry_Tyler20-R2_Homesite98_Dining_360",
  "Ashberry_Tyler20-R2_Homesite98_Great_360",
  "Ashberry_Tyler20-R2_Homesite98_Kitchen_360",
  "Ashberry_Tyler20-R2_Homesite98_PrimaryBath_360",
];

// Function to generate random positions for nodes
function generateRandomPositions() {
  return SOURCES.map(() => {
    // Generate random spherical coordinates
    const phi = Math.random() * Math.PI * 2; // Random angle around Y axis (0 to 2π)
    const theta = Math.random() * Math.PI; // Random angle from top to bottom (0 to π)
    const radius = 3 + Math.random() * 2; // Random distance (3 to 5)

    // Convert spherical to cartesian coordinates
    const x = radius * Math.sin(theta) * Math.cos(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(theta);

    return [x, y, z] as [number, number, number];
  });
}

interface PanoramaProps {
  onProgress: (progress: number) => void;
  sourceIndex: number;
  brightness: number;
}

interface NavigationNodeProps {
  position: [number, number, number];
  name: string;
  index: number;
  currentIndex: number;
  previousIndex: number;
  onClick: (index: number) => void;
}

function NavigationNode({ position, name, index, currentIndex, previousIndex, onClick }: NavigationNodeProps) {
  const [hovered, setHovered] = useState(false);
  const sphereRef = useRef<THREE.Mesh>(null);

  // Determine node color based on its state
  const getNodeColor = () => {
    if (index === currentIndex) return "#4CAF50"; // Current node - green
    if (index === previousIndex) return "#FFC107"; // Previous node - amber
    return "#2196F3"; // Other nodes - blue
  };

  // Pulse animation for the current node
  useFrame(({ clock }) => {
    if (sphereRef.current && index === currentIndex) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
      sphereRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={sphereRef}
        onClick={() => onClick(index)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial
          color={getNodeColor()}
          transparent={true}
          opacity={hovered ? 0.8 : 0.5}
        />
      </mesh>

      {hovered && (
        <Html position={[0, 0.4, 0]} center>
          <div style={{
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '14px',
            whiteSpace: 'nowrap'
          }}>
            {name}
          </div>
        </Html>
      )}
    </group>
  );
}

function PanoramaControls() {
  const { camera } = useThree();

  useEffect(() => {
    camera.lookAt(0, 0, -1);
  }, [camera]);

  return (
    <OrbitControls
      enableZoom={false}
      enablePan={false}
      enableDamping={true}
      rotateSpeed={0.5}
      reverseOrbit={true}
      target={[0, 0, -0.1]}
      makeDefault
    />
  );
}

function Panorama({ onProgress, sourceIndex, brightness }: PanoramaProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const { scene } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(0x000000);
  }, [scene]);

  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(
      `${SOURCES[sourceIndex]}.jpeg`,
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.mapping = THREE.EquirectangularReflectionMapping;
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;

        setTexture(loadedTexture);
        onProgress(100);
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
          onProgress(percentComplete);
        }
      },
      (error) => {
        console.error("Error loading textures:", error);
        onProgress(100);
      }
    );
  }, [onProgress, sourceIndex]);

  return (
    <>
      {texture && (
        <mesh>
          <sphereGeometry args={[5, 64, 32]} />
          <meshBasicMaterial
            map={texture}
            side={THREE.BackSide}
            toneMapped={false}
            color={new THREE.Color(brightness, brightness, brightness)}
          />
        </mesh>
      )}
    </>
  );
}

function NavigationNodes({
  currentIndex,
  previousIndex,
  onSelectNode,
  nodePositions
}: {
  currentIndex: number,
  previousIndex: number,
  onSelectNode: (index: number) => void,
  nodePositions: [number, number, number][]
}) {
  return (
    <>
      {SOURCES.map((source, index) => {
        return (index == currentIndex ? null :
          <NavigationNode
            key={index}
            position={nodePositions[index]}
            name={source}
            index={index}
            currentIndex={currentIndex}
            previousIndex={previousIndex}
            onClick={onSelectNode}
          />
        )
      })}
    </>
  );
}

// Custom hook to handle full screen sizing
function useFullScreenSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return size;
}

export default function PanoramaViewer() {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(-1);
  const [loadProgress, setLoadProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(true);
  const [brightnessPercent, setBrightnessPercent] = useState(100);
  const [nodePositions, setNodePositions] = useState<[number, number, number][]>(generateRandomPositions());
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useFullScreenSize();

  // Convert brightness percentage to actual brightness value (capped at 1.8)
  const MAX_BRIGHTNESS = 1.8;
  const MIN_BRIGHTNESS = 0.8;
  const brightness = MIN_BRIGHTNESS + (brightnessPercent / 100) * (MAX_BRIGHTNESS - MIN_BRIGHTNESS);

  function handleSelectNode(index: number) {
    setPreviousIndex(sourceIndex);
    setSourceIndex(index);
    setShowProgress(true);

    // Generate new random positions for all nodes
    setNodePositions(generateRandomPositions());
  }

  function handleBrightnessChange(e: React.ChangeEvent<HTMLInputElement>) {
    setBrightnessPercent(parseInt(e.target.value));
  }

  useEffect(() => { }, [loadProgress, showProgress])

  // Force the container to be full screen
  useEffect(() => {
    if (containerRef.current) {
      // Apply styles to make container full screen
      const container = containerRef.current;
      container.style.position = "fixed";
      container.style.top = "0";
      container.style.left = "0";
      container.style.width = "100vw";
      container.style.height = "100vh";
      container.style.zIndex = "1000"; // Ensure it's above other content
    }
  }, []);

  const handleProgress = (progressValue: number) => {
    setLoadProgress(progressValue);
    if (progressValue === 100) {
      setTimeout(() => setShowProgress(false), 1500);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        overflow: "hidden",
        boxSizing: "border-box", // Ensure borders don't affect dimensions
      }}
    >
      <div style={{
        position: "absolute",
        top: "10px",
        left: "10px",
        zIndex: 1001,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        background: "rgba(0,0,0,0.5)",
        padding: "10px",
        borderRadius: "5px"
      }}>
        <div style={{ color: "white" }}>
          {`Current view: ${SOURCES[sourceIndex]}`}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "white" }}>
          <label htmlFor="brightness">Brightness:</label>
          <input
            id="brightness"
            type="range"
            min="1"
            max="100"
            step="1"
            value={brightnessPercent}
            onChange={handleBrightnessChange}
            style={{ width: "150px" }}
          />
          <span>{brightnessPercent}%</span>
        </div>
      </div>

      <div style={{
        position: "absolute",
        bottom: "10px",
        left: "10px",
        zIndex: 1001,
        background: "rgba(0,0,0,0.5)",
        padding: "10px",
        borderRadius: "5px",
        color: "white"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ display: "inline-block", width: "12px", height: "12px", backgroundColor: "#FFC107", borderRadius: "50%" }}></span>
          <span>Previous location</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ display: "inline-block", width: "12px", height: "12px", backgroundColor: "#2196F3", borderRadius: "50%" }}></span>
          <span>Other locations</span>
        </div>
      </div>

      {showProgress && loadProgress < 100 && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "20px",
          borderRadius: "8px",
          zIndex: 1002
        }}>
          Loading... {loadProgress}%
        </div>
      )}

      <Canvas
        camera={{
          position: [0, 0, 0],
          fov: 75,
          near: 0.1,
          far: 50,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
        dpr={1} // Lock pixel ratio to 1 for better performance
        onCreated={({ gl }) => {
          // Force the renderer to use the full window size
          gl.setSize(width, height);
        }}
      >
        <PanoramaControls />
        <Panorama sourceIndex={sourceIndex} onProgress={handleProgress} brightness={brightness} />
        <NavigationNodes
          currentIndex={sourceIndex}
          previousIndex={previousIndex}
          onSelectNode={handleSelectNode}
          nodePositions={nodePositions}
        />
      </Canvas>
    </div>
  );
}
