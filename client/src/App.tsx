import * as React from 'react';
import JoinGame from './components/JoinGame';

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
  }

  render() {
    return (
      <div className="App">
          <JoinGame 
            gameConnected={this.state.gameConnected}
          />
      </div>
    );
  } 
}

export default App;
