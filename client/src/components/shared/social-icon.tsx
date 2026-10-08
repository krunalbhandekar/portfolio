import { siGithub, siX } from "simple-icons";
import { BrandIcon, extraBrandIcons } from "./brand-icon";

const icons = { github: siGithub, x: siX, linkedin: extraBrandIcons.linkedin };

export type SocialIconName = keyof typeof icons;

export function SocialIcon({ name, className }: { name: SocialIconName; className?: string }) {
  return <BrandIcon icon={icons[name]} className={className} />;
}
