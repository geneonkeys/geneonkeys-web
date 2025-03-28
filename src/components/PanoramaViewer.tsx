import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useState, useRef } from "react";

const MAX_SOURCE_INDEX = 5;
const SOURCES = [""];

interface PanoramaProps {
  onProgress: (progress: number) => void;
  sourceIndex: number;
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
      target={[0, 0, -0.1]}
      makeDefault
    />
  );
}

function Panorama({ onProgress, sourceIndex }: PanoramaProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const { scene } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(0x000000);
  }, [scene]);

  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(
      `${SOURCES[sourceIndex]}.png`,
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
        console.error("Error loading texture:", error);
        onProgress(100);
      }
    );

    return () => {
      if (texture) {
        texture.dispose();
      }
    };
  }, [onProgress, sourceIndex]);

  return (
    <>
      {texture && (
        <mesh rotation={[0, Math.PI, 0]}>
          <sphereGeometry args={[5, 64, 32]} />
          <meshBasicMaterial map={texture} side={THREE.BackSide} />
        </mesh>
      )}
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
  const [loadProgress, setLoadProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useFullScreenSize();
  function handleNextSourceIndex() {
    if (sourceIndex != MAX_SOURCE_INDEX) {
      const currentSourceIndex = sourceIndex;
      setSourceIndex(currentSourceIndex + 1);
    } else {
      setSourceIndex(0);
    }
  }

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
      <button onClick={handleNextSourceIndex}>
        {`[ ${sourceIndex + 1} / ${MAX_SOURCE_INDEX + 1} ] ${SOURCES[
          sourceIndex
        ].substring(6)}`}
      </button>
      {showProgress && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            zIndex: 1000,
            fontFamily: "Arial, sans-serif",
            fontSize: "16px",
            transition: "opacity 0.5s ease",
            opacity: loadProgress === 100 ? 0.7 : 1,
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: "100px",
          }}
        >
          <div>Loading: {loadProgress}%</div>
          <div
            style={{
              width: "100%",
              height: "4px",
              backgroundColor: "rgba(255,255,255,0.3)",
              borderRadius: "2px",
              marginTop: "5px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${loadProgress}%`,
                backgroundColor: "white",
                transition: "width 0.3s ease-out",
              }}
            />
          </div>
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

          // Log the size to verify
          console.log("Canvas initialized with size:", width, "x", height);
        }}
      >
        <PanoramaControls />
        <Panorama sourceIndex={sourceIndex} onProgress={handleProgress} />
      </Canvas>
    </div>
  );
}
