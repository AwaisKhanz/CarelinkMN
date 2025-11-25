import { Request, Response, NextFunction } from 'express';

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const timeInMs = (diff[0] * 1e9 + diff[1]) / 1e6;
    const formattedTime = timeInMs.toFixed(2);

    const method = req.method;
    const url = req.originalUrl;
    const status = res.statusCode;

    // Log based on duration thresholds
    if (timeInMs > 1000) {
      console.warn(`[SLOW] ${method} ${url} ${status} - ${formattedTime}ms`);
    } else if (timeInMs > 200) {
      console.info(`[WARN] ${method} ${url} ${status} - ${formattedTime}ms`);
    } else {
      // Optional: Log all requests in debug mode
      // console.debug(`[OK] ${method} ${url} ${status} - ${formattedTime}ms`);
    }
  });

  next();
};
