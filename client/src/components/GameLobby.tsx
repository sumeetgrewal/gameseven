import React from 'react';

interface GameLobbyProps {
  setGameDisconnected: () => Promise<void>,
  setGameStarted: () => Promise<void>,
}

interface GameLobbyState {
  players: Array<any>,
}

class GameLobby extends React.Component<GameLobbyProps, GameLobbyState> {
  constructor(props: GameLobbyProps) {
    super(props);
    this.state = {
      players: ["Sumeet", "Rishav", "Viniel", "PLAYER 4", "PLAYER WITH LONG NAME", "player 6", "Player 7"]
    }
  }

  componentDidUpdate() {
    // TODO request current players from server and update players state 
    console.log("Getting Players");
  }

  renderPlayers() {
    const players = this.state.players;
    const playersList =  players.map((player: any, index: number) => {
      return (
        <div className="col-6 col-md-4">
          <div className="mx-1 player-box" key={index}>
            {player}
          </div>
        </div>
      )
    })
    return (<> 
      <h4 className="my-4 font-weight-bold text-center">PLAYERS</h4>
      <div className="container">
        <div className="row">
          {playersList}
        </div>
      </div>
      </>)
  }

  startGame() {
    // TODO begin game
    console.log("Starting Game");
    this.props.setGameStarted();
  }

  render() {
    return (
      <div className="container d-flex align-items-center justify-content-center" style={{height: '100vh'}}>
        <div className="row">
          <div className="col-12 dialog"> 
              {this.renderPlayers()}
          </div>
          <div className="col-12 d-flex justify-content-center">
            <button className="btn join-btn" onClick={() => this.props.setGameDisconnected()}>CANCEL</button> 
            <button className="btn join-btn" onClick={() => this.startGame()} autoFocus={true}>START</button> 
          </div>
        </div>
      </div>
    );
  } 
}

export default GameLobby;
