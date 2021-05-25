# Install Identity Vault

The first thing we need to do is install Identity Vault. In order to do this, you will need to have an Ionic Enterprise key that includes access to Identity Vault. Since you are working through this particular tutorial, it is assumed that you have one. There are two ways you can associate this application with your Ionic Enterprise key:

- you can perform this <a href="https://ionic.io/docs/premier-plugins/setup" target="_blank">registration</a>
- or you can copy the `.npmrc` file from your production application if you have already performed the registration there

**Note:** your key is only for a single production application, but you can use it with as many training exercises as you would like. The same holds true for prototype applications. If you would like to whip up a prototype application in which to try a new authentication workflow that you may incorporate into your production application, please do. If you need to use Identity Vault in more production applications, however, please contact us about obtaining more keys.

Once the app is properly registered (or the `.npmrc` file is properly copied over), you should perform the following commands to install Identity Vault and update your native projects:

```bash
npm i @ionic-enterprise/identity-vault
npx cap update
```

## A Simple Vault Service

In order to integrate Identity Vault into our application, we will look for the the service within our application where we are storing the session information and swap out the storage mechanism. Luckily for us, we just wrote the authentication workflow, and did so fairly cleanly, so this will be easy. In a production application this may not be quite as straight forward, but there is _usually_ a service that is a natural choice. Look for services with names like `IdentityService`, `SessionService`, or `SessionStorageService`.

In our tutorial application, we will convert the `VaultService` to use Identity Vault for the storage mechanism.

```TypeScript
import { Vault } from '@ionic-enterprise/identity-vault';
import { Session } from '@/models';

class VaultService {
  private key = 'session';
  private vault: Vault;

  constructor() {
    this.vault = new Vault({
      key: 'io.ionic.traininglabng',
      type: 'SecureStorage',
      deviceSecurityType: 'Both',
      lockAfterBackgrounded: 2000,
      shouldClearVaultAfterTooManyFailedAttempts: true,
      customPasscodeInvalidUnlockAttempts: 2,
      unlockVaultOnLoad: false,
    });
  }

  async setSession(session: Session): Promise<void> {
    return this.vault.setValue(this.key, session);
  }

  async getSession(): Promise<Session | null | undefined> {
    return this.vault.getValue(this.key);
  }

  async clearSession(): Promise<void> {
    return this.vault.clear();
  }
}

export const vault = new VaultService();
```

This is what our configuration means:

- `key`: this value identifies our vault, allowing us to have multiple vaults in the application is we so choose. The value used needs to be unique within the application.
- `type`: the type of vault, which also determines the mechanism for unlocking the vault. Types of vaults are:
  - `SecureStorage`: the data is stored in a secure location but never locked
  - `DeviceSecurity`: this type of vault is unlocked via a device supplied mechanism such as biometrics or the system passcode
  - `CustomPasscode`: this type of vault is unlocked via a session passcode. The mechanism for supplying the passcode must be supplied by the application
- `deviceSecurityType`: the mechanism used to unlock a vault of type `DeviceSecurity`, valid values are: `SystemPasscode`, `Biometrics`, or `Both`
- `lockAfterBackgrounded`: the number of milliseconds to wait before locking the vault when the application is in the background.
- `shouldClearVaultAfterTooManyFailedAttempts`: if this flag is `true` the vault will be cleared if there are too many failed attempts to unlock it. If you are using a `DeviceSecurity` vault, the value of "too many" is determined by the OS
- `customPasscodeInvalidUnlockAttempts`: the number of failed attempts that is considered "too many" for a `CustomPasscode` vault
- `unlockVaultOnLoad`: if this value is `true` the application will try to unlock the vault on initial load, otherwise it will only attempt to unlock when the vault is locked and access to the vault is required

For a full explanation of all of the configuration options, please see <a href="https://ionic.io/docs/identity-vault/api#vaultoptions" target="_blank">the VaultOptions documentation</a>.

If you build and run the application on a device at this point, you should be able to log in and have your session persist after you close and restart the application.

## Supporting the Browser

Since Identity Vault is used to store the authentication tokens in a secure location on mobile devices and since there is no such thing as a secure storage mechanism in the browser, Identity Vault does not, by default, work in the browser. However, we would still like to be able to use the browser as our primary platform when doing development. In order to do this, we will need to create a fake "browser vault" plugin and service. The reason it is fake is that the web does not actually have a secure vault location where data like this can be stored. Instead, we will create services that use the same interface as the Vault users. This fake plugin will then use `@capacitor/storage` as its storage mechanism.

The classes themselves are boiler-plate, so let's just download them rather than going through writing it:

- <a download href="/assets/packages/ionic-vue/browser-vault.zip">Download the zip file</a>
- unzip the file somewhere
- copy the `BrowserVault.ts` file from where you unpacked the zip file to `src/services`

The `BrowserVault` class uses the `@capacitor/storage` to store the data, so we will need to install that at this time:

```bash
npm i @capacitor/storage
npx cap update
```

Finally, in the `VaultService` class, import the `BrowserVault` class. The `isPlatform()` function will also have to be imported from `@ionic/vue`. If the application is running in a web-native (also known as "hybrid") context, then it has access to the vault and should use it. Otherwise we will have to use the browser vault.

When completed, the service will now look like this:

```TypeScript
import { Vault } from '@ionic-enterprise/identity-vault';
import { isPlatform } from '@ionic/vue';
import { Session } from '@/models';
import { BrowserVault } from './BrowserVault';

class VaultService extends IonicIdentityVaultUser<Session> {
  private key = 'session';
  private vault: Vault | BrowserVault;

  constructor() {
    this.vault = isPlatform('hybrid')
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

  ... // session methods here

}

export const vault = new VaultService();
```

Now when you run in the browser, the application will use the `BrowserVault` to store the keys in a way that the browser can consume them.

## Conclusion

We are now using Identity Vault to securely persist our session between application reloads. Next we will look at using various authentication modes in order to lock and unlock the vault.
