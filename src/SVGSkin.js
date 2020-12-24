const PIXI = require('pixi.js-legacy');
const Skin = require('./Skin');
const ShaderManager = require('./ShaderManager');

const MAX_TEXTURE_DIMENSION = 2048;

/**
 * All scaled renderings of the SVG are stored in an array. The 1.0 scale of
 * the SVG is stored at the 8th index. The smallest possible 1 / 256 scale
 * rendering is stored at the 0th index.
 * @const {number}
 */
const INDEX_OFFSET = 8;

class SVGSkin extends Skin {
    /**
     * Create a new SVG skin.
     * @param {!int} id - The ID for this Skin.
     * @param {!RenderWebGL} renderer - The renderer which will use this skin.
     * @constructor
     * @extends Skin
     */
    constructor(id, renderer) {
        super(id);

        /** @type {RenderWebGL} */
        this._renderer = renderer;

        /** @type {Array<WebGLTexture>} */
        this._scaledMIPs = [];

        /** @type {number} */
        this._largestMIPScale = 0;

        this._size = [0, 0];
        this._spriteObj = null;
        this._visible = false;
        /**
         * Ratio of the size of the SVG and the max size of the WebGL texture
         * @type {Number}
         */
        this._maxTextureScale = 1;

        this._pixiLoader = new PIXI.Loader();
    }

    /**
     * Dispose of this object. Do not use it after calling this method.
     */
    dispose() {
        this.resetMIPs();
        super.dispose();
    }

    /**
     * @return {Array<number>} the natural size, in Scratch units, of this skin.
     */
    get size() {
        return this._size;
    }

    get spriteObj() {
        return this._spriteObj;
    }

    get renderer() {
        return this._renderer;
    }

    get pixiInstance() {
        return this._renderer._pixiInstance;
    }

    get vm() {
        return this._renderer._vm;
    }

    useNearest(scale, drawable) {
        // If the effect bits for mosaic, pixelate, whirl, or fisheye are set, use linear
        if (
            (drawable.enabledEffects &
                (ShaderManager.EFFECT_INFO.fisheye.mask |
                    ShaderManager.EFFECT_INFO.whirl.mask |
                    ShaderManager.EFFECT_INFO.pixelate.mask |
                    ShaderManager.EFFECT_INFO.mosaic.mask)) !==
            0
        ) {
            return false;
        }

        // We can't use nearest neighbor unless we are a multiple of 90 rotation
        if (drawable._direction % 90 !== 0) {
            return false;
        }

        // Because SVG skins' bounding boxes are currently not pixel-aligned, the idea here is to hide blurriness
        // by using nearest-neighbor scaling if one screen-space pixel is "close enough" to one texture pixel.
        // If the scale of the skin is very close to 100 (0.99999 variance is okay I guess)
        // TODO: Make this check more precise. We should use nearest if there's less than one pixel's difference
        // between the screen-space and texture-space sizes of the skin. Mipmaps make this harder because there are
        // multiple textures (and hence multiple texture spaces) and we need to know which one to choose.
        if (
            Math.abs(scale[0]) > 99 &&
            Math.abs(scale[0]) < 101 &&
            Math.abs(scale[1]) > 99 &&
            Math.abs(scale[1]) < 101
        ) {
            return true;
        }
        return false;
    }

    /**
     * Create a MIP for a given scale.
     * @param {number} scale - The relative size of the MIP
     * @return {SVGMIP} An object that handles creating and updating SVG textures.
     */
    createMIP(scale) {
        // this._svgRenderer.draw(scale);
        // Pull out the ImageData from the canvas. ImageData speeds up
        // updating Silhouette and is better handled by more browsers in
        // regards to memory.
        // const canvas = this._svgRenderer.canvas;
        // If one of the canvas dimensions is 0, set this MIP to an empty image texture.
        // This avoids an IndexSizeError from attempting to getImageData when one of the dimensions is 0.
        // if (canvas.width === 0 || canvas.height === 0) return super.getTexture();
        // const context = canvas.getContext('2d');
        // const textureData = context.getImageData(0, 0, canvas.width, canvas.height);
        // const textureOptions = {
        //     auto: false,
        //     wrap: this._renderer.gl.CLAMP_TO_EDGE,
        //     src: textureData,
        //     premultiplyAlpha: true
        // };
        // const mip = twgl.createTexture(this._renderer.gl, textureOptions);
        // // Check if this is the largest MIP created so far. Currently, silhouettes only get scaled up.
        // if (this._largestMIPScale < scale) {
        //     this._silhouette.update(textureData);
        //     this._largestMIPScale = scale;
        // }
        // return mip;
    }

