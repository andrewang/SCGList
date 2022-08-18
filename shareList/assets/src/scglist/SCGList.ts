
import { _decorator, Component, Node, Prefab, ScrollView, Vec2, v2, Size, instantiate, Enum, UITransform } from 'cc';
import { SCGBaseListItem } from './SCGBaseListItem';
import { SCGScrollView } from './SCGScrollView';

enum RefreshType {
    None = 0,
    Top,
    Buttom
}

const { ccclass, property, menu, requireComponent } = _decorator;
Enum(RefreshType)
@ccclass('SCGList')
@menu('SCGList')
@requireComponent(SCGScrollView)
export class SCGList extends Component {
    @property({
        type: Prefab,
        tooltip: 'Item模板Prefab'
    })
    public itemTemp: Prefab = null;

    @property({
        type: Node,
        tooltip: 'item显示容器'
    })
    public content: Node = null;

    @property({
        tooltip: '左侧偏移量',
    })
    public leftPand: number = 0;

    @property({
        tooltip: '顶部偏移量',
    })
    public topPand: number = 0;

    @property({
        tooltip: '是否固定宽和高',
    })
    public isFixedWH: boolean = true;

    @property({
        tooltip: '固定时宽和高或者非固定最小宽高',
        type: Vec2,
        // visible() {
        //     return this.isFixedWH;
        // }
    })
    public itemWH: Vec2 = v2();

    @property({
        tooltip: '是否是网格布局',
    })
    public isGridLayout: boolean = false;

    @property({
        tooltip: 'XY轴间隔',
        type: Vec2,
        visible() {
            return this.isGridLayout;
        }
    })
    public gapXY: Vec2 = v2();

    @property({
        tooltip: 'item之间间距',
        visible() {
            return !this.isGridLayout;
        }
    })
    public space: number = 0;

    @property({
        type: RefreshType,
        tooltip: '是否滑到顶或底部刷新',
    })
    public refreshType: RefreshType = 0;

    private _datas: Array<any> = null;
    private _childArr: Array<SCGBaseListItem> = [];
    private _isInit: boolean = false;

    private _currentTops: Array<SCGBaseListItem> = [];
    private _currentBottoms: Array<SCGBaseListItem> = [];

    protected _scroll: ScrollView;

    private _lastVec: Vec2 = v2();
    protected _contentSize: Size;

    protected _gap: number = 0;
    private _lastItemIndex: number = 0;//底部索引
    private _topItemIndex: number = 0;//顶部索引

    private _isInTop: boolean = true;//是否在顶部
    private _isInBottom: boolean = true;//是否在底部
    private _isNeedCalculate: boolean = false;//是否需要计算高

    private _refreshCB: Function;
    private _refreshTarget: any;
    private _isRefresh: boolean = false;


    public multiple: number = 2;//最大高度是最小高度的倍数 TODO后期优化
    private _newDatas:Array<any> = null;//

    onLoad() {
        this.initEvent();
        if (!this.isGridLayout ) {
            this._scroll.enabled=false;   
        }
        console.log(this._scroll.isAutoScrolling);
    }


    protected initEvent() {
        this._scroll = this.node.getComponent(ScrollView);
        this._scroll.cancelInnerEvents = false;
        this.node.on('scrolling', this.scrollListing, this);

        this.node.on('scroll-to-top', this.scroll_To_Top, this);
        this.node.on('scroll-to-bottom', this.scroll_To_Bottom, this);
        this.node.on('touch-up', this.scroll_touch_up, this);

    }

    private scroll_To_Top() {
        this._isInTop = true;
        this._isInBottom = false;
    }

    private scroll_To_Bottom() {
        this._isInTop = false;
        this._isInBottom = true;
    }

    protected scroll_touch_up() {
        if (this._isRefresh) {
            if (this.refreshType != RefreshType.None) 
            {
                this._refreshCB && this._refreshCB.call(this._refreshTarget, false);
            }
        }
        this._isRefresh = false;
    }

