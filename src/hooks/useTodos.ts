import { useCallback, useEffect, useState } from 'react';
import {
  completeTodo,
  createTodo,
  deleteTodo,
  listTodosByDate,
  uncompleteTodo,
  updateTodoDoneFor,
} from '@/db/repositories/todoRepo';
import { toDateKey } from '@/lib/id';
import type { Todo, TodoDoneFor } from '@/types/models';

/** 今日のTODOリストを扱うフック */
export function useTodos(date: string = toDateKey(new Date())) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const rows = await listTodosByDate(date);
    setTodos(rows);
  }, [date]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listTodosByDate(date)
      .then((rows) => {
        if (mounted) setTodos(rows);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [date]);

  const add = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      await createTodo(date, trimmed);
      await reload();
    },
    [date, reload]
  );

  /** 完了にする。「誰のためにやったか」は必須（todoRepo参照） */
  const complete = useCallback(
    async (id: string, doneFor: TodoDoneFor) => {
      await completeTodo(id, doneFor);
      await reload();
    },
    [reload]
  );

  const uncomplete = useCallback(
    async (id: string) => {
      await uncompleteTodo(id);
      await reload();
    },
    [reload]
  );

  const changeDoneFor = useCallback(
    async (id: string, doneFor: TodoDoneFor) => {
      await updateTodoDoneFor(id, doneFor);
      await reload();
    },
    [reload]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteTodo(id);
      await reload();
    },
    [reload]
  );

  const completedCount = todos.filter((t) => t.completedAt !== null).length;

  return {
    todos,
    loading,
    completedCount,
    total: todos.length,
    add,
    complete,
    uncomplete,
    changeDoneFor,
    remove,
    reload,
  };
}
