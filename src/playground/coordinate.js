const ScratchRender = require("../RenderWebGL");
const getMousePosition = require("./getMousePosition");

const canvas = document.getElementById("scratch-stage");
let fudge = 90;
const canvasSize = {
    width: 800,
    height: 600,
};
const pixelRatio = window.devicePixelRatio || 1;
const lineWidth = 1;
canvas.style.width = `${canvasSize.width}px`;
canvas.style.height = `${canvasSize.height}px`;

const cx = canvasSize.width / 2;
const cy = canvasSize.height / 2;
const gridSize = 24;
const coordinate = [-cx, cx, -cy, cy];
const xLineLen = Math.floor(cx / gridSize);
const yLineLen = Math.floor(cy / gridSize);

console.log({ xLineLen, yLineLen });

const linesCoordinate = [];
// 垂直中心轴
const offsetSize = 0;

for (let x = 0; x < xLineLen; x++) {
    // const ox = x * gridSize;
    // linesCoordinate.push([-cx + ox, 0, cx + ox, 0]);
    if (x === 0) {
        linesCoordinate.push([-cx, 0 - offsetSize, cx, 0 - offsetSize]);
    } else {
        // const ox = x * gridSize;
        // linesCoordinate.push([-cx, ox, cx, ox]);
        // linesCoordinate.push([-cx, -ox, cx, -ox]);
    }
}
for (let y = 0; y < yLineLen; y++) {
    if (y === 0) {
        linesCoordinate.push([0 - offsetSize, -cy, 0 - offsetSize, cy]);
    } else {
        // const oy = y * gridSize;
        // linesCoordinate.push([0, -cy + oy, 0, cy + oy]);
        // linesCoordinate.push([0, -cy - oy, 0, cy + -oy]);
    }
}
console.log(linesCoordinate);

const renderer = new ScratchRender(canvas, ...coordinate);
const coordinateGroupName = "cd";

renderer.setLayerGroupOrdering([coordinateGroupName]);

const penSkinID = renderer.createPenSkin();
const penDrawableId = renderer.createDrawable(coordinateGroupName);
renderer.updateDrawableSkinId(penDrawableId, penSkinID);

for (let index = 0; index < linesCoordinate.length; index++) {
    const coor = linesCoordinate[index];
    const attrs = {
        color4f: [0, 0, 0, 0.8],
        diameter: 1 / pixelRatio,
    };
    // console.log(attrs);
    renderer.penLine(penSkinID, attrs, ...coor);
}
renderer.penPoint(
    penSkinID,
    { color4f: [255, 0, 0, 0.5], diameter: 16 },
    0,
    0,
    0,
    0
);
renderer.penPoint(
    penSkinID,
    { color4f: [0, 0, 0, 0.5], diameter: 12 },
    0,
    0,
    0,
    0
);

// let isMouseDown = false;
// let PICKID = 0;

// canvas.addEventListener("mousedown", (event) => {
//     if (isMouseDown) {
//         return;
//     }
//     const mousePos = getMousePosition(event, canvas);
//     const pickID = renderer.pick(mousePos.x, mousePos.y);
//     // console.log(`You clicked on ${(pickID < 0 ? 'nothing' : `ID# ${pickID}`)}`);
//     if (pickID && pickID >= 0) {
//         // renderer.updateDrawableSkinId(drawableID2, penSkinID);
//         console.dir(renderer.extractDrawableScreenSpace(pickID));
//         console.dir(renderer.extractDrawable(pickID, mousePos.x, mousePos.y));
//         isMouseDown = true;
//         PICKID = pickID;
//     }
// });

// const updatePos = (() => {
//     const rPos = [0, 0];
//     const posEle = document.createElement("div");
//     document.body.appendChild(posEle);
//     const update = (pos) => {
//         posEle.innerText = `(x: ${pos[0]}, y: ${pos[1]})`;
//     };
//     update(rPos);
//     return update;
// })();

// canvas.addEventListener("mousemove", (event) => {
//     // console.log({ mousePos, event });
//     const mousePos = getMousePosition(event, canvas);
//     const { width, height } = canvas.getBoundingClientRect();
//     const rPos = [mousePos.x - width / 2, height / 2 - mousePos.y];
//     updatePos(rPos);
//     renderer.extractColor(mousePos.x, mousePos.y, 30);
//     if (isMouseDown && PICKID > 0) {
//         const x = mousePos.x - width / 2;
//         const y = mousePos.y - height / 2;
//         renderer.updateDrawablePosition(PICKID, [x, -y]);
//     }
// });

// canvas.addEventListener("mouseup", (event) => {
//     console.log(event);
//     isMouseDown = false;
//     PICKID = 0;
// });

// canvas.addEventListener("mouseleave", (event) => {
//     if (isMouseDown) {
//         console.log(event);
//         isMouseDown = false;
//     }
//     if (PICKID > 0) {
//         PICKID = 0;
//     }
// });

// const drawStep = function () {
//     renderer.draw();
//     // renderer.getBounds(drawableID2);
//     // renderer.isTouchingColor(drawableID2, [255,255,255]);
//     requestAnimationFrame(drawStep);
// };
// drawStep();

// const debugCanvas = /** @type {canvas} */ document.getElementById(
//     "debug-canvas"
// );
// renderer.setDebugCanvas(debugCanvas);

// const WantedSkinType = {
//     bitmap: 'bitmap',
//     vector: 'vector',
//     pen: 'pen'
// };

// const wantedSkin = WantedSkinType.vector;

// Bitmap (squirrel)
// const image = new Image();
// image.addEventListener('load', () => {
//     const bitmapSkinId = renderer.createBitmapSkin(image);
//     const drawableID = renderer.createDrawable('gr');
//     renderer.updateDrawableProperties(drawableID, {
//         skinId: bitmapSkinId,
//         position: [0, 0],
//         scale: [100, 100],
//         direction: 90
//     });
// });
// image.crossOrigin = 'anonymous';
// image.src = 'https://cdn.assets.scratch.mit.edu/internalapi/asset/7e24c99c1b853e52f8e7f9004416fa34.png/get/';

// SVG (cat 1-a)
// const xhr = new XMLHttpRequest();
// xhr.addEventListener('load', () => {
//     const skinId = renderer.createSVGSkin(xhr.responseText);
//     const drawableID2 = renderer.createDrawable('gr');
//     renderer.updateDrawableProperties(drawableID2, {
//         skinId: skinId
//     });
// });
// xhr.open('GET', 'https://cdn.assets.scratch.mit.edu/internalapi/asset/b7853f557e4426412e64bb3da6531a99.svg/get/');
// xhr.send();

// canvas.addEventListener('click', event => {
//     const {width, height, left, top} = canvas.getBoundingClientRect();
//     const mousePos = getMousePosition(event, canvas);
//     const ox = width / 2;
//     const oy = height / 2;
//     const pos = {
//         ox,
//         oy,
//         width,
//         height,
//         x0: mousePos.x - ox,
//         y0: oy - mousePos.y,
//         x1: (Math.random() * ox) - ox,
//         y1: (Math.random() * oy) - oy
//     };
//     console.log(pos);
//     renderer.penLine(penSkinID, {
//         color4f: [Math.random(), Math.random(), Math.random(), 1],
//         diameter: 1 / pixelRatio
//     }, pos.x0, pos.y0, pos.x1, pos.y1);
// });
