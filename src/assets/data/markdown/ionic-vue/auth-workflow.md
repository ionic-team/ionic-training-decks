# Lab: Create the Authentication Workflow

So far, we have a composition API function that manages the session. It is now time to put all of theses pieces together to create an authentication workflow.

In this lab you will add the following capabilities:

- Handle the Login
- Handle the Logout
- Guard the routes that require a session

## Modify the View Tests

We will begin using the router from within the views. As a result, we will need to refactor how the view is mounted within our tests. In `src/views/__tests__/LoginPage.spec.ts` and `src/views/__tests__/TeaListPage.spec.ts`, make the following modifications:

- Import `createRouter`, `createWebHistory`, and `Router` from `vue-router`.
- Create a method called `mountView` that is responsible for setting up the router and mounting the view.
- Replace the current `mount()` calls in the tests with `mountView()` calls. Note that since `mountView()` is `async`, this will require making all of the tests `async`.
- Import `useAuth` from `@/composables/auth`.
- Mock the `useAuth` composition function that we imported.

Here is an example from the `LoginPage` test. Make similar modifications to the `TeaListPage` test as well.

```typescript
import LoginPage from '@/views/LoginPage.vue';
import { IonTitle } from '@ionic/vue';
import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import waitForExpect from 'wait-for-expect';
import { createRouter, createWebHistory, Router } from 'vue-router';
import { useAuth } from '@/composables/auth';

vi.mock('@/composables/auth');

describe('LoginPage.vue', () => {
  let router: Router;

  const mountView = async (): Promise<VueWrapper<any>> => {
    router = createRouter({
      history: createWebHistory(process.env.BASE_URL),
      routes: [{ path: '/', component: LoginPage }],
    });
    router.push('/');
    await router.isReady();
    return mount(LoginPage, {
      global: {
        plugins: [router],
      },
    });
  };

  it('displays the title', async () => {
    const wrapper = await mountView();
    const titles = wrapper.findAllComponents(IonTitle);
    expect(titles).toHaveLength(1);
    expect(titles[0].text()).toBe('LoginPage');
  });

  // Other test cases exists here and will need similar mods to the one above.
});
```

## Handle the Login

When the user clicks on the "Sign On" button in the LoginPage view, we need to satisfy the following requirements:

- Perform the login.
- If the login fails, we need to display an error message.
- If the login succeeds, we need to navigate to the root page of the application.

### Login and Navigation

