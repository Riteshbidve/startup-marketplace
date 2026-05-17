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
  allProducts: Product[] = [];
  products: Product[] = [];
  error = '';
  loading = true;
  selectedProduct: Product | null = null;
  success = '';
  query = '';
  sort: 'newest' | 'most_requested' = 'newest';
  private searchTimer: number | null = null;

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.error = '';
    this.success = '';
    this.loading = true;

    this.productService.getProducts('', this.sort === 'most_requested' ? 'most_requested' : '').subscribe({
      next: (products) => {
        this.allProducts = products;
        this.products = products;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.error = error.status === 401 ? 'Login to view products.' : 'Could not load products.';
      },
    });
  }

  onQueryChange(value: string) {
    this.query = value;
    this.applyLocalFilter();

    if (this.searchTimer) {
      window.clearTimeout(this.searchTimer);
    }

    // Lightweight debounce so we can also use the backend search without spamming requests.
    this.searchTimer = window.setTimeout(() => {
      const q = this.query.trim();
      if (!q) {
        this.products = this.allProducts;
        return;
      }

      this.productService.getProducts(q).subscribe({
        next: (products) => {
          this.products = products;
        },
        error: () => {
          // If backend search fails, keep the local filter results.
        },
      });
    }, 250);
  }

  onSortChange(value: string) {
    this.sort = value === 'most_requested' ? 'most_requested' : 'newest';
    const sortParam = this.sort === 'most_requested' ? 'most_requested' : '';
    this.productService.getProducts(this.query, sortParam).subscribe({
      next: (products) => {
        this.allProducts = products;
        this.applyLocalFilter();
      },
      error: () => {
        // Leave current results as-is on error.
      },
    });
  }

  applyLocalFilter() {
    const q = this.query.trim().toLowerCase();
    if (!q) {
      this.products = this.allProducts;
      return;
    }

    this.products = this.allProducts.filter((product) => {
      return (
        product.problem_statement.toLowerCase().includes(q) ||
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q)
      );
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
