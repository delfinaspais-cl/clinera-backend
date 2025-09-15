import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    console.error('🚨 Validation Exception Filter - Status:', status);
    console.error('🚨 Validation Exception Filter - Response:', exceptionResponse);

    let message = 'Error de validación';
    let errors: any[] = [];
    let details = '';

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      
      if (responseObj.message) {
        if (Array.isArray(responseObj.message)) {
          errors = responseObj.message;
          details = responseObj.message.join(', ');
        } else {
          message = responseObj.message;
          details = responseObj.message;
        }
      }
      
      if (responseObj.errors) {
        errors = responseObj.errors;
      }
    }

    const errorResponse = {
      statusCode: status,
      message,
      errors,
      details,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    };

    console.error('🚨 Sending error response:', errorResponse);

    response.status(status).json(errorResponse);
  }
}
