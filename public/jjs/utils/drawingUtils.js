// public/jjs/utils/drawingUtils.js
export function compressPoints(pointsArr) {
    // [10,20,30,40] -> "10,20;30,40"
    const pairs = [];
    for (let i = 0; i < pointsArr.length; i += 2) {
        pairs.push(`${pointsArr[i]},${pointsArr[i + 1]}`);
    }
    return pairs.join(';');
}

export function decompressPoints(pointStr) {
    // "10,20;30,40" -> [10,20,30,40]
    return pointStr
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

export async function saveStrokesToDB(line) {
    if (line.className !== 'Line') return;

    const strokeData = {
        points: compressPoints(line.points()),
        stroke: line.stroke(),
        strokeWidth: line.strokeWidth(),
    };

    try {
        const response = await fetch('/api/save_stroke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(strokeData),
        });
        const data = await response.json();

        if (response.status === 429) return alert('You are being rate limited. Please wait a moment before drawing again.');
        if (!response.ok) return console.error(data.error);
    } catch (e) {
        console.error(e);
    }
}

export async function loadStrokesFromDB(pageGroup, drawLayer, { useCache = true, startAt = 0 } = {}) {
    try {
        const cachedLastStrokeId = parseInt(localStorage.getItem('lastStrokeId'), 10) || 0;
        const effectiveStartAt = useCache ? startAt : 0;

        const params = new URLSearchParams({ startAt: effectiveStartAt });
        const response = await fetch(`/api/load_strokes?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
            console.error(data.error);
            return useCache ? cachedLastStrokeId : 0;
        }

        // strokes fetched
        const newStrokes = (data.strokes || []).map(stroke => ({
            ...stroke,
            points: decompressPoints(stroke.points),
        }));

        const lastStrokeId = newStrokes.length > 0 ? newStrokes[newStrokes.length - 1].id : (useCache ? cachedLastStrokeId : 0);
        localStorage.setItem('lastStrokeId', lastStrokeId);

        // then draw them
        newStrokes.forEach((s) => {
            const line = new Konva.Line({
                points: s.points,
                stroke: s.stroke,
                strokeWidth: s.strokeWidth,
                lineCap: 'round',
                lineJoin: 'round',
                globalCompositeOperation: 'source-over',
            });
            pageGroup.add(line);
        });

        return lastStrokeId;
    } catch (e) {
        console.error(e);
        return useCache ? startAt : 0;
    }
}