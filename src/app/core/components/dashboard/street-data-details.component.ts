import { FormGroup } from '@angular/forms';
import { UserRoles } from '@shared/enums/user-roles';
import { StreetDataService } from '@core/services/dashboard/street-data.service';
import { ActivatedRoute } from '@angular/router';
import { PermissionService } from '@shared/services/permission.service';
import { Component, EventEmitter, inject, Input } from '@angular/core';
import { UtilsService } from '@shared/services/utils.service';
import { LoaderService } from '@shared/services/loader.service';

@Component({
  selector: 'app-street-data-details',
  template: '',
})
export class StreetDataDetailsComponent {
  @Input({required:true}) streetDataId!: number;
  streetDataFormGroup!: FormGroup;
  isPermitted = false;
  streetData!: StreetData;
  geolocation = '';
  creator = '';
  createdAt = '';
  dataIsLoaded = false;
  dataNotFound = false;


  public utils = inject(UtilsService);
  protected streetDataService = inject(StreetDataService);
  protected loader = inject(LoaderService);
  public permissionService = inject(PermissionService);

  dataLoadedEvent = new EventEmitter();

  constructor() {}

  protected initFormDataAndSomeProperties(formType: Exclude<StreetDataFormType, 'new-create' | 'existing-create'> = 'view') {
    this.streetDataService.getStreetDataDetails(this.streetDataId).subscribe({
      next: (value) => {
        setTimeout(() => {
          if (value) {
            this.streetData = this.streetDataService.parseStreetDataForForm(value, formType) as StreetData
            this.streetDataFormGroup.patchValue(this.streetData);
            this.geolocation = decodeURIComponent(value.geolocation);
            this.creator = value.creator;
            this.createdAt = this.utils.utcToFormattedDate(value.created_at);
          }
          this.dataIsLoaded = true;
          this.dataLoadedEvent.emit(this.dataIsLoaded);
        });
      },
      error: (error) => {
        if (error.status === 404) {
          this.dataNotFound = true;
        }
      },
    });
  }

  protected setPermission() {
    this.isPermitted = this.permissionService.isPermitted([
      UserRoles.Admin,
      UserRoles.ResearchManager,
    ]);
  }

  protected checkDataIsLoaded() {
    this.dataLoadedEvent.asObservable().subscribe((value) => {
      if (value) {
        this.loader.stop();
      }
    });
  }
}
