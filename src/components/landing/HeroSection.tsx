'use client';

import type { ReactNode } from 'react';
import { AppMockup } from './AppMockup';
import { useHeroAnimations } from '@/hooks/useHeroAnimations';

interface HeroSectionProps {
  /**
   * Botón de inicio de sesión proveniente del Server Component.
   * Se pasa como ReactNode para preservar el límite servidor/cliente
   * sin perder las Server Actions del formulario de login.
   */
  signInButton: ReactNode;
}

/**
 * Fondo decorativo de la sección hero con destellos de luz animables por GSAP.
 * Utiliza clases con prefijo hero- para ser objetivo de las animaciones del hook.
 */
function HeroBackground() {
  return (
    <>
      <div
        aria-hidden
        className="hero-glow-primary absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden
        className="hero-glow-secondary absolute top-20 left-1/4 w-64 h-64 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none"
      />
    </>
  );
}

/**
 * Bloque de texto principal del hero: título, descripción y botón de acción.
 */
function HeroContent({ signInButton }: { signInButton: ReactNode }) {
  return (
    <div className="flex-1 text-center lg:text-left">
      <h1 className="hero-title text-5xl lg:text-6xl font-black leading-[1.05] mb-6">
        Registra tu gym
        <br />
        <span className="text-emerald-400">en 5 segundos.</span>
      </h1>

      <p className="hero-description text-slate-400 text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
        Habla, saca una foto o escribe. FitAI extrae tus series, pesos y reps
        con IA — y te muestra exactamente cómo progresas semana a semana.
      </p>

      <div className="hero-cta flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
        {signInButton}
      </div>
    </div>
  );
}

/**
 * Sección hero de la landing page con animación de entrada y parallax de scroll bidireccional.
 * Los destellos de fondo y el contenido textual reaccionan al desplazamiento
 * tanto hacia abajo como hacia arriba gracias al scrub de GSAP ScrollTrigger.
 */
export function HeroSection({ signInButton }: HeroSectionProps) {
  const containerRef = useHeroAnimations();

  return (
    <section ref={containerRef} className="relative overflow-hidden">
      <HeroBackground />

      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 lg:pt-28 lg:pb-24">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <HeroContent signInButton={signInButton} />

          <div className="hero-mockup flex-shrink-0 w-full lg:w-auto">
            <AppMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
