import { saveStagePositionAndScale } from '../zoom.js';

export function centerStage(stage) {
    stage.position({
        x: stage.width() / 2,
        y: stage.height() / 2,
    });
    saveStagePositionAndScale(stage);
}

export function centerStageOffset(stage, pageWidth, pageHeight) {
    stage.offset({
        x: pageWidth / 2,
        y: pageHeight / 2,
    });
    saveStagePositionAndScale(stage);
}