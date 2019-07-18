import { Component, OnInit } from "@angular/core";
import { PageChangeEventData } from "nativescript-image-swipe";

@Component({
    selector: "is-demo",
    moduleId: module.id,
    templateUrl: "./imageswipe.component.html"
})
export class ImageSwipeComponent implements OnInit {
    public items: any[] = [];
    public pageNumber: number = 0;

    public ngOnInit(): void {
        this.items.push(
            { imageUrl: "https://www.nationalgeographic.com/content/dam/photography/rights-exempt/best-of-photo-of-the-day/2017/animals/01_pod-best-animals.jpg" },
            { imageUrl: "https://news.nationalgeographic.com/content/dam/news/2016/02/24/01highanimals.jpg" },
            { imageUrl: "https://kids.nationalgeographic.com/content/dam/kids/photos/games/screen-shots/More%20Games/A-G/babyanimal_open.ngsversion.1429194155981.jpg" },
            { imageUrl: "https://kids.nationalgeographic.com/content/dam/kids/photos/animals/Mammals/H-P/koala-closeup-tree.adapt.945.1.jpg" }
        );
    }

    public tapped() {
        console.log("tapped");
    }

    public pageChanged(e: PageChangeEventData) {
        console.log(`Page changed to ${e.page}.`);
    }
}
