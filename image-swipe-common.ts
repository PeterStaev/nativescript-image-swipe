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

    private _items: any[];
    private _pageNumber: number;
    private _imageUrlProperty: string;

    get items(): any[] {
        return this._items;
    }
    set items(value: any[]) {
        this._items = value;
    }

    get pageNumber(): number {
        return this._pageNumber;
    }

    set pageNumber(num: number) {
        this._pageNumber = num;
    }

    get imageUrlProperty(): string {
        return this._imageUrlProperty;
    }

    set imageUrlProperty(propname: string) {
        this._imageUrlProperty = propname;
    }

    constructor() {
        super();
        
        if (!ImageSwipeBase._imageCache) {
            ImageSwipeBase._imageCache = new Cache();
            ImageSwipeBase._imageCache.maxRequests = 3;
        }    
    }

    public [imageUrlPropertyProperty.setNative](value: string): void {
        this.imageUrlProperty = value;
        this.refresh();
    }

    public [itemsProperty.setNative](value: any[]): void {
        this.items = value;
        this.refresh();
    }

    public [pageNumberProperty.setNative](value: number): void {
        this.pageNumber = value;
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
