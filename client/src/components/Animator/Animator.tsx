import React, { useState } from 'react';
import { GameMetadata, GameScore, PlayerData } from '../GameAssets';
import AgeTransition from './AgeTransition';
import MilitaryAnimation from './MilitaryAnimation';
import GameResults from './GameResults';
import Button from 'react-bootstrap/esm/Button';

interface AnimatorProps {  
    metadata: GameMetadata,
    myData: PlayerData, 
    playerData: {
        [username: string]: PlayerData,
    }
    ageTransition: boolean,
    militaryAnimation: number,
    gameResults: boolean,
    setAgeTransition: (ageTransition: boolean) => Promise<void>,
    setMilitaryAnimation: (age: number) => void,
    setGameResults: (gameResults: boolean) => void,
}

export default function Animator (props: AnimatorProps) {  
    const [resultsViewed, setViewed] = useState(false);
        
    const handleAnimations = () => {
        const allPlayerData = {...props.playerData}
        allPlayerData[props.myData.username] = props.myData;

        if (props.militaryAnimation > 0) {
            // Unmounted by child component
            if ((props.metadata.playerOrder.length > 2)) {
                return <MilitaryAnimation 
                    age={props.militaryAnimation}
                    metadata={props.metadata} 
                    militaryData={allPlayerData}
                    setMilitaryAnimation={props.setMilitaryAnimation}
                />
            } else {
                props.setMilitaryAnimation(0);
            }
            
        } else if (props.ageTransition) {
            setTimeout(() => props.setAgeTransition(false), 4000);
            // Age Transition is automatically unmounted after 4 seconds
            return <AgeTransition age={props.metadata.age} />;

        } else if (props.gameResults) {
            let results: {[index: string]: GameScore} = {};
            Object.entries(allPlayerData).forEach((player: [string, PlayerData]) => {
              results[player[0]] = player[1].score;
            })
            // Unmounted by view board && replay buttons
            return <GameResults 
                results={results} 
                resultsViewed={resultsViewed} 
                setViewed={setViewed}
            />
        }
    }

    const replayButtons = () => {
        
        const exitButton = (
            <Button variant="light" className="action-btn w-40 p-3 mx-3" onClick={() => props.setGameResults(false)} value="exit" key="exit">
                VIEW BOARDS
            </Button>
        )
        
        // Replay button -> Reset to lobby somehow
        const replayButton = (
            <Button variant="light" className="action-btn w-40 p-3 mx-3" onClick={() => console.log("replay")} value="replay" key="replay">
                REPLAY
            </Button>
        )
        
        if (resultsViewed && props.gameResults) {
            return (
                <div className="options-wrapper centered-flex">
                    {exitButton}
                    {replayButton}
                </div>
            )
        } else return (<> </>);
    }

    return (
        <div className="animator">
            {handleAnimations()}
            {replayButtons()}
        </div>
    )
}
