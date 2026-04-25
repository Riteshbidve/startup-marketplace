import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product, ProductService } from '../../../services/product';

@Component({
  selector: 'app-product-list',
  imports: [RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  products: Product[] = [];
  error = '';
  loading = true;

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.error = '';
    this.loading = true;

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.error = error.status === 401 ? 'Login to view products.' : 'Could not load products.';
      },
    });
  }
}
