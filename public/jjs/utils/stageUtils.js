export const getPointerPos = (stage) => {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point(stage.getPointerPosition());
};