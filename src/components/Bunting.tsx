/**
 * Varal de bandeirinhas (mesmo motivo do convite em PDF): duas curvas com um
 * lacinho no centro, bandeiras alternando rosa / creme / azul / bege.
 *
 * Cada bandeira balança sozinha (CSS `bunting-sway`, respeita reduced-motion).
 * O grupo externo `.flag-drop` fica livre para a entrada ser animada por quem
 * usa o componente (GSAP na abertura, framer-motion na página).
 */

const COLORS = ["#E8C4CB", "#F3E4CC", "#C3D5E3", "#E0CBAB"];
const W = 400;
const Y0 = 8;
const SAG = 16; // altura do "barriguinha" de cada curva
const PER_SWAG = 6;

type Flag = { x: number; y: number; tilt: number; color: string; delay: number };

function swag(x0: number, x1: number, offset: number, start: number): Flag[] {
  return Array.from({ length: PER_SWAG }, (_, i) => {
    const t = (i + 1) / (PER_SWAG + 1);
    return {
      x: x0 + (x1 - x0) * t,
      y: Y0 + 4 * SAG * t * (1 - t),
      tilt: (t - 0.5) * -22,
      color: COLORS[(i + offset) % COLORS.length],
      delay: (start + i) * 0.17,
    };
  });
}

const FLAGS = [...swag(10, W / 2, 0, 0), ...swag(W / 2, W - 10, 2, PER_SWAG)];

export default function Bunting({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} 44`}
      className={"overflow-visible " + className}
      aria-hidden="true"
    >
      <path
        d={`M10 ${Y0} Q${(10 + W / 2) / 2} ${Y0 + SAG * 2} ${W / 2} ${Y0} Q${(W / 2 + W - 10) / 2} ${Y0 + SAG * 2} ${W - 10} ${Y0}`}
        fill="none"
        stroke="#B08968"
        strokeWidth="1.1"
        opacity="0.6"
      />
      {FLAGS.map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${f.tilt})`}>
          <g className="flag-drop">
            <path
              className="bunting-sway"
              style={{ animationDelay: `${f.delay}s` }}
              d="M-9 0 L9 0 L0 19 Z"
              fill={f.color}
            />
          </g>
        </g>
      ))}
      {/* Lacinho no centro */}
      <g transform={`translate(${W / 2} ${Y0})`}>
        <path
          d="M0 0 C-9 -8 -17 -3 -14 4 C-12 9 -4 5 0 0 Z M0 0 C9 -8 17 -3 14 4 C12 9 4 5 0 0 Z"
          fill="#E8C4CB"
        />
        <circle r="3.2" fill="#C9A574" />
      </g>
    </svg>
  );
}
