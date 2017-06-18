import { Component, OnInit } from "@angular/core";
import { PageChangeEventData } from "nativescript-image-swipe";

@Component({
    selector: "is-demo",
    moduleId: module.id,
    templateUrl: "./imageswipe.component.html",
})
export class ImageSwipeComponent implements OnInit {
    public items: any[] = [];
    public pageNumber: number = 3;

    ngOnInit(): void {
        this.items.push({ imageUrl: "http://press.nationalgeographic.com/files/2013/08/NationalGeographic_1184784-smaller.jpg" });
        this.items.push({ imageUrl: "http://ngm.nationalgeographic.com/2011/12/tigers/img/14-mother-rests-with-cub_1600.jpg" });
        this.items.push({ imageUrl: "http://ngm.nationalgeographic.com/wallpaper/img/2013/04/01-manatees-swim-close-to-surface_1600.jpg" });
        this.items.push({ imageUrl: "http://ngm.nationalgeographic.com/wallpaper/img/2013/08/12-cboy-zebra-feast_1600.jpg" });
        this.items.push({ imageUrl: "http://voices.nationalgeographic.com/files/2013/04/NationalGeographic_1329449.jpg" });
    }

    public tapped() {
        console.log("tapped");
    }

    public pageChanged(e: PageChangeEventData) {
        console.log(`Page changed to ${e.page}.`);
    }
}
