import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { getLeadInboxAccess } from "../../../lib/auth/access";
import { getLeadCaseDetail } from "../../../lib/lead-inbox/data";
import {
  createServerSupabaseClient,
  getCurrentUserEmail,
  isActiveOperator
} from "../../../lib/supabase/server";

type LeadCaseDetailPageProps = {
  params: Promise<{
    leadCaseId: string;
  }>;
};

function JsonPreview({
  title,
  value
}: {
  title: string;
  value: Record<string, unknown> | null;
}) {
  return (
    <section className="detail-card">
      <h2>{title}</h2>
      <pre>{JSON.stringify(value ?? {}, null, 2)}</pre>
    </section>
  );
}

export default async function LeadCaseDetailPage({
  params
}: LeadCaseDetailPageProps) {
  const { leadCaseId } = await params;
  const supabase = await createServerSupabaseClient();
  const access = await getLeadInboxAccess({
    getCurrentUserEmail: () => getCurrentUserEmail(supabase),
    isActiveOperator: (email) => isActiveOperator(supabase, email)
  });

  if (access.reason === "no_session") {
    redirect("/login?next=/lead-inbox");
  }

  if (!access.allowed) {
    redirect("/lead-inbox");
  }

  const lead = await getLeadCaseDetail(supabase, leadCaseId);

  if (!lead) {
    notFound();
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="stack">
          <Link className="back-link" href="/lead-inbox">
            Volver al inbox
          </Link>
          <p className="eyebrow">Lead dossier</p>
          <h1>{lead.companyName}</h1>
          <p className="muted">
            {lead.contactName ?? "Sin contacto"} ·{" "}
            {lead.contactEmail ?? "sin email"}
          </p>
        </div>
        <span className="status">{lead.nextAction ?? "sin accion"}</span>
      </header>

      <section className="detail-grid">
        <section className="detail-card">
          <h2>Estado operativo</h2>
          <dl className="definition-list">
            <div>
              <dt>Lifecycle</dt>
              <dd>{lead.lifecycleState}</dd>
            </div>
            <div>
              <dt>Estado comercial</dt>
              <dd>{lead.commercialState ?? "sin estado"}</dd>
            </div>
            <div>
              <dt>Overall fit</dt>
              <dd>{lead.overallFit ?? "unknown"}</dd>
            </div>
            <div>
              <dt>Exporter</dt>
              <dd>{lead.exporterClassification ?? "unknown"}</dd>
            </div>
            <div>
              <dt>Export type</dt>
              <dd>{lead.exportType ?? "unknown"}</dd>
            </div>
          </dl>
        </section>

        <JsonPreview title="Company profile" value={lead.profileData} />
        <JsonPreview title="User summary" value={lead.userSummary} />
        <JsonPreview title="Anden dossier" value={lead.andenDossier} />
      </section>
    </main>
  );
}
