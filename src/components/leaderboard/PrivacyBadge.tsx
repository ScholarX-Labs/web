import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";

export function PrivacyBadge() {
  const t = useTranslations("leaderboard.admin");
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning border border-warning/20 ml-2 align-middle">
      <Shield className="h-3 w-3" />
      {t("privateBadge")}
    </span>
  );
}
