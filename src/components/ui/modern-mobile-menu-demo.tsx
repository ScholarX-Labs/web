import React from "react"
import { InteractiveMenu, type InteractiveMenuItem } from "@/components/ui/modern-mobile-menu"
import { Home, Briefcase, Calendar, Shield, Settings } from "lucide-react"

const lucideDemoMenuItems: InteractiveMenuItem[] = [
  { label: "home", icon: Home },
  { label: "strategy", icon: Briefcase },
  { label: "period", icon: Calendar },
  { label: "security", icon: Shield },
  { label: "settings", icon: Settings },
]

const customAccentColor = "var(--chart-2)"

function ModernMobileMenuDefault() {
  return <InteractiveMenu />
}

function ModernMobileMenuCustomized() {
  return <InteractiveMenu items={lucideDemoMenuItems} accentColor={customAccentColor} />
}

export { ModernMobileMenuDefault, ModernMobileMenuCustomized }
