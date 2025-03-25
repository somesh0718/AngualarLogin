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

interface SurveyQuestionValidation {
  type: string;
  value?: any;
  message: string;
}

interface SurveyQuestion {
  id: string;
  type: 'text' | 'radio' | 'multiselect' | 'number' | 'dropdown';
  question: string;
  required: boolean;
  options?: string[];
  validations?: SurveyQuestionValidation[];
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
    // Expanded survey questions with more fields and types
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
          { type: 'min', value: 0, message: 'Age must be a positive number' },
          { type: 'max', value: 120, message: 'Must be less than 120 years old' }
        ]
      },
      {
        id: 'gender',
        type: 'radio',
        question: 'What is your gender?',
        required: true,
        options: ['Male', 'Female', 'Non-Binary', 'Prefer not to say'],
        validations: [
          { type: 'required', message: 'Please select a gender' }
        ]
      },
      {
        id: 'country',
        type: 'dropdown',
        question: 'What is your country of residence?',
        required: true,
        options: [
          'United States', 'Canada', 'United Kingdom', 'Australia', 
          'Germany', 'France', 'Japan', 'India', 'Brazil', 'Other'
        ],
        validations: [
          { type: 'required', message: 'Country is required' }
        ]
      },
      {
        id: 'interests',
        type: 'multiselect',
        question: 'Select your areas of interest',
        required: false,
        options: ['Technology', 'Sports', 'Music', 'Travel', 'Reading', 'Cooking'],
        validations: []
      },
      {
        id: 'feedback',
        type: 'text',
        question: 'Additional comments or feedback',
        required: false,
        validations: [
          { type: 'maxlength', value: 500, message: 'Feedback must be less than 500 characters' }
        ]
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
          switch (validation.type) {
            case 'minlength':
              validators.push(Validators.minLength(validation.value));
              break;
            case 'maxlength':
              validators.push(Validators.maxLength(validation.value));
              break;
            case 'min':
              validators.push(Validators.min(validation.value));
              break;
            case 'max':
              validators.push(Validators.max(validation.value));
              break;
            case 'pattern':
              validators.push(Validators.pattern(validation.value));
              break;
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
    
    // Find and return appropriate error message based on validation type
    const errorTypes = [
      'required', 'minlength', 'maxlength', 
      'min', 'max', 'pattern'
    ];
    
    for (const errorType of errorTypes) {
      if (control.errors[errorType]) {
        const validationError = question.validations?.find(v => v.type === errorType);
        return validationError?.message || `Invalid ${errorType} validation`;
      }
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
    
    // Store user details in localStorage
    localStorage.setItem('userDetails', JSON.stringify({
      name: this.surveyForm.get('name')?.value,
      age: this.surveyForm.get('age')?.value,
      gender: this.surveyForm.get('gender')?.value,
      country: this.surveyForm.get('country')?.value,
      interests: this.surveyForm.get('interests')?.value,
      feedback: this.surveyForm.get('feedback')?.value
    }));
    
    // Save all survey responses to localStorage
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