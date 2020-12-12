import React from 'react';
import FlipCard from '../FlipCard';
import { GameMetadata, iconImages, PlayerData } from '../GameAssets';

interface MilitaryAnimationProps {
    age: number,
    metadata: GameMetadata,
    militaryData: { [username: string]: PlayerData, }
    setMilitaryAnimation: (age: number) => void;
}

interface MilitaryAnimationState {
    finished: boolean,
    left: string,
    right: string,
    count: number,
    exit: any,
    isFlipped: boolean,
    rightResult: string,
    leftResult: string,
    exitResult: string,
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
            isFlipped: false,
            rightResult: 'draw',
            leftResult: 'draw',
            exitResult: 'draw',
        }

        this.updateAnimation = this.updateAnimation.bind(this);
        this.updateResults = this.updateResults.bind(this);
    }
    
    /*
    PLAYERORDER = [P0, ME, P2, P3];
    COUNT = 0; LEFT = P0; RIGHT = ME;
    COUNT = 1; LEFT = ME; RIGHT = P2;
    COUNT = 2; LEFT = P2; RIGHT = P3;
    COUNT = 3; LEFT = P3; RIGHT = "";
    UNMOUNT 
    */

    componentDidMount() {
        setTimeout(() => {
            this.updateAnimation();
            this.interval = setInterval(() => this.updateAnimation(), 4000);
        }, 2000)
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }
    
    endAnimation() {
        this.setState({finished: true}, () => {
            setTimeout(() => this.props.setMilitaryAnimation(0), 500);
        })
    }

    updateAnimation () {
        const {count, left, right} = this.state;
        const playerOrder = this.props.metadata.playerOrder; 

        if (count === 0) {
            this.setState({count: count + 1})   
            this.updateResults();
        } else if (count > playerOrder.length - 1) {
            this.endAnimation()
        } else {
            let nextRight: string | undefined;
            if (this.props.militaryData[right]) {
                nextRight = this.props.militaryData[right].playerRight;
            }
            (!nextRight) ? this.endAnimation()
            :   this.setState({
                    exit: left,
                    left: right,
                    right: nextRight,
                    count: count + 1,
            }, () => this.updateResults());
        }
    }

    updateResults() {
        const rightPlayer = this.props.militaryData[this.state.right],
            leftPlayer = this.props.militaryData[this.state.left]
        const right = (typeof rightPlayer === "undefined") ? 0 : rightPlayer.shields,
            left = (typeof leftPlayer === "undefined") ? 0 : leftPlayer.shields;
        let rightResult: string, leftResult: string;

        if (right === left) {
            rightResult = 'draw'; leftResult = 'draw';
        } else if (right > left) {
            rightResult = 'win'; leftResult = 'lose';
        } else {
            rightResult = 'lose'; leftResult = 'win';
        }

        console.log(rightResult, leftResult);

        this.setState({rightResult, leftResult: this.state.rightResult, exitResult: this.state.leftResult});
        setTimeout(() => this.setState({leftResult}), 1000)
    }

    renderCardContent(player: PlayerData, position: string) {
        const { age } = this.props;
        const result: string = (position === 'left') ? this.state.leftResult
            : (position==='right') ? this.state.rightResult
            : (position==='exit') ? this.state.exitResult
            : 'draw';
        const imageURL = (result==='lose') ? 'lossmilitary.png'
            : (result==='draw') ? 'military.png'
            : (age===1) ? 'onemilitary.png'
            : (age===2) ? 'threemilitary.png'
            : 'fivemilitary.png'

        const frontChildren = (
            <div className="military-flip-content" key="content">
                <h3> 
                    {player.shields} 
                    <img className="flip-card-icon-small" src={iconImages['shield.png']} alt="shield-icon"/>
                </h3>
            </div>
        )
        const backChildren = (
            <img className="flip-card-icon-large" src={iconImages[imageURL]} alt="shield-icon"/>
        )

        return  <FlipCard
            isFlipped={this.state.isFlipped}
            frontChildren={frontChildren}
            backChildren={backChildren} 
            styles={`military-flip-card ${this.state.count > 1 ? "military-flip-card-reverse": ""}`}
            backStyles={(result==='win') ? 'won-military' : (result==='lose') ? 'lost-military' : ''}
        />
    }

    renderPlayerCards() {
        const result: any = Object.values(this.props.militaryData).map((player: PlayerData) => {
            const {username} = player;
            const {left, right, exit, count} = this.state;
            const position = (username===left  ? 'left' 
                : (username===right) ? 'right' 
                : (username===exit) ? 'exit' 
                : 'off')
            return (
                <div key={`${username}-military-${count}`} 
                className={`military-player-card military-${position}`}>

                    <h5 key="title" className="military-flip-title">{(player ? username : "")}</h5>
                    {this.renderCardContent(player, position)}
                </div>
            )
        })

        return result;
    }

    render() { 
        const {count, finished} = this.state;

        return (
        <div className={`military-animation ${(finished) && 'military-fade-out'}`}>
            <div  key={`military-title`} className="military-title">
                <h3 className="military-card-title">{`AGE ${this.props.age} MILITARY CONFLICT`}</h3>
            </div>
            { (count > 0) && this.renderPlayerCards() }
        </div>
        )
    }
}
