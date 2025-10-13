import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TextButtonComponent } from '@core/components/dashboard/text-btn/text-btn.component';
import { ConfirmModalComponent } from '@core/components/dashboard/modals/confirm-modal/confirm-modal.component';
import { ModalService } from '@shared/services/modal.service';
import { StreetDataDetails } from '@core/classes/street-data-details';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { constructionStatusOptions } from 'app/fixtures/street-data';
import { AlertService } from '@shared/services/alert.service';
import { BackBtnComponent } from '@shared/components/back-btn/back-btn.component';
import { visibleTrigger } from '@shared/animations';
import { StreetDataFormComponent } from '@core/components/dashboard/street-data-form/street-data-form.component';
import { PermissionService } from '@shared/services/permission.service';

@Component({
  selector: 'app-edit-street-data',
  standalone: true,
  imports: [
    TextButtonComponent,
    NotFoundComponent,
    BackBtnComponent,
    StreetDataFormComponent,
    CommonModule
  ],
  templateUrl: './edit.component.html',
  animations: [visibleTrigger]
})
export class EditComponent extends StreetDataDetails {
  confirmDeleteModalPropsData: ConfirmModalPropsType = {
    matIconName: 'delete',
    title: 'Confirm Delete',
    message: 'Are you sure you want to delete this street data record?',
    ok: () => {
      this.loader.start();
      this.streetDataService.delete(this.streetData.id as number).subscribe({
        next: () => {
          this.alert.success('Success','Street Data deleted successfully.');
          this.loader.stop();
        },
        error: (error) => {
          this.alert.error('Error', error.message);
          this.loader.stop();
        },
      });
    },
  };

  confirmEditModalPropsData: ConfirmModalPropsType = {
    matIconName: 'edit',
    title: 'Confirm Edit',
    message: 'Are you sure you want to edit this street data record?',
    ok: () => {
      const data = { ...this.streetDataFormGroup.value };
      data['image_path'] = this.streetDataFormGroup.get('image_path')?.value;
      this.loader.start();
      this.streetDataService.edit(data, data.id).subscribe({
        next: () => {
          this.alert.success('Success', 'Street Data updated successfully.');
          this.loader.stop();
          this.location.back()
        },
        error: (error) => {
          this.alert.error('Error', error.message);
          this.loader.stop();
        },
      });
    },
  };

  uniqueCodeDataList!: Array<string>;
  formIsSubmitting = false;
  locationOptions: IdAndNameType[] = [];
  sectionOptions: IdAndNameType[] = [];
  sectorOptions: IdAndNameType[] = [];
  subSectorOptions: IdAndNameType[] = [];
  constructionStatusOptions: OptionType[] = constructionStatusOptions;
  isImageLoading = false;

  subSectorPending = false
  subSectorLabel = ''

  constructor(
    private modalService: ModalService,
    private fb: FormBuilder,
    private alert: AlertService,
    private location: Location,
    public permission: PermissionService

  ) {
    super();
    this.streetDataFormGroup = this.fb.group(
      {
        id: [''],
        image_path: [
          {
            value: '',
            disabled: true,
          },
          [Validators.required],
        ],
        unique_code: ['', [Validators.required]],
        street_address: ['', [Validators.required]],
        development_name: [''],
        location: [{ value: '', disabled: true }, [Validators.required]],
        location_id: [{ value: 0 }],
        sector: ['', [Validators.required]],
        sector_id: [{ value: 0 }],
        sub_sector: [''],
        sub_sector_id: [{ value: 0 }],
        description: ['', [Validators.required]], // *
        section: ['', [Validators.required]],
        section_id: [null, [Validators.required]],

        number_of_units: [null], // *
        size:[null],
        contact_name: [''],
        contact_numbers: [''],
        contact_email: ['', [Validators.email]],
        construction_status: ['', [Validators.required]],
        is_verified: [false],
        geolocation: [''],
        creator: [''],
        created_at: [''],
      },
      { updateOn: 'submit' }
    );
  }

  ngOnInit(): void {
    this.setStreetDataId();
    this.initFormDataAndSomeProperties('edit');
    this.checkDataIsLoaded();
    this.setPermission()
  }

  onDeleteStreetData() {
    this.modalService.open(
      ConfirmModalComponent,
      this.confirmDeleteModalPropsData
    );
  }

  onEditStreetData() {
    // this.formSubmit.onFormSubmission()
    if (this.streetDataFormGroup.valid) {
      this.modalService.open(
        ConfirmModalComponent,
        this.confirmEditModalPropsData
      );
    } else {
      this.alert.error(
        'Form Error','Check that all fields are correctly filled.'
      );
    }
  }
}
