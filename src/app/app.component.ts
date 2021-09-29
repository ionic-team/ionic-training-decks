import { Component, OnInit } from '@angular/core';
import { ApplicationService, MenuItemsService } from '@app/core';
import { NavController, Platform } from '@ionic/angular';
import { FirebaseAnalytics } from '@capacitor-community/firebase-analytics';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  selectedIndex = 0;
  appPages = [];

  constructor(
    private applicationService: ApplicationService,
    private menuItems: MenuItemsService,
    private navController: NavController,
    private platform: Platform
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    if (!this.platform.is('hybrid')) {
      this.applicationService.registerForUpdates();
    }

    await FirebaseAnalytics.initializeFirebase({
      apiKey: 'AIzaSyD9Pz3SsC3yXD_LqE7Ur7WWzppD2_WLTH8',
      authDomain: 'ionic-training-decks.firebaseapp.com',
      databaseURL: 'https://ionic-training-decks.firebaseio.com',
      projectId: 'ionic-training-decks',
      storageBucket: 'ionic-training-decks.appspot.com',
      messagingSenderId: '963541232275',
      appId: '1:963541232275:web:c327a3151655f94fe07b66',
      measurementId: 'G-NHPMQK52RD',
    });
  }

  async ngOnInit() {
    this.loadMenuItems();
    const course = this.getCourseFromPath();
    this.setSelectedMenuItem(course);
  }

  private loadMenuItems() {
    this.appPages = [...this.menuItems.mainMenu];
    this.appPages.push({
      name: 'about',
      title: 'About',
      icon: 'information-circle',
      url: '/about',
    });
  }

  private getCourseFromPath(): string {
    if (window.location.pathname === '/about') {
      return 'about';
    }

    const path = window.location.pathname.split('course/')[1];
    if (path) {
      return path.split('/')[0];
    }
    return '';
  }

  private setSelectedMenuItem(course: string) {
    this.selectedIndex = this.appPages.findIndex((x) => x.name === course);
    if (this.selectedIndex < 0) {
      this.selectedIndex = 0;
      this.navController.navigateRoot(this.appPages[0].url);
    }
  }
}
