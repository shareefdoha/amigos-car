const profiles = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/amigoscarcare/',
    icon: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r=".8" fill="currentColor" stroke="none"/></>,
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/people/Amigos-car-care/100094591983064/?locale=en_GB',
    icon: <path d="M14 21v-8h3l.5-3H14V8.1c0-.9.3-1.6 1.7-1.6H18V3.8c-.4-.1-1.5-.2-2.8-.2-2.8 0-4.7 1.7-4.7 4.9V10H7.7v3h2.8v8H14Z" fill="currentColor" stroke="none"/>,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/amigos-car-care-1a83ab388/',
    icon: <><path d="M6 9v11M6 5.5v.1M10 20v-6c0-2 1.2-3.5 3.2-3.5 1.9 0 2.8 1.3 2.8 3.4V20M10 10v10M18 14v6"/><circle cx="6" cy="5.5" r="1" fill="currentColor" stroke="none"/></>,
  },
];

export default function SocialLinks() {
  return <nav className="social-links" aria-label="Amigos social media">
    <span>Follow Amigos</span>
    {profiles.map(({label, href, icon}) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Visit Amigos on ${label}`} title={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
    </a>)}
  </nav>;
}
