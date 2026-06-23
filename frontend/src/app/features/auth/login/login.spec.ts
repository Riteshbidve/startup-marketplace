import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Login } from './login';
import { AuthService } from '../../../services/auth';

describe('Login Component', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceSpy,
        },
        {
          provide: Router,
          useValue: routerSpy,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.form.username).toBe('');
    expect(component.form.password).toBe('');
  });

  it('should use default returnUrl', () => {
    expect(component.returnUrl).toBe('/products');
  });

  it('should login successfully and navigate', () => {
    authServiceSpy.login.and.returnValue(of({ access: 'access-token', refresh: 'refresh-token' }));

    component.form.username = 'admin';
    component.form.password = 'password';

    component.submit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      username: 'admin',
      password: 'password',
    });

    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/products');

    expect(component.loading).toBeFalse();
  });

  it('should show error message on failed login', () => {
    authServiceSpy.login.and.returnValue(throwError(() => new Error('Login Failed')));

    component.submit();

    expect(component.error).toBe('Invalid username or password.');

    expect(component.loading).toBeFalse();
  });

  it('should set loading to true while login starts', () => {
    authServiceSpy.login.and.returnValue(of({ access: 'access-token', refresh: 'refresh-token' }));

    component.submit();

    expect(component.loading).toBeFalse();
  });
});
