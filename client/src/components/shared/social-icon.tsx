import { siGithub, siX, siYoutube } from "simple-icons";
import { BrandIcon, extraBrandIcons } from "./brand-icon";

const icons = { github: siGithub, x: siX, youtube: siYoutube, linkedin: extraBrandIcons.linkedin };

export type SocialIconName = keyof typeof icons;

export const isSocialIcon = (name: string): name is SocialIconName => name in icons;

export function SocialIcon({ name, className }: { name: SocialIconName; className?: string }) {
  return <BrandIcon icon={icons[name]} className={className} />;
}
