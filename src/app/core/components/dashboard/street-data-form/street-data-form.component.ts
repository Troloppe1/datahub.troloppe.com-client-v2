import {
  Component,
  Input,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { InputFieldComponent } from '@shared/components/input-field/input-field.component';
import { ImageUploaderComponent } from '../image-uploader/image-uploader.component';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UtilsService } from '@shared/services/utils.service';
import { NgIf } from '@angular/common';
import { FormSubmitBtnComponent } from '@shared/components/form-submit-btn/form-submit-btn.component';
import { MyMatIconComponent } from '@shared/components/my-mat-icon/my-mat-icon.component';
import { SelectDropdownComponent } from '@shared/components/select-dropdown/select-dropdown.component';
import { FormFieldDataService } from '@core/services/dashboard/form-field-data.service';
import { constructionStatusOptions } from 'app/fixtures/street-data';
import { ActiveLocationService } from '@core/services/dashboard/active-location.service';

@Component({
  selector: 'street-data-form',
  standalone: true,
  imports: [
    InputFieldComponent,
    ImageUploaderComponent,
    ReactiveFormsModule,
    NgIf,
    FormSubmitBtnComponent,
    MyMatIconComponent,
    SelectDropdownComponent,
  ],
  templateUrl: './street-data-form.component.html',
  styles: `
    :host{
      display: contents
    }
  `,
})
export class StreetDataFormComponent {
  @ViewChildren('imageUploaderRef, inputFieldRefs, selectDropdownRefs')
  inputRefs!: QueryList<{ control: FormControl; focus: () => void }>;

  @Input({ required: true }) streetDataFormGroup!: FormGroup;
  @Input({ required: true }) type!: StreetDataFormType;
  @Input() onSubmit!: (event: SubmitEvent) => void;

  @Input() geolocation = '';
  @Input() creator = '';
  @Input() createdAt = '';
  @Input() isPermitted = false;

  constructionStatusOptions: OptionType[] = constructionStatusOptions;
  formIsSubmitting = false;
  subSectorPending = false;
  uniqueCodeDataList!: Array<string>;
  sectionOptions: IdAndNameType[] = [];
  sectorOptions: IdAndNameType[] = [];
  subSectorOptions: IdAndNameType[] = [];
  subSectorLabel = '';
  isImageLoading = false;

  selectedSectorId!: number;

  fixedLocationId!: number;
  private formFieldData!: StreetDataFormFieldDataInterface;
  private readonly STORAGE_KEY = 'streetDataForm';

  constructor(
    public utils: UtilsService,
    private streetDataFormFieldService: FormFieldDataService,
    private activeLocationService: ActiveLocationService
  ) {}

  ngOnInit(): void {
    // Restore from session storage first
    this.restoreFormFromStorage();

    //  Loads sector and subsector
    const restoredSectorId = this.streetDataFormGroup.get('sector')?.value;
    if (restoredSectorId) {
      this.selectedSectorId = +restoredSectorId;
      this.setSubSectorOptions(this.selectedSectorId);
    }
    this.setLocationField();
    this.getUniqueCodeDataList();
    this.getFormFieldDataAndSetsOptionsValueFromAPI();
    this.handleSomeSectorSelections();

    // Save to storage whenever form changes
    this.streetDataFormGroup.valueChanges.subscribe(() => {
      this.saveFormToStorage();
    });
  }


  onSectorChange(sector: IdAndNameType) {
    this.selectedSectorId = sector.id;
    this.subSectorPending = true;
    this.streetDataFormGroup.patchValue({
      sector: this.selectedSectorId,
      sectorId: this.selectedSectorId,
      sub_sector: null,
      construction_status: null
    })
    this.streetDataFormGroup.get('sector')?.setValue(this.selectedSectorId);
    this.streetDataFormGroup.get('sector_id')?.setValue(this.selectedSectorId);
    this.streetDataFormGroup.get('sub_sector')?.setValue(null);
    this.streetDataFormGroup.get('construction_status')?.setValue(null);
    this.handleSomeSectorSelections();
    this.saveFormToStorage();
  }

  onSubSectorChange(subSector: IdAndNameType) {
    this.streetDataFormGroup.get('sub_sector')?.setValue(subSector.id);
    this.streetDataFormGroup.get('sub_sector_id')?.setValue(subSector.id);
    this.saveFormToStorage();
  }

  onSectionChange(section: IdAndNameType) {
    this.streetDataFormGroup.controls['section_id']?.setValue(section.id);
    this.streetDataFormGroup.controls['section']?.setValue(section.id);
    this.saveFormToStorage();
  }

