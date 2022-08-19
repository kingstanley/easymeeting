import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-admit',
  templateUrl: './admit.component.html',
  styleUrls: ['./admit.component.css'],
})
export class AdmitComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { roomId: string; username: string; peerId: string },
    private dialogRef: MatDialogRef<AdmitComponent>
  ) {}

  ngOnInit() {}
  admit() {
    this.dialogRef.close(true);
  }
  reject() {
    this.dialogRef.close(false);
  }
}
