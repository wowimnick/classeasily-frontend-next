"use client";

import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  useTexture,
  Float,
} from "@react-three/drei";
import * as THREE from "three";

// --- GEOMETRY CONSTANTS ---
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

// --- MESH COMPONENT ---
const GlossyCardMesh = React.forwardRef(
  ({ textureUrl, envMapIntensity = 0.8, ...props }, ref) => {
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
    }, []);

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
          metalness={0.1}
          roughness={0.2}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          ior={1.5}
          reflectivity={0.9}
          envMapIntensity={envMapIntensity}
        />
        <meshStandardMaterial
          attach="material-1"
          color="#f0f0f0"
          roughness={0.3}
        />
      </mesh>
    );
  },
);
GlossyCardMesh.displayName = "GlossyCardMesh";

// --- SCENE COMPONENT ---
const Scene = ({ img1, img2 }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Environment preset="city" />

      <group
        position={[0, isMobile ? -0.2 : 0, 0]}
        scale={isMobile ? 0.9 : 1.1}
      >
        {/* Back Card */}
        <Float
          speed={2}
          rotationIntensity={0.2}
          floatIntensity={0.5}
          position={[-0.8, 0.4, -1]}
        >
          <GlossyCardMesh
            textureUrl={img2}
            rotation={[0.1, 0.3, -0.2]}
            scale={0.9}
          />
        </Float>

        {/* Front Card */}
        <Float
          speed={2.5}
          rotationIntensity={0.4}
          floatIntensity={0.8}
          position={[0.5, -0.3, 0.5]}
        >
          <GlossyCardMesh textureUrl={img1} rotation={[0, -0.2, 0.1]} />
        </Float>
      </group>

      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.5}
        scale={15}
        blur={2}
        far={4.5}
        color="#000000"
      />
    </>
  );
};

// --- EXPORTED CANVAS WRAPPER ---
export default function GiftCardsCanvas({ img1, img2 }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 50 }}
      style={{ width: "100%", height: "100%" }}
    >
      <Scene img1={img1} img2={img2} />
    </Canvas>
  );
}
