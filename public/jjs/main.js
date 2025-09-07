import { createKursor } from "./utils/cursorUtils.js";
import { createStage } from "./stage.js";
import { setStrokeControls } from "./stroke.js";
import { setZoomControls } from "./zoom.js";
import { resetIdleTimer } from "./utils/timer.js";
import { createMouseEvents } from "./events/mouseEvents.js";
import { createTouchEvents } from "./events/touchEvents.js";

import { loadStrokesFromLocalStorage } from "./utils/drawingUtils.js";

createKursor();
const { stage, drawLayer, pageGroup } = createStage();
const { previewCircle } = setStrokeControls(drawLayer);

loadStrokesFromLocalStorage(pageGroup, drawLayer);

setZoomControls(stage);
createMouseEvents(stage, drawLayer, pageGroup, previewCircle);
createTouchEvents(stage, drawLayer, pageGroup, previewCircle);

// idle timer
resetIdleTimer();
['mousemove', 'mousedown', 'keydown', 'touchstart', 'touchmove'].forEach(e => {
    window.addEventListener(e, resetIdleTimer, { passive: true });
});

// prevent context menu on right click
document.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('resize', () => {
    stage.width(window.innerWidth);
    stage.height(window.innerHeight);
    stage.batchDraw();
});