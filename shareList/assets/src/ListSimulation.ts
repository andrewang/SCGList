
import { _decorator, Component, Node } from 'cc';
import { SCGList } from './scglist/SCGList';
const { ccclass, property } = _decorator;

 
@ccclass('ListSimulation')
export class ListSimulation extends Component 
{
    private _allDatas:Array<any> = [];
    private _list:SCGList;

    private _count:number = 40;

    start()
    {
        const listNode = this.node.getChildByName('ScrollView');
        this._list = listNode.getComponent(SCGList);
        for (let index = 0; index < this._count; index++) 
        {
            this._allDatas.push({});    
        }
        this._list.setListData(this._allDatas);
    }
}


