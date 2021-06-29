# Install Identity Vault

The first thing we need to do is install Identity Vault. In order to do this, you will need to have an Ionic Enterprise key that includes access to Identity Vault. Since you are working through this particular tutorial, it is assumed that you have one. There are two ways you can associate this application with your Ionic Enterprise key:

- you can perform this <a href="https://ionic.io/docs/premier-plugins/setup" target="_blank">registration</a>
- or you can copy the `.npmrc` file from your production application if you have already performed the registration there

**Note:** your key is only for a single production application, but you can use it with as many training exercises as you would like. The same holds true for prototype applications. If you would like to whip up a prototype application in which to try a new authentication workflow that you may incorporate into your production application, please do. If you need to use Identity Vault in more production applications, however, please contact us about obtaining more keys.

Once the app is properly registered (or the `.npmrc` file is properly copied over), you should perform the following commands to install Identity Vault and update your native projects:

```bash
npm i @ionic-enterprise/identity-vault
ionic cap update
```

## A Simple Vault Service

In order to integrate Identity Vault into our application, we will extend the `IonicIdentityVaultUser` class that is provided by Identity Vault. Using this class, we will configure the vault and interact with it.

When integrating Identity Vault into an existing application, there is quite often a service that is a natural choice to convert. We already have a `VaultService` and we will convert it to use Identity Vault. Most other applications have a service that manages the the current session. Other common names for these services are `IdentityService` or `SessionService`. Whatever this service is in your existing system is a good candidate. In many cases, you can modify this service to extend Identity Vault. This has the advantage of needing to make few changes throughout the rest of the appliction as the workflow for how the current session information is obtained is already defined.

In our tutorial application, we will convert the `VaultService` to extend `IonicIdentityVaultUser`.

```TypeScript
import { Injectable } from '@angular/core';
import {
  AuthMode,
  IonicIdentityVaultUser,
} from '@ionic-enterprise/identity-vault';
import { Platform } from '@ionic/angular';
import { Session } from '../models';

@Injectable({
  providedIn: 'root',
})
export class VaultService extends IonicIdentityVaultUser<Session> {
  constructor(platform: Platform) {
    super(platform, {
      unlockOnAccess: true,
      hideScreenOnBackground: true,
      lockAfter: 5000,
      authMode: AuthMode.SecureStorage,
    });
  }
}
```

This is what our configuration means:

- `unlockOnAccess`: if the vault is locked, unlock the vault when the application attempts to access the session. If this value is false, the application will need to call `unlock()` itself. This value is typically `true` unless you want fine-grained control over the unlock workflow.
- `hideScreenOnBackground`: setting this option `true` results in a privacy screen being displayed rather than a snapshot of the application when it is in the background.
- `lockAfter`: the number of milliseconds to wait before locking the vault when the application is in the background.
- `authMode`: the method to use to unlock the vault. In the case of `SecureStorage`, the session will be stored in a secure location, but the vault will never lock.

**Note:** with `authMode: AuthMode.SecureStorage` it does not _really_ matter if we set `unlockOnAccess` to `true` or to `false`, but as we modify this application it will matter, so we are just setting it `true` because we will eventually want that behavior.

For a full explanation of all of the configuration options, please see <a href="https://ionic.io/docs/identity-vault/api#vaultoptions" target="_blank">the VaultOptions documentation</a>.

If you build and run the application on a device at this point, you should be able to log in and have your session persist after you close and restart the application.

## Supporting the Browser

Since Identity Vault is used to store the authentication tokens in a secure location on mobile devices and since there is no such thing as a secure storage mechanism in the browser, Identity Vault does not, by default, work in the browser. However, we would still like to be able to use the browser as our primary platform when doing development. In order to do this, we will need to create a fake "browser vault" plugin and service. The reason it is fake is that the web does not actually have a secure vault location where data like this can be stored. Instead, we will create services that use the same interface as the Vault users. This fake plugin will then use `@capacitor/storage` as its storage mechanism.

The classes themselves are boiler-plate, so let's just download them rather than going through writing it:

- `npm i @capacitor/storage`
- <a download href="/assets/packages/ionic-angular/browser-vault.zip">Download the zip file</a>
- unzip the file somewhere
- copy the `browser-vault.service.ts` and `browser-vault.plugin.ts` files from where you unpacked them to `src/app/core`

Finally, in the `VaultService` class, inject the `BrowserVaultPlugin` and override the `getPlugin()` method to use the real plugin if the application is run in a hybrid mobile context, and the fake "browser vault" otherwise.

When completed, the service will now look like this:

```TypeScript
import { Injectable } from '@angular/core';
import {
  AuthMode,
  IonicIdentityVaultUser,
  IonicNativeAuthPlugin,
} from '@ionic-enterprise/identity-vault';
import { Platform } from '@ionic/angular';
import { Session } from '../models';
import { BrowserVaultPlugin } from './browser-vault.plugin';

@Injectable({
  providedIn: 'root',
})
export class VaultService extends IonicIdentityVaultUser<Session> {
  constructor(
    private browserVaultPlugin: BrowserVaultPlugin,
    platform: Platform,
  ) {
    super(platform, {
      unlockOnAccess: true,
      hideScreenOnBackground: true,
      lockAfter: 5000,
      authMode: AuthMode.SecureStorage,
    });
  }

  getPlugin(): IonicNativeAuthPlugin {
    if ((this.platform as Platform).is('hybrid')) {
      return super.getPlugin();
    }
    return this.browserVaultPlugin;
  }
}
```

Now when you run in the browser, the application will use the `BrowserVaultPlugin` and `BrowserVaultService` classes to store the keys in a way that the browser can consume them.

**Side Note**

You may be wondering why we are doing the following cast: `this.platform as Platform`. Here is what is happening:

- The base class has a protected member called `platform` that is set to the first parameter passed during construction.
- Within Identity Vault, this `platform` is typed to `{ ready: () => Promise<any> }`, and not the full `@ionic/angular` `Platform` service, which would tie IV to `@ionic/angular`. We want Identity Vault to be usable with any framework.
- The `Platform` service from `@ionic/angular` meets the contract, so that is what we pass.
- We know what we passed, and we need to access other methods from it, so it is safe for us to cast it back to gain access to those methods.

## Conclusion

We are now using Identity Vault to securely persist our session between application reloads. Next we will look at using various authentication modes in order to lock and unlock the vault.
