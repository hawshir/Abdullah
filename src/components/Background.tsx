/** CSS-only cinematic background: gradient + aurora blobs. Paints instantly. */
export default function Background() {
  return (
    <>
      <div className="bg-base" aria-hidden="true">
        <div className="aurora a1" />
        <div className="aurora a2" />
        <div className="aurora a3" />
      </div>
      <div className="grain" aria-hidden="true" />
    </>
  );
}
