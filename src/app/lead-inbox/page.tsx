import { redirect } from "next/navigation";
import Link from "next/link";

import { getLeadInboxAccess } from "../../lib/auth/access";
import {
  listAndenOperators,
  listLeadInboxItems,
  type LeadInboxFilters
} from "../../lib/lead-inbox/data";
import {
  createServerSupabaseClient,
  getCurrentUserEmail,
  isActiveOperator
} from "../../lib/supabase/server";

type LeadInboxPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildFilters(
  params: Record<string, string | string[] | undefined>
): LeadInboxFilters {
  return {
    nextAction: single(params.next_action) || null,
    overallFit: single(params.overall_fit) || null,
    commercialState: single(params.commercial_state) || null,
    assignee: single(params.assignee) || null,
    possibleDuplicate:
      single(params.possible_duplicate) === "true" ||
      single(params.possible_duplicate) === "false"
        ? (single(params.possible_duplicate) as "true" | "false")
        : null
  };
}

export default async function LeadInboxPage({
  searchParams
}: LeadInboxPageProps) {
  const supabase = await createServerSupabaseClient();
  const access = await getLeadInboxAccess({
    getCurrentUserEmail: () => getCurrentUserEmail(supabase),
    isActiveOperator: (email) => isActiveOperator(supabase, email)
  });

  if (access.reason === "no_session") {
    redirect("/login?next=/lead-inbox");
  }

  if (!access.allowed) {
    return (
      <main className="narrow-shell">
        <section className="panel stack" aria-labelledby="denied-title">
          <p className="eyebrow">Acceso restringido</p>
          <h1 id="denied-title">Tu email no está habilitado</h1>
          <p className="muted">
            Ingresaste como {access.email}, pero ese email no figura como
            operador activo de Anden.
          </p>
        </section>
      </main>
    );
  }

  const params = (await searchParams) ?? {};
  const filters = buildFilters(params);
  const [leads, operators] = await Promise.all([
    listLeadInboxItems(supabase, filters),
    listAndenOperators(supabase)
  ]);

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="stack">
          <p className="eyebrow">legalfit</p>
          <h1>Lead Inbox</h1>
          <p className="muted">Operador autorizado: {access.email}</p>
        </div>
        <span className="status">
          {leads.length === 1 ? "1 lead" : `${leads.length} leads`}
        </span>
      </header>

      <section className="inbox">
        <form className="filter-bar" action="/lead-inbox">
          <label>
            Accion
            <select name="next_action" defaultValue={filters.nextAction ?? ""}>
              <option value="">Todas</option>
              <option value="schedule_discovery">Discovery</option>
              <option value="specialist_review">Revision especialista</option>
              <option value="high_priority_case">Alta prioridad</option>
              <option value="not_now">No ahora</option>
            </select>
          </label>
          <label>
            Fit
            <select name="overall_fit" defaultValue={filters.overallFit ?? ""}>
              <option value="">Todos</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <label>
            Comercial
            <select
              name="commercial_state"
              defaultValue={filters.commercialState ?? ""}
            >
              <option value="">Todos</option>
              <option value="new">Nuevo</option>
              <option value="contacted">Contactado</option>
              <option value="qualified">Calificado</option>
              <option value="lost">Perdido</option>
              <option value="not_now">No ahora</option>
            </select>
          </label>
          <label>
            Responsable
            <select name="assignee" defaultValue={filters.assignee ?? ""}>
              <option value="">Todos</option>
              <option value="unassigned">Sin asignar</option>
              {operators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Duplicado
            <select
              name="possible_duplicate"
              defaultValue={filters.possibleDuplicate ?? ""}
            >
              <option value="">Todos</option>
              <option value="true">Posible duplicado</option>
              <option value="false">No duplicado</option>
            </select>
          </label>
          <button className="button compact-button" type="submit">
            Filtrar
          </button>
        </form>

        {leads.length === 0 ? (
          <div className="empty-state">
            <div className="stack">
              <h2>Todavía no hay leads para revisar</h2>
              <p className="muted">
                Cuando un intake de Telegram tenga consentimiento completo y
                genere un dossier accionable, va a aparecer acá.
              </p>
            </div>
          </div>
        ) : (
          <div className="lead-list">
            {leads.map((lead) => (
              <Link
                className="lead-row"
                href={`/lead-inbox/${lead.id}`}
                key={lead.id}
              >
                <div className="stack lead-main">
                  <h2>{lead.companyName}</h2>
                  <p className="muted">
                    {lead.contactName ?? "Sin contacto"} ·{" "}
                    {lead.contactEmail ?? "sin email"}
                  </p>
                </div>
                <div className="lead-badges">
                  <span className="badge">{lead.nextAction ?? "sin accion"}</span>
                  <span className="badge">{lead.overallFit ?? "fit unknown"}</span>
                  <span className="badge">
                    {lead.commercialState ?? lead.lifecycleState}
                  </span>
                  {lead.possibleDuplicate ? (
                    <span className="badge danger-badge">duplicado</span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
