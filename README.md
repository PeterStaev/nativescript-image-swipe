__The author of this plugin will continue to support it in a separate repo exclusively as part of [ProPlugins](https://proplugins.org). This repo will remain supported by the NativeScript community.__

# Contribution - help wanted
This plugin is supported by the NativeScript community. All PRs are welcome but make sure that the demo applications work correctly before creating a new PR. If you do not have an issue you are facing but want to contribute to this plugin you can find a list of the on going issues [here](https://github.com/PeterStaev/nativescript-image-swipe/issues).

## Creating a PR checklist:
- Fork the repo
- Add new functionality or fix an issue and push it to your fork
- Start both demo and demo-ng apps and make sure they work correctly (make sure that no console errors are thrown on both iOS and Android)
- From your fork create a PR targeting the 'master' branch of this repository

Thank you for your contribution.

# NativeScript Image Swipe widget 
[![Build Status](https://travis-ci.org/PeterStaev/nativescript-image-swipe.svg?branch=master)](https://travis-ci.org/PeterStaev/nativescript-image-swipe)
[![npm downloads](https://img.shields.io/npm/dm/nativescript-image-swipe.svg)](https://www.npmjs.com/package/nativescript-image-swipe)
[![npm downloads](https://img.shields.io/npm/dt/nativescript-image-swipe.svg)](https://www.npmjs.com/package/nativescript-image-swipe)
[![npm](https://img.shields.io/npm/v/nativescript-image-swipe.svg)](https://www.npmjs.com/package/nativescript-image-swipe)

A NativeScript widget that will allow you to easily swipe and zoom through a list of images. 

## Screenshot
![Screenshot](https://raw.githubusercontent.com/PeterStaev/nativescript-image-swipe/master/docs/image-swipe.gif)

## Installation
Run the following command from the root of your project:

`tns plugin add nativescript-image-swipe`

This command automatically installs the necessary files, as well as stores nativescript-image-swipe as a dependency in your project's package.json file.

## Configuration
There is no additional configuration needed!

## API

### Events
* **pageChanged**  
Triggered when the user swipes to the next/previous image in the list. 

### Static Properties
* **pageChangedEvent** - *String*  
String value used when hooking to pageChanged event.

### Instance Properties
* **ios** - *[UIScrollView](https://developer.apple.com/reference/uikit/uiscrollview)*  
Gets the native iOS view that represents the user interface for this component. Valid only when running on iOS.

* **android** - *[android.support.v4.view.ViewPager](https://developer.android.com/reference/android/support/v4/view/ViewPager.html)*  
Gets the native android widget that represents the user interface for this component. Valid only when running on Android OS.

* **items** - *Array | ObservableArray*  
Gets or sets the items collection of the ImageSwipe. The items property can be set to an array or an object defining length and getItem(index) method.

* **pageNumber** - *Number*  
Gets or sets the currently visible image.

* **imageUrlProperty** - *string*  
Gets or sets the property inside the items' object that defines the Url from where to load the images

* **allowZoom** - *boolean (default: true)*  
Gets or sets whether zoom is enabled

## Usage
You need to add `xmlns:is="nativescript-image-swipe"` to your page tag, and then simply use `<is:ImageSwipe/>` in order to add the widget to your page.
```xml
<!-- test-page.xml -->
<Page xmlns="http://schemas.nativescript.org/tns.xsd" xmlns:is="nativescript-image-swipe" navigatingTo="navigatingTo">
    <GridLayout>
        <is:ImageSwipe items="{{ items }}" imageUrlProperty="imageUrl" 
                       pageNumber="{{ pageNumber }}" pageChanged="pageChanged" backgroundColor="#000000">
        </is:ImageSwipe>
    </GridLayout>
</Page>
```

```typescript
// test-page.ts
import { EventData, Observable } from "data/observable";
import { ObservableArray } from "data/observable-array";
import { Page } from "ui/page";

import { PageChangeEventData } from "nativescript-image-swipe";

let viewModel: Observable;

export function navigatingTo(args: EventData) {
    const page = args.object as Page;
    const items = new ObservableArray();

    items.push({ imageUrl: "http://something.com/picture1.jpg" });
    items.push({ imageUrl: "http://something.com/picture2.jpg" });
    items.push({ imageUrl: "http://something.com/picture3.jpg" });
    items.push({ imageUrl: "http://something.com/picture4.jpg" });
    items.push({ imageUrl: "http://something.com/picture5.jpg" });

    viewModel = new Observable();
    viewModel.set("items", items);
    viewModel.set("pageNumber", 3);

    page.bindingContext = viewModel;
}

export function pageChanged(e: PageChangeEventData) {
    console.log(`Page changed to ${e.page}.`);
}
```

## Usage in Angular
In order to use the `ImageSwipe` you must register it in **BOTH** your `main.ts` and `main.aot.ts`!

```typescript
// main.ts
import { platformNativeScriptDynamic } from "nativescript-angular/platform";
import { registerElement } from "nativescript-angular/element-registry";

import { AppModule } from "./app.module";

registerElement("ImageSwipe", () => require("nativescript-image-swipe/image-swipe").ImageSwipe);

platformNativeScriptDynamic().bootstrapModule(AppModule);
```

```html
<!-- test.component.html -->
<GridLayout>
    <ImageSwipe [items]="items" imageUrlProperty="imageUrl" 
                [pageNumber]="pageNumber" (pageChanged)="pageChanged($event)" backgroundColor="#000000">
    </ImageSwipe>
</GridLayout>
```

```typescript
// test.component.ts
import { Component, OnInit } from "@angular/core";
import { PageChangeEventData } from "nativescript-image-swipe";

@Component({
    selector: "demo",
    moduleId: module.id,
    templateUrl: "./test.component.html",
})
export class ImageSwipeComponent implements OnInit {
    public items: any[] = [];
    public pageNumber: number = 3;

    ngOnInit(): void {
        this.items.push({ imageUrl: "http://something.com/picture1.jpg" });
        this.items.push({ imageUrl: "http://something.com/picture2.jpg" });
        this.items.push({ imageUrl: "http://something.com/picture3.jpg" });
        this.items.push({ imageUrl: "http://something.com/picture4.jpg" });
        this.items.push({ imageUrl: "http://something.com/picture5.jpg" });
    }

    public pageChanged(e: PageChangeEventData) {
        console.log(`Page changed to ${e.page}.`);
    }
}
```

## Demos
This repository includes both Angular and plain NativeScript demos. In order to run those execute the following in your shell:
```shell
$ git clone https://github.com/peterstaev/nativescript-image-swipe
$ cd nativescript-image-swipe
$ npm install
$ npm run demo-ios
```
This will run the plain NativeScript demo project on iOS. If you want to run it on Android simply use the `-android` instead of the `-ios` sufix. 

If you want to run the Angular demo simply use the `demo-ng-` prefix instead of `demo-`. 

## Donate
[![Donate](https://img.shields.io/badge/paypal-donate-brightgreen.svg)](https://bit.ly/2AS9QKB)

`bitcoin:14fjysmpwLvSsAskvLASw6ek5XfhTzskHC`

![Donate](https://www.tangrainc.com/qr.png)
