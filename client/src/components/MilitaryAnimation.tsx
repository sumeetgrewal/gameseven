import React, { useState } from 'react';
import { GameMetadata, iconImages, PlayerData } from './GameAssets';

interface MilitaryAnimationProps {
    metadata: GameMetadata,
    myData: PlayerData, 
    playerData: {
        [username: string]: PlayerData,
    }
    setMilitaryAnimation: (active: boolean) => void;
}

export default function AgeTransition (props: MilitaryAnimationProps) {
    const [left, setLeft] = useState("");
    const [right, setRight] = useState("");
    const [count, setCount] = useState(0);
    const [update, setUpdate] = useState(true);
    

    /*
    PLAYERORDER = [P0, ME, P2, P3];
    COUNT = 0; LEFT = P0; RIGHT = ME;
    COUNT = 1; LEFT = ME; RIGHT = P2;
    COUNT = 2; LEFT = P2; RIGHT = P3;
    COUNT = 3; LEFT = P3; RIGHT = "";
    UNMOUNT */
    const updateAnimation = () => {
        const playerOrder = props.metadata.playerOrder;
        if (count < playerOrder.length) {
            setCount(count + 1);
            if (left === "") {
                setLeft(playerOrder[0]);
                setRight(playerOrder[1]);
            } else {    
                let nextRight: string | undefined;
                if (right === props.myData.username) {
                    nextRight = props.myData.playerRight;
                } else if (props.playerData[right]) {
                    nextRight = props.playerData[right].playerRight;
                }
                setLeft(right);
                setRight((nextRight) ? nextRight: "");
            }
        } else {
            setUpdate(false);
            props.setMilitaryAnimation(false);
        }
    }

    const triggerUpdate = () => {
        if (update) {
            updateAnimation;
            setTimeout(triggerUpdate, 4000);
        }
    }
    setTimeout(() => { triggerUpdate }, 0)

    const renderLeftPlayer = () => {
        if (left === props.myData.username) {

        } else {

        }
        return (
            <div className="military-left">

            </div>
        )
    }

    const renderRightPlayer = () => {
        if (right === props.myData.username) {

        } else {
            
        }
        return (
            <div className="military-right">

            </div>
        )
    }

    return (
        <div className="military-animation">
            {renderLeftPlayer}
            {renderRightPlayer}
        </div>
    )

}
