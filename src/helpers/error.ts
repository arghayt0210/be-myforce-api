import express from 'express';

export class ErrorHandler extends Error {
  statusCode: number;
  errors?: Record<string, unknown>;

  constructor(statusCode: number, message: string, errors?: Record<string, unknown>) {
    super();
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
  }
}

export const handleError = (err: Error | ErrorHandler, res: express.Response): void => {
  if (err instanceof ErrorHandler) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      statusCode: err.statusCode,
    });
  } else {
    console.error('Unexpected error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
    });
  }
};
