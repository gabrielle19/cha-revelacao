type BearHeadProps = {
  size?: number;
  className?: string;
  /** Adiciona bochechas rosadas (versão mais fofa, usada no selo/cartão). */
  blush?: boolean;
  title?: string;
};

/**
 * Cabeça de urso em SVG, estilo flat e fofo.
 * Cores: orelhas/rosto #C9A574, interior das orelhas #8B6F52,
 * focinho #FAF6F0, olhos/nariz/sorriso #5C4433.
 */
export default function BearHead({
  size = 96,
  className,
  blush = false,
  title = "Ursinho",
}: BearHeadProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={title}
      className={className}
    >
      {/* Orelhas */}
      <circle cx="30" cy="34" r="18" fill="#C9A574" />
      <circle cx="90" cy="34" r="18" fill="#C9A574" />
      <circle cx="30" cy="34" r="9" fill="#8B6F52" />
      <circle cx="90" cy="34" r="9" fill="#8B6F52" />

      {/* Rosto */}
      <circle cx="60" cy="66" r="40" fill="#C9A574" />

      {/* Focinho */}
      <ellipse cx="60" cy="78" rx="24" ry="19" fill="#FAF6F0" />

      {/* Bochechas rosadas */}
      {blush && (
        <>
          <circle cx="33" cy="74" r="7" fill="#E8B9A0" opacity="0.75" />
          <circle cx="87" cy="74" r="7" fill="#E8B9A0" opacity="0.75" />
        </>
      )}

      {/* Olhos */}
      <circle cx="47" cy="60" r="5" fill="#5C4433" />
      <circle cx="73" cy="60" r="5" fill="#5C4433" />
      <circle cx="48.6" cy="58.4" r="1.6" fill="#FFFFFF" />
      <circle cx="74.6" cy="58.4" r="1.6" fill="#FFFFFF" />

      {/* Nariz */}
      <ellipse cx="60" cy="72" rx="6" ry="4.5" fill="#5C4433" />

      {/* Sorriso */}
      <path
        d="M60 76 v6 M60 82 c-5 6 -13 6 -16 0 M60 82 c5 6 13 6 16 0"
        fill="none"
        stroke="#5C4433"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
