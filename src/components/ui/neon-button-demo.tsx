import { NeonButton } from "@/components/ui/neon-button";

export function NeonButtonDefault() {
  return (
    <div className="flex flex-col gap-3 items-center">
      <NeonButton>Button</NeonButton>
      <NeonButton neon={false}>normal button</NeonButton>
      <NeonButton variant="solid">solid</NeonButton>
    </div>
  );
}
