import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer, MeshDistortMaterial, MeshTransmissionMaterial, Sparkles } from "@react-three/drei";
import { Color, MathUtils, type Group } from "three";
import type { SiteSettings } from "../lib/settings";

type Props = {
  kind: SiteSettings["hero_3d"];
  color: string;
  /** second gradient color; tints the glass shape's surroundings */
  color2?: string;
  wireframe: boolean;
  speed: number;
  interactive: boolean;
  particles: boolean;
  animate: boolean;
  /** element whose pointer moves steer the shape (defaults to the canvas itself) */
  eventSource?: React.RefObject<HTMLElement | null>;
  /** shrink factor for small containers */
  size?: number;
};

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** two colored spheres orbiting behind the glass, so it has something to refract */
function Orbiters({ color, color2, animate, speed }: { color: string; color2: string; animate: boolean; speed: number }) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (animate && ref.current) ref.current.rotation.z += delta * 0.35 * speed;
  });
  return (
    <group ref={ref} position={[0, 0, -1.2]}>
      <mesh position={[1.25, 0.35, 0]}>
        <sphereGeometry args={[0.5, 48, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-1.15, -0.45, 0]}>
        <sphereGeometry args={[0.38, 48, 48]} />
        <meshStandardMaterial color={color2} emissive={color2} emissiveIntensity={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Shape({ kind, color, color2 = color, wireframe, speed, interactive, animate, size = 1 }: Omit<Props, "particles" | "eventSource">) {
  const spin = useRef<Group>(null);
  const tilt = useRef<Group>(null);

  useFrame((state, delta) => {
    if (animate && spin.current) {
      spin.current.rotation.y += delta * 0.22 * speed;
      spin.current.rotation.x += delta * 0.07 * speed;
    }
    // lean towards the pointer
    if (interactive && tilt.current) {
      tilt.current.rotation.y = MathUtils.lerp(tilt.current.rotation.y, state.pointer.x * 0.55, 0.06);
      tilt.current.rotation.x = MathUtils.lerp(tilt.current.rotation.x, -state.pointer.y * 0.4, 0.06);
    }
  });

  const physical = { color, roughness: 0.18, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15, wireframe } as const;
  // shapes are ~3 units wide; shrink them when the container is narrower than that
  const { width } = useThree((s) => s.viewport);
  const fit = Math.min(1, width / 3.4) * size;

  return (
    <group ref={tilt} scale={fit}>
      {kind === "glass" && <Orbiters color={color} color2={color2} animate={animate} speed={speed} />}
      <Float speed={animate ? 1.6 * speed : 0} rotationIntensity={0.5} floatIntensity={1.1}>
        <group ref={spin}>
          {kind === "glass" && (
            <mesh>
              <torusKnotGeometry args={[0.78, 0.3, 256, 40]} />
              {wireframe ? (
                <meshBasicMaterial color={color} wireframe />
              ) : (
                <MeshTransmissionMaterial
                  samples={6}
                  resolution={512}
                  transmission={1}
                  thickness={0.9}
                  roughness={0.06}
                  ior={1.4}
                  chromaticAberration={0.35}
                  anisotropicBlur={0.2}
                  distortion={0.25}
                  distortionScale={0.4}
                  temporalDistortion={animate ? 0.08 : 0}
                  iridescence={1}
                  iridescenceIOR={1.3}
                  iridescenceThicknessRange={[100, 900]}
                  color="#ffffff"
                  backside
                />
              )}
            </mesh>
          )}
          {kind === "orb" && (
            <mesh>
              <icosahedronGeometry args={[1.1, 48]} />
              <MeshDistortMaterial color={color} roughness={0.12} metalness={0.3} distort={0.38} speed={animate ? 1.8 * speed : 0} wireframe={wireframe} />
            </mesh>
          )}
          {kind === "knot" && (
            <mesh>
              <torusKnotGeometry args={[0.85, 0.3, 240, 36]} />
              <meshPhysicalMaterial {...physical} />
            </mesh>
          )}
          {kind === "torus" && (
            <mesh rotation={[0.6, 0, 0]}>
              <torusGeometry args={[1, 0.4, 64, 180]} />
              <meshPhysicalMaterial {...physical} />
            </mesh>
          )}
          {kind === "crystal" && (
            <>
              <mesh>
                <icosahedronGeometry args={[1.15, 0]} />
                <meshPhysicalMaterial {...physical} flatShading />
              </mesh>
              <mesh scale={1.22}>
                <icosahedronGeometry args={[1.15, 1]} />
                <meshBasicMaterial color={color} wireframe transparent opacity={0.35} />
              </mesh>
            </>
          )}
          {kind === "rings" && (
            <>
              <mesh>
                <sphereGeometry args={[0.45, 48, 48]} />
                <meshPhysicalMaterial {...physical} />
              </mesh>
              {[0, 1, 2].map((i) => (
                <mesh key={i} rotation={[i * 1.05, i * 0.7, 0]}>
                  <torusGeometry args={[0.85 + i * 0.32, 0.035, 24, 160]} />
                  <meshPhysicalMaterial {...physical} wireframe={false} />
                </mesh>
              ))}
            </>
          )}
        </group>
      </Float>
    </group>
  );
}

export default function Hero3D({ eventSource, ...props }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [supported] = useState(hasWebGL);

  // stop rendering frames once the hero scrolls away
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const color2 = props.color2 || props.color;
  const rim = useMemo(() => new Color(props.color).offsetHSL(0.45, 0, 0).getStyle(), [props.color]);

  if (!supported || props.kind === "none") return null;

  return (
    <div ref={wrap} className="absolute inset-0" aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 4.4], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        frameloop={visible ? "always" : "never"}
        eventSource={eventSource?.current || undefined}
        eventPrefix="client"
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <pointLight position={[-3, -2, 2]} intensity={18} color={props.kind === "glass" ? color2 : rim} />
        <pointLight position={[2, 2, 2]} intensity={10} color={props.color} />
        <Shape {...props} color2={color2} />
        {props.particles && <Sparkles count={70} scale={[7, 5, 3]} size={2.4} speed={props.animate ? 0.35 * props.speed : 0} color={props.color} opacity={0.75} />}
        {/* local studio lighting for reflections; nothing is downloaded */}
        <Environment resolution={256}>
          <Lightformer intensity={2.4} position={[0, 4, -6]} scale={[10, 3, 1]} />
          <Lightformer intensity={1.6} color={color2} position={[-5, 0, -2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
          <Lightformer intensity={1.6} color={props.color} position={[5, -1, 0]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
          <Lightformer intensity={1} position={[0, -4, 2]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}
