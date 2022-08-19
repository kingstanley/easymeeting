import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(public Socket: Socket) {}
  sendMessage(event: string, message: string | symbol) {
    return this.Socket.emit(event, message);
  }
  welcomeMessage() {
    return this.Socket.fromEvent('welcome');
  }
  helloMessage() {
    return this.Socket.fromEvent('hello');
  }
  asKToJoin(
    roomId: string,
    username: string,
    socketId: string,
    email?: string
  ) {
    return this.Socket.emit('ask-to-join', roomId, username, socketId, email);
  }
}
