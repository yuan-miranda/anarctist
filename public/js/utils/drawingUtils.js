// public/js/utils/drawingUtils.js
import { PAGE_WIDTH } from '../stage.js';
import { PAGE_HEIGHT } from '../stage.js';

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

function getViewportBoundingBox(stage) {
    const scale = stage.scaleX();
    const x = -stage.x() / scale;
    const y = -stage.y() / scale;
    const width = stage.width() / scale;
    const height = stage.height() / scale;

    const offsetX = PAGE_WIDTH / 2;
    const offsetY = PAGE_HEIGHT / 2;

    return {
        x: x + offsetX,
        y: y + offsetY,
        width,
        height
    };
}

function getStrokeBoundingBox(stroke) {
    const points = stroke.points();
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < points.length; i += 2)  {
        const x = points[i];
        const y = points[i + 1];
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    }
    return { minX, minY, maxX, maxY };
}

function isStrokeInViewport(strokeBox, viewport, padding) {
    return !(
        strokeBox.maxX < viewport.x - padding ||
        strokeBox.minX > viewport.x + viewport.width + padding ||
        strokeBox.maxY < viewport.y - padding ||
        strokeBox.minY > viewport.y + viewport.height + padding
    )
}

export async function loadStrokesFromDB(stage, pageGroup) {
    try {
        const viewport = getViewportBoundingBox(stage);
        const loadPadding = 500;
        const keepPadding = 300;

        const params = new URLSearchParams({
            minX: viewport.x - loadPadding,
            minY: viewport.y - loadPadding,
            maxX: viewport.x + viewport.width + loadPadding,
            maxY: viewport.y + viewport.height + loadPadding,
        });

        const response = await fetch(`/api/load_strokes?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
            console.error(data.error);
            return 0;
        }

        const existingIds = new Set(
            pageGroup.getChildren()
                .filter(c => c.className === 'Line')
                .map(c => parseInt(c.id()))
        );

        const newStrokes = (data.strokes || [])
            .filter(stroke => !existingIds.has(stroke.id))
            .map(stroke => ({
                ...stroke,
                points: decompressPoints(stroke.points),
            }));

        newStrokes.forEach((s) => {
            const line = new Konva.Line({
                id: s.id.toString(),
                points: s.points,
                stroke: s.stroke,
                strokeWidth: s.strokeWidth,
                lineCap: 'round',
                lineJoin: 'round',
                globalCompositeOperation: 'source-over',
            });
            pageGroup.add(line);
        });

        pageGroup.getChildren().forEach(line => {
            if (line.className !== 'Line') return;
            const strokeBox = getStrokeBoundingBox(line);
            if (!isStrokeInViewport(strokeBox, viewport, keepPadding)) {
                line.destroy();
            }
        });

        return newStrokes.length;
    } catch (e) {
        console.error(e);
        return 0;
    }
}
