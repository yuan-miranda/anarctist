// public/js/main.js
import { createStage } from "./stage.js";
import { setStrokeControls } from "./stroke.js";
import { setZoomControls } from "./zoom.js";
import { resetIdleTimer } from "./utils/timer.js";
import { createMouseEvents } from "./events/mouseEvents.js";
import { createTouchEvents } from "./events/touchEvents.js";
import { getDrawingState } from "./utils/drawingState.js";

import { loadStrokesFromDB, pruneOffscreenStrokes } from "./utils/drawingUtils.js";

const loadingOverlay = document.getElementById('loadingOverlay');

const { stage, drawLayer, pageGroup } = createStage();
const { previewCircle } = setStrokeControls(drawLayer);

await loadStrokesFromDB(stage, pageGroup);
pruneOffscreenStrokes(stage, pageGroup);
if (loadingOverlay) loadingOverlay.style.display = 'none';

// auto fetch new strokes every second
setInterval(async () => {
    if (!getDrawingState()) {
        await loadStrokesFromDB(stage, pageGroup);
        pruneOffscreenStrokes(stage, pageGroup);
    }
}, 1000)

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
});