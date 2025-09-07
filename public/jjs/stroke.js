function updateStrokeLabel(size) {
    document.getElementById("strokeSize").textContent = size;
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

export function setStrokeControls(drawLayer) {
    const strokeSizeSpan = document.getElementById("strokeSize");
    let strokeSize = parseInt(strokeSizeSpan.textContent, 10) || 1;

    const previewCircle = createStrokePreviewCircle(drawLayer, strokeSize);

    const decreaseStrokeSizeBtn = document.getElementById("decreaseStrokeSize");
    const increaseStrokeSizeBtn = document.getElementById("increaseStrokeSize");

    decreaseStrokeSizeBtn.addEventListener("click", () => {
        if (strokeSize > 1) {
            strokeSize--;
            updateStrokeLabel(strokeSize);
            previewCircle.radius(strokeSize / 2);
        }
    });

    increaseStrokeSizeBtn.addEventListener("click", () => {
        if (strokeSize < 10) {
            strokeSize++;
            updateStrokeLabel(strokeSize);
            previewCircle.radius(strokeSize / 2);
        }
    });

    return {
        getStrokeSize: () => strokeSize,
        previewCircle
    };
}