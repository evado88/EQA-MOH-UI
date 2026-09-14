import React from "react";

interface ColArgs {
  lg?: number, 
  md?: number, 
  sm?: number, 
  xl?: number, 
  sz?: number, 
  children?: any
}

export const Col = ({ lg, md, sm, xl, sz, children }: ColArgs) => {
  const smc = sm == undefined ? "" : `col-sm-${sm} `;
  const mdc = md == undefined ? "" : `col-md-${md} `;
  const lgc = lg == undefined ? "" : `col-lg-${lg} `;
  const xlc = xl == undefined ? "" : `col-xl-${xl} `;
  const szc = sz == undefined ? "" : `col-${sz} `;

  const cls = `${szc}${smc}${xlc}${mdc}${lgc}`.trim();

  return <div className={cls}>{children}</div>;
};
