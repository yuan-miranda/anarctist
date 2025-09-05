new kursor({ type: 5, removeDefaultCursor: true });

Konva.pixelRatio = 1;
const stage = new Konva.Stage({
    container: 'container',
    width: window.innerWidth,
    height: window.innerHeight
});

const layer = new Konva.Layer();
stage.add(layer);

const PAGE_WIDTH = 524288;
const PAGE_HEIGHT = 524288;

const pageGroup = new Konva.Group({
    clip: { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT },
});

const page = new Konva.Rect({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    fill: '#fff',
    stroke: '#ccc',
    strokeWidth: 2,
});

pageGroup.add(page);
layer.add(pageGroup);

const strokeInput = document.getElementById("strokeSize");
const strokeLabel = document.getElementById("strokeLabel");
let strokeSize = parseInt(strokeInput.value, 10);

const updateStrokeLabel = () => strokeLabel.textContent = `Stroke: ${strokeSize}px`;
updateStrokeLabel();

strokeInput.addEventListener("input", () => {
    strokeSize = parseInt(strokeInput.value, 10);
    updateStrokeLabel();
    cursorCircle.radius(strokeSize / 2);
    layer.batchDraw();
});

const cursorCircle = new Konva.Circle({
    radius: strokeSize / 2,
    fill: 'rgba(0,0,0,0.06)',
    listening: false,
    visible: false
});
layer.add(cursorCircle);
cursorCircle.moveToTop();

let isDrawing = false;
let currentLine = null;

const getPointerPos = () => {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point(stage.getPointerPosition());
};

const endDrawing = () => {
    isDrawing = false;
    currentLine = null;
};

stage.container().addEventListener('contextmenu', e => e.preventDefault());

stage.on('mousedown touchstart', (e) => {
    const pos = getPointerPos();

    if (e.evt.touches && e.evt.touches.length > 1) return;

    if (e.evt.type === 'touchstart' || e.evt.button === 0) {
        isDrawing = true;
        currentLine = new Konva.Line({
            stroke: 'black',
            strokeWidth: strokeSize,
            globalCompositeOperation: 'source-over',
            points: [pos.x, pos.y, pos.x, pos.y],
            lineCap: 'round',
            lineJoin: 'round',
        });
        pageGroup.add(currentLine);
    } else if (e.evt.button === 2) {
        stage.draggable(true);
        stage.startDrag();
    }
});

stage.on('mousemove touchmove', () => {
    const pos = getPointerPos();
    if (!pos) return;

    cursorCircle.position(pos);
    cursorCircle.visible(true);

    if (isDrawing && currentLine) {
        currentLine.points(currentLine.points().concat([pos.x, pos.y]));
    }

    layer.batchDraw();
});

stage.on('mouseup touchend', (e) => {
    if (e.evt.type === 'touchend' || e.evt.button === 0) endDrawing();
    else if (e.evt.button === 2) stage.draggable(false);
});

stage.on('mouseleave', () => { cursorCircle.visible(false); endDrawing(); });
window.addEventListener('blur', endDrawing);

window.addEventListener('resize', () => {
    stage.width(window.innerWidth);
    stage.height(window.innerHeight);
    stage.batchDraw();
});

let zoomInterval = null;
const zoomSpeed = 1.02;
const zoomDelay = 20;

function zoomStageAtCenter(scaleFactor) {
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

function startZoom(scaleFactor) {
    if (zoomInterval) clearInterval(zoomInterval);
    zoomInterval = setInterval(() => {
        zoomStageAtCenter(scaleFactor);
    }, zoomDelay);
}

function stopZoom() {
    if (zoomInterval) clearInterval(zoomInterval);
    zoomInterval = null;
}

// zoom in
const zoomInBtn = document.getElementById('zoomIn');
zoomInBtn.addEventListener('pointerdown', () => startZoom(zoomSpeed));
zoomInBtn.addEventListener('pointerup', stopZoom);
zoomInBtn.addEventListener('pointerleave', stopZoom);

// zoom out
const zoomOutBtn = document.getElementById('zoomOut');
zoomOutBtn.addEventListener('pointerdown', () => startZoom(1 / zoomSpeed));
zoomOutBtn.addEventListener('pointerup', stopZoom);
zoomOutBtn.addEventListener('pointerleave', stopZoom);

// two-finger panning
let isTwoFingerPanning = false;
let lastCenter = null;

function getCenter(t1, t2) {
    return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
    };
}

stage.getContent().addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        isTwoFingerPanning = true;
        lastCenter = getCenter(e.touches[0], e.touches[1]);

        // remove current drawing if second finger touches
        if (isDrawing && currentLine) {
            currentLine.destroy();
            currentLine = null;
        }
        isDrawing = false;
    }
}, { passive: false });

stage.getContent().addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && isTwoFingerPanning) {
        e.preventDefault();

        const center = getCenter(e.touches[0], e.touches[1]);
        const dx = center.x - lastCenter.x;
        const dy = center.y - lastCenter.y;

        stage.position({
            x: stage.x() + dx,
            y: stage.y() + dy
        });

        stage.batchDraw();
        lastCenter = center;
    }
}, { passive: false });

stage.getContent().addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
        isTwoFingerPanning = false;
        lastCenter = null;
    }
});