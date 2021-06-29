# The Authentication Workflow

We now have our OIDC provider properly configured. We also have Ionic Auth Connect installed in our application with a configuration to match that of our OIDC provider. It is time to implement the overall authentication flow in our application. To do this, we will need to perform the following tasks:

- modify the `AuthenticationService` to extend Ionic Auth Connect
- modify the login page to perform the login
- modify the Information page to get authentication information from Auth Connect and to perform the logout
- update the auth interceptor to append the access token to the Authentication header as a bearer token
- update the route guard to determine if the user is authenticated or not and respond accordingly

Let's get started.

## Authentication Service

The first step will be to create a service class that extends the Ionic Auth Connect base class (`IonicAuth`). The `IonicAuth` base class <a href="https://ionic.io/docs/auth-connect/api/#iionicauth" target="_blank">provides several methods</a> with useful base implementations. We will use the following methods as-is in various parts of our application:

- `login()`
- `logout()`
- `isAuthenticated()`
- `getIdToken()`
- `getAccessToken()`
- `refresh()`

Make the following modifications to the existing `ApplicationService`:

Remove the existing methods from the class, and modify the class to extend `IonicAuth`:

```TypeScript
@Injectable({
  providedIn: 'root',
})
export class AuthenticationService extends IonicAuth {
  constructor() {}
}
```

In the constructor, pass the correct configuration to `super()` based on the current execution context of the application:

```TypeScript
  constructor(platform: Platform) {
    const config = platform.is('hybrid') ? mobileAuthConfig : webAuthConfig;
    super(config);
  }
```

Add a `getUserInfo()` method to extract important user information from the ID token:

```TypeScript
  async getUserInfo(): Promise<User | undefined> {
    const idToken = await this.getIdToken();
    if (!idToken) {
      return;
    }

    let email = idToken.email;
    if (idToken.emails instanceof Array) {
      email = idToken.emails[0];
    }

    return {
      id: idToken.sub,
      email,
      firstName: idToken.given_name,
      lastName: idToken.family_name
    };
  }
```

Finally, clean up any unused imports. When we are done, the code for our service will look like this:

```TypeScript
import { Injectable } from '@angular/core';
import { IonicAuth } from '@ionic-enterprise/auth';
import { Platform } from '@ionic/angular';
import { mobileAuthConfig, webAuthConfig } from 'src/environments/environment';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService extends IonicAuth {
  constructor(platform: Platform) {
    const config = platform.is('hybrid') ? mobileAuthConfig : webAuthConfig;
    super(config);
  }

  async getUserInfo(): Promise<User | undefined> {
    const idToken = await this.getIdToken();
    if (!idToken) {
      return;
    }

    let email = idToken.email;
    if (idToken.emails instanceof Array) {
      email = idToken.emails[0];
    }

    return {
      id: idToken.sub,
      email,
      firstName: idToken.given_name,
      lastName: idToken.family_name
    };
  }
}
```

## Login Page

The login page currently contains boiler-plate for a standard email/password based authentication challenge. We will not be using this. Rather, we will use Ionic Auth Connect to access our OIDC provider, which will present the appropriate authentication challenge to the user.

In order to replace this with something more appropriate for use with Ionic Auth Connect, we will make the following modifications.

In the markup:

- remove the form
- remove the `*ngIf="loginForm.form.valid"` from the signin `div`
- replace the contents of the `error-message` div with `{{ errorMessage}}`
- move the "Skip Login" to the bottom

When completed, the `ion-content` for the page should look like this:

```HTML
<ion-content>
  <div
    class="login-control ion-text-center"
    (click)="signIn()"
    data-testid="signin-button"
  >
    <ion-icon name="log-in-outline"></ion-icon>
    <div>Sign In</div>
  </div>

  <div class="error-message">
    <div>{{ errorMessage }}</div>
  </div>

  <div class="ion-text-center"><a href="tabs/tab1">Skip Login</a></div>
</ion-content>
```

In the code:

- add an `errorMessage` property
- modify the way the `signIn()` method performs the login

Here is what the `signIn()` method should look like:

