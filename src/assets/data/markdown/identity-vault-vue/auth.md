# Complete the Authentication Workflow

Right now, our application has half of an authentication workflow in that we detect when the user does not have the proper authentication for an action, and we redirect them to the login screen. We do not, however, actually allow the user to login. Let's get the pieces in place for that and make sure it all works before we look into adding Identity Vault.

## The Session Model

The first thing we need to figure out is exactly what our session data should look like. For this application we will keep it simple and describe the session as a single token along with the user information.

Add a `src/models/Session.ts` file with the following contents:

```TypeScript
import { User } from './User';

export interface Session {
  user: User;
  token: string;
}
```

Be sure to update the `src/models/index.ts` file as well.

## The Authentication Service

We will need to create a service that will handle the login and logout routines.

The contents of the `AuthenticationService` class are pretty straight forward:

```TypeScript
import { client } from "./api";
import { User } from "@/models";

export default {
  async login(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    user?: User;
    token?: string;
  }> {
    const response = await client.post("/login", { username: email, password });
    return {
      success: response.data.success,
      user: response.data.user,
      token: response.data.token,
    };
  },

  async logout(): Promise<void> {
    await client.post("/logout");
  },
};
```

## A Simple Vault

Once we get the session information from our authentication service, we will need a place to store it so we can access it from the rest of our application. Let's create such a service. For now, we will just store the session information in memory.

```TypeScript
import { Session } from '@/models';

class VaultService {
  private session: Session | undefined;

  async setSession(session: Session): Promise<void> {
    this.session = session;
  }

  async getSession(): Promise<Session | null | undefined> {
    return this.session;
  }

  async clearSession(): Promise<void> {
    this.session = undefined;
  }
}

export const vault = new VaultService();
```

Ignore the fact that these methods are all `async` when they don't need to be. In an actual application you would probably have a service similar to this that is used to store your session information somewhere. In that service, those methods are likely asynchronous, but that depends on the mechanics of the storage mechanism that is being used.

When we switch to Identity Vault, these methods will need to be asynchronous, so we are just starting out coding that way. Your mileage may varry in an actual production application.

## The Rest of the App

Now that we have the basics in place, let's modify the rest of the application to handle the authentication.

### Request Interceptor

The purpose of the request interceptor is to modify outgoing requests to include the auth token in the `Authorization` header as a bearer token. Now that we have a token, we can get the token from the vault and add it to the outbound requests. In `src/services/api.ts`, the request interceptor currently looks like this:

```TypeScript
client.interceptors.request.use((config: AxiosRequestConfig) => {
  const token = '';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

As you can see, the token is just being set to an empty string. You will need to import the `vault`. You can then update the interceptor to get the session from the vault and unpack the token from the session. This will also require making the interceptor `async`.

```TypeScript
client.interceptors.request.use(async (config: AxiosRequestConfig) => {
  const session = await vault.getSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});
```

### Auth Guard

The Auth Guard exists to prevent navigation to certain pages unless the user is authenticated. Currently it just always assumes that the user is authenticated (see `src/router/index.ts`):

```TypeScript
// TODO: check that we are authenticated
const authenticated = true;
```

Change those lines as such:

```TypeScript
const authenticated = !!(await vault.getSession());
```

Be sure to import the `vault` like we did with the interceptor.

Now if the user is not logged in but tries to navigate to a page that requires authentication, they will be redirected to the login page instead.

### Login Page

From the login page, we need to perform the login and then store the session in the vault if the login is successful. First, import the `AuthenticationService` and the `vault`. Then modify the `signInClicked()` method as such:

```TypeScript
    async function signInClicked() {
      const { success, user, token } = await AuthenticationService.login(
        email.value,
        password.value,
      );
      if (success && user && token) {
        vault.setSession({
          user,
          token,
        });
        router.replace('/');
      }
    }
```

At this point, we can try the login and it should work. Use the following credentials:

- **email:** `test@ionic.io`
- **password:** `Ion54321`

### Tab 1 Page

We can now login and go to tab 2 if we wish. But the first tab still shows us as logged out. We would also like to be able to log out from this page if we are currently logged in. Let's fix that now.

First, import the `AuthenticationService` and `vault`. With those imports in place, we can use the `onIonViewWillEnter()` composition hook to perform some tasks as we enter the page. We need to get the current session so we know whether or not the user is currently logged in.

```TypeScript
    onIonViewWillEnter(async () => {
      const session = await vault.getSession();
      currentUser.value = session?.user;
    });
```

We also need to modify the `logout()` method to perform the logout and clear the session from the vault.

```TypeScript
    const logout = async () => {
      await AuthenticationService.logout();
      await vault.clearSession();
      router.replace('/login');
    };
```

## Conclusion

At this point, the full login and logout cycle works, and we have an application that implements a typical, albeit extrememly simple, authentication workflow. Of course, as soon as you refresh the browser or restart your application, you lose the session. In the next section, we will begin using Identity Vault in order to persist the session.
