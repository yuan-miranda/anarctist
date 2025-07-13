function saveStrokeHistory(stroke, undoStack, redoStack, keepRedo = false) {
    if (!keepRedo) redoStack.length = 0;
    if (stroke && stroke.path && stroke.path.length > 1) {
        undoStack.push(stroke);
        console.log('Saved stroke:', stroke);
        if (undoStack.length > 50) undoStack.shift();
    }

}

async function saveCanvasData(canvas) {
    return; // ignore for legacy support
}

async function loadCanvasData(canvas, ctx) {
    return; // ignore for legacy support
}

async function saveCanvasStrokes(stroke) {
    try {
        const response = await fetch('/api/save_stroke', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stroke)
        });

        const data = await response.json();
        if (!response.ok) return console.error(data.error);

        stroke.id = data.id;
    } catch (e) {
        console.error(e);
    }
}

async function loadCanvasStrokes(canvas, ctx) {
    try {
        const response = await fetch('/api/load_strokes');
        const data = await response.json();
        if (!response.ok) return console.error(data.error);

        renderStrokes(canvas, ctx, data.strokes);
    } catch (e) {
        console.error(e);
    }
}

async function deleteCanvasStrokes(id, deleteAll = false) {
    try {
        const response = await fetch('/api/delete_stroke', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, deleteAll })
        });

        const data = await response.json();
        if (!response.ok) return console.error(data.error);

        console.log('Deleted stroke with ID:', id);
    } catch (e) {
        console.error(e);
    }
}

function getCanvasPos(container) {
    const style = window.getComputedStyle(container);
    return {
        left: parseInt(style.left, 10),
        top: parseInt(style.top, 10)
    };
}

async function undoStroke(canvas, ctx, undoStack, redoStack) {
    if (!undoStack.length) return;

    const lastStroke = undoStack.pop();
    console.log('Undoing stroke:', lastStroke);
    redoStack.push(lastStroke);

    if (lastStroke.id) await deleteCanvasStrokes(lastStroke.id);
    await loadCanvasStrokes(canvas, ctx);
}

async function redoStroke(canvas, ctx, undoStack, redoStack) {
    if (!redoStack.length) return;

    const lastStroke = redoStack.pop();
    await saveCanvasStrokes(lastStroke);

    undoStack.push(lastStroke);
    await loadCanvasStrokes(canvas, ctx);
}

function renderStrokes(canvas, ctx, strokes) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
        const path = stroke.path;
        if (!path.length) continue;

        ctx.save();
        ctx.strokeStyle = stroke.color || '#000';
        ctx.lineWidth = stroke.width || 2;

        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
        ctx.restore();
    }
}

function addMouseEvents(canvas, ctx, undoStack, redoStack) {
    let currentStroke = null;
    let drawing = false;
    window._canvasDrawing = false;

    canvas.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        drawing = true;
        window._canvasDrawing = true;

        const x = e.offsetX;
        const y = e.offsetY;

        currentStroke = {
            color: ctx.strokeStyle,
            width: ctx.lineWidth,
            path: [{ x, y }],
            createdAt: new Date().toISOString()
        };
    });

    canvas.addEventListener('mousemove', e => {
        if (!drawing || !currentStroke || !currentStroke.path) return;

        const x = e.offsetX;
        const y = e.offsetY;
        const last = currentStroke.path[currentStroke.path.length - 1];
        if (last && last.x === x && last.y === y) return;

        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        currentStroke.path.push({ x, y });
    });

    canvas.addEventListener('mouseup', async e => {
        if (drawing && e.button === 0) {
            drawing = false;
            window._canvasDrawing = false;

            if (currentStroke && currentStroke.path.length > 1) {
                saveStrokeHistory(currentStroke, undoStack, redoStack);
                await saveCanvasStrokes(currentStroke);
            }

            currentStroke = null;
        }
    });

    canvas.addEventListener('mouseleave', async () => {
        if (drawing) {
            drawing = false;
            window._canvasDrawing = false;
            if (currentStroke && currentStroke.path.length > 1) {
                saveStrokeHistory(currentStroke, undoStack, redoStack);
                await saveCanvasStrokes(currentStroke);
            }

            currentStroke = null;
        }
    });

    const container = document.getElementById('canvas-container');
    let isDragging = false, dragStartX = 0, dragStartY = 0, containerStartX = 0, containerStartY = 0;

    container.addEventListener('mouseenter', () => {
        if (!isDragging) container.style.cursor = 'crosshair';
    });
    container.addEventListener('mouseleave', () => {
        if (!isDragging) container.style.cursor = '';
    });
    document.addEventListener('mousedown', e => {
        if (e.button === 2) {
            isDragging = true;
            document.body.style.cursor = 'grabbing';
            container.style.cursor = 'grabbing';
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            const pos = getCanvasPos(container);
            containerStartX = pos.left;
            containerStartY = pos.top;
            document.body.style.userSelect = 'none';
        }
    });
    document.addEventListener('mousemove', e => {
        if (isDragging) {
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            container.style.left = (containerStartX + dx) + 'px';
            container.style.top = (containerStartY + dy) + 'px';
            container.style.transform = '';
        }
    });
    document.addEventListener('mouseup', e => {
        if (isDragging && e.button === 2) {
            isDragging = false;
            document.body.style.cursor = 'grab';
            container.style.cursor = 'crosshair';
            document.body.style.userSelect = '';
        }
    });
}


