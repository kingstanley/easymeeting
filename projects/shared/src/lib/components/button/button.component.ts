import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'meet-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css']
})
export class ButtonComponent implements OnInit {
@Input() color='primary';
@Input() label='Submit';
@Input() title='Click to submit';
@Input() isProcessing = false;
@Input()icon='save';
@Input() iconColor='primary'
@Output() emitSubmit =new EventEmitter(true);
 

  ngOnInit() {
    if(this.color === this.iconColor){
      console.log('colors are the same')
      if(this.color == 'primary'){
        this.iconColor = 'warn'
      }
      if(this.color == 'warn'){
        this.iconColor = 'accent'
      }
      if(this.color == 'accent'){
        this.iconColor = 'primary'
      }
    }
  }
submit(){
  this.isProcessing=true;
  this.emitSubmit.emit();
}
}