```TypeScript
  async signIn() {
    try {
      this.errorMessage = '';
      await this.authentication.login();
      this.navController.navigateRoot('/');
    } catch (err) {
      this.errorMessage = 'Login failed, please try again';
    }
  }
```

## The Information Page

The first thing we need to do is fix the `logout()` method since the code is currently written for the prior `AuthenticationService`, which returned an `Observable` instead of a `Promise`.

With Auth Connect, the code can be simplified considerably:

```TypeScript
async logout() {
  await this.authentication.logout();
  this.navController.navigateRoot(['/', 'login']);
}
```

**Note:** in a production application we probably would also want to wrap that in a `try ... catch` block so we can do something reasonable in the unlikely event that the `logout()` fails.

At this point, we can log in using the following credentials:

- email: `test@ionic.io`
- password: `Ion54321`

However, there are a couple of problems:

1. the Information page still shows us as logged out
1. going to Teas still causes a 401 error which kicks us back to the login page

The problem is that parts of our application are using the `VaultService` as the source of truth for our authentication information. This was correct for the previous architecture, but with the current architecture we want to use Auth Connect as the source of truth.

First let's finish up with the Information page. Upon entry to the screen we need to get the information for the currently logged in user:

```TypeScript
  async ionViewWillEnter() {
    this.currentUser = await this.authentication.getUserInfo();
  }
```

Now the application shows us as logged in, but the Teas page still will not let us in.

## Fixing the Teas Route

The reason we cannot get to the Teas page is that, while we are certainly authenticated, we are not letting our REST API know. A couple of services are still using the `VaultService` as the source of truth:

- the route guard
- the auth interceptor

We will fix those now.

### The Auth Guard

The auth-guard (`src/app/core/auth-guard.service.ts`) currently restores the session from the vault to determine if the user is authenticated:

```TypeScript
const isLoggedIn = !!(await this.vault.restoreSession());
```

Auth Connect includes a method called `isAuthenticated()` that we should use instead. This method returns a `Promise` that resolves as follows:

- the access token exists and is not expired: resolve **true**
- the access token exists but is exired: Auth Connect will attempt to refresh the token, and will resolve **true** if the refresh was successful and **false** otherwise
- the access token does not exist: resolve **false**

```TypeScript
const isLoggedIn = await this.authentication.isAuthenticated();
```

This requires injecting the `AuthenticationService` in the constructor:

```TypeScript
  constructor(
    private authentication: AuthenticationService,
    private navController: NavController,
  ) {}
```

Be sure to clean up the imports to remove anything that is now unused (which should just be the `VaultService`).

### The Auth Interceptor

At this point, we are getting 401 errors since while we are not including the access token on the outgoing request. We will fix that by updating the auth interceptor (`src/app/core/auth-interceptor.service.ts`). The interceptor has a `getToken()` method that currently pulls the token from a `session` stored in the valut:

```TypeScript
  private async getToken(): Promise<string | undefined> {
    const session = await this.vault.restoreSession();
    return session?.token;
  }
```

We are no longer managing the session ourselves, though. We are letting Auth Connect do all of the work. So let's change this code to get the access token from Auth Connect:

```TypeScript
  private async getToken(): Promise<string | undefined> {
    return this.auth.getAccessToken();
  }
```

**Note:** you will need to inject the `AuthenticationService` just like we have in other places. Be sure to clean up anything that is unsed references and imports (which should just be the `VaultService`).

Now that we are sending the access token to the backend, we should see a list of teas rather than getting 401 errors that redirect us to the login page.

## Conclusion

At this point, Ionic Auth Connect is fully configured and our authentication flow is working properly. However, we are using the default storage for the tokens, which means that we are using `localstorage` in all cases. This default behavior is only intended to ease development and is not meant or production cases.

The reason this is not a good option for production is that on mobile devices the OS can and will wipe that data out whenever it feels like it needs the memory. Ionic Auth Connect offers a couple of better options, however:

- create your own service that implements the <a href="https://ionic.io/docs/auth-connect/api#tokenstorageprovider" target="_blank">token storage provider</a> interface
- use <a href="https://ionic.io/docs/identity-vault">Ionic Identity Vault</a>

We suggest the latter. It is your easiest and most secure option. We will look at integrating that in the next section.
