import { Routes } from '@angular/router';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { SurveyComponent } from './components/survey/survey.component';


export const routes: Routes = [
    { path: '', component: SignInComponent},
    { path: 'survey', component: SurveyComponent },
];
