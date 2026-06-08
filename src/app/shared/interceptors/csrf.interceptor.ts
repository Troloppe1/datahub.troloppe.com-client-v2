import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs';
import { CsrfService } from '@core/services/dashboard/csrf.service';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const csrfService = inject(CsrfService);

  const condition =
    ['POST', 'PUT', 'DELETE'].includes(req.method) ||
    req.url.includes('/api/notifications') ||
    req.url.endsWith('/api/auth/user') ||
    req.url.includes('/api/street-data') ||
    req.url.includes('/api/locations/get-active-location') ||
    req.url.includes('/api/external-listings') ||
    req.url.includes('/api/investment-data') ||
    req.url.includes('/api/scraper');

  if (condition) {
    return csrfService.csrfRequest().pipe(
      switchMap((token) => {
        if (token) {
          const modifiedReq = req.clone({
            headers: req.headers.set('X-XSRF-TOKEN', token),
            withCredentials: true,
          });
          return next(modifiedReq);
        }
        return next(req);
      }),
    );
  }
  return next(req);
};
