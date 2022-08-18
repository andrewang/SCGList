
import { _decorator, Component, Node, director } from 'cc';
const { ccclass, property } = _decorator;
 
@ccclass('SimulationScene')
export class SimulationScene extends Component {
    clickBackBtn()
    {
        director.loadScene('startScene.scene');
    }
}


