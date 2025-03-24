import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';

interface SurveyQuestion {
  id: string;
  type: 'text' | 'radio' | 'multiselect' | 'number';
  question: string;
  required: boolean;
  options?: string[];
  validations?: {
    type: string;
    value?: any;
    message: string;
  }[];
}


@Component({
  selector: 'app-survey',
  standalone: true,
  imports: [
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatRadioModule,
    MatSelectModule,
    MatToolbarModule,
    ReactiveFormsModule,
    NgIf,
    NgFor
  ],
  templateUrl: './survey.component.html',
  styleUrl: './survey.component.css'
})
export class SurveyComponent {
  surveyForm!: FormGroup;
  surveyQuestions: SurveyQuestion[] = [];
  currentUser: any;
  submitted = false;
  successMessage = '';

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    // Check if user is logged in
    const user = localStorage.getItem('currentUser');
    if (!user) {
      this.router.navigate(['/sign-in']);
      return;
    }
    
    this.currentUser = JSON.parse(user);
    
    // Load survey questions from JSON
    this.loadSurveyQuestions();
    
    // Create form based on survey questions
    this.createForm();
  }

  loadSurveyQuestions(): void {
    // In a real app, you might fetch this from an API
    this.surveyQuestions = [
      {
        id: 'name',
        type: 'text',
        question: 'What is your full name?',
        required: true,
        validations: [
          { type: 'required', message: 'Name is required' },
          { type: 'minlength', value: 3, message: 'Name must be at least 3 characters' }
        ]
      },
      {
        id: 'age',
        type: 'number',
        question: 'What is your age?',
        required: true,
        validations: [
          { type: 'required', message: 'Age is required' },
          { type: 'min', value: 18, message: 'Must be at least 18 years old' },
          { type: 'max', value: 120, message: 'Must be less than 120 years old' }
        ]
      },
      {
        id: 'satisfaction',
        type: 'radio',
        question: 'How satisfied are you with our service?',
        required: true,
        options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
        validations: [
          { type: 'required', message: 'Please select an option' }
        ]
      },
      {
        id: 'improvements',
        type: 'multiselect',
        question: 'Which areas do you think we should improve?',
        required: false,
        options: ['User Interface', 'Performance', 'Features', 'Customer Support', 'Documentation'],
        validations: []
      },
      {
        id: 'feedback',
        type: 'text',
        question: 'Do you have any additional feedback for us?',
        required: false,
        validations: []
      }
    ];
  }

  createForm(): void {
    const formGroup: { [key: string]: FormControl } = {};
    
    this.surveyQuestions.forEach(question => {
      const validators: ValidatorFn[] = [];
      
      if (question.required) {
        validators.push(Validators.required);
      }
      
      if (question.validations) {
        question.validations.forEach(validation => {
          if (validation.type === 'minlength') {
            validators.push(Validators.minLength(validation.value));
          } else if (validation.type === 'min') {
            validators.push(Validators.min(validation.value));
          } else if (validation.type === 'max') {
            validators.push(Validators.max(validation.value));
          } else if (validation.type === 'pattern') {
            validators.push(Validators.pattern(validation.value));
          }
        });
      }
      
      // Initialize with empty value for text/number, empty array for multiselect
      const initialValue = question.type === 'multiselect' ? [] : '';
      formGroup[question.id] = new FormControl(initialValue, validators);
    });
    
    this.surveyForm = this.fb.group(formGroup);
  }

  getErrorMessage(questionId: string): string {
    const control = this.surveyForm.get(questionId);
    if (!control || !control.errors || !control.touched) return '';
    
    const question = this.surveyQuestions.find(q => q.id === questionId);
    if (!question) return '';
    
    if (control.errors['required']) {
      return question.validations?.find(v => v.type === 'required')?.message || 'This field is required';
    }
    
    if (control.errors['minlength']) {
      return question.validations?.find(v => v.type === 'minlength')?.message || 'Minimum length not met';
    }
    
    if (control.errors['min']) {
      return question.validations?.find(v => v.type === 'min')?.message || `Must be at least ${question.validations?.find(v => v.type === 'min')?.value}`;
    }
    
    if (control.errors['max']) {
      return question.validations?.find(v => v.type === 'max')?.message || `Must be at most ${question.validations?.find(v => v.type === 'max')?.value}`;
    }
    
    if (control.errors['pattern']) {
      return question.validations?.find(v => v.type === 'pattern')?.message || 'Invalid format';
    }
    
    return 'Invalid input';
  }

  onSubmit(): void {
    this.submitted = true;
    
    if (this.surveyForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.surveyForm.controls).forEach(key => {
        this.surveyForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    // Get survey responses
    const surveyResponses = {
      userId: this.currentUser.email,
      timestamp: new Date().toISOString(),
      responses: this.surveyForm.value
    };
    
    // Save to local storage
    const allResponses = JSON.parse(localStorage.getItem('surveyResponses') || '[]');
    allResponses.push(surveyResponses);
    localStorage.setItem('surveyResponses', JSON.stringify(allResponses));
    
    // Show success message
    this.successMessage = 'Thank you for completing the survey!';
    
    // Reset form after 3 seconds
    setTimeout(() => {
      this.surveyForm.reset();
      this.submitted = false;
      this.successMessage = '';
    }, 3000);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/']);
  }
}
