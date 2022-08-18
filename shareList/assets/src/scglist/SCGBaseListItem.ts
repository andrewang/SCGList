
import { _decorator, Component, Node, Vec2, EventTouch, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SCGBaseListItem')
export class SCGBaseListItem extends Component {
    private _itemIndex: number = 0;

    private _nextItem: SCGBaseListItem = null;
    private _preItem: SCGBaseListItem = null;

    private _width: number = 0;
    private _height: number = 0;

    protected _data: any;
    protected _isActive: boolean = false;

    private _touchStart: Vec2;

    private _targets: Node[] = [];
    private _callMap: Map<string, () => void> = new Map();

    onLoad() {
        const anchor: Vec2 = this.getNodeAnchor(this.node);
        if (!anchor || anchor.y != 1) {
            console.error('node 锚点需要设置成 [0.5,1]');
        }
        this.initEvent();
    }

    private initEvent() {
        this.node.on(Node.EventType.TOUCH_START, this.touchStart, this);
        // this.node.on(Node.EventType.TOUCH_MOVE,this.touchMove,this,true);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
        this.node.on(Node.EventType.TOUCH_END, this.touchEnd, this);
    }

    private touchStart(event: EventTouch) {
        this._touchStart = event.getLocation();
    }

    private touchMove(event: EventTouch) {

    }

    public setClickTargets(target: Node, call: () => void) {
        if (this._targets.indexOf(target) == -1) {
            this._targets.push(target);
        }
        let key = this.getKey(target);
        this._callMap.set(key, call);
        this.deleteMapOther();
    }

    private deleteMapOther() {
        this._callMap.forEach((value: () => void, key: string, map: Map<string, () => void>) => {
            if (key.split("/")[1] != this.itemIndex + "") {
                this._callMap.delete(key);
            }

        })
    }

    private touchEnd(event: EventTouch) {
        if (this._touchStart) {
            if (event.getLocation().subtract(this._touchStart).lengthSqr() < 20) {
                this.clickItem(event);
            }
        }

    }

    getKey(node: Node) {
        return node.name + "/" + this.itemIndex;
    }

    protected clickItem(event?: EventTouch) {
        if (!event) return;
        // let pos = event.getLocation();
        // let arr: Node[] = [];
        // for (let child of this._targets) {
        //     if (child.active && Util.checkHit(pos, child)) 
        //     {
        //         arr.push(child);
        //     }
        // }

        // let c: Node = null;
        // for (let child of arr) {
        //     if (!c) c = child;
        //     if (child.getSiblingIndex() > c.getSiblingIndex()) {
        //         c = child;
        //     }
        // }
        // if (!c) return;
        // let call = this._callMap.get(this.getKey(c));
        // call && call();

    }

    // 设置数据
    public setData(value: any, index: number) {
        this._data = value;
        this._itemIndex = index;
    }

    // 渲染子类中调用
    public render(isFullRender: boolean = true) {
        this.node.active = true;
        this._isActive = true;
    }

    // 渲染获得高度
    public getRenderHeight(data):number
    {
        this._data = data;
        this.render(false);
        return this.itemHeight;
    }

    public get nextItem(): SCGBaseListItem {
        return this._nextItem;
    }

    public set nextItem(item: SCGBaseListItem) {
        this._nextItem = item;
    }

    public get preItem(): SCGBaseListItem {
        return this._preItem;
    }

    public set preItem(item: SCGBaseListItem) {
        this._preItem = item;
    }

    public set itemWidth(value: number) {
        this._width = value;
    }

    public set itemHeight(value: number) {
        this._height = value;
    }

    public get itemWidth(): number {
        return this._width;
    }

    public get itemHeight(): number {
        return this._height;
    }

    public get y(): number {
        return this.node.getPosition().y;
    }

    public get x(): number {
        return this.node.getPosition().x;
    }

    public get bottomY(): number {
        return this.node.getPosition().y - this.itemHeight;
    }

    public get isActive(): boolean {
        return this._isActive;
    }

    public get itemIndex(): number {
        return this._itemIndex;
    }

    public set itemIndex(value:number) {
        this._itemIndex = value;
    }

    public reset() {
        this.node.active = false;
        this._data = null;
        this._isActive = false;
    }

    public get data(): any {
        return this._data;
    }

    public getCharLen(str:string):number
    {
        const l = str.length;
        let blen = 0; 
        for(let i = 0; i < l; i++) 
        {
            if ((str.charCodeAt(i) & 0xff00) != 0) 
            {
                blen++; 
            } 
            blen++; 
        }
        return blen;
    }

    public select()
    {
        this.scheduleOnce(()=>{
            
        },0.5);
    }

    public unselect(param?:any)
    {
        
    }

    private getNodeAnchor(node):Vec2
    {
        const uiTransform = this.node.getComponent(UITransform);
        return uiTransform.anchorPoint;
    }


}