    protected scrollListing() {
        const offset: Vec2 = this._scroll.getScrollOffset();
        const dis: number = Math.abs(this._lastVec.y - offset.y);
        if (this._lastVec.y > offset.y) {
            this.scrollToBottoming(offset, dis);
        }
        else if (this._lastVec.y < offset.y) {
            this.scrollToToping(offset, dis);
        }
        this._lastVec = offset;
        this.refreshEvent();
        this.calcueLimit(offset);
    }

    private calcueLimit(offset) {
        if (offset.y > 0 && offset.y < this._scroll.getMaxScrollOffset().y) {
            this._isInTop = false;
            this._isInBottom = false;
        } 
    }

    private refreshEvent() {
        if (!this._scroll.isAutoScrolling()) {
            if (!this._isRefresh && this._scroll.getScrollOffset().y - this._scroll.getMaxScrollOffset().y > 60) {
                this._isRefresh = true;
                if (this.refreshType != RefreshType.None) {
                    this._refreshCB && this._refreshCB.call(this._refreshTarget, true);
                }
            }
        }

    }

    //获取全部数据
    public getData() {
        return this._datas;
    }

    //修改数据
    public updateData(data, index: number) {
        if (index < this._datas.length) {
            this._datas[index] = data;
        }
    }

    // 添加多个数据
    public appendMoreData(arr)
    {
        if (arr) 
        {
            for (let index = 0; index < arr.length; index++) 
            {
                const element = arr[index];
                this._datas.push(element);
            }

            if (!this._isInit) 
            {
                return;
            }

            this.changeNeedCalculate(true);
            this.initChildItems(false);
            for (let index = 0; index < this._childArr.length; index++) 
            {
                const element: SCGBaseListItem = this._childArr[index];    
                element.setData(this._datas[element.itemIndex], element.itemIndex);
                if (this._datas[element.itemIndex]) 
                {
                    element.render();
                }
            }

        }
    }


    public set paddingTop(value: number) {
        this.topPand = value;
    }

    public setListData(value: Array<any>, isForce: boolean = false, isBottom: boolean = false, offset: number = 0) {
        console.time('virtuallist');
        this._datas = value;
        this._contentSize = this.getNodeContentSize(this.node);
        this.initContentSize(this._contentSize.height + offset);
        this.changeNeedCalculate(true);
        if (this._isInit) {
            this.clearAllItems();
            this.updateItemByForce(isForce);
        }
        this.initChildItems(isBottom);
    }

    // 刷新列表
    public refreshListData(value: Array<any>)
    {
        if (this._isInit) {
            this.setListData(value);
        } else {
            this._datas = value;
        }
    }

    

    // 更新单个数据
    private updateItemByForce(isForce: boolean = false) {
        // const isLayout:boolean = this._datas.length < this._childArr.length;
        for (let index = 0; index < this._childArr.length; index++) {
            const element: SCGBaseListItem = this._childArr[index];
            let isRender: boolean = false;
            if (isForce) {
                isRender = isForce;
            } else {
                isRender = element.data == this._datas[element.itemIndex] ? false : true;
            }
            element.setData(this._datas[element.itemIndex], element.itemIndex);
            if (isRender && this._datas[element.itemIndex]) {
                element.render();
            }
        }
        this.reLayoutItems();
    }


    private reLayoutItems(): void {
        if (!this.isFixedWH) {
            let current = this._currentTops[0];
            let lastCurrent = null;
            while (current && current.isActive) {
                if (current.nextItem) {
                    current.nextItem.node.setPosition(current.x, current.y - current.itemHeight - this._gap);
                }
                if (!current.nextItem) {
                    lastCurrent = current;
                }
                current = current.nextItem;
            }
        }

    }

