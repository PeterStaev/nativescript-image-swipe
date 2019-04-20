import { EventData, Observable } from "data/observable";
import { ObservableArray } from "data/observable-array";
import { Page } from "ui/page";

import { PageChangeEventData } from "nativescript-image-swipe";

let viewModel: Observable;

export function navigatingTo(args: EventData) {
    const page = args.object as Page;
    const items = new ObservableArray();

    items.push({ imageUrl: "http://press.nationalgeographic.com/files/2013/08/NationalGeographic_1184784-smaller.jpg" });
    items.push({ imageUrl: "https://www.nationalgeographic.com/content/dam/photography/rights-exempt/best-of-photo-of-the-day/2017/animals/01_pod-best-animals.jpg" });
    items.push({ imageUrl: "https://news.nationalgeographic.com/content/dam/news/2016/02/24/01highanimals.jpg" });
    items.push({ imageUrl: "https://kids.nationalgeographic.com/content/dam/kids/photos/games/screen-shots/More%20Games/A-G/babyanimal_open.ngsversion.1429194155981.jpg" });
    items.push({ imageUrl: "https://kids.nationalgeographic.com/content/dam/kids/photos/animals/Mammals/H-P/koala-closeup-tree.adapt.945.1.jpg" });

    viewModel = new Observable();
    viewModel.set("items", items);
    viewModel.set("pageNumber", 2);

    page.bindingContext = viewModel;
}

export function pageChanged(e: PageChangeEventData) {
    console.log(`Page changed to ${e.page}.`);
}