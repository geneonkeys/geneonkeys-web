import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, DeviceOrientationControls } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useState, useRef } from "react";

// Add these type declarations at the top of the file, after the imports
// interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
//   requestPermission?: () => Promise<PermissionState>;
// }

interface DeviceOrientationEventStatic extends EventTarget {
  requestPermission?: () => Promise<PermissionState>;
}

// Extend the window interface to include our typed DeviceOrientationEvent
declare global {
  interface Window {
    DeviceOrientationEvent: DeviceOrientationEventStatic;
  }
}

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

function generateRandomPositions() {
  return SOURCES.map(() => {
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.random() * Math.PI;
    const radius = 3 + Math.random() * 2;

    const x = radius * Math.sin(theta) * Math.cos(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(theta);

    return [x, y, z] as [number, number, number];
  });
}

// Custom hook to check if device orientation is available
function useDeviceOrientationAvailable() {
  const [available, setAvailable] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);

  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    if (window.DeviceOrientationEvent && isMobile) {
      if (typeof (window.DeviceOrientationEvent).requestPermission === "function") {
        setAvailable(true);
        if (permissionState === "granted") {
          setAvailable(true);
        }
      } else {
        setAvailable(true);
      }
    } else {
      setAvailable(false);
    }
  }, [permissionState]);

  const requestPermission = async () => {
    if (typeof (window.DeviceOrientationEvent).requestPermission === "function") {
      try {
        const permission = await (window.DeviceOrientationEvent).requestPermission();
        setPermissionState(permission);
        return permission === "granted";
      } catch (error) {
        console.error("Error requesting device orientation permission:", error);
        return false;
      }
    }
    return true;
  };

  return { available, requestPermission, permissionState };
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

  const getNodeColor = () => {
    if (index === currentIndex) return "#4CAF50";
    if (index === previousIndex) return "#FFC107";
    return "#2196F3";
  };

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
  const [usingDeviceOrientation, setUsingDeviceOrientation] = useState(false);
  const { available, permissionState } = useDeviceOrientationAvailable();

  useEffect(() => {
    camera.lookAt(0, 0, -1);
  }, [camera]);

  useEffect(() => {
    if (available && permissionState === "granted") {
      setUsingDeviceOrientation(true);
    }
  }, [available, permissionState]);

  if (usingDeviceOrientation) {
    return <DeviceOrientationControls />;
  }

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

    handleResize();
    window.addEventListener("resize", handleResize);

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
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useFullScreenSize();
  const { available, requestPermission, permissionState } = useDeviceOrientationAvailable();

  const MAX_BRIGHTNESS = 1.8;
  const MIN_BRIGHTNESS = 0.8;
  const brightness = MIN_BRIGHTNESS + (brightnessPercent / 100) * (MAX_BRIGHTNESS - MIN_BRIGHTNESS);

  useEffect(() => {
    if (available && permissionState !== "granted") {
      setShowPermissionPrompt(true);
    } else {
      setShowPermissionPrompt(false);
    }
  }, [available, permissionState]);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowPermissionPrompt(false);
    }
  };

  function handleSelectNode(index: number) {
    setPreviousIndex(sourceIndex);
    setSourceIndex(index);
    setShowProgress(true);
    setNodePositions(generateRandomPositions());
  }

  function handleBrightnessChange(e: React.ChangeEvent<HTMLInputElement>) {
    setBrightnessPercent(parseInt(e.target.value));
  }

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      container.style.position = "fixed";
      container.style.top = "0";
      container.style.left = "0";
      container.style.width = "100vw";
      container.style.height = "100vh";
      container.style.zIndex = "1000";
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
        boxSizing: "border-box",
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

      {showPermissionPrompt && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "20px",
          borderRadius: "8px",
          zIndex: 1003,
          textAlign: "center",
          maxWidth: "80%"
        }}>
          <h3>Enable Gyroscopic Controls?</h3>
          <p>Allow access to device orientation to look around by moving your phone.</p>
          <button 
            onClick={handleRequestPermission}
            style={{
              background: "#4CAF50",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              marginTop: "10px",
              cursor: "pointer"
            }}
          >
            Enable
          </button>
          <button 
            onClick={() => setShowPermissionPrompt(false)}
            style={{
              background: "#f44336",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              marginTop: "10px",
              marginLeft: "10px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
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
        dpr={1}
        onCreated={({ gl }) => {
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