    updateSilhouette(scale = [100, 100]) {
        // Ensure a silhouette exists.
        this.getTexture(scale);
    }

    /**
     * @param {Array<number>} scale - The scaling factors to be used, each in the [0,100] range.
     * @return {WebGLTexture} The GL texture representation of this skin when drawing at the given scale.
     */
    getTexture(scale) {
        console.log({ scale });
        // The texture only ever gets uniform scale. Take the larger of the two axes.
        const scaleMax = scale ? Math.max(Math.abs(scale[0]), Math.abs(scale[1])) : 100;
        const requestedScale = Math.min(scaleMax / 100, this._maxTextureScale);

        // Math.ceil(Math.log2(scale)) means we use the "1x" texture at (0.5, 1] scale,
        // the "2x" texture at (1, 2] scale, the "4x" texture at (2, 4] scale, etc.
        // This means that one texture pixel will always be between 0.5x and 1x the size of one rendered pixel,
        // but never bigger than one rendered pixel--this prevents blurriness from blowing up the texture too much.
        const mipLevel = Math.max(Math.ceil(Math.log2(requestedScale)) + INDEX_OFFSET, 0);
        // Can't use bitwise stuff here because we need to handle negative exponents
        const mipScale = Math.pow(2, mipLevel - INDEX_OFFSET);

        // if (this._svgRenderer.loaded && !this._scaledMIPs[mipLevel]) {
        //     this._scaledMIPs[mipLevel] = this.createMIP(mipScale);
        // }

        return this._scaledMIPs[mipLevel] || super.getTexture();
    }

    /**
     * Do a hard reset of the existing MIPs by deleting them.
     * @param {Array<number>} [rotationCenter] - Optional rotation center for the SVG. If not supplied, it will be
     * calculated from the bounding box
     * @fires Skin.event:WasAltered
     */
    resetMIPs() {
        this._scaledMIPs.forEach((oldMIP) => this._renderer.gl.deleteTexture(oldMIP));
        this._scaledMIPs.length = 0;
        this._largestMIPScale = 0;
    }

    /**
     * 创建精灵图
     *
     * @param {*} baseTexture
     * @memberof SVGSkin
     */
    createSprite(baseTexture) {
        const texture = new PIXI.Texture(baseTexture);
        const sprite = new PIXI.Sprite.from(texture);
        this._spriteObj = sprite;
    }

    /**
     * 初始化精灵图配置
     *
     * @param {*} baseTexture
     * @memberof SVGSkin
     */
    initSprite(baseTexture) {
        this.resetMIPs();
        const { width = 0, height = 0 } = baseTexture;
        // 设置宽度
        this._spriteObj.width = width;
        // 设置高度
        this._spriteObj.height = height;
        // 设置定位，默认居中
        this._spriteObj.position.set(0, 0);
        // 设置中心点
        this._spriteObj.anchor.set(0.5, 0.5);
        // 设置是否可见
        this._spriteObj.visible = this._visible;
        // 设置是否支持互动
        this._spriteObj.interactive = true;
        // 设置鼠标光标悬停
        this._spriteObj.buttonMode = true;
        // 设置 cursor
        this._spriteObj.cursor = 'move';
    }

    /**
     * 渲染精灵图至舞台
     *
     * @param {*} sprite
     * @memberof SVGSkin
     */
    addSprite(sprite) {
        this.pixiInstance.stage.addChild(sprite);
    }

    /**
     * Set the contents of this skin to a snapshot of the provided SVG data.
     * @param {string} svgData - new SVG to use.
     * @param {Array<number>} [rotationCenter] - Optional rotation center for the SVG.
     */
    setSVG(svgData, rotationCenter) {
        const baseTexture = new PIXI.BaseTexture(svgData);
        this.createSprite(baseTexture);
        // 判断是否已有缓存
        if (baseTexture.hasLoaded) {
            this.initSprite(baseTexture);
        } else {
            baseTexture.on('loaded', () => {
                this.initSprite(baseTexture);
            });
        }
    }

    get visible() {
        return this._visible;
    }

    set visible(value) {
        if (this._spriteObj) {
            this._visible = value;
            this._spriteObj.visible = value;
            this.addSprite(this._spriteObj);
        }
    }
    // toggleVisble(visible = false) {
    //     if (this._spriteObj) {
    //         this._spriteObj.set('visible', visible);
    //         this._renderer._canvas.renderAll();
    //     }
    // }
}

module.exports = SVGSkin;
