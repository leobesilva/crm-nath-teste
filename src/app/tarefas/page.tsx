import { PageHeader } from "@/components/page-header";
import { TasksClient } from "@/components/tasks-client";
import { listLeads, store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function TasksPage() {
  return (
    <>
      <PageHeader title="Tarefas e follow-ups" description="Agenda comercial para priorizar retornos, diagnósticos, propostas, cobranças e reativações." />
      <TasksClient initialTasks={store.tasks} leads={listLeads()} />
    </>
  );
}
