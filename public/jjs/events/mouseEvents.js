import { getPointerPos, createKonvaLine } from "../utils/drawingUtils.js";
import { setDrawing, getDrawing, setCurrentLine, getCurrentLine, endDrawing } from "../utils/drawingState.js";

export function createMouseEvents(stage, layer, pageGroup, getStrokeSize, previewCircle) {
    stage.on('mousedown', (e) => {
        const pos = getPointerPos(stage);
        if (!pos) return;

        if (e.evt.button === 0) {
            setDrawing(true);
            const line = createKonvaLine(pos, 'black', getStrokeSize());
            setCurrentLine(line);
            pageGroup.add(line);
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

        if (getDrawing() && getCurrentLine()) {
            getCurrentLine().points(getCurrentLine().points().concat([pos.x, pos.y]));
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