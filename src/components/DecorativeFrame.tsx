/**
 * Moldura decorativa no estilo do convite (PDF): uma linha fina externa, uma
 * linha pontilhada interna, florzinhas/folhas nos cantos e pequenos losangos
 * no meio das bordas. Fica fixa, atrás do conteúdo e não captura cliques.
 */
export default function DecorativeFrame() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1]"
    >
      <div className="absolute inset-2 sm:inset-3">
        {/* Linha externa */}
        <div className="absolute inset-0 rounded-[26px] border border-caramel/45" />
        {/* Linha pontilhada interna */}
        <div className="absolute inset-[6px] rounded-[20px] border border-dashed border-brownlabel/30" />

        {/* Cantos */}
        <Corner className="left-0 top-0" />
        <Corner className="right-0 top-0 -scale-x-100" />
        <Corner className="bottom-0 left-0 -scale-y-100" />
        <Corner className="bottom-0 right-0 -scale-x-100 -scale-y-100" />

        {/* Losangos no meio das bordas */}
        <Diamond className="left-1/2 top-0 -translate-x-1/2 -translate-y-1/2" />
        <Diamond className="bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" />
        <Diamond className="left-0 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        <Diamond className="right-0 top-1/2 -translate-y-1/2 translate-x-1/2" />
      </div>
    </div>
  );
}

function Corner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`absolute h-12 w-12 sm:h-14 sm:w-14 ${className}`}
      fill="none"
    >
      {/* Raminho curvo */}
      <path
        d="M6 34 C6 16 16 6 34 6"
        stroke="#B08968"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Folhinhas */}
      <g fill="#C9A574" opacity="0.6">
        <ellipse cx="11" cy="22" rx="2.6" ry="5.2" transform="rotate(38 11 22)" />
        <ellipse cx="17" cy="14" rx="2.6" ry="5.2" transform="rotate(60 17 14)" />
        <ellipse cx="24" cy="9" rx="2.4" ry="4.6" transform="rotate(80 24 9)" />
      </g>
      {/* Pontinhos nas pontas do raminho */}
      <g fill="#B08968" opacity="0.55">
        <circle cx="6" cy="34" r="1.7" />
        <circle cx="34" cy="6" r="1.7" />
      </g>
      {/* Losango no vértice */}
      <path d="M9 9 l3.5 3.5 -3.5 3.5 -3.5 -3.5 z" fill="#C9A574" opacity="0.55" />
    </svg>
  );
}

function Diamond({ className = "" }: { className?: string }) {
  return (
    <span
      className={`absolute h-2 w-2 rotate-45 rounded-[1px] bg-caramel/50 ${className}`}
    />
  );
}
