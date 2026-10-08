/** Fixed decorative layers: dot grid fading out down the page, and film grain. */
export function Background() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-x-0 top-0 h-[70vh] bg-dots" />
      <div
        className="absolute inset-x-0 top-0 h-[50vh] opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, color-mix(in oklch, var(--brand) 12%, transparent), transparent)",
        }}
      />
      <div className="absolute inset-0 bg-grain" />
    </div>
  );
}
