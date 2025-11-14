import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiResponse } from '../types/common';

// Generic validation middleware
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined,
      }));

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input data',
        errors: formattedErrors,
      } as ApiResponse);
      return;
    }

    next();
  };
};

// Error handling middleware
export const errorHandler = (
  error: Error & { name?: string; stack?: string },
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('API Error:', error);

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
    errorCode = 'UNAUTHORIZED';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
    errorCode = 'FORBIDDEN';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
    errorCode = 'NOT_FOUND';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    message = 'Resource conflict';
    errorCode = 'CONFLICT';
  } else if (error.name === 'RateLimitError') {
    statusCode = 429;
    message = 'Too many requests';
    errorCode = 'RATE_LIMIT_EXCEEDED';
  }

  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  } as ApiResponse);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  } as ApiResponse);
};
