/** @import { formatForHTML, formatForSVG, formatForCanvas } from '.' */

/** @type {formatForHTML} */
export function formatForHTML(coreOutput, options) {
    const { origin, fontFamily, fontSize } = coreOutput.meta;

    return {
        lines: coreOutput.lines.map(line => ({
            text: line.text,
            style: {
                position: `absolute`,
                left: `${line.x.toFixed(2)}px`,
                top: `${line.y.toFixed(2)}px`,
            }
        })),
        containerStyle: {
            position: 'absolute',
            top: origin === 'center' ? `${options.size / 2}px` : '0',
            left: origin === 'center' ? `${options.size / 2}px` : '0',
            'font-family': fontFamily,
            'font-size': fontSize + 'px',
            'line-height': 1,
            'white-space': 'nowrap',
        },
        meta: {
            font: `${coreOutput.meta.fontSize}px ${options.fontFamily}`,
            lineHeight: `${coreOutput.meta.lineHeight}`,
            overflowed: coreOutput.meta.overflowed,
            modified: coreOutput.meta.modified,
            text: coreOutput.meta.text
        }
    };
}

/** @type {Record<TextShaperOptions['textBaseline'],ReturnType<formatForSVG>['meta']['dominantBaseline']>} */
const dominantBaselines = {
    'top': 'hanging',
    'middle': 'middle',
    'bottom': 'ideographic',
};

/** @type {formatForSVG} */
export function formatForSVG(coreOutput, options) {
    let { fontFamily, fontSize } = coreOutput.meta;
    /** @type {'start'|'middle'|'end'} */
    let textAnchor = options.textAlign === 'center' ? 'middle' : options.textAlign;
    let dominantBaseline = dominantBaselines[options.textBaseline];

    return {
        lines: coreOutput.lines.map(line => {
            let x = line.x;
            let y = line.y;

            //Adjust x for horizontal origin
            if (options.textAlign === 'center') {
                x += line.width / 2;
            } else if (options.textAlign === 'end') {
                x += line.width;
            }

            //Adjust y for vertical origin
            if (options.textBaseline === 'middle') {
                y += line.height / 2;
            } else if (options.textBaseline === 'bottom') {
                y += line.height;
            }

            return {
                text: line.text,
                attrs: {
                    x,
                    y,
                    'font-family': fontFamily,
                    'font-size': fontSize,
                    'text-anchor': textAnchor,
                    'dominant-baseline': dominantBaseline,
                }
            };
        }),
        meta: {
            fontSize,
            fontFamily,
            lineHeight: coreOutput.meta.lineHeight,
            overflowed: coreOutput.meta.overflowed,
            modified: coreOutput.meta.modified,
            textAnchor,
            dominantBaseline,
            text: coreOutput.meta.text
        }
    };
}

/** @type {formatForCanvas} */
export function formatForCanvas(coreOutput, options) {
    let font = `${coreOutput.meta.fontSize}px ${coreOutput.meta.fontFamily}`;
    let textAlign = options.textAlign;
    let textBaseline = options.textBaseline;

    return {
        lines: coreOutput.lines.map(line => {
            let x = line.x;
            let y = line.y;

            //Adjust x for horizontal origin
            if (options.textAlign === 'center') {
                x += line.width / 2;
            } else if (options.textAlign === 'end') {
                x += line.width;
            }

            //Adjust y for vertical origin
            if (options.textBaseline === 'middle') {
                y += line.height / 2;
            } else if (options.textBaseline === 'bottom') {
                y += line.height;
            }

            return {
                text: line.text,
                x,
                y,
            };
        }),
        meta: {
            font,
            textAlign,
            textBaseline,
            overflowed: coreOutput.meta.overflowed,
            modified: coreOutput.meta.modified,
            text: coreOutput.meta.text
        }
    };
}
