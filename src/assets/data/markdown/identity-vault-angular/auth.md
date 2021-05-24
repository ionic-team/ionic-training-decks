# Complete the Authentication Workflow

Right now, our application has half of an authentication workflow in that we detect when the user does not have the proper authentication for an action, and we redirect them to the login screen. We do not, however, actually allow the user to login. Let's get the pieces in place for that and make sure it all works before we look into adding Identity Vault.

## The Session Model

The first thing we need to figure out is exactly what our session data should look like. For this application we will keep it simple and describe the session as a single token along with the user information.

Add a `src/app/models/session.ts` file with the following contents:

```TypeScript
import { User } from './user';

export interface Session {
  user: User;
  token: string;
}
```

Be sure to update the `src/app/models/index.ts` file as well.

## The Authentication Service

We will need to generate a service that will handle the login and logout routines.

```bash
ionic generate service core/authentication --skipTests
```

Be sure to update the `src/app/core/index.ts` file as well.

The contents of the `AuthenticationService` class are pretty straight forward:

```TypeScript
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Session } from '../models';

interface LoginResponse extends Session {
  success: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<Session | undefined> {
    return this.http
      .post<LoginResponse>(`${environment.dataService}/login`, {
        username: email,
        password,
      })
      .pipe(
        map(res => {
          if (res.success) {
            delete res.success;
            return res;
          }
        }),
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${environment.dataService}/logout`, {});
  }
}
```

## A Simple Vault

Once we get the session information from our authentication service, we will need a place to store it so we can access it from the rest of our application. Let's create such a service now:

```bash
ionic generate service core/vault --skipTests
```

Be sure to update the `src/app/core/index.ts` file as well.

For now, we will just store the session information in memory.

```TypeScript
import { Injectable } from '@angular/core';
import { Session } from '../models';

@Injectable({
  providedIn: 'root',
})
export class VaultService {
  private session: Session;

  constructor() {}

  async setSession(session: Session): Promise<void> {
    this.session = session;
  }

  async getSession(): Promise<Session> {
    return this.session;
  }

  async clearSession(): Promise<void> {
    this.session = null;
  }
}
```

Ignore the fact that these methods are all `async` when they don't need to be. In an actual application you would probably have a service similar to this that is used to store your session information somewhere. In that service, those methods are likely asynchronous, but that depends on the mechanics of the storage mechanism that is being used.

When we switch to Identity Vault, these methods will need to be asynchronous, so we are just starting out coding that way. Your mileage may vary in an actual production application.

## The Rest of the App

Now that we have the basics in place, let's modify the rest of the application to handle the authentication.

### Auth Interceptor

The purpose of the auth interceptor is to modify outgoing requests to include the auth token in the `Authorization` header as a bearer token. Now that we have a token, we can get the token from the vault and add it to the outbound requests:

You will need to inject the `VaultService` and then update the `getToken()` method as such:

```TypeScript
  private async getToken(): Promise<string | undefined> {
    const session = await this.vault.getSession();
    return session?.token;
  }
```

### Auth Guard

The Auth Guard exists to prevent navigation to certain pages unless the user is authenticated. Currently it just returns `true`, letting all navigation occur. Let's fix that now. Change `src/app/core/auth-guard.service.ts` as such:

```TypeScript
import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { NavController } from '@ionic/angular';
import { VaultService } from './vault.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService implements CanActivate {
  constructor(
    private navController: NavController,
    private vault: VaultService,
  ) {}

  async canActivate(): Promise<boolean> {
    const isLoggedIn = !!(await this.vault.getSession());
    if (!isLoggedIn) {
      this.navController.navigateRoot(['/', 'login']);
    }
    return isLoggedIn;
  }
}
```

Now if the user is not logged in but tries to navigate to a page that requires authentication, they will be redirected to the login page instead.

### Login Page

From the login page, we need to perform the login and then store the session in the vault if the login is successful. First, inject the `AuthenticationService` and the `VaultService`. Then modify the `signIn()` method as such:

```TypeScript
  signIn() {
    this.authentication.login(this.email, this.password).subscribe(session => {
      if (session) {
        this.vault.setSession(session);
        this.navController.navigateRoot('/');
      }
    });
  }
```

At this point, we can try the login and it should work. Use the following credentials:

- **email:** `test@ionic.io`
- **password:** `Ion54321`

### Tab 1 Page

We can now login and go to tab 2 if we wish. But the first tab still shows us as logged out. We would also like to be able to log out from this page if we are currently logged in. Let's fix that now.

First, inject the `AuthenticationService` and `VaultService`. With that in place, we can use `ionViewWillEnter()` to get the current session, and we can modify the `logout()` method to perform the logout and clear the session from the vault.

```TypeScript
  async ionViewWillEnter() {
    const session = await this.vault.getSession();
    this.currentUser = session?.user;
  }

  logout() {
    this.authentication
      .logout()
      .pipe(
        tap(() => {
          this.vault.clearSession();
          this.navController.navigateRoot(['/', 'login']);
        }),
      )
      .subscribe();
  }
```

## Conclusion

At this point, the full login and logout cycle works, and we have an application that implements a typical, albeit extremely simple, authentication workflow. Of course, as soon as you refresh the browser or restart your application, you lose the session. In the next section, we will begin using Identity Vault in order to persist the session.
