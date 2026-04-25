import { Routes } from '@angular/router';

import { Login } from './features/auth/login/login';
import { ProductList } from './features/discovery/product-list/product-list';
import { Register } from './features/auth/register/register';

export const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'products', component: ProductList },
  { path: '**', redirectTo: 'products' },
];
