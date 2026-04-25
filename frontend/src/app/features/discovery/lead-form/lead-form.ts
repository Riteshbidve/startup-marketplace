import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CreateLeadPayload, LeadService } from '../../../services/lead';
import { Product } from '../../../services/product';

@Component({
  selector: 'app-lead-form',
  imports: [FormsModule],
  templateUrl: './lead-form.html',
  styleUrl: './lead-form.css',
})
export class LeadForm {
  @Input({ required: true }) product!: Product;
  @Output() close = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  form = {
    name: '',
    email: '',
    company_size: '',
    budget_range: '',
    urgency_level: 3,
  };
  error = '';
  loading = false;

  constructor(private leadService: LeadService) {}

  submit() {
    this.error = '';
    this.loading = true;

    const payload: CreateLeadPayload = {
      ...this.form,
      product: this.product.id,
      urgency_level: Number(this.form.urgency_level),
    };

    this.leadService.createLead(payload).subscribe({
      next: () => {
        this.loading = false;
        this.submitted.emit();
      },
      error: (error) => {
        this.loading = false;
        this.error =
          error.status === 403
            ? 'Only buyer accounts can submit leads.'
            : 'Could not submit lead. Check the fields and try again.';
      },
    });
  }
}
