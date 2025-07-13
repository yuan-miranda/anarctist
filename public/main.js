function saveState(canvas, stack, keepRedo = false) {
    if (!keepRedo) redoStack = [];
    stack.push(canvas.toDataURL());
    if (stack.length > 50) stack.shift();
}

function restoreState(canvas, ctx, stackFrom, stackTo) {
    if (!stackFrom.length) return;
    stackTo.push(canvas.toDataURL());

    const img = new window.Image();
    img.src = stackFrom.pop();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        saveCanvasData(canvas);
    };
}

async function saveCanvasData(canvas) {
    return;
}

async function loadCanvasData(canvas, ctx) {
    return;
}

// async function saveCanvasData(canvas) {
//     try {
//         const data = canvas.toDataURL();
//         await fetch('/api/save_canvas', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ data })
//         });
//     } catch (e) {
//         console.error(e);
//     }
// }

// async function loadCanvasData(canvas, ctx) {
//     try {
//         const response = await fetch('/api/load_canvas');
//         if (!response.ok) return console.error('Failed to load canvas data');

//         const data = await response.json();
//         const img = new Image();
//         img.src = data.data;
//         img.onload = () => {
//             ctx.clearRect(0, 0, canvas.width, canvas.height);
//             ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
//         };
//     } catch (e) {
//         console.error(e);
//     }
// }

async function saveCanvasStrokes(stroke) {
    try {
        const response = await fetch('/api/save_stroke', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stroke)
        });

        if (!response.ok) {
            console.error((await response.json()).error);
        }
    } catch (e) {
        console.error(e);
    }
}

async function loadCanvasStrokes(canvas, ctx) {
    try {
        const response = await fetch('/api/load_strokes');
        const data = await response.json();

        if (!response.ok) return console.error(data.error);

        // Clear the canvas before rendering strokes
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const stroke of data.strokes) {
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

function addMouseEvents(canvas, ctx, undoStack) {
    let currentStroke = null;
    let drawing = false, lastX = 0, lastY = 0;
    window._canvasDrawing = false;

    canvas.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        drawing = true;
        window._canvasDrawing = true;

        saveState(canvas, undoStack);

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
        if (!drawing) return;

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
            await saveCanvasStrokes(currentStroke);
            currentStroke = null;
        }
    });

    canvas.addEventListener('mouseleave', () => {
        if (drawing) {
            drawing = false;
            window._canvasDrawing = false;
            saveCanvasData(canvas);
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


function addTouchEvents(canvas, ctx, undoStack) {
    let drawing = false, lastX = 0, lastY = 0;
    let currentStroke = null;

    canvas.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            drawing = true;
            window._canvasDrawing = true;

            saveState(canvas, undoStack);

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
    let drawing = false;
    addMouseEvents(canvas, ctx, undoStack);
    addTouchEvents(canvas, ctx, undoStack);

    window.addEventListener('keydown', e => {
        if (drawing) return;
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            restoreState(canvas, ctx, undoStack, redoStack);
        } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
            e.preventDefault();
            restoreState(canvas, ctx, redoStack, undoStack);
        }
    });

    document.getElementById('clearCanvas').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveCanvasData(canvas);
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

    saveState(canvas, undoStack);
    eventListeners(canvas, ctx, undoStack, redoStack);

    // auto-load canvas data every second, but pause while drawing
    setInterval(async () => {
        if (!window._canvasDrawing) {
            await loadCanvasStrokes(canvas, ctx);
        }
    }, 1000);
});