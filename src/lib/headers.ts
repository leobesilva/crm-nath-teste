export function authHeaders(accessToken?: string | null): Record<string, string> {
  const token = accessToken?.trim().replace(/\s+/g, "");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
