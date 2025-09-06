import { getPointerPos, createKonvaLine } from "../utils/drawingUtils.js";
import { setDrawing, getDrawing, setCurrentLine, getCurrentLine, endDrawing } from "../utils/drawingState.js";

let isTwoFingerPanning = false;
let lastCenter = null;

function getCenter(t1, t2) {
    return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
    };
}

export function createTouchEvents(stage, layer, pageGroup, getStrokeSize, previewCircle) {
    // single-finger drawing
    stage.on('touchstart', (e) => {
        if (e.evt.touches.length > 1) return;

        const pos = getPointerPos(stage);
        if (!pos) return;

        setDrawing(true);
        const line = createKonvaLine(pos, 'black', getStrokeSize());
        setCurrentLine(line);
        pageGroup.add(line);
    });

    stage.on('touchmove', () => {
        const pos = getPointerPos(stage);
        if (!pos) return;

        previewCircle.position(pos);
        previewCircle.visible(true);

        if (getDrawing() && getCurrentLine()) {
            getCurrentLine().points(getCurrentLine().points().concat([pos.x, pos.y]));
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
            if (getDrawing() && getCurrentLine()) {
                getCurrentLine().destroy();
                setCurrentLine(null);
            }
            setDrawing(false);
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