
# TextShaper

TextShaper is a lightweight, framework-agnostic JavaScript library that calculates precise text layouts within a circular (for now) container. It provides the text lines layout data for you to render using your preferred method (HTML, SVG, Canvas, etc.). The core layout logic is also exposed to enable users to create custom formatting functions if needed.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
  - [Core Layout Function](#textshaperraw)
  - [Convenience Methods](#convenience-methods)
  - [Input Options](#textshaperoptions)
  - [Output Structure](#textshaperresultraw)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

## Installation

Install TextShaper via npm:

```sh
npm install @plastikmaykr/text-shaper
```

## Basic Usage

TextShaper provides both a low-level API and a set of built-in convenience methods. For most use cases, you’ll likely use one of convenience methods for your rendering context of choice.

### Convenience Method

The `textShaper.svg(text, options)` method internally calls the raw layout function and then formats the output for SVG rendering. This design allows you to either use the built-in formatters or create your own if you prefer.

```js
import { textShaper } from '@plastikmaykr/text-shaper';

const text = 'The quick brown fox jumps over the lazy dog.';
const options = {
  // Layout container options (currently only circles are supported)
  size: 200,                 // Diameter of the circle in pixels

  // SizeRange: pass a number
  // or an object with value and an optional minimum value.
  fontSize: { value: 18, min: 12 },

  // Line height options: similarly, a number or { value, min }
  lineHeight: 1.2,

  fontFamily: 'Arial, sans-serif',

  // Ellipsis enabled if text doesn't fit,
  // "…" is the default, but can also be set to a custom string
  ellipsis: true,

  // Coordinate system and alignment settings
  origin: 'center',          // Options: 'center' or 'topleft'
  verticalAlign: 'middle',   // Options: 'top', 'middle', 'bottom'
  horizontalAlign: 'center', // Options: 'start', 'center', 'end'
  textBaseline: 'middle',    // Options: 'top', 'middle', 'bottom'
  textAlign: 'center',       // Options: 'start', 'center', 'end'
};

const svgOutput = textShaper.svg(text, options);
```

Example output of `textShaper.svg()` would look like this:

```js
{
  lines: [
    {
      text: 'The quick brown',
      attrs: {
          x: 25,
          y: 35,
          'font-size': 16,
          'font-family': 'Arial, sans-serif',
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
      }
    },
    // more lines
  ],
  meta: {
    fontSize: 16,
    fontFamily: 'Arial, sans-serif',
    lineHeight: 1.2,
    textAnchor: 'middle',
    dominantBaseline: 'middle',
    overflowed: false,
    modified: true,
    text: {
      full: 'The quick brown fox jumps over the lazy dog.',
      leftover: ''
    }
  }
}
```

### Rendering Example (SVG)

** COMING SOON **

## API Reference

### textShaperRaw

Lays out text within a circle and returns the raw positioning data.

- **Parameters:**
  - `text` *(string)*: The text to lay out.
  - `options` *(TextShaperOptions)*: Configuration options (see below).
- **Returns:** A `TextShaperResultRaw` object.

### Convenience Methods

The library provides a namespace `textShaper` with convenience methods:
- **`textShaper.svg(text, options)`**: Formats text for SVG rendering.
- **`textShaper.html(text, options)`**: Formats text for HTML rendering.
- **`textShaper.ctx(text, options)`**: Formats text for Canvas rendering.

These methods are built by combining `textShaperRaw` with the corresponding formatter function. They serve most users’ needs and ensure consistency while still leaving the door open for custom formatters.

### TextShaperOptions

The options object allows you to control layout behavior, numeric values are supposed to be set in pixels:

- **size** *(number)*: Diameter of the circle.
- **margin** *(number)*: Offset from container's edges.
- **fontSize** *(number | SizeRange)*:
  - If a number or `{ value:number }` is provided, the text will be truncated if it doesn’t fit.
  - Providing `{ value, min }` enables the library to shrink the text down to the minimum if needed, before any trucation is applied.
- **lineHeight** *(number | SizeRange)*: Works like `fontSize`.
- **fontFamily** *(string)*: Font family to use.
- **origin** *("center" | "topleft")*: The coordinate system for output.
- **verticalAlign** *("top" | "middle" | "bottom")*: Vertical text alignment.
- **horizontalAlign** *("start" | "center" | "end")*: Horizontal text alignment.
- **textBaseline** *("top" | "middle" | "bottom")*: For SVG and Canvas formatters/renderers.
- **textAlign** *("start" | "center" | "end")*: For SVG and Canvas formatters/renderers.

### TextShaperResultRaw

The raw output returned by `textShaperRaw` has the following structure:

```ts
interface TextLineRaw {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextShaperResultRaw {
  lines: TextLineRaw[];
  meta: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    overflowed: boolean;
    modified: boolean;
    origin: 'topleft' | 'center';
    text: {
      full: string;
      leftover: string;
    };
  };
}
```

This raw output is meant to be transformed by the built-in or custom formatting function into formats suitable for specific rendering context (SVG, HTML, Canvas).

## Roadmap

- **Formatters documentation:** Documentation on creating custom formatters.
- **Rendering Examples:** Demos with code snippets for HTML, SVG and Canvas integrations.
- **Additional Shapes:** Support for rectangles (also with rounded corners) and custom shapes.

## Contributing

Contributions in the form of discussions to improve this project are welcome. If you have ideas or suggestions please open an issue to start a conversation. Here are some areas where your input would be particularly valuable:

- **Input Object Structure**: TextShaperOptions improvements for better usability and intuitive properties naming.
- **Output Formats**: Suggest refinements to the output formatters to better meet common use cases.
