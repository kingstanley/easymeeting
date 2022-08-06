import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'meet-signin',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit {
  signinForm: FormGroup;
  isProcessing = false;
  @Output() emitToggle = new EventEmitter(true);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signinForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    console.log('Signin form open');
  }
  submit() {
    console.log('form: ', this.signinForm.value);
    this.authService.signin(this.signinForm.value).subscribe((result) => {
      console.log('login result: ', result);
      if (result.token) this.authService.setToken(result.token);
      this.authService.setUser(result);
      this.router.navigate(['/meeting']);
    });
  }
  toggle() {
    this.emitToggle.emit();
  }
}
