import { Component, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { Router } from '@angular/router';
import { AuthService } from 'projects/account/src/lib/components/services/auth.service';
import { MeetingService } from '../../services/meeting.service';

@Component({
  selector: 'meet-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.scss'],
})
export class ContainerComponent implements OnInit {
  carouselItems = [
    {
      src: 'assets/look-your-best-on-video-call.jpg',
      description:
        'Calls with high privacy. Your meeting is end to end encrypted.',
    },
    {
      src: 'assets/call2.jpg',
      description:
        'call up to 100 people free. Record calls, Present screens or collaborate on a live white board.',
    },
  ];
  meetLinkControl = new FormControl('');
  carouselStyle = 'width:500px;border-radius: 100px;';
  showJoinButton = false;
  createMenuItems = ['Instant Meeting', 'Schedule Meeting'];
  timedOutCloser: any;
  isProcessing = false;
  constructor(
    private router: Router,
    private authService: AuthService,
    private meetingService: MeetingService
  ) {}

  ngOnInit(): void {
    if (!this.authService.getToken()) this.router.navigate(['/account']);
    if (this.meetLinkControl.touched || this.meetLinkControl.dirty) {
      this.showJoinButton = true;
    }
    this.meetLinkControl.valueChanges.subscribe((value) => {
      if (value && value?.length > 0) {
        this.showJoinButton = true;
      } else {
        this.showJoinButton = false;
      }
    });
  }
  handleCreateMenu(menu: string) {
    console.log(menu);

    this.isProcessing = true;
    if (menu.includes('Instant Meeting')) {
      // Generate meeting in the backend and redirect to meeting screen on success
      this.meetingService.instantMeeting().subscribe((result) => {
        this.joinMeeting(result.code);
      });
    } else {
      // open meeting schedule form
      this.router.navigate(['/meeting/create']);
      this.isProcessing = false;
    }
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
  joinMeeting(code?: string) {
    this.router.navigate(['/live', code ? code : this.meetLinkControl.value]);
  }
  // keyPressEvent(event: KeyboardEvent) {
  //   console.log('event: ', event);
  //   if (event.key == 'Enter' || event['keyCode'] == 13) {
  //     this.joinMeeting();
  //   }
  // }
  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    console.log(event);

    if (event.keyCode === KEY_CODE.ENTER || event.key == 'Enter') {
      this.joinMeeting();
    }
  }
}
export enum KEY_CODE {
  RIGHT_ARROW = 39,
  LEFT_ARROW = 37,
  ENTER = 13,
}
