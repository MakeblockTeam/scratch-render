const PIXI = require('pixi.js');
const Skin = require('./Skin');
const ShaderManager = require('./ShaderManager');
const fixupSvgString = require('./util/fixup-svg-string');

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

        this._id = id;

        /** @type {RenderWebGL} */
        this._renderer = renderer;

        /** @type {Array<WebGLTexture>} */
        this._scaledMIPs = [];

        /** @type {number} */
        this._largestMIPScale = 0;
        /** 传入的 svg 节点 */
        this._svgDom = null;
        /** 传入的 svg 节点 document */
        this._svgTag = null;
        /** 传入的 svg 基础纹理 */
        this._svgBaseTexture = null;
        /** 实际纹理 */
        this._texture = null;
        /** 精灵对象 */
        this._spriteObj = null;
        this._visible = false;
        /**
         * Ratio of the size of the SVG and the max size of the WebGL texture
         * @type {Number}
         */
        this._maxTextureScale = 1;
    }

    /**
     * Dispose of this object. Do not use it after calling this method.
     */
    dispose() {
        this.resetMIPs();
        super.dispose();
    }

    set spriteObj(sprite) {
        this._spriteObj = sprite;
    }

    /**
     * @return {Array<number>} the natural size, in Scratch units, of this skin.
     */
    get size() {
        return [this._svgBaseTexture.width, this._svgBaseTexture.height];
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
     * @memberof SVGSkin
     */
    createSprite() {
        const sprite = new PIXI.Sprite.from(this._texture);
        this.spriteObj = sprite;
        // 设置新添加角色的 zIndex，不能放在 initSprite，存在异步问题
        this.spriteObj.zIndex = this._id;
        // 判断是否已有缓存
        if (this._svgBaseTexture.hasLoaded) {
            this.initSprite(this._svgBaseTexture);
        } else {
            this._svgBaseTexture.on('loaded', (svgInfo) => {
                this.initSprite(svgInfo);
            });
        }
        this.pixiInstance.stage.addChild(sprite);
    }

    /**
     * 初始化精灵图配置
     *
     * @param {*} svgInfo
     * @memberof SVGSkin
     */
    initSprite(svgInfo) {
        this.resetMIPs();
        const { width = 0, height = 0 } = svgInfo;
        // 设置宽度
        this.spriteObj.width = width;
        // 设置高度
        this.spriteObj.height = height;
        // 设置中心点
        this.spriteObj.anchor.set(0.5, 0.5);
        // 设置是否可见
        this.spriteObj.visible = this._visible;
        // 创建标注工具
        this.renderer.markingToolGraphics.create();
        // 更新标注工具
        this.renderer.markingToolGraphics.update(this.spriteObj);
    }

    _findLargestStrokeWidth(rootNode) {
        let largestStrokeWidth = 0;
        const collectStrokeWidths = domElement => {
            if (domElement.getAttribute) {
                if (domElement.getAttribute('stroke')) {
                    largestStrokeWidth = Math.max(largestStrokeWidth, 1);
                }
                if (domElement.getAttribute('stroke-width')) {
                    largestStrokeWidth = Math.max(
                        largestStrokeWidth,
                        Number(domElement.getAttribute('stroke-width')) || 0
                    );
                }
            }
            for (let i = 0; i < domElement.childNodes.length; i++) {
                collectStrokeWidths(domElement.childNodes[i]);
            }
        };
        collectStrokeWidths(rootNode);
        return largestStrokeWidth;
    }

    _transformMeasurements() {
        const svgSpot = document.createElement('span');
        const tempTag = this._svgTag.cloneNode(/* deep */ true);
        let bbox;
        try {
            svgSpot.appendChild(tempTag);
            document.body.appendChild(svgSpot);
            bbox = tempTag.getBBox();
        } finally {
            document.body.removeChild(svgSpot);
            svgSpot.removeChild(tempTag);
        }
        let halfStrokeWidth;
        if (bbox.width === 0 || bbox.height === 0) {
            halfStrokeWidth = 0;
        } else {
            halfStrokeWidth = this._findLargestStrokeWidth(this._svgTag) / 2;
        }
        const width = bbox.width + (halfStrokeWidth * 2) || 1;
        const height = bbox.height + (halfStrokeWidth * 2) || 1;
        const x = bbox.x - halfStrokeWidth;
        const y = bbox.y - halfStrokeWidth;
        this._svgTag.setAttribute('width', width);
        this._svgTag.setAttribute('height', height);
        this._svgTag.setAttribute('viewBox',
            `${x} ${y} ${width} ${height}`);
    }

    _fixSvgString(svgData) {
        let svgString = fixupSvgString(svgData);
        const parser = new DOMParser();
        this._svgDom = parser.parseFromString(svgString, 'text/xml');
        if (this._svgDom.childNodes.length < 1 ||
            this._svgDom.documentElement.localName !== 'svg') {
            throw new Error('Document does not appear to be SVG.');
        }
        this._svgTag = this._svgDom.documentElement;
        this._transformMeasurements();
        const XMLS = new XMLSerializer();
        svgString = XMLS.serializeToString(this._svgDom);
        return svgString;
    }

    setSVG(svgData) {
        const svgString = this._fixSvgString(svgData);
        this._svgBaseTexture = new PIXI.BaseTexture(svgString);
        this._texture = new PIXI.Texture(this._svgBaseTexture);
        // 判断是否已加载 sprite，若存在，则替换 texture 并更新宽高即可
        if (this.spriteObj) {
            this.spriteObj.texture = this._texture;
            this._svgBaseTexture.on('loaded', (svgInfo) => {
                this.spriteObj.width = svgInfo.width;
                this.spriteObj.height = svgInfo.height;
                this.renderer.markingToolGraphics.update();
            });
        } else {
            this.createSprite();
        }
    }

    get visible() {
        return this._visible;
    }

    set visible(value) {
        if (this.spriteObj) {
            this._visible = value;
            this.spriteObj.visible = value;
        }
    }
}

module.exports = SVGSkin;
