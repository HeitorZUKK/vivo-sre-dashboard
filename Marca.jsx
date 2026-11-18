// =============================================================================
// Marca do Dashboard Reincidência (segue o manual Visual Branding ZUKK)
// Símbolo: anel em linha dupla com seta, e uma bolinha no centro.
// Gerado a partir do desenho aprovado; os números são do viewBox "10 15 910 910".
// =============================================================================

import { useId } from "react";

export const LOGO_ZUKK_BRANCO = "/marca/zukk-logo-branco.png";

// Cores do manual ZUKK
export const MARCA = {
  azul:    "#09A5C1",
  agua:    "#34EACD",
  marinho: "#001E3B",
  gelo:    "#CBFAF5",
  roxo:    "#951ABE",
  lilas:   "#D85DFB",
};

export const DEGRADE_MARCA = "linear-gradient(90deg, #09A5C1, #34EACD 45%, #951ABE 80%, #D85DFB)";

const ARCO        = "M490.0 133.0A332 332 0 1 1 176.1 356.9";
const ARCO_VAZIO  = "M531.9 135.7A332 332 0 1 1 176.1 356.9";
const SETA        = "282.3,456.2 53.4,313.1 292.4,185.4";
const SETA_VAZIA  = "243.1,382.1 137.2,316.0 247.7,256.9";

// Até 40 px a linha dupla vira traço cheio, senão o desenho embola.
export function SimboloReincidencia({ size = 28, color = MARCA.agua, solido, title }) {
  const id = useId().replace(/:/g, "");
  const cheio = solido ?? size <= 40;
  return (
    <svg width={size} height={size} viewBox="10 15 910 910" role={title ? "img" : undefined}
      aria-label={title} aria-hidden={title ? undefined : true} style={{ flexShrink: 0, display: "block" }}>
      {cheio ? (
        <>
          <path d={ARCO} fill="none" stroke={color} strokeWidth="135" />
          <polygon points={SETA} fill={color} />
        </>
      ) : (
        <>
          <defs>
            <mask id={`m${id}`} maskUnits="userSpaceOnUse" x="-100" y="-100" width="1200" height="1200">
              <path d={ARCO} fill="none" stroke="#fff" strokeWidth="135" />
              <polygon points={SETA} fill="#fff" />
              <path d={ARCO_VAZIO} fill="none" stroke="#000" strokeWidth="51" />
              <polygon points={SETA_VAZIA} fill="#000" />
            </mask>
          </defs>
          <rect x="-100" y="-100" width="1200" height="1200" fill={color} mask={`url(#m${id})`} />
        </>
      )}
      <circle cx="490" cy="465" r="66" fill={color} />
    </svg>
  );
}

// Assinatura: logo ZUKK | símbolo + REINCIDÊNCIA (para fundo escuro)
export function AssinaturaReincidencia({ altura = 28, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(altura * 0.55) }}>
      <img src={LOGO_ZUKK_BRANCO} alt="ZUKK" style={{ height: altura, width: "auto", display: "block" }} />
      <div style={{ width: 1, height: altura, background: "rgba(203,250,245,0.3)" }} />
      <SimboloReincidencia size={Math.round(altura * 1.1)} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "Poppins, sans-serif", fontWeight: 300, letterSpacing: "0.14em",
          fontSize: Math.round(altura * 0.58), lineHeight: 1.2, color: "#FFFFFF" }}>REINCIDÊNCIA</div>
        {children}
      </div>
    </div>
  );
}
