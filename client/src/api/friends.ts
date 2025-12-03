const API = import.meta.env.VITE_API_URL;

export type Friend = { id: number; name: string; email: string };
export type FriendRequest = { id: number; user: Friend; created_at: string };

async function withAuth(path: string, init: RequestInit = {}) {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

export async function getFriends(): Promise<Friend[]> {
  const data = await withAuth("/api/friends");
  return data?.friends ?? [];
}

export async function getReceivedRequests(): Promise<FriendRequest[]> {
  const data = await withAuth("/api/friends/requests/received");
  return data?.requests ?? [];
}

export async function getSentRequests(): Promise<FriendRequest[]> {
  const data = await withAuth("/api/friends/requests/sent");
  return data?.requests ?? [];
}

export async function sendFriendRequest(friendId: number): Promise<void | FriendRequest> {
  const data = await withAuth("/api/friends/requests", {
    method: "POST",
    body: JSON.stringify({ friend_id: friendId }),
  });
  return data?.request;
}

export async function acceptFriendRequest(id: number): Promise<void> {
  await withAuth(`/api/friends/requests/${id}/accept`, { method: "POST" });
}

export async function rejectFriendRequest(id: number): Promise<void> {
  await withAuth(`/api/friends/requests/${id}/reject`, { method: "POST" });
}
