module.exports = function (svgData) {
    let _svgDom = null;

    let _svgTag = null;

    function _transformMeasurements() {
        const svgSpot = document.createElement('span');
        const tempTag = _svgTag.cloneNode(/* deep */ true);
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
            halfStrokeWidth = _findLargestStrokeWidth(_svgTag) / 2;
        }
        const width = bbox.width + (halfStrokeWidth * 2) || 1;
        const height = bbox.height + (halfStrokeWidth * 2) || 1;
        const x = bbox.x - halfStrokeWidth;
        const y = bbox.y - halfStrokeWidth;
        _svgTag.setAttribute('width', width);
        _svgTag.setAttribute('height', height);
        _svgTag.setAttribute('viewBox',
            `${x} ${y} ${width} ${height}`);
    }

    function _findLargestStrokeWidth(rootNode) {
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

    function _fixSvgString(svgString) {
        const svgAttrs = svgString.match(/<svg [^>]*>/);
        if (svgAttrs && svgAttrs[0].indexOf('xmlns=') === -1) {
            svgString = svgString.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
        }
        if (svgAttrs && svgAttrs[0].indexOf('&ns_') !== -1 && svgString.indexOf('<!DOCTYPE') === -1) {
            svgString = svgString.replace(svgAttrs[0],
                svgAttrs[0].replace(/&ns_[^;]+;/g, 'http://ns.adobe.com/Extensibility/1.0/'));
        }
        if (svgString.includes('data:img/png')) {
            svgString = svgString.replace(
                /(<image[^>]+?xlink:href=["'])data:img\/png/g,
                ($0, $1) => `${$1}data:image/png`
            );
        }
        if (svgString.match(/xmlns:(?!xml=)[^ ]+="http:\/\/www.w3.org\/XML\/1998\/namespace"/) !== null) {
            svgString = svgString.replace(
                /(xmlns:(?!xml=)[^ ]+)="http:\/\/www.w3.org\/XML\/1998\/namespace"/g,
                ($0, $1) => `${$1}="http://dummy.namespace"`
            );
        }
        svgString = svgString.replace(/<metadata>[\s\S]*<\/metadata>/, '<metadata></metadata>');
        svgString = svgString.replace(/<script[\s\S]*>[\s\S]*<\/script>/, '<script></script>');
        return svgString;
    }

    let svgString = _fixSvgString(svgData);
    const parser = new DOMParser();
    _svgDom = parser.parseFromString(svgString, 'text/xml');
    if (_svgDom.childNodes.length < 1 ||
        _svgDom.documentElement.localName !== 'svg') {
        throw new Error('Document does not appear to be SVG.');
    }
    _svgTag = _svgDom.documentElement;
    _transformMeasurements();
    const XMLS = new XMLSerializer();
    svgString = XMLS.serializeToString(_svgDom);
    return svgString;
}