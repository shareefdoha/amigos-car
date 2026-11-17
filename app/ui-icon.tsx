import type { SVGProps } from 'react';

type IconName = 'arrow-up-right' | 'arrow-left' | 'chevron-left' | 'chevron-right' | 'menu' | 'close' | 'search' | 'sparkle' | 'diamond' | 'check';
const paths: Record<IconName, React.ReactNode> = {
  'arrow-up-right': <path d="M7 17 17 7M7 7h10v10" />,
  'arrow-left': <path d="M19 12H5m7-7-7 7 7 7" />,
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  sparkle: <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" />,
  diamond: <><path d="m12 3 9 9-9 9-9-9Z" /><path d="m12 8 4 4-4 4-4-4Z" /></>,
  check: <path d="m5 12 4 4L19 6" />,
};

// Inline SVG avoids platform emoji fonts and external icon-font loading.
export default function UiIcon({ name, className = '', ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg {...props} className={`ui-icon ${className}`.trim()} data-icon={name} data-directional={name.startsWith('arrow') || name.startsWith('chevron') ? 'true' : undefined} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}
