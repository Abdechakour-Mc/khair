import { AdminTaskForm } from "@/components/AdminTaskForm";
import { appTimeZone } from "@/i18n/config";
import { requireAdminSession } from "../../session";
import { publishTaskAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewTask() {
  await requireAdminSession();

  return (
    <>
      <p className="backlink">
        <a href="/admin/tasks">All tasks</a>
      </p>

      <div className="masthead">
        <h1>Publish a task</h1>
      </div>

      <AdminTaskForm
        action={publishTaskAction}
        submitLabel="Publish task"
        pendingLabel="Publishing"
        timeZoneLabel={appTimeZone().replace(/_/g, " ")}
      />
    </>
  );
}
