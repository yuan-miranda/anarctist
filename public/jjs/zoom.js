import { centerStage } from './utils/stageUtils.js';

let zoomInterval = null;
const zoomSpeed = 1.02;
const zoomDelay = 20;

export function saveStagePositionAndScale(stage) {
    localStorage.setItem('stageScale', stage.scaleX());
    localStorage.setItem('stageX', stage.x());
    localStorage.setItem('stageY', stage.y());
}

function loadStagePositionAndScale(stage) {
    const scale = parseFloat(localStorage.getItem('stageScale')) || 1;
    const x = parseFloat(localStorage.getItem('stageX')) || 0;
    const y = parseFloat(localStorage.getItem('stageY')) || 0;

    stage.scale({ x: scale, y: scale });
    stage.position({ x, y });
}

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
    saveStagePositionAndScale(stage);
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
    const centerCanvasBtn = document.getElementById('centerCanvas');
    const centerCanvasMinBtn = document.getElementById('centerCanvasMin');

    loadStagePositionAndScale(stage);

    if (centerCanvasBtn) centerCanvasBtn.addEventListener('click', () => centerStage(stage));
    if (centerCanvasMinBtn) centerCanvasMinBtn.addEventListener('click', () => centerStage(stage, true));


    // zoom in
    zoomInBtn.addEventListener('pointerdown', () => startZoom(stage, zoomSpeed));
    zoomInBtn.addEventListener('pointerup', stopZoom);
    zoomInBtn.addEventListener('pointerleave', stopZoom);

    // ctrl + +
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && (e.key === '=')) {
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

    // ctrl + 0 to reset zoom but not position
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === '0') {
            e.preventDefault();
            stage.scale({ x: 1, y: 1 });
            // stage.position({ x: 0, y: 0 });
            stage.batchDraw();
            saveStagePositionAndScale(stage);
        }
    });

    window.addEventListener('blur', () => stopZoom());
}