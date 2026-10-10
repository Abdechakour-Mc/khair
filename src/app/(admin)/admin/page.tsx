import { signInAction } from "./actions";
import { AdminDashboard } from "./dashboard";
import { hasAdminSession } from "./session";

export const dynamic = "force-dynamic";

const PROBLEMS: Record<string, string> = {
  wrong_password: "That password does not match.",
  not_configured:
    "No admin password is set on the server. Set ADMIN_PASSWORD before anyone can sign in.",
};

export default async function AdminSignIn({
  searchParams,
}: {
  searchParams: Promise<{ problem?: string }>;
}) {
  // Signed in, this is home: the Admin lands on where things stand rather
  // than on a bare list of everything ever published.
  if (await hasAdminSession()) return <AdminDashboard />;

  const { problem } = await searchParams;
  const message = problem ? PROBLEMS[problem] : undefined;

  return (
    <>
      <div className="masthead">
        <h1>Khair admin</h1>
        <p>Publishing tasks and recording what happened.</p>
      </div>

      <form action={signInAction} className="signup-form">
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={message ? true : undefined}
            aria-describedby={message ? "password-problem" : undefined}
          />
          {message ? (
            <p className="problem" id="password-problem" role="alert">
              {message}
            </p>
          ) : null}
        </div>

        <button type="submit" className="action">
          Sign in
        </button>
      </form>
    </>
  );
}
