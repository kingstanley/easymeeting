/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { AuthService } from 'projects/account/src/lib/components/services/auth.service';
import { CallService } from 'src/app/shared/call.service';
import { ChatService } from 'src/app/shared/chat.service';
import { MeetingService } from '../../services/meeting.service';
import { AdmitComponent } from '../admit/admit.component';

@Component({
  selector: 'meet-live',

  templateUrl: './live.component1.html',
  styleUrls: ['./live.component1.scss'],
})
export class LiveComponent implements OnInit {
  peers = Object.assign({});
  streams: Array<any> = [];
  ROOM_ID = '';
  averageRating = 0;
  isAdmitted = false;
  username = '';
  users: Array<{
    peerId: string;
    username: string;
    socketId: string;
    stream?: any;
  }> = [];
  constrainWidth = { min: 250, ideal: 800, max: 1920 };
  constrainHeight = { min: 100, ideal: 400, max: 1080 };
  myStream: MediaStream = new MediaStream();
  isPeerOpend = false;
  meeting: any;
  user: any;
  showButtons = false;
  useVideo:
    | boolean
    | {
        width: {
          min: number;
          ideal: number;
          max: number;
        };
        // height: {
        //   min: this.constrainHeight.min,
        //   ideal: this.constrainHeight.ideal,
        //   max: this.constrainHeight.max,
        // },
        facingMode: 'user';
      } = true;
  useAudio: boolean | MediaTrackConstraints | undefined = true;
  constructor(
    private router: Router,
    private callService: CallService,
    private chatService: ChatService,
    private socket: Socket,
    private activatedRoute: ActivatedRoute,
    private msb: MatSnackBar,
    private dialog: MatDialog,
    private meetingService: MeetingService,
    private authService: AuthService
  ) {
    setTimeout(() => {
      this.showButtons = true;
    }, 3000);
  }

