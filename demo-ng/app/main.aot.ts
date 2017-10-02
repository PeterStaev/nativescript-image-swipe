// this import should be first in order to load some required settings (like globals and reflect-metadata)
import { platformNativeScript } from "nativescript-angular/platform-static";
import { registerElement } from "nativescript-angular/element-registry";

import { AppModuleNgFactory } from "./app.module.ngfactory";

registerElement("ImageSwipe", () => require("nativescript-image-swipe/image-swipe").ImageSwipe);

platformNativeScript().bootstrapModuleFactory(AppModuleNgFactory);
