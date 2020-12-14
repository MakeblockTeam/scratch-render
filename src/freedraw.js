const RenderConstants = require("./RenderConstants");
const Skin = require("./Skin");
const { fabric } = require("fabric");

const ShaderManager = require("./ShaderManager");

/**
 * Attributes to use when drawing with the pen
 * @typedef {object} PenSkin#PenAttributes
 * @property {number} [diameter] - The size (diameter) of the pen.
 * @property {Array<number>} [color4f] - The pen color as an array of [r,g,b,a], each component in the range [0,1].
 */

/**
 * The pen attributes to use when unspecified.
 * @type {PenSkin#PenAttributes}
 * @memberof PenSkin
 * @private
 * @const
 */
const DefaultPenAttributes = {
    color4f: [0, 0, 1, 1],
    diameter: 1,
};

/**
 * Reused memory location for storing a premultiplied pen color.
 * @type {FloatArray}
 */
const __premultipliedColor = [0, 0, 0, 0];

class PenSkin extends Skin {
    /**
     * Create a Skin which implements a Scratch pen layer.
     * @param {int} id - The unique ID for this Skin.
     * @param {RenderWebGL} renderer - The renderer which will use this Skin.
     * @extends Skin
     * @listens RenderWebGL#event:NativeSizeChanged
     */
    constructor(id, renderer) {
        super(id);

        /**
         * @private
         * @type {RenderWebGL}
         */
        this._renderer = renderer;

        /** @type {Array<number>} */
        this._size = null;

        /** @type {WebGLFramebuffer} */
        this._framebuffer = null;

        /** @type {boolean} */
        this._silhouetteDirty = false;

        /** @type {Uint8Array} */
        this._silhouettePixels = null;

        /** @type {ImageData} */
        this._silhouetteImageData = null;

        /** @type {object} */
        this._lineOnBufferDrawRegionId = {
            enter: () => this._enterDrawLineOnBuffer(),
            exit: () => this._exitDrawLineOnBuffer(),
        };

        /** @type {object} */
        this._usePenBufferDrawRegionId = {
            enter: () => this._enterUsePenBuffer(),
            exit: () => this._exitUsePenBuffer(),
        };

        /** @type {twgl.BufferInfo} */
        this._lineBufferInfo = twgl.createBufferInfoFromArrays(
            this._renderer.gl,
            {
                a_position: {
                    numComponents: 2,
                    data: [1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1],
                },
            }
        );

        const NO_EFFECTS = 0;
        /** @type {twgl.ProgramInfo} */
        this._lineShader = this._renderer._shaderManager.getShader(
            ShaderManager.DRAW_MODE.line,
            NO_EFFECTS
        );

        this.onNativeSizeChanged = this.onNativeSizeChanged.bind(this);
        this._renderer.on(
            RenderConstants.Events.NativeSizeChanged,
            this.onNativeSizeChanged
        );

        this._setCanvasSize(renderer.getNativeSize());
    }

    /**
     * Dispose of this object. Do not use it after calling this method.
     */
    dispose() {
        this._renderer.removeListener(
            RenderConstants.Events.NativeSizeChanged,
            this.onNativeSizeChanged
        );
        this._renderer.gl.deleteTexture(this._texture);
        this._texture = null;
        super.dispose();
    }

    /**
     * @return {Array<number>} the "native" size, in texels, of this skin. [width, height]
     */
    get size() {
        return this._size;
    }

    useNearest(scale) {
        // Use nearest-neighbor interpolation when scaling up the pen skin-- this matches Scratch 2.0.
        // When scaling it down, use linear interpolation to avoid giving pen lines a "dashed" appearance.
        return Math.max(scale[0], scale[1]) >= 100;
    }

    /**
     * @param {Array<number>} scale The X and Y scaling factors to be used, as percentages of this skin's "native" size.
     * @return {WebGLTexture} The GL texture representation of this skin when drawing at the given size.
     */
    // eslint-disable-next-line no-unused-vars
    getTexture(scale) {
        return this._texture;
    }

    /**
     * Clear the pen layer.
     */
    clear() {
        this._renderer.enterDrawRegion(this._usePenBufferDrawRegionId);

        /* Reset framebuffer to transparent black */
        const gl = this._renderer.gl;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this._silhouetteDirty = true;
    }

    /**
     * Draw a point on the pen layer.
     * @param {PenAttributes} penAttributes - how the point should be drawn.
     * @param {number} x - the X coordinate of the point to draw.
     * @param {number} y - the Y coordinate of the point to draw.
     */
    drawPoint(penAttributes, x, y) {
        this.drawLine(penAttributes, x, y, x, y);
    }

    /**
     * Draw a line on the pen layer.
     * @param {PenAttributes} penAttributes - how the line should be drawn.
     * @param {number} x0 - the X coordinate of the beginning of the line.
     * @param {number} y0 - the Y coordinate of the beginning of the line.
     * @param {number} x1 - the X coordinate of the end of the line.
     * @param {number} y1 - the Y coordinate of the end of the line.
     */
    drawLine(penAttributes, x0, y0, x1, y1) {
        // For compatibility with Scratch 2.0, offset pen lines of width 1 and 3 so they're pixel-aligned.
        // See https://github.com/LLK/scratch-render/pull/314
        const diameter =
            penAttributes.diameter || DefaultPenAttributes.diameter;
        const offset = diameter === 1 || diameter === 3 ? 0.5 : 0;
        this._drawLineOnBuffer(
            penAttributes,
            x0 + offset,
            y0 + offset,
            x1 + offset,
            y1 + offset
        );

        this._silhouetteDirty = true;
    }
}

