import { HttpErrorResponse } from "@angular/common/http"
import { Component, OnDestroy } from '@angular/core'
import { FormBuilder, Validators } from "@angular/forms"
import { MatSnackBar } from "@angular/material/snack-bar"
import { Router } from "@angular/router"
import { Subscription } from 'rxjs'
import { LoginResponseType } from "../../../../types/auth-types/login-response.type"
import { SignupType } from "../../../../types/auth-types/signup.type"
import { DefaultResponseType } from "../../../../types/default-response.type"
import { AuthService } from "../../../core/auth/auth.service"

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnDestroy {
  public isPasswordVisible = false
  private subscription: Subscription | null = null

  public signupForm = this.fb.group({
    name: ['', [Validators.required, Validators.pattern('^[А-Я][а-я]+s*$')]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.pattern('^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$')]],
    agree: [false, Validators.requiredTrue],
  })

  get name() {
    return this.signupForm.get('name')
  }

  get email() {
    return this.signupForm.get('email')
  }

  get password() {
    return this.signupForm.get('password')
  }

  get agree() {
    return this.signupForm.get('agree')
  }

  constructor(private fb: FormBuilder,
    private authService: AuthService,
    private _snackBar: MatSnackBar,
    private router: Router,
  ) {
  }

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible
  }

  signup(): void {
    if (this.signupForm.valid &&
      this.signupForm.value.name &&
      this.signupForm.value.email &&
      this.signupForm.value.password &&
      this.signupForm.value.agree) {

      const newObj: SignupType = {
        name: this.signupForm.value.name,
        email: this.signupForm.value.email,
        password: this.signupForm.value.password,
      }

      this.subscription = this.authService.signup(newObj)
        .subscribe({
          next: (data: LoginResponseType | DefaultResponseType) => {
            let error = null
            if ((data as DefaultResponseType).message !== undefined) {
              error = (data as DefaultResponseType).message
            }

            const signupResponse: LoginResponseType = data as LoginResponseType
            if (!signupResponse.accessToken || !signupResponse.refreshToken || !signupResponse.userId) {
              error = `Ошибка при авторизации`
            }

            if (error) {
              this._snackBar.open(error)
              throw new Error(error)
            }

            this.authService.setTokens(signupResponse.accessToken, signupResponse.refreshToken)
            this.authService.userId = signupResponse.userId
            this.authService.getUserInfo()
            this._snackBar.open(`Вы успешно зарегистрировались`)
            this.router.navigate(['/'])
          },
          error: (errorResponse: HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message) {
              this._snackBar.open(errorResponse.error.message)
            } else {
              this._snackBar.open(`Ошибка регистрации`)
            }
          }
        })
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe()
  }

}
