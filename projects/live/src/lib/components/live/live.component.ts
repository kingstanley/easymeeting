/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Component, OnInit } from '@angular/core';
import { async } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { AuthService } from 'projects/account/src/lib/components/services/auth.service';
import { CallService } from 'src/app/shared/call.service';
import { ChatService } from 'src/app/shared/chat.service';
import { MeetingService } from '../../services/meeting.service';
import { AdmitComponent } from '../admit/admit.component';
import { SettingComponent } from '../setting/setting.component';
import { VideoStreamMerger } from 'video-stream-merger';
// import {request} from 'express'

@Component({
  selector: 'meet-live',

  templateUrl: './live.component1.html',
  styleUrls: ['./live.component1.scss'],
})
export class LiveComponent implements OnInit {
  cardStyle = ` min-width: 100px;
     max-width: 200px;
     max-height: 150px;
     flex: 1;`;
  peers = Object.assign({});
  streams: Array<any> = [];
  isMicOn = true;
  isCamOn = true;
  ROOM_ID = '';
  averageRating = 0;
  isAdmitted = false;
  username = '';
  users: any = {};
  constrainWidth = { min: 250, ideal: 1500, max: 1920 };
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
  selectedAudioDevice: ConstrainDOMString | undefined;
  selectedVideoDevice: ConstrainDOMString | undefined;
  wHeight: number;
  wWidth: number;
  isPresentionMode = false;
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
    // this.users['test-video'] = {
    //   peerId: 'test-video',
    //   socketId: '3233-sdsdis',
    //   username: 'Test User',
    // };
    console.log('Height: ', window.innerHeight);
    console.log('Width: ', window.innerWidth);
    this.wHeight = window.innerHeight;
    this.wWidth = window.innerWidth;
  }

  async ngOnInit() {
    navigator.mediaDevices.addEventListener('devicechange', (event) => {
      console.log('event: ', event);
    });
    this.user = this.authService.getUser();
    console.log('loggedIn user: ', this.user);

    this.chatService
      .helloMessage()
      .subscribe((response) => console.log('hello response: ', response));
    this.chatService
      .welcomeMessage()
      .subscribe((message) => console.log('message: ', message));

    // listen to events to control camera and mic from admin
    this.socket.on('turn-off-cam', (peerId: string, socketId: string) => {
      // console.log('asked to turn off cam: ', peerId, socketId);
      this.myStream.getVideoTracks()[0].enabled = false;
    });
    this.socket.on('turn-on-cam', (peerId: string, socketId: string) => {
      // console.log('asked to turn on cam: ', peerId, socketId);
      this.myStream.getVideoTracks()[0].enabled = true;
    });
    this.socket.on('turn-off-mic', (peerId: string, socketId: string) => {
      // console.log('asked to turn off mic: ', peerId, socketId);
      this.myStream.getAudioTracks()[0].enabled = false;
    });
    this.socket.on('turn-on-mic', (peerId: string, socketId: string) => {
      // console.log('asked to turn on mic: ', peerId, socketId);
      this.myStream.getAudioTracks()[0].enabled = true;
    });
    this.socket.on('presentation', (peerId: string) => {
      this.setPresentationScreen(peerId);
      this.isPresentionMode = true;
    });
    this.socket.on('presentation-ended', (peerId: string) => {
      this.isPresentionMode = false;
      this.resizeContainer();
    });
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
        const user = this.users[call.peer];

        // this.addVideoStream(peerVideo, peerStream, '', '');
        if (!user) {
          // this.users[call.peer] = {
          //   peerId: call.peer,
          //   socketId: null,
          //   username: null,
          // };
          this.socket.emit('request-details', call.peer);
          this.socket.on(
            'sent-details',
            (peerId: string, socketId: string, username: string) => {
              console.log('received details: ', peerId, socketId, username);

              this.users[peerId] = { peerId, socketId, username };
              this.addVideoStream(
                peerVideo,
                peerStream,
                username,
                call.peer,
                socketId
              );
            }
          );
        } else {
          this.addVideoStream(
            peerVideo,
            peerStream,
            user.username,
            call.peer,
            user.socketId
          );
        }
        // this.addVideoStream(
        //   peerVideo,
        //   peerStream,
        //   user?.username,
        //   call.peer,
        //   ''
        // );
      });
      call.on('close', () => {
        peerVideo?.remove();
        // remove the container of the user video
        document.getElementById(call.peer)?.remove();
        if (!this.isPresentionMode) {
          this.resizeContainer();
        }
        if (this.users[call.peer]) {
          delete this.peers[call.peer];
        }
        call.close();
      });
      this.peers[call.peer] = call;
    });

    this.socket.on('request-details', (peerId: string) => {
      console.log('requesting details for ', peerId);

      if (this.callService.getPeer()?.id == peerId) {
        this.socket.emit(
          'sent-details',
          peerId,
          this.socket.ioSocket.id,
          this.username
        );
      }
    });

    const myVideo = document.createElement('video');
    myVideo.muted = true;

    console.log('peers: ', this.peers);

    if (this.myStream) {
      console.log('my stream is ', this.myStream);
      this.callService.getPeer()?.on('open', (id) => {
        console.log('peerId on open: ', id);

        this.users[id] = {
          peerId: id,
          socketId: this.socket.ioSocket.id,
          username: this.username,
        };
      });

      this.addVideoStream(
        myVideo,
        this.myStream,
        'You',
        this.callService.getPeer()?.id || this.myStream.id,
        this.socket.ioSocket.id
      );
    }
    this.users[this.callService.getPeer()?.id || this.username] = {
      peerId: this.callService.getPeer()?.id || this.username,
      socketId: this.socket.ioSocket.id,
      username: this.username,
    };
    this.chatService.Socket.on(
      'user-connected',
      (peerId: string, username: string, socketId: string) => {
        console.log('new user peerId: ', peerId);
        if (!this.users || !this.users[peerId]) {
          console.log('user not yet added to users');

          this.users[peerId] = { peerId: peerId, socketId, username: username };
        }
        this.connectToNewUser(peerId, this.myStream, username, socketId);
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
        delete this.users[peerId];
        // remove the div container holding the details of the exiting user
        document.getElementById(peerId)?.remove();
        if (!this.isPresentionMode) {
          this.resizeContainer();
        }
        if (this.users[peerId]) {
          delete this.peers[peerId];
        }
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
          this.callService.getPeer()?.id || this.username,
          this.socket.ioSocket.id
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
    this.constrainWidth.ideal = 400;
    this.myStream.getVideoTracks()[0].getConstraints().width = 400;
    console.log(
      'aspectRatio: ',
      this.myStream.getVideoTracks()[0].getConstraints().aspectRatio
    );
    console.log(
      'width: ',
      this.myStream.getVideoTracks()[0].getConstraints().width
    );
    console.log(
      'heigth: ',
      this.myStream.getVideoTracks()[0].getConstraints().height
    );
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
      this.callService.getPeer()?.id || this.myStream.id,
      this.socket.ioSocket.id
    );
    this.addVideoStream(
      myVideo,
      this.myStream,
      'You',
      this.callService.getPeer()?.id || this.myStream.id,
      this.socket.ioSocket.id
    );
    // this.addVideoStream(
    //   myVideo,
    //   this.myStream,
    //   'You',
    //   this.callService.getPeer()?.id || this.myStream.id,
    //   this.socket.ioSocket.id
    // );
  }
  cancelJoin() {
    this.myStream.getVideoTracks()[0].stop();
    this.router.navigate(['/']);
  }

  async getMediaStream() {
    this.myStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        deviceId: this.selectedAudioDevice,
      },
      video: {
        width: {
          min: this.constrainWidth.min,
          ideal: this.constrainWidth.ideal,
          max: this.constrainWidth.max,
        },
        facingMode: 'user',
        aspectRatio: 16 / 9,
        echoCancellation: true,
        noiseSuppression: true,
        sampleSize: 100,
        deviceId: this.selectedVideoDevice,
      },
    });
  }
  resizeContainer() {
    const container = document.getElementById('content') as HTMLDivElement;
    console.log('resing : ', container);
    const userKeys = Object.keys(this.users);
    console.log('user keys: ', userKeys);
    const card = document.getElementById(
      this.callService.getPeer()?.id || this.username
    ) as HTMLElement;
    if (userKeys.length == 0) {
      console.log('no user yet');

      card.style.maxWidth = '800px';
    }
    const usersLen = userKeys.length;
    for (let i = 0; i < usersLen; i++) {
      const card = document.getElementById(userKeys[i]) as HTMLDivElement;
      if (card) {
        card.className = 'card bg-dark';
        if (usersLen == 1) {
          card.style.maxWidth = '100%';
          card.style.maxHeight = '100%';
        } else if (usersLen == 2) {
          container.className = 'content position-relative';
          container.style.maxWidth = '100%';
          if (userKeys[i] !== this.callService.getPeer()?.id) {
            card.style.maxWidth = '100%';
            card.style.maxHeight = '100%';
          } else {
            card.style.maxWidth = '200px';
            card.style.bottom = '0';
            card.style.right = '0';
            card.className = 'card bg-dark position-absolute';
          }
        } else if (usersLen < 5 && usersLen > 2) {
          container.className = 'content';
          card.removeAttribute('style');
          if (userKeys[i] == this.callService.getPeer()?.id) {
            card.style.width = '48%';
            card.style.bottom = '';
            card.style.right = '';
            card.className = 'card bg-dark position-relative';
          } else {
            card.style.width = '48%';
            card.className = 'card bg-dark position-relative';
          }
        } else if (usersLen < 10 && usersLen >= 5) {
          card.style.width = '32%';
          // container.style.gridAutoRows = '350px ';
        } else if (usersLen < 15 && usersLen >= 10) {
          card.style.width = '24%';
          // container.style.gridAutoRows = '200px ';
        } else if (usersLen < 20 && usersLen >= 15) {
          card.style.maxWidth = '300px';
          // container.style.gridAutoRows = '200px ';
        } else if (usersLen >= 20) {
          card.style.maxWidth = '250px';
          // container.style.gridAutoRows = '200px ';
        }
      }

      // if (usersLen < 5) {
      //   container.style.gridTemplateColumns = '1fr 1fr';
      //   container.style.gridAutoRows = '350px ';
      // }
      // if (usersLen == 0) {
      //   card.style.maxWidth = '800px';
      // }
      // if (usersLen == 1) {
      //   container.style.gridTemplateColumns = '1fr';
      // }
      // if (usersLen == 2) {
      //   container.style.gridTemplateColumns = '1fr 1fr ';
      //   console.log('card: ', card);
      // }
      // if (usersLen < 10 && usersLen >= 5) {
      //   container.style.gridTemplateColumns = '1fr 1fr 1fr';
      //   container.style.gridAutoRows = '350px ';
      // }
      // if (usersLen < 15 && usersLen >= 10) {
      //   container.style.gridTemplateColumns = '1fr 1fr 1fr 1fr';
      //   container.style.gridAutoRows = '200px ';
      // }
      // if (usersLen < 20 && usersLen >= 15) {
      //   container.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr';
      //   container.style.gridAutoRows = '200px ';
      // }
      // if (usersLen >= 20) {
      //   container.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr 1fr';
      //   container.style.gridAutoRows = '200px ';
      // }
    }
  }

  addVideoStream(
    video: HTMLVideoElement,
    stream: any,
    username: string,
    peerId: string,
    socketId: string
  ) {
    console.log(
      'users: ',
      this.users,
      'username: ',
      username,
      'peerId: ',
      peerId
    );

    // this.resizeGrid();
    const videoGrid: HTMLDivElement = document.getElementById(
      'content'
    ) as HTMLDivElement;
    console.log('videoGrid on top: ', videoGrid);
    video.srcObject = stream;

    console.log('adding stream after admitted: ', stream);
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    const holder = document.createElement('div');
    holder.addEventListener('dblclick', async (evt) => {
      console.log('requesting fullscreen with dbclick: ', evt);
      const isFullScreen = document.fullscreenElement;
      if (!isFullScreen) {
        await holder.requestFullscreen();
      } else {
        document.exitFullscreen();
      }

      console.log('fullscreen: ', isFullScreen);
    });
    holder.title = 'double click to enter or exist full screen';
    holder.className = 'card bg-dark position-relative';

    const fullScreen = document.createElement('button');
    fullScreen.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-fullscreen" viewBox="0 0 16 16">
  <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
</svg>`;
    const fh = document.createElement('div');
    fh.style.bottom = '0';
    fh.style.right = '0';
    fh.className = 'position-absolute';
    fullScreen.style.cursor = 'hand';
    fullScreen.addEventListener('click', (evt) => {
      console.log('full screen request: ', evt);
      holder.requestFullscreen();
    });
    fh.append(fullScreen);
    holder.append(fh);
    // holder.style.maxWidth = '500px';
    // check if user already added to screen. If added replace video stream

    if (!username) {
      console.log('no username');

      const user = this.users[peerId];
      console.log('user found: ', user);

      if (user) username = user.username;
    }
    // create container for username and acitons
    const usernameLabl = document.createElement('span');
    usernameLabl.innerText = username;
    usernameLabl.id = `${peerId}-${username}`;
    usernameLabl.className = 'text-white position-absolute m-2';

    const userVideoExist = document.getElementById(peerId) as HTMLDivElement;
    if (!userVideoExist) {
      holder.id = peerId;
      holder.style.flex = '1';
      holder.prepend(usernameLabl);
      holder.append(video);
      videoGrid.prepend(holder);
      if (this.isAdmin() && stream != this.myStream) {
        this.addControls(holder, peerId, socketId);
      }
    } else {
      console.log('User video already exist');
      const videos = userVideoExist.getElementsByTagName('video');
      for (let i = 0; i < videos.length; i++) {
        videos[i].parentNode?.removeChild(videos[i]);
      }
      document.getElementById(`${peerId}-${username}`)?.remove();
      document.getElementById(`${peerId}-actions`)?.remove();
      userVideoExist.append(video);
      userVideoExist.prepend(usernameLabl);
      if (this.isAdmin() && stream != this.myStream) {
        this.addControls(userVideoExist, peerId, socketId);
      }
    }

    if (!this.isPresentionMode) {
      this.resizeContainer();
    } else {
      this.setPresentationScreen(peerId);
    }
    console.log('videoGrid: ', videoGrid);
  }
  addControls(holder: HTMLDivElement, peerId: string, socketId: string) {
    console.log('');

    if (!socketId) {
      socketId = this.users[peerId]?.socketId;
    }
    const camButtonOff = document.createElement('button');

    camButtonOff.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video-off" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M10.961 12.365a1.99 1.99 0 0 0 .522-1.103l3.11 1.382A1 1 0 0 0 16 11.731V4.269a1 1 0 0 0-1.406-.913l-3.111 1.382A2 2 0 0 0 9.5 3H4.272l.714 1H9.5a1 1 0 0 1 1 1v6a1 1 0 0 1-.144.518l.605.847zM1.428 4.18A.999.999 0 0 0 1 5v6a1 1 0 0 0 1 1h5.014l.714 1H2a2 2 0 0 1-2-2V5c0-.675.334-1.272.847-1.634l.58.814zM15 11.73l-3.5-1.555v-4.35L15 4.269v7.462zm-4.407 3.56-10-14 .814-.58 10 14-.814.58z"/>
</svg>`;
    camButtonOff.className = 'm-1 btn btn-dark';

    const camButton = document.createElement('button');

    camButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556v4.35zM2 4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H2z"/>
</svg>`;
    camButton.className = 'm-1 btn btn-dark';
    camButton.style.display = 'none';
    // mic control buttons
    const micButtonOff = document.createElement('button');
    micButtonOff.className = 'm-1 btn btn-dark';
    micButtonOff.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-mute" viewBox="0 0 16 16">
  <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a4.973 4.973 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4zm3-9v4.879l-1-1V3a2 2 0 0 0-3.997-.118l-.845-.845A3.001 3.001 0 0 1 11 3z"/>
  <path d="m9.486 10.607-.748-.748A2 2 0 0 1 6 8v-.878l-1-1V8a3 3 0 0 0 4.486 2.607zm-7.84-9.253 12 12 .708-.708-12-12-.708.708z"/>
</svg>`;

    const micButtonOn = document.createElement('button');
    micButtonOn.className = 'm-1 btn btn-dark';
    micButtonOn.style.display = 'none';
    micButtonOn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic" viewBox="0 0 16 16">
  <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
  <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
</svg>`;

    // add button event listeners
    camButtonOff.addEventListener('click', () => {
      camButtonOff.style.display = 'none';
      camButton.style.display = 'block';
      this.socket.emit('turn-off-cam', peerId, socketId);
    });

    camButton.addEventListener('click', () => {
      camButtonOff.style.display = 'block';
      camButton.style.display = 'none';
      this.socket.emit('turn-on-cam', peerId, socketId);
    });

    micButtonOff.addEventListener('click', () => {
      micButtonOn.style.display = 'block';
      micButtonOff.style.display = 'none';
      this.socket.emit('turn-off-mic', peerId, socketId);
    });
    micButtonOn.addEventListener('click', () => {
      micButtonOn.style.display = 'none';
      micButtonOff.style.display = 'block';
      this.socket.emit('turn-on-mic', peerId, socketId);
    });

    // create button container and add buttons
    const buttonHolders = document.createElement('div');
    buttonHolders.id = `${peerId}-actions`;
    buttonHolders.className = 'position-absolute';
    buttonHolders.style.top = '0';
    buttonHolders.style.right = '0';
    buttonHolders.append(camButtonOff);
    buttonHolders.append(camButton);
    buttonHolders.append(micButtonOff);
    buttonHolders.append(micButtonOn);
    holder.append(buttonHolders);
  }
  connectToNewUser(
    peerId: any,
    myStream: any,
    username: string,
    socketId: string
  ) {
    const alreadyExist = this.peers[peerId];
    console.log('connecting to peers', peerId, this.peers, alreadyExist);

    const userVideo = document.createElement('video');
    userVideo.addEventListener('loadedmetadata', () => {
      userVideo.play();
    });
    // if (!alreadyExist) {
    const call = this.callService.getPeer()?.call(peerId, myStream);

    console.log('call: ', call);

    call?.on('stream', (userVideoStream: any) => {
      // const userVideoExist = document.getElementById(peerId);
      // if (!userVideoExist) {
      //   userVideo.id = peerId;
      this.addVideoStream(
        userVideo,
        userVideoStream,
        username,
        peerId,
        socketId
      );
      call.on('close', () => {
        userVideo?.remove();
        // remove the container of the user video
        document.getElementById(peerId)?.remove();

        if (!this.isPresentionMode) {
          this.resizeContainer();
        }
        if (this.users[peerId]) {
          delete this.peers[peerId];
        }
      });
      // call.peerConnection.getSenders()[0].replaceTrack();
    });
    this.peers[peerId] = call;
    console.log('peers: ', this.peers);
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
    window.location.href = '/live/' + this.meeting.code;
  }
  toggleMic(value: boolean) {
    const audioTrack = this.myStream.getAudioTracks();
    audioTrack[0].enabled = !value;
    this.isMicOn = !this.isMicOn;
  }
  toggleCam(value: boolean) {
    const videoTrack = this.myStream.getVideoTracks();
    videoTrack[0].enabled = !value;
    this.isCamOn = !this.isCamOn;
  }
  OpenSettings() {
    this.dialog
      .open(SettingComponent, {
        width: '100%',
        height: '100%',
        hasBackdrop: false,
        data: { streams: this.myStream },
      })
      .afterClosed()
      .subscribe(async (result) => {
        console.log('setting result: ', result);

        if (result.selectedAudioDevice) {
          this.selectedAudioDevice = result.selectedAudioDevice;
        }
        if (result.selectedVideoDevice) {
          this.selectedVideoDevice = result.selectedVideoDevice;
        }
        // this.myStream.getTracks().forEach((track) => track.stop());
        // await this.getMediaStream();
      });
  }

  async getScreenMedia() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia();
      console.log('share screen: ', screenStream);
      if (screenStream) {
        this.socket.emit(
          'presentation',
          this.callService.getPeer()?.id,
          this.socket.ioSocket.id
        );
        console.log('screen media: ', screenStream);
        const track = screenStream.getVideoTracks()[0];
        console.log('track: ', track);
        const videoTrack = this.myStream.getVideoTracks()[0];
        this.myStream.removeTrack(this.myStream.getVideoTracks()[0]);
        // this.myStream.addTrack(track);
        const calls: any = Object.values(this.peers);
        console.log('calls: ', calls);
        const merger = new VideoStreamMerger();
        merger.addStream(screenStream, {
          x: 0, // position of the topleft corner
          y: 0,
          width: this.wWidth,
          height: this.wHeight,
          muted: true,
          index: 0,
          mute: true, // we don't want sound from the screen (if there is any)
          draw: (ctx, frame, done) => {
            // You can do whatever you want with this canvas context
            ctx.drawImage(frame, 0, 0, merger.width, merger.height);
            done();
          },
          audioEffect: (sourceNode, destinationNode) => {
            sourceNode.connect(destinationNode); // The default effect, simply merges audio
          },
        });

        // Add the webcam stream. Position it on the bottom left and resize it to 100x100.
        merger.addStream(this.myStream, {
          x: 0,
          y: merger.height - 180,
          width: 150,
          height: 100,
          mute: false,
          muted: false,
          index: 1,
          draw: (ctx, frame, done) => {
            ctx.drawImage(frame, 0, 0, merger.width, merger.height);
            done();
          },

          audioEffect: (sourceNode, destinationNode) => {
            sourceNode.connect(destinationNode); // The default effect, simply merges audio
          },
        });
        merger.start();
        const mergedStream = merger.result;
        // if (mergedStream) {
        // const mTrack = mergedStream.getVideoTracks()[0];
        this.myStream.addTrack(track);
        for (const call of calls) {
          call?.peerConnection
            .getSenders()
            .forEach((sender: any) => sender.replaceTrack(track));
        }
        track.onended = () => {
          merger.stop();
          this.myStream.removeTrack(track);
          this.myStream.addTrack(videoTrack);

          for (const call of calls) {
            call?.peerConnection
              .getSenders()
              .forEach((sender: any) => sender.replaceTrack(videoTrack));
          }
          this.socket.emit(
            'presentation-ended',
            this.callService.getPeer()?.id,
            this.socket.ioSocket.id
          );
        };
        // }
      }
    } catch (error) {
      console.log('Error in screen sharing: ', error);
    }
  }
  shareScreen(value?: boolean) {
    this.getScreenMedia();
  }

  setPresentationScreen(peerId: string) {
    console.log('presentation peerId: ', peerId);
    const container = document.getElementById('content') as HTMLDivElement;
    const usersCards = container.getElementsByTagName('div');
    const otherUsersCard = document.createElement('div');
    otherUsersCard.id = 'othercards';
    otherUsersCard.style.display = 'flex';
    otherUsersCard.style.gap = '5px';
    otherUsersCard.style.height = '10vh';
    otherUsersCard.style.bottom = '0';
    otherUsersCard.style.right = '0';
    const usersKeys = Object.keys(this.users);
    // const userLens=usersKeys.length;
    for (let i = 0; i < usersKeys.length; i++) {
      const card = document.getElementById(usersKeys[i]) as HTMLDivElement;
      if (card?.id == peerId) {
        console.log('presentation card: ', card);
        card.style.width = '100%';
      } else {
        card.style.width = '300px';
        otherUsersCard.append(card);
        console.log('non presenter card: ', card);

        // card.remove();
        // for (let i = 0; i < videos.length; i++) {
        // usersCards[i].parentNode?.removeChild(usersCards[i]);
        // }
      }
    }
    console.log('user cards: ', otherUsersCard);

    container.append(otherUsersCard);
  }
}
