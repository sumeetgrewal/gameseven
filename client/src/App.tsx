import * as React from 'react';
import JoinGame from './components/JoinGame';
import GameLobby from './components/GameLobby';

interface MyState {
  gameConnected: boolean
} 

interface MyProps {

}
class App extends React.Component<MyProps, MyState> {
  constructor(props: MyProps) {
    super(props);
    this.state = {
        gameConnected: false
    }
    this.setGameConnected = this.setGameConnected.bind(this);
    this.setGameDisconnected = this.setGameDisconnected.bind(this);
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
    const gameConnected = this.state.gameConnected;
    return (
      <div className="App">
        {(!gameConnected) ? 
          <JoinGame 
            gameConnected={gameConnected}
            setGameConnected={this.setGameConnected}
          />
          : 
          <GameLobby
            setGameDisconnected={this.setGameDisconnected}
          />
        }

      </div>
    );
  } 
}

export default App;
