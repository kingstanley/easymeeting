import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './components/button/button.component';
import { InputComponent } from './components/input/input.component';
import { CarouselComponent } from './components/carousel/carousel.component';
import { AngularMaterialModule } from 'projects/angular-material/src';

@NgModule({
  declarations: [ButtonComponent, InputComponent, CarouselComponent],
  imports: [CommonModule, AngularMaterialModule],
  exports: [ButtonComponent, InputComponent, CarouselComponent],
})
export class SharedModule {}
