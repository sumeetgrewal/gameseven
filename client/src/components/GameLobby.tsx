import React, { useEffect, useState } from 'react';
import BoardSelector from './BoardSelector';

interface GameLobbyProps {
  setGameDisconnected: () => Promise<void>,
}

function GameLobby(props: GameLobbyProps) {
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState();
  const [loading, setLoading] = useState(true);
  const [listening, setListening] = useState(false);

  useEffect( () => {
    if (!listening) {
      const source = new EventSource('/game/setup');

      source.addEventListener('joined', function(event: any) {
        const parsedData = JSON.parse(event.data);
        console.log('joined');
        console.log(parsedData);
        setPlayers(parsedData.players);
        setGameStatus(parsedData.gameStatus);
        setLoading(false);
      });

      source.addEventListener('playerupdate', function(event: any) {
        const parsedData = JSON.parse(event.data);
        console.log('playerupdate');
        console.log(parsedData);
        setPlayers(parsedData.players);
      });

      source.addEventListener('gameupdate', function(event: any) {
        const parsedData = JSON.parse(event.data);
        console.log('gameupdate');
        console.log(parsedData);
        setGameStatus(parsedData.metadata.gameStatus);
      });

      source.addEventListener('error', function(error: any) {
        console.log(error);
      });

      setListening(true);
    }
  }, [listening, players]);

  const exitGame = async () => {
    try {
      let response = await fetch('/game/setup', {
        credentials: 'include',
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      let result = await response.json();
      if (response.status !== 200) {
        throw new Error(result.message);
      } else {
        console.log(result);
        props.setGameDisconnected();
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ready'
        })
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

  const startGame = () => {
    // TODO listener
    console.log("Starting Game");
    // setGameStarted(true);
  }

  const renderPlayers = () => {
    const playersList = Object.keys(players).map((player: any, index: number) => {
      return (
        <div className="col-6 col-md-4" key={index}>
          <div className="mx-1 player-box" key={index}>
            {player}
          </div>
        </div>
      )
    });

    return (
      <> 
        <h4 className="my-4 font-weight-bold text-center">PLAYERS</h4>
        <div className="container">
          <div className="row">
            {playersList}
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <div className="container d-flex align-items-center justify-content-center full-height">
        <h3 className="text-white">Connecting to game...</h3>
      </div>
    );
  } else {
    return (
      <div className="container d-flex align-items-center justify-content-center full-height">
        {gameStatus === 'lobby' ? 
          <div className="row">
            <div className="col-12 dialog"> 
              {renderPlayers()}
            </div>
            <div className="col-12 d-flex justify-content-center">
              <button className="btn join-btn" onClick={() => exitGame()}>EXIT</button> 
              <button className="btn join-btn" onClick={() => setReady()} autoFocus={true}>I'M READY</button> 
            </div>
          </div>
        :
          <BoardSelector 
            players={players}
          />
        }
      </div>
    );
  }
}

export default GameLobby;
