# Lab: Create a Rating Component

In this lab you will:

- Add a reusable component
- Use the component in the details page

## The Ratings Component

We will be creating a reusable component that is used to give up to a five-star rating to a tea. Since this component will be usable throughout our application we will follow <a href="https://v3.vuejs.org/style-guide/#base-component-names-strongly-recommended" target="_blank">Vue guidelines</a> and prefix the component name with `App`.

### Create the Component Skeleton

Create a `src/components/AppRating.vue` file with the following contents:

```html
<template>
  <div>Rating Component is Working</div>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';

  export default defineComponent({
    name: 'AppRating',
  });
</script>

<style scoped></style>
```

Also create a test for it (`tests/unit/components/AppRating.spec.ts`) with the following contents:

```typescript
import { mount, VueWrapper } from '@vue/test-utils';
import AppRating from '@/components/AppRating.vue';

describe('AppRating.vue', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(async () => {
    wrapper = mount(AppRating);
  });

  it('renders', () => {
    expect(wrapper.exists()).toBe(true);
  });
});
```

### Use the Component

In order to see the component as we develop it, let's start using it right away in our `TeaDetails` page:

```html
<template>
...
        <h1 data-testid="name">{{ tea.name }}</h1>
        <p data-testid="description">{{ tea.description }}</p>
        <app-rating data-testid="rating"></app-rating>
...
</template>

<script lang="ts">
...
import AppRating from '@/components/AppRating.vue';

export default defineComponent({
  name: 'TeaDetails',
  components: {
    AppRating,
...
```

Navigte to the `TeaDetails` page and verify that you see "Rating Component is Working" after the description for the tea.

### Build up the UI

We don't want a component that just tells us that it works. What we want is a series of 5 stars that show us a rating. Furthermore, we want to make sure that the component works with Vue's `v-model` when we use it.

Let's modify our `script` tag code to get some of that in place. What we need to do is grab the icons we need and make them available on our component. We then need to add a `modelValue` prop since that is the property that `v-model` will be setting.

```TypeScript
<script lang="ts">
import { defineComponent } from 'vue';
import { star, starOutline } from 'ionicons/icons';

export default defineComponent({
  name: 'AppRating',
  props: {
    modelValue: {
      type: Number,
      default: 0,
    },
  },
  setup() {
    return { star, starOutline };
  },
});
</script>
```

Now let's start simple and build this up one step at a time.

In the `TeaDetails.vue` file, add a `ratings` data item and bind that to the `app-rating` component. In addition to our unit tests, this will help us visually test that everything is working as we go.

```html
<template>
  ...
  <app-rating data-testid="rating" v-model="rating"></app-rating>
  ...
</template>

<script>
  ...
    data() {
      return {
        rating: 0,
      };
    },
  ...
</script>
```

For our first unit test in `tests/unit/components/AppRating.spec.ts` we will just ensure that we get 5 outlined star icons by default.

```typescript
...
import { star, starOutline } from 'ionicons/icons';

describe('AppRating.vue', () => {
...

  it('renders five empty stars', () => {
    const icons = wrapper.findAllComponents('ion-icon');
    expect(icons.length).toBe(5);
    icons.forEach(icon => expect(icon.vm.icon).toEqual(starOutline));
  });
});
```

This test should fail at this point. We will now start replacing the contents of the `<template>` in `src/components/AppRating.vue`.

```html
<div>
  <ion-icon v-for="n in [1, 2, 3, 4, 5]" :key="n" :icon="starOutline">
  </ion-icon>
</div>
```

If we look at a tea details page in the browser we should see five outlined stars instead of our prior "Rating Component is Working" text that we had before.

Next, let's make tye component respect the modelValue property. First the test:

```TypeScript
  it('fills in the first 3 stars', async () => {
    const icons = wrapper.findAllComponents('ion-icon');
    await wrapper.setProps({modelValue: 3});
    expect(icons.length).toBe(5);
    icons.forEach((icon, idx) => expect(icon.vm.icon).toEqual(idx < 3 ? star : starOutline));
  });
```

To get this test to pass, the icon binding in the template changes a bit:

```html
:icon="n <= modelValue ? star : starOutline"
```

Once you have a passing test, change the `rating` value in `TeaDetails.vue` a couple of times and verify that the proper number of stars are indeed filled in.

The final bit is to get the component to respond to click events. In order to fulfill the `v-model` contract, the component needs to emit `update:ModelValue` with the proper payload whenever an event occurs that would change the model value.

The easiest way to test this is to trigger a click and look for the proper event to have been emitted:

```TypeScript
  it('emits the model value update event on clicks', () => {
    const icons = wrapper.findAllComponents('ion-icon');
    icons[2].trigger('click');
    const updateModelValueCalls = wrapper.emitted('update:modelValue');
    expect(updateModelValueCalls.length).toBe(1);
    expect(updateModelValueCalls[0]).toEqual([3]);
  });
```

Add the following event handler to the icon in order to handle the click events:

```html
@click="$emit('update:modelValue', n)"
```

**Important:** be sure to also add an `emits: ['update:modelValue'],` property in the `defineComponent()` config object.

Try this out in the `TeaDetails` page in the browser. You should now be able to click on the value and it will change. Neat! 🥳

### Style the Component

So far this works well, but the stars are a little small and close together, especially for people with larger hands. Let's apply a little style to make that better.

```CSS
<style scoped>
ion-icon {
  font-size: 24px;
  padding-right: 12px;
  color: gold;
}

ion-icon:last-child {
  padding-right: 0px;
}
</style>
```

## Conclusion

Congratulations. You have created and consumed your first reusable component.
