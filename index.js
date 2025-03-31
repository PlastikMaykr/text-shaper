import textShaperRaw, { textShaperCleanup } from './text-shaper.js';
import { formatForSVG, formatForHTML, formatForCanvas } from './formatters.js';

export { textShaperRaw, textShaperCleanup, formatForSVG, formatForHTML, formatForCanvas };

/** @type {import('.').textShaper} */
export const textShaper = {
    svg: (text, options) => formatForSVG(textShaperRaw(text, options), options),
    html: (text, options) => formatForHTML(textShaperRaw(text, options), options),
    ctx: (text, options) => formatForCanvas(textShaperRaw(text, options), options),
};
