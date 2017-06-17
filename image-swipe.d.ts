import { Cache } from "tns-core-modules/ui/image-cache";

declare module "nativescript-image-swipe" {
    export class ImageSwipeBase {
        public static _imageCache: Cache;
    }
    
    export class ImageSwipe {
        public static pageChangedEvent: string;
        
        public items: any[];
        public imageUrlProperty: string;
        public pageNumber: number;

        public ios: any; /* UIScrollView */
        public android: any; /* android.support.v4.view.ViewPager */
    }

    export interface PageChangeEventData {
        eventName: string;
        object: ImageSwipe;
        page: number;
    }
}