const strokeInput = document.getElementById("strokeSize");
const strokeLabel = document.getElementById("strokeLabel");
let strokeSize = parseInt(strokeInput.value, 10);

function updateStrokeLabel(size) {
    strokeLabel.textContent = `Stroke: ${size}px`;
}

function createStrokePreviewCircle(drawLayer, size) {
    const previewCircle = new Konva.Circle({
        radius: size / 2,
        fill: 'rgba(0,0,0,0.06)',
        listening: false,
        visible: false
    });
    drawLayer.add(previewCircle);
    previewCircle.moveToTop();
    return previewCircle;
}

export function setStrokeSize(drawLayer) {
    const previewCircle = createStrokePreviewCircle(drawLayer, strokeSize);
    updateStrokeLabel(strokeSize);

    strokeInput.addEventListener("input", () => {
        strokeSize = parseInt(strokeInput.value, 10);
        updateStrokeLabel(strokeSize);
        previewCircle.radius(strokeSize / 2);
        drawLayer.batchDraw();
    });

    return {
        getStrokeSize: () => strokeSize,
        previewCircle
    };
}