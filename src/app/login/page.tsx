import { requestMagicLink } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="narrow-shell">
      <section className="panel stack" aria-labelledby="login-title">
        <div className="stack">
          <p className="eyebrow">Anden Lead Inbox</p>
          <h1 id="login-title">Ingresar a legalfit</h1>
          <p className="muted">
            Usá tu email autorizado de Anden para recibir un magic link de
            acceso.
          </p>
        </div>

        {error ? (
          <p className="danger" role="alert">
            No pudimos enviar el link. Revisá el email e intentá de nuevo.
          </p>
        ) : null}

        <form className="stack" action={requestMagicLink}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nombre@anden.example"
            />
          </div>
          <button className="button" type="submit">
            Enviar magic link
          </button>
        </form>
      </section>
    </main>
  );
}
