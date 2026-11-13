import { createFileRoute } from "@tanstack/react-router";
import { ReactNode, Suspense, lazy, useEffect, useRef, useState } from "react";
import { IntroSection } from "@/components/sections/IntroSection";
import { generateMetaTags } from "@/lib/og-image";

const EcosystemAtlasSection = lazy(() =>
  import("@/components/sections/EcosystemAtlasSection").then((module) => ({
    default: module.EcosystemAtlasSection,
  }))
);
const EconomicsSection = lazy(() =>
  import("@/components/sections/EconomicsSection").then((module) => ({
    default: module.EconomicsSection,
  }))
);
const PartnersSection = lazy(() =>
  import("@/components/sections/PartnersSection").then((module) => ({
    default: module.PartnersSection,
  }))
);

function SectionFallback() {
  return (
    <div className="min-h-[220px] rounded-lg border border-border/40 bg-muted/20 animate-pulse" />
  );
}

function DeferredSection({
  children,
  eager = false,
}: {
  children: ReactNode;
  eager?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(eager);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isVisible) return;

    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <div ref={sectionRef}>
      {isVisible ? (
        <Suspense fallback={<SectionFallback />}>{children}</Suspense>
      ) : (
        <SectionFallback />
      )}
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: generateMetaTags({
      title: "Realms World - Blitz, Frontier and Eternum",
      description:
        "Blitz, Frontier and Eternum are AI-native onchain games, and LORDS is the token of their ecosystem.",
      path: "/",
    }),
  }),
});

function SectionDivider() {
  return (
    <div className="relative h-px mx-auto max-w-5xl">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
    </div>
  );
}

function HomePage() {
  return (
    <>
      <div id="hero">
        <IntroSection />
      </div>
      <SectionDivider />
      <div id="games">
        <DeferredSection eager>
          <EcosystemAtlasSection />
        </DeferredSection>
      </div>
      <SectionDivider />
      <div id="economics">
        <DeferredSection>
          <EconomicsSection />
        </DeferredSection>
      </div>
      <SectionDivider />
      <div id="partners">
        <DeferredSection>
          <PartnersSection />
        </DeferredSection>
      </div>
    </>
  );
}
