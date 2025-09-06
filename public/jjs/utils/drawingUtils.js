export const getPointerPos = (stage) => {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point(stage.getPointerPosition());
};

export function createKonvaLine(pos, color, strokeWidth) {
    return new Konva.Line({
        stroke: color,
        strokeWidth: strokeWidth,
        globalCompositeOperation: 'source-over',
        points: [pos.x, pos.y, pos.x, pos.y],
        lineCap: 'round',
        lineJoin: 'round',
    });
}