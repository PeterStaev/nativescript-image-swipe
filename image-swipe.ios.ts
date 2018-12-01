/*! *****************************************************************************
Copyright (c) 2018 Tangra Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
***************************************************************************** */
import * as utils from "utils/utils";
import { ImageSwipeBase, allowZoomProperty, itemsProperty, pageNumberProperty } from "./image-swipe-common";

export * from "./image-swipe-common";

export class ImageSwipe extends ImageSwipeBase {
    public isScrollingIn = false;

    private _views: Array<{ view: UIView; imageView: UIImageView; zoomDelegate: UIScrollViewZoomDelegateImpl }>;
    private _delegate: UIScrollViewPagedDelegate;

    constructor() {
        super();

        this._delegate = UIScrollViewPagedDelegate.initWithOwner(new WeakRef(this));
        this._views = [];
    }

    public initNativeView() {
        const scrollView: UIScrollView = this.ios as UIScrollView;
        scrollView.pagingEnabled = true;
        scrollView.autoresizingMask = UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight;
    }

    public onLoaded() {
        super.onLoaded();
        (this.ios as UIScrollView).delegate = this._delegate;
    }

    public onUnloaded() {
        (this.ios as UIScrollView).delegate = null;
        this._purgeAllPages();
        super.onUnloaded();
    }

    public onLayout(left: number, top: number, right: number, bottom: number) {
        // console.log(`LAYOUT ${left} ${top} ${right} ${bottom}`);
        super.onLayout(left, top, right, bottom);

        if (this.items && this.items.length > 0) {
            const scrollView: UIScrollView = this.ios;

            this._calcScrollViewContentSize();

            // console.log(`setContentOffsetAnimated ${this.pageNumber} * ${utils.layout.toDeviceIndependentPixels(this.getMeasuredWidth())}`);
            scrollView.setContentOffsetAnimated(CGPointMake(this.pageNumber * utils.layout.toDeviceIndependentPixels(this.getMeasuredWidth()), 0), false);

            for (let loop = Math.max(0, this.pageNumber - 1); loop <= Math.min(this.pageNumber + 1, this.items.length - 1); loop++) {
                this._resizeNativeViews(loop);
                if (this._views[loop]) {
                    this._positionImageView(this._views[loop].imageView);
                }
            }
        }
    }

    public [allowZoomProperty.setNative](value: boolean) {
        for (const viewHolder of this._views) {
            if (viewHolder) {
                this._positionImageView(viewHolder.imageView);
            }
        }
    }

    public [itemsProperty.setNative](value: any) {
        this._purgeAllPages();
        this._calcScrollViewContentSize();

        // Coerce selected index after we have set items to native view.
        pageNumberProperty.coerce(this);
        
        if (this.pageNumber !== undefined && this.pageNumber !== null) {
            this._loadCurrentPage(this.pageNumber);
        }
    }

    public [pageNumberProperty.setNative](value: number) {
        if (value === null) {
            return;
        }

        this._loadCurrentPage(value);

        this.notify({
            eventName: ImageSwipeBase.pageChangedEvent,
            object: this,
            page: value
        });
    }

    public _centerImageView(imageView: UIImageView) {
        const boundSize = imageView.superview.bounds.size;
        const contentsFrame = imageView.frame;
        const newPosition: { x: number; y: number } = { x: 0, y: 0 };

        if (contentsFrame.size.width < boundSize.width) {
            newPosition.x = (boundSize.width - contentsFrame.size.width) / 2;
        }
        else {
            newPosition.x = 0;
        }

        if (contentsFrame.size.height < boundSize.height) {
            newPosition.y = (boundSize.height - contentsFrame.size.height) / 2;
        }
        else {
            newPosition.y = 0;
        }

        contentsFrame.origin = CGPointMake(newPosition.x, newPosition.y);
        imageView.frame = contentsFrame;
    }

    private _loadCurrentPage(page: number) {
        const scrollView: UIScrollView = this.ios;
        const pageWidth = scrollView.frame.size.width;

        if (!this.isScrollingIn) {
            scrollView.contentOffset = CGPointMake(page * pageWidth, 0);
        }

        for (let loop = 0; loop < page - 1; loop++) {
            this._purgePage(loop);
        }

        // Load current page and one ahead one behind for caching purposes
        this._loadPage(page); // Always load the current page first
        if (page - 1 >= 0) {
            this._loadPage(page - 1);
        }
        if (page + 1 < this.items.length) {
            this._loadPage(page + 1);
        }

        for (let loop = page + 2; loop < this.items.length; loop++) {
            this._purgePage(loop);
        }
    }

    private _resizeNativeViews(page: number) {
        if (page < 0 || page >= this.items.length) { // Outside Bounds
            return;
        }

        if (!this._views[page]) {
            return;
        }

        const scrollView: UIScrollView = this.ios;
        const frame = scrollView.bounds;
        const view = this._views[page].view;

        frame.origin = CGPointMake(frame.size.width * page, 0);
        view.frame = frame;

        // console.log(`_resizeNativeViews ${frame.size.width}, ${frame.size.height}`);
        for (let loop = 0; loop < view.subviews.count; loop++) {
            const subview = view.subviews.objectAtIndex(loop);
            subview.frame = CGRectMake(0, 0, frame.size.width, frame.size.height);
        }
    }