    public appendNewData(data: any, isBottom: boolean = false) {
        if (!this._isInit) {
            if (!this._newDatas) {
                this._newDatas = [];
            }
            this._newDatas.push(data);
            return;
        }
        
        this.scheduleOnce(() => {
            this.changeNeedCalculate(false);
            if (this._datas) 
            {
                this._datas.push(data);
            }
            const dataLen = this._datas.length;
            let preY: number = -this.topPand;
            if (dataLen <= this._childArr.length) {
                if (dataLen > 1) {
                    preY = this._childArr[dataLen - 2].bottomY - this.space;
                }
                this._childArr[dataLen - 1].setData(data, dataLen - 1);
                this._childArr[dataLen - 1].render();
                this._childArr[dataLen - 1].node.setPosition(this.leftPand, preY);

                if (-this._childArr[dataLen - 1].bottomY > this._contentSize.height) 
                {
                    this.initContentSize(-this._childArr[dataLen - 1].bottomY);
                    if (this.isBottom || isBottom) {
                        this.gotoBottomByNew(-this._childArr[dataLen - 1].bottomY - this._contentSize.height);
                    }
                }
            }
            else {
                let current = null;
                if (this._isInTop) {
                    current = this._currentBottoms[0];
                    
                } else if (this._isInBottom) {
                    current = this._currentTops[0];
                    
                } else {
                    
                    if (this._scroll.getScrollOffset().y > this._currentTops[0].itemHeight) 
                    {
                        
                        current = this._currentTops[0];
                    } else {
                        current = this._currentBottoms[0];
                    }
                }
                const sizeHeight = this.getNodeContentSize(this.content).height;
                const preIndex = current.itemIndex;
                current.setData(data, dataLen - 1);
                current.render(data);
                this.initContentSize(sizeHeight + current.itemHeight + this.space);
                current.itemIndex = preIndex;
                if (this.isBottom || isBottom) {
                    // this.scrollToBottom(0);
                    this.gotoBottomByNew(sizeHeight + current.itemHeight - this._contentSize.height + this.space);
                }
            }

        }, 0);
    }

    // 到底部
    private gotoBottomByNew(off) {
        this._scroll.scrollToOffset(v2(0, off),0);
        this.scrollListing();
    }

    /**
     * 滑动到顶部
     * @param time 滑动时间
     */
    public scrollToTop(time: number = 0) {
        this.stopScroll();
        if (time < 0) {
            time = 0;
        }
        this.scheduleOnce(() => {
            this._scroll.scrollToTop(time);
            if (time == 0) {
                this.scrollListing();
            }
        }, 0);

    }

    public stopScroll() {
        this._scroll.stopAutoScroll();
    }

    /**
     * 滑动到底部
     * @param time 滑动时间
     */
    public scrollToBottom(time: number = 0) {
        if (time < 0) {
            time = 0;
        }
        this.scheduleOnce(() => {
            this._scroll.scrollToBottom(time);
            if (time == 0) {
                this.scrollListing();
            }
        }, 0);
    }

    /**
     * scrollTo
     */
    public scrollTo(v: Vec2, time: number) {
        this._scroll.scrollToOffset(v, time);
    }

    // 滑动列表是否在顶部
    public get isTop(): boolean {
        return this._isInTop;
    }

    // 滑动列表是否在底部
    public get isBottom(): boolean {
        return this._isInBottom;
    }

    public resetAndLock() {
        this._scroll.horizontal = false;
        this._scroll.vertical = false;
    }

    public unLock() {
        this._scroll.vertical = true;
    }

    public setRefreshCB(cb: Function, target: any) {
        this._refreshCB = cb;
        this._refreshTarget = target;
    }

    // 是否全部填充
    public isFullFill(): boolean {
        let dataLen = this._datas.length;
        if (dataLen <= this._childArr.length) {
            if (this._childArr[dataLen - 1]) {
                return -this._childArr[dataLen - 1].bottomY > this._contentSize.height;
            }
            return false;
        }
        return true;
    }

    public getTopItem(): SCGBaseListItem {
        return this._currentTops[0];
    }

    getScrollOffsetY():number
    {
        return this._scroll.getScrollOffset().y;
    }

    private changeNeedCalculate(value: boolean) {
        if (!this.isFixedWH) {
            this._isNeedCalculate = value;
        }
    }

