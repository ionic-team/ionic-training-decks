# Other Auth Modes

In the last section, we implemented Identity Vault using the `SecureStorage` auth mode. This auth mode simply stores the information in a secure location without ever locking it. In this section we will explore the other auth modes that are available to us.

## Auth Modes

Identity Vault supports multiple different authentication of modes. The most commonly used modes are:

- **`SecureStorage`**: data is stored in a secure location on the device, but the vault is never locked. With this vault, the data stored in the vault is always accessible so long as the user has unlocked the device via a secure method.
- **`PasscodeOnly`**: the vault is locked after the application has been in the background for a specified period of time or when the application is closed. With this mode, the user will be prompted to supply a custom PIN for the session. This data stored in the vault will only be accessible after the user unlocks the vault via the supplied PIN.
- **`BiometricOnly`**: the vault is locked after the application has been in the background for a specified period of time or when the application is closed. With this mode, the data stored in the vault is only accessible after the user unlocks the vault with a the biometric authentication mechanism supported by the device.
- **`BiometricAndPasscode`**: the vault is locked after the application has been in the background for a specified period of time or when the application is closed. With this mode, the data stored in the vault is only accessible after the user unlocks the vault with a the biometric authentication mechanism supported by the device. A session PIN is established at the time the session is stored, and is used as a backup for cases where biometric authentication fails or is not available.
- **`InMemoryOnly`**: the session is never stored in the vault. It is simply cleared whenever the application is closed or has been in the background `lockAfter` number of millisecond.

## Specifying the Authentication Mode

Currently, we are setting the authentication mode when we instantiate the vault. This is a poor time to do this, so let's remove that line of code:

```diff
--- a/src/app/core/vault.service.ts
+++ b/src/app/core/vault.service.ts
@@ -20,7 +20,6 @@ export class VaultService extends IonicIdentityVaultUser<Session> {
       unlockOnAccess: true,
       hideScreenOnBackground: true,
       lockAfter: 5000,
-      authMode: AuthMode.SecureStorage,
     });
   }
```

Have a look at the login page, and you will see that we are calling `this.vault.login(session);` only passing the session. This will register our session with the vault using the current auth mode. This method can take a second parameter, which is the authentication mode to use. Let's modify the login page to pass that value.

First, modify `login.page.html` to present the user with some options for the authentication mode. Add the following markup within the `ion-list`

```html
<ion-item *ngIf="displayLockingOptions">
  <ion-label>Session Locking</ion-label>
  <ion-select id="auth-mode-select" name="auth-mode" [(ngModel)]="authMode">
    <ion-select-option
      *ngFor="let authMode of authModes"
      [value]="authMode.mode"
      >{{authMode.label}}</ion-select-option
    >
  </ion-select>
</ion-item>
```

Next, modify `login.page.ts` to populate the data we need for the `ion-select` we just added:

```TypeScript
  authMode: AuthMode;
  authModes: Array<{ mode: AuthMode; label: string }> = [
    {
      mode: AuthMode.PasscodeOnly,
      label: 'Session PIN Unlock',
    },
    {
      mode: AuthMode.SecureStorage,
      label: 'Never Lock Session',
    },
    {
      mode: AuthMode.InMemoryOnly,
      label: 'Force Login',
    },
  ];
  displayLockingOptions: boolean;
```

In the same file, update the `ngOnInit()` to determine if we need to display the options since this is really only an option if we are running on mobile. We will also query the vault to determine if biometric authentication is available, meaning that the device supports it and the user has properly enabled it. If so, we will add that as the first option. You will need to inject the `Platform` service in the constructor.

```TypeScript
  async ngOnInit() {
    this.displayLockingOptions = this.platform.is('hybrid');
    if (await this.vault.isBiometricsAvailable()) {
      this.authModes = [
        {
          mode: AuthMode.BiometricOnly,
          label: 'Biometric Unlock',
        },
        ...this.authModes,
      ];
    }
    this.authMode = this.authModes[0].mode;
  }
```

Finally, we will pass the chosen authentication mode to the vault when we register the current session:

```TypeScript
        this.vault.login(session, this.authMode);
```

