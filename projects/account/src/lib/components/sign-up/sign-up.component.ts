import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../services/user.service';

@Component({
  selector: 'meet-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnInit {
  signinForm: FormGroup;
  isProcessing = false;
  @Output() emitToggle = new EventEmitter(true);

  constructor(
    private fb: FormBuilder,
    private msb: MatSnackBar,
    private userService: UserService
  ) {
    this.signinForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
      password2: [''],
    });
  }

  ngOnInit() {
    console.log('Signin form open');
  }
  submit() {
    console.log('form: ', this.signinForm.value);
    this.isProcessing = true;
    if (this.signinForm.valid) {
      this.userService.createUser(this.signinForm.value).subscribe(
        (result) => {
          // console.log('result: ', result);
          this.isProcessing = false;
        },
        (err) => {
          console.log('Error: ', err);
          this.msb.open(err.error.message, 'X', { duration: 4000 });
          this.isProcessing = false;
        }
      );
    }
  }
  toggle() {
    this.emitToggle.emit();
  }
}
