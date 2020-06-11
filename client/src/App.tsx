import * as React from 'react';
import JoinGame from './components/JoinGame';
import GameLobby from './components/GameLobby';
import BoardSelector from './components/BoardSelector';

interface MyState {
  gameConnected: boolean,
  gameStarted: boolean
} 

interface MyProps {

}
class App extends React.Component<MyProps, MyState> {
  constructor(props: MyProps) {
    super(props);
    this.state = {
        gameConnected: false,
        gameStarted: false
    }
    this.setGameConnected = this.setGameConnected.bind(this);
    this.setGameStarted = this.setGameStarted.bind(this);
    this.setGameDisconnected = this.setGameDisconnected.bind(this);
  }

  setGameStarted(): Promise<void> {
    return new Promise((resolve) => {
      this.setState({gameStarted: true}, () => resolve());
    })
  }

  setGameConnected(): Promise<void> {
    return new Promise((resolve) => {
      this.setState({gameConnected: true}, () => resolve());
    })
  }
  setGameDisconnected(): Promise<void> {
    return new Promise((resolve) => {
      this.setState({gameConnected: false}, () => resolve());
    })
  }

  render() {
    const {gameConnected, gameStarted} = this.state;
    return (
      <div className="App">
        {!gameStarted ? 
          (!gameConnected) ? 
          <JoinGame 
            gameConnected={gameConnected}
            setGameConnected={this.setGameConnected}
          />
          : 
          <GameLobby
            setGameDisconnected={this.setGameDisconnected}
            setGameStarted={this.setGameStarted}
          />
        :
        <>
          <BoardSelector />
        </>}

      </div>
    );
  } 
}

export default App;
