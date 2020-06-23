import * as React from 'react';
import JoinGame from './components/JoinGame';
import GameLobby from './components/GameLobby';
import Game from './components/Game';


interface MyState {
  gameStatus: string,
  username: string,
} 

interface MyProps {

}
class App extends React.Component<MyProps, MyState> {
  constructor(props: MyProps) {
    super(props);
    this.state = {
        gameStatus: "join", // join / lobby / boardSelection / game
        username: ""
    }
    this.setGameStatus = this.setGameStatus.bind(this);
    this.setUsername = this.setUsername.bind(this);
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

  renderGameStage() {
    const {gameStatus, username} = this.state;
    if (gameStatus === "join") return (
      <JoinGame setGameStatus={this.setGameStatus} />
    ); 
    else if (gameStatus === "lobby" || gameStatus === "boardSelection") return (
      <GameLobby 
        gameStatus={gameStatus} setGameStatus={this.setGameStatus} 
        username={username} setUsername={this.setUsername} 
      />
    );
    else return (
      <Game />
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