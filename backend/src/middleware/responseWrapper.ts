import { Request, Response, NextFunction } from "express";

export function responseWrapper(_req: Request, res: Response, next: NextFunction) {
    const originalJson = res.json;

    res.json = function (body: any) {
        // Prevent double wrapping
        if (body && typeof body === "object" && "success" in body && "data" in body) {
            return originalJson.call(this, body);
        }

        // Construct standardized response format
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

        const wrappedBody = {
            success: isSuccess,
            data: isSuccess ? body : null,
            error: !isSuccess ? (body?.error || body?.message || "An error occurred") : null,
        };

        return originalJson.call(this, wrappedBody);
    };

    next();
}