  async ngOnInit() {
    this.user = this.authService.getUser();
    console.log('loggedIn user: ', this.user);

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
      this.meetingService
        .getMeetingByCode(this.ROOM_ID)
        .subscribe((meeting) => {
          this.meeting = meeting;
          console.log('meeting: ', meeting);
          if (this.isAdmin()) {
            this.username = this.user.name.split(' ')[0];
            console.log('username: ', this.username);
          }
        });
    });

    await this.getMediaStream();

    if (this.myStream) this.callService.initPeer();

    this.callService.getPeer()?.on('call', (call) => {
      call.answer(this.myStream);
      const peerVideo = document.createElement('video');
      console.log('call object: ', call);
      call.on('stream', (peerStream) => {
        console.log('user received call stream: ', peerStream);
        const user = this.users.find((user) => user.peerId == call.peer);
        this.addVideoStream(peerVideo, peerStream, '', '');
        const userVideoExist = document.getElementById(call.peer);
        if (user) {
          if (!userVideoExist) {
            peerVideo.id = call.peer;
            this.addVideoStream(
              peerVideo,
              peerStream,
              user?.username,
              call.peer
            );
          } else {
            console.log('User video already exist');
            userVideoExist.getElementsByTagName('video')[0].remove();
            userVideoExist.append(peerVideo);
          }
        }
      });
    });

    const myVideo = document.createElement('video');
    myVideo.muted = true;

    console.log('peers: ', this.peers);

    if (this.myStream) {
      console.log('my stream is ', this.myStream);
      if (this.callService.getPeer()?.id) {
        this.users.push({
          peerId: this.callService.getPeer()?.id || this.username,
          socketId: this.socket.ioSocket.id,
          username: this.username,
        });
      }
      this.addVideoStream(
        myVideo,
        this.myStream,
        'You',
        this.callService.getPeer()?.id || this.myStream.id
      );
    }
    this.chatService.Socket.on(
      'user-connected',
      (peerId: string, username: string, socketId: string) => {
        console.log('new user peerId: ', peerId);
        if (!this.users.find((user) => user.peerId == peerId)) {
          this.users.push({ peerId: peerId, socketId, username: username });
        }
        this.connectToNewUser(peerId, this.myStream, username);
      }
    );
    this.socket.on(
      'ask-to-join',
      (roomId: string, username: string, socketId: string, email: string) => {
        console.log('ask to join data: ', roomId, username, socketId);

        if (!email && this.isAdmin()) {
          this.dialog
            .open(AdmitComponent, {
              data: { roomId, username, socketId },
            })
            .afterClosed()
            .subscribe((result) => {
              // admit
              this.socket.emit('admit-or-reject', socketId, result);
            });
        }
      }
    );
    this.socket.on('user-disconnected', (peerId: string) => {
      console.log('disconnected userId: ', peerId);
      if (this.peers[peerId]) {
        this.peers[peerId].close();
        // remove the div container holding the details of the exiting user
      }
    });

    // this.isPeerOpend = true;
    this.socket.on('admitted', (result: boolean) => {
      console.log('admit or reject: ', result);
      // this.callService.getPeer()?.on('open', (peerId: string) => {
      console.log('My PeerId: ', this.callService.getPeer()?.id);
      if (result) {
        console.log('isadmitted: ', result);

        const action = document.getElementById('action') as HTMLDivElement;
        action.style.display = 'none';
        this.isAdmitted = true;
        this.addVideoStream(
          myVideo,
          this.myStream,
          'You',
          this.callService.getPeer()?.id || this.username
        );
        this.socket.emit(
          'join-room',
          this.ROOM_ID,
          this.callService.getPeer()?.id,
          this.username,
          this.socket.ioSocket.id
        );
        // console.log('isAdmitted: ', this.isAdmitted, result);
      } else {
        this.msb.open('You were not admitted into the meeting', 'X', {
          duration: 4000,
        });
      }
      // });
    });
  }
  askToJoin() {
    if ((this.callService.getPeer()?.id && this.username) || !this.isAdmitted) {
      console.log('asking to join with', this.callService.getPeer()?.id);
      this.chatService.asKToJoin(
        this.ROOM_ID,
        this.username,
        this.socket.ioSocket.id,
        this.user?.email
      );
    } else {
      this.msb.open('Please enter name or organization', 'X', {
        duration: 3000,
      });
    }
  }
  isAdmin() {
    return this.user?.email == this.meeting?.host;
  }
  joinAsAdmin() {
    document
      .getElementById(this.callService.getPeer()?.id || this.myStream.id)
      ?.remove();
    this.username = this.user.name.split(' ')[0];
    this.isAdmitted = true;
    const action = document.getElementById('action') as HTMLDivElement;
    action.style.display = 'none';
    this.socket.emit(
      'join-room',
      this.ROOM_ID,
      this.callService.getPeer()?.id,
      this.username
    );
    const myVideo = document.createElement('video');
    myVideo.muted = true;

    this.addVideoStream(
      myVideo,
      this.myStream,
      'You',
      this.callService.getPeer()?.id || this.myStream.id
    );
  }
  cancelJoin() {
    console.log('cancel join');
  }

  async getMediaStream() {
    this.myStream = await navigator.mediaDevices.getUserMedia({
      audio: this.useAudio,
      video:
        this.useVideo == false
          ? this.useVideo
          : {
              width: {
                min: this.constrainWidth.min,
                ideal: this.constrainWidth.ideal,
                max: this.constrainWidth.max,
              },
              // height: {
              //   min: this.constrainHeight.min,
              //   ideal: this.constrainHeight.ideal,
              //   max: this.constrainHeight.max,
              // },
              facingMode: 'user',
            },
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
  addPreview(video: HTMLVideoElement, stream: any) {
    const videoGrid: HTMLDivElement = document.querySelector(
      '.preview'
    ) as HTMLDivElement;
    video.srcObject = stream;
    // video.autoplay;
    //   console.log("My stream: ", stream);
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    videoGrid.append(video);
  }
  addVideoStream(
    video: HTMLVideoElement,
    stream: any,
    username: string,
    peerId: string
  ) {
    console.log('users: ', this.users);

    // this.resizeGrid();
    const videoGrid: HTMLDivElement = document.querySelector(
      '.content'
    ) as HTMLDivElement;
    console.log('videoGrid on top: ', videoGrid);
    video.srcObject = stream;

    console.log('adding stream after admitted: ', stream);
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    const holder = document.createElement('div');
    holder.id = peerId;
    if (this.users.length <= 1) {
      this.constrainWidth.ideal = 500;
      holder.className = 'item position-relative card bg-dark';
      (async () => {
        await this.getMediaStream();
        console.log('new stream with ideal 500: ', this.myStream);
      })();
    } else {
      this.constrainWidth.ideal = 400;
      (async () => {
        await this.getMediaStream();
        console.log('new stream with ideal 400: ', this.myStream);
      })();
    }
    if (this.users.length <= 5 && this.users.length > 2) {
      holder.className = 'item1 position-relative card bg-dark';
    }
    if (this.users.length <= 10 && this.users.length > 5) {
      holder.className = 'item2 position-relative card bg-dark';
    }
    if (this.users.length > 10) {
      holder.className = 'item3 position-relative card bg-dark';
    }
    holder.append(video);
    if (username) {
      console.log('no username');

      const user = this.users.find((user) => user.peerId == peerId);
      console.log('but user found: ', user);

      if (user) username = user.username;
    }
    // create container for username and acitons
    const usernameLabl = document.createElement('span');
    usernameLabl.innerText = username;
    usernameLabl.className = 'text-white position-absolute';

    holder.prepend(usernameLabl);
    videoGrid.prepend(holder);
    console.log('videoGrid: ', videoGrid);
  }
  connectToNewUser(peerId: any, myStream: any, username: string) {
    const alreadyExist = this.peers[peerId];
    // console.log('connecting to peers', peerId, this.peers, alreadyExist);

    const userVideo = document.createElement('video');
    // if (!alreadyExist) {
    const call = this.callService.getPeer()?.call(peerId, myStream);

    console.log('call: ', call);

    call?.on('stream', (userVideoStream: any) => {
      const userVideoExist = document.getElementById(peerId);
      if (!userVideoExist) {
        userVideo.id = peerId;
        this.addVideoStream(userVideo, userVideoStream, username, peerId);
      } else {
        console.log('User video already exist');
        userVideoExist.getElementsByTagName('video')[0].remove();
        userVideoExist.append(userVideo);
      }
      call.on('close', () => {
        userVideo.remove();
        // remove the container of the user video
        document.getElementById(peerId)?.remove();
      });
    });
    this.peers[peerId] = call;

    console.log('peers: ', this.peers);
    // } else {
    //   console.log('peer already exist');
    // }
  }
  endCall(result: boolean) {
    console.log('end call clicked');
    // this.myStream = null;
    this.socket.disconnect('user-disconnected');
    this.callService.getPeer()?.destroy();
    const tracks = this.myStream.getTracks();
    tracks.forEach((track: MediaStreamTrack) => {
      console.log('track: ', track);
      track.stop();
    });
    window.location.href = '/meeting/live/' + this.meeting.code;
  }
  toggleMic(value: boolean) {
    if (value) {
      this.useAudio = false;
    } else {
      this.useAudio = true;
    }
    this.getMediaStream();
  }
  toggleCam(value: boolean) {
    this.useVideo = !this.useVideo;
    if (!value) {
      this.useVideo = {
        width: {
          min: this.constrainWidth.min,
          ideal: this.constrainWidth.ideal,
          max: this.constrainWidth.max,
        },
        // height: {
        //   min: this.constrainHeight.min,
        //   ideal: this.constrainHeight.ideal,
        //   max: this.constrainHeight.max,
        // },
        facingMode: 'user',
      };
    } else {
      this.useVideo = false;
    }
    (async () => {
      const videoCon = document.getElementById(
        this.callService.getPeer()?.id || ''
      ) as HTMLElement;
      const myVideo = videoCon.getElementsByTagName('video')[0];
      myVideo.remove();

      console.log('async function running');
      const tracks = this.myStream.getVideoTracks();
      tracks.forEach((track) => track.stop());
      console.log('media: ', this.myStream.id);
      console.log('toggle video: ', value, this.useVideo);
      await this.getMediaStream();
      // this.socket.emit();
      console.log('media 1: ', this.myStream.id);
      const newVideo = document.createElement('video');
      newVideo.srcObject = this.myStream;
      newVideo.muted = true;
      newVideo.addEventListener('loadedmetadata', () => newVideo.play());
      videoCon.append(newVideo);
      this.socket.emit(
        'join-room',
        this.ROOM_ID,
        this.callService.getPeer()?.id,
        this.username,
        this.socket.ioSocket.id
      );
    })();
  }
}
