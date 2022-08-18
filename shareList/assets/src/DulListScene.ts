
import { _decorator, Component, Node, director } from 'cc';
const { ccclass, property } = _decorator;
 
@ccclass('DulListScene')
export class DulListScene extends Component {
    clickBackBtn()
    {
        director.loadScene('startScene.scene');
    }
}


