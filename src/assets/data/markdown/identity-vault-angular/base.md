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

Open the application in the browser. You should be on the first tab and you are not logged in. Go to the third tab. That should be accessible as well. Now try the second tab. When clicking on this tab you will be redirected to the login page. Let's have a look at what is going on within the application.

Have a look at the following various parts of the application. With the exception of the page, which is in its own folder, all of these items can be found under `src/app/core`.

### Tea Service

The tea service is a basic HTTP service that fetches tea related data from a REST API using Angular's HttpClient service. Our REST API requires authentication in order to provide data. We currently lack a means to provide that authentication.

### Tab2 Page

The tab 2 page uses the tea service to obtain tea related data from our REST API. It then displays that information in a list.

### Auth Guard

The auth guard is intended to guard our route by disallowing navigation if we are not currently authenticated. Currently, it does nothing and just returns `true`, allowing us through.

### HTTP Interceptors

Our application contains two HTTP interceptors: an auth interceptor and an unauth interceptor.

The auth interceptor modifies outbound requests. It adds a bearer token to the `Authorization` header of any request that requires a token. For our application, this is any request other than a `login` request.

The unauth interceptor examines inbound responses looking for 401 (unauthorized) errors. If it finds one, it redirects the user to the login page. **Note:** this is what is currently causing us to redirect to the login page when we try to access the tab 2 page. The flow looks something like this:

1. the auth guard is a do nothing guard at this point and lets us in
1. the page uses the tea service to try to get some tea info
1. the tea service makes the request
1. the auth interceptor cannot find a token, so it does not append a bearer token
1. the request is sent to the REST API
1. the REST API rejects to unauthorized request with a 401 error code
1. the unauth interceptor examines the response, sees the 401 error code, and redirects the user to the login page

## Conclusion

This is our starting point. Our goal will be to create an authentication service that will establish our session and then integrate Identity Vault with our application to securely store the session information. When we are done, the flow will look like this:

When not logged in:

1. The user starts on the tab one page, which tells them they are not logged in.
1. The tab 2 page's route is guarded. The guard will redirect the user to the login page, at which point they will need to login in to continue.

When logged in:

1. The user starts on the tab one page. If the vault is locked, the user will be asked to unlock it. The page tells them they are logged in.
1. When the user goes to page 2, the session data is obtained from the vault by the HTTP interceptor, unlocking the vault if it is locked.

In the next section we will get started by implementing a simple authentication workflow without identity vault
