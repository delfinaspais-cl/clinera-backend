import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ValidationError } from 'class-validator';

@Injectable()
export class ValidationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        console.error('🚨 Validation Error:', error);
        
        if (error instanceof BadRequestException) {
          console.error('🚨 BadRequestException details:', error.getResponse());
          
          // Si es un error de validación de class-validator
          if (error.getResponse() && typeof error.getResponse() === 'object') {
            const response = error.getResponse() as any;
            if (response.message && Array.isArray(response.message)) {
              console.error('🚨 Validation messages:', response.message);
              return throwError(() => new BadRequestException({
                message: 'Errores de validación',
                errors: response.message,
                details: response.message.join(', ')
              }));
            }
          }
        }
        
        return throwError(() => error);
      }),
    );
  }
}
