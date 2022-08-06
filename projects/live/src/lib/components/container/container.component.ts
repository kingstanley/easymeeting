import { Component, OnInit } from '@angular/core';
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
      description: 'The description',
    },
    {
      src: 'assets/call2.jpg',
      description: 'The description of the second image',
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
    this.router.navigate([
      '/meeting/live',
      code ? code : this.meetLinkControl.value,
    ]);
  }
}
