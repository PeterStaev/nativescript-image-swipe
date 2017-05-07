import { EventData } from "data/observable";
import { Property, PropertyChangeData, PropertyMetadataSettings } from "ui/core/dependency-observable";
import { PropertyMetadata } from "ui/core/proxy";
import { Cache } from "ui/image-cache";
import { ScrollView } from "ui/scroll-view";

const IMAGESCROLLER = "ImageScroller";

function onItemsPropertyChanged(data: PropertyChangeData) {
    const imageSwipe = data.object as ImageSwipeBase;
    imageSwipe.refresh();
}

function onPagePropertyChanged(data: PropertyChangeData) {
    const imageScroller = data.object as ImageSwipeBase;
    imageScroller.loadCurrentPage();
    imageScroller.notify({
        eventName: ImageSwipeBase.pageChangedEvent,
        object: imageScroller,
        page: data.newValue
    } as PageChangeEventData);
}

export interface PageChangeEventData extends EventData {
    eventName: string;
    object: ImageSwipeBase;
    page: number;
}

export abstract class ImageSwipeBase extends ScrollView {
    public static pageChangedEvent: string = "pageChanged";

    public static itemsProperty = new Property(
        "items",
        IMAGESCROLLER,
        new PropertyMetadata(
            undefined,
            PropertyMetadataSettings.AffectsLayout,
            onItemsPropertyChanged
        )
    );

    public static imageUrlPropertyProperty = new Property(
        "imageUrlProperty",
        IMAGESCROLLER,
        new PropertyMetadata(
            "",
            PropertyMetadataSettings.AffectsLayout
        )
    );

    public static pageNumberProperty = new Property(
        "pageNumber",
        IMAGESCROLLER,
        new PropertyMetadata(
            0,
            PropertyMetadataSettings.AffectsLayout,
            onPagePropertyChanged
        )
    );

    public static _imageCache: Cache;
    // private _itemsChanged: (args: EventData) => void;

    get items(): any {
        return this._getValue(ImageSwipeBase.itemsProperty);
    }
    set items(value: any) {
        this._setValue(ImageSwipeBase.itemsProperty, value);
    }
    
    get imageUrlProperty(): string {
        return this._getValue(ImageSwipeBase.imageUrlPropertyProperty);
    }
    set imageUrlProperty(value: string) {
        this._setValue(ImageSwipeBase.imageUrlPropertyProperty, value);
    }
    
    get pageNumber(): number {
        return this._getValue(ImageSwipeBase.pageNumberProperty);
    }
    set pageNumber(value: number) {
        this._setValue(ImageSwipeBase.pageNumberProperty, value);
    }

    constructor() {
        super();
        // this._itemsChanged = (args: EventData) => { this.refresh(); };
        if (!ImageSwipeBase._imageCache) {
            ImageSwipeBase._imageCache = new Cache();
            ImageSwipeBase._imageCache.maxRequests = 3;
        }    
    }

    public abstract refresh();
    public abstract loadCurrentPage();

    public _getDataItem(index: number): any {
        return this.items.getItem ? this.items.getItem(index) : this.items[index];
    }
}
