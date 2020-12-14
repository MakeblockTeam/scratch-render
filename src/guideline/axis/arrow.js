// 箭头
const {fabric} = require('fabric-pure-browser');

module.exports = function (origin) {
    const arrows = new Map();
    const arrowSize = 10;
    const arrowHeight = arrowSize / 2;
    const arrowOffset = 1;

    const leftArrowPoints = [
        {x: -origin.x - arrowOffset, y: 0},
        {x: -origin.x + arrowSize, y: arrowHeight},
        {x: -origin.x + arrowSize, y: -arrowHeight}
    ];
    const leftArrow = new fabric.Polygon(leftArrowPoints, {
        fill: 'rgba(0, 0, 0, 1)'
    });
    arrows.set('left', leftArrow);

    const rightArrowPoints = [
        {x: origin.x + arrowOffset, y: 0},
        {x: origin.x - arrowSize, y: arrowHeight},
        // {x: origin.x - arrowSize, y: 0},
        {x: origin.x - arrowSize, y: -arrowHeight}
    ];
    const rightArrow = new fabric.Polygon(rightArrowPoints, {
        fill: 'rgba(0, 0, 0, 1)',
        originX: 'center'
    });
    arrows.set('right', rightArrow);

    const boArrowPoints = [
        {x: 0, y: origin.y + arrowOffset},
        {x: arrowHeight, y: origin.y - arrowSize},
        {x: -arrowHeight, y: origin.y - arrowSize}
    ];
    const boArrow = new fabric.Polygon(boArrowPoints, {
        fill: 'rgba(0, 0, 0, 1)'
    });
    arrows.set('bottom', boArrow);

    const upArrowPoints = [
        {x: 0, y: -origin.y - arrowOffset},
        {x: arrowHeight, y: -origin.y + arrowSize},
        {x: -arrowHeight, y: -origin.y + arrowSize}
    ];
    const upArrow = new fabric.Polygon(upArrowPoints, {
        fill: 'rgba(0, 0, 0, 1)'
    });
    arrows.set('up', upArrow);
    return arrows;
};
