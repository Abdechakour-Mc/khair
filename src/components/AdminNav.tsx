import { signOutAction } from "@/app/(admin)/admin/actions";
import { mosqueIdentity } from "@/config/mosque";

export type AdminSection = "home" | "tasks" | "volunteers" | "data";

const SECTIONS: { id: AdminSection; href: string; label: string }[] = [
  { id: "home", href: "/admin", label: "Home" },
  { id: "tasks", href: "/admin/tasks", label: "Tasks" },
  { id: "volunteers", href: "/admin/volunteers", label: "People" },
  { id: "data", href: "/admin/data", label: "Data" },
];

/**
 * The Admin's own navigation, on every signed-in page.
 *
 * It replaces three pages each carrying their own improvised header, where
 * "Data" was an underlined word wedged between the wordmark and Sign out and
 * read as a stray link rather than as a place you could go. An Admin who can
 * see the three places they can be, and which one they are in, is the whole
 * point: this view is used standing up, in a hurry, usually on a phone.
 *
 * One line at every width. The labels are one word each so they do not wrap,
 * and sign out sits apart from them, because leaving is not a section.
 */
export function AdminNav({ current }: { current: AdminSection }) {
  const mosque = mosqueIdentity("en");

  return (
    <header className="admin-head">
      <div className="topbar">
        <a className="brand" href="/admin">
          <span className="brand-text">
            <span className="wordmark">Khair admin</span>
            {mosque.name ? <span className="brand-org">{mosque.name}</span> : null}
          </span>
        </a>
        <form action={signOutAction}>
          <button type="submit" className="linkish">
            Sign out
          </button>
        </form>
      </div>

      <nav className="admin-nav" aria-label="Admin sections">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={section.href}
            aria-current={current === section.id ? "page" : undefined}
          >
            {section.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