    private initChildItems(isBottom:boolean) {
        if (!this._isInit) {
            this.initChildByType(isBottom);
        } else {
            let count: number = 1;
            if (this.isGridLayout) {
                count = Math.floor(this._contentSize.width / this.itemWH.x);
                this.updateContentSize(count);
            } else {
                this.updateContentSizeByLine();
            }
        }
    }

    private initChildByType(isBottom:boolean) {
        if (this.isGridLayout) {
            this.initByGrid(isBottom);
        } else {
            this.initByLine(isBottom);
        }
    }

    private initByGrid(isBottom:boolean) {
        this._gap = this.gapXY.y;
        if (this.isFixedWH) {
            const hCount = Math.floor(this._contentSize.width / this.itemWH.x);//水平数量
            const vCount = Math.ceil(this._contentSize.height / this.itemWH.y);//垂直数量
            const total = hCount * (vCount + 1);
            const halfW: number = this.itemWH.x * 0.5;
            let tempArr: Array<SCGBaseListItem> = [];
            // TODO 按数据创建
            this.nextFrame(total,(index)=>{
                const node: Node = instantiate(this.itemTemp);
                const lineNum: number = Math.floor(index / hCount);
                const vNum: number = Math.floor(index % hCount);
                node.setPosition(vNum * (this.itemWH.x + this.gapXY.x) + this.leftPand - halfW - this.gapXY.x * 0.5, -lineNum * (this.itemWH.y + this.gapXY.y) - this.topPand);
                const item: SCGBaseListItem = node.getComponent(SCGBaseListItem);
                item.itemWidth = this.itemWH.x;
                item.itemHeight = this.itemWH.y;
                item.setData(this._datas[index], index);
                if (lineNum == 0) {
                    this._currentTops.push(item);
                    tempArr.push(item);
                } else {
                    tempArr[vNum].nextItem = item;
                    item.preItem = tempArr[vNum];
                    tempArr[vNum] = item;
                }

                if (this._datas[index]) {
                    item.render();
                } else {
                    item.reset();
                }

                this._childArr.push(item);
                node.parent = this.content;
                if (index >= total-1) 
                {
                    this._isInit = true;
                    let i: number = 0;
                    for (i = 0; i < hCount; i++) 
                    {
                        this._currentBottoms[i] = this._childArr[total - (hCount - i)];
                    }
                    this._lastItemIndex = this._currentBottoms[this._currentBottoms.length - 1].itemIndex;
                    this.updateContentSize(hCount);     
                }
            });
        } else {
            //TODO 后期添加

        }
    }

    // 更新容器的高度
    private updateContentSize(hCount: number) {
        let allNum: number = Math.ceil(this._datas.length / hCount);
        const height: number = allNum * (this.itemWH.y + this.gapXY.y) + this.topPand - this.gapXY.y;
        this.initContentSize(height);
    }

    private updateContentSizeByLine() {
        let height: number = 0;
        if (this.isFixedWH) {
            height = this._datas.length * (this.itemWH.y + this.space) + this.topPand - this.space;
        } else {
            height = this._datas.length * (this.itemWH.y + this.space) * this.multiple + this.topPand - this.space;
        }
        this.initContentSize(height);
    }

    private initByLine(isBottom:boolean) {
        this._gap = this.space;
        const vCount = Math.ceil(this._contentSize.height / this.itemWH.y);//垂直数量
        const total = vCount + 1;
        let preY: number = -this.topPand;
        // TODO 按数据创建
        this.nextFrame(total,(index)=>{
            const node: Node = instantiate(this.itemTemp);
            node.setPosition(this.leftPand, preY);
            const item: SCGBaseListItem = node.getComponent(SCGBaseListItem);
            item.setData(this._datas[index], index);
            if (index == 0) {
                this._currentTops[0] = item;
            } else {
                this._childArr[index - 1].nextItem = item;
                item.preItem = this._childArr[index - 1];
            }
            if (this._datas[index]) {
                item.render();
            } else {
                item.reset();
            }
            if (this.isFixedWH) {
                item.itemWidth = this.itemWH.x;
                item.itemHeight = this.itemWH.y;
            }
            preY -= (item.itemHeight + this.space);

            this._childArr.push(item);
            node.parent = this.content;
            if (index >= total - 1)
            {
                console.timeEnd('virtuallist');
                this._currentBottoms[0] = this._childArr[total - 1];
                this._isInit = true;
                this._isInTop = false;
                if (isBottom) {
                    this.initItemToBottom(preY);
                } else {
                    this.updateContentSizeByLine();
                }
                if (this._scroll) {
                    this._scroll.enabled=true;    
                }
                
            }
        });
        
    }