function addTouchEvents(canvas, ctx, undoStack, redoStack) {
    let drawing = false, lastX = 0, lastY = 0;
    let currentStroke = null;

    canvas.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            drawing = true;
            window._canvasDrawing = true;

            lastX = (touch.clientX - rect.left) * (canvas.width / rect.width);
            lastY = (touch.clientY - rect.top) * (canvas.height / rect.height);
            currentStroke = {
                color: ctx.strokeStyle,
                width: ctx.lineWidth,
                path: [{ x: lastX, y: lastY }],
                createdAt: new Date().toISOString()
            };
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
        if (!drawing || e.touches.length !== 1) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastX = x;
        lastY = y;
        if (currentStroke) {
            const last = currentStroke.path[currentStroke.path.length - 1];
            if (!last || last.x !== x || last.y !== y) {
                currentStroke.path.push({ x, y });
            }
        }
    }, { passive: false });

    canvas.addEventListener('touchend', async () => {
        if (drawing) {
            drawing = false;
            window._canvasDrawing = false;
            if (currentStroke && currentStroke.path.length > 1) {
                saveStrokeHistory(currentStroke, undoStack, redoStack);
                await saveCanvasStrokes(currentStroke);
            }
            currentStroke = null;
        }
    });

    canvas.addEventListener('touchcancel', async () => {
        if (drawing) {
            drawing = false;
            window._canvasDrawing = false;
            if (currentStroke && currentStroke.path.length > 1) {
                await saveCanvasStrokes(currentStroke);
            }
            currentStroke = null;
        }
    });
}


function eventListeners(canvas, ctx, undoStack, redoStack) {
    addMouseEvents(canvas, ctx, undoStack, redoStack);
    addTouchEvents(canvas, ctx, undoStack, redoStack);

    window.addEventListener('keydown', async e => {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            await undoStroke(canvas, ctx, undoStack, redoStack);
        } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
            e.preventDefault();
            await redoStroke(canvas, ctx, undoStack, redoStack);
        }
    });

    document.getElementById('clearCanvas').addEventListener('click', async () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        undoStack.length = 0;
        redoStack.length = 0;
        await deleteCanvasStrokes(null, true);
    });

    document.getElementById('loadStrokes').addEventListener('click', async () => {
        await loadCanvasStrokes(canvas, ctx);
    });

    document.getElementById('undoStroke').addEventListener('click', async () => {
        await undoStroke(canvas, ctx, undoStack, redoStack);
    });

    document.getElementById('redoStroke').addEventListener('click', async () => {
        await redoStroke(canvas, ctx, undoStack, redoStack);
    });

    document.addEventListener('contextmenu', e => e.preventDefault());
}

document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('draw-canvas');
    const ctx = canvas.getContext('2d');
    let undoStack = [], redoStack = [];

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';

    document.body.style.cursor = 'grab';

    eventListeners(canvas, ctx, undoStack, redoStack);
    await loadCanvasStrokes(canvas, ctx);

    setInterval(async () => {
        if (!window._canvasDrawing) {
            await loadCanvasStrokes(canvas, ctx);
        }
    }, 2000);
});