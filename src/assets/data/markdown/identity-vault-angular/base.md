# Install the Base Application

We will start with a very simple starter application and enhance it to securely store our session data via Ionic Identity Vault. The application we will use is a basic Ionic tabs based starter with a little code added that will eventually allow us to access some information from a REST API so we can display the information in the app.

## Clone

Before we get started, you should create an area on your file system for working on training applications. I use the `~/Projects/Training` folder, but you can use whichever folder works best for you. The key is just to keep your file system organized. Follow these steps to clone the <a href="https://github.com/ionic-team/training-lab-angular">starting project</a> for this training:

1. Open a terminal session
1. Type the following:

```bash
cd ~/Projects/Training # or whichever folder you will use to organize your training projects
git clone https://github.com/ionic-team/training-lab-angular.git training-identity-vault
cd training-identity-vault
git remote remove origin
```

## Build

Make sure you can build the application and run it in your browser.

```bash
npm i
npm start
```

At this point, you can view the application <a href="http://localhost:8100" target="_blank">http://localhost:8100</a>.

### Build for Devices

If you would like to try running the application on a device, follow these steps:

```bash
ionic cap sync
ionic cap open android
ionic cap open ios
```

**Note:** for iOS, you will need to have an Apple developer account in order to run on a device.

## Tour

Open the application in the browser. You should be on the Information tab and you are not logged in. Go to the Settings tab. That should be accessible as well. Now try the Teas tab. When clicking on this tab you will be redirected to the login page. Let's have a look at what is going on within the application.

Have a look at the following various parts of the application. With the exception of the page, which is in its own folder, all of these items can be found under `src/app/core`.

### Tea Service

The tea service is a basic HTTP service that fetches tea related data from a REST API using Angular's HttpClient service. Our REST API requires authentication in order to provide data. We currently lack a means to provide that authentication.

### Teas Page

The teas page uses the tea service to obtain tea related data from our REST API. It then displays that information in a list.

### Auth Guard

The auth guard is intended to guard our route by disallowing navigation if we are not currently authenticated. It does this by asking the vault service if a session is currently defined.

### Authentication Service

This service provides us with basic HTTP login and logout functionality.

### Vault Service

This service stores information about the current session. This is the vault where our authentication token will be stored. Currently, however, it is just storing the data in memory.

### HTTP Interceptors

Our application contains two HTTP interceptors: an auth interceptor and an unauth interceptor.

The auth interceptor modifies outbound requests. It adds a bearer token to the `Authorization` header of any request that requires a token. For our application, this is any request other than a `login` request.

The unauth interceptor examines inbound responses looking for 401 (unauthorized) errors. If it finds one, it redirects the user to the login page. **Note:** in our architecture, this is a fail-safe interceptor for cases where we have an active session, but the token for that session has either expired or has otherwise been invalidated.

## Conclusion

This is our starting point. Our goal is to integrate Identity Vault with our application to securely store the session information. When we are done, the flow will look like this:

When not logged in:

1. The user starts on the Information page, which tells them they are not logged in.
1. When the user goes to the Teas page, the page's guard will redirect the user to the login page. At which point they will need to login in to continue.

When logged in:

1. The user starts on the Information page. If the vault is locked, the user will be asked to unlock it. The page tells them they are logged in.
1. When the user goes to the Teas page, the session data is obtained from the vault by the HTTP interceptor.
1. The user will be prompted to provide biometric or passcode information to unlock the vault as needed.

If you would like to try this now, you can do so with the following credentials:

- **email:** `test@ionic.io`
- **password:** `Ion54321`

As you can see, we are almost there in that we can log in and navigate around. However, as soon as we restart the application we need to log in again. The session data is not persisted. In the next section we will get started by installing Identity Vault.
