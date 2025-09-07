const strokeConfig = {
    stroke: 'black',
    strokeWidth: 2,
    globalCompositeOperation: 'source-over',
    isEraserMode: false,
    eraserStrokeWidth: 10,
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
    setStrokePreviewSize(size);
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
        highlightSelectedColor(document.getElementById('colorBtnDefault'));
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
    colorButtons.forEach(btn => btn.classList.remove('selected'));
    if (selectedBtn) selectedBtn.classList.add('selected');
}

function bindColorEvents() {
    highlightSelectedColor(document.getElementById('colorBtnDefault'));

    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            strokeConfig.stroke = btn.dataset.color;
            setEraserState(btn.id === 'eraserStroke');
            highlightSelectedColor(btn);

            if (!strokeConfig.isEraserMode) {
                setStrokePreviewSize(strokeConfig.strokeWidth);
            }
        });
    });

    customColorPicker.addEventListener('input', () => {
        strokeConfig.stroke = customColorPicker.value;
        setEraserState(false);
        highlightSelectedColor(null);
        setStrokePreviewSize(strokeConfig.strokeWidth);
    });
}

export function createKonvaLine(pos) {
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
    previewCircle = createStrokePreviewCircle(drawLayer, strokeConfig.strokeWidth);

    toggleColorPicker();
    bindColorEvents();
    updateStrokeLabel(strokeConfig.strokeWidth);

    decreaseStrokeSizeBtn.addEventListener("click", () => updateStrokeSizes(-1));
    increaseStrokeSizeBtn.addEventListener("click", () => updateStrokeSizes(1));

    return { previewCircle };
}
