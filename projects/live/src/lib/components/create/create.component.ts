import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MeetingService } from '../../services/meeting.service';

@Component({
  selector: 'meet-live-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
})
export class CreateComponent implements OnInit {
  createForm: FormGroup;
  isProcessing = false;
  constructor(
    private fb: FormBuilder,
    private meetingService: MeetingService,
    private msb: MatSnackBar
  ) {
    this.createForm = this.fb.group({
      title: [''],
      description: [''],
      startTime: [''],
      endTime: [''],
      host: [''],
      date: [''],
      attendance: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    console.log();
  }
  selectMeetingDate(event: any) {
    console.log('date event: ', event);
  }
  submit() {
    this.isProcessing = true;
    console.log('form: ', this.createForm.value);
    this.meetingService
      .createMeeting(this.createForm.value)
      .subscribe((result) => {
        this.msb.open('Meeting created!', 'X', { duration: 5000 });
      });
  }
}
