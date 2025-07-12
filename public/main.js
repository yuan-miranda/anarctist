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
    try {
        const data = canvas.toDataURL();
        await fetch('/api/save_canvas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data })
        });
    } catch (e) {
        console.error(e);
    }
}

async function loadCanvasData(canvas, ctx) {
    try {
        const response = await fetch('/api/load_canvas');
        if (!response.ok) return console.error('Failed to load canvas data');

        const data = await response.json();
        const img = new Image();
        img.src = data.data;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
    } catch (e) {
        console.error(e);
    }
}

function addMouseEvents(canvas, ctx, undoStack, redoStack) {
    let drawing = false, lastX = 0, lastY = 0;
    window._canvasDrawing = false;

    canvas.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        drawing = true;
        window._canvasDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
        saveState(canvas, undoStack);
    });

    canvas.addEventListener('mousemove', e => {
        if (!drawing) return;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });

    canvas.addEventListener('mouseup', e => {
        if (drawing && e.button === 0) {
            drawing = false;
            window._canvasDrawing = false;
            saveCanvasData(canvas);
        }
    });

    canvas.addEventListener('mouseleave', () => {
        if (drawing) {
            drawing = false;
            window._canvasDrawing = false;
            saveCanvasData(canvas);
        }
    });
}

function addTouchEvents(canvas, ctx, undoStack, redoStack) {
    let drawing = false, lastX = 0, lastY = 0;

    canvas.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            drawing = true;
            window._canvasDrawing = true;
            lastX = (touch.clientX - rect.left) * (canvas.width / rect.width);
            lastY = (touch.clientY - rect.top) * (canvas.height / rect.height);
            saveState(canvas, undoStack);
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
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
        if (drawing) {
            drawing = false;
            window._canvasDrawing = false;
            saveCanvasData(canvas);
        }
    });

    canvas.addEventListener('touchcancel', () => {
        if (drawing) {
            drawing = false;
            window._canvasDrawing = false;
            saveCanvasData(canvas);
        }
    });
}


function eventListeners(canvas, ctx, undoStack, redoStack) {
    let drawing = false, lastX = 0, lastY = 0;
    addMouseEvents(canvas, ctx, undoStack, redoStack);
    addTouchEvents(canvas, ctx, undoStack, redoStack);

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
}


document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('draw-canvas');
    const ctx = canvas.getContext('2d');
    let undoStack = [], redoStack = [];

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';

    const container = document.getElementById('canvas-container');
    let isDragging = false, dragStartX = 0, dragStartY = 0, containerStartX = 0, containerStartY = 0;

    function getCanvasPos() {
        const style = window.getComputedStyle(container);
        return {
            left: parseInt(style.left, 10),
            top: parseInt(style.top, 10)
        };
    }

    document.addEventListener('contextmenu', e => e.preventDefault());
    document.body.style.cursor = 'grab';
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
            const pos = getCanvasPos();
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

    saveState(canvas, undoStack);
    eventListeners(canvas, ctx, undoStack, redoStack);

    // auto-load canvas data every second, but pause while drawing
    setInterval(async () => {
        if (!window._canvasDrawing) {
            await loadCanvasData(canvas, ctx);
        }
    }, 1000);
});