    private _loadPage(page: number) {
        if (page < 0 || page >= this.items.length) { // Outside Bounds
            return;
        }

        if (this._views[page]) { // View already Loaded
            return;
        }

        const scrollView: UIScrollView = this.ios;
        const imageUrl = this._getDataItem(page)[this.imageUrlProperty];
        let imageView: UIImageView;
        let activityIndicator: UIActivityIndicatorView;
        let view: UIView;
        let zoomScrollView: UIScrollView;
        let image;

        view = UIView.alloc().init();
        view.autoresizingMask = UIViewAutoresizing.FlexibleWidth
            | UIViewAutoresizing.FlexibleHeight
            | UIViewAutoresizing.FlexibleLeftMargin
            | UIViewAutoresizing.FlexibleRightMargin;
        view.backgroundColor = utils.ios.getter(UIColor, UIColor.blackColor);

        zoomScrollView = UIScrollView.alloc().init();
        zoomScrollView.maximumZoomScale = 1;
        zoomScrollView.autoresizingMask = UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight;

        imageView = UIImageView.alloc().init();

        zoomScrollView.delegate = UIScrollViewZoomDelegateImpl.initWithOwnerAndZoomView(new WeakRef(this), new WeakRef(imageView));

        activityIndicator = UIActivityIndicatorView.alloc().init();
        activityIndicator.autoresizingMask = UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight;
        activityIndicator.hidesWhenStopped = true;

        zoomScrollView.addSubview(imageView);
        view.addSubview(activityIndicator);
        view.addSubview(zoomScrollView);

        scrollView.addSubview(view);
        this._views[page] = {
            view,
            imageView,
            zoomDelegate: zoomScrollView.delegate as UIScrollViewZoomDelegateImpl
        };

        this._resizeNativeViews(page);

        activityIndicator.startAnimating();

        image = ImageSwipeBase._imageCache.get(imageUrl);
        if (image) {
            this._prepareImageView(image, imageView);
            activityIndicator.stopAnimating();
        }
        else {
            ImageSwipeBase._imageCache.push({
                key: imageUrl,
                url: imageUrl,
                completed: (imageSource) => {
                    this._prepareImageView(imageSource, imageView);
                    activityIndicator.stopAnimating();
                }
            });
        }
    }

    private _prepareImageView(image: UIImage, imageView: UIImageView) {
        imageView.image = image;
        imageView.frame = CGRectMake(0, 0, image.size.width, image.size.height);

        this._positionImageView(imageView);
    }

    private _positionImageView(imageView: UIImageView) {
        if (!imageView || !imageView.image) {
            return;
        }

        const zoomScrollView = imageView.superview as UIScrollView;
        if (!zoomScrollView
            || zoomScrollView.frame.size.width === 0
            || zoomScrollView.frame.size.height === 0) { // This is to avoid incorrect resize before the control is layout
            return;
        }

        const minimumScale = Math.min(zoomScrollView.frame.size.width / imageView.image.size.width, zoomScrollView.frame.size.height / imageView.image.size.height);

        zoomScrollView.contentSize = imageView.frame.size;
        zoomScrollView.minimumZoomScale = minimumScale;
        zoomScrollView.zoomScale = minimumScale;
        zoomScrollView.maximumZoomScale = this.allowZoom ? 1.0 : minimumScale;

        this._centerImageView(imageView);
    }

    private _purgePage(page: number) {
        if (page < 0 || page >= this.items.length) { // Outside Bounds
            return;
        }

        const pageView = this._views[page];
        if (pageView) {
            pageView.view.removeFromSuperview();
        }

        this._views[page] = null;
    }

    private _purgeAllPages() {
        if (!this._views) {
            return;
        }

        for (let loop = 0; loop < this.items.length; loop++) {
            this._purgePage(loop);
        }
    }

    private _calcScrollViewContentSize() {
        const scrollView: UIScrollView = this.ios;
        const width = utils.layout.toDeviceIndependentPixels(this.getMeasuredWidth());
        const height = utils.layout.toDeviceIndependentPixels(this.getMeasuredHeight());

        // console.log(`_calcScrollViewContentSize ${width}, ${height}`);
        scrollView.contentSize = CGSizeMake(this.items.length * width, height);
    }
}

@ObjCClass(UIScrollViewDelegate)
class UIScrollViewPagedDelegate extends NSObject implements UIScrollViewDelegate {
    public static initWithOwner(owner: WeakRef<ImageSwipe>): UIScrollViewPagedDelegate {
        const delegate = UIScrollViewPagedDelegate.new() as UIScrollViewPagedDelegate;
        delegate._owner = owner;

        return delegate;
    }

    private _owner: WeakRef<ImageSwipe>;

    public scrollViewDidScroll(scrollView: UIScrollView) {
        this._owner.get().isScrollingIn = true;
    }

    public scrollViewDidEndDecelerating(scrollView: UIScrollView) {
        const pageWidth = scrollView.frame.size.width;
        const owner = this._owner.get();

        owner.isScrollingIn = false;
        owner.pageNumber = Math.floor(Math.abs(scrollView.contentOffset.x) / pageWidth);
    }

}

@ObjCClass(UIScrollViewDelegate)
class UIScrollViewZoomDelegateImpl extends NSObject implements UIScrollViewDelegate {
    public static initWithOwnerAndZoomView(owner: WeakRef<ImageSwipe>, zoomView: WeakRef<UIImageView>): UIScrollViewZoomDelegateImpl {
        const delegate = UIScrollViewZoomDelegateImpl.new() as UIScrollViewZoomDelegateImpl;

        delegate._zoomView = zoomView;
        delegate._owner = owner;

        return delegate;
    }

    private _zoomView: WeakRef<UIImageView>;
    private _owner: WeakRef<ImageSwipe>;

    public viewForZoomingInScrollView(scrollView: UIScrollView) {
        return this._zoomView.get();
    }

    public scrollViewDidZoom(scrollView: UIScrollView) {
        this._owner.get()._centerImageView(this._zoomView.get());
    }

}
