const PIXI = require('pixi.js');
const { DIRECTION_CURSORS, ZOOM_DIRECTION } = require('../../enum');

class MarkingToolGraphics {

    constructor(renderer, vm, pixiIntance) {
        this._renderer = renderer;

        this._vm = vm;

        this._pixiIntance = pixiIntance;

        this._container = null;
    }

    set container(container) {
        this._container = container;
    }

    set visible(visible) {
        this.container.visible = visible;
    }

    get container() {
        return this._container;
    }

    get renderer() {
        return this._renderer;
    }

    get vm() {
        return this._vm;
    }

    get editingTarget() {
        return this.vm.runtime.getEditingTarget() || {};
    }

    get activedDrawableId() {
        return this.editingTarget.drawableID || 0;
    }

    /**
     * 创建
     *
     * @memberof MarkingToolGraphics
     */
    create() {
        if (!this.container) {
            this.container = new PIXI.Graphics();
            this.container.interactive = true;
            this._pixiIntance.stage.addChild(this._container);
        }
    }

    /**
     * 更新
     *
     * @param {*} sprite
     * @returns
     * @memberof MarkingToolGraphics
     */
    update(sprite) {
        if (!this.container) {
            this.create();
        } else {
            let currentSprite = sprite;
            if (!sprite) {
                const drawble = this.renderer._allDrawables[this.activedDrawableId];
                if (!drawble || !drawble.skin) return;
                const { spriteObj, visible } = drawble.skin;
                this.visible = visible;
                currentSprite = spriteObj;
            }
            const { width, height, x, y, rotation, zIndex } = currentSprite;
            const zoomRatio = 1.1;
            const borderWidth = 2;
            const gw = Math.ceil(width * zoomRatio);
            const gh = Math.ceil(height * zoomRatio);
            if (gw !== this.container.width - borderWidth || gh !== this.container.height - borderWidth) {
                this.container.clear();
                this.container.removeChildren();
                const deviationWidth = (gw - width) / 2;
                const deviationHeight = (gh - height) / 2;
                this.container
                    .beginFill(0xffffff, 0)
                    .lineStyle(borderWidth, 0xdddddd)
                    .drawRoundedRect(-width / 2 - deviationWidth, -height / 2 - deviationHeight, gw, gh, 5);
                const topLeftPointGraphics = this.drawPointGraphics(
                    -width / 2 - deviationWidth,
                    -height / 2 - deviationHeight,
                    ZOOM_DIRECTION.TOP_LEFT,
                    5,
                    0xffffff,
                    borderWidth,
                    0xdddddd
                );
                const topRightPointGraphics = this.drawPointGraphics(
                    -width / 2 - deviationWidth + gw,
                    -height / 2 - deviationHeight,
                    ZOOM_DIRECTION.TOP_RIGHT,
                    5,
                    0xffffff,
                    borderWidth,
                    0xdddddd
                );
                const bottomRightPointGraphics = this.drawPointGraphics(
                    -width / 2 - deviationWidth + gw,
                    -height / 2 - deviationHeight + gh,
                    ZOOM_DIRECTION.BOTTOM_RIGHT,
                    5,
                    0xffffff,
                    borderWidth,
                    0xdddddd
                );
                const bottomLeftPointGraphics = this.drawPointGraphics(
                    -width / 2 - deviationWidth,
                    -height / 2 - deviationHeight + gh,
                    ZOOM_DIRECTION.BOTTOM_LEFT,
                    5,
                    0xffffff,
                    borderWidth,
                    0xdddddd
                );
                this.container.addChild(
                    topLeftPointGraphics,
                    topRightPointGraphics,
                    bottomRightPointGraphics,
                    bottomLeftPointGraphics
                );
            }
            if (x !== this.container.x || y !== this.container.y) {
                this.container.position.set(x, y);
            }
            if (rotation !== this.container.rotation) {
                this.container.rotation = rotation;
            }
            if (zIndex !== this.container.zIndex) {
                this.container.zIndex = zIndex - 1;
            }
            this.container.endFill();
        }
    }

    /**
     * 清除
     *
     * @memberof MarkingToolGraphics
     */
    clear() {
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
    }

    /**
     * 绘制点
     *
     * @param {*} x
     * @param {*} y
     * @param {*} direction
     * @param {*} radius
     * @param {*} fillColor
     * @param {*} borderWidth
     * @param {*} borderColor
     * @returns
     * @memberof MarkingToolGraphics
     */
    drawPointGraphics(
        x,
        y,
        direction,
        radius,
        fillColor,
        borderWidth,
        borderColor
    ) {
        const pointGraphics = new PIXI.Graphics();
        pointGraphics.interactive = true;
        pointGraphics.cursor = DIRECTION_CURSORS[direction] || DIRECTION_CURSORS.DEFAULT;
        pointGraphics.beginFill(fillColor).lineStyle(borderWidth, borderColor).drawCircle(x, y, radius);
        pointGraphics
            .on('mousedown', function (event) { })
            .on('mousemove', function (event) { })
            .on('mouseup', function (event) { })
            .on('mouseupoutside', function (event) { });
        return pointGraphics;
    }
}

module.exports = MarkingToolGraphics;
