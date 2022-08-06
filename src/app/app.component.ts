import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatService } from './shared/chat.service';
import Peer from 'peerjs';
import { BehaviorSubject, Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { CallService } from './shared/call.service';

@Component({
  selector: 'meet-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  // hello$ = this.http.get<Message>('/api/hello');
  constructor(
    private http: HttpClient,
    private chatService: ChatService,
    private callService: CallService
  ) {
    this.chatService
      .welcomeMessage()
      .subscribe((message) => console.log('welcome message: ', message));
    console.log('socket: ', chatService.Socket.ioSocket);

    this.chatService
      .helloMessage()
      .subscribe((message) => console.log(message));
  }
  sendMessage() {
    this.chatService.sendMessage('hello', 'greeting server');
  }
}
