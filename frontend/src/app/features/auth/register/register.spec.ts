import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Register } from './register';
import { AuthService } from '../../../services/auth';

describe('Register Component', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed
      .configureTestingModule({
        imports: [Register],
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
      })
      .overrideComponent(Register, {
        set: {
          template: '',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize default form values', () => {
    expect(component.form.username).toBe('');
    expect(component.form.password).toBe('');
    expect(component.form.role).toBe('buyer');
    expect(component.form.linkedin_profile).toBe('');
  });

  it('should use default returnUrl', () => {
    expect(component.returnUrl).toBe('/products');
  });

  it('should call register service with form data', () => {
    authServiceSpy.register.and.returnValue(of({}));

    component.form = {
      username: 'ritesh',
      password: 'Password123',
      role: 'buyer',
      linkedin_profile: 'https://linkedin.com/in/ritesh',
    };

    component.submit();

    expect(authServiceSpy.register).toHaveBeenCalledWith(component.form);
  });

  it('should navigate to login page on successful registration', () => {
    authServiceSpy.register.and.returnValue(of({}));

    component.submit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: {
        returnUrl: '/products',
      },
    });
  });

  it('should show error message when registration fails', () => {
    authServiceSpy.register.and.returnValue(throwError(() => new Error('Registration Failed')));

    component.submit();

    expect(component.error).toBe('Could not create account. Try a different username.');

    expect(component.loading).toBeFalse();
  });

  it('should clear previous error before submit', () => {
    component.error = 'Old Error';

    authServiceSpy.register.and.returnValue(of({}));

    component.submit();

    expect(component.error).toBe('');
  });

  it('should stop loading after successful registration', () => {
    authServiceSpy.register.and.returnValue(of({}));

    component.submit();

    expect(component.loading).toBeFalse();
  });

  it('should stop loading after failed registration', () => {
    authServiceSpy.register.and.returnValue(throwError(() => new Error()));

    component.submit();

    expect(component.loading).toBeFalse();
  });

});
