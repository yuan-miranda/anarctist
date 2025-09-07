import { pushStrokeToLocalStorage } from "./drawingUtils.js";

let isDrawing = false;
let currentLine = null;

export function setDrawingState(state) {
    isDrawing = state;
}

export function getDrawingState() {
    return isDrawing;
}

export function setCurrentLine(line) {
    currentLine = line;
}

export function getCurrentLine() {
    return currentLine;
}

export function endDrawing() {
    if (!isDrawing || !currentLine) return;
    pushStrokeToLocalStorage(currentLine);

    isDrawing = false;
    currentLine = null;
}