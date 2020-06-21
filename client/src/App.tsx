import * as React from 'react';
import JoinGame from './components/JoinGame';
import GameLobby from './components/GameLobby';
import Game from './components/Game';


interface MyState {
  gameStatus: string,
} 

interface MyProps {

}
class App extends React.Component<MyProps, MyState> {
  constructor(props: MyProps) {
    super(props);
    this.state = {
        gameStatus: "join" // join / lobby / boardSelection / game
    }
    this.setGameStatus = this.setGameStatus.bind(this);
  }

  setGameStatus(gameStatus: string) : Promise<void> {
    return new Promise((resolve) => {
      this.setState({gameStatus}, resolve);
    })
  }

  renderGameStage() {
    const {gameStatus} = this.state;
    if (gameStatus === "join") return (
      <JoinGame setGameStatus={this.setGameStatus} />
    ); 
    else if (gameStatus === "lobby" || gameStatus === "boardSelection") return (
      <GameLobby gameStatus={gameStatus} setGameStatus={this.setGameStatus} />
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