export const PAGE_WIDTH = 524288;
export const PAGE_HEIGHT = 524288;

Konva.pixelRatio = 1;

export function createStage() {
    const stage = new Konva.Stage({
        container: 'container',
        width: window.innerWidth,
        height: window.innerHeight
    });

    const layer = new Konva.Layer();
    stage.add(layer);

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

    return { stage, layer, pageGroup };
}