import { centerStage } from "../utils/stageUtils.js";

export function createButtonEvents(stage) {
    const centerCanvasBtn = document.getElementById('centerCanvas');
    const centerCanvasMinBtn = document.getElementById('centerCanvasMin');
    const saveCanvasBtn = document.getElementById('saveCanvas');
    const saveCanvasMinBtn = document.getElementById('saveCanvasMin');
    const strokeSizeSpan = document.getElementById('strokeSize');

    // zoom functionality is handled in zoom.js

    if (centerCanvasBtn) centerCanvasBtn.addEventListener('click', () => centerStage(stage));
    if (centerCanvasMinBtn) centerCanvasMinBtn.addEventListener('click', () => centerStage(stage, true));

    // if (saveCanvasBtn) saveCanvasBtn.addEventListener('click', () => );
    // if (saveCanvasMinBtn) saveCanvasMinBtn.addEventListener('click', () => );

    // document.getElementById('decreaseStrokeSize').addEventListener('click', () => {
    // });

    // document.getElementById('increaseStrokeSize').addEventListener('click', () => {

    // });
}