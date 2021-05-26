# Lab: The Custom Passcode Vault

Up to now, we have been ignoring the `CustomPasscode` vault. That is because there is a bit of extra code that we need in order to support this. First, we will need to respond to an event from Identity Vault. Second, we will need to create our own custom workflow in order to obtain the passcode from the user.

In this lab we will first explore responding to events from Identity Vault and then look into adding a workflow in order to support the `CustomPasscode` vault type.

## Identity Vault Events

The Vault contains several methods that are used to register callbacks that will be triggered via various events within Identity Vault. The triggering event is indicated by the name.

- `onConfigChanged()`
- `onError()`
- `onLock()`
- `onUnlock()`
- `onPasscodeRequested()`

At this time, we will get a taste for these events by exploring the `onLock()` method.

Add the following code to the `VaultService` class in our application:

```TypeScript
  private initializeEventHandlers() {
    this.vault.onLock(() => alert('You are now locked out of the vault!!'));
  }
```

Once that is in place, call it in the constructor:

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

    this.initializeEventHandlers();
  }
```

Build the application and run it on a device. You can now see that an alert is displayed whenever the vault locks.

**Note:** as of the time of this writing, the `onLock()` and `onUnlock()` are cleared whenever the config changes, so we will have to reset that each time. For now, let's rewrite the `setVaultType()` method to reflect that:

```TypeScript
  async setVaultType(type: VaultType): Promise<void> {
    await this.vault.updateConfig({
      ...this.vault.config,
      type: type.type,
      deviceSecurityType: type.deviceSecurityType,
    });
    this.initializeEventHandlers();
  }
```

## The `onPasscodeRequested` Callback

The `onPasscodeRequested()` method registers a function that will be called any time a passcode is required from the user. The function used here should:

1. Obtain the passcode from the user.
1. Call `setCustomPasscode()` passing the obtained passcode.

### Obtaining the Passcode

The passcode is often obtained via a custom passcode or PIN entry dialog. Rather than write the PIN Dialog component, we are just going to give you the code. <a download href="/assets/packages/ionic-angular/pin-dialog.zip">Download the zip file</a> and unpack it under `src/app` creating a `pin-dialog` folder. Have a look at the component to get an idea of what the code does. The component displays a simple numeric keypad and a prompt area. The following workflows are implemented by the component:

- when `setPasscodeMode` is `true`
  - the user is prompted for a PIN
  - the user is prompted for a verification PIN that must match the first PIN
  - if the PINs match, the modal is closed returning that PIN
  - if the PINs do not match, the user has to start over
  - the user _cannot_ cancel, they _must_ enter a PIN
- when `setPasscodeMode` is `false`
  - the user is prompted for a PIN
  - the modal will close with the entered PIN
  - the user can cancel, in which case the modal will close without a PIN

In our case, the `PinDialogComponent` encapsulates our whole workflow giving the user a consistent UX when entering a PIN. That is often desireable, but as noted above is not the only way that this can be done.

### Hooking it Up

Now that we have the component in place, it is time to hook it up.

First, add the `PinDialogComponentModule` to the `imports` array in `app.module.ts`.

Second, in `vault.service.ts`, import the `PinDialogComponent` and inject the `ModalController`.

Once all of that is in place, we can modify `vault.service.ts` to implement the function to pass to `onPasscodeRequested()` and hook it all up:

```TypeScript
  private async getPasscode(isPasscodeSetRequest: boolean): Promise<string> {
    const dlg = await this.modalController.create({
      backdropDismiss: false,
      component: PinDialogComponent,
      componentProps: {
        setPasscodeMode: isPasscodeSetRequest,
      },
    });
    dlg.present();
    const { data } = await dlg.onDidDismiss();
    return data || '';
  }
```

With that in place, set up the callback:

```TypeScript
  private initializeEventHandlers() {
    this.vault.onPasscodeRequested(async () => {
      const p = await this.getPasscode(false);
      return this.vault.setCustomPasscode(p);
    });
    this.vault.onLock(() => alert('You are now locked out of the vault!!'));
  }
```

**TODO:** at this time, there is no way to determine if this is a "set" request or not, so we are always passing `false`. Once that is worked out, we will need to fix this.

Finally, update the `validMobileVaultTypes()` method to include an entry for the `CustomPasscode` vault type.

```TypeScript
      {
        label: 'Custom PIN Unlock',
        type: 'CustomPasscode',
        deviceSecurityType: 'Both',
      },
```

Build this and give it a try on your device.

## A Note on Security

Identity Vault never stores the PIN that the user enters. Instead, it uses the PIN to generate a key. The key is used to lock the vault. When the vault is locked, the key is thrown away. As a result, when the vault needs to be unlocked, a new key needs to be generated. The Vault obtains a PIN from the user and a new key is generated using that PIN. The key will match the original key if the same PIN is used, or it will not if a different PIN is used.

In this way, neither the PIN nor the key is ever stored anywhere. This means that neither the PIN nor the key can be obtained by a bad actor. This also means that neither the PIN nor the key is recoverable, so always give your user a way to log in again via traditional means.

## Conclusion

We have defined our workflow, and Identity Vault is working within our application. Next, we will explore Identity Vault's device API which will allow us to fine tune the behavior of our application.
