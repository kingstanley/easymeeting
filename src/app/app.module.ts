import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularMaterialModule } from 'projects/angular-material/src';
// import { DashboardModule } from 'projects/dashboard/src';
import { SharedModule } from 'projects/shared/src';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { LiveModule } from 'projects/live/src';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { NxWelcomeComponent } from './nx-welcome.component';
import { TokenInterceptorService } from './shared/token-interceptor.service';

const config: SocketIoConfig = { url: environment.socketUrl, options: {} };

@NgModule({
  declarations: [AppComponent, NxWelcomeComponent, HomeComponent],
  imports: [
    AngularMaterialModule,
    BrowserModule,
    HttpClientModule,
    SocketIoModule.forRoot(config),
    AppRoutingModule,
    BrowserAnimationsModule,
    SharedModule,
    // DashboardModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptorService,
      multi: true,
    },
    // { provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
