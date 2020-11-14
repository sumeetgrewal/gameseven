import React from 'react';
import Button from 'react-bootstrap/esm/Button';
import { cardImages, iconImages, PlayerData } from './GameAssets';

interface PlayerNavProps {
    playerData: {
        [username: string]: PlayerData,
    },
    myData: PlayerData,
    isMyBoard: boolean,
    username: string,
    viewPlayerBoard: (username: string) => void;
}

export default function PlayerNav (props: PlayerNavProps) {
    
    /* TODO ------------
        Player Ready Status - game feed SSE GS-?? 
    */

    const renderHoverableTile = (player: [string, PlayerData]) => {
        const playerName = player[0];
        const selCards = player[1].cards;
        return (
            <div key={playerName} className={"player-tile hoverable-tile"}>
                <Button className="view-btn player-view" variant="outline-light" onClick={() => props.viewPlayerBoard(player[0])}>
                    VIEW
                </Button>
                <h3 className="font-weight-bold">{player[1].board ? player[1].board.SHORT_NAME : ""}</h3>
                <div> 
                    <img className="cost-icon" src={iconImages['coin.png']} alt="coin-icon" key={'coin-icon-'+playerName}/>                                
                    <p>{player[1].coins}</p>
                </div>
                <div> 
                    <img className="cost-icon" src={iconImages['shield.png']} alt="coin-icon" key={'coin-icon-'+playerName}/>                                
                    <p>{player[1].shields}</p>
                </div>
                {(selCards.length > 0) && <img className="player-nav-card" src={cardImages[selCards[selCards.length - 1] + '.png']} alt="card"/>}
                <div className="player-name">
                    <h3>{playerName.length >= 3 ? playerName.slice(0, 3) : playerName}</h3>
                </div>
            </div>
        )
    }

    const renderBackButton = () => {
        return (
            <Button className="view-btn player-view" variant="outline-light" onClick={() => props.viewPlayerBoard(props.username)}>
                BACK
            </Button>
        )
    }

    const renderMyTile = () => {
        return (
            <div key={props.username} className="player-tile">
                <div className="player-name">
                    <h3>ME</h3>
                </div>
            </div>
        )
    }

    const renderPlayerTiles = () => {
        const playerTiles: any = [];

        Object.entries(props.playerData).forEach((player: [string, PlayerData]) => {
            let playerName = player[0];
            if (playerName !== props.username) {
                playerTiles.push(renderHoverableTile(player));
            } else {
                playerTiles.push(renderBackButton());
            }
            if (props.isMyBoard && playerName === props.myData.playerLeft) {
                playerTiles.push(renderMyTile());
            }
        })
        return playerTiles;
    }
    
    return (
        <div className="player-nav">
            {renderPlayerTiles()}
        </div>
    )
}
