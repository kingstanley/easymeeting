import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'meet-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
})
export class CarouselComponent implements OnInit {
  @Input() items: Array<{ src: string; description: string }> = [];
  @Input() style = '';
  selectedItem: { src: string; description: string } = {
    src: '',
    description: '',
  };
  currentIndex = 0;

  ngOnInit(): void {
    this.selectedItem = this.items[this.currentIndex];
  }
  prev() {
    // console.log('previous clicked: ',this.selectedItem);

    if (this.currentIndex > 0) {
      this.currentIndex -= 1;
    } else {
      this.currentIndex = this.items.length - 1;
    }
    this.selectedItem = this.items[this.currentIndex];
  }
  next() {
    // console.log('next clicked: ',this.selectedItem);
    if (this.currentIndex < this.items.length - 1) {
      this.currentIndex += 1;
    } else {
      this.currentIndex = 0;
    }
    this.selectedItem = this.items[this.currentIndex];
  }
}
