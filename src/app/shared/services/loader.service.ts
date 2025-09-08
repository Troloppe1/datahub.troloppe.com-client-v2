import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  loaderEvent = new BehaviorSubject<{ isOpen: boolean; text: string }>({
    isOpen: false,
    text: '',
  });
  constructor() { }

  start(text: string = '') {
    this.loaderEvent.next({ isOpen: true, text });
  }

  stop() {
    this.loaderEvent.next({ isOpen: false, text: '' });
  }
}
