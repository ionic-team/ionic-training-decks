# Lab: The Device API

Identity Vault's Device API consists of a set of functions that query device capabilities. This API is also used to control a couple of behaviors that are applicable to the device as a whole and not any given vault you may create within your application. For example, your application may have multiple vaults all with different locking and unlocking behaviors. However, whether or not the privacy screen is shown when the application is put into the background is a behavior that applies to an instance of the application running on a device and not something that applies to any one vault.

## Querying the Device

Most of the functions that are part of the Device API have to do with querying the capabilities of the device. First, we will experiment with a few of these on the `Tab1Page`. Next, we will put one of them to practical use in order to refine the list of vault types returned by `validMobileVaultTypes()` in our `VaultService`.

### Show the Statuses in `Tab1` Page

In `Tab1` page we will use the Device API to check some of the capabilities of the device just so we can see how these items behave.

First, update the `Tab1Page` HTML template to display the values we are interested in. This can go right after the `div` that displays the `currentUser`:

```HTML
  <div>Biometrics is Enabled: {{biometricsEnabled}}</div>
  <div>Biometrics is Supported: {{biometricsSupported}}</div>
  <div>Locked Out of Biometrics: {{lockedOut}}</div>
  <div>System Passcode Set: {{systemPasscodeSet}}</div>
  <div>Privacy Screen Enabled: {{privacyScreenEnabled}}</div>
```

Next, import the device API:

```TypeScript
import { Device } from '@ionic-enterprise/identity-vault';
```

Add the following refs in the `setup()` function. Be sure to also include them in the object returned from the `setup()`:

```Typescript
const biometricsEnabled = ref(false);
const biometricsSupported = ref(false);
const lockedOut = ref(false);
const privacyScreenEnabled = ref(false);
const systemPasscodeSet = ref(false);
```

Finally, add the following code to the `onIonViewWillEnter()` method:

```TypeScript
    biometricsEnabled.value = await Device.isBiometricsEnabled();
    biometricsSupported.value = await Device.isBiometricsSupported();
    lockedOut.value = await Device.isLockedOutOfBiometrics();
    privacyScreenEnabled.value = await Device.isHideScreenOnBackgroundEnabled();
    systemPasscodeSet.value = await Device.isSystemPasscodeSet();
```

Obviously this is not very fancy or pretty, but we are just trying to get an idea of how this API works.

### Control the Mobile Vault Types List

Switching our attention back to the `VaultService.ts` file, our `validMobileVaultTypes()` method is currently just returning a status list of types:

```TypeScript
  private validMobileVaultTypes(): Array<VaultType> {
    return [
      {
        label: 'Custom PIN Unlock',
        type: 'CustomPasscode',
        deviceSecurityType: 'Both',
      },
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
```

The biometric options should only be displayed if the user has enabled biometrics on their device. Change the building of this list as such:

```TypeScript
  private async validMobileVaultTypes(): Promise<Array<VaultType>> {
    const types: Array<VaultType> = [
      {
        label: 'Custom PIN Unlock',
        type: 'CustomPasscode',
        deviceSecurityType: 'Both',
      },
      {
        label: 'System PIN Unlock',
        type: 'DeviceSecurity',
        deviceSecurityType: 'SystemPasscode',
      },
    ];
    if (await Device.isBiometricsEnabled()) {
      types.push({
        label: 'Biometric Unlock',
        type: 'DeviceSecurity',
        deviceSecurityType: 'Biometrics',
      });
      types.push({
        label: 'Biometric Unlock (System PIN Fallback)',
        type: 'DeviceSecurity',
        deviceSecurityType: 'Both',
      });
    }
    types.push({
      label: 'Never Lock Session',
      type: 'SecureStorage',
      deviceSecurityType: 'Both',
    });
    return types;
  }
```

Notice that this results in needing to make the function `async`. Thus it now returns a promise. As a result, the whole chain of associated methods will also need to return promises:

```TypeScript
  validVaultTypes(): Promise<Array<VaultType>> {
    return isPlatform('hybrid')
      ? this.validMobileVaultTypes()
      : this.validWebVaultTypes();
  }

...

  private async validWebVaultTypes(): Promise<Array<VaultType>> {
    return [];
  }
```

This also results in needing to make a minor change to wherever it is called (just the `Tab3` page in our application). Make the following change in the `Tab3` page's `setup()` function:

```diff
-    vaultTypes.value = vault.validVaultTypes();
+    vault.validVaultTypes().then(t => (vaultTypes.value = t));
```

## Setting the Privacy Screen

Often our applications will show personally identifiable information. The default behavior when an application is put in the background on an iOS or Android device is to just take a screenshot and use that as the user scrolls through the open applications. However, this could be used by a bad actor to gather sensitive data while the app should be locked.

Identity Vault includes a privacy screen that replaces the screenshot with something else. The native level APIs work a little differently by OS, so the behavior is not consistent. Here is how this works on each OS:

- **Android** has an API for this that simply replaces the screenshot with a plain gray background.
- **iOS** does not have an API for this at all, so Identity Vault uses the splash screen to obscure the screenshot.

For many applications, this is either something we want or we don't want. As a result, the `App` component is often a good place to set this:

```HTML
<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { defineComponent } from 'vue';
import { Device } from '@ionic-enterprise/identity-vault';

export default defineComponent({
  name: 'App',
  components: {
    IonApp,
    IonRouterOutlet,
  },
  setup() {
    Device.setHideScreenOnBackground(true);
  },
});
</script>
```

You could also make this something that is set optionally via user settings if you so desire.

## Conclusion

We have now completed the Identity Vault implementation within our sample application, and have a solid understanding of its different parts and how they work. It is now time to start thinking about how we would like to integrate these capabilities into our own application's workflow.
