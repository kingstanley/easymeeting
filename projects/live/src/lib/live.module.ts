import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiveRoutes } from './live.routing';
import { LiveComponent } from './components/live/live.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CreateComponent } from './components/create/create.component';
import { JoinComponent } from './components/join/join.component';
import { ContainerComponent } from './components/container/container.component';
import { ActionsComponent } from './components/actions/actions.component';
import { AngularMaterialModule } from 'projects/angular-material/src';
import { SharedModule } from 'projects/shared/src';
import { SettingComponent } from './components/setting/setting.component';
import { HomeComponent } from './components/home/home.component';

@NgModule({
  declarations: [
    LiveComponent,
    CreateComponent,
    JoinComponent,
    ContainerComponent,
    ActionsComponent,
    SettingComponent,
    HomeComponent,
  ],
  imports: [
    LiveRoutes,
    CommonModule,
    AngularMaterialModule,
    SharedModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LiveModule {}
