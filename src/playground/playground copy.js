const ScratchRender = require('../RenderWebGL');
const canvas = document.getElementById('scratch-stage');

const canvasSize = {width: 800, height: 600};
// canvas.style.width = `${canvasSize.width}px`;
// canvas.style.height = `${canvasSize.height}px`;
const pixelRatio = window.devicePixelRatio || 1;
const lineWidth = 1;

const cx = canvasSize.width / 2;
const cy = canvasSize.height / 2;
const gridSize = 24;
const coordinate = [-cx, cx, -cy, cy];
const xLineLen = Math.floor(cx / gridSize);
const yLineLen = Math.floor(cy / gridSize);
const linesCoordinate = [];
for (let x = 0; x < xLineLen; x++) {
    // const ox = x * gridSize;
    if (x === 0) {
        linesCoordinate.push([-cx, 0, cx, 0]);
    } else {
        // const ox = x * gridSize;
        // linesCoordinate.push([-cx, ox, cx, ox]);
        // linesCoordinate.push([-cx, -ox, cx, -ox]);
    }
}
for (let y = 0; y < yLineLen; y++) {
    if (y === 0) {
        linesCoordinate.push([0, -cy, 0, cy]);
    } else {
        // const oy = y * gridSize;
        // linesCoordinate.push([0, -cy + oy, 0, cy + oy]);
        // linesCoordinate.push([0, -cy - oy, 0, cy + -oy]);
    }
}

const renderer = new ScratchRender(canvas, ...coordinate);
renderer.setLayerGroupOrdering(['a1']);

const drawableId = renderer.createDrawable('a1');
const skinId = renderer.createPenSkin();
console.log({drawableId, skinId});
renderer.updateDrawableSkinId(drawableId, skinId);
renderer.penPoint(skinId, {color4f: [255, 0, 0, 0.5], diameter: 16}, 0, 0, 0, 0);
renderer.penPoint(skinId, {color4f: [0, 0, 0, 0.5], diameter: 12}, 0, 0, 0, 0);

// for (let index = 0; index < linesCoordinate.length; index++) {
//     const coor = linesCoordinate[index];
//     const attrs = {
//         color4f: [0, 0, 0, 0.8],
//         diameter: lineWidth / pixelRatio
//     };
//     renderer.penLine(skinId, attrs, ...coor);
// }
