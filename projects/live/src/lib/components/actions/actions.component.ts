import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-actions',
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.scss'],
})
export class ActionsComponent implements OnInit {
  constructor() {}
  @Output() emitEndCall: EventEmitter<boolean> = new EventEmitter(false);
  ngOnInit() {}
  endCall() {
    this.emitEndCall.emit(true);
  }
}
