import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-actions',
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.scss'],
})
export class ActionsComponent implements OnInit {
  @Input() isCamVideoMuted: boolean = false;
  @Input() isMicMuted: boolean = false;
  @Input() isPresenting = false;
  @Output() emitCamToggle: EventEmitter<boolean> = new EventEmitter(false);
  @Output() emitMicToggle: EventEmitter<boolean> = new EventEmitter(false);
  constructor() {}
  @Output() emitEndCall: EventEmitter<boolean> = new EventEmitter(false);
  @Output() emitChat: EventEmitter<boolean> = new EventEmitter(false);
  @Output() emitPresent: EventEmitter<boolean> = new EventEmitter(false);
  ngOnInit() {}
  endCall() {
    this.emitEndCall.emit(true);
  }
  toggleCamVideo() {
    this.isCamVideoMuted = !this.isCamVideoMuted;
    this.emitCamToggle.emit(this.isCamVideoMuted);
  }
  toggleMic() {
    this.isMicMuted = !this.isMicMuted;
    this.emitMicToggle.emit(this.isMicMuted);
  }
  present() {
    this.emitPresent.emit(true);
  }
}
