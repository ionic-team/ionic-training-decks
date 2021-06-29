# Install Auth Connect

The first thing we need to do is install Auth Connect. In order to do this, you will need to have an Ionic Enterprise key that includes access to Auth Connect. Since you are working through this particular tutorial, it is assumed that you have one. There are two ways you can associate this application with your Ionic Enterprise key:

- you can perform this <a href="" target="_blank">registration</a>
- or you can copy the `.npmrc` file from your production application if you have already performed the registration there

**Note:** your key is only for a single production application, but you can use it with as many training exercises as you would like. The same holds true for prototype applications. If you would like to whip up a prototype application in which to try a new authentication workflow that you may incorporate into your production application, please do. If you need to use Auth Connect in more production applications, however, please contact us about obtaining more keys.

Once the app is properly registered (or the `.npmrc` file is properly copied over), you should perform the following commands to install Auth Connect and update your native projects:

```bash
npm i @ionic-enterprise/auth
ionic cap update
```

## Environment

Often, the most difficult part of setting up Auth Connect is simply making sure you have the OIDC provider configured correction and then properly translating that configuration into the Auth Connect configuration. Please refer to <a href="https://ionic.io/docs/auth-connect/aws-cognito" target="_blank">our setup guides</a> for information on how to configure your provider. The information that each provider needs is generally the same with some minor differences, so if your provider is not listed you should be able to get started by looking at one of the other providers. Auth0 is the most standard of the bunch so is very likely a good place to start.

Once we have the OIDC provider configured properly, we need to configure Auth Connect such that it knows about the OIDC provider. We have a <a href="https://github.com/ionic-team/cs-demo-ac-providers" target="_blank">sample application</a> that will help in this regard. This application is focused solely on the login and logout flows and making sure that the configuration is correct. For this reason we suggest modifying this application for your OIDC provider and working with the configuration within the application. This will then make it easier to integrate the proper configuration into your own application.

Here is the configuration that is required to connect to the provider that we have for this application. This will need to be added to our `src/environments/environment.ts` and `src/environments/environment.prod.ts` files. In a real-world application it is very likely that this information would be different between development and production, but that is not the case here.

```TypeScript
import { IonicAuthOptions } from '@ionic-enterprise/auth';

const baseConfig = {
  authConfig: 'cognito' as 'cognito',
  clientID: '4geagm2idmq87fii15dq9toild',
  discoveryUrl:
    'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_YU8VQe29z/.well-known/openid-configuration',
  clientSecret: '124dch1p6824ppuef8o71unk14d4pt3p5hnntofvu21i2m960r1g',
  scope: 'openid email profile',
  audience: '',
};

export const mobileAuthConfig: IonicAuthOptions = {
  ...baseConfig,
  redirectUri: 'msauth://login',
  logoutUrl: 'msauth://login',
  platform: 'cordova',
  iosWebView: 'private',
  androidToolbarColor: 'Red'
};

export const webAuthConfig: IonicAuthOptions = {
  ...baseConfig,
  redirectUri: 'http://localhost:8100/login',
  logoutUrl: 'http://localhost:8100/login',
  platform: 'web'
};
```

**Note:** When updating the `src/environments/*` files, be sure to add the above code but do not replace the `environment` object.

## Native Project Configuration

### Android

Open the Android project in Android Studio via `ionic cap open android` and find the `AndroidManifest.xml` file. Add the following intent within the `activity` node.

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

## Conclusion

At this point, we have our OIDC provider configured. We also have Auth Connect installed and configured within our application. In the next section we will implement the authentication workflow.
