
import { _decorator, Component, Node, find, Prefab, instantiate } from 'cc';
import IListController from './IListController';
import { ListfixItem } from './ListfixItem';
const { ccclass, property } = _decorator;

 
@ccclass('NormalList')
export class NormalList extends Component implements IListController {
    
    @property(Prefab)
    itemT:Prefab;
    
    public operCount:number = 5;

    private initCount:number = 140;

    private _content:Node;
    private _count:number = 0;

    onLoad()
    {
        this._content = find('scroll/view/content',this.node);
    }

    start () 
    {
        
        this.addItemByCount(this.initCount);
        this._count = this.initCount;
    }

    // 获得item数量
    getItemCount():number
    {
        return this._count;

        
    }
    // addItem
    addItemCount():void
    {
        
        this.addItemByCount(this.operCount);
        this._count += this.operCount;
    }

    private addItemByCount(count:number)
    {
        console.time('normallist');
        for (let index = 0; index < count; index++) 
        {
            const node:Node = instantiate(this.itemT);
            const item:ListfixItem = node.getComponent(ListfixItem);
            node.parent = this._content;
            item.setData({},this._count + 1 + index);
            item.render();   
        }
        console.timeEnd('normallist');
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

