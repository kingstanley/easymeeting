import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'meet-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  constructor(private router: Router) {}
  loggedIn = false;

  ngOnInit(): void {
    console.log();
  }
  startMeeting() {
    this.router.navigate(['/meeting/']);
  }
  joinMeeting() {
    this.router.navigate(['/meeting/']);
  }
}
