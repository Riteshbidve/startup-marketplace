import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LeadForm } from '../lead-form/lead-form';
import { Product, ProductService } from '../../../services/product';

@Component({
  selector: 'app-product-list',
  imports: [LeadForm, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  products: Product[] = [];
  error = '';
  loading = true;
  selectedProduct: Product | null = null;
  success = '';

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.error = '';
    this.success = '';
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

  openLeadForm(product: Product) {
    this.success = '';
    this.selectedProduct = product;
  }

  closeLeadForm() {
    this.selectedProduct = null;
  }

  handleLeadSubmitted() {
    this.success = 'Lead submitted. The founder can now follow up with you.';
    this.selectedProduct = null;
  }
}
