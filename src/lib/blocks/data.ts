import { blocksClient } from "./client";

// Thin, typed wrapper around the SDK's runtime collection helpers. Every
// domain record carries `ownerId` (the signed-in IAM user id) and is filtered
// by it, so one student never sees another's work even though the tenant is
// shared. Soft deletion uses `deletedAt`; a record with a value there lives in
// Trash and can be restored.
export type BaseRecord = {
  ItemId?: string;
  itemId?: string;
  createdDate?: string;
  lastUpdatedDate?: string;
};

export type RecordId = string;

export function recordId(record: BaseRecord | Record<string, unknown> | undefined): string {
  if (!record) throw new Error("Record is missing an id.");
  const raw = (record as BaseRecord).ItemId ?? (record as BaseRecord).itemId;
  if (!raw) throw new Error("Record is missing an id.");
  return String(raw);
}

export function maybeRecordId(record: Record<string, unknown> | undefined): string | undefined {
  if (!record) return undefined;
  const raw = record.ItemId ?? record.itemId;
  return raw ? String(raw) : undefined;
}

export type Page<T> = { items: T[]; totalCount: number };

// The Data Gateway wraps results differently depending on operation; this
// unwraps every shape the runtime returns for a paged list.
export function normalizeList<T>(response: unknown, queryName: string): Page<T> {
  const root = response as Record<string, unknown> | undefined;
  const data = (root?.data as Record<string, unknown> | undefined) ?? root;
  const gateway = (data?.[queryName] as { items?: T[]; totalCount?: number } | undefined) ?? undefined;
  const items = gateway?.items ?? (data?.items as T[] | undefined) ?? (root?.items as T[] | undefined) ?? [];
  return {
    items,
    totalCount: gateway?.totalCount ?? (data?.totalCount as number | undefined) ?? (root?.totalCount as number | undefined) ?? items.length
  };
}

export type Collection<T extends BaseRecord> = {
  list: (options?: ListOptions) => Promise<Page<T>>;
  get: (id: RecordId) => Promise<T>;
  create: (payload: Record<string, unknown>) => Promise<T>;
  update: (id: RecordId, payload: Record<string, unknown>) => Promise<unknown>;
  remove: (id: RecordId) => Promise<unknown>;
};

export type ListOptions = {
  fields?: string[];
  filter?: Record<string, unknown>;
  pageNo?: number;
  pageSize?: number;
  sort?: Record<string, unknown>;
};

// The SDK helper builds `<schemaName>s` naively when reading generated query
// names, so callers pass the schema name and we derive the read query name the
// same way the server does (`Subject` -> `getSubjects`).
export function collection<T extends BaseRecord>(schemaName: string, options?: { fields?: string[]; queryName?: string }): Collection<T> {
  const handle = blocksClient.data.collection<T>(schemaName, { fields: options?.fields });
  const queryName = options?.queryName ?? `get${schemaName}s`;

  return {
    async list(listOptions) {
      const response = await handle.list({
        fields: listOptions?.fields ?? options?.fields,
        filter: listOptions?.filter,
        pageNo: listOptions?.pageNo ?? 1,
        pageSize: listOptions?.pageSize ?? 200,
        sort: listOptions?.sort
      });
      return normalizeList<T>(response, queryName);
    },
    async get(id) {
      const response = await handle.get(id);
      return unwrapItem<T>(response);
    },
    async create(payload) {
      const response = await handle.create(payload as Partial<T>);
      return unwrapItem<T>(response);
    },
    update(id, payload) {
      return handle.update(id, payload as Partial<T>);
    },
    remove(id) {
      return handle.delete(id, { hardDelete: true });
    }
  };
}

function unwrapItem<T>(response: unknown): T {
  const root = response as Record<string, unknown> | undefined;
  const data = (root?.data as Record<string, unknown> | undefined) ?? root;
  for (const value of Object.values(data ?? {})) {
    if (value && typeof value === "object") {
      const candidate = value as { items?: unknown[] };
      if (Array.isArray(candidate.items) && candidate.items.length > 0) return candidate.items[0] as T;
      if (!("items" in candidate)) return value as T;
    }
  }
  return (root as T);
}

// A GraphQL error array on a 200 response is still a failure.
export function assertNoErrors(response: unknown): void {
  const errors = (response as { errors?: unknown[] } | undefined)?.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0] as { message?: string } | string;
    throw new Error(typeof first === "string" ? first : first?.message ?? "The request failed.");
  }
}