Putting all of the code together, it looks like this:

```TypeScript
import { Component, OnInit } from '@angular/core';
import { AuthMode } from '@ionic-enterprise/identity-vault';
import { NavController, Platform } from '@ionic/angular';
import { AuthenticationService } from '../core';
import { VaultService } from '../core/vault.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  email: string;
  password: string;

  authMode: AuthMode;
  authModes: Array<{ mode: AuthMode; label: string }> = [
    {
      mode: AuthMode.PasscodeOnly,
      label: 'Session PIN Unlock',
    },
    {
      mode: AuthMode.SecureStorage,
      label: 'Never Lock Session',
    },
    {
      mode: AuthMode.InMemoryOnly,
      label: 'Force Login',
    },
  ];
  displayLockingOptions: boolean;

  constructor(
    private authentication: AuthenticationService,
    private navController: NavController,
    private platform: Platform,
    private vault: VaultService,
  ) {}

  async ngOnInit() {
    this.displayLockingOptions = this.platform.is('hybrid');
    if (await this.vault.isBiometricsAvailable()) {
      this.authModes = [
        {
          mode: AuthMode.BiometricOnly,
          label: 'Biometric Unlock',
        },
        ...this.authModes,
      ];
    }
    this.authMode = this.authModes[0].mode;
  }

  signIn() {
    this.authentication.login(this.email, this.password).subscribe(session => {
      if (session) {
        this.vault.login(session, this.authMode);
        this.navController.navigateRoot('/');
      }
    });
  }
}
```

## Native Modifications

In order to build this for an iOS device, you will need to supply a value for `NSFaceIDUsageDescription` with a message explaining why you want to use Face ID when getting the user's permissions. The easiest way to do this is:

- `ionic cap open ios`
- open the `Info.plist` file in `Xcode`
- add and entry for `NSFaceIDUsageDescription` with a value like "Use Face ID to unlock the application"

Build the application and deploy it to a device.

The user can now choose which authentication mode to use. Play around with some of the authentication modes and see how the app behaves as you go to pages that require a valid session, namely tabs one and two.

## Responding to Vault Events

Try the following test:

1. log in using any mode other than "Never Lock Session" (SecureStorage)
1. navigate to the Teas page
1. put the app in the background for 5 or more seconds
1. come back to the app

Notice at this point that we can still see the data on the Teas page even though the app is locked. This page requires us to be logged in with an unlocked session in order to navigate to it, but since we are already there we aren't blocked. However, if you then navigate to the Settings page and back to the Teas page, you _will_ need to unlock the vault.

Let's fix this by navigating to tab number three (which does not require authentication) when the session locks. Then we will have to unlock the session in order to go back to page two. Add the following code to `vault.service.ts`:

```TypeScript
  onVaultLocked() {
    this.navController.navigateRoot(['/', 'tabs', 'settings']);
  }
```

**Note:** you will need to inject the `NavController`.

While we are responding to events like this, let's also cache the session in our service so we don't always have to go to the vault to get it. To do this, we will need to:

1. define a private property to cache the session as such: `private currentSession: Session | undefined;`
1. override the `login()` method to set the `currentSession` in addition to performing the base class functionality
1. override the `restoreSession()` method return the `currentSession` if it is set, and otherwise check with the vault
1. clear `currentSession` when the vault is locked
1. set `currentSession` when the session is restored

The code for that in `vault.service.ts` looks like this:

```TypeScript
  login(session: Session, mode?: AuthMode): Promise<void> {
    this.currentSession = session;
    return super.login(session, mode);
  }

  async restoreSession(): Promise<Session | undefined> {
    return this.currentSession || super.restoreSession();
  }

  onVaultLocked() {
    this.currentSession = undefined;
    this.navController.navigateRoot(['/', 'tabs', 'settings']);
  }

  onSessionRestored(session: Session) {
    this.currentSession = session;
  }
```

Build the application an test it out on a device.

## Conclusion

We now have an application that allows the user to pick whichever authentication mode works best for them. Try the "Session PIN Unlock" option, though. Notice how the PIN experience is not very ideal. We can customize that, which is exactly what we will do in the next section.
