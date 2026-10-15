import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "../data/entities";
import type { Notification } from "../data/types";
import { recordId } from "../../lib/blocks/data";

export function useNotificationsList() {
  return notifications.useList();
}

export function useUnreadCount() {
  const list = notifications.useList();
  return {
    ...list,
    data: (list.data ?? []).filter((entry) => !entry.read).length
  };
}

export function useNotificationMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["Notification"] });
  const list = notifications.useList();

  const markRead = useMutation({
    mutationFn: (entry: Notification) => notifications.handle.update(recordId(entry), { read: true }),
    onSuccess: invalidate
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = (list.data ?? []).filter((entry) => !entry.read);
      await Promise.all(unread.map((entry) => notifications.handle.update(recordId(entry), { read: true })));
    },
    onSuccess: invalidate
  });

  const remove = useMutation({
    mutationFn: (entry: Notification) => notifications.handle.remove(recordId(entry)),
    onSuccess: invalidate
  });

  return { markRead, markAllRead, remove };
}
