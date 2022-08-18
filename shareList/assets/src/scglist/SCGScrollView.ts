
import { _decorator, Component, Node, ScrollView, Vec3, math, EventTouch } from 'cc';
const { ccclass, property } = _decorator;

const quintEaseOut = (time: number) => {
    time -= 1;
    return (time * time * time * time * time + 1);
};
const EPSILON = 1e-4;
const OUT_OF_BOUNDARY_BREAKING_FACTOR = 0.010;
const ZERO = new Vec3();
/**
 * @en
 * Enum for ScrollView event type.
 *
 * @zh
 * 滚动视图事件类型
 */
 export enum EventType {
    /**
     * @en
     * The event emitted when ScrollView scroll to the top boundary of inner container.
     *
     * @zh
     * 滚动视图滚动到顶部边界事件。
     */
    SCROLL_TO_TOP = 'scroll-to-top',
    /**
     * @en
     * The event emitted when ScrollView scroll to the bottom boundary of inner container.
     *
     * @zh
     * 滚动视图滚动到底部边界事件。
     */
    SCROLL_TO_BOTTOM = 'scroll-to-bottom',
    /**
     * @en
     * The event emitted when ScrollView scroll to the left boundary of inner container.
     *
     * @zh
     * 滚动视图滚动到左边界事件。
     */
    SCROLL_TO_LEFT = 'scroll-to-left',
    /**
     * @en
     * The event emitted when ScrollView scroll to the right boundary of inner container.
     *
     * @zh
     * 滚动视图滚动到右边界事件。
     */
    SCROLL_TO_RIGHT = 'scroll-to-right',
    /**
     * @en
     * The event emitted when ScrollView scroll began.
     *
     * @zh
     * 滚动视图滚动开始时发出的事件。
     */
    SCROLL_BEGAN = 'scroll-began',
    /**
     * @en
     * The event emitted when ScrollView auto scroll ended.
     *
     * @zh
     * 滚动视图滚动结束的时候发出的事件。
     */
    SCROLL_ENDED = 'scroll-ended',
    /**
     * @en
     * The event emitted when ScrollView scroll to the top boundary of inner container and start bounce.
     *
     * @zh
     * 滚动视图滚动到顶部边界并且开始回弹时发出的事件。
     */
    BOUNCE_TOP = 'bounce-top',
    /**
     * @en
     * The event emitted when ScrollView scroll to the bottom boundary of inner container and start bounce.
     *
     * @zh
     * 滚动视图滚动到底部边界并且开始回弹时发出的事件。
     */
    BOUNCE_BOTTOM = 'bounce-bottom',
    /**
     * @en
     * The event emitted when ScrollView scroll to the left boundary of inner container and start bounce.
     *
     * @zh
     * 滚动视图滚动到左边界并且开始回弹时发出的事件。
     */
    BOUNCE_LEFT = 'bounce-left',
    /**
     * @en
     * The event emitted when ScrollView scroll to the right boundary of inner container and start bounce.
     *
     * @zh
     * 滚动视图滚动到右边界并且开始回弹时发出的事件。
     */
    BOUNCE_RIGHT = 'bounce-right',
    /**
     * @en
     * The event emitted when ScrollView is scrolling.
     *
     * @zh
     * 滚动视图正在滚动时发出的事件。
     */
    SCROLLING = 'scrolling',
    /**
     * @en
     * The event emitted when ScrollView auto scroll ended with a threshold.
     *
     * @zh
     * 滚动视图自动滚动快要结束的时候发出的事件。
     */
    SCROLL_ENG_WITH_THRESHOLD = 'scroll-ended-with-threshold',
    /**
     * @en
     * The event emitted when user release the touch.
     *
     * @zh
     * 当用户松手的时候会发出一个事件。
     */
    TOUCH_UP = 'touch-up',
}


@ccclass('SCGScrollView')
export class SCGScrollView extends ScrollView 
{

    public lateUpdate(dt:number)
    {
        if (this._autoScrolling) {
            this._processAutoScrolling(dt);
        }
    }

    protected _processAutoScrolling (dt) 
    {
        
        const isAutoScrollBrake = this._isNecessaryAutoScrollBrake();
        const brakingFactor = isAutoScrollBrake ? OUT_OF_BOUNDARY_BREAKING_FACTOR : 1;
        this._autoScrollAccumulatedTime += dt * (1 / brakingFactor);

        let percentage = Math.min(1, this._autoScrollAccumulatedTime / this._autoScrollTotalTime);
        if (this._autoScrollAttenuate) 
        {
            percentage = quintEaseOut(percentage);
        }

        const clonedAutoScrollTargetDelta = this._autoScrollTargetDelta.clone();
        clonedAutoScrollTargetDelta.multiplyScalar(percentage);
        const clonedAutoScrollStartPosition = this._autoScrollStartPosition.clone();
        clonedAutoScrollStartPosition.add(clonedAutoScrollTargetDelta);
        let reachedEnd = Math.abs(percentage - 1) <= EPSILON;

        const fireEvent = Math.abs(percentage - 1) <= this.getScrollEndedEventTiming();
        if (fireEvent && !this._isScrollEndedWithThresholdEventFired) {
            this._dispatchEvent(EventType.SCROLL_ENG_WITH_THRESHOLD);
            this._isScrollEndedWithThresholdEventFired = true;
        }

        if (this.elastic) {
            const brakeOffsetPosition = clonedAutoScrollStartPosition.clone();
            brakeOffsetPosition.subtract(this._autoScrollBrakingStartPosition);
            if (isAutoScrollBrake) {
                brakeOffsetPosition.multiplyScalar(brakingFactor);
            }
            clonedAutoScrollStartPosition.set(this._autoScrollBrakingStartPosition);
            clonedAutoScrollStartPosition.add(brakeOffsetPosition);
        } else {
            const moveDelta = clonedAutoScrollStartPosition.clone();
            moveDelta.subtract(this._getContentPosition());
            const outOfBoundary = this._getHowMuchOutOfBoundary(moveDelta);
            if (!outOfBoundary.equals(Vec3.ZERO, EPSILON)) {
                clonedAutoScrollStartPosition.add(outOfBoundary);
                reachedEnd = true;
            }
        }

        if (reachedEnd) {
            if (this._autoScrolling) {
                if (this.getScrollOffset().y <= 0) {
                    this._dispatchEvent(EventType.SCROLL_TO_TOP);
                } else if (this.getScrollOffset().y >= this.getMaxScrollOffset().y) {
                    this._dispatchEvent(EventType.SCROLL_TO_BOTTOM);
                }
                
            }
            this._autoScrolling = false;
        }

        const deltaMove = clonedAutoScrollStartPosition.clone();
        deltaMove.subtract(this._getContentPosition());
        this._clampDelta(deltaMove);
        this._moveContent(deltaMove, reachedEnd);
        this._dispatchEvent(EventType.SCROLLING);

        if (!this._autoScrolling) {
            this._isBouncing = false;
            this._scrolling = false;
            this._dispatchEvent(EventType.SCROLL_ENDED);
        }
    }

    protected _onTouchCancelled (event: EventTouch, captureListeners?: Node[]) {
        super._onTouchCancelled(event,captureListeners);
        this._dispatchEvent(EventType.TOUCH_UP);
    }

    private _getContentPosition (): Vec3 {
        if (!this._content) {
            return Vec3.ZERO.clone();
        }

        this._contentPos.set(this._content.position);
        return this._contentPos;
    }
}


