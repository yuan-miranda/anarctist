let idleTimeout = null;
const IDLE_TIME = 2 * 60 * 1000;

export function resetIdleTimer() {
    if (idleTimeout) clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => alert(`Ayo bro you still there? You have been idle for ${IDLE_TIME / 1000 / 60} minutes.`), IDLE_TIME);
}