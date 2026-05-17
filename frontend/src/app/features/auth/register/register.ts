import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService, RegisterPayload } from '../../../services/auth';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  form: RegisterPayload = {
    username: '',
    password: '',
    role: 'buyer',
    linkedin_profile: '',
  };
  error = '';
  loading = false;
  returnUrl = '/products';

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/products';
  }

  submit() {
    this.error = '';
    this.loading = true;

    this.auth.register(this.form).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.returnUrl } });
      },
      error: () => {
        this.loading = false;
        this.error = 'Could not create account. Try a different username.';
      },
    });
  }
}
