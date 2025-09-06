import { getPointerPos } from "./utils/stageUtils.js";

let isDrawing = false;
let currentLine = null;

let isTwoFingerPanning = false;
let lastCenter = null;

function getCenter(t1, t2) {
    return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
    };
}

const endDrawing = () => {
    isDrawing = false;
    currentLine = null;
};

function createKonvaLine(pos, color, strokeWidth) {
    return new Konva.Line({
        stroke: color,
        strokeWidth: strokeWidth,
        globalCompositeOperation: 'source-over',
        points: [pos.x, pos.y, pos.x, pos.y],
        lineCap: 'round',
        lineJoin: 'round',
    });
}

export function createMouseEvents(stage, layer, pageGroup, getStrokeSize, previewCircle) {
    stage.container().addEventListener('contextmenu', e => e.preventDefault());

    stage.on('mousedown', (e) => {
        const pos = getPointerPos(stage);
        if (!pos) return;

        if (e.evt.button === 0) {
            isDrawing = true;
            currentLine = createKonvaLine(pos, 'black', getStrokeSize());
            pageGroup.add(currentLine);
        } else if (e.evt.button === 2) {
            stage.draggable(true);
            stage.startDrag();
        }
    });

    stage.on('mousemove', () => {
        const pos = getPointerPos(stage);
        if (!pos) return;

        previewCircle.position(pos);
        previewCircle.visible(true);

        if (isDrawing && currentLine) {
            currentLine.points(currentLine.points().concat([pos.x, pos.y]));
        }

        layer.batchDraw();
    });

    stage.on('mouseup', (e) => {
        if (e.evt.button === 0) endDrawing();
        else if (e.evt.button === 2) stage.draggable(false);
    });

    stage.on('mouseleave', () => { previewCircle.visible(false); endDrawing(); });
    window.addEventListener('blur', endDrawing);
}

export function createTouchEvents(stage, layer, pageGroup, getStrokeSize, previewCircle) {
    // single-finger drawing
    stage.on('touchstart', (e) => {
        if (e.evt.touches.length > 1) return;

        const pos = getPointerPos(stage);
        if (!pos) return;

        isDrawing = true;
        currentLine = createKonvaLine(pos, 'black', getStrokeSize());
        pageGroup.add(currentLine);
    });

    stage.on('touchmove', () => {
        const pos = getPointerPos(stage);
        if (!pos) return;

        previewCircle.position(pos);
        previewCircle.visible(true);

        if (isDrawing && currentLine) {
            currentLine.points(currentLine.points().concat([pos.x, pos.y]));
        }

        layer.batchDraw();
    });

    stage.on('touchend', (e) => {
        if (e.evt.type === 'touchend') endDrawing();
    });

    stage.on('touchcancel', endDrawing);

    // two-finger panning
    stage.getContent().addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            isTwoFingerPanning = true;
            lastCenter = getCenter(e.touches[0], e.touches[1]);

            // remove current drawing if second finger touches
            if (isDrawing && currentLine) {
                currentLine.destroy();
                currentLine = null;
            }
            isDrawing = false;
        }
    }, { passive: false });

    stage.getContent().addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && isTwoFingerPanning) {
            e.preventDefault();

            const center = getCenter(e.touches[0], e.touches[1]);
            const dx = center.x - lastCenter.x;
            const dy = center.y - lastCenter.y;

            stage.position({
                x: stage.x() + dx,
                y: stage.y() + dy
            });

            stage.batchDraw();
            lastCenter = center;
        }
    }, { passive: false });

    stage.getContent().addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            isTwoFingerPanning = false;
            lastCenter = null;
        }
    });
}