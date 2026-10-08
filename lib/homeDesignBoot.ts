/**
 * The inline script and CSS the root layout puts in <head>, so the homepage
 * design (and the nav that goes with it) is decided before anything paints.
 * Plain strings, built here so they can be tested without rendering anything.
 * The attribute is set on every page, so pages themed by the design
 * (/traveller) can follow it too; the CSS matches nothing where no design or
 * nav is rendered.
 */
import {
  HOME_DESIGN_STORAGE_KEY,
  HOME_PREVIEW_PARAM,
  HOME_VARIANTS,
  fallbackHomeVariant,
  navStyleOf,
  type HomeVariant,
} from '@/lib/featureFlags';

/**
 * Runs while the HTML is still parsing, before first paint: with ?home=<name>
 * it previews that design (and marks the page so HomeDesignSync leaves it be),
 * otherwise it shows whatever this browser last saw, else the build fallback.
 */
export function homeDesignBootScript(fallback: HomeVariant = fallbackHomeVariant): string {
  const q = JSON.stringify;
  return (
    `(function(){var d=document.documentElement,ok=${q(HOME_VARIANTS)},v=null;` +
    `try{var p=new URLSearchParams(location.search).get(${q(HOME_PREVIEW_PARAM)});p=p&&p.toLowerCase();` +
    `if(p&&ok.indexOf(p)>-1){d.setAttribute("data-home",p);d.setAttribute("data-home-preview","");return}}catch(e){}` +
    `try{v=localStorage.getItem(${q(HOME_DESIGN_STORAGE_KEY)})}catch(e){}` +
    `d.setAttribute("data-home",ok.indexOf(v)>-1?v:${q(fallback)})})();`
  );
}

/**
 * Shows exactly one design, and on the homepage exactly one of TopNav's two
 * bars (data-home-nav): the one that design declares. Without the attribute
 * (no JS) it shows the build fallback's rather than nothing.
 */
export function homeDesignCss(fallback: HomeVariant = fallbackHomeVariant): string {
  const shown = [
    `html:not([data-home]) [data-home-design="${fallback}"]`,
    ...HOME_VARIANTS.map((name) => `html[data-home="${name}"] [data-home-design="${name}"]`),
  ].join(',');
  const navShown = [
    `html:not([data-home]) [data-home-nav="${navStyleOf(fallback)}"]`,
    ...HOME_VARIANTS.map((name) => `html[data-home="${name}"] [data-home-nav="${navStyleOf(name)}"]`),
  ].join(',');
  return (
    `[data-home-design],[data-home-nav]{display:none}` +
    `${shown}{display:block}` +
    `${navShown}{display:contents}`
  );
}
