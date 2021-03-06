# Install Auth Connect

The first thing we need to do is install Auth Connect. In order to do this, you will need to have an Ionic Enterprise key that includes access to Auth Connect. Since you are working through this particular tutorial, it is assumed that you have one. There are two ways you can associate this application with your Ionic Enterprise key:

- you can perform this <a href="" target="_blank">registration</a>
- or you can copy the `.npmrc` file from your production application if you have already performed the registration there

**Note:** your key is only for a single production application, but you can use it with as many training exercises as you would like. The same holds true for prototype applications. If you would like to whip up a prototype application in which to try a new authentication workflow that you may incorporate into your production application, please do. If you need to use Auth Connect in more production app, however, please contact us about obtaining more keys.

Once the app is properly registered (or the `.npmrc` file is properly copied over), you should perform the following commands to install Auth Connect and update your native projects:

```bash
npm i @ionic-enterprise/auth
npx cap update
```

## Configuration

Often, the most difficult part of setting up Auth Connect is simply making sure you have the OIDC provider configured correction and then properly translating that configuration into the Auth Connect configuration. Please refer to <a href="https://ionic.io/docs/auth-connect/aws-cognito" target="_blank">our setup guides</a> for information on how to configure your provider. The information that each provider needs is generally the same with some minor differences, so if your provider is not listed you should be able to get started by looking at one of the other providers. Auth0 is the most standard of the bunch so is very likely a good place to start.

Once we have the OIDC provider configured properly, we need to configure Auth Connect such that it knows about the OIDC provider. We have a <a href="https://github.com/ionic-team/cs-demo-ac-providers" target="_blank">sample application</a> that will help in this regard. This application is focused solely on the login and logout flows and making sure that the configuration is correct. For this reason we suggest modifying this application for your OIDC provider and working with the configuration within the application. This will then make it easier to integrate the proper configuration into your own application.

**Note:** the CS Demo AC Providers app is currently only available in Angular and React flavors. However, this should allow you to verify your configuration in a way that is easy to adapt to your Vue code. A Vue version of this sample will be created at a later date.

Here is the configuration that is required to connect to the provider that we have for this application:

- **Base:**
  - **OIDC Provider:** Cognito
  - **client ID:** `4geagm2idmq87fii15dq9toild`
  - **Scope:** `openid email profile`
  - **Dicovery URL:** `https://cognito-idp.us-east-2.amazonaws.com/us-east-2_YU8VQe29z/.well-known/openid-configuration`
  - **Client Secret:** `124dch1p6824ppuef8o71unk14d4pt3p5hnntofvu21i2m960r1g`
  - **Audiece:** ``
- **Mobile:**
  - **Redirect URI:** `msauth://login`
  - **Logout URL:** `msauth://login`
- **Web:**
  - **Redirect URI:** `http://localhost:8100/login`
  - **Logout URL:** `http://localhost:8100/login`

The redirect URI and logout URL in mobile do not actually exist in our app. Take note of the URL scheme used here. It should be the same for both "redirect" and "logout" and will be required when we perform the native project configuration.

For the web URLs, the paths need to be valid, though Auth Connect will not actually redirect to them unless using the <a href="https://ionic.io/docs/auth-connect/api#webauthflow" target="_blank">implicit flow</a> with a UI mode of <a href="https://ionic.io/docs/auth-connect/api#implicitlogin" target="_blank">POPUP</a> (details of doing so are not covered by this tutorial).

Add a file called `src/services/AuthConnectConfig.ts`. Add code that abstracts the above configuration into the <a href="https://ionic.io/docs/auth-connect/api#interface-ionicauthoptions" target ="_blank">Auth Connect configuration object</a>. This will allow us to build the proper configuration based on the current platform. This will also allow us to expand the configuration in the future when, for example, we have different configurations based on whether we are doing a production or an development build.

**`src/services/AuthConnectConfig.ts`**

```TypeScript
import { IonicAuthOptions } from '@ionic-enterprise/auth';
import { isPlatform } from '@ionic/vue';

const baseConfig = {
  authConfig: 'cognito' as 'cognito',
  clientID: '4geagm2idmq87fii15dq9toild',
  discoveryUrl:
    'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_YU8VQe29z/.well-known/openid-configuration',
  clientSecret: '124dch1p6824ppuef8o71unk14d4pt3p5hnntofvu21i2m960r1g',
  scope: 'openid email profile',
  audience: '',
};

const mobileAuthConfig: IonicAuthOptions = {
  ...baseConfig,
  redirectUri: 'msauth://login',
  logoutUrl: 'msauth://login',
  platform: 'cordova',
  iosWebView: 'private',
  androidToolbarColor: 'Red',
};

const webAuthConfig: IonicAuthOptions = {
  ...baseConfig,
  redirectUri: 'http://localhost:8100/login',
  logoutUrl: 'http://localhost:8100/login',
  platform: 'web',
};

export function getAuthConfig(): IonicAuthOptions {
  return isPlatform('hybrid') ? mobileAuthConfig : webAuthConfig;
}
```

## Native Project Configuration

### Android

Open the Android project in Android Studio via `npx cap open android` and find the `AndroidManifest.xml` file. Add the following intent within the `activity` node.

