// middleware/errorHandler.mjs
// Sentralisert feilhåndtering for hele Express-applikasjonen.
// Legg denne til SIST i server.mjs, etter alle ruter.

export function errorHandler(err, req, res, next) {
    // Logg feilen på serveren (med stack trace i utvikling)
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} →`, err.message);
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    // Bruk statuskoden fra feilen hvis den finnes, ellers 500
    const status = err.status || err.statusCode || 500;

    // Ikke send stack trace til klienten i produksjon
    res.status(status).json({
        error: err.message || "En ukjent feil oppstod på serveren.",
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
}
