import { Property } from "ui/core/dependency-observable";

declare module "nativescript-image-swipe" {
    export class ImageSwipe {
        public static pageChangedEvent: string;
        public static itemsProperty: Property;
        public static imageUrlPropertyProperty: Property;
        public static currentPageProperty: Property;

        public items: any;
        public imageUrlProperty: string;
        public currentPage: number;
    }

    export interface PageChangeEventData {
        eventName: string;
        object: ImageSwipe;
        page: number;
    }
}