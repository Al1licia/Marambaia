import { useId } from 'react';

/** Símbolo redesenhado em vetor a partir da logo enviada, para ficar nítido em qualquer tamanho. */
export const LogoMark = ({ size = 48, className = '' }: { size?: number; className?: string }) => {
  const id = useId();
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} role="img" aria-label="Símbolo do Ponto Zero">
      <defs>
        <linearGradient id={id} x1="0.1" y1="0.9" x2="0.9" y2="0.1">
          <stop offset="0" stopColor="#FF9E00" />
          <stop offset="0.45" stopColor="#F0453F" />
          <stop offset="1" stopColor="#D300C5" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="none" stroke={`url(#${id})`} strokeWidth="5" />
      <circle cx="100" cy="100" r="88" fill="#C01D2E" stroke="#0C1014" strokeWidth="3" />
      <circle cx="100" cy="100" r="72" fill="#C01D2E" stroke="#FEE5A5" strokeWidth="6" />
      <path fill="#FEE5A5" d="M68 84C70 62 76 46 88 44c6-1 9 3 12 3s6-4 12-3c12 2 18 18 20 40-12 6-52 6-64 0Z" />
      <path fill="#8E1421" d="M67 83c13 8 53 8 66 0l1 8c-14 8-54 8-68 0Z" />
      <path fill="#FEE5A5" d="M42 92c14-7 22-3 24 2 14 8 54 8 68 0 2-5 10-9 24-2-6 16-30 27-58 27S48 108 42 92Z" />
      <path fill="#FEE5A5" d="M100 134c-4-6-12-4-19 7 8 0 15 0 19-3 4 3 11 3 19 3-7-11-15-13-19-7Z" />
    </svg>
  );
};

export const Wordmark = ({ className = '' }: { className?: string }) => (
  <span className={`font-display font-semibold tracking-tight text-cream ${className}`}>Ponto Zero</span>
);
