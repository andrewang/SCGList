import { Node } from "cc";

export default interface IListController
{
    operCount:number;
    // 获得item数量
    getItemCount():number;
    // addItem
    addItemCount():void;
    // reduceItem
    reduceItemCount():void;

    hide():void;
    
    show(parent:Node):void;
}