import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { apiUrlFactory } from '@configs/global';
import { ConfirmModalComponent } from '@core/components/dashboard/modals/confirm-modal/confirm-modal.component';
import { FormSubmissionService } from '@shared/services/form-submission.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ModalService } from './modal.service';
import { LoaderService } from '@shared/services/loader.service';
import { AlertService } from '@shared/services/alert.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ListingsAgentsService {

  private formGroup!: FormGroup;
  private destroy$ = new Subject<void>()


  constructor(
    private readonly httpClient: HttpClient,
    private readonly formSubmissionService: FormSubmissionService,
    private fb: FormBuilder,
    private modalService: ModalService,
    private loaderService: LoaderService,
    private alertService: AlertService,
    private router: Router
  ) {
    this.formGroup = this.fb.group({
      id: ['', Validators.required],
      name: ['', [Validators.required]],
      address: [''],
      phone_numbers: [''],
      email: [''],
      website: [''],
      note: ['']
    })
  }

  getFormGroup(data: any = null) {
    if (data) {
      this.formGroup.patchValue(data)
    }
    return this.formGroup
  }

  apiGetAllListingAgents() {
    const url = apiUrlFactory('/external-listings/agents')
    return this.httpClient.get<{ success: boolean, message: string, data: any }>(url)
  }

  apiGetListingAgentById(id: number, onlyListings = false) {
    const url = apiUrlFactory(`/external-listings/agents/${id}`, { only_listings: onlyListings })
    return this.httpClient.get<{ success: boolean, message: string, data: any }>(url)
  }

  apiUpdateListingAgentById(id: number, data: any) {
    const url = apiUrlFactory(`/external-listings/agents/${id}`)
    return this.httpClient.put<{ success: boolean, message: string, data: any }>(url, data)
  }


  updateAgent(id: number) {
    this.formSubmissionService.onFormSubmission(this.formGroup);
    if (this.formGroup.valid) {

      this.modalService.open(ConfirmModalComponent, {
        matIconName: 'description',
        title: 'Confirm Data Submission',
        message: 'Proceed if you are sure this form was correctly filled.',
        severity: 'warning',
        ok: async () => {
          this.loaderService.start()
          const data = this.formGroup.value

          this.apiUpdateListingAgentById(id, data)
            .subscribe(
              {
                next: (v) => {
                  const newRecord = v.data
                  this.alertService.success(
                    'Success',
                    v.message
                  );
                  this.router.navigateByUrl(
                    `/dashboard/external-listings/agents/${newRecord.id}`,
                    newRecord
                  );
                },
                error: (err) => {
                  console.error(err)
                  this.alertService.error('Error', `An error occured while updating this listing agent`)
                },
                complete: () => {
                  setTimeout(this.loaderService.stop.bind(this.loaderService), 3000)
                }
              }
            )
        }
      })

    }
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
