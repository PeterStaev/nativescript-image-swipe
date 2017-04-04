// import observableArray = require("data/observable-array");
// import view = require("ui/core/view");
import * as utils from "utils/utils";
import common = require("./image-swipe-common");

global.moduleMerge(common, exports);

class UIScrollViewPagedDelegate extends NSObject implements UIScrollViewDelegate {
    public static ObjCProtocols = [UIScrollViewDelegate];

    public static initWithOwner(owner: WeakRef<ImageSwipe>): UIScrollViewPagedDelegate {
        const delegate = UIScrollViewPagedDelegate.new() as UIScrollViewPagedDelegate;
        delegate._owner = owner;

        return delegate;
    }

    private _owner: WeakRef<ImageSwipe>;

    public scrollViewDidScroll(scrollView: UIScrollView) {
        const pageWidth = scrollView.frame.size.width;
        const owner = this._owner.get();

        owner.isScrollingIn = true;
        owner.pageNumber = Math.floor(Math.abs(scrollView.contentOffset.x) / pageWidth);
    }

    public scrollViewDidEndDecelerating(scrollView: UIScrollView) {
        this._owner.get().isScrollingIn = false;
    }

}

class UIScrollViewZoomDelegateImpl extends NSObject implements UIScrollViewDelegate {
    public static ObjCProtocols = [UIScrollViewDelegate];

    public static initWithZoomView(zoomView: WeakRef<UIView>): UIScrollViewZoomDelegateImpl {
        const delegate = UIScrollViewZoomDelegateImpl.new() as UIScrollViewZoomDelegateImpl;

        delegate._zoomView = zoomView;

        return delegate;
    }

    private _zoomView: WeakRef<UIView>;

    public viewForZoomingInScrollView(scrollView: UIScrollView) {
        return this._zoomView.get();
    }
}

export class ImageSwipe extends common.ImageSwipeBase {
    private _views: Array<{ view: UIView; imageView: UIImageView; zoomDelegate: UIScrollViewZoomDelegateImpl }>;
    private _delegate: UIScrollViewPagedDelegate;

    private _isScrollingIn: boolean;
    get isScrollingIn(): boolean {
        return this._isScrollingIn;
    }
    set isScrollingIn(value: boolean) {
        this._isScrollingIn = value;
    }

    constructor() {
        super();
        this._delegate = UIScrollViewPagedDelegate.initWithOwner(new WeakRef(this));

        (this.ios as UIScrollView).pagingEnabled = true;
        (this.ios as UIScrollView).autoresizingMask = UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight;
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

    public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);

        const scrollView: UIScrollView = this.ios;

        if (this.items && this.items.length > 0) {
            this._calcScrollViewContentSize();
            setTimeout(() => {
                scrollView.setContentOffsetAnimated(CGPointMake(this.pageNumber * this.getMeasuredWidth(), 0), false);
                for (let loop = Math.max(0, this.pageNumber - 1); loop <= Math.min(this.pageNumber + 1, this.items.length - 1); loop++) {
                    this._positionImageView(this._views[loop].imageView);
                }
            }, 150);
        }
    }

    public loadCurrentPage() {
        const scrollView: UIScrollView = this.ios;
        const pageWidth = scrollView.frame.size.width;
        let loop;

        if (!this.isScrollingIn) {
            scrollView.contentOffset = CGPointMake(this.pageNumber * pageWidth, 0);
        }

        for (loop = 0; loop < this.pageNumber - 1; loop++) {
            this._purgePage(loop);
        }
        for (; loop <= this.pageNumber + 1; loop++) {
            this._loadPage(loop);
        }
        for (; loop < this.items.length; loop++) {
            this._purgePage(loop);
        }
    }
    
    public refresh() {
        this._purgeAllPages();
        this._views = this.items.map((value) => null);
        this._calcScrollViewContentSize();
        this.loadCurrentPage();
    }

    private _loadPage(page: number) {
        if (page < 0 || page >= this.items.length) { // Outside Bounds
            return;
        }

        if (this._views[page]) { // View already Loaded
            return;
        }

        const scrollView: UIScrollView = this.ios;
        const frame = scrollView.bounds;
        const imageUrl = this._getDataItem(page)[this.imageUrlProperty];
        let imageView: UIImageView;
        let activityIndicator: UIActivityIndicatorView;
        let view: UIView;
        let zoomScrollView: UIScrollView;
        let image;
        
        frame.origin = CGPointMake(frame.size.width * page, 0);

        view = UIView.alloc().init();
        view.frame = frame;
        view.autoresizingMask = UIViewAutoresizing.FlexibleWidth
            | UIViewAutoresizing.FlexibleHeight
            | UIViewAutoresizing.FlexibleLeftMargin
            | UIViewAutoresizing.FlexibleRightMargin;
        view.backgroundColor = utils.ios.getter(UIColor, UIColor.blackColor);

        zoomScrollView = UIScrollView.alloc().init();
        zoomScrollView.frame = CGRectMake(0, 0, frame.size.width, frame.size.height);
        zoomScrollView.maximumZoomScale = 1;
        zoomScrollView.autoresizingMask = UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight;

        imageView = UIImageView.alloc().init();

        zoomScrollView.delegate = UIScrollViewZoomDelegateImpl.initWithZoomView(new WeakRef(imageView));

        activityIndicator = UIActivityIndicatorView.alloc().init();
        activityIndicator.autoresizingMask = UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight;
        activityIndicator.frame = CGRectMake(0, 0, frame.size.width, frame.size.height);
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
        
        activityIndicator.startAnimating();
        image = this._imageCache.get(imageUrl);
        if (image) {
            this._prepareImageView(image, imageView);
            activityIndicator.stopAnimating();
        }
        else {
            this._imageCache.push({
                key: imageUrl,
                url: imageUrl,
                completed: (imageSource) => {
                    this._prepareImageView(imageSource, imageView);
                    activityIndicator.stopAnimating();
                }
            });
        }
    }

    private _centerImageView(imageView: UIImageView) {
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
        let minimumScale: number;

        minimumScale = Math.min(zoomScrollView.frame.size.width / imageView.image.size.width, zoomScrollView.frame.size.height / imageView.image.size.height);

        zoomScrollView.contentSize = imageView.frame.size;
        zoomScrollView.minimumZoomScale = minimumScale;
        zoomScrollView.zoomScale = minimumScale;

        this._centerImageView(imageView);
    }

    private _purgePage(page: number) {
        if (page < 0 || page >= this.items.length ) { // Outside Bounds
            return;
        }

        const pageView = this._views[page];

        if (pageView) {
            pageView.view.removeFromSuperview();
            this._views[page] = null;
        }
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
        const width = this.getMeasuredWidth();
        const height = this.getMeasuredHeight();

        scrollView.contentSize = CGSizeMake(this.items.length * width, height);
    }    
}
