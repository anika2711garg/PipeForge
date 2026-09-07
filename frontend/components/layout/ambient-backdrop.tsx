"use client";

export function AmbientBackdrop() {
  return (
    <div className="app-backdrop" aria-hidden="true">
      <div className="app-backdrop__aurora motion-safe:animate-aurora" />
      <div className="app-backdrop__grid" />
      <div className="app-backdrop__orb app-backdrop__orb--a motion-safe:animate-orb-a" />
      <div className="app-backdrop__orb app-backdrop__orb--b motion-safe:animate-orb-b" />
      <div className="app-backdrop__orb app-backdrop__orb--c motion-safe:animate-orb-c" />
    </div>
  );
}
