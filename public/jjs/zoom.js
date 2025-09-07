// public/jjs/zoom.js
import { centerStage } from './utils/stageUtils.js';

let zoomInterval = null;
const zoomSpeed = 1.02;
const zoomDelay = 20;

const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const resetZoomBtn = document.getElementById('resetZoom');
const centerCanvasBtn = document.getElementById('centerCanvas');

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

function showResetZoomButton() {
    resetZoomBtn.style.display = 'inline-block';
    centerCanvasBtn.style.display = 'none';
}

function showCenterCanvasButton() {
    resetZoomBtn.style.display = 'none';
    centerCanvasBtn.style.display = 'inline-block';
}

export function setZoomControls(stage) {
    loadStagePositionAndScale(stage);
    if (stage.scaleX() !== 1) showResetZoomButton();
    else showCenterCanvasButton();

    // zoom in
    zoomInBtn.addEventListener('pointerdown', () => {
        startZoom(stage, zoomSpeed);
        showResetZoomButton();
    });
    zoomInBtn.addEventListener('pointerup', stopZoom);
    zoomInBtn.addEventListener('pointerleave', stopZoom);

    // ctrl + + (zoom in)
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && (e.key === '=')) {
            e.preventDefault();
            zoomStageAtCenter(stage, zoomSpeed);
            showResetZoomButton();
        }
    });

    // zoom out
    zoomOutBtn.addEventListener('pointerdown', () => {
        startZoom(stage, 1 / zoomSpeed);
        showResetZoomButton();
    });
    zoomOutBtn.addEventListener('pointerup', stopZoom);
    zoomOutBtn.addEventListener('pointerleave', stopZoom);

    // ctrl + - (zoom out)
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === '-') {
            e.preventDefault();
            zoomStageAtCenter(stage, 1 / zoomSpeed);
            showResetZoomButton();
        }
    });

    // ctrl + 0 (reset zoom)
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === '0') {
            e.preventDefault();
            zoomStageAtCenter(stage, 1 / stage.scaleX());
            showCenterCanvasButton();
        }
    });

    // reset zoom
    resetZoomBtn.addEventListener('click', () => {
        zoomStageAtCenter(stage, 1 / stage.scaleX());
        showCenterCanvasButton();
    });

    // center canvas
    centerCanvasBtn.addEventListener('click', () => {
        centerStage(stage);
        showCenterCanvasButton();
    });

    window.addEventListener('blur', () => stopZoom());
}