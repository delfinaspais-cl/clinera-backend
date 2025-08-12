import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Log performance metrics
        console.log(`🚀 ${method} ${url} - ${duration}ms`);
        
        // Log slow queries (>500ms)
        if (duration > 500) {
          console.warn(`⚠️ SLOW QUERY: ${method} ${url} - ${duration}ms`);
        }
        
        // Log very slow queries (>1000ms)
        if (duration > 1000) {
          console.error(`🐌 VERY SLOW QUERY: ${method} ${url} - ${duration}ms`);
        }
      })
    );
  }
}
