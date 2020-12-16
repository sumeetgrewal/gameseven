import React, { useEffect } from 'react';
import BoardSelector from './BoardSelector';

interface GameLobbyProps {
  gameStatus: string,
  username: string,
  players: any,
  isListening: boolean,
  isLoading: boolean,
  boards: Array<string>,
  assignedBoards: Array<string>,
  playerOrder: Array<string>,
  turnToChoose: number,
  setGameStatus: (gameStatus: string) => Promise<void>,
  setListening: (isListening: boolean) => Promise<void>,
  registerSSE: () => Promise<void>,
}

export default function GameLobby (props: GameLobbyProps) {

  useEffect(() => {
    if (!props.isListening) {
      props.registerSSE();
    }
  }, [props])

  const exitGame = async () => {
    try {
      let response = await fetch('/game/connect', {
        credentials: 'include',
        method: 'DELETE', 
        headers: { 'Content-Type': 'application/json' }
      });
      let result = await response.json();
      if (response.status !== 200) {
        throw new Error(result.message);
      } else {
        console.log(result);
        props.setGameStatus("join");
        props.setListening(false);
      }
    } catch (err) {
      console.log(err);
    }
  }

  const setReady = async () => {
    try {
      let response = await fetch('/game/setup', {
        credentials: 'include', 
        method: 'PUT', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status: "ready"})
      });
      let result = await response.json();
      if (response.status !== 200) {
        throw new Error(result.message);
      } else {
        console.log(result);
      }
    } catch (err) {
      console.log(err);
    }
  }

  const renderPlayers = () => {
    let players = props.players;
    const playersList = Object.keys(players).map((player: any, index: number) => {
      const status = players[player]["status"];
      const customClass = "mx-1 player-box " + ((status==="ready") ? "player-ready" : "" )
      return (
        <div className="col-6 col-md-4" key={index}>
          <div className={customClass} key={index}>
            {player}
          </div>
        </div>
      )
    })
    return (
      <>
        <h4 className="my-4 font-weight-bold text-center">PLAYERS</h4>
        <div className="container">
          <div className="row">
            {playersList}
          </div>
        </div>
      </>
    )
  }

  if (props.isLoading) {
    return (
      <div className="container d-flex align-items-center justify-content-center full-height">
        <h3 className="text-white">Connecting to game...</h3>
      </div>
    )
  } else {
    return (
      <div className="container d-flex align-items-center justify-content-center full-height">
        {props.gameStatus === 'lobby' ? 
          <div className="row">
            <div className="col-12 dialog"> 
              {renderPlayers()}
            </div>
            <div className="col-12 d-flex justify-content-center">
              <button className="btn join-btn" onClick={exitGame}>EXIT</button> 
              <button className="btn join-btn" onClick={setReady} autoFocus={true}>I'M READY</button> 
            </div>
          </div>
        :
          <BoardSelector 
            assignedBoards={props.assignedBoards}
            boards={props.boards}
            players={props.players}
            playerOrder={props.playerOrder}
            username={props.username}
            turnToChoose={props.turnToChoose}
          />
        }
      </div>
    );
  }
}
