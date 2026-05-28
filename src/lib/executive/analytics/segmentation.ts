export function isInternalAdminSurface(pathname: string): boolean {
  return pathname === "/admin"
    || pathname.startsWith("/admin/")
    || pathname === "/api/admin"
    || pathname.startsWith("/api/admin/");
}
