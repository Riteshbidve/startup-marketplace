import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';

import { LeadForm } from '../lead-form/lead-form';
import { Product, ProductService } from '../../../services/product';
import { Tag, TagService } from '../../../services/tag';

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
  tags: Tag[] = [];
  selectedTagIds: number[] = [];
  currentUrl = '/products';

  constructor(
    private productService: ProductService,
    private tagService: TagService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.currentUrl = this.router.url;

    const qp = this.route.snapshot.queryParamMap;
    this.query = qp.get('search') || '';
    this.sort = (qp.get('sort') as any) === 'most_requested' ? 'most_requested' : 'newest';
    this.selectedTagIds = (qp.get('tags') || '')
      .split(',')
      .map((part) => Number(part))
      .filter((n) => Number.isFinite(n) && n > 0);

    this.tagService.getTags().subscribe({
      next: (tags) => (this.tags = tags),
      error: () => (this.tags = []),
    });

    this.loadProducts();
  }

  loadProducts() {
    this.error = '';
    this.success = '';
    this.loading = true;

    const sortParam = this.sort === 'most_requested' ? 'most_requested' : '';
    this.productService.getProducts(this.query, sortParam, this.selectedTagIds).subscribe({
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
        this.syncUrl();
        return;
      }

      const sortParam = this.sort === 'most_requested' ? 'most_requested' : '';
      this.productService.getProducts(q, sortParam, this.selectedTagIds).subscribe({
        next: (products) => {
          this.products = products;
          this.allProducts = products;
          this.syncUrl();
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
    this.productService.getProducts(this.query, sortParam, this.selectedTagIds).subscribe({
      next: (products) => {
        this.allProducts = products;
        this.applyLocalFilter();
        this.syncUrl();
      },
      error: () => {
        // Leave current results as-is on error.
      },
    });
  }

  toggleTag(tagId: number) {
    if (this.selectedTagIds.includes(tagId)) {
      this.selectedTagIds = this.selectedTagIds.filter((id) => id !== tagId);
    } else {
      this.selectedTagIds = [...this.selectedTagIds, tagId];
    }

    const sortParam = this.sort === 'most_requested' ? 'most_requested' : '';
    this.productService.getProducts(this.query, sortParam, this.selectedTagIds).subscribe({
      next: (products) => {
        this.allProducts = products;
        this.applyLocalFilter();
        this.syncUrl();
      },
      error: () => {},
    });
  }

  clearFilters() {
    this.query = '';
    this.sort = 'newest';
    this.selectedTagIds = [];
    this.syncUrl();
    this.loadProducts();
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

  private syncUrl() {
    const queryParams: any = {};
    const q = this.query.trim();
    if (q) queryParams.search = q;
    if (this.sort === 'most_requested') queryParams.sort = 'most_requested';
    if (this.selectedTagIds.length) queryParams.tags = this.selectedTagIds.join(',');

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true,
    });

    this.currentUrl = this.router.url;
  }
}
