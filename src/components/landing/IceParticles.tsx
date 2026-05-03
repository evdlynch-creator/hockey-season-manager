import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, ISourceOptions } from "@tsparticles/engine";

export const IceParticles = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "bubble",
          },
        },
        modes: {
          bubble: {
            distance: 200,
            duration: 2,
            opacity: 0.8,
            size: 4,
          },
        },
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
          speed: 0.6,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 40,
        },
        opacity: {
          value: { min: 0.1, max: 0.4 },
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 2 },
        },
        wobble: {
          enable: true,
          distance: 5,
          speed: 5,
        },
      },
      detectRetina: true,
    }),
    []
  );

  if (!init) return null;

  return (
    <Particles
      id="tsparticles"
      options={options}
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
};
