import { EventData, Observable } from "data/observable";
import { ObservableArray } from "data/observable-array";
import { Page } from "ui/page";

import { PageChangeEventData } from "nativescript-image-swipe";

let viewModel: Observable;

export function navigatingTo(args: EventData) {
    const page = args.object as Page;
    const items = new ObservableArray();

    items.push({ imageUrl: "http://press.nationalgeographic.com/files/2013/08/NationalGeographic_1184784-smaller.jpg" });
    items.push({ imageUrl: "http://ngm.nationalgeographic.com/2011/12/tigers/img/14-mother-rests-with-cub_1600.jpg" });
    items.push({ imageUrl: "http://ngm.nationalgeographic.com/wallpaper/img/2013/04/01-manatees-swim-close-to-surface_1600.jpg" });
    items.push({ imageUrl: "http://ngm.nationalgeographic.com/wallpaper/img/2013/08/12-cboy-zebra-feast_1600.jpg" });
    items.push({ imageUrl: "http://voices.nationalgeographic.com/files/2013/04/NationalGeographic_1329449.jpg" });

    viewModel = new Observable();
    viewModel.set("items", items);
    viewModel.set("pageNumber", 3);

    page.bindingContext = viewModel;
}

export function pageChanged(e: PageChangeEventData) {
    console.log(`Page changed to ${e.page}.`);
}