# Lab: Customize the PIN Dialog

At this point, the application has a well defined workflow for determining how to secure the token. However, the workflow used to gather or enter the PIN is a little clunky. The workflow and UI that it is currently using is intended for development use only, and is not intended to be used in a production quality application. **We highly suggest that application developers create their own PIN dialog and workflow in order to provide a more appropriate experience for their application.**

In this section we will improve the session PIN user experience.

## The `onPasscodeRequest` Callback

The `IonicIdentityVaultUser` class contains a method named `onPasscodeRequest` that is called whenever the system needs to obtain a PIN. This method is called with a single parameter that is `true` if the vault is setting the passcode and `false` when the vault is obtaining the passcode in order to unlock the vault.

```TypeScript
  async onPasscodeRequest(isPasscodeSetRequest: boolean): Promise<string> {
    // Code to obtain PIN goes here...
    return pin;
  }
```

The `onPasscodeRequest` method should return one of the following values:

- `empty string`: the user cancelled the entry of the PIN
- `non-empty string`: the PIN entered by the user

If you return `undefined` from this method, Identity Vault will fall back to the default PIN experience, so when the user cancels make sure you are returning an empty string and not `undefined`.

### Obtaining the PIN

The "Code to obtain PIN goes hear..." could literally be anything you want to obtain a PIN. For example, each users in the system could have an "employee number" associated with their user that gets looked up from the API and then gets used as a PIN. In this case, the user would never have to establish a PIN. They would just have to enter their employee ID to unlock the vault.In that case, your logic may look like this:

```TypeScript
  async onPasscodeRequest(isPasscodeSetRequest: boolean): Promise<string> {
    if (isPasscodeSetRequest) {
      return obtainPINFromAPI();
    } else {
      return obtainPINFromUser();
    }
  }
```

In this scenario, `obtainPINFromAPI()` makes an API call to get the employee ID and returns it. The `obtainPINFromUser()` method then displays some kind of dialog where the user enters their employee ID to unlock the vault.

A more common scenario, however, is to use a custom component within a modal dialog to obtain the PIN for both initially setting the PIN and for unlocking the vault. That is the flow we will implement here.

### The `PinDialogComponent`

Rather than write the PIN Dialog component, we are just going to give you the code. <a download href="/assets/packages/ionic-angular/pin-dialog.zip">Download the zip file</a> and unpack it under `src/app` creating a `pin-dialog` folder. Have a look at the component to get an idea of what the code does. The component displays a simple numeric keypad and a prompt area. The following workflows are implemented by the component:

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

```TypeScript
import { PinDialogComponentModule } from './pin-dialog/pin-dialog.module';
...
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    PinDialogComponentModule,
  ],
```

Second, in `vault.service.ts`, import the `PinDialogComponent`. Also, import and inject the `ModalController`.

Once all of that is in place, we can modify `vault.service.ts` to implement the `onPasscodeRequest` event callback:

```TypeScript
  async onPasscodeRequest(isPasscodeSetRequest: boolean): Promise<string> {
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

Note the return value. If the data passed back from the dialog is "falsey" we want to make sure we are resolving to an empty string to signify the user cancelling the operation.

Build this and give it a try on your device.

## A Note on Security

Identity Vault never stores the PIN that the user enters. Instead, it uses the PIN to generate a key. The key is used to lock the vault. When the vault is locked, the key is thrown away. As a result, when the vault needs to be unlocked, a new key needs to be generated. The Vault obtains a PIN from the user and a new key is generated using that PIN. The key will match the original key if the same PIN is used, or it will not if a different PIN is used.

In this way, neither the PIN nor the key is ever stored anywhere. This means that neither the PIN nor the key can be obtained by a bad actor. This also means that neither the PIN nor the key is recoverable, so always give your user a way to log in again via traditional means.

## Conclusion

We have now fully integrated Identity Vault into our "proof of concept" application, and have seen some of the configuration options at work. We can now start thinking about how it would be best integrated in our own real-world applications.
