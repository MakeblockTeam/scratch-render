const PIXI = require('pixi.js-legacy');
const { fabric } = require('fabric-pure-browser');

const spriteNum = 100;

function createSpriteWithPixi(width, height) {
    const baseTexture = new PIXI.BaseTexture('https://ide.makeblock.com/static/resource/scratch/mscratchXiong1.svg');
    const texture = new PIXI.Texture(baseTexture);
    const sprite = new PIXI.Sprite.from(texture);
    window.pixiContainer.stage.addChild(sprite);
    const x = Math.random() * width;
    const y = Math.random() * height;
    const onDragStart = function (event) {
        this.data = event.data;
        this.alpha = 0.5;
        this.dragging = true;
    }
    const onDragEnd = function () {
        this.alpha = 1;
        this.dragging = false;
        this.data = null;
    }
    const onDragMove = function () {
        if (this.dragging) {
            const newPosition = this.data.getLocalPosition(this.parent);
            this.x = newPosition.x;
            this.y = newPosition.y;
        }
    }
    sprite.buttonMode = true;
    sprite.interactive = true;
    sprite.position.set(x, y);
    sprite
        .on('pointerdown', onDragStart.bind(sprite))
        .on('pointerup', onDragEnd.bind(sprite))
        .on('pointerupoutside', onDragEnd.bind(sprite))
        .on('pointermove', onDragMove.bind(sprite));
}

function createSpriteWithFabric(width, height) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    new fabric.loadSVGFromURL('https://ide.makeblock.com/static/resource/scratch/mscratchXiong1.svg', function (objects, options) {
        options.left = x;
        options.top = y;
        var obj = fabric.util.groupSVGElements(objects, options);
        window.fabricCanvas.add(obj);
    });
}

function createRenderButtonWithPixi(width, height) {
    const renderButton = document.createElement('button');
    renderButton.innerHTML = `渲染 ${spriteNum} pixi角色`;
    renderButton.setAttribute('style', 'position: absolute; top: 0; left: 0; z-index: 2;');
    window.stageWrapper = document.querySelector('.stage_stage-wrapper');
    window.stageWrapper.appendChild(renderButton);
    renderButton.addEventListener('click', function () {
        renderSpriteWithPixi(width, height);
    });
}

function createRenderButtonWithFabric(width, height) {
    const renderButton = document.createElement('button');
    renderButton.innerHTML = `渲染 ${spriteNum} fabric角色`;
    renderButton.setAttribute('style', 'position: absolute; top: 0; left: 150px; z-index: 2;');
    window.stageWrapper = document.querySelector('.stage_stage-wrapper');
    window.stageWrapper.appendChild(renderButton);
    renderButton.addEventListener('click', function () {
        renderSpriteWithFabric(width, height);
    });
}

function renderSpriteWithPixi(width, height) {
    if (window.pixiContainer && window.pixiContainer.renderer) return;
    const defaultStage = document.querySelector('.stage_stage');
    const stageDraggingSprite = document.querySelector('.stage_dragging-sprite');
    if (defaultStage) {
        window.stageWrapper.removeChild(defaultStage);
        window.stageWrapper.removeChild(stageDraggingSprite);
    }
    if (window.fabricCanvas) {
        window.fabricCanvas.clear();
        window.fabricCanvas = undefined;
        window.stageWrapper.removeChild(document.querySelector('.canvas-container'));
    }
    window.pixiContainer = new PIXI.Application({
        width,
        height,
        backgroundColor: 0xFFFFFF,
        antialias: true,
    });
    window.stageWrapper.appendChild(window.pixiContainer.renderer.view);
    for (let i = 0; i < spriteNum; i++) {
        createSpriteWithPixi(width, height);
    }
}

function renderSpriteWithFabric(width, height) {
    if (window.fabricCanvas) return;
    const defaultStage = document.querySelector('.stage_stage');
    const stageDraggingSprite = document.querySelector('.stage_dragging-sprite');
    if (defaultStage) {
        window.stageWrapper.removeChild(defaultStage);
        window.stageWrapper.removeChild(stageDraggingSprite);
    }
    if (window.pixiContainer) {
        window.pixiContainer.destroy();
        window.pixiContainer = undefined;
        window.stageWrapper.removeChild(document.querySelector('canvas'));
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    window.stageWrapper.appendChild(canvas);
    fabric.Object.prototype.objectCaching = false;
    fabric.Object.prototype.originX = 'center';
    fabric.Object.prototype.originY = 'center';
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.objectCaching = true;
    window.fabricCanvas = new fabric.Canvas(canvas);
    for (let i = 0; i < spriteNum; i++) {
        createSpriteWithFabric(width, height);
    }
}

export {
    createRenderButtonWithPixi,
    createRenderButtonWithFabric
}