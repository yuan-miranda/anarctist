import { saveStrokesToDB } from "./drawingUtils.js";

const strokeQueue = [];
let isSaving = false;

async function queueSave() {
    if (isSaving || strokeQueue.length === 0) return;

    isSaving = true;
    while (strokeQueue.length > 0) {
        const line = strokeQueue.shift();
        await saveStrokesToDB(line);
    }
    isSaving = false;
}

function scheduleSave(line) {
    if (!line || line.className !== 'Line') return;
    if (line.points().length === 0) return;
    strokeQueue.push(line);
    queueSave();
}

export { scheduleSave };