We are ready to define the login and navigation requirements via a set of tests (only add the stuff that doesn't already exist, some items are included below just to provide context):

```typescript
// Imports are here, you will need to add missing things...

vi.mock('@/composables/auth');

describe('LoginPage.vue', () => {
  // Other describes are here...

  describe('sign in button', () => {
    // Existing button disabled test is here...

    describe('clicking', () => {
      let wrapper: VueWrapper<any>;
      beforeEach(async () => {
        wrapper = await mountView();
        const email = wrapper.findComponent('[data-testid="email-input"]');
        const password = wrapper.findComponent('[data-testid="password-input"]');
        await email.setValue('test@test.com');
        await password.setValue('test');
      });

      it('performs the login', async () => {
        const { login } = useAuth();
        const button = wrapper.find('[data-testid="signin-button"]');
        button.trigger('click');
        expect(login).toHaveBeenCalledTimes(1);
        expect(login).toHaveBeenCalledWith('test@test.com', 'test');
      });

      describe('if the login succeeds', () => {
        beforeEach(() => {
          const { login } = useAuth();
          (login as Mock).mockResolvedValue(true);
        });

        it('navigates to the root page', async () => {
          const button = wrapper.find('[data-testid="signin-button"]');
          router.replace = vi.fn();
          button.trigger('click');
          await flushPromises();
          expect(router.replace).toHaveBeenCalledTimes(1);
          expect(router.replace).toHaveBeenCalledWith('/');
        });
      });

      describe('if the login fails', () => {
        beforeEach(() => {
          const { login } = useAuth();
          (login as Mock).mockResolvedValue(false);
        });

        it('does not navigate', async () => {
          const button = wrapper.find('[data-testid="signin-button"]');
          router.replace = vi.fn();
          button.trigger('click');
          await flushPromises();
          expect(router.replace).not.toHaveBeenCalled();
        });
      });
    });
  });
});
```

For the code, here are the pieces. It is up to you to find the correct spot in `src/views/LoginPage.vue` to place each of these pieces.

First the one-liners:

- `import { useRouter } from 'vue-router';`
- `import { useAuth } from '@/composables/auth';`
- Add a click event binding to the button: `@click="signinClicked"`.

Now we can define our click handler.

```typescript
const { login } = useAuth();
const router = useRouter();

const signinClicked = async () => {
  // Code Challenge: call the login and react to the resolved value
  // Use the tests we wrote to figure out the code to write
};
```

**Hints:**

1. `email`, and `password` are both reactive references, so you will need to access the `value` property to read and write them in the code (example: `fooBar.value = 0`).
1. Due to the way `yup` works, you may need to cast the `email` and `password` values to strings (`email.value as string`).

Try running the app. You should see an error message when invalid credentials are used, and navigation to the tea list page when valid credentials are used. Here are some valid credentials:

- **email:** test@ionic.io
- **password:** Ion54321

### Login Failures

The user can enter the wrong email or password. If they do so, we will not store a session and we will not navigate. Try that out from the login page just to be sure. The fact that we stay on the login page is good, but there is no indication provided to the user.

We will use a <a href="https://ionicframework.com/docs/api/toast" target="_blank">toast</a> to inform the user when they enter invalid credentials. First add the following markup somewhere within the `template`. It does not really matter where. I placed it after the footer. Remember to `import` the `IonToast` component in the `script` section.

```html
<ion-toast
  :isOpen="loginFailed"
  message="Invalid Email or Password!"
  color="danger"
  :duration="3000"
  @didDismiss="loginFailed = false"
></ion-toast>
```

Note that we are using `loginFailed` to open the toast. The toast will open when `loginFailed` is set to `true`. The toast stays up for three seconds and then closes. When it closes, `didDismiss` is fired and we set `loginFailed` to `false`.

Play around with some of the options on the `ion-toast`. Perhaps you would rather position the toast in the middle? Try that. Note that you may need to reload the page as sometimes HMR and caching causes odd re-rendering.

In the `script` section, we need to define the property, initialize it to `false`, and set it to `true` if the login fails.

```typescript
  const loginFailed = ref(false);

  // other code is here...

  const signinClicked = async () => {
    // Your code may look a bit different, and that is OK
  if (await login(email.value, password.value)) {
    router.replace('/')
  } else {
    loginFailed.value = true;
  }
```

## Handle the Logout

We can log in, but what about logging out? For now, we will add that to the Tea page.

Let's add the actual button first. In `src/views/TeaListPage.vue` add the following markup within the `ion-toolbar` that is in the header:

```html
<ion-buttons slot="end">
  <ion-button data-testid="logout-button" @click="logoutClicked">
    <ion-icon slot="icon-only" :icon="logOutOutline"></ion-icon>
  </ion-button>
</ion-buttons>
```

Now we will need to go to the `script` tag and make some adjustments. Where we are doing the imports, add the following:

- add `IonButton`, `IonButtons`, and `IonIcon` to the list of components being imported
- add `import { logOutOutline } from 'ionicons/icons';`
- add a shell `loginClicked()` function

```typescript
const logoutClicked = async (): Promise<void> => {};
```

Now let's make that button actually do something. Specifically, let's make it log us out. First we need to import and mock `@/composables/auth`. With that modification in place, we can add the tests that express our current requirements:

```typescript
describe('logout button', () => {
  it('performs a logout when the logout button is clicked', async () => {
    const { logout } = useAuth();
    const wrapper = await mountView();
    const button = wrapper.find('[data-testid="logout-button"]');
    router.replace = vi.fn();
    await button.trigger('click');
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('navigates to the login after the logout action is complete', async () => {
    const wrapper = await mountView();
    const button = wrapper.find('[data-testid="logout-button"]');
    router.replace = vi.fn();
    await button.trigger('click');
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/login');
  });
});
```

Back in the view's code, fill out the logic for the `logoutClicked()` function that was created within the `script` section. **Hint:** you will need to import `useAuth` and use the `logout` function from it. You will also need to use `useRouter`. See the `LoginPage` page for examples.

Test that out in the browser. The full flow should now work.

## Guard the Routes

There are some routes within our app where we do not want to allow users to go unless they are logged in. Let's create a guard for that. All of this work will be done within `src/router/index.js`

First, let's write the guard itself. Add a `checkAuthStatus()` function to the top of the file, after the imports.

```typescript
const { getSession } = useSession();

const checkAuthStatus = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const session = await getSession();
  if (!session && to.matched.some((r) => r.meta.requiresAuth)) {
    return next('/login');
  }
  next();
};
```

You will need to add a couple of imports for this to compile:

- Add: `import { useSession } from '@/composables/session';`
- Add `RouteLocationNormalized` and `NavigationGuardNext` to the existing import from `vue-router`

The guts of the `checkAuthStatus()` function are:

- If we do not have a session, use `to.matched` to check each segment of the target route. If at least one segment in the route requires authentication redirect to the LoginPage page.
- Otherwise (either we have a session, or no segments required authentication), continue to the next hook in the pipeline.

Next, after we create the router, call the guard for each route change (code given in context, only add the appropriate line in your own code).

```typescript
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(checkAuthStatus);

export default router;
```

Finally, mark the teas route as requiring authentication:

```typescript
  {
    path: '/teas',
    name: 'Teas',
    component: TeaList,
    meta: { requiresAuth: true },
  },
```

At this point, if you logout and the try to manually go to either `http://localhost:8100/` or `http://localhost:8100/teas`, you should be redirected to the login page.

## Add Interceptors

We need to intercept outgoing requests and add the token if we have one. We also need to take a look at responses coming back from the server, and if we get a 401 we need to clear our store state as it is invalid. Make the appropriate modifications to `src/composables/backend-api.ts`.

You will need to update the imports.

```typescript
import axios, { InternalAxiosRequestConfig } from 'axios';

import router from '@/router';
import { useSession } from '@/composables/session';

const { clearSession, getSession } = useSession();
```

After the client is created, but before the module is exported, you will need to add the interceptors.

```typescript
client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const session = await getSession();
  if (session && session.token && config.headers) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.status === 401) {
      clearSession().then(() => router.replace('/login'));
    }
    return Promise.reject(error);
  }
);
```

## Linting

We have been developing for a bit now, but have not run `lint` at all (though to be fair, Vue's build process does this for us). I suggest running lint early and often. At the very least, before any commit to `main` (or `master`) we should run `lint` and clean up any issues in our code. Let's do that now:

```bash
npm run lint
```

You may or may not have any issues, depending on how you have followed along in the labs. Fix any linting issues that you have now. If you have any questions about how to fix anything, let's discuss them.

## Conclusion

We now have a fully operational authentication workflow within our application.
