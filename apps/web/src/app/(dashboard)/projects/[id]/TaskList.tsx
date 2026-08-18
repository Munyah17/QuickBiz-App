"use client";

import { useActionState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { createProjectTaskAction, updateProjectTaskStatusAction, initialProjectActionState } from "../actions";
import type { ProjectTask } from "@/services/projects";

const STATUSES: ProjectTask["status"][] = ["todo", "in_progress", "done"];

function TaskRow({ task, projectId }: { task: ProjectTask; projectId: string }) {
  const [state, formAction, isPending] = useActionState(updateProjectTaskStatusAction, initialProjectActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.error]);

  return (
    <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-2.5 last:border-b-0">
      <span className={`flex-1 text-sm ${task.status === "done" ? "text-text-tertiary line-through" : "text-text-primary"}`}>
        {task.title}
      </span>
      {task.due_date && <span className="text-xs text-text-tertiary">{new Date(task.due_date).toLocaleDateString()}</span>}
      <form action={formAction}>
        <input type="hidden" name="taskId" value={task.id} />
        <input type="hidden" name="projectId" value={projectId} />
        <select
          name="status"
          defaultValue={task.status}
          disabled={isPending}
          onChange={(e) => e.target.form?.requestSubmit()}
          className="h-8 rounded-md border border-border bg-white px-2 text-xs capitalize focus:outline-none disabled:opacity-50"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </form>
    </div>
  );
}

function AddTaskForm({ projectId }: { projectId: string }) {
  const [state, formAction, isPending] = useActionState(createProjectTaskAction, initialProjectActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.error]);

  return (
    <form action={formAction} className="flex items-center gap-2 border-t border-border-subtle p-3">
      <input type="hidden" name="projectId" value={projectId} />
      <Input name="title" placeholder="Add a task..." required className="flex-1" />
      <Input name="dueDate" type="date" className="w-40" />
      <Button type="submit" size="sm" loading={isPending}>
        <Plus className="size-4" />
        Add
      </Button>
    </form>
  );
}

export function TaskList({ tasks, projectId, canManage }: { tasks: ProjectTask[]; projectId: string; canManage: boolean }) {
  return (
    <div>
      {tasks.length === 0 ? (
        <p className="p-4 text-sm text-text-secondary">No tasks yet.</p>
      ) : (
        <div>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} projectId={projectId} />
          ))}
        </div>
      )}
      {canManage && <AddTaskForm projectId={projectId} />}
    </div>
  );
}
