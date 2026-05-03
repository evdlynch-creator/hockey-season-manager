import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

export const IceParticles = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    console.log("Initializing particles...");
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      console.log("Particles engine ready");
      setInit(true);
    });
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      fpsLimit: 120,
      particles: {
        color: {
          value: "#00ffff", // Bright Cyan
        },
        move: {
          direction: "bottom-right",
          enable: true,
          outModes: {
            default: "out",
          },
          random: true,
          speed: 3, // Faster
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 800,
          },
          value: 150, // More
        },
        opacity: {
          value: 1, // Full opacity
        },
        shape: {
          type: "circle",
        },
        size: {
          value: 10, // Huge
        },
        wobble: {
          enable: true,
          distance: 10,
          speed: 10,
        },
      },
      detectRetina: true,
    }),
    []
  );

  if (!init) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      <Particles
        id="ice-particles-rink"
        options={options}
      />
    </div>
  );
};
