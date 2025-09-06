import { createKursor } from "./utils/cursorUtils.js";
import { createStage } from "./stage.js";
import { setStrokeSize } from "./stroke.js";
import { setZoomControls } from "./zoom.js";
import { createMouseEvents, createTouchEvents } from "./drawing.js";
createKursor();
const { stage, layer, pageGroup } = createStage();
const { getStrokeSize, previewCircle } = setStrokeSize(layer);
setZoomControls(stage);

createMouseEvents(stage, layer, pageGroup, getStrokeSize, previewCircle);
createTouchEvents(stage, layer, pageGroup, getStrokeSize, previewCircle);

window.addEventListener('resize', () => {
    stage.width(window.innerWidth);
    stage.height(window.innerHeight);
    stage.batchDraw();
});