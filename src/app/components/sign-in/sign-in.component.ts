import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';


@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    ReactiveFormsModule,
    NgIf,
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent {
  isLoginMode = true;
  errorMessage: string = '';
  successMessage: string = '';
  authForm: any;

  constructor(private fb: FormBuilder, private router: Router) {
    this.createForm();
  }

  ngOnInit(): void {}

  createForm(): void {
    if (this.isLoginMode) {
      this.authForm = this.fb.group({
        email: ['', [Validators.required, Validators.email, this.validateEmailFormat]],
        password: ['', [Validators.required, Validators.minLength(6)]]
      });
    } else {
      this.authForm = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email, this.validateEmailFormat]],
        password: ['', [
          Validators.required, 
          Validators.minLength(6),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
        ]],
        confirmPassword: ['', Validators.required]
      }, { validators: this.passwordMatchValidator });
    }
  }

  toggleForm(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.successMessage = '';
    this.createForm();
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  validateEmailFormat(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) {
      return null;
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email) ? null : { invalidEmailFormat: true };
  }

  onSubmit(): void {
    if (this.authForm.invalid) {
      return;
    }

    if (this.isLoginMode) {
      this.login();
    } else {
      this.signup();
    }
  }

  signup(): void {
    const { name, email, password } = this.authForm.value;
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userExists = users.some((user: any) => user.email === email);
    
    if (userExists) {
      this.errorMessage = 'User with this email already exists';
      return;
    }
    
    // Add new user
    users.push({ name, email, password });
    localStorage.setItem('users', JSON.stringify(users));
    
    this.successMessage = 'Registration successful! You can now login.';
    this.errorMessage = '';
    
    // Reset form and switch to login
    setTimeout(() => {
      this.isLoginMode = true;
      this.createForm();
      this.successMessage = '';
    }, 2000);
  }

  login(): void {
    const { email, password } = this.authForm.value;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const user = users.find((u: any) => u.email === email && u.password === password);
    
    if (user) {
      this.errorMessage = '';
      this.successMessage = 'Login successful!';
      
      // Store current user in session
      localStorage.setItem('currentUser', JSON.stringify({ name: user.name, email: user.email }));
      
      // Redirect to survey component after successful login
      setTimeout(() => {
        this.router.navigate(['/survey']);
      }, 1500);
    } else {
      this.errorMessage = 'Invalid email or password';
      this.successMessage = '';
    }
  }

  getPasswordError(): string {
    const control = this.authForm.get('password');
    if (!control || !control.errors) return '';
    
    if (control.errors['required']) return 'Password is required';
    if (control.errors['minlength']) return 'Password must be at least 6 characters';
    if (control.errors['pattern']) return 'Password must contain uppercase, lowercase, number and special character';
    
    return 'Invalid password';
  }
}
