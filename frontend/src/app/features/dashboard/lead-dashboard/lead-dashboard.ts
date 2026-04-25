import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Lead, LeadService } from '../../../services/lead';

type LeadStatus = Lead['status'];

@Component({
  selector: 'app-lead-dashboard',
  imports: [FormsModule, RouterLink],
  templateUrl: './lead-dashboard.html',
  styleUrl: './lead-dashboard.css',
})
export class LeadDashboard implements OnInit {
  leads: Lead[] = [];
  statuses: LeadStatus[] = ['new', 'contacted', 'converted', 'rejected'];
  loading = true;
  error = '';
  success = '';
  updatingLeadId: number | null = null;

  constructor(private leadService: LeadService) {}

  ngOnInit() {
    this.loadLeads();
  }

  loadLeads() {
    this.loading = true;
    this.error = '';
    this.success = '';

    this.leadService.getLeads().subscribe({
      next: (leads) => {
        this.leads = leads;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.error =
          error.status === 401
            ? 'Login to view your leads.'
            : 'Could not load leads. Founder accounts can manage leads here.';
      },
    });
  }

  updateStatus(lead: Lead, event: Event) {
    const status = (event.target as HTMLSelectElement).value as LeadStatus;
    this.error = '';
    this.success = '';
    this.updatingLeadId = lead.id;

    this.leadService.updateLead(lead.id, { status }).subscribe({
      next: (updatedLead) => {
        lead.status = updatedLead.status;
        this.updatingLeadId = null;
        this.success = 'Lead status updated.';
      },
      error: () => {
        this.updatingLeadId = null;
        this.error = 'Could not update status. Only founders can update leads for their products.';
      },
    });
  }
}
