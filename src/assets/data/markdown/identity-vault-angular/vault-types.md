# Other Vault Types

In the last section, we implemented Identity Vault using the `SecureStorage` vault type. This type of vault simply stores the information in a secure location without ever locking it. In this section we will explore the other types of vaults that are available to us.

## Controlling the Authentication

The authentication mechanism(s) used by Identity Vault are specified by a combination of the vault `type` as well as other parameters that refine the behavior of each type of vault. The parameters we will look at here are the `type` and the `deviceSecurityType`.

These parameters are specified when the vault is first created, but can also be changed at runtime. When a vault is locked, the configuration in effect at the time of locking determines how the vault will behave in order to unlock it.

### The Vault Type

Identity Vault supports multiple different types of authentication by supplying us with several different Vault Types that we can specify in the configuration. Here are the various vault types:

- `SecureStorage`: The vault is never locked, and the data is accessible to the app as long as the device was unlocked with a secure method.
- `DeviceSecurity`: When the vault is locked, it is unlocked via a device feature such as biometrics or the system passcode.
- `CustomPasscode`: When the vault is locked, it is unlocked via a custom passcode supplied by the application, usually through a custom build PIN entry dialog.

### The Device Security Type

The `deviceSecurityType` parameter further refines the behavior of the vault when we are using the `DeviceSecurity` type of vault. This parameter accepts the following values:

- `SystemPasscode`: Use the system passcode to unlock. This could be a PIN or a pattern.
- `Biometrics`: Use a form of biometrics, such as finger-print or face matching in order to unlock. The type of biometrics used is determined by the device.
- `Both`: Use biometrics as a primary unlock mechanism, and revert to the system passcode if biometrics fails.

## Specifying the Vault Type

The vault type is typically specified when the vault is created. For example, here is the constructor for the service that is managing our vault:

```TypeScript
  constructor(private platform: Platform) {
    this.vault = this.platform.is('hybrid')
      ? new Vault({
          key: 'io.ionic.traininglabng',
          type: 'SecureStorage',
          deviceSecurityType: 'Both',
          lockAfterBackgrounded: 2000,
          shouldClearVaultAfterTooManyFailedAttempts: true,
          customPasscodeInvalidUnlockAttempts: 2,
          unlockVaultOnLoad: false,
        })
      : new BrowserVault();
  }
```

We can also specify the type of the vault at run time by changing the configuration. Let's add some code that will do that now.

### Abstracting the Logic in `VaultService`

First, let's abstract the combination of `type` and `deviceSecurityType` into a set of values that we can use to give user's a choice in how the vault should behave.

Add the following type definition to `src/app/core/vault.service.ts`:

```TypeScript
export interface VaultType {
  label: string;
  type: 'SecureStorage' | 'DeviceSecurity' | 'CustomPasscode';
  deviceSecurityType: 'SystemPasscode' | 'Biometrics' | 'Both';
}
```

Recall that for the browser, we created a fake "vault", so changing the vault type makes little sense. For this reason, we only need a set of `VaultType`'s if the application is running in a mobile context. Let's add a couple of private methods to the `VaultService` to express that as well as a public method that returns the correct list depending upon the execution context:

```TypeScript
  validVaultTypes(): Array<VaultType> {
    return this.platform.is('hybrid')
      ? this.validMobileVaultTypes()
      : this.validWebVaultTypes();
  }

  private validMobileVaultTypes(): Array<VaultType> {
    return [
      {
        label: 'System PIN Unlock',
        type: 'DeviceSecurity',
        deviceSecurityType: 'SystemPasscode',
      },
      {
        label: 'Biometric Unlock',
        type: 'DeviceSecurity',
        deviceSecurityType: 'Biometrics',
      },
      {
        label: 'Biometric Unlock (System PIN Fallback)',
        type: 'DeviceSecurity',
        deviceSecurityType: 'Both',
      },
      {
        label: 'Never Lock Session',
        type: 'SecureStorage',
        deviceSecurityType: 'Both',
      },
    ];
  }

  private validWebVaultTypes(): Array<VaultType> {
    return [];
  }
```

Finally, let's add a method to update the vault type data in the configuration:

```TypeScript
  setVaultType(type: VaultType): Promise<void> {
    return this.vault.updateConfig({
      ...this.vault.config,
      type: type.type,
      deviceSecurityType: type.deviceSecurityType,
    });
  }
```

### Setting the Vault Type

Now we need to decide where to set the vault type in our application. One logical place would be in the `LoginPage`, allowing the user to specify, for example, if FaceID should be used right up front before logging in. That makes a really good pattern in a production app, but for our app we want to make it easy to experiment with various vault types, so we would really like to change the vault type while running the app. Luckily, we can do this.

Let's modify the `Tab3Page` to allow for changing the vault type. First, add the following import to `src/app/tab3/tab3.page.ts`:

```TypeScript
import { VaultService, VaultType } from '../core';
```

Next add the following code:

```TypeScript
  vaultTypes: Array<VaultType> = [];
  constructor(private vault: VaultService) {}

  ngOnInit() {
    this.vaultTypes = this.vault.validVaultTypes();
  }

  vaultTypeChanged(evt: { detail: { value: number } }) {
    const mode = this.vaultTypes[evt.detail.value];
    this.vault.setVaultType(mode);
  }
```

In the HTML, replace the `app-explore-container` with the following markup:

```html
<ion-radio-group
  *ngIf="vaultTypes.length"
  (ionChange)="vaultTypeChanged($event)"
>
  <ion-list-header>
    <ion-label> Session Locking </ion-label>
  </ion-list-header>

  <ion-item *ngFor="let vaultType of vaultTypes; index as idx">
    <ion-label>{{ vaultType.label }}</ion-label>
    <ion-radio [value]="idx"></ion-radio>
  </ion-item>
</ion-radio-group>
```

### Native Configuration (iOS Only)

In order to build this for an iOS device, you will need to supply a value for `NSFaceIDUsageDescription` with a message explaining why you want to use Face ID when getting the user's permissions. The easiest way to do this is:

- `npx cap open ios`
- open the `Info.plist` file in `Xcode`
- add and entry for `NSFaceIDUsageDescription` with a value like "Use Face ID to unlock the application"

### Test It

Build and deploy on a device where you have biometrics configured. At this point, run the following test a few times:

1. Go to tab 3
1. Select a "Session Locking" method
1. Put the app in the background for a couple of seconds
1. Come back to the app and go to page 2

Notice the specified mechanism is used to unlock the vault.

Also notice that if you shutdown the app, whichever type of vault was selected at the time is what is used to unlock the vault upon starting the app again (the Tab 1 page requires the vault to be unlocked in order to get some information from it).

## Manually Locking the Vault

Testing this is a little bit painful because we need to keep putting the app into the background. We can manually lock the vault as well. Adding a button to the `Tab3Page` that does this will help us out.

First, add the following method to the `VaultService`:

```TypeScript
  async lockSession(): Promise<void> {
    return this.vault.lock();
  }
```

Then add a button and a handler for the `click` event to the `Tab3Page`

```html
<ion-button expand="block" (click)="lock()">Lock</ion-button>
```

```TypeScript
  lock() {
    this.vault.lockSession();
  }
```

We can now just go to the Tab 3 page, pick a vault type for our session locking, and push the "Lock" button. Now when we go to either Tab 1 or Tab 2, we will need to unlock the vault via the specified mechanism.

## Conclusion

We now are able to lock the vault and unlock it via various mechanisms. However, there is one type of vault we have not explored yet, and that is the `CustomPasscode` vault. In order to do that, we will need to respond to events in the vault, which is what we will look at doing next.
