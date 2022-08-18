
import { _decorator, Component, Node } from 'cc';
import IListController from './IListController';
import { SCGList } from './scglist/SCGList';
const { ccclass, property } = _decorator;

 
@ccclass('VirtualList')
export class VirtualList extends Component implements IListController {
    
    public operCount:number = 5;
    private initCount:number = 140;

    private _list:SCGList;

    private _allDatas:Array<any> = [];

    onLoad()
    {
        const listNode = this.node.getChildByName('scroll');
        this._list = listNode.getComponent(SCGList);
        for (let index = 0; index < this.initCount; index++) {
            this._allDatas.push({});
        }
    }

    start () {
        this._list.setListData(this._allDatas);
    }

    // 获得item数量
    getItemCount():number
    {
        let count = this._list.getData() ? this._list.getData().length : this.initCount;
        return count;
    }
    // addItem
    addItemCount():void
    {
        const arr = [];
        for (let index = 0; index < this.operCount; index++) {
            arr.push({});
        }
        this._list.appendMoreData(arr);
    }

    // reduceItem
    reduceItemCount():void
    {

    }

    hide():void
    {
        this.node.active = false;
    }
    
    show(parent):void
    {
        this.node.parent = parent;
        this.node.active = true;
    }
}

