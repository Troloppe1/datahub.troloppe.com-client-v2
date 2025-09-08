import { Component } from '@angular/core';
import { LoaderService } from '@shared/services/loader.service';
import { LoaderComponent as LoaderC } from '../../loader/loader.component';
import { distinctUntilChanged, Subscription } from 'rxjs';

@Component({
  selector: 'app-loader-provider',
  standalone: true,
  imports: [LoaderC],
  template: `
    @if(isOpen) {
    <div class="z-50">
      <app-loader [text]="text"></app-loader>
    </div>
    }
  `,
})
export class LoaderComponent {
  protected isOpen!: boolean;
  protected text!: string;

  private loaderEventSubscriber!: Subscription;
  constructor(private loader: LoaderService) {}

  ngOnInit(): void {
    this.loaderEventSubscriber = this.loader.loaderEvent.pipe(
    distinctUntilChanged(
      (prev, curr) => prev.isOpen === curr.isOpen && prev.text === curr.text
    )
  ).subscribe((value) => {
      this.isOpen = value.isOpen;
      this.text = value.text;
    });
  }

  ngOnDestroy(): void {
    this.loaderEventSubscriber.unsubscribe();
  }
}
