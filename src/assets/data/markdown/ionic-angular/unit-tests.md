# Lab: Unit Testing Infrastructure

In this lab, you will learn how to:

- Setup headless support for Chrome
- Run the existing suite of unit tests
- Install some centralized mock factories

## Set Up Headless Chrome Support

Using Chrome in headless mode allows the tests to run in a real browser (Chrome) without taking up valuable screen real estate with an actual browser window. Since there is no drawing being performed, the tests also tend to run faster. Finally, if tests are going to be run on a CI/CD server of some type, headless support is almost certainly required.

I suggest changing the `test` script configuration in the `package.json` file as such:

```JSON
  "scripts": {
    "build": "ng build",
    "e2e": "ng e2e",
    "lint": "ng lint",
    "ng": "ng",
    "start": "ng serve",
    "test": "ng test --browsers=ChromeHeadless",
    "test:ci": "ng test --no-watch --browsers=ChromeHeadless",
    "test:debug": "ng test"
  },
```

## Run the Tests

With our current configuration, there are three convenient ways to run the tests:

- `npm test` - runs the tests in a headless environment and waits for changes. This is the default and should be used for most development.
- `npm run test:debug` - runs the tests in a visible browser and waits for changes. This configuration is most useful for debugging tests and the code being tested.
- `npm run test:ci` - runs the tests in a headless environment and exits. This is intended for use on your CI/CD server but is also useful for cases where you want to run the tests once.

Type `npm test` and verify that the tests run.

## Update the `HomePage` Test

Let's add a simple test to the `HomePage` test. This test will:

- Use the `debugElement` to query the DOM for the `ion-title`
- Peek at the `textContent` of the title's native element and make sure it is correct

This is a very simple test involving the page's DOM, but it will give you an idea of the types of DOM level testing we can do.

Add the following to the `src/app/home/home.page.spec.ts` file:

```TypeScript
...
import { By } from '@angular/platform-browser';
...
  it('displays the correct title', () => {
    const titles = fixture.debugElement.queryAll(By.css('ion-title'));
    expect(titles.length).toBe(2);
    expect(titles[0].nativeElement.textContent.trim()).toBe('Blank');
    expect(titles[1].nativeElement.textContent.trim()).toBe('Blank');
  });
```

That new test case should go directly under the existing "should create" test case.

## Install Mock Factories

I favor the use of centralized factory functions to create mocks whenever it makes sense. This allows me to use a consistently defined mock throughout the tests in my application and reduces maintenance costs. For this application, I provide a set of centralized mock factories. <a download href="/assets/packages/ionic-angular/test.zip">Download the zip file</a> and unpack it in the root of the project creating a `test` folder.

Once that is in place it is often used within the `TestBed` configuration in order to provide the mock object instead of the real object for various dependencies. For example:

```TypeScript
...
import { SomeComponent } from './some.component';
import { createPlatformMock } from '../../test/mocks';

describe('SomeComponent', () => {

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SomeComponent],
      providers: [
        { provide: Platform, useFactory: createPlatformMock }
      ]
    }).compileComponents();
  }));
...
```

## Conclusion

In this lab we configured our basic testing infrastructure and added a simple test. We will expand on our testing as we develop our application. As such, we will learn more unit testing techniques hand as we develop the code.
