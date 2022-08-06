import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'meet-login-container',
  templateUrl: './login-container.component.html',
  styleUrls: ['./login-container.component.scss'],
})
export class LoginContainerComponent implements OnInit {
  toggleForm = false;

  constructor() {}

  ngOnInit() {}
  toggle(evt: boolean) {
    this.toggleForm = !this.toggleForm;
  }
}
