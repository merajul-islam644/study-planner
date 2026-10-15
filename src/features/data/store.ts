import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { collection, maybeRecordId } from "../../lib/blocks/data";
import type { BaseRecord, Collection } from "../../lib/blocks/data";
import { useCurrentUser, userDisplayName } from "../profile/useCurrentUser";
import { writeHistory } from "./history";
import type { ChangeLog, StudentProfile } from "./types";

// The signed-in student's IAM user id -- every domain record is stamped with
// it and every query filters by it, so records never leak between accounts.
export function useOwnerId(): string | undefined {
  const me = useCurrentUser();
  return maybeRecordId(me.data?.data as Record<string, unknown> | undefined);
}

export function useActorName(): string {
  const me = useCurrentUser();
  return userDisplayName(me.data?.data) || "Student";
}

type EntityConfig<T extends BaseRecord> = {
  schemaName: string;
  queryName?: string;
  label: string;
};

// Factory for an owner-scoped, soft-deleted collection: returns a list query
// plus create/update/remove mutations that stamp the owner and write history.
export function createEntity<T extends BaseRecord>(config: EntityConfig<T>) {
  const handle: Collection<T> = collection<T>(config.schemaName, { queryName: config.queryName });

  function useList(options?: { includeDeleted?: boolean }) {
    const ownerId = useOwnerId();
    return useQuery({
      enabled: Boolean(ownerId),
      queryKey: [config.schemaName, ownerId, options?.includeDeleted ? "deleted" : "active"],
      queryFn: async () => {
        const page = await handle.list({ filter: { ownerId }, pageNo: 1, pageSize: 500 });
        const items = (page.items ?? []) as (T & { deletedAt?: string | null })[];
        return options?.includeDeleted ? items.filter((item) => Boolean(item.deletedAt)) : items.filter((item) => !item.deletedAt);
      }
    });
  }

  function useMutations() {
    const ownerId = useOwnerId();
    const actorName = useActorName();
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: [config.schemaName] });

    const create = useMutation({
      mutationFn: async (payload: Record<string, unknown>) => {
        if (!ownerId) throw new Error("You must be signed in to save.");
        const created = await handle.create({ ...payload, ownerId, deletedAt: null });
        const id = maybeRecordId(created as Record<string, unknown>) ?? "new";
        await writeHistory(ownerId, actorName, {
          entityType: config.schemaName,
          entityId: id,
          entityName: String(payload.name ?? payload.title ?? payload.question ?? config.label),
          action: "Created",
          summary: `Created ${config.label.toLowerCase()}`
        });
        return created;
      },
      onSuccess: invalidate
    });

    const update = useMutation({
      mutationFn: async ({ id, ...payload }: { id: string } & Record<string, unknown>) => {
        if (!ownerId) throw new Error("You must be signed in to save.");
        const result = await handle.update(id, payload);
        await writeHistory(ownerId, actorName, {
          entityType: config.schemaName,
          entityId: id,
          entityName: String(payload.name ?? payload.title ?? payload.question ?? config.label),
          action: "Updated",
          summary: `Updated ${config.label.toLowerCase()}`
        });
        return result;
      },
      onSuccess: invalidate
    });

    const remove = useMutation({
      mutationFn: ({ id }: { id: string; label?: string }) => handle.update(id, { deletedAt: new Date().toISOString() }),
      onSuccess: invalidate
    });

    const restore = useMutation({
      mutationFn: ({ id }: { id: string }) => handle.update(id, { deletedAt: null }),
      onSuccess: invalidate
    });

    return { create, update, remove, restore } as {
      create: UseMutationResult<unknown, Error, Record<string, unknown>>;
      update: UseMutationResult<unknown, Error, { id: string } & Record<string, unknown>>;
      remove: UseMutationResult<unknown, Error, { id: string; label?: string }>;
      restore: UseMutationResult<unknown, Error, { id: string }>;
    };
  }

  return { handle, useList, useMutations };
}

// Profile is a singleton per student -- created on first sign-in, updated in
// Settings and onboarding. It is not soft-deleted.
const profileHandle = collection<StudentProfile>("StudentProfile");

export function useProfile() {
  const ownerId = useOwnerId();
  return useQuery({
    enabled: Boolean(ownerId),
    queryKey: ["StudentProfile", ownerId],
    queryFn: async () => {
      const page = await profileHandle.list({ filter: { ownerId }, pageNo: 1, pageSize: 1 });
      return page.items?.[0] ?? null;
    }
  });
}

export function useProfileMutations() {
  const ownerId = useOwnerId();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["StudentProfile"] });

  const save = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (!ownerId) throw new Error("You must be signed in to save your profile.");
      const existing = await profileHandle.list({ filter: { ownerId }, pageNo: 1, pageSize: 1 });
      const current = existing.items?.[0];
      const id = maybeRecordId(current as Record<string, unknown> | undefined);
      if (id) return profileHandle.update(id, payload);
      return profileHandle.create({ ...payload, ownerId });
    },
    onSuccess: invalidate
  });

  return { save };
}

export function useChangeLogs(entityType?: string) {
  const ownerId = useOwnerId();
  const handle = collection<ChangeLog>("ChangeLog");
  return useQuery({
    enabled: Boolean(ownerId),
    queryKey: ["ChangeLog", ownerId, entityType ?? "all"],
    queryFn: async () => {
      const page = await handle.list({ filter: { ownerId }, pageNo: 1, pageSize: 200, sort: { createdDate: -1 } });
      const items = page.items ?? [];
      return entityType ? items.filter((entry) => entry.entityType === entityType) : items;
    }
  });
}

export function identityFromClaims(claims: Record<string, unknown> | undefined): string | undefined {
  const value = claims?.name ?? claims?.given_name;
  return typeof value === "string" ? value : undefined;
}