    // 初始化直接滑到到底部
    private initItemToBottom(itemY:number)
    {
        let offsetY = Math.abs(itemY + this._contentSize.height);
        if (-itemY > this._contentSize.height) 
        {
            this.changeNodeContentSize(this.content, this._contentSize.width, this._contentSize.height + offsetY - this.space);
            this._scroll.scrollToBottom(0);
        }
        this.scheduleOnce(()=>{
            const childLen:number = this._childArr.length;
            if (this._datas.length >= childLen) 
            {
                let needCount:number = this._datas.length - childLen;
                let offset:Vec2 = null;
                for (let index = 0; index < needCount; index++) 
                {
                    let h = this._currentBottoms[0].getRenderHeight( this._datas[childLen + index] );
                    if (index < needCount - 1) {
                        h += this.space;
                    } 
                    offsetY += h;
                    offset = v2(0,offsetY);
                    this.scheduleOnce(()=>{
                        this.changeNodeContentSize(this.content, this._contentSize.width, this._contentSize.height + offsetY);
                        this._scroll.scrollToBottom(0);
                        this.scrollToToping(offset,h);
                        this._lastVec = offset;
                        if (index >= needCount - 1) {
                            this.fixBottomItemPos(this._contentSize.height + offsetY);
                        }
                    },0);   
                }
                if (needCount <= 0) 
                {
                    this.operNewData();
                }
            } else {
                this.operNewData();
                this._scroll.scrollToBottom(0.1);
            }
        },0);
        
    }

    // 修正滑动到底部item的坐标
    private fixBottomItemPos(allHeight:number)
    {
        const allItemHeght = Math.abs(this._currentBottoms[0].bottomY);
        if ( allItemHeght < allHeight) 
        {
            //重新设置坐标
            let item: SCGBaseListItem = this._currentBottoms[0];
            while (item && item.isActive) {
                if (item.preItem) {
                    item.node.setPosition(item.x,item.preItem.bottomY - this.space);
                }
                item = item.preItem;
            }            
        } else {
            this.changeNodeContentSize(this.content, this._contentSize.width, allItemHeght);
        }
        this.scheduleOnce(()=>{
            this._scroll.scrollToBottom(0.05);
            this.scheduleOnce(this.operNewData,0.05);
            // this.operNewData();
        },0);
        // console.log(this._currentBottoms[0].isActive,this._currentBottoms[0].bottomY,allHeight,'++++++++');
    }

    // 初始化期间添加新消息
    private operNewData()
    {
        if (this._newDatas && this._newDatas.length > 0) 
        {
            this.scheduleOnce(()=>{
                for (let index = 0; index < this._newDatas.length; index++) 
                {
                    const element = this._newDatas[index];
                    this.appendNewData(element,true);
                }
                this._newDatas.length = 0;
                this._newDatas = null;
            },0);
            
        }
    }
    // 往底部滑动
    private scrollToToping(offset: Vec2, dis: number) {
        if (!this._currentTops[0]) {
            return;
        }
        const cy: number = this._currentTops[0].bottomY + offset.y
        if (cy >= 0 && this._datas.length > this._lastItemIndex) {
            if (!this._currentTops[0]) {
                return;
            }
            const len = Math.ceil(dis / this.itemWH.y);
            for (let index = 0; index < len; index++) {
                this.changeItemRelation(this._currentTops, false, dis);
            }

        }
    }

