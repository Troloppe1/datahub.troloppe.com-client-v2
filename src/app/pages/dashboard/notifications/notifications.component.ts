import { AsyncPipe, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { NotificationsService } from '@core/services/dashboard/notifications.service';
import { MyMatIconComponent } from '@shared/components/my-mat-icon/my-mat-icon.component';
import { PaneNavigatorPanelComponent } from '@core/components/dashboard/pane-navigator-panel/pane-navigator-panel.component';
import { ModalService } from '@shared/services/modal.service';
import { UtilsService } from '@shared/services/utils.service';
import { ConfirmModalComponent } from '@core/components/dashboard/modals/confirm-modal/confirm-modal.component';
import { routeFadeInOut } from '@shared/animations';
import { NotificationPaneComponent } from '@core/components/dashboard/notification-pane/notification-pane.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    MyMatIconComponent,
    PaneNavigatorPanelComponent,
    NotificationPaneComponent,
  ],
  templateUrl: './notifications.component.html',
  animations: [routeFadeInOut],
  host: {
    '[@routeFadeInOut]': 'true',
    '[style.display]': "'contents'",
  },
})
export class NotificationsComponent {
  allNotifications: NotificationType[] | undefined = undefined;
  error: string | null = null;
  activePane: NotificationsPaneType = 'unread';
  confirmDeleteAllNotificationsModalPropsData: ConfirmModalPropsType = {
    matIconName: 'delete',
    title: 'Confirm Delete',
    message: 'Are you sure you want to delete all notifications?',
    ok: () => {
      this.ns.deleteAll().subscribe();
    },
  };

  get unreadNotifications(): NotificationType[] | undefined {
    return this.allNotifications?.filter((value) => !value.is_read);
  }

  get activeNotifications() {
    return this.activePane === 'unread'
      ? this.unreadNotifications
      : this.allNotifications;
  }

  get tabs() {
    return [
      {
        pane: 'unread',
        tabLabel: `Unread (${this.unreadNotificationSum})`,
      },
      {
        pane: 'all',
        tabLabel: `All (${this.allNotificationSum})`,
      },
    ];
  }

  private get allNotificationSum(): number {
    const allNotifications = this.allNotifications;
    return allNotifications ? allNotifications.length : 0;
  }

  private get unreadNotificationSum(): number {
    const unreadNotifications = this.unreadNotifications;
    return unreadNotifications ? unreadNotifications.length : 0;
  }

  constructor(
    public utils: UtilsService,
    public ns: NotificationsService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.ns.notifications$.subscribe({
      next: (notifications) => {
        this.error = null;
        this.allNotifications = notifications;
      },
      error: (err) => {
        this.error = err;
        this.allNotifications = undefined;
      },
    });
  }

  deleteAll() {
    this.modalService.open(
      ConfirmModalComponent,
      this.confirmDeleteAllNotificationsModalPropsData,
    );
  }
}
