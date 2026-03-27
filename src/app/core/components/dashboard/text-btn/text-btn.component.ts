import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UtilsService } from '@shared/services/utils.service';
import { MyMatIconComponent } from '@shared/components/my-mat-icon/my-mat-icon.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'text-button',
  standalone: true,
  imports: [MyMatIconComponent, NgIf],
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      [name]="name"
      [value]="value"
      [attr.aria-label]="ariaLabel || text"
      [class]="
        utils.cn(
          'btn btn-ghost btn-small text-xs md:text-sm flex items-center gap-1 font-medium tracking-wider',
          class,
          {
            'p-2 py-1 text-xs font-normal': small
          },
          {
            'text-secondary': !state,
            'text-error': state === 'error',
            'text-neutral': state === 'neutral'
          }
        )
      "
      (click)="onClick($event)"
    >
      <my-mat-icon *ngIf="withIcon" class="font-black">{{
        withIcon
      }}</my-mat-icon>
      @if (text) {
        <span [class]="utils.cn({ 'hidden md:inline': isFlexed })">
          @if (small) {
          {{ text }}
          } @else {
          {{ text.toUpperCase() }}
          }
        </span>
      }
    </button>
  `,
})
export class TextButtonComponent {
  @Input() text = '';
  @Input() class = '';
  @Input() ariaLabel = '';
  @Input() type: 'button' | 'submit' | 'reset' | 'menu' = 'button';
  @Input() small = false;
  @Input() withIcon = '';
  @Input() isFlexed = false;
  @Input() disabled = false;
  @Input() state?: 'error' | 'neutral';
  @Input() name = '';
  @Input() value = '';

  @Output() clickEvent = new EventEmitter();

  constructor(public utils: UtilsService) {}

  onClick(event: Event) {
    this.clickEvent.emit(event);
  }
}
