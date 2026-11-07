import { useId, useMemo, type ReactNode } from 'react';
import type { DishArtKind } from '../types';

const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const CX = 240, CY = 150, R = 108;

const palette: Record<DishArtKind, { rim: string; rimHi: string; a: string; b: string }> = {
  feijoada: { rim: '#3E2317', rimHi: '#6A3E28', a: '#34190F', b: '#170B09' },
  carne: { rim: '#1E2226', rimHi: '#3B4148', a: '#7A3515', b: '#3F190B' },
  caldo: { rim: '#3A2C21', rimHi: '#6B5340', a: '#F5DFA6', b: '#DDB269' },
  dobradinha: { rim: '#47291A', rimHi: '#7A4A2E', a: '#DE7F2C', b: '#A84B17' },
};

const artwork = (kind: DishArtKind) => {
  const r = rng(kind.length * 977 + kind.charCodeAt(0) * 31);
  const pos = (max = R - 8) => {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * max;
    return [CX + Math.cos(a) * d, CY + Math.sin(a) * d * 0.98, r() * 180] as const;
  };
  const out: ReactNode[] = [];
  let k = 0;
  const bean = (fill: string, hi: string, rx = 8, ry = 5) => {
    const [x, y, t] = pos();
    out.push(
      <g key={k++} transform={`rotate(${t} ${x} ${y})`}>
        <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={fill} />
        <ellipse cx={x - 2} cy={y - 1.5} rx={rx * 0.4} ry={ry * 0.25} fill={hi} />
      </g>,
    );
  };
  const slice = (outer: string, inner: string, size = 15) => {
    const [x, y] = pos(R - 18);
    out.push(
      <g key={k++}>
        <circle cx={x} cy={y} r={size} fill={outer} />
        <circle cx={x} cy={y} r={size * 0.78} fill={inner} />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={x + (r() - 0.5) * size} cy={y + (r() - 0.5) * size} r={1.4} fill={outer} />
        ))}
      </g>,
    );
  };
  const chunk = (fill: string, hi: string, w = 34, h = 26) => {
    const [x, y, t] = pos(R - 20);
    out.push(
      <g key={k++} transform={`rotate(${t} ${x} ${y})`}>
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={8} fill={fill} />
        <rect x={x - w / 2 + 4} y={y - h / 2 + 3} width={w * 0.55} height={h * 0.3} rx={4} fill={hi} />
      </g>,
    );
  };
  const leaf = (fill: string, s = 5) => {
    const [x, y, t] = pos();
    out.push(<ellipse key={k++} cx={x} cy={y} rx={s} ry={s * 0.45} fill={fill} transform={`rotate(${t} ${x} ${y})`} />);
  };
  const strip = () => {
    const [x, y, t] = pos(R - 24);
    out.push(
      <path key={k++} transform={`rotate(${t} ${x} ${y})`} fill="none" stroke="#F3E2BC" strokeWidth="10" strokeLinecap="round"
        d={`M${x - 24} ${y}q12 -12 24 0t24 0`} />,
    );
  };

  if (kind === 'feijoada') {
    for (let i = 0; i < 120; i++) bean(r() > 0.5 ? '#120808' : '#241110', '#4A2A28');
    for (let i = 0; i < 6; i++) chunk('#5C2B1B', '#83452C');
    for (let i = 0; i < 8; i++) slice('#7A2A1D', '#B55A3A');
    for (let i = 0; i < 3; i++) leaf('#3F5A2C', 15);
  }
  if (kind === 'carne') {
    for (let i = 0; i < 12; i++) chunk('#4F2211', '#7D4322', 40, 30);
    for (let i = 0; i < 7; i++) {
      const [x, y] = pos(R - 12);
      out.push(<g key={k++}><circle cx={x} cy={y} r={12} fill="#E9851F" /><circle cx={x} cy={y} r={5} fill="#F8AE4E" /></g>);
    }
    for (let i = 0; i < 5; i++) chunk('#EBD49C', '#F8EBC8', 24, 20);
    for (let i = 0; i < 18; i++) leaf('#5F8A3A', 4);
  }
  if (kind === 'caldo') {
    out.push(<circle key={k++} cx={CX} cy={CY} r={R * 0.55} fill="#FFF3CF" opacity="0.28" />);
    for (let i = 0; i < 16; i++) {
      const [x, y, t] = pos(R - 30);
      out.push(<path key={k++} transform={`rotate(${t} ${x} ${y})`} stroke="#8D4A25" strokeWidth="5" strokeLinecap="round" fill="none" d={`M${x - 10} ${y}q10 -7 20 0`} />);
    }
    for (let i = 0; i < 60; i++) leaf(r() > 0.4 ? '#5C8A35' : '#3E6B28', 4);
  }
  if (kind === 'dobradinha') {
    for (let i = 0; i < 12; i++) strip();
    for (let i = 0; i < 70; i++) bean('#F5EAD2', '#FFFFFF', 7, 4.5);
    for (let i = 0; i < 6; i++) slice('#8A2D1C', '#BF5E38', 13);
    for (let i = 0; i < 14; i++) leaf('#5C8A35', 4);
  }
  return out;
};

export const DishArt = ({ kind, className = '', label }: { kind: DishArtKind; className?: string; label: string }) => {
  const id = useId();
  const p = palette[kind];
  const items = useMemo(() => artwork(kind), [kind]);
  return (
    <svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={`Ilustração: ${label}`}>
      <defs>
        <radialGradient id={`${id}l`} cx="42%" cy="38%" r="70%">
          <stop offset="0" stopColor={p.a} />
          <stop offset="1" stopColor={p.b} />
        </radialGradient>
        <radialGradient id={`${id}t`} cx="50%" cy="50%" r="75%">
          <stop offset="0" stopColor="#2A1F19" />
          <stop offset="1" stopColor="#0F1216" />
        </radialGradient>
        <clipPath id={`${id}c`}><circle cx={CX} cy={CY} r={R + 6} /></clipPath>
      </defs>
      <rect width="480" height="300" fill={`url(#${id}t)`} />
      {[46, 104, 196, 252].map((y) => <rect key={y} y={y} width="480" height="1.5" fill="#000" opacity="0.28" />)}
      <ellipse cx={CX + 8} cy={CY + 12} rx={R + 28} ry={R + 24} fill="#000" opacity="0.45" />
      <rect x={CX - R - 44} y={CY - 12} width="30" height="24" rx="10" fill={p.rim} />
      <rect x={CX + R + 14} y={CY - 12} width="30" height="24" rx="10" fill={p.rim} />
      <circle cx={CX} cy={CY} r={R + 20} fill={p.rim} />
      <circle cx={CX} cy={CY} r={R + 15} fill="none" stroke={p.rimHi} strokeWidth="3" opacity="0.8" />
      <circle cx={CX} cy={CY} r={R + 6} fill={`url(#${id}l)`} />
      <g clipPath={`url(#${id}c)`}>{items}</g>
      <path d={`M${CX - 86} ${CY - 72}A112 112 0 0 1 ${CX - 12} ${CY - 108}`} fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
};
