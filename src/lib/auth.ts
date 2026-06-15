export const USER_ROLES = ["Admin", "Gestor", "Usuario Basico"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type AuthProfile = {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
};

export function normalizeRole(role?: string | null): UserRole {
  if (role === "Admin" || role === "Gestor" || role === "Usuario Basico") return role;
  if (role === "Comercial") return "Gestor";
  if (role === "Visualização" || role === "Visualizacao") return "Usuario Basico";
  return "Usuario Basico";
}

export function can(role: string | null | undefined, action: "export" | "lgpd" | "manageUsers" | "edit" | "configure") {
  const normalized = normalizeRole(role);
  if (normalized === "Admin") return true;
  if (normalized === "Gestor") return action === "edit" || action === "configure";
  return false;
}

export function visibleRoutes(role: string | null | undefined) {
  const normalized = normalizeRole(role);
  if (normalized === "Admin") return "all";
  if (normalized === "Gestor") {
    return new Set(["/", "/leads", "/pipeline", "/importacao", "/entrada-bruta", "/automacoes", "/campanhas", "/produtos", "/tarefas", "/historico", "/integracoes"]);
  }
  return new Set(["/", "/leads", "/pipeline", "/tarefas", "/historico"]);
}
