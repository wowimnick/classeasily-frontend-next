import React, {
  useState,
  Suspense,
  useRef,
  useLayoutEffect,
  useEffect,
  memo,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath";

// --- 3D GEOMETRY CONSTANTS ---
const CARD_WIDTH = 3;
const CARD_HEIGHT = 1.9;
const CARD_RADIUS = 0.2;
const CARD_THICKNESS = 0.05;

const cardShape = new THREE.Shape();
const w = CARD_WIDTH;
const h = CARD_HEIGHT;
const r = CARD_RADIUS;
const x = -w / 2;
const y = -h / 2;

cardShape.moveTo(x + r, y);
cardShape.lineTo(x + w - r, y);
cardShape.quadraticCurveTo(x + w, y, x + w, y + r);
cardShape.lineTo(x + w, y + h - r);
cardShape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
cardShape.lineTo(x + r, y + h);
cardShape.quadraticCurveTo(x, y + h, x, y + h - r);
cardShape.lineTo(x, y + r);
cardShape.quadraticCurveTo(x, y, x + r, y);

const extrudeSettings = { depth: CARD_THICKNESS, bevelEnabled: false };

// --- COMPONENTS ---

/**
 * Adjusts camera position based on screen width to ensure
 * the card fits within the viewport on mobile devices.
 */
function ResponsiveRig() {
  const { camera, size } = useThree();

  useEffect(() => {
    // Breakpoint logic: if width < 600px, move camera back
    const isMobile = size.width < 600;
    const targetZ = isMobile ? 6.5 : 4.5; // 4.5 is desktop default, 6.5 zooms out for mobile

    camera.position.z = targetZ;
    camera.updateProjectionMatrix();
  }, [size.width, camera]);

  return null;
}

const GlossyCardMesh = React.forwardRef(
  (
    {
      textureUrl,
      envMapIntensity = 1,
      opacity = 1,
      transparent = true,
      ...props
    },
    ref,
  ) => {
    const texture = useTexture(textureUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    const geometryRef = useRef();

    useLayoutEffect(() => {
      if (geometryRef.current) {
        geometryRef.current.computeBoundingBox();
        const { min, max } = geometryRef.current.boundingBox;
        const uvAttribute = geometryRef.current.attributes.uv;
        const posAttribute = geometryRef.current.attributes.position;
        for (let i = 0; i < posAttribute.count; i++) {
          const xPos = posAttribute.getX(i);
          const yPos = posAttribute.getY(i);
          const u = (xPos - min.x) / (max.x - min.x);
          const v = (yPos - min.y) / (max.y - min.y);
          uvAttribute.setXY(i, u, v);
        }
        uvAttribute.needsUpdate = true;
      }
    }, [textureUrl]);

    return (
      <mesh ref={ref} castShadow receiveShadow {...props}>
        <extrudeGeometry
          ref={geometryRef}
          args={[cardShape, extrudeSettings]}
        />
        <meshPhysicalMaterial
          attach="material-0"
          map={texture}
          color="#ffffff"
          roughness={0.15}
          metalness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          ior={1.5}
          reflectivity={0.5}
          envMapIntensity={envMapIntensity}
          transparent={transparent}
          opacity={opacity}
        />
        <meshStandardMaterial
          attach="material-1"
          color="#f5f5f5"
          roughness={0.3}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>
    );
  },
);
GlossyCardMesh.displayName = "GlossyCardMesh";

function FlippableCard({ targetTextureUrl }) {
  const meshRef = useRef();
  const [displayedTexture, setDisplayedTexture] = useState(targetTextureUrl);
  const rotationY = useRef(0);
  const targetRotationY = useRef(0);
  const isFlipping = useRef(false);
  const hasSwappedForThisFlip = useRef(false);

  useEffect(() => {
    if (targetTextureUrl !== displayedTexture) {
      targetRotationY.current += Math.PI * 2;
      isFlipping.current = true;
      hasSwappedForThisFlip.current = false;
    }
  }, [targetTextureUrl, displayedTexture]);

  useFrame((state, delta) => {
    easing.damp(rotationY, "current", targetRotationY.current, 0.4, delta);

    const t = state.clock.getElapsedTime();
    const floatY = Math.sin(t / 2) * 0.1;
    const floatTiltX = Math.cos(t / 2) * 0.05;

    if (meshRef.current) {
      meshRef.current.rotation.y = rotationY.current;
      meshRef.current.rotation.x = floatTiltX;
      meshRef.current.position.y = floatY;
    }

    if (isFlipping.current && !hasSwappedForThisFlip.current) {
      const dist = Math.abs(targetRotationY.current - rotationY.current);
      const threshold = Math.PI * 1.5;
      if (dist <= threshold) {
        setDisplayedTexture(targetTextureUrl);
        hasSwappedForThisFlip.current = true;
      }
    }

    if (Math.abs(targetRotationY.current - rotationY.current) < 0.001) {
      isFlipping.current = false;
    }
  });

  return (
    <group>
      <GlossyCardMesh
        ref={meshRef}
        textureUrl={displayedTexture}
        envMapIntensity={1.5}
      />
    </group>
  );
}

const Giftcard3DScene = memo(({ textureUrl }) => (
  <Canvas
    shadows
    camera={{ position: [0, 0, 4.5], fov: 45 }}
    gl={{ antialias: true, alpha: true }}
    style={{ pointerEvents: "none" }} // Prevents canvas from capturing scroll on mobile
  >
    <ResponsiveRig />
    <ambientLight intensity={0.8} />
    <directionalLight position={[5, 5, 5]} intensity={1} castShadow />

    <Suspense fallback={null}>
      <Environment preset="city" />
      <FlippableCard targetTextureUrl={textureUrl} />
    </Suspense>

    <ContactShadows
      position={[0, -1.2, 0]}
      opacity={0.4}
      scale={10}
      blur={2.5}
      far={4}
    />
  </Canvas>
));
Giftcard3DScene.displayName = "Giftcard3DScene";

export default Giftcard3DScene;
