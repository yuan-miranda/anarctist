import { getPointerPos, createKonvaLine } from "../utils/drawingUtils.js";
import { setDrawingState, getDrawingState, setCurrentLine, getCurrentLine, endDrawing } from "../utils/drawingState.js";
import { saveStagePositionAndScale } from "../zoom.js";

export function createMouseEvents(stage, drawLayer, pageGroup, getStrokeSize, previewCircle) {
    stage.on('mousedown', (e) => {
        const pos = getPointerPos(stage);
        if (!pos) return;

        if (e.evt.button === 0) {
            setDrawingState(true);
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

        if (getDrawingState() && getCurrentLine()) {
            getCurrentLine().points(getCurrentLine().points().concat([pos.x, pos.y]));
        }

        drawLayer.batchDraw();
    });

    stage.on('mouseup', (e) => {
        if (e.evt.button === 0) endDrawing();
        else if (e.evt.button === 2) {
            stage.draggable(false);
            saveStagePositionAndScale(stage);
        }
    });

    stage.on('mouseleave', () => { previewCircle.visible(false); endDrawing(); });
    window.addEventListener('blur', endDrawing);
}