import type { ComponentType } from "react";
import { AiScene } from "@/components/machine/AiScene";
import { CustomSoftwareScene } from "@/components/machine/CustomSoftwareScene";
import { MvpScene } from "@/components/machine/MvpScene";
import { SaasScene } from "@/components/machine/SaasScene";
import { WebMobileScene } from "@/components/machine/WebMobileScene";
import { SpotlightCard } from "@/components/effects/SpotlightCard";
import { ClientOnly } from "@/components/providers/ClientOnly";
import { cx } from "@/utils/cx";

type Service = {
  title: string;
  body: string;
  /** Animated isometric illustration. */
  Scene: ComponentType<{ className?: string }>;
  wide?: boolean;
};

const SERVICES: Service[] = [
  {
    title: "AI Solutions",
    body: "Agents, copilots and ML pipelines wired into the systems you already run, so every workflow gets a little smarter.",
    Scene: AiScene,
    wide: true,
  },
  {
    title: "SaaS Platforms",
    body: "Multi-tenant products with auth, billing and analytics built in, ready to scale from the first customer to the thousandth.",
    Scene: SaasScene,
    wide: true,
  },
  {
    title: "Custom Software",
    body: "Internal tools and integrations shaped around how your team really works.",
    Scene: CustomSoftwareScene,
  },
  {
    title: "Web & Mobile Apps",
    body: "Fast, accessible apps for every screen, from first sketch to store release.",
    Scene: WebMobileScene,
  },
  {
    title: "MVP Development",
    body: "A focused first version in weeks, so you learn from real users sooner.",
    Scene: MvpScene,
  },
];

export function Services() {
  return (
    <section id="services" className="border-t border-border px-4 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          Services
        </span>
        <h2 className="mt-6 font-serif text-4xl leading-[1.08] tracking-[-0.02em] text-foreground sm:text-5xl">
          Everything you need to ship, under one roof
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
          From an AI pilot to a full product launch, one team designs, builds and runs it with you.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-6xl gap-3 md:grid-cols-6">
        {SERVICES.map(({ title, body, Scene, wide }) => (
          <SpotlightCard
            key={title}
            className={cx(
              "flex flex-col rounded-3xl border border-border-button-default bg-background-primary-default p-2 shadow-xs",
              wide ? "md:col-span-3" : "md:col-span-2",
            )}
          >
            <div
              className={cx(
                "overflow-hidden rounded-2xl border border-border-button-default bg-background-secondary-default",
                wide ? "h-72 lg:h-80" : "h-72",
              )}
            >
              <ClientOnly>
                <Scene className="h-full w-full p-3" />
              </ClientOnly>
            </div>
            <div className="px-4 pt-5 pb-5">
              <h3 className="text-title-3-semibold text-text-primary">{title}</h3>
              <p className="mt-2 max-w-md text-body-regular text-text-secondary">{body}</p>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
}
