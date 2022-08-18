
import { _decorator, Component, Node, Label, UITransform, Sprite, Color } from 'cc';
import { SCGBaseListItem } from './scglist/SCGBaseListItem';
const { ccclass, property } = _decorator;
 
@ccclass('ListfixItem')
export class ListfixItem extends SCGBaseListItem 
{
    private _titleLabel:Label;
    private _bg:Node;

    onLoad()
    {
        super.onLoad();
        this._bg = this.node.getChildByName('_bg');
        this.initComponet();
    }

    private initComponet()
    {
        const node = this.node.getChildByName('_title');
        this._titleLabel = node.getComponent(Label);
    }

    public render(isFullRender: boolean = true) {
        super.render(isFullRender);
        if (!this._titleLabel) {
            this.initComponet();
        }
        if (this._data) 
        {
            this._titleLabel.string = this.itemIndex.toString();
        }
    }
    
    public select()
    {
        const sp = this._bg.getComponent(Sprite);
        sp.color = Color.RED;
        this.scheduleOnce(()=>{
            sp.color = new Color().fromHEX('#ACACACA4');
        },0.05);
    }
}

