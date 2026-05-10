export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const statusColor = (status: string | null | undefined): string => {
  switch (status) {
    case "active":
    case "public":
    case "published":
    case "resolved":
      return "green";
    case "inactive":
    case "private":
    case "draft":
    case "pending":
      return "yellow";
    case "archived":
    case "cancelled":
    case "expired":
    case "suspended":
      return "red";
    default:
      return "gray";
  }
};

export const statusLabel = (status: string | null | undefined): string => {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
