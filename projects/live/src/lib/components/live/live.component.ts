/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { CallService } from 'src/app/shared/call.service';
import { ChatService } from 'src/app/shared/chat.service';

@Component({
  selector: 'meet-live',
  templateUrl: './live.component1.html',
  styleUrls: ['./live.component1.scss'],
})
export class LiveComponent implements OnInit {
  peers = Object.assign({});
  streams: Array<any> = [];
  ROOM_ID = '';
  users: Array<{ stream: any }> = [];
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
    console.log(
      'supported constraints: ',
      navigator.mediaDevices.getSupportedConstraints()
    );

    this.callService.initPeer();
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: {
          // width: { min: 250, max: 1920 },
          // height: { min: 100, max: 1080 },
          facingMode: 'user',
        },
      })
      .then(async (stream) => {
        console.log(
          'capabilities',
          stream.getVideoTracks()[0].getCapabilities(),
          'constraints',
          stream.getVideoTracks()[0].getConstraints()
        );

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
  resizeGrid() {
    const container = document.querySelector('.content') as HTMLDivElement;
    console.log('resing : ', container);

    if (this.users.length < 5) {
      container.style.gridTemplateColumns = '1fr 1fr';
      container.style.gridAutoRows = '350px ';
    }
    if (this.users.length == 1) {
      container.style.gridTemplateColumns = '1fr';
      container.style.gridAutoRows = '600px ';
    }
    if (this.users.length < 10 && this.users.length >= 5) {
      container.style.gridTemplateColumns = '1fr 1fr 1fr';
      container.style.gridAutoRows = '350px ';
    }
    if (this.users.length < 15 && this.users.length >= 10) {
      container.style.gridTemplateColumns = '1fr 1fr 1fr 1fr';
      container.style.gridAutoRows = '200px ';
    }
    if (this.users.length < 20 && this.users.length >= 15) {
      container.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr';
      container.style.gridAutoRows = '200px ';
    }
    if (this.users.length >= 20) {
      container.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr 1fr';
      container.style.gridAutoRows = '200px ';
    }
  }
  addVideoStream(video: HTMLVideoElement, stream: any, usertype?: string) {
    this.users.push({ stream: stream });
    console.log('my stream: ', stream);

    // this.resizeGrid();
    const videoGrid: HTMLDivElement = document.querySelector(
      '.content'
    ) as HTMLDivElement;
    video.srcObject = stream;
    video.autoplay;
    //   console.log("My stream: ", stream);
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    const holder = document.createElement('div');
    holder.className = 'item';
    // holder.style.width = '100%';
    // holder.style.height = 'auto';
    holder.append(video);
    videoGrid.prepend(holder);
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
