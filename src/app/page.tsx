import {
  RiArrowRightLine,
  RiCheckLine,
} from "@remixicon/react";
import { ButtonLink } from "@/components/base/buttons/button";
import { ClientOnly } from "@/components/providers/ClientOnly";
import { ProcessingMachine } from "@/components/machine/ProcessingMachine";
import { WorkspaceScene } from "@/components/machine/WorkspaceScene";
import { ResolveScene } from "@/components/machine/ResolveScene";
import { Footer } from "@/components/sections/Footer";
import { UseCases } from "@/components/sections/UseCases";

const NAV = ["How it Works", "Use Cases", "Pricing", "Customers"];

function Logo() {
  return (
    <a href="#" className="flex items-center gap-2 text-foreground">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <circle cx="16" cy="16" r="14" fill="none" stroke="var(--primary)" strokeWidth="3" />
        <circle cx="16" cy="16" r="8" fill="none" stroke="var(--primary)" strokeWidth="3" />
        <circle cx="16" cy="16" r="3" fill="var(--primary)" />
      </svg>
      <span className="font-serif text-[1.65rem] leading-none tracking-tight">Docflow</span>
    </a>
  );
}

export default function Home() {
  return (
    <div className="relative mx-auto flex w-full max-w-[1440px] flex-1 flex-col border-x border-border">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-[0.95rem] text-muted md:flex">
            {NAV.map((item) => (
              <a key={item} href="#" className="transition-colors hover:text-foreground">
                {item}
              </a>
            ))}
          </nav>
          <ButtonLink href="#" variant="secondary">
            Book a Free Call
          </ButtonLink>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="relative flex flex-col items-center overflow-hidden px-4 pt-20 pb-10 sm:pt-24">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[58%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(239,108,53,0.14),transparent)]"
          />

          <div className="relative max-w-4xl text-center">
            <h1 className="font-serif text-5xl leading-[1.02] font-normal tracking-[-0.02em] text-foreground sm:text-6xl md:text-7xl lg:text-[5.5rem]">
              Turn Paperwork into Approved Documents
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted">
              Inputs go in, approved documents come out. Automate intake, review, and sign-off
              with expert help and enterprise-grade AI.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="#" trailingIcon={RiArrowRightLine}>
                Book a Free Discovery
              </ButtonLink>
              <ButtonLink href="#" variant="secondary">
                Case Studies
              </ButtonLink>
            </div>
          </div>

          <ClientOnly fallback={<div className="relative mt-6 aspect-[840/500] w-full max-w-5xl" />}>
            <ProcessingMachine className="relative mt-6 w-full max-w-5xl" />
          </ClientOnly>
        </section>

        <UseCases />

        {/* Self-healing workflows */}
        <section className="relative border-t border-border px-4 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              Self-healing workflows
            </span>
            <h2 className="mt-6 font-serif text-4xl leading-[1.08] tracking-[-0.02em] text-foreground sm:text-5xl md:text-6xl">
              Failures fix themselves
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Failed syncs, stuck approvals and missing signatures are found and resolved in one
              pass, so your team only sees the work that is finished.
            </p>
          </div>

          <ClientOnly fallback={<div className="mx-auto mt-14 aspect-[920/560] w-full max-w-5xl" />}>
            <ResolveScene className="mx-auto mt-14 w-full max-w-5xl" />
          </ClientOnly>

          <div className="mt-12 flex justify-center">
            <ButtonLink href="#" variant="secondary" trailingIcon={RiArrowRightLine}>
              See how it works
            </ButtonLink>
          </div>
        </section>

        {/* Client workspace */}
        <section className="relative border-t border-border px-4 py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.35fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                Client workspace
              </span>
              <h2 className="mt-6 font-serif text-4xl leading-[1.08] tracking-[-0.02em] text-foreground sm:text-5xl">
                Every client touchpoint, in one place
              </h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
                Reviews, reports, QR sign-ins and client profiles stay in sync across desktop and
                mobile, updated the moment a workflow runs.
              </p>
              <ul className="mt-8 space-y-3 text-foreground">
                {["Live ratings and performance dashboards", "QR codes generated for every document", "Client profiles synced across devices"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="grid size-5 place-items-center rounded-full bg-primary text-white">
                      <RiCheckLine className="size-3.5" aria-hidden />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <ButtonLink href="#" trailingIcon={RiArrowRightLine}>
                  Explore the workspace
                </ButtonLink>
              </div>
            </div>
            <ClientOnly fallback={<div className="aspect-[720/500] w-full" />}>
              <WorkspaceScene className="w-full" />
            </ClientOnly>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