```xml
<intent-filter>
    <data android:scheme="msauth"/>
    <action android:name="android.intent.action.VIEW"/>
    <category android:name="android.intent.category.DEFAULT"/>
    <category android:name="android.intent.category.BROWSABLE"/>
</intent-filter>
<intent-filter>
    <action android:name="android.intent.action.SEND"/>
    <category android:name="android.intent.category.DEFAULT"/>
    <data android:mimeType="text/*"/>
</intent-filter>
```

Also add the following within the root `manifest` node:

```xml
  <queries>
    <intent>
      <action android:name="android.support.customtabs.action.CustomTabsService" />
    </intent>
  </queries>
```

Most of this is boiler-plate. Pay attention to the following line, however:

```xml
    <data android:scheme="msauth"/>
```

The value supplied here _must_ match the schema used in the `redirectUri` of your mobile auth-connect config. This informs the native application that it should listen for and accept deep links that use that schema.

**Note:** you can also do this by directly editing `android/app/src/main/AndroidManifest.xml` in your favorite editor.

### iOS

- Open `App/App/Info.plist` in Xcode
- Look for an existing `URL Types > Item 0 > URL Schemas > Item 0`
  - If it does not exist:
    - Add `URL types`, which will create an `Item 0` since it is an array
    - Under `Item 0` a `URL identifier` node will have been added by default, change it to `URL Schemas`
    - This is also an array and will have an `Item 0`, give it is value of `msauth`
  - If it exists, add another item under `URL Schemas` and give it a value of `msauth`

You can also add it directly to the `ios/App/App/Info.plist` file. In the case that you need to add this "from scratch" such as in this training application, it will look like this:

```xml
  <key>CFBundleURLTypes</key>
  <array>
    <dict>
      <key>CFBundleURLSchemes</key>
      <array>
        <string>msauth</string>
      </array>
    </dict>
  </array>
```

In the case where you already have `URL types` defined (such as in a Capacitor v2 application), the setting will look more like the following. In this case you are just adding the `<string>msauth</string>` node within the `CFBundleURLSchemes` child array.

```xml
  <key>CFBundleURLTypes</key>
  <array>
    <dict>
      <key>CFBundleURLName</key>
      <string>com.getcapacitor.capacitor</string>
      <key>CFBundleURLSchemes</key>
      <array>
        <string>capacitor</string>
        <string>msauth</string>
      </array>
    </dict>
  </array>
```

## Troubleshooting

The most common mistake made when setting up Auth Connect is with the `redirectUri` and `logoutUrl`. These need to be represented in the list of associated URLs that are supplied in the OIDC setup. The following guidelines should be kept in mind:

**Web**

- the `redirectUri` and `logoutUrl` should be valid routes in the application
- the `redirectUri` and `logoutUrl` will not be routed to unless `implicitLogin` is set to `CURRENT`, otherwise Auth Connect will handle the callback from the OIDC provider
- actual routing in your application (unless you are using `implicitLogin: 'CURRENT'`) can be handled via a couple of different strategies:
  - via the `onLoginSuccess()` and `onLogout()` event handlers
  - programmatically after awaiting the `login()` or `logout()` calls
- these values will likely take the form of `http://localhost:8100/login` in development
- these values will likely take the form of `https://yourapp.yourcompany.com/login` in production

**Note:** for `implicitLogin: 'CURRENT'` your app will handle the callback <a href="https://github.com/ionic-team/demo-authconnect-auth0/blob/master/src/app/login/login.page.ts" target="_blank">as shown here</a>. The implicit `CURRENT` flow increases the complexity of your application due to how it works, and is not covered by this training. Please consult with the Ionic Customer Success team if you are thinking of using this flow.

**Mobile**

- the `redirectUri` and `logoutUrl` do not need to be meaningful within your application
- these values will likely take the form of `com.company.app://callback` in both development and production

Notice the schema used in the `redirectUri` and `logoutUrl` on mobile. The only requirement here is that it is something that is unique to your application. Otherwise, it can be anything you want it to be so long as it matches a URI you have set on in the OIDC provider configuration as valid.

In general, a schema like `msauth` like we are using for the training is not very good. You should use something far more specific such as the bundle ID of your application. For the training app, however, you have to use `msauth` as we have configured above. The reason for this is that this is out the OIDC provider we are using is configured.

## Testing

We are not doing any unit testing for this tutorial. However, in a production application unit tests are absolutely essential to having a maintainable product. If you perform a `npm run test:unit` you will get errors building the tests. To fix this, update the `jest.config.js` by adding `@ionic-enterprise` to the `transformIgnorePatterns` and adding a `setupFiles` array with a routine to patch JS-DOM.

The `jest.config.js` should look something like this:

```JavaScript
module.exports = {
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  transform: {
    '^.+\\.vue$': 'vue-jest'
  },
  transformIgnorePatterns: ['/node_modules/(?!@ionic/vue|@ionic/vue-router|@ionic-enterprise)'],
  setupFiles: ['./patchJSDom.js']
};
```

The `patchJSDom.js` file needs to patch in a mock `matchMedia` function:

```JavaScript
/* eslint-disable */

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});
```

Now your tests will compile and run. They will still very likely fail, but this time with an actual testing error. But that is just because we are not maintaining the tests... 🤓

## Conclusion

At this point, we have our OIDC provider configured. We also have Auth Connect is installed and configured within our application. In the next section we will implement the authentication workflow.
