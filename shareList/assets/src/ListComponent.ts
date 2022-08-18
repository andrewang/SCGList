
import { _decorator, Component, Node } from 'cc';
import List from './list/List';
import { ListfixItem } from './ListfixItem';
const { ccclass, property } = _decorator;

 
@ccclass('ListComponent')
export class ListComponent extends Component 
{
    private _count:number = 300;
    private _allDatas:Array<any> = [];
    private _list:List;
    onLoad()
    {
        for (let index = 0; index < this._count; index++) 
        {
            this._allDatas.push({});    
        }
        const listNode:Node = this.node.getChildByName('scroll');
        this._list = listNode.getComponent(List);
        this._list.numItems = this._allDatas.length;
    }


    renderItem(item:Node,index:number)
    {
        const listItem:ListfixItem = item.getComponent(ListfixItem);
        if (listItem) {
            listItem.setData(this._allDatas[index],index);
        }
    }
}


