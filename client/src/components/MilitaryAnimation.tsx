import React from 'react';
import { GameMetadata, iconImages, PlayerData } from './GameAssets';

interface MilitaryAnimationProps {
    metadata: GameMetadata,
    militaryData: { [username: string]: PlayerData, }
    setMilitaryAnimation: (active: boolean) => void;
}

interface MilitaryAnimationState {
    finished: boolean,
    left: string,
    right: string,
    count: number,
    exit: any,
}
export default class MilitaryAnimation extends React.Component<MilitaryAnimationProps, MilitaryAnimationState> {
    interval: any;

    constructor(props: MilitaryAnimationProps) {
        super(props);

        this.state = {
            finished: false,
            left: this.props.metadata.playerOrder[0],
            right: this.props.metadata.playerOrder[1],
            count: 0,
            exit: 0,
        }

        this.updateAnimation = this.updateAnimation.bind(this);
    }
    
    /*
    PLAYERORDER = [P0, ME, P2, P3];
    COUNT = 0; LEFT = P0; RIGHT = ME;
    COUNT = 1; LEFT = ME; RIGHT = P2;
    COUNT = 2; LEFT = P2; RIGHT = P3;
    COUNT = 3; LEFT = P3; RIGHT = "";
    UNMOUNT */

    componentDidMount() {
        this.interval = setInterval(() => this.updateAnimation(), 3000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }
    
    endAnimation() {
        this.setState({finished: true}, () => {
            setTimeout(() => this.props.setMilitaryAnimation(false), 500);
        })
    }

    updateAnimation () {
        const {count, left, right} = this.state;
        const playerOrder = this.props.metadata.playerOrder; 

        if (count === 0) {
            this.setState({count: count + 1})   
        } else if (count > playerOrder.length - 1) {
            this.endAnimation()
        } else {
            let nextRight: string | undefined;
            if (this.props.militaryData[right]) {
                nextRight = this.props.militaryData[right].playerRight;
            }
            (!nextRight) ? this.endAnimation() : this.setState({
                exit: left,
                left: right,
                right: nextRight,
                count: count + 1,
            })
        }
    }

    render() { 
        const {count, finished, left, right, exit} = this.state;

        return (
        <div className={`military-animation ${(finished) ? 'military-fade-out' : ''}`}>
            <div  key={`military-title`} className="military-title">
                <h3 className="military-card-title">MILITARY CONFLICT</h3>
            </div>
            {(count > 0) && Object.entries({left, right, exit}).map((value: [string, string]) => {
                const player = this.props.militaryData[value[1]];
                return (player && 
                    <div key={`${player.username}-${value[0]}-military`} className={`military-${value[0]}`}>
                        <h5 className="military-card-title">{(player ? player.username: "")}</h5>
                    </div>)
                })
            }
        </div>
        )
    }
}
