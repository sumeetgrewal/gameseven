import * as React from 'react';
import JoinGame from './components/JoinGame';
import GameLobby from './components/GameLobby';
import Game from './components/Game';


interface MyState {
  gameStatus: string,
  username: string,
  players: any,
} 

interface MyProps {

}
class App extends React.Component<MyProps, MyState> {
  constructor(props: MyProps) {
    super(props);
    this.state = {
        gameStatus: "join", // join / lobby / boardSelection / game
        username: "",
        players: [],
    }
    this.setGameStatus = this.setGameStatus.bind(this);
    this.setUsername = this.setUsername.bind(this);
    this.setPlayers = this.setPlayers.bind(this);
  }

  setGameStatus(gameStatus: string) : Promise<void> {
    return new Promise((resolve) => {
      this.setState({gameStatus}, resolve);
    })
  }

  setUsername(username: string) : Promise<void> {
    return new Promise((resolve) => {
      this.setState({username}, resolve);
    })
  }

  setPlayers(players: any) : Promise<void> {
    return new Promise((resolve) => {
      this.setState({players}, resolve);
    })
  }

  renderGameStage() {
    const {gameStatus, username, players} = this.state;
    if (gameStatus === "join") return (
      <JoinGame setGameStatus={this.setGameStatus} />
    ); 
    else if (gameStatus === "lobby" || gameStatus === "boardSelection") return (
      <GameLobby 
        gameStatus={gameStatus} setGameStatus={this.setGameStatus} 
        username={username} setUsername={this.setUsername} 
        players={players} setPlayers={this.setPlayers}
      />
    );
    else return (
      <Game username={username} setGameStatus={this.setGameStatus}
      players={players} setPlayers={this.setPlayers}
      />
    )
  }

  render() {
    return (
      <div className="App">
        {this.renderGameStage()}
      </div>
    );
  } 
}

export default App;