import FloatingDecor from "@/components/FloatingDecor";
import BalloonBackground from "@/components/BalloonBackground";

/**
 * Estampa de fundo com ursinhos, patinhas e coraçõezinhos em SVG inline.
 * Fica atrás do conteúdo, não captura cliques e não atrapalha a leitura.
 * Renderizada como padrão repetido via <pattern>.
 *
 * Com `interactive`, adiciona uma camada de elementos que flutuam e reagem
 * à inclinação do celular / mouse (usada na página principal).
 */
export default function BackgroundPattern({
  interactive = false,
}: {
  interactive?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      // Altura SEMPRE do tamanho da viewport (100dvh), mesmo quando renderizado
      // dentro de um ancestral transformado e mais alto (o "papel" da abertura).
      // Sem isso, o gradiente se distribui na altura do conteúdo e a cor "pula"
      // quando o papel termina de sair do envelope.
      className="pointer-events-none fixed inset-x-0 top-0 -z-10"
      style={{ height: "100dvh" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(165deg, #FBF7F1 0%, #F1E6D6 45%, #E3CFB4 100%)",
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="cha-pattern"
            x="0"
            y="0"
            width="160"
            height="160"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-8)"
          >
            {/* Ursinho */}
            <g transform="translate(18,20)" fill="#A6805C" opacity="0.18">
              <circle cx="6" cy="6" r="5" />
              <circle cx="24" cy="6" r="5" />
              <circle cx="15" cy="16" r="11" />
            </g>

            {/* Patinha */}
            <g transform="translate(96,42)" fill="#A6805C" opacity="0.16">
              <ellipse cx="10" cy="12" rx="8" ry="9" />
              <circle cx="3" cy="3" r="2.6" />
              <circle cx="10" cy="0.5" r="2.6" />
              <circle cx="17" cy="3" r="2.6" />
              <circle cx="20" cy="9" r="2.6" />
            </g>

            {/* Coraçãozinho */}
            <path
              transform="translate(58,96)"
              d="M10 18 C10 18 0 11 0 5 C0 1.5 2.5 0 5 0 C7 0 9 1.2 10 3 C11 1.2 13 0 15 0 C17.5 0 20 1.5 20 5 C20 11 10 18 10 18 Z"
              fill="#C9A574"
              opacity="0.45"
            />

            {/* Patinha menor */}
            <g transform="translate(120,116)" fill="#A6805C" opacity="0.14">
              <ellipse cx="7" cy="9" rx="6" ry="7" />
              <circle cx="2" cy="2" r="2" />
              <circle cx="7" cy="0.5" r="2" />
              <circle cx="12" cy="2" r="2" />
            </g>

            {/* Coraçãozinho menor */}
            <path
              transform="translate(20,120) scale(0.7)"
              d="M10 18 C10 18 0 11 0 5 C0 1.5 2.5 0 5 0 C7 0 9 1.2 10 3 C11 1.2 13 0 15 0 C17.5 0 20 1.5 20 5 C20 11 10 18 10 18 Z"
              fill="#C9A574"
              opacity="0.4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cha-pattern)" />
      </svg>

      {interactive && (
        <>
          <BalloonBackground />
          <FloatingDecor />
        </>
      )}
    </div>
  );
}
