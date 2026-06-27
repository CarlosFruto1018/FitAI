'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Estado visible natural de un elemento (punto de partida del scroll de salida).
 * Se usa en fromTo para que el tween de scroll no dependa del estado en tiempo de creación.
 */
const VISIBLE = { opacity: 1, y: 0, x: 0, scale: 1 } as const;

/**
 * Configuración base compartida para los ScrollTriggers del hero.
 * start en '30% top' para que el hero sea visible mientras se desplaza suavemente.
 */
function buildScrollBase(trigger: HTMLElement) {
  return {
    trigger,
    start: '30% top',
    end: 'bottom top',
  } as const;
}

/**
 * Animación de entrada escalonada al montar el componente.
 * Los elementos aparecen desde abajo con fade simultáneo.
 */
function playEntranceAnimation() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from('.hero-glow-primary', { opacity: 0, scale: 0.4, duration: 1.4, ease: 'power2.out' }, 0)
    .from('.hero-glow-secondary', { opacity: 0, scale: 0.3, duration: 1.6, ease: 'power2.out' }, 0.15)
    .from('.hero-title', { opacity: 0, y: 60, duration: 0.9 }, 0.2)
    .from('.hero-description', { opacity: 0, y: 35, duration: 0.8 }, 0.45)
    .from('.hero-cta', { opacity: 0, y: 25, scale: 0.97, duration: 0.7 }, 0.6)
    .from('.hero-mockup', { opacity: 0, y: 90, duration: 1.0 }, 0.3);
}

/**
 * Animaciones de parallax de scroll para el fondo del hero.
 * fromTo con immediateRender:false evita capturar el estado transitorio de la animación de entrada.
 */
function registerBackgroundScrollAnimations(scrollBase: ReturnType<typeof buildScrollBase>) {
  gsap.fromTo(
    '.hero-glow-primary',
    { ...VISIBLE },
    { y: -180, opacity: 0, scale: 1.4, immediateRender: false, scrollTrigger: { ...scrollBase, scrub: 1.2 } }
  );

  gsap.fromTo(
    '.hero-glow-secondary',
    { ...VISIBLE },
    { y: -100, x: -40, opacity: 0, immediateRender: false, scrollTrigger: { ...scrollBase, scrub: 1.8 } }
  );
}

/**
 * Animaciones de parallax de scroll para los elementos de texto del hero.
 * Cada elemento sale a velocidad distinta para crear sensación de profundidad.
 */
function registerTextScrollAnimations(scrollBase: ReturnType<typeof buildScrollBase>) {
  gsap.fromTo(
    '.hero-title',
    { y: 0, opacity: 1 },
    { y: -70, opacity: 0, immediateRender: false, scrollTrigger: { ...scrollBase, scrub: 1 } }
  );

  gsap.fromTo(
    '.hero-description',
    { y: 0, opacity: 1 },
    { y: -50, opacity: 0, immediateRender: false, scrollTrigger: { ...scrollBase, scrub: 1 } }
  );

  gsap.fromTo(
    '.hero-cta',
    { y: 0, opacity: 1 },
    { y: -35, opacity: 0, immediateRender: false, scrollTrigger: { ...scrollBase, scrub: 1 } }
  );
}

/**
 * Animación de parallax de scroll para el mockup del teléfono.
 * Se desplaza más lento que el texto para reforzar el efecto de profundidad.
 */
function registerMockupScrollAnimation(scrollBase: ReturnType<typeof buildScrollBase>) {
  gsap.fromTo(
    '.hero-mockup',
    { y: 0, opacity: 1 },
    { y: -50, opacity: 0, immediateRender: false, scrollTrigger: { ...scrollBase, scrub: 1.5 } }
  );
}

/**
 * Hook que orquesta la animación de entrada y el parallax bidireccional del hero.
 * La animación de entrada se reproduce al montar; el scroll responde en ambas direcciones.
 * @returns Ref del contenedor que delimita el scope de las animaciones GSAP.
 */
export function useHeroAnimations() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      playEntranceAnimation();

      const scrollBase = buildScrollBase(containerRef.current as HTMLElement);
      registerBackgroundScrollAnimations(scrollBase);
      registerTextScrollAnimations(scrollBase);
      registerMockupScrollAnimation(scrollBase);
    },
    { scope: containerRef }
  );

  return containerRef;
}