module.exports = PenSkin;

module.exports = function (canvas) {
    fabric.Object.prototype.transparentCorners = false;

    const clear = function () {
        canvas.clear();
    };

    const updateDrawingMode = () => {
        canvas.isDrawingMode = !canvas.isDrawingMode;
    };

    if (fabric.PatternBrush) {
        var vLinePatternBrush = new fabric.PatternBrush(canvas);
        vLinePatternBrush.getPatternSrc = function () {
            var patternCanvas = fabric.document.createElement("canvas");
            patternCanvas.width = patternCanvas.height = 10;
            var ctx = patternCanvas.getContext("2d");

            ctx.strokeStyle = this.color;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(0, 5);
            ctx.lineTo(10, 5);
            ctx.closePath();
            ctx.stroke();

            return patternCanvas;
        };

        var hLinePatternBrush = new fabric.PatternBrush(canvas);
        hLinePatternBrush.getPatternSrc = function () {
            var patternCanvas = fabric.document.createElement("canvas");
            patternCanvas.width = patternCanvas.height = 10;
            var ctx = patternCanvas.getContext("2d");

            ctx.strokeStyle = this.color;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(5, 0);
            ctx.lineTo(5, 10);
            ctx.closePath();
            ctx.stroke();

            return patternCanvas;
        };

        var squarePatternBrush = new fabric.PatternBrush(canvas);
        squarePatternBrush.getPatternSrc = function () {
            var squareWidth = 10,
                squareDistance = 2;

            var patternCanvas = fabric.document.createElement("canvas");
            patternCanvas.width = patternCanvas.height =
                squareWidth + squareDistance;
            var ctx = patternCanvas.getContext("2d");

            ctx.fillStyle = this.color;
            ctx.fillRect(0, 0, squareWidth, squareWidth);

            return patternCanvas;
        };

        var diamondPatternBrush = new fabric.PatternBrush(canvas);
        diamondPatternBrush.getPatternSrc = function () {
            var squareWidth = 10,
                squareDistance = 5;
            var patternCanvas = fabric.document.createElement("canvas");
            var rect = new fabric.Rect({
                width: squareWidth,
                height: squareWidth,
                angle: 45,
                fill: this.color,
            });

            var canvasWidth = rect.getBoundingRect().width;

            patternCanvas.width = patternCanvas.height =
                canvasWidth + squareDistance;
            rect.set({ left: canvasWidth / 2, top: canvasWidth / 2 });

            var ctx = patternCanvas.getContext("2d");
            rect.render(ctx);

            return patternCanvas;
        };

        var img = new Image();
        img.src = "../assets/honey_im_subtle.png";

        var texturePatternBrush = new fabric.PatternBrush(canvas);
        texturePatternBrush.source = img;
    }

    $("drawing-mode-selector").onchange = function () {
        if (this.value === "hline") {
            canvas.freeDrawingBrush = vLinePatternBrush;
        } else if (this.value === "vline") {
            canvas.freeDrawingBrush = hLinePatternBrush;
        } else if (this.value === "square") {
            canvas.freeDrawingBrush = squarePatternBrush;
        } else if (this.value === "diamond") {
            canvas.freeDrawingBrush = diamondPatternBrush;
        } else if (this.value === "texture") {
            canvas.freeDrawingBrush = texturePatternBrush;
        } else {
            canvas.freeDrawingBrush = new fabric[this.value + "Brush"](canvas);
        }

        if (canvas.freeDrawingBrush) {
            var brush = canvas.freeDrawingBrush;
            brush.color = drawingColorEl.value;
            if (brush.getPatternSrc) {
                brush.source = brush.getPatternSrc.call(brush);
            }
            brush.width = parseInt(drawingLineWidthEl.value, 10) || 1;
            brush.shadow = new fabric.Shadow({
                blur: parseInt(drawingShadowWidth.value, 10) || 0,
                offsetX: 0,
                offsetY: 0,
                affectStroke: true,
                color: drawingShadowColorEl.value,
            });
        }
    };

    drawingColorEl.onchange = function () {
        var brush = canvas.freeDrawingBrush;
        brush.color = this.value;
        if (brush.getPatternSrc) {
            brush.source = brush.getPatternSrc.call(brush);
        }
    };
    drawingShadowColorEl.onchange = function () {
        canvas.freeDrawingBrush.shadow.color = this.value;
    };
    drawingLineWidthEl.onchange = function () {
        canvas.freeDrawingBrush.width = parseInt(this.value, 10) || 1;
        this.previousSibling.innerHTML = this.value;
    };
    drawingShadowWidth.onchange = function () {
        canvas.freeDrawingBrush.shadow.blur = parseInt(this.value, 10) || 0;
        this.previousSibling.innerHTML = this.value;
    };
    drawingShadowOffset.onchange = function () {
        canvas.freeDrawingBrush.shadow.offsetX = parseInt(this.value, 10) || 0;
        canvas.freeDrawingBrush.shadow.offsetY = parseInt(this.value, 10) || 0;
        this.previousSibling.innerHTML = this.value;
    };

    if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = drawingColorEl.value;
        canvas.freeDrawingBrush.source = canvas.freeDrawingBrush.getPatternSrc.call(
            this
        );
        canvas.freeDrawingBrush.width =
            parseInt(drawingLineWidthEl.value, 10) || 1;
        canvas.freeDrawingBrush.shadow = new fabric.Shadow({
            blur: parseInt(drawingShadowWidth.value, 10) || 0,
            offsetX: 0,
            offsetY: 0,
            affectStroke: true,
            color: drawingShadowColorEl.value,
        });
    }
};
