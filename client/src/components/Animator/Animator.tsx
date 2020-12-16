import React from 'react';
import { GameMetadata, GameScore, PlayerData } from '../GameAssets';
import AgeTransition from './AgeTransition';
import MilitaryAnimation from './MilitaryAnimation';
import GameResults from './GameResults';

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
        const allPlayerData = {...props.playerData}
        allPlayerData[props.myData.username] = props.myData;
        if (props.militaryAnimation > 0 && (props.metadata.playerOrder.length > 2)) {

            return (
                <MilitaryAnimation 
                    age={props.militaryAnimation}
                    metadata={props.metadata} 
                    militaryData={allPlayerData}
                    setMilitaryAnimation={props.setMilitaryAnimation}
                />
            )
        } else if (props.ageTransition) {
            setTimeout(() => props.setAgeTransition(false), 4000);
            return (<AgeTransition age={props.metadata.age} />);
        } else if (props.gameResults) {
            let results: {[index: string]: GameScore} = {};
            Object.entries(allPlayerData).forEach((player: [string, PlayerData]) => {
              results[player[0]] = player[1].score;
            })
            return <GameResults results={results}/>
        }
    }

    return (
        <div className="animator">
            {handleAnimations()}
        </div>
    )
}
