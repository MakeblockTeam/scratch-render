const {fabric} = require('fabric-pure-browser');
const axisArrow = require('../guideline/axis/arrow');

const initCoordinateAxis = canvas => {
    const objs = [];
    const {width, height} = canvas;

    const origin = {x: width / 2, y: height / 2};

    const createText = (str, attr) => {
        const text = new fabric.Text(
            str,
            Object.assign(
                {
                    fontSize: 12,
                    left: 6,
                    top: 3,
                    fill: '#fff',
                    shadow: '0 0 1px #000',
                    hasControls: false,
                    selectable: false
                },
                attr
            )
        );
        return text;
    };

    const createCircle = () => {
        const circle = new fabric.Circle({
            radius: 8,
            fill: 'rgba(0, 0, 0, .5)',
            left: 0,
            top: 0,
            originX: 'center',
            originY: 'center'
        });
        return circle;
    };

    const createLine = (points, attrs) => {
        const line = new fabric.Line(
            points,
            Object.assign(
                {
                    strokeWidth: 1,
                    stroke: 'rgba(255, 0 ,0, 1)',
                    originX: 'center',
                    originY: 'center',
                },
                attrs
            )
        );
        return line;
    };

    // 坐标轴原点
    const originCircle = createCircle();
    objs.push(originCircle);
    // The text of the coordinate origin display
    const cText = createText('0');
    objs.push(cText);

    // 坐标轴
    // X 轴线段坐标点
    const originLeftXPoints = [0, 0, -origin.x, 0];
    const originRightXPoints = [0, 0, origin.x, 0];
    // Y 轴线段坐标点
    const originUpYPoints = [0, 0, 0, origin.y];
    const originBottomYPoints = [0, 0, 0, -origin.y];

    const xLeftLine = createLine(originLeftXPoints);
    objs.push(xLeftLine);
    const xRightLine = createLine(originRightXPoints);
    objs.push(xRightLine);

    const yUpLine = createLine(originUpYPoints);
    objs.push(yUpLine);
    const yBottomLine = createLine(originBottomYPoints);
    objs.push(yBottomLine);


    // Text is displayed at the end of the X-axis
    const xText = createText('X');
    objs.push(xText);

    // Text is displayed at the top of the Y-axis
    const yText = createText('Y');
    objs.push(yText);

    const arrows = axisArrow(origin);
    arrows.forEach((arrow, key) => {
        arrow = new Proxy(arrow, {
            get (obj, prop) {
                return obj[prop];
            },
            set (obj, prop, value) {
                // if (prop === 'fill') {
                // console.log([value, obj.prop, obj]);
                // canvas.renderTop();
                // canvas.requestRenderAll();
                // }
                obj[prop] = value;
                return obj;
            }
        });
        arrows.set(key, arrow);
        objs.push(arrow);
    });
    window.AxisArrow = arrows;

    const doAnimate = (line, duration = 1000) => {
        const { x2, y2 } = line;
        line.x2 = line.x1;
        line.y2 = line.y1;
        line.animate(
            { x2, y2 },
            {
                onChange: canvas.renderAll.bind(canvas),
                onComplete: () => {
                    line.setCoords();
                },
                duration,
            }
        );
    };

    const animate = () => {
        doAnimate(xLeftLine);
        doAnimate(xRightLine);
        doAnimate(yUpLine);
        doAnimate(yBottomLine);
    };

    const group = new fabric.Group(objs, {
        hasBorders: false,
        selectable: false
    });
    canvas.add(group);

    // const xEle = document.querySelector('#pointX');
    // const yEle = document.querySelector('#pointY');
    // const showCoordinate = (x, y) => {
    //     xEle.innerHTM L = x;
    //     yEle.innerHTML = y;
    // };
    // canvas.on('mouse:move', options => {
    //     const {x, y} = options.absolutePointer;
    //     console.log(x, y);
    // var pointer = canvas.getPointer();
    // const ce = fabric.util.transformPoint({x, y}, fabric.util.invertTransform(rcanvas.viewportTransform));
    // showCoordinate(Math.round(x), Math.round(y));
    // });

    window.ca = canvas;
    window.CoordinateAxis = animate;
};

// class CoordinateAxis {
//     show() {}
//     hide() {}
//     set() {}
// }

module.exports = initCoordinateAxis;

// canvas.sendBackwards(myObject)
// canvas.sendToBack(myObject)
// canvas.bringForward(myObject)
// canvas.bringToFront(myObject)
