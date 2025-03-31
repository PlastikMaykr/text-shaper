/**
 * Configuration options for the TextShaper library.
 */
export interface TextShaperOptions {
    /** Diameter of the circle. */
    size: number;
    /** Margin inside the shape. */
    margin?: number;
    /** Font size settings. */
    fontSize?: number | SizeRange;
    /** TextLine height settings. */
    lineHeight?: number | SizeRange;
    /** Font family. */
    fontFamily?: string;
    /** Overflow indication character(s) or *true* for '…', *false* to clip (default). */
    ellipsis?: boolean | string;
    /** Coordinate system for output ('center' or 'topleft'). */
    origin?: 'center' | 'topleft';
    /** Vertical alignment ('top', 'middle', or 'bottom'). */
    verticalAlign?: 'top' | 'middle' | 'bottom';
    /** Horizontal alignment ('start', 'center', or 'end'). */
    horizontalAlign?: 'start' | 'center' | 'end';
    /** Vertical alignment ('top', 'middle', or 'bottom'). */
    textBaseline?: 'top' | 'middle' | 'bottom';
    /** Horizontal alignment ('start', 'center', or 'end'). */
    textAlign?: 'start' | 'center' | 'end';
    /** Display temporary element and console logs. */
    debug?: boolean;
}

/**
 * Allows for flexible value, adjusted to fit the container.
 */
interface SizeRange {
    /** Initial value. */
    value: number;
    /** Minimum size. Providing it will enable value shrinking */
    min?: number;
    /** Maximum size. Growing is not implemented yet. */
    max?: number;
}

/**
 * Represents a single line of text in the raw output.
 */
export interface TextLineRaw {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Represents the raw output from the textShaper function.
 */
export interface TextShaperResultRaw {
    lines: TextLineRaw[];
    meta: {
        fontFamily: string;
        fontSize: number;
        lineHeight: number;
        overflowed: boolean;
        modified: boolean;
        origin: Required<TextShaperOptions>['origin'];
        text: {
            full: string;
            leftover: string;
        };
    };
}

/**
 * Represents a single line of text in the HTML formatted output.
 */
interface TextLineHTML {
    text: string;
    style: {
        position: 'absolute';
        left: string;
        top: string;
    };
}

/**
 * Represents the formatted output for HTML.
 */
interface TextShaperResultHTML {
    lines: TextLineHTML[];
    containerStyle: {
        position: 'absolute';
        top: string;
        left: string;
        'font-family': string;
        'font-size': string;
        'line-height': number;
        'white-space': string;
    },
    meta: {
        font: string;
        lineHeight: string;
        overflowed: boolean;
        modified: boolean;
        text: {
            full: string;
            leftover: string;
        };
    };
}

/**
 * Represents a single line of text in the SVG formatted output.
 */
interface TextLineSVG {
    text: string;
    attrs: {
        x: number;
        y: number;
        'font-size': number;
        'font-family': string;
        'text-anchor': 'start' | 'middle' | 'end';
        'dominant-baseline': 'hanging' | 'middle' | 'ideographic';
    };
}

/**
 * Represents the formatted output for SVG.
 */
interface TextShaperResultSVG {
    lines: TextLineSVG[];
    meta: {
        fontSize: number;
        fontFamily: string;
        lineHeight: number;
        textAnchor: 'start' | 'middle' | 'end';
        dominantBaseline: 'hanging' | 'middle' | 'ideographic';
        overflowed: boolean;
        modified: boolean;
        text: {
            full: string;
            leftover: string;
        };
    };
}

/**
 * Represents a single line of text in the Canvas formatted output.
 */
interface TextLineCanvas {
    text: string;
    x: number;
    y: number;
}

/**
 * Represents the formatted output for Canvas.
 */
interface TextShaperResultCanvas {
    lines: TextLineCanvas[];
    meta: {
        font: string;
        textAlign: 'start' | 'center' | 'end';
        textBaseline: 'top' | 'middle' | 'bottom';
        overflowed: boolean;
        modified: boolean;
        text: {
            full: string;
            leftover: string;
        };
    };
}

/**
 * Lays out text within a specified shape and returns raw positioning data.
 *
 * @param text The text to lay out.
 * @param options Configuration options.
 * @returns Raw layout data.
 */
export function textShaperRaw(text: string, options: TextShaperOptions): TextShaperResultRaw;

/**
 * Remove TextShaper helper container from the DOM
 */
export function textShaperCleanup(): void;

/**
 * Formats the raw layout data for HTML rendering.
 *
 * @param coreOutput The raw output from textShaper.
 * @param options Configuration options.
 * @returns Formatted output for HTML.
 */
export function formatForHTML(coreOutput: TextShaperResultRaw, options: TextShaperOptions): TextShaperResultHTML;

/**
 * Formats the raw layout data for SVG rendering.
 *
 * @param coreOutput The raw output from textShaper.
 * @param options Configuration options.
 * @returns Formatted output for SVG.
 */
export function formatForSVG(coreOutput: TextShaperResultRaw, options: TextShaperOptions): TextShaperResultSVG;

/**
 * Formats the raw layout data for Canvas rendering.
 *
 * @param coreOutput The raw output from textShaper.
 * @param options Configuration options.
 * @returns Formatted output for Canvas.
 */
export function formatForCanvas(coreOutput: TextShaperResultRaw, options: TextShaperOptions): TextShaperResultCanvas;

interface TextShaper {
    /**
     * Formats text for SVG.
     * @param text
     * @param options
     * @returns Formatted SVG output.
     */
    svg: (text: string, options: TextShaperOptions) => TextShaperResultSVG;
    /**
     * Formats text for HTML.
     * @param text
     * @param options
     * @returns Formatted HTML output.
     */
    html: (text: string, options: TextShaperOptions) => TextShaperResultHTML;
    /**
     * Formats text for Canvas.
     * @param text
     * @param options
     * @returns Formatted Canvas output.
     */
    ctx: (text: string, options: TextShaperOptions) => TextShaperResultCanvas;
}

/**
 * Collection of formatted outputs for common rendering scenarios.
 */
export const textShaper: TextShaper;
