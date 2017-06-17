/*! *****************************************************************************
Copyright (c) 2017 Tangra Inc.

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
import { ImageSwipeBase, itemsProperty, pageNumberProperty } from "./image-swipe-common";

// These constants specify the mode that we're in
const MODE_NONE = 0;
const MODE_DRAG = 1;
const MODE_ZOOM = 2;

export * from "./image-swipe-common";

export class ImageSwipe extends ImageSwipeBase {
    public nativeView: StateViewPager;

    public createNativeView() {
        const stateViewPager = new StateViewPager(this._context);

        stateViewPager.setOffscreenPageLimit(1);

        const adapter = new ImageSwipePageAdapter(new WeakRef(this));
        (stateViewPager as any).adapter = adapter;
        stateViewPager.setAdapter(adapter);

        const imageSwipePageListener = new ImageSwipePageChangeListener(new WeakRef(this));
        (stateViewPager as any).imageSwipePageListener = imageSwipePageListener;
        stateViewPager.setOnPageChangeListener(imageSwipePageListener);

        if (this.pageNumber !== null && this.pageNumber !== undefined) {
            stateViewPager.setCurrentItem(this.pageNumber);
        }

        return stateViewPager;
    }

    public initNativeView() {
        super.initNativeView();

        const nativeView = this.nativeView as any;
        nativeView.adapter.owner = new WeakRef(this);
        nativeView.imageSwipePageListener.owner = new WeakRef(this);
    }

    get android(): StateViewPager {
        return this.nativeView;
    }

    public [pageNumberProperty.setNative](value: number) {
        this.nativeView.setCurrentItem(value);
    }

    public [itemsProperty.setNative](value: any) {
        this.nativeView.getAdapter().notifyDataSetChanged();

        // Coerce selected index after we have set items to native view.
        pageNumberProperty.coerce(this);
    }
}

@Interfaces([android.support.v4.view.ViewPager.OnPageChangeListener])
class ImageSwipePageChangeListener extends java.lang.Object implements android.support.v4.view.ViewPager.OnPageChangeListener {
    constructor(private owner: WeakRef<ImageSwipe>) {
        super();

        return global.__native(this);
    }

    public onPageSelected(index: number) {
        const owner = this.owner.get();

        owner.pageNumber = index;

        owner.notify({
            eventName: ImageSwipe.pageChangedEvent,
            object: owner,
            page: index
        });

        let preloadedImageView: ZoomImageView;

        preloadedImageView = owner.android.findViewWithTag("Item" + (index - 1).toString()) as ZoomImageView;
        if (preloadedImageView) {
            preloadedImageView.reset();
        }

        preloadedImageView = owner.android.findViewWithTag("Item" + (index + 1).toString()) as ZoomImageView;
        if (preloadedImageView) {
            preloadedImageView.reset();
        }
    }

    public onPageScrolled() {
        // Currently not used
    }

    public onPageScrollStateChanged() {
        // Currently not used
    }
}

class StateViewPager extends android.support.v4.view.ViewPager {
    private _allowScrollIn: boolean = true;

    constructor(context: android.content.Context) {
        super(context);

        return __native(this);
    }

    public onInterceptTouchEvent(event: android.view.MotionEvent): boolean {
        if (this._allowScrollIn) {
            return super.onInterceptTouchEvent(event);
        }

        return false;
    }

    public setAllowScrollIn(allowScrollIn: boolean) {
        this._allowScrollIn = allowScrollIn;
    }
}

class ImageSwipePageAdapter extends android.support.v4.view.PagerAdapter {
    constructor(private owner: WeakRef<ImageSwipe>) {
        super();

        return global.__native(this);
    }

    public instantiateItem(container: android.view.ViewGroup, position: number): java.lang.Object {
        const owner = this.owner.get();
        const imageUrl = owner._getDataItem(position)[owner.imageUrlProperty];
        const params = new android.support.v4.view.ViewPager.LayoutParams();
        params.height = android.view.ViewGroup.LayoutParams.MATCH_PARENT;
        params.width = android.view.ViewGroup.LayoutParams.MATCH_PARENT;

        const imageView = new ZoomImageView(owner._context);
        imageView.setLayoutParams(params);
        imageView.setTag("Item" + position.toString());

        const that = new WeakRef(owner);
        imageView.setOnCanScrollChangeListener(new OnCanScrollChangeListener({
            onCanScrollChanged: (canScroll: boolean) => {
                that.get().android.setAllowScrollIn(canScroll);
            }
        }));

        const progressBar = new android.widget.ProgressBar(owner._context);
        progressBar.setLayoutParams(params);
        progressBar.setVisibility(android.view.View.GONE);
        progressBar.setIndeterminate(true);

        const layout = new android.widget.LinearLayout(owner._context);
        layout.setLayoutParams(params);
        layout.setOrientation(android.widget.LinearLayout.VERTICAL);
        layout.addView(progressBar);
        layout.addView(imageView);

        container.addView(layout);

        progressBar.setVisibility(android.view.View.VISIBLE);
        const image: android.graphics.Bitmap = ImageSwipeBase._imageCache.get(imageUrl);
        if (image) {
            imageView.setImageBitmap(image);
            progressBar.setVisibility(android.view.View.GONE);
        }
        else {
            ImageSwipeBase._imageCache.push({
                key: imageUrl,
                url: imageUrl,
                completed: (bitmap: android.graphics.Bitmap) => {
                    imageView.setImageBitmap(bitmap);
                    progressBar.setVisibility(android.view.View.GONE);
                }
            });
        }

        return layout;
    }

    public destroyItem(container: android.view.ViewGroup, position: number, object: any) {
        container.removeView(object as android.view.View);
    }

    public getCount(): number {
        const owner = this.owner.get();
        return owner && owner.items ? owner.items.length : 0;
    }

    public isViewFromObject(view: android.view.View, object: java.lang.Object): boolean {
        return view === object;
    }
}

class ZoomImageView extends android.widget.ImageView {
    private _scaleFactor = [1]; // HACK: for some reason only number private variable does not work, use Array and set the value to the first item in the array. 
    private _minScaleFactor = [1]; // HACK: for some reason only number private variable does not work, use Array and set the value to the first item in the array. 
    private _detector: android.view.ScaleGestureDetector;
    private _mode: number = 0;
    private _dragged = false;
    private _image: android.graphics.Bitmap;

    // These two variables keep track of the X and Y coordinate of the finger when it first
    // touches the screen
    private _startX: number = 0;
    private _startY: number = 0;

    // These two variables keep track of the amount we need to translate the canvas along the X and the Y coordinate
    private _translateX = [0]; // HACK: for some reason only number private variable does not work, use Array and set the value to the first item in the array. 
    private _translateY = [0]; // HACK: for some reason only number private variable does not work, use Array and set the value to the first item in the array. 

    // These two variables keep track of the total amount we translated the X and Y coordinates and confirmed it (finger up).
    private _totalTranslateX = [0]; // HACK: for some reason only number private variable does not work, use Array and set the value to the first item in the array. 
    private _totalTranslateY = [0]; // HACK: for some reason only number private variable does not work, use Array and set the value to the first item in the array. 

    private _orientationChangeListener: OrientationListener;
    private _onCanScrollChangeListener: OnCanScrollChangeListenerImplementation;

    constructor(context: android.content.Context) {
        super(context);

        const that = new WeakRef(this);
        this._detector = new android.view.ScaleGestureDetector(context, new android.view.ScaleGestureDetector.OnScaleGestureListener({
            onScale: (detector: android.view.ScaleGestureDetector): boolean => {
                const owner = that.get();

                owner.setScaleFactor(owner.getScaleFactor() * detector.getScaleFactor());
                return true;
            },
            onScaleBegin: () => true,
            // tslint:disable-next-line:no-empty
            onScaleEnd: () => { }
        }));

        this._orientationChangeListener = new OrientationListener(context, that);
        this._orientationChangeListener.enable();

        return __native(this);
    }

    public setImageBitmap(image: android.graphics.Bitmap) {
        this._image = image;

        this.reset();
    }

    public onTouchEvent(event: android.view.MotionEvent): boolean {
        switch (event.getActionMasked()) {
            case android.view.MotionEvent.ACTION_DOWN:
                this._mode = MODE_DRAG;

                // We assign the current X and Y coordinate of the finger to startX and startY minus the previously translated
                // amount for each coordinates This works even when we are translating the first time because the initial
                // values for these two variables is zero.
                this._startX = event.getX();
                this._startY = event.getY();
                break;

            case android.view.MotionEvent.ACTION_MOVE:
                const scaleFactor = this.getScaleFactor();
                let translateX = this._startX - event.getX();
                let translateY = this._startY - event.getY();
                const totalTranslateX = this.getTotalTranslateX();
                const totalTranslateY = this.getTotalTranslateY();
                const height = this.getHeight();
                const width = this.getWidth();
                const imageHeight = this._image.getHeight();
                const imageWidth = this._image.getWidth();
                let canScroll = false;

                if (Math.max(0, (width - (imageWidth * scaleFactor)) / 2) !== 0) { // Not scaled large enough, we automatically center it in onDraw
                    translateX = 0;
                    canScroll = true;
                }
                else if (totalTranslateX + translateX < 0) { // outside left bounds
                    translateX = -totalTranslateX;
                    canScroll = true;
                }
                else if (totalTranslateX + translateX + width > imageWidth * scaleFactor) { // Outside right bounds
                    translateX = (imageWidth * scaleFactor) - width - totalTranslateX;
                    canScroll = true;
                }

                if (this._onCanScrollChangeListener) {
                    this._onCanScrollChangeListener.onCanScrollChanged(canScroll);
                }

                if (Math.max(0, (height - (imageHeight * scaleFactor)) / 2) !== 0) { // Not scaled large enough, we automatically center it in onDraw
                    translateY = 0;
                }
                else if (totalTranslateY + translateY < 0) { // outside lower bounds
                    translateY = -totalTranslateY;
                }
                else if (totalTranslateY + translateY + height > imageHeight * scaleFactor) { // Outside upper bounds
                    translateY = (imageHeight * scaleFactor) - height - totalTranslateY;
                }

                if (translateX !== 0 || translateY !== 0) {
                    this._dragged = true;
                }

                this.setTranslateX(translateX);
                this.setTranslateY(translateY);

                break;

            case android.view.MotionEvent.ACTION_POINTER_DOWN:
                this._mode = MODE_ZOOM;
                break;

            case android.view.MotionEvent.ACTION_UP:
                this._mode = MODE_NONE;
                this._dragged = false;

                // All fingers went up, so let's save the value of translateX and translateY into previousTranslateX and
                // previousTranslate
                this.setTotalTranslateX(this.getTotalTranslateX() + this.getTranslateX());
                this.setTotalTranslateY(this.getTotalTranslateY() + this.getTranslateY());
                this.setTranslateX(0);
                this.setTranslateY(0);
                break;

            case android.view.MotionEvent.ACTION_POINTER_UP:
                this._mode = MODE_DRAG;

                // This is not strictly necessary; we save the value of translateX and translateY into previousTranslateX
                // and previousTranslateY when the second finger goes up
                this.setTotalTranslateX(this.getTotalTranslateX() + this.getTranslateX());
                this.setTotalTranslateY(this.getTotalTranslateY() + this.getTranslateY());
                this.setTranslateX(0);
                this.setTranslateY(0);
                break;
        }

        this._detector.onTouchEvent(event);
        if ((this._mode === MODE_DRAG && this._dragged)
            || this._mode === MODE_ZOOM) {
            this.invalidate();
        }

        return true;
    }

    public onDraw(canvas: android.graphics.Canvas) {
        canvas.save();

        const scaleFactor = this.getScaleFactor();

        // We're going to scale the X and Y coordinates by the same amount
        canvas.scale(scaleFactor, scaleFactor);
        canvas.translate(-(this.getTotalTranslateX() + this.getTranslateX()) / scaleFactor, -(this.getTotalTranslateY() + this.getTranslateY()) / scaleFactor);

        if (this._image) {
            canvas.drawBitmap(this._image, Math.max(0, (this.getWidth() - (this._image.getWidth() * scaleFactor)) / 2) / scaleFactor, Math.max(0, (this.getHeight() - (this._image.getHeight() * scaleFactor)) / 2) / scaleFactor, new android.graphics.Paint());
        }
        canvas.restore();
    }

    public setOnCanScrollChangeListener(listener: OnCanScrollChangeListenerImplementation) {
        this._onCanScrollChangeListener = listener;
    }

    public setMinScaleFactor(scaleFactor: number) {
        this._minScaleFactor[0] = scaleFactor;
    }
    public getMinScaleFactor(): number {
        return this._minScaleFactor[0];
    }

    public setScaleFactor(scaleFactor: number) {
        this._scaleFactor[0] = Math.max(this.getMinScaleFactor(), scaleFactor);
    }
    public getScaleFactor(): number {
        return this._scaleFactor[0];
    }

    public setTranslateX(translate: number) {
        this._translateX[0] = translate;
    }
    public getTranslateX(): number {
        return this._translateX[0];
    }

    public setTranslateY(translate: number) {
        this._translateY[0] = translate;
    }
    public getTranslateY(): number {
        return this._translateY[0];
    }

    public setTotalTranslateX(translate: number) {
        this._totalTranslateX[0] = translate;
    }
    public getTotalTranslateX(): number {
        return this._totalTranslateX[0];
    }

    public setTotalTranslateY(translate: number) {
        this._totalTranslateY[0] = translate;
    }
    public getTotalTranslateY(): number {
        return this._totalTranslateY[0];
    }

    public reset(isDelayIn?: boolean) {
        setTimeout(() => {
            if (this && this._image) {
                try {
                    this.setTotalTranslateX(0);
                    this.setTotalTranslateY(0);
                    this.setTranslateX(0);
                    this.setTranslateY(0);
                    this.setMinScaleFactor(Math.min(this.getHeight() / this._image.getHeight(), this.getWidth() / this._image.getWidth()));
                    this.setScaleFactor(this.getMinScaleFactor());
                    this.invalidate();
                }
                catch (e) {
                    // Do nothing
                }
            }
        }, (isDelayIn ? 750 : 10));
    }
}

class OrientationListener extends android.view.OrientationEventListener {
    private _zoomImageView: WeakRef<ZoomImageView>;

    constructor(context: android.content.Context, zoomImageView: WeakRef<ZoomImageView>) {
        super(context);

        this._zoomImageView = zoomImageView;

        return __native(this);
    }

    public onOrientationChanged(orientation: number) {
        this._zoomImageView.get().reset(true);
    }
}

interface OnCanScrollChangeListenerImplementation {
    onCanScrollChanged(canScroll: boolean): void;
}

class OnCanScrollChangeListener extends java.lang.Object implements OnCanScrollChangeListenerImplementation {
    private _implementation: OnCanScrollChangeListenerImplementation;

    constructor(implementation: OnCanScrollChangeListenerImplementation) {
        super();

        this._implementation = implementation;

        return __native(this);
    }

    public onCanScrollChanged(canScroll: boolean) {
        this._implementation.onCanScrollChanged(canScroll);
    }
}