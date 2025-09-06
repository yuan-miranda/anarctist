const strokeInput = document.getElementById("strokeSize");
const strokeLabel = document.getElementById("strokeLabel");
let strokeSize = parseInt(strokeInput.value, 10);

function updateStrokeLabel(size) {
    strokeLabel.textContent = `Stroke: ${size}px`;
}

function createStrokePreviewCircle(layer, size) {
    const previewCircle = new Konva.Circle({
        radius: size / 2,
        fill: 'rgba(0,0,0,0.06)',
        listening: false,
        visible: false
    });
    layer.add(previewCircle);
    previewCircle.moveToTop();

    return previewCircle;
}

export function setStrokeSize(layer) {
    const previewCircle = createStrokePreviewCircle(layer, strokeSize);
    updateStrokeLabel(strokeSize);

    strokeInput.addEventListener("input", () => {
        strokeSize = parseInt(strokeInput.value, 10);
        updateStrokeLabel(strokeSize);
        previewCircle.radius(strokeSize / 2);
        layer.batchDraw();
    });

    return {
        getStrokeSize: () => strokeSize,
        previewCircle
    };
}