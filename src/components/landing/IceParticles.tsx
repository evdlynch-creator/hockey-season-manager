import { useMemo, useEffect, useState } from "react";
import Particles from "@tsparticles/react";
import type { ISourceOptions } from "@tsparticles/engine";

export const IceParticles = () => {
  const [init, setInit] = useState(false);

  // We still need to wait for the engine to be ready if it's async
  // But since we initialized it in main.tsx, we can just check if it's already there
  // Actually, @tsparticles/react documentation suggests using initParticlesEngine 
  // even if called multiple times, it will only init once.
  // To be safe, I'll keep the local init but it should be instantaneous now.
  
  useEffect(() => {
    setInit(true);
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      fpsLimit: 120,
      fullScreen: {
        enable: false,
      },
      particles: {
        color: {
          value: "#ffffff",
        },
        move: {
          direction: "bottom-right",
          enable: true,
          outModes: {
            default: "out",
          },
          random: true,
          speed: 1,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 800,
          },
          value: 100,
        },
        opacity: {
          value: { min: 0.4, max: 0.8 },
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 2, max: 4 },
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
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <Particles
        id="ice-particles-rink"
        options={options}
        className="h-full w-full"
      />
    </div>
  );
};
