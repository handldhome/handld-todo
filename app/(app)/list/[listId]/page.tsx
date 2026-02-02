import { TaskList } from '@/components/tasks/TaskList';

interface ListPageProps {
  params: Promise<{
    listId: string;
  }>;
}

export default async function ListPage({ params }: ListPageProps) {
  const { listId } = await params;
  return <TaskList listId={listId} />;
}
