import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
// import { TokenService } from './token.service';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from 'projects/account/src/lib/components/services/auth.service';
// import { AuthService } from 'projects/shared/src/services/auth.service';

@Injectable({ providedIn: 'root' })
export class TokenInterceptorService implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private msb: MatSnackBar,
    private router: Router
  ) {}

  // intercept(
  //   request: HttpRequest<any>,
  //   next: HttpHandler
  // ): Observable<HttpEvent<any>> {
  // show a spinner
  // this.spinner.show();
  // add authorization header with jwt token if available
  // const token = this.tokenService.getToken();
  // if (token) {
  //   request = request.clone({
  //     setHeaders: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   });
  // }

  // return next.handle(request).pipe(
  // tap((event: HttpEvent<any>) => {
  //   if (event instanceof HttpResponse && event.status === 201) {
  //     this.msb.open('Request succeeded.', 'X', { duration: 3000 });
  //   }

  //   // this.spinner.hide();
  // }),
  // retry(2),
  // catchError((error: HttpErrorResponse) => {
  //   // if (error.status !== 401) {
  //   // 401 handled in auth.interceptor
  //   console.log('Error: ', error);
  //   if (error.status === 0) {
  //     this.msb.open(
  //       `Sorry, we are having deficulty accessing the
  //           network,Check Your internet connection and Try again please`,
  //       'X',
  //       { duration: 5000 }
  //     );
  //   // } else if (error.status === 401) {
  //   //   this.msb.open(
  //   //     `You are not Authorized to perform the
  //   //         requested operation. Try Login again with a priviledged account`,
  //   //     'X',
  //   //     { duration: 7000 }
  //   //   );
  //   //   // localStorage.clear();
  //   //   this.router.navigate(['/registration/login']);
  //   }
  //   else if (error.status === 500) {
  //     this.msb.open(
  //       `Sorry! Its our fault. Your challenge with
  //           our site has been logged, The team is going to fix the
  //           issue shortly`,
  //       'X',
  //       { duration: 10000 }
  //     );
  //   } else {
  //     this.msb.open(error.message, 'X', { duration: 7000 });
  //   }
  //   // this.spinner.hide();
  //   return throwError(error);
  // })
  // );
  // }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const hearderConfig = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: '',
    };
    const token = this.authService.getToken();
    // console.log('token: ', token);
    if (token) {
      hearderConfig['Authorization'] = `bearer ${token}`;
    }
    const _req = req.clone({ setHeaders: hearderConfig });
    return next.handle(_req);
  }
}
