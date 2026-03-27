// ---------- Sentral feilhåndtering ----------
export function errorHandler(err, req, res, next) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} →`, err.message);
    
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    const status = err.status || err.statusCode || 500;

    res.status(status).json({
        error: err.message || "En ukjent feil oppstod på serveren.",
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
}