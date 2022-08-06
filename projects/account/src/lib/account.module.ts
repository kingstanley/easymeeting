import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountRoutingModule } from './account-routing.module';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { LoginContainerComponent } from './components/login-container/login-container.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { AngularMaterialModule } from 'projects/angular-material/src';
import { SharedModule } from 'projects/shared/src';

@NgModule({
  declarations: [SignInComponent, SignUpComponent, LoginContainerComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AccountRoutingModule,
    AngularMaterialModule,
    HttpClientModule,
    SharedModule,
  ],
  exports: [LoginContainerComponent],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
})
export class AccountModule {}
