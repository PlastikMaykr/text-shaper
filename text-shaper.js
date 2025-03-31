const TEXT_SHAPER_ID = 'text-shaper-container';
const ELLIPSIS = '…';

/**
 * @import {
 *   TextShaperOptions,
 *   TextShaperResultRaw,
 *   textShaperCleanup,
 *   textShaperRaw,
 *   TextLineRaw,
 *   SizeRange
 * } from '.'
 */

// MARK: Defaults
/**
 * @typedef {object} TextShaperOverrides
 * @property {SizeRange} fontSize
 * @property {SizeRange} lineHeight
 * 
 * @typedef {Required<TextShaperOptions>&TextShaperOverrides} TextShaperDefaults
 * 
 * @typedef {TextShaperDefaults&{ellipsis:string}} TextShaperSettings
 */

/** @type {TextShaperDefaults} */
const defaultOptions = {
    size: 250,
    margin: 0,
    fontSize: {
        value: 16
    },
    lineHeight: {
        value: 1.2
    },
    fontFamily: 'Arial, sans-serif',
    ellipsis: false,
    origin: 'topleft',
    verticalAlign: 'middle',
    horizontalAlign: 'center',
    textBaseline: 'top',
    textAlign: 'start',
    debug: false,
};

/** @type {textShaperRaw} */
export default function textShaperRaw(text, options) {
    // validate and merge user-provided options with defaults
    const settings = parseSettings(options);

    // skip lines generation for empty strings
    if (text === '') return defaultResult(settings);

    // replace regular hyphens with non-breaking ones
    text = text.toString().replace('-', '‑');

    const debug = !!options.debug;
    debug && console.time('TextShaper');

    const size = settings.size;
    const margin = settings.margin;
    const contentBox = new DOMRect(margin, margin, size - 2 * margin, size - 2 * margin);

    // MARK: DOM
    /** @type {HTMLElement} */
    let circle;
    /** @type {HTMLElement} */
    let leftShape;
    /** @type {HTMLElement} */
    let rightShape;
    /** @type {HTMLParagraphElement} */
    let textElement;
    let container = document.getElementById(TEXT_SHAPER_ID);

    if (!container) {
        // create temporary container
        container = document.createElement('div');
        container.id = TEXT_SHAPER_ID;
        container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            aspect-ratio: 1;
            overflow: visible;
            pointer-events: none;
        `;
        document.body.appendChild(container);

        // create the circle element
        circle = document.createElement('div');
        circle.classList.add('circle');
        circle.style.cssText = `
            background-color: #4169e185;
            border-radius: 50%;
            width: 100%;
            height: 100%;
            display: inline-block;
        `;

        // create shape-outside elements (left and right)
        leftShape = document.createElement('div');
        rightShape = document.createElement('div');

        leftShape.classList.add('left');
        rightShape.classList.add('right');

        leftShape.style.cssText = `
            float: left;
            width: 50%;
            height: 100%;
        `;
        rightShape.style.cssText = `
            float: right;
            width: 50%;
            height: 100%;
        `;

        const [leftPolygon, rightPolygon] = generateShapePolygons();
        leftShape.style['shape-outside'] = leftPolygon;
        rightShape.style['shape-outside'] = rightPolygon;

        // create the text element
        textElement = document.createElement('p');
        textElement.style.cssText = `
            margin-inline: 0;
            margin-bottom: 0;
            padding: 0;
            word-break: break-word; /* Handle words longer than the available width */
            white-space: pre-wrap;  /* Preserve whitespace and line breaks */
        `;

        // add elements to their containers
        container.appendChild(circle);
        circle.appendChild(leftShape);
        circle.appendChild(rightShape);
        circle.appendChild(textElement);
    } else {
        // retrieve existing elements
        circle = container.querySelector('.circle');
        leftShape = container.querySelector('.left');
        rightShape = container.querySelector('.right');
        textElement = container.querySelector('p');
    }

    // update styles based on options
    container.style.visibility = debug ? '' : 'hidden';
    container.style.width = `${size}px`;
    // container.style.height = `${size}px`;

    // update shape-outside polygons
    // [leftShape.style['shape-outside'], rightShape.style['shape-outside']] = generateShapePolygons();

    leftShape.style['shape-margin'] = `${margin}px`;
    rightShape.style['shape-margin'] = `${margin}px`;

    textElement.textContent = text;
    textElement.style.marginTop = '0px';
    textElement.style.textAlign = settings.horizontalAlign;
    textElement.style.fontFamily = `${settings.fontFamily}`;
    textElement.style.fontSize = `${settings.fontSize.value}px`;
    textElement.style.lineHeight = `${settings.lineHeight.value}`;

    debug && console.timeLog('TextShaper', 'DOM');

    // MARK: Operations
    const overflowResult = handleTextOverflow(contentBox, textElement, settings);

    if (text === overflowResult.leftoverText) {
        debug && console.error('Container size is too small to fit any part of the text within determined font settings.');
    }

    if (settings.verticalAlign === 'middle') {
        centerTextVertically(contentBox, textElement);

        debug && console.timeLog('TextShaper', 'Center');
    }

    const lines = extractTextLines(textElement, settings);

    debug && console.timeEnd('TextShaper');

    return {
        lines,
        meta: {
            fontFamily: settings.fontFamily,
            origin: settings.origin,
            ...overflowResult
        }
    };
}

/** @type {textShaperCleanup} */
export function textShaperCleanup() {
    const container = document.getElementById(TEXT_SHAPER_ID);
    if (container) document.body.removeChild(container);
}

// MARK: Internals
/**
 * Generates valid settings object from user preferances
 * 
 * @param {TextShaperOptions} options User preferances
 * @returns {TextShaperSettings}
 */
function parseSettings(options) {
    // Validation
    if (!options) throw new ReferenceError('[TextShaper] No cofiguration options provided');
    if (!options.size || isNaN(options.size)) throw new TypeError('[TextShaper] No valid shape size provided');
    // TODO: validate all user provided options
    if (!['topleft', 'center'].includes(options.origin)) throw new ReferenceError(`[TextShaper] options.origin has to be 'topleft', 'center'`);
    if (options.margin && isNaN(options.margin)) throw new ReferenceError('[TextShaper] options.margin has to be a number');

    // Overrides
    const ellipsis = typeof options.ellipsis === 'string' ? options.ellipsis :
        options.ellipsis ? ELLIPSIS : '';
    const fontSize = parseSizeRange(options, 'fontSize');
    const lineHeight = parseSizeRange(options, 'lineHeight');

    /** @type {TextShaperSettings} */
    const settings = {
        ...defaultOptions,
        ...options,
        ellipsis,
        fontSize,
        lineHeight,
    };

    return settings;
}

/**
 * Generates valid SizeRange
 * 
 * @param {TextShaperOptions} options User preferences
 * @param {'fontSize'|'lineHeight'} sizeProp Property name representing number or SizeRange
 * @returns {SizeRange}
 */
function parseSizeRange(options, sizeProp) {
    /** @type {number|SizeRange} */
    const prop = options[sizeProp];
    const size = {};
    if (typeof prop === 'object') {
        const value = prop.value;
        if (isNaN(value)) throw new TypeError(`[TextShaper] options.${sizeProp} has to be a number or {value:number, min?:number, max?:number}`);
        size.value = value;

        const min = prop.min;
        const max = prop.max;
        if (!isNaN(min) && min > 0 && min < value) size.min = min;
        if (!isNaN(max) && max > 0 && max > value) size.max = max;
    } else if (typeof prop === 'number') {
        size.value = prop;
    } else if (sizeProp in options) { // prop exists but has a wrong type
        throw new TypeError(`[TextShaper] options.${sizeProp} has to be a number or {value:number, min?:number, max?:number}`);
    } else {
        size.value = defaultOptions[sizeProp].value;
    }

    return size;
}

/**
 * Generates output for empty text
 * 
 * @param {TextShaperSettings} settings User preferences
 * @returns {TextShaperResultRaw}
 */
function defaultResult(settings) {
    return {
        lines: [],
        meta: {
            fontFamily: settings.fontFamily,
            fontSize: settings.fontSize.value,
            lineHeight: settings.lineHeight.value,
            overflowed: false,
            modified: false,
            origin: settings.origin,
            text: {
                full: '',
                leftover: ''
            }
        }
    };
}

// MARK: Shape
/**
 * Generates two polygons for a circular shape-outside
 * 
 * @returns {[string,string]} a pair of CSS polygon() strings
 */
function generateShapePolygons() {
    // Hard coded polygons
    return [
        'polygon(0 0, 98% 0, 50% 6%, 23.4% 17.3%, 6% 32.6%, 0 50%, 6% 65.6%, 23.4% 82.7%, 50% 94%, 98% 100%, 0 100%)',
        'polygon(2% 0%, 100% 0%, 100% 100%, 2% 100%, 50% 94%, 76.6% 82.7%, 94% 65.6%, 100% 50%, 94% 32.6%, 76.6% 17.3%, 50% 6%)'
    ];
}

// MARK: Lines
/**
 * Extracts line information using the Range API (word-based with character fallback)
 * 
 * @param {HTMLParagraphElement} textElement
 * @param {TextShaperSettings} settings
 * @returns {TextLineRaw[]}
 */
function extractTextLines(textElement, settings) {
    const containerRect = textElement.parentElement.getBoundingClientRect();
    const lines = [];

    const text = textElement.textContent;
    // split by spaces, but keep the separators
    // also handles zero-width spaces and non-breaking spaces
    const words = text.split(/([ \u00A0\u200B]+)/);

    let currentLineTop = null;
    let currentLine = { text: '', x: 0, y: 0, width: 0, height: 0 };
    let wordStart = 0;

    for (const word of words) {
        if (!word) continue;

        const range = document.createRange();
        range.setStart(textElement.firstChild, wordStart);
        range.setEnd(textElement.firstChild, wordStart + word.length);
        wordStart += word.length;

        const rangeRects = range.getClientRects();
        if (rangeRects.length === 0) continue;

        if (rangeRects.length > 1) {
            // word spans multiple lines: character-by-character processing
            for (let i = 0; i < word.length; i++) {
                const charRange = document.createRange();
                charRange.setStart(textElement.firstChild, wordStart - word.length + i);
                charRange.setEnd(textElement.firstChild, wordStart - word.length + i + 1);

                const charRects = charRange.getClientRects();
                if (charRects.length === 0) continue;
                const charRect = charRects[0];


                if (currentLineTop === null || Math.abs(charRect.top - currentLineTop) > 2) {
                    if (currentLineTop !== null) {
                        lines.push(finalizeLineObject(currentLine, containerRect, settings));
                    }
                    currentLineTop = charRect.top;
                    currentLine = {
                        text: charRect.width > 0 ? word[i] : '', // Add character if it has width
                        x: charRect.left,
                        y: charRect.top,
                        width: charRect.width,
                        height: charRect.height
                    };
                } else {
                    currentLine.text += word[i];
                    currentLine.width = charRect.right - currentLine.x;
                }
            }
        } else {
            // word is on a single line
            const rect = rangeRects[0];

            if (currentLineTop === null || Math.abs(rect.top - currentLineTop) > 2) {
                if (currentLineTop !== null) {
                    lines.push(finalizeLineObject(currentLine, containerRect, settings));
                }
                currentLineTop = rect.top;
                currentLine = {
                    text: word,
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height
                };
            } else {
                currentLine.text += word;
                currentLine.width = rect.right - currentLine.x;
            }
        }
    }

    if (currentLine.text) {
        lines.push(finalizeLineObject(currentLine, containerRect, settings));
    }

    return lines;
}

// MARK: Finalize
/**
 * Finalizes a line object
 * 
 * @param {TextLineRaw} line
 * @param {DOMRect} containerRect
 * @param {TextShaperSettings} settings
 * @returns {TextLineRaw}
 */
function finalizeLineObject(line, containerRect, settings) {
    // replace non-breaking hyphens back to regular ones
    line.text = line.text.replace('‑', '-');
    // line.text.trim();

    if (settings.origin === 'center') {
        line.x -= containerRect.width / 2;
        line.y -= containerRect.height / 2;
    }

    return line;
}

// MARK: Overflow
/**
 * Handles text overflow (font size, line height, truncation)
 * 
 * @param {DOMRect} contentBox The content box (container excluding margins)
 * @param {HTMLElement} textElement The text element
 * @param {TextShaperSettings} settings Configuration
 */
function handleTextOverflow(contentBox, textElement, settings) {
    const debug = !!settings.debug;

    /** @type {string} */
    const text = textElement.textContent;

    const minimumFontSize = settings.fontSize.min;
    const minimumLineHeight = settings.lineHeight.min;
    let currentFontSize = settings.fontSize.value;
    let currentLineHeight = settings.lineHeight.value;

    let fits = checkIfTextFits(contentBox, textElement);
    let modified = false;
    let leftover = '';

    // font size reduction (if enabled)
    if (!fits && currentFontSize > minimumFontSize) {
        modified = true;
        // if min font size doesnt fit - skip the loop
        textElement.style.fontSize = `${minimumFontSize}px`;
        fits = checkIfTextFits(contentBox, textElement);
        if (fits) {
            // there is a fitting font size to be found
            fits = false;
            while (!fits && currentFontSize > minimumFontSize) {
                currentFontSize -= 1;
                textElement.style.fontSize = `${currentFontSize}px`;
                fits = checkIfTextFits(contentBox, textElement);
            }
        } else {
            // apply min font size and move on
            currentFontSize = minimumFontSize;
        }
    }

    // line height reduction (if enabled)
    if (!fits && currentLineHeight > minimumLineHeight) {
        modified = true;
        // if min line height doesnt fit - skip the loop
        textElement.style.lineHeight = `${minimumLineHeight}`;
        fits = checkIfTextFits(contentBox, textElement);
        if (fits) {
            // there is a fitting line height to be found
            fits = false;
            while (!fits && currentLineHeight > settings.lineHeight.min) {
                currentLineHeight -= 0.1;
                textElement.style.lineHeight = currentLineHeight.toFixed(1);
                fits = checkIfTextFits(contentBox, textElement);
            }
        } else {
            // apply min line height and move on
            currentLineHeight = minimumLineHeight;
        }
    }

    debug && console.timeLog('TextShaper', 'Font');

    // text truncation (if still doesn't fit)
    if (!fits) {
        modified = true;
        leftover = applyTruncation(contentBox, textElement, settings);

        debug && console.timeLog('TextShaper', 'Truncation');
    }

    return {
        overflowed: !fits,
        modified,
        fontSize: currentFontSize,
        lineHeight: +currentLineHeight.toFixed(1),
        text: {
            full: text,
            leftover
        }
    };
}

// MARK: Fit check
/**
 * Checks if text fits within the container
 * (Based bottom fit - works for ranges as well)
 * 
 * @param {DOMRect} contentBox The content box (container excluding margins)
 * @param {HTMLElement|Range} element The text selection
 * @returns {boolean} True if text fits, false otherwise
 */
function checkIfTextFits(contentBox, element) {
    return contentBox.bottom > element.getBoundingClientRect().bottom;
}

// MARK: Center
/**
 * Centers text vertically (using margin-top)
 * 
 * @param {DOMRect} contentBox The content box (container excluding margins)
 * @param {HTMLElement} textElement The text element
 */
function centerTextVertically(contentBox, textElement) {
    /** @type {DOMRect} */
    let textRect;
    let topSpace = 0;
    let bottomSpace = 0;
    let topMargin = contentBox.top;
    let lastFittingTopMargin = 0;
    let difference = 0;
    let tries = 0;
    const TRIES = 4;

    do {
        textRect = textElement.getBoundingClientRect();
        topSpace = textRect.top - contentBox.top;
        bottomSpace = contentBox.bottom - textRect.bottom;

        if (bottomSpace > 0) lastFittingTopMargin = topMargin;

        difference = bottomSpace - topSpace;
        topMargin = Math.trunc(topMargin + difference / 2);
        if (topMargin === lastFittingTopMargin) break;

        textElement.style.marginTop = `${topMargin}px`;
        tries++;
    } while (tries < TRIES && Math.abs(difference) > 5);

    if (!checkIfTextFits(contentBox, textElement)) {
        textElement.style.marginTop = `${lastFittingTopMargin}px`;
    }
}

// MARK: Trunc
/**
 * Applies birany search to find the last word that the fits container
 * Truncates and returns the rest of the text
 * 
 * @param {DOMRect} contentBox The content box (container excluding margins)
 * @param {HTMLElement} textElement The text element
 * @param {TextShaperSettings} settings
 * @returns {string} The portion of the text that did not fit
 */
function applyTruncation(contentBox, textElement, settings) {
    const text = textElement.textContent;
    const ellipsis = settings.ellipsis;

    // find all word boundary positions
    const wordBoundaries = findWordBoundaries(text);

    if (wordBoundaries.length <= 1) {
        return truncateSingleWord(contentBox, textElement, settings);
    }

    // binary search between the last non-fitting and first fitting boundary
    let low = 0;
    let medium = 0;
    let high = wordBoundaries.length;
    const range = document.createRange();
    const textNode = textElement.firstChild;

    // find the index that is the last one fitting
    while (low < high - 1) {
        medium = Math.floor((low + high) / 2);

        range.setStart(textNode, wordBoundaries[low]);
        range.setEnd(textNode, wordBoundaries[medium]);

        const fit = checkIfTextFits(contentBox, range);
        if (fit) {
            low = medium;
        } else {
            high = medium;
        }
    }
    medium = Math.min(low, high);

    // last whitespace
    let lastWhitespace = wordBoundaries[medium];
    textElement.textContent = text.substring(0, lastWhitespace).trimEnd() + (medium ? ellipsis : '');

    // single word left
    if (medium === 0) {
        const otherWords = text.substring(lastWhitespace, text.length);
        return truncateSingleWord(contentBox, textElement, settings) + ' ' + otherWords;
    }

    // cut words until they fit with ellipsis or theres only one left
    while (!checkIfTextFits(contentBox, textElement)) {
        medium--;
        lastWhitespace = wordBoundaries[medium];
        textElement.textContent = text.substring(0, lastWhitespace).trimEnd() + (medium ? ellipsis : '');

        if (medium === 0) {
            const otherWords = text.substring(lastWhitespace, text.length);
            return truncateSingleWord(contentBox, textElement, settings) + ' ' + otherWords;
        }
    }

    return text.substring(lastWhitespace);
}

/**
 * Truncates a single word to fit the container
 * 
 * @param {DOMRect} contentBox The content box (container excluding margins)
 * @param {HTMLElement} textElement The text element
 * @param {TextShaperSettings} settings
 * @returns {string} The portion of the text that did not fit
 */
function truncateSingleWord(contentBox, textElement, settings) {
    const word = textElement.textContent;
    const ellipsis = settings.ellipsis;

    textElement.textContent = word + ellipsis;
    if (checkIfTextFits(contentBox, textElement)) {
        return '';
    }

    let lineHeight = 0;
    let ellipsisWidth = 0;
    const textNode = textElement.firstChild;
    const range = document.createRange();

    if (ellipsis.length) {
        range.setStart(textNode, word.length);
        range.setEnd(textNode, word.length + ellipsis.length);

        const rect = range.getBoundingClientRect();
        ellipsisWidth = rect.width;
        lineHeight = rect.height;
    } else {
        range.setStart(textNode, 0);
        range.setEnd(textNode, 1);

        lineHeight = range.getBoundingClientRect().height;
    }

    // ensure the word isn't wrapped
    textElement.style.whiteSpace = 'nowrap';

    // determine maximum fitting word width
    const radius = contentBox.height / 2;
    const maxWidth = Math.sqrt(4 * radius ** 2 - lineHeight ** 2);

    // binary search fitting range width
    let low = 0;
    let medium = 0;
    let high = word.length;

    while (low < high - 1) {
        medium = Math.floor((low + high) / 2);

        range.setStart(textNode, 0);
        range.setEnd(textNode, medium);

        const rangeWidth = range.getBoundingClientRect().width;

        if (rangeWidth + ellipsisWidth < maxWidth) {
            low = medium;
        } else {
            high = medium;
        }
    }
    medium = Math.min(low, high);

    textElement.textContent = word.substring(0, medium) + ellipsis;

    // reset text element wrapping
    textElement.style.whiteSpace = 'pre-wrap';

    // check if anything fits
    let nothingFits = false;
    if (medium === 0) {
        nothingFits = true;
    } else if (!checkIfTextFits(contentBox, textElement)) {
        if (medium > 1) {
            medium--;
            textElement.textContent = word.substring(0, medium) + ellipsis;
        } else {
            nothingFits = true;
        }
    }

    if (nothingFits) {
        textElement.textContent = '';
        return word;
    }

    return word.substring(medium, word.length);
}

/**
 * Finds positions of all word boundaries in text
 * 
 * @param {string} text The input text
 * @returns {number[]} Array of indices where words end
 */
function findWordBoundaries(text) {
    // collect all whitespace positions
    const regex = /\s+/g;
    const whitespaces = [];
    let match;

    // store the end position of the whitespace (works for multiple spaces too)
    while ((match = regex.exec(text)) !== null) {
        whitespaces.push(match.index + match[0].length);
    }

    return whitespaces;
}