  private handleSomeSectorSelections() {
    // When Others option is selected
    if (this.selectedSectorId > 0) {
      this.setSubSectorOptions(this.selectedSectorId);
    } else {
      this.addNewSectorField();
    }

    // When Land option is selected
    const constructionStatusCtrl = this.streetDataFormGroup.get(
      'construction_status'
    );
    if (this.selectedSectorId != 4) {
      constructionStatusCtrl?.setValidators(Validators.required);
    } else {
      constructionStatusCtrl?.clearValidators();
    }

    // When Residential option is selected
    const numberOfUnitsCtrl = this.streetDataFormGroup.get('number_of_units');
    const sizeCtrl = this.streetDataFormGroup.get('size');
    if (this.selectedSectorId != 1) {
      sizeCtrl?.setValidators(Validators.required);
      numberOfUnitsCtrl?.clearValidators();
    } else {
      numberOfUnitsCtrl?.setValidators(Validators.required);
      sizeCtrl?.clearValidators();
    }
  }

  handleSubmit(ev: SubmitEvent) {
    this.focusOnError();
    this.saveFormToStorage();
    this.onSubmit(ev);
  }

  private focusOnError() {
    const erroredInput = this.inputRefs.find((inputRef) =>
      inputRef.control.errors ? true : false
    );

    erroredInput?.focus()
  }

  private getFormFieldDataAndSetsOptionsValueFromAPI() {
    this.streetDataFormFieldService
      .getFormFieldData()
      .subscribe((formFieldData) => {
        if (formFieldData) {
          this.formFieldData = formFieldData;

          // Set fixed location ID
          const locationId = this.streetDataFormGroup.get('location_id')?.value;
          if (locationId) this.fixedLocationId = locationId;

          this.setSectorOptions();
          this.setSectionOptions();

          // Set selected sector ID
          const selectedSectorId =
            this.streetDataFormGroup.get('sector')?.value;
            if (selectedSectorId) {
              this.selectedSectorId = +selectedSectorId;
              this.setSubSectorOptions(this.selectedSectorId);
            }
        }
      });
  }

  private getUniqueCodeDataList() {
    this.streetDataFormFieldService
      .getFormFieldData()
      .subscribe((formFieldData) => {
        if (formFieldData) {
          this.uniqueCodeDataList = formFieldData.unique_codes.map(
            (uniqueCode) => uniqueCode.value
          );
        }
      });
  }

  private setSectionOptions() {
    const fixedLocation = this.formFieldData.locations.find(
      (location) => location.id === this.fixedLocationId
    );
    if (fixedLocation) {
      this.sectionOptions = fixedLocation.sections;
    }
  }

  private setSectorOptions() {
    const sectionOptions = this.formFieldData.sectors.map((sector) => ({
      ...sector,
      name: sector.name,
    }));
    this.sectorOptions = [...sectionOptions, { id: 0, name: 'Others' }];
  }

  /**
   * Removes New Sector Control,  adds Sub Sector Control and
   * sets sub sector options
   */
  private setSubSectorOptions(sectorId: number) {
    const newSectorControl = this.streetDataFormGroup.get('new_sector');
    if (newSectorControl) {
      this.streetDataFormGroup.removeControl('new_sector');
    }
    if (this.formFieldData) {
      const selectedSector = this.formFieldData.sectors.find(
        (sector) => sector.id === +sectorId
      );

      if (selectedSector && selectedSector.id > 0) {
        this.subSectorOptions = selectedSector.sub_sectors;

        if (this.subSectorOptions && this.subSectorOptions.length > 0) {
          this.subSectorLabel = selectedSector.name + ' Sub Sector';
          if (this.type !== 'view') {
            this.streetDataFormGroup
              .get('sub_sector')
              ?.setValidators([Validators.required]);
          }
        }
      }
    }
    setTimeout(() => {
      this.subSectorPending = false;
    }, 1000);
  }

  /**
   * Clear Sub Sector Validations and adds New Sector Control
   */
  private addNewSectorField() {
    const subSectorControl = this.streetDataFormGroup.get('sub_sector');

    if (subSectorControl) {
      subSectorControl.clearValidators();
    }

    this.streetDataFormGroup.addControl(
      'new_sector',
      new FormControl('', [Validators.required])
    );
    setTimeout(() => {
      this.subSectorPending = false;
    }, 1000);
  }
  private setLocationField() {
    if (this.type.includes('create')) {
      this.activeLocationService.getActiveLocation().subscribe((location) => {
        this.streetDataFormGroup.get('location')?.setValue(location?.name);
        this.fixedLocationId = location?.id as number;
        this.saveFormToStorage();
      });
    }
  }

  /**
    *  Session Storage Persistence
    */
  private saveFormToStorage() {
    const val = this.streetDataFormGroup.value;
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.streetDataFormGroup.value));
  }

  private restoreFormFromStorage() {
    const saved = sessionStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.streetDataFormGroup.patchValue(parsed, { emitEvent: false });
        this.saveFormToStorage();
      } catch (e) {
        console.warn('Failed to restore form data from sessionStorage', e);
      }
    }
  }
}
