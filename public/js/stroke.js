// public/js/stroke.js
const strokeConfig = {
    stroke: 'black',
    strokeWidth: 2,
    globalCompositeOperation: 'source-over',
    isEraserMode: false,
    eraserStrokeWidth: 10,
    canDraw: false
};

let previewCircle;

const strokeSizeLabel = document.getElementById("strokeSize");
const eraserStrokeLabel = document.getElementById("eraserStroke");
const collapseBtn = document.getElementById('toggleCollapse');
const colorOptions = document.querySelector('.color-options');
const svgDown = document.getElementById('collapseDown');
const svgUp = document.getElementById('collapseUp');
const customColorPicker = document.getElementById('customColor');
const colorButtons = document.querySelectorAll('.color-btn');
const decreaseStrokeSizeBtn = document.getElementById("decreaseStrokeSize");
const increaseStrokeSizeBtn = document.getElementById("increaseStrokeSize");

function updateStrokeLabel(size) {
    strokeSizeLabel.textContent = size;
    eraserStrokeLabel.textContent = strokeConfig.eraserStrokeWidth;
}

function updateStrokeSizes(delta) {
    strokeConfig.strokeWidth = Math.min(10, Math.max(1, strokeConfig.strokeWidth + delta));
    strokeConfig.eraserStrokeWidth = strokeConfig.strokeWidth * 5;
    updateStrokeLabel(strokeConfig.strokeWidth);

    const size = strokeConfig.isEraserMode ? strokeConfig.eraserStrokeWidth : strokeConfig.strokeWidth;
    if (strokeConfig.canDraw) setStrokePreviewSize(size);
}

function setEraserState(state) {
    strokeConfig.isEraserMode = state;

    if (state) {
        strokeConfig.stroke = 'white';
        setStrokePreviewSize(strokeConfig.eraserStrokeWidth);
        highlightSelectedColor(eraserStrokeLabel);
    } else if (strokeConfig.stroke === 'white') {
        strokeConfig.stroke = 'black';
        setStrokePreviewSize(strokeConfig.strokeWidth);
    }
}

function createStrokePreviewCircle(drawLayer, size) {
    const circle = new Konva.Circle({
        radius: size / 2,
        fill: 'rgba(0,0,0,0.06)',
        listening: false,
        visible: false
    });
    drawLayer.add(circle);
    circle.moveToTop();
    return circle;
}

function setStrokePreviewSize(size) {
    if (previewCircle) previewCircle.radius(size / 2);
}

function toggleColorPicker() {
    collapseBtn.addEventListener('click', () => {
        const collapsed = colorOptions.classList.toggle('collapsed');
        svgDown.style.display = collapsed ? 'none' : '';
        svgUp.style.display = collapsed ? '' : 'none';
        collapseBtn.style.border = collapsed ? '2px solid #333' : '';
    });
}

function highlightSelectedColor(selectedBtn) {
    colorButtons.forEach(btn => { if (btn !== selectedBtn) btn.classList.remove('selected'); });
    if (!selectedBtn) return;

    const isSelected = selectedBtn.classList.contains('selected');
    if (isSelected) {
        selectedBtn.classList.remove('selected');
        strokeConfig.canDraw = false;
        strokeConfig.isEraserMode = false;
        setStrokePreviewSize(0);
    } else {
        selectedBtn.classList.add('selected');
        strokeConfig.canDraw = true;

        strokeConfig.isEraserMode = selectedBtn === eraserStrokeLabel;
        strokeConfig.stroke = strokeConfig.isEraserMode ? 'white' : selectedBtn.dataset.color;

        const size = strokeConfig.isEraserMode ? strokeConfig.eraserStrokeWidth : strokeConfig.strokeWidth;
        setStrokePreviewSize(size);
    }
}

function bindColorEvents() {

    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            strokeConfig.stroke = btn.dataset.color;
            highlightSelectedColor(btn);
        });
    });

    customColorPicker.addEventListener('input', () => {
        strokeConfig.stroke = customColorPicker.value;
        strokeConfig.canDraw = true;
        setEraserState(false);
        highlightSelectedColor(null);
        setStrokePreviewSize(strokeConfig.strokeWidth);
    });
}

export function createKonvaLine(pos) {
    if (!strokeConfig.canDraw) return null;
    return new Konva.Line({
        stroke: strokeConfig.stroke,
        strokeWidth: strokeConfig.isEraserMode
            ? strokeConfig.eraserStrokeWidth
            : strokeConfig.strokeWidth,
        globalCompositeOperation: strokeConfig.globalCompositeOperation,
        points: [pos.x, pos.y, pos.x, pos.y],
        lineCap: 'round',
        lineJoin: 'round',
    });
}

export function setStrokeControls(drawLayer) {
    previewCircle = createStrokePreviewCircle(drawLayer, 0);

    toggleColorPicker();
    bindColorEvents();
    updateStrokeLabel(strokeConfig.strokeWidth);

    decreaseStrokeSizeBtn.addEventListener("click", () => updateStrokeSizes(-1));
    increaseStrokeSizeBtn.addEventListener("click", () => updateStrokeSizes(1));

    return { previewCircle };
}
