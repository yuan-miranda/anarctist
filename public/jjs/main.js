import { createKursor } from "./utils/cursorUtils.js";
import { createStage } from "./stage.js";
import { setStrokeSize } from "./stroke.js";
import { setZoomControls } from "./zoom.js";
import { createButtonEvents } from "./events/buttonEvents.js";
import { createMouseEvents } from "./events/mouseEvents.js";
import { createTouchEvents } from "./events/touchEvents.js";

createKursor();
const { stage, drawLayer, pageGroup } = createStage();
const { getStrokeSize, previewCircle } = setStrokeSize(drawLayer);
setZoomControls(stage);

createMouseEvents(stage, drawLayer, pageGroup, getStrokeSize, previewCircle);
createTouchEvents(stage, drawLayer, pageGroup, getStrokeSize, previewCircle);
createButtonEvents(stage);

document.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('resize', () => {
    stage.width(window.innerWidth);
    stage.height(window.innerHeight);
    stage.batchDraw();
});