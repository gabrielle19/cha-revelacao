/** Estrelinha dourada de 4 pontas que pisca (CSS `twinkle`), decorativa. */
export default function Sparkle({
  className,
  delay = 0,
  color = "#D6A96A",
}: {
  className: string;
  delay?: number;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={"twinkle pointer-events-none absolute " + className}
      style={{ animationDelay: `${delay}s` }}
    >
      <path
        d="M12 0c.6 6 5.4 10.8 12 11.4C17.4 12 12.6 16.8 12 24c-.6-7.2-5.4-12-12-12.6C6.6 10.8 11.4 6 12 0z"
        fill={color}
      />
    </svg>
  );
}
