const ScratchRender = require('../RenderWebGL');
const canvas = document.getElementById('scratch-stage');
const {fabric} = require('fabric-pure-browser');

const canvasSize = {width: 400, height: 600};
// canvas.style.width = `${canvasSize.width}px`;
// canvas.style.height = `${canvasSize.height}px`;
const pixelRatio = window.devicePixelRatio || 1;
const lineWidth = 1 / pixelRatio;
const lineOffset = pixelRatio > 1 ? 0 : -lineWidth / 2;
const cx = canvasSize.width / 2;
const cy = canvasSize.height / 2;
const stepSize = 16;
const tickMarkWidth = 5;
const coordinate = [-cx, cx, -cy, cy];
const xLineLen = Math.round(cy / stepSize);
const yLineLen = Math.round(cx / stepSize);
const linesCoordinate = [];
// X 轴
linesCoordinate.push([-cx - lineOffset, 0, cx - lineOffset, 0]);
// Y 轴
linesCoordinate.push([0, -cy - lineOffset, 0, cy - lineOffset]);

for (let x = 1; x < xLineLen; x++) {
    const ox = x * stepSize;
    linesCoordinate.push([0, ox, tickMarkWidth, ox]);
    linesCoordinate.push([0, -ox, tickMarkWidth, -ox]);
}
for (let y = 1; y < yLineLen; y++) {
    const oy = y * stepSize;
    linesCoordinate.push([oy, 0, oy, -tickMarkWidth]);
    linesCoordinate.push([-oy, 0, -oy, -tickMarkWidth]);
}

const renderer = new ScratchRender(canvas, ...coordinate);
renderer.setLayerGroupOrdering(['a1']);

const drawableId = renderer.createDrawable('a1');
const skinId = renderer.createPenSkin();

renderer.updateDrawableSkinId(drawableId, skinId);

// renderer.penPoint(skinId, {color4f: [255, 0, 0, 0.5], diameter: 32}, 0, 0);
// 坐标原点
// renderer.penPoint(skinId, {color4f: [0, 0, 0, 0.5], diameter: 5}, 0, 0);
// // renderer.penLine(skinId, attrs, ...coor);
// const lines = [];
// for (let index = 0; index < linesCoordinate.length; index++) {
//     const coor = linesCoordinate[index];
//     // coor.forEach(v => v - lineOffset);
//     const attrs = {
//         color4f: [255, 0, 0, 1],
//         diameter: lineWidth
//     };
//     if (index > 1) {
//         attrs.color4f = [0, 0, 0, 0.5];
//     }
//     lines.push(renderer.penLine(skinId, attrs, ...coor));
// }

// const xLineAnimate = lines[0];
// const yLineAnimate = lines[1];
// xLineAnimate(1000);
// yLineAnimate(1200);

// const xEle = document.querySelector('#pointX');
// const yEle = document.querySelector('#pointY');
// const showCoordinate = (x, y) => {
//     xEle.innerHTML = x;
//     yEle.innerHTML = y;
// };
// const centerText = new fabric.Text('0', {
//     fontSize: 12,
//     left: 6,
//     top: 3,
//     fill: '#fff',
//     shadow: '0 0 1px #000',
//     hasControls: false,
//     selectable: false
// });

// const xText = new fabric.Text('X', {
//     fontSize: 12,
//     top: 3,
//     left: cx - 12,
//     fill: '#fff',
//     shadow: '0 0 1px #000',
//     hasControls: false,
//     selectable: false
// });

// const yText = new fabric.Text('Y', {
//     fontSize: 12,
//     top: -cy,
//     left: 3,
//     fill: '#fff',
//     shadow: '0 0 1px #000',
//     hasControls: false,
//     selectable: false
// });

// const rcanvas = renderer.canvas;
// rcanvas.add(centerText);
// rcanvas.add(xText);
// rcanvas.add(yText);

// rcanvas.on('mouse:down', options => {
//     const {x, y} = options.absolutePointer;
//     // var pointer = canvas.getPointer();
//     // const ce = fabric.util.transformPoint({x, y}, fabric.util.invertTransform(rcanvas.viewportTransform));
//     console.log(options);
//     showCoordinate(Math.round(x), Math.round(y));
// });

// const myCenterCoordinates = fabric.util.transformPoint({
//     x: rcanvas.width / 2,
//     y: rcanvas.height / 2
// }, fabric.util.invertTransform(rcanvas.viewportTransform));

// console.log([myCenterCoordinates, fabric.util.invertTransform(rcanvas.viewportTransform)]);
