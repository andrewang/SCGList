
import { _decorator, Component, Node, profiler, Profiler, Prefab, Toggle, instantiate, director } from 'cc';
import { GameStats } from './GameStats';
import IListController from './IListController';
import { NormalList } from './NormalList';
import { VirtualList } from './VirtualList';
const { ccclass, property } = _decorator;

 
@ccclass('DemoController')
export class DemoController extends Component {
    
    @property(Prefab)
    normalT:Prefab = null;

    @property(Prefab)
    virtualT:Prefab = null;

    private _normalList:IListController;
    private _virtualList:IListController;

    private _currentList:IListController;

    private _stats:GameStats;

    private _listContainer:Node;

    onLoad()
    {
        this._stats = this.node.getComponent(GameStats);
        this._listContainer = this.node.getChildByName('listContainer');

    }

    start () 
    {
        this.showNormalList();
        this.scheduleOnce(()=>{
            this._stats.updateItemCount(this._currentList.getItemCount());    
        },2);
        
    }

    // 选择模式
    private selectModel(tg:Toggle, type)
    {
        if(tg.isChecked)
        {
            if (type == 1) {
                //select normal
                this.showNormalList();
            } else {
                this.showVirtualList();
            }
        }
        this._stats.updateItemCount(this._currentList.getItemCount());
    }

    private showNormalList()
    {
        if (!this._normalList) {
            const normal = instantiate(this.normalT);
            
            this._normalList = normal.getComponent(NormalList);
            this._normalList.show(this._listContainer);
            
        } else {
            this._normalList.show(this._listContainer);
        }
        this._currentList = this._normalList;
        if (this._virtualList) {
            this._virtualList.hide();
        }
        
    }

    private showVirtualList()
    {
        if (!this._virtualList) {
            const virtual = instantiate(this.virtualT);
            this._virtualList = virtual.getComponent(VirtualList);
            this._virtualList.show(this._listContainer);
        } else {
            this._virtualList.show(this._listContainer);
        }
        this._currentList = this._virtualList;
        if (this._normalList) {
            this._normalList.hide();
        }
    }

    addItem()
    {
        if (this._currentList) {
            this._currentList.addItemCount();
            this._stats.updateItemCount(this._currentList.getItemCount());
        }
    }

    clickBackBtn()
    {
        director.loadScene('startScene.scene');
    }
}
