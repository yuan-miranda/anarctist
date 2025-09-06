export function centerStage(stage) {
    console.log('Centering stage'); 
    stage.position({
        x: stage.width() / 2,
        y: stage.height() / 2,
    });
}

export function centerStageOffset(stage, pageWidth, pageHeight) {
    stage.offset({
        x: pageWidth / 2,
        y: pageHeight / 2,
    });
}