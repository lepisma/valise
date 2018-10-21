var TEXTFONT = 'Open Sans';
var DIVSELECTOR = '#commit-plot';
var MARGIN = { 'top' : 50,
               'bottom' : 10,
               'left' : 10,
               'right' : 10
             };
function formatWeekId(weekDict) {
    return weekDict.year + '-' + String(weekDict.week).padStart(2, '0');
};
/** Get week id using the global variable event-plot-for */
function getWeekId(offset) {
    return formatWeekId({ 'week' : offset + eventPlotFor.week, 'year' : eventPlotFor.year });
};
/** Return one sided diffs of the items. */
function getDiffs(items) {
    return items.length < 2 ? [] : (function () {
        var _js3 = items.length - 2;
        var collect4 = [];
        for (var i = 0; i <= _js3; i += 1) {
            collect4.push(items[i + 1] - items[i]);
        };
        return collect4;
    })().sort(function (a, b) {
        return a > b;
    });
};
/** Process events data to get diffs in seconds. */
function processEventsData(data, offset) {
    var weekId = getWeekId(offset);
    return getDiffs(data.filter(function (d) {
        return d.week === weekId;
    }).map(function (d) {
        return parseInt(d.timestamp);
    }));
};
/** Get bounding box from a d3 selection. */
function getBbox(selection) {
    return selection.node().getBoundingClientRect();
};
/** Group diffs into bins and create plottable histogram-ish data. */
function makeHistogramData(diffs) {
    var normed = diffs.map(function (d) {
        return Math.floor(Math.log(d));
    });
    var output = Array(14).fill(0);
    normed.forEach(function (d) {
        return output[d] += 1;
    });
    return output.map(function (d, idx) {
        return { 'x' : idx, 'y' : d };
    });
};
/** Add intensity gradient definition to the svg. */
function addGradient(svg) {
    var grad = svg.append('defs').append('linearGradient');
    grad.attr('id', 'main-gradient').attr('x1', '0%').attr('x2', '100%').attr('y1', '0%').attr('y2', '0%');
    grad.append('stop').attr('offset', '0%').attr('style', 'stop-color:#00151c');
    return grad.append('stop').attr('offset', '100%').attr('style', 'stop-color:#fff');
};
/** Add total commit counts as two */
function addTotalCount(grp, width, yScale, data) {
    var total = data.reduce(function (acc, d) {
        return acc + d.y;
    }, 0);
    var countLine = grp.append('text');
    countLine.attr('transform', 'translate(' + (width - 100) + ',' + yScale(4) + ')').attr('stroke', 'none').attr('fill', 'gray');
    countLine.text(total).style('font-size', '20px');
    return grp.append('text').attr('transform', 'translate(' + (width - 100) + ',' + yScale(1) + ')').text('COMMITS').style('font-size', '12px').attr('fill', 'gray');
};
/** Create top level svg and assign proper height width to it. */
function makeTopSvg() {
    var svg = d3.select(DIVSELECTOR).append('svg');
    var svgBbox = getBbox(svg);
    svg.attr('height', svgBbox.height).attr('width', svgBbox.width);
    return svg;
};
/** Add time checkpoint line. */
function addVerticalLine(grp, xPos, text, height) {
    grp.append('line').attr('x1', xPos).attr('x2', xPos).attr('y1', 0).attr('y2', height).attr('stroke', 'rgba(0, 0, 0, 0.2)').attr('stroke-dasharray', '10 10');
    var textElem = grp.append('text').text(text).attr('transform', 'translate(' + (15 + xPos) + ', 10) rotate(-90)');
    return textElem.style('fill', '#333').style('font-size', '12px').style('text-anchor', 'end');
};
window.addEventListener('DOMContentLoaded', function () {
    var svg = makeTopSvg();
    var svgBbox = getBbox(svg);
    var height5 = svgBbox.height;
    var width6 = svgBbox.width;
    var drawHeight = height5 - MARGIN.top - MARGIN.bottom;
    var drawWidth = width6 - MARGIN.left - MARGIN.right;
    var grp = svg.append('g').attr('transform', 'translate(' + MARGIN.left + ',' + MARGIN.top + ')').style('font-family', TEXTFONT);
    var xScale = d3.scaleLinear().range([0, drawWidth]);
    return d3.csv('../assets/commit-events.csv').then(function (data) {
        addGradient(svg);
        var histData = makeHistogramData(processEventsData(data, 0));
        xScale.domain([0, histData.length]);
        var _js9 = [10, 60, 600, 3600, 24 * 3600];
        var _js11 = _js9.length;
        var _js12 = ['10 SEC', '1 MIN', '10 MINS', '1 HOUR', '1 DAY'];
        var _js14 = _js12.length;
        var FIRST15 = true;
        for (var _js10 = 0; _js10 < _js11; _js10 += 1) {
            var val = _js9[_js10];
            var _js13 = FIRST15 ? 0 : _js13 + 1;
            if (_js13 >= _js14) {
                break;
            };
            var txt = _js12[_js13];
            addVerticalLine(grp.append('g'), xScale(Math.log(val)), txt, drawHeight);
            FIRST15 = null;
        };
        var offsets = [-4, -3, -2, -1, 0];
        var yGrain = drawHeight / offsets.length;
        var area;
        var _js8 = offsets.length;
        for (var _js7 = 0; _js7 < _js8; _js7 += 1) {
            var offset = offsets[_js7];
            histData = makeHistogramData(processEventsData(data, offset));
            var yZero = drawHeight + offset * yGrain;
            var yScale = d3.scaleLinear().range([yZero, yZero - yGrain - 200]).domain([0, 50]);
            area = d3.area().x(function (d) {
                return xScale(d.x);
            }).y0(yScale(0)).y1(function (d) {
                return yScale(d.y);
            });
            grp.append('path').datum(histData).attr('d', area).attr('fill', 'url(#main-gradient) rgba(0, 0, 0, 0.1)').attr('opacity', Math.max(0.2, 1 + offset * 0.3));
            addTotalCount(grp, drawWidth, yScale, histData);
        };
    });
});
