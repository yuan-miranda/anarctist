export function compressPath(pointsArr) {
    const pairs = [];
    for (let i = 0; i < pointsArr.length; i += 2) {
        pairs.push(`${pointsArr[i]},${pointsArr[i + 1]}`);
    }
    return pairs.join(';');
}

export function decompressPath(pathStr) {
    return pathStr
        .split(';')
        .flatMap(pair => pair.split(',').map(Number));
}

export function getPointerPos(stage, round = false) {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = transform.point(stage.getPointerPosition());
    return {
        x: round ? Math.round(pos.x) : pos.x,
        y: round ? Math.round(pos.y) : pos.y
    }
}

export function saveStrokesToLocalStorage(pageGroup) {
    if (!pageGroup) return;
    const strokes = [];

    pageGroup.getChildren().forEach((line) => {
        if (line.className !== 'Line') return;
        strokes.push({
            points: compressPath(line.points()),
            stroke: line.stroke(),
            strokeWidth: line.strokeWidth(),
            lineCap: line.lineCap(),
            lineJoin: line.lineJoin(),
        });
    });

    localStorage.setItem('strokes', JSON.stringify(strokes));
    console.log('Strokes saved:', strokes.length);
}

export function pushStrokeToLocalStorage(line) {
    if (line.className !== 'Line') return;
    const savedStrokes = JSON.parse(localStorage.getItem('strokes') || '[]');
    savedStrokes.push({
        points: compressPath(line.points()),
        stroke: line.stroke(),
        strokeWidth: line.strokeWidth(),
        lineCap: line.lineCap(),
        lineJoin: line.lineJoin(),
    });
    localStorage.setItem('strokes', JSON.stringify(savedStrokes));
    console.log('Stroke pushed. Total strokes:', savedStrokes.length);
}

export function loadStrokesFromLocalStorage(pageGroup, drawLayer) {
    const saved = localStorage.getItem('strokes');
    if (!saved) return;

    const strokes = JSON.parse(saved);
    strokes.forEach((s) => {
        const line = new Konva.Line({
            points: decompressPath(s.points),
            stroke: s.stroke,
            strokeWidth: s.strokeWidth,
            lineCap: s.lineCap,
            lineJoin: s.lineJoin,
            globalCompositeOperation: 'source-over',
        });
        pageGroup.add(line);
    });

    drawLayer.batchDraw();
    console.log('Strokes loaded:', strokes.length);
}