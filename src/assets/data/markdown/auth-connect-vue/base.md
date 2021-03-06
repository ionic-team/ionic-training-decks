# Install the Base Application

We will start with a very simple starter application and enhance it to establish an authentication session via Ionic Auth Connect. The application we will use is a basic Ionic tabs based starter with a little code added that will eventually allow us to access some information from a REST API so we can display the information in the app.

## Clone

Before we get started, you should create an area on your file system for working on training applications. I use the `~/Projects/Training` folder, but you can use whichever folder works best for you. The key is just to keep your file system organized. Follow these steps to clone the <a href="https://github.com/ionic-team/training-lab-vue">starting project</a> for this training:

1. Open a terminal session
1. Type the following:

```bash
cd ~/Projects/Training # or whichever folder you will use to organize your training projects
git clone https://github.com/ionic-team/training-lab-vue.git training-auth-connect
cd training-auth-connect
git remote remove origin
```

## Build

Make sure you can build the application and run it in your browser.

```bash
npm i
npm run serve
```

At this point, you can view the application <a href="http://localhost:8100" target="_blank">http://localhost:8100</a>.

### Build for Devices

If you would like to try running the application on a device, follow these steps:

```bash
npm run build
npx cap sync
npx cap open android
npx cap open ios
```

**Note:** for iOS, you will need to have an Apple developer account in order to run on a device.

## Tour

Open the application in the browser. You should be on the first tab and you are not logged in. Go to the third tab. That should be accessible as well. Now try the second tab. When clicking on this tab you will be redirected to the login page. Let's have a look at what is going on within the application.

### API Service

The API service abstracts the Axios configuration required to access our backend API.

Of special note are the two interceptors defined here, one on outgoing request and the other on incoming responses. The request interceptor modifies outbound requests by adding a bearer token to the `Authorization` header.

The response interceptor examines inbound responses looking for 401 (unauthorized) errors. If it finds one, it redirects the user to the login page. **Note:** this is what is currently causing us to redirect to the login page when we try to access the tab 2 page. The flow looks something like this:

1. the auth guard is a do nothing guard at this point and lets us in
1. the tab2 page uses the tea service to try to get some tea info
1. the tea service makes the request
1. the request interceptor cannot find a token, so it does not append a bearer token
1. the request is sent to the REST API
1. the REST API rejects to unauthorized request with a 401 error code
1. the response interceptor examines the response, sees the 401 error code, and redirects the user to the login page

### Tea Service

The tea service is a basic HTTP service that fetches tea related data from a REST API using the Axios client defined in our API service. Our REST API requires authentication in order to provide data. We currently lack a means to provide that authentication.

### Auth Guard

In `src/route/index.ts` we have a method called `checkAuthStatus`. The purpose of this method is to to guard our routes that require authentication by disallowing navigation if we are not currently authenticated. Currently, it does nothing and just returns `true`, allowing us through.

### Tab2 Page

The tab 2 page uses the tea service to obtain tea related data from our REST API. It then displays that information in a list.

## Conclusion

This is our starting point. Our goal will be to integrate Auth Connect with our application so the flow looks more like one of the following.

When not logged in:

1. the auth guard asks Auth Connect if we are authenticated
1. Auth Connect returns `false`
1. the auth guard disallows navigation to the page and instead redirects users to the login page

When logged in:

1. the auth guard asks Auth Connect if we are authenticated
1. Auth Connect returns `true`
1. the auth guard allows the navigation
1. the page uses the tea service to try to get some tea info
1. the tea service makes the request
1. the request interceptor gets an access token from Auth Connect and adds it as a bearer token in the Authorization header
1. the request is sent to the REST API
1. the REST API accepts the request and returns the data
1. the page displays the returned data

In the next section we will get started by installing and configuring Auth Connect.
