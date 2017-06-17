import { EventData } from "tns-core-modules/data/observable";
import { Property } from "tns-core-modules/ui/core/view";
import { Cache } from "tns-core-modules/ui/image-cache";
import { ScrollView } from "tns-core-modules/ui/scroll-view";

export const pageChangedEvent: string = "pageChanged";

export interface PageChangeEventData extends EventData {
    eventName: string;
    object: ImageSwipeBase;
    page: number;
}

export const pageNumberProperty: Property<ImageSwipeBase, number> = new Property<ImageSwipeBase, number>({ name: "pageNumber", defaultValue: 0 });
export const itemsProperty: Property<ImageSwipeBase, string[]> = new Property<ImageSwipeBase, string[]>({ name: "items", defaultValue: [] });
export const imageUrlPropertyProperty: Property<ImageSwipeBase, string> = new Property<ImageSwipeBase, string>({ name: "imageUrlProperty", defaultValue: "imageUrl" });

export abstract class ImageSwipeBase extends ScrollView {

    public static _imageCache: Cache;

    public items: any[];
    public pageNumber: number;
    public imageUrlProperty: string;

    constructor() {
        super();
        
        if (!ImageSwipeBase._imageCache) {
            ImageSwipeBase._imageCache = new Cache();
            ImageSwipeBase._imageCache.maxRequests = 3;
        }    
    }

    public [imageUrlPropertyProperty.setNative](value: string): void {
        this.refresh();
    }

    public [itemsProperty.setNative](value: any[]): void {
        this.refresh();
    }

    public [pageNumberProperty.setNative](value: number): void {
        this.loadCurrentPage();
        this.notify({
            eventName: pageChangedEvent,
            object: this,
            page: value
        } as PageChangeEventData);
    }

    protected abstract refresh(): void;
    protected abstract loadCurrentPage(): void;
}

itemsProperty.register(ImageSwipeBase);
pageNumberProperty.register(ImageSwipeBase);
imageUrlPropertyProperty.register(ImageSwipeBase);
