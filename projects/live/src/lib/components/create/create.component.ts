import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from 'projects/account/src/lib/components/services/auth.service';
import { MeetingService } from '../../services/meeting.service';

@Component({
  selector: 'meet-live-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
})
export class CreateComponent implements OnInit {
  createForm: FormGroup;
  isProcessing = false;
  showShareCard = false;
  meetingUlr: string = window.location.host;
  timedOutCloser: any;
  meeting: any;
  user: any;
  constructor(
    private fb: FormBuilder,
    private meetingService: MeetingService,
    private msb: MatSnackBar,
    private router: Router,
    private authService: AuthService
  ) {
    this.createForm = this.fb.group({
      title: [''],
      description: [''],
      startTime: [''],
      endTime: [''],
      host: [''],
      date: [''],
      attendance: this.fb.array([]),
      guests: [''],
    });
  }

  ngOnInit(): void {
    // console.log('url: ', this.router.url, window.location.origin);
    this.user = this.authService.getUser();
  }
  selectMeetingDate(event: any) {
    console.log('date event: ', event);
  }
  submit() {
    this.isProcessing = true;
    // console.log('form: ', this.createForm.value);
    this.meetingService
      .createMeeting(this.createForm.value)
      .subscribe((result) => {
        this.isProcessing = false;
        this.showShareCard = true;
        this.meeting = result;
        this.meetingUlr += '/meeting/live/' + result.code;
        this.msb.open('Meeting created!', 'X', { duration: 5000 });
      });
  }
  mouseEnterMenu(trigger: MatMenuTrigger) {
    if (this.timedOutCloser) {
      clearTimeout(this.timedOutCloser);
    }
    trigger.openMenu();
  }
  mouseLeaveMenu(trigger: MatMenuTrigger) {
    this.timedOutCloser = setTimeout(() => {
      trigger.closeMenu();
    }, 5000);
  }
  copyLink() {
    navigator.clipboard.writeText(this.meetingUlr);
  }
  sendViaEmail() {
    const subject = 'meeting initation by ' + this.user.name;
    const body = `Hi!
     You're invited to a meeting via easymeet platform by ${this.user.name}

    To Join meeting click visit ${this.meetingUlr} or open easymeet and enter ${this.meeting.code} as invite code
    `;
    window.location.href = `mailto:user@example.com?subject=${subject}&body=${body}`;
  }
  startMeeting() {
    this.router.navigate([`meeting/live/${this.meeting.code}`]);
  }
}
