import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { LeadForm } from '../lead-form/lead-form';
import { Product, ProductService } from '../../../services/product';

@Component({
  selector: 'app-product-detail',
  imports: [LeadForm, RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit {
  product: Product | null = null;
  error = '';
  loading = true;
  showLeadForm = false;
  success = '';

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'Product not found.';
      this.loading = false;
      return;
    }

    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load product.';
        this.loading = false;
      },
    });
  }

  openLeadForm() {
    this.success = '';
    this.showLeadForm = true;
  }

  closeLeadForm() {
    this.showLeadForm = false;
  }

  handleLeadSubmitted() {
    this.success = 'Lead submitted. The founder can now follow up with you.';
    this.showLeadForm = false;
  }
}
