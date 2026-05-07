import { redirect } from "next/navigation";
import Link from "next/link";

import { getLeadInboxAccess } from "../../lib/auth/access";
import { listLeadInboxItems } from "../../lib/lead-inbox/data";
import {
  createServerSupabaseClient,
  getCurrentUserEmail,
  isActiveOperator
} from "../../lib/supabase/server";

export default async function LeadInboxPage() {
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

  const leads = await listLeadInboxItems(supabase);

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
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