    // 往顶部滑动
    private scrollToBottoming(offset: Vec2, dis: number) {

        if (!this._currentBottoms[0]) {
            return;
        }

        const cy: number = this._currentBottoms[0].y + offset.y;
        if (cy <= -this._contentSize.y && this._topItemIndex >= 0) {
            // const len = Math.ceil(dis / this._currentBottoms[0].itemHeight);
            const len = Math.ceil(dis / this.itemWH.y);
            if (!this._currentBottoms[0]) {
                return;
            }
            for (let index = 0; index < len; index++) {
                this.changeItemRelation(this._currentBottoms, true, dis);
            }
        }
    }

    private initContentSize(height: number) {
        const width = this._contentSize.width;
        this.changeNodeContentSize(this.content, width, height);
    }

    private changeContentSize() {
        const width = this._contentSize.width;

        let item: SCGBaseListItem = this._currentBottoms[0];
        while (item && !item.isActive) {
            item = item.preItem;
        }
        const height = item ? Math.abs(item.bottomY) : 0;
        this.changeNodeContentSize(this.content, width, height);
    }

    private changeItemRelation(arr: Array<SCGBaseListItem>, isToTop: boolean, dis: number) {
        // let index: number = 0;
        const len: number = arr.length;
        for (let index = 0; index < len; index++) {
            const element = arr[index];
            if (isToTop) {
                let itemIndex: number = this._currentTops[index].itemIndex - len;
                if (itemIndex >= 0) {
                    this._currentBottoms[index] = this._currentBottoms[index].preItem;
                    this._currentBottoms[index].nextItem = null;

                    element.nextItem = this._currentTops[index];
                    element.preItem = null;

                    element.setData(this._datas[itemIndex], itemIndex);
                    if (this._datas[itemIndex]) {
                        element.render(dis < this.itemWH.y * 2);
                    } else {
                        element.reset();
                    }
                    element.node.setPosition(this._currentTops[index].x, this._currentTops[index].y + element.itemHeight + this._gap);
                    this._currentTops[index].preItem = element;
                    this._currentTops[index] = element;

                }

            } else {

                let itemIndex: number = this._currentBottoms[index].itemIndex + len;
                let total = this._datas.length - 1;
                if (itemIndex > total) {
                    if (this._isNeedCalculate) {
                        this.changeContentSize();
                        this._isNeedCalculate = false;
                    }
                    if (!this.isGridLayout) {
                        return;
                    }
                }

                this._currentTops[index] = element.nextItem;
                element.nextItem = null;

                this._currentBottoms[index].nextItem = element;

                element.preItem = this._currentBottoms[index];
                element.setData(this._datas[itemIndex], itemIndex);

                if (this._datas[itemIndex]) {
                    element.render(dis < this.itemWH.y * 2);
                } else {
                    element.reset();
                }
                element.node.setPosition(this._currentBottoms[index].x, this._currentBottoms[index].bottomY - this._gap);
                this._currentBottoms[index] = element;
            }

            this._lastItemIndex = this._currentBottoms[this._currentBottoms.length - 1].itemIndex;
            this._topItemIndex = this._currentTops[0].itemIndex;
        }

    }

    private clearAllItems() {
        const len = this._childArr.length;
        for (let index = 0; index < len; index++) {
            const element = this._childArr[index];
            element.reset();
        }
    }

    private getNodeContentSize(node:Node):Size
    {
        const uiTransform:UITransform = node.getComponent(UITransform);
        return uiTransform.contentSize;
    }

    private changeNodeContentSize(node:Node,width:number,height:number)
    {
        const uiTransform:UITransform = node.getComponent(UITransform);
        uiTransform.setContentSize(width,height);
    }

}

Component.prototype.nextFrame = function(count,fun:(index)=>void)
{
    let _index:number = 0;
    this.schedule(() => {
        fun && fun(_index);
        _index++;
    }, 0, count - 1, 0);
}


