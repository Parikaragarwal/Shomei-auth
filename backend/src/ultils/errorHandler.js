export function handleError(res, error, defaultStatus = 400) {
    console.error("Backend Error:", error);

    // If it's a known safe operational error, we can send it directly
    // Let's assume errors we throw manually using `new Error("...")` might be safe,
    // but system errors like ReferenceError or Postgres/Drizzle errors are unsafe.
    
    if (
        error.name === "ReferenceError" || 
        error.name === "TypeError" || 
        error.name === "SyntaxError" || 
        error.name === "DatabaseError" || // Drizzle / Postgres typically don't use this standard name, but to be safe
        error.message?.includes("drizzle") ||
        error.message?.includes("duplicate key") ||
        error.message?.includes("syntax error") ||
        error.message?.includes("column") ||
        error.message?.includes("relation") ||
        error.message?.includes("users is not defined")
    ) {
        return res.status(500).json({
            message: "An unexpected system error occurred. Please try again later."
        });
    }

    // Default to a 400 Bad Request with the provided message for operational errors
    const statusCode = error.status || defaultStatus;
    return res.status(statusCode).json({
        message: error.message || "An unexpected error occurred."
    });
}
