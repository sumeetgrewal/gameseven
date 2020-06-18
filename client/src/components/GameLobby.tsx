import React from 'react';
import BoardSelector from './BoardSelector';

interface GameLobbyProps {
  setGameDisconnected: () => Promise<void>,
}

interface GameLobbyState {
  players: Array<any>,
  gameStarted: boolean,
}

class GameLobby extends React.Component<GameLobbyProps, GameLobbyState> {
  constructor(props: GameLobbyProps) {
    super(props);
    this.state = {
      players: ["Sumeet", "Rishav", "Viniel", "PLAYER 4", "PLAYER WITH LONG NAME", "player 6", "Player 7"],
      gameStarted: false,
    }
  }

  componentDidMount() {
    // TODO request current players from server and update players state 
    console.log("Getting Players");
    fetch("/game/join", {
        method: 'GET',
      })
      .then((res: any) => res.json())
      .then(
        (result: any) => {
          console.log(result);
          this.setState({players: result.players});
        },
        (error: Error) => {
          console.log(error)
        }
      )
  }

  renderPlayers() {
    const players = this.state.players;
    const playersList =  players.map((player: any, index: number) => {
      return (
        <div className="col-6 col-md-4" key={index}>
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

  setReady() {
    // TODO begin game
    // PUT /game/player/ status=ready
    fetch("/game/player", {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: "ready",
        })
      })
      .then((res: any) => res.json())
      .then(
        (result: any) => console.log(result),
        (error: Error) => console.log(error)
      )
  }

  startGame() {
    // TODO listener
    console.log("Starting Game");
    this.setState({gameStarted: true});
  }

  getPlayers() {
    // TODO listener
    console.log("Updating Players");
    // this.setState({players: ??})
  }

  render() {
    return (
      <div className="container d-flex align-items-center justify-content-center full-height">
        {!this.state.gameStarted ? 
          <div className="row">
            <div className="col-12 dialog"> 
              {this.renderPlayers()}
            </div>
            <div className="col-12 d-flex justify-content-center">
              <button className="btn join-btn" onClick={() => this.props.setGameDisconnected()}>EXIT</button> 
              <button className="btn join-btn" onClick={() => this.startGame()} autoFocus={true}>I'M READY</button> 
            </div>
          </div>
        :
          <BoardSelector 
            players={this.state.players}
          />
        }
      </div>
    );
  } 
}

export default GameLobby;
