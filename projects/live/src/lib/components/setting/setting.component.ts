import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.css'],
})
export class SettingComponent implements OnInit {
  audioDevices: MediaDeviceInfo[] = [];
  videoDevices: MediaDeviceInfo[] = [];
  selectedVideoDevice = '';
  selectedAudioDevice = '';
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<SettingComponent>
  ) {}

  async ngOnInit() {
    // const video = document.createElement('video');
    // video.srcObject = this.data.stream;
    // video.autoplay;
    // const container = document.getElementById('video') as HTMLElement;
    // container.append(video);
    const devices = await navigator.mediaDevices.enumerateDevices();

    this.videoDevices = devices.filter((device) => device.kind == 'videoinput');
    this.audioDevices = devices.filter((device) => device.kind == 'audioinput');
    console.log('Video devices: ', this.videoDevices);
    console.log('audio devices: ', this.audioDevices);
  }
  close() {
    this.dialogRef.close({
      selectedVideoDevice: this.selectedVideoDevice,
      selectedAudioDevice: this.selectedAudioDevice,
    });
  }
}
