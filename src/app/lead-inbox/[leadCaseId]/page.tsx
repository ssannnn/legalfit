import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { getLeadInboxAccess } from "../../../lib/auth/access";
import {
  getLeadCaseDetail,
  listAndenOperators
} from "../../../lib/lead-inbox/data";
import {
  createServerSupabaseClient,
  getCurrentUserEmail,
  isActiveOperator
} from "../../../lib/supabase/server";
import {
  addLeadNote,
  assignLeadCase,
  updateCommercialState
} from "./actions";

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

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function TextList({ values }: { values: unknown }) {
  const items = asArray(values);

  if (items.length === 0) return <p className="muted">Sin datos</p>;

  return (
    <ul className="plain-list">
      {items.map((item, index) => (
        <li key={`${String(item)}-${index}`}>{String(item)}</li>
      ))}
    </ul>
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

  const [lead, operators] = await Promise.all([
    getLeadCaseDetail(supabase, leadCaseId),
    listAndenOperators(supabase)
  ]);

  if (!lead) {
    notFound();
  }

  const andenDossier = asRecord(lead.andenDossier);
  const fitDimensions = asRecord(andenDossier.fitDimensions);
  const exportProfile = asRecord(andenDossier.exportProfile);
  const company = asRecord(andenDossier.company);
  const declaredDocumentation = asRecord(andenDossier.declaredDocumentation);

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
        <div className="lead-badges">
          <span className="status">{lead.nextAction ?? "sin accion"}</span>
          <span className="badge">{lead.overallFit ?? "fit unknown"}</span>
          <span className="badge">{lead.lifecycleState}</span>
          <span className="badge">{lead.commercialState ?? "sin estado"}</span>
        </div>
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
            <div>
              <dt>Posible duplicado</dt>
              <dd>{lead.possibleDuplicate ? "si" : "no"}</dd>
            </div>
          </dl>
        </section>

        <section className="detail-card">
          <h2>Operaciones</h2>
          <form className="operation-form" action={assignLeadCase}>
            <input type="hidden" name="leadCaseId" value={lead.id} />
            <label>
              Responsable
              <select
                name="operatorId"
                defaultValue={lead.assignedOperatorId ?? ""}
              >
                <option value="">Sin asignar</option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="button compact-button" type="submit">
              Asignar
            </button>
          </form>
          <form className="operation-form" action={updateCommercialState}>
            <input type="hidden" name="leadCaseId" value={lead.id} />
            <label>
              Estado comercial
              <select
                name="commercialState"
                defaultValue={lead.commercialState ?? "new"}
              >
                <option value="new">Nuevo</option>
                <option value="contacted">Contactado</option>
                <option value="qualified">Calificado</option>
                <option value="lost">Perdido</option>
                <option value="not_now">No ahora</option>
              </select>
            </label>
            <button className="button compact-button" type="submit">
              Guardar
            </button>
          </form>
        </section>

        <section className="detail-card">
          <h2>Empresa y perfil exportador</h2>
          <dl className="definition-list">
            <div>
              <dt>Empresa</dt>
              <dd>{String(company.name ?? lead.companyName)}</dd>
            </div>
            <div>
              <dt>Contacto</dt>
              <dd>
                {String(company.contactName ?? lead.contactName ?? "Sin contacto")}
              </dd>
            </div>
            <div>
              <dt>Actividad</dt>
              <dd>{String(exportProfile.activityType ?? "unknown")}</dd>
            </div>
            <div>
              <dt>Rango exportador</dt>
              <dd>{String(exportProfile.exportRevenueRange ?? "unknown")}</dd>
            </div>
            <div>
              <dt>Paises</dt>
              <dd>
                {asArray(exportProfile.countries).map(String).join(", ") ||
                  "Sin datos"}
              </dd>
            </div>
          </dl>
        </section>

        <JsonPreview
          title="Fit dimensions"
          value={fitDimensions}
        />

        <section className="detail-card">
          <h2>Datos faltantes e inconsistencias</h2>
          <h3>Missing critical fields</h3>
          <TextList values={andenDossier.missingCriticalFields} />
          <h3>Non-blocking unknowns</h3>
          <TextList values={andenDossier.nonBlockingUnknownFields} />
          <h3>Inconsistencias</h3>
          <TextList values={andenDossier.inconsistencies} />
        </section>

        <JsonPreview
          title="Documentacion declarada"
          value={declaredDocumentation}
        />

        <section className="detail-card">
          <h2>Fuentes</h2>
          <ul className="plain-list">
            {asArray(andenDossier.sourceReferences).map((source, index) => {
              const record = asRecord(source);
              return (
                <li key={`${String(record.ruleId)}-${index}`}>
                  <a href={String(record.sourceUrl)}>{String(record.sourceLabel)}</a>
                </li>
              );
            })}
          </ul>
        </section>

        <details className="detail-card">
          <summary>Transcript y mensajes</summary>
          <ol className="message-list">
            {lead.messages.map((message) => (
              <li key={message.id}>
                <strong>{message.direction}</strong>{" "}
                <span className="muted">{message.messageType}</span>
                <p>{message.transcript ?? message.text ?? "Sin texto"}</p>
              </li>
            ))}
          </ol>
        </details>

        <section className="detail-card">
          <h2>Notas internas</h2>
          <form className="operation-form" action={addLeadNote}>
            <input type="hidden" name="leadCaseId" value={lead.id} />
            <label>
              Nueva nota
              <textarea name="body" rows={4} />
            </label>
            <button className="button compact-button" type="submit">
              Agregar nota
            </button>
          </form>
          <ol className="message-list">
            {lead.notes.map((note) => (
              <li key={note.id}>
                <p>{note.body}</p>
                <span className="muted">{note.createdAt}</span>
              </li>
            ))}
          </ol>
        </section>

        <JsonPreview title="User summary" value={lead.userSummary} />
        <JsonPreview title="Anden dossier snapshot inmutable" value={lead.andenDossier} />
      </section>
    </main>
  );
}
