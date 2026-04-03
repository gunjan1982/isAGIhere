import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export type EntityType = "person" | "source" | "community";

export interface Follow {
  id: number;
  userId: string;
  entityType: string;
  entityId: number;
  createdAt: string;
}

export interface CustomSource {
  id: number;
  userId: string;
  name: string;
  url: string;
  platform: string;
  createdAt: string;
}

export interface HubData {
  people: any[];
  sources: any[];
  communities: any[];
  customSources: CustomSource[];
}

export function useFollows() {
  const { isSignedIn } = useUser();

  return useQuery<Follow[]>({
    queryKey: ["user-follows"],
    queryFn: () => apiFetch("/api/user/follows"),
    enabled: !!isSignedIn,
    staleTime: 30_000,
  });
}

export function useIsFollowing(entityType: EntityType, entityId: number) {
  const { data: follows } = useFollows();
  if (!follows) return false;
  return follows.some(f => f.entityType === entityType && f.entityId === entityId);
}

export function useFollowMutations() {
  const qc = useQueryClient();

  const follow = useMutation({
    mutationFn: ({ entityType, entityId }: { entityType: EntityType; entityId: number }) =>
      apiFetch("/api/user/follows", {
        method: "POST",
        body: JSON.stringify({ entityType, entityId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-follows"] });
      qc.invalidateQueries({ queryKey: ["user-hub"] });
    },
  });

  const unfollow = useMutation({
    mutationFn: ({ entityType, entityId }: { entityType: EntityType; entityId: number }) =>
      apiFetch("/api/user/follows", {
        method: "DELETE",
        body: JSON.stringify({ entityType, entityId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-follows"] });
      qc.invalidateQueries({ queryKey: ["user-hub"] });
    },
  });

  return { follow, unfollow };
}

export function useUserHub() {
  const { isSignedIn } = useUser();

  return useQuery<HubData>({
    queryKey: ["user-hub"],
    queryFn: () => apiFetch("/api/user/hub"),
    enabled: !!isSignedIn,
    staleTime: 30_000,
  });
}

export function useCustomSources() {
  const { isSignedIn } = useUser();

  return useQuery<CustomSource[]>({
    queryKey: ["custom-sources"],
    queryFn: () => apiFetch("/api/user/custom-sources"),
    enabled: !!isSignedIn,
    staleTime: 30_000,
  });
}

export function useCustomSourceMutations() {
  const qc = useQueryClient();

  const add = useMutation({
    mutationFn: ({ name, url, platform }: { name: string; url: string; platform: string }) =>
      apiFetch("/api/user/custom-sources", {
        method: "POST",
        body: JSON.stringify({ name, url, platform }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-sources"] });
      qc.invalidateQueries({ queryKey: ["user-hub"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/user/custom-sources/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-sources"] });
      qc.invalidateQueries({ queryKey: ["user-hub"] });
    },
  });

  return { add, remove };
}
