import type { MilitaryAssetType } from '../game/types/gameTypes';

interface Props {
  type: MilitaryAssetType;
  className?: string;
}

/**
 * Stylized war-room asset markers. Inline SVG only — no external images.
 * Each silhouette is drawn in a 120×36 viewBox and inherits currentColor.
 */
export function MilitaryAssetSilhouette({ type, className = 'text-cyan-400' }: Props) {
  return (
    <svg
      viewBox="0 0 120 36"
      className={`h-9 w-full ${className}`}
      fill="currentColor"
      role="img"
      aria-label={type}
      data-silhouette={type}
    >
      {SHAPES[type]}
    </svg>
  );
}

const SHAPES: Record<MilitaryAssetType, React.ReactNode> = {
  'carrier-group': (
    <>
      {/* flat flight deck with offset island, escort dashes */}
      <path d="M10 22 L14 28 H102 L110 22 L104 18 H18 Z" />
      <rect x="72" y="10" width="10" height="8" />
      <rect x="76" y="6" width="2" height="4" />
      <rect x="20" y="32" width="14" height="2" opacity="0.6" />
      <rect x="56" y="32" width="14" height="2" opacity="0.6" />
      <rect x="90" y="32" width="14" height="2" opacity="0.6" />
    </>
  ),
  'destroyer-screen': (
    <>
      {/* angular hull, stepped superstructure, mast */}
      <path d="M8 24 L14 30 H98 L112 24 L100 20 H20 Z" />
      <path d="M40 20 V14 H66 V20 Z" />
      <path d="M50 14 V8 H54 V14 Z" />
      <rect x="24" y="16" width="8" height="4" />
    </>
  ),
  'submarine-group': (
    <>
      {/* teardrop hull, sail, dive planes */}
      <path d="M12 22 Q18 14 40 14 H92 Q108 14 110 21 Q108 28 92 28 H40 Q18 28 12 22 Z" />
      <rect x="52" y="6" width="12" height="9" rx="2" />
      <rect x="46" y="10" width="4" height="2" />
      <rect x="98" y="18" width="10" height="2" />
    </>
  ),
  'patrol-fleet': (
    <>
      {/* two small hulls in loose formation */}
      <path d="M14 14 L18 18 H62 L70 14 L62 10 H22 Z" />
      <path d="M42 26 L46 30 H92 L100 26 L92 22 H50 Z" />
      <rect x="34" y="6" width="6" height="4" />
      <rect x="64" y="18" width="6" height="4" />
    </>
  ),
  'drone-squadron': (
    <>
      {/* three chevrons in echelon */}
      <path d="M22 12 L38 18 L22 24 L28 18 Z" />
      <path d="M52 8 L68 14 L52 20 L58 14 Z" />
      <path d="M76 16 L92 22 L76 28 L82 22 Z" />
    </>
  ),
  'cyber-ew-cell': (
    <>
      {/* waveform in a rounded chassis */}
      <rect x="14" y="8" width="92" height="20" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M22 18 L32 18 L38 11 L46 25 L54 13 L62 23 L70 15 L78 21 L86 18 L98 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </>
  ),
  'orbital-recon': (
    <>
      {/* satellite body, solar wings, dish */}
      <rect x="52" y="12" width="16" height="12" rx="1" />
      <rect x="20" y="14" width="28" height="8" opacity="0.75" />
      <rect x="72" y="14" width="28" height="8" opacity="0.75" />
      <circle cx="60" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="59" y="8" width="2" height="5" />
    </>
  ),
  'port-defense': (
    <>
      {/* shield over pier blocks */}
      <path d="M60 4 L74 9 V18 Q74 27 60 32 Q46 27 46 18 V9 Z" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M54 17 L59 22 L68 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="14" y="28" width="24" height="4" />
      <rect x="82" y="28" width="24" height="4" />
    </>
  ),
  'convoy-escort': (
    <>
      {/* escort hull leading two cargo silhouettes */}
      <path d="M8 18 L12 23 H44 L52 18 L44 14 H16 Z" />
      <rect x="58" y="14" width="24" height="9" />
      <rect x="88" y="14" width="20" height="9" />
      <rect x="62" y="10" width="6" height="4" />
      <rect x="92" y="10" width="6" height="4" />
    </>
  ),
  'amphibious-logistics': (
    <>
      {/* flat bow-ramp hull with deck cargo */}
      <path d="M12 26 L108 26 L100 16 H28 L12 20 Z" />
      <rect x="38" y="10" width="12" height="6" />
      <rect x="54" y="10" width="12" height="6" />
      <rect x="70" y="10" width="12" height="6" />
    </>
  ),
  'air-defense-cell': (
    <>
      {/* radar fan over launcher box */}
      <path d="M60 18 L40 6 A24 24 0 0 1 80 6 Z" opacity="0.8" />
      <rect x="44" y="20" width="32" height="10" rx="2" />
      <rect x="48" y="14" width="4" height="6" transform="rotate(-20 50 17)" />
      <rect x="68" y="14" width="4" height="6" transform="rotate(20 70 17)" />
    </>
  ),
  'logistics-fleet': (
    <>
      {/* boxy hull with container stack */}
      <path d="M10 24 L16 30 H104 L110 24 L104 20 H16 Z" />
      <rect x="30" y="14" width="16" height="6" />
      <rect x="50" y="14" width="16" height="6" />
      <rect x="70" y="14" width="16" height="6" />
      <rect x="40" y="8" width="16" height="6" opacity="0.75" />
      <rect x="60" y="8" width="16" height="6" opacity="0.75" />
    </>
  ),
};
