# Integrate Ionic's Identity Vault

Ionic Auth Connect provides three different choices for the storage of the authentication tokens.

- Default
  - uses local storage
  - not a good option for on device storage
  - meant to facilitate development
  - **do not use in production**
- Create your own `TokenStorageProvider`
  - create a service that implements `TokenStorageProvider`
  - you have to do the heavy lifting yourself
  - ultimate flexibility
- Use Ionic's Identity Vault
  - most secure option
  - minimal amount of work
  - **this is the preferred option**

Our application is currently using the `Default` option, which is not suitable for production. The preferred option for a secure project application is to use Ionic's Identity Vault to store the token. As such we will look at that integration now.

**Note:** this tutorial will not get in to all of the different options available via Ionic's Identity Vault. Instead, it focuses on the integration between Identity Vault and Auth Connect. Please refer to the Identity Vault training and documentation if you would like more information about Identity Vault.

If you only have access to Auth Connect and not to Identity Vault, let us know and we can provide you with a trial for Identity Vault. If you do not want to consider using Identity Vault, you should strongly consider the second option above and create your own `TokenStorageProvider` service. Doing so is not covered by this training. If you need assistance doing that, however, we would be happy to offer that assistance on an advisory basis.

## Installing Identity Vault

The first thing we need to do in order to use Ionic's Identity Vault is install it. Since we already have a key and have this project set up to use our key, we do not have to worry about performing the registration step. So let's install it and update our native projects:

```bash
npm i @ionic-enterprise/identity-vault
ionic cap update
```

## The Vault Service

Our application already contains a `VaultService`, but it was written to be the primary source of truth for the session information. What we need is for our vault to be a secure storage provider that Auth Connect can use to store the authentication tokens.

Let's start by gutting the current `VaultService` and replacing it with a very basic Identity Vault configuration. Here is the new contents of `src/app/core/vault.service.ts`:

```TypeScript
import { Injectable } from '@angular/core';
import {
  AuthMode,
  IonicIdentityVaultUser,
} from '@ionic-enterprise/identity-vault';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class VaultService extends IonicIdentityVaultUser<any> {
  constructor(platform: Platform) {
    super(platform, {
      unlockOnAccess: true,
      hideScreenOnBackground: true,
      authMode: AuthMode.SecureStorage,
    });
  }
}
```

We will then inject the `VaultService` into the `AuthenticationService` and set the `tokenStorageProvider` in `src/app/core/authentication.service.ts`:

```TypeScript
  constructor(platform: Platform, vault: VaultService) {
    const config = platform.is('hybrid') ? mobileAzureConfig : webAzureConfig;
    config.tokenStorageProvider = vault;
    super(config);
  }
```

## Fix the Browser Support

That is really all we need to do in order to combine Auth Connect and Identity Vault but there is _one_ problem. This no longer works in the browser, and we really would like to use the browser for almost all of our development efforts. The problem is that Identity Vault uses hardware APIs in order to encrypt and store the data. That hardware and the associated APIs do not exist within the browser. To get around this, we will create a substitute vault service that uses Capacitor's Storage plugin to store the keys.

The services that are required are boiler-plate, so let's just download them rather than going through writing them:

- `npm i @capacitor/storage`
- <a download href="/assets/packages/ionic-angular/browser-vault.zip">Download the zip file</a>
- unzip the file somewhere
- copy the `browser-vault.plugin.ts` and `browser-vault.service.ts` files from where you unpacked them to `src/app/core`

The final change required is to inject the `BrowserVaultPlugin` class into our `VaultService` and override the `getPlugin()` method to return either the standard Identity Vault plugin or the "Browser Vault" plugin depending upon the context in which the application is being run.

```TypeScript
export class VaultService extends IonicIdentityVaultUser<any> {
  constructor(
    private browserVaultPlugin: BrowserVaultPlugin,
    platform: Platform,
  ) {
    ...
  }

  getPlugin(): IonicNativeAuthPlugin {
    if ((this.platform as Platform).is('hybrid')) {
      return super.getPlugin();
    }
    return this.browserVaultPlugin;
  }
}
```

Now when you run in the browser, the application will use the `BrowserVault` plugin and service to store the keys in a way that the browser can consume them.

## Conclusion

Congratulations. You now have a fully functional application that is utilizing Auth Connect and Identity Vault. However, this is just a starting point. For example, we are not currently using any of the more advanced storage modes that Identity Vault offers us (such as locking the keys behind a Biometric lock).

- For more information on different options that you can explore with Identity Vault, please see our [Identity Vault training](course/identity-vault/tabs/angular/page/0).
- We also have a <a href="https://github.com/ionic-team/tea-taster-angular/tree/feature/auth-connect" target="_blank">sample application</a> that demonstrates one way to integrate Auth Connect and Identity Vault into a real-world application.

If you have any question, please let us know. We are here to help.

Happy Coding!!
