import type { ComponentType } from "react";
import { ClientOnly } from "@/components/providers/ClientOnly";
import {
  ApprovalsScene,
  CrmScene,
  DocsScene,
  HrScene,
  MailScene,
} from "@/components/machine/UseCaseScenes";

type UseCase = {
  title: string;
  body: string;
  Scene: ComponentType;
  wide?: boolean;
};

const USE_CASES: UseCase[] = [
  {
    title: "Document Generation & Filing",
    body: "Auto-create contracts, proposals, or PDFs and store them where they belong.",
    Scene: DocsScene,
  },
  {
    title: "Email & Slack Workflows",
    body: "Send alerts, follow-ups, or summaries when key events happen.",
    Scene: MailScene,
  },
  {
    title: "CRM & Data Syncing",
    body: "Keep tools like HubSpot, Airtable, or Notion perfectly updated.",
    Scene: CrmScene,
  },
  {
    title: "Internal Approvals",
    body: "Route docs and decisions to the right people in real time.",
    Scene: ApprovalsScene,
    wide: true,
  },
  {
    title: "HR Onboarding & Offboarding",
    body: "Trigger welcome emails, account setup, and checklist tasks the moment someone joins or leaves.",
    Scene: HrScene,
    wide: true,
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="border-t border-border px-4 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          Use Cases
        </span>
        <h2 className="mt-6 font-serif text-4xl leading-[1.08] tracking-[-0.02em] text-foreground sm:text-5xl">
          Automate the work that slows you down
        </h2>
      </div>

      <div className="mx-auto mt-14 grid max-w-6xl gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-6">
        {USE_CASES.map(({ title, body, Scene, wide }) => (
          <article
            key={title}
            className={`flex flex-col bg-surface ${wide ? "lg:col-span-3" : "lg:col-span-2"}`}
          >
            <div className="px-6 pt-6">
              <h3 className="font-serif text-xl leading-snug text-foreground">{title}</h3>
              <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-muted">{body}</p>
            </div>
            <div className={`mt-2 w-full ${wide ? "h-72" : "h-64"}`}>
              <ClientOnly>
                <Scene />
              </ClientOnly>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
