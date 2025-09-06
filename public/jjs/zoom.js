let zoomInterval = null;
const zoomSpeed = 1.02;
const zoomDelay = 20;

function zoomStageAtCenter(stage, scaleFactor) {
    const oldScale = stage.scaleX();
    const pointer = {
        x: stage.width() / 2,
        y: stage.height() / 2
    };

    const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale
    };

    const newScale = oldScale * scaleFactor;

    stage.scale({ x: newScale, y: newScale });
    stage.position({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale
    });

    stage.batchDraw();
}

function startZoom(stage, scaleFactor) {
    if (zoomInterval) clearInterval(zoomInterval);
    zoomInterval = setInterval(() => {
        zoomStageAtCenter(stage, scaleFactor);
    }, zoomDelay);
}

function stopZoom() {
    if (zoomInterval) clearInterval(zoomInterval);
    zoomInterval = null;
}

export function setZoomControls(stage) {
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');

    // zoom in
    zoomInBtn.addEventListener('pointerdown', () => startZoom(stage, zoomSpeed));
    zoomInBtn.addEventListener('pointerup', stopZoom);
    zoomInBtn.addEventListener('pointerleave', stopZoom);

    // ctrl + +
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
            e.preventDefault();
            zoomStageAtCenter(stage, zoomSpeed);
        }
    });

    // zoom out
    zoomOutBtn.addEventListener('pointerdown', () => startZoom(stage, 1 / zoomSpeed));
    zoomOutBtn.addEventListener('pointerup', stopZoom);
    zoomOutBtn.addEventListener('pointerleave', stopZoom);

    // ctrl + -
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === '-') {
            e.preventDefault();
            zoomStageAtCenter(stage, 1 / zoomSpeed);
        }
    });
}