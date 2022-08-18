
import { _decorator, Component, Node, director } from 'cc';
const { ccclass, property } = _decorator;


@ccclass('StartScene')
export class StartScene extends Component 
{
    
    startCompareBtn()
    {
        director.loadScene('main.scene');
    }

    startDemoBtn()
    {
        director.loadScene('mains.scene');
    }
    
}


