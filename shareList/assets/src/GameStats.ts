
import { _decorator, Component, Node, Label, game, sys, profiler, director, find } from 'cc';
const { ccclass, property } = _decorator;


 
@ccclass('GameStats')
export class GameStats extends Component 
{
    private _statsLabel:Label;
    private _fpsLabel:Label;
    private _curFpsLabel:Label;
    private _countLabel:Label;

    onLoad()
    {
        const node:Node = find('Node/_stats',this.node);
        this._statsLabel = node.getComponent(Label);

        const fpsNode:Node = find('Node/_fps',this.node);
        this._fpsLabel = fpsNode.getComponent(Label);

        const curFpsNode:Node = find('Node/_curFps',this.node);
        this._curFpsLabel = curFpsNode.getComponent(Label);

        const countNode:Node = find('Node/_count',this.node);
        this._countLabel = countNode.getComponent(Label);

    }

    start () {
        this._fpsLabel.string = `FPS:${game.frameRate}`
    }

    update (deltaTime: number) {
        this._curFpsLabel.string = `>> ${director.root.fps}`;
        this._statsLabel.string = `DrawCall:${director.root.device.numDrawCalls}`;
    }

    public updateItemCount(count:number)
    {
        this._countLabel.string = 'count:'+count.toString();
    }
}

