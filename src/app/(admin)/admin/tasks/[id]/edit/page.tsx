import { notFound } from "next/navigation";
import { AdminTaskForm } from "@/components/AdminTaskForm";
import { getTaskWithSlots } from "@/core/tasks";
import { formatWallTimeInZone } from "@/core/time";
import { earlyAccessHours } from "@/core/tasks";
import { appTimeZone } from "@/i18n/config";
import { requireAdminSession } from "../../../session";
import { editTaskAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function EditTask({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();

  const { id } = await params;
  const task = await getTaskWithSlots(id);
  if (!task) notFound();

  const timeZone = appTimeZone();

  return (
    <>
      <p className="backlink">
        <a href={`/admin/tasks/${task.id}`}>Back to the task</a>
      </p>

      <div className="masthead">
        <h1>Edit task</h1>
        <p>
          {task.slotsTaken === 0
            ? "Nobody has claimed a spot yet."
            : `${task.slotsTaken} already hold a spot, so the number of helpers cannot go below that.`}
        </p>
      </div>

      <AdminTaskForm
        action={editTaskAction}
        initial={{
          title: task.title,
          description: task.description,
          location: task.location,
          openTo: task.openTo,
          urgent: task.urgent ? "true" : "",
          important: task.important ? "true" : "",
          startsAt: task.startsAt ? formatWallTimeInZone(task.startsAt, timeZone) : "",
          dueBy: formatWallTimeInZone(task.dueBy, timeZone),
          slotsNeeded: String(task.slotsNeeded),
        }}
        hiddenFields={{ id: task.id }}
        submitLabel="Save changes"
        pendingLabel="Saving"
        earlyAccessHours={earlyAccessHours()}
        timeZoneLabel={timeZone.replace(/_/g, " ")}
      />
    </>
  );
}
