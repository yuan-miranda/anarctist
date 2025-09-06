export const getPointerPos = (stage) => {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = transform.point(stage.getPointerPosition());
    return {
        x: Math.round(pos.x),
        y: Math.round(pos.y)
    }
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