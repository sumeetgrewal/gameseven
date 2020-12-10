import React from 'react';
import { GameMetadata, PlayerData } from './GameAssets';
import AgeTransition from './AgeTransition';
import MilitaryAnimation from './MilitaryAnimation';

interface AnimatorProps {  
    metadata: GameMetadata,
    myData: PlayerData, 
    playerData: {
        [username: string]: PlayerData,
    }
    ageTransition: boolean,
    militaryAnimation: number,
    gameResults: boolean,
    setAgeTransition: (ageTransition: boolean) => Promise<void>
    setMilitaryAnimation: (age: number) => void;
}

export default function Animator (props: AnimatorProps) {  
    
    const handleAnimations = () => {
        if (props.militaryAnimation > 0 && (props.metadata.playerOrder.length > 2)) {
            let militaryData = {...props.playerData};
            militaryData[props.myData.username] = props.myData;
            return (
                <MilitaryAnimation 
                    age={props.militaryAnimation}
                    metadata={props.metadata} 
                    militaryData={militaryData}
                    setMilitaryAnimation={props.setMilitaryAnimation}
                />
            )
        } else if (props.ageTransition) {
            setTimeout(() => props.setAgeTransition(false), 4000);
            return (<AgeTransition age={props.metadata.age} />);
        } else if (props.gameResults) {
            // Render Game Results
        }
    }

    return (
        <div className="animator">
            {handleAnimations()}
        </div>
    )
}
