import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CreateProductPayload, ProductService } from '../../../services/product';

@Component({
  selector: 'app-create-product',
  imports: [FormsModule, RouterLink],
  templateUrl: './create-product.html',
  styleUrl: './create-product.css',
})
export class CreateProduct {
  form: CreateProductPayload = {
    name: '',
    description: '',
    problem_statement: '',
    website_url: '',
    video_url: '',
  };
  error = '';
  loading = false;

  constructor(
    private productService: ProductService,
    private router: Router,
  ) {}

  submit() {
    this.error = '';
    this.loading = true;

    this.productService.createProduct(this.form).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/products']);
      },
      error: (error) => {
        this.loading = false;
        this.error =
          error.status === 403
            ? 'Only founder accounts can create products.'
            : 'Could not create product. Check the fields and try again.';
      },
    });
  }
}
