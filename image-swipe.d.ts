import dependencyObservable = require("ui/core/dependency-observable");

export class ImageScroller
{
    public static pageChangedEvent: string;
    public static itemsProperty: dependencyObservable.Property;
    public static imageUrlPropertyProperty: dependencyObservable.Property;
    public static currentPageProperty: dependencyObservable.Property;

    public items: any;
    public imageUrlProperty: string;
    public currentPage: number;
}

export interface PageChangeEventData
{
    eventName: string;
    object: ImageScroller;
    page: number;
}