/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { CallService } from 'src/app/shared/call.service';
import { ChatService } from 'src/app/shared/chat.service';

@Component({
  selector: 'meet-live',
  templateUrl: './live.component.html',
  styleUrls: ['./live.component.scss'],
})
export class LiveComponent implements OnInit {
  peers = Object.assign({});
  streams: Array<any> = [];
  ROOM_ID = '';
  constructor(
    private router: Router,
    private callService: CallService,
    private chatService: ChatService,
    private socket: Socket,
    private activatedRoute: ActivatedRoute
  ) {
    this.callService.initPeer();
  }

  ngOnInit() {
    this.chatService
      .helloMessage()
      .subscribe((response) => console.log('hello response: ', response));
    this.chatService
      .welcomeMessage()
      .subscribe((message) => console.log('message: ', message));
    console.log('io socket: ', this.chatService.Socket.ioSocket);
    this.chatService.sendMessage('hello', 'Hello server');

    this.activatedRoute.params.subscribe((param) => {
      console.log('rood id: ', param['id']);
      this.ROOM_ID = param['id'];
    });
    this.callService.initPeer();
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: {
          width: { min: 250, ideal: 600, max: 1920 },
          height: { min: 100, ideal: 450, max: 1080 },
          facingMode: 'user',
        },
      })
      .then(async (stream) => {
        const myVideo = document.createElement('video');
        myVideo.muted = true;
        // handle comments
        // socket.on('get-comments', async (comList) => {
        //   comments = comments;
        //   console.log('Gotten comments: ', comList);
        //   const div = document.getElementById('commentList');
        //   for (const comment of comList) {
        //     await createCommentLi(comment, div);
        //   }
        // });
        // socket.emit('request-comments', ROOM_ID);
        // socket.on('new-comment', async (comment) => {
        //   const div = document.getElementById('commentList');
        //   await createCommentLi(comment, div);
        // });
        // socket.emit('request-user', UIN);
        // socket.on('get-user', (user) => {
        //   console.log('User: ', user);
        //   USER = user;
        // });
        console.log('peers: ', this.peers);

        if (this.peers) {
          // myVideo.style.width = 'auto';
          // myVideo.style.height = 'auto';
          console.log('no peer connected');
        }
        this.addVideoStream(myVideo, stream);
        // this.addVideoStream(myVideo, stream);
        this.callService.getPeer()?.on('call', (call: any) => {
          call.answer(stream);
          const peerVideo = document.createElement('video');

          call.on('stream', (peerStream: any) => {
            this.addVideoStream(peerVideo, peerStream);
          });
        });
        this.chatService.Socket.on(
          'user-connected',
          (peerId: string | any, usertype: string) => {
            console.log('new user type: ', peerId);
            this.connectToNewUser(peerId, stream, usertype);
          }
        );

        this.socket.on('user-disconnected', (peerId: string) => {
          console.log('disconnected userId: ', peerId);
          if (this.peers[peerId]) {
            this.peers[peerId].close();
          }
        });
      })
      .catch((err) => console.log('Media Error: ', err));
    this.callService.getPeer()?.on('open', (peerId: string) => {
      console.log('My PeerId: ', peerId);

      this.socket.emit('join-room', this.ROOM_ID, peerId);
    });
  }

  addVideoStream(video: HTMLVideoElement, stream: any, usertype?: string) {
    const videoGrid: HTMLDivElement = document.querySelector(
      '.main'
    ) as HTMLDivElement;
    video.srcObject = stream;
    //   console.log("My stream: ", stream);
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });

    video.className = 'video2';

    videoGrid.append(video);
  }
  connectToNewUser(peerId: any, stream: any, usertype: string) {
    const alreadyExist = this.peers[peerId];
    console.log('connecting to peers', peerId, this.peers, alreadyExist);

    const userVideo = document.createElement('video');
    if (!alreadyExist) {
      const call = this.callService.getPeer()?.call(peerId, stream);
      console.log('call: ', call);

      call?.on('stream', (userVideoStream: any) => {
        const userVideoExist = document.getElementById(peerId);
        if (!userVideoExist) {
          userVideo.id = peerId;
          this.addVideoStream(userVideo, userVideoStream, usertype);
        } else {
          console.log('User video already exist');
        }
        call.on('close', () => {
          userVideo.remove();
        });
      });
      this.peers[peerId] = call;

      console.log('peers: ', this.peers);
    }
  }
}
